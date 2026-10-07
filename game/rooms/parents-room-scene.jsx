// Parents' room. Static, no character. Exports window.ParentsRoomScene.
// Back-left wall (x = 0): fitted cream wardrobes + dressing table.
// Back-right wall (y = 0): alcove shelves, arched louvre doorway to the shower room, door to the hallway.
// Front walls are cut away: the two windows are on the front-left wall (y = RY); the bed's headboard is on the front-right wall (x = RX).
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, OAK, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, archPath, PanelDoorArt, Tag, IsoStage } = window.Iso;

const RX = 8, RY = 7, RH = 4.2;
const CREAM = ['#f7f0e2', '#ede3d0', '#e2d6bf'];
const AD = 1.65; // alcove + chest shift along the back wall (shower room now takes the top corner)
const ALCOVE = { x0: 1.3 + AD, x1: 2.55 + AD, z0: 1.45, spring: 3.05, depth: 0.5 };
const ARCH = { x0: 0.7, x1: 1.8, spring: 2.6 };   // doorway → shower room (top corner)
const ENTRY = { x0: 5.6, x1: 6.55 };              // doorway → hallway
const EN = { x0: 0, x1: 2.6, y0: -1.6 };           // shower room footprint, in the top corner behind the back wall

// ---------- Shell ----------
function Floor() {
  const planks = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    planks.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 4; k++) planks.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    planks.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#pfloorclip)">{planks}</g></FloorPlane>;
}

// Sunlight from the two sash windows on the cut-away front wall.
function WindowLight() {
  const pane = (x) => <g key={x}>
    <rect x={x} y={0} width={95} height={150} fill="#fff3cf" opacity={.42} />
    <line x1={x + 47} x2={x + 47} y1={0} y2={150} stroke="#c99560" strokeWidth={5} opacity={.35} />
    {[50, 100].map(y => <line key={y} x1={x} x2={x + 95} y1={y} y2={y} stroke="#c99560" strokeWidth={5} opacity={.35} />)}
  </g>;
  return <FloorPlane z={0.012} x={1.5} y={5.3}>{pane(0)}{pane(125)}</FloorPlane>;
}

