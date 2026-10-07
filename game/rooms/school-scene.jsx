// School — one big scrolling map. Static scenery with idle-animated NPCs. Exports window.SchoolScene.
// Building (x 0–22, y 0–16), cut-away: full-height outer back walls, inner walls cut low with doorways.
//   Back row (y 0–7):    Callie's class (x 0–8) · Class 2 (x 8–16) · Hall / PE (x 16–22)
//   Corridor (y 7–9.5):  runs the full width; east end opens to the playground
//   Front row (y 9.5–16): Reception + main entrance (x 0–6) · Library corner (x 6–11) · Lunch hall (x 11–22)
// Playground outside (x 22–32, y 0–16).
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Tag, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const BX = 22, BY = 16, RH = 4.2, PX = 32, LOW = 0.55;
const ENTRANCE = { x0: 1.5, x1: 3.5 };     // front wall of Reception → Town map (outside)
const PLAY_DOOR = { y0: 7.2, y1: 9.3 };    // east end of corridor → Playground
const DOORS = { c1: [5, 6], c2: [13, 14], hall: [18, 19.5], recep: [2, 4.5], lib: [6.5, 10.5], lunch: [18, 20] };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };
const WALLC = ['#fffaf0', '#ead8b8', '#e3d0ae'];
const UNIFORM = { top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c' }, UNI_G = { top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c', dress: true };
const kidsLook = [LOOKS.girlPink, LOOKS.boyRed, LOOKS.girlBlue, LOOKS.boyGreen, LOOKS.girlCurly, LOOKS.boyCap].map((l, i) => ({ ...l, ...(l.dress ? UNI_G : UNIFORM) }));
const K = (i) => kidsLook[i % kidsLook.length];
const TXT = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 };

