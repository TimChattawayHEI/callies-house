// Clothes shop "Pocket & Hem". Iso scene + buy/try-on panel. Exports window.ClothesShopScene.
// Back-left wall (y = 0): folded-tops cubbies, shoe wall, arched mirror + shop logo. Back-right wall (x = 0): 3 fitting rooms, bench, plant.
// Middle: 4 clothes rails (tops, trousers, dresses, hoodies). Front: mannequin plinth, caps table, till. Near end (x = RX): door → Town.
// Clicking a rail / table / shoe wall / till opens the shop panel on that category. Saves coins, wardrobe and outfit to localStorage
// ('clothesShop:v1') and fires window 'outfit-change' {detail:{outfit, look}} whenever the worn outfit changes.
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const RX = 15, RY = 11, RH = 4;
const DOOR = { y0: 9.0, y1: 10.6 };
const PINK = '#c25a7a', INK = '#3b2a24', FONT = "'Baloo 2', sans-serif";
const PLAYER = { skin: '#f6d2b8', hair: '#c49a5e', style: 'pony' };

const CATS = [
  { id: 'tops', label: 'Tops', slot: 'body' },
  { id: 'dresses', label: 'Dresses', slot: 'body' },
  { id: 'bottoms', label: 'Trousers', slot: 'legs' },
  { id: 'shoes', label: 'Shoes', slot: 'shoes' },
  { id: 'caps', label: 'Caps', slot: 'cap' },
];
const ITEMS = [
  ['sunny-tee', 'tops', 'Sunny tee', '#f2c94c', 12], ['mint-tee', 'tops', 'Mint tee', '#7cc9a8', 12], ['berry-hoodie', 'tops', 'Berry hoodie', '#c25a7a', 25, { long: true }],
  ['navy-jumper', 'tops', 'Navy jumper', '#3d4a6b', 22, { long: true }], ['peach-blouse', 'tops', 'Peach blouse', '#f4a98a', 18], ['cloud-hoodie', 'tops', 'Cloud hoodie', '#f4f2ee', 24, { long: true }],
  ['sky-dress', 'dresses', 'Sky dress', '#5b9bd5', 0], ['party-dress', 'dresses', 'Party dress', '#f39ac6', 30], ['lilac-sundress', 'dresses', 'Lilac sundress', '#b9a3e3', 28],
  ['cherry-dress', 'dresses', 'Cherry dress', '#d9465f', 32], ['lemon-pinafore', 'dresses', 'Lemon pinafore', '#f2d36b', 26], ['forest-dress', 'dresses', 'Forest dress', '#3f8a5a', 30],
  ['white-leggings', 'bottoms', 'White leggings', '#f4f2ee', 0], ['denim-jeans', 'bottoms', 'Denim jeans', '#4f6fa3', 20], ['purple-leggings', 'bottoms', 'Purple leggings', '#9b7cc4', 14],
  ['khaki-trousers', 'bottoms', 'Khaki trousers', '#a8865a', 18], ['black-jeans', 'bottoms', 'Black jeans', '#2a2a2c', 20], ['pink-joggers', 'bottoms', 'Pink joggers', '#f6c9d7', 16],
  ['pink-trainers', 'shoes', 'Pink trainers', '#e96d9a', 0], ['white-trainers', 'shoes', 'White trainers', '#f4f2ee', 15], ['red-boots', 'shoes', 'Red boots', '#c4433c', 24],
  ['navy-pumps', 'shoes', 'Navy pumps', '#3b4a6b', 16], ['gold-sandals', 'shoes', 'Gold sandals', '#e3b04f', 20], ['green-wellies', 'shoes', 'Green wellies', '#5f9a3e', 18],
  ['no-cap', 'caps', 'No cap', null, 0], ['red-cap', 'caps', 'Red cap', '#d9465f', 10], ['blue-cap', 'caps', 'Blue cap', '#3f6e9a', 10],
  ['green-cap', 'caps', 'Green cap', '#3f8a5a', 10], ['sunny-cap', 'caps', 'Sunny cap', '#f2c94c', 10], ['lilac-cap', 'caps', 'Lilac cap', '#b9a3e3', 12],
].map(([id, cat, name, color, price, x]) => ({ id, cat, name, color, price, ...(x || {}) }));
const BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const catOf = (id) => CATS.find(c => c.id === id);
const START_OWNED = ITEMS.filter(i => i.price === 0).map(i => i.id);
const START_OUTFIT = { body: 'sky-dress', legs: 'white-leggings', shoes: 'pink-trainers', cap: 'no-cap' };

