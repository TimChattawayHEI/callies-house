// Town map — opens when you click the house's front door. Exports window.TownMapScene.
// Mini isometric town in the same projection + palette: Home, Coffee shop, School, Park, Supermarket, joined by roads.
// Each location is clickable and links to its scene file (props.onPick(id) is also called, for the game to hook into).
const { P, pts, FloorPlane, FaceX, FaceY, Box, Tag, IsoStage, shade } = window.Iso;

const RX = 17, RY = 10;
const LOCS = [
  { id: 'home', name: 'Home', href: 'Downstairs Hallway.dc.html', tag: [2.2, 2.3, 3.3] },
  { id: 'cafe', name: 'Coffee shop', href: 'Coffee Shop.dc.html', tag: [5.0, 2.5, 2.4] },
  { id: 'school', name: 'School', href: 'School.dc.html', tag: [11.0, 2.3, 3.4] },
  { id: 'park', name: 'Park', href: 'Park.dc.html', tag: [3.2, 8.0, 2.6] },
  { id: 'shop', name: 'Supermarket', href: 'Supermarket.dc.html', tag: [11.0, 8.0, 2.6] },
  { id: 'nanny', name: "Nanny & Grandad's", href: 'Nanny and Grandads House.dc.html', tag: [15.6, 1.9, 3.0] },
];
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };

function Ground() {
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#5a3d26" />
    <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#86b955" /></FloorPlane>
  </g>;
}

function Roads() {
  return <FloorPlane z={0.005}>
    <rect x={0} y={445} width={RX * 100} height={110} fill="#5b5f66" />
    <rect x={645} y={0} width={110} height={RY * 100} fill="#5b5f66" />
    <line x1={0} x2={RX * 100} y1={500} y2={500} stroke="#fbf8f2" strokeWidth={5} strokeDasharray="30 24" />
    <line x1={700} x2={700} y1={0} y2={RY * 100} stroke="#fbf8f2" strokeWidth={5} strokeDasharray="30 24" />
    <rect x={645} y={445} width={110} height={110} fill="#5b5f66" />
    <rect x={0} y={425} width={RX * 100} height={20} fill="#c9c6bc" /><rect x={0} y={555} width={RX * 100} height={20} fill="#c9c6bc" />
    <rect x={625} y={0} width={20} height={RY * 100} fill="#c9c6bc" /><rect x={755} y={0} width={20} height={RY * 100} fill="#c9c6bc" />
    {[0, 1, 2, 3, 4].map(i => <rect key={i} x={790 + i * 20} y={450} width={12} height={100} fill="#fbf8f2" />)}
  </FloorPlane>;
}

function Tree({ x, y, s = 1 }) {
  const [tx, ty] = P(x, y, 0), [cx, cy] = P(x, y, 1.2 * s);
  return <g><ellipse cx={tx} cy={ty} rx={20 * s} ry={8 * s} fill="rgba(40,60,20,.2)" /><rect x={tx - 3} y={cy} width={6} height={ty - cy} fill="#7a5a3a" /><circle cx={cx} cy={cy - 6} r={24 * s} fill="#6b9a44" /><circle cx={cx + 10 * s} cy={cy - 16 * s} r={16 * s} fill="#8fbf5a" /></g>;
}

function Roof({ x, y, w, d, z, rise, c }) {
  const my = y + d / 2;
  return <g>
    <polygon points={pts([[x - 0.1, y - 0.1, z], [x + w + 0.1, y - 0.1, z], [x + w + 0.1, my, z + rise], [x - 0.1, my, z + rise]])} fill={shade(c, -0.1)} />
    <polygon points={pts([[x - 0.1, y + d + 0.1, z], [x + w + 0.1, y + d + 0.1, z], [x + w + 0.1, my, z + rise], [x - 0.1, my, z + rise]])} fill={c} stroke={shade(c, -0.25)} strokeWidth={1.5} />
    <polygon points={pts([[x + w + 0.1, y - 0.1, z], [x + w + 0.1, y + d + 0.1, z], [x + w + 0.1, my, z + rise]])} fill={shade(c, -0.3)} />
  </g>;
}
const Win = ({ x, y }) => <rect x={x} y={y} width={30} height={34} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={4} />;

function Home() {
  return <g>
    <FloorPlane z={0.006} x={0.8} y={0.8}><rect width={300} height={330} fill="#7aa84e" /><rect x={130} y={240} width={40} height={90} fill="#c9c6bc" /></FloorPlane>
    <Box x={1.0} y={1.0} w={2.4} d={1.8} h={1.6} c={['#e2b06a', '#d9a660', '#c4904e']} />
    <FaceY y={2.8} x0={1.0} z1={1.6}><Win x={20} y={20} /><Win x={190} y={20} /><Win x={20} y={95} /><rect x={110} y={80} width={40} height={80} fill="#c23b3b" /><Win x={190} y={95} /></FaceY>
    <Roof x={1.0} y={1.0} w={2.4} d={1.8} z={1.6} rise={0.9} c="#9a4a3a" />
    <Box x={2.8} y={1.3} z={2.0} w={0.25} d={0.25} h={0.7} c={['#b55a3e', '#9a4a3a', '#843f31']} />
  </g>;
}

