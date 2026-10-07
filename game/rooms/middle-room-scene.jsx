// Living room, middle section (through the bay doors). Static, no character. Exports window.MiddleRoomScene.
// Back-left wall (y = 0): clothes airer + radiator, fridge, coat rack, bay doors to the main living area, white sideboard.
// Back-right wall (x = 0): wide opening with corbels into the back room. Front wall (y = RY, cut low): arch to the kitchen.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 6.5, RY = 3.6, RH = 4.2;
const BACK = { y0: 0.45, y1: 3.15, top: 3.4 };   // back-right wall → Back room
const BAY = { x0: 3.95, x1: 5.35 };              // back-left wall → Living room (main)
const KITCHEN = { x0: 2.5, x1: 3.6 };            // front wall → Kitchen (arch)
const STEEL = ['#d3d7da', '#bcc1c5', '#a9afb4'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 4; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#mdfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  const H = RH * 100, a = BACK.y0 * 100, b = BACK.y1 * 100, t = (RH - BACK.top) * 100;
  return <g>
    <BackWallY RX={RX} RH={RH} />
    {/* back-right wall with the wide opening cut out */}
    <Plane o={[0, 0, RH]} u={[0, 1, 0]} v={[0, 0, -1]}>
      <path d={`M0,0 H${RY * 100} V${H} H0 Z M${a},${H} V${t} H${b} V${H} Z`} fill="#e9d6b6" fillRule="evenodd" />
    </Plane>
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={BAY.x0 - 0.1} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={BAY.x1 + 0.1} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Doorways ----------
// Doorway → Back room. A peek of the back room's window wall through the opening (drawn first, behind the wall).
function BackRoomPeek() {
  const xb = -1.8;
  return <g>
    <FloorPlane x={xb} y={BACK.y0}>{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={0} y={i * 45} width={180} height={45} fill={i % 2 ? '#a26c3f' : '#966238'} stroke="#7a4b26" strokeWidth={1.5} />)}</FloorPlane>
    <Plane o={[xb, BACK.y1, BACK.top]} u={[0, -1, 0]} v={[0, 0, -1]}>
      <rect x={0} y={0} width={(BACK.y1 - BACK.y0) * 100} height={BACK.top * 100} fill="#efe3c8" />
      <rect x={70} y={80} width={130} height={110} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} />
      <rect x={78} y={110} width={114} height={72} fill="#bfd9c0" /><line x1={135} x2={135} y1={110} y2={182} stroke="#fff" strokeWidth={4} /><line x1={78} x2={192} y1={146} y2={146} stroke="#fff" strokeWidth={4} />
      <rect x={66} y={70} width={138} height={44} rx={4} fill="#eadfca" />
      <path d="M66,114 q8,8 17,0 t17,0 t17,0 t17,0 t17,0 t17,0 t17,0 t17,0" fill="none" stroke="#e3a7a0" strokeWidth={4} />
      <rect x={62} y={190} width={146} height={8} fill="#ffffff" />
    </Plane>
    <polygon points={pts([[0, BACK.y0, 0], [xb, BACK.y0, 0], [xb, BACK.y0, BACK.top], [0, BACK.y0, BACK.top]])} fill="#f1e6cf" />
    <polygon points={pts([[0, BACK.y0, BACK.top], [xb, BACK.y0, BACK.top], [xb, BACK.y1, BACK.top], [0, BACK.y1, BACK.top]])} fill="#fffaf0" />
    <FloorPlane z={0.004} x={-0.25} y={BACK.y0}><rect x={0} y={0} width={25} height={(BACK.y1 - BACK.y0) * 100} fill="#966238" /></FloorPlane>
  </g>;
}

