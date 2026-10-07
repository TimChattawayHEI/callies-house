// Animated extras drawn over the static rooms.
import React from 'react';
import { P, pts, prog, clamp, E, lerp } from './core.js';
import { Iso } from '../rooms.gen.jsx';
import { Person, DEFAULT_OUTFITS } from './people.jsx';
import { ItemArt } from './items.jsx';
import { halloweenOverlays } from './halloween.jsx';
import { xmasOverlays } from './christmas.jsx';
import { skyOverlays } from './sky.jsx';

const { Plane, FloorPlane, FaceX, FaceY, Box } = Iso;
const at = (x, y, z) => { const p = P(x, y, z); return `translate(${p[0]} ${p[1]})`; };

export function Spider({ s, T }) {
  const wig = Math.sin(T * 30 + s.id) * 3, flip = Math.cos(s.dir) - Math.sin(s.dir) < 0 ? -1 : 1;
  return <g transform={`scale(${flip} 1)`}>
    <ellipse cx={0} cy={1} rx={9} ry={3} fill="rgba(0,0,0,.18)" />
    {[-1, 1].map(side => [0, 1, 2, 3].map(i => <path key={side + '-' + i} d={`M${-2 + i * 2},-6 q${side * 6},${-6 + i * 2 + (i % 2 ? wig : -wig)} ${side * 10},${2 + i * 1.5}`} fill="none" stroke="#1d1d20" strokeWidth={1.6} strokeLinecap="round" />))}
    <ellipse cx={-3} cy={-6} rx={6} ry={5} fill="#2b2b2e" /><circle cx={4} cy={-7} r={3.6} fill="#2b2b2e" />
    <circle cx={5} cy={-8} r={1.6} fill="#fff" /><circle cx={3} cy={-8.4} r={1.4} fill="#fff" /><circle cx={5.3} cy={-8} r={0.7} fill="#222" /><circle cx={3.2} cy={-8.4} r={0.6} fill="#222" />
  </g>;
}
export function Mouse({ m, T }) {
  const flip = m.dir < 0 ? -1 : 1, hop = Math.abs(Math.sin(T * 22)) * 2;
  return <g transform={`scale(${flip} 1) translate(0 ${-hop})`}>
    <ellipse cx={0} cy={2 + hop} rx={10} ry={3} fill="rgba(0,0,0,.18)" />
    <path d="M-10,-4 q-10,-2 -14,4" fill="none" stroke="#c9a6a6" strokeWidth={1.6} />
    <ellipse cx={-1} cy={-6} rx={10} ry={6.5} fill="#a7a3a8" /><circle cx={8} cy={-9} r={5} fill="#b3afb4" />
    <circle cx={6} cy={-14} r={3.4} fill="#e7b8c4" /><circle cx={11} cy={-8} r={1.3} fill="#222" /><circle cx={13} cy={-8} r={1.3} fill="#f08fa8" />
  </g>;
}
export function Ball({ b }) {
  return <g transform={`translate(0 ${-b.z * 88}) scale(1.5)`}>
    <ellipse cx={0} cy={b.z * 88} rx={11} ry={4} fill="rgba(0,0,0,.18)" />
    <circle cx={0} cy={-11} r={11} fill="#fff" stroke="#2b2b2e" strokeWidth={1.4} />
    <path d="M0,-16 l4.5,3.2 -1.7,5.3 -5.6,0 -1.7,-5.3Z" fill="#2b2b2e" />
  </g>;
}

/* door peeks: x = 0 wall (Chloe) and y = 0 wall (Connor). g = how far the door is open (0..1). */
function GapX({ g, y1 = 1.58, w = 95, children }) {
  const x0 = w * (1 - g);
  return <FaceX x={0.025} y1={y1} z1={3.3}><rect x={x0} y={0} width={w - x0} height={330} fill="#17131a" />{children && children(x0, w)}</FaceX>;
}
function GapY({ g, x0w = 0.5, w = 95, children }) {
  const x0 = w * (1 - g);
  return <FaceY y={0.025} x0={x0w} z1={3.3}><rect x={x0} y={0} width={w - x0} height={330} fill="#17131a" />{children && children(x0, w)}</FaceY>;
}

