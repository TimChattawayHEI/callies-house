// Talking to Firebase: an anonymous sign-in, reading and writing with the REST API, and listening for
// changes with a live stream (Server-Sent Events). No Firebase library is needed.
import { NET } from './netcfg.js';

const cfg = () => (typeof window !== 'undefined' && window.__NETCFG) || NET;
export const netReady = () => { const c = cfg(); return !!(c && c.apiKey && c.databaseURL); };
const base = () => cfg().databaseURL.replace(/\/+$/, '');
const AUTH_KEY = 'callies-house-netauth';

// the last thing that went wrong, so a grown-up can see why it won't connect
let lastErr = null;
export const netError = () => lastErr;
const note = e => { lastErr = e && e.message ? e.message : String(e); };

/* ---------------- signing in (anonymously) ---------------- */
let auth = null, signing = null;
const readAuth = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { return null; } };
const writeAuth = a => { try { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); } catch (e) { /* ignore */ } };
async function post(url, body, form) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body: form ? new URLSearchParams(body).toString() : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((j.error && (j.error.message || j.error)) || 'sign-in failed'), { status: r.status });
  return j;
}
async function signIn() {
  const c = cfg(), idUrl = c.authURL || 'https://identitytoolkit.googleapis.com', tokUrl = c.tokenURL || c.authURL || 'https://securetoken.googleapis.com';
  const old = auth || readAuth();
  if (old && old.refreshToken) {
    try {
      const j = await post(`${tokUrl}/v1/token?key=${c.apiKey}`, { grant_type: 'refresh_token', refresh_token: old.refreshToken }, true);
      auth = { idToken: j.id_token, refreshToken: j.refresh_token, uid: j.user_id, exp: Date.now() + (+j.expires_in || 3600) * 1000 };
      writeAuth({ refreshToken: auth.refreshToken, uid: auth.uid }); return auth;
    } catch (e) { /* the refresh token is no good any more: sign in again */ }
  }
  const j = await post(`${idUrl}/v1/accounts:signUp?key=${c.apiKey}`, { returnSecureToken: true });
  auth = { idToken: j.idToken, refreshToken: j.refreshToken, uid: j.localId, exp: Date.now() + (+j.expiresIn || 3600) * 1000 };
  writeAuth({ refreshToken: auth.refreshToken, uid: auth.uid });
  return auth;
}
export async function token(force) {
  if (!force && auth && auth.exp - Date.now() > 5 * 60 * 1000) return auth.idToken;
  if (!signing) signing = signIn().then(a => { lastErr = null; return a; }, e => { note(Object.assign(e, { message: 'Sign-in: ' + e.message })); throw e; }).finally(() => { signing = null; });
  return (await signing).idToken;
}
export const myUid = () => (auth && auth.uid) || (readAuth() || {}).uid || null;

/* ---------------- reading and writing ---------------- */
export async function db(method, path, body) {
  for (let tries = 0; tries < 2; tries++) {
    const t = await token(tries > 0);
    // writes don't need the data sent back (that would double what is downloaded)
    const quiet = method !== 'GET' ? '&print=silent' : '';
    const r = await fetch(`${base()}/${path}.json?auth=${encodeURIComponent(t)}${quiet}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
    if (r.status === 401 && tries === 0) continue;
    if (!r.ok) { const e = Object.assign(new Error(`Database ${r.status === 401 ? 'said no (check the rules)' : 'error ' + r.status}`), { status: r.status }); note(e); throw e; }
    if (r.status === 204 || method !== 'GET') return null;
    return r.json();
  }
  return null;
}

/* ---------------- listening ---------------- */
// onEvent(kind, path, data): kind is 'put' or 'patch', path like '/e' relative to what is listened to.
// Reconnects by itself (and signs in again when the token runs out). onState(true/false) says if it is connected.
export function listen(path, onEvent, onState) {
  let es = null, closed = false, retry = 0, timer = null, refresh = null;
  const open = async force => {
    if (closed) return;
    let t; try { t = await token(force); } catch (e) { onState && onState(false); timer = setTimeout(() => open(true), Math.min(15000, 1000 * 2 ** retry++)); return; }
    if (closed) return;
    es = new EventSource(`${base()}/${path}.json?auth=${encodeURIComponent(t)}`);
    const handle = kind => ev => { retry = 0; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m) onEvent(kind, m.path, m.data); };
    es.addEventListener('open', () => { retry = 0; onState && onState(true); });
    es.addEventListener('put', handle('put'));
    es.addEventListener('patch', handle('patch'));
    es.addEventListener('keep-alive', () => { onState && onState(true); });
    const again = force => { if (es) es.close(); es = null; onState && onState(false); if (!closed) timer = setTimeout(() => open(force), Math.min(15000, 800 * 2 ** retry++)); };
    es.addEventListener('auth_revoked', () => again(true));
    es.addEventListener('cancel', () => again(true));
    es.onerror = () => { note(new Error('Lost the live connection')); if (es && es.readyState === 2) again(false); else onState && onState(false); };
    // tokens last an hour: reconnect with a fresh one before then
    clearTimeout(refresh); refresh = setTimeout(() => again(true), 45 * 60 * 1000);
  };
  open(false);
  return { close() { closed = true; clearTimeout(timer); clearTimeout(refresh); if (es) es.close(); es = null; } };
}

/* ---------------- a little tree that mirrors what was listened to ---------------- */
export function applyEvent(tree, kind, path, data) {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) {
    if (kind === 'put') return data && typeof data === 'object' ? { ...data } : {};
    return { ...(tree || {}), ...data };
  }
  const root = tree && typeof tree === 'object' ? tree : {};
  let o = root;
  for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
  const last = parts[parts.length - 1];
  if (kind === 'put') { if (data === null) delete o[last]; else o[last] = data; }
  else { if (!o[last] || typeof o[last] !== 'object') o[last] = {}; for (const [k, v] of Object.entries(data || {})) { if (v === null) delete o[last][k]; else o[last][k] = v; } }
  return root;
}

/* ---------------- room codes ---------------- */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, they look like 1 and 0
export const newCode = () => Array.from({ length: 6 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const goodCode = s => /^[A-HJ-NP-Z]{6}$/.test(s || '');
// keys in the database can't have . # $ [ ] /
export const encKey = s => String(s).replace(/[.#$[\]/%]/g, ch => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0'));
export const decKey = s => String(s).replace(/%([0-9a-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
