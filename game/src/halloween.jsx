// Seasons. Halloween: Mum asks for the spooky box from the attic, the house gets decorated,
// bats flap past, and there is a pumpkin in the kitchen to carve.
import React, { useState } from 'react';
import { P, rand, pick, clamp, E, SFX, speak, achieve } from './core.js';
import { Iso } from '../rooms.gen.jsx';
import { say, later, burst, nav } from './world.js';
import { ROOMS } from './rooms.jsx';

const { FaceX, FaceY } = Iso;

/* ---------------- which season is it? ---------------- */
export function seasonOf(choice, d = new Date()) {
  if (choice && choice !== 'auto') return choice;
  const m = d.getMonth();
  return m === 9 ? 'halloween' : m === 11 ? 'christmas' : 'none';
}
export const SEASON_LABEL = { auto: 'Auto', halloween: 'Halloween', christmas: 'Christmas', none: 'Off' };
export const SEASON_CYCLE = ['auto', 'halloween', 'christmas', 'none'];
export const isHalloween = W => seasonOf(W.seasonPick) === 'halloween';

export function initHalloween(W, saved) {
  const year = new Date().getFullYear();
  W.seasonPick = (saved && saved.seasonPick) || 'auto';
  const h = saved && saved.hw;
  W.hw = h && h.year === year ? { stage: h.stage || 'none', year, pumpkin: h.pumpkin || null } : { stage: 'none', year, pumpkin: null };
  W.hw.askT = 30;
  W.nextBat = 20;
  for (const it of W.items) if (it.kind === 'spooky') it.quest = 'mum';
  if (W.hw.stage === 'asked') addBox(W);
  if (W.hw.stage !== 'asked') W.items = W.items.filter(i => i.kind !== 'spooky' || i.loc.s === 'pack');
}
export function resetHalloween(W) {
  W.hw = { stage: 'none', year: new Date().getFullYear(), pumpkin: null, askT: W.T + 20 };
  W.items = W.items.filter(i => i.kind !== 'spooky');
}
export function addBox(W) {
  if (!W.items.find(i => i.kind === 'spooky')) W.items.push({ id: 'q-spooky', kind: 'spooky', quest: 'mum', room: 'attic', loc: { s: 'in', box: 'attic:boxes', order: -1 }, rot: 0 });
  W.dirty = true;
}

/* ---------------- the story ---------------- */
export function stepHalloween(W) {
  if (!isHalloween(W)) { W.bat = null; return; }
  const hw = W.hw;
  if (hw.stage === 'none' && W.T > hw.askT && !W.out && !W.bedtime && !W.photo && !W.dance && !W.hide && W.player !== 'mum') {
    hw.stage = 'asked'; addBox(W);
    const mum = W.people.mum;
    SFX.giggle();
    say(W, 'mum', 'It is Halloween! Can you get the spooky box from the attic?', mum.room === W.room ? null : { type: 'off', id: 'mum' });
  }
  if (hw.stage === 'decorated' && W.T > W.nextBat && !W.bat && !W.bedtime) {
    W.nextBat = W.T + rand(20, 38);
    if (ROOMS[W.room].bounds && W.room !== 'toilet') W.bat = { room: W.room, t0: W.T, h: rand(0.25, 0.75), flee: 0, dir: Math.random() < 0.5 ? 1 : -1 };
  }
  if (W.bat && (W.bat.room !== W.room || W.T - W.bat.t0 > 7)) W.bat = null;
}
// Mum gets the box: up go the decorations.
export function decorate(W, onToast) {
  const hw = W.hw;
  W.items = W.items.filter(i => i.kind !== 'spooky');
  hw.stage = 'decorated'; hw.decoT = W.T; W.dirty = true; W.nextBat = W.T + 6;
  const mum = W.people.mum, here = mum.room === W.room;
  SFX.fanfare();
  say(W, 'mum', 'The spooky box! Let us make the house spooky!', here ? null : { type: 'off', id: 'mum' });
  if (here && mum.id !== W.player) mum.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
  later(W, 1.0, () => { SFX.sparkle(); onToast && onToast('The house is spooky now!'); });
  later(W, 3.0, () => achieve(W, 'spooky'));
  later(W, 4.5, () => { if (!hw.pumpkin) say(W, 'mum', 'Now let us carve the pumpkin in the kitchen!', W.people.mum.room === W.room ? null : { type: 'off', id: 'mum' }); });
  later(W, 8, () => { const ch = W.people.chloe; if (ch.room === W.room && ch.id !== W.player) say(W, 'chloe', 'Spooky. I like it.'); });
}

