// Living room, back section. Static, no character. Exports window.BackRoomScene.
// Back-right wall (x = 0): window with the tasselled roman blind, plants on the sill. Back-left wall (y = 0): dressing table + art easel.
// Front wall (y = RY, cut low): teal sofa piled with clothes. Near end (x = RX): wide opening back to the middle section.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 3.8, RY = 3.6, RH = 4.2;
const MIDDLE = { y0: 0.35, y1: 3.25 };   // near end → Middle section
const TEAL = ['#2f7f86', '#25686e', '#1f5a5f'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 3; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#bkfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

function WindowLight() {
  return <FloorPlane z={0.012} x={0.2} y={1.0}><polygon points="0,0 0,170 160,200 160,30" fill="#fff6d8" opacity={.3} /></FloorPlane>;
}

// ---------- Window wall ----------
function RomanBlindWindow() {
  return <g>
    <FaceX x={0.02} y1={2.75} z1={3.5}>
      <rect x={-6} y={-6} width={192} height={196} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={180} height={184} fill="#bfd9c0" />
      {[60, 120].map(x => <line key={x} x1={x} x2={x} y1={0} y2={184} stroke="#fff" strokeWidth={5} />)}
      {[70, 128].map(y => <line key={y} x1={0} x2={180} y1={y} y2={y} stroke="#fff" strokeWidth={5} />)}
      {/* roman blind, pulled half up, with tassel fringe */}
      <rect x={-10} y={-10} width={200} height={70} rx={4} fill="#eadfca" />
      {[14, 32, 48].map(y => <path key={y} d={`M-10,${y} Q90,${y + 8} 190,${y}`} fill="none" stroke="#d6c8ad" strokeWidth={2} />)}
      <path d="M-10,60 q12,10 25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0" fill="#e9b7ad" stroke="#d99a90" strokeWidth={2} />
      {Array.from({ length: 16 }, (_, i) => <line key={i} x1={-5 + i * 12.5} x2={-5 + i * 12.5} y1={64} y2={74} stroke="#d99a90" strokeWidth={3} />)}
    </FaceX>
    <Box x={0} y={0.8} z={1.62} w={0.25} d={2.0} h={0.06} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function SillPlants() {
  const plant = (y) => {
    const [x0, y0] = P(0.12, y, 1.95);
    return <g key={y}>
      <Box x={0.04} y={y - 0.1} z={1.68} w={0.18} d={0.18} h={0.22} c={['#2a2a2c', '#1d1d1f', '#202022']} />
      {[-40, -20, 0, 20, 40, -55, 55].map((a, i) => <line key={i} x1={x0} y1={y0} x2={x0 + Math.sin(a * Math.PI / 180) * 46} y2={y0 - Math.cos(a * Math.PI / 180) * (40 + (i % 3) * 10)} stroke={i % 2 ? '#5f9a4a' : '#86b55a'} strokeWidth={5} strokeLinecap="round" />)}
    </g>;
  };
  return <g>
    {plant(1.2)}{plant(2.3)}
    <Box x={0.04} y={1.55} z={1.68} w={0.06} d={0.28} h={0.36} c={['#e6e1d6', '#d8d2c4', '#cbc4b4']} />
    <Box x={0.04} y={1.9} z={1.68} w={0.05} d={0.26} h={0.3} c={['#5a3d32', '#4a3229', '#3d2922']} />
    <Box x={0.04} y={0.95} z={1.68} w={0.14} d={0.18} h={0.12} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

// ---------- Dressing table wall ----------
function DressingTable() {
  return <g>
    <Box x={0.15} y={0} w={1.35} d={0.5} h={0.95} c={WHITE} />
    <FaceY y={0.5} x0={0.15} z1={0.95}>
      {[0, 1, 2, 3].map(i => <g key={i}>
        <rect x={4} y={4 + i * 23} width={34} height={20} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={21} cy={14 + i * 23} r={2.5} fill="#d6b24a" />
        <rect x={97} y={4 + i * 23} width={34} height={20} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={114} cy={14 + i * 23} r={2.5} fill="#d6b24a" />
      </g>)}
      <rect x={42} y={4} width={51} height={18} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={67} cy={13} r={2.5} fill="#d6b24a" />
      <rect x={44} y={26} width={47} height={70} fill="#4a4037" />
    </FaceY>
    <Box x={0.13} y={0} z={0.95} w={1.39} d={0.52} h={0.04} c={['#dfeef0', '#c9dadd', '#b9cbce']} />
  </g>;
}

function VanityMirror() {
  return <g>
    <Box x={0.3} y={0.02} z={0.99} w={1.05} d={0.1} h={0.8} c={WHITE} />
    <FaceY y={0.12} x0={0.34} z1={1.75}><rect x={0} y={0} width={97} height={72} fill="#d9e8ec" /><line x1={32} x2={32} y1={0} y2={72} stroke="#fff" strokeWidth={3} /><line x1={65} x2={65} y1={0} y2={72} stroke="#fff" strokeWidth={3} /></FaceY>
  </g>;
}

function MakeupBottles() {
  const b = [[0.95, '#c9a7d8', 0.26], [1.05, '#fbf8f2', 0.32], [1.13, '#e98a5a', 0.24], [1.22, '#fbf8f2', 0.2], [1.3, '#b7a7e0', 0.28], [0.45, '#f4b6c4', 0.22]];
  return <g>
    {b.map(([x, c, h], i) => <Box key={i} x={x} y={0.2 + (i % 2) * 0.1} z={0.99} w={0.07} d={0.07} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
    <Box x={0.55} y={0.3} z={0.99} w={0.12} d={0.12} h={0.3} c={['#f7c6d6', '#eab0c3', '#dc9fb3']} />
  </g>;
}

// Art easel leaning on the wall, with the jellyfish drawing on the board.
function ArtEasel() {
  return <FaceY y={0.18} x0={1.7} z1={3.1}>
    <line x1={36} x2={30} y1={0} y2={310} stroke="#c99560" strokeWidth={7} />
    <line x1={10} x2={0} y1={150} y2={310} stroke="#c99560" strokeWidth={5} /><line x1={62} x2={72} y1={150} y2={310} stroke="#c99560" strokeWidth={5} />
    <rect x={0} y={60} width={72} height={110} fill="#efd7ae" stroke="#c99560" strokeWidth={2} />
    <path d="M22,98 Q36,78 50,98 Z" fill="none" stroke="#5f7fd1" strokeWidth={2.5} />
    {[26, 32, 38, 44].map((x, i) => <path key={x} d={`M${x},98 q${i % 2 ? 4 : -4},14 0,28 q${i % 2 ? -4 : 4},10 0,20`} fill="none" stroke="#5f7fd1" strokeWidth={2} />)}
    {[[12, 76], [60, 84], [14, 150], [58, 140]].map(([x, y], i) => <path key={i} d={`M${x - 5},${y} L${x + 5},${y} M${x},${y - 5} L${x},${y + 5}`} stroke="#d9465f" strokeWidth={2} />)}
    <rect x={-4} y={170} width={80} height={8} fill="#b78450" />
  </FaceY>;
}

function YarnBag() {
  return <g>
    <Box x={1.75} y={0.2} w={0.4} d={0.3} h={0.38} c={['#f2d64a', '#e3c43a', '#d4b42e']} />
    <FloorPlane z={0.381} x={1.77} y={0.22}><circle cx={10} cy={12} r={9} fill="#f4b6c4" /><circle cx={26} cy={10} r={8} fill="#a9d8e6" /><circle cx={20} cy={22} r={7} fill="#f7e4d6" /></FloorPlane>
  </g>;
}

function Trainers() {
  return <g>
    <Box x={1.35} y={0.75} w={0.26} d={0.11} h={0.09} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    <Box x={1.4} y={0.92} w={0.26} d={0.11} h={0.09} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    <Box x={0.95} y={0.85} w={0.24} d={0.12} h={0.1} c={['#bfb2a2', '#ab9e8e', '#9b8e7e']} />
  </g>;
}

function OfficeChair() {
  const cx = 1.15, cy = 1.75, [bx, by] = P(cx, cy, 0.04), [sx, sy] = P(cx, cy, 0.48);
  return <g>
    {[0, 72, 144, 216, 288].map(a => { const r = 0.32, ex = cx + Math.cos(a * Math.PI / 180) * r, ey = cy + Math.sin(a * Math.PI / 180) * r, [x, y] = P(ex, ey, 0.04); return <g key={a}><line x1={bx} y1={by} x2={x} y2={y} stroke="#d6b24a" strokeWidth={5} /><circle cx={x} cy={y + 3} r={4} fill="#2a2a2c" /></g>; })}
    <line x1={bx} y1={by} x2={sx} y2={sy} stroke="#d6b24a" strokeWidth={6} />
    <Box x={cx - 0.27} y={cy - 0.27} z={0.48} w={0.54} d={0.54} h={0.12} c={['#2b5d8a', '#224c72', '#1c4062']} />
    <Box x={cx - 0.3} y={cy - 0.27} z={0.6} w={0.1} d={0.54} h={0.5} c={['#2b5d8a', '#224c72', '#1c4062']} />
  </g>;
}

function ClothesSofa() {
  const x0 = 0.45, yb = RY - 0.95;
  return <g>
    <Box x={x0} y={yb} w={2.1} d={0.95} h={0.42} c={TEAL} />
    <Box x={x0} y={RY - 0.28} w={2.1} d={0.28} h={0.9} c={TEAL} />
    <Box x={x0} y={yb} w={0.22} d={0.95} h={0.62} c={TEAL} />
    <Box x={x0 + 1.88} y={yb} w={0.22} d={0.95} h={0.62} c={TEAL} />
    {/* heap of clean washing */}
    {[[0.8, '#1f2125', 0.5, 0.12], [1.2, '#fbf8f2', 0.45, 0.1], [1.55, '#3d63c9', 0.3, 0.06], [1.75, '#e3c04f', 0.4, 0.08], [1.0, '#f4efe4', 0.5, 0.14], [1.9, '#fbf8f2', 0.35, 0.16]].map(([x, c, w, z], i) => <Box key={i} x={x} y={yb + 0.1 + (i % 3) * 0.15} z={0.42 + z} w={w} d={0.35} h={0.1} c={[c, c, c]} stroke="rgba(0,0,0,.12)" />)}
    <Box x={0.9} y={RY - 0.4} z={0.9} w={0.6} d={0.3} h={0.12} c={['#e7b2d4', '#d89cc3', '#c98bb3']} />
  </g>;
}

// Doorway → Middle section (wide opening in the near end; low stubs either side)
function MiddleDoorway() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <FloorPlane z={0.005} x={RX} y={MIDDLE.y0}><rect x={0} y={0} width={20} height={(MIDDLE.y1 - MIDDLE.y0) * 100} fill="#966238" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>
    <Box x={RX} y={0} w={0.2} d={MIDDLE.y0} h={h} c={c} />
    <Box x={RX} y={MIDDLE.y1} w={0.2} d={RY + 0.2 - MIDDLE.y1} h={h} c={c} />
  </g>;
}

const FrontWall = () => <Box x={0} y={RY} w={RX} d={0.2} h={0.55} c={['#fffaf0', '#ead8b8', '#e3d0ae']} />;

function BackRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={930} cy={400} zoom={1.4} label="Back room" defs={<clipPath id="bkfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <WindowLight />
    <Walls />
    <RomanBlindWindow />
    <SillPlants />
    <VanityMirror />
    <DressingTable />
    <MakeupBottles />
    <ArtEasel />
    <YarnBag />
    <Trainers />
    <OfficeChair />
    <ClothesSofa />
    <MiddleDoorway />
    <FrontWall />
    <Tag show={L} at={[RX + 0.1, (MIDDLE.y0 + MIDDLE.y1) / 2, 1.2]} text="Middle room" />
  </IsoStage>;
}
window.BackRoomScene = BackRoomScene;

window.BackRoomParts = { RX, RY, RH, WindowLight, RomanBlindWindow, SillPlants, VanityMirror, DressingTable, MakeupBottles, ArtEasel, YarnBag, Trainers, OfficeChair, ClothesSofa, FrontWall };
