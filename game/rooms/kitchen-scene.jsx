// Kitchen. Static, no character. Exports window.KitchenScene.
// Back-left wall (y = 0): window over the sink, washing machine, archway to the living room, hob/oven run.
// Back-right wall (x = 0): back door to the garden. Front wall (y = RY, cut low): larder + kettle/microwave worktop.
// Near end (x = RX, cut low): worktop over the radiator, bin, door from the hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, archPath, Tag, IsoStage } = window.Iso;

const RX = 6.2, RY = 3.2, RH = 4.2, D = 0.72, BH = 1.0, WT = 1.07;
const CREAM = ['#f7f0e2', '#ede3d0', '#e2d6bf'];
const GRANITE = ['#2c2f36', '#1f2126', '#24272d'];
const STEEL = ['#d3d7da', '#bcc1c5', '#a9afb4'];
const ARCH = { x0: 2.5, x1: 3.6, spring: 2.7 };   // → Living room (middle section)
const GARDEN = { y0: 1.35, y1: 2.3 };             // → Back garden
const HALL = { y0: 2.25, y1: 3.15 };              // → Downstairs hallway

// ---------- Shell ----------
function TileFloor() {
  const lines = [];
  for (let i = 1; i < RX * 100 / 62; i++) lines.push(<line key={'v' + i} x1={i * 62} x2={i * 62} y1={0} y2={RY * 100} stroke="#3e474e" strokeWidth={2} />);
  for (let j = 1; j < RY * 100 / 62; j++) lines.push(<line key={'h' + j} x1={0} x2={RX * 100} y1={j * 62} y2={j * 62} stroke="#3e474e" strokeWidth={2} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#56616a" />{lines}</FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#f4f0e7" holes={archPath(RH, ARCH.x0, ARCH.x1, 0, ARCH.spring)} />
    <BackWallX RY={RY} RH={RH} fill="#e7e1d4" />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={ARCH.x1} x1={RX} z0={0} z1={0.15} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.15} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// White square tiles with the fruit border, drawn flat on the back wall.
function Tiles({ x0, x1, z0, z1, border = 1.5 }) {
  const w = (x1 - x0) * 100, h = (z1 - z0) * 100, by = (z1 - border) * 100, out = [];
  for (let i = 1; i < w / 24; i++) out.push(<line key={'v' + i} x1={i * 24} x2={i * 24} y1={0} y2={h} stroke="#ddd6c8" strokeWidth={1.5} />);
  for (let j = 1; j < h / 24; j++) out.push(<line key={'h' + j} x1={0} x2={w} y1={j * 24} y2={j * 24} stroke="#ddd6c8" strokeWidth={1.5} />);
  const fruit = [];
  for (let i = 0; i < w / 20; i++) fruit.push(<ellipse key={i} cx={10 + i * 20} cy={by + 6} rx={6} ry={4} fill={['#e79aa6', '#9cc79a', '#e8b07e'][i % 3]} />);
  return <Plane o={[x0, 0.006, z1]} u={[1, 0, 0]} v={[0, 0, -1]}>
    <rect x={0} y={0} width={w} height={h} fill="#fbf9f4" />{out}
    {border > z0 && border < z1 && <g><rect x={0} y={by} width={w} height={12} fill="#f3eadb" stroke="#ddd0b8" strokeWidth={1} />{fruit}</g>}
  </Plane>;
}

// Cream "cathedral" cupboard door, drawn in a wall/face plane.
function CathedralDoor({ x = 0, y = 0, w, h, knob = 'right' }) {
  const k = knob === 'right' ? x + w - 12 : x + 12;
  return <g>
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
    <path d={`M${x + 11},${y + h - 11} V${y + 24} Q${x + w / 2},${y + 4} ${x + w - 11},${y + 24} V${y + h - 11} Z`} fill="none" stroke="#d6c8ad" strokeWidth={2.5} />
    <circle cx={k} cy={y + (y === 0 && h > 60 ? 18 : h / 2)} r={4} fill="#fffdf8" stroke="#cbbd9f" strokeWidth={1.2} />
  </g>;
}

// ---------- Doorways ----------
// Glazed uPVC door/window panes with the garden seen through them.
function GardenGlass({ w, h, cols, rows }) {
  const pw = (w - 16) / cols, ph = (h - 16) / rows, out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(<rect key={r + '-' + c} x={8 + c * pw} y={8 + r * ph} width={pw - 4} height={ph - 4} fill={r < rows * 0.55 ? '#e2b47c' : '#a9cf8f'} />);
  return <g><rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} />{out}</g>;
}

