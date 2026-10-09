// Play together: keeping two tablets in the same world.
// The main tablet ("host") runs the world: everyone's comings and goings, the clock, the weather.
// The other tablet ("guest") shows the same world and plays one person in it.
// Each side sends what changed on its side a few times a second, as small labelled pieces ("entities"):
//   p~id   a person (where they are, what they are doing)      host sends everyone but the guest's person
//   i~id   a thing (toy, food...)                               both
//   f~k    lights, TV and so on                                 both
//   fp~id / ff~id / fm   people made, their houses, counters    both
//   ts~id / tm           shops and the town                     both
//   pp~id  where a pet is (host)   pc~id  pet food and walks (both)   pm  pet mess (both)
//   o~id outfits, tr~id personalities (both), fr friendships, sky, hol (host)
//   who    who this tablet is playing, hb  "still here"
import { db, listen, encKey, decKey } from './net.js';
import { say } from './world.js';
import { registerPerson, registerFamily, placeAtHome } from './folk.jsx';
import { registerShop } from './townbuild.jsx';
import { growTown } from './town.jsx';
import { netAdoptPet } from './pets.jsx';
import { NAMES } from './people.jsx';

const TICK = 200, HB = 2000, GONE = 9000;
const FLAGS = ['lights', 'blind', 'tv', 'livingTV', 'fire', 'fridge', 'hob', 'cooking', 'lunch'];
const HOST_ONLY = new Set(['sky', 'fr', 'hol']);
const r2 = v => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const r05 = v => Math.round((v || 0) * 20) / 20;
const pt = q => q && q.map(r2);
const otherSide = s => (s === 'h' ? 'g' : 'h');

/* ---------------- what this side says about the world ---------------- */
function personVal(N, p) {
  const v = { r: p.room || null, m: p.mode, f: p.facing, fl: p.flip ? 1 : 0, op: Math.round((p.op ?? 1) * 10) / 10, z: r2(p.z || 0), sp: r2(p.speed) };
  if (p.mode === 'walk' && p.path && p.path.length) {
    // while walking, the position is only sent when the next corner is reached
    const c = N.walk[p.id] || (N.walk[p.id] = {});
    if (c.n !== p.path.length || c.r !== p.room) { c.n = p.path.length; c.r = p.room; c.x = r2(p.x); c.y = r2(p.y); }
    v.x = c.x; v.y = c.y; v.path = p.path.map(pt);
  } else { v.x = r2(p.x); v.y = r2(p.y); if (N.walk[p.id]) delete N.walk[p.id]; }
  if (p.action) { const { t0, ...a } = p.action; v.a = { ...a, id: Math.round(t0 * 10) }; }
  if (p.mode === 'hop' && p.hop) { const { t0, ...h } = p.hop; v.h = { ...h, from: pt(h.from), to: pt(h.to), id: Math.round(t0 * 10) }; }
  if (p.seatStand) v.ss = pt(p.seatStand);
  if (p.mode === 'sit') { v.sf = p.sitFace || null; v.sfl = p.sitFlip ? 1 : 0; }
  if (p.bed) v.bed = p.bed;
  if (p.hiding) v.hid = 1;
  return v;
}
function itemVal(it) { const { packT, ...v } = it; return JSON.parse(JSON.stringify(v)); }