/* ---------------- pumpkin art ---------------- */
const EYE = {
  tri: 'M-17,12 L0,-15 L17,12Z',
  round: 'M-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0Z',
  mad: 'M-19,-9 L17,3 L12,14 L-15,13Z',
  heart: 'M0,14 C-24,0 -15,-17 0,-6 C15,-17 24,0 0,14Z',
  star: 'M0,-17 L5,-5 17,-5 7,3 11,15 0,8 -11,15 -7,3 -17,-5 -5,-5Z',
};
const NOSE = {
  tri: 'M-10,8 L0,-9 L10,8Z',
  round: 'M-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0Z',
  heart: 'M0,9 C-15,0 -9,-11 0,-4 C9,-11 15,0 0,9Z',
  none: '',
};
const MOUTH = {
  grin: 'M-50,-10 Q0,44 50,-10 Q0,12 -50,-10Z',
  zigzag: 'M-48,-8 L-36,4 L-24,-8 L-12,4 L0,-8 L12,4 L24,-8 L36,4 L48,-8 L40,12 Q0,32 -40,12Z',
  oh: 'M-15,6 a15,19 0 1,0 30,0 a15,19 0 1,0 -30,0Z',
  fangs: 'M-46,-8 Q0,40 46,-8Z',
  smile: 'M-38,-4 Q0,28 38,-4 Q0,14 -38,-4Z',
};
export const PARTS = {
  eyes: { opts: ['tri', 'round', 'mad', 'heart', 'star'], words: { tri: 'triangle', round: 'round', mad: 'mad', heart: 'heart', star: 'star' } },
  nose: { opts: ['tri', 'round', 'heart', 'none'], words: { tri: 'triangle', round: 'round', heart: 'heart', none: 'no nose' } },
  mouth: { opts: ['grin', 'zigzag', 'oh', 'fangs', 'smile'], words: { grin: 'grin', zigzag: 'zigzag', oh: 'oh', fangs: 'fangs', smile: 'smile' } },
};
export const JACK = { eyes: 'tri', nose: 'tri', mouth: 'zigzag' };
const BODY = '#f28a1c';

function Holes({ d, lit, T = 0, only }) {
  const glow = lit ? (Math.sin(T * 9) * 0.5 + Math.sin(T * 23) * 0.5) * 0.08 : 0;
  const fill = lit ? `rgb(255,${Math.round(205 + glow * 300)},${Math.round(70 + glow * 200)})` : '#5a2a06';
  const show = k => !only || only === k;
  return <g fill={fill}>
    {show('eyes') && d.eyes && <><path d={EYE[d.eyes]} transform="translate(-40 -20)" /><path d={EYE[d.eyes]} transform="translate(40 -20) scale(-1 1)" /></>}
    {show('nose') && d.nose && NOSE[d.nose] && <path d={NOSE[d.nose]} transform="translate(0 12)" />}
    {show('mouth') && d.mouth && <g transform="translate(0 44)"><path d={MOUTH[d.mouth]} />
      {d.mouth === 'fangs' && <><path d="M-24,-5 L-14,-5 L-19,9Z" fill={BODY} /><path d="M14,-5 L24,-5 L19,9Z" fill={BODY} /></>}
      {d.mouth === 'grin' && <><rect x={-24} y={-2} width={10} height={9} fill={BODY} /><rect x={12} y={-2} width={10} height={9} fill={BODY} /></>}
    </g>}
  </g>;
}
// A pumpkin 200 wide, 160 tall, centred on (0, 0). design = null means not carved yet.
export function Pumpkin({ design, lit, T, only }) {
  return <g>
    <ellipse cx={0} cy={78} rx={92} ry={12} fill="rgba(60,30,10,.18)" />
    <path d="M-6,-70 Q-10,-92 2,-102 L13,-96 Q2,-86 6,-70Z" fill="#5b7a2e" />
    <ellipse cx={-50} cy={4} rx={52} ry={72} fill="#e2701a" />
    <ellipse cx={50} cy={4} rx={52} ry={72} fill="#e2701a" />
    <ellipse cx={-22} cy={0} rx={46} ry={78} fill="#ee8320" />
    <ellipse cx={22} cy={0} rx={46} ry={78} fill="#ee8320" />
    <ellipse cx={0} cy={-2} rx={36} ry={80} fill={BODY} />
    <path d="M-62,-40 Q-74,0 -60,42" fill="none" stroke="#ffb35e" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
    {design && <Holes d={design} lit={lit} T={T} only={only} />}
  </g>;
}
function FacePart({ kind, v }) {
  const d = kind === 'eyes' ? { eyes: v } : kind === 'nose' ? { nose: v } : { mouth: v };
  const vb = kind === 'eyes' ? '-66 -46 132 52' : kind === 'nose' ? '-24 -10 48 44' : '-56 22 112 52';
  return <svg viewBox={vb} width="64" height="34" aria-hidden="true"><rect x={-80} y={-80} width={160} height={200} fill={BODY} />{v === 'none' ? <text x={0} y={18} textAnchor="middle" fontSize={16} fill="#5a2a06">none</text> : <Holes d={d} />}</svg>;
}

