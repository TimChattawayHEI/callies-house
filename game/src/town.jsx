// Going out: the town map, the car trip, and the grown-up (or Callie) who comes along.
import React, { useMemo, useState } from 'react';
import { P, inv, lerp, clamp, dist, SFX, speak, E } from './core.js';
import { TownMapScene, Iso } from '../rooms.gen.jsx';
import { ROOMS, DOORMAP } from './rooms.jsx';
import { NAMES } from './people.jsx';
import { nav, walkTo, say, later, player, HOMES, sendHome } from './world.js';

const { Box, FaceY, FloorPlane, pts: ipts } = Iso;
// New Street: plots for the families made with the character maker.
const PLOTS_X = [2.0, 4.6, 9.4, 12.2, 15.0];
function NewStreet({ fams }) {
  const byPlot = {}; for (const f of fams) byPlot[f.plot] = f;
  return <g>
    <polygon points={ipts([[0, 13.4, 0], [17, 13.4, 0], [17, 13.4, -0.35], [0, 13.4, -0.35]])} fill="#6b4a2e" />
    <polygon points={ipts([[17, 10, 0], [17, 13.4, 0], [17, 13.4, -0.35], [17, 10, -0.35]])} fill="#5a3d26" />
    <FloorPlane><rect x={0} y={1000} width={1700} height={340} fill="#86b955" /><rect x={0} y={1055} width={1700} height={90} fill="#5b5f66" /><line x1={0} x2={1700} y1={1100} y2={1100} stroke="#fbf8f2" strokeWidth={5} strokeDasharray="30 24" /><rect x={645} y={990} width={110} height={70} fill="#5b5f66" /><rect x={0} y={1145} width={1700} height={14} fill="#c9c6bc" /></FloorPlane>
    {PLOTS_X.map((x, i) => { const f = byPlot[i];
      if (!f) return <g key={i}><FloorPlane z={0.006} x={x - 0.2} y={11.7}><rect width={160} height={140} fill="#9ccb6a" stroke="#fbf8f2" strokeWidth={4} strokeDasharray="12 10" /></FloorPlane><Box x={x + 0.55} y={12.3} w={0.06} d={0.06} h={0.7} c={['#8a6242', '#7a5232', '#6a4422']} /><FaceY y={12.36} x0={x + 0.2} z1={0.95}><rect x={0} y={0} width={80} height={36} rx={4} fill="#fbf8f2" stroke="#e86a92" strokeWidth={3} /><text x={40} y={26} textAnchor="middle" fontSize={22} fontWeight="800" fill="#e86a92" fontFamily="'Baloo 2', sans-serif">NEW</text></FaceY></g>;
      const L = f.look, type = f.plan ? f.plan.type : 'house';
      if (type !== 'house') return <g key={i} data-loc={'h:' + f.id} style={{ cursor: 'pointer' }}>
        <FloorPlane z={0.006} x={x - 0.2} y={11.6}><rect width={170} height={160} fill="#7aa84e" /><rect x={65} y={0} width={36} height={40} fill="#c9c6bc" /></FloorPlane>
        <StreetHouse x={x} type={type} L={L} />
      </g>;
      return <g key={i} data-loc={'h:' + f.id} style={{ cursor: 'pointer' }}>
        <FloorPlane z={0.006} x={x - 0.2} y={11.6}><rect width={170} height={160} fill="#7aa84e" /><rect x={65} y={0} width={36} height={40} fill="#c9c6bc" /></FloorPlane>
        <Box x={x} y={11.9} w={1.3} d={1.1} h={1.0} c={[L.wall, L.wall, L.wall]} />
        <polygon points={ipts([[x - 0.08, 11.82, 1.0], [x + 1.38, 11.82, 1.0], [x + 1.38, 12.45, 1.6], [x - 0.08, 12.45, 1.6]])} fill={L.roof} />
        <polygon points={ipts([[x - 0.08, 13.08, 1.0], [x + 1.38, 13.08, 1.0], [x + 1.38, 12.45, 1.6], [x - 0.08, 12.45, 1.6]])} fill={L.roof} stroke="rgba(0,0,0,.2)" />
        <polygon points={ipts([[x + 1.38, 11.82, 1.0], [x + 1.38, 13.08, 1.0], [x + 1.38, 12.45, 1.6]])} fill={L.roof} opacity={0.75} />
        <FaceY y={13.0} x0={x} z1={1.0}><rect x={14} y={18} width={30} height={30} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={4} /><rect x={86} y={18} width={30} height={30} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={4} /><rect x={52} y={44} width={26} height={56} fill={L.door} /></FaceY>
      </g>; })}
  </g>;
}
// New Street houses by type: a block of flats, a terrace row or a big detached house with a garage
function StreetHouse({ x, type, L }) {
  const win = (x0, z1) => <><rect x={x0} y={z1} width={26} height={24} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={4} /></>;
  const roof = (x0, x1, y0, y1, z, h) => <g>
    <polygon points={ipts([[x0 - 0.08, y0 - 0.08, z], [x1 + 0.08, y0 - 0.08, z], [x1 + 0.08, (y0 + y1) / 2, z + h], [x0 - 0.08, (y0 + y1) / 2, z + h]])} fill={L.roof} />
    <polygon points={ipts([[x0 - 0.08, y1 + 0.08, z], [x1 + 0.08, y1 + 0.08, z], [x1 + 0.08, (y0 + y1) / 2, z + h], [x0 - 0.08, (y0 + y1) / 2, z + h]])} fill={L.roof} stroke="rgba(0,0,0,.2)" />
    <polygon points={ipts([[x1 + 0.08, y0 - 0.08, z], [x1 + 0.08, y1 + 0.08, z], [x1 + 0.08, (y0 + y1) / 2, z + h]])} fill={L.roof} opacity={0.75} /></g>;
  if (type === 'flat') return <g>
    <Box x={x} y={11.9} w={1.3} d={1.1} h={2.0} c={[L.wall, L.wall, L.wall]} />
    <Box x={x - 0.05} y={11.85} z={2.0} w={1.4} d={1.2} h={0.1} c={['#8a8f96', '#7a7f86', '#6a6f76']} />
    <FaceY y={13.0} x0={x} z1={2.0}>{[14, 70, 126].map(z => <g key={z}>{win(14, z)}{win(90, z)}<rect x={8} y={z + 30} width={114} height={6} fill="#5b5f66" opacity={0.7} /></g>)}<rect x={52} y={150} width={26} height={50} fill={L.door} /></FaceY>
  </g>;
  if (type === 'terrace') return <g>
    {[-0.55, 0, 0.55].map((dx, k) => <Box key={k} x={x + dx + 0.2} y={11.9} w={0.55} d={1.0} h={1.45} c={k === 1 ? [L.wall, L.wall, L.wall] : ['#e9e4dc', '#e1dbd2', '#d6d0c6']} />)}
    {roof(x - 0.35, x + 1.3, 11.9, 12.9, 1.45, 0.45)}
    <FaceY y={12.9} x0={x + 0.2} z1={1.45}>{win(14, 16)}{win(14, 70)}<rect x={14} y={110} width={24} height={35} fill={L.door} /></FaceY>
  </g>;
  return <g>
    <Box x={x + 1.1} y={12.2} w={0.55} d={0.8} h={0.75} c={['#dcdcdc', '#cfcfcf', '#bdbdbd']} />
    <FaceY y={13.0} x0={x + 1.1} z1={0.75}><rect x={6} y={14} width={43} height={61} fill="#9aa0a6" />{[24, 38, 52, 66].map(y => <line key={y} x1={6} x2={49} y1={y} y2={y} stroke="#7a7f86" strokeWidth={2} />)}</FaceY>
    <Box x={x - 0.1} y={11.9} w={1.2} d={1.1} h={1.5} c={[L.wall, L.wall, L.wall]} />
    {roof(x - 0.1, x + 1.1, 11.9, 13.0, 1.5, 0.5)}
    <FaceY y={13.0} x0={x - 0.1} z1={1.5}>{win(12, 18)}{win(80, 18)}{win(12, 80)}{win(80, 80)}<rect x={47} y={92} width={26} height={58} fill={L.door} /></FaceY>
  </g>;
}
// The clothes shop on the map (it was added after the town map was drawn).
function MapClothes() {
  return <g data-loc="clothes" style={{ cursor: 'pointer' }}>
    <FloorPlane z={0.006} x={14.1} y={6.0}><rect width={260} height={300} fill="#7aa84e" /><rect x={110} y={200} width={40} height={100} fill="#c9c6bc" /></FloorPlane>
    <Box x={14.3} y={6.3} w={2.3} d={1.8} h={1.25} c={['#f6e6e0', '#f3d6cf', '#e3c0b6']} />
    <Box x={14.2} y={6.2} z={1.25} w={2.5} d={2.0} h={0.14} c={['#c25a7a', '#a84a68', '#93405b']} />
    <FaceY y={8.1} x0={14.3} z1={1.25}><rect x={0} y={4} width={230} height={30} fill="#c25a7a" /><text x={115} y={26} textAnchor="middle" fontSize={20} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">CLOTHES</text>
      <rect x={18} y={46} width={70} height={60} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={3} /><rect x={142} y={46} width={70} height={60} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={3} />
      <rect x={96} y={50} width={38} height={75} fill="#a84a68" />
      <path d="M30,96 l8,-26 h10 l8,26z" fill="#f2c94c" /><path d="M160,96 v-24 h16 v24z" fill="#5b9bd5" /></FaceY>
  </g>;
}

