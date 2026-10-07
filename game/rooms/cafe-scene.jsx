// Coffee shop. Static scenery with idle-animated NPCs. Exports window.CafeScene.
// Back-left wall (y = 0): menu boards over the back counter (coffee machine, grinder, cups), drinks fridge, crisps stand.
// Serving counter in front: till ("order here"), cake + croissant display, collect point. Baristas behind.
// Back-right wall (x = 0): big windows with a long bench seat and tables. Middle: round tables, armchairs.
// Near end (x = RX, cut low): front door → Street.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const RX = 9.5, RY = 7.0, RH = 4.2;
const DOOR = { y0: 4.9, y1: 6.0 };            // near end → Street
const CTR = { x0: 1.6, x1: 6.8, y0: 1.3, y1: 2.0, h: 1.05 };
const TEAL = ['#2f6f6a', '#255a56', '#1f4d4a'], WOOD = ['#a8774a', '#8c6238', '#78532f'], DARK = ['#3a3a3c', '#2a2a2c', '#202022'];
const BARISTA = { top: '#2f3a3a', apron: '#2f6f6a', legs: '#2a2a2c', long: false };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };

function Floor() {
  const t = [];
  for (let i = 0; i < RX * 2; i++) for (let j = 0; j < RY * 2; j++) t.push(<rect key={i + '-' + j} x={i * 50} y={j * 50} width={50} height={50} fill={(i + j) % 2 ? '#e9dcc4' : '#3d3a38'} />);
  return <FloorPlane><g clipPath="url(#cfFloor)">{t}</g></FloorPlane>;
}

function Walls() {
  const tiles = [];
  for (let r = 0; r < 14; r++) for (let c = 0; c < 40; c++) tiles.push(<rect key={r + '-' + c} x={c * 24 - (r % 2) * 12} y={(RH - 2.6) * 100 + r * 12} width={23} height={11} fill="#f7f4ee" />);
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#e6d9c3" />
    <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}><g clipPath="url(#cfTiles)"><rect x={100} y={(RH - 2.6) * 100} width={620} height={260} fill="#dcd6cb" />{tiles}</g></Plane>
    <BackWallX RY={RY} RH={RH} fill="#9db5a0" />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#3d3a38" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#3d3a38" />
  </g>;
}

// ---------- Back wall ----------
function MenuBoards() {
  const board = (x, title, items) => <g transform={`translate(${x} 0)`}>
    <rect x={0} y={0} width={150} height={110} rx={4} fill="#2a2a2c" stroke="#8c6238" strokeWidth={4} />
    <text x={75} y={20} textAnchor="middle" fontSize={13} fontWeight="800" fill="#f2c94c" fontFamily="'Baloo 2', sans-serif">{title}</text>
    {items.map(([n, p], i) => <g key={n}><text x={10} y={40 + i * 17} fontSize={11.5} fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">{n}</text><text x={140} y={40 + i * 17} textAnchor="end" fontSize={11.5} fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">{p}</text></g>)}
  </g>;
  return <FaceY y={0.02} x0={1.7} z1={4.0}>
    {board(0, 'HOT DRINKS', [['Coffee', '£2.80'], ['Flat White', '£3.20'], ['Hot Chocolate', '£3.10'], ['Matcha Latte', '£3.50']])}
    {board(165, 'COLD', [['Iced Coffee', '£3.40'], ['Juice', '£2.20'], ['Water', '£1.20']])}
    {board(330, 'FOOD', [['Croissant', '£2.30'], ['Cake', '£3.00'], ['Crisps', '£1.10']])}
  </FaceY>;
}

function BackCounter() {
  return <g>
    <Box x={1.0} y={0} w={5.8} d={0.6} h={0.95} c={WOOD} />
    <Box x={0.98} y={0} z={0.95} w={5.84} d={0.62} h={0.05} c={['#e9e4da', '#d6d0c4', '#c9c2b4']} />
    <FaceY y={0.02} x0={1.2} z1={2.15}>{[0, 1].map(i => <g key={i}><rect x={0} y={i * 40} width={200} height={5} fill="#8c6238" />{Array.from({ length: 8 }, (_, k) => <rect key={k} x={8 + k * 24} y={i * 40 - 22} width={16} height={22} rx={3} fill={k % 3 ? '#fbf8f2' : '#2f6f6a'} />)}</g>)}</FaceY>
  </g>;
}