function lookFrom(o) {
  const b = BY_ID[o.body], cap = BY_ID[o.cap];
  return { ...PLAYER, top: b.color, dress: b.cat === 'dresses', long: !!b.long, legs: BY_ID[o.legs].color, shoes: BY_ID[o.shoes].color, ...(cap && cap.color ? { style: 'cap', cap: cap.color } : {}) };
}

// ---------- Scene ----------
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };
const G_TEE = 'M8,14 L22,8 L38,8 L52,14 L58,32 L50,35 L47,26 L47,78 L13,78 L13,26 L10,35 L2,32 Z';
const G_LONG = 'M8,14 L22,8 L38,8 L52,14 L58,62 L50,62 L47,28 L47,80 L13,80 L13,28 L10,62 L2,62 Z';
const G_DRESS = 'M20,8 L40,8 L44,32 L57,108 Q30,114 3,108 L16,32 Z';
const G_TROUSER = 'M12,10 H48 L51,104 H35 L30,40 L25,104 H9 Z';

function Floor() {
  const l = [];
  for (let j = 1; j < RY * 3; j++) l.push(<line key={j} x1={0} x2={RX * 100} y1={j * 33.3} y2={j * 33.3} stroke="#dcc39e" strokeWidth={2} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#ead6b8" />{l}
    <ellipse cx={720} cy={680} rx={300} ry={190} fill="#f3d6cf" stroke="#e7bfb6" strokeWidth={8} /></FloorPlane>;
}
function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#f6e6e0" /><BackWallX RY={RY} RH={RH} fill="#ead2ca" /><WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={3.7} z1={3.85} fill={PINK} /><StripX y0={0} y1={RY} z0={3.7} z1={3.85} fill={shade(PINK, -0.12)} />
    <StripY x0={0} x1={RX} z0={0} z1={0.14} fill="#c9a16a" /><StripX y0={0} y1={RY} z0={0} z1={0.14} fill="#b58e5a" />
  </g>;
}
const signArt = (w, text, size = 20) => <g><rect x={0} y={0} width={w} height={34} rx={6} fill="#fbf6ee" stroke={PINK} strokeWidth={2} /><text x={w / 2} y={24} textAnchor="middle" fontSize={size} fontWeight="800" fill={PINK} fontFamily={FONT}>{text}</text></g>;
const hit = (onOpen, cat) => ({ onClick: () => onOpen(cat), style: { cursor: 'pointer' } });

