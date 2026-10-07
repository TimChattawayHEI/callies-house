// Supermarket. Static scenery with idle-animated NPCs. Exports window.SupermarketScene.
// Back-left wall (y = 0): meat, dairy, frozen and bakery chillers. Back-right wall (x = 0): fruit & veg crates.
// Middle: 8 numbered aisles (9 shelf runs). Front: magazine rack, 3 staffed tills, 4 self-checkouts, trolleys + baskets.
// Near end (x = RX, cut low): automatic doors → Street / car park.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const RX = 18, RY = 13, RH = 4.2;
const DOOR = { y0: 10.8, y1: 12.6 };   // near end → Street / car park
const SHELF = { x0: 2.4, step: 1.75, d: 0.7, y0: 2.2, y1: 7.6, h: 1.4 };
const AISLES = [
  ['Bread & Cereal', ['#e3b06a', '#f2c94c', '#c4863a', '#e85a3a', '#fbf8f2']],
  ['Tins & Pasta', ['#d9465f', '#c9ced2', '#f2c94c', '#3f7fc4', '#e98a3a']],
  ['Snacks & Sweets', ['#7a4fd1', '#e85a7a', '#f2c94c', '#3fb6c9', '#e0524a']],
  ['Drinks', ['#3f9a52', '#e0524a', '#3f7fc4', '#f2a127', '#9fd6c8']],
  ['Baking & Breakfast', ['#fbf8f2', '#e3b06a', '#8a5a3a', '#f7c6d6', '#5fbf6a']],
  ['Household', ['#3fb6c9', '#fbf8f2', '#5fbf6a', '#f2c94c', '#7a4fd1']],
  ['Toys & Games', ['#e0524a', '#f2c94c', '#3f7fc4', '#5fbf6a', '#f39ac6']],
  ['Baby & Health', ['#bcdcea', '#f7c6d6', '#fbf8f2', '#9fd6c8', '#e9d8b4']],
];
const GRN = ['#3f8a5a', '#33744a', '#2b633f'], DARK = ['#3a3a3c', '#2a2a2c', '#202022'], STEEL = ['#c9ced2', '#aeb4b9', '#9aa1a6'];
const STAFF = { top: '#3f8a5a', legs: '#2a2a2c', shoes: '#2a2a2c' };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