export function collect(W, N, side, hooks) {
  const out = {};
  const theirs = N.other.player;
  for (const p of Object.values(W.people)) {
    if (side === 'g' ? p.id !== W.player : p.id === theirs) continue;
    if (!p.room && !N.sentP[p.id]) continue;
    out['p~' + p.id] = personVal(N, p);
  }
  for (const it of W.items) out['i~' + encKey(it.id)] = itemVal(it);
  for (const k of FLAGS) out['f~' + k] = W.flags[k] ?? null;
  if (W.folk) {
    for (const [id, d] of Object.entries(W.folk.people)) out['fp~' + id] = d;
    for (const [id, f] of Object.entries(W.folk.fams)) out['ff~' + id] = f;
    out.fm = { n: W.folk.n || 0, creative: !!W.folk.creative, rels: W.folk.rels || [] };
  }
  if (W.town) {
    for (const [id, sh] of Object.entries(W.town.shops)) out['ts~' + id] = { ...sh, till: Math.floor(sh.till || 0) };
    out.tm = { n: W.town.n || 0, rows: W.town.rows || 1 };
  }
  for (const p of W.pets || []) {
    if (side === 'h') out['pp~' + p.id] = { r: p.room || null, x: r2(p.x), y: r2(p.y), fl: p.flip ? 1 : 0, w: p.walking ? 1 : 0, path: p.path ? p.path.map(pt) : null };
    out['pc~' + p.id] = { id: p.id, hunger: r05(p.hunger), walk: r05(p.walk), with: !!p.with };
  }
  if (W.pets) out.pm = { dirt: Object.fromEntries(Object.entries(W.petDirt || {}).map(([k, v]) => [k, r05(v)])), mess: W.petMess || [], stats: W.petStats || {} };
  const outfits = hooks.getOutfits ? hooks.getOutfits() : {};
  for (const [id, o] of Object.entries(outfits)) if (hooks.isCustomOutfit ? hooks.isCustomOutfit(id) : true) out['o~' + id] = o;
  for (const [id, t] of Object.entries(W.traits || {})) out['tr~' + id] = t;
  if (side === 'h') {
    out.fr = Object.fromEntries(Object.entries(W.friends || {}).map(([k, v]) => [k, Math.round(v * 2) / 2]));
    out.sky = { c: Math.round((W.clock || 0) * 10) / 10, w: W.weather ? W.weather.kind : 'sun', tp: W.timePick, wp: W.weatherPick, sp: W.seasonPick, l: W.lights || {} };
    out.hol = { hw: W.hw ? { stage: W.hw.stage, pumpkin: W.hw.pumpkin || null } : null, xm: W.xm ? { stage: W.xm.stage, tree: W.xm.tree || null } : null };
  }
  for (const [id, m] of Object.entries(W.mood || {})) out['md~' + id] = m;
  if (W.fights) out.fights = W.fights;
  if (W.news) out.news = W.news;
  out.who = { p: W.player, n: NAMES[W.player] || W.player };
  return out;
}

/* ---------------- taking in what the other side says ---------------- */
const ORDER = ['who', 'ff~', 'fp~', 'fm', 'tm', 'ts~', 'pc~', 'pp~', 'pm', 'p~', 'i~', 'f~', 'o~', 'tr~', 'fr', 'sky', 'hol'];
const rank = k => { const i = ORDER.findIndex(o => k === o || (o.endsWith('~') && k.startsWith(o))); return i < 0 ? 99 : i; };

function applyPerson(W, id, v, hostSide) {
  let p = W.people[id];
  if (!p) { if (W.folk && W.folk.people[id]) { placeAtHome(W, id); p = W.people[id]; } if (!p) return; }
  if (!v) return;
  const same = p.room === v.r;
  p.goal = null; p.then = null; p.queue = null; p.scripted = false;
  if (v.m === 'walk' && v.path) {
    if (!(same && p.mode === 'walk' && Math.hypot(p.x - v.x, p.y - v.y) < 1.2)) { p.x = v.x; p.y = v.y; p.z = v.z; }
    p.path = v.path.map(q => [q[0], q[1], q[2] ?? 0]); p.mode = 'walk';
  } else if (v.m === 'hop' && v.h) {
    if (p._hid !== v.h.id) { p.hop = { ...v.h, t0: W.T }; p._hid = v.h.id; p.mode = 'hop'; p.path = null; }
  } else {
    p.path = null; p.mode = v.m === 'walk' ? 'stand' : v.m; p.x = v.x; p.y = v.y; p.z = v.z; p.hop = null;
  }
  p.room = v.r; p.facing = v.f; p.flip = !!v.fl; p.op = v.op; if (v.sp) p.speed = v.sp;
  p.seatStand = v.ss || null; p.sitFace = v.sf || p.sitFace; p.sitFlip = !!v.sfl; p.bed = v.bed || null; p.hiding = !!v.hid;
  if (v.a) { if (p._aid !== v.a.id || !p.action) { const { id: aid, ...a } = v.a; p.action = { ...a, t0: W.T }; p._aid = aid; } }
  else if (p.action && p._aid != null) { p.action = null; p._aid = null; }
  if (hostSide) { p.netRemote = true; p.busy = 'remote'; p._net = { r: v.r, x: p.x, y: p.y, m: p.mode, path: p.path }; }
}
function applyItem(W, id, v) {
  const i = W.items.findIndex(x => x.id === id);
  if (v === null) { if (i >= 0) W.items.splice(i, 1); return; }
  if (i < 0) { W.items.push({ ...v, packT: v.loc && v.loc.s === 'pack' ? W.T : undefined }); return; }
  const it = W.items[i], wasPack = it.loc && it.loc.s === 'pack';
  for (const k of Object.keys(it)) if (!(k in v) && k !== 'packT') delete it[k];
  Object.assign(it, v);
  if (it.loc && it.loc.s === 'pack' && !wasPack) it.packT = W.T;
}