function CoffeeMachine() {
  const x = 2.6;
  return <g>
    <Box x={x} y={0.05} z={1.0} w={1.3} d={0.5} h={0.75} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    <FaceY y={0.55} x0={x} z1={1.75}>
      <rect x={8} y={8} width={114} height={18} rx={3} fill="#2f6f6a" />
      {[25, 65, 105].map(cx => <g key={cx}><rect x={cx - 8} y={30} width={16} height={12} fill="#2a2a2c" /><rect x={cx - 3} y={42} width={6} height={10} fill="#5b5f66" /></g>)}
      <rect x={6} y={60} width={118} height={6} fill="#5b5f66" />
    </FaceY>
    {[2.75, 3.15, 3.55].map(cx => <Box key={cx} x={cx} y={0.42} z={1.0} w={0.13} d={0.13} h={0.12} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />)}
    <Box x={x + 0.1} y={0.1} z={1.75} w={1.1} d={0.4} h={0.18} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function Grinder() {
  return <g>
    <Box x={4.15} y={0.12} z={1.0} w={0.32} d={0.32} h={0.45} c={DARK} />
    <Box x={4.18} y={0.15} z={1.45} w={0.26} d={0.26} h={0.3} c={['#c99a5c', '#a87e48', '#93703f']} />
    <Box x={4.75} y={0.1} z={1.0} w={0.5} d={0.4} h={0.25} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    {[5.5, 5.7, 5.9].map((x, i) => <Box key={x} x={x} y={0.15} z={1.0} w={0.14} d={0.14} h={0.3} c={[['#d9465f', '#f2c94c', '#8a6a4a'][i], '#c9c2b4', '#bdb5a6']} />)}
  </g>;
}

function DrinksFridge() {
  const x = 7.7, cols = ['#f2a127', '#9fd6c8', '#e85a7a', '#fbf8f2', '#3f9a52'];
  return <g>
    <Box x={x} y={0} w={1.1} d={0.7} h={2.2} c={DARK} />
    <FaceY y={0.7} x0={x} z1={2.2}>
      <rect x={8} y={14} width={94} height={196} rx={4} fill="#d4ecf0" />
      {[0, 1, 2, 3].map(r => <g key={r}><rect x={10} y={56 + r * 46} width={90} height={3} fill="#9aa1a6" />{Array.from({ length: 6 }, (_, k) => <rect key={k} x={14 + k * 14} y={30 + r * 46} width={10} height={26} rx={3} fill={cols[(k + r) % 5]} />)}</g>)}
      <rect x={6} y={2} width={98} height={10} fill="#2f6f6a" />
      <rect x={94} y={90} width={4} height={40} rx={2} fill="#c9ced2" />
    </FaceY>
  </g>;
}

function CrispStand() {
  const cols = ['#e0524a', '#3f7fc4', '#5fbf6a', '#f2c94c', '#7a4fd1', '#e98a3a'];
  return <g>
    <Box x={6.95} y={0.05} w={0.6} d={0.45} h={0.12} c={WOOD} />
    {[0.12, 0.55, 0.98].map((z, r) => <g key={z}>
      <Box x={6.95} y={0.05} z={z + 0.4} w={0.6} d={0.45} h={0.03} c={WOOD} />
      {[0, 1, 2].map(k => <Box key={k} x={6.98 + k * 0.19} y={0.12} z={z} w={0.17} d={0.12} h={0.36} c={[cols[(k + r * 2) % 6], cols[(k + r * 2) % 6], shade(cols[(k + r * 2) % 6], -0.15)]} />)}
    </g>)}
    {ln([6.95, 0.5, 0], [6.95, 0.5, 1.45], '#78532f', 3, 'a')}{ln([7.55, 0.5, 0], [7.55, 0.5, 1.45], '#78532f', 3, 'b')}
  </g>;
}

function PendantLights() {
  return <g>{[2.4, 4.2, 6.0].map(x => { const [lx, ly] = P(x, 1.65, 2.75); return <g key={x}>
    {ln([x, 1.65, RH], [x, 1.65, 2.85], '#2a2a2c', 1.5, 'w')}
    <path d={`M${lx - 18},${ly + 8} L${lx - 8},${ly - 10} L${lx + 8},${ly - 10} L${lx + 18},${ly + 8}Z`} fill="#2f6f6a" />
    <ellipse cx={lx} cy={ly + 10} rx={10} ry={4} fill="#ffe7a8" />
  </g>; })}</g>;
}

// ---------- Serving counter ----------
function ServingCounter() {
  const { x0, x1, y0, y1, h } = CTR;
  return <g>
    <Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={h} c={TEAL} />
    <FaceY y={y1} x0={x0} z1={h}>{Array.from({ length: Math.floor((x1 - x0) * 100 / 20) }, (_, i) => <rect key={i} x={i * 20 + 3} y={6} width={14} height={h * 100 - 12} rx={3} fill="#2a625d" />)}</FaceY>
    <Box x={x0 - 0.04} y={y0 - 0.04} z={h} w={x1 - x0 + 0.08} d={y1 - y0 + 0.08} h={0.06} c={['#c9a777', '#b08f62', '#9c7e55']} />
  </g>;
}

function Till() {
  const x = 2.0, z = CTR.h + 0.06;
  return <g>
    <Box x={x} y={1.4} z={z} w={0.5} d={0.4} h={0.12} c={DARK} />
    <Box x={x + 0.08} y={1.48} z={z + 0.12} w={0.08} d={0.24} h={0.32} c={DARK} />
    <FaceX x={x + 0.17} y1={1.72} z1={z + 0.42}><rect x={2} y={3} width={20} height={24} fill="#8fd0e0" /></FaceX>
    <Box x={x + 0.3} y={1.75} z={z} w={0.16} d={0.2} h={0.18} c={['#5b5f66', '#41454b', '#33363b']} />
  </g>;
}

// Glass display case with cakes and croissants.
function CakeDisplay() {
  const x0 = 4.3, x1 = 6.3, y0 = 1.35, y1 = 1.95, z0 = CTR.h + 0.06, z1 = z0 + 0.75;
  const cakes = [['#f7c6d6', '#fbf8f2'], ['#6b4a2e', '#3a2a1c'], ['#f2e3b0', '#e3b06a'], ['#9fd6c8', '#fbf8f2']];
  return <g>
    <Box x={x0} y={y0} z={z0} w={x1 - x0} d={y1 - y0} h={0.05} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    <Box x={x0} y={y0} z={z0 + 0.38} w={x1 - x0} d={y1 - y0} h={0.03} c={['#e2ecee', '#cfdcde', '#bfcdcf']} />
    {/* top shelf: cakes */}
    {cakes.map(([c, t], i) => <g key={i}><Box x={x0 + 0.12 + i * 0.47} y={y0 + 0.15} z={z0 + 0.41} w={0.34} d={0.3} h={0.2} c={[t, c, shade(c, -0.15)]} /></g>)}
    {/* bottom shelf: croissants */}
    {[0, 1, 2, 3, 4].map(i => { const [cx, cy] = P(x0 + 0.25 + i * 0.36, y0 + 0.35, z0 + 0.08); return <g key={i}><path d={`M${cx - 16},${cy} Q${cx},${cy - 18} ${cx + 16},${cy} Q${cx},${cy - 6} ${cx - 16},${cy}Z`} fill="#e3a54a" stroke="#c4863a" strokeWidth={1.5} />{[-6, 0, 6].map(d => <line key={d} x1={cx + d} y1={cy - 10} x2={cx + d * 1.3} y2={cy - 3} stroke="#c4863a" strokeWidth={1.5} />)}</g>; })}
    <polygon points={pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])} fill="#d4ecf0" fillOpacity={.28} stroke="#a9c4c9" strokeWidth={2} />
    <polygon points={pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])} fill="#d4ecf0" fillOpacity={.22} stroke="#a9c4c9" strokeWidth={2} />
    <polygon points={pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])} fill="#e8f4f6" fillOpacity={.4} stroke="#a9c4c9" strokeWidth={2} />
  </g>;
}