function Cubbies({ onOpen }) {
  const cols = ['#f2c94c', '#7cc9a8', '#c25a7a', '#3d4a6b', '#f4a98a', '#f4f2ee', '#5fa8d8', '#9b7cc4'];
  return <g {...hit(onOpen, 'tops')}>
    <Box x={1.0} y={0} w={5} d={0.55} h={2.5} c={WHITE} />
    <FaceY y={0.55} x0={1.0} z1={2.5}>
      {Array.from({ length: 20 }, (_, i) => { const c = i % 5, r = Math.floor(i / 5), x = c * 100, y = 12 + r * 58; return <g key={i}>
        <rect x={x + 5} y={y} width={90} height={52} fill="#efe6da" />
        {[0, 1, 2].map(k => <rect key={k} x={x + 12} y={y + 40 - k * 11} width={76} height={10} rx={3} fill={cols[(i * 3 + k) % 8]} stroke="rgba(0,0,0,.12)" />)}
      </g>; })}
    </FaceY>
    <FaceY y={0.02} x0={2.3} z1={3.3}>{signArt(240, 'TOPS & KNITS')}</FaceY>
  </g>;
}
function ShoeWall({ onOpen }) {
  const cols = ['#e96d9a', '#f4f2ee', '#c4433c', '#3b4a6b', '#e3b04f', '#5f9a3e'];
  return <g {...hit(onOpen, 'shoes')}>
    <Box x={7} y={0} w={3.2} d={0.35} h={2.3} c={['#f3e3dc', '#e6d0c6', '#d6bdb2']} />
    <FaceY y={0.35} x0={7} z1={2.3}>
      {[0, 1, 2, 3].map(r => <g key={r}>
        {Array.from({ length: 5 }, (_, k) => { const x = 14 + k * 61, y = 48 + r * 55, c = cols[(k + r * 2) % 6]; return <g key={k} fill={c} stroke="rgba(0,0,0,.18)">
          <path d={`M${x},${y} v-11 h9 l12,7 q5,2 5,4 z`} /><path d={`M${x + 22},${y} v-11 h9 l12,7 q5,2 5,4 z`} />
        </g>; })}
        <rect x={4} y={48 + r * 55} width={312} height={6} fill="#c9a16a" />
      </g>)}
    </FaceY>
    <FaceY y={0.02} x0={7.8} z1={3.0}>{signArt(160, 'SHOES')}</FaceY>
  </g>;
}
function MirrorLogo() {
  return <g>
    <FaceY y={0.02} x0={11.4} z1={2.7}>
      <path d="M0,260 V70 A70,70 0 0 1 140,70 V260 Z" fill="#d6ebf0" stroke="#c9a54a" strokeWidth={8} />
      <path d="M30,200 L95,60 M55,230 L115,100" stroke="#fff" strokeWidth={8} opacity={.6} strokeLinecap="round" />
    </FaceY>
    <FaceY y={0.02} x0={10.4} z1={3.55}><text x={220} y={44} textAnchor="middle" fontSize={46} fontWeight="800" fill={PINK} fontFamily={FONT}>Pocket &amp; Hem</text></FaceY>
  </g>;
}
function FittingRooms() {
  const D = [1.0, 2.7, 4.4, 6.1], curtain = ['#c25a7a', '#a84a68'];
  return <g>
    <FaceX x={0.02} y1={4.6} z1={3.4}>{signArt(220, 'FITTING ROOMS', 18)}</FaceX>
    <FaceX x={0.02} y1={4.2} z1={2.2}><rect x={10} y={0} width={120} height={190} rx={8} fill="#d6ebf0" stroke="#c9a54a" strokeWidth={6} /></FaceX>
    {D.map((y, i) => <g key={y}>
      <Box x={0} y={y} w={1.5} d={0.1} h={2.5} c={['#fbf6ee', '#efe2d6', '#e3d2c4']} />
      {i < 3 && <FaceX x={1.5} y1={D[i + 1]} z1={2.42}>
        {i === 1
          ? <g><path d="M0,0 H48 Q38,120 52,234 H0 Z" fill={curtain[0]} />{[12, 26, 40].map(x => <line key={x} x1={x} x2={x - 2} y1={4} y2={232} stroke={curtain[1]} strokeWidth={3} />)}</g>
          : <g><rect x={0} y={0} width={160} height={234} fill={curtain[0]} />{[20, 45, 70, 95, 120, 145].map(x => <line key={x} x1={x} x2={x} y1={4} y2={232} stroke={curtain[1]} strokeWidth={4} />)}</g>}
      </FaceX>}
    </g>)}
    <Box x={0} y={1.0} z={2.45} w={1.5} d={5.2} h={0.16} c={['#fbf6ee', '#efe2d6', '#e3d2c4']} />
    <Box x={0.2} y={7.0} w={0.8} d={1.4} h={0.45} c={['#e8a2b4', '#d68aa0', '#c4788e']} />
    <Box x={0.3} y={9.4} w={0.6} d={0.6} h={0.5} c={['#c9a16a', '#b58e5a', '#a07a4a']} />
    {(() => { const [x, y] = P(0.6, 9.7, 0.5); return <g>{[[-26, -40], [0, -64], [24, -42], [-12, -86], [14, -88], [0, -30]].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy} r={22} fill={['#5f9a3e', '#4f8a34', '#6fae4a'][i % 3]} />)}</g>; })()}
  </g>;
}

