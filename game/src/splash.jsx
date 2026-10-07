// The opening animation (from the Claude Design "Callies House Splash"): the camera glides over the town,
// Callie's house pops up, the door opens, Callie waves, then the title and "Tap to start".
// Tapping during the animation skips to the title; tapping the title starts the game (and lets sound play).
import React, { useEffect, useRef, useState } from 'react';
import { Iso, NPC } from '../rooms.gen.jsx';

const { P, pts, FloorPlane, FaceY, Box, shade } = Iso;
const { Person } = NPC;
const W = 1440, H = 1080;
const ROSE = '#c25a7a', CREAM = '#fff6ea', INK = '#3b2a24', FONT = "'Baloo 2', 'Andika', sans-serif";
const CALLIE = { skin: '#f6d2b8', hair: '#c49a5e', style: 'pony', top: '#f39ac6', legs: '#9b7cc4', shoes: '#e96d9a', dress: true };

/* ---------------- timing ---------------- */
const Easing = {
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const animate = ({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) => t => (t <= start ? from : t >= end ? to : from + (to - from) * ease((t - start) / (end - start)));
const MOTION = {
  enter: (s, e) => animate({ start: s, end: e, ease: Easing.easeOutCubic }),
  pop: (s, e) => animate({ start: s, end: e, ease: Easing.easeOutBack }),
  move: (s, e) => animate({ start: s, end: e, ease: Easing.easeInOutCubic }),
};
// scenes: Map 3s, Pop 1.8s, Door 1.8s, Wave 2.8s, Title 3.2s
const C = { Map: 0, Pop: 3, Door: 4.8, Wave: 6.6, Title: 9.4 };
export const SPLASH_END = 12.6;
const SKIP_TO = C.Title + 1.6; // a tap during the animation jumps to the title coming in

const c3 = hex => [shade(hex, 0.18), hex, shade(hex, -0.12)];
const HOME = { x: 11.5, y: 3, w: 4, d: 3.5, h: 2.6, R: 1.7, body: '#fbe9ee', roof: ROSE };
const DOOR = { x: 13.05, w: 0.9, h: 2.0 };
const HY = HOME.y + HOME.d;

// camera keyframes: [time, focus x, y, z, zoom]
function camera(T) {
  const K = [[0, 10, 10, 0, 0.36], [0.4, 10, 10, 0, 0.36], [C.Pop - 0.1, 13.5, 5, 0.5, 0.62], [C.Pop + 1.6, 13.5, 5.2, 1, 0.72],
    [C.Wave, 13.5, HY, 1.1, 1.9], [C.Title + 0.2, 13.5, HY, 1.1, 2.0], [C.Title + 1.5, 11, 8, 1, 1.0], [SPLASH_END, 11, 8, 1, 1.04]];
  let i = 0; while (i < K.length - 2 && T > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], p = MOTION.move(a[0], b[0])(T), L = (u, v) => u + (v - u) * p;
  return { f: [L(a[1], b[1]), L(a[2], b[2]), L(a[3], b[3])], z: Math.exp(L(Math.log(a[4]), Math.log(b[4]))) };
}

/* ---------------- the little town ---------------- */
function Ground() {
  return <g>
    <polygon points={pts([[-1, 21, 0], [21, 21, 0], [21, 21, -0.8], [-1, 21, -0.8]])} fill="#9c6b45" />
    <polygon points={pts([[21, -1, 0], [21, 21, 0], [21, 21, -0.8], [21, -1, -0.8]])} fill="#845739" />
    <FloorPlane x={-1} y={-1}>
      <rect width={2200} height={2200} fill="#a6d18a" />
      {[[300, 300, 220], [1500, 400, 260], [600, 1500, 240], [1700, 1700, 280]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#b4da98" />)}
      <rect x={0} y={900} width={2200} height={200} fill="#c9c2b8" /><rect x={900} y={0} width={200} height={2200} fill="#c9c2b8" />
      <line x1={0} x2={2200} y1={1000} y2={1000} stroke="#fff" strokeWidth={8} strokeDasharray="40 40" />
      <line x1={1000} x2={1000} y1={0} y2={2200} stroke="#fff" strokeWidth={8} strokeDasharray="40 40" />
      <rect x={900} y={900} width={200} height={200} fill="#c9c2b8" />
      <rect x={(DOOR.x + 1) * 100 - 10} y={(HY + 1) * 100} width={DOOR.w * 100 + 20} height={(9 - HY) * 100} fill="#e9d6b6" />
      <ellipse cx={450} cy={1850} rx={200} ry={130} fill="#8fc6e0" stroke="#c9e6f0" strokeWidth={12} />
    </FloorPlane>
  </g>;
}
function Roof({ x, y, w, d, z, R, col }) {
  const yc = y + d / 2, o = 0.25;
  return <g strokeLinejoin="round" stroke="rgba(70,45,25,.25)" strokeWidth={1.2}>
    <polygon points={pts([[x - o, y - o, z], [x + w + o, y - o, z], [x + w + o, yc, z + R], [x - o, yc, z + R]])} fill={shade(col, -0.2)} />
    <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, yc, z + R]])} fill={shade(col, 0.55)} />
    <polygon points={pts([[x - o, y + d + o, z], [x + w + o, y + d + o, z], [x + w + o, yc, z + R], [x - o, yc, z + R]])} fill={col} />
  </g>;
}
function House({ T, at, x, y, w, d, h, R = 1.3, body, roof }) {
  const k = MOTION.pop(at, at + 0.55)(T), r = MOTION.pop(at + 0.25, at + 0.7)(T);
  if (k <= 0) return null;
  const hh = h * k;
  return <g>
    <Box x={x} y={y} w={w} d={d} h={hh} c={c3(body)} />
    {k > 0.9 && <FaceY y={y + d} x0={x} z1={hh}>
      <rect x={w * 25 - 30} y={60} width={60} height={60} rx={6} fill="#bfe3f2" stroke="#fff" strokeWidth={6} />
      <rect x={w * 70 - 30} y={60} width={60} height={60} rx={6} fill="#bfe3f2" stroke="#fff" strokeWidth={6} />
    </FaceY>}
    <g opacity={r > 0 ? 1 : 0} transform={`translate(0 ${(1 - r) * -260})`}><Roof x={x} y={y} w={w} d={d} z={hh} R={R} col={roof} /></g>
  </g>;
}
function Tree({ T, at, x, y }) {
  const k = MOTION.pop(at, at + 0.5)(T); if (k <= 0) return null;
  const [cx, cy] = P(x, y, 1.3 * k);
  return <g><Box x={x - 0.12} y={y - 0.12} w={0.24} d={0.24} h={1 * k} c={c3('#8a5a3a')} />
    <circle cx={cx} cy={cy} r={52 * k} fill="#5f9a3e" /><circle cx={cx - 14 * k} cy={cy - 16 * k} r={30 * k} fill="#79b552" /></g>;
}
const TOWN = [
  { k: 'h', x: 1.5, y: 1.5, w: 3, d: 2.5, h: 2.2, body: '#f3e1c4', roof: '#5fa8d8', at: 0.5 },
  { k: 'h', x: 17, y: 1.5, w: 2.5, d: 2.2, h: 2, body: '#cfe7dc', roof: '#3d4a6b', at: 1.3 },
  { k: 'h', x: 1.5, y: 11.5, w: 3, d: 2.5, h: 2.4, body: '#f6dfa8', roof: '#d9465f', at: 0.7 },
  { k: 'h', x: 4.5, y: 14.8, w: 3, d: 2.4, h: 2.0, body: '#ddd2f0', roof: '#8a5a3a', at: 0.95 },
  { k: 'h', x: 11.5, y: 11.5, w: 3.5, d: 2.5, h: 2.6, body: '#cfe3f2', roof: '#e3b04f', at: 0.6 },
  { k: 'h', x: 16, y: 12, w: 3, d: 3, h: 2.2, body: '#f3c9b4', roof: '#3f8a8a', at: 1.1 },
  { k: 'h', x: 12, y: 16, w: 3, d: 2.5, h: 2, body: '#fbf8f2', roof: '#5f9a3e', at: 0.85 },
  ...[[6, 2, 0.6], [6.5, 5, 0.9], [2, 6.5, 0.75], [17.5, 6, 1.4], [18.5, 4.5, 1.5], [10.8, 1.2, 1.6], [7, 11.5, 0.8], [17, 17.5, 1.0], [19, 18.5, 1.2], [15.5, 18.8, 1.1], [7, 18, 0.9]].map(([x, y, at]) => ({ k: 't', x, y, at })),
];
function Home({ T }) {
  const at = C.Pop + 0.15;
  const k = MOTION.pop(at, at + 0.7)(T), r = MOTION.pop(at + 0.45, at + 1.0)(T);
  const open = MOTION.enter(C.Wave + 0.1, C.Wave + 0.8)(T);
  const step = MOTION.enter(C.Wave + 0.55, C.Wave + 1.35)(T);
  const puff = MOTION.enter(at + 0.1, at + 0.9)(T);
  const pinIn = MOTION.pop(1.6, 2.1)(T), pinOut = MOTION.enter(at - 0.05, at + 0.15)(T);
  const [pcx, pcy] = P(HOME.x + HOME.w / 2, HOME.y + HOME.d / 2, 0);
  const bob = Math.abs(Math.sin(T * 5)) * 22;
  const hh = HOME.h * k;
  return <g>
    {puff > 0 && puff < 1 && [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * Math.PI * 2, [px, py] = P(HOME.x + HOME.w / 2 + Math.cos(a) * (2.2 + puff * 1.6), HOME.y + HOME.d / 2 + Math.sin(a) * (2.2 + puff * 1.6), 0.2);
      return <circle key={i} cx={px} cy={py} r={34 * (1 - puff) + 8} fill="#fff" opacity={1 - puff} />; })}
    {k > 0 && <Box x={HOME.x} y={HOME.y} w={HOME.w} d={HOME.d} h={hh} c={c3(HOME.body)} />}
    {k > 0.85 && <FaceY y={HY + 0.005} x0={HOME.x} z1={HOME.h}>
      {[40, 290].map(x => <g key={x}><rect x={x} y={70} width={70} height={84} rx={8} fill="#ffe7a8" stroke="#fff" strokeWidth={8} /><line x1={x + 35} x2={x + 35} y1={70} y2={154} stroke="#fff" strokeWidth={5} /></g>)}
      <rect x={(DOOR.x - HOME.x) * 100 - 10} y={(HOME.h - DOOR.h) * 100 - 10} width={DOOR.w * 100 + 20} height={DOOR.h * 100 + 10} fill="#fff" />
      <rect x={(DOOR.x - HOME.x) * 100} y={(HOME.h - DOOR.h) * 100} width={DOOR.w * 100} height={DOOR.h * 100} fill="#ffd98a" />
      <rect x={(DOOR.x - HOME.x) * 100} y={(HOME.h - DOOR.h) * 100 + 120} width={DOOR.w * 100} height={80} fill="#e9b867" />
    </FaceY>}
    {k > 0.85 && <FaceY y={HY + 0.01} x0={DOOR.x} z1={DOOR.h}>
      <g transform={`skewY(${-open * 28}) scale(${1 - open * 0.78} 1)`}>
        <rect width={DOOR.w * 100} height={DOOR.h * 100} fill={ROSE} stroke={shade(ROSE, -0.2)} strokeWidth={2} />
        <rect x={12} y={16} width={66} height={70} rx={5} fill={shade(ROSE, -0.1)} /><rect x={12} y={102} width={66} height={84} rx={5} fill={shade(ROSE, -0.1)} />
        <circle cx={74} cy={104} r={6} fill="#f2c94c" />
      </g>
    </FaceY>}
    {open > 0.4 && <g opacity={MOTION.enter(C.Wave + 0.45, C.Wave + 0.7)(T)}>
      <Person at={[DOOR.x + DOOR.w / 2, HY - 0.35 + step * 0.75, 0]} s={0.82} look={CALLIE} pose={T > C.Wave + 1.3 ? 'wave' : 'stand'} T={T * 1.1} />
    </g>}
    {k > 0.85 && <FaceY y={HY + 0.005} x0={HOME.x} z1={HOME.h}><rect x={0} y={HOME.h * 100 - 14} width={HOME.w * 100} height={14} fill={shade(HOME.body, -0.15)} /></FaceY>}
    <g opacity={r > 0 ? 1 : 0} transform={`translate(0 ${(1 - r) * -320})`}>
      <Roof x={HOME.x} y={HOME.y} w={HOME.w} d={HOME.d} z={hh} R={HOME.R} col={HOME.roof} />
      <Box x={HOME.x + 0.7} y={HOME.y + 2.3} w={0.5} d={0.5} z={hh + HOME.R * 0.4} h={HOME.R * 0.85} c={c3('#b5654a')} />
    </g>
    {pinIn > 0 && pinOut < 1 && <g transform={`translate(${pcx} ${pcy - 30 - bob}) scale(${pinIn * (1 - pinOut)})`}>
      <ellipse cx={0} cy={30 + bob} rx={26} ry={10} fill="rgba(59,42,36,.25)" />
      <path d="M0,0 C-30,-40 -44,-60 -44,-84 A44,44 0 1 1 44,-84 C44,-60 30,-40 0,0 Z" fill={ROSE} />
      <circle cx={0} cy={-86} r={18} fill={CREAM} />
    </g>}
  </g>;
}
const ALL = [...TOWN.map(o => ({ ...o, key: o.x + o.y + (o.w || 0) + (o.d || 0) })), { k: 'home', key: HOME.x + HOME.y + HOME.w + HOME.d }].sort((a, b) => a.key - b.key);
function World({ T }) {
  return <g><Ground />{ALL.map((o, i) => (o.k === 'home' ? <Home key="home" T={T} /> : o.k === 't' ? <Tree key={i} T={T} {...o} /> : <House key={i} T={T} {...o} />))}</g>;
}
function Clouds({ T, z, cam }) {
  const fade = 1 - Math.min(1, Math.max(0, (z - 0.42) / 0.25));
  if (fade <= 0) return null;
  const sx = -(cam.f[0] - cam.f[1]) * 60, sy = -(cam.f[0] + cam.f[1]) * 22;
  return <g opacity={fade * 0.95} transform={`translate(${sx} ${sy})`}>
    {[[180, 260, 1], [1150, 180, 1.3], [820, 760, 0.9], [300, 900, 1.2], [1300, 700, 1], [700, 120, 0.8]].map(([x, y, s], i) => {
      const dx = (x + T * 24 * s) % 1700 - 120;
      return <g key={i} transform={`translate(${dx} ${y}) scale(${s})`} fill="#fff"><ellipse cx={0} cy={0} rx={110} ry={44} /><ellipse cx={-50} cy={-22} rx={56} ry={44} /><ellipse cx={40} cy={-34} rx={66} ry={54} /></g>; })}
  </g>;
}
function Title({ T, portrait }) {
  const word = "Callie's";
  const panel = MOTION.enter(C.Title + 0.9, C.Title + 1.6)(T);
  const house = MOTION.enter(C.Title + 1.8, C.Title + 2.3)(T);
  const tap = MOTION.enter(C.Title + 2.4, C.Title + 2.8)(T);
  const beat = (1 - Math.cos(Math.max(0, T - C.Title - 2.8) * 5)) / 2;
  // on a phone held upright the title sits along the bottom instead of down the left
  const wash = portrait ? 'linear-gradient(0deg, rgba(255,246,234,.97) 0%, rgba(255,246,234,.88) 40%, rgba(255,246,234,0) 62%)'
    : 'linear-gradient(90deg, rgba(255,246,234,.96) 0%, rgba(255,246,234,.85) 36%, rgba(255,246,234,0) 58%)';
  const box = portrait ? { left: 0, right: 0, bottom: 150, alignItems: 'center' } : { left: 96, top: 290 };
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, opacity: panel, background: wash }} />
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 36, ...box }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.9, alignItems: portrait ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', fontSize: 180, fontWeight: 800, color: ROSE, letterSpacing: -3 }}>
          {word.split('').map((ch, i) => { const p = MOTION.pop(C.Title + 1.2 + i * 0.07, C.Title + 1.6 + i * 0.07)(T);
            return <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 110}px) scale(${0.4 + 0.6 * p})` }}>{ch}</span>; })}
        </div>
        <div style={{ fontSize: 180, fontWeight: 800, color: INK, letterSpacing: -3, opacity: house, transform: `translateY(${(1 - house) * 50}px)` }}>House</div>
      </div>
      <div style={{ alignSelf: portrait ? 'center' : 'flex-start', opacity: tap, transform: `translateY(${(1 - tap) * 30}px) scale(${1 + beat * 0.05})`, transformOrigin: portrait ? '50% 50%' : '0 50%',
        padding: '18px 44px', borderRadius: 999, background: ROSE, color: CREAM, fontSize: 48, fontWeight: 800, boxShadow: `0 8px 0 ${shade(ROSE, -0.25)}` }}>Tap to start</div>
    </div>
  </div>;
}

/* ---------------- the splash screen ---------------- */
export function Splash({ onStart }) {
  const [T, setT] = useState(0);
  const t0 = useRef(null), skip = useRef(0), done = useRef(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    let raf;
    const loop = now => { if (t0.current == null) t0.current = now; setT((now - t0.current) / 1000 + skip.current); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const r = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', r);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', r); };
  }, []);
  const tap = e => {
    e.stopPropagation();
    if (done.current) return;
    if (T < C.Title + 2.4) { skip.current += Math.max(0, SKIP_TO - T); return; }
    done.current = true; onStart();
  };
  // fill a landscape screen (trimming a little top and bottom); fit the whole stage on an upright phone
  const portrait = size.w / size.h < 1.2;
  const sc = portrait ? size.w / W : Math.max(size.w / W, size.h / H);
  const cam = camera(T), [px, py] = P(...cam.f);
  const stageH = portrait ? size.h / sc : H;
  return <div className="splash" role="button" aria-label="Tap to start" onPointerDown={tap}
    style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: 'linear-gradient(#fbe3ea, #f6c9d5)', touchAction: 'none', cursor: 'pointer' }}>
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: W, height: stageH, transform: `translate(-50%, -50%) scale(${sc})`, transformOrigin: '50% 50%' }}>
      <svg width={W} height={stageH} viewBox={`0 ${(H - stageH) / 2} ${W} ${stageH}`} style={{ position: 'absolute', inset: 0, display: 'block' }} aria-hidden="true">
        <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z}) translate(${-px} ${-py})`}><World T={T} /></g>
        <Clouds T={T} z={cam.z} cam={cam} />
      </svg>
      <Title T={T} portrait={portrait} />
    </div>
  </div>;
}