function Floor() {
  const l = [];
  for (let i = 1; i < RX * 2; i++) l.push(<line key={'v' + i} x1={i * 50} x2={i * 50} y1={0} y2={RY * 100} stroke="#d6d4ce" strokeWidth={2} />);
  for (let j = 1; j < RY * 2; j++) l.push(<line key={'h' + j} x1={0} x2={RX * 100} y1={j * 50} y2={j * 50} stroke="#d6d4ce" strokeWidth={2} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#ecebe6" />{l}</FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#f4f2ec" />
    <BackWallX RY={RY} RH={RH} fill="#e6e3da" />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={3.0} z1={3.5} fill="#3f8a5a" />
    <StripX y0={0} y1={RY} z0={3.0} z1={3.5} fill="#33744a" />
    <StripY x0={0} x1={RX} z0={0} z1={0.15} fill="#9aa1a6" />
    <StripX y0={0} y1={RY} z0={0} z1={0.15} fill="#8a9196" />
  </g>;
}

function SectionSign({ x0, w, text, wall = 'y', y1 }) {
  const art = <g><rect x={0} y={0} width={w * 100} height={34} rx={4} fill="#fbf8f2" /><text x={w * 50} y={24} textAnchor="middle" fontSize={20} fontWeight="800" fill="#2b633f" fontFamily="'Baloo 2', sans-serif">{text}</text></g>;
  return wall === 'y' ? <FaceY y={0.02} x0={x0} z1={3.42}>{art}</FaceY> : <FaceX x={0.02} y1={y1} z1={3.42}>{art}</FaceX>;
}

// ---------- Back wall chillers ----------
function Chiller({ x0, w, kind }) {
  const d = 0.85, h = 2.2, rows = 4, items = [];
  const pal = { meat: ['#d9465f', '#e87a8a', '#c4433c', '#f4b6c4'], dairy: ['#fbf8f2', '#bcdcea', '#f2c94c', '#9fd6c8'], frozen: ['#bcdcea', '#3f7fc4', '#fbf8f2', '#e98a3a'], bakery: ['#e3b06a', '#c4863a', '#f2e3b0', '#8a5a3a'] }[kind];
  for (let r = 0; r < rows; r++) for (let k = 0; k < Math.floor(w * 100 / 18); k++) { const hh = kind === 'dairy' ? 22 + (k % 3) * 6 : 14 + rnd(k + r * 31) * 8; items.push(<rect key={r + '-' + k} x={6 + k * 18} y={30 + r * 46 + (34 - hh)} width={14} height={hh} rx={kind === 'bakery' ? 7 : 2} fill={pal[(k + r) % 4]} />); }
  return <g>
    <Box x={x0} y={0} w={w} d={d} h={h} c={kind === 'frozen' ? ['#e6eef2', '#dfe8ec', '#c9d6dc'] : ['#e6e3da', '#d6d2c6', '#c4bfb2']} />
    <FaceY y={d} x0={x0} z1={h}>
      <rect x={4} y={14} width={w * 100 - 8} height={h * 100 - 40} fill={kind === 'bakery' ? '#f2e6cf' : '#dfeef4'} />
      {[0, 1, 2, 3].map(r => <rect key={r} x={4} y={64 + r * 46} width={w * 100 - 8} height={4} fill="#9aa1a6" />)}
      {items}
      {kind === 'frozen' && Array.from({ length: Math.floor(w / 0.9) }, (_, i) => <g key={i}><rect x={4 + i * 90} y={14} width={88} height={h * 100 - 40} fill="#d4ecf0" fillOpacity={.25} stroke="#9aa1a6" strokeWidth={2} /><rect x={80 + i * 90} y={80} width={4} height={50} rx={2} fill="#9aa1a6" /></g>)}
      <rect x={0} y={0} width={w * 100} height={12} fill="#3f8a5a" />
      <rect x={0} y={h * 100 - 26} width={w * 100} height={26} fill="#5b5f66" />
    </FaceY>
  </g>;
}

// ---------- Fruit & veg wall ----------
function VegStand() {
  const crates = [['#e0524a', 'apples'], ['#f2a127', 'oranges'], ['#f2c94c', 'bananas'], ['#5f9a3e', 'broccoli'], ['#e98a3a', 'carrots'], ['#b08757', 'potatoes'], ['#86b55a', 'lettuce'], ['#7a4f8a', 'grapes'], ['#d9465f', 'tomatoes'], ['#f2e3b0', 'onions']];
  return <g>
    <Box x={0} y={1.0} w={1.4} d={7.0} h={0.75} c={['#b8875a', '#9a6e47', '#85603c']} />
    {crates.map(([c, n], i) => { const y = 1.05 + i * 0.69, back = i % 2 === 0; return <g key={n}>
      <Box x={0.05} y={y} z={0.75} w={0.6} d={0.62} h={back ? 0.35 : 0.2} c={['#c9a777', '#b08f62', '#9c7e55']} />
      <Box x={0.7} y={y} z={0.75} w={0.62} d={0.62} h={0.12} c={['#c9a777', '#b08f62', '#9c7e55']} />
      <FloorPlane z={0.75 + (back ? 0.351 : 0.201)} x={0.07} y={y + 0.02}>{Array.from({ length: 9 }, (_, k) => <circle key={k} cx={10 + (k % 3) * 20} cy={10 + Math.floor(k / 3) * 20} r={n === 'bananas' || n === 'carrots' ? 7 : 9} fill={shade(c, (k % 2) * 0.1)} />)}</FloorPlane>
      <FloorPlane z={0.871} x={0.72} y={y + 0.02}>{Array.from({ length: 9 }, (_, k) => <circle key={k} cx={10 + (k % 3) * 20} cy={10 + Math.floor(k / 3) * 20} r={9} fill={shade(crates[(i + 3) % 10][0], (k % 2) * 0.1)} />)}</FloorPlane>
    </g>; })}
    {/* scales + bags */}
    <Box x={0.2} y={8.2} w={0.5} d={0.5} h={1.1} c={STEEL} />
    <FaceX x={0.7} y1={8.65} z1={1.05}><rect x={4} y={4} width={36} height={22} fill="#2a2a2c" /><text x={22} y={20} textAnchor="middle" fontSize={10} fill="#5eea6b" fontFamily="monospace">0.00</text></FaceX>
  </g>;
}

// ---------- Aisles ----------
function ShelfRun({ i }) {
  const { x0, step, d, y0, y1, h } = SHELF, x = x0 + i * step, len = y1 - y0;
  const pal = i < 8 ? AISLES[i][1] : ['#5fbf6a', '#c4863a', '#f2c94c', '#8a6a4a', '#3fb6c9'], toys = i === 6, items = [];
  // products on the +x face (the side you see) belong to aisle i
  for (let r = 0; r < 3; r++) {
    let px = 6;
    for (let k = 0; px < len * 100 - 16; k++) {
      const w = toys ? 22 + rnd(k + r * 7 + i * 99) * 18 : 12 + rnd(k + r * 7 + i * 99) * 12, hh = toys ? 30 + rnd(k * 3 + r) * 8 : 18 + rnd(k * 5 + r + i) * 18, c = pal[(k + r) % 5];
      items.push(toys && k % 4 === 1
        ? <g key={r + '-' + k}><circle cx={px + 12} cy={r * 46 + 36} r={11} fill="#c4863a" /><circle cx={px + 4} cy={r * 46 + 26} r={5} fill="#c4863a" /><circle cx={px + 20} cy={r * 46 + 26} r={5} fill="#c4863a" /></g>
        : <rect key={r + '-' + k} x={px} y={r * 46 + 44 - hh} width={w - 3} height={hh} rx={i === 3 ? 5 : 1.5} fill={c} stroke="rgba(0,0,0,.12)" strokeWidth={1} />);
      px += w;
    }
  }
  return <g>
    <Box x={x} y={y0} w={d} d={len} h={h} c={['#e6e3da', '#d6d2c6', '#c9c4b8']} />
    <FaceX x={x + d} y1={y1} z1={h - 0.05}>
      <rect x={0} y={0} width={len * 100} height={h * 100 - 5} fill="#f4f2ec" />
      {items}
      {[0, 1, 2].map(r => <rect key={r} x={0} y={r * 46 + 44} width={len * 100} height={5} fill="#c9ced2" />)}
      {[1, 2].map(r => <rect key={'t' + r} x={10} y={r * 46 + 44} width={len * 100 - 20} height={5} fill="#f2c94c" opacity={.5} />)}
    </FaceX>
    {/* end cap with a promo stack */}
    <FaceY y={y1} x0={x} z1={h}><rect x={0} y={0} width={d * 100} height={h * 100} fill="#e6e3da" />{[0, 1].map(r => <g key={r}>{[0, 1, 2].map(k => <rect key={k} x={6 + k * 21} y={30 + r * 52} width={18} height={40} rx={2} fill={AISLES[(i + r) % 8][1][k]} />)}</g>)}<rect x={0} y={0} width={d * 100} height={20} fill="#e0524a" /><text x={d * 50} y={15} textAnchor="middle" fontSize={11} fontWeight="800" fill="#fff" fontFamily="'Baloo 2', sans-serif">OFFER</text></FaceY>
  </g>;
}

function AisleSign({ i }) {
  const x = SHELF.x0 + i * SHELF.step + SHELF.d + (SHELF.step - SHELF.d) / 2, y = SHELF.y1 - 0.3;
  return <g>
    {ln([x, y, RH], [x, y, 3.25], '#9aa1a6', 1.5, 'w')}
    <FaceY y={y} x0={x - 0.55} z1={3.25}>
      <rect x={0} y={0} width={110} height={44} rx={5} fill="#3f8a5a" />
      <circle cx={18} cy={22} r={13} fill="#fbf8f2" /><text x={18} y={28} textAnchor="middle" fontSize={16} fontWeight="800" fill="#3f8a5a" fontFamily="'Baloo 2', sans-serif">{i + 1}</text>
      <text x={70} y={27} textAnchor="middle" fontSize={AISLES[i][0].length > 13 ? 9.5 : 11} fontWeight="700" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">{AISLES[i][0]}</text>
    </FaceY>
  </g>;
}

// ---------- Trolleys + baskets ----------
function Trolley({ x, y, full, flip }) {
  const w = 0.55, d = 0.85, z = 0.45, h = 0.5;
  const goods = full ? [['#e0524a', 0.1], ['#f2c94c', 0.25], ['#3f7fc4', 0.4], ['#5fbf6a', 0.55]] : [];
  return <g>
    {[[x, y], [x + w, y], [x, y + d], [x + w, y + d]].map(([a, b], i) => <circle key={i} cx={P(a, b, 0.05)[0]} cy={P(a, b, 0.05)[1]} r={4} fill="#2a2a2c" />)}
    {ln([x + 0.05, y + 0.1, 0.06], [x + 0.05, y + 0.1, z], '#9aa1a6', 2.5, 'a')}{ln([x + w - 0.05, y + 0.1, 0.06], [x + w - 0.05, y + 0.1, z], '#9aa1a6', 2.5, 'b')}
    {ln([x + 0.05, y + d - 0.1, 0.06], [x + 0.05, y + d - 0.1, z], '#9aa1a6', 2.5, 'c')}{ln([x + w - 0.05, y + d - 0.1, 0.06], [x + w - 0.05, y + d - 0.1, z], '#9aa1a6', 2.5, 'd')}
    {goods.map(([c, dy], i) => <Box key={i} x={x + 0.08 + (i % 2) * 0.2} y={y + dy} z={z} w={0.22} d={0.16} h={0.3 + (i % 2) * 0.1} c={[c, c, shade(c, -0.15)]} />)}
    <polygon points={pts([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]])} fill="none" stroke="#aeb4b9" strokeWidth={2} />
    <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill="#c9ced2" fillOpacity={.25} stroke="#aeb4b9" strokeWidth={2} />
    <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill="#c9ced2" fillOpacity={.25} stroke="#aeb4b9" strokeWidth={2} />
    {[0.25, 0.5, 0.75].map(t => ln([x + w, y + d * t, z], [x + w, y + d * t, z + h], '#aeb4b9', 1.2, 'g' + t))}
    {ln([x, y + (flip ? d + 0.15 : -0.15), z + h + 0.1], [x + w, y + (flip ? d + 0.15 : -0.15), z + h + 0.1], '#3f8a5a', 5, 'handle')}
  </g>;
}
function TrolleyBay() { return <g>{[0, 1, 2, 3].map(i => <Trolley key={i} x={16.2} y={9.0 + i * 0.28} />)}</g>; }
function BasketStack({ x, y }) {
  return <g>{[0, 1, 2, 3, 4, 5].map(i => <Box key={i} x={x} y={y} z={i * 0.09} w={0.55} d={0.4} h={0.1} c={['#3f8a5a', '#33744a', '#2b633f']} />)}<Box x={x} y={y} z={0.54} w={0.55} d={0.4} h={0.18} c={['#4f9a6a', '#33744a', '#2b633f']} /></g>;
}

