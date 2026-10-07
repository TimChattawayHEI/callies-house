// Attic. Static, no character. Exports window.AtticScene.
// Cosy-spooky treasure attic: sloping roof, round moon window on the gable, fairy lights, dress-up rail,
// rocking horse, dusty treasure chests, a sheet-covered chair, cobwebs, and two pairs of eyes glowing under the eaves.
// Floor hatch with ladder → upstairs hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, Slab, Tag, IsoStage, CARD } = window.Iso;

const RX = 7.2, RY = 5.0, KNEE = 1.2, RIDGE = 4.5, RIDGE_Y = 2.6;
const slopeZ = (y) => KNEE + (RIDGE - KNEE) * Math.min(y, RIDGE_Y) / RIDGE_Y;
const HATCH = { x0: 5.4, x1: 6.4, y0: 3.4, y1: 4.3 };   // floor hatch → Upstairs hallway
const TIMBER = ['#9a7350', '#7f5c3e', '#6e4f35'];
const DUSTY = ['#8a6a4a', '#6f5238', '#5f4630'];

// ---------- Shell ----------
function Floorboards() {
  const p = [];
  for (let i = 0; i < RY * 100 / 34; i++) {
    p.push(<rect key={i} x={0} y={i * 34} width={RX * 100} height={34} fill={i % 2 ? '#86613f' : '#7c5838'} />);
    const off = (i * 173) % 300;
    for (let k = -1; k < 4; k++) p.push(<line key={i + '-' + k} x1={off + k * 300} x2={off + k * 300} y1={i * 34} y2={i * 34 + 34} stroke="#5c4029" strokeWidth={2} />);
    p.push(<line key={'l' + i} x1={0} x2={RX * 100} y1={i * 34} y2={i * 34} stroke="#5c4029" strokeWidth={1.5} />);
  }
  return <FloorPlane><g clipPath="url(#atFloor)">{p}</g></FloorPlane>;
}

function KneeWall() {
  return <Plane o={[0, 0, KNEE]} u={[1, 0, 0]} v={[0, 0, -1]}>
    <rect x={0} y={0} width={RX * 100} height={KNEE * 100} fill="#6a4d36" />
    {Array.from({ length: Math.ceil(RX * 100 / 22) }, (_, i) => <line key={i} x1={i * 22} x2={i * 22} y1={0} y2={KNEE * 100} stroke="#58402c" strokeWidth={2} />)}
  </Plane>;
}

// Underside of the back roof slope, with rafters.
function RoofSlope() {
  const rafters = [];
  for (let x = 0.2; x < RX; x += 0.9) rafters.push(<polygon key={x} points={pts([[x, 0, KNEE], [x + 0.16, 0, KNEE], [x + 0.16, RIDGE_Y, RIDGE], [x, RIDGE_Y, RIDGE]])} fill="#8a6644" stroke="#6e5035" strokeWidth={1} />);
  return <g>
    <polygon points={pts([[0, 0, KNEE], [RX, 0, KNEE], [RX, RIDGE_Y, RIDGE], [0, RIDGE_Y, RIDGE]])} fill="#c9b08a" />
    {[0.25, 0.5, 0.75].map(t => <polygon key={t} points={pts([[0, RIDGE_Y * t, slopeZ(RIDGE_Y * t)], [RX, RIDGE_Y * t, slopeZ(RIDGE_Y * t)], [RX, RIDGE_Y * t + 0.05, slopeZ(RIDGE_Y * t + 0.05)], [0, RIDGE_Y * t + 0.05, slopeZ(RIDGE_Y * t + 0.05)]])} fill="#b49a76" />)}
    {rafters}
  </g>;
}

function GableWall() {
  return <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, KNEE], [0, RIDGE_Y, RIDGE], [0, 0, KNEE]])} fill="#a88f6e" />;
}

function RidgeBeam() {
  return <Box x={0} y={RIDGE_Y - 0.12} z={RIDGE - 0.2} w={RX} d={0.24} h={0.2} c={TIMBER} />;
}