function Rail({ x0, x1, y, cat, path, len, onOpen }) {
  const items = ITEMS.filter(i => i.cat === cat && i.color), g = [];
  for (let x = x0 + 0.18, k = 0; x < x1 - 0.1; x += 0.17, k++) {
    const it = items[k % items.length];
    g.push(<FaceX key={k} x={x} y1={y + 0.3} z1={1.62}>
      <path d="M30,0 q-5,-1 -4,-6 q2,-4 6,-1" fill="none" stroke="#9aa1a6" strokeWidth={2} />
      <path d={path} fill={it.color} stroke="rgba(0,0,0,.18)" strokeWidth={1.5} />
      <path d="M30,2 L6,13 M30,2 L54,13" stroke="#8a6a4a" strokeWidth={3} strokeLinecap="round" />
    </FaceX>);
  }
  const mid = (x0 + x1) / 2;
  return <g {...hit(onOpen, cat)}>
    {ln([x0, y - 0.32, 0.02], [x0, y + 0.32, 0.02], '#8a9196', 4, 'f0')}
    {ln([x0, y, 0], [x0, y, 1.62], '#aeb4b9', 4, 'p0')}
    {ln([x0, y, 1.62], [x1, y, 1.62], '#aeb4b9', 4, 'bar')}
    {g}
    {ln([x1, y - 0.32, 0.02], [x1, y + 0.32, 0.02], '#8a9196', 4, 'f1')}
    {ln([x1, y, 0], [x1, y, 1.62], '#aeb4b9', 4, 'p1')}
    {ln([mid - 0.4, y, 1.62], [mid - 0.4, y, 1.8], '#aeb4b9', 2, 's0')}{ln([mid + 0.4, y, 1.62], [mid + 0.4, y, 1.8], '#aeb4b9', 2, 's1')}
    <FaceY y={y} x0={mid - 0.65} z1={2.14}>{signArt(130, len, 18)}</FaceY>
  </g>;
}

function Mannequin({ at, o }) {
  const [px, py] = P(...at), L = lookFrom(o), M = '#ece4d6', dress = L.dress;
  return <g transform={`translate(${px} ${py}) scale(1.05)`}>
    <ellipse cx={0} cy={0} rx={20} ry={6} fill={INK} />
    <rect x={-2.5} y={dress ? -48 : -60} width={5} height={dress ? 48 : 60} fill={INK} />
    {!dress && [-8, 8].map(x => <rect key={x} x={x - 5} y={-60} width={10} height={44} rx={5} fill={L.legs} />)}
    {[-1, 1].map(s => <g key={s} transform={`translate(${s * 15} -98) rotate(${s * -8})`}><rect x={-5} y={-3} width={10} height={42} rx={5} fill={M} /><rect x={-6} y={-4} width={12} height={L.long ? 36 : 14} rx={6} fill={L.top} /></g>)}
    {dress ? <path d="M-16,-106 L16,-106 L27,-46 Q0,-40 -27,-46Z" fill={L.top} /> : <path d="M-17,-106 L17,-106 L20,-56 Q0,-52 -20,-56Z" fill={L.top} />}
    <rect x={-5} y={-114} width={10} height={10} fill={M} /><ellipse cx={0} cy={-132} rx={20} ry={24} fill={M} />
  </g>;
}

