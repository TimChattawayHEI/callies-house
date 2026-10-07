// Nanny & Grandad's garden — small white-pebble courtyard behind the house. Exports window.NannyGardenScene.
// Same x as the house plan (x 0–18); y = distance from the house wall (0–7.5). Back wall y=0 is the house's rear wall:
//   big living-room window (x 1.4–7.6), dining window (x 9.4–12.6), back door (x 14.6–16.4) → house.
// Side wall x=0 (rendered garden wall). Front + right edges cut low. Water feature in the middle; pots round every edge;
// seating corner at x 0–3.4, y 0–3.4 looking in at the living room (TV) window.
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, Tag, IsoStage, shade } = window.Iso;
const { useClock } = window.NPC;

const RX = 18, RY = 7.5, HH = 4.2, GW = 2.0, LOW = 0.55;
const BACK_DOOR = { x0: 14.6, x1: 16.4 };   // house wall → Nanny & Grandad's house (dining room)
const FOUNT = { x: 9.2, y: 3.9 };
const TEAK = ['#b58a5a', '#9a7248', '#83603c'];
const rnd = (i, k) => { const a = Math.sin(i * k) * 43758.5453; return a - Math.floor(a); };
const ell = (r) => [r * 88 * 1.2247, r * 88 * 0.6124];   // floor circle of radius r → screen ellipse radii

// ---------- Ground ----------
function Pebbles() {
  const tones = ['#ffffff', '#f1eee8', '#e2ddd3', '#d6d0c4', '#f7f5f0', '#c9c2b4'];
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#8a8578" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#76716a" />
    <FloorPlane><rect width={RX * 100} height={RY * 100} fill="#ebe7df" />
      {Array.from({ length: 1500 }, (_, i) => <ellipse key={i} cx={rnd(i, 12.9898) * RX * 100} cy={rnd(i, 78.233) * RY * 100} rx={3 + rnd(i, 3.1) * 5} ry={2.5 + rnd(i, 5.7) * 3.5} fill={tones[i % 6]} />)}
    </FloorPlane>
    {/* sandstone pad under the seating corner */}
    <FloorPlane z={0.01} x={0.15} y={0.15}>{Array.from({ length: 9 }, (_, i) => <rect key={i} x={(i % 3) * 105} y={Math.floor(i / 3) * 105} width={100} height={100} fill={['#e3cfa8', '#d9c398', '#e9d8b6'][i % 3]} stroke="#c9b386" strokeWidth={2} />)}</FloorPlane>
    {/* stepping stones: back door → fountain */}
    {[[15.1, 0.5], [14.2, 1.3], [13.0, 1.9], [11.8, 2.6]].map(([x, y], i) => <FloorPlane key={i} z={0.01} x={x} y={y}><rect width={80} height={60} rx={10} fill="#a9a59c" stroke="#8f8b82" strokeWidth={2} /></FloorPlane>)}
  </g>;
}