// Round moon window on the gable, moonlight on the floor.
function MoonWindow() {
  return <g>
    <FaceX x={0.02} y1={RIDGE_Y + 0.55} z1={3.35}>
      <circle cx={55} cy={55} r={55} fill="#5c4632" />
      <circle cx={55} cy={55} r={46} fill="#24305c" />
      <circle cx={70} cy={40} r={16} fill="#f4efd2" /><circle cx={77} cy={35} r={14} fill="#24305c" />
      {[[30, 30], [40, 72], [80, 76], [24, 56]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6} fill="#fff" />)}
      <line x1={55} x2={55} y1={9} y2={101} stroke="#5c4632" strokeWidth={5} /><line x1={9} x2={101} y1={55} y2={55} stroke="#5c4632" strokeWidth={5} />
    </FaceX>
  </g>;
}
const Moonlight = () => <FloorPlane z={0.012} x={0.3} y={RIDGE_Y - 0.6}><polygon points="0,20 30,130 150,150 110,0" fill="#bcd2ff" opacity={.18} /></FloorPlane>;

function Cobwebs() {
  const web = (key) => <g key={key}>
    {[0, 22, 45, 68, 90].map(a => <line key={a} x1={0} y1={0} x2={Math.cos(a * Math.PI / 180) * 60} y2={Math.sin(a * Math.PI / 180) * 60} stroke="#e8e4da" strokeWidth={1} opacity={.7} />)}
    {[18, 34, 50].map(r => <path key={r} d={`M${r},0 Q${r * 0.8},${r * 0.35} ${r * 0.7},${r * 0.7} Q${r * 0.35},${r * 0.8} 0,${r}`} fill="none" stroke="#e8e4da" strokeWidth={1} opacity={.7} />)}
  </g>;
  return <g>
    <FaceX x={0.03} y1={0.9} z1={2.2}><g transform="translate(90 18) scale(-1 1)">{web('a')}</g></FaceX>
    <FaceX x={0.03} y1={RIDGE_Y + 0.1} z1={RIDGE - 0.22}><g transform="translate(10 0)">{web('b')}</g></FaceX>
    <FaceY y={0.03} x0={6.4} z1={KNEE}><g transform="translate(70 0) scale(-1 1)">{web('c')}</g></FaceY>
  </g>;
}

// ---------- Under the eaves ----------
function EavesShadow() {
  return <FloorPlane z={0.011}><path d={`M0,0 H${RX * 100} V70 Q${RX * 50},95 0,70 Z`} fill="#1e1610" opacity={.45} /></FloorPlane>;
}

// Two pairs of eyes glowing in the dark corner (drawn after the night tint so they shine).
function GlowingEyes() {
  const pair = (x, y, z, s, key) => { const [px, py] = P(x, y, z); return <g key={key} filter="url(#atGlow)"><ellipse cx={px - 7 * s} cy={py} rx={3.4 * s} ry={2.2 * s} fill="#ffe27a" /><ellipse cx={px + 7 * s} cy={py} rx={3.4 * s} ry={2.2 * s} fill="#ffe27a" /></g>; };
  return <g>{pair(1.7, 0.18, 0.35, 1, 'e1')}{pair(2.15, 0.22, 0.25, 0.75, 'e2')}</g>;
}

// ---------- Treasure ----------
function TreasureChest({ x, y, open }) {
  const w = 0.9, d = 0.55, h = 0.45;
  return <g>
    <Box x={x} y={y} w={w} d={d} h={h} c={DUSTY} />
    {[0.12, w - 0.2].map(dx => <Box key={dx} x={x + dx} y={y - 0.005} w={0.08} d={d + 0.01} h={h + 0.005} c={['#c9a54a', '#b38f3a', '#9c7c32']} />)}
    {open ? <g>
      <FloorPlane z={h + 0.002} x={x + 0.05} y={y + 0.05}>{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={8 + (i % 7) * 11} cy={10 + Math.floor(i / 7) * 16} r={6} fill={i % 3 ? '#f2c94c' : '#e8b33a'} stroke="#b38f3a" strokeWidth={1} />)}<circle cx={60} cy={18} r={6} fill="#e85a7a" /></FloorPlane>
      <Plane o={[x, y, h]} u={[1, 0, 0]} v={[0, -0.25, 0.55]}><rect x={0} y={0} width={w * 100} height={100} fill="#7a5a3d" /><rect x={12} y={0} width={8} height={100} fill="#c9a54a" /><rect x={w * 100 - 20} y={0} width={8} height={100} fill="#c9a54a" /></Plane>
    </g> : <g>
      <Box x={x} y={y} z={h} w={w} d={d} h={0.16} c={['#8f6e4e', '#735740', '#644b36']} />
      <FaceY y={y + d} x0={x} z1={h + 0.05}><rect x={w * 50 - 7} y={0} width={14} height={16} rx={2} fill="#d9b24a" /><circle cx={w * 50} cy={9} r={2.5} fill="#3a2a1c" /></FaceY>
      <FloorPlane z={h + 0.161} x={x} y={y}><rect x={0} y={0} width={w * 100} height={d * 100} fill="#e8e0d0" opacity={.18} /></FloorPlane>
    </g>}
  </g>;
}