// ---------- Shell ----------
function Floors() {
  const tile = (x, y, w, d, a, b, s = 50) => { const t = []; for (let i = 0; i < w * 100 / s; i++) for (let j = 0; j < d * 100 / s; j++) t.push(<rect key={i + '-' + j} x={i * s} y={j * s} width={s} height={s} fill={(i + j) % 2 ? a : b} />); return <FloorPlane x={x} y={y}><g>{t}</g></FloorPlane>; };
  return <g>
    <polygon points={pts([[0, BY, 0], [PX, BY, 0], [PX, BY, -0.35], [0, BY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[PX, 0, 0], [PX, BY, 0], [PX, BY, -0.35], [PX, 0, -0.35]])} fill="#5a3d26" />
    {tile(0, 0, 8, 7, '#9fb4c9', '#94aac0')}
    {tile(8, 0, 8, 7, '#b4c79f', '#a9bd94')}
    <FloorPlane x={16} y={0}><rect width={600} height={700} fill="#d9a866" />{Array.from({ length: 30 }, (_, i) => <line key={i} x1={0} x2={600} y1={i * 24} y2={i * 24} stroke="#c4914f" strokeWidth={2} />)}
      <rect x={50} y={60} width={500} height={580} fill="none" stroke="#e0524a" strokeWidth={5} /><line x1={300} x2={300} y1={60} y2={640} stroke="#e0524a" strokeWidth={5} /><circle cx={300} cy={350} r={70} fill="none" stroke="#3f7fc4" strokeWidth={5} /></FloorPlane>
    <FloorPlane x={0} y={7}><rect width={BX * 100} height={250} fill="#e6e3da" />{Array.from({ length: 44 }, (_, i) => <line key={i} x1={i * 50} x2={i * 50} y1={0} y2={250} stroke="#d6d2c6" strokeWidth={2} />)}</FloorPlane>
    {tile(0, 9.5, 6, 6.5, '#ddd1bb', '#d2c5ad', 65)}
    <FloorPlane x={6} y={9.5}><rect width={500} height={650} fill="#b86a5a" /></FloorPlane>
    {tile(11, 9.5, 11, 6.5, '#ece2cc', '#ddd0b4')}
    <FloorPlane x={BX} y={0}><rect width={(PX - BX) * 100} height={BY * 100} fill="#6f7378" />{Array.from({ length: 120 }, (_, i) => { const a = Math.sin(i * 77.1) * 9999, b = Math.sin(i * 13.7) * 9999; return <circle key={i} cx={(a - Math.floor(a)) * 1000} cy={(b - Math.floor(b)) * 1600} r={2} fill="#62666b" />; })}</FloorPlane>
  </g>;
}

function BackWalls() {
  const segY = [[0, 8, '#f5e8cf'], [8, 16, '#e8f0dc'], [16, BX, '#f1e4cc']], segX = [[0, 7, '#e9d6b6'], [7, 9.5, '#e3d6c2'], [9.5, BY, '#e9d6b6']];
  return <g>
    {segY.map(([a, b, c]) => <polygon key={a} points={pts([[a, 0, 0], [b, 0, 0], [b, 0, RH], [a, 0, RH]])} fill={c} />)}
    {segX.map(([a, b, c]) => <polygon key={a} points={pts([[0, a, 0], [0, b, 0], [0, b, RH], [0, a, RH]])} fill={c} />)}
    <polygon points={pts([[-0.2, -0.2, RH], [BX, -0.2, RH], [BX, 0, RH], [0, 0, RH], [0, BY, RH], [-0.2, BY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[BX, -0.2, RH], [BX, 0, RH], [BX, 0, -0.35], [BX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, BY, RH], [0, BY, RH], [0, BY, -0.35], [-0.2, BY, -0.35]])} fill="#cdb791" />
    <polygon points={pts([[0, 0.01, 0], [BX, 0.01, 0], [BX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, BY, 0], [0.01, BY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
  </g>;
}

// Low cut-away wall along y (fixed y) or along x (fixed x), with door gaps [[a,b],...].
function LowWallY({ y, x0, x1, gaps = [] }) {
  const segs = []; let a = x0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { segs.push([a, g0]); a = g1; }); segs.push([a, x1]);
  return <g>{segs.filter(([s, e]) => e > s).map(([s, e]) => <Box key={s} x={s} y={y - 0.1} w={e - s} d={0.2} h={LOW} c={WALLC} />)}</g>;
}
function LowWallX({ x, y0, y1, gaps = [] }) {
  const segs = []; let a = y0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { segs.push([a, g0]); a = g1; }); segs.push([a, y1]);
  return <g>{segs.filter(([s, e]) => e > s).map(([s, e]) => <Box key={s} x={x - 0.1} y={s} w={0.2} d={e - s} h={LOW} c={WALLC} />)}</g>;
}

// ---------- Classroom pieces ----------
function Whiteboard({ x0, w = 3 }) {
  return <FaceY y={0.02} x0={x0} z1={2.7}>
    <rect x={-6} y={-6} width={w * 100 + 12} height={132} fill="#c9ced2" /><rect x={0} y={0} width={w * 100} height={120} fill="#fbfbf8" />
    <text x={20} y={40} fontSize={26} fill="#3f7fc4" {...TXT}>2 + 3 = 5</text>
    <text x={20} y={86} fontSize={24} fill="#e0524a" {...TXT}>Aa Bb Cc</text>
    <circle cx={w * 100 - 50} cy={45} r={20} fill="none" stroke="#f2a127" strokeWidth={4} />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1={w * 100 - 50 + Math.cos(a * Math.PI / 180) * 26} y1={45 + Math.sin(a * Math.PI / 180) * 26} x2={w * 100 - 50 + Math.cos(a * Math.PI / 180) * 34} y2={45 + Math.sin(a * Math.PI / 180) * 34} stroke="#f2a127" strokeWidth={3} />)}
    <rect x={20} y={124} width={w * 100 - 40} height={6} fill="#9aa1a6" />
  </FaceY>;
}
function Frieze({ x0, n = 12 }) {
  const c = ['#e0524a', '#f2a127', '#f2c94c', '#5fbf6a', '#3fb6c9', '#3f7fc4', '#7a4fd1', '#e85a7a'];
  return <FaceY y={0.02} x0={x0} z1={3.55}>{Array.from({ length: n }, (_, i) => <g key={i}><rect x={i * 26} y={0} width={24} height={30} fill={c[i % 8]} /><text x={i * 26 + 12} y={22} textAnchor="middle" fontSize={16} fill="#fff" {...TXT}>{String.fromCharCode(65 + i)}</text></g>)}</FaceY>;
}
function SchoolWindowX({ y1, w = 1.6 }) {
  return <FaceX x={0.02} y1={y1} z1={3.4}><rect x={-5} y={-5} width={w * 100 + 10} height={140} fill="#fff" /><rect x={0} y={0} width={w * 100} height={130} fill="#cfe3d2" /><line x1={w * 50} x2={w * 50} y1={0} y2={130} stroke="#fff" strokeWidth={5} /><line x1={0} x2={w * 100} y1={50} y2={50} stroke="#fff" strokeWidth={5} /></FaceX>;
}
function CoatPegs({ y0, y1 }) {
  const bags = ['#e0524a', '#3f7fc4', '#f39ac6', '#5fbf6a', '#f2c94c', '#7a4fd1', '#3fb6c9', '#e98a3a'];
  const n = Math.floor((y1 - y0) / 0.42);
  return <FaceX x={0.03} y1={y1} z1={1.75}><rect x={0} y={0} width={(y1 - y0) * 100} height={10} fill="#c99a5c" />{Array.from({ length: n }, (_, i) => <g key={i}><circle cx={20 + i * 42} cy={16} r={4} fill="#9aa1a6" /><path d={`M${8 + i * 42},20 h24 l4,${50 + (i % 3) * 10} h-32z`} fill={bags[i % 8]} /><rect x={12 + i * 42} y={0} width={18} height={9} fill="#fbf8f2" /></g>)}</FaceX>;
}
function KidsTable({ x, y, w = 1.6, d = 0.9 }) {
  return <g>
    {[[x + 0.08, y + d - 0.12], [x + w - 0.12, y + d - 0.12]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.06} d={0.06} h={0.6} c={['#5b5f66', '#41454b', '#33363b']} />)}
    <Box x={x} y={y} z={0.6} w={w} d={d} h={0.05} c={OAK} />
    {[[0.2, '#fbf8f2'], [0.7, '#fbf8f2'], [1.15, '#bcdcea']].filter(([a]) => a < w - 0.3).map(([a, c], i) => <Box key={i} x={x + a} y={y + 0.2 + (i % 2) * 0.25} z={0.65} w={0.3} d={0.22} h={0.01} c={[c, c, c]} />)}
    <Box x={x + w / 2 - 0.1} y={y + d / 2 - 0.1} z={0.65} w={0.2} d={0.2} h={0.18} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />
  </g>;
}
function SmallChair({ x, y, c = '#3f7fc4', back = 'n' }) {
  const cc = [c, shade(c, -0.12), shade(c, -0.22)];
  return <g><Box x={x} y={y} w={0.36} d={0.36} h={0.36} c={cc} />{back === 'n' ? <Box x={x} y={y} z={0.36} w={0.36} d={0.05} h={0.35} c={cc} /> : <Box x={x} y={y + 0.31} z={0.36} w={0.36} d={0.05} h={0.35} c={cc} />}</g>;
}
function TeacherDesk({ x, y }) {
  return <g>
    <Box x={x} y={y} w={1.4} d={0.7} h={0.75} c={OAK} />
    <Box x={x + 0.2} y={y + 0.1} z={0.75} w={0.45} d={0.32} h={0.03} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={x + 0.9} y={y + 0.15} z={0.75} w={0.3} d={0.25} h={0.15} c={['#e0524a', '#3f7fc4', '#f2c94c']} />
    <Box x={x + 1.1} y={y + 0.45} z={0.75} w={0.1} d={0.1} h={0.12} c={['#fbf8f2', '#e85a7a', '#e85a7a']} />
  </g>;
}
function ReadingCorner({ x, y }) {
  return <g>
    <FloorPlane z={0.008} x={x} y={y}><rect width={150} height={230} rx={20} fill="#f2c94c" /><rect x={15} y={15} width={120} height={200} rx={14} fill="none" stroke="#e0524a" strokeWidth={6} />{[0, 1, 2].map(i => <circle key={i} cx={75} cy={50 + i * 65} r={18} fill="#3fb6c9" />)}</FloorPlane>
    <Box x={x + 0.1} y={y + 0.1} w={0.7} d={0.4} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} />
    {[0, 1, 2, 3, 4].map(i => <Box key={i} x={x + 0.15 + i * 0.12} y={y + 0.15} z={0.45} w={0.1} d={0.28} h={0.22 + (i % 2) * 0.05} c={[['#3f7fc4', '#f2c94c', '#5fbf6a', '#e85a7a', '#7a4fd1'][i], '#fbf8f2', '#e6e1d6']} />)}
  </g>;
}
function DisplayBoard({ x0, w, z1 = 2.6, art = 'paint' }) {
  const c = ['#e0524a', '#f2c94c', '#3fb6c9', '#5fbf6a', '#f39ac6', '#7a4fd1'];
  return <FaceY y={0.02} x0={x0} z1={z1}><rect x={0} y={0} width={w * 100} height={110} fill="#3f6e9a" /><rect x={4} y={4} width={w * 100 - 8} height={102} fill="none" stroke="#f2c94c" strokeWidth={4} strokeDasharray="10 6" />
    {Array.from({ length: Math.floor(w * 100 / 42) }, (_, i) => <g key={i} transform={`translate(${10 + i * 42} ${14 + (i % 2) * 40}) rotate(${(i % 3 - 1) * 4})`}><rect width={34} height={40} fill="#fbf8f2" />{art === 'paint' ? <><circle cx={17} cy={16} r={9} fill={c[i % 6]} /><rect x={6} y={28} width={22} height={6} fill={c[(i + 2) % 6]} /></> : <path d="M6,32 L17,8 L28,32Z" fill={c[i % 6]} />}</g>)}
  </FaceY>;
}
function SinkUnit({ x }) {
  return <g><Box x={x} y={0.05} w={1.2} d={0.55} h={0.85} c={WHITE} /><Box x={x + 0.2} y={0.12} z={0.85} w={0.5} d={0.38} h={0.04} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />{ln([x + 0.45, 0.1, 0.89], [x + 0.45, 0.1, 1.15], '#9aa1a6', 3, 't')}{[0, 1, 2].map(i => <Box key={i} x={x + 0.8 + i * 0.12} y={0.15} z={0.85} w={0.1} d={0.1} h={0.16} c={[['#e0524a', '#3f7fc4', '#f2c94c'][i], '#ddd', '#ccc']} />)}</g>;
}
function Easel({ x, y }) {
  return <FaceY y={y} x0={x} z1={1.55}><line x1={30} x2={20} y1={0} y2={155} stroke="#c99560" strokeWidth={5} /><line x1={10} x2={0} y1={60} y2={155} stroke="#c99560" strokeWidth={4} /><line x1={50} x2={60} y1={60} y2={155} stroke="#c99560" strokeWidth={4} /><rect x={-2} y={14} width={64} height={70} fill="#fbf8f2" stroke="#c99560" strokeWidth={2} /><circle cx={22} cy={40} r={12} fill="#f2c94c" /><path d="M4,74 q20,-24 52,-8 v18 h-52z" fill="#5fbf6a" /><path d="M36,34 l14,0" stroke="#3fb6c9" strokeWidth={6} /></FaceY>;
}

