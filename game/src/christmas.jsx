// Christmas: Mum asks for the Christmas box from the attic, up go tinsel, fairy lights and paper snowflakes,
// a tree appears in the living room for Callie to decorate, and it snows outside.
import React, { useState } from 'react';
import { P, rand, pick, clamp, E, SFX, speak, achieve } from './core.js';
import { Iso } from '../rooms.gen.jsx';
import { say, later, nav } from './world.js';
import { ROOMS } from './rooms.jsx';
import { seasonOf, DECOR } from './halloween.jsx';

const { FaceX, FaceY } = Iso;
export const isChristmas = W => seasonOf(W.seasonPick) === 'christmas';

export function initXmas(W, saved) {
  const year = new Date().getFullYear(), x = saved && saved.xm;
  W.xm = x && x.year === year ? { stage: x.stage || 'none', year, tree: x.tree || null } : { stage: 'none', year, tree: null };
  W.xm.askT = 30;
  for (const it of W.items) if (it.kind === 'xmasbox') it.quest = 'mum';
  if (W.xm.stage === 'asked') addXmasBox(W);
  else W.items = W.items.filter(i => i.kind !== 'xmasbox' || i.loc.s === 'pack');
}
export function resetXmas(W) {
  W.xm = { stage: 'none', year: new Date().getFullYear(), tree: null, askT: W.T + 20 };
  W.items = W.items.filter(i => i.kind !== 'xmasbox');
}
export function addXmasBox(W) {
  if (!W.items.find(i => i.kind === 'xmasbox')) W.items.push({ id: 'q-xmas', kind: 'xmasbox', quest: 'mum', room: 'attic', loc: { s: 'in', box: 'attic:boxes', order: -1 }, rot: 0 });
  W.dirty = true;
}
const offMum = W => (W.people.mum.room === W.room ? null : { type: 'off', id: 'mum' });
export function stepXmas(W) {
  if (!isChristmas(W)) return;
  const xm = W.xm;
  if (xm.stage === 'none' && W.T > xm.askT && !W.out && !W.bedtime && !W.photo && !W.dance && !W.hide && W.player !== 'mum') {
    xm.stage = 'asked'; addXmasBox(W);
    SFX.bell();
    say(W, 'mum', 'It is nearly Christmas! Can you get the Christmas box from the attic?', offMum(W));
  }
}
export function decorateXmas(W, onToast) {
  const xm = W.xm;
  W.items = W.items.filter(i => i.kind !== 'xmasbox');
  xm.stage = 'decorated'; xm.decoT = W.T; W.dirty = true;
  const mum = W.people.mum;
  SFX.fanfare();
  say(W, 'mum', 'The Christmas box! Let us make the house sparkle!', offMum(W));
  if (mum.room === W.room && mum.id !== W.player) mum.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
  later(W, 1.0, () => { SFX.sparkle(); onToast && onToast('Merry Christmas!'); });
  later(W, 3.0, () => achieve(W, 'xmas'));
  later(W, 4.5, () => { if (!xm.tree) say(W, 'mum', 'The tree is up in the living room. Can you decorate it?', offMum(W)); });
  later(W, 8, () => { const d = W.people.dad; if (d.room === W.room && d.id !== W.player) say(W, 'dad', 'Ho ho ho!'); });
}