function CapsTable({ onOpen }) {
  const cols = ['#d9465f', '#3f6e9a', '#3f8a5a', '#f2c94c', '#b9a3e3', '#d9465f'];
  return <g {...hit(onOpen, 'caps')}>
    <Box x={8.2} y={7.9} w={2.0} d={0.9} h={0.85} c={OAK} />
    {cols.map((c, i) => { const [x, y] = P(8.5 + (i % 3) * 0.6, 8.15 + Math.floor(i / 3) * 0.45, 0.85); return <g key={i} transform={`translate(${x} ${y})`} stroke="rgba(0,0,0,.18)">
      <path d="M4,-2 H28 Q28,4 18,4 H4Z" fill={shade(c, -0.2)} /><path d="M-14,0 A14,13 0 0 1 14,0 Z" fill={c} />
    </g>; })}
    <FaceY y={8.8} x0={8.6} z1={0.7}>{signArt(120, 'CAPS', 18)}</FaceY>
  </g>;
}
function Till({ onOpen, cat }) {
  return <g {...hit(onOpen, cat)}>
    <Box x={11.6} y={8.0} w={2.6} d={0.75} h={1.0} c={['#fbf6ee', '#e8a2b4', '#d68aa0']} />
    <Box x={12.9} y={8.15} z={1.0} w={0.5} d={0.42} h={0.22} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    <FaceX x={13.4} y1={8.5} z1={1.6}><rect x={0} y={0} width={30} height={34} rx={3} fill="#2a2a2c" /><rect x={3} y={3} width={24} height={20} fill="#8fd0e0" /></FaceX>
    {[0, 1].map(i => <g key={i}><Box x={11.8 + i * 0.45} y={8.25} z={1.0} w={0.36} d={0.22} h={0.42} c={['#f6e6e0', PINK, '#a84a68']} />
      {(() => { const a = P(11.88 + i * 0.45, 8.47, 1.42), b = P(12.08 + i * 0.45, 8.47, 1.42); return <path d={`M${a[0]},${a[1]} q${(b[0] - a[0]) / 2},-14 ${b[0] - a[0]},${b[1] - a[1]}`} fill="none" stroke="#a84a68" strokeWidth={2.5} />; })()}</g>)}
    {ln([12.9, 8.0, RH], [12.9, 8.0, 2.75], '#9aa1a6', 1.5, 'w')}
    <FaceY y={8.0} x0={12.3} z1={2.8}>{signArt(130, 'PAY HERE', 18)}</FaceY>
  </g>;
}
function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <FloorPlane z={0.005} x={RX - 0.9} y={DOOR.y0}><rect x={0} y={0} width={90} height={(DOOR.y1 - DOOR.y0) * 100} fill="#b58e5a" /></FloorPlane>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={DOOR.y0} h={h} c={c} />
    <Box x={RX} y={DOOR.y1} w={0.2} d={RY + 0.2 - DOOR.y1} h={h} c={c} />
  </g>;
}

// ---------- Shop panel ----------
const ICON = {
  tops: 'M18,10 L26,8 Q30,13 34,8 L42,10 L54,20 L48,28 L44,24 L44,52 L16,52 L16,24 L12,28 L6,20 Z',
  long: 'M18,10 L26,8 Q30,13 34,8 L42,10 L52,22 L54,48 L47,48 L44,28 L44,52 L16,52 L16,28 L13,48 L6,48 L8,22 Z',
  dresses: 'M23,8 L37,8 L39,22 L50,52 Q30,56 10,52 L21,22 Z',
  bottoms: 'M16,8 H44 L46,54 H34 L30,24 L26,54 H14 Z',
  shoes: 'M8,40 V28 Q8,24 12,24 H22 L30,32 Q46,34 52,40 Q54,46 48,46 H10 Q8,46 8,40 Z',
  caps: 'M10,38 A20,18 0 0 1 50,38 Z M30,38 H56 Q56,44 46,44 H30 Z',
};
function ItemIcon({ it, size = 56 }) {
  return <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block' }}>
    {it.color ? <path d={it.long ? ICON.long : ICON[it.cat]} fill={it.color} stroke="rgba(59,42,36,.25)" strokeWidth={1.5} strokeLinejoin="round" />
      : <g fill="none" stroke="#b9a497" strokeWidth={3}><circle cx={30} cy={30} r={16} strokeDasharray="5 4" /><line x1={19} y1={41} x2={41} y2={19} /></g>}
  </svg>;
}
const Coin = ({ s = 16 }) => <span style={{ width: s, height: s, borderRadius: '50%', background: '#f2c94c', boxShadow: 'inset 0 -2px 0 #d9a92c', display: 'inline-block', flex: 'none' }} />;
const pill = (on) => ({ border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14, padding: '5px 11px', borderRadius: 999, flex: 'none', whiteSpace: 'nowrap', background: on ? PINK : '#efe2d0', color: on ? '#fff' : INK });