// ---------- Hall / PE ----------
function WallBars() {
  return <FaceY y={0.03} x0={16.4} z1={3.2}>{[0, 1, 2, 3].map(i => <g key={i}><rect x={i * 60} y={0} width={8} height={320} fill="#c99560" /><rect x={i * 60 + 46} y={0} width={8} height={320} fill="#c99560" />{Array.from({ length: 14 }, (_, k) => <rect key={k} x={i * 60} y={10 + k * 22} width={54} height={5} fill="#d9a866" />)}</g>)}</FaceY>;
}
function ClimbRopes() { return <g>{[20.2, 20.8, 21.4].map((x, i) => <g key={x}>{ln([x, 1.0, RH], [x, 1.0, 0.4 + i * 0.1], '#c9a777', 5, 'r')}</g>)}</g>; }
function GymMat({ x, y, w = 1.6, d = 1.1 }) { return <Box x={x} y={y} w={w} d={d} h={0.12} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />; }
function PEBench({ x, y, w = 2.4 }) { return <g>{[x + 0.15, x + w - 0.25].map(a => <Box key={a} x={a} y={y} w={0.1} d={0.3} h={0.38} c={['#5b5f66', '#41454b', '#33363b']} />)}<Box x={x} y={y} z={0.38} w={w} d={0.3} h={0.07} c={['#d9a866', '#c4914f', '#ab7d42']} /></g>; }
function Hoops() { return <FloorPlane z={0.01} x={19.2} y={2.2}>{[['#e0524a', 0, 0], ['#f2c94c', 70, 30], ['#5fbf6a', 20, 80], ['#3f7fc4', 100, 100]].map(([c, x, y], i) => <circle key={i} cx={x + 30} cy={y + 30} r={30} fill="none" stroke={c} strokeWidth={7} />)}</FloorPlane>; }
function Cones() { return <g>{[[17.0, 4.6], [17.8, 4.6], [18.6, 4.6], [19.4, 4.6]].map(([x, y], i) => { const [cx, cy] = P(x, y, 0); return <path key={i} d={`M${cx - 9},${cy} L${cx},${cy - 24} L${cx + 9},${cy}Z`} fill="#f2a127" stroke="#d98a1a" />; })}</g>; }
function Ball({ at, c = '#e0524a', r = 9 }) { const [x, y] = P(...at); return <g><ellipse cx={x} cy={y + r * 0.2} rx={r} ry={r * 0.4} fill="rgba(0,0,0,.15)" /><circle cx={x} cy={y - r} r={r} fill={c} /><path d={`M${x - r * 0.7},${y - r * 1.4} q${r * 0.7},${r * 0.5} ${r * 1.4},0`} fill="none" stroke="#fff" strokeWidth={2} /></g>; }

