// Back garden. Static, no character. Exports window.GardenScene.
// Back-left wall (y = 0): back of the house — kitchen window + back door, living room French doors, downpipe, lantern.
// Back-right wall (x = 0): brick garden wall with trellis, and the outbuilding with its white door.
// Patio along the house; lawn beyond, with the tree, bamboo corner and stepping-stone path. Front fences are cut low.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, Slab, Tag, IsoStage } = window.Iso;

const RX = 10, RY = 7.5, HOUSE_H = 4.6, WALL_H = 2.3;
const KITCHEN = { x0: 5.2, x1: 6.15 };   // house wall → Kitchen (back door)
const LIVING = { x0: 7.4, x1: 8.9 };     // house wall → Living room (French doors)
const SHED = { y0: 2.6, y1: 4.6, door0: 3.3, door1: 4.1 };   // outbuilding on the side wall
const RATTAN = ['#33363b', '#26282c', '#1d1f22'];
const FENCE = ['#a9794a', '#8e6338', '#7a552f'];

// ---------- Ground ----------
function Lawn() {
  const tufts = [];
  for (let i = 0; i < 160; i++) { const s = Math.sin(i * 91.7) * 9999, r = s - Math.floor(s), s2 = Math.sin(i * 37.3) * 9999, r2 = s2 - Math.floor(s2); tufts.push(<path key={i} d={`M${r * RX * 100},${240 + r2 * (RY * 100 - 240)} l3,-8 l3,8`} fill="none" stroke="#5f9a3e" strokeWidth={2} />); }
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#7fb352" />{tufts}</FloorPlane>;
}

function Patio() {
  const s = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 18; c++) s.push(<rect key={r + '-' + c} x={c * 60 - (r % 2) * 30 + 300} y={r * 58} width={58} height={56} fill={(r + c) % 3 ? '#a3a6a4' : '#999c9a'} />);
  return <FloorPlane z={0.005}><g clipPath="url(#gdPatio)">{s}</g><rect x={300} y={228} width={700} height={12} fill="#b55a3e" /></FloorPlane>;
}

function SteppingStones() {
  return <FloorPlane z={0.006}>{[[300, 250], [240, 270], [180, 290], [120, 310], [60, 330]].map(([x, y], i) => <rect key={i} x={x - 30} y={y} width={52} height={40} fill="#b4b6b3" stroke="#8f928f" strokeWidth={1.5} />)}</FloorPlane>;
}

function PatternRug() {
  const d = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) d.push(<g key={r + '-' + c} transform={`translate(${12 + c * 26} ${12 + r * 26})`}><path d="M0,-11 L11,0 L0,11 L-11,0 Z" fill="none" stroke="#1d1f22" strokeWidth={3} /><path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="#1d1f22" /></g>);
  return <FloorPlane z={0.012} x={6.0} y={0.55}><rect x={0} y={0} width={160} height={110} fill="#f4f2ee" />{d}</FloorPlane>;
}

