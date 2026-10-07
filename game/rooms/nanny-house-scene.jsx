// Nanny & Grandad's house — two floors, each a scrolling/draggable map. Exports window.NannyHouseScene.
// The user's floor sketches are rotated 180° so the kitchen and the TV wall sit on the full-height back walls.
// Ground (x 0–18, y 0–14): Kitchen (x0–8,y0–7) · Hall + front door (x8–14.2,y0–4.9) · Shower room (x14.2–18,y0–4.9)
//   Stairs (x11.4–14.2,y4.9–9.2) · Cupboard (x14.2–18,y4.9–7.1) · Living room (x0–8,y7–14) · Sitting/dining room (x8–18,y7–14)
// Upstairs: Blue bedroom (x0–9.2,y0–6.1) · Airing cupboard (x9.2–12.4,y0–2.5) · Bathroom (x12.4–18,y0–6.05) · Landing (x9.2–12.4,y2.5–8.3)
//   Stairwell (x12.4–18,y6.05–8.3) · Nanny & Grandad's room (x0–9.2,y6.1–14) · Pink bedroom (x9.2–18,y8.3–14)
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Tag, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const BX = 18, BY = 14, RH = 4.2, LOW = 0.55;
const FRONT_DOOR = { x0: 10.6, x1: 12.4 };   // ground, back wall y=0 → Town map
const BACK_DOOR = { x0: 14.6, x1: 16.4 };    // ground, front wall y=14 → Nanny Garden
const WALLC = ['#fffaf0', '#ead8b8', '#e3d0ae'];
const tone = (c) => [shade(c, 0.15), c, shade(c, -0.15)];
const WALNUT = ['#9a6a42', '#7e5434', '#68452a'], MAHOG = ['#a35a3a', '#86462c', '#6f3a24'];
const CAB = ['#e6cf9e', '#d2b07a', '#bd9a64'], WORK = ['#f1ead8', '#dcd2bb', '#cfc4aa'];
const PAINT = ['#fbf8f2', '#ece6da', '#ddd5c6'], SAGE = '#7fa07a';
const LEATHER = ['#9a5a34', '#7e4626', '#683a1e'], ROSE = ['#e7b3ab', '#d49a92', '#bf857e'], VELVET = ['#8f3f45', '#773338', '#622a2e'];
const TXT = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };

// ---------- Shell ----------
function Slab() {
  return <g>
    <polygon points={pts([[0, BY, 0], [BX, BY, 0], [BX, BY, -0.35], [0, BY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[BX, 0, 0], [BX, BY, 0], [BX, BY, -0.35], [BX, 0, -0.35]])} fill="#5a3d26" />
  </g>;
}
function Shell({ segY, segX, children }) {
  return <g>
    {segY.map(([a, b, c]) => <polygon key={'y' + a} points={pts([[a, 0, 0], [b, 0, 0], [b, 0, RH], [a, 0, RH]])} fill={c} />)}
    {segX.map(([a, b, c]) => <polygon key={'x' + a} points={pts([[0, a, 0], [0, b, 0], [0, b, RH], [0, a, RH]])} fill={c} />)}
    {segY.slice(1).map(([a]) => ln([a, 0.01, 0], [a, 0.01, RH], 'rgba(120,90,60,.3)', 2, 'jy' + a))}
    {segX.slice(1).map(([a]) => ln([0.01, a, 0], [0.01, a, RH], 'rgba(120,90,60,.3)', 2, 'jx' + a))}
    {children}
    <polygon points={pts([[-0.2, -0.2, RH], [BX, -0.2, RH], [BX, 0, RH], [0, 0, RH], [0, BY, RH], [-0.2, BY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[BX, -0.2, RH], [BX, 0, RH], [BX, 0, -0.35], [BX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, BY, RH], [0, BY, RH], [0, BY, -0.35], [-0.2, BY, -0.35]])} fill="#cdb791" />
    <polygon points={pts([[0, 0.01, 0], [BX, 0.01, 0], [BX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, BY, 0], [0.01, BY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
  </g>;
}
// Flowery wallpaper on the x=0 wall between y0 and y1, with a dado rail.
function PaperX({ y0, y1, dot = '#d6a89a', leaf = '#9ab07a', low = '#d9c2a6', rail = '#c9a777' }) {
  const W = (y1 - y0) * 100, it = [];
  for (let i = 0; i < W / 50; i++) for (let j = 0; j < 6; j++) it.push(<g key={i + '-' + j} transform={`translate(${i * 50 + (j % 2) * 25 + 12} ${j * 50 + 22})`}><circle r={5} fill={dot} /><circle cx={-6} cy={6} r={3} fill={leaf} /></g>);
  return <FaceX x={0.012} y1={y1} z1={RH}>{it}<rect x={0} y={320} width={W} height={100} fill={low} /><rect x={0} y={314} width={W} height={8} fill={rail} /></FaceX>;
}
function LowWallY({ y, x0, x1, gaps = [], c = WALLC }) {
  const s = []; let a = x0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { s.push([a, g0]); a = g1; }); s.push([a, x1]);
  return <g>{s.filter(([p, q]) => q > p).map(([p, q]) => <Box key={p} x={p} y={y - 0.1} w={q - p} d={0.2} h={LOW} c={c} />)}</g>;
}
function LowWallX({ x, y0, y1, gaps = [], c = WALLC }) {
  const s = []; let a = y0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { s.push([a, g0]); a = g1; }); s.push([a, y1]);
  return <g>{s.filter(([p, q]) => q > p).map(([p, q]) => <Box key={p} x={x - 0.1} y={p} w={0.2} d={q - p} h={LOW} c={c} />)}</g>;
}

// ---------- Floors ----------
function Wood({ x, y, w, d, c = '#b98250', line = '#a46f42' }) {
  const rows = Math.round(d * 100 / 22), cols = Math.ceil(w * 100 / 160);
  return <FloorPlane x={x} y={y}><rect width={w * 100} height={d * 100} fill={c} />
    {Array.from({ length: rows }, (_, i) => <g key={i}><line x1={0} x2={w * 100} y1={i * 22} y2={i * 22} stroke={line} strokeWidth={2} />{Array.from({ length: cols }, (_, k) => <line key={k} x1={k * 160 + (i % 3) * 53} x2={k * 160 + (i % 3) * 53} y1={i * 22} y2={i * 22 + 22} stroke={line} strokeWidth={2} />)}</g>)}
  </FloorPlane>;
}
function Tiles({ x, y, w, d, a, b, s = 50 }) {
  const t = []; for (let i = 0; i < Math.ceil(w * 100 / s); i++) for (let j = 0; j < Math.ceil(d * 100 / s); j++) t.push(<rect key={i + '-' + j} x={i * s} y={j * s} width={Math.min(s, w * 100 - i * s)} height={Math.min(s, d * 100 - j * s)} fill={(i + j) % 2 ? a : b} />);
  return <FloorPlane z={0.002} x={x} y={y}>{t}</FloorPlane>;
}
const Carpet = ({ x, y, w, d, c }) => <FloorPlane z={0.002} x={x} y={y}><rect width={w * 100} height={d * 100} fill={c} /></FloorPlane>;
function Rug({ x, y, w, d, c = '#8a2f2f', b = '#e3c27a', mid = '#2f4f6a' }) {
  const W = w * 100, H = d * 100;
  return <FloorPlane z={0.006} x={x} y={y}><rect width={W} height={H} fill={c} /><rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={b} strokeWidth={7} /><rect x={36} y={36} width={W - 72} height={H - 72} fill={shade(c, 0.12)} /><ellipse cx={W / 2} cy={H / 2} rx={W * 0.24} ry={H * 0.22} fill={mid} /><ellipse cx={W / 2} cy={H / 2} rx={W * 0.12} ry={H * 0.11} fill={b} /></FloorPlane>;
}
function FluffyRug({ cx, cy, rx, ry }) {
  return <FloorPlane z={0.008}><g transform={`translate(${cx * 100} ${cy * 100})`}>
    {Array.from({ length: 44 }, (_, i) => { const a = i / 44 * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * rx * 100} cy={Math.sin(a) * ry * 100} r={13} fill="#f7f2e8" />; })}
    <ellipse rx={rx * 100} ry={ry * 100} fill="#f7f2e8" />
    {Array.from({ length: 70 }, (_, i) => { const a = Math.sin(i * 91.7) * 9999, b = Math.sin(i * 37.3) * 9999, u = (a - Math.floor(a)) * 2 - 1, v = (b - Math.floor(b)) * 2 - 1; return u * u + v * v > 0.8 ? null : <circle key={'d' + i} cx={u * rx * 100} cy={v * ry * 100} r={5} fill="#e9e1d0" />; })}
  </g></FloorPlane>;
}

// ---------- Generic furniture ----------
const DoorArt = ({ W, H, n = 2, knob = '#c9a54a' }) => <g>{Array.from({ length: n }, (_, i) => { const dw = W / n; return <g key={i}><rect x={i * dw + 5} y={7} width={dw - 10} height={H - 16} fill="none" stroke="rgba(60,30,10,.35)" strokeWidth={2} /><rect x={i * dw + 14} y={18} width={dw - 28} height={H - 38} fill="none" stroke="rgba(60,30,10,.18)" strokeWidth={2} /><circle cx={i % 2 ? i * dw + 12 : (i + 1) * dw - 12} cy={Math.min(H * 0.5, 40)} r={3.5} fill={knob} /></g>; })}</g>;
const DrawerArt = ({ W, H, n = 3 }) => <g>{Array.from({ length: n }, (_, i) => { const dh = H / n; return <g key={i}><rect x={6} y={i * dh + 5} width={W - 12} height={dh - 10} fill="none" stroke="rgba(60,30,10,.35)" strokeWidth={2} /><circle cx={W * 0.3} cy={i * dh + dh / 2} r={3.5} fill="#c9a54a" /><circle cx={W * 0.7} cy={i * dh + dh / 2} r={3.5} fill="#c9a54a" /></g>; })}</g>;
// Fronts on the visible face: face 'y' (+y side) or 'x' (+x side).
function Front({ x, y, w, d, z = 0, h, face = 'y', art = 'doors', n }) {
  const W = (face === 'y' ? w : d) * 100, H = h * 100, inner = art === 'doors' ? <DoorArt W={W} H={H} n={n ?? Math.max(1, Math.round(W / 60))} /> : <DrawerArt W={W} H={H} n={n ?? 3} />;
  return face === 'y' ? <FaceY y={y + d} x0={x} z1={z + h}>{inner}</FaceY> : <FaceX x={x + w} y1={y + d} z1={z + h}>{inner}</FaceX>;
}
function Cabinet({ x, y, w, d, z = 0, h, c = WALNUT, face = 'y', art = 'doors', n, top }) {
  return <g><Box x={x} y={y} z={z} w={w} d={d} h={h} c={c} />{top && <Box x={x - 0.04} y={y - 0.04} z={z + h} w={w + 0.08} d={d + 0.08} h={0.08} c={top} />}<Front x={x} y={y} w={w} d={d} z={z} h={h} face={face} art={art} n={n} /></g>;
}
function Lamp({ x, y, z = 0, h = 0.55, c = '#f2dfb0', s = 1 }) {
  const [bx, by] = P(x, y, z), [tx, ty] = P(x, y, z + h);
  return <g><ellipse cx={bx} cy={by} rx={9 * s} ry={4 * s} fill="#8a6a3a" /><line x1={bx} y1={by} x2={tx} y2={ty} stroke="#8a6a3a" strokeWidth={3} /><path d={`M${tx - 13 * s},${ty + 4 * s} L${tx - 7 * s},${ty - 16 * s} L${tx + 7 * s},${ty - 16 * s} L${tx + 13 * s},${ty + 4 * s} Z`} fill={c} stroke={shade(c, -0.2)} /><path d={`M${tx - 13 * s},${ty + 4 * s} L${tx + 13 * s},${ty + 4 * s}`} stroke={shade(c, -0.25)} strokeWidth={2} strokeDasharray="3 3" /></g>;
}
// Nick-nacks: 0 vase · 1 photo frame · 2 china dog · 3 candlestick · 4 jug · 5 flowers
function Knick({ at, k = 0 }) {
  const [x, y] = P(...at), c = ['#3f6e9a', '#c4433c', '#3f8a5a', '#7a4fd1', '#c9a54a', '#e85a7a'][(k * 7) % 6];
  switch (k % 6) {
    case 0: return <path d={`M${x - 6},${y} C${x - 13},${y - 12} ${x - 4},${y - 18} ${x - 4},${y - 26} L${x + 4},${y - 26} C${x + 4},${y - 18} ${x + 13},${y - 12} ${x + 6},${y} Z`} fill={c} stroke={shade(c, -0.25)} />;
    case 1: return <g><rect x={x - 9} y={y - 24} width={18} height={22} fill="#c9a54a" /><rect x={x - 6} y={y - 21} width={12} height={16} fill="#d7e3e6" /><circle cx={x} cy={y - 15} r={3} fill="#e9c6a8" /><rect x={x - 4} y={y - 11} width={8} height={6} fill="#7a9a6b" /></g>;
    case 2: return <g><ellipse cx={x} cy={y - 6} rx={8} ry={6} fill="#f4efe4" stroke="#c9c2b4" /><circle cx={x + 5} cy={y - 14} r={5} fill="#f4efe4" stroke="#c9c2b4" /><circle cx={x + 6} cy={y - 15} r={1.2} fill="#2a2a2c" /><ellipse cx={x + 2} cy={y - 16} rx={2} ry={3} fill="#c97a4a" /></g>;
    case 3: return <g><ellipse cx={x} cy={y - 2} rx={6} ry={2.5} fill="#c9a54a" /><rect x={x - 2} y={y - 26} width={4} height={24} fill="#c9a54a" /><rect x={x - 2.5} y={y - 36} width={5} height={10} fill="#fbf8f2" /><ellipse cx={x} cy={y - 39} rx={2} ry={3} fill="#f2a127" /></g>;
    case 4: return <g><ellipse cx={x} cy={y - 9} rx={10} ry={9} fill={c} /><path d={`M${x + 9},${y - 12} q8,-2 7,-9`} stroke={c} strokeWidth={3} fill="none" /><ellipse cx={x} cy={y - 18} rx={6} ry={2} fill={shade(c, -0.2)} /><path d={`M${x - 8},${y - 10} q10,5 16,0`} stroke="#fbf8f2" strokeWidth={2} fill="none" /></g>;
    default: return <g><path d={`M${x - 5},${y} L${x - 6},${y - 16} L${x + 6},${y - 16} L${x + 5},${y} Z`} fill="#fbf8f2" stroke="#c9c2b4" />{[[-8, -26, '#e85a7a'], [0, -32, '#f2c94c'], [8, -26, '#c4433c'], [-3, -22, '#f39ac6'], [4, -21, '#e85a7a']].map(([a, b, cc], i) => <g key={i}><line x1={x} y1={y - 16} x2={x + a} y2={y + b} stroke="#5f9a4a" strokeWidth={1.5} /><circle cx={x + a} cy={y + b} r={4.5} fill={cc} /></g>)}</g>;
  }
}
const Knicks = ({ list, k0 = 0 }) => <g>{list.map((at, i) => <Knick key={i} at={at} k={k0 + i} />)}</g>;
function Plant({ x, y, z = 0, s = 1 }) {
  const [px, py] = P(x + 0.18 * s, y + 0.18 * s, z + 0.35 * s);
  return <g><Box x={x} y={y} z={z} w={0.36 * s} d={0.36 * s} h={0.35 * s} c={['#c96a4a', '#b55a3e', '#9a4a3a']} />{Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={px + (i % 2 ? 1 : -1) * (6 + i * 2.5) * s} cy={py - (10 + i * 9) * s} rx={14 * s} ry={5 * s} transform={`rotate(${i % 2 ? 30 : -30} ${px + (i % 2 ? 1 : -1) * (6 + i * 2.5) * s} ${py - (10 + i * 9) * s})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}</g>;
}
// Wall picture. face 'y' → at = [x0, z1] on y=0 wall; face 'x' → at = [y1, z1] on x=0 wall.
function Pic({ face = 'y', at, w = 0.9, h = 0.7, art = 'land' }) {
  const W = w * 100, H = h * 100;
  const body = art === 'oval' ? <g><ellipse cx={W / 2} cy={H / 2} rx={W / 2} ry={H / 2} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><ellipse cx={W / 2} cy={H / 2} rx={W / 2 - 7} ry={H / 2 - 7} fill="#e8dcc0" /><circle cx={W / 2} cy={H * 0.4} r={W * 0.13} fill="#8a6a4a" /><path d={`M${W * 0.28},${H - 10} Q${W / 2},${H * 0.45} ${W * 0.72},${H - 10}Z`} fill="#6b5a48" /></g>
    : art === 'plates' ? <g>{[0, 1, 2].map(i => <g key={i}><circle cx={W / 6 + i * W / 3} cy={H / 2} r={Math.min(W / 7, H / 2.2)} fill="#fbf8f2" stroke="#c9c2b4" strokeWidth={2} /><circle cx={W / 6 + i * W / 3} cy={H / 2} r={Math.min(W / 7, H / 2.2) * 0.65} fill="none" stroke="#3f6e9a" strokeWidth={3} /><circle cx={W / 6 + i * W / 3} cy={H / 2} r={4} fill="#3f6e9a" /></g>)}</g>
    : art === 'flowers' ? <g><rect width={W} height={H} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><rect x={7} y={7} width={W - 14} height={H - 14} fill="#efe6d2" /><rect x={W / 2 - 9} y={H * 0.55} width={18} height={H * 0.3} fill="#3f6e9a" />{[[-16, 0.4, '#e85a7a'], [0, 0.28, '#f2c94c'], [16, 0.4, '#c4433c'], [-6, 0.48, '#f39ac6'], [8, 0.5, '#e98a3a']].map(([a, b, c], i) => <circle key={i} cx={W / 2 + a} cy={H * b} r={8} fill={c} />)}</g>
    : <g><rect width={W} height={H} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><rect x={7} y={7} width={W - 14} height={H - 14} fill="#bcd6e0" /><path d={`M7,${H - 7} L7,${H * 0.62} Q${W * 0.35},${H * 0.35} ${W * 0.6},${H * 0.62} T${W - 7},${H * 0.52} L${W - 7},${H - 7}Z`} fill="#7aa84e" /><circle cx={W * 0.74} cy={H * 0.3} r={6} fill="#f2c94c" /></g>;
  return face === 'y' ? <FaceY y={0.02} x0={at[0]} z1={at[1]}>{body}</FaceY> : <FaceX x={0.02} y1={at[0]} z1={at[1]}>{body}</FaceX>;
}
function WindowY({ x0, z1 = 3.0, w = 1.6, h = 1.2, curtain = '#d6a89a', frosted = false }) {
  const W = w * 100, H = h * 100;
  return <FaceY y={0.02} x0={x0} z1={z1}><rect x={-7} y={-7} width={W + 14} height={H + 14} fill="#fffaf2" stroke="#e0d1b6" /><rect width={W} height={H} fill={frosted ? '#e4eef0' : '#cfe3ea'} />{!frosted && <path d={`M0,${H} L0,${H * 0.6} Q${W * 0.4},${H * 0.4} ${W},${H * 0.55} L${W},${H} Z`} fill="#9cc47a" />}<line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#fffaf2" strokeWidth={5} /><line x1={0} x2={W} y1={H * 0.35} y2={H * 0.35} stroke="#fffaf2" strokeWidth={5} />
    {!frosted && <rect x={0} y={H * 0.55} width={W} height={H * 0.45} fill="#fbf8f2" opacity={0.65} />}
    <rect x={-22} y={-14} width={20} height={H + 20} fill={curtain} /><rect x={W + 2} y={-14} width={20} height={H + 20} fill={curtain} /><rect x={-26} y={-20} width={W + 52} height={7} fill="#c9a777" /><rect x={-10} y={H + 6} width={W + 20} height={8} fill="#fffaf2" /></FaceY>;
}

// ---------- Kitchen ----------
function RunY({ x0, x1, y = 0, d = 0.75 }) { return <g><Box x={x0} y={y} w={x1 - x0} d={d} h={0.85} c={CAB} /><Front x={x0} y={y} w={x1 - x0} d={d} h={0.85} /><Box x={x0} y={y} z={0.85} w={x1 - x0} d={d + 0.04} h={0.06} c={WORK} /></g>; }
function RunX({ y0, y1, x = 0, d = 0.75 }) { return <g><Box x={x} y={y0} w={d} d={y1 - y0} h={0.85} c={CAB} /><Front x={x} y={y0} w={d} d={y1 - y0} h={0.85} face="x" /><Box x={x} y={y0} z={0.85} w={d + 0.04} d={y1 - y0} h={0.06} c={WORK} /></g>; }
const UpperY = ({ x0, x1 }) => <Cabinet x={x0} y={0} z={2.05} w={x1 - x0} d={0.4} h={0.8} c={CAB} />;
const UpperX = ({ y0, y1 }) => <Cabinet x={0} y={y0} z={2.05} w={0.4} d={y1 - y0} h={0.8} c={CAB} face="x" />;
function Splash() {
  const grid = (W) => <g><rect width={W} height={64} fill="#f6f1e4" />{Array.from({ length: Math.ceil(W / 21) }, (_, i) => <line key={i} x1={i * 21} x2={i * 21} y1={0} y2={64} stroke="#ddd3bd" strokeWidth={1.5} />)}{[21, 42].map(y => <line key={y} x1={0} x2={W} y1={y} y2={y} stroke="#ddd3bd" strokeWidth={1.5} />)}{Array.from({ length: Math.ceil(W / 84) }, (_, i) => <circle key={'c' + i} cx={i * 84 + 31} cy={31} r={6} fill="#3f6e9a" opacity={0.6} />)}</g>;
  return <g><FaceY y={0.015} x0={0} z1={1.55}>{grid(800)}</FaceY><FaceX x={0.015} y1={6.3} z1={1.55}>{grid(630)}</FaceX></g>;
}
function Sink() {
  return <g><FloorPlane z={0.912} x={1.7} y={0.12}><rect width={130} height={50} rx={8} fill="#9aa1a6" /><rect x={6} y={6} width={58} height={38} rx={6} fill="#c9ced2" /><rect x={68} y={6} width={56} height={38} rx={6} fill="#c9ced2" /></FloorPlane>
    {ln([2.35, 0.08, 0.91], [2.35, 0.08, 1.22], '#aeb4b9', 4, 'a')}{ln([2.35, 0.08, 1.22], [2.35, 0.24, 1.18], '#aeb4b9', 4, 'b')}
    <Box x={3.15} y={0.12} z={0.91} w={0.45} d={0.4} h={0.05} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />{[0, 1, 2].map(i => <Box key={i} x={3.2 + i * 0.13} y={0.18} z={0.96} w={0.03} d={0.3} h={0.22} c={['#fbf8f2', '#e8e0cc', '#d6cdb6']} />)}</g>;
}
function Cooker({ y0 = 3.1, y1 = 4.3 }) {
  const d = y1 - y0, W = d * 100;
  return <g><Box x={0} y={y0} w={0.8} d={d} h={0.9} c={['#f4eee0', '#e6dcc6', '#d8ccb2']} />
    <FaceX x={0.8} y1={y1} z1={0.9}><rect x={8} y={6} width={W - 16} height={14} fill="#3a3a3c" />{[0, 1, 2, 3].map(i => <circle key={i} cx={20 + i * ((W - 40) / 3)} cy={13} r={4} fill="#c9ced2" />)}<rect x={14} y={30} width={W - 28} height={50} rx={4} fill="#2a2a2c" /><rect x={26} y={40} width={W - 52} height={30} fill="#5a4a40" /><rect x={30} y={26} width={W - 60} height={4} fill="#c9ced2" /></FaceX>
    <FloorPlane z={0.902} x={0} y={y0}>{[[24, 30], [24, 88], [58, 30], [58, 88]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={15} fill="#2a2a2c" stroke="#5b5f66" strokeWidth={3} />)}</FloorPlane>
    <Box x={0.1} y={y0 + 0.65} z={0.9} w={0.36} d={0.36} h={0.2} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    <Box x={0} y={y0 + 0.1} z={2.3} w={0.6} d={d - 0.2} h={0.4} c={['#e6e1d6', '#d6d0c4', '#c9c2b4']} />
  </g>;
}
function Fridge() {
  return <g><Box x={6.3} y={0} w={0.9} d={0.75} h={2.1} c={WHITE} />
    <FaceY y={0.75} x0={6.3} z1={2.1}><line x1={0} x2={90} y1={72} y2={72} stroke="#cfc8ba" strokeWidth={2} /><rect x={76} y={22} width={5} height={36} rx={2} fill="#bdb6a8" /><rect x={76} y={86} width={5} height={50} rx={2} fill="#bdb6a8" />
      <g transform="rotate(-4 30 100)"><rect x={12} y={88} width={34} height={28} fill="#fbf8f2" stroke="#ddd" /><circle cx={22} cy={98} r={5} fill="#f2c94c" /><path d="M14,112 q10,-10 30,-2" stroke="#5fbf6a" strokeWidth={3} fill="none" /></g>
      <g transform="rotate(5 50 140)"><rect x={34} y={128} width={30} height={26} fill="#fbf8f2" stroke="#ddd" /><path d="M40,150 l8,-16 l8,16" stroke="#e85a7a" strokeWidth={3} fill="none" /></g>
      {[[20, 30, '#e0524a'], [50, 40, '#3f7fc4'], [30, 160, '#5fbf6a']].map(([a, b, c], i) => <circle key={i} cx={a} cy={b} r={5} fill={c} />)}</FaceY>
    <Cabinet x={7.2} y={0} w={0.8} d={0.75} h={2.3} c={CAB} n={1} />
  </g>;
}
function KitchenTable() {
  return <g>
    <DChair x={3.55} y={2.55} back="n" c={WALNUT} />
    {[[3.1, 4.05], [4.55, 4.05]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.07} d={0.07} h={0.72} c={WALNUT} />)}
    <Box x={3.05} y={2.95} z={0.72} w={1.6} d={1.2} h={0.05} c={WALNUT} />
    <FloorPlane z={0.771} x={3.05} y={2.95}><rect width={160} height={120} fill="#fbf8f2" />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 20} y={0} width={10} height={120} fill="#e0524a" opacity={0.35} />)}{Array.from({ length: 6 }, (_, i) => <rect key={'r' + i} x={0} y={i * 20} width={160} height={10} fill="#e0524a" opacity={0.35} />)}</FloorPlane>
    <Knick at={[3.85, 3.5, 0.77]} k={4} /><Box x={3.35} y={3.35} z={0.77} w={0.14} d={0.14} h={0.12} c={['#fbf8f2', '#3f6e9a', '#336aa6']} /><Box x={4.25} y={3.5} z={0.77} w={0.14} d={0.14} h={0.12} c={['#fbf8f2', '#e85a7a', '#c4436a']} />
    <DChair x={3.55} y={4.25} back="s" c={WALNUT} />
  </g>;
}
function Caddies({ x, y, z = 0.91 }) {
  return <g>{['TEA', 'COFFEE', 'SUGAR'].map((t, i) => <g key={t}><Box x={x + i * 0.3} y={y} z={z} w={0.24} d={0.22} h={0.3} c={['#c9ced2', '#c4433c', '#a8383a']} /><FaceY y={y + 0.22} x0={x + i * 0.3} z1={z + 0.24}><text x={12} y={10} textAnchor="middle" fontSize={7} fill="#fbf8f2" {...TXT}>{t}</text></FaceY></g>)}</g>;
}

// ---------- Hall ----------
function FrontDoor() {
  return <a href="Town Map.dc.html" style={{ cursor: 'pointer' }}>
    <FloorPlane z={0.01} x={FRONT_DOOR.x0 + 0.2} y={0.12}><rect width={140} height={50} rx={5} fill="#8a6a3a" /><text x={70} y={33} textAnchor="middle" fontSize={20} fill="#f2dfb0" {...TXT}>WELCOME</text></FloorPlane>
    <FaceY y={0.02} x0={FRONT_DOOR.x0} z1={2.75}>
      <rect x={-12} y={-12} width={204} height={287} fill="#fffaf2" stroke="#e0d1b6" />
      <rect x={0} y={0} width={180} height={275} fill="#3f5a4a" />
      <path d="M10,48 A80,40 0 0 1 170,48 Z" fill="#f2e4b8" />{[30, 60, 90, 120, 150].map((a, i) => <line key={i} x1={90} y1={48} x2={a} y2={16} stroke="#3f5a4a" strokeWidth={3} />)}
      <rect x={22} y={56} width={136} height={219} fill="#4a6a52" stroke="#2f4a3a" strokeWidth={2} />
      <rect x={45} y={72} width={90} height={70} fill="#f2c94c" />{[[45, 72, '#c4433c'], [90, 72, '#3f6e9a'], [45, 107, '#3f6e9a'], [90, 107, '#c4433c']].map(([a, b, c], i) => <rect key={i} x={a + 4} y={b + 4} width={37} height={27} fill={c} opacity={0.75} />)}
      <rect x={45} y={160} width={90} height={90} fill="none" stroke="#2f4a3a" strokeWidth={2} />
      <rect x={68} y={168} width={44} height={8} rx={2} fill="#c9a54a" /><circle cx={140} cy={180} r={6} fill="#c9a54a" /><circle cx={90} cy={60} r={0} />
    </FaceY>
  </a>;
}
function GrandfatherClock({ x, T }) {
  return <g><Box x={x} y={0.05} w={0.55} d={0.45} h={2.0} c={MAHOG} /><Box x={x - 0.05} y={0.03} z={2.0} w={0.65} d={0.5} h={0.55} c={MAHOG} /><Box x={x - 0.08} y={0.01} z={2.55} w={0.71} d={0.54} h={0.1} c={MAHOG} />
    <FaceY y={0.53} x0={x - 0.05} z1={2.55}><circle cx={32} cy={27} r={22} fill="#f4ecd8" stroke="#c9a54a" strokeWidth={3} />{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={32 + Math.cos(i * Math.PI / 6) * 17} cy={27 + Math.sin(i * Math.PI / 6) * 17} r={1.4} fill="#2a2a2c" />)}<line x1={32} y1={27} x2={32} y2={13} stroke="#2a2a2c" strokeWidth={2.5} /><line x1={32} y1={27} x2={43} y2={31} stroke="#2a2a2c" strokeWidth={2.5} /></FaceY>
    <FaceY y={0.5} x0={x} z1={1.9}><rect x={12} y={10} width={31} height={120} fill="#3a2418" /><g transform={`rotate(${Math.sin(T * 3) * 12} 27.5 12)`}><line x1={27.5} y1={12} x2={27.5} y2={100} stroke="#c9a54a" strokeWidth={2} /><circle cx={27.5} cy={104} r={10} fill="#c9a54a" /></g></FaceY></g>;
}
function PhoneTable() {
  return <g><Box x={12.85} y={0.08} w={1.15} d={0.5} h={0.75} c={PAINT} /><Front x={12.85} y={0.08} w={1.15} d={0.5} h={0.25} z={0.5} art="drawers" n={1} />
    <Box x={13.0} y={0.2} z={0.75} w={0.32} d={0.24} h={0.1} c={['#c4433c', '#a8383a', '#8f2f30']} /><Box x={13.02} y={0.24} z={0.85} w={0.28} d={0.08} h={0.06} c={['#c4433c', '#a8383a', '#8f2f30']} />
    <Lamp x={13.75} y={0.3} z={0.75} /></g>;
}
function Sideboard() {
  return <g><Box x={8.12} y={0.6} w={0.6} d={2.3} h={0.9} c={PAINT} /><FaceX x={8.72} y1={2.9} z1={0.9}><DrawerArt W={230} H={26} n={1} /><g transform="translate(0 28)"><DoorArt W={230} H={62} n={3} /></g></FaceX>
    <FloorPlane z={0.901} x={8.12} y={0.6}><rect x={8} y={20} width={44} height={190} fill="#fbf8f2" opacity={0.85} /></FloorPlane>
    <Knicks list={[[8.42, 0.85, 0.9], [8.42, 1.25, 0.9], [8.42, 1.65, 0.9], [8.42, 2.05, 0.9], [8.42, 2.45, 0.9], [8.42, 2.75, 0.9]]} k0={0} /></g>;
}

// ---------- Shower room ----------
function Toilet({ x }) {
  return <g><Box x={x} y={0.02} w={0.55} d={0.25} h={0.95} c={WHITE} /><Box x={x + 0.04} y={0.27} w={0.47} d={0.5} h={0.42} c={WHITE} /><FloorPlane z={0.421} x={x + 0.04} y={0.27}><ellipse cx={23.5} cy={27} rx={21} ry={22} fill="#fbf8f2" stroke="#ddd6c9" strokeWidth={3} /></FloorPlane><Box x={x + 0.38} y={0.06} z={0.95} w={0.08} d={0.1} h={0.03} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} /></g>;
}
function PedestalSink({ x, y = 0.02 }) {
  return <g><Box x={x + 0.18} y={y + 0.1} w={0.24} d={0.24} h={0.75} c={WHITE} /><Box x={x} y={y} z={0.75} w={0.6} d={0.48} h={0.15} c={WHITE} /><FloorPlane z={0.901} x={x + 0.08} y={y + 0.1}><ellipse cx={22} cy={16} rx={18} ry={12} fill="#d4e4ea" /></FloorPlane>{ln([x + 0.3, y + 0.04, 0.9], [x + 0.3, y + 0.04, 1.08], '#aeb4b9', 3, 't')}
    <FaceY y={0.02} x0={x} z1={2.3}><rect width={60} height={70} rx={6} fill="#c9a54a" /><rect x={5} y={5} width={50} height={60} rx={4} fill="#d7e6ea" /><path d="M14,14 L26,50" stroke="#fff" strokeWidth={3} opacity={0.7} /></FaceY></g>;
}
function Shower() {
  const x0 = 16.6;
  return <g><Box x={x0} y={0} w={BX - x0} d={1.4} h={0.1} c={WHITE} />
    {ln([17.3, 0.03, 2.5], [17.3, 0.3, 2.45], '#aeb4b9', 4, 'h')}<ellipse cx={P(17.3, 0.3, 2.4)[0]} cy={P(17.3, 0.3, 2.4)[1]} rx={10} ry={4} fill="#aeb4b9" />
    <polygon points={pts([[x0, 0, 0.1], [x0, 1.4, 0.1], [x0, 1.4, 2.3], [x0, 0, 2.3]])} fill="#d4ecf0" fillOpacity={0.3} stroke="#a9c4c9" />
    <polygon points={pts([[x0, 1.4, 0.1], [BX, 1.4, 0.1], [BX, 1.4, 2.3], [x0, 1.4, 2.3]])} fill="#d4ecf0" fillOpacity={0.3} stroke="#a9c4c9" />
  </g>;
}

// ---------- Stairs (ground) ----------
function StairsUp({ onClick }) {
  const x0 = 11.4, x1 = 14.2, y0 = 4.9, y1 = 9.2, n = 8, dy = (y1 - y0) / n, sh = 0.26;
  return <g onClick={onClick} style={{ cursor: 'pointer' }}>
    {Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0} y={y0 + i * dy} w={x1 - x0} d={dy} h={(i + 1) * sh} c={['#c38c58', '#a8764a', '#8f633d']} /><FloorPlane z={(i + 1) * sh + 0.002} x={x0 + 0.5} y={y0 + i * dy}><rect width={(x1 - x0 - 1.0) * 100} height={dy * 100} fill="#9a3a34" /><rect x={0} y={dy * 100 - 6} width={(x1 - x0 - 1.0) * 100} height={4} fill="#c9a54a" /></FloorPlane></g>)}
    <Box x={x0 - 0.05} y={y0 - 0.1} w={0.16} d={0.16} h={1.2} c={MAHOG} />
    {Array.from({ length: n }, (_, i) => ln([x0 + 0.03, y0 + (i + 0.5) * dy, (i + 1) * sh], [x0 + 0.03, y0 + (i + 0.5) * dy, (i + 1) * sh + 0.9], '#fffaf2', 4, 'p' + i))}
    {ln([x0 + 0.03, y0 - 0.02, 1.2], [x0 + 0.03, y1, n * sh + 0.95], '#86462c', 7, 'rail')}
  </g>;
}
function UnderStairs() {
  return <g><Box x={14.5} y={5.2} w={0.7} d={0.6} h={0.5} c={['#d8b484', '#c49c69', '#b08757']} /><Box x={14.55} y={5.25} z={0.5} w={0.55} d={0.5} h={0.4} c={['#d8b484', '#c49c69', '#b08757']} />
    <Box x={15.7} y={5.3} w={0.45} d={0.4} h={0.35} c={['#e0524a', '#c4433c', '#ab3832']} />{ln([15.9, 5.5, 0.35], [15.9, 5.4, 1.4], '#5b5f66', 4, 'hv')}
    <Box x={16.6} y={5.2} w={0.25} d={0.5} h={0.4} c={['#3f8a5a', '#336f4a', '#2a5c3d']} /><Box x={16.9} y={5.2} w={0.25} d={0.5} h={0.4} c={['#3f8a5a', '#336f4a', '#2a5c3d']} />
    <Box x={17.3} y={5.0} w={0.5} d={1.8} h={0.05} c={['#9fb4c9', '#8aa0b6', '#7a90a6']} /></g>;
}

// ---------- Living room ----------
function Bookshelf() {
  const c = ['#8f3f45', '#3f6e9a', '#3f8a5a', '#c9a54a', '#6b4a2e', '#e3d3ae', '#5b5f66'];
  return <g><Box x={0} y={7.2} w={0.55} d={2.1} h={2.0} c={PAINT} />
    <FaceX x={0.55} y1={9.3} z1={2.0}>{[0, 1, 2, 3].map(r => <g key={r}><rect x={6} y={6 + r * 48} width={198} height={42} fill="#4a3220" />{Array.from({ length: 16 }, (_, k) => r === 1 && k > 10 ? null : <rect key={k} x={9 + k * 12} y={12 + r * 48 + (k * 5 % 4)} width={10} height={36 - (k * 5 % 4)} fill={c[(k + r * 2) % 7]} />)}{r === 1 && <g><ellipse cx={168} cy={44} rx={14} ry={10} fill="#f4efe4" /><circle cx={176} cy={34} r={7} fill="#f4efe4" /></g>}</g>)}</FaceX>
    <Knicks list={[[0.28, 7.6, 2.0], [0.28, 8.3, 2.0], [0.28, 8.95, 2.0]]} k0={3} /></g>;
}
function TV() {
  return <g><Cabinet x={0} y={9.9} w={0.6} d={2.0} h={0.55} face="x" n={3} c={PAINT} />
    <Box x={0.12} y={10.85} z={0.55} w={0.18} d={0.15} h={0.08} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={0.08} y={10.1} z={0.63} w={0.12} d={1.6} h={0.95} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <FaceX x={0.205} y1={11.65} z1={1.53}><rect x={0} y={0} width={150} height={85} fill="#6fa0c8" /><path d="M0,85 L0,52 Q50,30 90,50 T150,44 L150,85 Z" fill="#6b9a44" /><circle cx={112} cy={22} r={9} fill="#f2e3b0" /><path d="M30,48 l6,-12 l6,12z M44,46 l5,-10 l5,10z" fill="#3f6e4a" /></FaceX>
    <Knicks list={[[0.3, 10.0, 0.55], [0.3, 11.8, 0.55]]} k0={5} /></g>;
}
function LeatherSofa({ T, sitter }) {
  const x0 = 2.6, x1 = 7.4, y0 = 7.3, y1 = 9.2;
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.45} c={LEATHER} /><Box x={x0} y={y0} z={0.45} w={x1 - x0} d={0.5} h={0.6} c={LEATHER} />
    <Box x={x0} y={y0} z={0.45} w={0.4} d={y1 - y0} h={0.32} c={LEATHER} />
    {[0, 1, 2].map(i => <Box key={i} x={x0 + 0.42 + i * 1.32} y={y0 + 0.5} z={0.45} w={1.28} d={y1 - y0 - 0.55} h={0.12} c={['#a8663e', '#8a522e', '#744425']} />)}
    <FaceY y={y0 + 0.5} x0={x0 + 0.4} z1={1.05}>{Array.from({ length: 20 }, (_, i) => <circle key={i} cx={10 + i * 20} cy={14 + (i % 2) * 16} r={2.2} fill="#5e321a" />)}</FaceY>
    <Box x={x0 + 0.5} y={y0 + 0.5} z={0.57} w={0.45} d={0.15} h={0.42} c={['#f2c94c', '#d9b03a', '#c09a2c']} />
    {sitter}
    <Box x={x1 - 0.4} y={y0} z={0.45} w={0.4} d={y1 - y0} h={0.32} c={LEATHER} />
  </g>;
}
function BigArmchair() {
  const x0 = 4.4, x1 = 7.2, y0 = 12.1, y1 = 13.7;
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.45} c={VELVET} /><Box x={x0 + 0.45} y={y0} z={0.45} w={x1 - x0 - 0.9} d={y1 - y0 - 0.5} h={0.14} c={['#a14a50', '#8a3f45', '#733539']} />
    <Box x={x0} y={y0} z={0.45} w={0.45} d={y1 - y0} h={0.4} c={VELVET} /><Box x={x1 - 0.45} y={y0} z={0.45} w={0.45} d={y1 - y0} h={0.4} c={VELVET} />
    <Box x={x0} y={y1 - 0.5} z={0.45} w={x1 - x0} d={0.5} h={0.75} c={VELVET} />
    <FloorPlane z={1.201} x={x0 + 0.6} y={y1 - 0.5}><rect width={(x1 - x0 - 1.2) * 100} height={50} fill="#fbf8f2" opacity={0.9} />{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={i * 14 + 7} cy={50} r={6} fill="#fbf8f2" />)}</FloorPlane></g>;
}
function Windowsill() {
  return <g><Box x={1.3} y={BY - 0.22} z={LOW} w={6.4} d={0.3} h={0.05} c={WHITE} /><Plant x={1.6} y={BY - 0.18} z={0.6} s={0.7} /><Knick at={[3.4, BY - 0.07, 0.6]} k={2} /><Knick at={[4.6, BY - 0.07, 0.6]} k={5} /><Plant x={6.6} y={BY - 0.18} z={0.6} s={0.7} /></g>;
}

// ---------- Sitting / dining room ----------
function DChair({ x, y, back = 'n', c = PAINT }) {
  return <g>{back === 'n' && <Box x={x} y={y} z={0.42} w={0.5} d={0.06} h={0.6} c={c} />}<Box x={x} y={y + 0.44} w={0.06} d={0.06} h={0.42} c={c} /><Box x={x + 0.44} y={y + 0.44} w={0.06} d={0.06} h={0.42} c={c} /><Box x={x} y={y} z={0.42} w={0.5} d={0.5} h={0.06} c={['#9fbe96', SAGE, '#6a8c66']} />{back === 's' && <Box x={x} y={y + 0.44} z={0.42} w={0.5} d={0.06} h={0.6} c={c} />}</g>;
}
function DiningTable() {
  const x = 9.2, y = 11.4, w = 3.7, d = 1.7;
  return <g>
    {[9.7, 10.85, 12.0].map(a => <DChair key={a} x={a} y={y - 0.42} back="n" />)}
    {[[x + 0.1, y + d - 0.18], [x + w - 0.18, y + d - 0.18]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.08} d={0.08} h={0.72} c={PAINT} />)}
    <Box x={x} y={y} z={0.72} w={w} d={d} h={0.07} c={PAINT} />
    <FloorPlane z={0.791} x={x + 0.4} y={y + 0.5}><rect width={290} height={70} fill="#b9cfa8" />{Array.from({ length: 15 }, (_, i) => <g key={i}><circle cx={i * 20 + 10} cy={0} r={7} fill="#b9cfa8" /><circle cx={i * 20 + 10} cy={70} r={7} fill="#b9cfa8" /><circle cx={i * 20 + 10} cy={35} r={4} fill="none" stroke="#e3d9c6" strokeWidth={2} /></g>)}</FloorPlane>
    <Knick at={[10.2, y + 0.85, 0.79]} k={3} /><Knick at={[12.0, y + 0.85, 0.79]} k={3} />
    <FloorPlane z={0.795} x={10.75} y={y + 0.55}><ellipse cx={30} cy={30} rx={30} ry={28} fill="#e3d3ae" /><circle cx={20} cy={24} r={11} fill="#e0524a" /><circle cx={38} cy={28} r={11} fill="#f2a127" /><circle cx={28} cy={40} r={10} fill="#86b55a" /></FloorPlane>
    {[9.7, 10.85, 12.0].map(a => <DChair key={'s' + a} x={a} y={y + d - 0.08} back="s" />)}
  </g>;
}
function ChintzSofa({ x0, x1, y0, y1 }) {
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.42} c={ROSE} /><Box x={x0} y={y0} z={0.42} w={x1 - x0} d={0.42} h={0.55} c={ROSE} /><Box x={x0} y={y0} z={0.42} w={0.32} d={y1 - y0} h={0.3} c={ROSE} />
    {Array.from({ length: Math.round((x1 - x0 - 0.64) / 0.85) }, (_, i) => { const cw = (x1 - x0 - 0.64) / Math.round((x1 - x0 - 0.64) / 0.85); return <Box key={i} x={x0 + 0.32 + i * cw} y={y0 + 0.42} z={0.42} w={cw - 0.04} d={y1 - y0 - 0.45} h={0.12} c={['#efc3bb', '#dca8a0', '#c8958d']} />; })}
    <FaceY y={y1} x0={x0} z1={0.42}>{Array.from({ length: Math.floor((x1 - x0) * 100 / 22) }, (_, i) => <circle key={i} cx={11 + i * 22} cy={14 + (i % 2) * 14} r={4} fill={i % 3 ? '#b95a6a' : '#7a9a6b'} />)}</FaceY>
    <Box x={x1 - 0.32} y={y0} z={0.42} w={0.32} d={y1 - y0} h={0.3} c={ROSE} /></g>;
}
function Armchair({ x, y }) {
  return <g><Box x={x} y={y} w={1.2} d={1.15} h={0.42} c={ROSE} /><Box x={x} y={y} z={0.42} w={1.2} d={0.38} h={0.6} c={ROSE} /><Box x={x} y={y} z={0.42} w={0.25} d={1.15} h={0.28} c={ROSE} /><Box x={x + 0.25} y={y + 0.38} z={0.42} w={0.7} d={0.77} h={0.1} c={['#efc3bb', '#dca8a0', '#c8958d']} /><Box x={x + 0.95} y={y} z={0.42} w={0.25} d={1.15} h={0.28} c={ROSE} /><FloorPlane z={1.021} x={x + 0.2} y={y}><rect width={80} height={38} fill="#fbf8f2" opacity={0.9} /></FloorPlane></g>;
}

// ---------- Upstairs ----------
function BedX({ y0, wid, len, duvet, frame = WALNUT, pillows = 1 }) {
  return <g><Box x={0} y={y0} w={0.15} d={wid} h={1.3} c={frame} /><Box x={0.15} y={y0} w={len} d={wid} h={0.35} c={frame} /><Box x={0.15} y={y0 + 0.03} z={0.35} w={len - 0.05} d={wid - 0.06} h={0.18} c={WHITE} />
    {Array.from({ length: pillows }, (_, i) => { const pw = (wid - 0.2) / pillows; return <Box key={i} x={0.25} y={y0 + 0.1 + i * pw} z={0.53} w={0.5} d={pw - 0.06} h={0.14} c={WHITE} />; })}
    <Box x={0.85} y={y0 - 0.04} z={0.2} w={len - 0.65} d={wid + 0.08} h={0.42} c={tone(duvet)} />
    <FloorPlane z={0.621} x={0.85} y={y0 - 0.04}>{Array.from({ length: Math.floor((len - 0.65) * 100 / 40) }, (_, i) => Array.from({ length: Math.floor((wid + 0.08) * 100 / 40) }, (_, j) => <circle key={i + '-' + j} cx={20 + i * 40} cy={20 + j * 40} r={7} fill={shade(duvet, (i + j) % 2 ? 0.3 : -0.12)} />))}</FloorPlane>
    <Box x={len + 0.1} y={y0} w={0.1} d={wid} h={0.6} c={frame} /></g>;
}
function BedY({ x0, y0, wid, len, duvet, frame = WHITE }) {
  return <g><Box x={x0} y={y0} w={wid} d={0.15} h={1.2} c={frame} /><Box x={x0} y={y0 + 0.15} w={wid} d={len} h={0.35} c={frame} /><Box x={x0 + 0.03} y={y0 + 0.15} z={0.35} w={wid - 0.06} d={len - 0.05} h={0.18} c={WHITE} /><Box x={x0 + 0.12} y={y0 + 0.25} z={0.53} w={wid - 0.24} d={0.45} h={0.14} c={WHITE} />
    <Box x={x0 - 0.04} y={y0 + 0.85} z={0.2} w={wid + 0.08} d={len - 0.65} h={0.42} c={tone(duvet)} />
    <FloorPlane z={0.621} x={x0 - 0.04} y={y0 + 0.85}>{Array.from({ length: 4 }, (_, i) => <circle key={i} cx={30 + (i % 2) * 70} cy={40 + i * 40} r={10} fill="#fbf8f2" opacity={0.7} />)}</FloorPlane>
    <Teddy at={[x0 + wid * 0.6, y0 + 0.5, 0.67]} c="#c99a5c" />
    <Box x={x0} y={y0 + 0.15 + len} w={wid} d={0.08} h={0.55} c={frame} /></g>;
}
function Teddy({ at, c = '#b08757' }) { const [x, y] = P(...at); return <g><ellipse cx={x} cy={y - 10} rx={10} ry={11} fill={c} /><circle cx={x} cy={y - 26} r={8} fill={c} /><circle cx={x - 6} cy={y - 32} r={3.5} fill={c} /><circle cx={x + 6} cy={y - 32} r={3.5} fill={c} /><circle cx={x} cy={y - 23} r={3} fill={shade(c, 0.3)} /><circle cx={x - 3} cy={y - 27} r={1.2} fill="#2a2a2c" /><circle cx={x + 3} cy={y - 27} r={1.2} fill="#2a2a2c" /></g>; }
function Cylinder({ x, y, r = 0.5, h = 1.8 }) {
  const [bx, by] = P(x, y, 0), [, ty] = P(x, y, h), rx = r * 88 * 1.22, ry = rx / 2;
  return <g><path d={`M${bx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${ty} Z`} fill="#c97a4a" />{[0.3, 0.55, 0.8].map(t => <path key={t} d={`M${bx - rx},${ty + (by - ty) * t} A${rx},${ry} 0 0 0 ${bx + rx},${ty + (by - ty) * t}`} fill="none" stroke="#a8603a" strokeWidth={2} />)}<ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill="#e09a62" /><rect x={bx - 4} y={ty - 40} width={8} height={40} fill="#c97a4a" /><rect x={bx - rx * 0.5} y={ty + (by - ty) * 0.4} width={rx} height={14} fill="#c4433c" opacity={0.0} /></g>;
}
function Towels({ x, y, z }) { const c = ['#f39ac6', '#fbf8f2', '#9fd3c7', '#f2c94c', '#bcdcea']; return <g>{c.map((cc, i) => <Box key={i} x={x} y={y} z={z + i * 0.07} w={0.5} d={0.4} h={0.07} c={tone(cc)} />)}</g>; }
function Bath() {
  return <g><Box x={12.6} y={0.02} w={3.9} d={1.15} h={0.7} c={WHITE} /><FaceY y={1.17} x0={12.6} z1={0.7}>{[0, 1, 2, 3].map(i => <rect key={i} x={10 + i * 95} y={10} width={85} height={50} rx={4} fill="none" stroke="#ddd6c9" strokeWidth={2} />)}</FaceY>
    <FloorPlane z={0.702} x={12.7} y={0.12}><rect width={370} height={95} rx={40} fill="#e9e4da" /><rect x={10} y={10} width={350} height={75} rx={34} fill="#bfe0ea" /><circle cx={60} cy={30} r={8} fill="#fbf8f2" opacity={0.8} /><circle cx={80} cy={50} r={6} fill="#fbf8f2" opacity={0.8} /></FloorPlane>
    {[12.85, 13.05].map(a => ln([a, 0.06, 0.7], [a, 0.06, 0.92], '#c9a54a', 4, 'tp' + a))}
    {(() => { const [x, y] = P(14.6, 0.6, 0.72); return <g><ellipse cx={x} cy={y - 6} rx={10} ry={7} fill="#f2c94c" /><circle cx={x + 6} cy={y - 14} r={6} fill="#f2c94c" /><path d={`M${x + 11},${y - 14} l6,2 l-6,2z`} fill="#e98a3a" /></g>; })()}</g>;
}
function ToiletX({ y }) {
  return <g><Box x={12.42} y={y} w={0.25} d={0.55} h={0.95} c={WHITE} /><Box x={12.67} y={y + 0.04} w={0.5} d={0.47} h={0.42} c={WHITE} /><FloorPlane z={0.421} x={12.67} y={y + 0.04}><ellipse cx={27} cy={23.5} rx={22} ry={21} fill="#fbf8f2" stroke="#ddd6c9" strokeWidth={3} /></FloorPlane></g>;
}
function DollsHouse({ x, y }) {
  const [a] = [0];
  return <g><Box x={x} y={y} w={1.1} d={0.55} h={0.9} c={['#f7d6e0', '#f39ac6', '#e07fae']} />
    <polygon points={pts([[x, y + 0.55, 0.9], [x + 1.1, y + 0.55, 0.9], [x + 0.55, y + 0.55, 1.35]])} fill="#e0524a" />
    <polygon points={pts([[x + 1.1, y, 0.9], [x + 1.1, y + 0.55, 0.9], [x + 0.55, y + 0.55, 1.35], [x + 0.55, y, 1.35]])} fill="#c4433c" />
    <FaceY y={y + 0.55} x0={x} z1={0.9}>{[[12, 10], [70, 10], [12, 50]].map(([p, q], i) => <rect key={i} x={p} y={q} width={26} height={22} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={3} />)}<rect x={72} y={48} width={22} height={42} fill="#3f6e9a" /></FaceY></g>;
}
function Stairwell({ onClick }) {
  const x0 = 12.4, x1 = BX, y0 = 6.05, y1 = 8.3, n = 9, dx = (x1 - x0) / n, sh = 0.42;
  return <g onClick={onClick} style={{ cursor: 'pointer' }}>
    <clipPath id="nanny-well"><polygon points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} /></clipPath>
    <g clipPath="url(#nanny-well)"><polygon points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} fill="#3a2a1f" />
      {Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0 + i * dx} y={y0} z={-(i + 1) * sh} w={dx} d={y1 - y0} h={0.02} c={['#c38c58', '#a8764a', '#8f633d']} /><FloorPlane z={-(i + 1) * sh + 0.025} x={x0 + i * dx} y={y0 + 0.5}><rect width={dx * 100} height={(y1 - y0 - 1.0) * 100} fill={shade('#9a3a34', -i * 0.06)} /></FloorPlane><polygon points={pts([[x0 + (i + 1) * dx, y0, -(i + 1) * sh], [x0 + (i + 1) * dx, y1, -(i + 1) * sh], [x0 + (i + 1) * dx, y1, -(i + 2) * sh], [x0 + (i + 1) * dx, y0, -(i + 2) * sh]])} fill={shade('#c38c58', -0.15 - i * 0.05)} /></g>)}
    </g>
  </g>;
}

// ---------- Scrolling stage ----------
function ScrollStage({ zoom, label, children }) {
  const ref = React.useRef(null), drag = React.useRef(null);
  const VB = { x: -320, y: -60, w: 2760, h: 1990 };
  React.useEffect(() => { const el = ref.current; if (!el) return; const [fx, fy] = P(9, 7, 0); el.scrollLeft = Math.max(0, (fx - VB.x) * zoom - el.clientWidth / 2); el.scrollTop = Math.max(0, (fy - VB.y) * zoom - el.clientHeight / 2); }, [zoom]);
  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, l: ref.current.scrollLeft, t: ref.current.scrollTop, moved: false }; };
  const move = (e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; ref.current.scrollLeft = d.l - dx; ref.current.scrollTop = d.t - dy; };
  const up = () => { setTimeout(() => { drag.current = null; }, 0); };
  const click = (e) => { if (drag.current && drag.current.moved) { e.preventDefault(); e.stopPropagation(); } };
  return <div ref={ref} data-screen-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClickCapture={click}
    style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#efe2d0', cursor: 'grab', userSelect: 'none' }}>
    <svg width={VB.w * zoom} height={VB.h * zoom} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{ display: 'block' }}>{children}</svg>
  </div>;
}
const ClickTag = ({ at, text, onClick }) => <g onClick={onClick} style={{ cursor: 'pointer' }}><Tag show={true} at={at} text={text} /></g>;

// ---------- Ground floor ----------
function Downstairs({ T, L, zoom, goUp }) {
  const adult = (at, look, p = {}) => <Person at={at} s={1.02} look={look} T={T} ph={at[0]} {...p} />;
  return <ScrollStage zoom={zoom} label="Nanny & Grandad's — downstairs">
    <Slab />
    <Wood x={0} y={0} w={BX} d={BY} />
    <Tiles x={0} y={0} w={8} d={7} a="#efe6cf" b="#c9714f" />
    <Tiles x={14.2} y={0} w={BX - 14.2} d={4.9} a="#eef4f5" b="#cfe2e6" s={30} />
    <FloorPlane z={0.006} x={10.8} y={0.65}><rect width={140} height={400} fill="#8a2f2f" /><rect x={9} y={9} width={122} height={382} fill="none" stroke="#e3c27a" strokeWidth={5} />{[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M70,${40 + i * 64} l24,20 l-24,20 l-24,-20z`} fill="#2f4f6a" />)}</FloorPlane>
    <Rug x={8.7} y={10.7} w={4.7} d={3.0} />
    <FluffyRug cx={5.2} cy={10.55} rx={1.9} ry={1.0} />
    <Shell segY={[[0, 8, '#f2e8cf'], [8, 14.2, '#f5eedb'], [14.2, BX, '#e4eef0']]} segX={[[0, 7, '#efe2c6'], [7, BY, '#f5eedb']]}>
      <PaperX y0={7} y1={BY} dot="#a9c49a" leaf="#7fa07a" low="#b9cfa8" rail="#6f9a6a" />
      <polygon points={pts([[8, 0.012, 1.0], [14.2, 0.012, 1.0], [14.2, 0.012, 0.18], [8, 0.012, 0.18]])} fill="#b9cfa8" />{ln([8, 0.013, 1.02], [14.2, 0.013, 1.02], '#6f9a6a', 5, 'hd')}
      <Splash />
      <WindowY x0={1.55} z1={2.95} w={1.55} h={1.15} curtain="#e0a07a" />
      <FaceX x={0.02} y1={7.0} z1={3.4}><circle cx={40} cy={30} r={26} fill="#fbf8f2" stroke="#c4433c" strokeWidth={5} /><line x1={40} y1={30} x2={40} y2={14} stroke="#2a2a2c" strokeWidth={3} /><line x1={40} y1={30} x2={52} y2={34} stroke="#2a2a2c" strokeWidth={3} /></FaceX>
      <Pic at={[8.4, 3.5]} w={1.2} h={0.4} art="plates" />
      <Pic at={[9.3, 2.9]} w={0.55} h={0.7} art="oval" />
      <Pic at={[12.9, 2.9]} w={0.9} h={0.65} />
      <FaceY y={0.02} x0={14.2} z1={1.5}><rect width={380} height={150} fill="#cfe2e6" />{Array.from({ length: 19 }, (_, i) => <line key={i} x1={i * 20} x2={i * 20} y1={0} y2={150} stroke="#fbf8f2" strokeWidth={1.5} />)}{Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1={0} x2={380} y1={i * 21} y2={i * 21} stroke="#fbf8f2" strokeWidth={1.5} />)}</FaceY>
      <FrontDoor />
      <Pic face="x" at={[11.9, 3.3]} w={2.0} h={0.75} />
      <Pic face="x" at={[9.1, 3.2]} w={0.6} h={0.75} art="oval" />
      <Pic face="x" at={[8.4, 3.2]} w={0.6} h={0.75} art="flowers" />
      <FaceX x={0.02} y1={13.75} z1={2.9}><ellipse cx={70} cy={50} rx={62} ry={44} fill="#c9a54a" /><ellipse cx={70} cy={50} rx={54} ry={37} fill="#d7e6ea" /><path d="M40,30 L60,70" stroke="#fff" strokeWidth={4} opacity={0.7} /></FaceX>
    </Shell>

    {/* ===== Kitchen ===== */}
    <RunY x0={0} x1={6.3} />
    <Sink />
    <UpperY x0={0} x1={1.3} /><UpperY x0={3.4} x1={6.3} />
    <Fridge />
    <Caddies x={4.2} y={0.15} />
    <Box x={5.3} y={0.15} z={0.91} w={0.3} d={0.25} h={0.28} c={['#fbf8f2', '#e8e0cc', '#d6cdb6']} />
    <Plant x={0.15} y={0.15} z={0.91} s={0.8} />
    <RunX y0={0.75} y1={3.1} /><Cooker /><RunX y0={4.3} y1={6.3} />
    <UpperX y0={0.75} y1={3.0} /><UpperX y0={4.4} y1={6.3} />
    <Box x={0.15} y={5.0} z={0.91} w={0.3} d={0.4} h={0.32} c={['#e0524a', '#c4433c', '#ab3832']} />
    <Knick at={[0.3, 5.9, 0.91]} k={4} />
    {adult([1.4, 3.7, 0], { ...LOOKS.gran, hair: '#cfcac0', apron: '#f39ac6' }, { facing: 'back', pose: 'reach' })}
    <RunY x0={0.8} x1={5.6} y={6.27} d={0.65} />
    <Box x={1.2} y={6.4} z={0.91} w={0.55} d={0.35} h={0.3} c={['#e6e1d6', '#c9a54a', '#b08f3a']} />
    <Box x={2.4} y={6.42} z={0.91} w={0.4} d={0.3} h={0.25} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    <Knicks list={[[3.6, 6.6, 0.91], [4.4, 6.6, 0.91]]} k0={5} />

    {/* ===== Hall ===== */}
    <GrandfatherClock x={9.6} T={T} />
    <PhoneTable />
    <Sideboard />
    <LowWallX x={8} y0={0} y1={7} gaps={[[4.9, 6.6]]} />
    <LowWallY y={7} x0={0} x1={8} />

    {/* ===== Shower room ===== */}
    <Toilet x={14.6} />
    <PedestalSink x={15.6} />
    <Shower />
    <FloorPlane z={0.006} x={15.4} y={1.9}><rect width={90} height={60} rx={14} fill="#9fd3c7" /></FloorPlane>
    <LowWallX x={14.2} y0={0} y1={4.9} gaps={[[0.8, 2.6]]} />
    <LowWallY y={4.9} x0={14.2} x1={BX} />

    {/* ===== Living room ===== */}
    <Bookshelf />
    <TV />

    {/* ===== Stairs + cupboard ===== */}
    <StairsUp onClick={goUp} />
    <UnderStairs />
    <LowWallX x={14.2} y0={4.9} y1={7.1} />
    <LowWallY y={7.1} x0={14.2} x1={BX} />

    <LeatherSofa sitter={adult([5.0, 8.6, 0.57], { ...LOOKS.grandad, style: 'short', hair: '#a9a59c', glasses: false }, { pose: 'sit', armL: 40, armR: 40 })} />
    <Lamp x={7.75} y={7.45} h={1.7} s={1.6} />
    <Box x={0.05} y={12.2} w={1.25} d={1.6} h={0.75} c={WHITE} />
    <FloorPlane z={0.751} x={0.15} y={12.4}><circle cx={55} cy={60} r={48} fill="#fbf8f2" stroke="#e3d9c6" strokeWidth={4} strokeDasharray="6 4" /></FloorPlane>
    <Lamp x={0.5} y={12.6} z={0.75} c="#f7c6d6" />
    <Knicks list={[[0.7, 13.2, 0.75], [0.35, 13.5, 0.75]]} k0={0} />
    <Box x={2.5} y={12.4} w={1.1} d={1.0} h={0.55} c={WALNUT} />
    <Box x={2.85} y={12.75} z={0.55} w={0.18} d={0.18} h={0.12} c={['#fbf8f2', '#f4efe4', '#e6e1d6']} />
    <Knick at={[3.3, 13.1, 0.55]} k={1} />
    <BigArmchair />
    <LowWallX x={8} y0={7} y1={9.3} />
    <LowWallX x={8} y0={12.1} y1={BY} />

    {/* ===== Sitting / dining room ===== */}
    <ChintzSofa x0={14.7} x1={17.7} y0={7.35} y1={8.8} />
    <Box x={15.4} y={9.5} w={1.4} d={0.9} h={0.7} c={PAINT} />
    <Lamp x={15.8} y={9.85} z={0.7} />
    <Plant x={16.3} y={9.75} z={0.7} s={0.7} />
    <Armchair x={14.1} y={11.4} />
    <DiningTable />
    <Cabinet x={17.15} y={11.6} w={0.8} d={2.3} h={1.05} c={PAINT} face="y" n={1} top={PAINT} />
    <Knicks list={[[17.55, 11.9, 1.13], [17.55, 12.4, 1.13], [17.55, 12.9, 1.13], [17.55, 13.4, 1.13]]} k0={1} />
    <Plant x={8.4} y={9.6} s={1.1} />

    {/* ===== Front walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} />
    <LowWallY y={BY} x0={0} x1={BX} gaps={[[BACK_DOOR.x0, BACK_DOOR.x1]]} />
    <Windowsill />
    <FloorPlane z={0.01} x={BACK_DOOR.x0 + 0.2} y={BY - 0.6}><rect width={140} height={50} rx={5} fill="#8a6a3a" /></FloorPlane>

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4, 0, 3.9]} text="Kitchen" />
    <Tag show={L} at={[11.5, 0, 3.9]} text="Hall" />
    <Tag show={L} at={[16.1, 0, 3.9]} text="Shower room" />
    <Tag show={L} at={[0, 10.5, 3.9]} text="Living room" />
    <Tag show={L} at={[12.5, 10.2, 2.0]} text="Dining room" />
    <Tag show={L} at={[16.1, 6.0, 1.6]} text="Cupboard" />
    <ClickTag at={[12.8, 8.6, 3.0]} text="Stairs ↑ Upstairs" onClick={goUp} />
    <a href="Town Map.dc.html" style={{ cursor: 'pointer' }}><Tag show={true} at={[(FRONT_DOOR.x0 + FRONT_DOOR.x1) / 2, 0, 3.25]} text="Front door → Map" /></a>
    <a href="Nanny Garden.dc.html" style={{ cursor: 'pointer' }}><Tag show={true} at={[(BACK_DOOR.x0 + BACK_DOOR.x1) / 2, BY + 0.2, 1.2]} text="Back door → Garden" /></a>
  </ScrollStage>;
}

// ---------- Upstairs ----------
function Upstairs({ L, zoom, goDown }) {
  return <ScrollStage zoom={zoom} label="Nanny & Grandad's — upstairs">
    <Slab />
    <Carpet x={0} y={0} w={9.2} d={6.1} c="#9fb3c8" />
    <Carpet x={0} y={6.1} w={9.2} d={BY - 6.1} c="#d8c7a8" />
    <Carpet x={9.2} y={8.3} w={BX - 9.2} d={BY - 8.3} c="#efc3cf" />
    <Carpet x={9.2} y={2.5} w={3.2} d={5.8} c="#9a3a34" />
    <FloorPlane z={0.004} x={9.4} y={2.7}><rect width={280} height={540} fill="none" stroke="#e3c27a" strokeWidth={6} /></FloorPlane>
    <Wood x={9.2} y={0} w={3.2} d={2.5} />
    <Tiles x={12.4} y={0} w={BX - 12.4} d={6.05} a="#f4f2ee" b="#d9e6ea" s={40} />
    <FloorPlane z={0.006} x={2.2} y={2.6}><rect width={280} height={180} rx={20} fill="#3f5a7a" /><rect x={14} y={14} width={252} height={152} rx={14} fill="none" stroke="#bcdcea" strokeWidth={5} /></FloorPlane>
    <Rug x={2.8} y={7.0} w={3.6} d={2.4} c="#7a4a5a" b="#e3c27a" mid="#c98a8a" />
    <FloorPlane z={0.006} x={11.8} y={10.4}><circle cx={110} cy={110} r={110} fill="#f39ac6" /><circle cx={110} cy={110} r={80} fill="none" stroke="#fbf8f2" strokeWidth={8} /><path d="M110,145 C60,110 75,70 110,92 C145,70 160,110 110,145Z" fill="#e85a7a" /></FloorPlane>
    <FloorPlane z={0.006} x={13.3} y={1.3}><rect width={120} height={60} rx={14} fill="#9fd3c7" /></FloorPlane>
    <Shell segY={[[0, 9.2, '#cddcea'], [9.2, 12.4, '#efe4cf'], [12.4, BX, '#e4eef0']]} segX={[[0, 6.1, '#c5d6e6'], [6.1, BY, '#f0dfcf']]}>
      <PaperX y0={6.1} y1={BY} dot="#e3a2a8" leaf="#a8c08a" low="#e6cdb8" />
      <WindowY x0={3.2} z1={3.0} w={1.7} h={1.25} curtain="#3f6e9a" />
      <FaceY y={0.02} x0={12.4} z1={1.5}><rect width={560} height={150} fill="#d9e6ea" />{Array.from({ length: 28 }, (_, i) => <line key={i} x1={i * 20} x2={i * 20} y1={0} y2={150} stroke="#fbf8f2" strokeWidth={1.5} />)}{Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1={0} x2={560} y1={i * 21} y2={i * 21} stroke="#fbf8f2" strokeWidth={1.5} />)}</FaceY>
      <WindowY x0={13.8} z1={3.0} w={1.4} h={1.0} curtain="#9fd3c7" frosted />
      <Pic face="x" at={[2.6, 2.6]} w={1.0} h={0.7} />
      <Pic face="x" at={[10.4, 2.8]} w={0.7} h={0.85} art="oval" />
      <Pic face="x" at={[9.4, 2.7]} w={0.55} h={0.65} art="flowers" />
      <Pic face="x" at={[11.6, 2.7]} w={0.55} h={0.65} art="flowers" />
      <Pic at={[10.0, 3.0]} w={1.2} h={0.4} art="plates" />
      <FaceX x={0.02} y1={5.15} z1={2.4}><rect width={130} height={90} rx={8} fill="#c9a54a" /><rect x={6} y={6} width={118} height={78} rx={5} fill="#d7e6ea" /></FaceX>
    </Shell>

    {/* ===== Blue bedroom ===== */}
    <Box x={0} y={0.2} w={0.6} d={0.65} h={0.6} c={WALNUT} /><Lamp x={0.3} y={0.5} z={0.6} c="#bcdcea" />
    <BedX y0={1.0} wid={1.4} len={2.6} duvet="#6f97c2" />
    <Teddy at={[0.55, 1.75, 0.67]} />
    <Cabinet x={6.2} y={0} w={2.0} d={0.8} h={2.5} c={WALNUT} top={WALNUT} />
    <Cabinet x={0} y={3.6} w={0.6} d={1.6} h={1.0} face="x" art="drawers" c={WALNUT} />
    <Knicks list={[[0.3, 3.85, 1.0], [0.3, 4.4, 1.0], [0.3, 4.95, 1.0]]} k0={2} />
    <Box x={5.0} y={3.8} w={0.55} d={0.55} h={0.45} c={['#c9a777', '#b08f62', '#9c7e55']} />

    {/* ===== Airing cupboard ===== */}
    <Cylinder x={10.1} y={0.8} r={0.5} h={1.9} />
    {[0.9, 1.5, 2.1].map(z => <g key={z}><Box x={11.0} y={0.05} z={z} w={1.3} d={0.6} h={0.04} c={OAK} /><Towels x={11.1} y={0.12} z={z + 0.04} /><Towels x={11.7} y={0.12} z={z + 0.04} /></g>)}

    {/* ===== Bathroom ===== */}
    <Bath />
    <PedestalSink x={16.9} />
    <ToiletX y={1.9} />
    <Box x={17.2} y={4.8} w={0.55} d={0.65} h={0.7} c={['#d9b98a', '#c4a070', '#ad8a5c']} />
    <Plant x={17.4} y={1.4} s={0.9} />

    <LowWallX x={9.2} y0={0} y1={6.1} gaps={[[3.2, 4.6]]} />
    <LowWallY y={6.1} x0={0} x1={9.2} />
    <LowWallX x={12.4} y0={0} y1={6.05} gaps={[[3.5, 4.9]]} />
    <LowWallY y={2.5} x0={9.2} x1={12.4} gaps={[[10.2, 11.4]]} />
    <LowWallY y={6.05} x0={12.4} x1={BX} />

    {/* ===== Landing + stairwell ===== */}
    <Stairwell onClick={goDown} />
    <Box x={9.4} y={5.0} w={0.5} d={0.5} h={0.75} c={MAHOG} /><Knick at={[9.65, 5.25, 0.75]} k={5} />

    {/* ===== Nanny & Grandad's room ===== */}
    <Cabinet x={0} y={7.9} w={0.6} d={0.6} h={0.6} c={MAHOG} face="x" art="drawers" n={2} /><Lamp x={0.3} y={8.2} z={0.6} />
    <BedX y0={8.6} wid={2.4} len={3.0} duvet="#e3b08a" frame={MAHOG} pillows={2} />
    <Cabinet x={0} y={11.1} w={0.6} d={0.6} h={0.6} c={MAHOG} face="x" art="drawers" n={2} /><Lamp x={0.3} y={11.4} z={0.6} /><Knick at={[0.35, 11.6, 0.6]} k={1} />
    <Cabinet x={0} y={12.2} w={0.85} d={1.75} h={2.5} c={MAHOG} face="x" top={MAHOG} />
    <Cabinet x={3.2} y={6.2} w={1.8} d={0.6} h={0.75} c={MAHOG} art="drawers" n={2} />
    <Box x={3.7} y={6.25} z={0.75} w={0.8} d={0.06} h={0.85} c={MAHOG} />
    <FaceY y={6.31} x0={3.7} z1={1.55}><ellipse cx={40} cy={42} rx={34} ry={38} fill="#d7e6ea" stroke="#c9a54a" strokeWidth={4} /></FaceY>
    <Knicks list={[[3.4, 6.6, 0.75], [4.8, 6.6, 0.75], [4.6, 6.45, 0.75]]} k0={5} />
    <Box x={3.85} y={7.1} w={0.5} d={0.45} h={0.45} c={['#e3b08a', '#c9966e', '#b0825c']} />
    <Box x={3.45} y={9.0} w={0.5} d={1.8} h={0.45} c={['#e3b08a', '#c9966e', '#b0825c']} />
    {[[3.6, 11.4], [3.85, 11.4]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.18} d={0.32} h={0.08} c={['#8f3f45', '#773338', '#622a2e']} />)}
    <Armchair x={7.0} y={12.3} />

    <LowWallX x={9.2} y0={6.1} y1={BY} gaps={[[6.6, 8.0]]} />
    <LowWallY y={8.3} x0={9.2} x1={BX} gaps={[[9.6, 11.0]]} />

    {/* ===== Pink bedroom ===== */}
    <Box x={13.1} y={8.4} w={0.6} d={0.6} h={0.6} c={WHITE} /><Lamp x={13.4} y={8.7} z={0.6} c="#f39ac6" />
    <BedY x0={14.0} y0={8.35} wid={1.5} len={2.6} duvet="#f39ac6" />
    <Box x={16.2} y={8.45} w={0.9} d={0.5} h={0.5} c={['#fbf8f2', '#f7c6d6', '#e9a8c0']} />
    <Teddy at={[16.5, 8.7, 0.5]} c="#e98a3a" />
    <Cabinet x={9.3} y={11.2} w={0.65} d={2.0} h={2.2} c={WHITE} face="x" top={WHITE} knob="#e85a7a" />
    <DollsHouse x={11.6} y={13.0} />

    {/* ===== Front walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} />
    <LowWallY y={BY} x0={0} x1={BX} />

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4.6, 0, 3.9]} text="Blue bedroom" />
    <Tag show={L} at={[10.8, 0.4, 2.9]} text="Airing cupboard" />
    <Tag show={L} at={[15.2, 0, 3.9]} text="Bathroom" />
    <Tag show={L} at={[10.8, 5.4, 1.4]} text="Landing" />
    <Tag show={L} at={[0, 10.0, 3.9]} text="Nanny & Grandad's room" />
    <Tag show={L} at={[14.2, 12.4, 1.9]} text="Pink bedroom" />
    <ClickTag at={[15.2, 7.2, 1.3]} text="Stairs ↓ Downstairs" onClick={goDown} />
  </ScrollStage>;
}

function FloorSwitch({ fl, setFl }) {
  const b = (id, label) => <button key={id} onClick={() => setFl(id)} style={{ border: 0, borderRadius: 999, padding: '8px 18px', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, background: fl === id ? '#fff6ea' : 'transparent', color: fl === id ? '#3b2a24' : '#fff6ea' }}>{label}</button>;
  return <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(59,42,36,.9)', zIndex: 2 }}>{b('down', 'Downstairs')}{b('up', 'Upstairs')}</div>;
}

function NannyHouseScene({ showLabels = true, animate = true, zoom = 0.75, floor = 'down' }) {
  const [fl, setFl] = React.useState(floor);
  React.useEffect(() => { setFl(floor); }, [floor]);
  const T = useClock(!animate);
  return <div style={{ position: 'absolute', inset: 0 }}>
    {fl === 'down' ? <Downstairs key="down" T={T} L={showLabels} zoom={zoom} goUp={() => setFl('up')} /> : <Upstairs key="up" L={showLabels} zoom={zoom} goDown={() => setFl('down')} />}
    <FloorSwitch fl={fl} setFl={setFl} />
  </div>;
}
window.NannyHouseScene = NannyHouseScene;