/* ---------------- the tree ---------------- */
export const BAUBLE = { red: '#e23b3b', gold: '#f2c230', blue: '#3d8fe0', pink: '#f06aa8' };
const SPOTS = [[-72, -66], [-28, -74], [18, -68], [64, -62], [-46, -104], [2, -108], [44, -100], [-40, -146], [4, -152], [40, -140], [-18, -196], [20, -192], [0, -232]];
const TOPS = { star: 'star', angel: 'angel', bow: 'bow' };
function Topper({ kind, T = 0 }) {
  if (kind === 'star') return <g transform={`rotate(${Math.sin(T * 2) * 4})`}><path d="M0,-26 L7,-9 25,-8 11,4 16,22 0,12 -16,22 -11,4 -25,-8 -7,-9Z" fill="#ffd23f" stroke="#e0a92e" strokeWidth={3} strokeLinejoin="round" /></g>;
  if (kind === 'angel') return <g transform="translate(0 2)">
    <path d="M-4,-6 Q-30,-22 -24,6 Q-14,0 -4,2Z M4,-6 Q30,-22 24,6 Q14,0 4,2Z" fill="#eaf4ff" stroke="#b9cde0" strokeWidth={1.5} />
    <path d="M-12,22 L0,-8 L12,22Z" fill="#fff" stroke="#d8d0c0" strokeWidth={1.5} /><circle cx={0} cy={-13} r={7} fill="#f6d2b8" />
    <ellipse cx={0} cy={-23} rx={9} ry={3} fill="none" stroke="#ffd23f" strokeWidth={2.5} /></g>;
  if (kind === 'bow') return <g><path d="M0,0 L-22,-14 L-22,14Z M0,0 L22,-14 L22,14Z" fill="#e23b3b" stroke="#a8282b" strokeWidth={2} strokeLinejoin="round" /><circle r={6} fill="#c22e2e" /><path d="M-4,4 L-12,24 M4,4 L12,24" stroke="#e23b3b" strokeWidth={5} strokeLinecap="round" /></g>;
  return null;
}
// A tree about 200 wide and 300 tall, feet at (0, 0). design: { balls: [colour|null], top, tinsel, lights }
export function Tree({ design, T = 0, edit, onSpot, presents }) {
  const d = design || {};
  const g1 = '#2f7d4a', g2 = '#3b9157', g3 = '#47a364';
  const tier = (yb, yt, w, c, k) => <path key={k} d={`M0,${yt} L${w / 2},${yb} Q${w / 4},${yb + 10} 0,${yb + 2} Q${-w / 4},${yb + 10} ${-w / 2},${yb}Z`} fill={c} />;
  const twinkle = i => 0.45 + 0.55 * Math.abs(Math.sin(T * 2.4 + i * 1.7));
  const LIGHTS = [[-80, -58], [-50, -78], [-14, -88], [30, -80], [70, -60], [-60, -118], [-20, -124], [24, -120], [58, -110], [-46, -160], [0, -166], [42, -156], [-30, -206], [6, -212], [30, -200], [-10, -244], [12, -250]];
  return <g>
    <ellipse cx={0} cy={0} rx={70} ry={14} fill="rgba(60,30,10,.18)" />
    <rect x={-12} y={-58} width={24} height={24} fill="#7a4a2a" />
    <path d="M-34,-40 L34,-40 L28,0 L-28,0Z" fill="#c23b3b" /><rect x={-38} y={-46} width={76} height={10} rx={3} fill="#a82f30" />
    {tier(-44, -150, 210, g1, 1)}{tier(-112, -218, 168, g2, 2)}{tier(-176, -280, 118, g3, 3)}
    {d.tinsel && <g fill="none" stroke="#f2c230" strokeWidth={4} strokeLinecap="round" opacity={0.95}>
      <path d="M-86,-62 Q-10,-40 84,-74" /><path d="M-64,-122 Q0,-104 62,-134" /><path d="M-42,-186 Q4,-172 40,-196" /></g>}
    {d.lights && LIGHTS.map(([x, y], i) => <circle key={'l' + i} cx={x} cy={y} r={4} fill={['#ffef8a', '#ff8fbf', '#8ec5ea', '#9be3a4'][i % 4]} opacity={twinkle(i)} />)}
    {SPOTS.map(([x, y], i) => { const b = d.balls && d.balls[i];
      return <g key={'b' + i} transform={`translate(${x} ${y})`} onClick={edit ? () => onSpot(i) : undefined} style={edit ? { cursor: 'pointer' } : null}>
        {edit && <circle r={22} fill="transparent" />}
        {b ? <><line x1={0} y1={-16} x2={0} y2={-11} stroke="#8a6a2a" strokeWidth={2} /><circle r={12} fill={BAUBLE[b]} /><circle cx={-4} cy={-4} r={3.5} fill="#fff" opacity={0.6} /><rect x={-4} y={-15} width={8} height={5} rx={1.5} fill="#c9a24a" /></>
          : edit && <circle r={11} fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.75)" strokeWidth={2} strokeDasharray="4 3" />}
      </g>; })}
    <g transform="translate(0 -288)">{d.top ? <Topper kind={d.top} T={T} /> : edit && <circle r={16} fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.8)" strokeWidth={2} strokeDasharray="4 3" />}</g>
    {presents && [[-92, 10, '#3d8fe0', '#ffd23f', 44], [66, 14, '#e86a92', '#fff', 38], [-30, 26, '#7cc9a8', '#e23b3b', 34]].map(([x, y, c, r, s], i) => <g key={'p' + i} data-hit="obj:present" transform={`translate(${x} ${y})`} style={{ cursor: 'pointer' }}>
      <rect x={-s / 2} y={-s} width={s} height={s} rx={3} fill={c} /><rect x={-4} y={-s} width={8} height={s} fill={r} /><rect x={-s / 2} y={-s * 0.55} width={s} height={7} fill={r} />
      <path d={`M0,${-s} q-12,-14 -16,-4 q4,6 16,4 q12,2 16,-4 q-4,-10 -16,4`} fill={r} /></g>)}
  </g>;
}