// ---------- Corridor ----------
function NoticeBoard() {
  return <FaceX x={0.03} y1={9.2} z1={2.6}><rect x={0} y={0} width={190} height={110} fill="#c99560" /><rect x={6} y={6} width={178} height={98} fill="#d9b57a" />{[[14, 14, '#fbf8f2'], [70, 20, '#f2c94c'], [128, 12, '#bcdcea'], [24, 62, '#f7c6d6'], [96, 60, '#fbf8f2']].map(([x, y, c], i) => <g key={i}><rect x={x} y={y} width={46} height={34} fill={c} transform={`rotate(${(i % 3 - 1) * 4} ${x + 23} ${y + 17})`} /><circle cx={x + 23} cy={y + 3} r={3} fill="#e0524a" /></g>)}</FaceX>;
}
function WaterFountain({ x }) { return <g><Box x={x} y={7.15} w={0.5} d={0.4} h={0.9} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} /><FloorPlane z={0.901} x={x + 0.08} y={7.2}><ellipse cx={17} cy={14} rx={14} ry={10} fill="#8fd0e0" /></FloorPlane></g>; }
function Lockers({ x0, n }) {
  const c = ['#3f7fc4', '#5fbf6a', '#f2c94c', '#e0524a'];
  return <g>{Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0 + i * 0.45} y={7.12} w={0.43} d={0.4} h={1.5} c={[shade(c[i % 4], 0.1), c[i % 4], shade(c[i % 4], -0.2)]} /><FaceY y={7.52} x0={x0 + i * 0.45} z1={1.5}><rect x={10} y={20} width={22} height={4} fill="rgba(0,0,0,.25)" /><rect x={10} y={30} width={22} height={4} fill="rgba(0,0,0,.25)" /><circle cx={34} cy={80} r={3} fill="#2a2a2c" /></FaceY></g>)}</g>;
}