// ---------- Walls ----------
function HouseWall() {
  const render = '#f1e8d4';
  return <g>
    <polygon points={pts([[0, 0, 0], [RX, 0, 0], [RX, 0, HH], [0, 0, HH]])} fill={render} />
    <polygon points={pts([[0, 0.01, 0], [RX, 0.01, 0], [RX, 0.01, 0.4], [0, 0.01, 0.4]])} fill="#b9876a" />
    <FaceY y={0.012} x0={0} z1={0.4}>{Array.from({ length: 2 }, (_, r) => Array.from({ length: 46 }, (_, k) => <rect key={r + '-' + k} x={k * 40 + (r % 2) * 20 - 20} y={r * 20 + 1} width={38} height={18} fill={k % 3 ? '#c4906f' : '#b07a5c'} />))}</FaceY>
    <polygon points={pts([[-0.2, -0.25, HH], [RX, -0.25, HH], [RX, 0, HH], [-0.2, 0, HH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[RX, -0.25, HH], [RX, 0, HH], [RX, 0, -0.35], [RX, -0.25, -0.35]])} fill="#e3d0ae" />
    {/* big living-room window, looking in at the TV room */}
    <FaceY y={0.02} x0={1.4} z1={2.95}>
      <rect x={-10} y={-10} width={640} height={220} fill="#fbf8f2" stroke="#ddd3bf" />
      <rect width={620} height={200} fill="#6f7f86" />
      <rect x={20} y={110} width={260} height={90} fill="#7e4626" /><rect x={20} y={95} width={260} height={30} rx={8} fill="#9a5a34" />
      <rect x={330} y={70} width={110} height={65} fill="#2a2a2c" /><rect x={336} y={76} width={98} height={53} fill="#8fc0e0" opacity={0.9} />
      <path d="M480,200 L480,120 L520,100 L560,120 L560,200Z" fill="#8f3f45" />
      <rect x={0} y={0} width={620} height={200} fill="#cfe3ea" opacity={0.28} />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${60 + i * 150},10 L${20 + i * 150},190`} stroke="#fff" strokeWidth={6} opacity={0.35} />)}
      {[155, 310, 465].map(x => <rect key={x} x={x - 4} y={0} width={8} height={200} fill="#fbf8f2" />)}<rect x={0} y={60} width={620} height={8} fill="#fbf8f2" />
      <rect x={-30} y={-18} width={40} height={225} fill="#b9cfa8" /><rect x={610} y={-18} width={40} height={225} fill="#b9cfa8" />
      <rect x={-20} y={200} width={660} height={14} fill="#fbf8f2" stroke="#ddd3bf" />
    </FaceY>
    {/* dining-room window */}
    <FaceY y={0.02} x0={9.4} z1={2.9}>
      <rect x={-10} y={-10} width={340} height={170} fill="#fbf8f2" stroke="#ddd3bf" /><rect width={320} height={150} fill="#7a8a90" />
      <rect x={60} y={95} width={200} height={10} fill="#f4efe4" /><rect x={130} y={70} width={14} height={26} fill="#f2c94c" /><rect x={180} y={70} width={14} height={26} fill="#f2c94c" />
      <rect width={320} height={150} fill="#cfe3ea" opacity={0.3} /><rect x={156} y={0} width={8} height={150} fill="#fbf8f2" /><rect x={0} y={50} width={320} height={7} fill="#fbf8f2" />
      <rect x={-20} y={150} width={360} height={13} fill="#fbf8f2" stroke="#ddd3bf" />
    </FaceY>
    {/* back door */}
    <a href="Nanny and Grandads House.dc.html" style={{ cursor: 'pointer' }}>
      <FaceY y={0.02} x0={BACK_DOOR.x0} z1={2.55}>
        <rect x={-10} y={-10} width={200} height={265} fill="#fbf8f2" stroke="#ddd3bf" />
        <rect x={10} y={0} width={160} height={255} fill="#f6f2ea" stroke="#d6cab3" strokeWidth={2} />
        <rect x={32} y={18} width={116} height={120} fill="#bcd6e0" /><path d="M50,30 L70,120" stroke="#fff" strokeWidth={5} opacity={0.6} />
        <rect x={32} y={155} width={116} height={80} fill="none" stroke="#d6cab3" strokeWidth={3} />
        <rect x={142} y={140} width={16} height={6} rx={3} fill="#9aa1a6" />
      </FaceY>
      <Box x={BACK_DOOR.x0 - 0.1} y={0} w={BACK_DOOR.x1 - BACK_DOOR.x0 + 0.2} d={0.45} h={0.18} c={['#d6d0c4', '#c9c2b4', '#b9b2a4']} />
      <FloorPlane z={0.181} x={BACK_DOOR.x0 + 0.2} y={0.05}><rect width={140} height={35} rx={4} fill="#8a6a3a" /></FloorPlane>
    </a>
    {/* outside light + drainpipe */}
    <FaceY y={0.03} x0={16.7} z1={2.6}><rect width={22} height={30} rx={4} fill="#2a2a2c" /><rect x={4} y={6} width={14} height={18} fill="#f2dfb0" /></FaceY>
    <FaceY y={0.03} x0={13.6} z1={HH}><rect width={12} height={HH * 100} fill="#5b5f66" /><rect x={-6} y={0} width={24} height={14} fill="#5b5f66" /></FaceY>
  </g>;
}
function SideWall() {
  return <g>
    <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, GW], [0, 0, GW]])} fill="#f6f2ea" />
    <FaceX x={0.012} y1={RY} z1={GW}>{Array.from({ length: 4 }, (_, i) => <rect key={i} x={40 + i * 170} y={20} width={130} height={150} fill="none" stroke="#c9a777" strokeWidth={3} />)}{Array.from({ length: 4 }, (_, i) => Array.from({ length: 5 }, (_, k) => <g key={i + '-' + k}><line x1={40 + i * 170 + k * 32} y1={20} x2={40 + i * 170 + k * 32} y2={170} stroke="#c9a777" strokeWidth={2} /></g>))}
      {Array.from({ length: 60 }, (_, i) => <ellipse key={'l' + i} cx={30 + rnd(i, 4.1) * 690} cy={40 + rnd(i, 9.3) * 150} rx={9} ry={5} transform={`rotate(${rnd(i, 2.2) * 180} ${30 + rnd(i, 4.1) * 690} ${40 + rnd(i, 9.3) * 150})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}
      {Array.from({ length: 14 }, (_, i) => <circle key={'f' + i} cx={40 + rnd(i, 6.6) * 670} cy={40 + rnd(i, 1.7) * 120} r={5} fill="#f2f2f2" stroke="#e6e0f0" />)}
    </FaceX>
    <polygon points={pts([[-0.2, 0, GW], [0.05, 0, GW], [0.05, RY, GW], [-0.2, RY, GW]])} fill="#e3ddd0" />
    <polygon points={pts([[-0.2, RY, GW], [0.05, RY, GW], [0.05, RY, -0.35], [-0.2, RY, -0.35]])} fill="#d6cfbf" />
  </g>;
}
const LowY = ({ y, x0, x1 }) => <Box x={x0} y={y - 0.12} w={x1 - x0} d={0.24} h={LOW} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />;
const LowX = ({ x, y0, y1 }) => <Box x={x - 0.12} y={y0} w={0.24} d={y1 - y0} h={LOW} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />;

