// Downstairs hallway. Static, no character. Exports window.DownstairsHallScene.
// Corridor runs along x. Back-left wall (y = 0) = stairs side; end wall (x = 0) = toilet; near end (x = HX, cut away) = kitchen.
// Front wall (y = HY, cut low) = radiator + front door. Matches: standing at the stairs, kitchen is right, toilet far left, living room left of the toilet.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, PanelDoorArt, Tag, IsoStage } = window.Iso;

const HX = 7.5, HY = 2.4, RH = 4.2;
const LIVING = { x0: 0.3, x1: 1.25 };    // back wall, next to the toilet → Living room (bay doors)
const TOILET = { y0: 0.75, y1: 1.7 };    // end wall → Toilet
const FRONT = { x0: 0.55, x1: 1.6 };     // front wall, opposite the living room → Front door (outside)
const KITCHEN = { y0: 1.15, y1: 2.1 };   // near end wall → Kitchen
const ST = { x0: 1.6, d: 0.9, N: 14, rise: RH / 14 };
ST.run = (HX - ST.x0) / ST.N;

// ---------- Shell ----------
function Floor() {
  const planks = [];
  for (let i = 0; i < HY * 2 + 1; i++) {
    const off = (i * 137) % 260;
    planks.push(<rect key={i} x={0} y={i * 50} width={HX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 4; k++) planks.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    planks.push(<line key={'h' + i} x1={0} y1={i * 50} x2={HX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#dhfloor)">{planks}</g></FloorPlane>;
}

function Walls() {
  const zAt = (x) => 1.6 + (x - ST.x0) * ST.rise / ST.run, xEnd = ST.x0 + (RH - 0.3 - 1.6) * ST.run / ST.rise;
  return <g>
    <BackWallY RX={HX} RH={RH} />
    <BackWallX RY={HY} RH={RH} />
    <WallCap RX={HX} RY={HY} RH={RH} />
    <StripY x0={0} x1={ST.x0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={HY} z0={0} z1={0.18} fill="#f3eadb" />
    {/* dado rail: flat by the living room door, then climbing with the stairs */}
    {[[0, LIVING.x0 - 0.11], [LIVING.x1 + 0.11, ST.x0]].map(([a, b]) => <g key={a}>
      <StripY x0={a} x1={b} z0={1.52} z1={1.55} fill="#e3d0ae" />
      <StripY x0={a} x1={b} z0={1.55} z1={1.65} fill="#fffaf2" />
    </g>)}
    <polygon points={pts([[ST.x0, 0.01, 1.55], [xEnd, 0.01, zAt(xEnd) - 0.05], [xEnd, 0.01, zAt(xEnd) + 0.05], [ST.x0, 0.01, 1.65]])} fill="#fffaf2" />
    {[[0, TOILET.y0 - 0.11], [TOILET.y1 + 0.11, HY]].map(([a, b]) => <g key={a}>
      <StripX y0={a} y1={b} z0={1.52} z1={1.55} fill="#d9c6a6" />
      <StripX y0={a} y1={b} z0={1.55} z1={1.65} fill="#f3eadb" />
    </g>)}
    <StripY x0={0} x1={HX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={HY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// Doorway → Upstairs hallway. Carpeted stairs along the back wall, climbing towards the kitchen end.
function Staircase() {
  const { x0, d, N, run, rise } = ST, steps = [];
  for (let k = 0; k < N; k++) {
    const x = x0 + run * k, top = rise * (k + 1);
    steps.push(<g key={k}>
      <Box x={x} y={0} w={run} d={d} h={top} c={['#76604f', '#efe0c4', '#e3cfac']} stroke="none" />
      <line x1={P(x, 0, top)[0]} y1={P(x, 0, top)[1]} x2={P(x, d, top)[0]} y2={P(x, d, top)[1]} stroke="#5a483b" strokeWidth={2.5} />
    </g>);
  }
  return <g>
    {steps}
    {/* white string board along the side of the stairs */}
    <polygon points={pts([[x0, d + 0.01, 0], [HX, d + 0.01, RH], [HX, d + 0.01, RH - 0.28], [x0 + 0.28 * run / rise, d + 0.01, 0]])} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1} />
    <StripY y={d + 0.01} x0={x0} x1={HX} z0={0} z1={0.18} fill="#fffaf2" />
  </g>;
}

// ---------- Doorways ----------
// Glazed door, 2 × 5 panes of rippled glass.
function GlazedDoorArt({ w = 95, h = 330 }) {
  const panes = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) panes.push(<rect key={r + '-' + c} x={12 + c * 37} y={14 + r * 58} width={34} height={54} fill="#cfe0e6" stroke="#f8f3ea" strokeWidth={2} />);
  return <g>
    <rect x={-11} y={-11} width={w + 22} height={h + 11} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    <rect x={0} y={0} width={w} height={h} fill="#f8f3ea" stroke="#d6cab3" strokeWidth={1.5} />
    {panes}
    {[0, 1, 2, 3, 4].map(r => <path key={r} d={`M14,${40 + r * 58} q8,-8 16,0 t16,0 t16,0 t16,0 t16,0`} fill="none" stroke="#fff" strokeWidth={2} opacity={.6} />)}
    <rect x={w - 12} y={h * 0.55 - 4} width={7} height={22} rx={2} fill="#c9a54a" />
  </g>;
}

// Doorway → Living room (back wall, next to the toilet). Glazed bay door.
function LivingRoomDoor() {
  return <FaceY y={0.02} x0={LIVING.x0} z1={3.3}><GlazedDoorArt /></FaceY>;
}

// Doorway → Toilet (end wall, straight down the hall)
function ToiletDoor() {
  return <FaceX x={0.02} y1={TOILET.y1} z1={3.3}><PanelDoorArt hinge="right" /></FaceX>;
}

// Doorway → Front door / outside (gap in the cut-down front wall, doormat on the floor)
function FrontDoorway() {
  return <g>
    <FloorPlane z={0.005} x={FRONT.x0} y={HY}><rect x={0} y={0} width={(FRONT.x1 - FRONT.x0) * 100} height={20} fill="#c9a54a" stroke="#a6863a" strokeWidth={1.5} /></FloorPlane>
    <FloorPlane z={0.01} x={FRONT.x0 + 0.1} y={HY - 0.6}>
      <rect x={0} y={0} width={85} height={52} rx={4} fill="#b48a5a" stroke="#8d6a40" strokeWidth={2} />
      <text x={42} y={32} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily="'Baloo 2', sans-serif" fill="#5a3d22">HELLO</text>
    </FloorPlane>
  </g>;
}

// Doorway → Kitchen (gap in the near end wall, tiled threshold)
function KitchenDoorway() {
  return <FloorPlane z={0.005} x={HX} y={KITCHEN.y0}>
    <rect x={0} y={0} width={20} height={(KITCHEN.y1 - KITCHEN.y0) * 100} fill="#5d6870" stroke="#3f484e" strokeWidth={1.5} />
  </FloorPlane>;
}

// ---------- Furniture ----------
function RadiatorCover() {
  const x0 = 3.0, y0 = HY - 0.32;
  return <g>
    <Box x={x0} y={y0} w={1.6} d={0.32} h={1.0} c={WHITE} />
    <FaceX x={x0 + 1.6} y1={HY} z1={1.0}><rect x={5} y={12} width={22} height={74} fill="#ebe6dc" stroke="#d6cfc2" strokeWidth={2} /></FaceX>
    <Box x={x0 - 0.06} y={y0 - 0.08} z={1.0} w={1.72} d={0.4} h={0.07} c={WHITE} />
  </g>;
}

function RadiatorTop() {
  const z = 1.07, frame = (x, w, h) => <Box x={x} y={HY - 0.14} z={z} w={w} d={0.05} h={h} c={['#2a2a2c', '#1d1d1f', '#2e2e30']} />;
  return <g>
    {frame(3.1, 0.3, 0.36)}
    <Box x={3.55} y={HY - 0.16} z={z} w={0.34} d={0.05} h={0.44} c={['#e9e6df', '#d9d5cc', '#cfcac0']} />
    {frame(4.15, 0.28, 0.34)}
    <Box x={3.62} y={HY - 0.32} z={z} w={0.14} d={0.14} h={0.2} c={['#6b2236', '#561a2b', '#4a1625']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={HY} w={FRONT.x0} d={0.2} h={h} c={c} />
    <Box x={FRONT.x1} y={HY} w={HX - FRONT.x1} d={0.2} h={h} c={c} />
    <Box x={HX} y={ST.d} w={0.2} d={KITCHEN.y0 - ST.d} h={h} c={c} />
    <Box x={HX} y={KITCHEN.y1} w={0.2} d={HY + 0.2 - KITCHEN.y1} h={h} c={c} />
  </g>;
}

function DownstairsHallScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1110} cy={480} zoom={1.12} label="Downstairs hallway" defs={<clipPath id="dhfloor"><rect x={0} y={0} width={HX * 100} height={HY * 100} /></clipPath>}>
    <Slab RX={HX + 0.2} RY={HY + 0.2} />
    <Floor />
    <Walls />
    <LivingRoomDoor />
    <ToiletDoor />
    <Staircase />
    <FrontDoorway />
    <KitchenDoorway />
    <RadiatorCover />
    <RadiatorTop />
    <FrontWalls />
    <Tag show={L} at={[0, 1.22, 4.65]} text="Toilet" />
    <Tag show={L} at={[0.78, 0, 4.65]} text="Living room" />
    <Tag show={L} at={[5.2, 0.45, 4.6]} text="Stairs up" />
    <Tag show={L} at={[1.07, HY + 0.1, 1.2]} text="Front door" />
    <Tag show={L} at={[HX + 0.1, 1.62, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.DownstairsHallScene = DownstairsHallScene;