// ---------- House wall ----------
function HouseWall() {
  return <g>
    <Plane o={[0, 0, HOUSE_H]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={RX * 100} height={HOUSE_H * 100} fill="url(#gdBrick)" /></Plane>
    <polygon points={pts([[0, -0.3, HOUSE_H], [RX, -0.3, HOUSE_H], [RX, 0, HOUSE_H], [0, 0, HOUSE_H]])} fill="#f4f2ee" stroke="#d9d9d4" strokeWidth={1} />
    <polygon points={pts([[RX, -0.3, HOUSE_H], [RX, 0, HOUSE_H], [RX, 0, -0.3], [RX, -0.3, -0.3]])} fill="#c99a5c" />
  </g>;
}

function UPVCGlass({ w, h, cols, rows }) {
  const pw = (w - 12) / cols, ph = (h - 12) / rows, g = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.push(<rect key={r + '-' + c} x={6 + c * pw} y={6 + r * ph} width={pw - 3} height={ph - 3} fill="#b9cdd6" />);
  return <g><rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />{g}</g>;
}

function KitchenWindow() {
  return <FaceY y={0.02} x0={3.4} z1={3.1}>
    <g><UPVCGlass w={70} h={40} cols={2} rows={1} /></g><g transform="translate(74 0)"><UPVCGlass w={70} h={40} cols={2} rows={1} /></g>
    <g transform="translate(0 44)"><UPVCGlass w={70} h={86} cols={2} rows={2} /></g><g transform="translate(74 44)"><UPVCGlass w={70} h={86} cols={2} rows={2} /></g>
    <rect x={-4} y={130} width={152} height={7} fill="#ffffff" />
    <path d="M14,154 q60,22 120,0" fill="none" stroke="#2a2a2c" strokeWidth={3} /><line x1={14} x2={134} y1={154} y2={154} stroke="#2a2a2c" strokeWidth={3} />
  </FaceY>;
}

// Doorway → Kitchen (white glazed back door, doormat in front)
function KitchenBackDoor() {
  return <g>
    <FaceY y={0.02} x0={KITCHEN.x0} z1={3.2}><UPVCGlass w={95} h={320} cols={3} rows={5} /><rect x={80} y={170} width={6} height={28} rx={2} fill="#c9ced2" /></FaceY>
    <FloorPlane z={0.013} x={KITCHEN.x0 + 0.1} y={0.05}><rect x={0} y={0} width={75} height={30} fill="#6f6863" /></FloorPlane>
  </g>;
}

// Doorway → Living room (white French doors)
function FrenchDoors() {
  return <FaceY y={0.02} x0={LIVING.x0} z1={3.2}>
    <UPVCGlass w={75} h={320} cols={2} rows={5} /><g transform="translate(75 0)"><UPVCGlass w={75} h={320} cols={2} rows={5} /></g>
    <rect x={64} y={170} width={5} height={26} rx={2} fill="#c9ced2" /><rect x={81} y={170} width={5} height={26} rx={2} fill="#c9ced2" />
  </FaceY>;
}

function DownpipeAndLantern() {
  return <g>
    <FaceY y={0.03} x0={2.9} z1={HOUSE_H}><rect x={0} y={0} width={12} height={HOUSE_H * 100 - 10} fill="#f4f2ee" stroke="#d9d9d4" strokeWidth={1} /></FaceY>
    <FaceY y={0.03} x0={9.15} z1={3.4}><path d="M4,0 h20 l-3,10 h-14 z" fill="#1d1f22" /><rect x={6} y={10} width={16} height={26} fill="#e8eef0" stroke="#1d1f22" strokeWidth={3} /><path d="M6,36 h16 l-8,10 z" fill="#1d1f22" /></FaceY>
  </g>;
}

// ---------- Side wall + outbuilding ----------
function GardenWall() {
  // two runs of wall either side of the outbuilding (which forms this stretch of the boundary)
  const runs = [[SHED.y1, RY], [0, SHED.y0]];
  return <g>{runs.map(([y0, y1]) => { const L = (y1 - y0) * 100; return <g key={y0}>
    <Plane o={[0, y1, WALL_H]} u={[0, -1, 0]} v={[0, 0, -1]}>
      <rect x={0} y={0} width={L} height={WALL_H * 100} fill="url(#gdBrick)" />
      <rect x={0} y={0} width={L} height={12} fill="#c9c6bc" />
      <rect x={0} y={150} width={L} height={6} fill="#b55a3e" />
    </Plane>
    <Plane o={[0, y1, WALL_H + 0.6]} u={[0, -1, 0]} v={[0, 0, -1]}>
      {Array.from({ length: Math.floor(L / 16) }, (_, i) => <line key={i} x1={i * 16} x2={i * 16} y1={0} y2={60} stroke="#c9a777" strokeWidth={3} />)}
      {[4, 30, 56].map(y => <line key={y} x1={0} x2={L} y1={y} y2={y} stroke="#c9a777" strokeWidth={3} />)}
    </Plane>
  </g>; })}</g>;
}

// Doorway → Outbuilding / garage (white door in its brick side wall)
function Outbuilding() {
  const { y0, y1, door0, door1 } = SHED, h = 2.9;
  return <g>
    <Box x={-1.4} y={y0} w={1.42} d={y1 - y0} h={h} c={['#5f6266', 'url(#gdBrick)', 'url(#gdBrick)']} />
    <FaceX x={0.03} y1={door1} z1={2.35}><rect x={0} y={0} width={(door1 - door0) * 100} height={235} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} /><rect x={12} y={14} width={56} height={90} fill="#cfd8dc" /><rect x={10} y={120} width={6} height={22} fill="#c9ced2" /></FaceX>
    <FloorPlane z={0.013} x={0.05} y={door0 + 0.05}><rect x={0} y={0} width={28} height={70} fill="#6f6863" /></FloorPlane>
  </g>;
}