/* ---------------- carving screen ---------------- */
export function PumpkinPanel({ start, T, onDone, onClose }) {
  const [d, setD] = useState(start || { eyes: null, nose: null, mouth: null });
  const [lit, setLit] = useState(false);
  const set = (k, v) => { setD(o => ({ ...o, [k]: v })); speak(PARTS[k].words[v], 'word'); SFX.pop(); };
  const mix = () => { setD({ eyes: pick(PARTS.eyes.opts), nose: pick(PARTS.nose.opts), mouth: pick(PARTS.mouth.opts) }); SFX.whoosh(); speak('Spooky!', 'narrator'); };
  const ready = d.eyes && d.mouth;
  return <div className="sheet pumpkin-panel" role="dialog" aria-label="Carve the pumpkin" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Carve the pumpkin!', 'narrator')}>Carve the pumpkin!</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="pumpkin-body">
      <div className={'pumpkin-view' + (lit ? ' lit' : '')}>
        <svg viewBox="-110 -110 220 200" width="220" height="200" aria-label="Your pumpkin"><Pumpkin design={d} lit={lit} T={T} /></svg>
        <div className="pair"><button className="pill" aria-pressed={lit} onClick={() => { setLit(l => !l); SFX.click(); speak(lit ? 'off' : 'light', 'word'); }}>{lit ? 'Lights on' : 'Light it!'}</button><button className="pill" onClick={mix}>Mix it up</button></div>
      </div>
      <div className="pumpkin-parts">
        {['eyes', 'nose', 'mouth'].map(k => <div key={k} className="part-row">
          <button className="part-name" onClick={() => speak(k, 'word')}>{k}</button>
          <div className="part-opts">{PARTS[k].opts.map(v => <button key={v} className="tile part" aria-pressed={d[k] === v} aria-label={PARTS[k].words[v]} onClick={() => set(k, v)}><FacePart kind={k} v={v} /></button>)}</div>
        </div>)}
        <button className="done" disabled={!ready} onClick={() => onDone(d)}>{ready ? 'Done!' : 'Pick eyes and a mouth'}</button>
      </div>
    </div>
  </div>;
}