function Walls() {
  const holes = archPath(RH, ARCH.x0, ARCH.x1, 0, ARCH.spring) + ' ' + archPath(RH, ALCOVE.x0, ALCOVE.x1, ALCOVE.z0, ALCOVE.spring);
  return <g>
    <BackWallY RX={RX} RH={RH} holes={holes} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={ARCH.x0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={ARCH.x1} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Shower room (drawn behind the back wall, seen through the arch) ----------
function EnsuiteRoom() {
  const tiles = [];
  for (let i = 1; i < 9; i++) tiles.push(<line key={'v' + i} x1={i * 30} x2={i * 30} y1={0} y2={260} stroke="#d8dedc" strokeWidth={1.5} />);
  for (let j = 1; j < 9; j++) tiles.push(<line key={'h' + j} x1={0} x2={260} y1={j * 30} y2={j * 30} stroke="#d8dedc" strokeWidth={1.5} />);
  const floor = [];
  for (let i = 1; i < 7; i++) floor.push(<line key={'f' + i} x1={i * 40} x2={i * 40} y1={0} y2={160} stroke="#b9c1c3" strokeWidth={1.5} />);
  for (let j = 1; j < 4; j++) floor.push(<line key={'g' + j} x1={0} x2={260} y1={j * 40} y2={j * 40} stroke="#b9c1c3" strokeWidth={1.5} />);
  return <g>
    <Plane o={[EN.x0, EN.y0, 2.6]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={260} height={260} fill="#f1f3f1" />{tiles}</Plane>
    <Plane o={[0, 0, 2.6]} u={[0, -1, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={160} height={260} fill="#e4e8e6" /></Plane>
    <FloorPlane x={EN.x0} y={EN.y0}><rect x={0} y={0} width={260} height={160} fill="#c9d0d2" />{floor}</FloorPlane>
  </g>;
}
function EnsuiteSink() {
  return <g>
    <Box x={1.75} y={-1.55} w={0.25} d={0.25} h={1.0} c={WHITE} />
    <Box x={1.55} y={-1.6} z={1.0} w={0.7} d={0.55} h={0.22} c={['#ffffff', '#eef1f1', '#dfe4e4']} />
    <FloorPlane z={1.221} x={1.63} y={-1.52}><ellipse cx={27} cy={22} rx={22} ry={15} fill="#d5dfe2" /></FloorPlane>
    <Box x={1.85} y={-1.58} z={1.22} w={0.08} d={0.1} h={0.14} c={['#e6eaec', '#c9cfd2', '#b5bcc0']} />
  </g>;
}
function EnsuiteShower() {
  const x0 = 0, x1 = 1.35, y0 = EN.y0, yF = -0.55, top = 2.5;
  const glass = { fill: '#d4ecf0', fillOpacity: 0.45, stroke: '#a9c4c9', strokeWidth: 2 };
  return <g>
    <Box x={x0} y={y0} w={x1 - x0} d={yF - y0} h={0.12} c={WHITE} />
    <FloorPlane z={0.121} x={x0} y={y0}><circle cx={68} cy={52} r={6} fill="#b5bcc0" /></FloorPlane>
    <line x1={P(0.7, y0 + 0.02, 1.0)[0]} y1={P(0.7, y0 + 0.02, 1.0)[1]} x2={P(0.7, y0 + 0.02, 2.2)[0]} y2={P(0.7, y0 + 0.02, 2.2)[1]} stroke="#b5bcc0" strokeWidth={3} />
    <polygon points={pts([[x1, y0, 0.12], [x1, yF, 0.12], [x1, yF, top], [x1, y0, top]])} {...glass} />
    <polygon points={pts([[x0, yF, 0.12], [x1, yF, 0.12], [x1, yF, top], [x0, yF, top]])} {...glass} />
    <line x1={P(1.0, yF, 1.0)[0]} y1={P(1.0, yF, 1.0)[1]} x2={P(1.0, yF, 1.6)[0]} y2={P(1.0, yF, 1.6)[1]} stroke="#9fb0b5" strokeWidth={3} />
  </g>;
}
const BathMat = () => <FloorPlane z={0.01} x={1.6} y={-0.48}><rect x={0} y={0} width={80} height={28} rx={4} fill="#b9b4ae" /></FloorPlane>;
const ArchJamb = () => <polygon points={pts([[ARCH.x0, 0, 0], [ARCH.x0, -0.2, 0], [ARCH.x0, -0.2, ARCH.spring], [ARCH.x0, 0, ARCH.spring]])} fill="#e9d6b6" />;

// ---------- Alcove shelves (recess in the back wall) ----------
function AlcoveShelves() {
  const { x0, x1, z0, depth } = ALCOVE, yb = -depth;
  const dark = ['#3a3a3c', '#2a2a2c', '#202022'];
  return <g>
    <polygon points={pts([[0.8 + AD, yb, 0.95], [2.6 + AD, yb, 0.95], [2.6 + AD, yb, 3.2], [0.8 + AD, yb, 3.2]])} fill="#efdfc2" />
    <polygon points={pts([[x0, 0, z0], [x0, yb, z0], [x0, yb, 3.8], [x0, 0, 3.8]])} fill="#e3cfac" />
    <FloorPlane z={z0} x={0.8 + AD} y={yb}><rect x={0} y={0} width={180} height={50} fill="#f6f0e4" /></FloorPlane>
    {/* on the ledge: wire baskets + a beige bag */}
    <Box x={1.4 + AD} y={-0.42} z={z0} w={0.42} d={0.3} h={0.24} c={['#c9cccc', '#b5b9b9', '#a5aaaa']} />
    <Box x={1.9 + AD} y={-0.4} z={z0} w={0.5} d={0.28} h={0.2} c={['#e2d6c8', '#d3c5b4', '#c4b5a3']} />
    {/* lower glass shelf: patterned box, black box, perfume */}
    <FloorPlane z={2.05} x={x0} y={yb}><rect x={0} y={0} width={125} height={45} fill="#cfe3e6" opacity={.6} /></FloorPlane>
    <Box x={1.35 + AD} y={-0.42} z={2.05} w={0.3} d={0.25} h={0.17} c={dark} />
    <Box x={1.72 + AD} y={-0.45} z={2.05} w={0.55} d={0.32} h={0.3} c={['#e98a5a', '#3f8f9a', '#e2c04f']} />
    <Box x={2.32 + AD} y={-0.3} z={2.05} w={0.07} d={0.07} h={0.16} c={['#5b5f66', '#41454b', '#33363b']} />
    {/* upper glass shelf: handbags */}
    <FloorPlane z={2.7} x={x0} y={yb}><rect x={0} y={0} width={125} height={45} fill="#cfe3e6" opacity={.6} /></FloorPlane>
    <Box x={1.35 + AD} y={-0.44} z={2.7} w={0.42} d={0.24} h={0.32} c={dark} />
    <Box x={1.82 + AD} y={-0.42} z={2.7} w={0.45} d={0.22} h={0.28} c={['#8f9290', '#7b7e7c', '#6b6e6c']} />
    <Box x={1.6 + AD} y={-0.4} z={3.02} w={0.4} d={0.2} h={0.2} c={['#e6cdb0', '#d8bc9c', '#c9ab8a']} />
  </g>;
}
const AlcoveLedge = () => <Box x={ALCOVE.x0 - 0.05} y={0} z={ALCOVE.z0 - 0.07} w={ALCOVE.x1 - ALCOVE.x0 + 0.1} d={0.12} h={0.08} c={WHITE} />;

// ---------- Doorways ----------
// Doorway → Hallway (back-right wall)
function EntryDoor() {
  return <FaceY y={0.02} x0={ENTRY.x0} z1={3.3}><PanelDoorArt hinge="right" /></FaceY>;
}

// Doorway → Shower room (shower + sink). Arched opening; the little louvred wooden door is folded back flat against the wall, towel over the top.
function LouvreDoor() {
  const slats = [];
  for (let y = 100; y < 222; y += 8) slats.push(<line key={y} x1={10} x2={83} y1={y} y2={y} stroke="#ddd2bf" strokeWidth={3} />);
  return <FaceY y={0.03} x0={ARCH.x1 + 0.04} z1={2.3}>
    <rect x={0} y={0} width={93} height={230} fill="#f6f1e6" stroke="#d6cab3" strokeWidth={1.5} />
    <rect x={8} y={92} width={77} height={132} fill="none" stroke="#e2d8c6" strokeWidth={2} />
    {slats}
    <rect x={89} y={60} width={5} height={16} fill="#c9a54a" /><rect x={89} y={170} width={5} height={16} fill="#c9a54a" />
    <path d="M-3,-4 H96 V86 Q48,92 -3,86 Z" fill="#8a807b" />
    <rect x={-3} y={62} width={99} height={9} fill="#776e69" />
  </FaceY>;
}

// ---------- Furniture ----------
function Wardrobe({ y0, y1, h = 3.7 }) {
  const len = (y1 - y0) * 100, half = len / 2;
  return <g>
    <Box x={0} y={y0} w={1.1} d={y1 - y0} h={h} c={CREAM} />
    <FaceX x={1.1} y1={y1} z1={h}>
      {[0, half].map(a => <g key={a}>
        <rect x={a + 10} y={14} width={half - 20} height={176} fill="none" stroke="#dccfb6" strokeWidth={3} />
        <rect x={a + 10} y={208} width={half - 20} height={140} fill="none" stroke="#dccfb6" strokeWidth={3} />
      </g>)}
      <line x1={half} x2={half} y1={0} y2={h * 100} stroke="#d6c8ad" strokeWidth={2} />
      <circle cx={half - 10} cy={196} r={5} fill="#efe6d4" stroke="#cbbd9f" strokeWidth={1.5} />
      <circle cx={half + 10} cy={196} r={5} fill="#efe6d4" stroke="#cbbd9f" strokeWidth={1.5} />
    </FaceX>
  </g>;
}

function DressingTable() {
  const y0 = 3.6, y1 = 5.2;
  return <g>
    {/* mirror + double socket on the wall */}
    <FaceX x={0.02} y1={4.95} z1={2.45}>
      <rect x={0} y={0} width={110} height={95} fill="#cfdfe4" stroke="#e6ddc9" strokeWidth={4} />
      <rect x={70} y={10} width={30} height={60} fill="#fbf8f2" opacity={.7} />
      <rect x={18} y={8} width={14} height={84} fill="#4a4f5a" opacity={.55} />
      <rect x={85} y={110} width={24} height={13} fill="#fbf8f2" stroke="#cbbd9f" strokeWidth={1} />
    </FaceX>
    <Box x={0} y={3.65} z={0.85} w={0.75} d={0.7} h={0.25} c={CREAM} />
    <FaceX x={0.75} y1={4.35} z1={1.1}><circle cx={35} cy={12} r={4} fill="#efe6d4" stroke="#cbbd9f" strokeWidth={1.5} /></FaceX>
    <Box x={0} y={y0 + 0.05} z={1.1} w={0.8} d={y1 - y0 - 0.1} h={0.08} c={CREAM} />
    {/* overhead cupboards */}
    <Box x={0} y={y0} z={2.6} w={1.1} d={y1 - y0} h={1.1} c={CREAM} />
    <FaceX x={1.1} y1={y1} z1={3.7}>
      <rect x={10} y={12} width={60} height={84} fill="none" stroke="#dccfb6" strokeWidth={3} />
      <rect x={90} y={12} width={60} height={84} fill="none" stroke="#dccfb6" strokeWidth={3} />
      <line x1={80} x2={80} y1={0} y2={110} stroke="#d6c8ad" strokeWidth={2} />
      <circle cx={70} cy={100} r={4.5} fill="#efe6d4" stroke="#cbbd9f" strokeWidth={1.5} />
      <circle cx={90} cy={100} r={4.5} fill="#efe6d4" stroke="#cbbd9f" strokeWidth={1.5} />
    </FaceX>
  </g>;
}

function Cornice() {
  return <g>
    <Box x={0} y={1.8} z={3.7} w={1.2} d={RY - 1.8} h={0.22} c={CREAM} />
    <FaceX x={1.2} y1={RY} z1={3.86}>{Array.from({ length: 52 }, (_, i) => <rect key={i} x={i * 10 + 2} y={0} width={5} height={6} fill="#dccfb6" />)}</FaceX>
  </g>;
}

function FittedWardrobes() {
  return <g>
    <Wardrobe y0={1.8} y1={3.6} />
    <DressingTable />
    <Wardrobe y0={5.2} y1={RY} />
    <Cornice />
  </g>;
}

function ChestOfDrawers() {
  return <g>
    <Box x={1.35 + AD} y={0.05} w={1.2} d={0.8} h={1.25} c={WHITE} />
    <FaceY y={0.85} x0={1.35 + AD} z1={1.25}>
      {[0, 1, 2].map(i => <g key={i}><rect x={6} y={6 + i * 39} width={108} height={35} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={2} /><rect x={48} y={20 + i * 39} width={24} height={4} rx={2} fill="#c9ccd0" /></g>)}
    </FaceY>
    {/* laundry pile + spray bottle on top */}
    <FloorPlane z={1.26} x={1.4 + AD} y={0.1}>
      <ellipse cx={40} cy={35} rx={36} ry={26} fill="#f1ece4" />
      <ellipse cx={78} cy={40} rx={30} ry={24} fill="#e6e0d6" />
      <ellipse cx={58} cy={28} rx={22} ry={14} fill="#fbf8f2" />
    </FloorPlane>
    <g transform={`translate(${P(2.35 + AD, 0.65, 1.26)[0]} ${P(2.35 + AD, 0.65, 1.26)[1]})`}>
      <rect x={-9} y={-36} width={18} height={36} rx={5} fill="#5aa7e0" />
      <rect x={-6} y={-46} width={12} height={10} rx={2} fill="#f2f2ee" />
    </g>
  </g>;
}

function StandFan() {
  const [bx, by] = P(6.6, 1.3, 0), [hx, hy] = P(6.6, 1.3, 2.25);
  return <g>
    <FloorPlane z={0.01} x={6.35} y={1.05}><ellipse cx={25} cy={25} rx={24} ry={24} fill="#2c2d30" /></FloorPlane>
    <line x1={bx} y1={by} x2={hx} y2={hy} stroke="#3a3b3f" strokeWidth={6} />
    <circle cx={hx} cy={hy} r={38} fill="#2a2b2e" opacity={.85} />
    <circle cx={hx} cy={hy} r={30} fill="none" stroke="#55575d" strokeWidth={2} />
    <circle cx={hx} cy={hy} r={19} fill="none" stroke="#55575d" strokeWidth={2} />
    <circle cx={hx} cy={hy} r={8} fill="#1d1e20" />
  </g>;
}

function DoubleBed() {
  const x0 = 4.0, x1 = 7.8, y0 = 3.6, y1 = 6.6;
  return <g>
    <Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.7} c={OAK} />
    <FaceY y={y1} x0={x0} z1={0.7}>
      {[0, 1].map(i => <g key={i}><rect x={20 + i * 180} y={22} width={150} height={40} fill="none" stroke="#b78f59" strokeWidth={2} /><rect x={85 + i * 180} y={38} width={20} height={5} rx={2} fill="#c9ccd0" /></g>)}
    </FaceY>
    <Box x={x0 + 0.05} y={y0 + 0.05} z={0.7} w={x1 - x0 - 0.05} d={y1 - y0 - 0.1} h={0.3} c={['#f3efe6', '#e5dfd2', '#d8d1c2']} />
    {/* pillows: one white, one striped */}
    <FloorPlane z={1.0} x={7.05} y={3.75}><rect x={0} y={4} width={64} height={125} rx={24} fill="#d9d1c2" /><rect x={0} y={144} width={64} height={125} rx={24} fill="#d9d1c2" /></FloorPlane>
    <FloorPlane z={1.14} x={7.05} y={3.75}>
      <rect x={0} y={0} width={64} height={125} rx={24} fill="#fbf7ef" stroke="#e5dccb" strokeWidth={2} />
      <rect x={0} y={140} width={64} height={125} rx={24} fill="url(#duvTop)" stroke="#c9cfc6" strokeWidth={2} />
    </FloorPlane>
    {/* striped duvet hanging over the side */}
    <Box x={3.95} y={3.55} z={0.5} w={3.0} d={3.1} h={0.68} c={['url(#duvTop)', 'url(#duvSide)', 'url(#duvSide)']} stroke="rgba(70,80,70,.25)" />
    <FloorPlane z={1.181} x={3.95} y={3.55}>
      <path d="M30,60 C90,40 150,90 230,55 M20,170 C100,140 180,200 280,160 M60,250 C120,230 200,270 270,240" fill="none" stroke="#fdfcf8" strokeWidth={9} strokeLinecap="round" opacity={.55} />
    </FloorPlane>
    {/* headboard (against the cut-away front-right wall) */}
    <Box x={x1} y={y0 - 0.1} w={0.2} d={y1 - y0 + 0.2} h={1.75} c={OAK} />
  </g>;
}


const DEFS = <>
  <clipPath id="pfloorclip"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>
  <pattern id="duvTop" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="22" height="22" fill="#f4f2ec" /><rect width="22" height="9" fill="#a3ab9f" /></pattern>
  <pattern id="duvSide" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="22" height="22" fill="#e3e0d8" /><rect width="22" height="9" fill="#8d968a" /></pattern>
</>;

function ParentsRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={960} cy={600} zoom={0.92} label="Parents room" defs={DEFS}>
    <EnsuiteRoom />
    <EnsuiteSink />
    <EnsuiteShower />
    <BathMat />
    <ArchJamb />
    <AlcoveShelves />
    <Slab RX={RX} RY={RY} />
    <Floor />
    <WindowLight />
    <Walls />
    <EntryDoor />
    <LouvreDoor />
    <AlcoveLedge />
    <ChestOfDrawers />
    <FittedWardrobes />
    <StandFan />
    <DoubleBed />
    <Tag show={L} at={[(ENTRY.x0 + ENTRY.x1) / 2, 0, 4.65]} text="Hallway" />
    <Tag show={L} at={[(ARCH.x0 + ARCH.x1) / 2, 0, 4.65]} text="Shower room" />
  </IsoStage>;
}
window.ParentsRoomScene = ParentsRoomScene;