function ClimbingShrub() {
  const pts2 = [[0.1, 1.6, 1.8], [0.1, 2.1, 2.4], [0.1, 2.5, 2.0], [0.1, 1.2, 1.2], [0.1, 2.3, 1.1]];
  return <g>{pts2.map(([x, y, z], i) => { const [px, py] = P(x, y, z); return <circle key={i} cx={px} cy={py} r={34 - (i % 2) * 8} fill={i % 2 ? '#7aa84e' : '#8fbf5a'} opacity={.95} />; })}
    {[[0.12, 1.5, 0.9], [0.12, 2.0, 0.7], [0.12, 2.3, 1.0]].map(([x, y, z], i) => { const [px, py] = P(x, y, z); return <circle key={'f' + i} cx={px} cy={py} r={5} fill="#e85a8a" />; })}
  </g>;
}

function GardenWasteBags() {
  return <g>
    <Box x={0.25} y={2.0} w={0.6} d={0.6} h={0.7} c={['#2f6e55', '#285f49', '#22533f']} />
    <Box x={0.9} y={2.1} w={0.55} d={0.55} h={0.6} c={['#2f6e55', '#285f49', '#22533f']} />
    <FloorPlane z={0.701} x={0.25} y={2.0}><path d="M10,20 l40,-10 M14,40 l36,-24 M20,50 l30,-6" stroke="#8a6a3a" strokeWidth={3} /></FloorPlane>
  </g>;
}

// ---------- Lawn features ----------
function Tree() {
  const [tx, ty] = P(0.8, 1.7, 0), [cx, cy] = P(0.8, 1.7, 4.2);
  return <g>
    <path d={`M${tx - 8},${ty} q-6,-120 20,-200 q10,-60 -10,-120 M${tx + 4},${ty} q20,-90 50,-150`} fill="none" stroke="#7a5a3a" strokeWidth={14} strokeLinecap="round" />
    {[[-70, 10, 70], [10, -40, 80], [80, 0, 70], [-20, 40, 60], [50, 50, 55], [-90, -40, 50]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={r} fill={['#7aa84e', '#8fbf5a', '#6b9a44'][i % 3]} opacity={.92} />)}
  </g>;
}

function BambooCorner() {
  return <g>
    <Box x={0.1} y={RY - 2.0} w={1.6} d={1.4} h={0.2} c={['#9c7a52', '#7f6242', '#6e5439']} />
    <FloorPlane z={0.201} x={0.1} y={RY - 2.0}><rect x={0} y={0} width={160} height={140} fill="#c9a777" /></FloorPlane>
    {[[0.5, RY - 1.2, 3.0, 70], [1.0, RY - 1.6, 3.4, 80], [0.4, RY - 1.8, 2.6, 60], [1.2, RY - 0.9, 2.4, 55]].map(([x, y, z, r], i) => { const [px, py] = P(x, y, z); return <ellipse key={i} cx={px} cy={py} rx={r} ry={r * 1.2} fill={i % 2 ? '#9cc95a' : '#7fb04a'} />; })}
  </g>;
}

function PaddlingPool() {
  return <FloorPlane z={0.01} x={4.6} y={3.0}><path d="M0,30 q20,-30 60,-20 q30,10 20,40 q-30,20 -60,10 q-30,-10 -20,-30 z" fill="#3fb0e0" stroke="#2a8fbd" strokeWidth={2} /><path d="M20,30 q20,-10 40,0" fill="none" stroke="#bfe6f5" strokeWidth={3} /></FloorPlane>;
}

// ---------- Patio furniture ----------
function CoveredBBQ() {
  return <g>
    <Box x={3.4} y={0.15} w={1.0} d={0.6} h={1.25} c={['#5b5560', '#4c4652', '#413c46']} />
    <FaceY y={0.75} x0={3.4} z1={1.25}><path d="M6,10 q44,-10 88,0" fill="none" stroke="#6b6570" strokeWidth={2} /><text x={50} y={34} textAnchor="middle" fontSize={8} fill="#9a95a0" fontFamily="sans-serif">BBQ</text></FaceY>
  </g>;
}