function GoldGlow() { const [x, y] = P(5.45, 0.98, 0.6); return <ellipse cx={x} cy={y} rx={60} ry={30} fill="url(#atWarm)" />; }

function OldTrunk() {
  return <g>
    <Box x={6.0} y={1.7} w={0.8} d={0.55} h={0.55} c={['#4f6b7a', '#3e5664', '#344955']} />
    <FaceX x={6.8} y1={2.25} z1={0.55}><rect x={8} y={10} width={16} height={12} rx={2} fill="#e85a7a" transform="rotate(-8 16 16)" /><rect x={30} y={22} width={18} height={12} rx={6} fill="#f2c94c" /><rect x={14} y={34} width={14} height={10} fill="#9cc79a" /></FaceX>
  </g>;
}

function CardboardBoxes() {
  return <g>
    <Box x={6.3} y={0.15} w={0.75} d={0.65} h={0.55} c={CARD} />
    <Box x={6.4} y={0.2} z={0.55} w={0.55} d={0.5} h={0.4} c={CARD} />
    <FaceY y={0.7} x0={6.4} z1={0.95}><text x={27} y={24} textAnchor="middle" fontSize={11} fontWeight="700" fill="#6b4a2a" fontFamily="'Baloo 2', sans-serif">XMAS</text></FaceY>
  </g>;
}

// Armchair under a dust sheet.
function SheetedChair() {
  const x = 2.8, y = 0.6;
  return <g>
    <Box x={x} y={y} w={0.95} d={0.85} h={0.5} c={['#e9e4da', '#d6d0c4', '#c9c2b4']} stroke="rgba(0,0,0,.12)" />
    <Box x={x} y={y} w={0.95} d={0.25} h={1.05} c={['#ece7de', '#dcd6ca', '#cfc8ba']} stroke="rgba(0,0,0,.12)" />
    <FaceY y={y + 0.85} x0={x} z1={0.5}><path d="M0,0 q15,30 0,50 h95 q-12,-24 0,-50" fill="#d6d0c4" /><path d="M20,10 q6,20 -2,40 M60,8 q-6,22 4,42" stroke="#c4bdae" strokeWidth={2} fill="none" /></FaceY>
  </g>;
}

// ---------- Dress-up corner ----------
function DressUpRail() {
  const x0 = 0.8, y = 3.7, costumes = [
    ['#f7a9c4', 'M6,10 h28 l10,110 h-48 z'],        // princess dress
    ['#e23b3b', 'M4,10 h30 l14,90 h-58 z'],         // superhero cape
    ['#7a4fd1', 'M6,10 h26 l6,120 h-38 z'],         // wizard robe
    ['#3fb6c9', 'M8,10 h24 l16,60 h-56 z'],         // mermaid tutu
    ['#f2c94c', 'M6,10 h28 v80 h-28 z'],            // pirate coat
  ];
  return <FaceY y={y} x0={x0} z1={2.3}>
    <rect x={0} y={0} width={6} height={230} fill="#c9ced2" /><rect x={194} y={0} width={6} height={230} fill="#c9ced2" />
    <rect x={-4} y={0} width={208} height={6} fill="#c9ced2" />
    <rect x={-14} y={226} width={34} height={5} fill="#9aa1a6" /><rect x={180} y={226} width={34} height={5} fill="#9aa1a6" />
    {costumes.map(([c, d], i) => <g key={i} transform={`translate(${16 + i * 36} 0)`}>
      <path d="M20,0 v8 M10,12 q10,-10 20,0" fill="none" stroke="#9aa1a6" strokeWidth={2} />
      <path d={d} fill={c} stroke="rgba(0,0,0,.15)" strokeWidth={1} />
      {i === 0 && <path d="M2,118 q20,8 44,0" fill="none" stroke="#fff" strokeWidth={3} />}
      {i === 2 && [30, 60, 90].map(sy => <circle key={sy} cx={20} cy={sy} r={2.5} fill="#f2c94c" />)}
    </g>)}
    {/* witch hat + crown on top */}
    <path d="M30,-2 l14,-40 l14,40 z" fill="#2a2a2c" /><rect x={22} y={-4} width={44} height={6} rx={3} fill="#2a2a2c" />
    <path d="M130,-2 v-16 l8,8 l8,-12 l8,12 l8,-8 v16 z" fill="#f2c94c" />
  </FaceY>;
}