// Doorway → Back garden (back-right wall)
function GardenDoor() {
  return <FaceX x={0.02} y1={GARDEN.y1} z1={3.25}>
    <rect x={-8} y={-8} width={111} height={333} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
    <GardenGlass w={95} h={317} cols={3} rows={5} />
    <rect x={8} y={170} width={6} height={30} rx={2} fill="#c9a54a" />
    <rect x={-6} y={317} width={107} height={8} fill="#c9a54a" />
  </FaceX>;
}

// Doorway → Living room, middle section (arch in the back-left wall). A peek of the next room behind it.
function ArchToLivingRoom() {
  const yb = -1.2;
  return <g>
    <Plane o={[2.2, yb, 3.0]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={170} height={300} fill="#efdcb6" /></Plane>
    <FloorPlane x={2.2} y={yb}>{[0, 1, 2].map(i => <rect key={i} x={0} y={i * 40} width={170} height={40} fill={i % 2 ? '#a26c3f' : '#966238'} stroke="#7a4b26" strokeWidth={1.5} />)}</FloorPlane>
    <polygon points={pts([[ARCH.x0, 0, 0], [ARCH.x0, -0.2, 0], [ARCH.x0, -0.2, ARCH.spring], [ARCH.x0, 0, ARCH.spring]])} fill="#e6dccb" />
    <FloorPlane z={0.004} x={ARCH.x0} y={-0.2}><rect x={0} y={0} width={(ARCH.x1 - ARCH.x0) * 100} height={20} fill="#a26c3f" /></FloorPlane>
  </g>;
}

// Doorway → Downstairs hallway (gap in the near end wall, wooden threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#a26c3f" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>;
}

// ---------- Back-left wall: sink run ----------
function SinkWindow() {
  return <g>
    <Tiles x0={0} x1={2.35} z0={WT} z1={1.38} border={0} />
    <Plane o={[0.05, 0.01, 3.35]} u={[1, 0, 0]} v={[0, 0, -1]}>
      <rect x={-6} y={-6} width={157} height={208} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <g transform="translate(0 0)"><GardenGlass w={72} h={58} cols={2} rows={1} /></g>
      <g transform="translate(74 0)"><GardenGlass w={72} h={58} cols={2} rows={1} /></g>
      <g transform="translate(0 62)"><GardenGlass w={72} h={134} cols={2} rows={2} /></g>
      <g transform="translate(74 62)"><GardenGlass w={72} h={134} cols={2} rows={2} /></g>
    </Plane>
    <Box x={0} y={0} z={1.38} w={1.55} d={0.2} h={0.05} c={['#fbf9f4', '#eae5da', '#ddd6c9']} />
  </g>;
}

function Dishwasher() {
  return <g>
    <Box x={0.03} y={0} w={0.72} d={D} h={BH} c={WHITE} />
    <FaceY y={D} x0={0.03} z1={BH}>
      <rect x={3} y={4} width={66} height={16} fill="#fbfbf8" stroke="#d6d6d0" strokeWidth={1} />
      <rect x={42} y={8} width={18} height={6} fill="#2d2f33" />
      <circle cx={30} cy={12} r={4} fill="#d6d6d0" />
      <CathedralDoor x={0} y={22} w={72} h={76} />
    </FaceY>
  </g>;
}

function SinkUnit() {
  return <g>
    <Box x={0.75} y={0} w={0.8} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={0.75} z1={BH}>
      <rect x={4} y={4} width={72} height={20} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
      <CathedralDoor x={0} y={26} w={80} h={74} />
    </FaceY>
  </g>;
}