function CollectPoint() {
  const z = CTR.h + 0.06;
  return <g>
    <Box x={6.45} y={1.45} z={z} w={0.14} d={0.14} h={0.22} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    <Box x={6.45} y={1.7} z={z} w={0.12} d={0.12} h={0.3} c={['#e9d8b4', '#d9c49c', '#c9b48c']} />
    <FaceY y={CTR.y1 + 0.01} x0={6.0} z1={CTR.h + 0.02}><rect x={0} y={20} width={70} height={26} rx={4} fill="#f2c94c" /><text x={35} y={38} textAnchor="middle" fontSize={13} fontWeight="800" fill="#2a2a2c" fontFamily="'Baloo 2', sans-serif">COLLECT</text></FaceY>
    <FaceY y={CTR.y1 + 0.01} x0={1.7} z1={CTR.h + 0.02}><rect x={0} y={20} width={80} height={26} rx={4} fill="#f2c94c" /><text x={40} y={38} textAnchor="middle" fontSize={13} fontWeight="800" fill="#2a2a2c" fontFamily="'Baloo 2', sans-serif">ORDER HERE</text></FaceY>
  </g>;
}

// ---------- Window wall ----------
function Windows() {
  const win = (y1) => <FaceX key={y1} x={0.02} y1={y1} z1={3.5}>
    <rect x={-6} y={-6} width={182} height={232} fill="#2a2a2c" />
    <rect x={0} y={0} width={170} height={220} fill="#cfe3e0" />
    <rect x={0} y={150} width={170} height={70} fill="#b9cfc9" />
    {[[30, 120], [100, 110], [140, 130]].map(([x, y], i) => <g key={i}><rect x={x - 4} y={y} width={8} height={40} fill="#8a9a94" /><circle cx={x} cy={y - 6} r={9} fill="#a9b9b3" /></g>)}
    <line x1={85} x2={85} y1={0} y2={220} stroke="#2a2a2c" strokeWidth={5} />
    <path d="M10,30 l30,-20 M120,40 l30,-20" stroke="#fff" strokeWidth={4} opacity={.5} />
  </FaceX>;
  return <g>{win(3.7)}{win(6.2)}</g>;
}