function CoffeeShop() {
  return <g>
    <FloorPlane z={0.006} x={4.0} y={1.4}><rect width={200} height={290} fill="#c9c6bc" /></FloorPlane>
    <Box x={4.2} y={1.6} w={1.6} d={1.5} h={1.4} c={['#3a3a3c', '#e9dcc4', '#d6c8ab']} />
    <FaceY y={3.1} x0={4.2} z1={1.4}><rect x={0} y={0} width={160} height={30} fill="#2f6f6a" /><text x={80} y={22} textAnchor="middle" fontSize={18} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">CAFÉ</text><rect x={14} y={50} width={80} height={60} fill="#bcdcea" /><rect x={110} y={50} width={36} height={90} fill="#2f6f6a" /></FaceY>
    <polygon points={pts([[4.2, 3.1, 1.05], [5.8, 3.1, 1.05], [5.8, 3.5, 0.8], [4.2, 3.5, 0.8]])} fill="#e0524a" />
    {[0, 1, 2, 3].map(i => <polygon key={i} points={pts([[4.4 + i * 0.4, 3.1, 1.05], [4.6 + i * 0.4, 3.1, 1.05], [4.6 + i * 0.4, 3.5, 0.8], [4.4 + i * 0.4, 3.5, 0.8]])} fill="#fbf8f2" />)}
    <Box x={4.4} y={3.6} w={0.3} d={0.3} h={0.35} c={['#c9a777', '#b08f62', '#9c7e55']} /><Box x={5.2} y={3.6} w={0.3} d={0.3} h={0.35} c={['#c9a777', '#b08f62', '#9c7e55']} />
  </g>;
}

function School() {
  const brick = ['#c96a4a', '#b55a3e', '#9a4a3a'];
  return <g>
    <FloorPlane z={0.006} x={8.0} y={0.6}><rect width={580} height={360} fill="#9aa1a6" />{[0, 1, 2, 3, 4].map(i => <rect key={i} x={430 + (i % 2) * 40} y={60 + i * 40} width={36} height={36} fill="none" stroke="#f2c94c" strokeWidth={4} />)}</FloorPlane>
    <Box x={8.3} y={0.8} w={4.0} d={1.8} h={1.6} c={['#5b5f66', brick[1], brick[2]]} />
    <FaceY y={2.6} x0={8.3} z1={1.6}>{[0, 1, 2, 4, 5, 6].map(i => <Win key={i} x={15 + i * 55} y={25} />)}{[0, 1, 2, 4, 5, 6].map(i => <Win key={'b' + i} x={15 + i * 55} y={95} />)}<rect x={170} y={80} width={60} height={80} fill="#3f7fc4" /></FaceY>
    <Box x={9.9} y={1.2} z={1.6} w={0.8} d={0.8} h={0.9} c={['#5b5f66', brick[1], brick[2]]} />
    <FaceY y={2.0} x0={9.9} z1={2.5}><circle cx={40} cy={40} r={26} fill="#fbf8f2" stroke="#3a3a3c" strokeWidth={3} /><line x1={40} y1={40} x2={40} y2={22} stroke="#3a3a3c" strokeWidth={3} /><line x1={40} y1={40} x2={54} y2={40} stroke="#3a3a3c" strokeWidth={3} /></FaceY>
    {ln([12.9, 1.0, 0], [12.9, 1.0, 2.4], '#9aa1a6', 3, 'flag')}
    <FaceY y={1.0} x0={12.9} z1={2.4}><rect x={0} y={0} width={40} height={26} fill="#3f7fc4" /><circle cx={20} cy={13} r={6} fill="#f2c94c" /></FaceY>
  </g>;
}

function Park() {
  return <g>
    <FloorPlane z={0.006} x={0.6} y={6.0}><rect width={540} height={360} rx={30} fill="#9cc95a" /><ellipse cx={380} cy={230} rx={110} ry={70} fill="#4f9fc4" /><path d="M0,120 C150,140 250,60 540,90" stroke="#e3d3ae" strokeWidth={30} fill="none" /><circle cx={130} cy={260} r={60} fill="#e9875a" /></FloorPlane>
    {ln([1.2, 8.3, 0], [1.2, 7.9, 1.0], '#3f7fc4', 4, 'a')}{ln([2.4, 8.3, 0], [2.4, 7.9, 1.0], '#3f7fc4', 4, 'b')}{ln([1.2, 7.5, 0], [1.2, 7.9, 1.0], '#3f7fc4', 4, 'c')}{ln([2.4, 7.5, 0], [2.4, 7.9, 1.0], '#3f7fc4', 4, 'd')}{ln([1.2, 7.9, 1.0], [2.4, 7.9, 1.0], '#336aa6', 5, 'e')}
    {ln([1.6, 7.9, 1.0], [1.6, 7.9, 0.35], '#9aa1a6', 1.5, 'f')}{ln([2.0, 7.9, 1.0], [2.0, 7.9, 0.35], '#9aa1a6', 1.5, 'g')}
    <Box x={3.0} y={6.6} w={0.5} d={0.5} h={1.0} c={['#e0524a', '#c4433c', '#ab3832']} />
    <polygon points={pts([[3.1, 7.1, 1.0], [3.4, 7.1, 1.0], [3.4, 8.0, 0.1], [3.1, 8.0, 0.1]])} fill="#f2c94c" />
    <Tree x={0.9} y={6.4} /><Tree x={5.6} y={6.5} s={1.1} /><Tree x={5.7} y={9.1} /><Tree x={0.9} y={9.3} s={0.9} />
  </g>;
}