function WashingMachine() {
  return <g>
    <Box x={1.55} y={0.02} w={0.72} d={D - 0.02} h={BH - 0.02} c={STEEL} />
    <FaceY y={D} x0={1.55} z1={BH - 0.02}>
      <rect x={5} y={5} width={22} height={9} fill="#e3e6e8" stroke="#a9afb4" strokeWidth={1} />
      <circle cx={52} cy={10} r={5} fill="#e3e6e8" stroke="#a9afb4" strokeWidth={1} />
      <circle cx={36} cy={58} r={27} fill="#e3e6e8" stroke="#9aa1a6" strokeWidth={3} />
      <circle cx={36} cy={58} r={19} fill="#4c565e" />
      <path d="M24,52 a14,14 0 0 1 18,-8" fill="none" stroke="#8f9aa2" strokeWidth={3} />
    </FaceY>
  </g>;
}

function SinkWorktop() {
  return <g>
    <Box x={0} y={0} z={BH} w={2.35} d={D + 0.04} h={0.07} c={GRANITE} />
    <FloorPlane z={WT + 0.001} x={0.85} y={0.12}>
      <rect x={0} y={0} width={62} height={50} rx={6} fill="#c9ced2" stroke="#9aa1a6" strokeWidth={2} />
      <rect x={6} y={6} width={50} height={38} rx={6} fill="#a3abb0" />
      <circle cx={31} cy={25} r={3} fill="#6b747a" />
    </FloorPlane>
    {/* tap */}
    <line x1={P(1.16, 0.1, WT)[0]} y1={P(1.16, 0.1, WT)[1]} x2={P(1.16, 0.1, WT + 0.42)[0]} y2={P(1.16, 0.1, WT + 0.42)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
    <line x1={P(1.16, 0.1, WT + 0.42)[0]} y1={P(1.16, 0.1, WT + 0.42)[1]} x2={P(1.16, 0.3, WT + 0.36)[0]} y2={P(1.16, 0.3, WT + 0.36)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
  </g>;
}

function DishRack() {
  const plates = [['#fbf9f4', 0.12], ['#f3d34a', 0.2], ['#e46a8a', 0.28], ['#fbf9f4', 0.36], ['#3f3f44', 0.44]];
  return <g>
    <Box x={0.08} y={0.12} z={WT} w={0.6} d={0.42} h={0.08} c={['#ffffff', '#ececea', '#dcdcda']} />
    {plates.map(([c, x], i) => <Box key={i} x={x} y={0.16} z={WT + 0.06} w={0.045} d={0.34} h={0.34} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
  </g>;
}

function BoilerCupboard() {
  return <g>
    <Box x={1.6} y={0} z={2.3} w={0.75} d={0.4} h={1.15} c={CREAM} />
    <FaceY y={0.4} x0={1.6} z1={3.45}><CathedralDoor x={0} y={6} w={75} h={104} knob="right" /></FaceY>
    <Tiles x0={1.55} x1={2.35} z0={1.38} z1={2.3} border={1.6} />
  </g>;
}

// ---------- Back-left wall: hob run ----------
function HobTiles() { return <Tiles x0={ARCH.x1 + 0.1} x1={RX} z0={WT} z1={2.55} border={1.55} />; }

function Oven() {
  return <g>
    <Box x={3.75} y={0} w={0.72} d={D} h={BH} c={WHITE} />
    <FaceY y={D} x0={3.75} z1={BH}>
      <rect x={2} y={4} width={68} height={14} fill="#fbfbf8" />
      <rect x={28} y={7} width={16} height={8} fill="#2d2f33" /><rect x={31} y={9} width={10} height={3} fill="#ff4b3a" />
      <circle cx={14} cy={11} r={4} fill="#e4e4e0" stroke="#bdbdb8" /><circle cx={58} cy={11} r={4} fill="#e4e4e0" stroke="#bdbdb8" />
      <rect x={4} y={22} width={64} height={66} rx={2} fill="#1f2125" />
      <rect x={10} y={27} width={52} height={4} rx={2} fill="#d9dcdf" />
      <path d="M40,31 v22 q-4,10 2,18 l-8,2 q-4,-14 0,-40 z" fill="#8b8f94" />
    </FaceY>
  </g>;
}

function HobRunUnits() {
  return <g>
    <Box x={4.47} y={0} w={0.55} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={4.47} z1={BH}>
      <rect x={4} y={4} width={47} height={20} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
      <circle cx={27} cy={14} r={4} fill="#fffdf8" stroke="#cbbd9f" />
      <CathedralDoor x={0} y={26} w={55} h={74} />
    </FaceY>
    <Box x={5.02} y={0} w={RX - 5.02} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={5.02} z1={BH}><CathedralDoor x={0} y={0} w={(RX - 5.02) * 100} h={100} knob="left" /></FaceY>
  </g>;
}

function HobWorktop() {
  return <g>
    <Box x={3.7} y={0} z={BH} w={RX - 3.7} d={D + 0.04} h={0.07} c={GRANITE} />
    <FloorPlane z={WT + 0.001} x={3.8} y={0.08}>
      <rect x={0} y={0} width={62} height={56} rx={3} fill="#c9ced2" stroke="#9aa1a6" strokeWidth={1.5} />
      {[[16, 15], [46, 15], [16, 41], [46, 41]].map(([cx, cy], i) => <g key={i}><circle cx={cx} cy={cy} r={10} fill="none" stroke="#2d2f33" strokeWidth={3} /><circle cx={cx} cy={cy} r={4} fill="#2d2f33" /></g>)}
    </FloorPlane>
  </g>;
}

function CasserolePot() {
  return <g>
    <Box x={3.84} y={0.12} z={WT} w={0.3} d={0.28} h={0.18} c={['#3f8a6b', '#2f6e55', '#285f49']} />
    <FloorPlane z={WT + 0.181} x={3.84} y={0.12}><circle cx={15} cy={14} r={4} fill="#c9ced2" /></FloorPlane>
  </g>;
}

function ChoppingBoard() {
  return <Box x={5.4} y={0.15} z={WT} w={0.55} d={0.4} h={0.05} c={['#9c6b3c', '#7f5530', '#6e4a2a']} />;
}

function HobWallCabinets() {
  return <g>
    <Box x={3.75} y={0} z={2.55} w={RX - 3.75} d={0.42} h={1.0} c={CREAM} />
    <FaceY y={0.42} x0={3.75} z1={3.55}>
      <CathedralDoor x={0} y={0} w={60} h={100} />
      <CathedralDoor x={60} y={0} w={(RX - 3.75) * 100 / 2 - 30} h={100} knob="right" />
      <CathedralDoor x={60 + (RX - 3.75) * 100 / 2 - 30} y={0} w={(RX - 3.75) * 100 / 2 - 30} h={100} knob="left" />
    </FaceY>
    <Box x={3.7} y={0} z={3.55} w={RX - 3.7} d={0.48} h={0.1} c={CREAM} />
  </g>;
}

// ---------- Near end: worktop over radiator + bin ----------
function RadiatorWorktop() {
  return <g>
    <Box x={RX - 0.16} y={0.9} w={0.14} d={1.0} h={0.75} c={WHITE} />
    <Box x={RX - D} y={D} z={BH} w={D} d={1.35} h={0.07} c={GRANITE} />
    <Box x={RX - 0.62} y={1.1} z={WT} w={0.38} d={0.3} h={0.32} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    <Box x={RX - 0.5} y={1.55} z={WT} w={0.22} d={0.22} h={0.38} c={['#cfe6dc', '#b2d3c5', '#9fc4b4']} />
  </g>;
}

function PedalBin() {
  const cx = RX - 0.45, cy = 2.0, r = 0.22, h = 1.0;
  const a = P(cx - r, cy + r, 0), b = P(cx + r, cy - r, 0), t = P(cx, cy, h), base = P(cx, cy, 0);
  const rx = Math.abs(b[0] - a[0]) / 2, ry = rx * 0.5;
  return <g>
    <path d={`M${base[0] - rx},${base[1]} V${t[1]} A${rx},${ry} 0 0 0 ${base[0] + rx},${t[1]} V${base[1]} A${rx},${ry} 0 0 1 ${base[0] - rx},${base[1]} Z`} fill="#b9bec2" stroke="#8f979d" strokeWidth={1.5} />
    <ellipse cx={t[0]} cy={t[1]} rx={rx} ry={ry} fill="#d3d7da" stroke="#8f979d" strokeWidth={1.5} />
    <ellipse cx={t[0]} cy={t[1]} rx={rx - 6} ry={ry - 3} fill="#3a3d42" />
  </g>;
}

// ---------- Front wall: larder + worktop ----------
function LarderUnit() {
  return <Box x={0.05} y={RY - D} w={0.72} d={D} h={3.4} c={CREAM} />;
}

function FrontCounter() {
  return <g>
    <Box x={0.77} y={RY - D} w={2.3} d={D} h={BH} c={CREAM} />
    <FaceX x={3.07} y1={RY} z1={BH}><rect x={4} y={6} width={64} height={88} fill="none" stroke="#dccfb6" strokeWidth={2} /></FaceX>
    <Box x={0.77} y={RY - D - 0.04} z={BH} w={2.35} d={D + 0.04} h={0.07} c={GRANITE} />
  </g>;
}

function Microwave() {
  return <g>
    <Box x={2.25} y={RY - 0.6} z={WT} w={0.75} d={0.45} h={0.4} c={['#2a2b2e', '#1d1e20', '#26272a']} />
    <FaceX x={3.0} y1={RY - 0.15} z1={WT + 0.4}><rect x={4} y={6} width={18} height={6} fill="#ff4b3a" /></FaceX>
  </g>;
}

function CoffeeMachine() {
  return <g>
    <Box x={1.5} y={RY - 0.6} z={WT} w={0.42} d={0.4} h={0.48} c={['#c9ced2', '#3a3b3f', '#2c2d30']} />
    <Box x={1.62} y={RY - 0.55} z={WT + 0.48} w={0.14} d={0.14} h={0.14} c={STEEL} />
  </g>;
}

function Kettle() {
  return <g>
    <Box x={0.95} y={RY - 0.5} z={WT} w={0.25} d={0.25} h={0.08} c={['#e8e8e4', '#d0d0cc', '#c4c4c0']} />
    <Box x={0.97} y={RY - 0.48} z={WT + 0.08} w={0.21} d={0.21} h={0.3} c={['#fbfbf8', '#ececea', '#dcdcda']} />
  </g>;
}

function MilkBottle() {
  return <g>
    <Box x={1.3} y={RY - 0.38} z={WT} w={0.15} d={0.15} h={0.32} c={['#ffffff', '#f1f1ee', '#e3e3df']} />
    <Box x={1.34} y={RY - 0.34} z={WT + 0.32} w={0.07} d={0.07} h={0.05} c={['#3a6fd8', '#2d5bb8', '#244ea0']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

function KitchenScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1030} cy={480} zoom={1.35} label="Kitchen">
    <ArchToLivingRoom />
    <Slab RX={RX} RY={RY} />
    <TileFloor />
    <Walls />
    <SinkWindow />
    <BoilerCupboard />
    <HobTiles />
    <GardenDoor />
    <Dishwasher />
    <SinkUnit />
    <WashingMachine />
    <SinkWorktop />
    <DishRack />
    <Oven />
    <HobRunUnits />
    <HobWorktop />
    <CasserolePot />
    <ChoppingBoard />
    <HobWallCabinets />
    <HallDoorway />
    <RadiatorWorktop />
    <PedalBin />
    <LarderUnit />
    <FrontCounter />
    <Kettle />
    <MilkBottle />
    <CoffeeMachine />
    <Microwave />
    <FrontWalls />
    <Tag show={L} at={[0, (GARDEN.y0 + GARDEN.y1) / 2, 3.75]} text="Back garden" />
    <Tag show={L} at={[(ARCH.x0 + ARCH.x1) / 2, 0, 3.25]} text="Living room" />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.2]} text="Hallway" />
  </IsoStage>;
}
window.KitchenScene = KitchenScene;