export function applyEntity(W, N, side, key, v, hooks) {
  const [kind, raw] = key.includes('~') ? [key.slice(0, key.indexOf('~') + 1), decKey(key.slice(key.indexOf('~') + 1))] : [key, null];
  // the host is in charge of some things; the guest only speaks for its own person
  if (side === 'h' && (HOST_ONLY.has(key) || kind === 'pp~')) return;
  if (kind === 'p~') {
    if (side === 'h' && raw !== N.other.player) return;
    if (side === 'g' && raw === W.player) return;
    applyPerson(W, raw, v, side === 'h'); return;
  }
  switch (kind) {
    case 'who': {
      const was = N.other.player, wasName = N.other.name; N.other.player = v ? v.p : null; N.other.name = v ? v.n : null;
      if (side === 'h' && was && was !== N.other.player) release(W, was);
      if (was !== N.other.player || wasName !== N.other.name) hooks.onOther && hooks.onOther({ ...N.other });
      return;
    }
    case 'i~': applyItem(W, raw, v); return;
    case 'f~': W.flags[raw] = v; return;
    case 'ff~': if (v) { W.folk.fams[raw] = v; registerFamily(v); N.grew = true; } return;
    case 'fp~': if (v) { W.folk.people[raw] = v; registerPerson(v); if (!W.people[raw]) placeAtHome(W, raw); N.grew = true; } return;
    case 'fm': if (v) { W.folk.n = Math.max(W.folk.n || 0, v.n || 0); W.folk.creative = !!v.creative; W.folk.rels = v.rels || []; } return;
    case 'ts~': if (v) { const old = W.town.shops[raw]; W.town.shops[raw] = { ...v, till: old && Math.floor(old.till || 0) === v.till ? old.till : v.till }; registerShop(W.town.shops[raw]); N.grew = true; } return;
    case 'tm': if (v) { W.town.n = Math.max(W.town.n || 0, v.n || 0); W.town.rows = Math.max(W.town.rows || 1, v.rows || 1); } return;
    case 'pc~': if (v) { const p = (W.pets || []).find(x => x.id === raw); if (p) { p.hunger = v.hunger; p.walk = v.walk; p.with = v.with; } else netAdoptPet(W, v); } return;
    case 'pp~': if (v) { const p = (W.pets || []).find(x => x.id === raw); if (p) { if (p.room !== v.r || Math.hypot(p.x - v.x, p.y - v.y) > 2) { p.x = v.x; p.y = v.y; } p.room = v.r; p._tx = v.x; p._ty = v.y; p.flip = !!v.fl; p.walking = !!v.w; } } return;
    case 'pm': if (v) { W.petDirt = v.dirt || {}; W.petMess = v.mess || []; W.petStats = v.stats || W.petStats; } return;
    case 'o~': if (v && hooks.setOutfit) hooks.setOutfit(raw, v); return;
    case 'tr~': if (v) { W.traits[raw] = v; } return;
    case 'fr': if (v) W.friends = { ...v }; return;
    case 'md~': if (v && W.mood) W.mood[raw] = v; return;
    case 'fights': W.fights = v || []; return;
    case 'news': if (v && W.news) W.news = { n: v.n || 0, list: v.list || [] }; return;
    case 'sky': if (v) {
      if (Math.abs((W.clock || 0) - v.c) > 0.3 && Math.abs((W.clock || 0) - v.c) < 23.7) W.clock = v.c;
      if (W.weather) W.weather.kind = v.w; W.timePick = v.tp; W.weatherPick = v.wp; if (v.sp) W.seasonPick = v.sp; W.lights = v.l || {};
    } return;
    case 'hol': if (v) { if (v.hw && W.hw) Object.assign(W.hw, v.hw); if (v.xm && W.xm) Object.assign(W.xm, v.xm); } return;
    default: return;
  }
}
// the guest has gone: their person goes back to normal life
function release(W, id) {
  const p = W.people[id]; if (!p) return;
  p.netRemote = false; p._net = null; if (p.busy === 'remote') p.busy = null;
  if (p.mode === 'walk') { p.mode = 'stand'; p.path = null; }
}

