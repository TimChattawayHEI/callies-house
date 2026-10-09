// Back up and restore: every world, painting, photo and sticker is copied into one file that can be
// kept somewhere safe (Google Drive, email, the tablet's Documents folder) and loaded back later.
// On the tablet a copy is also written to Documents/ once a day without asking, so uninstalling the
// app or clearing its storage does not lose everything.
import React, { useRef, useState } from 'react';
import { SFX, speak } from './core.js';
import { worldList } from './worlds.jsx';

const PREFIX = 'callies-house';
const LAST_KEY = 'callies-house-lastbackup';
const AUTO_KEY = 'callies-house-autobackup';
const SKIP_KEY = 'callies-house-skip-intro';
const APP = "Callie's House";
const AUTO_DIR = "Callie's House";

const cap = () => { const c = typeof window !== 'undefined' && window.Capacitor; return c && c.isNativePlatform && c.isNativePlatform() && c.registerPlugin ? c : null; };
let plugins = null;
const native = () => { const c = cap(); if (!c) return null; if (!plugins) plugins = { fs: c.registerPlugin('Filesystem'), share: c.registerPlugin('Share') }; return plugins; };
const readJSON = k => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };

const ourKeys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX) && k !== AUTO_KEY) out.push(k); } } catch (e) { /* ignore */ } return out.sort(); };

// what is in a backup, in words
function summarise(data) {
  const list = (data['callies-house-worlds'] && JSON.parse(data['callies-house-worlds']).list) || [{ id: 'callie', name: APP }];
  const names = list.map(w => w.name);
  if (!names.includes(APP) && data['callies-house-v1']) names.unshift(APP);
  let stickers = 0;
  for (const [k, v] of Object.entries(data)) if (k === 'callies-house-v1' || k.startsWith('callies-house-w-')) { try { stickers += Object.keys(JSON.parse(v).ach || {}).length; } catch (e) { /* ignore */ } }
  let paintings = 0; try { paintings = (JSON.parse(data['callies-house-paintings-v1'] || '[]') || []).length; } catch (e) { /* ignore */ }
  return { worlds: names, stickers, paintings };
}

export function makeBackup() {
  const data = {};
  for (const k of ourKeys()) { try { data[k] = localStorage.getItem(k); } catch (e) { /* ignore */ } }
  return { app: 'callies-house', v: 1, at: new Date().toISOString(), data };
}
const fileName = d => `callies-house-backup-${d.toISOString().slice(0, 10)}.json`;

// read a backup someone picked; returns { ok, backup, why }
export function checkBackup(text) {
  let b; try { b = JSON.parse(text); } catch (e) { return { ok: false, why: 'That file is not a backup.' }; }
  if (!b || b.app !== 'callies-house' || !b.data || typeof b.data !== 'object') return { ok: false, why: "That file is not a Callie's House backup." };
  const keys = Object.keys(b.data).filter(k => k.startsWith(PREFIX) && typeof b.data[k] === 'string');
  if (!keys.length) return { ok: false, why: 'That backup is empty.' };
  return { ok: true, backup: b, sum: summarise(b.data) };
}

// swap everything for the backup; puts it all back if the tablet runs out of room halfway
export function restoreBackup(b) {
  window.__restoring = true;
  const before = {}; for (const k of ourKeys()) before[k] = localStorage.getItem(k);
  try {
    for (const k of Object.keys(before)) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(b.data)) if (k.startsWith(PREFIX) && typeof v === 'string' && k !== AUTO_KEY) localStorage.setItem(k, v);
    return true;
  } catch (e) {
    try { for (const k of ourKeys()) localStorage.removeItem(k); for (const [k, v] of Object.entries(before)) localStorage.setItem(k, v); } catch (e2) { /* nothing more to do */ }
    window.__restoring = false; return false;
  }
}

async function writeNative(n, path, text, directory) {
  await n.fs.writeFile({ path, data: text, directory, encoding: 'utf8', recursive: true });
  const r = await n.fs.getUri({ path, directory });
  return r && r.uri;
}

// Back up now: on the tablet, save to Documents and open the share sheet (Drive, Gmail...); on the web, download.
export async function backupNow() {
  const b = makeBackup(), text = JSON.stringify(b), name = fileName(new Date(b.at)), n = native();
  let saved = false, shared = false;
  if (n) {
    try { await writeNative(n, `${AUTO_DIR}/${name}`, text, 'DOCUMENTS'); saved = true; } catch (e) { /* no Documents access: share only */ }
    try {
      const uri = await writeNative(n, name, text, 'CACHE');
      await n.share.share({ title: `${APP} backup`, text: `${APP} backup, ${new Date(b.at).toLocaleDateString()}`, url: uri, dialogTitle: 'Keep the backup somewhere safe' });
      shared = true;
    } catch (e) { /* share cancelled or not available */ }
  } else {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); saved = true;
    } catch (e) { /* downloads blocked */ }
  }
  if (saved || shared) writeJSON(LAST_KEY, b.at);
  return { saved, shared, native: !!n, name, size: text.length };
}

