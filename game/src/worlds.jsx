// Worlds: Callie's house (with her real family) and any number of new worlds started from scratch.
// Each world has its own save. Switching world reloads the game with that world's save.
import React, { useState } from 'react';
import { speak, SFX } from './core.js';
import { HeadIcon, DEFAULT_OUTFITS } from './people.jsx';

const LIST_KEY = 'callies-house-worlds';
const SKIP_KEY = 'callies-house-skip-intro';
const read = k => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
export function worldList() {
  const w = read(LIST_KEY) || { list: [], current: 'callie' };
  if (!w.list.some(x => x.id === 'callie')) w.list.unshift({ id: 'callie', name: "Callie's House" });
  return w;
}
export const saveKeyOf = id => (id === 'callie' ? 'callies-house-v1' : 'callies-house-w-' + id);
export const currentWorld = () => worldList().current || 'callie';
export const SAVE_KEY = saveKeyOf(currentWorld());
// after switching world the game reloads straight into it (no splash or picker again)
export const skipIntro = () => { try { const v = sessionStorage.getItem(SKIP_KEY); sessionStorage.removeItem(SKIP_KEY); return !!v; } catch (e) { return false; } };
function reloadInto(id) {
  const w = worldList(); w.current = id; write(LIST_KEY, w);
  try { sessionStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* ignore */ }
  window.location.reload();
}
export function switchWorld(id, saveNow) {
  if (id === currentWorld()) return false;
  if (saveNow) saveNow();
  reloadInto(id); return true;
}
export function newWorld(saveNow) {
  const w = worldList(), id = 'w' + Date.now().toString(36);
  w.list.push({ id, name: 'New world', fresh: true }); write(LIST_KEY, w);
  write(saveKeyOf(id), { fresh: true });
  if (saveNow) saveNow();
  reloadInto(id);
}
// Play together: a world on the other tablet that this one joins with a code
export const joinCodeOf = id => (id && id.startsWith('j-') ? id.slice(2) : null);
export const isJoinWorld = () => !!joinCodeOf(currentWorld());
export function joinWorld(code, name, saveNow) {
  const w = worldList(), id = 'j-' + code;
  const it = w.list.find(x => x.id === id);
  if (it) { if (name) it.name = name; } else w.list.push({ id, name: name || 'Playing together', join: code });
  write(LIST_KEY, w);
  if (saveNow) saveNow();
  if (currentWorld() === id) { try { sessionStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* ignore */ } window.location.reload(); }
  else reloadInto(id);
}
// the code this world uses when it is shared, and whether sharing is on
export function netOf(id) { const it = worldList().list.find(x => x.id === id); return it ? { code: it.netCode || null, on: !!it.netOn } : { code: null, on: false }; }
export function setNet(id, patch) {
  const w = worldList(); let it = w.list.find(x => x.id === id);
  if (!it && id === 'callie') { it = { id: 'callie', name: "Callie's House" }; w.list.unshift(it); }
  if (!it) return;
  if ('code' in patch) it.netCode = patch.code; if ('on' in patch) it.netOn = patch.on;
  write(LIST_KEY, w);
}
export function nameWorld(id, name, heads) {
  const w = worldList(), it = w.list.find(x => x.id === id); if (!it) return;
  it.name = name; if (heads) it.heads = heads; write(LIST_KEY, w);
}
export function deleteWorld(id) {
  if (id === 'callie') return;
  const w = worldList(); w.list = w.list.filter(x => x.id !== id);
  try { localStorage.removeItem(saveKeyOf(id)); } catch (e) { /* ignore */ }
  if (w.current === id) { w.current = 'callie'; write(LIST_KEY, w); reloadInto('callie'); return; }
  write(LIST_KEY, w);
}

// pick a world
export function WorldPicker({ onPlay, onClose, saveNow, closable }) {
  const [w, setW] = useState(worldList);
  const [sure, setSure] = useState(null);
  const cur = w.current || 'callie';
  const play = it => { SFX.pop(); speak(it.name, 'word'); if (it.id === cur) onPlay(); else switchWorld(it.id, saveNow); };
  return <div className="worlds-back" onPointerDown={e => e.stopPropagation()}>
    <div className="sheet worlds" role="dialog" aria-label="Pick a world">
      <div className="box-head"><button className="room-chip" onClick={() => speak('Which world shall we play?', 'narrator')}>Which world?</button>{closable && <button className="pill" onClick={onClose}>Close</button>}</div>
      <div className="world-list">
        {w.list.map(it => <div key={it.id} className={'world-card' + (it.id === cur ? ' on' : '')}>
          <span className="world-heads">{it.id === 'callie' ? ['callie', 'chloe', 'mum', 'dad', 'connor'].map(k => <HeadIcon key={k} who={k} o={DEFAULT_OUTFITS[k]} size={34} />)
            : it.join ? <span className="world-new" aria-label="Playing together">⇄</span>
            : (it.heads || []).length ? it.heads.map((h, i) => <span key={i} className="world-dot" style={{ background: h }} />) : <span className="world-new">✦</span>}</span>
          <button className="world-name" onClick={() => speak(it.name, 'word')}>{it.name}</button>
          {it.id !== 'callie' && (sure === it.id ? <span className="pair"><button className="pill warn" onClick={() => { deleteWorld(it.id); setW(worldList()); setSure(null); }}>Yes, delete</button><button className="pill" onClick={() => setSure(null)}>No</button></span>
            : <button className="pill small-del" aria-label={`Delete ${it.name}`} onClick={() => setSure(it.id)}>Delete</button>)}
          <button className="done" onClick={() => play(it)}>{it.id === cur ? 'Play' : 'Go'}</button>
        </div>)}
      </div>
      <button className="done new-world" onClick={() => { SFX.sparkle(); speak('A new world!', 'narrator'); newWorld(saveNow); }}>Start a new world</button>
    </div>
  </div>;
}