// ---------- Pots & plants ----------
const POTS = { terra: '#c96a4a', blue: '#3f6e9a', stone: '#a9a59c', cream: '#efe6d2', green: '#5f8a6a', black: '#3a3a3c' };
function Pot({ x, y, kind = 'bush', pot = 'terra', s = 1, flower = '#e85a7a' }) {
  const [bx, by] = P(x, y, 0), c = POTS[pot] || pot, pw = 24 * s, ph = 34 * s, tx = bx, ty = by - ph;
  const potEl = <g><ellipse cx={bx} cy={by} rx={pw * 0.9} ry={pw * 0.35} fill="rgba(60,50,30,.18)" /><path d={`M${bx - pw * 0.72},${by} L${bx - pw},${ty} L${bx + pw},${ty} L${bx + pw * 0.72},${by} Z`} fill={c} /><path d={`M${bx + pw * 0.15},${by} L${bx + pw * 0.3},${ty} L${bx + pw},${ty} L${bx + pw * 0.72},${by} Z`} fill={shade(c, -0.15)} /><rect x={bx - pw * 1.08} y={ty - 6 * s} width={pw * 2.16} height={7 * s} rx={2} fill={shade(c, 0.1)} /><ellipse cx={tx} cy={ty - 5 * s} rx={pw * 0.95} ry={pw * 0.3} fill="#5a4030" /></g>;
  let plant;
  const G = ['#4f8a3e', '#6b9a44', '#86b55a', '#3f7a4a'];
  switch (kind) {
    case 'bush': plant = <g>{[[-14, -14, 20], [12, -16, 19], [0, -30, 22], [-6, -8, 16], [10, -6, 15]].map(([a, b, r], i) => <circle key={i} cx={tx + a * s} cy={ty + b * s} r={r * s} fill={G[i % 4]} />)}</g>; break;
    case 'topiary': plant = <g><rect x={tx - 2.5 * s} y={ty - 50 * s} width={5 * s} height={48 * s} fill="#7a5a3a" /><circle cx={tx} cy={ty - 66 * s} r={24 * s} fill="#3f7a4a" /><circle cx={tx - 7 * s} cy={ty - 73 * s} r={10 * s} fill="#5a9a5a" /></g>; break;
    case 'grass': plant = <g>{Array.from({ length: 16 }, (_, i) => { const a = (i / 15 - 0.5) * 1.6; return <path key={i} d={`M${tx},${ty - 4 * s} Q${tx + Math.sin(a) * 18 * s},${ty - 40 * s} ${tx + Math.sin(a) * 34 * s},${ty - (52 - Math.abs(a) * 18) * s}`} stroke={i % 2 ? '#a8b86a' : '#c9c27a'} strokeWidth={2.5 * s} fill="none" />; })}</g>; break;
    case 'spiky': plant = <g>{Array.from({ length: 12 }, (_, i) => { const a = (i / 11 - 0.5) * 2.4; return <path key={i} d={`M${tx - 3 * s},${ty - 4 * s} L${tx + Math.sin(a) * 42 * s},${ty - Math.cos(a) * 48 * s - 6 * s} L${tx + 3 * s},${ty - 4 * s}Z`} fill={i % 2 ? '#4f8a5a' : '#6fa86a'} />; })}</g>; break;
    case 'lavender': plant = <g>{Array.from({ length: 14 }, (_, i) => { const dx = (i - 6.5) * 3.2 * s, h = (36 + (i % 4) * 7) * s; return <g key={i}><line x1={tx + dx * 0.5} y1={ty - 4 * s} x2={tx + dx} y2={ty - h} stroke="#7a9a6b" strokeWidth={1.6 * s} /><ellipse cx={tx + dx} cy={ty - h - 4 * s} rx={2.6 * s} ry={7 * s} fill={i % 3 ? '#9b7cc4' : '#7a5aa8'} /></g>; })}</g>; break;
    case 'fern': plant = <g>{Array.from({ length: 8 }, (_, i) => { const px = tx + (i % 2 ? 1 : -1) * (6 + i * 2.6) * s, py = ty - (8 + i * 7) * s; return <ellipse key={i} cx={px} cy={py} rx={17 * s} ry={5.5 * s} transform={`rotate(${i % 2 ? 28 : -28} ${px} ${py})`} fill={G[i % 4]} />; })}</g>; break;
    case 'cactus': plant = <g><rect x={tx - 7 * s} y={ty - 46 * s} width={14 * s} height={44 * s} rx={7 * s} fill="#5f9a5a" /><rect x={tx + 5 * s} y={ty - 34 * s} width={14 * s} height={7 * s} rx={3} fill="#5f9a5a" /><rect x={tx + 12 * s} y={ty - 46 * s} width={8 * s} height={18 * s} rx={4 * s} fill="#5f9a5a" /><circle cx={tx} cy={ty - 47 * s} r={4 * s} fill="#f39ac6" /></g>; break;
    default: plant = <g>{[[-12, -12, 15], [10, -14, 15], [0, -24, 17]].map(([a, b, r], i) => <circle key={i} cx={tx + a * s} cy={ty + b * s} r={r * s} fill={G[(i + 1) % 4]} />)}{Array.from({ length: 9 }, (_, i) => <circle key={'f' + i} cx={tx + (rnd(i + x * 7, 3.3) - 0.5) * 40 * s} cy={ty - (8 + rnd(i + y * 5, 7.7) * 28) * s} r={4.5 * s} fill={i % 4 === 3 ? '#fbf8f2' : flower} />)}</g>;
  }
  return <g>{potEl}{plant}</g>;
}

