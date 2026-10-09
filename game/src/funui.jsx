// Screens for the family activities: fridge magnets, burger builder, photo album, and the tap-a-person menu.
import React, { useState, useRef } from 'react';
import { speak, SFX } from './core.js';
import { Burger, BURGER_LAYERS } from './items.jsx';
import { HeadIcon, NAMES } from './people.jsx';

/* ---------------- fridge magnets ---------------- */
const MAG_COLS = ['#e23b3b', '#3d8fe0', '#ffb31a', '#4cc76a', '#8e5ad1', '#ff7ab8'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['a', 'e', 'i', 'o', 'u', 's', 't', 'm', 'd']);
const KNOWN = new Set(['cat', 'dog', 'mum', 'dad', 'sun', 'hat', 'bed', 'pig', 'cup', 'bus', 'red', 'big', 'mud', 'fish', 'duck', 'sock', 'key', 'pen', 'car', 'love', 'hug', 'yes', 'no', 'run', 'top', 'egg', 'ham', 'jam', 'map', 'bat', 'mat', 'sat', 'pot', 'hot', 'dig', 'fox', 'box', 'zip', 'van', 'web', 'yum', 'mop', 'bin', 'tin', 'pin', 'leg', 'arm', 'tea', 'bee', 'moon', 'book', 'look', 'cake', 'home', 'callie', 'chloe', 'connor', 'nan', 'cuddle', 'kiss', 'pop', 'fun', 'up', 'at', 'in', 'on', 'is', 'it', 'my', 'me', 'we', 'the', 'and', 'i', 'a']);
export const MAG_KEY = 'callies-house-magnets-v1';
export function freshMagnets() { return LETTERS.map((ch, i) => ({ id: i, ch, col: MAG_COLS[i % MAG_COLS.length], x: null, y: null })); }

export function MagnetPanel({ magnets, setMagnets, onClose, onMade }) {
  const doorRef = useRef(null), drag = useRef(null);
  const [, force] = useState(0);
  const [made, setMade] = useState(null);
  // Drag with window listeners: the magnet leaves the tray as soon as it is picked up,
  // so the button that got the touch is gone and cannot keep receiving its events.
  const down = (e, m) => {
    e.preventDefault(); e.stopPropagation();
    if (drag.current) return;
    const pid = e.pointerId;
    drag.current = { id: m.id, sx: e.clientX, sy: e.clientY, moved: false, cx: e.clientX, cy: e.clientY };
    const move = ev => { const d = drag.current; if (!d || ev.pointerId !== pid) return; ev.preventDefault(); d.cx = ev.clientX; d.cy = ev.clientY; if (Math.hypot(d.cx - d.sx, d.cy - d.sy) > 8) d.moved = true; force(n => n + 1); };
    const up = ev => {
      if (ev.pointerId !== pid) return;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      const d = drag.current; drag.current = null; if (!d) return;
      if (ev.type !== 'pointercancel') { d.cx = ev.clientX; d.cy = ev.clientY; }
      if (!d.moved) { speak(m.ch, 'word'); SFX.click(); force(n => n + 1); return; }
      const r = doorRef.current ? doorRef.current.getBoundingClientRect() : null;
      const inside = r && d.cx > r.left && d.cx < r.right && d.cy > r.top && d.cy < r.bottom;
      setMagnets(ms => ms.map(x => x.id !== d.id ? x : inside ? { ...x, x: Math.min(0.95, Math.max(0.05, (d.cx - r.left) / r.width)), y: Math.min(0.94, Math.max(0.06, (d.cy - r.top) / r.height)) } : { ...x, x: null, y: null }));
      SFX.pop();
    };
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    force(n => n + 1);
  };
  const readIt = () => {
    const on = magnets.filter(m => m.x != null).sort((a, b) => a.y - b.y);
    const rows = [];
    for (const m of on) { const row = rows.find(r => Math.abs(r.y - m.y) < 0.07); if (row) row.ms.push(m); else rows.push({ y: m.y, ms: [m] }); }
    const words = [];
    for (const r of rows) {
      r.ms.sort((a, b) => a.x - b.x);
      let w = '';
      r.ms.forEach((m, i) => { if (i && m.x - r.ms[i - 1].x > 0.085) { words.push(w); w = ''; } w += m.ch; });
      if (w) words.push(w);
    }
    if (!words.length) { speak('Put some letters on the fridge!', 'narrator'); return; }
    speak(words.join(' '), 'narrator');
    const real = words.filter(w => KNOWN.has(w));
    if (real.length) { setMade(real.join(', ')); SFX.sparkle(); setTimeout(() => setMade(null), 2600); onMade && onMade(real); }
  };
  const d = drag.current;
  const magnetEl = (m, style) => <button key={m.id} className="magnet" style={{ color: m.col, ...style }} onPointerDown={e => down(e, m)} aria-label={'letter ' + m.ch}>{m.ch}</button>;
  return <div className="magnets" role="dialog" aria-label="Fridge magnets" onPointerDown={e => e.stopPropagation()}>
    <div className="paint-top"><b className="paint-title">Fridge magnets</b><div className="paint-btns">
      <button className="pill" onClick={() => { setMagnets(freshMagnets()); SFX.whoosh(); }}>Clear</button>
      <button className="pill readme" onClick={readIt}>Read it!</button><button className="done" onClick={onClose}>Done</button></div></div>
    <div className="fridge-door" ref={doorRef}>
      <div className="fridge-handle" />
      {magnets.filter(m => m.x != null && !(d && d.id === m.id)).map(m => magnetEl(m, { left: `${m.x * 100}%`, top: `${m.y * 100}%`, position: 'absolute' }))}
      {made && <div className="made">You made <b>{made}</b>!</div>}
    </div>
    <div className="letter-tray">{magnets.filter(m => m.x == null && !(d && d.id === m.id)).map(m => magnetEl(m))}</div>
    {d && (() => { const m = magnets.find(x => x.id === d.id); return <span className="magnet dragging" style={{ color: m.col, left: d.cx, top: d.cy }}>{m.ch}</span>; })()}
  </div>;
}