export function TreePanel({ start, T, onDone, onClose }) {
  const [d, setD] = useState(start || { balls: SPOTS.map(() => null), top: null, tinsel: false, lights: false });
  const [col, setCol] = useState('red');
  const spot = i => { setD(o => { const b = [...o.balls]; b[i] = b[i] === col ? null : col; return { ...o, balls: b }; }); speak(col, 'word'); SFX.pop(); };
  const mix = () => { setD(o => ({ ...o, balls: SPOTS.map(() => pick(Object.keys(BAUBLE))), top: o.top || pick(Object.keys(TOPS)), tinsel: true, lights: true })); SFX.whoosh(); speak('Sparkly!', 'narrator'); };
  const n = d.balls.filter(Boolean).length, ready = n >= 3 && d.top;
  return <div className="sheet tree-panel" role="dialog" aria-label="Decorate the tree" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Decorate the tree!', 'narrator')}>Decorate the tree!</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="pumpkin-body">
      <div className={'pumpkin-view tree-view' + (d.lights ? ' lit' : '')}>
        <svg viewBox="-120 -330 240 350" width="200" height="292" aria-label="Your tree"><Tree design={d} T={T} edit onSpot={spot} /></svg>
      </div>
      <div className="pumpkin-parts">
        <div className="part-row"><button className="part-name" onClick={() => speak('balls', 'word')}>balls</button>
          <div className="part-opts">{Object.keys(BAUBLE).map(k => <button key={k} className="tile bauble" aria-pressed={col === k} onClick={() => { setCol(k); speak(k, 'word'); SFX.click(); }}><span className="ball" style={{ background: BAUBLE[k] }} /><b>{k}</b></button>)}</div></div>
        <div className="part-row"><button className="part-name" onClick={() => speak('top', 'word')}>top</button>
          <div className="part-opts">{Object.keys(TOPS).map(k => <button key={k} className="tile bauble" aria-pressed={d.top === k} onClick={() => { setD(o => ({ ...o, top: k })); speak(k, 'word'); SFX.pop(); }}><svg viewBox="-30 -30 60 60" width="34" height="34" aria-hidden="true"><Topper kind={k} /></svg><b>{k}</b></button>)}</div></div>
        <div className="pair"><button className="pill" aria-pressed={d.tinsel} onClick={() => { setD(o => ({ ...o, tinsel: !o.tinsel })); speak('tinsel', 'word'); SFX.sparkle(); }}>Tinsel</button>
          <button className="pill" aria-pressed={d.lights} onClick={() => { setD(o => ({ ...o, lights: !o.lights })); speak('lights', 'word'); SFX.click(); }}>Lights</button>
          <button className="pill" onClick={mix}>Mix it up</button></div>
        <p className="tree-help">Pick a colour, then tap the tree.</p>
        <button className="done" disabled={!ready} onClick={() => onDone(d)}>{ready ? 'Done!' : !d.top ? 'Pick a top' : 'Add more balls'}</button>
      </div>
    </div>
  </div>;
}