/* ---------------- places on the map ---------------- */
// door: where the path starts on the map; road: where it meets the main road (y = 5)
export const PLACES = {
  home: { word: 'Home', say: 'home', door: [2.2, 2.95], road: [2.2, 5.0], pin: [2.2, 2.3, 4.1] },
  cafe: { word: 'Cafe', say: 'the cafe', door: [5.0, 3.75], road: [5.0, 5.0], pin: [5.0, 2.5, 3.2] },
  school: { word: 'School', say: 'school', door: [10.3, 2.75], road: [10.3, 5.0], pin: [11.0, 2.3, 4.2] },
  park: { word: 'Park', say: 'the park', door: [3.2, 6.1], road: [3.2, 5.0], pin: [3.2, 8.0, 3.4] },
  shop: { word: 'Shop', say: 'the shop', door: [10.8, 8.95], road: [10.8, 5.0], pin: [11.0, 8.0, 3.4] },
  nanny: { word: 'Nanny', say: "Nanny and Grandad's", door: [15.45, 3.4], road: [15.45, 5.0], pin: [15.5, 1.8, 3.9], room: 'nannydown' },
  clothes: { word: 'Clothes', say: 'the clothes shop', door: [15.4, 8.55], road: [15.4, 5.0], pin: [15.4, 7.0, 2.9] },
};
export const ORDER = ['home', 'cafe', 'school', 'park', 'shop', 'nanny', 'clothes'];
function routePts(a, b) {
  const A = PLACES[a], B = PLACES[b], pts = [A.door, A.road];
  if (A.street && !B.street) pts.push([7.0, 11.0], [7.0, 5.0]);
  if (B.street && !A.street) pts.push([7.0, 5.0], [7.0, 11.0]);
  pts.push(B.road, B.door); return pts;
}
function along(pts, u) {
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = dist(pts[i - 1], pts[i]); seg.push(d); tot += d; }
  let s = clamp(u, 0, 1) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) { const k = seg[i] ? s / seg[i] : 1; const a = pts[i], b = pts[i + 1]; return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), dx: b[0] - a[0], dy: b[1] - a[1] }; }
    s -= seg[i];
  }
  return { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1], dx: 1, dy: 0 };
}