function WindowBench() {
  return <g>
    <Box x={0} y={1.7} w={0.65} d={4.9} h={0.5} c={WOOD} />
    <Box x={0} y={1.7} z={0.5} w={0.6} d={4.9} h={0.1} c={['#c25a4a', '#a84c3e', '#943f33']} />
    <Box x={0} y={1.7} z={0.6} w={0.15} d={4.9} h={0.5} c={['#c25a4a', '#a84c3e', '#943f33']} />
  </g>;
}

function Table({ x, y, round }) {
  const [cx, cy] = P(x, y, 0), [tx, ty] = P(x, y, 0.78);
  return <g>
    <ellipse cx={cx} cy={cy} rx={20} ry={8} fill="#2a2a2c" />
    <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="#2a2a2c" strokeWidth={6} />
    {round ? <FloorPlane z={0.8} x={x} y={y}><circle r={38} fill="#c9a777" stroke="#9c7e55" strokeWidth={3} /></FloorPlane>
      : <Box x={x - 0.4} y={y - 0.35} z={0.76} w={0.8} d={0.7} h={0.05} c={['#c9a777', '#b08f62', '#9c7e55']} />}
  </g>;
}

function Chair({ x, y, face = 'x' }) {
  return <g>
    {[[0, 0], [0.32, 0], [0, 0.32], [0.32, 0.32]].map(([a, b], i) => ln([x + a, y + b, 0], [x + a, y + b, 0.45], '#2a2a2c', 3, i))}
    <Box x={x} y={y} z={0.45} w={0.38} d={0.38} h={0.05} c={['#3d3a38', '#2a2826', '#201e1c']} />
    {face === 'x' ? <Box x={x + 0.34} y={y} z={0.5} w={0.04} d={0.38} h={0.45} c={['#3d3a38', '#2a2826', '#201e1c']} />
      : <Box x={x} y={y - 0.02} z={0.5} w={0.38} d={0.04} h={0.45} c={['#3d3a38', '#2a2826', '#201e1c']} />}
  </g>;
}