function DressUpMirror() {
  return <FaceY y={4.0} x0={3.25} z1={2.2}>
    <ellipse cx={30} cy={70} rx={30} ry={70} fill="#c9a54a" /><ellipse cx={30} cy={70} rx={24} ry={62} fill="#9fb3c9" />
    <path d="M18,30 q8,-14 20,-10" fill="none" stroke="#fff" strokeWidth={4} opacity={.6} />
    <path d="M10,138 l-10,82 M50,138 l10,82" stroke="#8a6644" strokeWidth={5} />
  </FaceY>;
}

// Wooden rocking horse, side-on.
function RockingHorse() {
  return <FaceY y={2.1} x0={3.6} z1={1.55}>
    <path d="M-10,140 Q75,175 160,140" fill="none" stroke="#7a4f2a" strokeWidth={8} strokeLinecap="round" />
    <path d="M30,148 l10,-60 M120,148 l-10,-60" stroke="#7a4f2a" strokeWidth={6} />
    <path d="M30,90 q0,-30 40,-30 h40 q20,0 20,20 q0,14 -16,14 h-74 q-10,0 -10,-4 z" fill="#f4efe4" stroke="#c9bfae" strokeWidth={2} />
    {[[50, 70], [80, 74], [100, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="#8a6a4a" />)}
    <path d="M118,62 l14,-44 q4,-12 18,-6 l14,12 q4,6 -2,10 l-16,-2 l-12,32 z" fill="#f4efe4" stroke="#c9bfae" strokeWidth={2} />
    <path d="M128,20 q-14,10 -10,40" fill="none" stroke="#7a4f2a" strokeWidth={8} strokeLinecap="round" />
    <circle cx={150} cy={22} r={2.5} fill="#2a2a2c" />
    <rect x={62} y={52} width={34} height={12} rx={4} fill="#c23b3b" />
    <path d="M32,72 q-20,10 -16,40" fill="none" stroke="#7a4f2a" strokeWidth={7} strokeLinecap="round" />
  </FaceY>;
}

// ---------- Doorway ----------
// Doorway → Upstairs hallway (floor hatch with the top of the loft ladder)
function FloorHatch() {
  const { x0, x1, y0, y1 } = HATCH;
  return <g>
    <FloorPlane z={0.006} x={x0} y={y0}><rect x={0} y={0} width={(x1 - x0) * 100} height={(y1 - y0) * 100} fill="#1a130d" stroke="#5c4029" strokeWidth={4} /></FloorPlane>
    {[0.25, 0.75].map(t => { const a = P(x0 + (x1 - x0) * t, y1 - 0.1, -0.6), b = P(x0 + (x1 - x0) * t, y0 + 0.2, 0.9); return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#b5bcc0" strokeWidth={5} />; })}
    {[0.2, 0.55].map(z => { const a = P(x0 + 0.25, y0 + 0.2 + (0.9 - z) * 0.4, z), b = P(x0 + 0.75, y0 + 0.2 + (0.9 - z) * 0.4, z); return <line key={z} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#9aa1a6" strokeWidth={4} />; })}
    <Plane o={[x1, y0, 0]} u={[0, 1, 0]} v={[0.55, 0, 0.6]}><rect x={0} y={0} width={(y1 - y0) * 100} height={100} fill="#f3eadb" stroke="#d9c6a6" strokeWidth={3} /></Plane>
  </g>;
}

function FloorLantern() {
  const [x, y] = P(4.8, 3.9, 0);
  return <g>
    <rect x={x - 9} y={y - 34} width={18} height={30} rx={3} fill="#3a2a1c" />
    <rect x={x - 6} y={y - 30} width={12} height={22} fill="#ffd27a" />
    <path d={`M${x - 8},${y - 34} q8,-10 16,0`} fill="none" stroke="#3a2a1c" strokeWidth={2} />
  </g>;
}
function LanternGlow() { const [x, y] = P(4.8, 3.9, 0.15); return <ellipse cx={x} cy={y} rx={110} ry={55} fill="url(#atWarm)" />; }

// Fairy lights draped along the rafters and down the ridge (drawn after the night tint).
function FairyLights() {
  const strand = (y, sag, key, n = 16) => {
    const ptsArr = [];
    for (let i = 0; i <= n; i++) { const t = i / n, x = 0.2 + t * (RX - 0.4), z = slopeZ(y) - 0.05 - Math.sin(t * Math.PI * 4) ** 2 * sag; ptsArr.push(P(x, y, z)); }
    return <g key={key}>
      <polyline points={ptsArr.map(p => p.join(',')).join(' ')} fill="none" stroke="#3a3326" strokeWidth={1.5} />
      {ptsArr.map(([px, py], i) => <g key={i}><circle cx={px} cy={py + 3} r={11} fill="url(#atBulb)" /><circle cx={px} cy={py + 3} r={3} fill={['#ffe7a0', '#ffd0e0', '#d0f0ff', '#fff3c0'][i % 4]} /></g>)}
    </g>;
  };
  return <g>{strand(0.9, 0.25, 'a')}{strand(1.9, 0.3, 'b')}</g>;
}

function DustMotes() {
  const m = [];
  for (let i = 0; i < 30; i++) { const s = Math.sin(i * 51.3) * 9999, r = s - Math.floor(s), s2 = Math.sin(i * 17.9) * 9999, r2 = s2 - Math.floor(s2); const [x, y] = P(0.4 + r * 2.2, RIDGE_Y - 0.4 + r2 * 1.2, 0.6 + r * 2.4); m.push(<circle key={i} cx={x} cy={y} r={1.4} fill="#f4efd2" opacity={.55} />); }
  return <g>{m}</g>;
}

const DEFS = <>
  <clipPath id="atFloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>
  <radialGradient id="atBulb"><stop offset="0" stopColor="#fff2b0" stopOpacity=".85" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></radialGradient>
  <radialGradient id="atWarm"><stop offset="0" stopColor="#ffd27a" stopOpacity=".45" /><stop offset="1" stopColor="#ffb44a" stopOpacity="0" /></radialGradient>
  <filter id="atGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
</>;

function AtticScene({ showLabels = true, spooky = true }) {
  const L = showLabels;
  return <IsoStage cx={1000} cy={520} zoom={1.3} label="Attic" defs={DEFS}>
    <Slab RX={RX} RY={RY} />
    <Floorboards />
    <GableWall />
    <KneeWall />
    <RoofSlope />
    <MoonWindow />
    <RidgeBeam />
    <Cobwebs />
    <EavesShadow />
    <Moonlight />
    <TreasureChest x={0.35} y={0.25} />
    <SheetedChair />
    <TreasureChest x={5.0} y={0.7} open />
    <CardboardBoxes />
    <OldTrunk />
    <RockingHorse />
    <DressUpRail />
    <DressUpMirror />
    <FloorHatch />
    <FloorLantern />
    {/* night tint, then everything that glows */}
    <rect x={-3000} y={-3000} width={9000} height={9000} fill="#1c1630" opacity={.32} pointerEvents="none" />
    <GoldGlow />
    <LanternGlow />
    <FairyLights />
    <DustMotes />
    {spooky && <GlowingEyes />}
    <Tag show={L} at={[(HATCH.x0 + HATCH.x1) / 2, (HATCH.y0 + HATCH.y1) / 2, 1.6]} text="Hallway" />
  </IsoStage>;
}
window.AtticScene = AtticScene;
