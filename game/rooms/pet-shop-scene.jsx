// Pet shop "Paws & Whiskers". Iso scene + adopt panel. Exports window.PetShopScene.
// Back-left wall (y = 0): aquarium, bird cages, food & toys shelves + shop logo. Back-right wall (x = 0): small-pet hutches.
// Middle: puppy pen, kitten cat-tree. Front: till. Near end (x = RX): door → Town.
// Clicking an area opens the panel on that pet type. Saves coins + adopted pets to localStorage ('petShop:v1')
// and fires window 'pets-change' {detail:{owned}} whenever adopted pets change.
const { P, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const RX = 15, RY = 11, RH = 4;
const DOOR = { y0: 9.0, y1: 10.6 };
const ACC = '#2f8f7c', INK = '#3b2a24', FONT = "'Baloo 2', sans-serif";

const CATS = [
  { id: 'dogs', label: 'Puppies' }, { id: 'cats', label: 'Kittens' }, { id: 'small', label: 'Small pets' },
  { id: 'fish', label: 'Fish' }, { id: 'birds', label: 'Birds' }, { id: 'mine', label: 'My pets' },
];
const PETS = [
  ['biscuit', 'dogs', 'dog', 'Biscuit', 'Golden puppy', '#d9a35b', '#b9803e', 40],
  ['pepper', 'dogs', 'dog', 'Pepper', 'Spaniel puppy', '#6a4c3a', '#3b2a24', 45, { patch: true }],
  ['scout', 'dogs', 'dog', 'Scout', 'Spotty puppy', '#f4f2ee', '#3b2a24', 50, { spots: true }],
  ['mittens', 'cats', 'cat', 'Mittens', 'Tabby kitten', '#9aa0a6', null, 35, { tabby: true }],
  ['ginger', 'cats', 'cat', 'Ginger', 'Ginger kitten', '#e08a3c', null, 35, { tabby: true }],
  ['snowy', 'cats', 'cat', 'Snowy', 'White kitten', '#f4f2ee', null, 40],
  ['clover', 'small', 'bunny', 'Clover', 'Bunny', '#c9b29a', null, 25],
  ['nibbles', 'small', 'hamster', 'Nibbles', 'Hamster', '#e3b277', null, 15],
  ['pip', 'small', 'guinea', 'Pip', 'Guinea pig', '#8a5a3a', null, 20, { patch: true }],
  ['shelly', 'small', 'tortoise', 'Shelly', 'Tortoise', '#9a7f4a', null, 30],
  ['goldie', 'fish', 'fish', 'Goldie', 'Goldfish', '#f28c28', '#e0661c', 8],
  ['bubbles', 'fish', 'fish', 'Bubbles', 'Blue tang', '#4f86c6', '#f2c94c', 10],
  ['coral', 'fish', 'fish', 'Coral', 'Pink guppy', '#f39ac6', '#c25a7a', 12],
  ['kiwi', 'birds', 'bird', 'Kiwi', 'Green budgie', '#7cc96a', '#3f8a5a', 18],
  ['sky', 'birds', 'bird', 'Sky', 'Blue budgie', '#5fa8d8', '#3d6e9a', 18],
  ['sunny', 'birds', 'bird', 'Sunny', 'Canary', '#f2c94c', '#d9a92c', 20],
].map(([id, cat, kind, name, desc, color, accent, price, x]) => ({ id, cat, kind, name, desc, color, accent, price, ...(x || {}) }));
const BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]));
const SIZE = { dog: 1, cat: 1, bunny: 1, hamster: 1.4, guinea: 1.3, tortoise: 1.3, fish: 1.5, bird: 1.4 };