function Car({ at }) {
  const { x, y, dx, dy } = at, alongX = Math.abs(dx) >= Math.abs(dy);
  const L = 0.42, Wd = 0.24, body = ['#e86a92', '#c94f7e', '#b2436f'], glass = ['#d4ecf0', '#9fc3cf', '#8ab3c0'];
  const [w, d] = alongX ? [L * 2, Wd * 2] : [Wd * 2, L * 2];
  const wheels = alongX ? [[-0.28, Wd], [0.28, Wd], [0.28, -Wd]] : [[Wd, -0.28], [Wd, 0.28], [-Wd, 0.28]];
  return <g pointerEvents="none">
    <ellipse cx={P(x, y, 0)[0]} cy={P(x, y, 0)[1]} rx={42} ry={16} fill="rgba(0,0,0,.18)" />
    {wheels.map(([a, b], i) => { const p = P(x + a, y + b, 0.08); return <circle key={i} cx={p[0]} cy={p[1]} r={7} fill="#2a2a2c" />; })}
    <Box x={x - w / 2} y={y - d / 2} z={0.08} w={w} d={d} h={0.24} c={body} />
    <Box x={x - (alongX ? 0.2 : Wd - 0.03)} y={y - (alongX ? Wd - 0.03 : 0.2)} z={0.32} w={alongX ? 0.4 : (Wd - 0.03) * 2} d={alongX ? (Wd - 0.03) * 2 : 0.4} h={0.2} c={glass} />
  </g>;
}

