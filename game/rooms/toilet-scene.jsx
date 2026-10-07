// Downstairs toilet. Static, no character. Exports window.ToiletScene.
// Long narrow room along x. End wall (x = 0): toilet. Back-left wall (y = 0): basin + towel.
// Front wall (y = RY, cut low) has the window (light on the floor). Near end (x = RX, cut low): door to the hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 3.2, RY = 1.5, RH = 4.2, TILE_TOP = 1.65;
const HALL = { y0: 0.3, y1: 1.25 };   // → Downstairs hallway
const PORC = ['#ffffff', '#eef1f1', '#dfe4e4'];

function PlankTileFloor() {
  const out = [];
  for (let r = 0; r < RY * 100 / 30; r++) {
    out.push(<rect key={'r' + r} x={0} y={r * 30} width={RX * 100} height={30} fill={r % 2 ? '#c9cbc8' : '#c2c4c1'} />);
    for (let k = 0; k < 6; k++) { const x = ((r % 2) * 50 + k * 100) % (RX * 100); out.push(<line key={r + '-' + k} x1={x} x2={x} y1={r * 30} y2={r * 30 + 30} stroke="#8e918f" strokeWidth={1.5} />); }
    out.push(<line key={'l' + r} x1={0} x2={RX * 100} y1={r * 30} y2={r * 30} stroke="#8e918f" strokeWidth={1.5} />);
  }
  return <FloorPlane><g clipPath="url(#wcfloor)">{out}</g></FloorPlane>;
}

// Grey wall tiles with the leaf border, on one back wall.
function WallTiles({ along }) {
  const len = (along === 'y' ? RY : RX) * 100, h = TILE_TOP * 100, out = [];
  for (let i = 1; i < len / 26; i++) out.push(<line key={'v' + i} x1={i * 26} x2={i * 26} y1={22} y2={h} stroke="#c3c6c4" strokeWidth={1.5} />);
  for (let j = 1; j < h / 26; j++) out.push(<line key={'h' + j} x1={0} x2={len} y1={22 + j * 26} y2={22 + j * 26} stroke="#c3c6c4" strokeWidth={1.5} />);
  const leaves = [];
  for (let i = 0; i < len / 14; i++) leaves.push(<ellipse key={i} cx={7 + i * 14} cy={11} rx={5} ry={2.6} transform={`rotate(${i % 2 ? 30 : -30} ${7 + i * 14} 11)`} fill="#8d918f" />);
  const body = <g>
    <rect x={0} y={0} width={len} height={h} fill="#dfe0dd" />{out}
    <rect x={0} y={0} width={len} height={22} fill="#eceae4" stroke="#c3c6c4" strokeWidth={1.5} />{leaves}
    <rect x={0} y={-5} width={len} height={6} fill="#f6f4ee" />
  </g>;
  return along === 'y'
    ? <Plane o={[0.006, RY, TILE_TOP]} u={[0, -1, 0]} v={[0, 0, -1]}>{body}</Plane>
    : <Plane o={[0, 0.006, TILE_TOP]} u={[1, 0, 0]} v={[0, 0, -1]}>{body}</Plane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#f6efd8" />
    <BackWallX RY={RY} RH={RH} fill="#ebe2c8" />
    <WallTiles along="x" />
    <WallTiles along="y" />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// Light from the tall window on the cut-away front wall.
function WindowLight() {
  return <FloorPlane z={0.012} x={0.9} y={0.7}><polygon points="0,80 60,80 90,0 30,0" fill="#fff6d8" opacity={.45} /></FloorPlane>;
}

// Doorway → Downstairs hallway (gap in the near end wall; hallway floorboards on the threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#a26c3f" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>;
}

// ---------- Fixtures ----------
function ToiletMat() {
  return <FloorPlane z={0.01} x={0.3} y={0.28}>
    <path d="M0,0 H22 V30 Q22,48 47,48 Q72,48 72,30 V0 H94 V80 H0 Z" transform="rotate(-90 47 47) translate(0 0)" fill="#7e6c62" stroke="#665850" strokeWidth={2} />
  </FloorPlane>;
}

