// Shared isometric kit for every room. Projection numbers, Plane and Box are identical to room-scene.jsx (Messy Room),
// so all rooms line up and share one look. Exports window.Iso.
const S = 88, C = 0.866, OX = 922, OY = 430;
const P = (x, y, z = 0) => { if (window.__trackP) window.__trackP(x, y, z); return [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S]; };
const pts = (arr) => arr.map(p => P(...p).join(',')).join(' ');

// Draw on any plane: o origin, u/v unit vectors (world). Children use 100 units = 1 world unit.
function Plane({ o, u, v, children, ...rest }) {
  const p0 = P(...o), pu = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]), pv = P(o[0] + v[0], o[1] + v[1], o[2] + v[2]);
  const m = [(pu[0] - p0[0]) / 100, (pu[1] - p0[1]) / 100, (pv[0] - p0[0]) / 100, (pv[1] - p0[1]) / 100, p0[0], p0[1]];
  return <g transform={`matrix(${m.join(' ')})`} {...rest}>{children}</g>;
}
const FloorPlane = ({ z = 0, x = 0, y = 0, children }) => <Plane o={[x, y, z]} u={[1, 0, 0]} v={[0, 1, 0]}>{children}</Plane>;
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

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// ---------- Room shell pieces (same colours as Messy Room) ----------
function Slab({ RX, RY }) {
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#8a5a33" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#734a29" />
  </g>;
}
// Back wall on y = 0. Plane coords: x*100 to the right, (RH - z)*100 downwards. `holes` = SVG path cut out of the wall.
function BackWallY({ RX, RH, holes = '', fill = '#f5e8cf' }) {
  return <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>
    <path d={`M0,0 H${RX * 100} V${RH * 100} H0 Z ${holes}`} fill={fill} fillRule="evenodd" />
  </Plane>;
}
const BackWallX = ({ RY, RH, fill = '#e9d6b6' }) => <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, RH], [0, 0, RH]])} fill={fill} />;
function WallCap({ RX, RY, RH }) {
  return <g>
    <polygon points={pts([[-0.2, -0.2, RH], [RX, -0.2, RH], [RX, 0, RH], [0, 0, RH], [0, RY, RH], [-0.2, RY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[RX, -0.2, RH], [RX, 0, RH], [RX, 0, -0.35], [RX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, RY, RH], [0, RY, RH], [0, RY, -0.35], [-0.2, RY, -0.35]])} fill="#cdb791" />
  </g>;
}
// Flat strips on the back walls (skirting, dado rail, coving).
const StripY = ({ x0, x1, z0, z1, fill, y = 0.01 }) => <polygon points={pts([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]])} fill={fill} />;
const StripX = ({ y0, y1, z0, z1, fill, x = 0.01 }) => <polygon points={pts([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]])} fill={fill} />;
// Round-topped opening, as a path in BackWallY plane coords.
function archPath(RH, x0, x1, zBottom, zSpring) {
  const r = (x1 - x0) * 50, a = x0 * 100, b = x1 * 100, yb = (RH - zBottom) * 100, ys = (RH - zSpring) * 100;
  return `M${a},${yb} V${ys} A${r},${r} 0 0 1 ${b},${ys} V${yb} Z`;
}

// Six-panel white door with brass lever, drawn in a wall plane (origin = top-left of the door leaf).
function PanelDoorArt({ w = 95, h = 330, hinge = 'left' }) {
  const cols = [[12, w / 2 - 6], [w / 2 + 5, w - 12]];
  const rows = [[16, 92], [108, 196], [212, 312]];
  const hx = hinge === 'left' ? w - 14 : 14;
  return <g>
    <rect x={-11} y={-11} width={w + 22} height={h + 11} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    <rect x={0} y={0} width={w} height={h} fill="#f8f3ea" stroke="#d6cab3" strokeWidth={1.5} />
    {cols.map(([a, b], i) => rows.map(([c, d], j) => <g key={i + '-' + j}>
      <rect x={a} y={c} width={b - a} height={d - c} fill="#f0e9db" stroke="#ddd1bc" strokeWidth={2} />
      <rect x={a + 5} y={c + 5} width={b - a - 10} height={d - c - 10} fill="#faf6ee" />
    </g>))}
    <rect x={hx - 3.5} y={h * 0.52 - 16} width={7} height={30} rx={2} fill="#c9a54a" />
    <rect x={hinge === 'left' ? hx - 16 : hx - 2} y={h * 0.52 - 9} width={18} height={5} rx={2.5} fill="#b9973f" />
  </g>;
}

// Room-name tag floating at a world point (toggle with showLabels).
function Tag({ at, text, show = true }) {
  if (!show) return null;
  const [x, y] = P(...at); const w = text.length * 8.6 + 26;
  return <g transform={`translate(${x} ${y})`} pointerEvents="none">
    <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill="#3b2a24" opacity={.88} />
    <text x={0} y={6} textAnchor="middle" fontSize={16} fontFamily="'Baloo 2', 'Comic Sans MS', sans-serif" fontWeight="700" fill="#fff6ea">{text}</text>
  </g>;
}

// Static 1920×1080 stage, framed on (cx, cy) at `zoom` — same framing transform Messy Room's camera uses.
function IsoStage({ children }) { return <g>{children}</g>; }

window.Iso = { S, C, OX, OY, P, pts, Plane, FloorPlane, FaceX, FaceY, Box, OAK, WHITE, MINT, CARD, shade, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, archPath, PanelDoorArt, Tag, IsoStage };
