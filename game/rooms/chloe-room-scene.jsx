// Chloe's room. Static, no character. Exports window.ChloeRoomScene.
// End wall (x = 0): window with grey curtains over a radiator cover; the bed runs along it.
// Back-left wall (y = 0): oak over-bed bridge cupboards, TV unit + lamp, desk with manga + poster, tall wardrobe, display shelves of figures.
// Near end (x = RX, cut low): door to the upstairs hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 4.6, RY = 3.0, RH = 4.2;
const HALL = { y0: 0.75, y1: 1.7 };   // → Upstairs hallway
const OAKL = ['#e6cda4', '#d6b98c', '#c6a87c'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 3; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#chfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Window wall ----------
function CurtainWindow() {
  return <g>
    <FaceX x={0.02} y1={2.35} z1={3.45}>
      <rect x={-6} y={-6} width={147} height={177} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={135} height={165} fill="#cfe3d2" />
      <rect x={0} y={0} width={135} height={60} fill="#d8e6ee" />
      <path d="M0,70 h135 v20 q-30,-10 -60,0 t-75,0 z" fill="#c48a6a" opacity={.6} />
      {[45, 90].map(x => <line key={x} x1={x} x2={x} y1={0} y2={165} stroke="#fff" strokeWidth={5} />)}
      {[58, 112].map(y => <line key={y} x1={0} x2={135} y1={y} y2={y} stroke="#fff" strokeWidth={5} />)}
      <line x1={-30} x2={165} y1={-12} y2={-12} stroke="#9aa1a6" strokeWidth={4} />
      <path d="M-30,-12 h45 l6,200 h-55 z" fill="#8f8a86" /><path d="M120,-12 h45 v200 h-50 z" fill="#8f8a86" />
      {[-20, -8, 4].map(x => <line key={x} x1={x} x2={x + 2} y1={-8} y2={185} stroke="#7d7874" strokeWidth={2} />)}
      {[130, 142, 154].map(x => <line key={x} x1={x} x2={x - 2} y1={-8} y2={185} stroke="#7d7874" strokeWidth={2} />)}
    </FaceX>
    <Box x={0} y={0.95} z={1.75} w={0.22} d={1.45} h={0.05} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function DeskFan() {
  const [x, y] = P(0.12, 1.4, 1.8), [hx, hy] = P(0.12, 1.4, 2.25);
  return <g>
    <ellipse cx={x} cy={y} rx={12} ry={5} fill="#e6e6e2" />
    <line x1={x} y1={y} x2={hx} y2={hy} stroke="#e6e6e2" strokeWidth={4} />
    <circle cx={hx} cy={hy} r={18} fill="#f4f4f0" stroke="#bdbdb8" strokeWidth={2} />
    <circle cx={hx} cy={hy} r={6} fill="#e98a3a" />
  </g>;
}

function RadiatorCover() {
  return <g>
    <Box x={0.02} y={0.9} w={0.28} d={1.5} h={1.15} c={WHITE} />
    <Box x={0.0} y={0.86} z={1.15} w={0.34} d={1.58} h={0.05} c={WHITE} />
    <Box x={0.05} y={1.85} z={1.2} w={0.2} d={0.4} h={0.04} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
  </g>;
}

// ---------- Bed ----------
function StorageBed() {
  const x1 = 1.35, y0 = 0.05, y1 = 2.7;
  return <g>
    <Box x={0.02} y={y0} w={x1} d={y1 - y0} h={0.55} c={WHITE} />
    <FaceX x={x1 + 0.02} y1={y1} z1={0.32}>{[0, 1].map(i => <rect key={i} x={8 + i * 130} y={4} width={118} height={26} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} />)}</FaceX>
    <Box x={0.02} y={y0} w={x1} d={0.12} h={1.05} c={WHITE} />
    <Box x={0.06} y={y0 + 0.12} z={0.55} w={x1 - 0.08} d={y1 - y0 - 0.14} h={0.16} c={['#2d4a7a', '#233c64', '#1d3256']} />
  </g>;
}

function Duvet() {
  return <g>
    <Box x={0.25} y={1.1} z={0.71} w={1.1} d={1.55} h={0.12} c={['url(#chDuv)', '#e8e6e0', '#d9d6ce']} stroke="rgba(40,50,80,.25)" />
    <Box x={0.25} y={0.4} z={0.71} w={0.55} d={0.55} h={0.12} c={['url(#chDuv)', '#e8e6e0', '#d9d6ce']} stroke="rgba(40,50,80,.25)" />
  </g>;
}

function BedToys() {
  return <g>
    {/* squishmallow + purple cushion at the head */}
    <Box x={0.05} y={0.18} z={0.71} w={0.5} d={0.2} h={0.5} c={['#e9dfd6', '#d9cdc2', '#cbbeb2']} />
    <FaceY y={0.38} x0={0.05} z1={1.21}><circle cx={16} cy={22} r={3} fill="#3a2a24" /><circle cx={34} cy={22} r={3} fill="#3a2a24" /><ellipse cx={25} cy={30} rx={6} ry={3} fill="#f4a7c0" /></FaceY>
    <Box x={0.55} y={0.18} z={0.71} w={0.4} d={0.14} h={0.34} c={['#7a3fb0', '#66329a', '#572a85']} />
    {/* pink tablet + marker set */}
    <Box x={0.9} y={0.6} z={0.71} w={0.32} d={0.24} h={0.03} c={['#ff4f9a', '#e03f86', '#c93576']} />
    <FloorPlane z={0.741} x={0.93} y={0.62}><rect x={0} y={0} width={26} height={18} fill="#cfe3f2" /></FloorPlane>
    <Box x={0.35} y={0.95} z={0.71} w={0.32} d={0.2} h={0.08} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <FloorPlane z={0.791} x={0.36} y={0.96}>{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={3 + (i % 8) * 4} cy={4 + Math.floor(i / 8) * 6} r={1.6} fill={['#e85a7a', '#f2b632', '#3fb6c9', '#7a4fd1', '#5fbf6a'][i % 5]} />)}</FloorPlane>
    {/* pink plush */}
    <Box x={0.75} y={0.95} z={0.71} w={0.22} d={0.2} h={0.2} c={['#f7a9c4', '#e893b2', '#d982a2']} />
  </g>;
}