export function TownMap({ here, T, drive, onPick, onGo, onClose, picked, fams = [] }) {
  const stage = useMemo(() => { window.__sceneBegin('townmap'); return TownMapScene({ here }); }, [here]);
  const kids = useMemo(() => React.Children.toArray(stage.props.children).filter(el => !(el.type === 'text') && !(el.type && el.type.name === 'Tag')), [stage]);
  const vb = [-150, 170, 2440, 1730], cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2, w = vb[2], h = vb[3];
  const tap = e => {
    if (drive) return;
    const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const r = pt.matrixTransform(svg.getScreenCTM().inverse());
    const el = e.target.closest && e.target.closest('[data-loc]');
    let id = el ? el.getAttribute('data-loc') : null;
    if (!id) { const [wx, wy] = inv(r.x, r.y, 0); let best = 3.2; for (const k of ORDER) { const p = PLACES[k].pin, d = dist([wx, wy], [p[0], p[1] + 0.6]); if (d < best) { best = d; id = k; } } }
    if (id) onPick(id);
  };
  let car = null;
  if (drive) { const u = E.inOutCubic ? E.inOutCubic(clamp((T - drive.t0) / drive.dur, 0, 1)) : clamp((T - drive.t0) / drive.dur, 0, 1); car = <Car at={along(routePts(drive.from, drive.to), u)} />; }
  else { const d = PLACES[here]; car = <Car at={{ x: d.door[0], y: d.door[1], dx: 0, dy: 1 }} />; }
  const sel = picked && PLACES[picked];
  return <div className="townmap" role="dialog" aria-label="Town map" onPointerDown={e => e.stopPropagation()}>
    <svg viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" onClick={tap}>
      <rect x={cx - w} y={cy - h} width={w * 2} height={h * 2} fill="#efe2d0" />
      {kids}
      <MapClothes />
      <NewStreet fams={fams} />
      {car}
      {ORDER.map(k => { const p = P(...PLACES[k].pin), on = picked === k, word = PLACES[k].word, wd = word.length * 26 + 44; return <g key={k} data-loc={k} transform={`translate(${p[0]} ${p[1]})`}>
        <rect x={-wd / 2} y={-30} width={wd} height={58} rx={29} fill={on ? '#e86a92' : '#3b2a24'} stroke="#fff" strokeWidth={4} />
        <text x={0} y={14} textAnchor="middle" fontSize={40} fontWeight="700" fontFamily="'Andika','Baloo 2',sans-serif" fill="#fff">{word}</text>
        {k === here && <text x={0} y={52} textAnchor="middle" fontSize={22} fontWeight="700" fontFamily="'Andika','Baloo 2',sans-serif" fill="#3b2a24">you are here</text>}
      </g>; })}
      {sel && !drive && (() => { const p = P(...sel.pin); const b = Math.abs(Math.sin(T * 4)) * 14; return <g pointerEvents="none" transform={`translate(${p[0]} ${p[1] - 52 - b})`}><path d="M-22,-30 h44 v26 h-12 l-10,16 l-10,-16 h-12z" fill="#e86a92" stroke="#fff" strokeWidth={4} strokeLinejoin="round" /><circle cx={0} cy={-17} r={7} fill="#fff" /></g>; })()}
    </svg>
    <div className="map-bar">
      {drive ? <b className="map-word">{drive.to === 'home' ? 'Going home!' : `Going to ${PLACES[drive.to].say}!`}</b>
        : sel ? <><button className="map-word" onClick={() => speak(sel.word, 'word')}>{sel.word}</button>
          {picked === here ? <span className="map-note">We are here!</span> : <button className="done go" onClick={() => onGo(picked)}>Go!</button>}</>
          : <b className="map-word small">Where shall we go?</b>}
      {!drive && <button className="pill" onClick={onClose}>Back</button>}
    </div>
  </div>;
}