/* ---------------- a session ---------------- */
export function startSession(W, { side, code, hooks }) {
  const N = { side, code, other: { player: null, name: null, at: 0 }, sent: {}, sentP: {}, walk: {}, tree: {}, ready: false, live: false, stopped: false, busy: false, pending: {}, bubN: 0, bubSeen: new Set(), lastHb: 0, grew: false, started: Date.now() };
  W.net = N;
  const me = `rooms/${code}/${side}`, them = `rooms/${code}/${otherSide(side)}`;
  const status = () => (N.stopped ? 'off' : !N.connected ? 'connecting' : Date.now() - N.other.at < GONE ? 'together' : 'waiting');
  let lastStatus = null;
  const tellStatus = () => { const s = status(); if (s !== lastStatus) { lastStatus = s; if (s === 'waiting' && side === 'h' && N.other.player) { release(W, N.other.player); N.other.player = null; hooks.onOther && hooks.onOther({ ...N.other }); } hooks.onStatus && hooks.onStatus(s); } };

  const applyMany = (entries, initial) => {
    entries.sort((a, b) => rank(a[0]) - rank(b[0]));
    for (const [k, s] of entries) {
      let v = null; try { v = s == null ? null : JSON.parse(s); } catch (e) { continue; }
      if (k === 'hb' || k === 'req') continue;
      try { applyEntity(W, N, side, k, v, hooks); } catch (e) { console.warn('sync', k, e); }
    }
    if (N.grew) { N.grew = false; growTown(W); hooks.structureChanged && hooks.structureChanged(); }
    // don't send back what just arrived
    const now = collect(W, N, side, hooks);
    for (const [k] of entries) { if (k in now) N.sent[k] = JSON.stringify(now[k]); else delete N.sent[k]; }
    if (initial && side === 'g') {
      for (const [k, v] of Object.entries(now)) N.sent[k] = JSON.stringify(v);
      delete N.sent.who; delete N.sent['p~' + W.player]; // but do say who we are and where
    }
  };
  const addBubbles = obj => {
    for (const [k, s] of Object.entries(obj || {})) {
      if (N.bubSeen.has(k) || s == null) continue; N.bubSeen.add(k);
      let b; try { b = JSON.parse(s); } catch (e) { continue; }
      if (b.an && b.an.type === 'person' && !W.people[b.an.id]) continue;
      const nb = say(W, b.w, b.t, b.an, { dur: b.d, style: b.s, quiet: b.q }); if (nb) nb.net = true;
    }
  };
  const onEvent = (kind, path, data) => {
    N.other.at = Date.now(); N.connected = true;
    const ps = path.split('/').filter(Boolean);
    if (!ps.length) {
      // the first look (or everything replaced): take all of it, but old speech is old
      const e = (data && data.e) || {}; for (const k of Object.keys((data && data.b) || {})) N.bubSeen.add(k);
      applyMany(Object.entries(e).map(([k, v]) => [decKeyTop(k), v]), !N.ready); N.ready = true;
      if (side === 'h' && e.req) hostSendSave(e.req);
      if (!data || !data.e || !data.e.hb) N.other.at = 0;
      tellStatus(); return;
    }
    if (ps[0] === 'e') {
      const ent = ps.length === 1 ? Object.entries(data || {}) : [[ps[1], data]];
      const req = ent.find(([k]) => k === 'req'); if (side === 'h' && req && req[1]) hostSendSave(req[1]);
      applyMany(ent.map(([k, v]) => [decKeyTop(k), v]), false);
    } else if (ps[0] === 'b') addBubbles(ps.length === 1 ? data : { [ps[1]]: data });
    tellStatus();
  };
  const decKeyTop = k => k; // keys are stored as sent (already safe)
  const hostSendSave = async req => {
    if (N.savedFor === req) return; N.savedFor = req;
    try { await db('PUT', `rooms/${code}/save`, { at: req, s: JSON.stringify(hooks.makeSave()) }); } catch (e) { N.savedFor = null; }
  };

  // send what changed
  const flush = async () => {
    if (N.stopped || N.busy) return;
    const now = collect(W, N, side, hooks), patch = {};
    for (const [k, v] of Object.entries(now)) { const s = JSON.stringify(v); if (N.sent[k] !== s) { patch[k] = s; N.sent[k] = s; if (k.startsWith('p~')) N.sentP[k.slice(2)] = 1; } }
    for (const k of Object.keys(N.sent)) if (!(k in now) && !['hb', 'req'].includes(k)) { patch[k] = null; delete N.sent[k]; }
    if (Date.now() - N.lastHb > HB) {
      // now and then say again who we are and where, in case the other side lost track
      patch.hb = JSON.stringify(Date.now()); N.lastHb = Date.now();
      if (now.who) patch.who = JSON.stringify(now.who);
      if (side === 'g' && now['p~' + W.player]) patch['p~' + W.player] = JSON.stringify(now['p~' + W.player]);
    }
    const bubs = {};
    for (const b of W.bubbles) {
      if (b.net || b.netSent || !b.anchor || b.anchor.type !== 'person') continue;
      b.netSent = true; bubs[side + Date.now().toString(36) + (N.bubN++)] = JSON.stringify({ w: b.who, t: b.text, an: b.anchor, d: b.dur, s: b.style, q: b.quiet });
    }
    if (!Object.keys(patch).length && !Object.keys(bubs).length) return;
    N.busy = true;
    try {
      if (Object.keys(patch).length) await db('PATCH', `${me}/e`, patch);
      if (Object.keys(bubs).length) await db('PATCH', `${me}/b`, bubs);
      N.bytes = (N.bytes || 0) + JSON.stringify(patch).length;
    } catch (e) {
      // try those again next time
      for (const k of Object.keys(patch)) delete N.sent[k];
    } finally { N.busy = false; }
  };
  let timer = null, sub = null, pruneT = null;
  const begin = async () => {
    try {
      if (side === 'h') {
        await db('DELETE', me);
        await db('PUT', `rooms/${code}/meta`, { name: NAMES[W.player] || '', world: hooks.worldName ? hooks.worldName() : '', fresh: !!W.fresh, v: 1, at: Date.now() });
      }
    } catch (e) { /* carry on: it will retry sending */ }
    if (N.stopped) return;
    sub = listen(them, onEvent, on => { N.connected = on; tellStatus(); });
    timer = setInterval(() => { if (side === 'h' || N.ready) flush(); tellStatus(); }, TICK);
    pruneT = setInterval(() => { db('DELETE', `${me}/b`).catch(() => {}); }, 30000);
  };
  begin();
  return {
    N,
    status,
    stop() {
      N.stopped = true; clearInterval(timer); clearInterval(pruneT); if (sub) sub.close();
      if (side === 'h' && N.other.player) release(W, N.other.player);
      for (const p of Object.values(W.people)) if (p.netRemote) release(W, p.id);
      W.net = null; hooks.onStatus && hooks.onStatus('off');
    },
  };
}

// every frame on the host: the guest's person is moved only by the guest
export function pinRemote(W) {
  const N = W.net; if (!N || N.side !== 'h' || !N.other.player) return;
  const p = W.people[N.other.player], s = p && p._net; if (!p || !s) return;
  p.netRemote = true; p.busy = 'remote';
  const moved = p.room !== s.r || p.goal || (p.path && p.path !== s.path) || (p.mode !== 'walk' && p.mode !== 'hop' && s.m !== 'walk' && Math.hypot(p.x - s.x, p.y - s.y) > 0.3);
  if (moved) { p.room = s.r; p.x = s.x; p.y = s.y; p.goal = null; p.then = null; p.path = s.path; p.mode = s.m; }
}
export const otherPlayer = W => (W.net && W.net.other.player) || null;
export const otherSideOf = W => (W.guest ? 'h' : 'g');