// ---------- Water feature ----------
function Fountain({ T }) {
  const { x, y } = FOUNT, [cx, cy] = P(x, y, 0), [rx, ry] = ell(1.15), wall = 0.45 * 88, [ix, iy] = ell(0.98);
  const [, t1] = P(x, y, 1.05), [, t2] = P(x, y, 1.65), [r1x, r1y] = ell(0.55), [r2x, r2y] = ell(0.28);
  const drops = (tx, ty, R, n, k) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, f = ((T * 1.4 + i * 0.37 + k) % 1); return <circle key={k + '-' + i} cx={tx + Math.cos(a) * R * (0.9 + f * 0.25)} cy={ty + Math.sin(a) * R * 0.5 + f * f * 26} r={2} fill="#dff1f6" opacity={1 - f} />; });
  return <g>
    <ellipse cx={cx} cy={cy + 6} rx={rx + 10} ry={ry + 6} fill="rgba(60,50,30,.15)" />
    <path d={`M${cx - rx},${cy - wall} L${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy - wall} Z`} fill="#c9c2b4" />
    {[0.33, 0.66].map(f => <path key={f} d={`M${cx - rx},${cy - wall * f} A${rx},${ry} 0 0 0 ${cx + rx},${cy - wall * f}`} fill="none" stroke="#b5ad9e" strokeWidth={2} />)}
    <ellipse cx={cx} cy={cy - wall} rx={rx} ry={ry} fill="#ddd7cb" />
    <ellipse cx={cx} cy={cy - wall} rx={ix} ry={iy} fill="#7fb8c9" />
    {[0, 1, 2].map(i => { const f = (T * 0.5 + i / 3) % 1; return <ellipse key={i} cx={cx} cy={cy - wall} rx={r1x * (0.8 + f * 0.9)} ry={r1y * (0.8 + f * 0.9)} fill="none" stroke="#e6f4f8" strokeWidth={2} opacity={0.8 * (1 - f)} />; })}
    <rect x={cx - 9} y={t1} width={18} height={cy - wall - t1} fill="#c9c2b4" /><rect x={cx + 2} y={t1} width={7} height={cy - wall - t1} fill="#b5ad9e" />
    <path d={`M${cx - r1x},${t1} Q${cx},${t1 + r1y * 2.6} ${cx + r1x},${t1} Z`} fill="#c9c2b4" /><ellipse cx={cx} cy={t1} rx={r1x} ry={r1y} fill="#ddd7cb" /><ellipse cx={cx} cy={t1} rx={r1x - 6} ry={r1y - 3} fill="#8fc4d4" />
    <rect x={cx - 5} y={t2} width={10} height={t1 - t2} fill="#c9c2b4" />
    <path d={`M${cx - r2x},${t2} Q${cx},${t2 + r2y * 2.6} ${cx + r2x},${t2} Z`} fill="#c9c2b4" /><ellipse cx={cx} cy={t2} rx={r2x} ry={r2y} fill="#ddd7cb" /><ellipse cx={cx} cy={t2} rx={r2x - 4} ry={r2y - 2} fill="#8fc4d4" />
    <circle cx={cx} cy={t2 - 14} r={7} fill="#ddd7cb" />
    {Array.from({ length: 6 }, (_, i) => { const f = (T * 1.6 + i / 6) % 1; return <circle key={'s' + i} cx={cx + Math.sin(i * 2.1) * 3} cy={t2 - 18 - Math.sin(f * Math.PI) * 26} r={2.2} fill="#dff1f6" opacity={0.9 - f * 0.5} />; })}
    {drops(cx, t2, r2x, 10, 0)}{drops(cx, t1, r1x, 16, 0.5)}
  </g>;
}

