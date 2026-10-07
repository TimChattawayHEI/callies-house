// Living room, main section. Static, no character. Exports window.LivingRoomScene.
// Seen from the bay doors (as in the photo from the middle room).
// Back-left wall (y = 0): fireplace + mirror, wooden sideboard, radiator cover. Back-right wall (x = 0): two sash windows, TV in the corner.
// Front wall (y = RY, cut low): blue L-sofa backs onto it, plant + lamp, door to the hallway, bookshelf.
// Near end (x = RX, cut low): bay doors to the middle section.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 7.5, RY = 5.5, RH = 4.2;
const BAY = { y0: 0.75, y1: 2.6 };    // near end → Middle section (bay doors)
const HALL = { x0: 4.85, x1: 5.8 };   // front wall → Downstairs hallway
const WOOD = ['#8f6c49', '#735537', '#62472d'];
const BLUE = ['#2f6f86', '#255a6d', '#1f4d5d'];
const GREEN = ['#3f6e6a', '#325956', '#2a4c49'];
const STONE = ['#efe9d8', '#e2dac5', '#d6cdb5'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 4; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#lvfloor)">{p}</g></FloorPlane>;
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

// ---------- Window wall ----------
function SashWindow({ y1 }) {
  return <g>
    <FaceX x={0.02} y1={y1} z1={3.5}>
      <rect x={-6} y={-6} width={122} height={232} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={110} height={220} fill="#cfe3d2" />
      {[1, 2].map(i => <line key={i} x1={i * 36.7} x2={i * 36.7} y1={0} y2={220} stroke="#fff" strokeWidth={4} />)}
      {[1, 2, 3].map(i => <line key={i} x1={0} x2={110} y1={i * 55} y2={i * 55} stroke="#fff" strokeWidth={4} />)}
      {/* roller blind most of the way down */}
      <rect x={-2} y={0} width={114} height={168} fill="#f4efe2" />
      {[1, 2].map(i => <line key={'b' + i} x1={i * 36.7} x2={i * 36.7} y1={10} y2={160} stroke="#e4dcc8" strokeWidth={5} />)}
      <line x1={0} x2={110} y1={60} y2={60} stroke="#e4dcc8" strokeWidth={5} />
      <rect x={-3} y={164} width={116} height={6} fill="#d8cfba" />
    </FaceX>
    <Box x={0} y={y1 - 1.16} z={1.3} w={0.2} d={1.22} h={0.06} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function WindowLight() {
  const pane = (y) => <polygon key={y} points={pts([[0.3, y, 0], [0.3, y + 1.1, 0], [2.2, y + 1.1, 0], [2.2, y, 0]])} fill="#fff6d8" opacity={.28} />;
  return <g>{pane(2.0)}{pane(3.95)}</g>;
}

function TVUnit() {
  return <g>
    <Box x={0.05} y={0.35} w={0.6} d={1.6} h={0.55} c={WOOD} />
    <FaceX x={0.65} y1={1.95} z1={0.55}><rect x={10} y={14} width={140} height={22} fill="#3e2e20" /><rect x={30} y={18} width={40} height={10} fill="#1d1d1f" /></FaceX>
    <Box x={0.28} y={0.95} z={0.55} w={0.18} d={0.4} h={0.05} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={0.32} y={0.42} z={0.62} w={0.06} d={1.46} h={0.88} c={['#2a2a2c', '#1d1d1f', '#121214']} />
  </g>;
}

function ToyBaskets() {
  return <g>
    <Box x={0.1} y={2.2} w={0.42} d={0.42} h={0.5} c={['#8e8e8c', '#7a7a78', '#6c6c6a']} />
    <Box x={0.12} y={2.24} z={0.5} w={0.38} d={0.32} h={0.22} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={0.12} y={2.72} w={0.45} d={0.42} h={0.55} c={['#cfc6b6', '#bdb3a2', '#ada392']} />
    <Box x={0.2} y={2.8} z={0.55} w={0.2} d={0.18} h={0.12} c={['#f4a7c4', '#e48bb0', '#d77aa0']} />
  </g>;
}

// ---------- Fireplace wall ----------
function ChimneyBreast() {
  return <Box x={1.6} y={0} w={2.0} d={0.45} h={RH} c={['#fffaf0', '#f5e8cf', '#e9d6b6']} />;
}

function Fireplace() {
  return <g>
    <FloorPlane z={0.005} x={1.75} y={0.45}><path d="M0,0 H170 V30 Q85,62 0,30 Z" fill="#e7e1d1" stroke="#cfc7b2" strokeWidth={2} /></FloorPlane>
    <FaceY y={0.46} x0={1.8} z1={1.45}>
      <rect x={0} y={10} width={160} height={135} fill="#ebe4d0" stroke="#d1c8b0" strokeWidth={2} />
      <path d="M30,145 V60 Q80,26 130,60 V145 Z" fill="#d9cfb8" />
      <path d="M40,145 V66 Q80,38 120,66 V145 Z" fill="#3d3530" />
      <rect x={50} y={110} width={30} height={35} fill="#c99a5c" stroke="#9c7442" strokeWidth={1.5} />
      {[0, 1, 2].map(i => <circle key={i} cx={58 + (i % 2) * 14} cy={118 + i * 9} r={4} fill="#5a2b24" />)}
      <circle cx={100} cy={100} r={13} fill="#ffffff" />{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx={100} cy={92} rx={4} ry={8} transform={`rotate(${a} 100 100)`} fill="#f7f7f2" stroke="#e4e4dc" strokeWidth={1} />)}
      <circle cx={100} cy={100} r={4} fill="#e9c34c" />
    </FaceY>
    <Box x={1.72} y={0.42} z={1.45} w={1.76} d={0.18} h={0.08} c={STONE} />
  </g>;
}

function RoundMirror() {
  return <FaceY y={0.46} x0={2.15} z1={3.05}>
    <circle cx={45} cy={45} r={45} fill="#7a5233" /><circle cx={45} cy={45} r={38} fill="#dbe9ee" />
    <path d="M22,30 Q40,14 62,22" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={.7} />
  </FaceY>;
}

function MantelOrnaments() {
  const z = 1.53;
  return <g>
    <Box x={1.85} y={0.47} z={z} w={0.14} d={0.1} h={0.3} c={['#f0e7d4', '#e2d6bd', '#d6c8ab']} />
    <Box x={2.08} y={0.47} z={z} w={0.16} d={0.1} h={0.14} c={['#e3c04f', '#c9a63f', '#b89536']} />
    {/* pink Stitch figure */}
    <Box x={2.35} y={0.47} z={z} w={0.16} d={0.1} h={0.2} c={['#f39ac6', '#e07fb2', '#d16fa3']} />
    <Box x={2.33} y={0.5} z={z + 0.2} w={0.2} d={0.04} h={0.08} c={['#f39ac6', '#e07fb2', '#d16fa3']} />
    <Box x={3.0} y={0.47} z={z} w={0.12} d={0.1} h={0.14} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={3.2} y={0.47} z={z} w={0.08} d={0.08} h={0.26} c={['#6b6f74', '#55595e', '#484c50']} />
    <FaceY y={0.6} x0={3.12} z1={z + 0.55}>{[[6, 6, '#e85a7a'], [16, 2, '#f2b632'], [10, 14, '#7a4fd1'], [22, 12, '#3fb6c9']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r={6} fill={c} />)}</FaceY>
  </g>;
}

function Sideboard() {
  return <g>
    <Box x={4.05} y={0} w={1.5} d={0.48} h={0.95} c={WOOD} />
    <FaceY y={0.48} x0={4.05} z1={0.95}>
      <rect x={3} y={4} width={44} height={80} fill="none" stroke="#5a412a" strokeWidth={1.5} /><circle cx={40} cy={40} r={3} fill="#1d1d1f" />
      <rect x={103} y={4} width={44} height={80} fill="none" stroke="#5a412a" strokeWidth={1.5} /><circle cx={110} cy={40} r={3} fill="#1d1d1f" />
      {[0, 1, 2].map(i => <g key={i}><rect x={50} y={4 + i * 27} width={50} height={25} fill="none" stroke="#5a412a" strokeWidth={1.5} /><rect x={68} y={14 + i * 27} width={14} height={4} fill="#1d1d1f" /></g>)}
      <line x1={4} x2={4} y1={84} y2={95} stroke="#1d1d1f" strokeWidth={3} /><line x1={146} x2={146} y1={84} y2={95} stroke="#1d1d1f" strokeWidth={3} />
    </FaceY>
  </g>;
}

function TableLamp() {
  const [bx, by] = P(4.3, 0.22, 0.95), [tx, ty] = P(4.3, 0.22, 1.25);
  return <g>
    <path d={`M${bx - 12},${by} L${tx},${ty} L${bx + 12},${by} M${bx - 12},${by} L${bx},${ty + 8} L${bx + 12},${by}`} fill="none" stroke="#c9a54a" strokeWidth={2} />
    <Box x={4.12} y={0.06} z={1.25} w={0.34} d={0.32} h={0.32} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <ellipse cx={P(4.29, 0.22, 1.57)[0]} cy={P(4.29, 0.22, 1.57)[1]} rx={18} ry={8} fill="#ffe7a8" opacity={.9} />
  </g>;
}

function RecordPlayer() {
  return <g>
    <Box x={4.55} y={0.1} z={0.95} w={0.45} d={0.32} h={0.08} c={['#c99a5c', '#a87e48', '#93703f']} />
    <FloorPlane z={1.031} x={4.6} y={0.13}><circle cx={16} cy={13} r={11} fill="#1d1d1f" /><circle cx={16} cy={13} r={3} fill="#e85a7a" /></FloorPlane>
  </g>;
}

function DrinksBottles() {
  const b = [[5.1, '#9fd3b5', 0.32], [5.2, '#e3c04f', 0.36], [5.3, '#2a2a2c', 0.3], [5.4, '#e8eef0', 0.34], [5.45, '#3f9a52', 0.22]];
  return <g>{b.map(([x, c, h], i) => <Box key={i} x={x} y={0.12 + (i % 2) * 0.12} z={0.95} w={0.07} d={0.07} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.2)" />)}</g>;
}

function RadiatorCover() {
  return <g>
    <Box x={5.95} y={0} w={1.3} d={0.3} h={1.0} c={WHITE} />
    <FaceY y={0.3} x0={5.95} z1={1.0}>
      {[0, 1].map(i => <g key={i}><rect x={10 + i * 60} y={18} width={50} height={70} rx={10} fill="#ebe6dc" stroke="#d6cfc2" strokeWidth={2} />
        {Array.from({ length: 20 }, (_, k) => <circle key={k} cx={18 + i * 60 + (k % 4) * 11} cy={28 + Math.floor(k / 4) * 12} r={3} fill="#cfc7b8" />)}</g>)}
    </FaceY>
    <Box x={5.9} y={0} z={1.0} w={1.4} d={0.36} h={0.06} c={WHITE} />
    <Box x={6.0} y={0.06} z={1.06} w={0.2} d={0.2} h={0.18} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={6.95} y={0.06} z={1.06} w={0.18} d={0.18} h={0.16} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

function StarMapPoster() {
  return <FaceY y={0.02} x0={6.05} z1={2.25}>
    <rect x={0} y={0} width={70} height={95} fill="#1f2230" stroke="#111" strokeWidth={3} />
    <circle cx={35} cy={40} r={26} fill="none" stroke="#cfd6e6" strokeWidth={1.5} />
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={35 + Math.cos(i * 2.3) * (6 + (i * 7) % 18)} cy={40 + Math.sin(i * 2.3) * (6 + (i * 5) % 18)} r={1.2} fill="#fff" />)}
  </FaceY>;
}

// ---------- Middle of the room ----------
function CoffeeTable() {
  return <g>
    <Box x={2.9} y={2.3} w={1.3} d={1.05} h={0.55} c={['#a8865a', '#8c6d47', '#7a5e3c']} />
    <FaceY y={3.35} x0={2.9} z1={0.55}>{[0, 1].map(i => <g key={i}><rect x={8} y={8 + i * 23} width={114} height={19} fill="none" stroke="#5f4730" strokeWidth={1.5} /><path d={`M58,${14 + i * 23} q7,8 14,0`} fill="none" stroke="#3a2a1c" strokeWidth={2.5} /></g>)}</FaceY>
  </g>;
}

function TableClutter() {
  return <g>
    <Box x={3.45} y={2.45} z={0.55} w={0.5} d={0.38} h={0.03} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={3.1} y={2.9} z={0.55} w={0.09} d={0.09} h={0.3} c={['#ff3f7f', '#e0306b', '#c9285e']} />
    <FloorPlane z={0.551} x={2.98} y={2.4}><rect x={0} y={0} width={30} height={22} fill="#fbf9f4" transform="rotate(-12)" /><circle cx={36} cy={60} r={8} fill="#d94f8a" /></FloorPlane>
  </g>;
}

function FloorCushion() {
  return <FloorPlane z={0.01} x={3.8} y={1.4}><rect x={0} y={0} width={45} height={40} rx={10} fill="#d49a2f" stroke="#b07c22" strokeWidth={2} transform="rotate(15 22 20)" /></FloorPlane>;
}

function Cushion({ x, y, z, c, w = 0.35 }) { return <Box x={x} y={y} z={z} w={w} d={0.14} h={0.32} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />; }

function BlueLSofa() {
  const yb = RY - 1.0;
  return <g>
    {/* chaise end, under the window */}
    <Box x={1.0} y={yb - 1.15} w={1.0} d={1.2} h={0.42} c={BLUE} />
    <Box x={1.0} y={yb} w={4.0} d={1.0} h={0.42} c={BLUE} />
    <Box x={1.0} y={yb - 1.15} w={0.22} d={2.15} h={0.68} c={BLUE} />
    <Box x={1.0} y={RY - 0.3} w={4.0} d={0.3} h={0.95} c={BLUE} />
    <Box x={4.78} y={yb} w={0.22} d={1.0} h={0.66} c={BLUE} />
    {[1.25, 2.55, 3.65].map((x, i) => <Box key={i} x={x} y={yb + 0.05} z={0.42} w={i ? 1.08 : 1.25} d={0.65} h={0.1} c={['#3a7f97', '#2c687c', '#24596b']} />)}
    <Box x={1.22} y={yb - 1.1} z={0.42} w={0.75} d={1.1} h={0.1} c={['#3a7f97', '#2c687c', '#24596b']} />
    <Cushion x={1.5} y={yb + 0.55} z={0.52} c="#f1ead9" />
    <Cushion x={2.6} y={yb + 0.55} z={0.52} c="#d49a2f" w={0.3} />
    <Cushion x={3.0} y={yb + 0.55} z={0.52} c="#f1ead9" />
    <Cushion x={4.2} y={yb + 0.55} z={0.52} c="#2c687c" />
  </g>;
}

function GreenSofa() {
  const x0 = 5.7, y0 = 2.7;
  return <g>
    <Box x={x0} y={y0} w={0.95} d={2.0} h={0.42} c={GREEN} />
    <Box x={x0 + 0.68} y={y0} w={0.27} d={2.0} h={0.95} c={GREEN} />
    <Box x={x0} y={y0} w={0.95} d={0.22} h={0.66} c={GREEN} />
    <Box x={x0} y={y0 + 1.78} w={0.95} d={0.22} h={0.66} c={GREEN} />
    <Box x={x0 + 0.05} y={y0 + 0.24} z={0.42} w={0.62} d={1.52} h={0.1} c={['#4b7d78', '#3b6763', '#335a56']} />
    <Box x={x0 + 0.1} y={y0 + 0.6} z={0.52} w={0.5} d={0.6} h={0.12} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
  </g>;
}

function FloorLampAndPlant() {
  const [x, y] = P(0.45, RY - 0.45, 0), [, ty] = P(0.45, RY - 0.45, 1.6);
  return <g>
    <line x1={x - 14} y1={y} x2={x} y2={ty} stroke="#2a2a2c" strokeWidth={4} /><line x1={x + 14} y1={y} x2={x} y2={ty} stroke="#2a2a2c" strokeWidth={4} />
    <Box x={0.25} y={RY - 0.65} z={1.6} w={0.4} d={0.4} h={0.38} c={['#fbf7ef', '#f0eadc', '#e3dccb']} />
    <Box x={0.75} y={RY - 0.55} w={0.4} d={0.4} h={0.3} c={['#c7b28c', '#b09a74', '#9c8762']} />
    {Array.from({ length: 9 }, (_, i) => { const [px, py] = P(0.95, RY - 0.35, 1.2 + (i % 4) * 0.45); return <ellipse key={i} cx={px + (i % 2 ? 22 : -22)} cy={py} rx={20} ry={7} transform={`rotate(${i % 2 ? 25 : -25} ${px + (i % 2 ? 22 : -22)} ${py})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />; })}
    <line x1={P(0.95, RY - 0.35, 0.3)[0]} y1={P(0.95, RY - 0.35, 0.3)[1]} x2={P(0.95, RY - 0.35, 2.7)[0]} y2={P(0.95, RY - 0.35, 2.7)[1]} stroke="#7a5a38" strokeWidth={4} />
  </g>;
}

function BookTower() {
  const x0 = 6.1, y0 = RY - 0.55, books = ['#c2306a', '#2a2a2c', '#3f6e9a', '#e8b07e', '#f39ac6', '#3f8a6b'];
  return <g>
    {[0.0, 0.5, 1.0, 1.5, 2.0].map((z, i) => <g key={i}>
      <Box x={x0} y={y0} z={z} w={0.5} d={0.5} h={0.04} c={['#7a5a3a', '#5f452c', '#523b25']} />
      {i < 4 && books.slice(0, 5).map((c, k) => <Box key={k} x={x0 + 0.04 + k * 0.08} y={y0 + 0.1} z={z + 0.04} w={0.07} d={0.3} h={0.3 + (k % 2) * 0.06} c={[books[(k + i) % 6], books[(k + i) % 6], books[(k + i) % 6]]} stroke="rgba(0,0,0,.2)" />)}
    </g>)}
    {[[x0, y0], [x0 + 0.48, y0 + 0.48]].map(([x, y], i) => <line key={i} x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, 2.05)[0]} y2={P(x, y, 2.05)[1]} stroke="#c9a54a" strokeWidth={3} />)}
  </g>;
}

function RowingMachine() {
  return <g>
    <Box x={6.75} y={RY - 0.5} w={0.7} d={0.32} h={0.08} c={['#e2c48f', '#cdae78', '#b99a66']} />
    <Box x={6.95} y={RY - 0.48} z={0.08} w={0.28} d={0.28} h={0.12} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

// Doorway → Middle section (bay doors, gap in the near end wall)
function BayDoorway() {
  return <FloorPlane z={0.005} x={RX} y={BAY.y0}><rect x={0} y={0} width={20} height={(BAY.y1 - BAY.y0) * 100} fill="#c49a64" stroke="#8d5a2e" strokeWidth={1.5} /></FloorPlane>;
}

// Doorway → Downstairs hallway (gap in the front wall)
function HallDoorway() {
  return <FloorPlane z={0.005} x={HALL.x0} y={RY}><rect x={0} y={0} width={(HALL.x1 - HALL.x0) * 100} height={20} fill="#966238" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={HALL.x0} d={0.2} h={h} c={c} />
    <Box x={HALL.x1} y={RY} w={RX - HALL.x1} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={BAY.y0} h={h} c={c} />
    <Box x={RX} y={BAY.y1} w={0.2} d={RY + 0.2 - BAY.y1} h={h} c={c} />
  </g>;
}

function LivingRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1000} cy={590} zoom={0.98} label="Living room" defs={<clipPath id="lvfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <WindowLight />
    <Walls />
    <SashWindow y1={3.1} />
    <SashWindow y1={5.05} />
    <StarMapPoster />
    <ChimneyBreast />
    <RoundMirror />
    <Fireplace />
    <MantelOrnaments />
    <TVUnit />
    <ToyBaskets />
    <Sideboard />
    <TableLamp />
    <RecordPlayer />
    <DrinksBottles />
    <RadiatorCover />
    <BayDoorway />
    <HallDoorway />
    <FloorCushion />
    <CoffeeTable />
    <TableClutter />
    <GreenSofa />
    <BlueLSofa />
    <FloorLampAndPlant />
    <BookTower />
    <RowingMachine />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (BAY.y0 + BAY.y1) / 2, 1.2]} text="Middle room" />
    <Tag show={L} at={[(HALL.x0 + HALL.x1) / 2, RY + 0.1, 1.2]} text="Hallway" />
  </IsoStage>;
}
window.LivingRoomScene = LivingRoomScene;