/* ---------------- decorations ---------------- */
function Garland({ len, T, lights }) {
  const n = Math.max(1, Math.round(len / 150)), seg = len / n, sag = 26, els = [];
  for (let i = 0; i < n; i++) {
    const x0 = i * seg, d = `M${x0},0 Q${x0 + seg / 2},${sag * 2} ${x0 + seg},0`;
    els.push(<path key={'t' + i} d={d} fill="none" stroke="#2f7d4a" strokeWidth={9} strokeLinecap="round" />);
    els.push(<path key={'g' + i} d={d} fill="none" stroke={i % 2 ? '#e23b3b' : '#f2c230'} strokeWidth={3} strokeDasharray="3 5" strokeLinecap="round" />);
    if (lights) for (let j = 1; j < 6; j++) { const t = j / 6, x = x0 + seg * t, y = 4 * sag * t * (1 - t); const k = i * 6 + j; els.push(<circle key={'l' + k} cx={x} cy={y + 5} r={3.6} fill={['#ffef8a', '#ff8fbf', '#8ec5ea', '#9be3a4'][k % 4]} opacity={0.5 + 0.5 * Math.abs(Math.sin(T * 2.2 + k * 1.3))} />); }
    els.push(<circle key={'p' + i} cx={x0} cy={0} r={4} fill="#e23b3b" />);
  }
  return <g>{els}</g>;
}
function Flake({ s = 1 }) {
  return <g transform={`scale(${s})`} stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none">
    {[0, 60, 120].map(a => <g key={a} transform={`rotate(${a})`}><line x1={0} y1={-16} x2={0} y2={16} /><path d="M-5,-12 L0,-7 L5,-12 M-5,12 L0,7 L5,12" /></g>)}
    <circle r={3} fill="#e6f1fb" stroke="none" />
  </g>;
}
function Stocking({ c }) {
  return <g><path d="M-8,0 L8,0 L8,22 Q22,24 22,32 Q20,40 6,38 L-8,38Z" fill={c} /><rect x={-10} y={-6} width={20} height={9} rx={3} fill="#fff" /></g>;
}
function Wreath() {
  return <g>
    <circle r={26} fill="none" stroke="#2f7d4a" strokeWidth={13} /><circle r={26} fill="none" stroke="#47a364" strokeWidth={4} strokeDasharray="5 6" />
    {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 26} cy={Math.sin(a * Math.PI / 180) * 26} r={4} fill="#e23b3b" />)}
    <path d="M0,22 L-12,32 L-12,20Z M0,22 L12,32 L12,20Z" fill="#e23b3b" /><circle cx={0} cy={22} r={4} fill="#c22e2e" />
  </g>;
}
export function Snowman() {
  return <g>
    <ellipse cx={0} cy={0} rx={34} ry={9} fill="rgba(60,30,10,.15)" />
    <circle cx={0} cy={-26} r={28} fill="#fbfdff" stroke="#d7e3ee" strokeWidth={2} /><circle cx={0} cy={-70} r={20} fill="#fbfdff" stroke="#d7e3ee" strokeWidth={2} />
    <path d="M-20,-52 Q0,-44 20,-52 L18,-44 Q0,-38 -18,-44Z" fill="#e23b3b" /><path d="M10,-50 L18,-30 L24,-32 L16,-50Z" fill="#e23b3b" />
    <circle cx={-7} cy={-74} r={2.6} fill="#2b2b2e" /><circle cx={7} cy={-74} r={2.6} fill="#2b2b2e" /><path d="M0,-69 L14,-66 L0,-64Z" fill="#f28a2e" />
    <path d="M-7,-62 Q0,-58 7,-62" fill="none" stroke="#2b2b2e" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 3" />
    {[-34, -22].map(y => <circle key={y} cx={0} cy={y} r={2.8} fill="#2b2b2e" />)}
    <rect x={-15} y={-104} width={30} height={20} fill="#2b2b2e" /><rect x={-21} y={-86} width={42} height={5} rx={2} fill="#2b2b2e" />
    <path d="M-26,-34 L-48,-50 M-44,-47 L-50,-44" stroke="#7a4a2a" strokeWidth={3} strokeLinecap="round" /><path d="M26,-34 L48,-50 M44,-47 L50,-44" stroke="#7a4a2a" strokeWidth={3} strokeLinecap="round" />
  </g>;
}
export const TREE_AT = [3.78, 0.62];
const SNOWMAN = { garden: [3.2, 3.0], park: [5.6, 8.6], nannygarden: [3.4, 6.4] };
const OUTSIDE = new Set(['garden', 'park', 'nannygarden']);
const spots = {};
const free = (rid, k, x, y) => spots[rid + k] || (spots[rid + k] = nav(rid).nearestFree(x, y, 0.1));
const FLAKES = Array.from({ length: 46 }, (_, i) => ({ u: (i * 0.618) % 1, v: (i * 0.377 + 0.13) % 1, ph: (i * 0.271) % 1, s: 0.6 + ((i * 7) % 5) / 8 }));