// ---------- Fitted oak wall ----------
function BridgeCupboards() {
  return <g>
    <Box x={0} y={0} z={3.0} w={3.05} d={0.55} h={1.05} c={OAKL} />
    <FaceY y={0.55} x0={0} z1={4.05}>
      {[0, 76, 152, 228].map(x => <g key={x}><rect x={x + 2} y={2} width={72} height={100} fill="none" stroke="#c3a578" strokeWidth={1.5} /><path d={`M${x + 28},96 q10,-10 20,0`} fill="#d9dde0" /></g>)}
    </FaceY>
    <Box x={0} y={0} z={2.92} w={3.05} d={0.6} h={0.08} c={OAKL} />
    <Box x={1.35} y={0} w={0.06} d={0.55} h={2.92} c={OAKL} />
  </g>;
}

function TVUnit() {
  return <g>
    <Box x={1.45} y={0.02} w={0.85} d={0.4} h={0.75} c={OAKL} />
    <FaceY y={0.42} x0={1.45} z1={0.75}><rect x={4} y={40} width={36} height={30} fill="#b69a6e" /><rect x={45} y={40} width={36} height={30} fill="#b69a6e" /></FaceY>
    <Box x={1.75} y={0.15} z={0.75} w={0.5} d={0.05} h={0.36} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={1.5} y={0.1} z={0.75} w={0.14} d={0.14} h={0.18} c={['#f4e3d6', '#e6d2c2', '#d8c2b0']} />
    <Box x={1.47} y={0.07} z={0.93} w={0.2} d={0.2} h={0.16} c={['#ffd98a', '#ffcf72', '#f2bf5e']} />
  </g>;
}

function Desk() {
  return <g>
    <Box x={2.4} y={0.02} w={0.62} d={0.5} h={0.85} c={OAKL} />
    <Box x={2.38} y={0.02} z={0.85} w={0.66} d={0.52} h={0.04} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    {/* stack of manga */}
    {Array.from({ length: 7 }, (_, i) => <Box key={i} x={2.55 + i * 0.06} y={0.04} z={0.89} w={0.055} d={0.2} h={0.3} c={[['#e85a3a', '#f2b632', '#3f6e9a', '#e85a3a', '#5fbf6a', '#f2b632', '#7a4fd1'][i], '#fbf8f2', '#e6e1d6']} />)}
    <Box x={2.45} y={0.3} z={0.89} w={0.25} d={0.12} h={0.1} c={['#c9a7a0', '#b6928b', '#a8847d']} />
  </g>;
}