// ---------- Front of store ----------
function MagazineRack() {
  const cols = ['#e85a7a', '#3f7fc4', '#f2c94c', '#7a4fd1', '#5fbf6a', '#e0524a', '#3fb6c9', '#f39ac6'];
  return <g>
    <Box x={1.0} y={9.0} w={2.6} d={0.5} h={1.7} c={['#e6e3da', '#d6d2c6', '#c9c4b8']} />
    <FaceY y={9.5} x0={1.0} z1={1.7}>{[0, 1, 2].map(r => <g key={r}>{Array.from({ length: 8 }, (_, k) => <g key={k}><rect x={6 + k * 31} y={8 + r * 54} width={28} height={40} fill={cols[(k + r * 3) % 8]} /><rect x={9 + k * 31} y={12 + r * 54} width={22} height={6} fill="#fbf8f2" /><circle cx={20 + k * 31} cy={34 + r * 54} r={7} fill="#fbf8f2" opacity={.7} /></g>)}<rect x={0} y={48 + r * 54} width={260} height={5} fill="#c9ced2" /></g>)}</FaceY>
    <FaceY y={9.0} x0={1.0} z1={2.15}><rect x={0} y={0} width={260} height={34} rx={4} fill="#fbf8f2" /><text x={130} y={24} textAnchor="middle" fontSize={18} fontWeight="800" fill="#2b633f" fontFamily="'Baloo 2', sans-serif">MAGAZINES</text></FaceY>
  </g>;
}