/* ---------------- burger builder ---------------- */
export function BurgerPanel({ onMake, onClose, outfits }) {
  const [layers, setLayers] = useState(['burger']);
  const [forWho, setForWho] = useState(null);
  return <div className="sheet fridge" role="dialog" aria-label="Make a burger" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Make a burger!', 'narrator')}>Make a burger!</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="fridge-body">
      <svg viewBox="-30 -46 60 50" width="110" height="92" aria-hidden="true"><Burger layers={layers} /></svg>
      <div className="choices">{BURGER_LAYERS.map(l => <button key={l} className="tile food" onClick={() => { speak(l, 'word'); SFX.pop(); setLayers(ls => ls.length >= 5 ? [...ls.slice(1), l] : [...ls, l]); }}>
        <svg viewBox="-20 -14 40 20" width="40" height="22"><Burger layers={[l]} /></svg><span>{l}</span></button>)}
        <button className="tile food" onClick={() => { setLayers([]); SFX.whoosh(); }}><span>empty</span></button></div>
      <div className="for-who"><span>Who is it for?</span>{['callie', 'chloe', 'mum', 'dad', 'connor'].map(w => <button key={w} className="who" aria-pressed={forWho === w} onClick={() => { setForWho(w); speak(NAMES[w], 'word'); }}><HeadIcon who={w} o={outfits[w]} size={32} /><small>{NAMES[w]}</small></button>)}</div>
      <button className="done" onClick={() => { onMake(layers, forWho); setLayers(['burger']); }}>Make it!</button>
    </div>
  </div>;
}

/* ---------------- photo album ---------------- */
export const PHOTO_KEY = 'callies-house-photos-v1';
export function Album({ photos, onClose }) {
  const [big, setBig] = useState(null);
  return <div className="sheet album" role="dialog" aria-label="Family photos" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Family photos', 'narrator')}>Family photos</button><button className="done" onClick={onClose}>Done</button></div>
    {big != null ? <button className="photo-big" onClick={() => setBig(null)}><img src={photos[big]} alt="Family photo" /></button>
      : <div className="photo-grid">{photos.length ? photos.map((p, i) => <button key={i} className="photo-thumb" onClick={() => setBig(i)}><img src={p} alt={'Photo ' + (i + 1)} /></button>).reverse() : <span className="empty">No photos yet. Tap the camera to take one!</span>}</div>}
  </div>;
}

/* ---------------- tap-a-person menu ---------------- */
export function PersonMenu({ who, x, y, canHide, onHug, onCare, onSing, onHide, onEdit, onAbout, onClose }) {
  return <div className="pmenu" style={{ left: x, top: y }} onPointerDown={e => e.stopPropagation()}>
    <button className="pm" onClick={onHug}><svg viewBox="-12 -12 24 24" width="30" height="30"><path d="M0,10 C-13,1 -10,-10 0,-3 C10,-10 13,1 0,10Z" fill="#e86a92" /></svg><span>Hug</span></button>
    {onCare && <button className="pm" onClick={onCare}><svg viewBox="-12 -12 24 24" width="30" height="30"><circle cx={-4} cy={3} r={6} fill="#e23b3b" /><circle cx={4} cy={3} r={6} fill="#e23b3b" /><path d="M0,-3 q1,-6 5,-8" stroke="#3f8a5a" strokeWidth={2} fill="none" /></svg><span>Snack</span></button>}
    {onSing && <button className="pm" onClick={onSing}><svg viewBox="-12 -12 24 24" width="30" height="30"><text x={0} y={8} textAnchor="middle" fontSize={22} fill="#7a4fd1">♫</text></svg><span>Sing</span></button>}
    {canHide && <button className="pm" onClick={onHide}><svg viewBox="-12 -12 24 24" width="30" height="30"><circle r="9" fill="#ffd45e" /><circle cx="-3" cy="-2" r="1.6" fill="#3b2a24" /><circle cx="3" cy="-2" r="1.6" fill="#3b2a24" /><path d="M-9,1 h18" stroke="#5a3d32" strokeWidth="3" /></svg><span>Hide and seek</span></button>}
    {onAbout && <button className="pm" onClick={onAbout}><svg viewBox="-12 -12 24 24" width="30" height="30"><circle r="10" fill="#ffd9a8" stroke="#e0a978" /><circle cx="-3.5" cy="-2" r="1.5" fill="#3b2a24" /><circle cx="3.5" cy="-2" r="1.5" fill="#3b2a24" /><path d="M-4.5,3 q4.5,4 9,0" stroke="#3b2a24" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg><span>About</span></button>}
    {onEdit && <button className="pm" onClick={onEdit}><svg viewBox="-12 -12 24 24" width="30" height="30"><path d="M-8,8 l2,-7 10,-10 5,5 -10,10z" fill="#5b9bd5" /><path d="M-8,8 l2,-7 5,5z" fill="#f6d2b8" /></svg><span>Change</span></button>}
    <button className="pm close" onClick={onClose} aria-label="Close">×</button>
  </div>;
}
