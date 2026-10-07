// Upstairs hallway, seen from the Messy Room door. Static, no character. Exports window.HallwayScene.
// Corridor runs along x. Back-left wall (y = 0) is the LEFT side of the hall; end wall (x = 0) is straight ahead.
// Front walls (y = HY right side, x = HX near end) are cut down low so we can see in.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, shade, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, PanelDoorArt, Tag, IsoStage } = window.Iso;

const HX = 8.2, HY = 2.2, RH = 4.2;
const DOORS = {
  connor: { x0: 0.5, x1: 1.45 },   // left wall, far end, next to Chloe's  → Connor's room
  stairs: { x0: 3.0, x1: 5.0 },    // left side of the floor, middle       → stairs down
  parents: { x0: 6.4, x1: 7.35 },  // left wall, between Messy Room + stairs → Parents' room
  chloe: { y0: 0.62, y1: 1.58 },   // end wall, straight ahead             → Chloe's room
  bathroom: { x0: 3.4, x1: 4.4 },  // right wall, middle                   → Shower bathroom
  messy: { y0: 0.62, y1: 1.58 },   // near end wall (behind the viewer)    → Messy Room
};
const STAIR_W = 1.0; // stairwell is cut into the carpet along the left wall, steps drop towards the Messy Room end
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

// ---------- Shell ----------
function Carpet() {
  const specks = [];
  const s = DOORS.stairs, sx0 = s.x0 * 100, sx1 = s.x1 * 100, sy1 = STAIR_W * 100;
  for (let i = 0; i < 320; i++) {
    const cx = rnd(i) * HX * 100, cy = rnd(i + 999) * HY * 100;
    if (cx > sx0 - 2 && cx < sx1 + 2 && cy < sy1 + 2) continue;
    specks.push(<circle key={i} cx={cx} cy={cy} r={1.8} fill={i % 3 ? '#644f41' : '#8a7262'} opacity={.6} />);
  }
  return <FloorPlane>
    {/* carpet with the top of the stairwell cut out of it */}
    <path d={`M0,0 H${HX * 100} V${HY * 100} H0 Z M${sx0},0 H${sx1} V${sy1} H${sx0} Z`} fill="#76604f" fillRule="evenodd" />
    <rect x={sx0} y={sy1 - 3} width={sx1 - sx0} height={6} fill="#fffaf2" />
    <rect x={sx0 - 3} y={0} width={6} height={sy1} fill="#fffaf2" />
    {specks}
  </FloorPlane>;
}