const TILL_Y = 9.6;
function Till({ x, n }) {
  return <g>
    <Box x={x} y={TILL_Y} w={1.8} d={0.6} h={0.85} c={['#e6e3da', '#d6d2c6', '#c9c4b8']} />
    <Box x={x + 0.05} y={TILL_Y + 0.08} z={0.85} w={1.2} d={0.44} h={0.03} c={DARK} />
    <Box x={x + 1.3} y={TILL_Y + 0.05} z={0.85} w={0.45} d={0.5} h={0.05} c={STEEL} />
    <Box x={x + 1.45} y={TILL_Y + 0.1} z={0.9} w={0.08} d={0.08} h={0.4} c={DARK} />
    <FaceX x={x + 1.53} y1={TILL_Y + 0.35} z1={1.5}><rect x={0} y={0} width={30} height={24} fill="#2a2a2c" /><rect x={3} y={3} width={24} height={18} fill="#8fd0e0" /></FaceX>
    {ln([x + 1.8, TILL_Y + 0.3, 0.85], [x + 1.8, TILL_Y + 0.3, 2.4], '#9aa1a6', 3, 'pole')}
    <FaceY y={TILL_Y + 0.3} x0={x + 1.62} z1={2.75}><rect x={0} y={0} width={36} height={36} rx={6} fill="#3f8a5a" /><text x={18} y={26} textAnchor="middle" fontSize={20} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">{n}</text></FaceY>
  </g>;
}
function TillShopping({ x }) {
  return <g>{[['#e0524a', 0.1], ['#f2c94c', 0.35], ['#fbf8f2', 0.55], ['#5fbf6a', 0.8]].map(([c, dx], i) => <Box key={i} x={x + dx} y={TILL_Y + 0.15} z={0.88} w={0.18} d={0.18} h={0.14 + (i % 2) * 0.1} c={[c, c, shade(c, -0.15)]} />)}</g>;
}