function Supermarket() {
  return <g>
    <FloorPlane z={0.006} x={8.0} y={6.0}><rect width={580} height={380} fill="#6b6f74" />{[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={40 + i * 60} x2={40 + i * 60} y1={260} y2={360} stroke="#fbf8f2" strokeWidth={4} />)}</FloorPlane>
    <Box x={8.3} y={6.3} w={5.0} d={2.0} h={1.3} c={['#c9ced2', '#fbf8f2', '#e6e3da']} />
    <FaceY y={8.3} x0={8.3} z1={1.3}><rect x={0} y={0} width={500} height={34} fill="#3f8a5a" /><text x={250} y={25} textAnchor="middle" fontSize={22} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">SUPERMARKET</text><rect x={30} y={50} width={440} height={60} fill="#bcdcea" /><rect x={210} y={50} width={80} height={80} fill="#9fb6bf" stroke="#fbf8f2" strokeWidth={3} /></FaceY>
    {[[9.0, '#e0524a'], [10.4, '#3f7fc4'], [12.4, '#f2c94c']].map(([x, c], i) => <g key={i}><Box x={x} y={8.9} w={0.45} d={0.8} h={0.3} c={[c, c, shade(c, -0.2)]} /><Box x={x + 0.05} y={9.1} z={0.3} w={0.35} d={0.45} h={0.2} c={['#bcdcea', shade(c, -0.1), shade(c, -0.25)]} /></g>)}
  </g>;
}

function NannyHouse() {
  return <g>
    <FloorPlane z={0.006} x={14.3} y={0.8}><rect width={250} height={300} fill="#7aa84e" /><rect x={95} y={210} width={40} height={90} fill="#c9c6bc" />{[[30, 240, '#f39ac6'], [55, 268, '#f2c94c'], [190, 240, '#e0524a'], [215, 270, '#f39ac6']].map(([a, b, c], i) => <circle key={i} cx={a} cy={b} r={10} fill={c} />)}</FloorPlane>
    <Box x={14.5} y={1.0} w={2.0} d={1.6} h={1.3} c={['#efe2c4', '#efe2c4', '#dccba6']} />
    <FaceY y={2.6} x0={14.5} z1={1.3}><Win x={18} y={18} /><Win x={150} y={18} /><Win x={18} y={82} /><rect x={86} y={62} width={30} height={68} fill="#4a6a52" /><Win x={150} y={82} /></FaceY>
    <Roof x={14.5} y={1.0} w={2.0} d={1.6} z={1.3} rise={0.8} c="#7a4a3a" />
    <Box x={14.8} y={1.2} z={1.7} w={0.25} d={0.25} h={0.6} c={['#b55a3e', '#9a4a3a', '#843f31']} />
  </g>;
}

const DRAW = { home: Home, cafe: CoffeeShop, school: School, park: Park, shop: Supermarket, nanny: NannyHouse };

function TownMapScene({ onPick, here = 'home' }) {
  const [hover, setHover] = React.useState(null);
  return <IsoStage cx={1150} cy={740} zoom={0.82} label="Town map" defs={null}>
    <Ground />
    <Roads />
    <Tree x={6.2} y={0.4} /><Tree x={7.8} y={4.1} s={0.8} /><Tree x={13.6} y={4.0} s={0.9} /><Tree x={0.4} y={4.0} s={0.8} />
    {LOCS.map(l => { const Draw = DRAW[l.id], on = hover === l.id; return <a key={l.id} href={l.href} onClick={(e) => { if (onPick) { e.preventDefault(); onPick(l.id); } }}
      onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
      <g transform={on ? 'translate(0 -8)' : undefined}><Draw /></g>
    </a>; })}
    {LOCS.map(l => <Tag key={l.id} at={l.tag} text={l.id === here ? l.name + ' (you are here)' : l.name} />)}
    <text x={1150} y={300} textAnchor="middle" fontSize={44} fontWeight="800" fill="#3b2a24" fontFamily="'Baloo 2', sans-serif">Where shall we go?</text>
  </IsoStage>;
}
window.TownMapScene = TownMapScene;