function Armchair({ x, y }) {
  const c = ['#d49a2f', '#b8842a', '#a07224'];
  return <g>
    <Box x={x} y={y} w={0.85} d={0.85} h={0.42} c={c} />
    <Box x={x} y={y} w={0.85} d={0.18} h={0.95} c={c} />
    <Box x={x} y={y} w={0.16} d={0.85} h={0.62} c={c} /><Box x={x + 0.69} y={y} w={0.16} d={0.85} h={0.62} c={c} />
  </g>;
}

function Cup({ at, c = '#fbf8f2', tall }) {
  const [x, y, z] = at;
  return <g>
    <Box x={x} y={y} z={z} w={0.12} d={0.12} h={tall ? 0.24 : 0.12} c={[tall ? '#7a5233' : '#c99a5c', c, shade(c, -0.12)]} />
    {tall && ln([x + 0.06, y + 0.06, z + 0.24], [x + 0.1, y + 0.02, z + 0.38], '#e85a7a', 2, 'straw')}
  </g>;
}

function Plant({ x, y, s = 1 }) {
  const [px, py] = P(x + 0.2, y + 0.2, 0.45);
  return <g>
    <Box x={x} y={y} w={0.4} d={0.4} h={0.45} c={['#e9e4da', '#d6d0c4', '#c9c2b4']} />
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={px + (i % 2 ? 1 : -1) * (8 + i * 3)} cy={py - 14 - i * 12 * s} rx={16} ry={6} transform={`rotate(${i % 2 ? 30 : -30} ${px + (i % 2 ? 1 : -1) * (8 + i * 3)} ${py - 14 - i * 12 * s})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}
  </g>;
}

// Doorway → Street (glass front door in the near end wall)
function FrontDoor() {
  return <g>
    <FloorPlane z={0.005} x={RX} y={DOOR.y0}><rect x={0} y={0} width={20} height={(DOOR.y1 - DOOR.y0) * 100} fill="#3d3a38" /></FloorPlane>
    <FloorPlane z={0.008} x={RX - 0.7} y={DOOR.y0 + 0.1}><rect x={0} y={0} width={60} height={90} rx={4} fill="#6f6863" /></FloorPlane>
  </g>;
}
function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={DOOR.y0} h={h} c={c} />
    <Box x={RX} y={DOOR.y1} w={0.2} d={RY + 0.2 - DOOR.y1} h={h} c={c} />
  </g>;
}

const DEFS = <>
  <clipPath id="cfFloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>
  <clipPath id="cfTiles"><rect x={100} y={(RH - 2.6) * 100} width={620} height={260} /></clipPath>
</>;

function CafeScene({ showLabels = true, animate = true }) {
  const T = useClock(!animate);
  const L = showLabels, H = CTR.h + 0.06;
  const stat = React.useMemo(() => <><Slab RX={RX} RY={RY} /><Floor /><Walls /><Windows /><MenuBoards /><BackCounter /><CoffeeMachine /><Grinder /><DrinksFridge /><CrispStand /></>, []);
  return <IsoStage cx={980} cy={500} zoom={1.0} label="Coffee shop" defs={DEFS}>
    {stat}
    {/* baristas behind the counter */}
    <Person at={[3.3, 0.95, 0]} s={1.05} look={{ ...LOOKS.mumBun, ...BARISTA }} T={T} ph={1} facing="back" armL={40} armR={40} />
    <Person at={[2.3, 1.05, 0]} s={1.05} look={{ ...LOOKS.boyGreen, ...BARISTA }} T={T} ph={2} />
    <ServingCounter />
    <Till />
    <CakeDisplay />
    <CollectPoint />
    <PendantLights />
    {/* queue */}
    <Person at={[2.4, 2.55, 0]} s={1.08} look={LOOKS.mum} T={T} ph={3} facing="back" armR={50} />
    <Person at={[3.0, 3.25, 0]} s={0.78} look={LOOKS.girlBlue} T={T} ph={4} facing="back" />
    <Person at={[6.5, 2.5, 0]} s={1.08} look={LOOKS.grandad} T={T} ph={5} facing="back" />
    {/* window bench tables */}
    <WindowBench />
    <Person at={[0.35, 2.7, 0.6]} s={1.05} look={LOOKS.gran} T={T} ph={6} pose="sit" />
    <Table x={1.25} y={2.7} />
    <Cup at={[1.15, 2.5, 0.81]} /><Cup at={[1.3, 2.85, 0.81]} c="#2f6f6a" />
    <Chair x={1.85} y={2.5} />
    <Person at={[0.35, 5.0, 0.6]} s={1.05} look={LOOKS.dad} T={T} ph={7} pose="sit" armR={70} />
    <Table x={1.25} y={5.0} />
    <Box x={0.95} y={4.85} z={0.81} w={0.4} d={0.3} h={0.03} c={['#5b5f66', '#41454b', '#33363b']} />
    <FaceX x={0.98} y1={5.15} z1={1.12}><rect x={0} y={0} width={30} height={28} fill="#41454b" /></FaceX>
    <Cup at={[1.45, 5.2, 0.81]} tall c="#e9d8b4" />
    <Chair x={1.85} y={4.8} />
    {/* middle round tables */}
    <Chair x={3.6} y={4.05} face="y" />
    <Person at={[3.8, 4.25, 0.5]} s={0.78} look={LOOKS.girlPink} T={T} ph={8} pose="sit" armR={60} />
    <Table x={3.8} y={4.8} round />
    <Cup at={[3.7, 4.7, 0.81]} c="#8a5a3a" />
    <Box x={3.85} y={4.85} z={0.81} w={0.22} d={0.22} h={0.02} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    <FloorPlane z={0.832} x={3.88} y={4.88}><path d="M2,12 Q9,0 16,12 Q9,6 2,12Z" fill="#e3a54a" /></FloorPlane>
    <Chair x={4.4} y={5.1} face="y" />
    <Person at={[4.6, 5.3, 0.5]} s={1.05} look={LOOKS.mumBun} T={T} ph={9} pose="sit" armL={50} />
    <Table x={5.7} y={3.6} round />
    <Cup at={[5.6, 3.5, 0.81]} tall c="#a9d08a" />
    <Chair x={5.5} y={2.85} face="y" />
    <Chair x={6.2} y={3.45} />
    {/* armchair corner */}
    <Plant x={8.8} y={1.2} />
    <Armchair x={7.4} y={3.2} />
    <Person at={[7.85, 3.7, 0.42]} s={1.05} look={{ ...LOOKS.boyRed, hair: '#c4c0b8', top: '#5b7fa6', long: true }} T={T} ph={10} pose="sit" armL={80} armR={80} />
    <FaceY y={3.95} x0={7.6} z1={1.0}><rect x={0} y={0} width={46} height={32} fill="#f4f2ee" stroke="#c9c2b4" strokeWidth={1} /><line x1={23} x2={23} y1={0} y2={32} stroke="#c9c2b4" />{[6, 12, 18, 24].map(y => <line key={y} x1={4} x2={19} y1={y} y2={y} stroke="#9a958c" strokeWidth={1.5} />)}</FaceY>
    <Box x={7.5} y={4.4} w={0.7} d={0.5} h={0.4} c={WOOD} />
    <Cup at={[7.7, 4.55, 0.4]} />
    <Plant x={0.1} y={6.5} s={1.2} />
    <FrontDoor />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.2]} text="Street" />
    <Tag show={L} at={[2.2, 1.6, 2.0]} text="Order here" />
  </IsoStage>;
}
window.CafeScene = CafeScene;