// ---------- Reception ----------
function SchoolSign() {
  return <FaceX x={0.03} y1={13.6} z1={3.3}><rect x={0} y={0} width={300} height={100} rx={10} fill="#3f6e9a" /><circle cx={50} cy={50} r={34} fill="#f2c94c" /><path d="M50,24 C36,40 36,58 50,74 C64,58 64,40 50,24Z" fill="#3f8a5a" /><rect x={47} y={64} width={6} height={16} fill="#7a5a3a" /><text x={190} y={45} textAnchor="middle" fontSize={24} fill="#fbf8f2" {...TXT}>Oakfield</text><text x={190} y={76} textAnchor="middle" fontSize={20} fill="#f2c94c" {...TXT}>Primary School</text></FaceX>;
}
function TrophyCabinet() {
  return <g><Box x={0.02} y={14.0} w={0.5} d={1.4} h={1.8} c={['#a8774a', '#8c6238', '#78532f']} />
    <FaceX x={0.52} y1={15.4} z1={1.8}><rect x={8} y={8} width={124} height={160} fill="#d4ecf0" fillOpacity={.6} />{[0, 1, 2].map(r => <g key={r}><rect x={8} y={60 + r * 52} width={124} height={4} fill="#78532f" />{[0, 1, 2].map(k => <g key={k}><path d={`M${24 + k * 40},${30 + r * 52} h20 q0,18 -10,22 q-10,-4 -10,-22z`} fill={k === 1 ? '#c9ced2' : '#e3b04a'} /><rect x={30 + k * 40} y={52 + r * 52} width={8} height={8} fill="#78532f" /></g>)}</g>)}</FaceX></g>;
}
function ReceptionDesk() {
  return <g><Box x={2.4} y={10.3} w={3.2} d={0.7} h={1.05} c={['#d9a866', '#3f6e9a', '#336aa6']} />
    <FaceY y={11.0} x0={2.4} z1={1.05}><text x={160} y={60} textAnchor="middle" fontSize={28} fill="#fbf8f2" {...TXT}>RECEPTION</text></FaceY>
    <Box x={2.6} y={10.4} z={1.05} w={0.45} d={0.08} h={0.35} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={4.6} y={10.5} z={1.05} w={0.3} d={0.25} h={0.04} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={5.0} y={10.45} z={1.05} w={0.3} d={0.3} h={0.25} c={['#5fbf6a', '#4aa055', '#3f8a4a']} /></g>;
}
function WaitingChairs() { return <g>{[11.6, 12.3, 13.0].map(y => <g key={y}><Box x={0.2} y={y} w={0.5} d={0.55} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} /><Box x={0.2} y={y} z={0.45} w={0.1} d={0.55} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} /></g>)}</g>; }
function Plant({ x, y }) { const [px, py] = P(x + 0.2, y + 0.2, 0.45); return <g><Box x={x} y={y} w={0.4} d={0.4} h={0.45} c={['#e9e4da', '#d6d0c4', '#c9c2b4']} />{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={px + (i % 2 ? 1 : -1) * (8 + i * 3)} cy={py - 14 - i * 12} rx={16} ry={6} transform={`rotate(${i % 2 ? 30 : -30} ${px + (i % 2 ? 1 : -1) * (8 + i * 3)} ${py - 14 - i * 12})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}</g>; }

// ---------- Library ----------
function Bookcase({ x, y, w = 2.1, h = 1.8 }) {
  const c = ['#e0524a', '#3f7fc4', '#f2c94c', '#5fbf6a', '#7a4fd1', '#e85a7a', '#3fb6c9', '#e98a3a'];
  return <g><Box x={x} y={y} w={w} d={0.4} h={h} c={['#a8774a', '#8c6238', '#78532f']} />
    <FaceY y={y + 0.4} x0={x} z1={h}>{Array.from({ length: Math.round(h / 0.45) }, (_, r) => <g key={r}><rect x={6} y={8 + r * 45} width={w * 100 - 12} height={37} fill="#5a412a" />{Array.from({ length: Math.floor((w * 100 - 16) / 11) }, (_, k) => <rect key={k} x={8 + k * 11} y={14 + r * 45 + (k * 7 % 5)} width={9} height={31 - (k * 7 % 5)} fill={c[(k + r * 3) % 8]} />)}</g>)}</FaceY></g>;
}
function Beanbag({ x, y, c }) { const [bx, by] = P(x, y, 0.25); return <g><ellipse cx={bx} cy={by + 14} rx={40} ry={16} fill="rgba(0,0,0,.15)" /><path d={`M${bx - 40},${by + 10} Q${bx - 44},${by - 30} ${bx},${by - 34} Q${bx + 44},${by - 30} ${bx + 40},${by + 10} Q${bx},${by + 26} ${bx - 40},${by + 10}Z`} fill={c} stroke={shade(c, -0.2)} strokeWidth={2} /></g>; }
function LibraryRug() { return <FloorPlane z={0.008} x={8.5} y={12.3}><circle r={130} fill="#f2e3b0" /><circle r={100} fill="none" stroke="#3f8a5a" strokeWidth={10} /><circle r={50} fill="#5fbf6a" /></FloorPlane>; }

// ---------- Lunch hall ----------
function ServingCounter() {
  const food = ['#f2c94c', '#e98a3a', '#5fbf6a', '#c4433c', '#f4efe4'];
  return <g><Box x={11.5} y={10.0} w={5.0} d={0.7} h={0.95} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    {food.map((c, i) => <g key={i}><Box x={11.7 + i * 0.95} y={10.1} z={0.95} w={0.8} d={0.5} h={0.06} c={['#9aa1a6', '#8a9196', '#7a8186']} /><FloorPlane z={1.011} x={11.75 + i * 0.95} y={10.15}>{Array.from({ length: 8 }, (_, k) => <circle key={k} cx={10 + (k % 4) * 20} cy={12 + Math.floor(k / 4) * 22} r={8} fill={shade(c, (k % 2) * 0.08)} />)}</FloorPlane></g>)}
    <polygon points={pts([[11.5, 10.75, 1.45], [16.5, 10.75, 1.45], [16.5, 10.75, 1.5], [11.5, 10.75, 1.5]])} fill="#c9ced2" />
    <polygon points={pts([[11.5, 10.75, 1.0], [16.5, 10.75, 1.0], [16.5, 10.75, 1.45], [11.5, 10.75, 1.45]])} fill="#d4ecf0" fillOpacity={.3} stroke="#a9c4c9" />
    {[0, 1, 2, 3, 4, 5].map(i => <Box key={i} x={16.6} y={10.1} z={i * 0.05} w={0.5} d={0.4} h={0.04} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />)}</g>;
}
function LunchTable({ y, x0 = 12.2, len = 8.6 }) {
  return <g>
    <Box x={x0} y={y - 0.5} w={len} d={0.3} h={0.38} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />
    {[x0 + 0.2, x0 + len - 0.3].map(a => <Box key={a} x={a} y={y + 0.55} w={0.1} d={0.1} h={0.65} c={['#5b5f66', '#41454b', '#33363b']} />)}
    <Box x={x0} y={y} z={0.65} w={len} d={0.75} h={0.05} c={['#e6e3da', '#d6d2c6', '#c9c4b8']} />
    {Array.from({ length: 7 }, (_, i) => <g key={i}><Box x={x0 + 0.4 + i * 1.2} y={y + 0.05} z={0.7} w={0.45} d={0.3} h={0.03} c={['#3f7fc4', '#336aa6', '#2b5a8e']} /><FloorPlane z={0.731} x={x0 + 0.45 + i * 1.2} y={y + 0.08}><circle cx={12} cy={12} r={9} fill="#f2c94c" /><rect x={22} y={6} width={14} height={12} fill="#5fbf6a" /></FloorPlane></g>)}
    <Box x={x0 + len / 2} y={y + 0.3} z={0.7} w={0.14} d={0.14} h={0.28} c={['#d4ecf0', '#bcdcea', '#a9c9d6']} />
  </g>;
}
const FrontBench = ({ y, x0 = 12.2, len = 8.6 }) => <Box x={x0} y={y + 0.95} w={len} d={0.3} h={0.38} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />;
function Bins() { return <g>{[['#3f7fc4', 0], ['#5fbf6a', 0.5], ['#5b5f66', 1.0]].map(([c, o]) => <Box key={o} x={21.0} y={10.0 + o} w={0.42} d={0.42} h={0.8} c={[shade(c, 0.1), c, shade(c, -0.2)]} />)}</g>; }

// ---------- Playground ----------
function PlaygroundMarkings() {
  return <FloorPlane z={0.006} x={BX}>
    {/* hopscotch */}
    {[[150, 1000, 1], [150, 1080, 2], [110, 1160, 3], [190, 1160, 4], [150, 1240, 5], [110, 1320, 6], [190, 1320, 7], [150, 1400, 8]].map(([x, y, n]) => <g key={n}><rect x={x} y={y} width={78} height={78} fill="none" stroke="#f2c94c" strokeWidth={5} /><text x={x + 39} y={y + 52} textAnchor="middle" fontSize={34} fill="#f2c94c" {...TXT}>{n}</text></g>)}
    {/* snakes & ladders */}
    <g transform="translate(480 860)">{Array.from({ length: 25 }, (_, i) => <rect key={i} x={(i % 5) * 60} y={Math.floor(i / 5) * 60} width={60} height={60} fill={(i + Math.floor(i / 5)) % 2 ? '#e0524a' : '#f2c94c'} opacity={.8} />)}<path d="M40,30 C120,80 60,170 200,250" stroke="#5fbf6a" strokeWidth={14} fill="none" strokeLinecap="round" /><path d="M230,40 L260,230 M260,40 L290,230" stroke="#fbf8f2" strokeWidth={6} />{[60, 100, 140, 180].map(y => <line key={y} x1={232 + y / 6.3} x2={262 + y / 6.3} y1={y} y2={y} stroke="#fbf8f2" strokeWidth={5} />)}</g>
    {/* four square + compass */}
    <g transform="translate(560 1260)"><rect width={240} height={240} fill="none" stroke="#fbf8f2" strokeWidth={6} /><line x1={120} x2={120} y1={0} y2={240} stroke="#fbf8f2" strokeWidth={6} /><line x1={0} x2={240} y1={120} y2={120} stroke="#fbf8f2" strokeWidth={6} /></g>
    <circle cx={480} cy={500} r={110} fill="none" stroke="#3fb6c9" strokeWidth={8} /><circle cx={480} cy={500} r={14} fill="#3fb6c9" />
  </FloorPlane>;
}
function Goal() { const x = 31.4; return <g>{ln([x, 3.0, 0], [x, 3.0, 1.3], '#fbf8f2', 6, 'a')}{ln([x, 5.4, 0], [x, 5.4, 1.3], '#fbf8f2', 6, 'b')}{ln([x, 3.0, 1.3], [x, 5.4, 1.3], '#fbf8f2', 6, 'c')}{ln([x + 0.5, 3.0, 0], [x, 3.0, 1.3], '#c9ced2', 2, 'd')}{ln([x + 0.5, 5.4, 0], [x, 5.4, 1.3], '#c9ced2', 2, 'e')}<polygon points={pts([[x, 3.0, 1.3], [x, 5.4, 1.3], [x + 0.5, 5.4, 0], [x + 0.5, 3.0, 0]])} fill="#fbf8f2" fillOpacity={.15} stroke="#c9ced2" strokeDasharray="4 4" /></g>; }
function PlayFrame() {
  const W = ['#b8875a', '#9a6e47', '#85603c'];
  return <g>{[[23.5, 1.2], [25.5, 1.2], [23.5, 2.8], [25.5, 2.8]].map(([x, y], i) => <Box key={i} x={x} y={y} w={0.12} d={0.12} h={1.8} c={W} />)}
    <Box x={23.5} y={1.2} z={1.0} w={2.1} d={1.7} h={0.1} c={W} />
    {[0.3, 0.6, 1.2, 1.5].map(z => ln([23.55, 2.9, z], [25.6, 2.9, z], '#e0524a', 4, z))}
    <polygon points={pts([[25.6, 1.5, 1.0], [25.6, 2.3, 1.0], [27.0, 2.3, 0.1], [27.0, 1.5, 0.1]])} fill="#3fb6c9" stroke="#2f96a6" strokeWidth={2} /></g>;
}
function PlayTree({ x, y, s = 1 }) { const [tx, ty] = P(x, y, 0), [cx, cy] = P(x, y, 3.2 * s); return <g><path d={`M${tx - 8},${ty} q-4,-${110 * s} 8,-${240 * s} q12,${130 * s} 8,${240 * s}Z`} fill="#7a5a3a" />{[[-50, 20, 60], [10, -30, 70], [60, 10, 58], [-10, 40, 50]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx * s} cy={cy + dy * s} r={r * s} fill={['#6b9a44', '#7aa84e', '#8fbf5a'][i % 3]} />)}</g>; }
function PlayFence({ x0, y0, x1, y1, h = 1.6 }) { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.3), p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push(ln([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0], [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, h], '#3f6e4a', 2.5, i)); } return <g>{p}{ln([x0, y0, h], [x1, y1, h], '#3f6e4a', 4, 't')}{ln([x0, y0, h * 0.5], [x1, y1, h * 0.5], '#3f6e4a', 3, 'm')}</g>; }
function PlayBench({ x, y }) { return <g>{[x + 0.1, x + 1.3].map(a => <Box key={a} x={a} y={y} w={0.1} d={0.45} h={0.45} c={['#3a3a3c', '#2a2a2c', '#202022']} />)}<Box x={x} y={y} z={0.45} w={1.5} d={0.45} h={0.07} c={['#b8875a', '#9a6e47', '#85603c']} /><Box x={x} y={y - 0.04} z={0.55} w={1.5} d={0.06} h={0.4} c={['#b8875a', '#9a6e47', '#85603c']} /></g>; }

// Doorway → Town map (main entrance, front wall of Reception)
function MainEntrance() {
  return <a href="Town Map.dc.html" style={{ cursor: 'pointer' }}>
    <FloorPlane z={0.01} x={ENTRANCE.x0} y={BY - 0.8}><rect width={(ENTRANCE.x1 - ENTRANCE.x0) * 100} height={70} rx={6} fill="#6f6863" /><text x={(ENTRANCE.x1 - ENTRANCE.x0) * 50} y={45} textAnchor="middle" fontSize={26} fill="#fbf8f2" {...TXT}>WELCOME</text></FloorPlane>
    <FloorPlane z={0.011} x={ENTRANCE.x0} y={BY - 0.1}><rect width={(ENTRANCE.x1 - ENTRANCE.x0) * 100} height={30} fill="#9aa1a6" /></FloorPlane>
    <polygon points={pts([[ENTRANCE.x0, BY, 0], [ENTRANCE.x1, BY, 0], [ENTRANCE.x1, BY, 2.4], [ENTRANCE.x0, BY, 2.4]])} fill="#fff" fillOpacity={0.001} />
  </a>;
}
// Doorway → Playground (east end of the corridor)
function PlaygroundDoor() { return <FloorPlane z={0.01} x={BX - 0.1} y={PLAY_DOOR.y0}><rect width={20} height={(PLAY_DOOR.y1 - PLAY_DOOR.y0) * 100} fill="#9aa1a6" /></FloorPlane>; }

// ---------- Scrolling stage ----------
function ScrollStage({ zoom, label, children }) {
  const ref = React.useRef(null), drag = React.useRef(null);
  const VB = { x: -400, y: -40, w: 3820, h: 2660 };
  React.useEffect(() => { const el = ref.current; if (!el) return; const [fx, fy] = P(5, 9, 0); el.scrollLeft = Math.max(0, (fx - VB.x) * zoom - el.clientWidth / 2); el.scrollTop = Math.max(0, (fy - VB.y) * zoom - el.clientHeight / 2); }, [zoom]);
  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, l: ref.current.scrollLeft, t: ref.current.scrollTop, moved: false }; };
  const move = (e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; ref.current.scrollLeft = d.l - dx; ref.current.scrollTop = d.t - dy; };
  const up = () => { setTimeout(() => { drag.current = null; }, 0); };
  const click = (e) => { if (drag.current && drag.current.moved) { e.preventDefault(); e.stopPropagation(); } };
  return <div ref={ref} data-screen-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClickCapture={click}
    style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#efe2d0', cursor: 'grab', userSelect: 'none' }}>
    <svg width={VB.w * zoom} height={VB.h * zoom} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{ display: 'block' }}>{children}</svg>
  </div>;
}

function SchoolScene({ showLabels = true, animate = true, zoom = 0.75 }) {
  const T = useClock(!animate);
  const L = showLabels;
  const kid = (at, i, p = {}) => <Person key={at.join(',')} at={at} s={0.72} look={K(i)} T={T} ph={i * 0.7} {...p} />;
  const adult = (at, look, p = {}) => <Person key={at.join(',')} at={at} s={1.02} look={look} T={T} ph={at[0]} {...p} />;
  // tag game in the playground — three kids running round a circle
  const tagKids = [0, 1, 2].map(i => { const a = T * 0.9 + i * 2.1; return kid([27.2 + Math.cos(a) * 1.6, 5.0 + Math.sin(a) * 1.2, 0], i + 3, { pose: i === 0 ? 'wave' : 'stand', flip: Math.sin(a) > 0, armL: 30, armR: 30 }); });
  const hop = Math.abs(Math.sin(T * 4)) * 0.25, skip = Math.abs(Math.sin(T * 6)) * 0.18;
  const ropeA = T * 6, [sx, sy] = P(25.2, 7.6, 0);
  const groups = [[0.8, 3.3], [4.3, 3.3], [0.8, 5.2], [4.3, 5.2]];

  return <ScrollStage zoom={zoom} label="School">
    <Floors />
    <BackWalls />

    {/* ===== Callie's class (x 0–8, y 0–7) ===== */}
    <Whiteboard x0={1.6} w={3.2} />
    <Frieze x0={0.4} n={14} />
    <SchoolWindowX y1={3.2} /><SchoolWindowX y1={5.6} />
    <CoatPegs y0={0.6} y1={6.6} />
    {adult([5.2, 1.3, 0], LOOKS.mumBun, { pose: 'wave' })}
    <TeacherDesk x={5.9} y={0.9} />
    <ReadingCorner x={6.2} y={3.2} />
    {kid([6.6, 4.2, 0], 2, { pose: 'sit', armL: 70, armR: 70 })}
    {groups.map(([gx, gy], g) => <g key={g}>
      <SmallChair x={gx + 0.25} y={gy - 0.45} c="#3f7fc4" /><SmallChair x={gx + 1.0} y={gy - 0.45} c="#e0524a" />
      {kid([gx + 0.43, gy - 0.25, 0.36], g * 4, { pose: 'sit', armL: 50, armR: 50 })}
      {kid([gx + 1.18, gy - 0.25, 0.36], g * 4 + 1, { pose: 'sit', armR: g === 1 ? 150 : 50, armL: 50 })}
      <KidsTable x={gx} y={gy} />
      {g !== 3 && kid([gx + 0.8, gy + 1.15, 0.36], g * 4 + 2, { pose: 'sit', facing: 'back', armL: 40, armR: 40 })}
      {g !== 3 && <SmallChair x={gx + 0.62} y={gy + 1.0} c="#5fbf6a" back="s" />}
    </g>)}
    <LowWallX x={8} y0={0} y1={7} />

    {/* ===== Class 2 (x 8–16, y 0–7) ===== */}
    <DisplayBoard x0={8.4} w={1.4} />
    <Whiteboard x0={10.2} w={3.0} />
    <DisplayBoard x0={13.4} w={1.0} art="tri" />
    <SinkUnit x={14.6} />
    {adult([12.9, 1.5, 0], LOOKS.dad, { pose: 'reach' })}
    {[[9.0, 2.7], [12.0, 2.7], [9.0, 4.3], [12.0, 4.3], [9.0, 5.8]].map(([tx, ty], i) => <g key={i}>
      <SmallChair x={tx + 0.4} y={ty - 0.45} c="#f2c94c" /><SmallChair x={tx + 1.4} y={ty - 0.45} c="#7a4fd1" />
      {kid([tx + 0.58, ty - 0.25, 0.36], i * 2 + 1, { pose: 'sit', armL: 50, armR: 50 })}
      {i !== 4 && kid([tx + 1.58, ty - 0.25, 0.36], i * 2 + 2, { pose: 'sit', armL: 50, armR: i === 2 ? 150 : 50 })}
      <KidsTable x={tx} y={ty} w={2.2} d={0.7} />
    </g>)}
    {kid([15.5, 4.9, 0], 4, { facing: 'back', armR: 120 })}
    <Easel x={14.9} y={4.6} />
    <LowWallX x={16} y0={0} y1={7} />

    {/* ===== Hall / PE (x 16–22, y 0–7) ===== */}
    <WallBars />
    <ClimbRopes />
    {kid([17.3, 0.5, 1.0], 5, { pose: 'up', shadow: false })}
    <GymMat x={16.8} y={1.8} />
    {kid([17.6, 2.4, 0.12], 0, { pose: 'sit', armL: 160, armR: 160 })}
    <Hoops />
    {kid([19.9, 2.9, hop], 1, { pose: 'up' })}
    <Cones />
    {kid([18.2, 4.0, 0], 2, { armL: 30, armR: 30 })}
    {kid([20.8, 4.3, 0], 3, { pose: 'wave', flip: true })}
    <Ball at={[20.3, 4.8, 0]} c="#f2a127" />
    {adult([17.6, 5.6, 0], { ...LOOKS.boyCap, top: '#e0524a', legs: '#2f3a52', cap: '#2f3a52', long: true }, { pose: 'wave' })}
    <PEBench x={19.0} y={5.9} />
    {kid([20.0, 6.05, 0.45], 4, { pose: 'sit' })}

    <LowWallY y={7} x0={0} x1={BX} gaps={[DOORS.c1, DOORS.c2, DOORS.hall]} />

    {/* ===== Corridor (y 7–9.5) ===== */}
    <NoticeBoard />
    <Lockers x0={1.0} n={8} />
    <WaterFountain x={10.4} />
    <Lockers x0={14.6} n={7} />
    {kid([7.5, 8.2, 0], 5, { armL: 25, armR: 25 })}
    {kid([8.2, 8.6, 0], 0, { pose: 'wave', flip: true })}
    {kid([10.6, 7.9, 0], 3, { facing: 'back', pose: 'reach' })}
    {adult([17.2, 8.4, 0], LOOKS.gran, { armL: 60, armR: 60 })}
    <PlaygroundDoor />

    <LowWallY y={9.5} x0={0} x1={BX} gaps={[DOORS.recep, DOORS.lib, DOORS.lunch]} />

    {/* ===== Reception (x 0–6, y 9.5–16) ===== */}
    <SchoolSign />
    <TrophyCabinet />
    {adult([3.6, 10.0, 0], LOOKS.mum)}
    <ReceptionDesk />
    <WaitingChairs />
    {adult([0.45, 12.35, 0.45], LOOKS.grandad, { pose: 'sit' })}
    <Plant x={5.3} y={11.5} />
    {kid([3.2, 12.0, 0], 1, { facing: 'back', pose: 'wave' })}
    {adult([3.9, 12.3, 0], LOOKS.dad, { facing: 'back' })}
    <LowWallX x={6} y0={9.5} y1={BY} gaps={[[12.6, 13.6]]} />

    {/* ===== Library corner (x 6–11) ===== */}
    <Bookcase x={6.3} y={9.7} />
    <Bookcase x={8.6} y={9.7} />
    {kid([9.6, 10.5, 0], 2, { facing: 'back', pose: 'reach' })}
    <LibraryRug />
    <Beanbag x={7.3} y={12.0} c="#f2c94c" />
    {kid([7.3, 12.0, 0.15], 0, { pose: 'sit', armL: 70, armR: 70 })}
    <Beanbag x={9.7} y={12.6} c="#3fb6c9" />
    {kid([9.7, 12.6, 0.15], 4, { pose: 'sit', armL: 70, armR: 70 })}
    <Bookcase x={7.0} y={14.3} w={2.4} h={0.9} />
    {adult([10.2, 14.6, 0], { ...LOOKS.mum, hair: '#d9b46a', style: 'bob', glasses: true })}
    <LowWallX x={11} y0={9.5} y1={BY} />

    {/* ===== Lunch hall (x 11–22) ===== */}
    {adult([13.0, 9.75, 0], { ...LOOKS.gran, top: '#fbf8f2', apron: '#3fb6c9' }, { pose: 'reach' })}
    {adult([15.2, 9.75, 0], { ...LOOKS.mumBun, top: '#fbf8f2', apron: '#3fb6c9' })}
    <ServingCounter />
    <Bins />
    {[11.6, 13.4, 15.0].map((ty, r) => <g key={ty}>
      {[0, 1, 2, 3, 4].map(k => kid([12.8 + k * 1.7, ty - 0.35, 0.38], r * 5 + k, { pose: 'sit', armL: 50, armR: k % 2 ? 60 : 40 }))}
      <LunchTable y={ty} />
      {r < 2 && [0, 1, 2, 3].map(k => kid([13.6 + k * 1.8, ty + 1.1, 0.38], r * 4 + k + 2, { pose: 'sit', facing: 'back', armL: 40, armR: 40 }))}
      {r < 2 && <FrontBench y={ty} />}
    </g>)}
    {kid([18.6, 10.8, 0], 3, { facing: 'back' })}

    {/* ===== Outer low walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} gaps={[[PLAY_DOOR.y0, PLAY_DOOR.y1]]} />
    <LowWallY y={BY} x0={0} x1={BX} gaps={[[ENTRANCE.x0, ENTRANCE.x1]]} />
    <MainEntrance />

    {/* ===== Playground (x 22–32) ===== */}
    <PlayFence x0={BX + 0.2} y0={0} x1={PX} y1={0} />
    <PlaygroundMarkings />
    <PlayTree x={31.2} y={0.6} s={1.1} />
    <PlayFrame />
    {kid([24.4, 2.0, 1.1], 1, { pose: 'wave' })}
    <Goal />
    {kid([29.8, 4.2, 0], 5, { armL: 30, armR: 30 })}
    <Ball at={[30.5, 4.4, 0]} />
    {tagKids}
    <g>
      {kid([25.2, 7.6, skip], 2, { armL: 60, armR: 60 })}
      <g transform={`translate(${sx} ${sy - 60}) rotate(${Math.sin(ropeA) * 8})`}><ellipse cx={0} cy={0} rx={34} ry={64 * (0.6 + Math.abs(Math.cos(ropeA)) * 0.4)} fill="none" stroke="#e85a7a" strokeWidth={3} /></g>
    </g>
    {kid([23.9, 11.8, hop], 4, { pose: 'up' })}
    {kid([28.4, 13.4, 0], 0, { pose: 'wave' })}
    {kid([29.6, 14.0, 0], 3, { facing: 'back' })}
    {adult([30.4, 9.8, 0], { ...LOOKS.dad, top: '#f2e34a', long: true }, { armL: 20, armR: 20 })}
    <PlayBench x={26.0} y={15.2} />
    {kid([26.5, 15.42, 0.45], 1, { pose: 'sit' })}
    <PlayTree x={22.8} y={15.2} s={0.9} />
    <PlayFence x0={PX} y0={0} x1={PX} y1={BY} h={0.7} />
    <PlayFence x0={BX} y0={BY} x1={PX} y1={BY} h={0.7} />

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4, 0, 3.9]} text="Callie's class" />
    <Tag show={L} at={[12, 0, 3.9]} text="Class 2" />
    <Tag show={L} at={[19, 0, 3.9]} text="Hall / PE" />
    <Tag show={L} at={[3.5, 8.25, 1.6]} text="Corridor" />
    <Tag show={L} at={[0, 12.8, 3.9]} text="Reception" />
    <Tag show={L} at={[8.5, 11.2, 2.4]} text="Library" />
    <Tag show={L} at={[16.5, 12.4, 2.6]} text="Lunch hall" />
    <Tag show={L} at={[27, 8, 2.4]} text="Playground" />
    <a href="Town Map.dc.html" style={{ cursor: 'pointer' }}><Tag show={true} at={[(ENTRANCE.x0 + ENTRANCE.x1) / 2, BY + 0.2, 1.2]} text="Exit → Map" /></a>
  </ScrollStage>;
}
window.SchoolScene = SchoolScene;