/* ---------------- who comes along ---------------- */
// A grown-up comes along. School is different: Callie and Chloe both go, and Mum just drops them off.
export function pickParty(W, place) {
  const me = W.player, ppl = W.people;
  if (place === 'school') {
    const lead = me === 'chloe' ? 'chloe' : 'callie';
    const other = lead === 'callie' ? 'chloe' : 'callie';
    return { lead, party: ppl[other] && ppl[other].mode !== 'lie' ? [other] : [], drop: true };
  }
  if (me === 'mum' || me === 'dad') return { lead: me, party: ['callie'] };
  const free = p => p.room && ROOMS[p.room] && !ROOMS[p.room].town && p.mode !== 'lie' && !p.hiding;
  return { lead: me, party: [free(ppl.mum) ? 'mum' : free(ppl.dad) ? 'dad' : 'mum'] };
}
// Put someone straight back where they belong at home (when the trip carries on without them).
export function homeNow(W, id) {
  const p = W.people[id], h = HOMES[id];
  Object.assign(p, { path: null, goal: null, then: null, busy: null, op: 1, z: 0, mode: 'stand', seat: null, reading: null, action: null });
  if (h) { p.room = h.room; p.x = h.x; p.y = h.y; p.facing = h.face || 'front'; if (id === 'dad') { [p.x, p.y, p.z] = h.seat; p.mode = 'sit'; p.seatStand = [h.x, h.y]; } if (id === 'chloe') p.home = true; }
  else if (id === 'callie') { p.room = 'callie'; p.x = 3.0; p.y = 3.0; }
}
// Put the player (and whoever is with them) at the way in of a place.
export function arriveAt(W, place, party = []) {
  const c = player(W);
  const rid = place === 'home' ? 'downhall' : PLACES[place].room || place;
  const door = place === 'home' ? DOORMAP['downhall:front'] : ROOMS[rid].doors[0];
  const at = place === 'home' ? [1.075, 2.1] : door.at, inn = place === 'home' ? [1.6, 1.5] : door.in;
  W.room = rid; W.bubbles = W.bubbles.filter(b => b.anchor.type !== 'world'); W.fx = [];
  const put = (q, off, then) => { q.room = rid; q.x = at[0] + off[0]; q.y = at[1] + off[1]; q.z = 0; q.mode = 'stand'; q.path = null; q.goal = null; q.then = null; q.op = 1; q.seat = null; q.seatStand = null; q.reading = null; q.action = null; q.hiding = false; walkTo(W, q, ...nav(rid).nearestFree(inn[0] + off[0] * 0.5, inn[1] + off[1] * 0.5), then); };
  put(c, [0, 0]);
  const OFFS = place === 'home' ? [[0.4, -0.3], [0.5, 0.35]] : [[0.25, 0.45], [0.55, -0.2]];
  const ps = party.filter(id => id !== c.id).map(id => W.people[id]).filter(Boolean);
  ps.forEach((p, i) => put(p, OFFS[i % 2]));
  if (place === 'home') {
    W.out = null;
    for (const p of ps) { p.busy = null; later(W, 2.5, () => { if (W.player !== p.id && !W.out && (p.id === 'mum' || p.id === 'dad' || p.id === 'chloe')) sendHome(W, p.id); }); }
  } else {
    W.out = { place, party: ps.map(p => p.id), comp: ps.length ? ps[0].id : null, nextFollow: W.T + 2 };
    for (const p of ps) p.busy = 'out';
  }
  W.dirty = true;
}
// Everyone with you keeps up.
export function stepCompanion(W) {
  const o = W.out; if (!o || !o.party || !o.party.length) return;
  const c = player(W);
  o.party.forEach((id, i) => {
    const p = W.people[id]; if (!p) return;
    if (c.room === W.room && p.room !== W.room && !W.fade && c.op > 0.9) { const t = nav(W.room).nearestFree(c.x + 0.5 + i * 0.4, c.y + 0.5); p.room = W.room; p.x = t[0]; p.y = t[1]; p.z = 0; p.mode = 'stand'; p.path = null; p.then = null; p.op = 1; p.seat = null; p.seatStand = null; }
  });
  if (W.T < o.nextFollow) return;
  o.nextFollow = W.T + 0.7;
  o.party.forEach((id, i) => {
    const p = W.people[id];
    if (!p || p.room !== W.room || p.mode !== 'stand' || p.ride) return;
    const d = dist([p.x, p.y], [c.x, c.y]);
    if (c.mode === 'walk' || d > 2.2 + i * 0.6) {
      if (d < 1.4 + i * 0.5) return;
      const tx = c.path && c.path.length ? c.path[c.path.length - 1] : [c.x, c.y];
      const a = Math.atan2(p.y - tx[1], p.x - tx[0]) + i * 0.6;
      const t = nav(W.room).nearestFree(tx[0] + Math.cos(a) * (0.9 + i * 0.5), tx[1] + Math.sin(a) * (0.9 + i * 0.5));
      walkTo(W, p, t[0], t[1], () => { p.facing = 'front'; });
    }
  });
}
export function compLine(W, lines, id) {
  const o = W.out; if (!o || !o.party) return;
  const who = id || o.party.find(k => W.people[k] && W.people[k].room === W.room); if (!who) return;
  say(W, who, typeof lines === 'string' ? lines : lines[Math.floor(Math.random() * lines.length)]);
}
export { NAMES };