function SelfCheckout({ x }) {
  const y = TILL_Y;
  return <g>
    <Box x={x} y={y} w={0.6} d={0.5} h={0.95} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />
    <Box x={x + 0.62} y={y} w={0.4} d={0.5} h={0.8} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />
    <Box x={x + 0.62} y={y + 0.05} z={0.8} w={0.4} d={0.4} h={0.03} c={DARK} />
    <Box x={x + 0.1} y={y + 0.05} z={0.95} w={0.4} d={0.08} h={0.45} c={DARK} />
    <FaceY y={y + 0.13} x0={x + 0.12} z1={1.38}><rect x={0} y={0} width={36} height={40} fill="#8fd0e0" /><rect x={4} y={28} width={28} height={8} rx={3} fill="#5fbf6a" /></FaceY>
    <FaceY y={y + 0.5} x0={x} z1={0.8}><rect x={10} y={10} width={40} height={12} rx={3} fill="#2a2a2c" /><rect x={20} y={30} width={20} height={14} fill="#5b5f66" /></FaceY>
    {ln([x + 0.5, y + 0.1, 0.95], [x + 0.5, y + 0.1, 1.9], '#9aa1a6', 2, 'p')}
    <FloorPlane z={1.9} x={x + 0.4} y={y}><circle cx={10} cy={10} r={9} fill="#5fbf6a" /></FloorPlane>
  </g>;
}