// Quiet daily copy on the tablet: Documents/Callie's House/callies-house-auto.json
export async function autoBackup() {
  const n = native(); if (!n) return false;
  const last = readJSON(AUTO_KEY) || {};
  if (last.at && Date.now() - Date.parse(last.at) < 20 * 3600 * 1000) return false;
  const b = makeBackup(), text = JSON.stringify(b);
  // after a reinstall the old auto file belongs to the old app, so a new name is used if writing over it fails
  const names = [last.name || 'callies-house-auto.json', `callies-house-auto-${Date.now().toString(36)}.json`];
  for (const name of names) {
    try { await n.fs.writeFile({ path: `${AUTO_DIR}/${name}`, data: text, directory: 'DOCUMENTS', encoding: 'utf8', recursive: true }); writeJSON(AUTO_KEY, { at: b.at, name }); return true; } catch (e) { /* try the next name */ }
  }
  return false;
}

const ago = iso => {
  if (!iso) return null;
  const d = (Date.now() - Date.parse(iso)) / 864e5;
  if (d < 1) return 'today'; if (d < 2) return 'yesterday'; if (d < 14) return `${Math.floor(d)} days ago`;
  return new Date(iso).toLocaleDateString();
};
const nice = iso => { const d = new Date(iso); return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`; };

export function BackupPanel({ onClose, saveNow }) {
  const [msg, setMsg] = useState(null), [busy, setBusy] = useState(false), [pending, setPending] = useState(null);
  const fileRef = useRef(null);
  const last = readJSON(LAST_KEY), auto = readJSON(AUTO_KEY), isNative = !!cap();
  const here = summarise(Object.fromEntries(ourKeys().map(k => [k, localStorage.getItem(k)])));
  const doBackup = async () => {
    if (busy) return; setBusy(true); saveNow && saveNow(); SFX.pop();
    const r = await backupNow(); setBusy(false);
    if (!r.saved && !r.shared) { setMsg({ bad: true, t: r.native ? 'The backup was not saved. Try again and pick Google Drive or Files to keep it.' : 'The backup could not be saved. Please try again.' }); return; }
    SFX.sparkle();
    setMsg({ t: r.native ? (r.saved ? `Saved in the tablet's Documents folder, in "${AUTO_DIR}".${r.shared ? ' You can keep a second copy in Google Drive too.' : ''}` : 'Backup sent.') : `Downloaded ${r.name}.` });
  };
  const picked = e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { const r = checkBackup(String(rd.result)); if (!r.ok) { setMsg({ bad: true, t: r.why }); SFX.click(); return; } setMsg(null); setPending(r); SFX.pop(); };
    rd.onerror = () => setMsg({ bad: true, t: 'That file could not be opened.' });
    rd.readAsText(f);
  };
  const doRestore = () => {
    if (!restoreBackup(pending.backup)) { setPending(null); setMsg({ bad: true, t: 'There is not enough room on this device for that backup. Nothing was changed.' }); return; }
    SFX.sparkle(); speak('All back!', 'narrator');
    const w = worldList(); if (!w.list.some(x => x.id === w.current)) { w.current = 'callie'; writeJSON('callies-house-worlds', w); }
    try { sessionStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* ignore */ }
    setTimeout(() => window.location.reload(), 600);
  };
  const S = s => `${s.worlds.length} ${s.worlds.length === 1 ? 'world' : 'worlds'} (${s.worlds.join(', ')}), ${s.stickers} stickers, ${s.paintings} paintings`;
  return <div className="sheet backup" role="dialog" aria-label="Back up and restore" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip">Back up</button><button className="pill" onClick={onClose}>Close</button></div>
    {!pending ? <>
      <p className="bk-what">On this {isNative ? 'tablet' : 'device'}: {S(here)}.</p>
      <div className="bk-row"><div><b>Back up</b><small>{last ? `Last backed up ${ago(last)}.` : 'Not backed up yet.'}{isNative && auto && auto.at ? ` A copy is also saved in Documents every day (last ${ago(auto.at)}).` : ''}</small></div>
        <button className="done" disabled={busy} onClick={doBackup}>{busy ? 'Saving...' : 'Back up now'}</button></div>
      <div className="bk-row"><div><b>Restore</b><small>Load a backup file. Everything on this {isNative ? 'tablet' : 'device'} is swapped for what is in the backup.</small></div>
        <button className="pill" onClick={() => fileRef.current && fileRef.current.click()}>Choose a backup</button></div>
      <input ref={fileRef} type="file" className="bk-file" onChange={picked} aria-hidden="true" tabIndex={-1} />
    </> : <div className="bk-confirm">
      <p><b>Restore the backup from {nice(pending.backup.at)}?</b></p>
      <p>It has {S(pending.sum)}.</p>
      <p className="bk-warn">What is on this {isNative ? 'tablet' : 'device'} now will be replaced. Back up first if you want to keep it.</p>
      <div className="pair"><button className="pill warn" onClick={doRestore}>Yes, restore</button><button className="pill" onClick={() => setPending(null)}>Cancel</button></div>
    </div>}
    {msg && <p className={'bk-msg' + (msg.bad ? ' bad' : '')} role="status">{msg.t}</p>}
  </div>;
}
