// Upstairs shower bathroom. Static, no character. Exports window.BathroomScene.
// End wall (x = 0): window with grey blind over a white drawer tower. Corner (x = 0, y = 0): shower tray with glass screens + black curtain.
// Back-left wall (y = 0): basin unit with round mirror, toilet, towels. Near end (x = RX, cut low): door to the upstairs hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, WallCap, Tag, IsoStage } = window.Iso;

const RX = 4.2, RY = 2.8, RH = 4.2, DADO = 1.45;
const HALL = { y0: 1.35, y1: 2.3 };   // → Upstairs hallway
const SH = { x1: 1.25, y1: 1.2 };      // shower tray footprint (corner)
const PORC = ['#ffffff', '#eef1f1', '#dfe4e4'];

function TileFloor() {
  const l = [];
  for (let i = 1; i < RX * 100 / 45; i++) l.push(<line key={'v' + i} x1={i * 45} x2={i * 45} y1={0} y2={RY * 100} stroke="#b9bdbd" strokeWidth={1.5} />);
  for (let j = 1; j < RY * 100 / 45; j++) l.push(<line key={'h' + j} x1={0} x2={RX * 100} y1={j * 45} y2={j * 45} stroke="#b9bdbd" strokeWidth={1.5} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#dcdedc" />{l}</FloorPlane>;
}

// Charcoal tiles below the scroll border, white tiles above, thin grey band higher up.
function TiledWall({ len, along }) {
  const W = len * 100, H = RH * 100, d = (RH - DADO) * 100, out = [];
  for (let i = 1; i < W / 34; i++) out.push(<line key={'u' + i} x1={i * 34} x2={i * 34} y1={0} y2={d - 20} stroke="#e1e3e2" strokeWidth={1.5} />);
  for (let j = 1; j < (d - 20) / 34; j++) out.push(<line key={'w' + j} x1={0} x2={W} y1={j * 34} y2={j * 34} stroke="#e1e3e2" strokeWidth={1.5} />);
  for (let i = 1; i < W / 48; i++) out.push(<line key={'d' + i} x1={i * 48} x2={i * 48} y1={d} y2={H} stroke="#55585c" strokeWidth={1.5} />);
  out.push(<line key="dm" x1={0} x2={W} y1={d + 70} y2={d + 70} stroke="#55585c" strokeWidth={1.5} />);
  const scroll = [];
  for (let i = 0; i < W / 24; i++) scroll.push(<path key={i} d={`M${i * 24 + 3},${d - 8} q6,-8 12,0 q-4,6 -8,2`} fill="none" stroke={i % 3 ? '#8a8f8f' : '#c9907a'} strokeWidth={1.5} />);
  const body = <g>
    <rect x={0} y={0} width={W} height={H} fill="#f4f5f4" />
    <rect x={0} y={d} width={W} height={H - d} fill="#3b3d42" />
    {out}
    <rect x={0} y={d - 20} width={W} height={20} fill="#e9ebe8" stroke="#a3a8a8" strokeWidth={1.5} />{scroll}
    <rect x={0} y={d - 26} width={W} height={6} fill="#a3a8a8" />
    <rect x={0} y={118} width={W} height={7} fill="#a3a8a8" />
  </g>;
  return along === 'x'
    ? <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>{body}</Plane>
    : <Plane o={[0, RY, RH]} u={[0, -1, 0]} v={[0, 0, -1]}>{body}</Plane>;
}

function Walls() {
  return <g>
    <TiledWall len={RX} along="x" />
    <TiledWall len={RY} along="y" />
    <WallCap RX={RX} RY={RY} RH={RH} />
  </g>;
}

// ---------- End wall ----------
function BlindWindow() {
  return <g>
    <FaceX x={0.02} y1={2.55} z1={3.1}>
      <rect x={-6} y={-6} width={122} height={142} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={110} height={130} fill="#e8c9a4" />
      <line x1={36} x2={36} y1={0} y2={130} stroke="#fff" strokeWidth={4} /><line x1={0} x2={110} y1={96} y2={96} stroke="#fff" strokeWidth={4} />
      <rect x={-6} y={-8} width={122} height={84} fill="#6d7075" /><rect x={-6} y={72} width={122} height={5} fill="#55585c" />
    </FaceX>
    <Box x={0} y={1.4} z={1.78} w={0.2} d={1.2} h={0.05} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function SillBottles() {
  const b = [[1.55, '#f2a127', 0.28], [1.72, '#9fd6c8', 0.26], [1.9, '#fbf8f2', 0.22], [2.05, '#f2a127', 0.24], [2.2, '#fbf8f2', 0.3]];
  return <g>{b.map(([y, c, h], i) => <Box key={i} x={0.04} y={y} z={1.83} w={0.08} d={0.08} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}</g>;
}

function DrawerTower() {
  return <g>
    <Box x={0.02} y={1.55} w={0.42} d={0.42} h={1.35} c={WHITE} />
    <FaceX x={0.44} y1={1.97} z1={1.35}>{[0, 1, 2, 3].map(i => <g key={i}><rect x={4} y={6 + i * 32} width={34} height={28} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><path d={`M15,${12 + i * 32} q6,5 12,0`} fill="none" stroke="#a9a49a" strokeWidth={2} /></g>)}</FaceX>
    <Box x={0.04} y={1.58} z={1.35} w={0.38} d={0.38} h={0.2} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
    <FloorPlane z={1.551} x={0.06} y={1.6}><ellipse cx={18} cy={18} rx={16} ry={12} fill="#8fa383" /><ellipse cx={12} cy={22} rx={8} ry={6} fill="#7a5a3a" /></FloorPlane>
  </g>;
}

// ---------- Shower corner ----------
function ShowerTray() {
  return <g>
    <Box x={0} y={0} w={SH.x1} d={SH.y1} h={0.1} c={PORC} />
    <FloorPlane z={0.101} x={0} y={0}><circle cx={62} cy={60} r={8} fill="#6b747a" /></FloorPlane>
  </g>;
}

function ShowerFittings() {
  const r = P(0.02, 0.6, 2.9), r0 = P(0.02, 0.6, 1.4);
  return <g>
    <line x1={r0[0]} y1={r0[1]} x2={r[0]} y2={r[1]} stroke="#c9ced2" strokeWidth={4} />
    <FaceX x={0.02} y1={0.9} z1={2.75}>
      <rect x={12} y={0} width={24} height={10} rx={5} fill="#c9ced2" />
      <circle cx={30} cy={110} r={9} fill="#b5bcc0" /><circle cx={56} cy={130} r={7} fill="#b5bcc0" /><circle cx={20} cy={130} r={7} fill="#b5bcc0" />
      <path d="M30,10 q-12,60 0,100" fill="none" stroke="#b5bcc0" strokeWidth={2.5} />
    </FaceX>
    {/* corner caddy + pink scrunchie */}
    <FaceY y={0.02} x0={0.3} z1={2.35}>
      <rect x={0} y={0} width={36} height={4} fill="#b5bcc0" /><rect x={0} y={30} width={36} height={4} fill="#b5bcc0" />
      <rect x={6} y={8} width={10} height={22} fill="#fbf8f2" /><circle cx={22} cy={66} r={9} fill="#f4a7c0" />
    </FaceY>
  </g>;
}

// Glass screens on the two open sides, with the black curtain bunched at the window end.
function ShowerScreens() {
  const glass = { fill: '#d4ecf0', fillOpacity: 0.32, stroke: '#a9c4c9', strokeWidth: 2 };
  return <g>
    <polygon points={pts([[SH.x1, 0, 0.1], [SH.x1, SH.y1, 0.1], [SH.x1, SH.y1, 3.2], [SH.x1, 0, 3.2]])} {...glass} />
    <polygon points={pts([[0, SH.y1, 0.1], [0.45, SH.y1, 0.1], [0.45, SH.y1, 3.2], [0, SH.y1, 3.2]])} {...glass} />
    <FaceY y={SH.y1 + 0.01} x0={0.45} z1={3.3}>
      <line x1={-45} x2={80} y1={4} y2={4} stroke="#c9ced2" strokeWidth={4} />
      <path d="M2,6 h34 l4,300 h-40 z" fill="#1f2125" />
      {[8, 16, 24, 32].map(x => <line key={x} x1={x} x2={x + 1} y1={8} y2={300} stroke="#33363b" strokeWidth={2} />)}
    </FaceY>
  </g>;
}

// ---------- Back-left wall ----------
function RoundMirror() {
  return <FaceY y={0.02} x0={1.5} z1={2.75}><circle cx={38} cy={38} r={38} fill="#dbe9ee" stroke="#c9ced2" strokeWidth={2} /><path d="M18,28 Q34,12 56,18" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={.7} /></FaceY>;
}

function BasinUnit() {
  const x0 = 1.45;
  return <g>
    <Box x={x0 + 0.04} y={0} w={0.78} d={0.42} h={0.95} c={WHITE} />
    <FaceY y={0.42} x0={x0 + 0.04} z1={0.95}><line x1={39} x2={39} y1={4} y2={92} stroke="#d6d0c4" strokeWidth={2} /><rect x={30} y={22} width={3} height={30} fill="#9aa1a6" /><rect x={45} y={22} width={3} height={30} fill="#9aa1a6" /></FaceY>
    <Box x={x0} y={0} z={0.95} w={0.86} d={0.55} h={0.17} c={PORC} />
    <FloorPlane z={1.121} x={x0 + 0.08} y={0.12}><ellipse cx={35} cy={22} rx={30} ry={17} fill="#d9e2e4" /><circle cx={35} cy={24} r={3} fill="#a9afb4" /></FloorPlane>
    <Box x={x0 + 0.38} y={0.03} z={1.12} w={0.1} d={0.08} h={0.14} c={['#d3d7da', '#b5bcc0', '#a9afb4']} />
    <Box x={x0 + 0.68} y={0.05} z={1.12} w={0.04} d={0.04} h={0.22} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    <Box x={x0 + 0.1} y={0.35} z={1.12} w={0.3} d={0.05} h={0.03} c={['#5b8fd8', '#fbf8f2', '#e2e2dc']} />
  </g>;
}

function Toilet() {
  const x0 = 2.75;
  return <g>
    <Box x={x0} y={0} z={0.4} w={0.62} d={0.26} h={0.55} c={PORC} />
    <FloorPlane z={0.951} x={x0} y={0}><circle cx={31} cy={13} r={5} fill="#c9ced2" /></FloorPlane>
    <Box x={x0 + 0.12} y={0.2} w={0.38} d={0.35} h={0.4} c={PORC} />
    <Box x={x0 + 0.04} y={0.2} z={0.4} w={0.54} d={0.55} h={0.1} c={PORC} />
  </g>;
}

function Towels() {
  return <FaceY y={0.03} x0={3.55} z1={1.85}>
    <rect x={0} y={-4} width={60} height={5} rx={2} fill="#c9ced2" />
    <path d="M0,0 H22 V150 H0 Z" fill="#8a3f64" /><path d="M16,0 H40 V140 H16 Z" fill="#7d86b3" /><path d="M34,0 H58 V120 H34 Z" fill="#f1ece2" />
  </FaceY>;
}

function BathMat() {
  return <FloorPlane z={0.01} x={1.35} y={0.6}><rect x={0} y={0} width={70} height={42} rx={6} fill="#6f6863" /></FloorPlane>;
}

// Doorway → Upstairs hallway (gap in the near end wall, carpet threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#76604f" stroke="#5a483b" strokeWidth={1.5} /></FloorPlane>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

function BathroomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1000} cy={390} zoom={1.75} label="Bathroom">
    <Slab RX={RX} RY={RY} />
    <TileFloor />
    <Walls />
    <BlindWindow />
    <SillBottles />
    <ShowerFittings />
    <ShowerTray />
    <RoundMirror />
    <BasinUnit />
    <Toilet />
    <Towels />
    <BathMat />
    <DrawerTower />
    <ShowerScreens />
    <HallDoorway />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.0]} text="Hallway" />
  </IsoStage>;
}
window.BathroomScene = BathroomScene;