// ---------- Pet drawings (side view, facing right, feet at 0,0, ~60 units long) ----------
const PINKN = '#e88a9a', CREAM = '#fbf6ee', SKIN = '#a8b86a';
function PetArt({ p, T = 0, ph = 0, flip = false, s = 1 }) {
  const c = p.color, a = p.accent || shade(c, -0.2), d = shade(c, -0.2), l = shade(c, 0.35), w = Math.sin(T * 8 + ph);
  let art;
  switch (p.kind) {
    case 'dog': art = <g>
      <path d="M-22,-26 q-14,-6 -14,-22" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" transform={`rotate(${w * 18} -22 -26)`} />
      {[-19, -10, 10, 19].map(x => <rect key={x} x={x - 3.5} y={-16} width={7} height={16} rx={3.5} fill={x === -10 || x === 19 ? d : c} />)}
      <ellipse cx={0} cy={-24} rx={26} ry={13} fill={c} />
      {p.patch && <ellipse cx={8} cy={-18} rx={14} ry={7} fill={CREAM} stroke="none" />}
      {p.spots && [[-10, -28, 4], [4, -20, 3.5], [-17, -20, 3], [12, -31, 3], [26, -46, 2.5], [-2, -33, 2.5]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={INK} stroke="none" />)}
      <circle cx={24} cy={-38} r={13} fill={c} />
      <ellipse cx={35} cy={-33} rx={8} ry={6} fill={p.patch ? CREAM : l} />
      <circle cx={41} cy={-35} r={3} fill={INK} stroke="none" />
      <circle cx={27} cy={-42} r={2.2} fill={INK} stroke="none" />
      <ellipse cx={16} cy={-35} rx={5.5} ry={11} fill={a} transform={`rotate(${18 + w * 4} 16 -42)`} />
    </g>; break;
    case 'cat': art = <g>
      <path d="M-20,-22 q-18,-4 -16,-30" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" transform={`rotate(${w * 10} -20 -22)`} />
      {[-16, -8, 9, 16].map(x => <rect key={x} x={x - 3} y={-14} width={6} height={14} rx={3} fill={x === -8 || x === 16 ? d : c} />)}
      <ellipse cx={0} cy={-21} rx={22} ry={11} fill={c} />
      {p.tabby && <path d="M-12,-31 l3,8 M-4,-32 l2,8 M4,-31 l1,8" stroke={d} strokeWidth={3} strokeLinecap="round" />}
      <polygon points="13,-40 14,-55 22,-45" fill={c} /><polygon points="24,-46 31,-55 33,-40" fill={c} />
      <circle cx={23} cy={-35} r={12} fill={c} />
      <circle cx={21} cy={-37} r={1.9} fill={INK} stroke="none" /><circle cx={28} cy={-37} r={1.9} fill={INK} stroke="none" />
      <polygon points="24,-32 27,-32 25.5,-30" fill={PINKN} stroke="none" />
      <path d="M29,-31 l10,-2 M29,-29 l10,1" stroke={INK} strokeWidth={1} opacity={.45} />
    </g>; break;
    case 'bunny': art = <g>
      <ellipse cx={-6} cy={-3} rx={10} ry={4} fill={d} /><ellipse cx={12} cy={-3} rx={5} ry={3} fill={d} />
      <ellipse cx={-2} cy={-17} rx={18} ry={15} fill={c} />
      <circle cx={-19} cy={-20} r={6} fill={CREAM} />
      <g transform={`rotate(${w * 4} 12 -34)`}>
        <ellipse cx={8} cy={-47} rx={4.5} ry={13} fill={d} transform="rotate(-14 8 -47)" />
        <ellipse cx={15} cy={-47} rx={4.5} ry={13} fill={c} transform="rotate(8 15 -47)" />
        <ellipse cx={15} cy={-46} rx={2} ry={9} fill="#f2b3c0" stroke="none" transform="rotate(8 15 -47)" />
      </g>
      <circle cx={14} cy={-28} r={10} fill={c} />
      <circle cx={18} cy={-30} r={2} fill={INK} stroke="none" /><circle cx={23.5} cy={-26} r={1.8} fill={PINKN} stroke="none" />
    </g>; break;
    case 'hamster': art = <g transform={`translate(0 ${-Math.abs(w) * 1.5})`}>
      <ellipse cx={-8} cy={-1} rx={4} ry={2} fill={PINKN} /><ellipse cx={10} cy={-1} rx={4} ry={2} fill={PINKN} />
      <ellipse cx={0} cy={-13} rx={19} ry={13} fill={c} />
      <ellipse cx={4} cy={-8} rx={12} ry={6} fill={CREAM} stroke="none" />
      <circle cx={-2} cy={-25} r={4} fill={d} /><circle cx={6} cy={-25} r={4.5} fill={d} />
      <circle cx={12} cy={-16} r={2} fill={INK} stroke="none" /><circle cx={18.5} cy={-12} r={1.6} fill={PINKN} stroke="none" />
    </g>; break;
    case 'guinea': art = <g transform={`translate(0 ${-Math.abs(w) * 1})`}>
      <ellipse cx={-10} cy={-1} rx={4} ry={2} fill={PINKN} /><ellipse cx={12} cy={-1} rx={4} ry={2} fill={PINKN} />
      <ellipse cx={0} cy={-13} rx={23} ry={13} fill={c} />
      {p.patch && <g fill={CREAM} stroke="none"><ellipse cx={12} cy={-14} rx={9} ry={9} /><ellipse cx={-12} cy={-18} rx={7} ry={6} /></g>}
      <ellipse cx={8} cy={-25} rx={4.5} ry={3} fill={d} />
      <circle cx={15} cy={-17} r={2} fill={INK} stroke="none" /><circle cx={22} cy={-13} r={1.6} fill={PINKN} stroke="none" />
    </g>; break;
    case 'tortoise': art = <g>
      <ellipse cx={-12} cy={-3} rx={5} ry={4} fill={SKIN} /><ellipse cx={12} cy={-3} rx={5} ry={4} fill={SKIN} />
      <g transform={`translate(${w * 1.5} 0)`}><rect x={15} y={-12} width={10} height={6} rx={3} fill={SKIN} /><circle cx={25} cy={-11} r={6} fill={SKIN} /><circle cx={27} cy={-13} r={1.4} fill={INK} stroke="none" /></g>
      <path d="M-21,-6 A21,19 0 0 1 21,-6 Z" fill={c} />
      <path d="M-8,-6 L-6,-16 L6,-16 L8,-6 M-6,-16 L-13,-20 M6,-16 L13,-20 M0,-16 V-24" stroke={l} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <rect x={-22} y={-7} width={44} height={4} rx={2} fill={d} />
    </g>; break;
    case 'fish': art = <g transform="translate(0 -20)">
      <polygon points={`-14,0 -27,${-10 + w * 3} -27,${10 - w * 3}`} fill={a} />
      <ellipse cx={0} cy={0} rx={16} ry={10.5} fill={c} />
      <path d="M-5,-9 q6,-9 13,-1" fill={a} />
      <circle cx={8} cy={-2} r={2.4} fill={INK} stroke="none" /><circle cx={8.8} cy={-2.8} r={0.8} fill="#fff" stroke="none" />
    </g>; break;
    case 'bird': art = <g>
      <path d="M-2,0 v-6 M3,0 v-6" stroke="#e3a04f" strokeWidth={2} />
      <polygon points="-6,-6 -20,8 -12,10 -1,-4" fill={a} />
      <ellipse cx={0} cy={-15} rx={10} ry={13} fill={c} />
      <ellipse cx={3} cy={-12} rx={6} ry={8} fill={l} stroke="none" />
      <ellipse cx={-3} cy={-15} rx={6} ry={10} fill={a} transform="rotate(-15 -3 -15)" />
      <g transform={`translate(0 ${w * 1.2})`}><circle cx={4} cy={-30} r={8} fill={c} />
        <polygon points="11,-31 16,-28 11,-26" fill="#f2a23a" /><circle cx={7} cy={-32} r={1.8} fill={INK} stroke="none" /></g>
    </g>; break;
    default: art = null;
  }
  return <g transform={`scale(${flip ? -s : s} ${s})`} stroke="rgba(59,42,36,.22)" strokeWidth={1.5} strokeLinejoin="round">{art}</g>;
}
const HEART = 'M0,5 C-7,-1 -11,-6 -6.5,-9.5 C-3.5,-11.5 0,-9 0,-6.5 C0,-9 3.5,-11.5 6.5,-9.5 C11,-6 7,-1 0,5Z';
const at = ([x, y, z], el, key) => { const [px, py] = P(x, y, z); return <g key={key} transform={`translate(${px} ${py})`}>{el}</g>; };