export function roomOverlays(rid, c) {
  const { T, W, av, paintings } = c;
  const bg = [], sorted = [], top = [];
  if (rid === 'hallway') {
    // Chloe's door: peek, slam, or open while she is out
    const cd = W.chloeDoor, chloeOut = W.people.chloe.room !== 'chloe';
    let g = chloeOut ? 0.8 : 0, eyes = 0;
    if (cd) {
      const t = T - cd.t0;
      if (cd.mode === 'peek') { g = t < 0.6 ? 0.3 * E.outCubic(t / 0.6) : t < 2.5 ? 0.3 : t < 2.62 ? 0.3 * (1 - (t - 2.5) / 0.12) : 0; eyes = t > 0.6 && t < 2.5 ? 1 : 0; }
      if (cd.mode === 'open') g = 0.8 * E.outCubic(clamp(t / 0.5, 0, 1));
    }
    if (g > 0.01) bg.push(<GapX key="chloegap" g={g}>{(x0, w) => eyes ? <g transform={`translate(${(x0 + w) / 2} 172)`}>
      {[-7, 7].map(dx => <g key={dx}><ellipse cx={dx} cy={0} rx={6} ry={7 * (Math.sin(T * 2.3) > 0.95 ? 0.15 : 1)} fill="#fff" /><circle cx={dx + 1.5} cy={1} r={3} fill="#2b1d16" /></g>)}
      <path d="M-14,-10 q6,-4 12,0 M2,-10 q6,-4 12,0" stroke="#6b4a33" strokeWidth={2.5} fill="none" /><circle cx={-7} cy={0} r={9} fill="none" stroke="#3b2a24" strokeWidth={1.5} /><circle cx={7} cy={0} r={9} fill="none" stroke="#3b2a24" strokeWidth={1.5} />
    </g> : null}</GapX>);
    // Connor's door: sign, peek with sandwich hand
    const kd = W.connorDoor;
    bg.push(<FaceY key="connorsign" y={0.03} x0={0.5} z1={2.35}>
      <rect x={18} y={0} width={60} height={36} rx={4} fill="#2b2b2e" stroke="#e23b3b" strokeWidth={2} transform="rotate(2 48 18)" />
      <text x={48} y={15} textAnchor="middle" fontSize={11} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#ffd45e">KEEP</text>
      <text x={48} y={29} textAnchor="middle" fontSize={11} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#ffd45e">OUT!</text>
    </FaceY>);
    if (kd) {
      const t = T - kd.t0;
      const rattle = kd.mode === 'shout' && t < 0.8 ? Math.sin(t * 60) * 2.5 * (1 - t / 0.8) : 0;
      if (rattle) bg.push(<g key="rattle" transform={`translate(${rattle} 0)`}><GapY g={0.02} /></g>);
      if (kd.mode === 'peek') {
        const g = t < 0.5 ? 0.5 * E.outCubic(t / 0.5) : t < 3.2 ? 0.5 : t < 3.5 ? 0.5 * (1 - (t - 3.2) / 0.3) : 0;
        if (g > 0.01) {
          const a = P(0.5 + 0.95 * (1 - g), 0.025, 0), b = P(1.45, 0.025, 0), cc = P(1.45, 0.025, 3.3), d = P(0.5 + 0.95 * (1 - g), 0.025, 3.3);
          const clip = `M${a.join(',')} L${b.join(',')} L${cc.join(',')} L${d.join(',')}Z`;
          const head = P(1.18, -0.12, 0);
          const pose = { facing: 'front', flip: true, walk: null, armL: 8, armR: t > 0.7 && t < 2.2 ? 70 : 8, blink: 0, mouthOpen: t > 1.2 && t < 2, mode: 'stand' };
          bg.push(<g key="connorpeek"><GapY g={g} /><defs><clipPath id="connorclip"><path d={clip} /></clipPath></defs>
            <g clipPath="url(#connorclip)"><g transform={`translate(${head[0]} ${head[1]})`}><Person who="connor" o={c.outfits.connor || DEFAULT_OUTFITS.connor} pose={pose} T={T} uid="connorpeek" /></g></g></g>);
          if (t > 0.6 && t < 1.6) { const h = P(lerp(1.4, 1.0, prog(t, 0.6, 1.0)), lerp(0.05, 0.55, prog(t, 0.6, 1.0)), 1.15); top.push(<g key="hand" transform={`translate(${h[0]} ${h[1]})`}><rect x={-14} y={-4} width={20} height={8} rx={4} fill="#f3d3bb" transform="rotate(25)" />{t < 1.1 ? null : <g transform="scale(.8)"><ItemArt it={{ kind: 'sandwich', fillings: kd.fillings || [] }} /></g>}</g>); }
        }
      }
    }
    // attic ladder
    if (W.flags.ladder > 0) {
      const l = clamp(W.flags.ladder, 0, 1), zb = lerp(3.9, 0, l);
      bg.push(<FloorPlane key="hatchdark" z={4.281} x={2.3} y={0.35}><rect x={0} y={0} width={60} height={60} fill="#1a130d" /></FloorPlane>);
      sorted.push({ key: 'ladder', x: 2.95, y: 1.2, z: 0, el: <g pointerEvents="none">
        {[2.4, 2.8].map(x => { const a = P(x, 0.45, 4.2), b = P(x, 1.15, zb); return <line key={x} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />; })}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].filter(k => k * 4.2 > zb - 0.1 || l > 0.98).map(k => { const z = lerp(4.2, zb, k), y = lerp(0.45, 1.15, k), a = P(2.4, y, z), b = P(2.8, y, z); return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#9aa1a6" strokeWidth={4} />; })}
      </g> });
    }
  }
  if (rid === 'living') {
    const on = av.livingTV;
    bg.push(<FaceX key="tv" x={0.386} y1={1.86} z1={1.47}>
      <rect x={0} y={0} width={140} height={84} fill="#0e0f14" />
      {on > 0.02 && <g opacity={on}>
        <rect x={0} y={0} width={140} height={84} fill="#4c9a4a" />{[0, 1, 2, 3, 4, 5, 6].map(i => <rect key={i} x={i * 20} y={0} width={10} height={84} fill="#58a855" />)}
        <line x1={70} x2={70} y1={0} y2={84} stroke="#e8f5e2" strokeWidth={1.5} /><circle cx={70} cy={42} r={14} fill="none" stroke="#e8f5e2" strokeWidth={1.5} />
        <rect x={0} y={28} width={14} height={28} fill="none" stroke="#e8f5e2" strokeWidth={1.5} /><rect x={126} y={28} width={14} height={28} fill="none" stroke="#e8f5e2" strokeWidth={1.5} />
        {[[30, 20, '#e23b3b'], [52, 60, '#e23b3b'], [92, 30, '#5b9bd5'], [104, 58, '#5b9bd5'], [74, 44, '#e23b3b']].map(([x, y, col], i) => <circle key={i} cx={x + Math.sin(T * 1.3 + i) * 10} cy={y + Math.cos(T * 1.1 + i * 2) * 6} r={3.4} fill={col} />)}
        <circle cx={70 + Math.sin(T * 1.7) * 40} cy={42 + Math.sin(T * 2.3) * 22} r={2.2} fill="#fff" />
        <rect x={4} y={4} width={36} height={10} rx={2} fill="rgba(0,0,0,.5)" /><text x={22} y={12} textAnchor="middle" fontSize={8} fill="#fff" fontFamily="sans-serif">2 - 1</text>
      </g>}
    </FaceX>);
    if (av.fire > 0.02) {
      const f = av.fire;
      bg.push(<FaceY key="fire" y={0.465} x0={1.8} z1={1.45}><g opacity={f}>
        <path d="M40,145 V66 Q80,38 120,66 V145 Z" fill="#3a1f12" />
        {[0, 1, 2, 3, 4].map(i => { const h = 40 + Math.sin(T * 9 + i * 1.7) * 12 + (i === 2 ? 18 : 0), x = 52 + i * 14; return <path key={i} d={`M${x - 9},145 Q${x - 10},${145 - h * 0.5} ${x},${145 - h} Q${x + 10},${145 - h * 0.5} ${x + 9},145Z`} fill={i % 2 ? '#ffb43d' : '#ff7a2e'} />; })}
        {[0, 1, 2].map(i => { const h = 22 + Math.sin(T * 11 + i) * 8, x = 62 + i * 18; return <path key={'y' + i} d={`M${x - 5},145 Q${x - 6},${145 - h * 0.5} ${x},${145 - h} Q${x + 6},${145 - h * 0.5} ${x + 5},145Z`} fill="#ffe27a" />; })}
        <rect x={46} y={136} width={68} height={9} rx={3} fill="#5a3a22" />
      </g></FaceY>);
      const g0 = P(2.6, 1.1, 0.01);
      bg.push(<ellipse key="fireglow" cx={g0[0]} cy={g0[1]} rx={180} ry={90} fill="url(#fireglow)" opacity={f * (0.7 + 0.15 * Math.sin(T * 8))} pointerEvents="none" />);
    }
    // record player: a big red one on the sideboard, record spins while the music plays
    {
      const playing = T - W.music < 7 || !!W.dance, x = 4.48, y = 0.05, z = 0.95, w = 0.57, d = 0.41, h = 0.13;
      const ctr = P(x + 0.3, y + 0.22, z + h + 0.003), spin = playing ? T * 4 : 0;
      bg.push(<g key="record" data-hit="obj:RecordPlayer" style={{ cursor: 'pointer' }}>
        <Iso.Plane o={[x, y, z + h]} u={[1, 0, 0]} v={[0, -0.05, 0.55]}><rect x={0} y={0} width={w * 100} height={100} rx={4} fill="#c4d6dd" opacity={0.55} stroke="#8fa6ae" strokeWidth={2} /></Iso.Plane>
        <Box x={x} y={y} z={z} w={w} d={d} h={h} c={['#f3e6cf', '#d8454b', '#b9363c']} />
        <FaceY y={y + d} x0={x} z1={z + h}><circle cx={48} cy={7} r={3} fill="#ffd45e" /><circle cx={56} cy={7} r={3} fill="#fff6d8" /></FaceY>
        <FloorPlane z={z + h + 0.002} x={x + 0.08} y={y + 0.03}>
          <circle cx={22} cy={19} r={18} fill="#1d1d1f" />
          <g transform={`translate(22 19) rotate(${spin * 57})`}>{[7, 11, 15].map(r => <circle key={r} r={r} fill="none" stroke="#3a3a3e" strokeWidth={0.8} />)}<circle r={5} fill="#5b9bd5" /><rect x={-1} y={-5} width={2} height={4} fill="#fff" /></g>
          <path d={playing ? 'M50,6 L44,14 L32,20' : 'M50,6 L50,18 L46,26'} fill="none" stroke="#9aa1a6" strokeWidth={2.2} strokeLinecap="round" /><circle cx={50} cy={6} r={3} fill="#7d848c" />
        </FloorPlane>
      </g>);
      if (!playing) { const n = P(x + 0.3, y + 0.2, z + 0.75); top.push(<g key="rphint" pointerEvents="none" transform={`translate(${n[0]} ${n[1] - Math.abs(Math.sin(T * 2.2)) * 8})`} opacity={0.85}><circle r={15} fill="#fffaf0" stroke="#e86a92" strokeWidth={2.5} /><text x={0} y={6} textAnchor="middle" fontSize={18} fill="#e86a92">♫</text></g>); }
      void ctr;
    }
    if (T - W.music < 7) { const base = P(5.0, 0.6, 1.15); for (let i = 0; i < 4; i++) { const ph = ((T - W.music) * 0.5 + i * 0.25) % 1; top.push(<text key={'n' + i} x={base[0] + Math.sin(ph * 6 + i) * 18 + i * 6} y={base[1] - ph * 110} fontSize={22} fill={['#5b9bd5', '#e86a92', '#7cc9a8', '#f2b84b'][i]} opacity={Math.sin(ph * Math.PI)} pointerEvents="none">{i % 2 ? '♪' : '♫'}</text>); } }
  }
  if (rid === 'middle') {
    // fridge: paintings on the left door, door open with food inside
    if (paintings.length) bg.push(<FaceY key="fridgeart" y={0.802} x0={5.75} z1={2.15}>
      {paintings.slice(-2).map((src, i) => <g key={i} transform={`translate(${8 + i * 2} ${150 + i * 34}) rotate(${i ? 3 : -4})`}><rect x={-2} y={-2} width={42} height={32} fill="#fff" /><image href={src} x={0} y={0} width={38} height={28} preserveAspectRatio="xMidYMid slice" /><circle cx={19} cy={-1} r={3} fill={i ? '#e86a92' : '#5b9bd5'} /></g>)}
    </FaceY>);
    const fo = av.fridge;
    if (fo > 0.02) {
      bg.push(<FaceY key="fridgein" y={0.803} x0={6.28} z1={2.12}><g opacity={Math.min(1, fo * 2)}>
        <rect x={0} y={0} width={50} height={207} fill="#eef6f8" />
        {[50, 95, 140].map(y => <rect key={y} x={0} y={y} width={50} height={3} fill="#c6d3d8" />)}
        <rect x={6} y={14} width={12} height={34} rx={3} fill="#fbfbf8" stroke="#c9ced2" /><rect x={8} y={10} width={8} height={5} fill="#5b9bd5" />
        <rect x={24} y={26} width={20} height={22} rx={3} fill="#f7c948" /><rect x={6} y={68} width={16} height={26} rx={4} fill="#c4304f" /><rect x={7} y={64} width={14} height={6} fill="#e8e0d0" />
        {[0, 1, 2].map(i => <ellipse key={i} cx={30 + i * 7} cy={88} rx={3.5} ry={4.5} fill="#fff6e0" stroke="#e8dcc0" />)}
        <rect x={8} y={112} width={32} height={22} rx={3} fill="#f2a5a5" /><rect x={10} y={156} width={30} height={30} rx={4} fill="#9be3a4" opacity={0.7} />
      </g></FaceY>);
      const ang = E.outCubic(clamp(fo, 0, 1)) * 1.8, L = 0.52;
      const ex = 6.8 - L * (1 - Math.cos(ang)) * 0, ey = 0.8 + L * Math.sin(ang), exx = 6.8 - L * Math.cos(ang) + 0 * ex;
      const hingeX = 6.8, x1 = hingeX - L * Math.cos(ang);
      sorted.push({ key: 'fridgedoor', x: 6.85, y: ey + 0.02, z: 0, el: <g pointerEvents="none">
        <polygon points={pts([[hingeX, 0.8, 0.02], [x1, ey, 0.02], [x1, ey, 2.13], [hingeX, 0.8, 2.13]])} fill="#c9cfd2" stroke="#9aa1a6" strokeWidth={1.5} />
        <polygon points={pts([[hingeX - 0.06, 0.82, 0.3], [x1 + 0.05, ey - 0.02, 0.3], [x1 + 0.05, ey - 0.02, 0.36], [hingeX - 0.06, 0.82, 0.36]])} fill="#b5bcc0" />
        <polygon points={pts([[hingeX - 0.06, 0.82, 1.2], [x1 + 0.05, ey - 0.02, 1.2], [x1 + 0.05, ey - 0.02, 1.26], [hingeX - 0.06, 0.82, 1.26]])} fill="#b5bcc0" />
        {(() => { const m = P(lerp(hingeX, x1, 0.5), lerp(0.8, ey, 0.5), 1.4); return <g transform={`translate(${m[0]} ${m[1]})`}><rect x={-5} y={-12} width={10} height={14} rx={2} fill="#fbfbf8" /><rect x={-4} y={-15} width={8} height={4} fill="#5b9bd5" /></g>; })()}
      </g> });
      void exx;
    }
    // the easel shows her latest painting
    if (paintings.length) bg.push(<FaceY key="easelart" y={0.182} x0={1.7} z1={3.1}><rect x={0} y={60} width={72} height={110} fill="#fffaf0" /><image href={paintings[paintings.length - 1]} x={2} y={62} width={68} height={106} preserveAspectRatio="xMidYMid slice" /></FaceY>);
  }
  if (rid === 'kitchen') {
    if (av.hob > 0.02) {
      bg.push(<FloorPlane key="hob" z={1.072} x={3.8} y={0.08}>{[[16, 15], [46, 15], [16, 41], [46, 41]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={9} fill="none" stroke="#ff5a2e" strokeWidth={3} opacity={av.hob * (0.7 + 0.3 * Math.sin(T * 7 + i))} />)}</FloorPlane>);
      const b = P(4.1, 0.4, 1.35);
      for (let i = 0; i < 3; i++) { const ph = (T * 0.6 + i / 3) % 1; top.push(<circle key={'st' + i} cx={b[0] + Math.sin(ph * 6 + i) * 10} cy={b[1] - ph * 90} r={7 + ph * 12} fill="#fff" opacity={av.hob * 0.5 * Math.sin(ph * Math.PI)} pointerEvents="none" />); }
    }
    if (T - W.kettle < 3.5) { const b = P(1.07, 2.83, 1.5); for (let i = 0; i < 4; i++) { const ph = ((T - W.kettle) * 0.9 + i / 4) % 1; top.push(<circle key={'k' + i} cx={b[0] + ph * 30} cy={b[1] - ph * 70} r={5 + ph * 10} fill="#fff" opacity={0.6 * Math.sin(ph * Math.PI)} pointerEvents="none" />); } }
    if (T - W.micro < 3) bg.push(<FaceX key="micro" x={3.002} y1={3.05} z1={1.47}><rect x={2} y={4} width={70} height={34} rx={3} fill="#ffd27a" opacity={T - W.micro < 2.2 ? 0.55 + 0.2 * Math.sin(T * 10) : 0.1} /></FaceX>);
    if (T - W.washer < 4.5) bg.push(<FaceY key="washer" y={0.722} x0={1.55} z1={0.96}><g transform={`translate(36 58) rotate(${(T - W.washer) * 520})`}><circle r={19} fill="#4c565e" />{[['#e86a92', 0], ['#5b9bd5', 120], ['#ffd45e', 240]].map(([c2, a]) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 9} cy={Math.sin(a * Math.PI / 180) * 9} r={6} fill={c2} />)}</g><circle cx={36} cy={58} r={19} fill="#cfe0ea" opacity={0.35} /></FaceY>);
    if (T - W.tap < 2.2) { const a = P(1.16, 0.3, 1.43), b = P(1.16, 0.3, 1.08); top.push(<line key="tap" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#8ec5ea" strokeWidth={4} strokeLinecap="round" opacity={0.85} pointerEvents="none" />); }
  }
  if (rid === 'bathroom' || rid === 'toilet') {
    if (W.flush && W.flush.room === rid && T - W.flush.t0 < 2.2) {
      const t = T - W.flush.t0, b = rid === 'bathroom' ? [3.06, 0.47, 0.51] : [0.53, 0.75, 0.51];
      bg.push(<FloorPlane key="flush" z={b[2]} x={b[0] - 0.2} y={b[1] - 0.18}><g transform={`translate(20 18) rotate(${t * 600})`} opacity={1 - t / 2.2}>{[0, 1, 2].map(i => <path key={i} d={`M${6 + i * 3},0 A${6 + i * 3},${5 + i * 3} 0 0 1 0,${5 + i * 3}`} fill="none" stroke="#5b9bd5" strokeWidth={2.5} transform={`rotate(${i * 120})`} />)}</g></FloorPlane>);
    }
  }
  if (rid === 'bathroom') {
    const sh = T - W.shower;
    if (sh < 6) {
      const head = P(0.25, 0.6, 2.85);
      for (let i = 0; i < 14; i++) { const ph = (T * 2.4 + i / 14) % 1, ox = (i % 7) * 7 - 21 + Math.sin(i * 3) * 4; top.push(<line key={'w' + i} x1={head[0] + ox} y1={head[1] + ph * 200} x2={head[0] + ox * 1.15} y2={head[1] + ph * 200 + 14} stroke="#8ec5ea" strokeWidth={2} opacity={0.75 * (1 - prog(sh, 5, 6))} pointerEvents="none" />); }
    }
    const fog = clamp((T - W.shower) < 6 ? (T - W.shower) / 4 : 1 - (T - W.shower - 6) / 30, 0, 1);
    for (let i = 0; i < 6; i++) { if (fog <= 0.02) break; const ph = (T * 0.15 + i / 6) % 1, b = P(0.6, 0.6, 1.4); top.push(<circle key={'steam' + i} cx={b[0] + Math.sin(ph * 4 + i) * 60 + i * 12} cy={b[1] - ph * 160} r={22 + ph * 30} fill="#fff" opacity={fog * 0.28 * Math.sin(ph * Math.PI)} pointerEvents="none" />); }
    if (fog > 0.02 || W.doodles.length) bg.push(<FaceY key="mirrorfog" y={0.025} x0={1.5} z1={2.75}>
      <circle cx={38} cy={38} r={36} fill="#f4f8f9" opacity={fog * 0.85} />
      {W.doodles.map((d, i) => <g key={i} transform={`translate(${d.x} ${d.y})`} opacity={fog * 0.9}>{d.kind === 'heart' ? <path d="M0,10 C-13,1 -10,-10 0,-3 C10,-10 13,1 0,10Z" fill="none" stroke="#9fb3bf" strokeWidth={2.5} /> : d.kind === 'smile' ? <g fill="none" stroke="#9fb3bf" strokeWidth={2.5}><circle r={11} /><path d="M-5,2 q5,6 10,0" /><circle cx={-4} cy={-4} r={1} /><circle cx={4} cy={-4} r={1} /></g> : <path d="M0,-11 L3,-3 11,-3 5,2 7,10 0,5 -7,10 -5,2 -11,-3 -3,-3Z" fill="none" stroke="#9fb3bf" strokeWidth={2.2} />}</g>)}
    </FaceY>);
  }
  if (rid === 'attic') {
    if (W.flags.eyes === 'hidden') {
      const pair = (x, y, z, s, key) => { const [px, py] = P(x, y, z); const blink = Math.sin(T * 1.7 + s * 3) > 0.96 ? 0.15 : 1; return <g key={key} filter="url(#atGlow)" data-hit="obj:eyes" style={{ cursor: 'pointer' }}>
        <ellipse cx={px} cy={py} rx={22} ry={14} fill="transparent" />
        <ellipse cx={px - 7 * s} cy={py} rx={3.4 * s} ry={2.2 * s * blink} fill="#ffe27a" /><ellipse cx={px + 7 * s} cy={py} rx={3.4 * s} ry={2.2 * s * blink} fill="#ffe27a" /></g>; };
      top.push(<g key="eyes">{pair(1.7, 0.18, 0.35, 1, 'e1')}{pair(2.15, 0.22, 0.25, 0.75, 'e2')}</g>);
    }
    if (T - (W.eyesT || -99) < 1.2) { const g = P(2.0, 0.5, 0.5); top.push(<ellipse key="flash" cx={g[0]} cy={g[1]} rx={260} ry={140} fill="url(#lampglow)" opacity={1 - (T - W.eyesT) / 1.2} pointerEvents="none" />); }
    for (const m of W.mice) sorted.push({ key: 'mouse' + m.id, x: m.x, y: m.y, z: 0, el: <g transform={at(m.x, m.y, 0)} pointerEvents="none"><Mouse m={m} T={T} /></g> });
    if (T - (W.coins || -99) < 1.6) { const g = P(5.5, 1.1, 0.8); for (let i = 0; i < 8; i++) { const p = (T - W.coins) / 1.6, a = i / 8 * Math.PI * 2; top.push(<circle key={'coin' + i} cx={g[0] + Math.cos(a) * p * 70} cy={g[1] - Math.abs(Math.sin(a)) * 60 * p - 40 * p + 60 * p * p} r={5} fill="#ffd45e" stroke="#e0a92e" opacity={1 - p} pointerEvents="none" />); } }
  }
  if (rid === 'garden') {
    sorted.push({ key: 'ball', x: W.ball.x, y: W.ball.y, z: 0, el: <g data-hit="obj:ball" style={{ cursor: 'pointer' }} transform={at(W.ball.x, W.ball.y, 0)}><circle cx={0} cy={-12} r={22} fill="transparent" /><Ball b={W.ball} /></g> });
    if (T - W.flags.bbq < 5) { const b = P(3.9, 0.45, 1.3); for (let i = 0; i < 5; i++) { const ph = ((T - W.flags.bbq) * 0.6 + i / 5) % 1; top.push(<circle key={'sm' + i} cx={b[0] + Math.sin(ph * 5 + i) * 18 + ph * 30} cy={b[1] - ph * 130} r={8 + ph * 18} fill="#d9d4cf" opacity={0.6 * Math.sin(ph * Math.PI) * (1 - prog(T - W.flags.bbq, 4, 5))} pointerEvents="none" />); } }
    if (T - W.leaves < 4) { const b = P(0.8, 1.7, 4.0); for (let i = 0; i < 9; i++) { const p = clamp((T - W.leaves - i * 0.12) / 3, 0, 1); if (p <= 0 || p >= 1) continue; top.push(<ellipse key={'lf' + i} cx={b[0] - 90 + i * 22 + Math.sin(p * 9 + i) * 20} cy={b[1] + p * 300} rx={6} ry={3} transform={`rotate(${p * 400 + i * 40} ${b[0] - 90 + i * 22 + Math.sin(p * 9 + i) * 20} ${b[1] + p * 300})`} fill={['#7aa84e', '#8fbf5a', '#c9a24a'][i % 3]} opacity={1 - p * 0.5} pointerEvents="none" />); } }
  }
  if (rid === 'downhall' && W.parcel && !W.parcel.opened) {
    const pc = W.parcel;
    sorted.push({ key: 'parcel', x: pc.x, y: pc.y, z: 0, el: <g data-hit="obj:parcel" style={{ cursor: 'pointer' }} transform={at(pc.x, pc.y, 0)}><g transform={`scale(1.2) translate(0 ${-Math.abs(Math.sin(T * 3)) * 3})`}>
      <ellipse cx={0} cy={2} rx={24} ry={7} fill="rgba(0,0,0,.15)" />
      <path d="M-22,-12 L0,-22 L22,-12 L0,-2Z" fill="#e2c08e" /><path d="M-22,-12 L0,-2 L0,18 L-22,8Z" fill="#c49c69" /><path d="M22,-12 L0,-2 L0,18 L22,8Z" fill="#b08757" />
      <path d="M-11,-17 L11,-7 M11,-17 L-11,-7" stroke="#e86a92" strokeWidth={4} /><circle cx={0} cy={-12} r={4} fill="#e86a92" />
    </g></g> });
  }
  halloweenOverlays(rid, c, bg, sorted, top);
  xmasOverlays(rid, c, bg, sorted, top);
  skyOverlays(rid, c, bg, sorted, top);
  return { bg, sorted, top };
}

/* particle effects (sparkles, hearts, ripples, smoke, splashes, confetti) */
const SPARK = ['#ffd45e', '#ff8fbf', '#8ec5ea', '#9be3a4'];
const STAR_D = 'M0,-9 L3,-3 9,-2 4,2 6,9 0,5 -6,9 -4,2 -9,-2 -3,-3Z';
const HEART_D = 'M0,10 C-13,1 -10,-10 0,-3 C10,-10 13,1 0,10Z';
export function Effects({ fx, T, room }) {
  return <g pointerEvents="none">{fx.filter(f => f.room === room).map((f, fi) => {
    const age = T - f.t0, a = Array.isArray(f.at) && f.at.length === 3 ? P(...f.at) : f.at;
    if (f.kind === 'ripple') { const p = age / 0.7; return <ellipse key={fi} cx={a[0]} cy={a[1]} rx={10 + p * 34} ry={(10 + p * 34) * 0.5} fill="none" stroke="#fffaf0" strokeWidth={4 * (1 - p)} opacity={Math.max(0, 1 - p)} />; }
    if (f.kind === 'hearts') return <g key={fi}>{[0, 1, 2].map(i => { const p = clamp((age - i * 0.12) / 1, 0, 1); if (p <= 0 || p >= 1) return null; return <path key={i} d={HEART_D} transform={`translate(${a[0] + (i - 1) * 20 + Math.sin(p * 6 + i) * 6} ${a[1] - 10 - p * 70}) scale(${1.1 - p * 0.3})`} fill={['#ff8fbf', '#e86a92', '#ffb3cf'][i]} opacity={1 - p} />; })}</g>;
    if (f.kind === 'splash') return <g key={fi}>{[0, 1, 2, 3, 4, 5].map(i => { const p = clamp(age / 0.7, 0, 1), ang = -Math.PI / 2 + (i - 2.5) * 0.45; return <circle key={i} cx={a[0] + Math.cos(ang) * 40 * p} cy={a[1] + Math.sin(ang) * 50 * p + 60 * p * p} r={4 * (1 - p) + 1} fill="#8ec5ea" opacity={1 - p} />; })}</g>;
    if (f.kind === 'confetti') return <g key={fi}>{Array.from({ length: 22 }, (_, i) => { const p = clamp(age / 1.8, 0, 1), ang = (i / 22) * Math.PI * 2; return <rect key={i} x={a[0] + Math.cos(ang) * 120 * E.outCubic(p)} y={a[1] - 40 + Math.sin(ang) * 60 * E.outCubic(p) + 120 * p * p} width={7} height={4} fill={SPARK[i % 4]} transform={`rotate(${p * 720 + i * 30} ${a[0] + Math.cos(ang) * 120 * E.outCubic(p)} ${a[1] - 40 + Math.sin(ang) * 60 * E.outCubic(p) + 120 * p * p})`} opacity={1 - p} />; })}</g>;
    if (f.kind === 'word') { const p = clamp(age / (f.life || 1.6), 0, 1); return <text key={fi} x={a[0]} y={a[1] - p * 30} textAnchor="middle" fontSize={26} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#fff" stroke="#5a3d32" strokeWidth={5} paintOrder="stroke" opacity={1 - p * p}>{f.text}</text>; }
    return <g key={fi}>{Array.from({ length: f.n || 10 }, (_, i) => {
      const p = prog(T, f.t0 + i * 0.04, f.t0 + 0.9 + i * 0.04); if (p <= 0 || p >= 1) return null;
      const ang = (i / (f.n || 10)) * Math.PI * 2, sp = (f.spread || 100) * E.outCubic(p);
      return i % 3 === 0 ? <path key={i} d={STAR_D} transform={`translate(${a[0] + Math.cos(ang) * sp} ${a[1] + Math.sin(ang) * sp * 0.7 - p * 20}) scale(${1.1 * (1 - p)})`} fill={SPARK[i % 4]} />
        : <circle key={i} cx={a[0] + Math.cos(ang) * sp} cy={a[1] + Math.sin(ang) * sp * 0.7 - p * 20} r={6 * (1 - p)} fill={SPARK[i % 4]} />;
    })}</g>;
  })}</g>;
}