export function xmasOverlays(rid, c, bg, sorted, top) {
  const { T, W } = c;
  if (!isChristmas(W)) return;
  const xm = W.xm;
  if (rid === 'attic' && xm.stage === 'asked') {
    bg.push(<FaceY key="xmaslabel" y={0.802} x0={6.36} z1={0.48}><g transform={`rotate(-4 32 16) translate(0 ${Math.abs(Math.sin(T * 3)) * -2})`}><rect x={4} y={4} width={58} height={24} rx={4} fill="#e23b3b" stroke="#2f7d4a" strokeWidth={2.5} /><text x={33} y={21} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#fff">XMAS</text></g></FaceY>);
  }
  // it snows outside all through Christmas
  if (OUTSIDE.has(rid) && ROOMS[rid].bounds) {
    const [x0, x1, y0, y1] = ROOMS[rid].bounds;
    top.push(<g key="snow" pointerEvents="none">{FLAKES.map((f, i) => { const z = 4.6 * (1 - ((T * 0.16 + f.ph) % 1)); const p = P(x0 + (x1 - x0) * f.u + Math.sin(T + i) * 0.15, y0 + (y1 - y0) * f.v, z); return <circle key={i} cx={p[0]} cy={p[1]} r={3.2 * f.s} fill="#fff" opacity={0.9} />; })}</g>);
  }
  if (xm.stage !== 'decorated') return;
  const q = xm.decoT != null ? clamp((T - xm.decoT) / 1.2, 0, 1) : 1, op = E.outCubic(q);
  if (SNOWMAN[rid]) { const [sx, sy] = free(rid, 'sm', ...SNOWMAN[rid]), g = P(sx, sy, 0); sorted.push({ key: 'snowman', x: sx, y: sy, z: 0, el: <g data-hit="obj:snowman" style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]}) scale(${1.25 * (q < 1 ? E.outBack(q) : 1)})`}><Snowman /></g> }); }
  if (rid === 'living') {
    const [tx, ty] = TREE_AT, g = P(tx, ty, 0);
    sorted.push({ key: 'xtree', x: tx, y: ty, z: 0, el: <g data-hit="obj:xtree" style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]}) scale(${0.86 * (q < 1 ? E.outBack(q) : 1)})`}><Tree design={xm.tree} T={T} presents={!!xm.tree} /></g> });
    sorted.push({ key: 'stockings', x: 2.6, y: 0.66, z: 1.3, el: <g opacity={op} pointerEvents="none"><FaceY y={0.62} x0={1.95} z1={1.43}>{['#e23b3b', '#2f7d4a', '#3d8fe0', '#f2c230', '#e86a92'].map((cc, i) => <g key={i} transform={`translate(${14 + i * 30} 4) scale(.8)`}><Stocking c={cc} /></g>)}</FaceY></g> });
  }
  if (rid === 'downhall') bg.push(<g key="wreath" opacity={op} pointerEvents="none"><FaceX x={0.03} y1={2.46} z1={2.05}><g transform="translate(46 34)"><Wreath /></g></FaceX></g>);
  const D = DECOR[rid];
  if (!D || !D.RX) return;
  const els = [];
  els.push(<FaceY key="garY" y={0.02} x0={0.3} z1={3.95}><Garland len={(D.RX - 0.6) * 100} T={T} lights /></FaceY>);
  if (D.bunt && D.bunt.x != null) els.push(<FaceX key="garX" x={0.02} y1={D.RY - 0.3} z1={3.95}><Garland len={(D.RY - 0.6) * 100} T={T + 1} lights /></FaceX>);
  (D.bats || []).forEach(([w, a, z], i) => {
    const art = <g transform={`translate(30 22) rotate(${i * 17})`}><Flake s={0.9 + (i % 2) * 0.3} /></g>;
    els.push(w === 'x' ? <FaceX key={'fl' + i} x={0.02} y1={a} z1={z - 0.2}>{art}</FaceX> : <FaceY key={'fl' + i} y={0.02} x0={a} z1={z - 0.2}>{art}</FaceY>);
  });
  bg.push(<g key="xmdecor" opacity={op} pointerEvents="none">{els}</g>);
}