// ---------- Scene ----------
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };
const signArt = (w, text, size = 20) => <g><rect x={0} y={0} width={w} height={34} rx={6} fill={CREAM} stroke={ACC} strokeWidth={2} /><text x={w / 2} y={24} textAnchor="middle" fontSize={size} fontWeight="800" fill={ACC} fontFamily={FONT}>{text}</text></g>;
const hit = (onOpen, cat) => ({ onClick: () => onOpen(cat), style: { cursor: 'pointer' } });

function Floor() {
  const t = [];
  for (let i = 0; i < RX; i++) for (let j = 0; j < RY; j++) if ((i + j) % 2) t.push(<rect key={i + '-' + j} x={i * 100} y={j * 100} width={100} height={100} fill="#e6dcc6" />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#f1ead8" />{t}</FloorPlane>;
}
function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#e4f0e4" /><BackWallX RY={RY} RH={RH} fill="#d2e4d4" /><WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={3.7} z1={3.85} fill={ACC} /><StripX y0={0} y1={RY} z0={3.7} z1={3.85} fill={shade(ACC, -0.12)} />
    <StripY x0={0} x1={RX} z0={0} z1={0.14} fill="#c9a16a" /><StripX y0={0} y1={RY} z0={0} z1={0.14} fill="#b58e5a" />
    <FaceY y={0.02} x0={5.6} z1={3.6}>
      {[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${30 + i * 26} ${i % 2 ? 18 : 30}) rotate(${i * 12 - 18})`} fill={ACC}>
        <ellipse cx={0} cy={6} rx={7} ry={6} /><circle cx={-6} cy={-3} r={2.6} /><circle cx={-2} cy={-6} r={2.6} /><circle cx={3} cy={-6} r={2.6} /><circle cx={7} cy={-3} r={2.6} /></g>)}
      <text x={300} y={46} textAnchor="middle" fontSize={46} fontWeight="800" fill={ACC} fontFamily={FONT}>Paws &amp; Whiskers</text>
    </FaceY>
  </g>;
}

function Aquarium({ T, onOpen }) {
  const fish = PETS.filter(p => p.cat === 'fish');
  return <g {...hit(onOpen, 'fish')}>
    <Box x={0.8} y={0} w={4.4} d={0.8} h={0.9} c={['#3e7f72', '#2f6b5f', '#285c52']} />
    <Box x={0.8} y={0} z={0.9} w={4.4} d={0.8} h={1.35} c={['#cfeaf2', '#a9d8e8', '#93cbe0']} />
    <FaceY y={0.8} x0={0.8} z1={2.25}>
      <rect x={4} y={14} width={432} height={117} fill="#7cc3e0" />
      <path d="M4,131 V118 Q80,108 160,118 T320,114 T436,118 V131 Z" fill="#e8d3a2" />
      {[[60, 118, 48], [90, 118, 34], [300, 116, 56], [330, 116, 40], [390, 118, 30]].map(([x, y, h], i) => <path key={i} d={`M${x},${y} q${i % 2 ? 10 : -10},${-h / 2} 0,${-h}`} fill="none" stroke="#3f8a5a" strokeWidth={6} strokeLinecap="round" />)}
      <rect x={190} y={100} width={44} height={20} rx={4} fill="#c4433c" /><rect x={204} y={88} width={16} height={14} fill="#c4433c" />
      {fish.map((f, i) => { const u = ((T * (0.09 + i * 0.02) + i * 0.6) % 2), right = u < 1, x = right ? 40 + u * 360 : 400 - (u - 1) * 360, y = 58 + i * 24 + Math.sin(T * 1.3 + i) * 6;
        return <g key={f.id} transform={`translate(${x} ${y + 20})`}><PetArt p={f} T={T} ph={i} flip={!right} s={0.9} /></g>; })}
      {[0, 1, 2, 3].map(i => { const k = ((T * 0.5 + i * 0.25) % 1); return <circle key={i} cx={262 + Math.sin(T * 3 + i) * 4} cy={116 - k * 100} r={3 + i % 2} fill="none" stroke="#e8f6fb" strokeWidth={2} />; })}
      <rect x={0} y={0} width={440} height={14} fill="#2f6b5f" />
      <path d="M40,30 L80,120 M70,30 L100,90" stroke="#fff" strokeWidth={6} opacity={.25} strokeLinecap="round" />
    </FaceY>
    <FaceY y={0.02} x0={2.1} z1={3.2}>{signArt(180, 'FISH')}</FaceY>
  </g>;
}

function BirdCages({ T, onOpen }) {
  const birds = PETS.filter(p => p.cat === 'birds');
  return <g {...hit(onOpen, 'birds')}>
    <Box x={6.4} y={0} w={3.3} d={0.7} h={0.9} c={OAK} />
    <FaceY y={0.35} x0={6.4} z1={2.35}>
      {birds.map((b, i) => { const x = 20 + i * 100, sw = Math.sin(T * 1.6 + i) * 4; return <g key={b.id} transform={`translate(${x} 0)`}>
        <line x1={45} y1={0} x2={45} y2={22} stroke="#9aa1a6" strokeWidth={2} />
        <path d="M5,60 A40,38 0 0 1 85,60" fill="none" stroke="#c9a54a" strokeWidth={3} />
        {[5, 18, 31, 45, 59, 72, 85].map(bx => <line key={bx} x1={bx} y1={bx === 45 ? 22 : 60 - Math.sqrt(Math.max(0, 1600 - (bx - 45) ** 2)) * 0.95} x2={bx} y2={136} stroke="#c9a54a" strokeWidth={2} />)}
        <g transform={`rotate(${sw} 45 40)`}><path d="M28,40 V100 H62 V40" fill="none" stroke="#8a6a4a" strokeWidth={2} /><line x1={26} y1={100} x2={64} y2={100} stroke="#8a6a4a" strokeWidth={4} strokeLinecap="round" />
          <g transform="translate(45 100)"><PetArt p={b} T={T} ph={i * 2} s={1.1} flip={i === 1} /></g></g>
        <rect x={0} y={132} width={90} height={10} rx={3} fill="#c9a54a" />
      </g>; })}
    </FaceY>
    <FaceY y={0.02} x0={7.3} z1={3.2}>{signArt(150, 'BIRDS')}</FaceY>
  </g>;
}

function Shelves() {
  const bag = ['#e96d6d', '#f2c94c', '#5fa8d8', '#7cc96a', '#b9a3e3', '#f4a98a'];
  return <g>
    <Box x={10.5} y={0} w={4.0} d={0.45} h={2.5} c={WHITE} />
    <FaceY y={0.45} x0={10.5} z1={2.5}>
      {[0, 1, 2].map(r => <g key={r}>
        <rect x={0} y={72 + r * 82} width={400} height={8} fill="#c9a16a" />
        {r === 0 && [0, 1, 2, 3, 4, 5].map(k => <g key={k}><path d={`M${18 + k * 64},72 v-46 q0,-8 8,-8 h30 q8,0 8,8 v46 z`} fill={bag[k]} /><circle cx={41 + k * 64} cy={48} r={9} fill={CREAM} /></g>)}
        {r === 1 && [0, 1, 2, 3, 4, 5, 6, 7].map(k => <g key={k}><rect x={14 + k * 48} y={118 + 4} width={34} height={32} rx={4} fill={bag[(k + 2) % 6]} /><rect x={14 + k * 48} y={132} width={34} height={10} fill={CREAM} /></g>)}
        {r === 2 && <g>{[0, 1, 2, 3, 4].map(k => <circle key={k} cx={36 + k * 40} cy={222} r={14} fill={bag[k]} />)}
          <path d="M240,236 q0,-26 40,-26 q40,0 40,26 z" fill="#c25a7a" /><ellipse cx={360} cy={232} rx={30} ry={8} fill="#5fa8d8" /></g>}
      </g>)}
    </FaceY>
    <FaceY y={0.02} x0={11.2} z1={3.2}>{signArt(240, 'FOOD & TOYS')}</FaceY>
  </g>;
}

function Hutches({ T, onOpen }) {
  const pets = ['pip', 'clover', 'shelly', 'nibbles'].map(id => BY_ID[id]);
  return <g {...hit(onOpen, 'small')}>
    <Box x={0} y={1.0} w={1.1} d={5.4} h={2.4} c={OAK} />
    <FaceX x={1.1} y1={6.4} z1={2.4}>
      {pets.map((p, i) => { const x = (i % 2) * 270, y = Math.floor(i / 2) * 120; return <g key={p.id}>
        <rect x={x + 10} y={y + 10} width={250} height={102} fill="#f6ead2" />
        <rect x={x + 10} y={y + 92} width={250} height={20} fill="#e8c873" />
        {p.kind === 'hamster' && <g><circle cx={x + 70} cy={y + 64} r={34} fill="none" stroke="#5fa8d8" strokeWidth={5} /><line x1={x + 70} y1={y + 64} x2={x + 70} y2={y + 104} stroke="#5fa8d8" strokeWidth={4} /></g>}
        <g transform={`translate(${x + 150 + Math.sin(T * 0.4 + i) * (p.kind === 'tortoise' ? 30 : 12)} ${y + 106})`}><PetArt p={p} T={T} ph={i * 1.7} s={1.25} flip={Math.cos(T * 0.4 + i) < 0 && p.kind === 'tortoise'} /></g>
        {Array.from({ length: 15 }, (_, k) => <line key={k} x1={x + 14 + k * 17} y1={y + 10} x2={x + 14 + k * 17} y2={y + 112} stroke="#8a9196" strokeWidth={1.5} opacity={.55} />)}
        <rect x={x + 10} y={y + 10} width={250} height={102} fill="none" stroke="#b58e5a" strokeWidth={6} />
      </g>; })}
    </FaceX>
    <FaceX x={0.02} y1={5.0} z1={3.4}>{signArt(220, 'SMALL PETS')}</FaceX>
  </g>;
}

function Pen({ T, onOpen, kidAt }) {
  const X0 = 2.6, X1 = 7.2, Y0 = 4.0, Y1 = 7.4, Z = 0.55, F = '#f6efe2', F2 = '#d8c9ae';
  const dogs = PETS.filter(p => p.cat === 'dogs').map((p, i) => {
    const ph = i * 2.1, a = T * 0.45 + ph, b = T * 0.37 + ph * 1.7;
    const x = 4.9 + 1.5 * Math.sin(a), y = 5.7 + 0.9 * Math.sin(b);
    return { p, x, y, ph, flip: 1.5 * 0.45 * Math.cos(a) - 0.9 * 0.37 * Math.cos(b) < 0 };
  }).sort((m, n) => (m.x + m.y) - (n.x + n.y));
  const side = (a, b, n, key) => { const out = []; for (let k = 0; k <= n; k++) { const t = k / n, pnt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; out.push(ln([...pnt, 0], [...pnt, Z], F2, 5, key + k)); }
    out.push(ln([...a, Z], [...b, Z], F, 6, key + 't'), ln([...a, 0.28], [...b, 0.28], F, 4, key + 'm')); return out; };
  return <g {...hit(onOpen, 'dogs')}>
    <FloorPlane z={0.005} x={X0} y={Y0}><rect x={0} y={0} width={(X1 - X0) * 100} height={(Y1 - Y0) * 100} rx={10} fill="#cfe3b0" /></FloorPlane>
    {side([X0, Y0], [X1, Y0], 8, 'b')}{side([X0, Y0], [X0, Y1], 6, 'l')}
    <Box x={2.9} y={4.2} w={1.1} d={0.8} h={0.22} c={['#e8a2b4', '#d68aa0', '#c4788e']} />
    {[[6.6, 4.4]].map(([x, y], i) => <g key={i}><Box x={x} y={y} w={0.32} d={0.32} h={0.1} c={['#5fa8d8', '#4f8ac0', '#3f7aae']} /></g>)}
    {at([4.0 + Math.sin(T * 0.8) * 0.2, 6.8, 0.1], <circle cx={0} cy={-6} r={9} fill="#e96d6d" stroke="rgba(0,0,0,.2)" />, 'ball')}
    {dogs.map(m => at([m.x, m.y, 0], <PetArt p={m.p} T={T} ph={m.ph} flip={m.flip} s={0.95} />, m.p.id))}
    {kidAt}
    {side([X0, Y1], [X1, Y1], 8, 'f')}{side([X1, Y0], [X1, Y1], 6, 'r')}
    <FaceY y={Y1 + 0.02} x0={4.25} z1={0.9}>{signArt(130, 'PUPPIES', 18)}</FaceY>
  </g>;
}

function CatTree({ T, onOpen }) {
  const [m, g, s] = ['mittens', 'ginger', 'snowy'].map(id => BY_ID[id]);
  const ROPE = ['#e8d6b0', '#d8c294', '#c9b07c'], PAD = ['#b9a3e3', '#a48ccf', '#9078bb'];
  return <g {...hit(onOpen, 'cats')}>
    <FloorPlane z={0.005}><ellipse cx={1010} cy={520} rx={140} ry={110} fill="#f1d7c2" stroke="#e3bfa6" strokeWidth={6} /></FloorPlane>
    <Box x={9.0} y={4.3} w={1.2} d={1.1} h={0.15} c={PAD} />
    <Box x={9.45} y={4.7} w={0.3} d={0.3} h={0.95} c={ROPE} />
    <Box x={9.1} y={4.4} z={0.95} w={1.0} d={0.9} h={0.12} c={PAD} />
    <Box x={9.45} y={4.7} z={1.07} w={0.3} d={0.3} h={0.8} c={ROPE} />
    <Box x={9.2} y={4.5} z={1.87} w={0.8} d={0.8} h={0.12} c={PAD} />
    {at([9.75, 5.05, 1.07], <PetArt p={m} T={T} ph={1} s={0.85} />, 'm')}
    {at([9.55, 4.9, 1.99], <PetArt p={s} T={T} ph={3} s={0.85} flip />, 's')}
    <Box x={10.5} y={5.5} w={0.75} d={0.6} h={0.2} c={['#c9a16a', '#b58e5a', '#a07a4a']} />
    {at([10.9, 5.85, 0.14], <PetArt p={g} T={T} ph={2} s={0.85} flip />, 'g')}
    {ln([9.6, 4.9, RH], [9.6, 4.9, 2.75], '#9aa1a6', 1.5, 'w')}
    <FaceY y={4.9} x0={9.0} z1={2.8}>{signArt(130, 'KITTENS', 18)}</FaceY>
  </g>;
}

function Till({ onOpen }) {
  return <g {...hit(onOpen, 'mine')}>
    <Box x={11.6} y={8.0} w={2.6} d={0.75} h={1.0} c={['#fbf6ee', '#7fc1b2', '#66ad9d']} />
    <Box x={12.9} y={8.15} z={1.0} w={0.5} d={0.42} h={0.22} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    <FaceX x={13.4} y1={8.5} z1={1.6}><rect x={0} y={0} width={30} height={34} rx={3} fill="#2a2a2c" /><rect x={3} y={3} width={24} height={20} fill="#8fd0e0" /></FaceX>
    <Box x={11.9} y={8.2} z={1.0} w={0.5} d={0.4} h={0.3} c={['#f2c94c', '#d9a92c', '#c4952a']} />
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

// ---------- Panel ----------
const Coin = ({ s = 16 }) => <span style={{ width: s, height: s, borderRadius: '50%', background: '#f2c94c', boxShadow: 'inset 0 -2px 0 #d9a92c', display: 'inline-block', flex: 'none' }} />;
const pill = (on) => ({ border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14, padding: '5px 11px', borderRadius: 999, flex: 'none', whiteSpace: 'nowrap', background: on ? ACC : '#e4ecdf', color: on ? '#fff' : INK });
const PREVIEW_BG = { dogs: '#dcecc8', cats: '#f3dccd', small: '#f4e8c8', fish: '#cfe8f2', birds: '#e0ecd8', mine: '#e6efe2' };
function PetIcon({ p, T }) {
  return <svg width={64} height={50} viewBox="-42 -62 92 70" style={{ display: 'block' }}><PetArt p={p} T={T} ph={p.price} s={SIZE[p.kind]} /></svg>;
}

function PetPanel({ st, T, cat, setCat, sel, setSel, adopt, cuddle, close, msg, hearts }) {
  const items = cat === 'mine' ? st.owned.map(id => BY_ID[id]) : PETS.filter(p => p.cat === cat);
  const it = sel && BY_ID[sel], show = it || items[0];
  const owned = it && st.owned.includes(it.id);
  let btn = { label: 'Tap a pet to meet them', off: true };
  if (it && owned) btn = { label: `Cuddle ${it.name}`, go: cuddle };
  else if (it && st.coins < it.price) btn = { label: `Need ${it.price - st.coins} more coins`, off: true };
  else if (it) btn = { label: `Adopt for ${it.price}`, go: adopt, coin: true };
  const hk = hearts > T ? 1 - (hearts - T) / 1.8 : -1;
  return <div style={{ position: 'absolute', top: 16, right: 16, bottom: 16, width: 'min(400px, calc(100% - 32px))', background: CREAM, borderRadius: 24, boxShadow: '0 20px 50px rgba(59,42,36,.25)', display: 'flex', flexDirection: 'column', fontFamily: FONT, color: INK, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px 10px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: ACC }}>Paws &amp; Whiskers</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6f7a6a' }}>Pet shop</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: INK, color: '#fff6ea', borderRadius: 999, padding: '5px 12px 5px 7px', fontWeight: 800, fontSize: 17 }}><Coin s={20} />{st.coins}</div>
      <button onClick={close} aria-label="Close shop" style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#e4ecdf', color: INK, fontSize: 20, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, lineHeight: 1 }}>×</button>
    </div>
    <div style={{ margin: '0 16px', height: 'clamp(110px, 26vh, 210px)', flex: 'none', background: PREVIEW_BG[cat], borderRadius: 18, position: 'relative', overflow: 'hidden' }}>
      {show ? <svg viewBox="-62 -76 130 88" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ display: 'block' }}>
        <ellipse cx={4} cy={2} rx={44} ry={6} fill="rgba(59,42,36,.1)" />
        <PetArt p={show} T={T} ph={0} s={SIZE[show.kind]} />
        {hk >= 0 && [-22, 4, 28].map((x, i) => <path key={i} d={HEART} fill="#e96d9a" transform={`translate(${x + Math.sin(T * 4 + i) * 3} ${-40 - hk * 30 - i * 4}) scale(${1.1 - hk * 0.4})`} opacity={1 - hk} />)}
      </svg> : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, color: '#6f7a6a', padding: 20, textAlign: 'center' }}>No pets yet. Pick one from the shop.</div>}
      {show && <div style={{ position: 'absolute', left: 14, top: 10, fontSize: 13, fontWeight: 700, color: '#4f5c4a' }}>{it ? `${it.name} · ${it.desc}` : 'Tap a pet to meet them'}</div>}
    </div>
    <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 5, padding: '10px 16px', flex: 'none' }}>
      {CATS.map(c => <button key={c.id} onClick={() => { setCat(c.id); setSel(null); }} style={pill(c.id === cat)}>{c.label}{c.id === 'mine' && st.owned.length ? ` (${st.owned.length})` : ''}</button>)}
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {items.map(p => { const on = sel === p.id, has = st.owned.includes(p.id);
          return <button key={p.id} onClick={() => setSel(on ? null : p.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 6px 8px', borderRadius: 16, cursor: 'pointer', background: '#fff', border: `2px solid ${on ? ACC : '#e4ecdf'}`, fontFamily: FONT, color: INK }}>
            <div style={{ background: '#f2f5ee', borderRadius: 12, padding: '4px 6px' }}><PetIcon p={p} T={on ? T : 0} /></div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6f7a6a', lineHeight: 1.1, textAlign: 'center' }}>{p.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, marginTop: 2, color: has ? ACC : INK }}>{has ? 'Yours' : <><Coin s={13} />{p.price}</>}</div>
          </button>; })}
      </div>
    </div>
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #e1e6da', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {msg && <div style={{ fontSize: 14, fontWeight: 700, color: ACC, textAlign: 'center' }}>{msg}</div>}
      <button disabled={btn.off} onClick={btn.go} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16, border: 'none', fontFamily: FONT, fontWeight: 800, fontSize: 19, cursor: btn.off ? 'default' : 'pointer', background: btn.off ? '#e4ecdf' : ACC, color: btn.off ? '#7d8a78' : '#fff', boxShadow: btn.off ? 'none' : `0 4px 0 ${shade(ACC, -0.3)}` }}>
        {btn.label}{btn.coin && <Coin s={18} />}
      </button>
    </div>
  </div>;
}

// ---------- Root ----------
const KEY = 'petShop:v1';
function load(coins) {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.owned)) return s; } catch (e) {}
  return { coins, owned: [] };
}

function PetShopScene({ showLabels = true, animate = true, startingCoins = 80, panelOpen = true }) {
  const T = useClock(!animate);
  const [st, setSt] = React.useState(() => load(startingCoins));
  const [open, setOpen] = React.useState(panelOpen);
  const [cat, setCat] = React.useState('dogs');
  const [sel, setSel] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const [hearts, setHearts] = React.useState(-1);
  React.useEffect(() => setOpen(panelOpen), [panelOpen]);
  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('pets-change', { detail: { owned: st.owned } }));
  }, [st]);
  React.useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 2600); return () => clearTimeout(t); }, [msg]);
  const onOpen = React.useCallback((c) => { setOpen(true); setCat(c); setSel(null); }, []);
  const adopt = () => { const p = BY_ID[sel]; setSt(s => ({ coins: s.coins - p.price, owned: [...s.owned, p.id] })); setMsg(`${p.name} is coming home with you!`); setHearts(T + 1.8); };
  const cuddle = () => setHearts(T + 1.8);

  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: ACC, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#e4f0e4' };
  const stat = React.useMemo(() => <><Slab RX={RX} RY={RY} /><Floor /><Walls /><Shelves /></>, []);
  return <div style={{ position: 'absolute', inset: 0 }}>
    <IsoStage cx={open ? 1290 : 1074} cy={826} zoom={0.68} label="Pet Shop" defs={null}>
      {stat}
      <Aquarium T={T} onOpen={onOpen} /><BirdCages T={T} onOpen={onOpen} /><Hutches T={T} onOpen={onOpen} />
      {adult({ at: [3.0, 1.3, 0], look: LOOKS.mum, ph: 1, facing: 'back', pose: 'reach' })}
      {adult({ at: [1.8, 3.4, 0], look: { ...LOOKS.dad, ...STAFF }, ph: 2, pose: 'stand' })}
      {kid({ at: [8.0, 1.3, 0], look: LOOKS.boyCap, ph: 3, facing: 'back', pose: 'wave' })}
      {adult({ at: [12.4, 1.1, 0], look: LOOKS.gran, ph: 4, facing: 'back', pose: 'reach' })}
      <Pen T={T} onOpen={onOpen} />
      <CatTree T={T} onOpen={onOpen} />
      {kid({ at: [5.0, 7.9, 0], look: LOOKS.girlPink, ph: 5, facing: 'back', pose: 'reach' })}
      {kid({ at: [3.6, 8.1, 0], look: LOOKS.boyRed, ph: 6, facing: 'back', pose: 'wave' })}
      {kid({ at: [10.4, 7.0, 0], look: LOOKS.girlCurly, ph: 7, facing: 'back', pose: 'reach' })}
      {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'stand' })}
      <Till onOpen={onOpen} />
      {adult({ at: [13.0, 9.3, 0], look: LOOKS.mumBun, ph: 9, facing: 'back', armR: 60 })}
      <FrontWalls />
      <Tag show={showLabels} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.4]} text="Exit to town" />
    </IsoStage>
    {open
      ? <PetPanel st={st} T={T} cat={cat} setCat={setCat} sel={sel} setSel={setSel} adopt={adopt} cuddle={cuddle} close={() => setOpen(false)} msg={msg} hearts={hearts} />
      : <button onClick={() => setOpen(true)} style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 10px 14px', borderRadius: 999, border: 'none', background: ACC, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 19, cursor: 'pointer', boxShadow: `0 4px 0 ${shade(ACC, -0.3)}, 0 12px 30px rgba(59,42,36,.25)` }}><Coin s={20} />{st.coins} · Meet the pets</button>}
  </div>;
}
window.PetShopScene = PetShopScene;