function FlowerBuckets() {
  return <g>{[0, 1, 2].map(i => { const x = 13.8 + i * 0.5, y = 12.1; const [fx, fy] = P(x + 0.18, y + 0.18, 0.45); return <g key={i}>
    <Box x={x} y={y} w={0.36} d={0.36} h={0.42} c={DARK} />
    {Array.from({ length: 7 }, (_, k) => <g key={k}><line x1={fx} y1={fy} x2={fx - 14 + k * 5} y2={fy - 34 - (k % 3) * 6} stroke="#5f9a3e" strokeWidth={2} /><circle cx={fx - 14 + k * 5} cy={fy - 36 - (k % 3) * 6} r={5} fill={['#e85a7a', '#f2c94c', '#f4f2ee'][i]} /></g>)}
  </g>; })}</g>;
}

// Doorway → Street / car park (automatic sliding doors in the near end wall)
function EntranceDoors() {
  return <g>
    <FloorPlane z={0.005} x={RX - 0.9} y={DOOR.y0}><rect x={0} y={0} width={90} height={(DOOR.y1 - DOOR.y0) * 100} fill="#5b5f66" /></FloorPlane>
    <FloorPlane z={0.006} x={RX} y={DOOR.y0}><rect x={0} y={0} width={20} height={(DOOR.y1 - DOOR.y0) * 100} fill="#9aa1a6" /></FloorPlane>
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

function SupermarketScene({ showLabels = true, animate = true }) {
  const T = useClock(!animate);
  const L = showLabels;
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const ax = (i) => SHELF.x0 + i * SHELF.step + SHELF.d + (SHELF.step - SHELF.d) / 2;   // aisle i centre-line
  const stat = React.useMemo(() => <>
    <Slab RX={RX} RY={RY} /><Floor /><Walls />
    <Chiller x0={1.6} w={4.0} kind="meat" /><Chiller x0={5.7} w={3.8} kind="dairy" /><Chiller x0={9.6} w={4.6} kind="frozen" /><Chiller x0={14.3} w={3.5} kind="bakery" />
    <SectionSign x0={2.6} w={2.0} text="MEAT" /><SectionSign x0={6.6} w={2.0} text="DAIRY" /><SectionSign x0={10.9} w={2.0} text="FROZEN" /><SectionSign x0={15.05} w={2.0} text="BAKERY" />
    <SectionSign wall="x" y1={5.8} w={2.6} text="FRUIT & VEG" />
    <VegStand />
  </>, []);
  // NPCs inside each aisle, drawn between shelf runs so the nearer shelf hides them correctly
  const inAisle = [
    [adult({ at: [ax(0), 4.0, 0], look: LOOKS.mum, ph: 1, armL: 40, armR: 40 }), <Trolley key="t0" x={ax(0) - 0.27} y={4.25} full />],
    [kid({ at: [ax(1), 5.2, 0], look: LOOKS.boyRed, ph: 2, pose: 'reach', facing: 'back' })],
    [adult({ at: [ax(2) + 0.1, 3.3, 0], look: LOOKS.dad, ph: 3, pose: 'reach', facing: 'back' }), kid({ at: [ax(2) - 0.2, 3.9, 0], look: LOOKS.girlBlue, ph: 4, pose: 'wave' })],
    [adult({ at: [ax(3), 6.4, 0], look: { ...LOOKS.boyGreen, ...STAFF, long: true }, ph: 5, pose: 'reach', facing: 'back' }), <Box key="crate" x={ax(3) - 0.5} y={6.6} w={0.45} d={0.4} h={0.35} c={['#d8b484', '#c49c69', '#b08757']} />],
    [],
    [adult({ at: [ax(5), 3.5, 0], look: LOOKS.grandad, ph: 6, facing: 'back', armL: 40, armR: 40 }), <Trolley key="t5" x={ax(5) - 0.27} y={2.5} flip />],
    [kid({ at: [ax(6), 4.6, 0], look: LOOKS.girlPink, ph: 7, pose: 'reach', facing: 'back' }), kid({ at: [ax(6) + 0.2, 5.6, 0], look: LOOKS.boyCap, ph: 8, pose: 'wave' })],
    [adult({ at: [ax(7), 5.0, 0], look: LOOKS.mumBun, ph: 9, pose: 'reach', facing: 'back' })],
  ];
  return <IsoStage cx={1112} cy={940} zoom={0.6} label="Supermarket" defs={null}>
    {stat}
    {/* shoppers along the back chillers */}
    {adult({ at: [3.6, 1.35, 0], look: LOOKS.gran, ph: 10, facing: 'back', pose: 'reach' })}
    {adult({ at: [11.4, 1.3, 0], look: LOOKS.dad, ph: 11, facing: 'back', armR: 50 })}
    {kid({ at: [12.0, 1.5, 0], look: LOOKS.girlCurly, ph: 12, facing: 'back' })}
    {adult({ at: [1.9, 4.6, 0], look: LOOKS.mumBun, ph: 13, pose: 'reach', flip: true })}
    {Array.from({ length: 9 }, (_, i) => <g key={i}><ShelfRun i={i} />{i < 8 && inAisle[i]}</g>)}
    {AISLES.map((_, i) => <AisleSign key={i} i={i} />)}
    <BasketStack x={15.2} y={11.6} />
    <MagazineRack />
    {/* staffed tills: cashier behind, customer in front */}
    {[[4.6, 1, LOOKS.mum], [7.2, 2, LOOKS.boyGreen], [9.8, 3, LOOKS.gran]].map(([x, n, look], k) => <g key={n}>
      {adult({ at: [x + 1.45, TILL_Y - 0.35, 0], look: { ...look, ...STAFF, long: false }, ph: 20 + k, pose: k === 1 ? 'reach' : 'stand' })}
      <Till x={x} n={n} />
      {k !== 2 && <TillShopping x={x} />}
    </g>)}
    {/* self-checkouts */}
    {[12.6, 13.8, 15.0, 16.2].map(x => <SelfCheckout key={x} x={x} />)}
    <FaceY y={TILL_Y - 0.02} x0={13.4} z1={2.6}><rect x={0} y={0} width={200} height={32} rx={4} fill="#3f8a5a" /><text x={100} y={22} textAnchor="middle" fontSize={16} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">SELF CHECKOUT</text></FaceY>
    {adult({ at: [5.4, 10.6, 0], look: LOOKS.dad, ph: 30, facing: 'back', armR: 50 })}
    <Trolley x={4.2} y={10.4} full flip />
    {kid({ at: [4.47, 10.85, 0.9], look: LOOKS.girlBlue, ph: 31, pose: 'sit', shadow: false, armR: 120 })}
    {adult({ at: [8.0, 10.6, 0], look: LOOKS.mumBun, ph: 32, facing: 'back', pose: 'reach' })}
    {adult({ at: [13.0, 10.4, 0], look: LOOKS.grandad, ph: 33, facing: 'back', pose: 'reach' })}
    {adult({ at: [15.4, 10.4, 0], look: LOOKS.mum, ph: 34, facing: 'back', armL: 30, armR: 60 })}
    {kid({ at: [2.2, 10.2, 0], look: LOOKS.boyCap, ph: 35, facing: 'back', pose: 'reach' })}
    <TrolleyBay />
    <FlowerBuckets />
    <EntranceDoors />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.4]} text="Exit to street" />
  </IsoStage>;
}
window.SupermarketScene = SupermarketScene;