function DeckChair() {
  return <FaceY y={0.06} x0={4.55} z1={1.75}>
    <rect x={0} y={0} width={6} height={175} fill="#d99a50" /><rect x={50} y={0} width={6} height={175} fill="#d99a50" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={6 + i * 5} y={6} width={5} height={110} fill={['#e85a3a', '#7a4fd1', '#f2b632', '#3fb6c9', '#e85a8a'][i % 5]} />)}
  </FaceY>;
}

function RattanChair({ x, y }) {
  return <g>
    <Box x={x} y={y} w={0.65} d={0.65} h={0.45} c={RATTAN} />
    <Box x={x} y={y} w={0.65} d={0.12} h={0.95} c={RATTAN} />
    <Box x={x} y={y} w={0.1} d={0.65} h={0.7} c={RATTAN} /><Box x={x + 0.55} y={y} w={0.1} d={0.65} h={0.7} c={RATTAN} />
  </g>;
}

function RattanSofa() {
  const x = 8.4, y = 1.0;
  return <g>
    <Box x={x} y={y} w={0.7} d={1.4} h={0.45} c={RATTAN} />
    <Box x={x + 0.58} y={y} w={0.12} d={1.4} h={0.95} c={RATTAN} />
    <Box x={x} y={y} w={0.7} d={0.1} h={0.7} c={RATTAN} /><Box x={x} y={y + 1.3} w={0.7} d={0.1} h={0.7} c={RATTAN} />
  </g>;
}

function GlassTable() {
  return <g>
    {[[6.65, 0.25], [7.15, 0.25], [6.65, 0.7], [7.15, 0.7]].map(([x, y], i) => <Box key={i} x={x} y={y} w={0.04} d={0.04} h={0.6} c={RATTAN} />)}
    <Box x={6.6} y={0.2} z={0.6} w={0.6} d={0.55} h={0.03} c={['#9fb6bf', '#8aa1aa', '#7d939c']} />
    <Box x={6.7} y={0.3} z={0.63} w={0.12} d={0.12} h={0.1} c={['#d9784a', '#c4683e', '#b05c36']} />
    <Box x={6.9} y={0.4} z={0.63} w={0.12} d={0.12} h={0.1} c={['#d9784a', '#c4683e', '#b05c36']} />
  </g>;
}

function ShoppingBag() { return <Box x={6.1} y={0.25} z={0.45} w={0.35} d={0.2} h={0.38} c={['#2d5bd8', '#244ab8', '#1e3f9e']} />; }

// Front fences, kept low like the cut-away walls of the rooms.
function FrontFences() {
  return <g>
    <Box x={0} y={RY} w={RX} d={0.12} h={0.55} c={FENCE} />
    <Box x={RX} y={0} w={0.12} d={RY + 0.12} h={0.55} c={FENCE} />
  </g>;
}

const DEFS = <>
  <pattern id="gdBrick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#d9a660" /><rect x="1" y="1" width="38" height="8" fill="#e2b06a" /><rect x="-19" y="11" width="38" height="8" fill="#cf9a55" /><rect x="21" y="11" width="38" height="8" fill="#e0ab64" /></pattern>
  <clipPath id="gdPatio"><rect x={300} y={0} width={700} height={230} /></clipPath>
</>;

function GardenScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1080} cy={560} zoom={0.95} label="Garden" defs={DEFS}>
    <Outbuilding />
    <Slab RX={RX} RY={RY} />
    <Lawn />
    <Patio />
    <SteppingStones />
    <PatternRug />
    <HouseWall />
    <KitchenWindow />
    <KitchenBackDoor />
    <FrenchDoors />
    <DownpipeAndLantern />
    <GardenWall />
    <ClimbingShrub />
    <GardenWasteBags />
    <BambooCorner />
    <PaddlingPool />
    <CoveredBBQ />
    <DeckChair />
    <ShoppingBag />
    <RattanChair x={5.3} y={1.1} />
    <GlassTable />
    <RattanChair x={7.4} y={1.1} />
    <RattanSofa />
    <Tree />
    <FrontFences />
    <Tag show={L} at={[(KITCHEN.x0 + KITCHEN.x1) / 2, 0, 3.65]} text="Kitchen" />
    <Tag show={L} at={[(LIVING.x0 + LIVING.x1) / 2, 0, 3.65]} text="Living room" />
    <Tag show={L} at={[0, (SHED.door0 + SHED.door1) / 2, 2.8]} text="Garage" />
  </IsoStage>;
}
window.GardenScene = GardenScene;