function HallWalls() {
  const s = DOORS.stairs;
  return <g>
    <BackWallY RX={HX} RH={RH} />
    {/* end wall (Chloe's door) */}
    <BackWallX RY={HY} RH={RH} />
    <WallCap RX={HX} RY={HY} RH={RH} />
    {/* skirting */}
    <StripY x0={0} x1={s.x0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={s.x1} x1={HX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={HY} z0={0} z1={0.18} fill="#f3eadb" />
    {/* dado rail */}
    {[[0, 0.39], [1.56, 6.29], [7.46, HX]].map(([a, b]) => <g key={a}>
      <StripY x0={a} x1={b} z0={1.52} z1={1.55} fill="#e3d0ae" />
      <StripY x0={a} x1={b} z0={1.55} z1={1.65} fill="#fffaf2" />
    </g>)}
    {[[0, 0.51], [1.69, HY]].map(([a, b]) => <g key={a}>
      <StripX y0={a} y1={b} z0={1.52} z1={1.55} fill="#d9c6a6" />
      <StripX y0={a} y1={b} z0={1.55} z1={1.65} fill="#f3eadb" />
    </g>)}
    {/* coving */}
    <StripY x0={0} x1={HX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={HY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// Cut-away front walls, kept low. Each gap is a doorway.
function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'], b = DOORS.bathroom, m = DOORS.messy;
  return <g>
    {/* Doorway → Shower bathroom (right-hand wall, middle). Tiled threshold. */}
    <FloorPlane z={0.005} x={b.x0} y={HY}><rect x={0} y={0} width={(b.x1 - b.x0) * 100} height={20} fill="#dfe6e6" stroke="#c4cfcf" strokeWidth={1.5} /></FloorPlane>
    {/* Doorway → Messy Room (near end wall, where we're standing). Wooden threshold. */}
    <FloorPlane z={0.005} x={HX} y={m.y0}><rect x={0} y={0} width={20} height={(m.y1 - m.y0) * 100} fill="#b77f4d" stroke="#8d5a2e" strokeWidth={1.5} /></FloorPlane>
    <Box x={0} y={HY} w={b.x0} d={0.2} h={h} c={c} />
    <Box x={b.x1} y={HY} w={HX - b.x1} d={0.2} h={h} c={c} />
    <Box x={HX} y={0} w={0.2} d={m.y0} h={h} c={c} />
    <Box x={HX} y={m.y1} w={0.2} d={HY + 0.2 - m.y1} h={h} c={c} />
  </g>;
}

// ---------- Doorways ----------
// Doorway → Stairs going downstairs. Opening in the carpet along the left wall; steps go down towards the Messy Room end.
// Drawn before the carpet so the carpet frames the opening.
function Stairs() {
  const { x0, x1 } = DOORS.stairs, N = 5, run = 0.3, rise = 0.24, W = STAIR_W;
  const steps = [];
  for (let k = 0; k < N; k++) {
    const top = -rise * (k + 1), x = x0 + run * k, f = -0.09 * k;
    steps.push(<g key={k}>
      <Box x={x} y={0} z={top - 0.3} w={run} d={W} h={0.3} c={[shade('#8a7262', f), shade('#5f4b3e', f), shade('#4e3d32', f)]} />
      <line x1={P(x + run, 0, top)[0]} y1={P(x + run, 0, top)[1]} x2={P(x + run, W, top)[0]} y2={P(x + run, W, top)[1]} stroke={shade('#c8b4a2', f)} strokeWidth={3} />
    </g>);
  }
  return <g>
    {/* dark stairwell below */}
    <FloorPlane z={-1.0} x={x0} y={0}><rect x={0} y={0} width={350} height={W * 100} fill="#2e241e" /></FloorPlane>
    {/* the left wall carries on down beside the stairs, dado rail sloping with them */}
    <polygon points={pts([[x0, 0.01, 0], [x1 + 0.6, 0.01, 0], [x1 + 0.6, 0.01, -2.1], [x0, 0.01, -0.5]])} fill="#cdb791" />
    <polygon points={pts([[x0 + 0.6, 0.01, 0], [x1 + 0.6, 0.01, -1.6], [x1 + 0.6, 0.01, -1.52], [x0 + 0.7, 0.01, 0]])} fill="#e9dcc4" />
    {/* top riser where the hall floor ends */}
    <polygon points={pts([[x0, 0, 0], [x0, W, 0], [x0, W, -rise], [x0, 0, -rise]])} fill="#5f4b3e" />
    {steps}
  </g>;
}

// Doorway → Connor's room (left wall, next to Chloe's)
function ConnorDoor() {
  return <FaceY y={0.02} x0={DOORS.connor.x0} z1={3.3}><PanelDoorArt /></FaceY>;
}

// Doorway → Parents' room (left wall, between the Messy Room and the stairs)
function ParentsDoor() {
  return <FaceY y={0.02} x0={DOORS.parents.x0} z1={3.3}><PanelDoorArt hinge="right" /></FaceY>;
}

function ChloeSign() {
  const font = "'Baloo 2', 'Comic Sans MS', sans-serif";
  return <g transform="translate(47 128) rotate(-3)">
    <rect x={-44} y={-40} width={88} height={78} rx={7} fill="#d9e8fb" stroke="#4a7fc1" strokeWidth={2.5} />
    <rect x={-12} y={-46} width={24} height={11} fill="#fff6c8" opacity={.9} />
    <text x={0} y={-16} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily={font} fill="#2f5d9e">Chloe's room,</text>
    <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily={font} fill="#5a3d32">stay out,</text>
    <text x={0} y={27} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily={font} fill="#1f4fa8">no Callies</text>
  </g>;
}

// Doorway → Chloe's room (end wall, straight ahead). Glazed fanlight above, sign on the door.
function ChloeDoor() {
  return <FaceX x={0.02} y1={DOORS.chloe.y1} z1={3.3}>
    <rect x={-11} y={-72} width={117} height={61} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    <rect x={-3} y={-64} width={101} height={46} fill="#e3eaec" />
    {[1, 2, 3].map(i => <line key={i} x1={-3 + i * 25.25} x2={-3 + i * 25.25} y1={-64} y2={-18} stroke="#fffaf2" strokeWidth={3} />)}
    <line x1={-3} x2={98} y1={-41} y2={-41} stroke="#fffaf2" strokeWidth={3} />
    <PanelDoorArt />
    <ChloeSign />
  </FaceX>;
}

// Ceiling hatch → Attic (a cut piece of ceiling with the hatch in it; dashed square on the carpet shows where it is)
function AtticHatch() {
  const x0 = 1.9, x1 = 3.3, y1 = 1.5;
  return <g>
    <Box x={x0} y={-0.2} z={RH} w={x1 - x0} d={y1 + 0.2} h={0.08} c={['#fffaf0', '#efe3cc', '#e3d0ae']} />
    <FloorPlane z={RH + 0.081} x={x0 + 0.2} y={0.15}>
      <rect x={0} y={0} width={100} height={100} fill="#f3eadb" stroke="#d9c6a6" strokeWidth={4} />
      <rect x={12} y={12} width={76} height={76} fill="#ecdfc6" stroke="#e2d2b6" strokeWidth={2} />
      <circle cx={78} cy={50} r={5} fill="#b9973f" />
    </FloorPlane>
  </g>;
}
const HatchFootprint = () => <FloorPlane z={0.01} x={2.1} y={0.15}><rect x={0} y={0} width={100} height={100} fill="none" stroke="#a08a78" strokeWidth={3} strokeDasharray="10 8" /></FloorPlane>;

function HallwayScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1150} cy={500} zoom={1.1} label="Hallway">
    <Stairs />
    <Slab RX={HX + 0.2} RY={HY + 0.2} />
    <Carpet />
    <HatchFootprint />
    <HallWalls />
    <ConnorDoor />
    <ParentsDoor />
    <ChloeDoor />
    <FrontWalls />
    <AtticHatch />
    <Tag show={L} at={[0, 1.1, 4.65]} text="Chloe's room" />
    <Tag show={L} at={[0.97, 0, 4.65]} text="Connor's room" />
    <Tag show={L} at={[4.1, 0.5, 1.1]} text="Stairs down" />
    <Tag show={L} at={[6.87, 0, 4.65]} text="Parents' room" />
    <Tag show={L} at={[2.6, 0.7, 4.75]} text="Attic hatch" />
    <Tag show={L} at={[3.9, HY + 0.1, 1.25]} text="Bathroom" />
    <Tag show={L} at={[HX + 0.1, 1.1, 1.25]} text="Messy room" />
  </IsoStage>;
}
window.HallwayScene = HallwayScene;