function Toilet() {
  const cy = 0.75;
  return <g>
    {/* cistern */}
    <Box x={0} y={cy - 0.33} z={0.85} w={0.26} d={0.66} h={0.45} c={PORC} />
    <Box x={0} y={cy - 0.35} z={1.3} w={0.29} d={0.7} h={0.05} c={PORC} />
    <Box x={0.12} y={cy + 0.22} z={0.95} w={0.17} d={0.04} h={0.03} c={['#cfd3d6', '#b5bcc0', '#a9afb4']} />
    {/* pan */}
    <Box x={0.25} y={cy - 0.13} w={0.3} d={0.26} h={0.42} c={PORC} />
    <Box x={0.22} y={cy - 0.23} z={0.42} w={0.58} d={0.46} h={0.08} c={PORC} />
    <FloorPlane z={0.501} x={0.22} y={cy - 0.23}>
      <ellipse cx={31} cy={23} rx={24} ry={20} fill="#ffffff" stroke="#dfe4e4" strokeWidth={2} />
      <ellipse cx={32} cy={23} rx={14} ry={11} fill="#d9e2e4" />
    </FloorPlane>
    {/* lid up against the cistern */}
    <Plane o={[0.3, cy + 0.22, 1.25]} u={[0, -1, 0]} v={[0, 0, -1]}>
      <rect x={0} y={0} width={44} height={72} rx={20} fill="#ffffff" stroke="#dfe4e4" strokeWidth={2} />
    </Plane>
  </g>;
}

function CleaningBottles() {
  return <g>
    <Box x={0.04} y={0.5} z={1.35} w={0.1} d={0.1} h={0.32} c={['#3d63c9', '#2f50a8', '#28448f']} />
    <Box x={0.06} y={0.5} z={1.67} w={0.05} d={0.05} h={0.06} c={['#ffffff', '#eeeeee', '#dddddd']} />
    <Box x={0.04} y={0.66} z={1.35} w={0.1} d={0.1} h={0.36} c={['#2f5c46', '#244a38', '#1d3e2f']} />
    <Box x={0.06} y={0.66} z={1.71} w={0.05} d={0.05} h={0.07} c={['#e23b3b', '#c22e2e', '#a82626']} />
  </g>;
}

function ToiletBrush() {
  return <g>
    <Box x={0.08} y={0.22} w={0.14} d={0.14} h={0.22} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    <line x1={P(0.15, 0.29, 0.22)[0]} y1={P(0.15, 0.29, 0.22)[1]} x2={P(0.15, 0.29, 0.6)[0]} y2={P(0.15, 0.29, 0.6)[1]} stroke="#2a2a2c" strokeWidth={4} />
  </g>;
}

function BasinUnit() {
  const x0 = 1.65;
  return <g>
    <Box x={x0 + 0.05} y={0} w={0.6} d={0.42} h={0.95} c={WHITE} />
    <FaceY y={0.42} x0={x0 + 0.05} z1={0.95}>
      <rect x={4} y={6} width={52} height={86} fill="none" stroke="#ddd6c9" strokeWidth={2} />
    </FaceY>
    <Box x={x0} y={0} z={0.95} w={0.7} d={0.55} h={0.18} c={PORC} />
    <FloorPlane z={1.131} x={x0 + 0.07} y={0.1}>
      <ellipse cx={28} cy={22} rx={26} ry={18} fill="#d9e2e4" />
      <circle cx={28} cy={26} r={3} fill="#a9afb4" />
    </FloorPlane>
    <line x1={P(x0 + 0.35, 0.06, 1.13)[0]} y1={P(x0 + 0.35, 0.06, 1.13)[1]} x2={P(x0 + 0.35, 0.06, 1.38)[0]} y2={P(x0 + 0.35, 0.06, 1.38)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
    <line x1={P(x0 + 0.35, 0.06, 1.38)[0]} y1={P(x0 + 0.35, 0.06, 1.38)[1]} x2={P(x0 + 0.35, 0.2, 1.33)[0]} y2={P(x0 + 0.35, 0.2, 1.33)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
  </g>;
}

function HangingTowel() {
  return <FaceY y={0.03} x0={2.42} z1={2.0}>
    <circle cx={22} cy={-6} r={5} fill="#c9ced2" />
    <path d="M4,0 H40 V96 Q30,104 22,98 Q12,104 4,96 Z" fill="#7d7680" />
    <rect x={4} y={78} width={36} height={6} fill="#6b6570" />
  </FaceY>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

function ToiletScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={985} cy={340} zoom={1.45} label="Toilet" defs={<clipPath id="wcfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <PlankTileFloor />
    <WindowLight />
    <Walls />
    <HangingTowel />
    <HallDoorway />
    <ToiletMat />
    <ToiletBrush />
    <Toilet />
    <CleaningBottles />
    <BasinUnit />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.0]} text="Hallway" />
  </IsoStage>;
}
window.ToiletScene = ToiletScene;