// ---------- Seating corner ----------
function Seating() {
  const cushion = ['#b9cfa8', '#9fbe96', '#86a87e'];
  const chair = (x, y) => <g key={x}><Box x={x} y={y} w={0.6} d={0.6} h={0.45} c={TEAK} /><Box x={x + 0.05} y={y + 0.05} z={0.45} w={0.5} d={0.5} h={0.07} c={cushion} /><Box x={x} y={y + 0.52} z={0.45} w={0.6} d={0.08} h={0.55} c={TEAK} /></g>;
  return <g>
    {/* bench along the side wall, cushioned */}
    <Box x={0.15} y={0.35} w={0.65} d={2.4} h={0.45} c={TEAK} /><Box x={0.15} y={0.35} z={0.45} w={0.12} d={2.4} h={0.55} c={TEAK} />
    <Box x={0.27} y={0.4} z={0.45} w={0.5} d={2.3} h={0.08} c={cushion} />
    <Box x={0.3} y={0.6} z={0.53} w={0.14} d={0.5} h={0.35} c={['#f2c94c', '#d9b03a', '#c09a2c']} /><Box x={0.3} y={1.9} z={0.53} w={0.14} d={0.5} h={0.35} c={['#f39ac6', '#e07fae', '#c96a96']} />
    {/* round table */}
    {(() => { const [x, y] = P(1.9, 1.5, 0), [, t] = P(1.9, 1.5, 0.72), [rx, ry] = ell(0.45); return <g><rect x={x - 3} y={t} width={6} height={y - t} fill="#3a3a3c" /><ellipse cx={x} cy={y} rx={22} ry={8} fill="#3a3a3c" /><ellipse cx={x} cy={t + 4} rx={rx} ry={ry} fill="#2a2a2c" /><ellipse cx={x} cy={t} rx={rx} ry={ry} fill="#fbf8f2" stroke="#c9c2b4" /><rect x={x - 14} y={t - 14} width={9} height={11} rx={2} fill="#fbf8f2" stroke="#c9c2b4" /><rect x={x + 6} y={t - 12} width={9} height={11} rx={2} fill="#3f6e9a" /><ellipse cx={x + 22} cy={t - 2} rx={10} ry={4} fill="#c9a54a" /></g>; })()}
    {chair(1.55, 2.25)}{chair(2.45, 1.2)}
  </g>;
}