function ShopPanel({ st, T, cat, setCat, sel, setSel, buy, wear, close, msg, waveUntil }) {
  const items = ITEMS.filter(i => i.cat === cat), it = sel && BY_ID[sel];
  const slot = it && catOf(it.cat).slot;
  const preview = it ? { ...st.outfit, [slot]: it.id } : st.outfit;
  const owned = it && st.owned.includes(it.id), wearing = it && st.outfit[slot] === it.id;
  let btn = { label: 'Tap something to try it on', off: true };
  if (it && wearing) btn = { label: 'Wearing it', off: true };
  else if (it && owned) btn = { label: 'Wear it', go: wear };
  else if (it && st.coins < it.price) btn = { label: `Need ${it.price - st.coins} more coins`, off: true };
  else if (it) btn = { label: `Buy for ${it.price}`, go: buy, coin: true };
  return <div style={{ position: 'absolute', top: 16, right: 16, bottom: 16, width: 'min(400px, calc(100% - 32px))', background: '#fbf6ee', borderRadius: 24, boxShadow: '0 20px 50px rgba(59,42,36,.25)', display: 'flex', flexDirection: 'column', fontFamily: FONT, color: INK, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px 10px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: PINK }}>Pocket &amp; Hem</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#8a6f62' }}>Clothes shop</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: INK, color: '#fff6ea', borderRadius: 999, padding: '5px 12px 5px 7px', fontWeight: 800, fontSize: 17 }}><Coin s={20} />{st.coins}</div>
      <button onClick={close} aria-label="Close shop" style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#efe2d0', color: INK, fontSize: 20, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, lineHeight: 1 }}>×</button>
    </div>
    <div style={{ margin: '0 16px', height: 'clamp(110px, 28vh, 220px)', flex: 'none', background: '#f3dcd4', borderRadius: 18, position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="842 238 160 210" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ display: 'block' }}>
        <ellipse cx={922} cy={432} rx={60} ry={10} fill="#e7c2b8" />
        <Person at={[0, 0, 0]} s={1.08} T={T} look={lookFrom(preview)} pose={T < waveUntil ? 'wave' : 'stand'} />
      </svg>
      <div style={{ position: 'absolute', left: 14, bottom: 10, fontSize: 13, fontWeight: 700, color: '#8a5a52' }}>{it && !wearing ? `Trying on: ${it.name}` : 'Your outfit'}</div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 5, padding: '10px 16px', flex: 'none' }}>
      {CATS.map(c => <button key={c.id} onClick={() => { setCat(c.id); setSel(null); }} style={pill(c.id === cat)}>{c.label}</button>)}
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {items.map(i => { const on = sel === i.id, has = st.owned.includes(i.id), worn = st.outfit[catOf(i.cat).slot] === i.id;
          return <button key={i.id} onClick={() => setSel(on ? null : i.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px 8px', borderRadius: 16, cursor: 'pointer', background: '#fff', border: `2px solid ${on ? PINK : '#efe2d0'}`, fontFamily: FONT, color: INK }}>
            {worn && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 11, fontWeight: 800, background: INK, color: '#fff6ea', borderRadius: 999, padding: '0 7px' }}>ON</span>}
            <div style={{ background: '#f6efe6', borderRadius: 12, padding: 4 }}><ItemIcon it={i} /></div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1, textAlign: 'center', textWrap: 'balance' }}>{i.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: has ? '#3f8a5a' : INK }}>{has ? 'Owned' : <><Coin s={13} />{i.price}</>}</div>
          </button>; })}
      </div>
    </div>
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #eadccb', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {msg && <div style={{ fontSize: 14, fontWeight: 700, color: '#3f8a5a', textAlign: 'center' }}>{msg}</div>}
      <button disabled={btn.off} onClick={btn.go} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16, border: 'none', fontFamily: FONT, fontWeight: 800, fontSize: 19, cursor: btn.off ? 'default' : 'pointer', background: btn.off ? '#efe2d0' : PINK, color: btn.off ? '#9a8478' : '#fff', boxShadow: btn.off ? 'none' : `0 4px 0 ${shade(PINK, -0.25)}` }}>
        {btn.label}{btn.coin && <Coin s={18} />}
      </button>
    </div>
  </div>;
}

// ---------- Root ----------
const KEY = 'clothesShop:v1';
function load(coins) {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.outfit && s.owned) return s; } catch (e) {}
  return { coins, owned: START_OWNED, outfit: START_OUTFIT };
}