function AnimePoster() {
  return <FaceY y={0.02} x0={1.75} z1={2.55}>
    <rect x={0} y={0} width={58} height={42} fill="#fbf3e2" stroke="#e1d6c0" strokeWidth={1.5} />
    {[[10, 26, '#e85a3a'], [20, 22, '#3f6e9a'], [30, 26, '#5fbf6a'], [40, 22, '#f2b632'], [48, 28, '#2a2a2c']].map(([x, y, c], i) => <g key={i}><circle cx={x} cy={y - 10} r={5} fill="#f6d2b5" /><rect x={x - 5} y={y - 5} width={10} height={14} fill={c} /></g>)}
    <rect x={30} y={3} width={25} height={8} fill="#f2b632" />
  </FaceY>;
}

function Wardrobe() {
  return <g>
    <Box x={3.08} y={0} w={0.72} d={0.6} h={4.05} c={OAKL} />
    <FaceY y={0.6} x0={3.08} z1={4.05}><path d="M8,190 q10,10 0,20" fill="none" stroke="#9aa1a6" strokeWidth={4} /></FaceY>
  </g>;
}

function DisplayShelves() {
  const x0 = 3.82, figs = ['#f2c94c', '#f7a9c4', '#3fb6c9', '#5fbf6a', '#e85a3a', '#7a4fd1', '#fbf8f2'];
  return <g>
    <Box x={x0} y={0} w={0.55} d={0.45} h={1.1} c={OAKL} />
    <Box x={x0} y={0} z={4.0} w={0.55} d={0.45} h={0.05} c={OAKL} />
    {[1.1, 1.75, 2.35, 2.95].map((z, i) => <g key={z}>
      <Box x={x0} y={0} z={z} w={0.55} d={0.42} h={0.03} c={i ? ['#dfeef0', '#c9dadd', '#b9cbce'] : OAKL} />
      {Array.from({ length: 4 }, (_, k) => <Box key={k} x={x0 + 0.04 + k * 0.12} y={0.1 + (k % 2) * 0.12} z={z + 0.03} w={0.1} d={0.1} h={0.12 + (k % 3) * 0.04} c={[figs[(k + i * 2) % 7], figs[(k + i * 2) % 7], figs[(k + i * 2) % 7]]} stroke="rgba(0,0,0,.15)" />)}
    </g>)}
    <FaceY y={0.03} x0={x0 + 0.08} z1={3.55}><rect x={0} y={0} width={36} height={30} fill="#2a2a2c" /><rect x={3} y={3} width={30} height={24} fill="#e9a7c4" /><rect x={8} y={10} width={20} height={14} fill="#bfa2d8" /></FaceY>
  </g>;
}

// ---------- Floor ----------
function FloorClothes() {
  return <FloorPlane z={0.01} x={1.6} y={0.9}>
    <path d="M0,20 q30,-20 60,0 q40,10 70,60 q-20,30 -40,10 q-30,-30 -60,-20 z" fill="#1f2125" />
    <path d="M110,0 q20,-6 40,4 q6,20 -10,26 q-26,-6 -30,-30 z" fill="#9fc79a" />
    <path d="M30,0 q16,-10 30,0 l-4,12 h-22 z" fill="#5d6870" />
  </FloorPlane>;
}

function LaundryBasket() {
  return <g>
    <Box x={2.4} y={2.2} w={0.5} d={0.5} h={0.45} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
    <FloorPlane z={0.451} x={2.42} y={2.22}><ellipse cx={22} cy={22} rx={20} ry={16} fill="#fbf8f2" /><ellipse cx={30} cy={28} rx={10} ry={6} fill="#2a2a2c" /></FloorPlane>
  </g>;
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

const DEFS = <>
  <clipPath id="chfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>
  <pattern id="chDuv" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#f6f4ee" /><path d="M2,8 q6,-8 12,0 q6,8 10,0" fill="none" stroke="#3d4a7a" strokeWidth={4} strokeLinecap="round" /><path d="M4,20 q5,-5 10,0" fill="none" stroke="#3d4a7a" strokeWidth={3} strokeLinecap="round" /></pattern>
</>;

function ChloeRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={980} cy={420} zoom={1.4} label="Chloe's room" defs={DEFS}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <Walls />
    <CurtainWindow />
    <DeskFan />
    <RadiatorCover />
    <AnimePoster />
    <BridgeCupboards />
    <TVUnit />
    <Desk />
    <Wardrobe />
    <DisplayShelves />
    <StorageBed />
    <Duvet />
    <BedToys />
    <FloorClothes />
    <LaundryBasket />
    <HallDoorway />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.0]} text="Hallway" />
  </IsoStage>;
}
window.ChloeRoomScene = ChloeRoomScene;