function NannyGardenScene({ showLabels = true, animate = true }) {
  const T = useClock(!animate), L = showLabels;
  const housePots = [[8.4, 0.35, 'topiary', 'black', 1.1], [9.0, 0.4, 'flowers', 'terra', 0.8, '#e0524a'], [13.0, 0.35, 'spiky', 'stone', 1.0], [17.3, 0.4, 'topiary', 'black', 1.1], [4.2, 0.35, 'lavender', 'cream', 0.8], [6.4, 0.35, 'flowers', 'blue', 0.8, '#f2c94c']];
  const sidePots = [[0.4, 3.8, 'fern', 'green', 1.1], [0.4, 4.7, 'flowers', 'terra', 0.9, '#f39ac6'], [0.4, 5.6, 'grass', 'stone', 1.0], [0.45, 6.5, 'bush', 'blue', 1.2]];
  const rightPots = [[17.5, 1.4, 'flowers', 'terra', 0.9, '#e85a7a'], [17.5, 2.4, 'lavender', 'stone', 1.0], [17.5, 3.4, 'cactus', 'terra', 0.9], [17.5, 4.4, 'bush', 'green', 1.1], [17.5, 5.4, 'flowers', 'cream', 0.9, '#7a4fd1'], [17.5, 6.4, 'spiky', 'black', 1.1]];
  const frontPots = Array.from({ length: 13 }, (_, i) => { const k = ['flowers', 'grass', 'bush', 'lavender', 'flowers', 'fern', 'topiary', 'flowers', 'spiky', 'bush', 'flowers', 'cactus', 'lavender'][i]; return [1.3 + i * 1.25, 7.05, k, ['terra', 'stone', 'blue', 'cream', 'terra', 'green', 'black'][i % 7], 0.75 + rnd(i, 2.7) * 0.5, ['#e0524a', '#f39ac6', '#f2c94c', '#fbf8f2'][i % 4]]; });
  const clusters = [[6.9, 3.2, 'flowers', 'terra', 0.7, '#f2a127'], [11.5, 4.7, 'lavender', 'stone', 0.8], [7.6, 5.0, 'grass', 'cream', 0.8], [12.2, 3.0, 'flowers', 'blue', 0.7, '#e85a7a']];
  const all = [...housePots, ...sidePots, ...rightPots, ...clusters].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const pot = (p, i) => <Pot key={p[0] + '-' + p[1]} x={p[0]} y={p[1]} kind={p[2]} pot={p[3]} s={p[4]} flower={p[5]} />;
  const [fx, fy] = [FOUNT.x, FOUNT.y];
  return <IsoStage cx={1340} cy={800} zoom={0.68} label="Nanny & Grandad's garden" defs={null}>
    <Pebbles />
    <HouseWall />
    <SideWall />
    <Seating />
    {all.filter(p => p[0] + p[1] < fx + fy).map(pot)}
    <Fountain T={T} />
    {all.filter(p => p[0] + p[1] >= fx + fy).map(pot)}
    <LowX x={RX} y0={0} y1={RY} />
    <LowY y={RY} x0={0} x1={RX} />
    {frontPots.map(pot)}
    <Tag show={L} at={[4.5, 0, 3.4]} text="Living room window" />
    <Tag show={L} at={[1.6, 1.6, 1.9]} text="Seating area" />
    <Tag show={L} at={[fx, fy, 2.6]} text="Water feature" />
    <a href="Nanny and Grandads House.dc.html" style={{ cursor: 'pointer' }}><Tag show={true} at={[(BACK_DOOR.x0 + BACK_DOOR.x1) / 2, 0, 3.05]} text="Back door → House" /></a>
  </IsoStage>;
}
window.NannyGardenScene = NannyGardenScene;