function ClothesShopScene({ showLabels = true, animate = true, startingCoins = 60, panelOpen = true }) {
  const T = useClock(!animate);
  const [st, setSt] = React.useState(() => load(startingCoins));
  const [open, setOpen] = React.useState(panelOpen);
  const [cat, setCat] = React.useState('tops');
  const [sel, setSel] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const [waveUntil, setWaveUntil] = React.useState(-1);
  React.useEffect(() => setOpen(panelOpen), [panelOpen]);
  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('outfit-change', { detail: { outfit: st.outfit, look: lookFrom(st.outfit) } }));
  }, [st]);
  React.useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 2600); return () => clearTimeout(t); }, [msg]);
  const onOpen = React.useCallback((c) => { setOpen(true); setCat(c); setSel(null); }, []);
  const equip = (s, it) => ({ ...s.outfit, [catOf(it.cat).slot]: it.id });
  const buy = () => { const it = BY_ID[sel]; setSt(s => ({ coins: s.coins - it.price, owned: [...s.owned, it.id], outfit: equip(s, it) })); setMsg(`${it.name} is in your wardrobe`); setWaveUntil(T + 1.6); };
  const wear = () => { const it = BY_ID[sel]; setSt(s => ({ ...s, outfit: equip(s, it) })); setWaveUntil(T + 1.2); };

  const L = showLabels;
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: PINK, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#f6e6e0' };
  const stat = React.useMemo(() => <>
    <Slab RX={RX} RY={RY} /><Floor /><Walls />
    <Cubbies onOpen={onOpen} /><ShoeWall onOpen={onOpen} /><MirrorLogo /><FittingRooms />
  </>, [onOpen]);
  return <div style={{ position: 'absolute', inset: 0 }}>
    <IsoStage cx={open ? 1290 : 1074} cy={826} zoom={0.68} label="Clothes Shop" defs={null}>
      {stat}
      {adult({ at: [3.4, 1.05, 0], look: { ...LOOKS.mumBun, ...STAFF }, ph: 1, facing: 'back', pose: 'reach' })}
      {kid({ at: [12.1, 1.2, 0], look: LOOKS.girlPink, ph: 2, facing: 'back', pose: 'wave' })}
      {adult({ at: [0.6, 7.7, 0.45], look: LOOKS.dad, ph: 3, pose: 'sit' })}
      <Rail x0={3} x1={6} y={3.2} cat="tops" path={G_TEE} len="TOPS" onOpen={onOpen} />
      <Rail x0={8} x1={11} y={3.2} cat="dresses" path={G_DRESS} len="DRESSES" onOpen={onOpen} />
      {kid({ at: [4.4, 4.0, 0], look: LOOKS.girlCurly, ph: 4, facing: 'back', pose: 'reach' })}
      {adult({ at: [9.6, 4.1, 0], look: LOOKS.mum, ph: 5, facing: 'back', pose: 'reach' })}
      <Rail x0={3} x1={6} y={5.6} cat="bottoms" path={G_TROUSER} len="TROUSERS" onOpen={onOpen} />
      <Rail x0={8} x1={11} y={5.6} cat="tops" path={G_LONG} len="HOODIES" onOpen={onOpen} />
      {kid({ at: [6.9, 6.7, 0], look: LOOKS.boyRed, ph: 6, pose: 'stand' })}
      <Box x={2.6} y={7.6} w={2.6} d={1.0} h={0.3} c={WHITE} />
      <Mannequin at={[3.3, 8.1, 0.3]} o={{ body: 'berry-hoodie', legs: 'denim-jeans', shoes: 'white-trainers' }} />
      <Mannequin at={[4.6, 8.1, 0.3]} o={{ body: 'lilac-sundress', legs: 'white-leggings', shoes: 'gold-sandals' }} />
      <CapsTable onOpen={onOpen} />
      {kid({ at: [9.2, 9.3, 0], look: LOOKS.boyCap, ph: 7, facing: 'back', pose: 'reach' })}
      {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'reach' })}
      <Till onOpen={onOpen} cat={cat} />
      {adult({ at: [13.0, 9.3, 0], look: LOOKS.gran, ph: 9, facing: 'back', armR: 60 })}
      <FrontWalls />
      <Tag show={L} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.4]} text="Exit to town" />
    </IsoStage>
    {open
      ? <ShopPanel st={st} T={T} cat={cat} setCat={setCat} sel={sel} setSel={setSel} buy={buy} wear={wear} close={() => setOpen(false)} msg={msg} waveUntil={waveUntil} />
      : <button onClick={() => setOpen(true)} style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 10px 14px', borderRadius: 999, border: 'none', background: PINK, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 19, cursor: 'pointer', boxShadow: `0 4px 0 ${shade(PINK, -0.25)}, 0 12px 30px rgba(59,42,36,.25)` }}><Coin s={20} />{st.coins} · Open shop</button>}
  </div>;
}
window.ClothesShopScene = ClothesShopScene;
