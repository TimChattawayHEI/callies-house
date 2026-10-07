// Isometric messy-room animation. Exports window.RoomApp.
const { useComposition: useComp, Easing: E, clamp: cl } = window;

const S = 88, C = 0.866, OX = 922, OY = 430, RX = 7, RY = 6, RH = 4.2;
const P = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const pts = (arr) => arr.map(p => P(...p).join(',')).join(' ');
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (T, a, b) => cl((T - a) / (b - a), 0, 1);

// Three motion helpers — all easing goes through these.
const MOTION = {
  enter: (T, a, b) => E.easeInOutCubic(prog(T, a, b)),
  pop: (T, a, b) => E.easeOutBack(prog(T, a, b)),
  arc: (p, h) => 4 * h * p * (1 - p),
};

// Draw on any plane: o origin, u/v unit vectors (world). Children use 100 units = 1 world unit.
function Plane({ o, u, v, children, ...rest }) {
  const p0 = P(...o), pu = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]), pv = P(o[0] + v[0], o[1] + v[1], o[2] + v[2]);
  const m = [(pu[0] - p0[0]) / 100, (pu[1] - p0[1]) / 100, (pv[0] - p0[0]) / 100, (pv[1] - p0[1]) / 100, p0[0], p0[1]];
  return <g transform={`matrix(${m.join(' ')})`} {...rest}>{children}</g>;
}
const FloorPlane = ({ z = 0, x = 0, y = 0, children }) => <Plane o={[x, y, z]} u={[1, 0, 0]} v={[0, 1, 0]}>{children}</Plane>;
const WallY = ({ y = 0, children }) => <Plane o={[0, y, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>{children}</Plane>; // x right, z down
const FaceX = ({ x, y1, z1, children }) => <Plane o={[x, y1, z1]} u={[0, -1, 0]} v={[0, 0, -1]}>{children}</Plane>;
const FaceY = ({ y, x0, z1, children }) => <Plane o={[x0, y, z1]} u={[1, 0, 0]} v={[0, 0, -1]}>{children}</Plane>;

function Box({ x, y, z = 0, w, d, h, c, stroke = 'rgba(70,45,25,.25)' }) {
  const [top, l, r] = c;
  const sw = 1.2;
  return <g strokeLinejoin="round">
    <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={l} stroke={stroke} strokeWidth={sw} />
    <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={r} stroke={stroke} strokeWidth={sw} />
    <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} stroke={stroke} strokeWidth={sw} />
  </g>;
}
const OAK = ['#ecd09c', '#dcb67e', '#c9a16a'];
const WHITE = ['#fbf8f2', '#ebe6dc', '#ddd6c9'];
const MINT = ['#cfeee4', '#b4ddd0', '#9fcdbf'];
const CARD = ['#d8b484', '#c49c69', '#b08757'];

// ---------- Room ----------
function Room() {
  const planks = [];
  for (let i = 0; i < 12; i++) {
    const off = (i * 137) % 260;
    planks.push(<rect key={i} x={0} y={i * 50} width={700} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 4; k++) planks.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    planks.push(<line key={'h' + i} x1={0} y1={i * 50} x2={700} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <g>
    {/* slab */}
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#8a5a33" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#734a29" />
    <FloorPlane><g clipPath="url(#floorclip)">{planks}</g></FloorPlane>
    {/* walls */}
    <polygon points={pts([[0, 0, 0], [RX, 0, 0], [RX, 0, RH], [0, 0, RH]])} fill="#f5e8cf" />
    <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, RH], [0, 0, RH]])} fill="#e9d6b6" />
    <polygon points={pts([[-0.2, -0.2, RH], [RX, -0.2, RH], [RX, 0, RH], [0, 0, RH], [0, RY, RH], [-0.2, RY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[RX, -0.2, RH], [RX, 0, RH], [RX, 0, -0.35], [RX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, RY, RH], [0, RY, RH], [0, RY, -0.35], [-0.2, RY, -0.35]])} fill="#cdb791" />
    {/* skirting + coving */}
    <polygon points={pts([[0, 0.01, 0], [RX, 0.01, 0], [RX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, RY, 0], [0.01, RY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
    <polygon points={pts([[0, 0.01, RH - 0.15], [RX, 0.01, RH - 0.15], [RX, 0.01, RH], [0, 0.01, RH]])} fill="#fffdf7" />
    {/* window + blind */}
    <WallY>
      <rect x={155} y={45} width={190} height={235} fill="#fffaf2" stroke="#e2d4bb" strokeWidth={2} />
      <rect x={165} y={55} width={170} height={215} fill="#2b2e38" />
      {Array.from({ length: 14 }, (_, i) => <line key={i} x1={165} x2={335} y1={60 + i * 15} y2={60 + i * 15} stroke="#43475a" strokeWidth={3} />)}
      <rect x={180} y={86} width={5} height={8} fill="#3d6fd1" />
    </WallY>
    <Box x={1.5} y={0} z={1.5} w={2.0} d={0.2} h={0.1} c={WHITE} />
    <Box x={1.7} y={0.02} z={0.35} w={1.6} d={0.12} h={0.75} c={WHITE} />
    {/* light switch */}
    <Plane o={[0.01, 4.2, 2.0]} u={[0, -1, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={18} height={18} fill="#fffaf2" stroke="#cbb898" strokeWidth={2} /></Plane>
    {/* rug */}
    <FloorPlane z={0.01}>
      <ellipse cx={380} cy={385} rx={125} ry={105} fill="#efb3c2" />
      <ellipse cx={380} cy={385} rx={100} ry={82} fill="none" stroke="#fbd9e1" strokeWidth={9} />
      <ellipse cx={380} cy={385} rx={60} ry={48} fill="none" stroke="#e595aa" strokeWidth={6} />
    </FloorPlane>
  </g>;
}

function Door({ T, CUES }) {
  const open = MOTION.enter(T, 0.7, 1.4) * (1 - MOTION.enter(T, CUES.TV, CUES.TV + 0.8));
  const th = open * 1.25, hx = 6.95, ex = hx - 0.9 * Math.cos(th), ey = 0.9 * Math.sin(th);
  return <g>
    <polygon points={pts([[5.95, 0.01, 0], [7.0, 0.01, 0], [7.0, 0.01, 3.4], [5.95, 0.01, 3.4]])} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1} />
    <polygon points={pts([[6.05, 0.02, 0], [6.95, 0.02, 0], [6.95, 0.02, 3.3], [6.05, 0.02, 3.3]])} fill="#6d5644" />
    <polygon points={pts([[hx, 0.03, 0], [ex, ey + 0.03, 0], [ex, ey + 0.03, 3.3], [hx, 0.03, 3.3]])} fill={open > 0.5 ? '#e8e0d0' : '#f8f3ea'} stroke="#d6cab3" strokeWidth={1.2} />
    <circle cx={P(lerp(hx, ex, 0.88), lerp(0.03, ey, 0.88) + 0.04, 1.6)[0]} cy={P(lerp(hx, ex, 0.88), lerp(0.03, ey, 0.88) + 0.04, 1.6)[1]} r={5} fill="#b9973f" />
  </g>;
}

function Bed() {
  return <g>
    <Box x={0.1} y={0.1} w={0.18} d={1.95} h={1.55} c={WHITE} />
    {[0.5, 0.85, 1.2, 1.55].map(y => <polygon key={y} points={pts([[0.28, y, 0.95], [0.28, y + 0.08, 0.95], [0.28, y + 0.08, 1.4], [0.28, y, 1.4]])} fill="#e3ddd1" />)}
    <Box x={0.28} y={1.9} w={0.14} d={0.14} h={0.3} c={WHITE} />
    <Box x={3.75} y={1.9} w={0.14} d={0.14} h={0.3} c={WHITE} />
    <Box x={3.75} y={0.12} w={0.14} d={0.14} h={0.3} c={WHITE} />
    <Box x={0.28} y={0.1} w={3.62} d={1.95} h={0.3} z={0.3} c={WHITE} />
    <Box x={0.32} y={0.14} w={3.54} d={1.87} h={0.3} z={0.6} c={['#e7cfe9', '#d8b9dc', '#c9a7cf']} />
    <FloorPlane z={0.905} x={0.32} y={0.14}>
      {[[60, 40], [160, 120], [250, 60], [300, 150], [110, 160], [210, 20]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={4} fill="#fff" opacity={.7} />)}
    </FloorPlane>
    {/* pillow */}
    <FloorPlane z={0.9} x={0.4} y={0.25}><rect x={0} y={4} width={62} height={150} rx={26} fill="#d9d1c2" /></FloorPlane>
    <FloorPlane z={1.06} x={0.4} y={0.25}><rect x={0} y={0} width={62} height={150} rx={26} fill="#fffaf1" stroke="#e5dccb" strokeWidth={2} /></FloorPlane>
    {/* duvet: rumpled */}
    <FloorPlane z={0.92} x={1.1} y={0.1}><path d="M0,10 C60,-10 150,20 230,0 C270,10 290,60 280,110 C285,160 270,195 200,198 C130,205 60,190 10,196 C-10,150 8,90 0,10Z" fill="#cdb7cf" /></FloorPlane>
    <FloorPlane z={1.02} x={1.1} y={0.1}>
      <path d="M0,10 C60,-10 150,20 230,0 C270,10 290,60 280,110 C285,160 270,195 200,198 C130,205 60,190 10,196 C-10,150 8,90 0,10Z" fill="#f6eef1" stroke="#d6c3d6" strokeWidth={2} />
      <path d="M40,60 C90,40 140,80 200,50 M30,130 C100,110 170,150 250,120" fill="none" stroke="#e3d2e4" strokeWidth={6} strokeLinecap="round" />
      {[[50, 30], [120, 95], [210, 30], [235, 160], [80, 165], [160, 150], [245, 90], [30, 95]].map(([a, b], i) =>
        <g key={i} transform={`translate(${a} ${b})`}><path d="M0,-9 L3,-3 9,-2 4,2 6,9 0,5 -6,9 -4,2 -9,-2 -3,-3Z" fill="#c38bd0" /></g>)}
      {[[90, 55], [180, 110], [140, 25], [60, 120], [220, 190]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={7} fill="#e8a4c8" />)}
    </FloorPlane>
  </g>;
}

function Kitchen() {
  return <g>
    {[4.35, 5.85].map(x => <Box key={x} x={x} y={0.6} w={0.1} d={0.1} h={0.25} c={OAK} />)}
    <Box x={4.3} y={0.05} z={0.22} w={1.7} d={0.7} h={1.08} c={WHITE} />
    <FaceY y={0.75} x0={4.3} z1={1.3}>
      <rect x={6} y={8} width={52} height={92} rx={4} fill="#eef2ee" stroke="#c8d2cc" strokeWidth={2} />
      <rect x={14} y={20} width={20} height={26} rx={3} fill="#b7c4c8" />
      <rect x={62} y={8} width={52} height={92} fill="#cdeee3" stroke="#a5cbbf" strokeWidth={2} />
      <rect x={70} y={40} width={36} height={40} rx={4} fill="#8fb7b5" />
      {[0, 1, 2, 3].map(i => <circle key={i} cx={72 + i * 11} cy={22} r={4} fill="#fff" stroke="#9db" />)}
      <rect x={118} y={8} width={48} height={44} fill="#f6f6f2" stroke="#d1d1c9" strokeWidth={2} />
      <rect x={118} y={56} width={48} height={44} fill="#f6f6f2" stroke="#d1d1c9" strokeWidth={2} />
    </FaceY>
    <Box x={4.28} y={0.03} z={1.3} w={1.74} d={0.74} h={0.08} c={['#e0a463', '#c98a47', '#b77a3c']} />
    <Box x={4.3} y={0.05} z={1.38} w={1.7} d={0.07} h={1.0} c={['#fff', '#f4f3ee', '#e6e2d8']} />
    <Box x={4.3} y={0.12} z={1.38} w={0.06} d={0.5} h={1.0} c={MINT} />
    <Box x={5.94} y={0.12} z={1.38} w={0.06} d={0.5} h={1.0} c={MINT} />
    <Box x={4.3} y={0.05} z={2.3} w={1.7} d={0.55} h={0.08} c={['#e0a463', '#c98a47', '#b77a3c']} />
    <Box x={4.42} y={0.12} z={2.38} w={0.45} d={0.42} h={0.42} c={['#fafafa', '#ececec', '#dcdcdc']} />
    <FloorPlane z={1.385} x={4.95} y={0.2}>
      {[[0, 0], [24, 0], [0, 24], [24, 24]].map(([a, b], i) => <rect key={i} x={a} y={b} width={21} height={21} fill="#25262b" stroke="#55575f" strokeWidth={3} />)}
      <ellipse cx={80} cy={25} rx={18} ry={14} fill="#a8b0b4" />
    </FloorPlane>
    <g transform={`translate(${P(4.6, 0.45, 1.38)[0]} ${P(4.6, 0.45, 1.38)[1]})`}>
      <rect x={-9} y={-34} width={18} height={34} rx={5} fill="#e7739c" />
      <rect x={-7} y={-40} width={14} height={8} rx={3} fill="#f39dbb" />
    </g>
  </g>;
}

function Desk({ booksLeft }) {
  const bookC = [['#7ab6e8', '#5f9bd0', '#4f88bd'], ['#f3c95b', '#dfb246', '#cba03a'], ['#ef8f8f', '#d97777', '#c46464']];
  return <g>
    <Box x={0} y={2.3} w={0.85} d={0.8} h={1.2} c={WHITE} />
    <FaceX x={0.85} y1={3.1} z1={1.15}>{[0, 1, 2].map(i => <g key={i}><rect x={6} y={6 + i * 36} width={68} height={32} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={2} /><circle cx={40} cy={22 + i * 36} r={4} fill="#c9d6dd" /></g>)}</FaceX>
    <Box x={0} y={3.5} w={1.0} d={0.9} h={1.2} c={OAK} />
    <FaceX x={1.0} y1={4.4} z1={1.15}><rect x={8} y={6} width={74} height={100} fill="none" stroke="#b78f59" strokeWidth={2} /><path d="M22,14 A12,12 0 0 0 58,14" fill="#6b625a" /></FaceX>
    <Box x={0} y={2.2} z={1.2} w={1.15} d={2.25} h={0.08} c={OAK} />
    {bookC.slice(0, booksLeft).map((c, i) => <Box key={i} x={0.18} y={2.3} z={1.28 + i * 0.08} w={0.62} d={0.48} h={0.08} c={c} />)}
    {/* TV */}
    <Box x={0.32} y={3.05} z={1.28} w={0.32} d={0.42} h={0.04} c={['#2a2a2e', '#1d1d20', '#151517']} />
    <Box x={0.44} y={3.2} z={1.32} w={0.06} d={0.12} h={0.16} c={['#2a2a2e', '#1d1d20', '#151517']} />
    <Box x={0.42} y={2.55} z={1.45} w={0.1} d={1.4} h={0.92} c={['#2b2b30', '#202024', '#18181b']} />
  </g>;
}

function TVScreen({ T, CUES }) {
  const on = MOTION.enter(T, CUES.TV + 1.9, CUES.TV + 2.1) * (1 - prog(T, CUES.Tablet + 0.1, CUES.Tablet + 0.3));
  const k = T * 1.4;
  const hue = 190 + 40 * Math.sin(k * 0.6);
  const by = 60 - Math.abs(Math.sin(k * 2.2)) * 32;
  return <FaceX x={0.525} y1={3.9} z1={2.32}>
    <rect x={0} y={0} width={130} height={82} fill="#0e0f14" />
    <g opacity={on}>
      <rect x={0} y={0} width={130} height={82} fill={`hsl(${hue} 70% 72%)`} />
      <rect x={0} y={60} width={130} height={22} fill="#8fd18a" />
      <circle cx={100} cy={18} r={9} fill="#ffe27a" />
      <g transform={`translate(${40 + Math.sin(k) * 22} ${by})`}>
        <ellipse cx={0} cy={0} rx={13} ry={12} fill="#ff8fb8" />
        <circle cx={-4} cy={-3} r={2.4} fill="#222" /><circle cx={5} cy={-3} r={2.4} fill="#222" />
      </g>
    </g>
  </FaceX>;
}

function TVGlow({ T, CUES, night }) {
  const on = prog(T, CUES.TV + 1.9, CUES.TV + 2.2) * (1 - prog(T, CUES.Tablet + 0.1, CUES.Tablet + 0.3));
  const [cx, cy] = P(1.6, 3.2, 0.02);
  return <ellipse cx={cx} cy={cy} rx={170} ry={95} fill="url(#tvglow)" opacity={on * (0.55 + 0.1 * Math.sin(T * 7))} />;
}

function Overhead() {
  const handle = (y1) => <FaceX x={0.7} y1={y1} z1={3.9}><path d="M38,90 A16,14 0 0 1 72,90Z" fill="#5d564f" /><path d="M42,90 A12,9 0 0 1 68,90" fill="none" stroke="#d6d9dc" strokeWidth={3} /></FaceX>;
  return <g>
    <Box x={0} y={2.0} z={3.0} w={0.7} d={2.4} h={0.9} c={OAK} />
    <polygon points={pts([[0.7, 3.2, 3.0], [0.7, 3.2, 3.9]])} />
    <line x1={P(0.7, 3.2, 3.0)[0]} y1={P(0.7, 3.2, 3.0)[1]} x2={P(0.7, 3.2, 3.9)[0]} y2={P(0.7, 3.2, 3.9)[1]} stroke="#b28c57" strokeWidth={1.5} />
    {handle(3.2)}{handle(4.4)}
  </g>;
}

function Wardrobe() {
  return <g>
    <Box x={0} y={4.45} w={1.1} d={1.55} h={RH - 0.02} c={OAK} />
    <line x1={P(1.1, 5.22, 0.05)[0]} y1={P(1.1, 5.22, 0.05)[1]} x2={P(1.1, 5.22, 4.1)[0]} y2={P(1.1, 5.22, 4.1)[1]} stroke="#b28c57" strokeWidth={1.5} />
    <FaceX x={1.1} y1={5.22} z1={2.3}><path d="M0,-18 A14,18 0 0 1 0,18Z" fill="#5d564f" /></FaceX>
    <FaceX x={1.1} y1={6.0} z1={2.3}><path d="M78,-18 A14,18 0 0 0 78,18Z" fill="#5d564f" /></FaceX>
  </g>;
}

function CardBox({ clothesLeft }) {
  const cols = ['#c7b6e6', '#e86a6a', '#f6c9d7', '#bfe3d8', '#f2f2ee', '#8ec5ea'];
  return <g>
    <Box x={1.2} y={4.75} w={0.8} d={0.8} h={0.75} c={CARD} />
    <FloorPlane z={0.75} x={1.2} y={4.75}><rect x={6} y={6} width={68} height={68} fill="#8c6a45" /></FloorPlane>
    {cols.slice(0, clothesLeft).map((c, i) => <FloorPlane key={i} z={0.68 + i * 0.03} x={1.25} y={4.8}><ellipse cx={20 + (i * 23) % 45} cy={22 + (i * 17) % 40} rx={18} ry={14} fill={c} /></FloorPlane>)}
    <polygon points={pts([[2.0, 4.75, 0.75], [2.0, 5.55, 0.75], [2.3, 5.6, 0.95], [2.3, 4.8, 0.95]])} fill="#cfa877" stroke="rgba(70,45,25,.25)" />
  </g>;
}

// ---------- Plushies & clothes (screen-space sprites) ----------
function Plush({ kind, s = 1 }) {
  if (kind === 'bear') return <g transform={`scale(${s})`}>
    <circle cx={-13} cy={-44} r={7} fill="#f6c3cd" /><circle cx={13} cy={-44} r={7} fill="#f6c3cd" />
    <ellipse cx={0} cy={-12} rx={16} ry={14} fill="#f6c3cd" />
    <ellipse cx={0} cy={-11} rx={9} ry={8} fill="#fff4f6" />
    {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 3.5} cy={-11 + Math.sin(a * Math.PI / 180) * 3.5} r={2.6} fill="#f08fa8" />)}
    <circle cx={0} cy={-34} r={15} fill="#f8ccd4" />
    <ellipse cx={0} cy={-29} rx={7} ry={5} fill="#fff1f3" />
    <circle cx={-6} cy={-36} r={2.2} fill="#c2306a" /><circle cx={6} cy={-36} r={2.2} fill="#c2306a" />
    <path d="M-2,-31 L2,-31 0,-28Z" fill="#d62f7a" />
  </g>;
  if (kind === 'moon') return <g transform={`scale(${s})`}><path d="M10,-38 A20,20 0 1 0 14,-4" fill="none" stroke="#6c7fd6" strokeWidth={14} strokeLinecap="round" /><path d="M-12,-4 l-6,8 10,-2Z" fill="#9fe0e8" /></g>;
  if (kind === 'dino') return <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={-14} rx={18} ry={14} fill="#77c776" />
    <circle cx={12} cy={-28} r={10} fill="#77c776" />
    {[-10, -2, 6].map(x => <path key={x} d={`M${x - 4},-26 L${x},-34 ${x + 4},-26Z`} fill="#f39b4d" />)}
    <circle cx={15} cy={-30} r={2.2} fill="#222" />
  </g>;
  if (kind === 'sheep') return <g transform={`scale(${s})`}>
    {[[-10, -16], [0, -22], [10, -16], [-6, -8], [6, -8]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={10} fill="#fbf6ea" stroke="#e5dccb" />)}
    <ellipse cx={-16} cy={-22} rx={7} ry={8} fill="#5b4b44" />
    <circle cx={-18} cy={-24} r={1.6} fill="#fff" />
  </g>;
  return <g transform={`scale(${s})`}>
    <ellipse cx={-6} cy={-46} rx={4} ry={12} fill="#c8b1e8" /><ellipse cx={6} cy={-46} rx={4} ry={12} fill="#c8b1e8" />
    <circle cx={0} cy={-28} r={11} fill="#d3c0ee" />
    <ellipse cx={0} cy={-9} rx={13} ry={11} fill="#d3c0ee" />
    <circle cx={-4} cy={-29} r={1.8} fill="#333" /><circle cx={4} cy={-29} r={1.8} fill="#333" />
  </g>;
}
function Cloth({ c, stripe }) {
  return <g>
    <path d="M-24,-6 C-14,-14 6,-12 24,-8 C28,0 20,8 4,10 C-10,12 -26,8 -24,-6Z" fill={c} stroke="rgba(0,0,0,.12)" />
    {stripe && [-14, -4, 6, 16].map(x => <line key={x} x1={x} y1={-12} x2={x - 2} y2={10} stroke={stripe} strokeWidth={3} />)}
  </g>;
}

const PLUSH = [
  { kind: 'bear', to: [1.5, 0.75], rot: -12 },
  { kind: 'moon', to: [2.1, 1.45], rot: 18 },
  { kind: 'dino', to: [2.7, 0.65], rot: -8 },
  { kind: 'sheep', to: [1.0, 1.55], rot: 10 },
  { kind: 'bunny', to: [3.2, 1.35], rot: -15 },
];
const CLOTHES = [
  { c: '#c7b6e6', to: [3.1, 5.3], r: 20 },
  { c: '#f6f1f0', stripe: '#e86a6a', to: [3.8, 4.55], r: -30 },
  { c: '#f6c9d7', stripe: '#f2c66b', to: [2.1, 4.1], r: 50 },
  { c: '#bfe3d8', to: [4.5, 5.25], r: -10 },
  { c: '#f2f2ee', to: [3.3, 3.85], r: 80 },
  { c: '#8ec5ea', to: [1.6, 3.75], r: -60 },
];
const BOOKS = [{ to: [1.45, 2.6], r: 30, c: '#ef8f8f' }, { to: [1.8, 3.05], r: -25, c: '#f3c95b' }, { to: [1.35, 3.35], r: 70, c: '#7ab6e8' }];

// ---------- Girl ----------
const SKIN = '#f6d2b8', SKIN_D = '#e9b99b';
function Girl({ g, dress, hair, T }) {
  const { facing, flip, walk, armL, armR, mode, blink, sleep } = g;
  const sx = flip ? -1 : 1;
  const legA = walk != null ? Math.sin(walk) * 24 : 0;
  const bob = walk != null ? -Math.abs(Math.cos(walk)) * 4 : 0;
  const pony = Math.sin(T * 6) * 6 + (walk != null ? Math.sin(walk) * 10 : 0) + (g.ponyKick || 0);
  const back = facing === 'back';
  const hairD = shade(hair, -0.18), hairL = shade(hair, 0.22);
  const sit = mode === 'sit';
  const arm = (side, ang) => <g transform={`translate(${side * 15} -98) rotate(${ang})`}>
    <rect x={-5} y={-3} width={10} height={44} rx={5} fill={SKIN} />
    <rect x={-6} y={-4} width={12} height={14} rx={6} fill={dress} />
  </g>;
  return <g transform={`scale(${sx} 1) translate(0 ${bob + (sit ? 42 : 0)})`}>
    <ellipse cx={0} cy={sit ? -40 : 0} rx={30} ry={9} fill="rgba(60,30,10,.18)" />
    {!sit && <g>
      <g transform={`translate(-8 -50) rotate(${legA})`}><rect x={-5} y={0} width={10} height={46} rx={5} fill="#9b7cc4" /><ellipse cx={2} cy={47} rx={8} ry={5} fill="#e96d9a" /></g>
      <g transform={`translate(8 -50) rotate(${-legA})`}><rect x={-5} y={0} width={10} height={46} rx={5} fill="#9b7cc4" /><ellipse cx={2} cy={47} rx={8} ry={5} fill="#e96d9a" /></g>
    </g>}
    {sit && <g><ellipse cx={0} cy={-46} rx={34} ry={12} fill="#9b7cc4" /><ellipse cx={-26} cy={-44} rx={7} ry={5} fill="#e96d9a" /><ellipse cx={26} cy={-44} rx={7} ry={5} fill="#e96d9a" /></g>}
    {back && arm(-1, armL)}{back && arm(1, -armR)}
    {/* ponytail behind head */}
    {!back && <g transform={`translate(22 -150) rotate(${pony})`}><path d="M0,0 C18,4 22,30 10,46 C4,30 -2,16 0,0Z" fill={hairD} /></g>}
    <path d="M-16,-106 L16,-106 L27,-46 Q0,-40 -27,-46Z" fill={dress} />
    <path d="M-27,-46 Q0,-40 27,-46 L28,-42 Q0,-36 -28,-42Z" fill={shade(dress, -0.15)} />
    {!back && <circle cx={0} cy={-80} r={0} />}
    {!back && arm(-1, armL)}{!back && arm(1, -armR)}
    <rect x={-5} y={-114} width={10} height={10} fill={SKIN_D} />
    {/* head */}
    <ellipse cx={0} cy={-136} rx={33} ry={34} fill={hairD} />
    {!back && <g>
      <circle cx={0} cy={-134} r={27} fill={SKIN} />
      <path d="M-29,-136 C-28,-168 26,-176 30,-138 C20,-150 4,-156 -6,-150 C-14,-146 -22,-142 -29,-136Z" fill={hair} />
      <path d="M-4,-160 C6,-163 14,-160 20,-154" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" />
      {sleep ? <g fill="none" stroke="#5a3d32" strokeWidth={2.5} strokeLinecap="round"><path d="M-14,-132 q5,4 10,0" /><path d="M5,-132 q5,4 10,0" /></g>
        : <g><ellipse cx={-9} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /><ellipse cx={10} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /></g>}
      <circle cx={-17} cy={-123} r={5} fill="#f5a3b4" opacity={.7} /><circle cx={18} cy={-123} r={5} fill="#f5a3b4" opacity={.7} />
      <path d={g.mouthOpen ? 'M-5,-120 q5,8 10,0Z' : 'M-5,-121 q5,5 10,0'} fill={g.mouthOpen ? '#c2475f' : 'none'} stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />
    </g>}
    {back && <g>
      <path d="M-30,-140 C-30,-110 -20,-100 0,-100 C20,-100 30,-110 30,-140Z" fill={hairD} />
      <path d="M-12,-160 C0,-166 12,-162 18,-152" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" />
      <g transform={`translate(0 -158) rotate(${pony})`}><circle cx={0} cy={0} r={6} fill="#e96d9a" /><path d="M-6,2 C-14,20 -8,38 4,44 C8,28 10,14 6,2Z" fill={hair} /></g>
    </g>}
  </g>;
}

function GirlLying({ dress, hair, T, kick, tablet, sleep }) {
  const hairD = shade(hair, -0.18);
  const k1 = sleep ? 10 : 40 + Math.sin(T * 5) * 30 * kick, k2 = sleep ? 5 : 40 + Math.sin(T * 5 + 2) * 30 * kick;
  const breath = sleep ? Math.sin(T * 2) * 1.5 : 0;
  return <g>
    <ellipse cx={-10} cy={4} rx={80} ry={10} fill="rgba(60,30,10,.12)" />
    {[k1, k2].map((k, i) => <g key={i} transform={`translate(${-48 - i * 3} ${-8 - i * 2})`}>
      <rect x={-34} y={-5} width={36} height={11} rx={5} fill="#9b7cc4" />
      <g transform={`translate(-32 0) rotate(${-k - 90})`}><rect x={-5} y={0} width={10} height={36} rx={5} fill="#9b7cc4" /><ellipse cx={0} cy={37} rx={7} ry={5} fill="#e96d9a" /></g>
    </g>)}
    <ellipse cx={-10} cy={-12 - breath} rx={44} ry={15} fill={dress} />
    <rect x={30} y={-30} width={10} height={14} fill={SKIN_D} />
    <g transform={`translate(54 -30) rotate(${sleep ? 0 : 10})`}>
      <ellipse cx={0} cy={-2} rx={31} ry={30} fill={hairD} />
      <circle cx={0} cy={0} r={25} fill={SKIN} />
      <path d="M-27,-2 C-26,-32 24,-38 28,-4 C18,-16 4,-20 -6,-15 C-14,-11 -20,-8 -27,-2Z" fill={hair} />
      <g fill="none" stroke="#5a3d32" strokeWidth={2.5} strokeLinecap="round"><path d="M-12,4 q5,4 10,0" /><path d="M6,4 q5,4 10,0" /></g>
      <circle cx={-14} cy={12} r={4.5} fill="#f5a3b4" opacity={.7} /><circle cx={17} cy={12} r={4.5} fill="#f5a3b4" opacity={.7} />
      <path d="M-3,14 q4,4 8,0" fill="none" stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />
    </g>
    {tablet > 0.01 && <g transform={`translate(96 -14) scale(${tablet}) rotate(-8)`}>
      <rect x={-22} y={-30} width={44} height={32} rx={6} fill="#ff8fbf" />
      <rect x={-18} y={-26} width={36} height={24} rx={3} fill={`hsl(${(T * 80) % 360} 75% 80%)`} />
      <circle cx={0} cy={-14} r={5} fill="#fff" opacity={.9} />
    </g>}
    <g transform={`translate(${sleep ? 30 : 74} -10)`}><rect x={-4} y={-4} width={30} height={9} rx={4} fill={SKIN} /></g>
  </g>;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// ---------- Choreography ----------
function walkSeg(T, a, b, from, to) {
  const p = prog(T, a, b);
  const e = E.easeInOutSine(p);
  return { x: lerp(from[0], to[0], e), y: lerp(from[1], to[1], e), walking: T > a && T < b, flip: (P(...to)[0] - P(...from)[0]) < 0 };
}

function girlState(T, Q) {
  const base = { mode: 'stand', facing: 'front', flip: false, walk: null, armL: 8, armR: 8, z: 0, op: 1, blink: 0, sleep: false, mouthOpen: false };
  const blinkP = (T % 3.3); base.blink = blinkP < 0.12 ? 1 : 0;
  const W = (seg) => { Object.assign(base, { x: seg.x, y: seg.y, flip: seg.flip }); if (seg.walking) { base.walk = T * 11; base.armL = Math.sin(T * 11) * 22; base.armR = -Math.sin(T * 11) * 22; } };
  const A = 0, TV = Q.TV, TB = Q.Tablet, PL = Q.Plushies, MS = Q.Mess, BD = Q.Bedtime;
  if (T < TV) {
    base.op = prog(T, 1.15, 1.4);
    W(walkSeg(T, 1.3, 3.5, [6.5, 0.6], [3.5, 3.5]));
    if (T > 3.5) { base.armR = 150 + Math.sin(T * 14) * 20; base.mouthOpen = true; base.flip = false; }
    return base;
  }
  if (T < TB) {
    W(walkSeg(T, TV + 0.4, TV + 1.3, [3.5, 3.5], [2.1, 3.3]));
    if (T > TV + 1.35) { base.facing = 'back'; base.mode = 'sit'; base.flip = false;
      const sway = Math.sin((T - TV) * 4); base.x += 0; base.armL = 20 + sway * 5; base.armR = 20 - sway * 5;
      const clap = Math.max(prog(T, TV + 3.4, TV + 3.6) * (1 - prog(T, TV + 4.0, TV + 4.3)), prog(T, TV + 4.6, TV + 4.8) * (1 - prog(T, TV + 5.2, TV + 5.6)));
      base.armL = lerp(base.armL, 160 + Math.sin(T * 20) * 10, clap); base.armR = lerp(base.armR, 160 - Math.sin(T * 20) * 10, clap);
      base.z = clap * Math.abs(Math.sin(T * 10)) * 0.12;
    }
    return base;
  }
  if (T < PL) {
    if (T < TB + 0.85) { W(walkSeg(T, TB + 0.15, TB + 0.8, [2.1, 3.3], [2.3, 2.35])); return base; }
    const hp = prog(T, TB + 0.85, TB + 1.35);
    if (hp < 1) { base.x = lerp(2.3, 2.3, hp); base.y = lerp(2.35, 1.4, hp); base.z = lerp(0, 0.95, hp) + MOTION.arc(hp, 0.6); base.armL = base.armR = 150; return base; }
    return { mode: 'lie', x: 2.25, y: 1.05, z: 0.95, kick: prog(T, TB + 1.5, TB + 2), tablet: MOTION.pop(T, TB + 1.6, TB + 2.0), sleep: false, op: 1 };
  }
  if (T < MS) {
    const hp = prog(T, PL + 0.1, PL + 0.6);
    if (hp < 1) { if (T < PL + 0.1) return { mode: 'lie', x: 2.25, y: 1.05, z: 0.95, kick: 1, tablet: 1 - prog(T, PL - 0.3, PL), op: 1 };
      base.x = lerp(2.3, 4.0, hp); base.y = lerp(1.4, 2.6, hp); base.z = lerp(0.95, 0, hp) + MOTION.arc(hp, 0.6); base.armL = base.armR = 140; return base; }
    base.x = 4.0; base.y = 2.6; base.flip = true;
    for (let i = 0; i < PLUSH.length; i++) {
      const t0 = PL + 1 + i;
      if (T > t0 - 0.45 && T < t0 + 0.3) {
        const pre = prog(T, t0 - 0.45, t0 - 0.15), up = prog(T, t0 - 0.15, t0), after = prog(T, t0, t0 + 0.3);
        base.armL = base.armR = lerp(lerp(10, -20, pre), 170, up) * (1 - after * 0.6) + after * 0;
        base.z = -0.0; base.crouch = pre * (1 - up);
        base.mouthOpen = up > 0;
      }
    }
    if (T > PL + 6) { const j = Math.abs(Math.sin((T - PL - 6) * 7)) * prog(T, PL + 6, PL + 6.2) * (1 - prog(T, PL + 6.8, MS)); base.z = j * 0.15; base.armL = base.armR = 60 + j * 90; base.mouthOpen = true; }
    return base;
  }
  if (T < BD) {
    W(walkSeg(T, MS + 0.05, MS + 1.2, [4.0, 2.6], [2.55, 4.95]));
    if (T > MS + 1.2) { base.flip = true; }
    for (let i = 0; i < CLOTHES.length; i++) {
      const t0 = MS + 1.4 + i * 0.36;
      if (T > t0 - 0.2 && T < t0 + 0.16) { const p = prog(T, t0 - 0.2, t0 + 0.16); base.armL = 20 + Math.sin(p * Math.PI) * 150; base.armR = 20 + Math.sin(p * Math.PI + 1) * 130; base.mouthOpen = true; }
    }
    if (T > MS + 4.0) { base.flip = false; const j = prog(T, MS + 4.0, MS + 4.3); base.armL = base.armR = lerp(20, 155, j); base.mouthOpen = true; base.z = MOTION.arc(prog(T, MS + 4.3, MS + 4.8), 0.35); }
    return base;
  }
  if (T < BD + 1.5) { W(walkSeg(T, BD + 0.1, BD + 1.4, [2.55, 4.95], [2.3, 2.35])); return base; }
  const hp = prog(T, BD + 1.5, BD + 2.0);
  if (hp < 1) { base.x = 2.3; base.y = lerp(2.35, 1.4, hp); base.z = lerp(0, 0.95, hp) + MOTION.arc(hp, 0.6); base.armL = base.armR = 150; return base; }
  return { mode: 'lie', x: 2.25, y: 1.05, z: 0.95, kick: 0, tablet: 0, sleep: T > BD + 2.6, op: 1 };
}

function camAt(T, Q) {
  const f = (x, y, z, zoom) => { const p = P(x, y, z); return [p[0], p[1], zoom]; };
  const K = [
    [0, f(3.5, 3, 1.2, 0.96)], [Q.TV + 0.4, f(3.5, 3, 1.2, 1.03)],
    [Q.TV + 1.6, f(1.4, 3.2, 1.3, 1.6)], [Q.Tablet - 0.2, f(1.3, 3.2, 1.3, 1.7)],
    [Q.Tablet + 1.2, f(2.2, 1.1, 1.1, 1.75)], [Q.Plushies - 0.1, f(2.2, 1.1, 1.0, 1.9)],
    [Q.Plushies + 0.8, f(3.0, 1.8, 1.1, 1.4)], [Q.Mess - 0.2, f(3.0, 1.8, 1.1, 1.46)],
    [Q.Mess + 1.2, f(2.7, 3.9, 0.9, 1.2)], [Q.Bedtime - 0.1, f(2.7, 3.9, 0.9, 1.27)],
    [Q.Bedtime + 2.0, f(2.2, 1.2, 1.1, 1.5)], [Q.Bedtime + 6, f(2.2, 1.1, 1.1, 1.62)],
  ];
  let i = 0; while (i < K.length - 2 && T > K[i + 1][0]) i++;
  const [ta, a] = K[i], [tb, b] = K[i + 1];
  const e = E.easeInOutCubic(prog(T, ta, tb));
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
}

function screenArc(from, to, p, h) { return [lerp(from[0], to[0], p), lerp(from[1], to[1], p) - MOTION.arc(p, h)]; }

function Piece({ tw }) {
  const { T, CUES: Q, time } = useComp();
  const g = girlState(T, Q);
  const [cx, cy, z] = camAt(T, Q);
  const dress = tw.dressColor, hair = tw.hairColor;
  const gp = g.x != null ? P(g.x, g.y, g.z) : P(2.25, 1.05, 0.95);
  const hand = [gp[0] + (g.flip ? 10 : -10), gp[1] - 170];

  // plushies
  const plush = PLUSH.map((pl, i) => {
    const t0 = Q.Plushies + 1 + i, p = prog(T, t0, t0 + 0.75);
    const basket = P(4.95, 2.75, 0.55), land = P(pl.to[0], pl.to[1], 0.95);
    let pos, rot = 0, sc = 1, show = true;
    if (T < t0 - 0.15) { pos = [basket[0] - 18 + i * 9, basket[1] + 4 - (i % 2) * 6]; sc = 0.8; }
    else if (T < t0) { pos = [lerp(basket[0], hand[0], prog(T, t0 - 0.15, t0)), lerp(basket[1], hand[1], prog(T, t0 - 0.15, t0))]; }
    else if (p < 1) { pos = screenArc(hand, land, E.easeOutQuad(p), 120); rot = p * 360 + pl.rot; }
    else { pos = land; rot = pl.rot; const sq = 1 - prog(T, t0 + 0.75, t0 + 1.05); sc = 1 + Math.sin(sq * Math.PI) * 0.15; }
    return show && <g key={i} transform={`translate(${pos[0]} ${pos[1]}) rotate(${rot}) scale(${sc} ${2 - sc})`}><Plush kind={pl.kind} s={1.15} /></g>;
  });
  const inBasket = PLUSH.filter((_, i) => T < Q.Plushies + 1 + i - 0.15).length;

  const boxTop = P(1.6, 5.15, 0.8);
  const clothes = CLOTHES.map((c, i) => {
    const t0 = Q.Mess + 1.4 + i * 0.36;
    if (T < t0) return null;
    const p = prog(T, t0, t0 + 0.7), land = P(c.to[0], c.to[1], 0.02);
    const pos = screenArc(boxTop, land, p, 160);
    const flat = p >= 1 ? 0.55 : 1;
    return <g key={i} transform={`translate(${pos[0]} ${pos[1]}) scale(${1.6} ${1.6 * flat}) rotate(${p < 1 ? p * 540 : c.r})`}><Cloth c={c.c} stripe={c.stripe} /></g>;
  });
  const clothesLeft = CLOTHES.length - CLOTHES.filter((_, i) => T >= Q.Mess + 1.4 + i * 0.36).length;

  const books = BOOKS.map((b, i) => {
    const t0 = Q.Mess + 3.5 + i * 0.14;
    if (T < t0) return null;
    const from = P(0.5, 2.55, 1.5 - i * 0.08), land = P(b.to[0], b.to[1], 0.02), p = E.easeInQuad(prog(T, t0, t0 + 0.45));
    const pos = screenArc(from, land, p, 30);
    return <g key={i} transform={`translate(${pos[0]} ${pos[1]}) rotate(${lerp(0, b.r, p)}) scale(1 ${p >= 1 ? 0.6 : 1})`}><rect x={-20} y={-14} width={40} height={28} rx={2} fill={b.c} stroke="rgba(0,0,0,.15)" /><rect x={-20} y={-14} width={6} height={28} fill="rgba(0,0,0,.15)" /></g>;
  });
  const booksLeft = 3 - BOOKS.filter((_, i) => T >= Q.Mess + 3.5 + i * 0.14).length;

  // sparkles for proud moment and tablet
  const sparkle = (t0, n, at, spread, color) => Array.from({ length: n }, (_, i) => {
    const p = prog(T, t0 + i * 0.05, t0 + 0.9 + i * 0.05); if (p <= 0 || p >= 1) return null;
    const a = (i / n) * Math.PI * 2;
    return <circle key={i} cx={at[0] + Math.cos(a) * spread * E.easeOutCubic(p)} cy={at[1] + Math.sin(a) * spread * 0.7 * E.easeOutCubic(p) - p * 20} r={6 * (1 - p)} fill={color[i % color.length]} />;
  });
  const cols = ['#ffd45e', '#ff8fbf', '#8ec5ea', '#9be3a4'];
  const tabletSpark = T > Q.Tablet + 2 && T < Q.Plushies - 0.3 ? [0, 1, 2, 3].map(i => {
    const ph = ((T - Q.Tablet) * 0.8 + i * 0.25) % 1; const base = P(2.75, 1.0, 1.3);
    return <circle key={i} cx={base[0] + Math.sin(ph * 6 + i) * 14 + i * 8} cy={base[1] - ph * 70} r={5 * (1 - ph)} fill={cols[i]} opacity={1 - ph} />;
  }) : null;

  const dim = prog(T, Q.Bedtime + 2.4, Q.Bedtime + 3.6) * 0.62;
  const fade = Math.max(1 - prog(T, 0, 0.7), prog(T, Q.Bedtime + 5.2, Q.Bedtime + 6));
  const zzz = T > Q.Bedtime + 3 ? [0, 1, 2].map(i => {
    const ph = ((T - Q.Bedtime - 3) * 0.6 + i / 3) % 1; const base = P(2.6, 1.0, 1.6);
    return <text key={i} x={base[0] + 20 + ph * 40} y={base[1] - ph * 90} fontSize={22 + ph * 18} fontFamily="'Baloo 2', 'Comic Sans MS', sans-serif" fontWeight="700" fill="#fff6d8" opacity={Math.sin(ph * Math.PI)}>z</text>;
  }) : null;

  const lie = g.mode === 'lie';
  const crouch = g.crouch || 0;
  return <div data-screen-label={`t=${Math.floor(time)}s`} style={{ position: 'absolute', inset: 0, background: '#efe2d0' }}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <clipPath id="floorclip"><rect x={0} y={0} width={700} height={600} /></clipPath>
        <radialGradient id="tvglow"><stop offset="0" stopColor="#bfe6ff" stopOpacity=".7" /><stop offset="1" stopColor="#bfe6ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="vign" cx=".5" cy=".5" r=".75"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#3a2412" stopOpacity=".25" /></radialGradient>
        <radialGradient id="tabglow"><stop offset="0" stopColor="#ffd0e6" stopOpacity=".9" /><stop offset="1" stopColor="#ffd0e6" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <ellipse cx={960} cy={1010} rx={620} ry={60} fill="rgba(90,60,30,.12)" />
        <Room />
        <Door T={T} CUES={Q} />
        <Bed />
        <Kitchen />
        <Desk booksLeft={booksLeft} />
        <TVScreen T={T} CUES={Q} />
        <Overhead />
        <TVGlow T={T} CUES={Q} />
        {books}
        <Box x={4.6} y={2.4} w={0.7} d={0.7} h={0.55} c={['#d9a868', '#c89356', '#b17f46']} />
        {plush.slice(0, PLUSH.length)}
        <CardBox clothesLeft={clothesLeft} />
        {clothes}
        <g opacity={g.op} transform={`translate(${gp[0]} ${gp[1]})`}>
          {lie ? <g transform="rotate(27)"><GirlLying dress={dress} hair={hair} T={T} kick={g.kick} tablet={g.tablet} sleep={g.sleep} /></g>
            : <g transform={`scale(1 ${1 - crouch * 0.12})`}><Girl g={g} dress={dress} hair={hair} T={T} /></g>}
        </g>
        {tabletSpark}
        {sparkle(Q.Mess + 4.3, 12, [gp[0], gp[1] - 120], 130, cols)}
        {sparkle(Q.Plushies + 6.1, 10, P(2.2, 1.1, 1.3), 150, cols)}
        <Wardrobe />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vign)" />
      <rect x={0} y={0} width={1920} height={1080} fill="#1a1c3d" opacity={dim} />
      {dim > 0 && (() => { const [lx, ly] = P(2.25, 1.05, 1.0); const sx = (lx - cx) * z + 960, sy = (ly - cy) * z + 540; return <ellipse cx={sx} cy={sy} rx={260 * z} ry={150 * z} fill="url(#tabglow)" opacity={dim * 0.5} />; })()}
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>{zzz}</g>
      <rect x={0} y={0} width={1920} height={1080} fill="#120d0a" opacity={fade} />
    </svg>
  </div>;
}

function RoomApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  return <>
    <window.CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} background="#efe2d0">
      <Piece tw={t} />
    </window.CompositionStage>
    <window.TweaksPanel>
      <window.TweakSection label="Editor" />
      <window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
      <window.TweakSection label="Character" />
      <window.TweakColor label="Hair" value={t.hairColor} options={['#c49a5e', '#d8b26e', '#9c7044', '#e2c48a']} onChange={(v) => setTweak('hairColor', v)} />
      <window.TweakColor label="Outfit" value={t.dressColor} options={['#5b9bd5', '#e86a92', '#7cc9a8', '#f2b84b']} onChange={(v) => setTweak('dressColor', v)} />
    </window.TweaksPanel>
  </>;
}
window.RoomApp = RoomApp;