/* ---------------- decorations ---------------- */
const COLS = ['#f28a1c', '#2b2b2e', '#8e5ad1'];
function Bunting({ len, letters }) {
  const n = Math.max(1, Math.round(len / 170)), seg = len / n, sag = 22, els = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const x0 = i * seg;
    els.push(<path key={'r' + i} d={`M${x0},0 Q${x0 + seg / 2},${sag * 2} ${x0 + seg},0`} fill="none" stroke="#3b2a24" strokeWidth={1.6} />);
    const m = Math.max(3, Math.floor(seg / (letters ? 36 : 27)));
    for (let j = 1; j < m; j++) {
      const t = j / m, x = x0 + seg * t, y = 4 * sag * t * (1 - t), col = COLS[k % 3], ch = letters ? letters[k % letters.length] : '', f = letters ? 1.45 : 1;
      els.push(<g key={i + '-' + j}><path d={`M${x - 11 * f},${y - 1} L${x + 11 * f},${y - 1} L${x},${y + 25 * f}Z`} fill={col} />
        {ch.trim() && <text x={x} y={y + 17} textAnchor="middle" fontSize={19} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill={col === '#f28a1c' ? '#2b2b2e' : '#fff'}>{ch}</text>}</g>);
      k++;
    }
    els.push(<circle key={'p' + i} cx={x0} cy={0} r={3} fill="#3b2a24" />);
  }
  return <g>{els}</g>;
}
function Cobweb({ s = 1 }) {
  const ang = [0, 22, 45, 68, 90].map(a => a * Math.PI / 180), R = 82 * s;
  const ring = r => ang.map((a, i) => { const p = [Math.cos(a) * r, Math.sin(a) * r]; if (!i) return `M${p[0]},${p[1]}`; const m = (a + ang[i - 1]) / 2, q = [Math.cos(m) * r * 0.82, Math.sin(m) * r * 0.82]; return `Q${q[0]},${q[1]} ${p[0]},${p[1]}`; }).join(' ');
  return <g fill="none" stroke="#7d776d" strokeWidth={1.3} opacity={0.6}>
    {ang.map((a, i) => <line key={i} x1={0} y1={0} x2={Math.cos(a) * R} y2={Math.sin(a) * R} />)}
    {[0.3, 0.55, 0.8].map(f => <path key={f} d={ring(R * f)} />)}
  </g>;
}
const BAT_D = 'M0,-3 C3,-9 9,-9 13,-14 C13,-6 19,-5 24,-7 C20,0 15,4 8,3 C4,7 -4,7 -8,3 C-15,4 -20,0 -24,-7 C-19,-5 -13,-6 -13,-14 C-9,-9 -3,-9 0,-3Z';
export function Bat({ flap = 1 }) {
  return <g>
    <g transform={`scale(1 ${flap})`}><path d={BAT_D} fill="#2b2b2e" /></g>
    <path d="M-5,-4 L-4,-10 L-1,-5 M5,-4 L4,-10 L1,-5" fill="#2b2b2e" stroke="#2b2b2e" strokeWidth={1.5} strokeLinejoin="round" />
    <circle cx={-2.6} cy={-1} r={1.6} fill="#fff" /><circle cx={2.6} cy={-1} r={1.6} fill="#fff" />
    <circle cx={-2.4} cy={-0.8} r={0.7} fill="#2b2b2e" /><circle cx={2.4} cy={-0.8} r={0.7} fill="#2b2b2e" />
  </g>;
}
// Per room: wall sizes, which walls get bunting (and letters), pumpkins on the floor, paper bats on the walls.
export const DECOR = {
  callie: { RX: 7, RY: 6, bunt: { y: 'BOO ', x: '' }, jacks: [[6.2, 5.2]], bats: [['y', 1.0, 3.3], ['y', 1.4, 3.05], ['y', 4.6, 3.3]] },
  hallway: { RX: 8.2, RY: 2.2, bunt: { y: '' }, bats: [['y', 4.3, 3.1], ['y', 4.7, 3.3], ['y', 7.8, 3.0]] },
  downhall: { RX: 7.5, RY: 2.4, bunt: { y: '' }, jacks: [[1.85, 2.0]], bats: [['x', 1.9, 3.1]] },
  living: { RX: 7.5, RY: 5.5, bunt: { y: 'BOO ', x: '' }, jacks: [[1.55, 0.85], [3.7, 0.85]], bats: [['x', 3.4, 3.0], ['x', 3.8, 3.25], ['y', 5.3, 3.05]] },
  kitchen: { RX: 6.2, RY: 3.2, bunt: { y: '' } },
  middle: { RX: 10.3, RY: 3.6, bunt: { y: 'BOO ', x: '' }, jacks: [[0.8, 3.0]], bats: [['y', 5.1, 3.1], ['y', 5.4, 3.35]] },
  parents: { RX: 8, RY: 7, bats: [['x', 3.0, 3.1], ['x', 3.4, 3.35]] },
  chloe: { RX: 4.6, RY: 3.0, bunt: { y: '' }, bats: [['x', 2.2, 3.0], ['x', 2.6, 3.2], ['x', 1.8, 3.3]] },
  bathroom: { RX: 4.2, RY: 2.8 },
  toilet: { RX: 3.2, RY: 1.5 },
  garden: { jacks: [[4.6, 0.75], [6.75, 0.75], [4.1, 1.1]] },
};
const jackSpots = {};
export const KPUMP = [1.92, 0.4, 1.07];
export function halloweenOverlays(rid, c, bg, sorted, top) {
  const { T, W } = c;
  if (!isHalloween(W)) return;
  const hw = W.hw;
  // the pumpkin to carve sits on the kitchen worktop
  if (rid === 'kitchen') {
    const b = P(KPUMP[0], KPUMP[1], KPUMP[2]);
    bg.push(<g key="kpumpkin" data-hit="obj:pumpkin" style={{ cursor: 'pointer' }} transform={`translate(${b[0]} ${b[1]}) scale(.26) translate(0 -78)`}><Pumpkin design={hw.pumpkin} lit={!!hw.pumpkin} T={T} /></g>);
  }
  if (rid === 'attic' && hw.stage === 'asked') {
    bg.push(<FaceY key="spookylabel" y={0.802} x0={6.36} z1={0.48}><g transform={`rotate(-4 32 16) translate(0 ${Math.abs(Math.sin(T * 3)) * -2})`}><rect x={4} y={4} width={58} height={24} rx={4} fill="#f28a1c" stroke="#2b2b2e" strokeWidth={2} /><text x={33} y={21} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#2b2b2e">SPOOKY</text></g></FaceY>);
  }
  const D = DECOR[rid];
  if (hw.stage !== 'decorated' || !D) return;
  const q = hw.decoT != null ? clamp((T - hw.decoT) / 1.2, 0, 1) : 1, op = E.outCubic(q);
  const els = [];
  if (D.RX) {
    els.push(<FaceY key="webY" y={0.015} x0={0.0} z1={(rid === 'callie' ? 4.2 : 4.2) - 0.02}><Cobweb /></FaceY>);
    if (D.bunt && D.bunt.y != null) els.push(<FaceY key="buntY" y={0.02} x0={0.35} z1={3.98}><Bunting len={(D.RX - 0.7) * 100} letters={D.bunt.y} /></FaceY>);
    if (D.bunt && D.bunt.x != null) els.push(<FaceX key="buntX" x={0.02} y1={D.RY - 0.35} z1={3.98}><Bunting len={(D.RY - 0.7) * 100} letters={D.bunt.x} /></FaceX>);
  }
  (D.bats || []).forEach(([w, a, z], i) => {
    const flap = 0.85 + 0.15 * Math.sin(T * 2 + i);
    const art = <g transform={`translate(30 20) rotate(${(i % 2 ? 8 : -6)}) scale(1.3)`}><Bat flap={flap} /></g>;
    els.push(w === 'x' ? <FaceX key={'pb' + i} x={0.02} y1={a} z1={z}>{art}</FaceX> : <FaceY key={'pb' + i} y={0.02} x0={a} z1={z}>{art}</FaceY>);
  });
  bg.push(<g key="hwdecor" opacity={op} pointerEvents="none">{els}</g>);
  (D.jacks || []).forEach(([x, y], i) => {
    const k = rid + i;
    if (!jackSpots[k]) jackSpots[k] = nav(rid).nearestFree(x, y, 0.1);
    const [jx, jy] = jackSpots[k], g = P(jx, jy, 0), s = 0.26 * (q < 1 ? E.outBack(q) : 1);
    sorted.push({ key: 'jack' + i, x: jx, y: jy, z: 0, el: <g data-hit="obj:jack" style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]}) scale(${s}) translate(0 -78)`}><Pumpkin design={i % 2 ? { eyes: 'round', nose: 'none', mouth: 'grin' } : JACK} lit T={T + i} /></g> });
  });
  // a bat flaps across the room; tap it and it zooms off
  const bt = W.bat;
  if (bt && bt.room === rid) {
    const [bx0, bx1, by0, by1] = ROOMS[rid].bounds, t = (T - bt.t0) / 6;
    let x = bt.dir > 0 ? bx0 - 0.6 + (bx1 - bx0 + 1.2) * t : bx1 + 0.6 - (bx1 - bx0 + 1.2) * t;
    const y = by0 + (by1 - by0) * bt.h, z = 2.9 + Math.sin(T * 3) * 0.25;
    let g = P(x, y, z);
    if (bt.flee) { const f = T - bt.flee; g = [g[0] + bt.dir * f * 260, g[1] - f * f * 500]; }
    const flap = 0.35 + 0.65 * Math.abs(Math.sin(T * (bt.flee ? 30 : 14)));
    top.push(<g key="flybat" data-hit="obj:bat" style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]}) scale(${bt.dir * 1.6} 1.6)`}><circle r={22} fill="transparent" /><Bat flap={flap} /></g>);
  }
}