// Plaster corbels in the top corners of the back-room opening.
function Corbels() {
  const t = (RH - BACK.top) * 100;
  const corbel = (x, flip) => <g transform={`translate(${x} ${t}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M0,0 H34 V10 Q34,52 6,70 L0,70 Z" fill="#fffaf0" stroke="#dccfb6" strokeWidth={2} />
    <path d="M8,14 a10,10 0 1 1 14,12" fill="none" stroke="#dccfb6" strokeWidth={2.5} />
  </g>;
  return <Plane o={[0.01, 0, RH]} u={[0, 1, 0]} v={[0, 0, -1]}>{corbel(BACK.y0 * 100, false)}{corbel(BACK.y1 * 100, true)}</Plane>;
}

// Doorway → Living room, main area (glazed double bay doors on the back-left wall)
function BayDoors() {
  const leaf = (x) => <g key={x}>
    <rect x={x} y={0} width={66} height={325} fill="#f8f3ea" stroke="#d6cab3" strokeWidth={1.5} />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={x + 9 + (i % 2) * 25} y={12 + Math.floor(i / 2) * 60} width={22} height={54} fill="#d6e4e8" />)}
    <rect x={x + (x ? 6 : 56)} y={170} width={5} height={20} rx={2} fill="#c9a54a" />
  </g>;
  return <FaceY y={0.02} x0={BAY.x0} z1={3.3}>
    <rect x={-10} y={-10} width={160} height={335} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    {leaf(4)}{leaf(72)}
  </FaceY>;
}

// Doorway → Kitchen (arch in the cut-away front wall; tiled threshold)
function KitchenDoorway() {
  return <FloorPlane z={0.005} x={KITCHEN.x0} y={RY}><rect x={0} y={0} width={(KITCHEN.x1 - KITCHEN.x0) * 100} height={20} fill="#56616a" stroke="#3e474e" strokeWidth={1.5} /></FloorPlane>;
}

// ---------- Furniture ----------
function RadiatorAndAirer() {
  const clothes = ['#1f2125', '#2a2a2c', '#6b2236', '#3d4a6b', '#1f2125', '#e3c04f', '#2a2a2c', '#8fb8de', '#1f2125'];
  return <g>
    <Box x={0.25} y={0} w={1.3} d={0.25} h={0.95} c={WHITE} />
    <FaceY y={0.6} x0={0.15} z1={1.5}>
      {clothes.map((c, i) => <path key={i} d={`M${8 + i * 15},4 h12 l2,${70 + (i % 3) * 14} h-16 z`} fill={c} />)}
      <line x1={0} x2={150} y1={4} y2={4} stroke="#b5bcc0" strokeWidth={4} />
      <line x1={30} x2={90} y1={4} y2={150} stroke="#b5bcc0" strokeWidth={3} /><line x1={120} x2={60} y1={4} y2={150} stroke="#b5bcc0" strokeWidth={3} />
    </FaceY>
  </g>;
}

function MacrameHanging() {
  return <FaceY y={0.02} x0={1.62} z1={2.9}>
    <circle cx={14} cy={8} r={8} fill="none" stroke="#c7b28c" strokeWidth={2} />
    <path d="M2,16 H26 L20,60 H8 Z" fill="#efe6d4" stroke="#d8ccb2" strokeWidth={1.5} />
    {[6, 10, 14, 18, 22].map(x => <line key={x} x1={x} x2={x} y1={60} y2={100} stroke="#efe6d4" strokeWidth={2} />)}
  </FaceY>;
}

function AmericanFridge() {
  const x0 = 1.95, d = 0.8, h = 2.15;
  return <g>
    <Box x={x0} y={0} w={1.05} d={d} h={h} c={STEEL} />
    <FaceY y={d} x0={x0} z1={h}>
      <line x1={52} x2={52} y1={0} y2={h * 100} stroke="#9aa1a6" strokeWidth={2} />
      <rect x={44} y={60} width={4} height={80} rx={2} fill="#9aa1a6" /><rect x={57} y={60} width={4} height={80} rx={2} fill="#9aa1a6" />
      <rect x={12} y={70} width={26} height={8} fill="#2a2b2e" /><circle cx={30} cy={74} r={1.5} fill="#5eea6b" />
      {/* photos + drawings on the fridge */}
      <path d="M72,30 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 q0,10 -12,18 q-12,-8 -12,-18 z" fill="#f4b6c4" />
      <rect x={70} y={60} width={22} height={30} fill="#fbf8f2" transform="rotate(-6 81 75)" /><rect x={74} y={66} width={14} height={12} fill="#8fb8de" />
      <rect x={66} y={100} width={26} height={34} fill="#fbf8f2" /><rect x={70} y={104} width={18} height={18} fill="#e8b07e" />
    </FaceY>
    <Box x={x0 + 0.1} y={0.1} z={h} w={0.45} d={0.45} h={0.38} c={['#e6eaec', '#c9cfd2', '#b5bcc0']} />
    <Box x={x0 + 0.6} y={0.15} z={h} w={0.35} d={0.3} h={0.16} c={['#f2b632', '#d99e22', '#c08a1a']} />
  </g>;
}

function CoatRack() {
  const coats = [['#2a2a2c', 0, 150], ['#5c4a3a', 18, 120], ['#7f9174', 36, 110], ['#e7e1d3', 40, 160], ['#3a2a2c', 56, 140], ['#6b2236', 66, 120]];
  return <g>
    <FaceY y={0.55} x0={3.1} z1={2.0}>
      <line x1={0} x2={0} y1={0} y2={200} stroke="#2a2a2c" strokeWidth={4} /><line x1={80} x2={80} y1={0} y2={200} stroke="#2a2a2c" strokeWidth={4} />
      <line x1={-4} x2={84} y1={4} y2={4} stroke="#2a2a2c" strokeWidth={4} />
      {coats.map(([c, x, h], i) => <path key={i} d={`M${x + 4},6 q10,-6 20,0 l4,${h} h-28 z`} fill={c} />)}
      <rect x={4} y={186} width={72} height={6} fill="#2a2a2c" />
      <rect x={10} y={178} width={14} height={8} rx={3} fill="#fbf8f2" /><rect x={30} y={178} width={14} height={8} rx={3} fill="#fbf8f2" />
    </FaceY>
  </g>;
}

function IroningBoard() {
  return <FaceY y={0.12} x0={5.42} z1={2.7}>
    <path d="M6,0 Q18,-6 30,0 L30,240 Q18,250 6,240 Z" fill="#f4f2ee" stroke="#cfcac0" strokeWidth={1.5} />
    {Array.from({ length: 16 }, (_, i) => <polygon key={i} points={`${10 + (i % 2) * 10},${14 + i * 14} ${16 + (i % 2) * 10},${4 + i * 14} ${22 + (i % 2) * 10},${14 + i * 14}`} fill={i % 5 === 2 ? '#e9c34c' : i % 3 ? '#9a9a98' : '#2a2a2c'} />)}
  </FaceY>;
}

function WhiteSideboard() {
  return <g>
    <Box x={5.8} y={0} w={0.68} d={0.5} h={1.0} c={WHITE} />
    <FaceX x={6.48} y1={0.5} z1={1.0}><rect x={6} y={8} width={38} height={22} fill="none" stroke="#ddd6c9" strokeWidth={2} /><rect x={6} y={36} width={38} height={56} fill="none" stroke="#ddd6c9" strokeWidth={2} /></FaceX>
    <Box x={5.78} y={0} z={1.0} w={0.72} d={0.54} h={0.05} c={['#c49a64', '#a87e48', '#93703f']} />
    {[[5.85, '#f7f2e6', 0.14], [6.05, '#e98a3a', 0.12], [6.22, '#f7f2e6', 0.16], [6.0, '#c9b6a0', 0.11]].map(([x, c, s], i) => <Box key={i} x={x} y={0.1 + (i % 2) * 0.18} z={1.05} w={s} d={s} h={s * 0.8} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
  </g>;
}

function LaundryBaskets() {
  return <g>
    <Box x={3.8} y={RY - 0.6} w={0.5} d={0.5} h={0.7} c={['#7b8088', '#666b72', '#585c63']} />
    <FloorPlane z={0.71} x={3.78} y={RY - 0.62}><ellipse cx={26} cy={26} rx={30} ry={24} fill="#f4efe4" /><ellipse cx={18} cy={30} rx={12} ry={8} fill="#c84a5a" /><ellipse cx={34} cy={18} rx={12} ry={8} fill="#fbf8f2" /></FloorPlane>
    <Box x={4.45} y={RY - 0.55} w={0.55} d={0.45} h={0.45} c={['#c9d3da', '#b3bec6', '#a2adb6']} />
  </g>;
}

function SchoolBag() {
  return <g>
    <Box x={1.4} y={2.3} w={0.5} d={0.35} h={0.22} c={['#cfe3ea', '#b7cfd8', '#a5bfc9']} />
    <Box x={2.0} y={2.5} w={0.22} d={0.2} h={0.16} c={['#f6c9c4', '#e8b0aa', '#dba099']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={KITCHEN.x0} d={0.2} h={h} c={c} />
    <Box x={KITCHEN.x1} y={RY} w={RX - KITCHEN.x1} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={RY + 0.2} h={h} c={c} />
  </g>;
}

function MiddleRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={960} cy={470} zoom={1.15} label="Middle room" defs={<clipPath id="mdfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <BackRoomPeek />
    <Slab RX={RX} RY={RY} />
    <Floor />
    <Walls />
    <Corbels />
    <MacrameHanging />
    <BayDoors />
    <RadiatorAndAirer />
    <AmericanFridge />
    <CoatRack />
    <IroningBoard />
    <WhiteSideboard />
    <KitchenDoorway />
    <SchoolBag />
    <LaundryBaskets />
    <FrontWalls />
    <Tag show={L} at={[0, (BACK.y0 + BACK.y1) / 2, 3.85]} text="Back room" />
    <Tag show={L} at={[(BAY.x0 + BAY.x1) / 2, 0, 3.85]} text="Living room" />
    <Tag show={L} at={[(KITCHEN.x0 + KITCHEN.x1) / 2, RY + 0.1, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.MiddleRoomScene = MiddleRoomScene;

window.MiddleRoomParts = { RX, RY, RH, BACK, BAY, KITCHEN, Corbels, MacrameHanging, BayDoors, RadiatorAndAirer, AmericanFridge, CoatRack, IroningBoard, WhiteSideboard, KitchenDoorway, SchoolBag, LaundryBaskets, FrontWalls };
