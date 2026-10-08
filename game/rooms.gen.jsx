import React from 'react';
window.React = React;
// Scenes are called as plain functions by the game, so hooks are replaced with simple stand-ins.
const __memo = new Map(); let __mk = '', __mi = 0;
window.__sceneBegin = k => { __mk = k; __mi = 0; };
const FakeReact = { ...React, useMemo: f => { const k = __mk + ':' + (__mi++); if (!__memo.has(k)) __memo.set(k, f()); return __memo.get(k); },
  useState: v => [typeof v === 'function' ? v() : v, () => {}], useEffect: () => {}, useLayoutEffect: () => {}, useRef: v => ({ current: v }), useCallback: f => f };

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
// House builder catalogue: every buyable item as a stack of iso boxes. Exports window.HBItems.
// Item: { id, n: name, c: category, p: price, f: [w, d] footprint in grid cells, b: [[x,y,z,w,d,h,hex], …] back-to-front, wall: true if hung on the back wall }
const { P, Box } = window.Iso;
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, '0')).join('');
}
const OAK = '#d9b47e', WAL = '#8a5a3a', WHT = '#f1ece2', GRY = '#9aa0a6', NAV = '#3d4a6b', TEA = '#3f8a8a', PNK = '#e8a2b4', MUS = '#e3b04f',
  GRN = '#5f9a3e', RED = '#d9465f', LIL = '#b9a3e3', BLK = '#34343a', SKY = '#5fa8d8', CRM = '#f4e7cf', STL = '#c9ccd1', TER = '#c9774f', LEAF = '#4f9a5a';

const CATS = [
  { id: 'beds', label: 'Beds' }, { id: 'seating', label: 'Seating' }, { id: 'tables', label: 'Tables & desks' }, { id: 'storage', label: 'Storage' },
  { id: 'kitchen', label: 'Kitchen' }, { id: 'bathroom', label: 'Bathroom' }, { id: 'lights', label: 'Lights' }, { id: 'plants', label: 'Plants' },
  { id: 'art', label: 'Wall art' }, { id: 'toys', label: 'Toys & games' }, { id: 'tech', label: 'Tech' }, { id: 'pets', label: 'Pet stuff' },
];
const I = (id, n, c, p, f, b, wall) => ({ id, n, c, p, f, b, wall });
const posts = (w, d, h, col, t = 0.14) => [[0, 0, 0, t, t, h, col], [w - t, 0, 0, t, t, h, col], [0, d - t, 0, t, t, h, col], [w - t, d - t, 0, t, t, h, col]];
const pot = (x, y, s, col = TER) => [x, y, 0, s, s, s * 0.9, col];

const ITEMS = [
  // Beds
  I('bed-single', 'Single bed', 'beds', 40, [2, 3], [[0.1, 0.1, 0, 1.6, 0.2, 1.3, OAK], [0.1, 0.1, 0, 1.6, 2.8, 0.45, OAK], [0.15, 0.3, 0.45, 1.5, 2.55, 0.25, WHT], [0.35, 0.4, 0.7, 1.1, 0.45, 0.16, '#ffffff'], [0.15, 1.1, 0.5, 1.5, 1.75, 0.26, SKY]]),
  I('bed-double', 'Double bed', 'beds', 70, [3, 3], [[0.1, 0.1, 0, 2.8, 0.22, 1.5, WAL], [0.1, 0.1, 0, 2.8, 2.8, 0.45, WAL], [0.15, 0.32, 0.45, 2.7, 2.53, 0.26, WHT], [0.3, 0.42, 0.71, 1.1, 0.45, 0.16, '#ffffff'], [1.6, 0.42, 0.71, 1.1, 0.45, 0.16, '#ffffff'], [0.15, 1.1, 0.5, 2.7, 1.75, 0.28, PNK]]),
  I('bed-bunk', 'Bunk beds', 'beds', 85, [2, 3], [[0.1, 0.1, 0.1, 1.6, 2.8, 0.35, OAK], [0.15, 0.15, 0.45, 1.5, 2.7, 0.2, NAV], [0.1, 0.1, 1.55, 1.6, 2.8, 0.3, OAK], [0.15, 0.15, 1.85, 1.5, 2.7, 0.2, RED], ...posts(1.8, 3, 2.6, shade(OAK, -0.15))]),
  I('bed-cot', 'Cot', 'beds', 35, [2, 2], [[0.15, 0.15, 0, 1.5, 1.5, 0.5, WHT], [0.2, 0.2, 0.5, 1.4, 1.4, 0.15, '#fff6ea'], [0.15, 0.15, 0.5, 1.5, 0.08, 0.7, WHT], [0.15, 0.15, 0.5, 0.08, 1.5, 0.7, WHT], [1.57, 0.15, 0.5, 0.08, 1.5, 0.7, WHT], [0.15, 1.57, 0.5, 1.5, 0.08, 0.7, WHT]]),
  I('bed-day', 'Day bed', 'beds', 55, [3, 2], [[0.1, 0.1, 0, 2.8, 0.25, 1.1, LIL], [0.1, 0.1, 0, 2.8, 1.6, 0.5, LIL], [0.1, 0.1, 0, 0.25, 1.6, 0.9, shade(LIL, -0.1)], [0.35, 0.35, 0.5, 2.3, 1.3, 0.2, WHT], [2.65, 0.1, 0, 0.25, 1.6, 0.9, shade(LIL, -0.1)]]),
  I('bed-canopy', 'Canopy bed', 'beds', 120, [3, 3], [...posts(3, 3, 3, WHT).slice(0, 2), [0.1, 0.1, 0, 2.8, 2.8, 0.45, WHT], [0.15, 0.3, 0.45, 2.7, 2.55, 0.26, '#fff'], [0.15, 1.1, 0.5, 2.7, 1.75, 0.3, MUS], ...posts(3, 3, 3, WHT).slice(2), [0, 0, 2.9, 3, 3, 0.12, PNK]]),
  // Seating
  I('chair-arm', 'Armchair', 'seating', 30, [2, 2], [[0.2, 0.2, 0, 1.5, 0.35, 1.1, TEA], [0.2, 0.2, 0, 1.5, 1.5, 0.5, TEA], [0.2, 0.2, 0, 0.3, 1.5, 0.8, shade(TEA, -0.1)], [0.5, 0.55, 0.5, 0.9, 1.1, 0.15, shade(TEA, 0.15)], [1.4, 0.2, 0, 0.3, 1.5, 0.8, shade(TEA, -0.1)]]),
  I('sofa-2', 'Two-seat sofa', 'seating', 50, [3, 2], [[0.1, 0.2, 0, 2.8, 0.4, 1.1, MUS], [0.1, 0.2, 0, 2.8, 1.5, 0.5, MUS], [0.1, 0.2, 0, 0.3, 1.5, 0.8, shade(MUS, -0.1)], [0.4, 0.6, 0.5, 1.1, 1.1, 0.15, shade(MUS, 0.15)], [1.5, 0.6, 0.5, 1.1, 1.1, 0.15, shade(MUS, 0.15)], [2.6, 0.2, 0, 0.3, 1.5, 0.8, shade(MUS, -0.1)]]),
  I('sofa-3', 'Three-seat sofa', 'seating', 75, [4, 2], [[0.1, 0.2, 0, 3.8, 0.4, 1.1, NAV], [0.1, 0.2, 0, 3.8, 1.5, 0.5, NAV], [0.1, 0.2, 0, 0.3, 1.5, 0.8, shade(NAV, -0.1)], [0.4, 0.6, 0.5, 1.05, 1.1, 0.15, shade(NAV, 0.2)], [1.47, 0.6, 0.5, 1.05, 1.1, 0.15, shade(NAV, 0.2)], [2.54, 0.6, 0.5, 1.05, 1.1, 0.15, shade(NAV, 0.2)], [3.6, 0.2, 0, 0.3, 1.5, 0.8, shade(NAV, -0.1)]]),
  I('sofa-corner', 'Corner sofa', 'seating', 110, [4, 4], [[0.1, 0.1, 0, 3.8, 0.4, 1.1, GRY], [0.1, 0.1, 0, 0.4, 3.8, 1.1, GRY], [0.1, 0.1, 0, 3.8, 1.5, 0.5, GRY], [0.1, 1.6, 0, 1.5, 2.3, 0.5, GRY], [0.5, 0.5, 0.5, 3.3, 1.0, 0.14, shade(GRY, 0.2)], [0.5, 1.5, 0.5, 1.0, 2.3, 0.14, shade(GRY, 0.2)]]),
  I('beanbag', 'Bean bag', 'seating', 15, [1, 1], [[0.1, 0.1, 0, 0.8, 0.8, 0.35, RED], [0.15, 0.15, 0.35, 0.7, 0.4, 0.3, shade(RED, -0.05)]]),
  I('chair-dining', 'Dining chair', 'seating', 12, [1, 1], [[0.15, 0.15, 0, 0.7, 0.12, 1.5, OAK], ...posts(1, 1, 0.6, OAK).slice(1).map(p => [p[0] * 0.7 + 0.15, p[1] * 0.7 + 0.15, 0, 0.1, 0.1, 0.6, OAK]), [0.15, 0.15, 0.6, 0.7, 0.7, 0.1, shade(OAK, 0.05)]]),
  I('stool', 'Bar stool', 'seating', 10, [1, 1], [[0.42, 0.42, 0, 0.16, 0.16, 1.0, STL], [0.2, 0.2, 1.0, 0.6, 0.6, 0.12, RED]]),
  // Tables & desks
  I('table-dining', 'Dining table', 'tables', 45, [3, 2], [...posts(2.8, 1.8, 1.0, WAL).map(p => [p[0] + 0.1, p[1] + 0.1, 0, 0.14, 0.14, 1.0, WAL]), [0.1, 0.1, 1.0, 2.8, 1.8, 0.12, shade(WAL, 0.1)]]),
  I('table-coffee', 'Coffee table', 'tables', 20, [2, 1], [[0.15, 0.1, 0, 1.7, 0.8, 0.35, OAK], [0.1, 0.05, 0.35, 1.8, 0.9, 0.1, shade(OAK, 0.08)]]),
  I('desk', 'Desk', 'tables', 30, [2, 1], [[0.1, 0.1, 0, 0.6, 0.8, 0.9, WHT], [1.5, 0.1, 0, 0.3, 0.8, 0.9, WHT], [0.05, 0.05, 0.9, 1.9, 0.9, 0.1, OAK]]),
  I('table-side', 'Side table', 'tables', 10, [1, 1], [[0.2, 0.2, 0, 0.6, 0.6, 0.65, WHT], [0.24, 0.62, 0.3, 0.52, 0.02, 0.06, MUS]]),
  I('table-cafe', 'Round table', 'tables', 25, [2, 2], [[0.9, 0.9, 0, 0.2, 0.2, 1.0, BLK], [0.5, 0.5, 0, 1.0, 1.0, 0.06, BLK], [0.15, 0.15, 1.0, 1.7, 1.7, 0.08, WHT]]),
  I('dresser', 'Dressing table', 'tables', 40, [2, 1], [[0.3, 0.05, 1.0, 1.4, 0.08, 1.2, '#dfe9ee'], [0.1, 0.1, 0, 1.8, 0.75, 0.95, PNK], [0.15, 0.86, 0.45, 0.7, 0.01, 0.3, shade(PNK, -0.1)], [1.15, 0.86, 0.45, 0.7, 0.01, 0.3, shade(PNK, -0.1)]]),
  // Storage
  I('wardrobe', 'Wardrobe', 'storage', 55, [2, 1], [[0.1, 0.1, 0, 1.8, 0.85, 2.8, WHT], [0.98, 0.95, 0.15, 0.04, 0.01, 2.5, shade(WHT, -0.2)], [0.85, 0.96, 1.3, 0.08, 0.01, 0.35, MUS], [1.07, 0.96, 1.3, 0.08, 0.01, 0.35, MUS]]),
  I('drawers', 'Chest of drawers', 'storage', 30, [2, 1], [[0.1, 0.1, 0, 1.6, 0.8, 1.2, OAK], [0.15, 0.91, 0.1, 1.5, 0.01, 0.3, shade(OAK, -0.08)], [0.15, 0.91, 0.47, 1.5, 0.01, 0.3, shade(OAK, -0.08)], [0.15, 0.91, 0.84, 1.5, 0.01, 0.3, shade(OAK, -0.08)]]),
  I('bookcase', 'Bookcase', 'storage', 35, [2, 1], [[0.1, 0.1, 0, 1.6, 0.6, 2.6, WAL], [0.2, 0.68, 0.2, 0.3, 0.02, 0.5, RED], [0.55, 0.68, 0.2, 0.25, 0.02, 0.55, SKY], [0.9, 0.68, 0.2, 0.4, 0.02, 0.45, MUS], [0.2, 0.68, 1.0, 0.5, 0.02, 0.5, GRN], [0.85, 0.68, 1.0, 0.3, 0.02, 0.55, PNK], [0.3, 0.68, 1.8, 0.6, 0.02, 0.5, LIL], [1.1, 0.68, 1.8, 0.4, 0.02, 0.45, NAV]]),
  I('toybox', 'Toy box', 'storage', 15, [1, 1], [[0.1, 0.15, 0, 0.8, 0.7, 0.6, SKY], [0.05, 0.1, 0.6, 0.9, 0.8, 0.1, MUS]]),
  I('cubes', 'Cube shelf', 'storage', 25, [2, 1], [[0.1, 0.2, 0, 1.8, 0.6, 1.8, WHT], [0.2, 0.81, 0.1, 0.75, 0.01, 0.75, TEA], [1.05, 0.81, 0.95, 0.75, 0.01, 0.75, PNK], [1.05, 0.81, 0.1, 0.75, 0.01, 0.75, shade(WHT, -0.12)], [0.2, 0.81, 0.95, 0.75, 0.01, 0.75, shade(WHT, -0.12)]]),
  I('sideboard', 'Sideboard', 'storage', 40, [3, 1], [[0.1, 0.15, 0, 2.8, 0.7, 1.1, TEA], [0.2, 0.86, 0.15, 0.85, 0.01, 0.8, shade(TEA, 0.12)], [1.08, 0.86, 0.15, 0.85, 0.01, 0.8, shade(TEA, 0.12)], [1.96, 0.86, 0.15, 0.85, 0.01, 0.8, shade(TEA, 0.12)]]),
  // Kitchen
  I('k-base', 'Cupboard unit', 'kitchen', 20, [1, 1], [[0.02, 0.05, 0, 0.96, 0.9, 1.15, WHT], [0, 0, 1.15, 1, 1, 0.1, WAL]]),
  I('k-oven', 'Oven & hob', 'kitchen', 45, [1, 1], [[0.02, 0.05, 0, 0.96, 0.9, 1.15, STL], [0.1, 0.96, 0.15, 0.8, 0.01, 0.6, BLK], [0, 0, 1.15, 1, 1, 0.1, BLK]]),
  I('k-fridge', 'Fridge freezer', 'kitchen', 50, [1, 1], [[0.03, 0.05, 0, 0.94, 0.9, 2.5, '#eef3f6'], [0.05, 0.96, 1.5, 0.9, 0.01, 0.03, GRY], [0.8, 0.97, 1.7, 0.05, 0.01, 0.5, GRY]]),
  I('k-sink', 'Sink unit', 'kitchen', 30, [1, 1], [[0.02, 0.05, 0, 0.96, 0.9, 1.15, WHT], [0, 0, 1.15, 1, 1, 0.1, WAL], [0.2, 0.25, 1.25, 0.6, 0.5, 0.03, STL], [0.45, 0.1, 1.25, 0.1, 0.1, 0.35, STL]]),
  I('k-island', 'Kitchen island', 'kitchen', 70, [3, 2], [[0.1, 0.2, 0, 2.8, 1.5, 1.15, SKY], [0, 0.1, 1.15, 3, 1.7, 0.12, WHT]]),
  I('k-washer', 'Washing machine', 'kitchen', 40, [1, 1], [[0.03, 0.05, 0, 0.94, 0.9, 1.15, WHT], [0.25, 0.96, 0.25, 0.5, 0.01, 0.5, '#bcd8e8']]),
  // Bathroom
  I('b-bath', 'Bath', 'bathroom', 60, [3, 1], [[0.05, 0.05, 0, 2.9, 0.9, 0.85, WHT], [0.2, 0.2, 0.85, 2.6, 0.6, 0.01, '#bfe3ef'], [0.1, 0.1, 0.85, 0.2, 0.2, 0.4, STL]]),
  I('b-toilet', 'Toilet', 'bathroom', 25, [1, 1], [[0.2, 0.05, 0, 0.6, 0.25, 1.2, WHT], [0.3, 0.3, 0, 0.4, 0.6, 0.55, WHT], [0.25, 0.3, 0.55, 0.5, 0.65, 0.06, '#fff']]),
  I('b-basin', 'Basin', 'bathroom', 20, [1, 1], [[0.4, 0.3, 0, 0.2, 0.2, 0.9, WHT], [0.15, 0.1, 0.9, 0.7, 0.6, 0.25, WHT], [0.45, 0.05, 1.15, 0.1, 0.1, 0.25, STL]]),
  I('b-shower', 'Shower', 'bathroom', 55, [2, 2], [[0.05, 0.05, 0, 1.9, 1.9, 0.12, WHT], [0.05, 0.05, 0.12, 0.05, 1.9, 2.8, '#d6ecf3'], [0.9, 0.12, 2.3, 0.3, 0.2, 0.08, STL], [0.05, 1.9, 0.12, 1.9, 0.05, 2.8, '#d6ecf3']]),
  I('b-rail', 'Towel rail', 'bathroom', 10, [1, 1], [[0.1, 0.05, 0.3, 0.8, 0.1, 1.2, STL], [0.2, 0.12, 0.8, 0.6, 0.08, 0.6, PNK]], true),
  I('b-vanity', 'Vanity unit', 'bathroom', 45, [2, 1], [[0.1, 0.1, 0, 1.8, 0.8, 0.9, TEA], [0.05, 0.05, 0.9, 1.9, 0.9, 0.1, WHT], [0.6, 0.25, 1.0, 0.8, 0.5, 0.05, '#e9eef0'], [0.3, 0.02, 1.4, 1.4, 0.06, 1.0, '#dfe9ee']]),
  // Lights
  I('l-floor', 'Floor lamp', 'lights', 15, [1, 1], [[0.3, 0.3, 0, 0.4, 0.4, 0.06, BLK], [0.47, 0.47, 0, 0.06, 0.06, 2.2, BLK], [0.25, 0.25, 2.2, 0.5, 0.5, 0.45, CRM]]),
  I('l-table', 'Table lamp', 'lights', 8, [1, 1], [[0.35, 0.35, 0, 0.3, 0.3, 0.35, TEA], [0.25, 0.25, 0.35, 0.5, 0.5, 0.35, CRM]]),
  I('l-pendant', 'Pendant light', 'lights', 12, [1, 1], [[0.48, 0.48, 3.0, 0.04, 0.04, 1.2, BLK], [0.3, 0.3, 2.7, 0.4, 0.4, 0.3, MUS]]),
  I('l-lava', 'Lava lamp', 'lights', 10, [1, 1], [[0.4, 0.4, 0, 0.2, 0.2, 0.12, STL], [0.42, 0.42, 0.12, 0.16, 0.16, 0.45, '#f39ac6'], [0.4, 0.4, 0.57, 0.2, 0.2, 0.1, STL]]),
  I('l-desk', 'Desk lamp', 'lights', 8, [1, 1], [[0.35, 0.35, 0, 0.3, 0.3, 0.05, RED], [0.47, 0.47, 0, 0.06, 0.06, 0.5, RED], [0.35, 0.47, 0.5, 0.35, 0.2, 0.15, RED]]),
  I('l-fairy', 'Fairy lights', 'lights', 10, [3, 1], [[0, 0.02, 3.4, 3, 0.02, 0.05, '#f2c94c'], [0.4, 0.03, 3.2, 0.06, 0.02, 0.06, '#fff3b0'], [1.0, 0.03, 3.25, 0.06, 0.02, 0.06, '#fff3b0'], [1.6, 0.03, 3.2, 0.06, 0.02, 0.06, '#fff3b0'], [2.2, 0.03, 3.25, 0.06, 0.02, 0.06, '#fff3b0']], true),
  // Plants
  I('p-tall', 'Tall plant', 'plants', 12, [1, 1], [pot(0.3, 0.3, 0.4), [0.2, 0.2, 0.4, 0.6, 0.6, 1.2, LEAF], [0.3, 0.3, 1.6, 0.4, 0.4, 0.4, shade(LEAF, 0.15)]]),
  I('p-cactus', 'Cactus', 'plants', 6, [1, 1], [pot(0.35, 0.35, 0.3), [0.42, 0.42, 0.27, 0.16, 0.16, 0.6, GRN], [0.3, 0.45, 0.5, 0.12, 0.1, 0.22, GRN]]),
  I('p-fern', 'Fern', 'plants', 8, [1, 1], [pot(0.3, 0.3, 0.4, WHT), [0.15, 0.15, 0.36, 0.7, 0.7, 0.4, shade(LEAF, 0.1)]]),
  I('p-hanging', 'Hanging plant', 'plants', 10, [1, 1], [[0.49, 0.49, 2.6, 0.02, 0.02, 0.8, BLK], [0.3, 0.3, 2.3, 0.4, 0.4, 0.3, TER], [0.2, 0.2, 1.7, 0.6, 0.6, 0.6, LEAF]]),
  I('p-shelf', 'Plant shelf', 'plants', 20, [2, 1], [[0.1, 0.2, 0, 1.8, 0.6, 0.08, OAK], [0.1, 0.2, 0.8, 1.8, 0.6, 0.08, OAK], [0.1, 0.2, 0, 0.08, 0.6, 1.6, OAK], [1.82, 0.2, 0, 0.08, 0.6, 1.6, OAK], [0.3, 0.35, 0.88, 0.3, 0.3, 0.3, TER], [0.4, 0.4, 1.18, 0.2, 0.2, 0.25, LEAF], [1.2, 0.35, 0.88, 0.35, 0.3, 0.45, LEAF], [1.2, 0.35, 0.08, 0.4, 0.4, 0.35, WHT]]),
  I('p-bonsai', 'Bonsai', 'plants', 18, [1, 1], [[0.25, 0.3, 0, 0.5, 0.4, 0.15, NAV], [0.47, 0.47, 0.15, 0.06, 0.06, 0.3, WAL], [0.25, 0.3, 0.4, 0.5, 0.4, 0.2, LEAF]]),
  // Wall art (hung on the back wall)
  I('a-print', 'Framed print', 'art', 10, [1, 1], [[0.05, 0, 1.8, 0.9, 0.06, 1.1, BLK], [0.12, 0.04, 1.87, 0.76, 0.03, 0.96, MUS]], true),
  I('a-poster', 'Band poster', 'art', 5, [1, 1], [[0.1, 0, 1.6, 0.8, 0.02, 1.2, NAV], [0.2, 0.01, 2.1, 0.6, 0.02, 0.3, PNK]], true),
  I('a-mirror', 'Round mirror', 'art', 15, [1, 1], [[0.15, 0, 1.8, 0.7, 0.06, 0.7, MUS], [0.21, 0.03, 1.86, 0.58, 0.04, 0.58, '#dfe9ee']], true),
  I('a-clock', 'Wall clock', 'art', 8, [1, 1], [[0.3, 0, 2.6, 0.4, 0.06, 0.4, WHT], [0.48, 0.05, 2.75, 0.04, 0.02, 0.18, BLK]], true),
  I('a-shelf', 'Floating shelf', 'art', 8, [2, 1], [[0.1, 0, 1.9, 1.8, 0.3, 0.08, OAK], [0.3, 0.05, 1.98, 0.2, 0.2, 0.35, RED], [0.7, 0.05, 1.98, 0.3, 0.15, 0.2, SKY], [1.3, 0.05, 1.98, 0.25, 0.25, 0.25, LEAF]], true),
  I('a-gallery', 'Gallery wall', 'art', 25, [2, 1], [[0.05, 0, 2.2, 0.7, 0.05, 0.9, WHT], [0.13, 0.03, 2.28, 0.54, 0.03, 0.74, TEA], [0.9, 0, 2.5, 0.5, 0.05, 0.6, BLK], [0.96, 0.03, 2.56, 0.38, 0.03, 0.48, PNK], [0.9, 0, 1.8, 1.0, 0.05, 0.55, OAK], [0.96, 0.03, 1.86, 0.88, 0.03, 0.43, LIL]], true),
  // Toys & games
  I('t-dollhouse', 'Doll\u2019s house', 'toys', 30, [1, 1], [[0.1, 0.15, 0, 0.8, 0.6, 0.9, PNK], [0.15, 0.2, 0.9, 0.7, 0.5, 0.25, RED], [0.3, 0.76, 0.2, 0.15, 0.01, 0.2, WHT], [0.55, 0.76, 0.5, 0.15, 0.01, 0.2, WHT]]),
  I('t-train', 'Train set', 'toys', 20, [2, 2], [[0.1, 0.1, 0, 1.8, 1.8, 0.03, '#a6d18a'], [0.5, 0.5, 0.03, 0.4, 0.25, 0.3, RED], [0.95, 0.5, 0.03, 0.35, 0.25, 0.22, SKY], [1.35, 0.5, 0.03, 0.35, 0.25, 0.22, MUS]]),
  I('t-teddy', 'Giant teddy', 'toys', 15, [1, 1], [[0.25, 0.3, 0, 0.5, 0.45, 0.55, '#b98a5a'], [0.3, 0.33, 0.55, 0.4, 0.38, 0.4, '#b98a5a'], [0.3, 0.33, 0.95, 0.1, 0.1, 0.1, '#a07548'], [0.6, 0.33, 0.95, 0.1, 0.1, 0.1, '#a07548']]),
  I('t-tent', 'Play tent', 'toys', 25, [2, 2], [[0.2, 0.2, 0, 1.6, 1.6, 1.1, LIL], [0.6, 0.6, 1.1, 0.8, 0.8, 0.4, shade(LIL, 0.15)], [0.7, 1.81, 0, 0.6, 0.01, 0.8, NAV]]),
  I('t-easel', 'Art easel', 'toys', 12, [1, 1], [[0.15, 0.4, 0, 0.08, 0.08, 1.6, OAK], [0.77, 0.4, 0, 0.08, 0.08, 1.6, OAK], [0.1, 0.45, 0.7, 0.8, 0.04, 0.8, WHT], [0.2, 0.5, 1.0, 0.3, 0.01, 0.3, SKY]]),
  I('t-horse', 'Rocking horse', 'toys', 22, [2, 1], [[0.1, 0.4, 0, 1.8, 0.2, 0.1, WAL], [0.4, 0.4, 0.1, 1.1, 0.2, 0.5, WHT], [1.3, 0.4, 0.5, 0.35, 0.2, 0.5, WHT], [1.25, 0.38, 0.7, 0.1, 0.24, 0.35, RED]]),
  // Tech
  I('e-tv', 'TV & stand', 'tech', 60, [2, 1], [[0.1, 0.2, 0, 1.8, 0.6, 0.5, BLK], [0.2, 0.4, 0.5, 1.6, 0.06, 0.95, '#1f2024'], [0.25, 0.47, 0.55, 1.5, 0.01, 0.85, '#2c3a52']]),
  I('e-pc', 'Gaming PC', 'tech', 80, [2, 1], [[0.05, 0.05, 0, 1.9, 0.9, 0.1, BLK], [0.1, 0.1, 0.1, 0.1, 0.8, 0.8, BLK], [1.8, 0.1, 0.1, 0.1, 0.8, 0.8, BLK], [0.05, 0.05, 0.9, 1.9, 0.9, 0.08, BLK], [0.5, 0.2, 0.98, 1.0, 0.06, 0.6, '#1f2024'], [0.55, 0.27, 1.02, 0.9, 0.01, 0.5, '#5a6cc4'], [1.55, 0.2, 0.98, 0.3, 0.5, 0.6, '#2a2a30'], [0.6, 0.55, 0.98, 0.7, 0.25, 0.03, GRY]]),
  I('e-console', 'Games console', 'tech', 35, [1, 1], [[0.2, 0.2, 0, 0.6, 0.6, 0.4, WHT], [0.2, 0.2, 0.4, 0.6, 0.6, 0.15, BLK], [0.3, 0.81, 0.15, 0.4, 0.01, 0.04, SKY]]),
  I('e-speaker', 'Speaker', 'tech', 15, [1, 1], [[0.3, 0.3, 0, 0.4, 0.4, 0.8, BLK], [0.38, 0.71, 0.15, 0.24, 0.01, 0.24, GRY], [0.42, 0.71, 0.5, 0.16, 0.01, 0.16, GRY]]),
  I('e-record', 'Record player', 'tech', 25, [1, 1], [[0.1, 0.15, 0, 0.8, 0.7, 0.6, WAL], [0.15, 0.2, 0.6, 0.7, 0.6, 0.06, CRM], [0.25, 0.3, 0.66, 0.4, 0.4, 0.02, BLK]]),
  I('e-arcade', 'Arcade machine', 'tech', 90, [1, 1], [[0.1, 0.15, 0, 0.8, 0.75, 2.3, RED], [0.15, 0.9, 1.4, 0.7, 0.01, 0.55, '#1f2024'], [0.15, 0.6, 1.1, 0.7, 0.35, 0.15, BLK], [0.1, 0.15, 2.0, 0.8, 0.8, 0.3, MUS]]),
  // Pet stuff
  I('pet-dogbed', 'Dog bed', 'pets', 12, [2, 1], [[0.1, 0.1, 0, 1.6, 0.8, 0.3, TER], [0.25, 0.2, 0.05, 1.3, 0.6, 0.3, CRM]]),
  I('pet-cattree', 'Cat tower', 'pets', 25, [1, 1], [[0.1, 0.1, 0, 0.8, 0.8, 0.1, CRM], [0.42, 0.42, 0.1, 0.16, 0.16, 1.8, '#d8c39a'], [0.15, 0.15, 0.9, 0.7, 0.7, 0.1, CRM], [0.2, 0.2, 1.9, 0.6, 0.6, 0.35, CRM]]),
  I('pet-fish', 'Fish tank', 'pets', 30, [2, 1], [[0.1, 0.15, 0, 1.8, 0.7, 0.9, BLK], [0.12, 0.17, 0.9, 1.76, 0.66, 0.75, '#9fd3e6'], [0.8, 0.4, 0.95, 0.3, 0.02, 0.15, MUS]]),
  I('pet-hamster', 'Hamster cage', 'pets', 15, [1, 1], [[0.1, 0.2, 0, 0.8, 0.6, 0.2, SKY], [0.1, 0.2, 0.2, 0.8, 0.6, 0.5, '#e6eef2'], [0.35, 0.4, 0.2, 0.3, 0.05, 0.3, MUS]]),
  I('pet-bird', 'Bird cage', 'pets', 18, [1, 1], [[0.47, 0.47, 0, 0.06, 0.06, 1.2, BLK], [0.25, 0.25, 1.2, 0.5, 0.5, 0.7, '#e7d79a'], [0.44, 0.44, 1.45, 0.12, 0.12, 0.15, GRN]]),
  I('pet-bowls', 'Food bowls', 'pets', 5, [1, 1], [[0.1, 0.3, 0, 0.35, 0.35, 0.12, RED], [0.55, 0.3, 0, 0.35, 0.35, 0.12, SKY]]),
];
const BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// Rotate 90° steps within the footprint: (x, y, w, d) → (fd - y - d, x, d, w).
function rotBoxes(it, rot = 0) {
  let b = it.b, [fw, fd] = it.f;
  for (let k = 0; k < (rot % 4); k++) { b = b.map(([x, y, z, w, d, h, c]) => [fd - y - d, x, z, d, w, h, c]); [fw, fd] = [fd, fw]; }
  return b.slice().sort((p, q) => (p[0] + p[1] + p[2] * 0.01) - (q[0] + q[1] + q[2] * 0.01) || 0);
}
const cols = (hex) => [shade(hex, 0.14), hex, shade(hex, -0.12)];
function ItemBoxes({ it, x = 0, y = 0, z = 0, rot = 0 }) {
  const b = rot ? rotBoxes(it, rot) : it.b;
  return <g>{b.map(([bx, by, bz, w, d, h, c], i) => <Box key={i} x={x + bx} y={y + by} z={z + bz} w={w} d={d} h={h} c={cols(c)} />)}</g>;
}
function ItemThumb({ id, size = 72 }) {
  const it = BY_ID[id]; if (!it) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  it.b.forEach(([x, y, z, w, d, h]) => [[x, y, z], [x + w, y, z], [x, y + d, z], [x + w, y + d, z], [x, y, z + h], [x + w, y + d, z + h], [x + w, y, z + h], [x, y + d, z + h]].forEach(p => {
    const [px, py] = P(...p); x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }));
  const s = Math.max(x1 - x0, y1 - y0) * 1.12, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return <svg width={size} height={size} viewBox={`${cx - s / 2} ${cy - s / 2} ${s} ${s}`} style={{ display: 'block' }}><ItemBoxes it={it} /></svg>;
}

window.HBItems = { CATS, ITEMS, BY_ID, ItemBoxes, ItemThumb, rotBoxes };

})();

;(function(){
const React = FakeReact;
// Upstairs hallway, seen from the Messy Room door. Static, no character. Exports window.HallwayScene.
// Corridor runs along x. Back-left wall (y = 0) is the LEFT side of the hall; end wall (x = 0) is straight ahead.
// Front walls (y = HY right side, x = HX near end) are cut down low so we can see in.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, shade, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, PanelDoorArt, Tag, IsoStage } = window.Iso;

const HX = 8.2, HY = 2.2, RH = 4.2;
const DOORS = {
  connor: { x0: 0.5, x1: 1.45 },   // left wall, far end, next to Chloe's  → Connor's room
  stairs: { x0: 3.0, x1: 5.0 },    // left side of the floor, middle       → stairs down
  parents: { x0: 6.4, x1: 7.35 },  // left wall, between Messy Room + stairs → Parents' room
  chloe: { y0: 0.62, y1: 1.58 },   // end wall, straight ahead             → Chloe's room
  bathroom: { x0: 3.4, x1: 4.4 },  // right wall, middle                   → Shower bathroom
  messy: { y0: 0.62, y1: 1.58 },   // near end wall (behind the viewer)    → Messy Room
};
const STAIR_W = 1.0; // stairwell is cut into the carpet along the left wall, steps drop towards the Messy Room end
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

// ---------- Shell ----------
function Carpet() {
  const specks = [];
  const s = DOORS.stairs, sx0 = s.x0 * 100, sx1 = s.x1 * 100, sy1 = STAIR_W * 100;
  for (let i = 0; i < 320; i++) {
    const cx = rnd(i) * HX * 100, cy = rnd(i + 999) * HY * 100;
    if (cx > sx0 - 2 && cx < sx1 + 2 && cy < sy1 + 2) continue;
    specks.push(<circle key={i} cx={cx} cy={cy} r={1.8} fill={i % 3 ? '#644f41' : '#8a7262'} opacity={.6} />);
  }
  return <FloorPlane>
    {/* carpet with the top of the stairwell cut out of it */}
    <path d={`M0,0 H${HX * 100} V${HY * 100} H0 Z M${sx0},0 H${sx1} V${sy1} H${sx0} Z`} fill="#76604f" fillRule="evenodd" />
    <rect x={sx0} y={sy1 - 3} width={sx1 - sx0} height={6} fill="#fffaf2" />
    <rect x={sx0 - 3} y={0} width={6} height={sy1} fill="#fffaf2" />
    {specks}
  </FloorPlane>;
}

function HallWalls() {
  const s = DOORS.stairs;
  return <g>
    <BackWallY RX={HX} RH={RH} />
    {/* end wall (Chloe's door) */}
    <BackWallX RY={HY} RH={RH} />
    <WallCap RX={HX} RY={HY} RH={RH} />
    {/* skirting */}
    <StripY x0={0} x1={s.x0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={s.x1} x1={HX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={HY} z0={0} z1={0.18} fill="#f3eadb" />
    {/* dado rail */}
    {[[0, 0.39], [1.56, 6.29], [7.46, HX]].map(([a, b]) => <g key={a}>
      <StripY x0={a} x1={b} z0={1.52} z1={1.55} fill="#e3d0ae" />
      <StripY x0={a} x1={b} z0={1.55} z1={1.65} fill="#fffaf2" />
    </g>)}
    {[[0, 0.51], [1.69, HY]].map(([a, b]) => <g key={a}>
      <StripX y0={a} y1={b} z0={1.52} z1={1.55} fill="#d9c6a6" />
      <StripX y0={a} y1={b} z0={1.55} z1={1.65} fill="#f3eadb" />
    </g>)}
    {/* coving */}
    <StripY x0={0} x1={HX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={HY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// Cut-away front walls, kept low. Each gap is a doorway.
function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'], b = DOORS.bathroom, m = DOORS.messy;
  return <g>
    {/* Doorway → Shower bathroom (right-hand wall, middle). Tiled threshold. */}
    <FloorPlane z={0.005} x={b.x0} y={HY}><rect x={0} y={0} width={(b.x1 - b.x0) * 100} height={20} fill="#dfe6e6" stroke="#c4cfcf" strokeWidth={1.5} /></FloorPlane>
    {/* Doorway → Messy Room (near end wall, where we're standing). Wooden threshold. */}
    <FloorPlane z={0.005} x={HX} y={m.y0}><rect x={0} y={0} width={20} height={(m.y1 - m.y0) * 100} fill="#b77f4d" stroke="#8d5a2e" strokeWidth={1.5} /></FloorPlane>
    <Box x={0} y={HY} w={b.x0} d={0.2} h={h} c={c} />
    <Box x={b.x1} y={HY} w={HX - b.x1} d={0.2} h={h} c={c} />
    <Box x={HX} y={0} w={0.2} d={m.y0} h={h} c={c} />
    <Box x={HX} y={m.y1} w={0.2} d={HY + 0.2 - m.y1} h={h} c={c} />
  </g>;
}

// ---------- Doorways ----------
// Doorway → Stairs going downstairs. Opening in the carpet along the left wall; steps go down towards the Messy Room end.
// Drawn before the carpet so the carpet frames the opening.
function Stairs() {
  const { x0, x1 } = DOORS.stairs, N = 5, run = 0.3, rise = 0.24, W = STAIR_W;
  const steps = [];
  for (let k = 0; k < N; k++) {
    const top = -rise * (k + 1), x = x0 + run * k, f = -0.09 * k;
    steps.push(<g key={k}>
      <Box x={x} y={0} z={top - 0.3} w={run} d={W} h={0.3} c={[shade('#8a7262', f), shade('#5f4b3e', f), shade('#4e3d32', f)]} />
      <line x1={P(x + run, 0, top)[0]} y1={P(x + run, 0, top)[1]} x2={P(x + run, W, top)[0]} y2={P(x + run, W, top)[1]} stroke={shade('#c8b4a2', f)} strokeWidth={3} />
    </g>);
  }
  return <g>
    {/* dark stairwell below */}
    <FloorPlane z={-1.0} x={x0} y={0}><rect x={0} y={0} width={350} height={W * 100} fill="#2e241e" /></FloorPlane>
    {/* the left wall carries on down beside the stairs, dado rail sloping with them */}
    <polygon points={pts([[x0, 0.01, 0], [x1 + 0.6, 0.01, 0], [x1 + 0.6, 0.01, -2.1], [x0, 0.01, -0.5]])} fill="#cdb791" />
    <polygon points={pts([[x0 + 0.6, 0.01, 0], [x1 + 0.6, 0.01, -1.6], [x1 + 0.6, 0.01, -1.52], [x0 + 0.7, 0.01, 0]])} fill="#e9dcc4" />
    {/* top riser where the hall floor ends */}
    <polygon points={pts([[x0, 0, 0], [x0, W, 0], [x0, W, -rise], [x0, 0, -rise]])} fill="#5f4b3e" />
    {steps}
  </g>;
}

// Doorway → Connor's room (left wall, next to Chloe's)
function ConnorDoor() {
  return <FaceY y={0.02} x0={DOORS.connor.x0} z1={3.3}><PanelDoorArt /></FaceY>;
}

// Doorway → Parents' room (left wall, between the Messy Room and the stairs)
function ParentsDoor() {
  return <FaceY y={0.02} x0={DOORS.parents.x0} z1={3.3}><PanelDoorArt hinge="right" /></FaceY>;
}

function ChloeSign() {
  const font = "'Baloo 2', 'Comic Sans MS', sans-serif";
  return <g transform="translate(47 128) rotate(-3)">
    <rect x={-44} y={-40} width={88} height={78} rx={7} fill="#d9e8fb" stroke="#4a7fc1" strokeWidth={2.5} />
    <rect x={-12} y={-46} width={24} height={11} fill="#fff6c8" opacity={.9} />
    <text x={0} y={-16} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily={font} fill="#2f5d9e">Chloe's room,</text>
    <text x={0} y={5} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily={font} fill="#5a3d32">stay out,</text>
    <text x={0} y={27} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily={font} fill="#1f4fa8">no Callies</text>
  </g>;
}

// Doorway → Chloe's room (end wall, straight ahead). Glazed fanlight above, sign on the door.
function ChloeDoor() {
  return <FaceX x={0.02} y1={DOORS.chloe.y1} z1={3.3}>
    <rect x={-11} y={-72} width={117} height={61} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    <rect x={-3} y={-64} width={101} height={46} fill="#e3eaec" />
    {[1, 2, 3].map(i => <line key={i} x1={-3 + i * 25.25} x2={-3 + i * 25.25} y1={-64} y2={-18} stroke="#fffaf2" strokeWidth={3} />)}
    <line x1={-3} x2={98} y1={-41} y2={-41} stroke="#fffaf2" strokeWidth={3} />
    <PanelDoorArt />
    <ChloeSign />
  </FaceX>;
}

// Ceiling hatch → Attic (a cut piece of ceiling with the hatch in it; dashed square on the carpet shows where it is)
function AtticHatch() {
  const x0 = 1.9, x1 = 3.3, y1 = 1.5;
  return <g>
    <Box x={x0} y={-0.2} z={RH} w={x1 - x0} d={y1 + 0.2} h={0.08} c={['#fffaf0', '#efe3cc', '#e3d0ae']} />
    <FloorPlane z={RH + 0.081} x={x0 + 0.2} y={0.15}>
      <rect x={0} y={0} width={100} height={100} fill="#f3eadb" stroke="#d9c6a6" strokeWidth={4} />
      <rect x={12} y={12} width={76} height={76} fill="#ecdfc6" stroke="#e2d2b6" strokeWidth={2} />
      <circle cx={78} cy={50} r={5} fill="#b9973f" />
    </FloorPlane>
  </g>;
}
const HatchFootprint = () => <FloorPlane z={0.01} x={2.1} y={0.15}><rect x={0} y={0} width={100} height={100} fill="none" stroke="#a08a78" strokeWidth={3} strokeDasharray="10 8" /></FloorPlane>;

function HallwayScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1150} cy={500} zoom={1.1} label="Hallway">
    <Stairs />
    <Slab RX={HX + 0.2} RY={HY + 0.2} />
    <Carpet />
    <HatchFootprint />
    <HallWalls />
    <ConnorDoor />
    <ParentsDoor />
    <ChloeDoor />
    <FrontWalls />
    <AtticHatch />
    <Tag show={L} at={[0, 1.1, 4.65]} text="Chloe's room" />
    <Tag show={L} at={[0.97, 0, 4.65]} text="Connor's room" />
    <Tag show={L} at={[4.1, 0.5, 1.1]} text="Stairs down" />
    <Tag show={L} at={[6.87, 0, 4.65]} text="Parents' room" />
    <Tag show={L} at={[2.6, 0.7, 4.75]} text="Attic hatch" />
    <Tag show={L} at={[3.9, HY + 0.1, 1.25]} text="Bathroom" />
    <Tag show={L} at={[HX + 0.1, 1.1, 1.25]} text="Messy room" />
  </IsoStage>;
}
window.HallwayScene = HallwayScene;

})();

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
// Chloe's room. Static, no character. Exports window.ChloeRoomScene.
// End wall (x = 0): window with grey curtains over a radiator cover; the bed runs along it.
// Back-left wall (y = 0): oak over-bed bridge cupboards, TV unit + lamp, desk with manga + poster, tall wardrobe, display shelves of figures.
// Near end (x = RX, cut low): door to the upstairs hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 4.6, RY = 3.0, RH = 4.2;
const HALL = { y0: 0.75, y1: 1.7 };   // → Upstairs hallway
const OAKL = ['#e6cda4', '#d6b98c', '#c6a87c'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 3; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#chfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Window wall ----------
function CurtainWindow() {
  return <g>
    <FaceX x={0.02} y1={2.35} z1={3.45}>
      <rect x={-6} y={-6} width={147} height={177} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={135} height={165} fill="#cfe3d2" />
      <rect x={0} y={0} width={135} height={60} fill="#d8e6ee" />
      <path d="M0,70 h135 v20 q-30,-10 -60,0 t-75,0 z" fill="#c48a6a" opacity={.6} />
      {[45, 90].map(x => <line key={x} x1={x} x2={x} y1={0} y2={165} stroke="#fff" strokeWidth={5} />)}
      {[58, 112].map(y => <line key={y} x1={0} x2={135} y1={y} y2={y} stroke="#fff" strokeWidth={5} />)}
      <line x1={-30} x2={165} y1={-12} y2={-12} stroke="#9aa1a6" strokeWidth={4} />
      <path d="M-30,-12 h45 l6,200 h-55 z" fill="#8f8a86" /><path d="M120,-12 h45 v200 h-50 z" fill="#8f8a86" />
      {[-20, -8, 4].map(x => <line key={x} x1={x} x2={x + 2} y1={-8} y2={185} stroke="#7d7874" strokeWidth={2} />)}
      {[130, 142, 154].map(x => <line key={x} x1={x} x2={x - 2} y1={-8} y2={185} stroke="#7d7874" strokeWidth={2} />)}
    </FaceX>
    <Box x={0} y={0.95} z={1.75} w={0.22} d={1.45} h={0.05} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function DeskFan() {
  const [x, y] = P(0.12, 1.4, 1.8), [hx, hy] = P(0.12, 1.4, 2.25);
  return <g>
    <ellipse cx={x} cy={y} rx={12} ry={5} fill="#e6e6e2" />
    <line x1={x} y1={y} x2={hx} y2={hy} stroke="#e6e6e2" strokeWidth={4} />
    <circle cx={hx} cy={hy} r={18} fill="#f4f4f0" stroke="#bdbdb8" strokeWidth={2} />
    <circle cx={hx} cy={hy} r={6} fill="#e98a3a" />
  </g>;
}

function RadiatorCover() {
  return <g>
    <Box x={0.02} y={0.9} w={0.28} d={1.5} h={1.15} c={WHITE} />
    <Box x={0.0} y={0.86} z={1.15} w={0.34} d={1.58} h={0.05} c={WHITE} />
    <Box x={0.05} y={1.85} z={1.2} w={0.2} d={0.4} h={0.04} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
  </g>;
}

// ---------- Bed ----------
function StorageBed() {
  const x1 = 1.35, y0 = 0.05, y1 = 2.7;
  return <g>
    <Box x={0.02} y={y0} w={x1} d={y1 - y0} h={0.55} c={WHITE} />
    <FaceX x={x1 + 0.02} y1={y1} z1={0.32}>{[0, 1].map(i => <rect key={i} x={8 + i * 130} y={4} width={118} height={26} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} />)}</FaceX>
    <Box x={0.02} y={y0} w={x1} d={0.12} h={1.05} c={WHITE} />
    <Box x={0.06} y={y0 + 0.12} z={0.55} w={x1 - 0.08} d={y1 - y0 - 0.14} h={0.16} c={['#2d4a7a', '#233c64', '#1d3256']} />
  </g>;
}

function Duvet() {
  return <g>
    <Box x={0.25} y={1.1} z={0.71} w={1.1} d={1.55} h={0.12} c={['url(#chDuv)', '#e8e6e0', '#d9d6ce']} stroke="rgba(40,50,80,.25)" />
    <Box x={0.25} y={0.4} z={0.71} w={0.55} d={0.55} h={0.12} c={['url(#chDuv)', '#e8e6e0', '#d9d6ce']} stroke="rgba(40,50,80,.25)" />
  </g>;
}

function BedToys() {
  return <g>
    {/* squishmallow + purple cushion at the head */}
    <Box x={0.05} y={0.18} z={0.71} w={0.5} d={0.2} h={0.5} c={['#e9dfd6', '#d9cdc2', '#cbbeb2']} />
    <FaceY y={0.38} x0={0.05} z1={1.21}><circle cx={16} cy={22} r={3} fill="#3a2a24" /><circle cx={34} cy={22} r={3} fill="#3a2a24" /><ellipse cx={25} cy={30} rx={6} ry={3} fill="#f4a7c0" /></FaceY>
    <Box x={0.55} y={0.18} z={0.71} w={0.4} d={0.14} h={0.34} c={['#7a3fb0', '#66329a', '#572a85']} />
    {/* pink tablet + marker set */}
    <Box x={0.9} y={0.6} z={0.71} w={0.32} d={0.24} h={0.03} c={['#ff4f9a', '#e03f86', '#c93576']} />
    <FloorPlane z={0.741} x={0.93} y={0.62}><rect x={0} y={0} width={26} height={18} fill="#cfe3f2" /></FloorPlane>
    <Box x={0.35} y={0.95} z={0.71} w={0.32} d={0.2} h={0.08} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <FloorPlane z={0.791} x={0.36} y={0.96}>{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={3 + (i % 8) * 4} cy={4 + Math.floor(i / 8) * 6} r={1.6} fill={['#e85a7a', '#f2b632', '#3fb6c9', '#7a4fd1', '#5fbf6a'][i % 5]} />)}</FloorPlane>
    {/* pink plush */}
    <Box x={0.75} y={0.95} z={0.71} w={0.22} d={0.2} h={0.2} c={['#f7a9c4', '#e893b2', '#d982a2']} />
  </g>;
}

// ---------- Fitted oak wall ----------
function BridgeCupboards() {
  return <g>
    <Box x={0} y={0} z={3.0} w={3.05} d={0.55} h={1.05} c={OAKL} />
    <FaceY y={0.55} x0={0} z1={4.05}>
      {[0, 76, 152, 228].map(x => <g key={x}><rect x={x + 2} y={2} width={72} height={100} fill="none" stroke="#c3a578" strokeWidth={1.5} /><path d={`M${x + 28},96 q10,-10 20,0`} fill="#d9dde0" /></g>)}
    </FaceY>
    <Box x={0} y={0} z={2.92} w={3.05} d={0.6} h={0.08} c={OAKL} />
    <Box x={1.35} y={0} w={0.06} d={0.55} h={2.92} c={OAKL} />
  </g>;
}

function TVUnit() {
  return <g>
    <Box x={1.45} y={0.02} w={0.85} d={0.4} h={0.75} c={OAKL} />
    <FaceY y={0.42} x0={1.45} z1={0.75}><rect x={4} y={40} width={36} height={30} fill="#b69a6e" /><rect x={45} y={40} width={36} height={30} fill="#b69a6e" /></FaceY>
    <Box x={1.75} y={0.15} z={0.75} w={0.5} d={0.05} h={0.36} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={1.5} y={0.1} z={0.75} w={0.14} d={0.14} h={0.18} c={['#f4e3d6', '#e6d2c2', '#d8c2b0']} />
    <Box x={1.47} y={0.07} z={0.93} w={0.2} d={0.2} h={0.16} c={['#ffd98a', '#ffcf72', '#f2bf5e']} />
  </g>;
}

function Desk() {
  return <g>
    <Box x={2.4} y={0.02} w={0.62} d={0.5} h={0.85} c={OAKL} />
    <Box x={2.38} y={0.02} z={0.85} w={0.66} d={0.52} h={0.04} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    {/* stack of manga */}
    {Array.from({ length: 7 }, (_, i) => <Box key={i} x={2.55 + i * 0.06} y={0.04} z={0.89} w={0.055} d={0.2} h={0.3} c={[['#e85a3a', '#f2b632', '#3f6e9a', '#e85a3a', '#5fbf6a', '#f2b632', '#7a4fd1'][i], '#fbf8f2', '#e6e1d6']} />)}
    <Box x={2.45} y={0.3} z={0.89} w={0.25} d={0.12} h={0.1} c={['#c9a7a0', '#b6928b', '#a8847d']} />
  </g>;
}

function AnimePoster() {
  return <FaceY y={0.02} x0={1.75} z1={2.55}>
    <rect x={0} y={0} width={58} height={42} fill="#fbf3e2" stroke="#e1d6c0" strokeWidth={1.5} />
    {[[10, 26, '#e85a3a'], [20, 22, '#3f6e9a'], [30, 26, '#5fbf6a'], [40, 22, '#f2b632'], [48, 28, '#2a2a2c']].map(([x, y, c], i) => <g key={i}><circle cx={x} cy={y - 10} r={5} fill="#f6d2b5" /><rect x={x - 5} y={y - 5} width={10} height={14} fill={c} /></g>)}
    <rect x={30} y={3} width={25} height={8} fill="#f2b632" />
  </FaceY>;
}

function Wardrobe() {
  return <g>
    <Box x={3.08} y={0} w={0.72} d={0.6} h={4.05} c={OAKL} />
    <FaceY y={0.6} x0={3.08} z1={4.05}><path d="M8,190 q10,10 0,20" fill="none" stroke="#9aa1a6" strokeWidth={4} /></FaceY>
  </g>;
}

function DisplayShelves() {
  const x0 = 3.82, figs = ['#f2c94c', '#f7a9c4', '#3fb6c9', '#5fbf6a', '#e85a3a', '#7a4fd1', '#fbf8f2'];
  return <g>
    <Box x={x0} y={0} w={0.55} d={0.45} h={1.1} c={OAKL} />
    <Box x={x0} y={0} z={4.0} w={0.55} d={0.45} h={0.05} c={OAKL} />
    {[1.1, 1.75, 2.35, 2.95].map((z, i) => <g key={z}>
      <Box x={x0} y={0} z={z} w={0.55} d={0.42} h={0.03} c={i ? ['#dfeef0', '#c9dadd', '#b9cbce'] : OAKL} />
      {Array.from({ length: 4 }, (_, k) => <Box key={k} x={x0 + 0.04 + k * 0.12} y={0.1 + (k % 2) * 0.12} z={z + 0.03} w={0.1} d={0.1} h={0.12 + (k % 3) * 0.04} c={[figs[(k + i * 2) % 7], figs[(k + i * 2) % 7], figs[(k + i * 2) % 7]]} stroke="rgba(0,0,0,.15)" />)}
    </g>)}
    <FaceY y={0.03} x0={x0 + 0.08} z1={3.55}><rect x={0} y={0} width={36} height={30} fill="#2a2a2c" /><rect x={3} y={3} width={30} height={24} fill="#e9a7c4" /><rect x={8} y={10} width={20} height={14} fill="#bfa2d8" /></FaceY>
  </g>;
}

// ---------- Floor ----------
function FloorClothes() {
  return <FloorPlane z={0.01} x={1.6} y={0.9}>
    <path d="M0,20 q30,-20 60,0 q40,10 70,60 q-20,30 -40,10 q-30,-30 -60,-20 z" fill="#1f2125" />
    <path d="M110,0 q20,-6 40,4 q6,20 -10,26 q-26,-6 -30,-30 z" fill="#9fc79a" />
    <path d="M30,0 q16,-10 30,0 l-4,12 h-22 z" fill="#5d6870" />
  </FloorPlane>;
}

function LaundryBasket() {
  return <g>
    <Box x={2.4} y={2.2} w={0.5} d={0.5} h={0.45} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
    <FloorPlane z={0.451} x={2.42} y={2.22}><ellipse cx={22} cy={22} rx={20} ry={16} fill="#fbf8f2" /><ellipse cx={30} cy={28} rx={10} ry={6} fill="#2a2a2c" /></FloorPlane>
  </g>;
}

// Doorway → Upstairs hallway (gap in the near end wall, carpet threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#76604f" stroke="#5a483b" strokeWidth={1.5} /></FloorPlane>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

const DEFS = <>
  <clipPath id="chfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>
  <pattern id="chDuv" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#f6f4ee" /><path d="M2,8 q6,-8 12,0 q6,8 10,0" fill="none" stroke="#3d4a7a" strokeWidth={4} strokeLinecap="round" /><path d="M4,20 q5,-5 10,0" fill="none" stroke="#3d4a7a" strokeWidth={3} strokeLinecap="round" /></pattern>
</>;

function ChloeRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={980} cy={420} zoom={1.4} label="Chloe's room" defs={DEFS}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <Walls />
    <CurtainWindow />
    <DeskFan />
    <RadiatorCover />
    <AnimePoster />
    <BridgeCupboards />
    <TVUnit />
    <Desk />
    <Wardrobe />
    <DisplayShelves />
    <StorageBed />
    <Duvet />
    <BedToys />
    <FloorClothes />
    <LaundryBasket />
    <HallDoorway />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.0]} text="Hallway" />
  </IsoStage>;
}
window.ChloeRoomScene = ChloeRoomScene;

})();

;(function(){
const React = FakeReact;
// Upstairs shower bathroom. Static, no character. Exports window.BathroomScene.
// End wall (x = 0): window with grey blind over a white drawer tower. Corner (x = 0, y = 0): shower tray with glass screens + black curtain.
// Back-left wall (y = 0): basin unit with round mirror, toilet, towels. Near end (x = RX, cut low): door to the upstairs hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, WallCap, Tag, IsoStage } = window.Iso;

const RX = 4.2, RY = 2.8, RH = 4.2, DADO = 1.45;
const HALL = { y0: 1.35, y1: 2.3 };   // → Upstairs hallway
const SH = { x1: 1.25, y1: 1.2 };      // shower tray footprint (corner)
const PORC = ['#ffffff', '#eef1f1', '#dfe4e4'];

function TileFloor() {
  const l = [];
  for (let i = 1; i < RX * 100 / 45; i++) l.push(<line key={'v' + i} x1={i * 45} x2={i * 45} y1={0} y2={RY * 100} stroke="#b9bdbd" strokeWidth={1.5} />);
  for (let j = 1; j < RY * 100 / 45; j++) l.push(<line key={'h' + j} x1={0} x2={RX * 100} y1={j * 45} y2={j * 45} stroke="#b9bdbd" strokeWidth={1.5} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#dcdedc" />{l}</FloorPlane>;
}

// Charcoal tiles below the scroll border, white tiles above, thin grey band higher up.
function TiledWall({ len, along }) {
  const W = len * 100, H = RH * 100, d = (RH - DADO) * 100, out = [];
  for (let i = 1; i < W / 34; i++) out.push(<line key={'u' + i} x1={i * 34} x2={i * 34} y1={0} y2={d - 20} stroke="#e1e3e2" strokeWidth={1.5} />);
  for (let j = 1; j < (d - 20) / 34; j++) out.push(<line key={'w' + j} x1={0} x2={W} y1={j * 34} y2={j * 34} stroke="#e1e3e2" strokeWidth={1.5} />);
  for (let i = 1; i < W / 48; i++) out.push(<line key={'d' + i} x1={i * 48} x2={i * 48} y1={d} y2={H} stroke="#55585c" strokeWidth={1.5} />);
  out.push(<line key="dm" x1={0} x2={W} y1={d + 70} y2={d + 70} stroke="#55585c" strokeWidth={1.5} />);
  const scroll = [];
  for (let i = 0; i < W / 24; i++) scroll.push(<path key={i} d={`M${i * 24 + 3},${d - 8} q6,-8 12,0 q-4,6 -8,2`} fill="none" stroke={i % 3 ? '#8a8f8f' : '#c9907a'} strokeWidth={1.5} />);
  const body = <g>
    <rect x={0} y={0} width={W} height={H} fill="#f4f5f4" />
    <rect x={0} y={d} width={W} height={H - d} fill="#3b3d42" />
    {out}
    <rect x={0} y={d - 20} width={W} height={20} fill="#e9ebe8" stroke="#a3a8a8" strokeWidth={1.5} />{scroll}
    <rect x={0} y={d - 26} width={W} height={6} fill="#a3a8a8" />
    <rect x={0} y={118} width={W} height={7} fill="#a3a8a8" />
  </g>;
  return along === 'x'
    ? <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>{body}</Plane>
    : <Plane o={[0, RY, RH]} u={[0, -1, 0]} v={[0, 0, -1]}>{body}</Plane>;
}

function Walls() {
  return <g>
    <TiledWall len={RX} along="x" />
    <TiledWall len={RY} along="y" />
    <WallCap RX={RX} RY={RY} RH={RH} />
  </g>;
}

// ---------- End wall ----------
function BlindWindow() {
  return <g>
    <FaceX x={0.02} y1={2.55} z1={3.1}>
      <rect x={-6} y={-6} width={122} height={142} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={110} height={130} fill="#e8c9a4" />
      <line x1={36} x2={36} y1={0} y2={130} stroke="#fff" strokeWidth={4} /><line x1={0} x2={110} y1={96} y2={96} stroke="#fff" strokeWidth={4} />
      <rect x={-6} y={-8} width={122} height={84} fill="#6d7075" /><rect x={-6} y={72} width={122} height={5} fill="#55585c" />
    </FaceX>
    <Box x={0} y={1.4} z={1.78} w={0.2} d={1.2} h={0.05} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function SillBottles() {
  const b = [[1.55, '#f2a127', 0.28], [1.72, '#9fd6c8', 0.26], [1.9, '#fbf8f2', 0.22], [2.05, '#f2a127', 0.24], [2.2, '#fbf8f2', 0.3]];
  return <g>{b.map(([y, c, h], i) => <Box key={i} x={0.04} y={y} z={1.83} w={0.08} d={0.08} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}</g>;
}

function DrawerTower() {
  return <g>
    <Box x={0.02} y={1.55} w={0.42} d={0.42} h={1.35} c={WHITE} />
    <FaceX x={0.44} y1={1.97} z1={1.35}>{[0, 1, 2, 3].map(i => <g key={i}><rect x={4} y={6 + i * 32} width={34} height={28} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><path d={`M15,${12 + i * 32} q6,5 12,0`} fill="none" stroke="#a9a49a" strokeWidth={2} /></g>)}</FaceX>
    <Box x={0.04} y={1.58} z={1.35} w={0.38} d={0.38} h={0.2} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
    <FloorPlane z={1.551} x={0.06} y={1.6}><ellipse cx={18} cy={18} rx={16} ry={12} fill="#8fa383" /><ellipse cx={12} cy={22} rx={8} ry={6} fill="#7a5a3a" /></FloorPlane>
  </g>;
}

// ---------- Shower corner ----------
function ShowerTray() {
  return <g>
    <Box x={0} y={0} w={SH.x1} d={SH.y1} h={0.1} c={PORC} />
    <FloorPlane z={0.101} x={0} y={0}><circle cx={62} cy={60} r={8} fill="#6b747a" /></FloorPlane>
  </g>;
}

function ShowerFittings() {
  const r = P(0.02, 0.6, 2.9), r0 = P(0.02, 0.6, 1.4);
  return <g>
    <line x1={r0[0]} y1={r0[1]} x2={r[0]} y2={r[1]} stroke="#c9ced2" strokeWidth={4} />
    <FaceX x={0.02} y1={0.9} z1={2.75}>
      <rect x={12} y={0} width={24} height={10} rx={5} fill="#c9ced2" />
      <circle cx={30} cy={110} r={9} fill="#b5bcc0" /><circle cx={56} cy={130} r={7} fill="#b5bcc0" /><circle cx={20} cy={130} r={7} fill="#b5bcc0" />
      <path d="M30,10 q-12,60 0,100" fill="none" stroke="#b5bcc0" strokeWidth={2.5} />
    </FaceX>
    {/* corner caddy + pink scrunchie */}
    <FaceY y={0.02} x0={0.3} z1={2.35}>
      <rect x={0} y={0} width={36} height={4} fill="#b5bcc0" /><rect x={0} y={30} width={36} height={4} fill="#b5bcc0" />
      <rect x={6} y={8} width={10} height={22} fill="#fbf8f2" /><circle cx={22} cy={66} r={9} fill="#f4a7c0" />
    </FaceY>
  </g>;
}

// Glass screens on the two open sides, with the black curtain bunched at the window end.
function ShowerScreens() {
  const glass = { fill: '#d4ecf0', fillOpacity: 0.32, stroke: '#a9c4c9', strokeWidth: 2 };
  return <g>
    <polygon points={pts([[SH.x1, 0, 0.1], [SH.x1, SH.y1, 0.1], [SH.x1, SH.y1, 3.2], [SH.x1, 0, 3.2]])} {...glass} />
    <polygon points={pts([[0, SH.y1, 0.1], [0.45, SH.y1, 0.1], [0.45, SH.y1, 3.2], [0, SH.y1, 3.2]])} {...glass} />
    <FaceY y={SH.y1 + 0.01} x0={0.45} z1={3.3}>
      <line x1={-45} x2={80} y1={4} y2={4} stroke="#c9ced2" strokeWidth={4} />
      <path d="M2,6 h34 l4,300 h-40 z" fill="#1f2125" />
      {[8, 16, 24, 32].map(x => <line key={x} x1={x} x2={x + 1} y1={8} y2={300} stroke="#33363b" strokeWidth={2} />)}
    </FaceY>
  </g>;
}

// ---------- Back-left wall ----------
function RoundMirror() {
  return <FaceY y={0.02} x0={1.5} z1={2.75}><circle cx={38} cy={38} r={38} fill="#dbe9ee" stroke="#c9ced2" strokeWidth={2} /><path d="M18,28 Q34,12 56,18" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={.7} /></FaceY>;
}

function BasinUnit() {
  const x0 = 1.45;
  return <g>
    <Box x={x0 + 0.04} y={0} w={0.78} d={0.42} h={0.95} c={WHITE} />
    <FaceY y={0.42} x0={x0 + 0.04} z1={0.95}><line x1={39} x2={39} y1={4} y2={92} stroke="#d6d0c4" strokeWidth={2} /><rect x={30} y={22} width={3} height={30} fill="#9aa1a6" /><rect x={45} y={22} width={3} height={30} fill="#9aa1a6" /></FaceY>
    <Box x={x0} y={0} z={0.95} w={0.86} d={0.55} h={0.17} c={PORC} />
    <FloorPlane z={1.121} x={x0 + 0.08} y={0.12}><ellipse cx={35} cy={22} rx={30} ry={17} fill="#d9e2e4" /><circle cx={35} cy={24} r={3} fill="#a9afb4" /></FloorPlane>
    <Box x={x0 + 0.38} y={0.03} z={1.12} w={0.1} d={0.08} h={0.14} c={['#d3d7da', '#b5bcc0', '#a9afb4']} />
    <Box x={x0 + 0.68} y={0.05} z={1.12} w={0.04} d={0.04} h={0.22} c={['#fbf8f2', '#eeeeea', '#e2e2dc']} />
    <Box x={x0 + 0.1} y={0.35} z={1.12} w={0.3} d={0.05} h={0.03} c={['#5b8fd8', '#fbf8f2', '#e2e2dc']} />
  </g>;
}

function Toilet() {
  const x0 = 2.75;
  return <g>
    <Box x={x0} y={0} z={0.4} w={0.62} d={0.26} h={0.55} c={PORC} />
    <FloorPlane z={0.951} x={x0} y={0}><circle cx={31} cy={13} r={5} fill="#c9ced2" /></FloorPlane>
    <Box x={x0 + 0.12} y={0.2} w={0.38} d={0.35} h={0.4} c={PORC} />
    <Box x={x0 + 0.04} y={0.2} z={0.4} w={0.54} d={0.55} h={0.1} c={PORC} />
  </g>;
}

function Towels() {
  return <FaceY y={0.03} x0={3.55} z1={1.85}>
    <rect x={0} y={-4} width={60} height={5} rx={2} fill="#c9ced2" />
    <path d="M0,0 H22 V150 H0 Z" fill="#8a3f64" /><path d="M16,0 H40 V140 H16 Z" fill="#7d86b3" /><path d="M34,0 H58 V120 H34 Z" fill="#f1ece2" />
  </FaceY>;
}

function BathMat() {
  return <FloorPlane z={0.01} x={1.35} y={0.6}><rect x={0} y={0} width={70} height={42} rx={6} fill="#6f6863" /></FloorPlane>;
}

// Doorway → Upstairs hallway (gap in the near end wall, carpet threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#76604f" stroke="#5a483b" strokeWidth={1.5} /></FloorPlane>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

function BathroomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1000} cy={390} zoom={1.75} label="Bathroom">
    <Slab RX={RX} RY={RY} />
    <TileFloor />
    <Walls />
    <BlindWindow />
    <SillBottles />
    <ShowerFittings />
    <ShowerTray />
    <RoundMirror />
    <BasinUnit />
    <Toilet />
    <Towels />
    <BathMat />
    <DrawerTower />
    <ShowerScreens />
    <HallDoorway />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.0]} text="Hallway" />
  </IsoStage>;
}
window.BathroomScene = BathroomScene;

})();

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
// Downstairs hallway. Static, no character. Exports window.DownstairsHallScene.
// Corridor runs along x. Back-left wall (y = 0) = stairs side; end wall (x = 0) = toilet; near end (x = HX, cut away) = kitchen.
// Front wall (y = HY, cut low) = radiator + front door. Matches: standing at the stairs, kitchen is right, toilet far left, living room left of the toilet.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, PanelDoorArt, Tag, IsoStage } = window.Iso;

const HX = 7.5, HY = 2.4, RH = 4.2;
const LIVING = { x0: 0.3, x1: 1.25 };    // back wall, next to the toilet → Living room (bay doors)
const TOILET = { y0: 0.75, y1: 1.7 };    // end wall → Toilet
const FRONT = { x0: 0.55, x1: 1.6 };     // front wall, opposite the living room → Front door (outside)
const KITCHEN = { y0: 1.15, y1: 2.1 };   // near end wall → Kitchen
const ST = { x0: 1.6, d: 0.9, N: 14, rise: RH / 14 };
ST.run = (HX - ST.x0) / ST.N;

// ---------- Shell ----------
function Floor() {
  const planks = [];
  for (let i = 0; i < HY * 2 + 1; i++) {
    const off = (i * 137) % 260;
    planks.push(<rect key={i} x={0} y={i * 50} width={HX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 4; k++) planks.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    planks.push(<line key={'h' + i} x1={0} y1={i * 50} x2={HX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#dhfloor)">{planks}</g></FloorPlane>;
}

function Walls() {
  const zAt = (x) => 1.6 + (x - ST.x0) * ST.rise / ST.run, xEnd = ST.x0 + (RH - 0.3 - 1.6) * ST.run / ST.rise;
  return <g>
    <BackWallY RX={HX} RH={RH} />
    <BackWallX RY={HY} RH={RH} />
    <WallCap RX={HX} RY={HY} RH={RH} />
    <StripY x0={0} x1={ST.x0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={HY} z0={0} z1={0.18} fill="#f3eadb" />
    {/* dado rail: flat by the living room door, then climbing with the stairs */}
    {[[0, LIVING.x0 - 0.11], [LIVING.x1 + 0.11, ST.x0]].map(([a, b]) => <g key={a}>
      <StripY x0={a} x1={b} z0={1.52} z1={1.55} fill="#e3d0ae" />
      <StripY x0={a} x1={b} z0={1.55} z1={1.65} fill="#fffaf2" />
    </g>)}
    <polygon points={pts([[ST.x0, 0.01, 1.55], [xEnd, 0.01, zAt(xEnd) - 0.05], [xEnd, 0.01, zAt(xEnd) + 0.05], [ST.x0, 0.01, 1.65]])} fill="#fffaf2" />
    {[[0, TOILET.y0 - 0.11], [TOILET.y1 + 0.11, HY]].map(([a, b]) => <g key={a}>
      <StripX y0={a} y1={b} z0={1.52} z1={1.55} fill="#d9c6a6" />
      <StripX y0={a} y1={b} z0={1.55} z1={1.65} fill="#f3eadb" />
    </g>)}
    <StripY x0={0} x1={HX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={HY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// Doorway → Upstairs hallway. Carpeted stairs along the back wall, climbing towards the kitchen end.
function Staircase() {
  const { x0, d, N, run, rise } = ST, steps = [];
  for (let k = 0; k < N; k++) {
    const x = x0 + run * k, top = rise * (k + 1);
    steps.push(<g key={k}>
      <Box x={x} y={0} w={run} d={d} h={top} c={['#76604f', '#efe0c4', '#e3cfac']} stroke="none" />
      <line x1={P(x, 0, top)[0]} y1={P(x, 0, top)[1]} x2={P(x, d, top)[0]} y2={P(x, d, top)[1]} stroke="#5a483b" strokeWidth={2.5} />
    </g>);
  }
  return <g>
    {steps}
    {/* white string board along the side of the stairs */}
    <polygon points={pts([[x0, d + 0.01, 0], [HX, d + 0.01, RH], [HX, d + 0.01, RH - 0.28], [x0 + 0.28 * run / rise, d + 0.01, 0]])} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1} />
    <StripY y={d + 0.01} x0={x0} x1={HX} z0={0} z1={0.18} fill="#fffaf2" />
  </g>;
}

// ---------- Doorways ----------
// Glazed door, 2 × 5 panes of rippled glass.
function GlazedDoorArt({ w = 95, h = 330 }) {
  const panes = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) panes.push(<rect key={r + '-' + c} x={12 + c * 37} y={14 + r * 58} width={34} height={54} fill="#cfe0e6" stroke="#f8f3ea" strokeWidth={2} />);
  return <g>
    <rect x={-11} y={-11} width={w + 22} height={h + 11} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    <rect x={0} y={0} width={w} height={h} fill="#f8f3ea" stroke="#d6cab3" strokeWidth={1.5} />
    {panes}
    {[0, 1, 2, 3, 4].map(r => <path key={r} d={`M14,${40 + r * 58} q8,-8 16,0 t16,0 t16,0 t16,0 t16,0`} fill="none" stroke="#fff" strokeWidth={2} opacity={.6} />)}
    <rect x={w - 12} y={h * 0.55 - 4} width={7} height={22} rx={2} fill="#c9a54a" />
  </g>;
}

// Doorway → Living room (back wall, next to the toilet). Glazed bay door.
function LivingRoomDoor() {
  return <FaceY y={0.02} x0={LIVING.x0} z1={3.3}><GlazedDoorArt /></FaceY>;
}

// Doorway → Toilet (end wall, straight down the hall)
function ToiletDoor() {
  return <FaceX x={0.02} y1={TOILET.y1} z1={3.3}><PanelDoorArt hinge="right" /></FaceX>;
}

// Doorway → Front door / outside (gap in the cut-down front wall, doormat on the floor)
function FrontDoorway() {
  return <g>
    <FloorPlane z={0.005} x={FRONT.x0} y={HY}><rect x={0} y={0} width={(FRONT.x1 - FRONT.x0) * 100} height={20} fill="#c9a54a" stroke="#a6863a" strokeWidth={1.5} /></FloorPlane>
    <FloorPlane z={0.01} x={FRONT.x0 + 0.1} y={HY - 0.6}>
      <rect x={0} y={0} width={85} height={52} rx={4} fill="#b48a5a" stroke="#8d6a40" strokeWidth={2} />
      <text x={42} y={32} textAnchor="middle" fontSize={13} fontWeight="800" fontFamily="'Baloo 2', sans-serif" fill="#5a3d22">HELLO</text>
    </FloorPlane>
  </g>;
}

// Doorway → Kitchen (gap in the near end wall, tiled threshold)
function KitchenDoorway() {
  return <FloorPlane z={0.005} x={HX} y={KITCHEN.y0}>
    <rect x={0} y={0} width={20} height={(KITCHEN.y1 - KITCHEN.y0) * 100} fill="#5d6870" stroke="#3f484e" strokeWidth={1.5} />
  </FloorPlane>;
}

// ---------- Furniture ----------
function RadiatorCover() {
  const x0 = 3.0, y0 = HY - 0.32;
  return <g>
    <Box x={x0} y={y0} w={1.6} d={0.32} h={1.0} c={WHITE} />
    <FaceX x={x0 + 1.6} y1={HY} z1={1.0}><rect x={5} y={12} width={22} height={74} fill="#ebe6dc" stroke="#d6cfc2" strokeWidth={2} /></FaceX>
    <Box x={x0 - 0.06} y={y0 - 0.08} z={1.0} w={1.72} d={0.4} h={0.07} c={WHITE} />
  </g>;
}

function RadiatorTop() {
  const z = 1.07, frame = (x, w, h) => <Box x={x} y={HY - 0.14} z={z} w={w} d={0.05} h={h} c={['#2a2a2c', '#1d1d1f', '#2e2e30']} />;
  return <g>
    {frame(3.1, 0.3, 0.36)}
    <Box x={3.55} y={HY - 0.16} z={z} w={0.34} d={0.05} h={0.44} c={['#e9e6df', '#d9d5cc', '#cfcac0']} />
    {frame(4.15, 0.28, 0.34)}
    <Box x={3.62} y={HY - 0.32} z={z} w={0.14} d={0.14} h={0.2} c={['#6b2236', '#561a2b', '#4a1625']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={HY} w={FRONT.x0} d={0.2} h={h} c={c} />
    <Box x={FRONT.x1} y={HY} w={HX - FRONT.x1} d={0.2} h={h} c={c} />
    <Box x={HX} y={ST.d} w={0.2} d={KITCHEN.y0 - ST.d} h={h} c={c} />
    <Box x={HX} y={KITCHEN.y1} w={0.2} d={HY + 0.2 - KITCHEN.y1} h={h} c={c} />
  </g>;
}

function DownstairsHallScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1110} cy={480} zoom={1.12} label="Downstairs hallway" defs={<clipPath id="dhfloor"><rect x={0} y={0} width={HX * 100} height={HY * 100} /></clipPath>}>
    <Slab RX={HX + 0.2} RY={HY + 0.2} />
    <Floor />
    <Walls />
    <LivingRoomDoor />
    <ToiletDoor />
    <Staircase />
    <FrontDoorway />
    <KitchenDoorway />
    <RadiatorCover />
    <RadiatorTop />
    <FrontWalls />
    <Tag show={L} at={[0, 1.22, 4.65]} text="Toilet" />
    <Tag show={L} at={[0.78, 0, 4.65]} text="Living room" />
    <Tag show={L} at={[5.2, 0.45, 4.6]} text="Stairs up" />
    <Tag show={L} at={[1.07, HY + 0.1, 1.2]} text="Front door" />
    <Tag show={L} at={[HX + 0.1, 1.62, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.DownstairsHallScene = DownstairsHallScene;

})();

;(function(){
const React = FakeReact;
// Kitchen. Static, no character. Exports window.KitchenScene.
// Back-left wall (y = 0): window over the sink, washing machine, archway to the living room, hob/oven run.
// Back-right wall (x = 0): back door to the garden. Front wall (y = RY, cut low): larder + kettle/microwave worktop.
// Near end (x = RX, cut low): worktop over the radiator, bin, door from the hallway.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, archPath, Tag, IsoStage } = window.Iso;

const RX = 6.2, RY = 3.2, RH = 4.2, D = 0.72, BH = 1.0, WT = 1.07;
const CREAM = ['#f7f0e2', '#ede3d0', '#e2d6bf'];
const GRANITE = ['#2c2f36', '#1f2126', '#24272d'];
const STEEL = ['#d3d7da', '#bcc1c5', '#a9afb4'];
const ARCH = { x0: 2.5, x1: 3.6, spring: 2.7 };   // → Living room (middle section)
const GARDEN = { y0: 1.35, y1: 2.3 };             // → Back garden
const HALL = { y0: 2.25, y1: 3.15 };              // → Downstairs hallway

// ---------- Shell ----------
function TileFloor() {
  const lines = [];
  for (let i = 1; i < RX * 100 / 62; i++) lines.push(<line key={'v' + i} x1={i * 62} x2={i * 62} y1={0} y2={RY * 100} stroke="#3e474e" strokeWidth={2} />);
  for (let j = 1; j < RY * 100 / 62; j++) lines.push(<line key={'h' + j} x1={0} x2={RX * 100} y1={j * 62} y2={j * 62} stroke="#3e474e" strokeWidth={2} />);
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#56616a" />{lines}</FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} fill="#f4f0e7" holes={archPath(RH, ARCH.x0, ARCH.x1, 0, ARCH.spring)} />
    <BackWallX RY={RY} RH={RH} fill="#e7e1d4" />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={ARCH.x1} x1={RX} z0={0} z1={0.15} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.15} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.15} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.15} z1={RH} fill="#f6efe2" />
  </g>;
}

// White square tiles with the fruit border, drawn flat on the back wall.
function Tiles({ x0, x1, z0, z1, border = 1.5 }) {
  const w = (x1 - x0) * 100, h = (z1 - z0) * 100, by = (z1 - border) * 100, out = [];
  for (let i = 1; i < w / 24; i++) out.push(<line key={'v' + i} x1={i * 24} x2={i * 24} y1={0} y2={h} stroke="#ddd6c8" strokeWidth={1.5} />);
  for (let j = 1; j < h / 24; j++) out.push(<line key={'h' + j} x1={0} x2={w} y1={j * 24} y2={j * 24} stroke="#ddd6c8" strokeWidth={1.5} />);
  const fruit = [];
  for (let i = 0; i < w / 20; i++) fruit.push(<ellipse key={i} cx={10 + i * 20} cy={by + 6} rx={6} ry={4} fill={['#e79aa6', '#9cc79a', '#e8b07e'][i % 3]} />);
  return <Plane o={[x0, 0.006, z1]} u={[1, 0, 0]} v={[0, 0, -1]}>
    <rect x={0} y={0} width={w} height={h} fill="#fbf9f4" />{out}
    {border > z0 && border < z1 && <g><rect x={0} y={by} width={w} height={12} fill="#f3eadb" stroke="#ddd0b8" strokeWidth={1} />{fruit}</g>}
  </Plane>;
}

// Cream "cathedral" cupboard door, drawn in a wall/face plane.
function CathedralDoor({ x = 0, y = 0, w, h, knob = 'right' }) {
  const k = knob === 'right' ? x + w - 12 : x + 12;
  return <g>
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
    <path d={`M${x + 11},${y + h - 11} V${y + 24} Q${x + w / 2},${y + 4} ${x + w - 11},${y + 24} V${y + h - 11} Z`} fill="none" stroke="#d6c8ad" strokeWidth={2.5} />
    <circle cx={k} cy={y + (y === 0 && h > 60 ? 18 : h / 2)} r={4} fill="#fffdf8" stroke="#cbbd9f" strokeWidth={1.2} />
  </g>;
}

// ---------- Doorways ----------
// Glazed uPVC door/window panes with the garden seen through them.
function GardenGlass({ w, h, cols, rows }) {
  const pw = (w - 16) / cols, ph = (h - 16) / rows, out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(<rect key={r + '-' + c} x={8 + c * pw} y={8 + r * ph} width={pw - 4} height={ph - 4} fill={r < rows * 0.55 ? '#e2b47c' : '#a9cf8f'} />);
  return <g><rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} />{out}</g>;
}

// Doorway → Back garden (back-right wall)
function GardenDoor() {
  return <FaceX x={0.02} y1={GARDEN.y1} z1={3.25}>
    <rect x={-8} y={-8} width={111} height={333} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
    <GardenGlass w={95} h={317} cols={3} rows={5} />
    <rect x={8} y={170} width={6} height={30} rx={2} fill="#c9a54a" />
    <rect x={-6} y={317} width={107} height={8} fill="#c9a54a" />
  </FaceX>;
}

// Doorway → Living room, middle section (arch in the back-left wall). A peek of the next room behind it.
function ArchToLivingRoom() {
  const yb = -1.2;
  return <g>
    <Plane o={[2.2, yb, 3.0]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={170} height={300} fill="#efdcb6" /></Plane>
    <FloorPlane x={2.2} y={yb}>{[0, 1, 2].map(i => <rect key={i} x={0} y={i * 40} width={170} height={40} fill={i % 2 ? '#a26c3f' : '#966238'} stroke="#7a4b26" strokeWidth={1.5} />)}</FloorPlane>
    <polygon points={pts([[ARCH.x0, 0, 0], [ARCH.x0, -0.2, 0], [ARCH.x0, -0.2, ARCH.spring], [ARCH.x0, 0, ARCH.spring]])} fill="#e6dccb" />
    <FloorPlane z={0.004} x={ARCH.x0} y={-0.2}><rect x={0} y={0} width={(ARCH.x1 - ARCH.x0) * 100} height={20} fill="#a26c3f" /></FloorPlane>
  </g>;
}

// Doorway → Downstairs hallway (gap in the near end wall, wooden threshold)
function HallDoorway() {
  return <FloorPlane z={0.005} x={RX} y={HALL.y0}><rect x={0} y={0} width={20} height={(HALL.y1 - HALL.y0) * 100} fill="#a26c3f" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>;
}

// ---------- Back-left wall: sink run ----------
function SinkWindow() {
  return <g>
    <Tiles x0={0} x1={2.35} z0={WT} z1={1.38} border={0} />
    <Plane o={[0.05, 0.01, 3.35]} u={[1, 0, 0]} v={[0, 0, -1]}>
      <rect x={-6} y={-6} width={157} height={208} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <g transform="translate(0 0)"><GardenGlass w={72} h={58} cols={2} rows={1} /></g>
      <g transform="translate(74 0)"><GardenGlass w={72} h={58} cols={2} rows={1} /></g>
      <g transform="translate(0 62)"><GardenGlass w={72} h={134} cols={2} rows={2} /></g>
      <g transform="translate(74 62)"><GardenGlass w={72} h={134} cols={2} rows={2} /></g>
    </Plane>
    <Box x={0} y={0} z={1.38} w={1.55} d={0.2} h={0.05} c={['#fbf9f4', '#eae5da', '#ddd6c9']} />
  </g>;
}

function Dishwasher() {
  return <g>
    <Box x={0.03} y={0} w={0.72} d={D} h={BH} c={WHITE} />
    <FaceY y={D} x0={0.03} z1={BH}>
      <rect x={3} y={4} width={66} height={16} fill="#fbfbf8" stroke="#d6d6d0" strokeWidth={1} />
      <rect x={42} y={8} width={18} height={6} fill="#2d2f33" />
      <circle cx={30} cy={12} r={4} fill="#d6d6d0" />
      <CathedralDoor x={0} y={22} w={72} h={76} />
    </FaceY>
  </g>;
}

function SinkUnit() {
  return <g>
    <Box x={0.75} y={0} w={0.8} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={0.75} z1={BH}>
      <rect x={4} y={4} width={72} height={20} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
      <CathedralDoor x={0} y={26} w={80} h={74} />
    </FaceY>
  </g>;
}

function WashingMachine() {
  return <g>
    <Box x={1.55} y={0.02} w={0.72} d={D - 0.02} h={BH - 0.02} c={STEEL} />
    <FaceY y={D} x0={1.55} z1={BH - 0.02}>
      <rect x={5} y={5} width={22} height={9} fill="#e3e6e8" stroke="#a9afb4" strokeWidth={1} />
      <circle cx={52} cy={10} r={5} fill="#e3e6e8" stroke="#a9afb4" strokeWidth={1} />
      <circle cx={36} cy={58} r={27} fill="#e3e6e8" stroke="#9aa1a6" strokeWidth={3} />
      <circle cx={36} cy={58} r={19} fill="#4c565e" />
      <path d="M24,52 a14,14 0 0 1 18,-8" fill="none" stroke="#8f9aa2" strokeWidth={3} />
    </FaceY>
  </g>;
}

function SinkWorktop() {
  return <g>
    <Box x={0} y={0} z={BH} w={2.35} d={D + 0.04} h={0.07} c={GRANITE} />
    <FloorPlane z={WT + 0.001} x={0.85} y={0.12}>
      <rect x={0} y={0} width={62} height={50} rx={6} fill="#c9ced2" stroke="#9aa1a6" strokeWidth={2} />
      <rect x={6} y={6} width={50} height={38} rx={6} fill="#a3abb0" />
      <circle cx={31} cy={25} r={3} fill="#6b747a" />
    </FloorPlane>
    {/* tap */}
    <line x1={P(1.16, 0.1, WT)[0]} y1={P(1.16, 0.1, WT)[1]} x2={P(1.16, 0.1, WT + 0.42)[0]} y2={P(1.16, 0.1, WT + 0.42)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
    <line x1={P(1.16, 0.1, WT + 0.42)[0]} y1={P(1.16, 0.1, WT + 0.42)[1]} x2={P(1.16, 0.3, WT + 0.36)[0]} y2={P(1.16, 0.3, WT + 0.36)[1]} stroke="#b5bcc0" strokeWidth={5} strokeLinecap="round" />
  </g>;
}

function DishRack() {
  const plates = [['#fbf9f4', 0.12], ['#f3d34a', 0.2], ['#e46a8a', 0.28], ['#fbf9f4', 0.36], ['#3f3f44', 0.44]];
  return <g>
    <Box x={0.08} y={0.12} z={WT} w={0.6} d={0.42} h={0.08} c={['#ffffff', '#ececea', '#dcdcda']} />
    {plates.map(([c, x], i) => <Box key={i} x={x} y={0.16} z={WT + 0.06} w={0.045} d={0.34} h={0.34} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
  </g>;
}

function BoilerCupboard() {
  return <g>
    <Box x={1.6} y={0} z={2.3} w={0.75} d={0.4} h={1.15} c={CREAM} />
    <FaceY y={0.4} x0={1.6} z1={3.45}><CathedralDoor x={0} y={6} w={75} h={104} knob="right" /></FaceY>
    <Tiles x0={1.55} x1={2.35} z0={1.38} z1={2.3} border={1.6} />
  </g>;
}

// ---------- Back-left wall: hob run ----------
function HobTiles() { return <Tiles x0={ARCH.x1 + 0.1} x1={RX} z0={WT} z1={2.55} border={1.55} />; }

function Oven() {
  return <g>
    <Box x={3.75} y={0} w={0.72} d={D} h={BH} c={WHITE} />
    <FaceY y={D} x0={3.75} z1={BH}>
      <rect x={2} y={4} width={68} height={14} fill="#fbfbf8" />
      <rect x={28} y={7} width={16} height={8} fill="#2d2f33" /><rect x={31} y={9} width={10} height={3} fill="#ff4b3a" />
      <circle cx={14} cy={11} r={4} fill="#e4e4e0" stroke="#bdbdb8" /><circle cx={58} cy={11} r={4} fill="#e4e4e0" stroke="#bdbdb8" />
      <rect x={4} y={22} width={64} height={66} rx={2} fill="#1f2125" />
      <rect x={10} y={27} width={52} height={4} rx={2} fill="#d9dcdf" />
      <path d="M40,31 v22 q-4,10 2,18 l-8,2 q-4,-14 0,-40 z" fill="#8b8f94" />
    </FaceY>
  </g>;
}

function HobRunUnits() {
  return <g>
    <Box x={4.47} y={0} w={0.55} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={4.47} z1={BH}>
      <rect x={4} y={4} width={47} height={20} rx={2} fill="#f8f2e6" stroke="#dccfb6" strokeWidth={1.5} />
      <circle cx={27} cy={14} r={4} fill="#fffdf8" stroke="#cbbd9f" />
      <CathedralDoor x={0} y={26} w={55} h={74} />
    </FaceY>
    <Box x={5.02} y={0} w={RX - 5.02} d={D} h={BH} c={CREAM} />
    <FaceY y={D} x0={5.02} z1={BH}><CathedralDoor x={0} y={0} w={(RX - 5.02) * 100} h={100} knob="left" /></FaceY>
  </g>;
}

function HobWorktop() {
  return <g>
    <Box x={3.7} y={0} z={BH} w={RX - 3.7} d={D + 0.04} h={0.07} c={GRANITE} />
    <FloorPlane z={WT + 0.001} x={3.8} y={0.08}>
      <rect x={0} y={0} width={62} height={56} rx={3} fill="#c9ced2" stroke="#9aa1a6" strokeWidth={1.5} />
      {[[16, 15], [46, 15], [16, 41], [46, 41]].map(([cx, cy], i) => <g key={i}><circle cx={cx} cy={cy} r={10} fill="none" stroke="#2d2f33" strokeWidth={3} /><circle cx={cx} cy={cy} r={4} fill="#2d2f33" /></g>)}
    </FloorPlane>
  </g>;
}

function CasserolePot() {
  return <g>
    <Box x={3.84} y={0.12} z={WT} w={0.3} d={0.28} h={0.18} c={['#3f8a6b', '#2f6e55', '#285f49']} />
    <FloorPlane z={WT + 0.181} x={3.84} y={0.12}><circle cx={15} cy={14} r={4} fill="#c9ced2" /></FloorPlane>
  </g>;
}

function ChoppingBoard() {
  return <Box x={5.4} y={0.15} z={WT} w={0.55} d={0.4} h={0.05} c={['#9c6b3c', '#7f5530', '#6e4a2a']} />;
}

function HobWallCabinets() {
  return <g>
    <Box x={3.75} y={0} z={2.55} w={RX - 3.75} d={0.42} h={1.0} c={CREAM} />
    <FaceY y={0.42} x0={3.75} z1={3.55}>
      <CathedralDoor x={0} y={0} w={60} h={100} />
      <CathedralDoor x={60} y={0} w={(RX - 3.75) * 100 / 2 - 30} h={100} knob="right" />
      <CathedralDoor x={60 + (RX - 3.75) * 100 / 2 - 30} y={0} w={(RX - 3.75) * 100 / 2 - 30} h={100} knob="left" />
    </FaceY>
    <Box x={3.7} y={0} z={3.55} w={RX - 3.7} d={0.48} h={0.1} c={CREAM} />
  </g>;
}

// ---------- Near end: worktop over radiator + bin ----------
function RadiatorWorktop() {
  return <g>
    <Box x={RX - 0.16} y={0.9} w={0.14} d={1.0} h={0.75} c={WHITE} />
    <Box x={RX - D} y={D} z={BH} w={D} d={1.35} h={0.07} c={GRANITE} />
    <Box x={RX - 0.62} y={1.1} z={WT} w={0.38} d={0.3} h={0.32} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    <Box x={RX - 0.5} y={1.55} z={WT} w={0.22} d={0.22} h={0.38} c={['#cfe6dc', '#b2d3c5', '#9fc4b4']} />
  </g>;
}

function PedalBin() {
  const cx = RX - 0.45, cy = 2.0, r = 0.22, h = 1.0;
  const a = P(cx - r, cy + r, 0), b = P(cx + r, cy - r, 0), t = P(cx, cy, h), base = P(cx, cy, 0);
  const rx = Math.abs(b[0] - a[0]) / 2, ry = rx * 0.5;
  return <g>
    <path d={`M${base[0] - rx},${base[1]} V${t[1]} A${rx},${ry} 0 0 0 ${base[0] + rx},${t[1]} V${base[1]} A${rx},${ry} 0 0 1 ${base[0] - rx},${base[1]} Z`} fill="#b9bec2" stroke="#8f979d" strokeWidth={1.5} />
    <ellipse cx={t[0]} cy={t[1]} rx={rx} ry={ry} fill="#d3d7da" stroke="#8f979d" strokeWidth={1.5} />
    <ellipse cx={t[0]} cy={t[1]} rx={rx - 6} ry={ry - 3} fill="#3a3d42" />
  </g>;
}

// ---------- Front wall: larder + worktop ----------
function LarderUnit() {
  return <Box x={0.05} y={RY - D} w={0.72} d={D} h={3.4} c={CREAM} />;
}

function FrontCounter() {
  return <g>
    <Box x={0.77} y={RY - D} w={2.3} d={D} h={BH} c={CREAM} />
    <FaceX x={3.07} y1={RY} z1={BH}><rect x={4} y={6} width={64} height={88} fill="none" stroke="#dccfb6" strokeWidth={2} /></FaceX>
    <Box x={0.77} y={RY - D - 0.04} z={BH} w={2.35} d={D + 0.04} h={0.07} c={GRANITE} />
  </g>;
}

function Microwave() {
  return <g>
    <Box x={2.25} y={RY - 0.6} z={WT} w={0.75} d={0.45} h={0.4} c={['#2a2b2e', '#1d1e20', '#26272a']} />
    <FaceX x={3.0} y1={RY - 0.15} z1={WT + 0.4}><rect x={4} y={6} width={18} height={6} fill="#ff4b3a" /></FaceX>
  </g>;
}

function CoffeeMachine() {
  return <g>
    <Box x={1.5} y={RY - 0.6} z={WT} w={0.42} d={0.4} h={0.48} c={['#c9ced2', '#3a3b3f', '#2c2d30']} />
    <Box x={1.62} y={RY - 0.55} z={WT + 0.48} w={0.14} d={0.14} h={0.14} c={STEEL} />
  </g>;
}

function Kettle() {
  return <g>
    <Box x={0.95} y={RY - 0.5} z={WT} w={0.25} d={0.25} h={0.08} c={['#e8e8e4', '#d0d0cc', '#c4c4c0']} />
    <Box x={0.97} y={RY - 0.48} z={WT + 0.08} w={0.21} d={0.21} h={0.3} c={['#fbfbf8', '#ececea', '#dcdcda']} />
  </g>;
}

function MilkBottle() {
  return <g>
    <Box x={1.3} y={RY - 0.38} z={WT} w={0.15} d={0.15} h={0.32} c={['#ffffff', '#f1f1ee', '#e3e3df']} />
    <Box x={1.34} y={RY - 0.34} z={WT + 0.32} w={0.07} d={0.07} h={0.05} c={['#3a6fd8', '#2d5bb8', '#244ea0']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={HALL.y0} h={h} c={c} />
    <Box x={RX} y={HALL.y1} w={0.2} d={RY + 0.2 - HALL.y1} h={h} c={c} />
  </g>;
}

function KitchenScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1030} cy={480} zoom={1.35} label="Kitchen">
    <ArchToLivingRoom />
    <Slab RX={RX} RY={RY} />
    <TileFloor />
    <Walls />
    <SinkWindow />
    <BoilerCupboard />
    <HobTiles />
    <GardenDoor />
    <Dishwasher />
    <SinkUnit />
    <WashingMachine />
    <SinkWorktop />
    <DishRack />
    <Oven />
    <HobRunUnits />
    <HobWorktop />
    <CasserolePot />
    <ChoppingBoard />
    <HobWallCabinets />
    <HallDoorway />
    <RadiatorWorktop />
    <PedalBin />
    <LarderUnit />
    <FrontCounter />
    <Kettle />
    <MilkBottle />
    <CoffeeMachine />
    <Microwave />
    <FrontWalls />
    <Tag show={L} at={[0, (GARDEN.y0 + GARDEN.y1) / 2, 3.75]} text="Back garden" />
    <Tag show={L} at={[(ARCH.x0 + ARCH.x1) / 2, 0, 3.25]} text="Living room" />
    <Tag show={L} at={[RX + 0.1, (HALL.y0 + HALL.y1) / 2, 1.2]} text="Hallway" />
  </IsoStage>;
}
window.KitchenScene = KitchenScene;

})();

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
// Living room, main section. Static, no character. Exports window.LivingRoomScene.
// Seen from the bay doors (as in the photo from the middle room).
// Back-left wall (y = 0): fireplace + mirror, wooden sideboard, radiator cover. Back-right wall (x = 0): two sash windows, TV in the corner.
// Front wall (y = RY, cut low): blue L-sofa backs onto it, plant + lamp, door to the hallway, bookshelf.
// Near end (x = RX, cut low): bay doors to the middle section.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 7.5, RY = 5.5, RH = 4.2;
const BAY = { y0: 0.75, y1: 2.6 };    // near end → Middle section (bay doors)
const HALL = { x0: 4.85, x1: 5.8 };   // front wall → Downstairs hallway
const WOOD = ['#8f6c49', '#735537', '#62472d'];
const BLUE = ['#2f6f86', '#255a6d', '#1f4d5d'];
const GREEN = ['#3f6e6a', '#325956', '#2a4c49'];
const STONE = ['#efe9d8', '#e2dac5', '#d6cdb5'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 4; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#lvfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Window wall ----------
function SashWindow({ y1 }) {
  return <g>
    <FaceX x={0.02} y1={y1} z1={3.5}>
      <rect x={-6} y={-6} width={122} height={232} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={110} height={220} fill="#cfe3d2" />
      {[1, 2].map(i => <line key={i} x1={i * 36.7} x2={i * 36.7} y1={0} y2={220} stroke="#fff" strokeWidth={4} />)}
      {[1, 2, 3].map(i => <line key={i} x1={0} x2={110} y1={i * 55} y2={i * 55} stroke="#fff" strokeWidth={4} />)}
      {/* roller blind most of the way down */}
      <rect x={-2} y={0} width={114} height={168} fill="#f4efe2" />
      {[1, 2].map(i => <line key={'b' + i} x1={i * 36.7} x2={i * 36.7} y1={10} y2={160} stroke="#e4dcc8" strokeWidth={5} />)}
      <line x1={0} x2={110} y1={60} y2={60} stroke="#e4dcc8" strokeWidth={5} />
      <rect x={-3} y={164} width={116} height={6} fill="#d8cfba" />
    </FaceX>
    <Box x={0} y={y1 - 1.16} z={1.3} w={0.2} d={1.22} h={0.06} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function WindowLight() {
  const pane = (y) => <polygon key={y} points={pts([[0.3, y, 0], [0.3, y + 1.1, 0], [2.2, y + 1.1, 0], [2.2, y, 0]])} fill="#fff6d8" opacity={.28} />;
  return <g>{pane(2.0)}{pane(3.95)}</g>;
}

function TVUnit() {
  return <g>
    <Box x={0.05} y={0.35} w={0.6} d={1.6} h={0.55} c={WOOD} />
    <FaceX x={0.65} y1={1.95} z1={0.55}><rect x={10} y={14} width={140} height={22} fill="#3e2e20" /><rect x={30} y={18} width={40} height={10} fill="#1d1d1f" /></FaceX>
    <Box x={0.28} y={0.95} z={0.55} w={0.18} d={0.4} h={0.05} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={0.32} y={0.42} z={0.62} w={0.06} d={1.46} h={0.88} c={['#2a2a2c', '#1d1d1f', '#121214']} />
  </g>;
}

function ToyBaskets() {
  return <g>
    <Box x={0.1} y={2.2} w={0.42} d={0.42} h={0.5} c={['#8e8e8c', '#7a7a78', '#6c6c6a']} />
    <Box x={0.12} y={2.24} z={0.5} w={0.38} d={0.32} h={0.22} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={0.12} y={2.72} w={0.45} d={0.42} h={0.55} c={['#cfc6b6', '#bdb3a2', '#ada392']} />
    <Box x={0.2} y={2.8} z={0.55} w={0.2} d={0.18} h={0.12} c={['#f4a7c4', '#e48bb0', '#d77aa0']} />
  </g>;
}

// ---------- Fireplace wall ----------
function ChimneyBreast() {
  return <Box x={1.6} y={0} w={2.0} d={0.45} h={RH} c={['#fffaf0', '#f5e8cf', '#e9d6b6']} />;
}

function Fireplace() {
  return <g>
    <FloorPlane z={0.005} x={1.75} y={0.45}><path d="M0,0 H170 V30 Q85,62 0,30 Z" fill="#e7e1d1" stroke="#cfc7b2" strokeWidth={2} /></FloorPlane>
    <FaceY y={0.46} x0={1.8} z1={1.45}>
      <rect x={0} y={10} width={160} height={135} fill="#ebe4d0" stroke="#d1c8b0" strokeWidth={2} />
      <path d="M30,145 V60 Q80,26 130,60 V145 Z" fill="#d9cfb8" />
      <path d="M40,145 V66 Q80,38 120,66 V145 Z" fill="#3d3530" />
      <rect x={50} y={110} width={30} height={35} fill="#c99a5c" stroke="#9c7442" strokeWidth={1.5} />
      {[0, 1, 2].map(i => <circle key={i} cx={58 + (i % 2) * 14} cy={118 + i * 9} r={4} fill="#5a2b24" />)}
      <circle cx={100} cy={100} r={13} fill="#ffffff" />{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx={100} cy={92} rx={4} ry={8} transform={`rotate(${a} 100 100)`} fill="#f7f7f2" stroke="#e4e4dc" strokeWidth={1} />)}
      <circle cx={100} cy={100} r={4} fill="#e9c34c" />
    </FaceY>
    <Box x={1.72} y={0.42} z={1.45} w={1.76} d={0.18} h={0.08} c={STONE} />
  </g>;
}

function RoundMirror() {
  return <FaceY y={0.46} x0={2.15} z1={3.05}>
    <circle cx={45} cy={45} r={45} fill="#7a5233" /><circle cx={45} cy={45} r={38} fill="#dbe9ee" />
    <path d="M22,30 Q40,14 62,22" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={.7} />
  </FaceY>;
}

function MantelOrnaments() {
  const z = 1.53;
  return <g>
    <Box x={1.85} y={0.47} z={z} w={0.14} d={0.1} h={0.3} c={['#f0e7d4', '#e2d6bd', '#d6c8ab']} />
    <Box x={2.08} y={0.47} z={z} w={0.16} d={0.1} h={0.14} c={['#e3c04f', '#c9a63f', '#b89536']} />
    {/* pink Stitch figure */}
    <Box x={2.35} y={0.47} z={z} w={0.16} d={0.1} h={0.2} c={['#f39ac6', '#e07fb2', '#d16fa3']} />
    <Box x={2.33} y={0.5} z={z + 0.2} w={0.2} d={0.04} h={0.08} c={['#f39ac6', '#e07fb2', '#d16fa3']} />
    <Box x={3.0} y={0.47} z={z} w={0.12} d={0.1} h={0.14} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={3.2} y={0.47} z={z} w={0.08} d={0.08} h={0.26} c={['#6b6f74', '#55595e', '#484c50']} />
    <FaceY y={0.6} x0={3.12} z1={z + 0.55}>{[[6, 6, '#e85a7a'], [16, 2, '#f2b632'], [10, 14, '#7a4fd1'], [22, 12, '#3fb6c9']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r={6} fill={c} />)}</FaceY>
  </g>;
}

function Sideboard() {
  return <g>
    <Box x={4.05} y={0} w={1.5} d={0.48} h={0.95} c={WOOD} />
    <FaceY y={0.48} x0={4.05} z1={0.95}>
      <rect x={3} y={4} width={44} height={80} fill="none" stroke="#5a412a" strokeWidth={1.5} /><circle cx={40} cy={40} r={3} fill="#1d1d1f" />
      <rect x={103} y={4} width={44} height={80} fill="none" stroke="#5a412a" strokeWidth={1.5} /><circle cx={110} cy={40} r={3} fill="#1d1d1f" />
      {[0, 1, 2].map(i => <g key={i}><rect x={50} y={4 + i * 27} width={50} height={25} fill="none" stroke="#5a412a" strokeWidth={1.5} /><rect x={68} y={14 + i * 27} width={14} height={4} fill="#1d1d1f" /></g>)}
      <line x1={4} x2={4} y1={84} y2={95} stroke="#1d1d1f" strokeWidth={3} /><line x1={146} x2={146} y1={84} y2={95} stroke="#1d1d1f" strokeWidth={3} />
    </FaceY>
  </g>;
}

function TableLamp() {
  const [bx, by] = P(4.3, 0.22, 0.95), [tx, ty] = P(4.3, 0.22, 1.25);
  return <g>
    <path d={`M${bx - 12},${by} L${tx},${ty} L${bx + 12},${by} M${bx - 12},${by} L${bx},${ty + 8} L${bx + 12},${by}`} fill="none" stroke="#c9a54a" strokeWidth={2} />
    <Box x={4.12} y={0.06} z={1.25} w={0.34} d={0.32} h={0.32} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <ellipse cx={P(4.29, 0.22, 1.57)[0]} cy={P(4.29, 0.22, 1.57)[1]} rx={18} ry={8} fill="#ffe7a8" opacity={.9} />
  </g>;
}

function RecordPlayer() {
  return <g>
    <Box x={4.55} y={0.1} z={0.95} w={0.45} d={0.32} h={0.08} c={['#c99a5c', '#a87e48', '#93703f']} />
    <FloorPlane z={1.031} x={4.6} y={0.13}><circle cx={16} cy={13} r={11} fill="#1d1d1f" /><circle cx={16} cy={13} r={3} fill="#e85a7a" /></FloorPlane>
  </g>;
}

function DrinksBottles() {
  const b = [[5.1, '#9fd3b5', 0.32], [5.2, '#e3c04f', 0.36], [5.3, '#2a2a2c', 0.3], [5.4, '#e8eef0', 0.34], [5.45, '#3f9a52', 0.22]];
  return <g>{b.map(([x, c, h], i) => <Box key={i} x={x} y={0.12 + (i % 2) * 0.12} z={0.95} w={0.07} d={0.07} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.2)" />)}</g>;
}

function RadiatorCover() {
  return <g>
    <Box x={5.95} y={0} w={1.3} d={0.3} h={1.0} c={WHITE} />
    <FaceY y={0.3} x0={5.95} z1={1.0}>
      {[0, 1].map(i => <g key={i}><rect x={10 + i * 60} y={18} width={50} height={70} rx={10} fill="#ebe6dc" stroke="#d6cfc2" strokeWidth={2} />
        {Array.from({ length: 20 }, (_, k) => <circle key={k} cx={18 + i * 60 + (k % 4) * 11} cy={28 + Math.floor(k / 4) * 12} r={3} fill="#cfc7b8" />)}</g>)}
    </FaceY>
    <Box x={5.9} y={0} z={1.0} w={1.4} d={0.36} h={0.06} c={WHITE} />
    <Box x={6.0} y={0.06} z={1.06} w={0.2} d={0.2} h={0.18} c={['#2a2a2c', '#1d1d1f', '#202022']} />
    <Box x={6.95} y={0.06} z={1.06} w={0.18} d={0.18} h={0.16} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

function StarMapPoster() {
  return <FaceY y={0.02} x0={6.05} z1={2.25}>
    <rect x={0} y={0} width={70} height={95} fill="#1f2230" stroke="#111" strokeWidth={3} />
    <circle cx={35} cy={40} r={26} fill="none" stroke="#cfd6e6" strokeWidth={1.5} />
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={35 + Math.cos(i * 2.3) * (6 + (i * 7) % 18)} cy={40 + Math.sin(i * 2.3) * (6 + (i * 5) % 18)} r={1.2} fill="#fff" />)}
  </FaceY>;
}

// ---------- Middle of the room ----------
function CoffeeTable() {
  return <g>
    <Box x={2.9} y={2.3} w={1.3} d={1.05} h={0.55} c={['#a8865a', '#8c6d47', '#7a5e3c']} />
    <FaceY y={3.35} x0={2.9} z1={0.55}>{[0, 1].map(i => <g key={i}><rect x={8} y={8 + i * 23} width={114} height={19} fill="none" stroke="#5f4730" strokeWidth={1.5} /><path d={`M58,${14 + i * 23} q7,8 14,0`} fill="none" stroke="#3a2a1c" strokeWidth={2.5} /></g>)}</FaceY>
  </g>;
}

function TableClutter() {
  return <g>
    <Box x={3.45} y={2.45} z={0.55} w={0.5} d={0.38} h={0.03} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={3.1} y={2.9} z={0.55} w={0.09} d={0.09} h={0.3} c={['#ff3f7f', '#e0306b', '#c9285e']} />
    <FloorPlane z={0.551} x={2.98} y={2.4}><rect x={0} y={0} width={30} height={22} fill="#fbf9f4" transform="rotate(-12)" /><circle cx={36} cy={60} r={8} fill="#d94f8a" /></FloorPlane>
  </g>;
}

function FloorCushion() {
  return <FloorPlane z={0.01} x={3.8} y={1.4}><rect x={0} y={0} width={45} height={40} rx={10} fill="#d49a2f" stroke="#b07c22" strokeWidth={2} transform="rotate(15 22 20)" /></FloorPlane>;
}

function Cushion({ x, y, z, c, w = 0.35 }) { return <Box x={x} y={y} z={z} w={w} d={0.14} h={0.32} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />; }

function BlueLSofa() {
  const yb = RY - 1.0;
  return <g>
    {/* chaise end, under the window */}
    <Box x={1.0} y={yb - 1.15} w={1.0} d={1.2} h={0.42} c={BLUE} />
    <Box x={1.0} y={yb} w={4.0} d={1.0} h={0.42} c={BLUE} />
    <Box x={1.0} y={yb - 1.15} w={0.22} d={2.15} h={0.68} c={BLUE} />
    <Box x={1.0} y={RY - 0.3} w={4.0} d={0.3} h={0.95} c={BLUE} />
    <Box x={4.78} y={yb} w={0.22} d={1.0} h={0.66} c={BLUE} />
    {[1.25, 2.55, 3.65].map((x, i) => <Box key={i} x={x} y={yb + 0.05} z={0.42} w={i ? 1.08 : 1.25} d={0.65} h={0.1} c={['#3a7f97', '#2c687c', '#24596b']} />)}
    <Box x={1.22} y={yb - 1.1} z={0.42} w={0.75} d={1.1} h={0.1} c={['#3a7f97', '#2c687c', '#24596b']} />
    <Cushion x={1.5} y={yb + 0.55} z={0.52} c="#f1ead9" />
    <Cushion x={2.6} y={yb + 0.55} z={0.52} c="#d49a2f" w={0.3} />
    <Cushion x={3.0} y={yb + 0.55} z={0.52} c="#f1ead9" />
    <Cushion x={4.2} y={yb + 0.55} z={0.52} c="#2c687c" />
  </g>;
}

function GreenSofa() {
  const x0 = 5.7, y0 = 2.7;
  return <g>
    <Box x={x0} y={y0} w={0.95} d={2.0} h={0.42} c={GREEN} />
    <Box x={x0 + 0.68} y={y0} w={0.27} d={2.0} h={0.95} c={GREEN} />
    <Box x={x0} y={y0} w={0.95} d={0.22} h={0.66} c={GREEN} />
    <Box x={x0} y={y0 + 1.78} w={0.95} d={0.22} h={0.66} c={GREEN} />
    <Box x={x0 + 0.05} y={y0 + 0.24} z={0.42} w={0.62} d={1.52} h={0.1} c={['#4b7d78', '#3b6763', '#335a56']} />
    <Box x={x0 + 0.1} y={y0 + 0.6} z={0.52} w={0.5} d={0.6} h={0.12} c={['#f4efe4', '#e6dfd0', '#d9d0bf']} />
  </g>;
}

function FloorLampAndPlant() {
  const [x, y] = P(0.45, RY - 0.45, 0), [, ty] = P(0.45, RY - 0.45, 1.6);
  return <g>
    <line x1={x - 14} y1={y} x2={x} y2={ty} stroke="#2a2a2c" strokeWidth={4} /><line x1={x + 14} y1={y} x2={x} y2={ty} stroke="#2a2a2c" strokeWidth={4} />
    <Box x={0.25} y={RY - 0.65} z={1.6} w={0.4} d={0.4} h={0.38} c={['#fbf7ef', '#f0eadc', '#e3dccb']} />
    <Box x={0.75} y={RY - 0.55} w={0.4} d={0.4} h={0.3} c={['#c7b28c', '#b09a74', '#9c8762']} />
    {Array.from({ length: 9 }, (_, i) => { const [px, py] = P(0.95, RY - 0.35, 1.2 + (i % 4) * 0.45); return <ellipse key={i} cx={px + (i % 2 ? 22 : -22)} cy={py} rx={20} ry={7} transform={`rotate(${i % 2 ? 25 : -25} ${px + (i % 2 ? 22 : -22)} ${py})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />; })}
    <line x1={P(0.95, RY - 0.35, 0.3)[0]} y1={P(0.95, RY - 0.35, 0.3)[1]} x2={P(0.95, RY - 0.35, 2.7)[0]} y2={P(0.95, RY - 0.35, 2.7)[1]} stroke="#7a5a38" strokeWidth={4} />
  </g>;
}

function BookTower() {
  const x0 = 6.1, y0 = RY - 0.55, books = ['#c2306a', '#2a2a2c', '#3f6e9a', '#e8b07e', '#f39ac6', '#3f8a6b'];
  return <g>
    {[0.0, 0.5, 1.0, 1.5, 2.0].map((z, i) => <g key={i}>
      <Box x={x0} y={y0} z={z} w={0.5} d={0.5} h={0.04} c={['#7a5a3a', '#5f452c', '#523b25']} />
      {i < 4 && books.slice(0, 5).map((c, k) => <Box key={k} x={x0 + 0.04 + k * 0.08} y={y0 + 0.1} z={z + 0.04} w={0.07} d={0.3} h={0.3 + (k % 2) * 0.06} c={[books[(k + i) % 6], books[(k + i) % 6], books[(k + i) % 6]]} stroke="rgba(0,0,0,.2)" />)}
    </g>)}
    {[[x0, y0], [x0 + 0.48, y0 + 0.48]].map(([x, y], i) => <line key={i} x1={P(x, y, 0)[0]} y1={P(x, y, 0)[1]} x2={P(x, y, 2.05)[0]} y2={P(x, y, 2.05)[1]} stroke="#c9a54a" strokeWidth={3} />)}
  </g>;
}

function RowingMachine() {
  return <g>
    <Box x={6.75} y={RY - 0.5} w={0.7} d={0.32} h={0.08} c={['#e2c48f', '#cdae78', '#b99a66']} />
    <Box x={6.95} y={RY - 0.48} z={0.08} w={0.28} d={0.28} h={0.12} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

// Doorway → Middle section (bay doors, gap in the near end wall)
function BayDoorway() {
  return <FloorPlane z={0.005} x={RX} y={BAY.y0}><rect x={0} y={0} width={20} height={(BAY.y1 - BAY.y0) * 100} fill="#c49a64" stroke="#8d5a2e" strokeWidth={1.5} /></FloorPlane>;
}

// Doorway → Downstairs hallway (gap in the front wall)
function HallDoorway() {
  return <FloorPlane z={0.005} x={HALL.x0} y={RY}><rect x={0} y={0} width={(HALL.x1 - HALL.x0) * 100} height={20} fill="#966238" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={HALL.x0} d={0.2} h={h} c={c} />
    <Box x={HALL.x1} y={RY} w={RX - HALL.x1} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={BAY.y0} h={h} c={c} />
    <Box x={RX} y={BAY.y1} w={0.2} d={RY + 0.2 - BAY.y1} h={h} c={c} />
  </g>;
}

function LivingRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1000} cy={590} zoom={0.98} label="Living room" defs={<clipPath id="lvfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <WindowLight />
    <Walls />
    <SashWindow y1={3.1} />
    <SashWindow y1={5.05} />
    <StarMapPoster />
    <ChimneyBreast />
    <RoundMirror />
    <Fireplace />
    <MantelOrnaments />
    <TVUnit />
    <ToyBaskets />
    <Sideboard />
    <TableLamp />
    <RecordPlayer />
    <DrinksBottles />
    <RadiatorCover />
    <BayDoorway />
    <HallDoorway />
    <FloorCushion />
    <CoffeeTable />
    <TableClutter />
    <GreenSofa />
    <BlueLSofa />
    <FloorLampAndPlant />
    <BookTower />
    <RowingMachine />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (BAY.y0 + BAY.y1) / 2, 1.2]} text="Middle room" />
    <Tag show={L} at={[(HALL.x0 + HALL.x1) / 2, RY + 0.1, 1.2]} text="Hallway" />
  </IsoStage>;
}
window.LivingRoomScene = LivingRoomScene;

})();

;(function(){
const React = FakeReact;
// Living room, middle section (through the bay doors). Static, no character. Exports window.MiddleRoomScene.
// Back-left wall (y = 0): clothes airer + radiator, fridge, coat rack, bay doors to the main living area, white sideboard.
// Back-right wall (x = 0): wide opening with corbels into the back room. Front wall (y = RY, cut low): arch to the kitchen.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 6.5, RY = 3.6, RH = 4.2;
const BACK = { y0: 0.45, y1: 3.15, top: 3.4 };   // back-right wall → Back room
const BAY = { x0: 3.95, x1: 5.35 };              // back-left wall → Living room (main)
const KITCHEN = { x0: 2.5, x1: 3.6 };            // front wall → Kitchen (arch)
const STEEL = ['#d3d7da', '#bcc1c5', '#a9afb4'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 4; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#mdfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  const H = RH * 100, a = BACK.y0 * 100, b = BACK.y1 * 100, t = (RH - BACK.top) * 100;
  return <g>
    <BackWallY RX={RX} RH={RH} />
    {/* back-right wall with the wide opening cut out */}
    <Plane o={[0, 0, RH]} u={[0, 1, 0]} v={[0, 0, -1]}>
      <path d={`M0,0 H${RY * 100} V${H} H0 Z M${a},${H} V${t} H${b} V${H} Z`} fill="#e9d6b6" fillRule="evenodd" />
    </Plane>
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={BAY.x0 - 0.1} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={BAY.x1 + 0.1} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

// ---------- Doorways ----------
// Doorway → Back room. A peek of the back room's window wall through the opening (drawn first, behind the wall).
function BackRoomPeek() {
  const xb = -1.8;
  return <g>
    <FloorPlane x={xb} y={BACK.y0}>{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={0} y={i * 45} width={180} height={45} fill={i % 2 ? '#a26c3f' : '#966238'} stroke="#7a4b26" strokeWidth={1.5} />)}</FloorPlane>
    <Plane o={[xb, BACK.y1, BACK.top]} u={[0, -1, 0]} v={[0, 0, -1]}>
      <rect x={0} y={0} width={(BACK.y1 - BACK.y0) * 100} height={BACK.top * 100} fill="#efe3c8" />
      <rect x={70} y={80} width={130} height={110} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} />
      <rect x={78} y={110} width={114} height={72} fill="#bfd9c0" /><line x1={135} x2={135} y1={110} y2={182} stroke="#fff" strokeWidth={4} /><line x1={78} x2={192} y1={146} y2={146} stroke="#fff" strokeWidth={4} />
      <rect x={66} y={70} width={138} height={44} rx={4} fill="#eadfca" />
      <path d="M66,114 q8,8 17,0 t17,0 t17,0 t17,0 t17,0 t17,0 t17,0 t17,0" fill="none" stroke="#e3a7a0" strokeWidth={4} />
      <rect x={62} y={190} width={146} height={8} fill="#ffffff" />
    </Plane>
    <polygon points={pts([[0, BACK.y0, 0], [xb, BACK.y0, 0], [xb, BACK.y0, BACK.top], [0, BACK.y0, BACK.top]])} fill="#f1e6cf" />
    <polygon points={pts([[0, BACK.y0, BACK.top], [xb, BACK.y0, BACK.top], [xb, BACK.y1, BACK.top], [0, BACK.y1, BACK.top]])} fill="#fffaf0" />
    <FloorPlane z={0.004} x={-0.25} y={BACK.y0}><rect x={0} y={0} width={25} height={(BACK.y1 - BACK.y0) * 100} fill="#966238" /></FloorPlane>
  </g>;
}

// Plaster corbels in the top corners of the back-room opening.
function Corbels() {
  const t = (RH - BACK.top) * 100;
  const corbel = (x, flip) => <g transform={`translate(${x} ${t}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M0,0 H34 V10 Q34,52 6,70 L0,70 Z" fill="#fffaf0" stroke="#dccfb6" strokeWidth={2} />
    <path d="M8,14 a10,10 0 1 1 14,12" fill="none" stroke="#dccfb6" strokeWidth={2.5} />
  </g>;
  return <Plane o={[0.01, 0, RH]} u={[0, 1, 0]} v={[0, 0, -1]}>{corbel(BACK.y0 * 100, false)}{corbel(BACK.y1 * 100, true)}</Plane>;
}

// Doorway → Living room, main area (glazed double bay doors on the back-left wall)
function BayDoors() {
  const leaf = (x) => <g key={x}>
    <rect x={x} y={0} width={66} height={325} fill="#f8f3ea" stroke="#d6cab3" strokeWidth={1.5} />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={x + 9 + (i % 2) * 25} y={12 + Math.floor(i / 2) * 60} width={22} height={54} fill="#d6e4e8" />)}
    <rect x={x + (x ? 6 : 56)} y={170} width={5} height={20} rx={2} fill="#c9a54a" />
  </g>;
  return <FaceY y={0.02} x0={BAY.x0} z1={3.3}>
    <rect x={-10} y={-10} width={160} height={335} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1.5} />
    {leaf(4)}{leaf(72)}
  </FaceY>;
}

// Doorway → Kitchen (arch in the cut-away front wall; tiled threshold)
function KitchenDoorway() {
  return <FloorPlane z={0.005} x={KITCHEN.x0} y={RY}><rect x={0} y={0} width={(KITCHEN.x1 - KITCHEN.x0) * 100} height={20} fill="#56616a" stroke="#3e474e" strokeWidth={1.5} /></FloorPlane>;
}

// ---------- Furniture ----------
function RadiatorAndAirer() {
  const clothes = ['#1f2125', '#2a2a2c', '#6b2236', '#3d4a6b', '#1f2125', '#e3c04f', '#2a2a2c', '#8fb8de', '#1f2125'];
  return <g>
    <Box x={0.25} y={0} w={1.3} d={0.25} h={0.95} c={WHITE} />
    <FaceY y={0.6} x0={0.15} z1={1.5}>
      {clothes.map((c, i) => <path key={i} d={`M${8 + i * 15},4 h12 l2,${70 + (i % 3) * 14} h-16 z`} fill={c} />)}
      <line x1={0} x2={150} y1={4} y2={4} stroke="#b5bcc0" strokeWidth={4} />
      <line x1={30} x2={90} y1={4} y2={150} stroke="#b5bcc0" strokeWidth={3} /><line x1={120} x2={60} y1={4} y2={150} stroke="#b5bcc0" strokeWidth={3} />
    </FaceY>
  </g>;
}

function MacrameHanging() {
  return <FaceY y={0.02} x0={1.62} z1={2.9}>
    <circle cx={14} cy={8} r={8} fill="none" stroke="#c7b28c" strokeWidth={2} />
    <path d="M2,16 H26 L20,60 H8 Z" fill="#efe6d4" stroke="#d8ccb2" strokeWidth={1.5} />
    {[6, 10, 14, 18, 22].map(x => <line key={x} x1={x} x2={x} y1={60} y2={100} stroke="#efe6d4" strokeWidth={2} />)}
  </FaceY>;
}

function AmericanFridge() {
  const x0 = 1.95, d = 0.8, h = 2.15;
  return <g>
    <Box x={x0} y={0} w={1.05} d={d} h={h} c={STEEL} />
    <FaceY y={d} x0={x0} z1={h}>
      <line x1={52} x2={52} y1={0} y2={h * 100} stroke="#9aa1a6" strokeWidth={2} />
      <rect x={44} y={60} width={4} height={80} rx={2} fill="#9aa1a6" /><rect x={57} y={60} width={4} height={80} rx={2} fill="#9aa1a6" />
      <rect x={12} y={70} width={26} height={8} fill="#2a2b2e" /><circle cx={30} cy={74} r={1.5} fill="#5eea6b" />
      {/* photos + drawings on the fridge */}
      <path d="M72,30 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 q0,10 -12,18 q-12,-8 -12,-18 z" fill="#f4b6c4" />
      <rect x={70} y={60} width={22} height={30} fill="#fbf8f2" transform="rotate(-6 81 75)" /><rect x={74} y={66} width={14} height={12} fill="#8fb8de" />
      <rect x={66} y={100} width={26} height={34} fill="#fbf8f2" /><rect x={70} y={104} width={18} height={18} fill="#e8b07e" />
    </FaceY>
    <Box x={x0 + 0.1} y={0.1} z={h} w={0.45} d={0.45} h={0.38} c={['#e6eaec', '#c9cfd2', '#b5bcc0']} />
    <Box x={x0 + 0.6} y={0.15} z={h} w={0.35} d={0.3} h={0.16} c={['#f2b632', '#d99e22', '#c08a1a']} />
  </g>;
}

function CoatRack() {
  const coats = [['#2a2a2c', 0, 150], ['#5c4a3a', 18, 120], ['#7f9174', 36, 110], ['#e7e1d3', 40, 160], ['#3a2a2c', 56, 140], ['#6b2236', 66, 120]];
  return <g>
    <FaceY y={0.55} x0={3.1} z1={2.0}>
      <line x1={0} x2={0} y1={0} y2={200} stroke="#2a2a2c" strokeWidth={4} /><line x1={80} x2={80} y1={0} y2={200} stroke="#2a2a2c" strokeWidth={4} />
      <line x1={-4} x2={84} y1={4} y2={4} stroke="#2a2a2c" strokeWidth={4} />
      {coats.map(([c, x, h], i) => <path key={i} d={`M${x + 4},6 q10,-6 20,0 l4,${h} h-28 z`} fill={c} />)}
      <rect x={4} y={186} width={72} height={6} fill="#2a2a2c" />
      <rect x={10} y={178} width={14} height={8} rx={3} fill="#fbf8f2" /><rect x={30} y={178} width={14} height={8} rx={3} fill="#fbf8f2" />
    </FaceY>
  </g>;
}

function IroningBoard() {
  return <FaceY y={0.12} x0={5.42} z1={2.7}>
    <path d="M6,0 Q18,-6 30,0 L30,240 Q18,250 6,240 Z" fill="#f4f2ee" stroke="#cfcac0" strokeWidth={1.5} />
    {Array.from({ length: 16 }, (_, i) => <polygon key={i} points={`${10 + (i % 2) * 10},${14 + i * 14} ${16 + (i % 2) * 10},${4 + i * 14} ${22 + (i % 2) * 10},${14 + i * 14}`} fill={i % 5 === 2 ? '#e9c34c' : i % 3 ? '#9a9a98' : '#2a2a2c'} />)}
  </FaceY>;
}

function WhiteSideboard() {
  return <g>
    <Box x={5.8} y={0} w={0.68} d={0.5} h={1.0} c={WHITE} />
    <FaceX x={6.48} y1={0.5} z1={1.0}><rect x={6} y={8} width={38} height={22} fill="none" stroke="#ddd6c9" strokeWidth={2} /><rect x={6} y={36} width={38} height={56} fill="none" stroke="#ddd6c9" strokeWidth={2} /></FaceX>
    <Box x={5.78} y={0} z={1.0} w={0.72} d={0.54} h={0.05} c={['#c49a64', '#a87e48', '#93703f']} />
    {[[5.85, '#f7f2e6', 0.14], [6.05, '#e98a3a', 0.12], [6.22, '#f7f2e6', 0.16], [6.0, '#c9b6a0', 0.11]].map(([x, c, s], i) => <Box key={i} x={x} y={0.1 + (i % 2) * 0.18} z={1.05} w={s} d={s} h={s * 0.8} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
  </g>;
}

function LaundryBaskets() {
  return <g>
    <Box x={3.8} y={RY - 0.6} w={0.5} d={0.5} h={0.7} c={['#7b8088', '#666b72', '#585c63']} />
    <FloorPlane z={0.71} x={3.78} y={RY - 0.62}><ellipse cx={26} cy={26} rx={30} ry={24} fill="#f4efe4" /><ellipse cx={18} cy={30} rx={12} ry={8} fill="#c84a5a" /><ellipse cx={34} cy={18} rx={12} ry={8} fill="#fbf8f2" /></FloorPlane>
    <Box x={4.45} y={RY - 0.55} w={0.55} d={0.45} h={0.45} c={['#c9d3da', '#b3bec6', '#a2adb6']} />
  </g>;
}

function SchoolBag() {
  return <g>
    <Box x={1.4} y={2.3} w={0.5} d={0.35} h={0.22} c={['#cfe3ea', '#b7cfd8', '#a5bfc9']} />
    <Box x={2.0} y={2.5} w={0.22} d={0.2} h={0.16} c={['#f6c9c4', '#e8b0aa', '#dba099']} />
  </g>;
}

function FrontWalls() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <Box x={0} y={RY} w={KITCHEN.x0} d={0.2} h={h} c={c} />
    <Box x={KITCHEN.x1} y={RY} w={RX - KITCHEN.x1} d={0.2} h={h} c={c} />
    <Box x={RX} y={0} w={0.2} d={RY + 0.2} h={h} c={c} />
  </g>;
}

function MiddleRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={960} cy={470} zoom={1.15} label="Middle room" defs={<clipPath id="mdfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <BackRoomPeek />
    <Slab RX={RX} RY={RY} />
    <Floor />
    <Walls />
    <Corbels />
    <MacrameHanging />
    <BayDoors />
    <RadiatorAndAirer />
    <AmericanFridge />
    <CoatRack />
    <IroningBoard />
    <WhiteSideboard />
    <KitchenDoorway />
    <SchoolBag />
    <LaundryBaskets />
    <FrontWalls />
    <Tag show={L} at={[0, (BACK.y0 + BACK.y1) / 2, 3.85]} text="Back room" />
    <Tag show={L} at={[(BAY.x0 + BAY.x1) / 2, 0, 3.85]} text="Living room" />
    <Tag show={L} at={[(KITCHEN.x0 + KITCHEN.x1) / 2, RY + 0.1, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.MiddleRoomScene = MiddleRoomScene;

window.MiddleRoomParts = { RX, RY, RH, BACK, BAY, KITCHEN, Corbels, MacrameHanging, BayDoors, RadiatorAndAirer, AmericanFridge, CoatRack, IroningBoard, WhiteSideboard, KitchenDoorway, SchoolBag, LaundryBaskets, FrontWalls };

})();

;(function(){
const React = FakeReact;
// Living room, back section. Static, no character. Exports window.BackRoomScene.
// Back-right wall (x = 0): window with the tasselled roman blind, plants on the sill. Back-left wall (y = 0): dressing table + art easel.
// Front wall (y = RY, cut low): teal sofa piled with clothes. Near end (x = RX): wide opening back to the middle section.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, WHITE, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage } = window.Iso;

const RX = 3.8, RY = 3.6, RH = 4.2;
const MIDDLE = { y0: 0.35, y1: 3.25 };   // near end → Middle section
const TEAL = ['#2f7f86', '#25686e', '#1f5a5f'];

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 3; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#bkfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

function WindowLight() {
  return <FloorPlane z={0.012} x={0.2} y={1.0}><polygon points="0,0 0,170 160,200 160,30" fill="#fff6d8" opacity={.3} /></FloorPlane>;
}

// ---------- Window wall ----------
function RomanBlindWindow() {
  return <g>
    <FaceX x={0.02} y1={2.75} z1={3.5}>
      <rect x={-6} y={-6} width={192} height={196} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />
      <rect x={0} y={0} width={180} height={184} fill="#bfd9c0" />
      {[60, 120].map(x => <line key={x} x1={x} x2={x} y1={0} y2={184} stroke="#fff" strokeWidth={5} />)}
      {[70, 128].map(y => <line key={y} x1={0} x2={180} y1={y} y2={y} stroke="#fff" strokeWidth={5} />)}
      {/* roman blind, pulled half up, with tassel fringe */}
      <rect x={-10} y={-10} width={200} height={70} rx={4} fill="#eadfca" />
      {[14, 32, 48].map(y => <path key={y} d={`M-10,${y} Q90,${y + 8} 190,${y}`} fill="none" stroke="#d6c8ad" strokeWidth={2} />)}
      <path d="M-10,60 q12,10 25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0" fill="#e9b7ad" stroke="#d99a90" strokeWidth={2} />
      {Array.from({ length: 16 }, (_, i) => <line key={i} x1={-5 + i * 12.5} x2={-5 + i * 12.5} y1={64} y2={74} stroke="#d99a90" strokeWidth={3} />)}
    </FaceX>
    <Box x={0} y={0.8} z={1.62} w={0.25} d={2.0} h={0.06} c={['#ffffff', '#eeeeea', '#e2e2dc']} />
  </g>;
}

function SillPlants() {
  const plant = (y) => {
    const [x0, y0] = P(0.12, y, 1.95);
    return <g key={y}>
      <Box x={0.04} y={y - 0.1} z={1.68} w={0.18} d={0.18} h={0.22} c={['#2a2a2c', '#1d1d1f', '#202022']} />
      {[-40, -20, 0, 20, 40, -55, 55].map((a, i) => <line key={i} x1={x0} y1={y0} x2={x0 + Math.sin(a * Math.PI / 180) * 46} y2={y0 - Math.cos(a * Math.PI / 180) * (40 + (i % 3) * 10)} stroke={i % 2 ? '#5f9a4a' : '#86b55a'} strokeWidth={5} strokeLinecap="round" />)}
    </g>;
  };
  return <g>
    {plant(1.2)}{plant(2.3)}
    <Box x={0.04} y={1.55} z={1.68} w={0.06} d={0.28} h={0.36} c={['#e6e1d6', '#d8d2c4', '#cbc4b4']} />
    <Box x={0.04} y={1.9} z={1.68} w={0.05} d={0.26} h={0.3} c={['#5a3d32', '#4a3229', '#3d2922']} />
    <Box x={0.04} y={0.95} z={1.68} w={0.14} d={0.18} h={0.12} c={['#2a2a2c', '#1d1d1f', '#202022']} />
  </g>;
}

// ---------- Dressing table wall ----------
function DressingTable() {
  return <g>
    <Box x={0.15} y={0} w={1.35} d={0.5} h={0.95} c={WHITE} />
    <FaceY y={0.5} x0={0.15} z1={0.95}>
      {[0, 1, 2, 3].map(i => <g key={i}>
        <rect x={4} y={4 + i * 23} width={34} height={20} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={21} cy={14 + i * 23} r={2.5} fill="#d6b24a" />
        <rect x={97} y={4 + i * 23} width={34} height={20} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={114} cy={14 + i * 23} r={2.5} fill="#d6b24a" />
      </g>)}
      <rect x={42} y={4} width={51} height={18} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={1.5} /><circle cx={67} cy={13} r={2.5} fill="#d6b24a" />
      <rect x={44} y={26} width={47} height={70} fill="#4a4037" />
    </FaceY>
    <Box x={0.13} y={0} z={0.95} w={1.39} d={0.52} h={0.04} c={['#dfeef0', '#c9dadd', '#b9cbce']} />
  </g>;
}

function VanityMirror() {
  return <g>
    <Box x={0.3} y={0.02} z={0.99} w={1.05} d={0.1} h={0.8} c={WHITE} />
    <FaceY y={0.12} x0={0.34} z1={1.75}><rect x={0} y={0} width={97} height={72} fill="#d9e8ec" /><line x1={32} x2={32} y1={0} y2={72} stroke="#fff" strokeWidth={3} /><line x1={65} x2={65} y1={0} y2={72} stroke="#fff" strokeWidth={3} /></FaceY>
  </g>;
}

function MakeupBottles() {
  const b = [[0.95, '#c9a7d8', 0.26], [1.05, '#fbf8f2', 0.32], [1.13, '#e98a5a', 0.24], [1.22, '#fbf8f2', 0.2], [1.3, '#b7a7e0', 0.28], [0.45, '#f4b6c4', 0.22]];
  return <g>
    {b.map(([x, c, h], i) => <Box key={i} x={x} y={0.2 + (i % 2) * 0.1} z={0.99} w={0.07} d={0.07} h={h} c={[c, c, c]} stroke="rgba(0,0,0,.15)" />)}
    <Box x={0.55} y={0.3} z={0.99} w={0.12} d={0.12} h={0.3} c={['#f7c6d6', '#eab0c3', '#dc9fb3']} />
  </g>;
}

// Art easel leaning on the wall, with the jellyfish drawing on the board.
function ArtEasel() {
  return <FaceY y={0.18} x0={1.7} z1={3.1}>
    <line x1={36} x2={30} y1={0} y2={310} stroke="#c99560" strokeWidth={7} />
    <line x1={10} x2={0} y1={150} y2={310} stroke="#c99560" strokeWidth={5} /><line x1={62} x2={72} y1={150} y2={310} stroke="#c99560" strokeWidth={5} />
    <rect x={0} y={60} width={72} height={110} fill="#efd7ae" stroke="#c99560" strokeWidth={2} />
    <path d="M22,98 Q36,78 50,98 Z" fill="none" stroke="#5f7fd1" strokeWidth={2.5} />
    {[26, 32, 38, 44].map((x, i) => <path key={x} d={`M${x},98 q${i % 2 ? 4 : -4},14 0,28 q${i % 2 ? -4 : 4},10 0,20`} fill="none" stroke="#5f7fd1" strokeWidth={2} />)}
    {[[12, 76], [60, 84], [14, 150], [58, 140]].map(([x, y], i) => <path key={i} d={`M${x - 5},${y} L${x + 5},${y} M${x},${y - 5} L${x},${y + 5}`} stroke="#d9465f" strokeWidth={2} />)}
    <rect x={-4} y={170} width={80} height={8} fill="#b78450" />
  </FaceY>;
}

function YarnBag() {
  return <g>
    <Box x={1.75} y={0.2} w={0.4} d={0.3} h={0.38} c={['#f2d64a', '#e3c43a', '#d4b42e']} />
    <FloorPlane z={0.381} x={1.77} y={0.22}><circle cx={10} cy={12} r={9} fill="#f4b6c4" /><circle cx={26} cy={10} r={8} fill="#a9d8e6" /><circle cx={20} cy={22} r={7} fill="#f7e4d6" /></FloorPlane>
  </g>;
}

function Trainers() {
  return <g>
    <Box x={1.35} y={0.75} w={0.26} d={0.11} h={0.09} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    <Box x={1.4} y={0.92} w={0.26} d={0.11} h={0.09} c={['#f4f2ee', '#e3e0d8', '#d4d0c6']} />
    <Box x={0.95} y={0.85} w={0.24} d={0.12} h={0.1} c={['#bfb2a2', '#ab9e8e', '#9b8e7e']} />
  </g>;
}

function OfficeChair() {
  const cx = 1.15, cy = 1.75, [bx, by] = P(cx, cy, 0.04), [sx, sy] = P(cx, cy, 0.48);
  return <g>
    {[0, 72, 144, 216, 288].map(a => { const r = 0.32, ex = cx + Math.cos(a * Math.PI / 180) * r, ey = cy + Math.sin(a * Math.PI / 180) * r, [x, y] = P(ex, ey, 0.04); return <g key={a}><line x1={bx} y1={by} x2={x} y2={y} stroke="#d6b24a" strokeWidth={5} /><circle cx={x} cy={y + 3} r={4} fill="#2a2a2c" /></g>; })}
    <line x1={bx} y1={by} x2={sx} y2={sy} stroke="#d6b24a" strokeWidth={6} />
    <Box x={cx - 0.27} y={cy - 0.27} z={0.48} w={0.54} d={0.54} h={0.12} c={['#2b5d8a', '#224c72', '#1c4062']} />
    <Box x={cx - 0.3} y={cy - 0.27} z={0.6} w={0.1} d={0.54} h={0.5} c={['#2b5d8a', '#224c72', '#1c4062']} />
  </g>;
}

function ClothesSofa() {
  const x0 = 0.45, yb = RY - 0.95;
  return <g>
    <Box x={x0} y={yb} w={2.1} d={0.95} h={0.42} c={TEAL} />
    <Box x={x0} y={RY - 0.28} w={2.1} d={0.28} h={0.9} c={TEAL} />
    <Box x={x0} y={yb} w={0.22} d={0.95} h={0.62} c={TEAL} />
    <Box x={x0 + 1.88} y={yb} w={0.22} d={0.95} h={0.62} c={TEAL} />
    {/* heap of clean washing */}
    {[[0.8, '#1f2125', 0.5, 0.12], [1.2, '#fbf8f2', 0.45, 0.1], [1.55, '#3d63c9', 0.3, 0.06], [1.75, '#e3c04f', 0.4, 0.08], [1.0, '#f4efe4', 0.5, 0.14], [1.9, '#fbf8f2', 0.35, 0.16]].map(([x, c, w, z], i) => <Box key={i} x={x} y={yb + 0.1 + (i % 3) * 0.15} z={0.42 + z} w={w} d={0.35} h={0.1} c={[c, c, c]} stroke="rgba(0,0,0,.12)" />)}
    <Box x={0.9} y={RY - 0.4} z={0.9} w={0.6} d={0.3} h={0.12} c={['#e7b2d4', '#d89cc3', '#c98bb3']} />
  </g>;
}

// Doorway → Middle section (wide opening in the near end; low stubs either side)
function MiddleDoorway() {
  const h = 0.55, c = ['#fffaf0', '#ead8b8', '#e3d0ae'];
  return <g>
    <FloorPlane z={0.005} x={RX} y={MIDDLE.y0}><rect x={0} y={0} width={20} height={(MIDDLE.y1 - MIDDLE.y0) * 100} fill="#966238" stroke="#7a4b26" strokeWidth={1.5} /></FloorPlane>
    <Box x={RX} y={0} w={0.2} d={MIDDLE.y0} h={h} c={c} />
    <Box x={RX} y={MIDDLE.y1} w={0.2} d={RY + 0.2 - MIDDLE.y1} h={h} c={c} />
  </g>;
}

const FrontWall = () => <Box x={0} y={RY} w={RX} d={0.2} h={0.55} c={['#fffaf0', '#ead8b8', '#e3d0ae']} />;

function BackRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={930} cy={400} zoom={1.4} label="Back room" defs={<clipPath id="bkfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <WindowLight />
    <Walls />
    <RomanBlindWindow />
    <SillPlants />
    <VanityMirror />
    <DressingTable />
    <MakeupBottles />
    <ArtEasel />
    <YarnBag />
    <Trainers />
    <OfficeChair />
    <ClothesSofa />
    <MiddleDoorway />
    <FrontWall />
    <Tag show={L} at={[RX + 0.1, (MIDDLE.y0 + MIDDLE.y1) / 2, 1.2]} text="Middle room" />
  </IsoStage>;
}
window.BackRoomScene = BackRoomScene;

window.BackRoomParts = { RX, RY, RH, WindowLight, RomanBlindWindow, SillPlants, VanityMirror, DressingTable, MakeupBottles, ArtEasel, YarnBag, Trainers, OfficeChair, ClothesSofa, FrontWall };

})();

;(function(){
const React = FakeReact;
// Middle room + back room joined into one long room. Static, no character. Exports window.MiddleBackRoomScene.
// Reuses every furniture component from middle-room-scene.jsx and back-room-scene.jsx.
// Back room sits at x 0..3.8 (window wall on x = 0); middle room is shifted along by DX = 3.8.
// A pier, header beam and plaster corbels at x = 3.8 mark where the two areas meet.
const { P, pts, FloorPlane, Box, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, C, S } = window.Iso;
const BK = window.BackRoomParts, MD = window.MiddleRoomParts;

const DX = BK.RX, RX = BK.RX + MD.RX, RY = MD.RY, RH = MD.RH;
const SHIFT = `translate(${DX * C * S} ${DX * 0.5 * S})`; // world x + DX, as a screen offset

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 6; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#mbfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  const bay0 = DX + MD.BAY.x0 - 0.1, bay1 = DX + MD.BAY.x1 + 0.1;
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={bay0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={bay1} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

// Where the back room meets the middle room: a full-height pier on the back wall, a low stub at the front
// (kept low like the cut-away front walls so it doesn't hide the dressing table and easel).
function OpeningPiers() {
  const c = ['#fffaf0', '#f3e6cc', '#ead8b8'], t = 0.25, { y0, y1 } = MD.BACK;
  return <g>
    <Box x={DX - t} y={0} w={t} d={y0} h={RH} c={c} />
    <Box x={DX - t} y={y1} w={t} d={RY - y1} h={0.55} c={c} />
  </g>;
}

function MiddleBackRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1180} cy={560} zoom={1.0} label="Middle and back room" defs={<clipPath id="mbfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <BK.WindowLight />
    <Walls />
    {/* back room end */}
    <BK.RomanBlindWindow />
    <BK.SillPlants />
    <BK.VanityMirror />
    <BK.DressingTable />
    <BK.MakeupBottles />
    <BK.ArtEasel />
    <BK.YarnBag />
    <BK.Trainers />
    <BK.OfficeChair />
    <BK.ClothesSofa />
    <BK.FrontWall />
    <OpeningPiers />
    {/* middle room end, shifted along by DX */}
    <g transform={SHIFT}>
      <MD.MacrameHanging />
      <MD.BayDoors />
      <MD.RadiatorAndAirer />
      <MD.AmericanFridge />
      <MD.CoatRack />
      <MD.IroningBoard />
      <MD.WhiteSideboard />
      <MD.KitchenDoorway />
      <MD.SchoolBag />
      <MD.LaundryBaskets />
      <MD.FrontWalls />
    </g>
    {/* Doorway labels: bay doors → Living room (back wall); arch → Kitchen (front wall) */}
    <Tag show={L} at={[DX + (MD.BAY.x0 + MD.BAY.x1) / 2, 0, 3.85]} text="Living room" />
    <Tag show={L} at={[DX + (MD.KITCHEN.x0 + MD.KITCHEN.x1) / 2, RY + 0.1, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.MiddleBackRoomScene = MiddleBackRoomScene;

})();

;(function(){
const React = FakeReact;
// Back garden. Static, no character. Exports window.GardenScene.
// Back-left wall (y = 0): back of the house — kitchen window + back door, living room French doors, downpipe, lantern.
// Back-right wall (x = 0): brick garden wall with trellis, and the outbuilding with its white door.
// Patio along the house; lawn beyond, with the tree, bamboo corner and stepping-stone path. Front fences are cut low.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, Slab, Tag, IsoStage } = window.Iso;

const RX = 10, RY = 7.5, HOUSE_H = 4.6, WALL_H = 2.3;
const KITCHEN = { x0: 5.2, x1: 6.15 };   // house wall → Kitchen (back door)
const LIVING = { x0: 7.4, x1: 8.9 };     // house wall → Living room (French doors)
const SHED = { y0: 2.6, y1: 4.6, door0: 3.3, door1: 4.1 };   // outbuilding on the side wall
const RATTAN = ['#33363b', '#26282c', '#1d1f22'];
const FENCE = ['#a9794a', '#8e6338', '#7a552f'];

// ---------- Ground ----------
function Lawn() {
  const tufts = [];
  for (let i = 0; i < 160; i++) { const s = Math.sin(i * 91.7) * 9999, r = s - Math.floor(s), s2 = Math.sin(i * 37.3) * 9999, r2 = s2 - Math.floor(s2); tufts.push(<path key={i} d={`M${r * RX * 100},${240 + r2 * (RY * 100 - 240)} l3,-8 l3,8`} fill="none" stroke="#5f9a3e" strokeWidth={2} />); }
  return <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#7fb352" />{tufts}</FloorPlane>;
}

function Patio() {
  const s = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 18; c++) s.push(<rect key={r + '-' + c} x={c * 60 - (r % 2) * 30 + 300} y={r * 58} width={58} height={56} fill={(r + c) % 3 ? '#a3a6a4' : '#999c9a'} />);
  return <FloorPlane z={0.005}><g clipPath="url(#gdPatio)">{s}</g><rect x={300} y={228} width={700} height={12} fill="#b55a3e" /></FloorPlane>;
}

function SteppingStones() {
  return <FloorPlane z={0.006}>{[[300, 250], [240, 270], [180, 290], [120, 310], [60, 330]].map(([x, y], i) => <rect key={i} x={x - 30} y={y} width={52} height={40} fill="#b4b6b3" stroke="#8f928f" strokeWidth={1.5} />)}</FloorPlane>;
}

function PatternRug() {
  const d = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) d.push(<g key={r + '-' + c} transform={`translate(${12 + c * 26} ${12 + r * 26})`}><path d="M0,-11 L11,0 L0,11 L-11,0 Z" fill="none" stroke="#1d1f22" strokeWidth={3} /><path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="#1d1f22" /></g>);
  return <FloorPlane z={0.012} x={6.0} y={0.55}><rect x={0} y={0} width={160} height={110} fill="#f4f2ee" />{d}</FloorPlane>;
}

// ---------- House wall ----------
function HouseWall() {
  return <g>
    <Plane o={[0, 0, HOUSE_H]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={0} y={0} width={RX * 100} height={HOUSE_H * 100} fill="url(#gdBrick)" /></Plane>
    <polygon points={pts([[0, -0.3, HOUSE_H], [RX, -0.3, HOUSE_H], [RX, 0, HOUSE_H], [0, 0, HOUSE_H]])} fill="#f4f2ee" stroke="#d9d9d4" strokeWidth={1} />
    <polygon points={pts([[RX, -0.3, HOUSE_H], [RX, 0, HOUSE_H], [RX, 0, -0.3], [RX, -0.3, -0.3]])} fill="#c99a5c" />
  </g>;
}

function UPVCGlass({ w, h, cols, rows }) {
  const pw = (w - 12) / cols, ph = (h - 12) / rows, g = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.push(<rect key={r + '-' + c} x={6 + c * pw} y={6 + r * ph} width={pw - 3} height={ph - 3} fill="#b9cdd6" />);
  return <g><rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#d9d9d4" strokeWidth={1.5} />{g}</g>;
}

function KitchenWindow() {
  return <FaceY y={0.02} x0={3.4} z1={3.1}>
    <g><UPVCGlass w={70} h={40} cols={2} rows={1} /></g><g transform="translate(74 0)"><UPVCGlass w={70} h={40} cols={2} rows={1} /></g>
    <g transform="translate(0 44)"><UPVCGlass w={70} h={86} cols={2} rows={2} /></g><g transform="translate(74 44)"><UPVCGlass w={70} h={86} cols={2} rows={2} /></g>
    <rect x={-4} y={130} width={152} height={7} fill="#ffffff" />
    <path d="M14,154 q60,22 120,0" fill="none" stroke="#2a2a2c" strokeWidth={3} /><line x1={14} x2={134} y1={154} y2={154} stroke="#2a2a2c" strokeWidth={3} />
  </FaceY>;
}

// Doorway → Kitchen (white glazed back door, doormat in front)
function KitchenBackDoor() {
  return <g>
    <FaceY y={0.02} x0={KITCHEN.x0} z1={3.2}><UPVCGlass w={95} h={320} cols={3} rows={5} /><rect x={80} y={170} width={6} height={28} rx={2} fill="#c9ced2" /></FaceY>
    <FloorPlane z={0.013} x={KITCHEN.x0 + 0.1} y={0.05}><rect x={0} y={0} width={75} height={30} fill="#6f6863" /></FloorPlane>
  </g>;
}

// Doorway → Living room (white French doors)
function FrenchDoors() {
  return <FaceY y={0.02} x0={LIVING.x0} z1={3.2}>
    <UPVCGlass w={75} h={320} cols={2} rows={5} /><g transform="translate(75 0)"><UPVCGlass w={75} h={320} cols={2} rows={5} /></g>
    <rect x={64} y={170} width={5} height={26} rx={2} fill="#c9ced2" /><rect x={81} y={170} width={5} height={26} rx={2} fill="#c9ced2" />
  </FaceY>;
}

function DownpipeAndLantern() {
  return <g>
    <FaceY y={0.03} x0={2.9} z1={HOUSE_H}><rect x={0} y={0} width={12} height={HOUSE_H * 100 - 10} fill="#f4f2ee" stroke="#d9d9d4" strokeWidth={1} /></FaceY>
    <FaceY y={0.03} x0={9.15} z1={3.4}><path d="M4,0 h20 l-3,10 h-14 z" fill="#1d1f22" /><rect x={6} y={10} width={16} height={26} fill="#e8eef0" stroke="#1d1f22" strokeWidth={3} /><path d="M6,36 h16 l-8,10 z" fill="#1d1f22" /></FaceY>
  </g>;
}

// ---------- Side wall + outbuilding ----------
function GardenWall() {
  // two runs of wall either side of the outbuilding (which forms this stretch of the boundary)
  const runs = [[SHED.y1, RY], [0, SHED.y0]];
  return <g>{runs.map(([y0, y1]) => { const L = (y1 - y0) * 100; return <g key={y0}>
    <Plane o={[0, y1, WALL_H]} u={[0, -1, 0]} v={[0, 0, -1]}>
      <rect x={0} y={0} width={L} height={WALL_H * 100} fill="url(#gdBrick)" />
      <rect x={0} y={0} width={L} height={12} fill="#c9c6bc" />
      <rect x={0} y={150} width={L} height={6} fill="#b55a3e" />
    </Plane>
    <Plane o={[0, y1, WALL_H + 0.6]} u={[0, -1, 0]} v={[0, 0, -1]}>
      {Array.from({ length: Math.floor(L / 16) }, (_, i) => <line key={i} x1={i * 16} x2={i * 16} y1={0} y2={60} stroke="#c9a777" strokeWidth={3} />)}
      {[4, 30, 56].map(y => <line key={y} x1={0} x2={L} y1={y} y2={y} stroke="#c9a777" strokeWidth={3} />)}
    </Plane>
  </g>; })}</g>;
}

// Doorway → Outbuilding / garage (white door in its brick side wall)
function Outbuilding() {
  const { y0, y1, door0, door1 } = SHED, h = 2.9;
  return <g>
    <Box x={-1.4} y={y0} w={1.42} d={y1 - y0} h={h} c={['#5f6266', 'url(#gdBrick)', 'url(#gdBrick)']} />
    <FaceX x={0.03} y1={door1} z1={2.35}><rect x={0} y={0} width={(door1 - door0) * 100} height={235} fill="#ffffff" stroke="#d9d9d4" strokeWidth={2} /><rect x={12} y={14} width={56} height={90} fill="#cfd8dc" /><rect x={10} y={120} width={6} height={22} fill="#c9ced2" /></FaceX>
    <FloorPlane z={0.013} x={0.05} y={door0 + 0.05}><rect x={0} y={0} width={28} height={70} fill="#6f6863" /></FloorPlane>
  </g>;
}

function ClimbingShrub() {
  const pts2 = [[0.1, 1.6, 1.8], [0.1, 2.1, 2.4], [0.1, 2.5, 2.0], [0.1, 1.2, 1.2], [0.1, 2.3, 1.1]];
  return <g>{pts2.map(([x, y, z], i) => { const [px, py] = P(x, y, z); return <circle key={i} cx={px} cy={py} r={34 - (i % 2) * 8} fill={i % 2 ? '#7aa84e' : '#8fbf5a'} opacity={.95} />; })}
    {[[0.12, 1.5, 0.9], [0.12, 2.0, 0.7], [0.12, 2.3, 1.0]].map(([x, y, z], i) => { const [px, py] = P(x, y, z); return <circle key={'f' + i} cx={px} cy={py} r={5} fill="#e85a8a" />; })}
  </g>;
}

function GardenWasteBags() {
  return <g>
    <Box x={0.25} y={2.0} w={0.6} d={0.6} h={0.7} c={['#2f6e55', '#285f49', '#22533f']} />
    <Box x={0.9} y={2.1} w={0.55} d={0.55} h={0.6} c={['#2f6e55', '#285f49', '#22533f']} />
    <FloorPlane z={0.701} x={0.25} y={2.0}><path d="M10,20 l40,-10 M14,40 l36,-24 M20,50 l30,-6" stroke="#8a6a3a" strokeWidth={3} /></FloorPlane>
  </g>;
}

// ---------- Lawn features ----------
function Tree() {
  const [tx, ty] = P(0.8, 1.7, 0), [cx, cy] = P(0.8, 1.7, 4.2);
  return <g>
    <path d={`M${tx - 8},${ty} q-6,-120 20,-200 q10,-60 -10,-120 M${tx + 4},${ty} q20,-90 50,-150`} fill="none" stroke="#7a5a3a" strokeWidth={14} strokeLinecap="round" />
    {[[-70, 10, 70], [10, -40, 80], [80, 0, 70], [-20, 40, 60], [50, 50, 55], [-90, -40, 50]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={r} fill={['#7aa84e', '#8fbf5a', '#6b9a44'][i % 3]} opacity={.92} />)}
  </g>;
}

function BambooCorner() {
  return <g>
    <Box x={0.1} y={RY - 2.0} w={1.6} d={1.4} h={0.2} c={['#9c7a52', '#7f6242', '#6e5439']} />
    <FloorPlane z={0.201} x={0.1} y={RY - 2.0}><rect x={0} y={0} width={160} height={140} fill="#c9a777" /></FloorPlane>
    {[[0.5, RY - 1.2, 3.0, 70], [1.0, RY - 1.6, 3.4, 80], [0.4, RY - 1.8, 2.6, 60], [1.2, RY - 0.9, 2.4, 55]].map(([x, y, z, r], i) => { const [px, py] = P(x, y, z); return <ellipse key={i} cx={px} cy={py} rx={r} ry={r * 1.2} fill={i % 2 ? '#9cc95a' : '#7fb04a'} />; })}
  </g>;
}

function PaddlingPool() {
  return <FloorPlane z={0.01} x={4.6} y={3.0}><path d="M0,30 q20,-30 60,-20 q30,10 20,40 q-30,20 -60,10 q-30,-10 -20,-30 z" fill="#3fb0e0" stroke="#2a8fbd" strokeWidth={2} /><path d="M20,30 q20,-10 40,0" fill="none" stroke="#bfe6f5" strokeWidth={3} /></FloorPlane>;
}

// ---------- Patio furniture ----------
function CoveredBBQ() {
  return <g>
    <Box x={3.4} y={0.15} w={1.0} d={0.6} h={1.25} c={['#5b5560', '#4c4652', '#413c46']} />
    <FaceY y={0.75} x0={3.4} z1={1.25}><path d="M6,10 q44,-10 88,0" fill="none" stroke="#6b6570" strokeWidth={2} /><text x={50} y={34} textAnchor="middle" fontSize={8} fill="#9a95a0" fontFamily="sans-serif">BBQ</text></FaceY>
  </g>;
}

function DeckChair() {
  return <FaceY y={0.06} x0={4.55} z1={1.75}>
    <rect x={0} y={0} width={6} height={175} fill="#d99a50" /><rect x={50} y={0} width={6} height={175} fill="#d99a50" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={6 + i * 5} y={6} width={5} height={110} fill={['#e85a3a', '#7a4fd1', '#f2b632', '#3fb6c9', '#e85a8a'][i % 5]} />)}
  </FaceY>;
}

function RattanChair({ x, y }) {
  return <g>
    <Box x={x} y={y} w={0.65} d={0.65} h={0.45} c={RATTAN} />
    <Box x={x} y={y} w={0.65} d={0.12} h={0.95} c={RATTAN} />
    <Box x={x} y={y} w={0.1} d={0.65} h={0.7} c={RATTAN} /><Box x={x + 0.55} y={y} w={0.1} d={0.65} h={0.7} c={RATTAN} />
  </g>;
}

function RattanSofa() {
  const x = 8.4, y = 1.0;
  return <g>
    <Box x={x} y={y} w={0.7} d={1.4} h={0.45} c={RATTAN} />
    <Box x={x + 0.58} y={y} w={0.12} d={1.4} h={0.95} c={RATTAN} />
    <Box x={x} y={y} w={0.7} d={0.1} h={0.7} c={RATTAN} /><Box x={x} y={y + 1.3} w={0.7} d={0.1} h={0.7} c={RATTAN} />
  </g>;
}

function GlassTable() {
  return <g>
    {[[6.65, 0.25], [7.15, 0.25], [6.65, 0.7], [7.15, 0.7]].map(([x, y], i) => <Box key={i} x={x} y={y} w={0.04} d={0.04} h={0.6} c={RATTAN} />)}
    <Box x={6.6} y={0.2} z={0.6} w={0.6} d={0.55} h={0.03} c={['#9fb6bf', '#8aa1aa', '#7d939c']} />
    <Box x={6.7} y={0.3} z={0.63} w={0.12} d={0.12} h={0.1} c={['#d9784a', '#c4683e', '#b05c36']} />
    <Box x={6.9} y={0.4} z={0.63} w={0.12} d={0.12} h={0.1} c={['#d9784a', '#c4683e', '#b05c36']} />
  </g>;
}

function ShoppingBag() { return <Box x={6.1} y={0.25} z={0.45} w={0.35} d={0.2} h={0.38} c={['#2d5bd8', '#244ab8', '#1e3f9e']} />; }

// Front fences, kept low like the cut-away walls of the rooms.
function FrontFences() {
  return <g>
    <Box x={0} y={RY} w={RX} d={0.12} h={0.55} c={FENCE} />
    <Box x={RX} y={0} w={0.12} d={RY + 0.12} h={0.55} c={FENCE} />
  </g>;
}

const DEFS = <>
  <pattern id="gdBrick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#d9a660" /><rect x="1" y="1" width="38" height="8" fill="#e2b06a" /><rect x="-19" y="11" width="38" height="8" fill="#cf9a55" /><rect x="21" y="11" width="38" height="8" fill="#e0ab64" /></pattern>
  <clipPath id="gdPatio"><rect x={300} y={0} width={700} height={230} /></clipPath>
</>;

function GardenScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1080} cy={560} zoom={0.95} label="Garden" defs={DEFS}>
    <Outbuilding />
    <Slab RX={RX} RY={RY} />
    <Lawn />
    <Patio />
    <SteppingStones />
    <PatternRug />
    <HouseWall />
    <KitchenWindow />
    <KitchenBackDoor />
    <FrenchDoors />
    <DownpipeAndLantern />
    <GardenWall />
    <ClimbingShrub />
    <GardenWasteBags />
    <BambooCorner />
    <PaddlingPool />
    <CoveredBBQ />
    <DeckChair />
    <ShoppingBag />
    <RattanChair x={5.3} y={1.1} />
    <GlassTable />
    <RattanChair x={7.4} y={1.1} />
    <RattanSofa />
    <Tree />
    <FrontFences />
    <Tag show={L} at={[(KITCHEN.x0 + KITCHEN.x1) / 2, 0, 3.65]} text="Kitchen" />
    <Tag show={L} at={[(LIVING.x0 + LIVING.x1) / 2, 0, 3.65]} text="Living room" />
    <Tag show={L} at={[0, (SHED.door0 + SHED.door1) / 2, 2.8]} text="Garage" />
  </IsoStage>;
}
window.GardenScene = GardenScene;

})();

;(function(){
const React = FakeReact;
// NPC people in the same style as the Messy Room girl, with a small idle loop. Exports window.NPC.
// <Person at={[x,y,z]} s={scale} look={{...}} pose="stand|sit|wave|reach|up" facing="front|back" T={seconds} ph={phase} />
// `at` is the feet point (or the seat point when pose="sit"). Kids s≈0.8, adults s≈1.1.
const { P, shade } = window.Iso;

// One shared clock (≈30fps). Pass frozen=true for a still frame.
function useClock(frozen) { return frozen ? 0 : (window.__sceneT || 0); }

function HairBack({ L, back }) {
  const d = shade(L.hair, -0.18);
  switch (L.style) {
    case 'pony': return <ellipse cx={0} cy={-136} rx={33} ry={34} fill={d} />;
    case 'bob': return <path d="M-34,-136 C-34,-178 34,-178 34,-136 L33,-108 Q0,-102 -33,-108Z" fill={d} />;
    case 'long': return <path d="M-34,-136 C-34,-178 34,-178 34,-136 L32,-88 Q0,-82 -32,-88Z" fill={d} />;
    case 'curly': return <g fill={d}>{[[-24, -150], [0, -164], [24, -150], [-28, -126], [28, -126], [-14, -160], [14, -160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} />)}</g>;
    case 'bald': return back ? <ellipse cx={0} cy={-136} rx={28} ry={29} fill={L.skin} /> : null;
    default: return <ellipse cx={0} cy={-138} rx={30} ry={31} fill={d} />;
  }
}

function HairFront({ L }) {
  const h = L.hair, hl = shade(L.hair, 0.22);
  switch (L.style) {
    case 'pony': return <g><path d="M-29,-136 C-28,-168 26,-176 30,-138 C20,-150 4,-156 -6,-150 C-14,-146 -22,-142 -29,-136Z" fill={h} /><path d="M-4,-160 C6,-163 14,-160 20,-154" fill="none" stroke={hl} strokeWidth={3} strokeLinecap="round" /></g>;
    case 'bob': case 'long': return <path d="M-30,-130 C-31,-172 31,-172 30,-130 C26,-150 10,-156 0,-151 C-10,-156 -26,-150 -30,-130Z" fill={h} />;
    case 'curly': return <g fill={h}>{[-20, -8, 4, 16].map((x, i) => <circle key={i} cx={x} cy={-158 + (i % 2) * 3} r={10} />)}</g>;
    case 'bald': return <g><path d="M-27,-128 q-3,-10 0,-18 M27,-128 q3,-10 0,-18" stroke={h} strokeWidth={5} strokeLinecap="round" fill="none" /></g>;
    case 'cap': return <g><path d="M-29,-140 C-28,-172 28,-172 29,-140Z" fill={L.cap || '#d9465f'} /><path d="M-6,-142 Q20,-146 40,-138 Q20,-134 -6,-138Z" fill={shade(L.cap || '#d9465f', -0.2)} /></g>;
    default: return <path d="M-28,-140 C-28,-170 28,-172 29,-140 C22,-150 10,-154 0,-152 C-10,-154 -22,-150 -28,-140Z" fill={h} />;
  }
}

function Person({ at, s = 1, look = {}, pose = 'stand', facing = 'front', flip = false, T = 0, ph = 0, armL, armR, shadow = true, hold }) {
  const L = { skin: '#f6d2b8', hair: '#6b4a2e', style: 'short', top: '#4f86c6', legs: '#3b4a6b', shoes: '#2a2a2c', dress: false, ...look };
  const [px, py] = P(...at);
  const back = facing === 'back', sit = pose === 'sit';
  const br = Math.sin(T * 2.2 + ph) * 1.4;
  const blink = ((T + ph * 1.7) % 3.6) < 0.13 ? 1 : 0;
  let aL = armL ?? 8 + Math.sin(T * 1.5 + ph) * 3, aR = armR ?? 8 + Math.sin(T * 1.5 + ph + 1.3) * 3;
  if (pose === 'wave') aR = 150 + Math.sin(T * 9 + ph) * 22;
  if (pose === 'reach') aR = 75 + Math.sin(T * 3 + ph) * 8;
  if (pose === 'up') { aL = 165; aR = 165; }
  const legTop = L.dress ? -50 : -60, legH = L.dress ? 46 : 56;
  const arm = (side, ang) => <g transform={`translate(${side * 15} ${-98 + br}) rotate(${ang})`}>
    <rect x={-5} y={-3} width={10} height={44} rx={5} fill={L.skin} />
    <rect x={-6} y={-4} width={12} height={L.long ? 38 : 14} rx={6} fill={L.top} />
    {side === 1 && hold}
  </g>;
  return <g transform={`translate(${px} ${py}) scale(${s * (flip ? -1 : 1)} ${s})`}>
    <g transform={`translate(0 ${sit ? 42 : 0})`}>
      {shadow && <ellipse cx={0} cy={sit ? -40 : 0} rx={30} ry={9} fill="rgba(60,30,10,.18)" />}
      {!sit && <g>
        <g transform={`translate(-8 ${legTop})`}><rect x={-5} y={0} width={10} height={legH} rx={5} fill={L.legs} /><ellipse cx={2} cy={legH + 1} rx={8} ry={5} fill={L.shoes} /></g>
        <g transform={`translate(8 ${legTop})`}><rect x={-5} y={0} width={10} height={legH} rx={5} fill={L.legs} /><ellipse cx={2} cy={legH + 1} rx={8} ry={5} fill={L.shoes} /></g>
      </g>}
      {sit && <g><ellipse cx={0} cy={-46} rx={34} ry={12} fill={L.legs} /><ellipse cx={-26} cy={-44} rx={7} ry={5} fill={L.shoes} /><ellipse cx={26} cy={-44} rx={7} ry={5} fill={L.shoes} /></g>}
      {back && arm(-1, aL)}{back && arm(1, -aR)}
      {!back && L.style === 'pony' && <g transform={`translate(22 ${-150 + br}) rotate(${Math.sin(T * 3 + ph) * 6})`}><path d="M0,0 C18,4 22,30 10,46 C4,30 -2,16 0,0Z" fill={shade(L.hair, -0.18)} /></g>}
      <g transform={`translate(0 ${br * 0.5})`}>
        {L.dress
          ? <g><path d="M-16,-106 L16,-106 L27,-46 Q0,-40 -27,-46Z" fill={L.top} /><path d="M-27,-46 Q0,-40 27,-46 L28,-42 Q0,-36 -28,-42Z" fill={shade(L.top, -0.15)} /></g>
          : <g><path d="M-17,-106 L17,-106 L20,-56 Q0,-52 -20,-56Z" fill={L.top} />{L.apron && <path d="M-12,-92 H12 L15,-50 H-15Z" fill={L.apron} />}</g>}
      </g>
      {!back && arm(-1, aL)}{!back && arm(1, -aR)}
      <g transform={`translate(0 ${br})`}>
        <rect x={-5} y={-114} width={10} height={10} fill={shade(L.skin, -0.08)} />
        <HairBack L={L} back={back} />
        {!back && <g>
          <circle cx={0} cy={-134} r={27} fill={L.skin} />
          <HairFront L={L} />
          <g><ellipse cx={-9} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /><ellipse cx={10} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /></g>
          {L.glasses && <g fill="none" stroke="#2a2a2c" strokeWidth={2}><circle cx={-9} cy={-133} r={8} /><circle cx={10} cy={-133} r={8} /><line x1={-1} x2={2} y1={-133} y2={-133} /></g>}
          <circle cx={-17} cy={-123} r={5} fill="#f5a3b4" opacity={.6} /><circle cx={18} cy={-123} r={5} fill="#f5a3b4" opacity={.6} />
          {L.beard ? <path d="M-22,-128 Q-20,-104 0,-102 Q20,-104 22,-128 Q12,-114 0,-116 Q-12,-114 -22,-128Z" fill={shade(L.hair, -0.1)} />
            : <path d="M-5,-121 q5,5 10,0" fill="none" stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />}
        </g>}
        {back && <g>
          {L.style === 'curly' && <g fill={shade(L.hair, -0.18)}><circle cx={0} cy={-138} r={28} /><circle cx={-18} cy={-118} r={12} /><circle cx={18} cy={-118} r={12} /></g>}
          {L.style !== 'bald' && L.style !== 'curly' && <path d="M-30,-140 C-30,-110 -20,-100 0,-100 C20,-100 30,-110 30,-140Z" fill={shade(L.hair, -0.18)} />}
          {L.style === 'cap' && <path d="M-29,-140 C-28,-172 28,-172 29,-140Z" fill={L.cap || '#d9465f'} />}
          {L.style === 'pony' && <g transform={`translate(0 -158) rotate(${Math.sin(T * 3 + ph) * 6})`}><circle cx={0} cy={0} r={6} fill="#e96d9a" /><path d="M-6,2 C-14,20 -8,38 4,44 C8,28 10,14 6,2Z" fill={L.hair} /></g>}
        </g>}
        {L.style === 'bun' && <circle cx={0} cy={-172} r={12} fill={L.hair} />}
      </g>
    </g>
  </g>;
}

// A few ready-made looks so crowds vary.
const LOOKS = {
  girlPink: { hair: '#8a5a3a', style: 'pony', top: '#f39ac6', legs: '#9b7cc4', shoes: '#e96d9a', dress: true },
  girlBlue: { hair: '#e8c26a', style: 'bob', top: '#5fa8d8', legs: '#f4f2ee', shoes: '#3b4a6b', dress: true },
  girlCurly: { skin: '#8d5a3b', hair: '#2a1a12', style: 'curly', top: '#f2c94c', legs: '#3b4a6b', shoes: '#f4f2ee' },
  boyRed: { hair: '#4a3020', style: 'short', top: '#d9465f', legs: '#3b4a6b', shoes: '#2a2a2c' },
  boyGreen: { skin: '#c99272', hair: '#1d1410', style: 'short', top: '#5fbf6a', legs: '#6b5a48', shoes: '#f4f2ee' },
  boyCap: { hair: '#c99a5c', style: 'cap', cap: '#3f6e9a', top: '#f4f2ee', legs: '#3b4a6b', shoes: '#d9465f' },
  mum: { hair: '#6b3a24', style: 'long', top: '#7a9a6b', legs: '#2f3a52', shoes: '#f4f2ee', long: true },
  mumBun: { skin: '#e2b08c', hair: '#2a1a12', style: 'bun', top: '#c25a7a', legs: '#2a2a2c', shoes: '#2a2a2c', long: true },
  dad: { hair: '#3a2a1c', style: 'short', top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c', beard: true, long: true },
  grandad: { hair: '#d9d6ce', style: 'bald', top: '#a8865a', legs: '#5b5f66', shoes: '#4a3020', glasses: true, long: true },
  gran: { hair: '#e6e3dc', style: 'curly', top: '#9b7cc4', legs: '#5b5f66', shoes: '#4a3020', glasses: true, long: true },
};

window.NPC = { useClock, Person, LOOKS };

})();

;(function(){
const React = FakeReact;
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
    {LOCS.map(l => { const Draw = DRAW[l.id], on = hover === l.id; return <g key={l.id} data-loc={l.id}
      onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
      <g transform={on ? 'translate(0 -8)' : undefined}><Draw /></g>
    </g>; })}
    {LOCS.map(l => <Tag key={l.id} at={l.tag} text={l.id === here ? l.name + ' (you are here)' : l.name} />)}
    <text x={1150} y={300} textAnchor="middle" fontSize={44} fontWeight="800" fill="#3b2a24" fontFamily="'Baloo 2', sans-serif">Where shall we go?</text>
  </IsoStage>;
}
window.TownMapScene = TownMapScene;

})();

;(function(){
const React = FakeReact;
// Park. Static scenery with idle-animated NPCs. Exports window.ParkScene.
// Play area (fenced, rubber surface): swings, climbing tower + slide, merry-go-round, sandpit, see-saw.
// On the grass: zip line, duck pond, benches, ice cream van, trees, paths. Hedges along the two back edges.
const { P, pts, Plane, FloorPlane, FaceX, FaceY, Box, Tag, IsoStage, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const RX = 16, RY = 12;
const PLAY = { x0: 0.8, x1: 10.2, y0: 0.8, y1: 8.2, gate0: 4.4, gate1: 5.4 };
const GATE = { y0: 9.2, y1: 10.4 };   // park entrance on the near-right edge → Street / home
const MGR = { x: 2.8, y: 5.0, r: 1.15 };
const POND = { x: 13.1, y: 5.7, rx: 2.2, ry: 1.5 };
const RED = ['#e0524a', '#c4433c', '#ab3832'], BLUE = ['#3f7fc4', '#336aa6', '#2b5a8e'], YEL = ['#f2c94c', '#dcb23a', '#c49c30'];
const GREEN = ['#4e8a4a', '#3f743c', '#346333'], STEEL = ['#c9ced2', '#aeb4b9', '#9aa1a6'], WOOD = ['#b8875a', '#9a6e47', '#85603c'];
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };

// ---------- Ground ----------
function Grass() {
  const t = [];
  for (let i = 0; i < 260; i++) { const a = Math.sin(i * 91.7) * 9999, b = Math.sin(i * 37.3) * 9999; t.push(<path key={i} d={`M${(a - Math.floor(a)) * RX * 100},${(b - Math.floor(b)) * RY * 100} l3,-8 l3,8`} fill="none" stroke="#5f9a3e" strokeWidth={2} />); }
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#5a3d26" />
    <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#86b955" />{t}</FloorPlane>
  </g>;
}

function Paths() {
  const s = { fill: 'none', stroke: '#e3d3ae', strokeLinecap: 'round' };
  return <FloorPlane z={0.004}>
    <path d={`M${RX * 100 + 20},980 C1300,990 1000,1040 700,960 C560,920 500,880 490,${PLAY.y1 * 100 + 10}`} {...s} strokeWidth={100} />
    <path d="M1100,975 C1080,860 1000,780 960,760" {...s} strokeWidth={80} />
    <ellipse cx={POND.x * 100} cy={POND.y * 100} rx={POND.rx * 100 + 75} ry={POND.ry * 100 + 75} {...s} strokeWidth={60} />
    <path d="M700,960 C520,1010 420,1040 300,1060" {...s} strokeWidth={80} />
  </FloorPlane>;
}

function PlaySurface() {
  const { x0, x1, y0, y1 } = PLAY;
  return <FloorPlane z={0.006} x={x0} y={y0}>
    <rect x={0} y={0} width={(x1 - x0) * 100} height={(y1 - y0) * 100} fill="#5fa58a" />
    <circle cx={(MGR.x - x0) * 100} cy={(MGR.y - y0) * 100} r={160} fill="#e9875a" />
    <rect x={20} y={40} width={380} height={170} rx={20} fill="#4f8fc4" />
    {[[640, 140], [700, 600], [180, 640]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={22} fill="#f2c94c" opacity={.85} />)}
  </FloorPlane>;
}

function Hedges() {
  return <g>
    <Box x={-0.7} y={-0.7} w={RX + 0.7} d={0.7} h={1.2} c={GREEN} stroke="rgba(30,60,30,.3)" />
    <Box x={-0.7} y={0} w={0.7} d={RY} h={1.2} c={GREEN} stroke="rgba(30,60,30,.3)" />
  </g>;
}

function Tree({ x, y, s = 1, tone = 0 }) {
  const [tx, ty] = P(x, y, 0), [cx, cy] = P(x, y, 3.6 * s);
  const greens = [['#6b9a44', '#7aa84e', '#8fbf5a'], ['#4f8a4a', '#5f9a52', '#76b060']][tone];
  return <g>
    <ellipse cx={tx} cy={ty} rx={60 * s} ry={22 * s} fill="rgba(40,60,20,.2)" />
    <path d={`M${tx - 9 * s},${ty} q-4,-${120 * s} 9,-${260 * s} q13,${140 * s} 9,${260 * s}Z`} fill="#7a5a3a" />
    {[[-60, 20, 70], [10, -40, 82], [70, 10, 68], [-20, 50, 60], [45, 60, 55], [-75, -30, 52]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx * s} cy={cy + dy * s} r={r * s} fill={greens[i % 3]} />)}
  </g>;
}

function Fence({ x0, y0, x1, y1 }) {
  const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.35), posts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; posts.push(ln([x, y, 0], [x, y, 0.7], '#2f5a3a', 3.5, i)); }
  return <g>{posts}{ln([x0, y0, 0.66], [x1, y1, 0.66], '#2f5a3a', 5, 'top')}{ln([x0, y0, 0.25], [x1, y1, 0.25], '#2f5a3a', 4, 'low')}</g>;
}
const BackFences = () => <g><Fence x0={PLAY.x0} y0={PLAY.y0} x1={PLAY.x1} y1={PLAY.y0} /><Fence x0={PLAY.x0} y0={PLAY.y0} x1={PLAY.x0} y1={PLAY.y1} /></g>;
const FrontFences = () => <g>
  <Fence x0={PLAY.x1} y0={PLAY.y0} x1={PLAY.x1} y1={PLAY.y1} />
  <Fence x0={PLAY.x0} y0={PLAY.y1} x1={PLAY.gate0} y1={PLAY.y1} />
  <Fence x0={PLAY.gate1} y0={PLAY.y1} x1={PLAY.x1} y1={PLAY.y1} />
</g>;

// ---------- Swings ----------
const SW = { x0: 1.3, x1: 4.5, y: 1.6, top: 2.7, len: 1.95 };
function SwingFrame() {
  const { x0, x1, y, top } = SW;
  return <g>
    {[x0, x1].map(x => <g key={x}>{ln([x, y - 0.55, 0], [x, y, top], '#3f7fc4', 9, 'a')}{ln([x, y + 0.55, 0], [x, y, top], '#3f7fc4', 9, 'b')}</g>)}
    {ln([x0, y, top], [x1, y, top], '#336aa6', 10, 'bar')}
  </g>;
}
function Swing({ x, a, seat = '#2a2a2c' }) {
  const { y, top, len } = SW, sy = y + Math.sin(a) * len, sz = top - Math.cos(a) * len;
  const s0 = P(x - 0.22, sy, sz), s1 = P(x + 0.22, sy, sz);
  return <g>
    {ln([x - 0.22, y, top], [x - 0.22, sy, sz], '#9aa1a6', 2.5, 'l')}{ln([x + 0.22, y, top], [x + 0.22, sy, sz], '#9aa1a6', 2.5, 'r')}
    <line x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} stroke={seat} strokeWidth={7} strokeLinecap="round" />
  </g>;
}
const swingPos = (x, a) => [x, SW.y + Math.sin(a) * SW.len, SW.top - Math.cos(a) * SW.len];

// ---------- Climbing tower + slide ----------
const TW = { x0: 6.0, x1: 7.6, y0: 1.1, y1: 2.7, deck: 1.8, roof: 3.3 };
function TowerBack() {
  const { x0, x1, y0, y1, deck } = TW;
  return <g>
    {[[x0, y0], [x1, y0], [x0, y1]].map(([x, y], i) => <Box key={i} x={x - 0.07} y={y - 0.07} w={0.14} d={0.14} h={TW.roof} c={WOOD} />)}
    <Box x={x0} y={y0} z={deck - 0.12} w={x1 - x0} d={y1 - y0} h={0.12} c={WOOD} />
    <FaceY y={y0 + 0.02} x0={x0 + 0.1} z1={deck + 0.9}>{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={i * 24} y={0} width={14} height={90} rx={3} fill="#e0524a" />)}</FaceY>
  </g>;
}
function TowerFront() {
  const { x0, x1, y0, y1, deck, roof } = TW;
  return <g>
    <Box x={x1 - 0.07} y={y1 - 0.07} w={0.14} d={0.14} h={roof} c={WOOD} />
    {/* climbing wall on the right face, rope ladder on the front */}
    <FaceX x={x1 + 0.08} y1={y1 - 0.1} z1={deck}><rect x={0} y={0} width={140} height={180} fill="#f2c94c" stroke="#c49c30" strokeWidth={2} />
      {[[20, 30, '#e0524a'], [70, 50, '#3f7fc4'], [110, 20, '#5fbf6a'], [40, 100, '#7a4fd1'], [95, 120, '#e0524a'], [25, 150, '#3f7fc4']].map(([x, y, c], i) => <ellipse key={i} cx={x} cy={y} rx={10} ry={7} fill={c} />)}</FaceX>
    {ln([x0 + 0.1, y1 + 0.02, deck], [x0 + 0.1, y1 + 0.5, 0], '#c9a777', 4, 'r1')}{ln([x0 + 0.45, y1 + 0.02, deck], [x0 + 0.45, y1 + 0.5, 0], '#c9a777', 4, 'r2')}
    {[0.3, 0.7, 1.1, 1.5].map(z => ln([x0 + 0.1, y1 + 0.02 + (deck - z) / deck * 0.48, z], [x0 + 0.45, y1 + 0.02 + (deck - z) / deck * 0.48, z], '#c9a777', 3, 'rung' + z))}
    {/* pitched roof */}
    <polygon points={pts([[x0 - 0.15, y0 - 0.15, roof], [x1 + 0.15, y0 - 0.15, roof], [x1 + 0.15, (y0 + y1) / 2, roof + 0.7], [x0 - 0.15, (y0 + y1) / 2, roof + 0.7]])} fill="#c4433c" stroke="#ab3832" />
    <polygon points={pts([[x0 - 0.15, y1 + 0.15, roof], [x1 + 0.15, y1 + 0.15, roof], [x1 + 0.15, (y0 + y1) / 2, roof + 0.7], [x0 - 0.15, (y0 + y1) / 2, roof + 0.7]])} fill="#e0524a" stroke="#ab3832" />
    <polygon points={pts([[x1 + 0.15, y0 - 0.15, roof], [x1 + 0.15, y1 + 0.15, roof], [x1 + 0.15, (y0 + y1) / 2, roof + 0.7]])} fill="#ab3832" />
  </g>;
}
const SL = { x0: 6.75, x1: 7.45, ya: TW.y1, yb: 5.3, za: TW.deck, zb: 0.3 };
function Slide() {
  const { x0, x1, ya, yb, za, zb } = SL;
  return <g>
    {ln([x1 - 0.1, yb - 0.2, 0], [x1 - 0.1, yb - 0.2, zb], '#9aa1a6', 5, 'leg')}
    <polygon points={pts([[x0, ya, za], [x1, ya, za], [x1, yb - 0.6, zb + 0.15], [x1, yb, zb], [x0, yb, zb], [x0, yb - 0.6, zb + 0.15]])} fill="#f2c94c" stroke="#c49c30" strokeWidth={2} />
    <polygon points={pts([[x1, ya, za], [x1, ya, za + 0.22], [x1, yb - 0.6, zb + 0.37], [x1, yb, zb + 0.2], [x1, yb, zb], [x1, yb - 0.6, zb + 0.15]])} fill="#dcb23a" />
  </g>;
}
function slidePos(u) {
  const { x0, x1, ya, yb, za, zb } = SL, k = Math.min(1, u * 1.15);
  return [(x0 + x1) / 2, ya + (yb - 0.3 - ya) * k, za + (zb - za) * Math.min(1, k * 1.1) + 0.05];
}

// ---------- Merry-go-round ----------
function MerryGoRound({ T, kid }) {
  const { x, y, r } = MGR, rot = T * 45, a = (rot + 30) * Math.PI / 180;
  const kidPos = [x + Math.cos(a) * 0.72, y + Math.sin(a) * 0.72, 0.32], behind = Math.cos(a) + Math.sin(a) < 0;
  const bars = [0, 90, 180, 270].map(d => { const b = (rot + d) * Math.PI / 180; return ln([x + Math.cos(b) * 0.95, y + Math.sin(b) * 0.95, 0.32], [x + Math.cos(b) * 0.4, y + Math.sin(b) * 0.4, 1.1], '#e0524a', 5, d); });
  const kidEl = kid(kidPos);
  return <g>
    <FloorPlane z={0.14} x={x} y={y}><circle r={r * 100} fill="#8a6a4a" /></FloorPlane>
    <FloorPlane z={0.3} x={x} y={y}><g transform={`rotate(${rot})`}>
      <circle r={r * 100} fill="#f2c94c" stroke="#c49c30" strokeWidth={4} />
      {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M0,0 L${Math.cos(i * Math.PI / 3) * r * 100},${Math.sin(i * Math.PI / 3) * r * 100} A${r * 100},${r * 100} 0 0 1 ${Math.cos((i + 1) * Math.PI / 3) * r * 100},${Math.sin((i + 1) * Math.PI / 3) * r * 100}Z`} fill={i % 2 ? '#3f7fc4' : '#e0524a'} opacity={.85} />)}
      <circle r={16} fill="#9aa1a6" />
    </g></FloorPlane>
    {behind && kidEl}
    {ln([x, y, 0.3], [x, y, 1.15], '#9aa1a6', 7, 'pole')}
    <FloorPlane z={1.1} x={x} y={y}><circle r={40} fill="none" stroke="#e0524a" strokeWidth={6} /></FloorPlane>
    {bars}
    {!behind && kidEl}
  </g>;
}

// ---------- Sandpit + see-saw ----------
function Sandpit() {
  return <g>
    <Box x={7.9} y={3.4} w={2.0} d={1.7} h={0.28} c={WOOD} />
    <FloorPlane z={0.281} x={8.0} y={3.5}><rect x={0} y={0} width={180} height={150} fill="#ecd59c" />{[[40, 30], [120, 90], [70, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill="#e0c47f" />)}</FloorPlane>
    <Box x={9.2} y={3.65} z={0.28} w={0.32} d={0.32} h={0.22} c={['#e3c87e', '#d4b86e', '#c4a85e']} />
    <Box x={9.25} y={3.7} z={0.5} w={0.12} d={0.12} h={0.1} c={['#e3c87e', '#d4b86e', '#c4a85e']} />
    <Box x={8.25} y={4.55} z={0.28} w={0.22} d={0.22} h={0.24} c={RED} />
    {ln([8.6, 4.75, 0.3], [8.95, 4.95, 0.32], '#3f7fc4', 5, 'spade')}
  </g>;
}
const SS = { x0: 4.6, x1: 7.6, y: 6.9, pivot: 0.55 };
function SeeSaw({ tilt, kids }) {
  const { x0, x1, y, pivot } = SS, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
  const zL = pivot + Math.sin(tilt) * half, zR = pivot - Math.sin(tilt) * half;
  return <g>
    <polygon points={pts([[cx - 0.25, y - 0.2, 0], [cx + 0.25, y - 0.2, 0], [cx, y, pivot]])} fill="#3f7fc4" />
    <polygon points={pts([[cx - 0.25, y + 0.2, 0], [cx + 0.25, y + 0.2, 0], [cx, y, pivot]])} fill="#336aa6" />
    {kids([x0 + 0.35, y, zL + 0.06], [x1 - 0.35, y, zR + 0.06])[0]}
    <polygon points={pts([[x0, y - 0.15, zL], [x1, y - 0.15, zR], [x1, y + 0.15, zR], [x0, y + 0.15, zL]])} fill="#e0524a" stroke="#ab3832" strokeWidth={2} />
    <polygon points={pts([[x0, y + 0.15, zL], [x1, y + 0.15, zR], [x1, y + 0.15, zR - 0.08], [x0, y + 0.15, zL - 0.08]])} fill="#ab3832" />
    {[[x0 + 0.5, zL + (zR - zL) * 0.5 / (x1 - x0)], [x1 - 0.5, zR + (zL - zR) * 0.5 / (x1 - x0)]].map(([x, z], i) => ln([x, y - 0.15, z], [x, y - 0.15, z + 0.35], '#9aa1a6', 4, i))}
    {kids([x0 + 0.35, y, zL + 0.06], [x1 - 0.35, y, zR + 0.06])[1]}
  </g>;
}

// ---------- Zip line ----------
const ZIP = { x0: 11.0, x1: 15.6, y: 1.3, za: 3.3, zb: 2.2 };
function ZipLine() {
  const { x0, x1, y, za, zb } = ZIP;
  return <g>
    {[[x0 - 0.4, y - 0.4], [x0 + 0.4, y - 0.4], [x0 - 0.4, y + 0.4]].map(([x, yy], i) => <Box key={i} x={x - 0.07} y={yy - 0.07} w={0.14} d={0.14} h={za + 0.2} c={WOOD} />)}
    <Box x={x0 - 0.45} y={y - 0.45} z={1.5} w={0.9} d={0.9} h={0.1} c={WOOD} />
    <Box x={x0 + 0.33} y={y + 0.33} w={0.14} d={0.14} h={za + 0.2} c={WOOD} />
    {[0.3, 0.7, 1.1].map(z => ln([x0 + 0.45, y + 0.45 + (1.5 - z) * 0.3, z], [x0 + 0.45, y - 0.2 + (1.5 - z) * 0.3, z], '#85603c', 4, z))}
    {ln([x0 - 0.45, y - 0.45, za + 0.2], [x0 + 0.45, y - 0.45, za + 0.2], '#85603c', 6, 'beam')}
    <Box x={x1 - 0.08} y={y - 0.08} w={0.16} d={0.16} h={zb + 0.3} c={WOOD} />
    <Box x={x1 - 0.5} y={y - 0.4} w={0.6} d={0.8} h={0.25} c={['#3a3a3c', '#2a2a2c', '#202022']} />
    {ln([x0, y, za], [x1, y, zb], '#5b5f66', 3, 'cable')}
  </g>;
}
function zipPos(u) { const { x0, x1, y, za, zb } = ZIP, k = 0.08 + u * 0.82; return { top: [x0 + (x1 - x0) * k, y, za + (zb - za) * k], seat: [x0 + (x1 - x0) * k, y, za + (zb - za) * k - 1.05] }; }

// ---------- Pond ----------
function Pond() {
  const { x, y, rx, ry } = POND;
  return <g>
    <FloorPlane z={0.008} x={x} y={y}>
      <ellipse rx={rx * 100 + 14} ry={ry * 100 + 14} fill="#9aa18e" />
      <ellipse rx={rx * 100} ry={ry * 100} fill="#4f9fc4" />
      <ellipse rx={rx * 70} ry={ry * 60} cx={-20} cy={-10} fill="#68b3d4" />
      {[[-90, -40], [60, 50], [120, -20]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={18} ry={12} fill="#6fae5a" />)}
    </FloorPlane>
  </g>;
}
function Reeds() {
  const { x, y, rx } = POND;
  return <g>{[[-0.9, -1.15], [-0.6, -1.3], [0.9, -1.2], [1.95, -0.3], [2.05, 0.2]].map(([dx, dy], i) => <g key={i}>
    {[-0.08, 0, 0.08].map((o, k) => ln([x + dx + o, y + dy, 0], [x + dx + o * 2, y + dy, 0.8 + k * 0.15], '#5f8a3a', 3, k))}
    {ln([x + dx, y + dy, 0.75], [x + dx, y + dy, 0.95], '#7a4f2a', 6, 'h')}
  </g>)}</g>;
}
function Duck({ at, T, ph, flip }) {
  const [px, py] = P(...at), bob = Math.sin(T * 3 + ph) * 1.5;
  return <g transform={`translate(${px} ${py + bob}) scale(${flip ? -1 : 1} 1)`}>
    <ellipse cx={0} cy={2} rx={20} ry={5} fill="rgba(255,255,255,.35)" />
    <path d="M-16,-2 Q-18,-14 -4,-14 L10,-14 Q18,-14 16,-4 Q8,2 -16,-2Z" fill="#8a6a4a" />
    <path d="M-10,-12 Q-2,-18 8,-12" fill="none" stroke="#6b4f35" strokeWidth={2} />
    <circle cx={12} cy={-20} r={7} fill="#2f7a4a" /><path d="M18,-20 l8,2 l-8,2z" fill="#f2a23a" /><circle cx={14} cy={-22} r={1.4} fill="#111" />
    <rect x={7} y={-15} width={10} height={2.5} fill="#fff" />
  </g>;
}

// ---------- Benches, ice cream van ----------
function Bench({ x, y }) {
  return <g>
    {[x + 0.1, x + 1.3].map(bx => <Box key={bx} x={bx} y={y} w={0.1} d={0.45} h={0.45} c={['#3a3a3c', '#2a2a2c', '#202022']} />)}
    <Box x={x} y={y} z={0.45} w={1.5} d={0.45} h={0.07} c={WOOD} />
    <Box x={x} y={y - 0.04} z={0.55} w={1.5} d={0.06} h={0.45} c={WOOD} />
  </g>;
}
function Bin({ x, y }) { return <Box x={x} y={y} w={0.38} d={0.38} h={0.85} c={['#2f5a3a', '#264b30', '#1f3f28']} />; }

const VAN = { x0: 1.0, x1: 4.6, y0: 9.0, y1: 10.5 };
function VanBack() {
  const { x0, x1, y0, y1 } = VAN;
  return <g>
    <Box x={x0} y={y0} z={0.35} w={x1 - x0} d={y1 - y0} h={2.4} c={['#fbf8f2', '#fbf8f2', '#ebe6dc']} />
    {/* serving hatch (dark interior) */}
    <FaceY y={y1 + 0.005} x0={x0 + 0.5} z1={2.45}><rect x={0} y={0} width={200} height={95} rx={6} fill="#4a3a32" /></FaceY>
  </g>;
}
function VanFront() {
  const { x0, x1, y0, y1 } = VAN;
  return <g>
    <FaceY y={y1 + 0.01} x0={x0} z1={2.75}>
      <rect x={0} y={235} width={360} height={10} fill="#7fc4e0" />
      <path d={`M0,200 ${Array.from({ length: 10 }, (_, i) => `q18,22 36,0`).join(' ')} V240 H0Z`} fill="#f39ac6" />
      <rect x={45} y={128} width={210} height={14} fill="#e8d2b0" stroke="#c9b08a" strokeWidth={1} />
      <text x={300} y={70} textAnchor="middle" fontSize={22} fontWeight="800" fill="#e05a8a" fontFamily="'Baloo 2', sans-serif">ICES</text>
      <path d="M292,90 l8,40 l8,-40z" fill="#e3b06a" /><circle cx={300} cy={86} r={11} fill="#f7c6d6" /><circle cx={300} cy={76} r={7} fill="#fbf8f2" />
    </FaceY>
    {/* menu board */}
    <FaceX x={x1 + 0.01} y1={y1 - 0.15} z1={2.4}><rect x={0} y={0} width={110} height={70} rx={6} fill="#3a2a2c" />{['#f7c6d6', '#fbf8f2', '#8fd0b4', '#e3b06a'].map((c, i) => <circle key={i} cx={18 + i * 25} cy={30} r={9} fill={c} />)}<rect x={10} y={48} width={90} height={5} fill="#fbf8f2" opacity={.6} /></FaceX>
    <Box x={x1} y={y0 + 0.1} z={0.35} w={1.1} d={y1 - y0 - 0.2} h={1.3} c={['#fbf8f2', '#f0eadc', '#7fc4e0']} />
    <FaceX x={x1 + 1.11} y1={y1 - 0.2} z1={1.55}><rect x={10} y={8} width={100} height={46} rx={6} fill="#bcdcea" stroke="#9cc3d6" strokeWidth={2} /><circle cx={14} cy={100} r={9} fill="#f2c94c" /><circle cx={106} cy={100} r={9} fill="#f2c94c" /></FaceX>
    {[[x0 + 0.5, y1], [x1 - 0.4, y1], [x1 + 0.8, y1 - 0.1]].map(([wx, wy], i) => { const [cx, cy] = P(wx, wy, 0.28); return <g key={i}><ellipse cx={cx} cy={cy} rx={20} ry={24} fill="#2a2a2c" /><ellipse cx={cx} cy={cy} rx={8} ry={10} fill="#c9ced2" /></g>; })}
  </g>;
}

// Doorway → Street / home (park gate on the near-right edge)
function EntranceGate() {
  const { y0, y1 } = GATE;
  return <g>
    {[y0, y1].map(y => <Box key={y} x={RX - 0.12} y={y - 0.12} w={0.24} d={0.24} h={1.3} c={['#2f5a3a', '#264b30', '#1f3f28']} />)}
    {ln([RX, y0, 1.45], [RX, y1, 1.45], '#2f5a3a', 5, 'arch')}
    <FaceX x={RX + 0.13} y1={y1 + 0.75} z1={1.2}><rect x={0} y={0} width={60} height={42} rx={4} fill="#2f5a3a" /><text x={30} y={27} textAnchor="middle" fontSize={15} fontWeight="800" fill="#fbf8f2" fontFamily="'Baloo 2', sans-serif">PARK</text></FaceX>
  </g>;
}
function NearRailings() {
  return <g><Fence x0={0} y0={RY} x1={RX} y1={RY} /><Fence x0={RX} y0={0} x1={RX} y1={GATE.y0} /><Fence x0={RX} y0={GATE.y1} x1={RX} y1={RY} /></g>;
}

function ParkScene({ showLabels = true, animate = true }) {
  const T = useClock(!animate);
  const L = showLabels;
  const kid = (props) => <Person s={0.78} T={T} {...props} />;
  const swingA = Math.sin(T * 2.2) * 0.6, swing2 = Math.sin(T * 1.1 + 1) * 0.08;
  const slideU = (T * 0.35) % 1, zipU = ((T * 0.12) % 1);
  const tilt = Math.sin(T * 1.4) * 0.16;
  const zp = zipPos(zipU < 0.85 ? zipU / 0.85 : 1);
  const stat = React.useMemo(() => ({
    ground: <><Grass /><Paths /><PlaySurface /><Pond /></>,
    back: <><Hedges /><Tree x={0.2} y={-0.3} tone={1} /><Tree x={9.6} y={0.2} s={0.9} /><Tree x={-0.3} y={10.5} s={1.05} /><Tree x={15.4} y={-0.3} s={0.95} tone={1} /><BackFences /></>,
  }), []);
  return <IsoStage cx={1075} cy={840} zoom={0.62} label="Park" defs={<clipPath id="pkHatch"><polygon points={pts([[VAN.x0 + 0.5, VAN.y1, 1.5], [VAN.x0 + 2.5, VAN.y1, 1.5], [VAN.x0 + 2.5, VAN.y1, 3.2], [VAN.x0 + 0.5, VAN.y1, 3.2]])} /></clipPath>}>
    {stat.ground}
    {stat.back}
    {/* parent pushing the swing */}
    <Person at={[3.4, 0.75, 0]} s={1.08} look={LOOKS.mum} T={T} ph={2} pose="reach" />
    <SwingFrame />
    <Swing x={2.0} a={window.__parkSwing != null ? window.__parkSwing : swing2} />
    {kid({ at: swingPos(3.4, swingA), look: LOOKS.girlPink, pose: 'sit', ph: 1, shadow: false, armL: 160, armR: 160 })}
    <Swing x={3.4} a={swingA} seat="#e0524a" />
    <TowerBack />
    {kid({ at: [6.9, 1.8, TW.deck], look: LOOKS.boyCap, pose: 'wave', ph: 3 })}
    <TowerFront />
    <Slide />
    {kid({ at: slidePos(Math.min(1, slideU / 0.75)), look: LOOKS.girlBlue, pose: 'sit', ph: 4, shadow: false, armL: 120, armR: 120 })}
    <ZipLine />
    {<g>{window.__parkZip ? kid({ at: [10.15, 2.35, 0], look: LOOKS.boyGreen, pose: 'wave', ph: 5 }) : <>{ln(zp.top, zp.seat, '#5b5f66', 3, 'rope')}{kid({ at: zp.seat, look: LOOKS.boyGreen, pose: 'sit', ph: 5, shadow: false, armL: 172, armR: 172 })}</>}</g>}
    <MerryGoRound T={T} kid={(at) => kid({ at, look: LOOKS.girlCurly, pose: 'sit', ph: 6, shadow: false, armR: 60 })} />
    <Sandpit />
    {kid({ at: [8.7, 4.2, 0.3], look: LOOKS.boyRed, pose: 'sit', ph: 7, armR: 40 + Math.sin(T * 4) * 20 })}
    <SeeSaw tilt={tilt} kids={(a, b) => [kid({ at: a, look: LOOKS.girlBlue, pose: 'sit', ph: 8, shadow: false, armL: 70, armR: 70, flip: true }), kid({ at: b, look: LOOKS.boyCap, pose: 'sit', ph: 9, shadow: false, armL: 70, armR: 70 })]} />
    <Reeds />
    {[[0, 0.9, 0.2], [1, 1.4, 0.55], [2, 0.6, 1.0]].map(([i, sp, off]) => { const a = T * 0.25 * sp + off * 6; return <Duck key={i} at={[POND.x + Math.cos(a) * POND.rx * 0.6, POND.y + Math.sin(a) * POND.ry * 0.55, 0]} T={T} ph={i} flip={Math.sin(a) < 0} />; })}
    <Fence x0={PLAY.x1} y0={PLAY.y0} x1={PLAY.x1} y1={PLAY.y1} />
    <Fence x0={PLAY.x0} y0={PLAY.y1} x1={PLAY.gate0} y1={PLAY.y1} />
    <Fence x0={PLAY.gate1} y0={PLAY.y1} x1={PLAY.x1} y1={PLAY.y1} />
    {/* grandad feeding the ducks */}
    <Person at={[12.0, 7.75, 0]} s={1.08} look={LOOKS.grandad} T={T} ph={10} facing="back" armR={60 + Math.sin(T * 2) * 10} />
    <Bench x={14.2} y={8.4} />
    <Person at={[14.6, 8.62, 0.45]} s={1.08} look={LOOKS.gran} T={T} ph={11} pose="sit" />
    <Bin x={13.6} y={8.6} />
    <Bench x={10.6} y={8.7} />
    <Person at={[11.0, 8.92, 0.45]} s={1.08} look={LOOKS.dad} T={T} ph={12} pose="sit" armR={40} />
    <VanBack />
    <g clipPath="url(#pkHatch)"><Person at={[2.3, 9.9, 0.35]} s={1.05} look={{ ...LOOKS.mumBun, top: '#fbf8f2', apron: '#f39ac6' }} T={T} ph={13} pose="reach" /></g>
    <VanFront />
    <Bench x={0.2} y={11.3} />
    {kid({ at: [2.6, 11.2, 0], look: LOOKS.girlPink, facing: 'back', ph: 14, armR: 120 })}
    {kid({ at: [3.5, 11.5, 0], look: LOOKS.boyRed, facing: 'back', ph: 15 })}
    <Person at={[4.2, 11.7, 0]} s={1.1} look={LOOKS.dad} T={T} ph={16} facing="back" />
    <EntranceGate />
    <NearRailings />
    <Tag show={L} at={[RX + 0.3, GATE.y1 + 0.6, 1.0]} text="Exit to street" />
    <Tag show={L} at={[(PLAY.gate0 + PLAY.gate1) / 2, PLAY.y1, 1.2]} text="Play area" />
  </IsoStage>;
}
window.ParkScene = ParkScene;

})();

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
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

})();

;(function(){
const React = FakeReact;
// School — one big scrolling map. Static scenery with idle-animated NPCs. Exports window.SchoolScene.
// Building (x 0–22, y 0–16), cut-away: full-height outer back walls, inner walls cut low with doorways.
//   Back row (y 0–7):    Callie's class (x 0–8) · Class 2 (x 8–16) · Hall / PE (x 16–22)
//   Corridor (y 7–9.5):  runs the full width; east end opens to the playground
//   Front row (y 9.5–16): Reception + main entrance (x 0–6) · Library corner (x 6–11) · Lunch hall (x 11–22)
// Playground outside (x 22–32, y 0–16).
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Tag, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const BX = 22, BY = 16, RH = 4.2, PX = 32, LOW = 0.55;
const ENTRANCE = { x0: 1.5, x1: 3.5 };     // front wall of Reception → Town map (outside)
const PLAY_DOOR = { y0: 7.2, y1: 9.3 };    // east end of corridor → Playground
const DOORS = { c1: [5, 6], c2: [13, 14], hall: [18, 19.5], recep: [2, 4.5], lib: [6.5, 10.5], lunch: [18, 20] };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };
const WALLC = ['#fffaf0', '#ead8b8', '#e3d0ae'];
const UNIFORM = { top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c' }, UNI_G = { top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c', dress: true };
const kidsLook = [LOOKS.girlPink, LOOKS.boyRed, LOOKS.girlBlue, LOOKS.boyGreen, LOOKS.girlCurly, LOOKS.boyCap].map((l, i) => ({ ...l, ...(l.dress ? UNI_G : UNIFORM) }));
const K = (i) => kidsLook[i % kidsLook.length];
const TXT = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 };

// ---------- Shell ----------
function Floors() {
  const tile = (x, y, w, d, a, b, s = 50) => { const t = []; for (let i = 0; i < w * 100 / s; i++) for (let j = 0; j < d * 100 / s; j++) t.push(<rect key={i + '-' + j} x={i * s} y={j * s} width={s} height={s} fill={(i + j) % 2 ? a : b} />); return <FloorPlane x={x} y={y}><g>{t}</g></FloorPlane>; };
  return <g>
    <polygon points={pts([[0, BY, 0], [PX, BY, 0], [PX, BY, -0.35], [0, BY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[PX, 0, 0], [PX, BY, 0], [PX, BY, -0.35], [PX, 0, -0.35]])} fill="#5a3d26" />
    {tile(0, 0, 8, 7, '#9fb4c9', '#94aac0')}
    {tile(8, 0, 8, 7, '#b4c79f', '#a9bd94')}
    <FloorPlane x={16} y={0}><rect width={600} height={700} fill="#d9a866" />{Array.from({ length: 30 }, (_, i) => <line key={i} x1={0} x2={600} y1={i * 24} y2={i * 24} stroke="#c4914f" strokeWidth={2} />)}
      <rect x={50} y={60} width={500} height={580} fill="none" stroke="#e0524a" strokeWidth={5} /><line x1={300} x2={300} y1={60} y2={640} stroke="#e0524a" strokeWidth={5} /><circle cx={300} cy={350} r={70} fill="none" stroke="#3f7fc4" strokeWidth={5} /></FloorPlane>
    <FloorPlane x={0} y={7}><rect width={BX * 100} height={250} fill="#e6e3da" />{Array.from({ length: 44 }, (_, i) => <line key={i} x1={i * 50} x2={i * 50} y1={0} y2={250} stroke="#d6d2c6" strokeWidth={2} />)}</FloorPlane>
    {tile(0, 9.5, 6, 6.5, '#ddd1bb', '#d2c5ad', 65)}
    <FloorPlane x={6} y={9.5}><rect width={500} height={650} fill="#b86a5a" /></FloorPlane>
    {tile(11, 9.5, 11, 6.5, '#ece2cc', '#ddd0b4')}
    <FloorPlane x={BX} y={0}><rect width={(PX - BX) * 100} height={BY * 100} fill="#6f7378" />{Array.from({ length: 120 }, (_, i) => { const a = Math.sin(i * 77.1) * 9999, b = Math.sin(i * 13.7) * 9999; return <circle key={i} cx={(a - Math.floor(a)) * 1000} cy={(b - Math.floor(b)) * 1600} r={2} fill="#62666b" />; })}</FloorPlane>
  </g>;
}

function BackWalls() {
  const segY = [[0, 8, '#f5e8cf'], [8, 16, '#e8f0dc'], [16, BX, '#f1e4cc']], segX = [[0, 7, '#e9d6b6'], [7, 9.5, '#e3d6c2'], [9.5, BY, '#e9d6b6']];
  return <g>
    {segY.map(([a, b, c]) => <polygon key={a} points={pts([[a, 0, 0], [b, 0, 0], [b, 0, RH], [a, 0, RH]])} fill={c} />)}
    {segX.map(([a, b, c]) => <polygon key={a} points={pts([[0, a, 0], [0, b, 0], [0, b, RH], [0, a, RH]])} fill={c} />)}
    <polygon points={pts([[-0.2, -0.2, RH], [BX, -0.2, RH], [BX, 0, RH], [0, 0, RH], [0, BY, RH], [-0.2, BY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[BX, -0.2, RH], [BX, 0, RH], [BX, 0, -0.35], [BX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, BY, RH], [0, BY, RH], [0, BY, -0.35], [-0.2, BY, -0.35]])} fill="#cdb791" />
    <polygon points={pts([[0, 0.01, 0], [BX, 0.01, 0], [BX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, BY, 0], [0.01, BY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
  </g>;
}

// Low cut-away wall along y (fixed y) or along x (fixed x), with door gaps [[a,b],...].
function LowWallY({ y, x0, x1, gaps = [] }) {
  const segs = []; let a = x0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { segs.push([a, g0]); a = g1; }); segs.push([a, x1]);
  return <g>{segs.filter(([s, e]) => e > s).map(([s, e]) => <Box key={s} x={s} y={y - 0.1} w={e - s} d={0.2} h={LOW} c={WALLC} />)}</g>;
}
function LowWallX({ x, y0, y1, gaps = [] }) {
  const segs = []; let a = y0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { segs.push([a, g0]); a = g1; }); segs.push([a, y1]);
  return <g>{segs.filter(([s, e]) => e > s).map(([s, e]) => <Box key={s} x={x - 0.1} y={s} w={0.2} d={e - s} h={LOW} c={WALLC} />)}</g>;
}

// ---------- Classroom pieces ----------
function Whiteboard({ x0, w = 3 }) {
  return <FaceY y={0.02} x0={x0} z1={2.7}>
    <rect x={-6} y={-6} width={w * 100 + 12} height={132} fill="#c9ced2" /><rect x={0} y={0} width={w * 100} height={120} fill="#fbfbf8" />
    <text x={20} y={40} fontSize={26} fill="#3f7fc4" {...TXT}>2 + 3 = 5</text>
    <text x={20} y={86} fontSize={24} fill="#e0524a" {...TXT}>Aa Bb Cc</text>
    <circle cx={w * 100 - 50} cy={45} r={20} fill="none" stroke="#f2a127" strokeWidth={4} />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1={w * 100 - 50 + Math.cos(a * Math.PI / 180) * 26} y1={45 + Math.sin(a * Math.PI / 180) * 26} x2={w * 100 - 50 + Math.cos(a * Math.PI / 180) * 34} y2={45 + Math.sin(a * Math.PI / 180) * 34} stroke="#f2a127" strokeWidth={3} />)}
    <rect x={20} y={124} width={w * 100 - 40} height={6} fill="#9aa1a6" />
  </FaceY>;
}
function Frieze({ x0, n = 12 }) {
  const c = ['#e0524a', '#f2a127', '#f2c94c', '#5fbf6a', '#3fb6c9', '#3f7fc4', '#7a4fd1', '#e85a7a'];
  return <FaceY y={0.02} x0={x0} z1={3.55}>{Array.from({ length: n }, (_, i) => <g key={i}><rect x={i * 26} y={0} width={24} height={30} fill={c[i % 8]} /><text x={i * 26 + 12} y={22} textAnchor="middle" fontSize={16} fill="#fff" {...TXT}>{String.fromCharCode(65 + i)}</text></g>)}</FaceY>;
}
function SchoolWindowX({ y1, w = 1.6 }) {
  return <FaceX x={0.02} y1={y1} z1={3.4}><rect x={-5} y={-5} width={w * 100 + 10} height={140} fill="#fff" /><rect x={0} y={0} width={w * 100} height={130} fill="#cfe3d2" /><line x1={w * 50} x2={w * 50} y1={0} y2={130} stroke="#fff" strokeWidth={5} /><line x1={0} x2={w * 100} y1={50} y2={50} stroke="#fff" strokeWidth={5} /></FaceX>;
}
function CoatPegs({ y0, y1 }) {
  const bags = ['#e0524a', '#3f7fc4', '#f39ac6', '#5fbf6a', '#f2c94c', '#7a4fd1', '#3fb6c9', '#e98a3a'];
  const n = Math.floor((y1 - y0) / 0.42);
  return <FaceX x={0.03} y1={y1} z1={1.75}><rect x={0} y={0} width={(y1 - y0) * 100} height={10} fill="#c99a5c" />{Array.from({ length: n }, (_, i) => <g key={i}><circle cx={20 + i * 42} cy={16} r={4} fill="#9aa1a6" /><path d={`M${8 + i * 42},20 h24 l4,${50 + (i % 3) * 10} h-32z`} fill={bags[i % 8]} /><rect x={12 + i * 42} y={0} width={18} height={9} fill="#fbf8f2" /></g>)}</FaceX>;
}
function KidsTable({ x, y, w = 1.6, d = 0.9 }) {
  return <g>
    {[[x + 0.08, y + d - 0.12], [x + w - 0.12, y + d - 0.12]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.06} d={0.06} h={0.6} c={['#5b5f66', '#41454b', '#33363b']} />)}
    <Box x={x} y={y} z={0.6} w={w} d={d} h={0.05} c={OAK} />
    {[[0.2, '#fbf8f2'], [0.7, '#fbf8f2'], [1.15, '#bcdcea']].filter(([a]) => a < w - 0.3).map(([a, c], i) => <Box key={i} x={x + a} y={y + 0.2 + (i % 2) * 0.25} z={0.65} w={0.3} d={0.22} h={0.01} c={[c, c, c]} />)}
    <Box x={x + w / 2 - 0.1} y={y + d / 2 - 0.1} z={0.65} w={0.2} d={0.2} h={0.18} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />
  </g>;
}
function SmallChair({ x, y, c = '#3f7fc4', back = 'n' }) {
  const cc = [c, shade(c, -0.12), shade(c, -0.22)];
  return <g><Box x={x} y={y} w={0.36} d={0.36} h={0.36} c={cc} />{back === 'n' ? <Box x={x} y={y} z={0.36} w={0.36} d={0.05} h={0.35} c={cc} /> : <Box x={x} y={y + 0.31} z={0.36} w={0.36} d={0.05} h={0.35} c={cc} />}</g>;
}
function TeacherDesk({ x, y }) {
  return <g>
    <Box x={x} y={y} w={1.4} d={0.7} h={0.75} c={OAK} />
    <Box x={x + 0.2} y={y + 0.1} z={0.75} w={0.45} d={0.32} h={0.03} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={x + 0.9} y={y + 0.15} z={0.75} w={0.3} d={0.25} h={0.15} c={['#e0524a', '#3f7fc4', '#f2c94c']} />
    <Box x={x + 1.1} y={y + 0.45} z={0.75} w={0.1} d={0.1} h={0.12} c={['#fbf8f2', '#e85a7a', '#e85a7a']} />
  </g>;
}
function ReadingCorner({ x, y }) {
  return <g>
    <FloorPlane z={0.008} x={x} y={y}><rect width={150} height={230} rx={20} fill="#f2c94c" /><rect x={15} y={15} width={120} height={200} rx={14} fill="none" stroke="#e0524a" strokeWidth={6} />{[0, 1, 2].map(i => <circle key={i} cx={75} cy={50 + i * 65} r={18} fill="#3fb6c9" />)}</FloorPlane>
    <Box x={x + 0.1} y={y + 0.1} w={0.7} d={0.4} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} />
    {[0, 1, 2, 3, 4].map(i => <Box key={i} x={x + 0.15 + i * 0.12} y={y + 0.15} z={0.45} w={0.1} d={0.28} h={0.22 + (i % 2) * 0.05} c={[['#3f7fc4', '#f2c94c', '#5fbf6a', '#e85a7a', '#7a4fd1'][i], '#fbf8f2', '#e6e1d6']} />)}
  </g>;
}
function DisplayBoard({ x0, w, z1 = 2.6, art = 'paint' }) {
  const c = ['#e0524a', '#f2c94c', '#3fb6c9', '#5fbf6a', '#f39ac6', '#7a4fd1'];
  return <FaceY y={0.02} x0={x0} z1={z1}><rect x={0} y={0} width={w * 100} height={110} fill="#3f6e9a" /><rect x={4} y={4} width={w * 100 - 8} height={102} fill="none" stroke="#f2c94c" strokeWidth={4} strokeDasharray="10 6" />
    {Array.from({ length: Math.floor(w * 100 / 42) }, (_, i) => <g key={i} transform={`translate(${10 + i * 42} ${14 + (i % 2) * 40}) rotate(${(i % 3 - 1) * 4})`}><rect width={34} height={40} fill="#fbf8f2" />{art === 'paint' ? <><circle cx={17} cy={16} r={9} fill={c[i % 6]} /><rect x={6} y={28} width={22} height={6} fill={c[(i + 2) % 6]} /></> : <path d="M6,32 L17,8 L28,32Z" fill={c[i % 6]} />}</g>)}
  </FaceY>;
}
function SinkUnit({ x }) {
  return <g><Box x={x} y={0.05} w={1.2} d={0.55} h={0.85} c={WHITE} /><Box x={x + 0.2} y={0.12} z={0.85} w={0.5} d={0.38} h={0.04} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />{ln([x + 0.45, 0.1, 0.89], [x + 0.45, 0.1, 1.15], '#9aa1a6', 3, 't')}{[0, 1, 2].map(i => <Box key={i} x={x + 0.8 + i * 0.12} y={0.15} z={0.85} w={0.1} d={0.1} h={0.16} c={[['#e0524a', '#3f7fc4', '#f2c94c'][i], '#ddd', '#ccc']} />)}</g>;
}
function Easel({ x, y }) {
  return <FaceY y={y} x0={x} z1={1.55}><line x1={30} x2={20} y1={0} y2={155} stroke="#c99560" strokeWidth={5} /><line x1={10} x2={0} y1={60} y2={155} stroke="#c99560" strokeWidth={4} /><line x1={50} x2={60} y1={60} y2={155} stroke="#c99560" strokeWidth={4} /><rect x={-2} y={14} width={64} height={70} fill="#fbf8f2" stroke="#c99560" strokeWidth={2} /><circle cx={22} cy={40} r={12} fill="#f2c94c" /><path d="M4,74 q20,-24 52,-8 v18 h-52z" fill="#5fbf6a" /><path d="M36,34 l14,0" stroke="#3fb6c9" strokeWidth={6} /></FaceY>;
}

// ---------- Hall / PE ----------
function WallBars() {
  return <FaceY y={0.03} x0={16.4} z1={3.2}>{[0, 1, 2, 3].map(i => <g key={i}><rect x={i * 60} y={0} width={8} height={320} fill="#c99560" /><rect x={i * 60 + 46} y={0} width={8} height={320} fill="#c99560" />{Array.from({ length: 14 }, (_, k) => <rect key={k} x={i * 60} y={10 + k * 22} width={54} height={5} fill="#d9a866" />)}</g>)}</FaceY>;
}
function ClimbRopes() { return <g>{[20.2, 20.8, 21.4].map((x, i) => <g key={x}>{ln([x, 1.0, RH], [x, 1.0, 0.4 + i * 0.1], '#c9a777', 5, 'r')}</g>)}</g>; }
function GymMat({ x, y, w = 1.6, d = 1.1 }) { return <Box x={x} y={y} w={w} d={d} h={0.12} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />; }
function PEBench({ x, y, w = 2.4 }) { return <g>{[x + 0.15, x + w - 0.25].map(a => <Box key={a} x={a} y={y} w={0.1} d={0.3} h={0.38} c={['#5b5f66', '#41454b', '#33363b']} />)}<Box x={x} y={y} z={0.38} w={w} d={0.3} h={0.07} c={['#d9a866', '#c4914f', '#ab7d42']} /></g>; }
function Hoops() { return <FloorPlane z={0.01} x={19.2} y={2.2}>{[['#e0524a', 0, 0], ['#f2c94c', 70, 30], ['#5fbf6a', 20, 80], ['#3f7fc4', 100, 100]].map(([c, x, y], i) => <circle key={i} cx={x + 30} cy={y + 30} r={30} fill="none" stroke={c} strokeWidth={7} />)}</FloorPlane>; }
function Cones() { return <g>{[[17.0, 4.6], [17.8, 4.6], [18.6, 4.6], [19.4, 4.6]].map(([x, y], i) => { const [cx, cy] = P(x, y, 0); return <path key={i} d={`M${cx - 9},${cy} L${cx},${cy - 24} L${cx + 9},${cy}Z`} fill="#f2a127" stroke="#d98a1a" />; })}</g>; }
function Ball({ at, c = '#e0524a', r = 9 }) { const [x, y] = P(...at); return <g><ellipse cx={x} cy={y + r * 0.2} rx={r} ry={r * 0.4} fill="rgba(0,0,0,.15)" /><circle cx={x} cy={y - r} r={r} fill={c} /><path d={`M${x - r * 0.7},${y - r * 1.4} q${r * 0.7},${r * 0.5} ${r * 1.4},0`} fill="none" stroke="#fff" strokeWidth={2} /></g>; }

// ---------- Corridor ----------
function NoticeBoard() {
  return <FaceX x={0.03} y1={9.2} z1={2.6}><rect x={0} y={0} width={190} height={110} fill="#c99560" /><rect x={6} y={6} width={178} height={98} fill="#d9b57a" />{[[14, 14, '#fbf8f2'], [70, 20, '#f2c94c'], [128, 12, '#bcdcea'], [24, 62, '#f7c6d6'], [96, 60, '#fbf8f2']].map(([x, y, c], i) => <g key={i}><rect x={x} y={y} width={46} height={34} fill={c} transform={`rotate(${(i % 3 - 1) * 4} ${x + 23} ${y + 17})`} /><circle cx={x + 23} cy={y + 3} r={3} fill="#e0524a" /></g>)}</FaceX>;
}
function WaterFountain({ x }) { return <g><Box x={x} y={7.15} w={0.5} d={0.4} h={0.9} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} /><FloorPlane z={0.901} x={x + 0.08} y={7.2}><ellipse cx={17} cy={14} rx={14} ry={10} fill="#8fd0e0" /></FloorPlane></g>; }
function Lockers({ x0, n }) {
  const c = ['#3f7fc4', '#5fbf6a', '#f2c94c', '#e0524a'];
  return <g>{Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0 + i * 0.45} y={7.12} w={0.43} d={0.4} h={1.5} c={[shade(c[i % 4], 0.1), c[i % 4], shade(c[i % 4], -0.2)]} /><FaceY y={7.52} x0={x0 + i * 0.45} z1={1.5}><rect x={10} y={20} width={22} height={4} fill="rgba(0,0,0,.25)" /><rect x={10} y={30} width={22} height={4} fill="rgba(0,0,0,.25)" /><circle cx={34} cy={80} r={3} fill="#2a2a2c" /></FaceY></g>)}</g>;
}

// ---------- Reception ----------
function SchoolSign() {
  return <FaceX x={0.03} y1={13.6} z1={3.3}><rect x={0} y={0} width={300} height={100} rx={10} fill="#3f6e9a" /><circle cx={50} cy={50} r={34} fill="#f2c94c" /><path d="M50,24 C36,40 36,58 50,74 C64,58 64,40 50,24Z" fill="#3f8a5a" /><rect x={47} y={64} width={6} height={16} fill="#7a5a3a" /><text x={190} y={45} textAnchor="middle" fontSize={24} fill="#fbf8f2" {...TXT}>Oakfield</text><text x={190} y={76} textAnchor="middle" fontSize={20} fill="#f2c94c" {...TXT}>Primary School</text></FaceX>;
}
function TrophyCabinet() {
  return <g><Box x={0.02} y={14.0} w={0.5} d={1.4} h={1.8} c={['#a8774a', '#8c6238', '#78532f']} />
    <FaceX x={0.52} y1={15.4} z1={1.8}><rect x={8} y={8} width={124} height={160} fill="#d4ecf0" fillOpacity={.6} />{[0, 1, 2].map(r => <g key={r}><rect x={8} y={60 + r * 52} width={124} height={4} fill="#78532f" />{[0, 1, 2].map(k => <g key={k}><path d={`M${24 + k * 40},${30 + r * 52} h20 q0,18 -10,22 q-10,-4 -10,-22z`} fill={k === 1 ? '#c9ced2' : '#e3b04a'} /><rect x={30 + k * 40} y={52 + r * 52} width={8} height={8} fill="#78532f" /></g>)}</g>)}</FaceX></g>;
}
function ReceptionDesk() {
  return <g><Box x={2.4} y={10.3} w={3.2} d={0.7} h={1.05} c={['#d9a866', '#3f6e9a', '#336aa6']} />
    <FaceY y={11.0} x0={2.4} z1={1.05}><text x={160} y={60} textAnchor="middle" fontSize={28} fill="#fbf8f2" {...TXT}>RECEPTION</text></FaceY>
    <Box x={2.6} y={10.4} z={1.05} w={0.45} d={0.08} h={0.35} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={4.6} y={10.5} z={1.05} w={0.3} d={0.25} h={0.04} c={['#5b5f66', '#41454b', '#33363b']} />
    <Box x={5.0} y={10.45} z={1.05} w={0.3} d={0.3} h={0.25} c={['#5fbf6a', '#4aa055', '#3f8a4a']} /></g>;
}
function WaitingChairs() { return <g>{[11.6, 12.3, 13.0].map(y => <g key={y}><Box x={0.2} y={y} w={0.5} d={0.55} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} /><Box x={0.2} y={y} z={0.45} w={0.1} d={0.55} h={0.45} c={['#e0524a', '#c4433c', '#ab3832']} /></g>)}</g>; }
function Plant({ x, y }) { const [px, py] = P(x + 0.2, y + 0.2, 0.45); return <g><Box x={x} y={y} w={0.4} d={0.4} h={0.45} c={['#e9e4da', '#d6d0c4', '#c9c2b4']} />{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={px + (i % 2 ? 1 : -1) * (8 + i * 3)} cy={py - 14 - i * 12} rx={16} ry={6} transform={`rotate(${i % 2 ? 30 : -30} ${px + (i % 2 ? 1 : -1) * (8 + i * 3)} ${py - 14 - i * 12})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}</g>; }

// ---------- Library ----------
function Bookcase({ x, y, w = 2.1, h = 1.8 }) {
  const c = ['#e0524a', '#3f7fc4', '#f2c94c', '#5fbf6a', '#7a4fd1', '#e85a7a', '#3fb6c9', '#e98a3a'];
  return <g><Box x={x} y={y} w={w} d={0.4} h={h} c={['#a8774a', '#8c6238', '#78532f']} />
    <FaceY y={y + 0.4} x0={x} z1={h}>{Array.from({ length: Math.round(h / 0.45) }, (_, r) => <g key={r}><rect x={6} y={8 + r * 45} width={w * 100 - 12} height={37} fill="#5a412a" />{Array.from({ length: Math.floor((w * 100 - 16) / 11) }, (_, k) => <rect key={k} x={8 + k * 11} y={14 + r * 45 + (k * 7 % 5)} width={9} height={31 - (k * 7 % 5)} fill={c[(k + r * 3) % 8]} />)}</g>)}</FaceY></g>;
}
function Beanbag({ x, y, c }) { const [bx, by] = P(x, y, 0.25); return <g><ellipse cx={bx} cy={by + 14} rx={40} ry={16} fill="rgba(0,0,0,.15)" /><path d={`M${bx - 40},${by + 10} Q${bx - 44},${by - 30} ${bx},${by - 34} Q${bx + 44},${by - 30} ${bx + 40},${by + 10} Q${bx},${by + 26} ${bx - 40},${by + 10}Z`} fill={c} stroke={shade(c, -0.2)} strokeWidth={2} /></g>; }
function LibraryRug() { return <FloorPlane z={0.008} x={8.5} y={12.3}><circle r={130} fill="#f2e3b0" /><circle r={100} fill="none" stroke="#3f8a5a" strokeWidth={10} /><circle r={50} fill="#5fbf6a" /></FloorPlane>; }

// ---------- Lunch hall ----------
function ServingCounter() {
  const food = ['#f2c94c', '#e98a3a', '#5fbf6a', '#c4433c', '#f4efe4'];
  return <g><Box x={11.5} y={10.0} w={5.0} d={0.7} h={0.95} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    {food.map((c, i) => <g key={i}><Box x={11.7 + i * 0.95} y={10.1} z={0.95} w={0.8} d={0.5} h={0.06} c={['#9aa1a6', '#8a9196', '#7a8186']} /><FloorPlane z={1.011} x={11.75 + i * 0.95} y={10.15}>{Array.from({ length: 8 }, (_, k) => <circle key={k} cx={10 + (k % 4) * 20} cy={12 + Math.floor(k / 4) * 22} r={8} fill={shade(c, (k % 2) * 0.08)} />)}</FloorPlane></g>)}
    <polygon points={pts([[11.5, 10.75, 1.45], [16.5, 10.75, 1.45], [16.5, 10.75, 1.5], [11.5, 10.75, 1.5]])} fill="#c9ced2" />
    <polygon points={pts([[11.5, 10.75, 1.0], [16.5, 10.75, 1.0], [16.5, 10.75, 1.45], [11.5, 10.75, 1.45]])} fill="#d4ecf0" fillOpacity={.3} stroke="#a9c4c9" />
    {[0, 1, 2, 3, 4, 5].map(i => <Box key={i} x={16.6} y={10.1} z={i * 0.05} w={0.5} d={0.4} h={0.04} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />)}</g>;
}
function LunchTable({ y, x0 = 12.2, len = 8.6 }) {
  return <g>
    <Box x={x0} y={y - 0.5} w={len} d={0.3} h={0.38} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />
    {[x0 + 0.2, x0 + len - 0.3].map(a => <Box key={a} x={a} y={y + 0.55} w={0.1} d={0.1} h={0.65} c={['#5b5f66', '#41454b', '#33363b']} />)}
    <Box x={x0} y={y} z={0.65} w={len} d={0.75} h={0.05} c={['#e6e3da', '#d6d2c6', '#c9c4b8']} />
    {Array.from({ length: 7 }, (_, i) => <g key={i}><Box x={x0 + 0.4 + i * 1.2} y={y + 0.05} z={0.7} w={0.45} d={0.3} h={0.03} c={['#3f7fc4', '#336aa6', '#2b5a8e']} /><FloorPlane z={0.731} x={x0 + 0.45 + i * 1.2} y={y + 0.08}><circle cx={12} cy={12} r={9} fill="#f2c94c" /><rect x={22} y={6} width={14} height={12} fill="#5fbf6a" /></FloorPlane></g>)}
    <Box x={x0 + len / 2} y={y + 0.3} z={0.7} w={0.14} d={0.14} h={0.28} c={['#d4ecf0', '#bcdcea', '#a9c9d6']} />
  </g>;
}
const FrontBench = ({ y, x0 = 12.2, len = 8.6 }) => <Box x={x0} y={y + 0.95} w={len} d={0.3} h={0.38} c={['#3f7fc4', '#336aa6', '#2b5a8e']} />;
function Bins() { return <g>{[['#3f7fc4', 0], ['#5fbf6a', 0.5], ['#5b5f66', 1.0]].map(([c, o]) => <Box key={o} x={21.0} y={10.0 + o} w={0.42} d={0.42} h={0.8} c={[shade(c, 0.1), c, shade(c, -0.2)]} />)}</g>; }

// ---------- Playground ----------
function PlaygroundMarkings() {
  return <FloorPlane z={0.006} x={BX}>
    {/* hopscotch */}
    {[[150, 1000, 1], [150, 1080, 2], [110, 1160, 3], [190, 1160, 4], [150, 1240, 5], [110, 1320, 6], [190, 1320, 7], [150, 1400, 8]].map(([x, y, n]) => <g key={n}><rect x={x} y={y} width={78} height={78} fill="none" stroke="#f2c94c" strokeWidth={5} /><text x={x + 39} y={y + 52} textAnchor="middle" fontSize={34} fill="#f2c94c" {...TXT}>{n}</text></g>)}
    {/* snakes & ladders */}
    <g transform="translate(480 860)">{Array.from({ length: 25 }, (_, i) => <rect key={i} x={(i % 5) * 60} y={Math.floor(i / 5) * 60} width={60} height={60} fill={(i + Math.floor(i / 5)) % 2 ? '#e0524a' : '#f2c94c'} opacity={.8} />)}<path d="M40,30 C120,80 60,170 200,250" stroke="#5fbf6a" strokeWidth={14} fill="none" strokeLinecap="round" /><path d="M230,40 L260,230 M260,40 L290,230" stroke="#fbf8f2" strokeWidth={6} />{[60, 100, 140, 180].map(y => <line key={y} x1={232 + y / 6.3} x2={262 + y / 6.3} y1={y} y2={y} stroke="#fbf8f2" strokeWidth={5} />)}</g>
    {/* four square + compass */}
    <g transform="translate(560 1260)"><rect width={240} height={240} fill="none" stroke="#fbf8f2" strokeWidth={6} /><line x1={120} x2={120} y1={0} y2={240} stroke="#fbf8f2" strokeWidth={6} /><line x1={0} x2={240} y1={120} y2={120} stroke="#fbf8f2" strokeWidth={6} /></g>
    <circle cx={480} cy={500} r={110} fill="none" stroke="#3fb6c9" strokeWidth={8} /><circle cx={480} cy={500} r={14} fill="#3fb6c9" />
  </FloorPlane>;
}
function Goal() { const x = 31.4; return <g>{ln([x, 3.0, 0], [x, 3.0, 1.3], '#fbf8f2', 6, 'a')}{ln([x, 5.4, 0], [x, 5.4, 1.3], '#fbf8f2', 6, 'b')}{ln([x, 3.0, 1.3], [x, 5.4, 1.3], '#fbf8f2', 6, 'c')}{ln([x + 0.5, 3.0, 0], [x, 3.0, 1.3], '#c9ced2', 2, 'd')}{ln([x + 0.5, 5.4, 0], [x, 5.4, 1.3], '#c9ced2', 2, 'e')}<polygon points={pts([[x, 3.0, 1.3], [x, 5.4, 1.3], [x + 0.5, 5.4, 0], [x + 0.5, 3.0, 0]])} fill="#fbf8f2" fillOpacity={.15} stroke="#c9ced2" strokeDasharray="4 4" /></g>; }
function PlayFrame() {
  const W = ['#b8875a', '#9a6e47', '#85603c'];
  return <g>{[[23.5, 1.2], [25.5, 1.2], [23.5, 2.8], [25.5, 2.8]].map(([x, y], i) => <Box key={i} x={x} y={y} w={0.12} d={0.12} h={1.8} c={W} />)}
    <Box x={23.5} y={1.2} z={1.0} w={2.1} d={1.7} h={0.1} c={W} />
    {[0.3, 0.6, 1.2, 1.5].map(z => ln([23.55, 2.9, z], [25.6, 2.9, z], '#e0524a', 4, z))}
    <polygon points={pts([[25.6, 1.5, 1.0], [25.6, 2.3, 1.0], [27.0, 2.3, 0.1], [27.0, 1.5, 0.1]])} fill="#3fb6c9" stroke="#2f96a6" strokeWidth={2} /></g>;
}
function PlayTree({ x, y, s = 1 }) { const [tx, ty] = P(x, y, 0), [cx, cy] = P(x, y, 3.2 * s); return <g><path d={`M${tx - 8},${ty} q-4,-${110 * s} 8,-${240 * s} q12,${130 * s} 8,${240 * s}Z`} fill="#7a5a3a" />{[[-50, 20, 60], [10, -30, 70], [60, 10, 58], [-10, 40, 50]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx * s} cy={cy + dy * s} r={r * s} fill={['#6b9a44', '#7aa84e', '#8fbf5a'][i % 3]} />)}</g>; }
function PlayFence({ x0, y0, x1, y1, h = 1.6 }) { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.3), p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push(ln([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0], [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, h], '#3f6e4a', 2.5, i)); } return <g>{p}{ln([x0, y0, h], [x1, y1, h], '#3f6e4a', 4, 't')}{ln([x0, y0, h * 0.5], [x1, y1, h * 0.5], '#3f6e4a', 3, 'm')}</g>; }
function PlayBench({ x, y }) { return <g>{[x + 0.1, x + 1.3].map(a => <Box key={a} x={a} y={y} w={0.1} d={0.45} h={0.45} c={['#3a3a3c', '#2a2a2c', '#202022']} />)}<Box x={x} y={y} z={0.45} w={1.5} d={0.45} h={0.07} c={['#b8875a', '#9a6e47', '#85603c']} /><Box x={x} y={y - 0.04} z={0.55} w={1.5} d={0.06} h={0.4} c={['#b8875a', '#9a6e47', '#85603c']} /></g>; }

// Doorway → Town map (main entrance, front wall of Reception)
function MainEntrance() {
  return <g>
    <FloorPlane z={0.01} x={ENTRANCE.x0} y={BY - 0.8}><rect width={(ENTRANCE.x1 - ENTRANCE.x0) * 100} height={70} rx={6} fill="#6f6863" /><text x={(ENTRANCE.x1 - ENTRANCE.x0) * 50} y={45} textAnchor="middle" fontSize={26} fill="#fbf8f2" {...TXT}>WELCOME</text></FloorPlane>
    <FloorPlane z={0.011} x={ENTRANCE.x0} y={BY - 0.1}><rect width={(ENTRANCE.x1 - ENTRANCE.x0) * 100} height={30} fill="#9aa1a6" /></FloorPlane>
    <polygon points={pts([[ENTRANCE.x0, BY, 0], [ENTRANCE.x1, BY, 0], [ENTRANCE.x1, BY, 2.4], [ENTRANCE.x0, BY, 2.4]])} fill="#fff" fillOpacity={0.001} />
  </g>;
}
// Doorway → Playground (east end of the corridor)
function PlaygroundDoor() { return <FloorPlane z={0.01} x={BX - 0.1} y={PLAY_DOOR.y0}><rect width={20} height={(PLAY_DOOR.y1 - PLAY_DOOR.y0) * 100} fill="#9aa1a6" /></FloorPlane>; }

// ---------- Scrolling stage ----------
function ScrollStage({ zoom, label, children }) {
  const ref = React.useRef(null), drag = React.useRef(null);
  const VB = { x: -400, y: -40, w: 3820, h: 2660 };
  React.useEffect(() => { const el = ref.current; if (!el) return; const [fx, fy] = P(5, 9, 0); el.scrollLeft = Math.max(0, (fx - VB.x) * zoom - el.clientWidth / 2); el.scrollTop = Math.max(0, (fy - VB.y) * zoom - el.clientHeight / 2); }, [zoom]);
  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, l: ref.current.scrollLeft, t: ref.current.scrollTop, moved: false }; };
  const move = (e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; ref.current.scrollLeft = d.l - dx; ref.current.scrollTop = d.t - dy; };
  const up = () => { setTimeout(() => { drag.current = null; }, 0); };
  const click = (e) => { if (drag.current && drag.current.moved) { e.preventDefault(); e.stopPropagation(); } };
  return <div ref={ref} data-screen-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClickCapture={click}
    style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#efe2d0', cursor: 'grab', userSelect: 'none' }}>
    <svg width={VB.w * zoom} height={VB.h * zoom} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{ display: 'block' }}>{children}</svg>
  </div>;
}

function SchoolScene({ showLabels = true, animate = true, zoom = 0.75 }) {
  const T = useClock(!animate);
  const L = showLabels;
  const kid = (at, i, p = {}) => <Person key={at.join(',')} at={at} s={0.72} look={K(i)} T={T} ph={i * 0.7} {...p} />;
  const adult = (at, look, p = {}) => <Person key={at.join(',')} at={at} s={1.02} look={look} T={T} ph={at[0]} {...p} />;
  // tag game in the playground — three kids running round a circle
  const tagKids = [0, 1, 2].map(i => { const a = T * 0.9 + i * 2.1; return kid([27.2 + Math.cos(a) * 1.6, 5.0 + Math.sin(a) * 1.2, 0], i + 3, { pose: i === 0 ? 'wave' : 'stand', flip: Math.sin(a) > 0, armL: 30, armR: 30 }); });
  const hop = Math.abs(Math.sin(T * 4)) * 0.25, skip = Math.abs(Math.sin(T * 6)) * 0.18;
  const ropeA = T * 6, [sx, sy] = P(25.2, 7.6, 0);
  const groups = [[0.8, 3.3], [4.3, 3.3], [0.8, 5.2], [4.3, 5.2]];

  return <ScrollStage zoom={zoom} label="School">
    <Floors />
    <BackWalls />

    {/* ===== Callie's class (x 0–8, y 0–7) ===== */}
    <Whiteboard x0={1.6} w={3.2} />
    <Frieze x0={0.4} n={14} />
    <SchoolWindowX y1={3.2} /><SchoolWindowX y1={5.6} />
    <CoatPegs y0={0.6} y1={6.6} />
    {adult([5.2, 1.3, 0], LOOKS.mumBun, { pose: 'wave' })}
    <TeacherDesk x={5.9} y={0.9} />
    <ReadingCorner x={6.2} y={3.2} />
    {kid([6.6, 4.2, 0], 2, { pose: 'sit', armL: 70, armR: 70 })}
    {groups.map(([gx, gy], g) => <g key={g}>
      <SmallChair x={gx + 0.25} y={gy - 0.45} c="#3f7fc4" /><SmallChair x={gx + 1.0} y={gy - 0.45} c="#e0524a" />
      {kid([gx + 0.43, gy - 0.25, 0.36], g * 4, { pose: 'sit', armL: 50, armR: 50 })}
      {kid([gx + 1.18, gy - 0.25, 0.36], g * 4 + 1, { pose: 'sit', armR: g === 1 ? 150 : 50, armL: 50 })}
      <KidsTable x={gx} y={gy} />
      {g !== 3 && kid([gx + 0.8, gy + 1.15, 0.36], g * 4 + 2, { pose: 'sit', facing: 'back', armL: 40, armR: 40 })}
      {g !== 3 && <SmallChair x={gx + 0.62} y={gy + 1.0} c="#5fbf6a" back="s" />}
    </g>)}
    <LowWallX x={8} y0={0} y1={7} />

    {/* ===== Class 2 (x 8–16, y 0–7) ===== */}
    <DisplayBoard x0={8.4} w={1.4} />
    <Whiteboard x0={10.2} w={3.0} />
    <DisplayBoard x0={13.4} w={1.0} art="tri" />
    <SinkUnit x={14.6} />
    {adult([12.9, 1.5, 0], LOOKS.dad, { pose: 'reach' })}
    {[[9.0, 2.7], [12.0, 2.7], [9.0, 4.3], [12.0, 4.3], [9.0, 5.8]].map(([tx, ty], i) => <g key={i}>
      <SmallChair x={tx + 0.4} y={ty - 0.45} c="#f2c94c" /><SmallChair x={tx + 1.4} y={ty - 0.45} c="#7a4fd1" />
      {kid([tx + 0.58, ty - 0.25, 0.36], i * 2 + 1, { pose: 'sit', armL: 50, armR: 50 })}
      {i !== 4 && kid([tx + 1.58, ty - 0.25, 0.36], i * 2 + 2, { pose: 'sit', armL: 50, armR: i === 2 ? 150 : 50 })}
      <KidsTable x={tx} y={ty} w={2.2} d={0.7} />
    </g>)}
    {kid([15.5, 4.9, 0], 4, { facing: 'back', armR: 120 })}
    <Easel x={14.9} y={4.6} />
    <LowWallX x={16} y0={0} y1={7} />

    {/* ===== Hall / PE (x 16–22, y 0–7) ===== */}
    <WallBars />
    <ClimbRopes />
    {kid([17.3, 0.5, 1.0], 5, { pose: 'up', shadow: false })}
    <GymMat x={16.8} y={1.8} />
    {kid([17.6, 2.4, 0.12], 0, { pose: 'sit', armL: 160, armR: 160 })}
    <Hoops />
    {kid([19.9, 2.9, hop], 1, { pose: 'up' })}
    <Cones />
    {kid([18.2, 4.0, 0], 2, { armL: 30, armR: 30 })}
    {kid([20.8, 4.3, 0], 3, { pose: 'wave', flip: true })}
    <Ball at={[20.3, 4.8, 0]} c="#f2a127" />
    {adult([17.6, 5.6, 0], { ...LOOKS.boyCap, top: '#e0524a', legs: '#2f3a52', cap: '#2f3a52', long: true }, { pose: 'wave' })}
    <PEBench x={19.0} y={5.9} />
    {kid([20.0, 6.05, 0.45], 4, { pose: 'sit' })}

    <LowWallY y={7} x0={0} x1={BX} gaps={[DOORS.c1, DOORS.c2, DOORS.hall]} />

    {/* ===== Corridor (y 7–9.5) ===== */}
    <NoticeBoard />
    <Lockers x0={1.0} n={8} />
    <WaterFountain x={10.4} />
    <Lockers x0={14.6} n={7} />
    {kid([7.5, 8.2, 0], 5, { armL: 25, armR: 25 })}
    {kid([8.2, 8.6, 0], 0, { pose: 'wave', flip: true })}
    {kid([10.6, 7.9, 0], 3, { facing: 'back', pose: 'reach' })}
    {adult([17.2, 8.4, 0], LOOKS.gran, { armL: 60, armR: 60 })}
    <PlaygroundDoor />

    <LowWallY y={9.5} x0={0} x1={BX} gaps={[DOORS.recep, DOORS.lib, DOORS.lunch]} />

    {/* ===== Reception (x 0–6, y 9.5–16) ===== */}
    <SchoolSign />
    <TrophyCabinet />
    {adult([3.6, 10.0, 0], LOOKS.mum)}
    <ReceptionDesk />
    <WaitingChairs />
    {adult([0.45, 12.35, 0.45], LOOKS.grandad, { pose: 'sit' })}
    <Plant x={5.3} y={11.5} />
    {kid([3.2, 12.0, 0], 1, { facing: 'back', pose: 'wave' })}
    {adult([3.9, 12.3, 0], LOOKS.dad, { facing: 'back' })}
    <LowWallX x={6} y0={9.5} y1={BY} gaps={[[12.6, 13.6]]} />

    {/* ===== Library corner (x 6–11) ===== */}
    <Bookcase x={6.3} y={9.7} />
    <Bookcase x={8.6} y={9.7} />
    {kid([9.6, 10.5, 0], 2, { facing: 'back', pose: 'reach' })}
    <LibraryRug />
    <Beanbag x={7.3} y={12.0} c="#f2c94c" />
    {kid([7.3, 12.0, 0.15], 0, { pose: 'sit', armL: 70, armR: 70 })}
    <Beanbag x={9.7} y={12.6} c="#3fb6c9" />
    {kid([9.7, 12.6, 0.15], 4, { pose: 'sit', armL: 70, armR: 70 })}
    <Bookcase x={7.0} y={14.3} w={2.4} h={0.9} />
    {adult([10.2, 14.6, 0], { ...LOOKS.mum, hair: '#d9b46a', style: 'bob', glasses: true })}
    <LowWallX x={11} y0={9.5} y1={BY} />

    {/* ===== Lunch hall (x 11–22) ===== */}
    {adult([13.0, 9.75, 0], { ...LOOKS.gran, top: '#fbf8f2', apron: '#3fb6c9' }, { pose: 'reach' })}
    {adult([15.2, 9.75, 0], { ...LOOKS.mumBun, top: '#fbf8f2', apron: '#3fb6c9' })}
    <ServingCounter />
    <Bins />
    {[11.6, 13.4, 15.0].map((ty, r) => <g key={ty}>
      {[0, 1, 2, 3, 4].map(k => kid([12.8 + k * 1.7, ty - 0.35, 0.38], r * 5 + k, { pose: 'sit', armL: 50, armR: k % 2 ? 60 : 40 }))}
      <LunchTable y={ty} />
      {r < 2 && [0, 1, 2, 3].map(k => kid([13.6 + k * 1.8, ty + 1.1, 0.38], r * 4 + k + 2, { pose: 'sit', facing: 'back', armL: 40, armR: 40 }))}
      {r < 2 && <FrontBench y={ty} />}
    </g>)}
    {kid([18.6, 10.8, 0], 3, { facing: 'back' })}

    {/* ===== Outer low walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} gaps={[[PLAY_DOOR.y0, PLAY_DOOR.y1]]} />
    <LowWallY y={BY} x0={0} x1={BX} gaps={[[ENTRANCE.x0, ENTRANCE.x1]]} />
    <MainEntrance />

    {/* ===== Playground (x 22–32) ===== */}
    <PlayFence x0={BX + 0.2} y0={0} x1={PX} y1={0} />
    <PlaygroundMarkings />
    <PlayTree x={31.2} y={0.6} s={1.1} />
    <PlayFrame />
    {kid([24.4, 2.0, 1.1], 1, { pose: 'wave' })}
    <Goal />
    {kid([29.8, 4.2, 0], 5, { armL: 30, armR: 30 })}
    <Ball at={[30.5, 4.4, 0]} />
    {tagKids}
    <g>
      {kid([25.2, 7.6, skip], 2, { armL: 60, armR: 60 })}
      <g transform={`translate(${sx} ${sy - 60}) rotate(${Math.sin(ropeA) * 8})`}><ellipse cx={0} cy={0} rx={34} ry={64 * (0.6 + Math.abs(Math.cos(ropeA)) * 0.4)} fill="none" stroke="#e85a7a" strokeWidth={3} /></g>
    </g>
    {kid([23.9, 11.8, hop], 4, { pose: 'up' })}
    {kid([28.4, 13.4, 0], 0, { pose: 'wave' })}
    {kid([29.6, 14.0, 0], 3, { facing: 'back' })}
    {adult([30.4, 9.8, 0], { ...LOOKS.dad, top: '#f2e34a', long: true }, { armL: 20, armR: 20 })}
    <PlayBench x={26.0} y={15.2} />
    {kid([26.5, 15.42, 0.45], 1, { pose: 'sit' })}
    <PlayTree x={22.8} y={15.2} s={0.9} />
    <PlayFence x0={PX} y0={0} x1={PX} y1={BY} h={0.7} />
    <PlayFence x0={BX} y0={BY} x1={PX} y1={BY} h={0.7} />

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4, 0, 3.9]} text="Callie's class" />
    <Tag show={L} at={[12, 0, 3.9]} text="Class 2" />
    <Tag show={L} at={[19, 0, 3.9]} text="Hall / PE" />
    <Tag show={L} at={[3.5, 8.25, 1.6]} text="Corridor" />
    <Tag show={L} at={[0, 12.8, 3.9]} text="Reception" />
    <Tag show={L} at={[8.5, 11.2, 2.4]} text="Library" />
    <Tag show={L} at={[16.5, 12.4, 2.6]} text="Lunch hall" />
    <Tag show={L} at={[27, 8, 2.4]} text="Playground" />
    <g><Tag show={true} at={[(ENTRANCE.x0 + ENTRANCE.x1) / 2, BY + 0.2, 1.2]} text="Exit → Map" /></g>
  </ScrollStage>;
}
window.SchoolScene = SchoolScene;

})();

;(function(){
const React = FakeReact;
// Nanny & Grandad's house — two floors, each a scrolling/draggable map. Exports window.NannyHouseScene.
// The user's floor sketches are rotated 180° so the kitchen and the TV wall sit on the full-height back walls.
// Ground (x 0–18, y 0–14): Kitchen (x0–8,y0–7) · Hall + front door (x8–14.2,y0–4.9) · Shower room (x14.2–18,y0–4.9)
//   Stairs (x11.4–14.2,y4.9–9.2) · Cupboard (x14.2–18,y4.9–7.1) · Living room (x0–8,y7–14) · Sitting/dining room (x8–18,y7–14)
// Upstairs: Blue bedroom (x0–9.2,y0–6.1) · Airing cupboard (x9.2–12.4,y0–2.5) · Bathroom (x12.4–18,y0–6.05) · Landing (x9.2–12.4,y2.5–8.3)
//   Stairwell (x12.4–18,y6.05–8.3) · Nanny & Grandad's room (x0–9.2,y6.1–14) · Pink bedroom (x9.2–18,y8.3–14)
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, OAK, Tag, shade } = window.Iso;
const { useClock, Person, LOOKS } = window.NPC;

const BX = 18, BY = 14, RH = 4.2, LOW = 0.55;
const FRONT_DOOR = { x0: 10.6, x1: 12.4 };   // ground, back wall y=0 → Town map
const BACK_DOOR = { x0: 14.6, x1: 16.4 };    // ground, front wall y=14 → Nanny Garden
const WALLC = ['#fffaf0', '#ead8b8', '#e3d0ae'];
const tone = (c) => [shade(c, 0.15), c, shade(c, -0.15)];
const WALNUT = ['#9a6a42', '#7e5434', '#68452a'], MAHOG = ['#a35a3a', '#86462c', '#6f3a24'];
const CAB = ['#e6cf9e', '#d2b07a', '#bd9a64'], WORK = ['#f1ead8', '#dcd2bb', '#cfc4aa'];
const PAINT = ['#fbf8f2', '#ece6da', '#ddd5c6'], SAGE = '#7fa07a';
const LEATHER = ['#9a5a34', '#7e4626', '#683a1e'], ROSE = ['#e7b3ab', '#d49a92', '#bf857e'], VELVET = ['#8f3f45', '#773338', '#622a2e'];
const TXT = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 };
const ln = (a, b, stroke, w, key) => { const p = P(...a), q = P(...b); return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={w} strokeLinecap="round" />; };

// ---------- Shell ----------
function Slab() {
  return <g>
    <polygon points={pts([[0, BY, 0], [BX, BY, 0], [BX, BY, -0.35], [0, BY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[BX, 0, 0], [BX, BY, 0], [BX, BY, -0.35], [BX, 0, -0.35]])} fill="#5a3d26" />
  </g>;
}
function Shell({ segY, segX, children }) {
  return <g>
    {segY.map(([a, b, c]) => <polygon key={'y' + a} points={pts([[a, 0, 0], [b, 0, 0], [b, 0, RH], [a, 0, RH]])} fill={c} />)}
    {segX.map(([a, b, c]) => <polygon key={'x' + a} points={pts([[0, a, 0], [0, b, 0], [0, b, RH], [0, a, RH]])} fill={c} />)}
    {segY.slice(1).map(([a]) => ln([a, 0.01, 0], [a, 0.01, RH], 'rgba(120,90,60,.3)', 2, 'jy' + a))}
    {segX.slice(1).map(([a]) => ln([0.01, a, 0], [0.01, a, RH], 'rgba(120,90,60,.3)', 2, 'jx' + a))}
    {children}
    <polygon points={pts([[-0.2, -0.2, RH], [BX, -0.2, RH], [BX, 0, RH], [0, 0, RH], [0, BY, RH], [-0.2, BY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[BX, -0.2, RH], [BX, 0, RH], [BX, 0, -0.35], [BX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, BY, RH], [0, BY, RH], [0, BY, -0.35], [-0.2, BY, -0.35]])} fill="#cdb791" />
    <polygon points={pts([[0, 0.01, 0], [BX, 0.01, 0], [BX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, BY, 0], [0.01, BY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
  </g>;
}
// Flowery wallpaper on the x=0 wall between y0 and y1, with a dado rail.
function PaperX({ y0, y1, dot = '#d6a89a', leaf = '#9ab07a', low = '#d9c2a6', rail = '#c9a777' }) {
  const W = (y1 - y0) * 100, it = [];
  for (let i = 0; i < W / 50; i++) for (let j = 0; j < 6; j++) it.push(<g key={i + '-' + j} transform={`translate(${i * 50 + (j % 2) * 25 + 12} ${j * 50 + 22})`}><circle r={5} fill={dot} /><circle cx={-6} cy={6} r={3} fill={leaf} /></g>);
  return <FaceX x={0.012} y1={y1} z1={RH}>{it}<rect x={0} y={320} width={W} height={100} fill={low} /><rect x={0} y={314} width={W} height={8} fill={rail} /></FaceX>;
}
function LowWallY({ y, x0, x1, gaps = [], c = WALLC }) {
  const s = []; let a = x0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { s.push([a, g0]); a = g1; }); s.push([a, x1]);
  return <g>{s.filter(([p, q]) => q > p).map(([p, q]) => <Box key={p} x={p} y={y - 0.1} w={q - p} d={0.2} h={LOW} c={c} />)}</g>;
}
function LowWallX({ x, y0, y1, gaps = [], c = WALLC }) {
  const s = []; let a = y0; [...gaps].sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { s.push([a, g0]); a = g1; }); s.push([a, y1]);
  return <g>{s.filter(([p, q]) => q > p).map(([p, q]) => <Box key={p} x={x - 0.1} y={p} w={0.2} d={q - p} h={LOW} c={c} />)}</g>;
}

// ---------- Floors ----------
function Wood({ x, y, w, d, c = '#b98250', line = '#a46f42' }) {
  const rows = Math.round(d * 100 / 22), cols = Math.ceil(w * 100 / 160);
  return <FloorPlane x={x} y={y}><rect width={w * 100} height={d * 100} fill={c} />
    {Array.from({ length: rows }, (_, i) => <g key={i}><line x1={0} x2={w * 100} y1={i * 22} y2={i * 22} stroke={line} strokeWidth={2} />{Array.from({ length: cols }, (_, k) => <line key={k} x1={k * 160 + (i % 3) * 53} x2={k * 160 + (i % 3) * 53} y1={i * 22} y2={i * 22 + 22} stroke={line} strokeWidth={2} />)}</g>)}
  </FloorPlane>;
}
function Tiles({ x, y, w, d, a, b, s = 50 }) {
  const t = []; for (let i = 0; i < Math.ceil(w * 100 / s); i++) for (let j = 0; j < Math.ceil(d * 100 / s); j++) t.push(<rect key={i + '-' + j} x={i * s} y={j * s} width={Math.min(s, w * 100 - i * s)} height={Math.min(s, d * 100 - j * s)} fill={(i + j) % 2 ? a : b} />);
  return <FloorPlane z={0.002} x={x} y={y}>{t}</FloorPlane>;
}
const Carpet = ({ x, y, w, d, c }) => <FloorPlane z={0.002} x={x} y={y}><rect width={w * 100} height={d * 100} fill={c} /></FloorPlane>;
function Rug({ x, y, w, d, c = '#8a2f2f', b = '#e3c27a', mid = '#2f4f6a' }) {
  const W = w * 100, H = d * 100;
  return <FloorPlane z={0.006} x={x} y={y}><rect width={W} height={H} fill={c} /><rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={b} strokeWidth={7} /><rect x={36} y={36} width={W - 72} height={H - 72} fill={shade(c, 0.12)} /><ellipse cx={W / 2} cy={H / 2} rx={W * 0.24} ry={H * 0.22} fill={mid} /><ellipse cx={W / 2} cy={H / 2} rx={W * 0.12} ry={H * 0.11} fill={b} /></FloorPlane>;
}
function FluffyRug({ cx, cy, rx, ry }) {
  return <FloorPlane z={0.008}><g transform={`translate(${cx * 100} ${cy * 100})`}>
    {Array.from({ length: 44 }, (_, i) => { const a = i / 44 * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * rx * 100} cy={Math.sin(a) * ry * 100} r={13} fill="#f7f2e8" />; })}
    <ellipse rx={rx * 100} ry={ry * 100} fill="#f7f2e8" />
    {Array.from({ length: 70 }, (_, i) => { const a = Math.sin(i * 91.7) * 9999, b = Math.sin(i * 37.3) * 9999, u = (a - Math.floor(a)) * 2 - 1, v = (b - Math.floor(b)) * 2 - 1; return u * u + v * v > 0.8 ? null : <circle key={'d' + i} cx={u * rx * 100} cy={v * ry * 100} r={5} fill="#e9e1d0" />; })}
  </g></FloorPlane>;
}

// ---------- Generic furniture ----------
const DoorArt = ({ W, H, n = 2, knob = '#c9a54a' }) => <g>{Array.from({ length: n }, (_, i) => { const dw = W / n; return <g key={i}><rect x={i * dw + 5} y={7} width={dw - 10} height={H - 16} fill="none" stroke="rgba(60,30,10,.35)" strokeWidth={2} /><rect x={i * dw + 14} y={18} width={dw - 28} height={H - 38} fill="none" stroke="rgba(60,30,10,.18)" strokeWidth={2} /><circle cx={i % 2 ? i * dw + 12 : (i + 1) * dw - 12} cy={Math.min(H * 0.5, 40)} r={3.5} fill={knob} /></g>; })}</g>;
const DrawerArt = ({ W, H, n = 3 }) => <g>{Array.from({ length: n }, (_, i) => { const dh = H / n; return <g key={i}><rect x={6} y={i * dh + 5} width={W - 12} height={dh - 10} fill="none" stroke="rgba(60,30,10,.35)" strokeWidth={2} /><circle cx={W * 0.3} cy={i * dh + dh / 2} r={3.5} fill="#c9a54a" /><circle cx={W * 0.7} cy={i * dh + dh / 2} r={3.5} fill="#c9a54a" /></g>; })}</g>;
// Fronts on the visible face: face 'y' (+y side) or 'x' (+x side).
function Front({ x, y, w, d, z = 0, h, face = 'y', art = 'doors', n }) {
  const W = (face === 'y' ? w : d) * 100, H = h * 100, inner = art === 'doors' ? <DoorArt W={W} H={H} n={n ?? Math.max(1, Math.round(W / 60))} /> : <DrawerArt W={W} H={H} n={n ?? 3} />;
  return face === 'y' ? <FaceY y={y + d} x0={x} z1={z + h}>{inner}</FaceY> : <FaceX x={x + w} y1={y + d} z1={z + h}>{inner}</FaceX>;
}
function Cabinet({ x, y, w, d, z = 0, h, c = WALNUT, face = 'y', art = 'doors', n, top }) {
  return <g><Box x={x} y={y} z={z} w={w} d={d} h={h} c={c} />{top && <Box x={x - 0.04} y={y - 0.04} z={z + h} w={w + 0.08} d={d + 0.08} h={0.08} c={top} />}<Front x={x} y={y} w={w} d={d} z={z} h={h} face={face} art={art} n={n} /></g>;
}
function Lamp({ x, y, z = 0, h = 0.55, c = '#f2dfb0', s = 1 }) {
  const [bx, by] = P(x, y, z), [tx, ty] = P(x, y, z + h);
  return <g><ellipse cx={bx} cy={by} rx={9 * s} ry={4 * s} fill="#8a6a3a" /><line x1={bx} y1={by} x2={tx} y2={ty} stroke="#8a6a3a" strokeWidth={3} /><path d={`M${tx - 13 * s},${ty + 4 * s} L${tx - 7 * s},${ty - 16 * s} L${tx + 7 * s},${ty - 16 * s} L${tx + 13 * s},${ty + 4 * s} Z`} fill={c} stroke={shade(c, -0.2)} /><path d={`M${tx - 13 * s},${ty + 4 * s} L${tx + 13 * s},${ty + 4 * s}`} stroke={shade(c, -0.25)} strokeWidth={2} strokeDasharray="3 3" /></g>;
}
// Nick-nacks: 0 vase · 1 photo frame · 2 china dog · 3 candlestick · 4 jug · 5 flowers
function Knick({ at, k = 0 }) {
  const [x, y] = P(...at), c = ['#3f6e9a', '#c4433c', '#3f8a5a', '#7a4fd1', '#c9a54a', '#e85a7a'][(k * 7) % 6];
  switch (k % 6) {
    case 0: return <path d={`M${x - 6},${y} C${x - 13},${y - 12} ${x - 4},${y - 18} ${x - 4},${y - 26} L${x + 4},${y - 26} C${x + 4},${y - 18} ${x + 13},${y - 12} ${x + 6},${y} Z`} fill={c} stroke={shade(c, -0.25)} />;
    case 1: return <g><rect x={x - 9} y={y - 24} width={18} height={22} fill="#c9a54a" /><rect x={x - 6} y={y - 21} width={12} height={16} fill="#d7e3e6" /><circle cx={x} cy={y - 15} r={3} fill="#e9c6a8" /><rect x={x - 4} y={y - 11} width={8} height={6} fill="#7a9a6b" /></g>;
    case 2: return <g><ellipse cx={x} cy={y - 6} rx={8} ry={6} fill="#f4efe4" stroke="#c9c2b4" /><circle cx={x + 5} cy={y - 14} r={5} fill="#f4efe4" stroke="#c9c2b4" /><circle cx={x + 6} cy={y - 15} r={1.2} fill="#2a2a2c" /><ellipse cx={x + 2} cy={y - 16} rx={2} ry={3} fill="#c97a4a" /></g>;
    case 3: return <g><ellipse cx={x} cy={y - 2} rx={6} ry={2.5} fill="#c9a54a" /><rect x={x - 2} y={y - 26} width={4} height={24} fill="#c9a54a" /><rect x={x - 2.5} y={y - 36} width={5} height={10} fill="#fbf8f2" /><ellipse cx={x} cy={y - 39} rx={2} ry={3} fill="#f2a127" /></g>;
    case 4: return <g><ellipse cx={x} cy={y - 9} rx={10} ry={9} fill={c} /><path d={`M${x + 9},${y - 12} q8,-2 7,-9`} stroke={c} strokeWidth={3} fill="none" /><ellipse cx={x} cy={y - 18} rx={6} ry={2} fill={shade(c, -0.2)} /><path d={`M${x - 8},${y - 10} q10,5 16,0`} stroke="#fbf8f2" strokeWidth={2} fill="none" /></g>;
    default: return <g><path d={`M${x - 5},${y} L${x - 6},${y - 16} L${x + 6},${y - 16} L${x + 5},${y} Z`} fill="#fbf8f2" stroke="#c9c2b4" />{[[-8, -26, '#e85a7a'], [0, -32, '#f2c94c'], [8, -26, '#c4433c'], [-3, -22, '#f39ac6'], [4, -21, '#e85a7a']].map(([a, b, cc], i) => <g key={i}><line x1={x} y1={y - 16} x2={x + a} y2={y + b} stroke="#5f9a4a" strokeWidth={1.5} /><circle cx={x + a} cy={y + b} r={4.5} fill={cc} /></g>)}</g>;
  }
}
const Knicks = ({ list, k0 = 0 }) => <g>{list.map((at, i) => <Knick key={i} at={at} k={k0 + i} />)}</g>;
function Plant({ x, y, z = 0, s = 1 }) {
  const [px, py] = P(x + 0.18 * s, y + 0.18 * s, z + 0.35 * s);
  return <g><Box x={x} y={y} z={z} w={0.36 * s} d={0.36 * s} h={0.35 * s} c={['#c96a4a', '#b55a3e', '#9a4a3a']} />{Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={px + (i % 2 ? 1 : -1) * (6 + i * 2.5) * s} cy={py - (10 + i * 9) * s} rx={14 * s} ry={5 * s} transform={`rotate(${i % 2 ? 30 : -30} ${px + (i % 2 ? 1 : -1) * (6 + i * 2.5) * s} ${py - (10 + i * 9) * s})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}</g>;
}
// Wall picture. face 'y' → at = [x0, z1] on y=0 wall; face 'x' → at = [y1, z1] on x=0 wall.
function Pic({ face = 'y', at, w = 0.9, h = 0.7, art = 'land' }) {
  const W = w * 100, H = h * 100;
  const body = art === 'oval' ? <g><ellipse cx={W / 2} cy={H / 2} rx={W / 2} ry={H / 2} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><ellipse cx={W / 2} cy={H / 2} rx={W / 2 - 7} ry={H / 2 - 7} fill="#e8dcc0" /><circle cx={W / 2} cy={H * 0.4} r={W * 0.13} fill="#8a6a4a" /><path d={`M${W * 0.28},${H - 10} Q${W / 2},${H * 0.45} ${W * 0.72},${H - 10}Z`} fill="#6b5a48" /></g>
    : art === 'plates' ? <g>{[0, 1, 2].map(i => <g key={i}><circle cx={W / 6 + i * W / 3} cy={H / 2} r={Math.min(W / 7, H / 2.2)} fill="#fbf8f2" stroke="#c9c2b4" strokeWidth={2} /><circle cx={W / 6 + i * W / 3} cy={H / 2} r={Math.min(W / 7, H / 2.2) * 0.65} fill="none" stroke="#3f6e9a" strokeWidth={3} /><circle cx={W / 6 + i * W / 3} cy={H / 2} r={4} fill="#3f6e9a" /></g>)}</g>
    : art === 'flowers' ? <g><rect width={W} height={H} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><rect x={7} y={7} width={W - 14} height={H - 14} fill="#efe6d2" /><rect x={W / 2 - 9} y={H * 0.55} width={18} height={H * 0.3} fill="#3f6e9a" />{[[-16, 0.4, '#e85a7a'], [0, 0.28, '#f2c94c'], [16, 0.4, '#c4433c'], [-6, 0.48, '#f39ac6'], [8, 0.5, '#e98a3a']].map(([a, b, c], i) => <circle key={i} cx={W / 2 + a} cy={H * b} r={8} fill={c} />)}</g>
    : <g><rect width={W} height={H} fill="#c9a54a" stroke="#9a7a32" strokeWidth={2} /><rect x={7} y={7} width={W - 14} height={H - 14} fill="#bcd6e0" /><path d={`M7,${H - 7} L7,${H * 0.62} Q${W * 0.35},${H * 0.35} ${W * 0.6},${H * 0.62} T${W - 7},${H * 0.52} L${W - 7},${H - 7}Z`} fill="#7aa84e" /><circle cx={W * 0.74} cy={H * 0.3} r={6} fill="#f2c94c" /></g>;
  return face === 'y' ? <FaceY y={0.02} x0={at[0]} z1={at[1]}>{body}</FaceY> : <FaceX x={0.02} y1={at[0]} z1={at[1]}>{body}</FaceX>;
}
function WindowY({ x0, z1 = 3.0, w = 1.6, h = 1.2, curtain = '#d6a89a', frosted = false }) {
  const W = w * 100, H = h * 100;
  return <FaceY y={0.02} x0={x0} z1={z1}><rect x={-7} y={-7} width={W + 14} height={H + 14} fill="#fffaf2" stroke="#e0d1b6" /><rect width={W} height={H} fill={frosted ? '#e4eef0' : '#cfe3ea'} />{!frosted && <path d={`M0,${H} L0,${H * 0.6} Q${W * 0.4},${H * 0.4} ${W},${H * 0.55} L${W},${H} Z`} fill="#9cc47a" />}<line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#fffaf2" strokeWidth={5} /><line x1={0} x2={W} y1={H * 0.35} y2={H * 0.35} stroke="#fffaf2" strokeWidth={5} />
    {!frosted && <rect x={0} y={H * 0.55} width={W} height={H * 0.45} fill="#fbf8f2" opacity={0.65} />}
    <rect x={-22} y={-14} width={20} height={H + 20} fill={curtain} /><rect x={W + 2} y={-14} width={20} height={H + 20} fill={curtain} /><rect x={-26} y={-20} width={W + 52} height={7} fill="#c9a777" /><rect x={-10} y={H + 6} width={W + 20} height={8} fill="#fffaf2" /></FaceY>;
}

// ---------- Kitchen ----------
function RunY({ x0, x1, y = 0, d = 0.75 }) { return <g><Box x={x0} y={y} w={x1 - x0} d={d} h={0.85} c={CAB} /><Front x={x0} y={y} w={x1 - x0} d={d} h={0.85} /><Box x={x0} y={y} z={0.85} w={x1 - x0} d={d + 0.04} h={0.06} c={WORK} /></g>; }
function RunX({ y0, y1, x = 0, d = 0.75 }) { return <g><Box x={x} y={y0} w={d} d={y1 - y0} h={0.85} c={CAB} /><Front x={x} y={y0} w={d} d={y1 - y0} h={0.85} face="x" /><Box x={x} y={y0} z={0.85} w={d + 0.04} d={y1 - y0} h={0.06} c={WORK} /></g>; }
const UpperY = ({ x0, x1 }) => <Cabinet x={x0} y={0} z={2.05} w={x1 - x0} d={0.4} h={0.8} c={CAB} />;
const UpperX = ({ y0, y1 }) => <Cabinet x={0} y={y0} z={2.05} w={0.4} d={y1 - y0} h={0.8} c={CAB} face="x" />;
function Splash() {
  const grid = (W) => <g><rect width={W} height={64} fill="#f6f1e4" />{Array.from({ length: Math.ceil(W / 21) }, (_, i) => <line key={i} x1={i * 21} x2={i * 21} y1={0} y2={64} stroke="#ddd3bd" strokeWidth={1.5} />)}{[21, 42].map(y => <line key={y} x1={0} x2={W} y1={y} y2={y} stroke="#ddd3bd" strokeWidth={1.5} />)}{Array.from({ length: Math.ceil(W / 84) }, (_, i) => <circle key={'c' + i} cx={i * 84 + 31} cy={31} r={6} fill="#3f6e9a" opacity={0.6} />)}</g>;
  return <g><FaceY y={0.015} x0={0} z1={1.55}>{grid(800)}</FaceY><FaceX x={0.015} y1={6.3} z1={1.55}>{grid(630)}</FaceX></g>;
}
function Sink() {
  return <g><FloorPlane z={0.912} x={1.7} y={0.12}><rect width={130} height={50} rx={8} fill="#9aa1a6" /><rect x={6} y={6} width={58} height={38} rx={6} fill="#c9ced2" /><rect x={68} y={6} width={56} height={38} rx={6} fill="#c9ced2" /></FloorPlane>
    {ln([2.35, 0.08, 0.91], [2.35, 0.08, 1.22], '#aeb4b9', 4, 'a')}{ln([2.35, 0.08, 1.22], [2.35, 0.24, 1.18], '#aeb4b9', 4, 'b')}
    <Box x={3.15} y={0.12} z={0.91} w={0.45} d={0.4} h={0.05} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />{[0, 1, 2].map(i => <Box key={i} x={3.2 + i * 0.13} y={0.18} z={0.96} w={0.03} d={0.3} h={0.22} c={['#fbf8f2', '#e8e0cc', '#d6cdb6']} />)}</g>;
}
function Cooker({ y0 = 3.1, y1 = 4.3 }) {
  const d = y1 - y0, W = d * 100;
  return <g><Box x={0} y={y0} w={0.8} d={d} h={0.9} c={['#f4eee0', '#e6dcc6', '#d8ccb2']} />
    <FaceX x={0.8} y1={y1} z1={0.9}><rect x={8} y={6} width={W - 16} height={14} fill="#3a3a3c" />{[0, 1, 2, 3].map(i => <circle key={i} cx={20 + i * ((W - 40) / 3)} cy={13} r={4} fill="#c9ced2" />)}<rect x={14} y={30} width={W - 28} height={50} rx={4} fill="#2a2a2c" /><rect x={26} y={40} width={W - 52} height={30} fill="#5a4a40" /><rect x={30} y={26} width={W - 60} height={4} fill="#c9ced2" /></FaceX>
    <FloorPlane z={0.902} x={0} y={y0}>{[[24, 30], [24, 88], [58, 30], [58, 88]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={15} fill="#2a2a2c" stroke="#5b5f66" strokeWidth={3} />)}</FloorPlane>
    <Box x={0.1} y={y0 + 0.65} z={0.9} w={0.36} d={0.36} h={0.2} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    <Box x={0} y={y0 + 0.1} z={2.3} w={0.6} d={d - 0.2} h={0.4} c={['#e6e1d6', '#d6d0c4', '#c9c2b4']} />
  </g>;
}
function Fridge() {
  return <g><Box x={6.3} y={0} w={0.9} d={0.75} h={2.1} c={WHITE} />
    <FaceY y={0.75} x0={6.3} z1={2.1}><line x1={0} x2={90} y1={72} y2={72} stroke="#cfc8ba" strokeWidth={2} /><rect x={76} y={22} width={5} height={36} rx={2} fill="#bdb6a8" /><rect x={76} y={86} width={5} height={50} rx={2} fill="#bdb6a8" />
      <g transform="rotate(-4 30 100)"><rect x={12} y={88} width={34} height={28} fill="#fbf8f2" stroke="#ddd" /><circle cx={22} cy={98} r={5} fill="#f2c94c" /><path d="M14,112 q10,-10 30,-2" stroke="#5fbf6a" strokeWidth={3} fill="none" /></g>
      <g transform="rotate(5 50 140)"><rect x={34} y={128} width={30} height={26} fill="#fbf8f2" stroke="#ddd" /><path d="M40,150 l8,-16 l8,16" stroke="#e85a7a" strokeWidth={3} fill="none" /></g>
      {[[20, 30, '#e0524a'], [50, 40, '#3f7fc4'], [30, 160, '#5fbf6a']].map(([a, b, c], i) => <circle key={i} cx={a} cy={b} r={5} fill={c} />)}</FaceY>
    <Cabinet x={7.2} y={0} w={0.8} d={0.75} h={2.3} c={CAB} n={1} />
  </g>;
}
function KitchenTable() {
  return <g>
    <DChair x={3.55} y={2.55} back="n" c={WALNUT} />
    {[[3.1, 4.05], [4.55, 4.05]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.07} d={0.07} h={0.72} c={WALNUT} />)}
    <Box x={3.05} y={2.95} z={0.72} w={1.6} d={1.2} h={0.05} c={WALNUT} />
    <FloorPlane z={0.771} x={3.05} y={2.95}><rect width={160} height={120} fill="#fbf8f2" />{Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 20} y={0} width={10} height={120} fill="#e0524a" opacity={0.35} />)}{Array.from({ length: 6 }, (_, i) => <rect key={'r' + i} x={0} y={i * 20} width={160} height={10} fill="#e0524a" opacity={0.35} />)}</FloorPlane>
    <Knick at={[3.85, 3.5, 0.77]} k={4} /><Box x={3.35} y={3.35} z={0.77} w={0.14} d={0.14} h={0.12} c={['#fbf8f2', '#3f6e9a', '#336aa6']} /><Box x={4.25} y={3.5} z={0.77} w={0.14} d={0.14} h={0.12} c={['#fbf8f2', '#e85a7a', '#c4436a']} />
    <DChair x={3.55} y={4.25} back="s" c={WALNUT} />
  </g>;
}
function Caddies({ x, y, z = 0.91 }) {
  return <g>{['TEA', 'COFFEE', 'SUGAR'].map((t, i) => <g key={t}><Box x={x + i * 0.3} y={y} z={z} w={0.24} d={0.22} h={0.3} c={['#c9ced2', '#c4433c', '#a8383a']} /><FaceY y={y + 0.22} x0={x + i * 0.3} z1={z + 0.24}><text x={12} y={10} textAnchor="middle" fontSize={7} fill="#fbf8f2" {...TXT}>{t}</text></FaceY></g>)}</g>;
}

// ---------- Hall ----------
function FrontDoor() {
  return <g>
    <FloorPlane z={0.01} x={FRONT_DOOR.x0 + 0.2} y={0.12}><rect width={140} height={50} rx={5} fill="#8a6a3a" /><text x={70} y={33} textAnchor="middle" fontSize={20} fill="#f2dfb0" {...TXT}>WELCOME</text></FloorPlane>
    <FaceY y={0.02} x0={FRONT_DOOR.x0} z1={2.75}>
      <rect x={-12} y={-12} width={204} height={287} fill="#fffaf2" stroke="#e0d1b6" />
      <rect x={0} y={0} width={180} height={275} fill="#3f5a4a" />
      <path d="M10,48 A80,40 0 0 1 170,48 Z" fill="#f2e4b8" />{[30, 60, 90, 120, 150].map((a, i) => <line key={i} x1={90} y1={48} x2={a} y2={16} stroke="#3f5a4a" strokeWidth={3} />)}
      <rect x={22} y={56} width={136} height={219} fill="#4a6a52" stroke="#2f4a3a" strokeWidth={2} />
      <rect x={45} y={72} width={90} height={70} fill="#f2c94c" />{[[45, 72, '#c4433c'], [90, 72, '#3f6e9a'], [45, 107, '#3f6e9a'], [90, 107, '#c4433c']].map(([a, b, c], i) => <rect key={i} x={a + 4} y={b + 4} width={37} height={27} fill={c} opacity={0.75} />)}
      <rect x={45} y={160} width={90} height={90} fill="none" stroke="#2f4a3a" strokeWidth={2} />
      <rect x={68} y={168} width={44} height={8} rx={2} fill="#c9a54a" /><circle cx={140} cy={180} r={6} fill="#c9a54a" /><circle cx={90} cy={60} r={0} />
    </FaceY>
  </g>;
}
function GrandfatherClock({ x, T }) {
  return <g><Box x={x} y={0.05} w={0.55} d={0.45} h={2.0} c={MAHOG} /><Box x={x - 0.05} y={0.03} z={2.0} w={0.65} d={0.5} h={0.55} c={MAHOG} /><Box x={x - 0.08} y={0.01} z={2.55} w={0.71} d={0.54} h={0.1} c={MAHOG} />
    <FaceY y={0.53} x0={x - 0.05} z1={2.55}><circle cx={32} cy={27} r={22} fill="#f4ecd8" stroke="#c9a54a" strokeWidth={3} />{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={32 + Math.cos(i * Math.PI / 6) * 17} cy={27 + Math.sin(i * Math.PI / 6) * 17} r={1.4} fill="#2a2a2c" />)}<line x1={32} y1={27} x2={32} y2={13} stroke="#2a2a2c" strokeWidth={2.5} /><line x1={32} y1={27} x2={43} y2={31} stroke="#2a2a2c" strokeWidth={2.5} /></FaceY>
    <FaceY y={0.5} x0={x} z1={1.9}><rect x={12} y={10} width={31} height={120} fill="#3a2418" /><g transform={`rotate(${Math.sin(T * 3) * 12} 27.5 12)`}><line x1={27.5} y1={12} x2={27.5} y2={100} stroke="#c9a54a" strokeWidth={2} /><circle cx={27.5} cy={104} r={10} fill="#c9a54a" /></g></FaceY></g>;
}
function PhoneTable() {
  return <g><Box x={12.85} y={0.08} w={1.15} d={0.5} h={0.75} c={PAINT} /><Front x={12.85} y={0.08} w={1.15} d={0.5} h={0.25} z={0.5} art="drawers" n={1} />
    <Box x={13.0} y={0.2} z={0.75} w={0.32} d={0.24} h={0.1} c={['#c4433c', '#a8383a', '#8f2f30']} /><Box x={13.02} y={0.24} z={0.85} w={0.28} d={0.08} h={0.06} c={['#c4433c', '#a8383a', '#8f2f30']} />
    <Lamp x={13.75} y={0.3} z={0.75} /></g>;
}
function Sideboard() {
  return <g><Box x={8.12} y={0.6} w={0.6} d={2.3} h={0.9} c={PAINT} /><FaceX x={8.72} y1={2.9} z1={0.9}><DrawerArt W={230} H={26} n={1} /><g transform="translate(0 28)"><DoorArt W={230} H={62} n={3} /></g></FaceX>
    <FloorPlane z={0.901} x={8.12} y={0.6}><rect x={8} y={20} width={44} height={190} fill="#fbf8f2" opacity={0.85} /></FloorPlane>
    <Knicks list={[[8.42, 0.85, 0.9], [8.42, 1.25, 0.9], [8.42, 1.65, 0.9], [8.42, 2.05, 0.9], [8.42, 2.45, 0.9], [8.42, 2.75, 0.9]]} k0={0} /></g>;
}

// ---------- Shower room ----------
function Toilet({ x }) {
  return <g><Box x={x} y={0.02} w={0.55} d={0.25} h={0.95} c={WHITE} /><Box x={x + 0.04} y={0.27} w={0.47} d={0.5} h={0.42} c={WHITE} /><FloorPlane z={0.421} x={x + 0.04} y={0.27}><ellipse cx={23.5} cy={27} rx={21} ry={22} fill="#fbf8f2" stroke="#ddd6c9" strokeWidth={3} /></FloorPlane><Box x={x + 0.38} y={0.06} z={0.95} w={0.08} d={0.1} h={0.03} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} /></g>;
}
function PedestalSink({ x, y = 0.02 }) {
  return <g><Box x={x + 0.18} y={y + 0.1} w={0.24} d={0.24} h={0.75} c={WHITE} /><Box x={x} y={y} z={0.75} w={0.6} d={0.48} h={0.15} c={WHITE} /><FloorPlane z={0.901} x={x + 0.08} y={y + 0.1}><ellipse cx={22} cy={16} rx={18} ry={12} fill="#d4e4ea" /></FloorPlane>{ln([x + 0.3, y + 0.04, 0.9], [x + 0.3, y + 0.04, 1.08], '#aeb4b9', 3, 't')}
    <FaceY y={0.02} x0={x} z1={2.3}><rect width={60} height={70} rx={6} fill="#c9a54a" /><rect x={5} y={5} width={50} height={60} rx={4} fill="#d7e6ea" /><path d="M14,14 L26,50" stroke="#fff" strokeWidth={3} opacity={0.7} /></FaceY></g>;
}
function Shower() {
  const x0 = 16.6;
  return <g><Box x={x0} y={0} w={BX - x0} d={1.4} h={0.1} c={WHITE} />
    {ln([17.3, 0.03, 2.5], [17.3, 0.3, 2.45], '#aeb4b9', 4, 'h')}<ellipse cx={P(17.3, 0.3, 2.4)[0]} cy={P(17.3, 0.3, 2.4)[1]} rx={10} ry={4} fill="#aeb4b9" />
    <polygon points={pts([[x0, 0, 0.1], [x0, 1.4, 0.1], [x0, 1.4, 2.3], [x0, 0, 2.3]])} fill="#d4ecf0" fillOpacity={0.3} stroke="#a9c4c9" />
    <polygon points={pts([[x0, 1.4, 0.1], [BX, 1.4, 0.1], [BX, 1.4, 2.3], [x0, 1.4, 2.3]])} fill="#d4ecf0" fillOpacity={0.3} stroke="#a9c4c9" />
  </g>;
}

// ---------- Stairs (ground) ----------
function StairsUp({ onClick }) {
  const x0 = 11.4, x1 = 14.2, y0 = 4.9, y1 = 9.2, n = 8, dy = (y1 - y0) / n, sh = 0.26;
  return <g onClick={onClick} style={{ cursor: 'pointer' }}>
    {Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0} y={y0 + i * dy} w={x1 - x0} d={dy} h={(i + 1) * sh} c={['#c38c58', '#a8764a', '#8f633d']} /><FloorPlane z={(i + 1) * sh + 0.002} x={x0 + 0.5} y={y0 + i * dy}><rect width={(x1 - x0 - 1.0) * 100} height={dy * 100} fill="#9a3a34" /><rect x={0} y={dy * 100 - 6} width={(x1 - x0 - 1.0) * 100} height={4} fill="#c9a54a" /></FloorPlane></g>)}
    <Box x={x0 - 0.05} y={y0 - 0.1} w={0.16} d={0.16} h={1.2} c={MAHOG} />
    {Array.from({ length: n }, (_, i) => ln([x0 + 0.03, y0 + (i + 0.5) * dy, (i + 1) * sh], [x0 + 0.03, y0 + (i + 0.5) * dy, (i + 1) * sh + 0.9], '#fffaf2', 4, 'p' + i))}
    {ln([x0 + 0.03, y0 - 0.02, 1.2], [x0 + 0.03, y1, n * sh + 0.95], '#86462c', 7, 'rail')}
  </g>;
}
function UnderStairs() {
  return <g><Box x={14.5} y={5.2} w={0.7} d={0.6} h={0.5} c={['#d8b484', '#c49c69', '#b08757']} /><Box x={14.55} y={5.25} z={0.5} w={0.55} d={0.5} h={0.4} c={['#d8b484', '#c49c69', '#b08757']} />
    <Box x={15.7} y={5.3} w={0.45} d={0.4} h={0.35} c={['#e0524a', '#c4433c', '#ab3832']} />{ln([15.9, 5.5, 0.35], [15.9, 5.4, 1.4], '#5b5f66', 4, 'hv')}
    <Box x={16.6} y={5.2} w={0.25} d={0.5} h={0.4} c={['#3f8a5a', '#336f4a', '#2a5c3d']} /><Box x={16.9} y={5.2} w={0.25} d={0.5} h={0.4} c={['#3f8a5a', '#336f4a', '#2a5c3d']} />
    <Box x={17.3} y={5.0} w={0.5} d={1.8} h={0.05} c={['#9fb4c9', '#8aa0b6', '#7a90a6']} /></g>;
}

// ---------- Living room ----------
function Bookshelf() {
  const c = ['#8f3f45', '#3f6e9a', '#3f8a5a', '#c9a54a', '#6b4a2e', '#e3d3ae', '#5b5f66'];
  return <g><Box x={0} y={7.2} w={0.55} d={2.1} h={2.0} c={PAINT} />
    <FaceX x={0.55} y1={9.3} z1={2.0}>{[0, 1, 2, 3].map(r => <g key={r}><rect x={6} y={6 + r * 48} width={198} height={42} fill="#4a3220" />{Array.from({ length: 16 }, (_, k) => r === 1 && k > 10 ? null : <rect key={k} x={9 + k * 12} y={12 + r * 48 + (k * 5 % 4)} width={10} height={36 - (k * 5 % 4)} fill={c[(k + r * 2) % 7]} />)}{r === 1 && <g><ellipse cx={168} cy={44} rx={14} ry={10} fill="#f4efe4" /><circle cx={176} cy={34} r={7} fill="#f4efe4" /></g>}</g>)}</FaceX>
    <Knicks list={[[0.28, 7.6, 2.0], [0.28, 8.3, 2.0], [0.28, 8.95, 2.0]]} k0={3} /></g>;
}
function TV() {
  return <g><Cabinet x={0} y={9.9} w={0.6} d={2.0} h={0.55} face="x" n={3} c={PAINT} />
    <Box x={0.12} y={10.85} z={0.55} w={0.18} d={0.15} h={0.08} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <Box x={0.08} y={10.1} z={0.63} w={0.12} d={1.6} h={0.95} c={['#2a2a2c', '#1d1d1f', '#121214']} />
    <FaceX x={0.205} y1={11.65} z1={1.53}><rect x={0} y={0} width={150} height={85} fill="#6fa0c8" /><path d="M0,85 L0,52 Q50,30 90,50 T150,44 L150,85 Z" fill="#6b9a44" /><circle cx={112} cy={22} r={9} fill="#f2e3b0" /><path d="M30,48 l6,-12 l6,12z M44,46 l5,-10 l5,10z" fill="#3f6e4a" /></FaceX>
    <Knicks list={[[0.3, 10.0, 0.55], [0.3, 11.8, 0.55]]} k0={5} /></g>;
}
function LeatherSofa({ T, sitter }) {
  const x0 = 2.6, x1 = 7.4, y0 = 7.3, y1 = 9.2;
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.45} c={LEATHER} /><Box x={x0} y={y0} z={0.45} w={x1 - x0} d={0.5} h={0.6} c={LEATHER} />
    <Box x={x0} y={y0} z={0.45} w={0.4} d={y1 - y0} h={0.32} c={LEATHER} />
    {[0, 1, 2].map(i => <Box key={i} x={x0 + 0.42 + i * 1.32} y={y0 + 0.5} z={0.45} w={1.28} d={y1 - y0 - 0.55} h={0.12} c={['#a8663e', '#8a522e', '#744425']} />)}
    <FaceY y={y0 + 0.5} x0={x0 + 0.4} z1={1.05}>{Array.from({ length: 20 }, (_, i) => <circle key={i} cx={10 + i * 20} cy={14 + (i % 2) * 16} r={2.2} fill="#5e321a" />)}</FaceY>
    <Box x={x0 + 0.5} y={y0 + 0.5} z={0.57} w={0.45} d={0.15} h={0.42} c={['#f2c94c', '#d9b03a', '#c09a2c']} />
    {sitter}
    <Box x={x1 - 0.4} y={y0} z={0.45} w={0.4} d={y1 - y0} h={0.32} c={LEATHER} />
  </g>;
}
function BigArmchair() {
  const x0 = 4.4, x1 = 7.2, y0 = 12.1, y1 = 13.7;
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.45} c={VELVET} /><Box x={x0 + 0.45} y={y0} z={0.45} w={x1 - x0 - 0.9} d={y1 - y0 - 0.5} h={0.14} c={['#a14a50', '#8a3f45', '#733539']} />
    <Box x={x0} y={y0} z={0.45} w={0.45} d={y1 - y0} h={0.4} c={VELVET} /><Box x={x1 - 0.45} y={y0} z={0.45} w={0.45} d={y1 - y0} h={0.4} c={VELVET} />
    <Box x={x0} y={y1 - 0.5} z={0.45} w={x1 - x0} d={0.5} h={0.75} c={VELVET} />
    <FloorPlane z={1.201} x={x0 + 0.6} y={y1 - 0.5}><rect width={(x1 - x0 - 1.2) * 100} height={50} fill="#fbf8f2" opacity={0.9} />{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={i * 14 + 7} cy={50} r={6} fill="#fbf8f2" />)}</FloorPlane></g>;
}
function Windowsill() {
  return <g><Box x={1.3} y={BY - 0.22} z={LOW} w={6.4} d={0.3} h={0.05} c={WHITE} /><Plant x={1.6} y={BY - 0.18} z={0.6} s={0.7} /><Knick at={[3.4, BY - 0.07, 0.6]} k={2} /><Knick at={[4.6, BY - 0.07, 0.6]} k={5} /><Plant x={6.6} y={BY - 0.18} z={0.6} s={0.7} /></g>;
}

// ---------- Sitting / dining room ----------
function DChair({ x, y, back = 'n', c = PAINT }) {
  return <g>{back === 'n' && <Box x={x} y={y} z={0.42} w={0.5} d={0.06} h={0.6} c={c} />}<Box x={x} y={y + 0.44} w={0.06} d={0.06} h={0.42} c={c} /><Box x={x + 0.44} y={y + 0.44} w={0.06} d={0.06} h={0.42} c={c} /><Box x={x} y={y} z={0.42} w={0.5} d={0.5} h={0.06} c={['#9fbe96', SAGE, '#6a8c66']} />{back === 's' && <Box x={x} y={y + 0.44} z={0.42} w={0.5} d={0.06} h={0.6} c={c} />}</g>;
}
function DiningTable() {
  const x = 9.2, y = 11.4, w = 3.7, d = 1.7;
  return <g>
    {[9.7, 10.85, 12.0].map(a => <DChair key={a} x={a} y={y - 0.42} back="n" />)}
    {[[x + 0.1, y + d - 0.18], [x + w - 0.18, y + d - 0.18]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.08} d={0.08} h={0.72} c={PAINT} />)}
    <Box x={x} y={y} z={0.72} w={w} d={d} h={0.07} c={PAINT} />
    <FloorPlane z={0.791} x={x + 0.4} y={y + 0.5}><rect width={290} height={70} fill="#b9cfa8" />{Array.from({ length: 15 }, (_, i) => <g key={i}><circle cx={i * 20 + 10} cy={0} r={7} fill="#b9cfa8" /><circle cx={i * 20 + 10} cy={70} r={7} fill="#b9cfa8" /><circle cx={i * 20 + 10} cy={35} r={4} fill="none" stroke="#e3d9c6" strokeWidth={2} /></g>)}</FloorPlane>
    <Knick at={[10.2, y + 0.85, 0.79]} k={3} /><Knick at={[12.0, y + 0.85, 0.79]} k={3} />
    <FloorPlane z={0.795} x={10.75} y={y + 0.55}><ellipse cx={30} cy={30} rx={30} ry={28} fill="#e3d3ae" /><circle cx={20} cy={24} r={11} fill="#e0524a" /><circle cx={38} cy={28} r={11} fill="#f2a127" /><circle cx={28} cy={40} r={10} fill="#86b55a" /></FloorPlane>
    {[9.7, 10.85, 12.0].map(a => <DChair key={'s' + a} x={a} y={y + d - 0.08} back="s" />)}
  </g>;
}
function ChintzSofa({ x0, x1, y0, y1 }) {
  return <g><Box x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={0.42} c={ROSE} /><Box x={x0} y={y0} z={0.42} w={x1 - x0} d={0.42} h={0.55} c={ROSE} /><Box x={x0} y={y0} z={0.42} w={0.32} d={y1 - y0} h={0.3} c={ROSE} />
    {Array.from({ length: Math.round((x1 - x0 - 0.64) / 0.85) }, (_, i) => { const cw = (x1 - x0 - 0.64) / Math.round((x1 - x0 - 0.64) / 0.85); return <Box key={i} x={x0 + 0.32 + i * cw} y={y0 + 0.42} z={0.42} w={cw - 0.04} d={y1 - y0 - 0.45} h={0.12} c={['#efc3bb', '#dca8a0', '#c8958d']} />; })}
    <FaceY y={y1} x0={x0} z1={0.42}>{Array.from({ length: Math.floor((x1 - x0) * 100 / 22) }, (_, i) => <circle key={i} cx={11 + i * 22} cy={14 + (i % 2) * 14} r={4} fill={i % 3 ? '#b95a6a' : '#7a9a6b'} />)}</FaceY>
    <Box x={x1 - 0.32} y={y0} z={0.42} w={0.32} d={y1 - y0} h={0.3} c={ROSE} /></g>;
}
function Armchair({ x, y }) {
  return <g><Box x={x} y={y} w={1.2} d={1.15} h={0.42} c={ROSE} /><Box x={x} y={y} z={0.42} w={1.2} d={0.38} h={0.6} c={ROSE} /><Box x={x} y={y} z={0.42} w={0.25} d={1.15} h={0.28} c={ROSE} /><Box x={x + 0.25} y={y + 0.38} z={0.42} w={0.7} d={0.77} h={0.1} c={['#efc3bb', '#dca8a0', '#c8958d']} /><Box x={x + 0.95} y={y} z={0.42} w={0.25} d={1.15} h={0.28} c={ROSE} /><FloorPlane z={1.021} x={x + 0.2} y={y}><rect width={80} height={38} fill="#fbf8f2" opacity={0.9} /></FloorPlane></g>;
}

// ---------- Upstairs ----------
function BedX({ y0, wid, len, duvet, frame = WALNUT, pillows = 1 }) {
  return <g><Box x={0} y={y0} w={0.15} d={wid} h={1.3} c={frame} /><Box x={0.15} y={y0} w={len} d={wid} h={0.35} c={frame} /><Box x={0.15} y={y0 + 0.03} z={0.35} w={len - 0.05} d={wid - 0.06} h={0.18} c={WHITE} />
    {Array.from({ length: pillows }, (_, i) => { const pw = (wid - 0.2) / pillows; return <Box key={i} x={0.25} y={y0 + 0.1 + i * pw} z={0.53} w={0.5} d={pw - 0.06} h={0.14} c={WHITE} />; })}
    <Box x={0.85} y={y0 - 0.04} z={0.2} w={len - 0.65} d={wid + 0.08} h={0.42} c={tone(duvet)} />
    <FloorPlane z={0.621} x={0.85} y={y0 - 0.04}>{Array.from({ length: Math.floor((len - 0.65) * 100 / 40) }, (_, i) => Array.from({ length: Math.floor((wid + 0.08) * 100 / 40) }, (_, j) => <circle key={i + '-' + j} cx={20 + i * 40} cy={20 + j * 40} r={7} fill={shade(duvet, (i + j) % 2 ? 0.3 : -0.12)} />))}</FloorPlane>
    <Box x={len + 0.1} y={y0} w={0.1} d={wid} h={0.6} c={frame} /></g>;
}
function BedY({ x0, y0, wid, len, duvet, frame = WHITE }) {
  return <g><Box x={x0} y={y0} w={wid} d={0.15} h={1.2} c={frame} /><Box x={x0} y={y0 + 0.15} w={wid} d={len} h={0.35} c={frame} /><Box x={x0 + 0.03} y={y0 + 0.15} z={0.35} w={wid - 0.06} d={len - 0.05} h={0.18} c={WHITE} /><Box x={x0 + 0.12} y={y0 + 0.25} z={0.53} w={wid - 0.24} d={0.45} h={0.14} c={WHITE} />
    <Box x={x0 - 0.04} y={y0 + 0.85} z={0.2} w={wid + 0.08} d={len - 0.65} h={0.42} c={tone(duvet)} />
    <FloorPlane z={0.621} x={x0 - 0.04} y={y0 + 0.85}>{Array.from({ length: 4 }, (_, i) => <circle key={i} cx={30 + (i % 2) * 70} cy={40 + i * 40} r={10} fill="#fbf8f2" opacity={0.7} />)}</FloorPlane>
    <Teddy at={[x0 + wid * 0.6, y0 + 0.5, 0.67]} c="#c99a5c" />
    <Box x={x0} y={y0 + 0.15 + len} w={wid} d={0.08} h={0.55} c={frame} /></g>;
}
function Teddy({ at, c = '#b08757' }) { const [x, y] = P(...at); return <g><ellipse cx={x} cy={y - 10} rx={10} ry={11} fill={c} /><circle cx={x} cy={y - 26} r={8} fill={c} /><circle cx={x - 6} cy={y - 32} r={3.5} fill={c} /><circle cx={x + 6} cy={y - 32} r={3.5} fill={c} /><circle cx={x} cy={y - 23} r={3} fill={shade(c, 0.3)} /><circle cx={x - 3} cy={y - 27} r={1.2} fill="#2a2a2c" /><circle cx={x + 3} cy={y - 27} r={1.2} fill="#2a2a2c" /></g>; }
function Cylinder({ x, y, r = 0.5, h = 1.8 }) {
  const [bx, by] = P(x, y, 0), [, ty] = P(x, y, h), rx = r * 88 * 1.22, ry = rx / 2;
  return <g><path d={`M${bx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${ty} Z`} fill="#c97a4a" />{[0.3, 0.55, 0.8].map(t => <path key={t} d={`M${bx - rx},${ty + (by - ty) * t} A${rx},${ry} 0 0 0 ${bx + rx},${ty + (by - ty) * t}`} fill="none" stroke="#a8603a" strokeWidth={2} />)}<ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill="#e09a62" /><rect x={bx - 4} y={ty - 40} width={8} height={40} fill="#c97a4a" /><rect x={bx - rx * 0.5} y={ty + (by - ty) * 0.4} width={rx} height={14} fill="#c4433c" opacity={0.0} /></g>;
}
function Towels({ x, y, z }) { const c = ['#f39ac6', '#fbf8f2', '#9fd3c7', '#f2c94c', '#bcdcea']; return <g>{c.map((cc, i) => <Box key={i} x={x} y={y} z={z + i * 0.07} w={0.5} d={0.4} h={0.07} c={tone(cc)} />)}</g>; }
function Bath() {
  return <g><Box x={12.6} y={0.02} w={3.9} d={1.15} h={0.7} c={WHITE} /><FaceY y={1.17} x0={12.6} z1={0.7}>{[0, 1, 2, 3].map(i => <rect key={i} x={10 + i * 95} y={10} width={85} height={50} rx={4} fill="none" stroke="#ddd6c9" strokeWidth={2} />)}</FaceY>
    <FloorPlane z={0.702} x={12.7} y={0.12}><rect width={370} height={95} rx={40} fill="#e9e4da" /><rect x={10} y={10} width={350} height={75} rx={34} fill="#bfe0ea" /><circle cx={60} cy={30} r={8} fill="#fbf8f2" opacity={0.8} /><circle cx={80} cy={50} r={6} fill="#fbf8f2" opacity={0.8} /></FloorPlane>
    {[12.85, 13.05].map(a => ln([a, 0.06, 0.7], [a, 0.06, 0.92], '#c9a54a', 4, 'tp' + a))}
    {(() => { const [x, y] = P(14.6, 0.6, 0.72); return <g><ellipse cx={x} cy={y - 6} rx={10} ry={7} fill="#f2c94c" /><circle cx={x + 6} cy={y - 14} r={6} fill="#f2c94c" /><path d={`M${x + 11},${y - 14} l6,2 l-6,2z`} fill="#e98a3a" /></g>; })()}</g>;
}
function ToiletX({ y }) {
  return <g><Box x={12.42} y={y} w={0.25} d={0.55} h={0.95} c={WHITE} /><Box x={12.67} y={y + 0.04} w={0.5} d={0.47} h={0.42} c={WHITE} /><FloorPlane z={0.421} x={12.67} y={y + 0.04}><ellipse cx={27} cy={23.5} rx={22} ry={21} fill="#fbf8f2" stroke="#ddd6c9" strokeWidth={3} /></FloorPlane></g>;
}
function DollsHouse({ x, y }) {
  const [a] = [0];
  return <g><Box x={x} y={y} w={1.1} d={0.55} h={0.9} c={['#f7d6e0', '#f39ac6', '#e07fae']} />
    <polygon points={pts([[x, y + 0.55, 0.9], [x + 1.1, y + 0.55, 0.9], [x + 0.55, y + 0.55, 1.35]])} fill="#e0524a" />
    <polygon points={pts([[x + 1.1, y, 0.9], [x + 1.1, y + 0.55, 0.9], [x + 0.55, y + 0.55, 1.35], [x + 0.55, y, 1.35]])} fill="#c4433c" />
    <FaceY y={y + 0.55} x0={x} z1={0.9}>{[[12, 10], [70, 10], [12, 50]].map(([p, q], i) => <rect key={i} x={p} y={q} width={26} height={22} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={3} />)}<rect x={72} y={48} width={22} height={42} fill="#3f6e9a" /></FaceY></g>;
}
function Stairwell({ onClick }) {
  const x0 = 12.4, x1 = BX, y0 = 6.05, y1 = 8.3, n = 9, dx = (x1 - x0) / n, sh = 0.42;
  return <g onClick={onClick} style={{ cursor: 'pointer' }}>
    <clipPath id="nanny-well"><polygon points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} /></clipPath>
    <g clipPath="url(#nanny-well)"><polygon points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} fill="#3a2a1f" />
      {Array.from({ length: n }, (_, i) => <g key={i}><Box x={x0 + i * dx} y={y0} z={-(i + 1) * sh} w={dx} d={y1 - y0} h={0.02} c={['#c38c58', '#a8764a', '#8f633d']} /><FloorPlane z={-(i + 1) * sh + 0.025} x={x0 + i * dx} y={y0 + 0.5}><rect width={dx * 100} height={(y1 - y0 - 1.0) * 100} fill={shade('#9a3a34', -i * 0.06)} /></FloorPlane><polygon points={pts([[x0 + (i + 1) * dx, y0, -(i + 1) * sh], [x0 + (i + 1) * dx, y1, -(i + 1) * sh], [x0 + (i + 1) * dx, y1, -(i + 2) * sh], [x0 + (i + 1) * dx, y0, -(i + 2) * sh]])} fill={shade('#c38c58', -0.15 - i * 0.05)} /></g>)}
    </g>
  </g>;
}

// ---------- Scrolling stage ----------
function ScrollStage({ zoom, label, children }) {
  const ref = React.useRef(null), drag = React.useRef(null);
  const VB = { x: -320, y: -60, w: 2760, h: 1990 };
  React.useEffect(() => { const el = ref.current; if (!el) return; const [fx, fy] = P(9, 7, 0); el.scrollLeft = Math.max(0, (fx - VB.x) * zoom - el.clientWidth / 2); el.scrollTop = Math.max(0, (fy - VB.y) * zoom - el.clientHeight / 2); }, [zoom]);
  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, l: ref.current.scrollLeft, t: ref.current.scrollTop, moved: false }; };
  const move = (e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; ref.current.scrollLeft = d.l - dx; ref.current.scrollTop = d.t - dy; };
  const up = () => { setTimeout(() => { drag.current = null; }, 0); };
  const click = (e) => { if (drag.current && drag.current.moved) { e.preventDefault(); e.stopPropagation(); } };
  return <div ref={ref} data-screen-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClickCapture={click}
    style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#efe2d0', cursor: 'grab', userSelect: 'none' }}>
    <svg width={VB.w * zoom} height={VB.h * zoom} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{ display: 'block' }}>{children}</svg>
  </div>;
}
const ClickTag = ({ at, text, onClick }) => <g onClick={onClick} style={{ cursor: 'pointer' }}><Tag show={true} at={at} text={text} /></g>;

// ---------- Ground floor ----------
function Downstairs({ T, L, zoom, goUp }) {
  const adult = (at, look, p = {}) => <Person at={at} s={1.02} look={look} T={T} ph={at[0]} {...p} />;
  return <ScrollStage zoom={zoom} label="Nanny & Grandad's — downstairs">
    <Slab />
    <Wood x={0} y={0} w={BX} d={BY} />
    <Tiles x={0} y={0} w={8} d={7} a="#efe6cf" b="#c9714f" />
    <Tiles x={14.2} y={0} w={BX - 14.2} d={4.9} a="#eef4f5" b="#cfe2e6" s={30} />
    <FloorPlane z={0.006} x={10.8} y={0.65}><rect width={140} height={400} fill="#8a2f2f" /><rect x={9} y={9} width={122} height={382} fill="none" stroke="#e3c27a" strokeWidth={5} />{[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M70,${40 + i * 64} l24,20 l-24,20 l-24,-20z`} fill="#2f4f6a" />)}</FloorPlane>
    <Rug x={8.7} y={10.7} w={4.7} d={3.0} />
    <FluffyRug cx={5.2} cy={10.55} rx={1.9} ry={1.0} />
    <Shell segY={[[0, 8, '#f2e8cf'], [8, 14.2, '#f5eedb'], [14.2, BX, '#e4eef0']]} segX={[[0, 7, '#efe2c6'], [7, BY, '#f5eedb']]}>
      <PaperX y0={7} y1={BY} dot="#a9c49a" leaf="#7fa07a" low="#b9cfa8" rail="#6f9a6a" />
      <polygon points={pts([[8, 0.012, 1.0], [14.2, 0.012, 1.0], [14.2, 0.012, 0.18], [8, 0.012, 0.18]])} fill="#b9cfa8" />{ln([8, 0.013, 1.02], [14.2, 0.013, 1.02], '#6f9a6a', 5, 'hd')}
      <Splash />
      <WindowY x0={1.55} z1={2.95} w={1.55} h={1.15} curtain="#e0a07a" />
      <FaceX x={0.02} y1={7.0} z1={3.4}><circle cx={40} cy={30} r={26} fill="#fbf8f2" stroke="#c4433c" strokeWidth={5} /><line x1={40} y1={30} x2={40} y2={14} stroke="#2a2a2c" strokeWidth={3} /><line x1={40} y1={30} x2={52} y2={34} stroke="#2a2a2c" strokeWidth={3} /></FaceX>
      <Pic at={[8.4, 3.5]} w={1.2} h={0.4} art="plates" />
      <Pic at={[9.3, 2.9]} w={0.55} h={0.7} art="oval" />
      <Pic at={[12.9, 2.9]} w={0.9} h={0.65} />
      <FaceY y={0.02} x0={14.2} z1={1.5}><rect width={380} height={150} fill="#cfe2e6" />{Array.from({ length: 19 }, (_, i) => <line key={i} x1={i * 20} x2={i * 20} y1={0} y2={150} stroke="#fbf8f2" strokeWidth={1.5} />)}{Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1={0} x2={380} y1={i * 21} y2={i * 21} stroke="#fbf8f2" strokeWidth={1.5} />)}</FaceY>
      <FrontDoor />
      <Pic face="x" at={[11.9, 3.3]} w={2.0} h={0.75} />
      <Pic face="x" at={[9.1, 3.2]} w={0.6} h={0.75} art="oval" />
      <Pic face="x" at={[8.4, 3.2]} w={0.6} h={0.75} art="flowers" />
      <FaceX x={0.02} y1={13.75} z1={2.9}><ellipse cx={70} cy={50} rx={62} ry={44} fill="#c9a54a" /><ellipse cx={70} cy={50} rx={54} ry={37} fill="#d7e6ea" /><path d="M40,30 L60,70" stroke="#fff" strokeWidth={4} opacity={0.7} /></FaceX>
    </Shell>

    {/* ===== Kitchen ===== */}
    <RunY x0={0} x1={6.3} />
    <Sink />
    <UpperY x0={0} x1={1.3} /><UpperY x0={3.4} x1={6.3} />
    <Fridge />
    <Caddies x={4.2} y={0.15} />
    <Box x={5.3} y={0.15} z={0.91} w={0.3} d={0.25} h={0.28} c={['#fbf8f2', '#e8e0cc', '#d6cdb6']} />
    <Plant x={0.15} y={0.15} z={0.91} s={0.8} />
    <RunX y0={0.75} y1={3.1} /><Cooker /><RunX y0={4.3} y1={6.3} />
    <UpperX y0={0.75} y1={3.0} /><UpperX y0={4.4} y1={6.3} />
    <Box x={0.15} y={5.0} z={0.91} w={0.3} d={0.4} h={0.32} c={['#e0524a', '#c4433c', '#ab3832']} />
    <Knick at={[0.3, 5.9, 0.91]} k={4} />
    <RunY x0={0.8} x1={5.6} y={6.27} d={0.65} />
    <Box x={1.2} y={6.4} z={0.91} w={0.55} d={0.35} h={0.3} c={['#e6e1d6', '#c9a54a', '#b08f3a']} />
    <Box x={2.4} y={6.42} z={0.91} w={0.4} d={0.3} h={0.25} c={['#c9ced2', '#aeb4b9', '#9aa1a6']} />
    <Knicks list={[[3.6, 6.6, 0.91], [4.4, 6.6, 0.91]]} k0={5} />

    {/* ===== Hall ===== */}
    <GrandfatherClock x={9.6} T={T} />
    <PhoneTable />
    <Sideboard />
    <LowWallX x={8} y0={0} y1={7} gaps={[[4.9, 6.6]]} />
    <LowWallY y={7} x0={0} x1={8} />

    {/* ===== Shower room ===== */}
    <Toilet x={14.6} />
    <PedestalSink x={15.6} />
    <Shower />
    <FloorPlane z={0.006} x={15.4} y={1.9}><rect width={90} height={60} rx={14} fill="#9fd3c7" /></FloorPlane>
    <LowWallX x={14.2} y0={0} y1={4.9} gaps={[[0.8, 2.6]]} />
    <LowWallY y={4.9} x0={14.2} x1={BX} />

    {/* ===== Living room ===== */}
    <Bookshelf />
    <TV />

    {/* ===== Stairs + cupboard ===== */}
    <StairsUp onClick={goUp} />
    <UnderStairs />
    <LowWallX x={14.2} y0={4.9} y1={7.1} />
    <LowWallY y={7.1} x0={14.2} x1={BX} />

    <LeatherSofa sitter={null} />
    <Lamp x={7.75} y={7.45} h={1.7} s={1.6} />
    <Box x={0.05} y={12.2} w={1.25} d={1.6} h={0.75} c={WHITE} />
    <FloorPlane z={0.751} x={0.15} y={12.4}><circle cx={55} cy={60} r={48} fill="#fbf8f2" stroke="#e3d9c6" strokeWidth={4} strokeDasharray="6 4" /></FloorPlane>
    <Lamp x={0.5} y={12.6} z={0.75} c="#f7c6d6" />
    <Knicks list={[[0.7, 13.2, 0.75], [0.35, 13.5, 0.75]]} k0={0} />
    <Box x={2.5} y={12.4} w={1.1} d={1.0} h={0.55} c={WALNUT} />
    <Box x={2.85} y={12.75} z={0.55} w={0.18} d={0.18} h={0.12} c={['#fbf8f2', '#f4efe4', '#e6e1d6']} />
    <Knick at={[3.3, 13.1, 0.55]} k={1} />
    <BigArmchair />
    <LowWallX x={8} y0={7} y1={9.3} />
    <LowWallX x={8} y0={12.1} y1={BY} />

    {/* ===== Sitting / dining room ===== */}
    <ChintzSofa x0={14.7} x1={17.7} y0={7.35} y1={8.8} />
    <Box x={15.4} y={9.5} w={1.4} d={0.9} h={0.7} c={PAINT} />
    <Lamp x={15.8} y={9.85} z={0.7} />
    <Plant x={16.3} y={9.75} z={0.7} s={0.7} />
    <Armchair x={14.1} y={11.4} />
    <DiningTable />
    <Cabinet x={17.15} y={11.6} w={0.8} d={2.3} h={1.05} c={PAINT} face="y" n={1} top={PAINT} />
    <Knicks list={[[17.55, 11.9, 1.13], [17.55, 12.4, 1.13], [17.55, 12.9, 1.13], [17.55, 13.4, 1.13]]} k0={1} />
    <Plant x={8.4} y={9.6} s={1.1} />

    {/* ===== Front walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} />
    <LowWallY y={BY} x0={0} x1={BX} gaps={[[BACK_DOOR.x0, BACK_DOOR.x1]]} />
    <Windowsill />
    <FloorPlane z={0.01} x={BACK_DOOR.x0 + 0.2} y={BY - 0.6}><rect width={140} height={50} rx={5} fill="#8a6a3a" /></FloorPlane>

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4, 0, 3.9]} text="Kitchen" />
    <Tag show={L} at={[11.5, 0, 3.9]} text="Hall" />
    <Tag show={L} at={[16.1, 0, 3.9]} text="Shower room" />
    <Tag show={L} at={[0, 10.5, 3.9]} text="Living room" />
    <Tag show={L} at={[12.5, 10.2, 2.0]} text="Dining room" />
    <Tag show={L} at={[16.1, 6.0, 1.6]} text="Cupboard" />
    <ClickTag at={[12.8, 8.6, 3.0]} text="Stairs ↑ Upstairs" onClick={goUp} />
    <g><Tag show={true} at={[(FRONT_DOOR.x0 + FRONT_DOOR.x1) / 2, 0, 3.25]} text="Front door → Map" /></g>
    <g><Tag show={true} at={[(BACK_DOOR.x0 + BACK_DOOR.x1) / 2, BY + 0.2, 1.2]} text="Back door → Garden" /></g>
  </ScrollStage>;
}

// ---------- Upstairs ----------
function Upstairs({ L, zoom, goDown }) {
  return <ScrollStage zoom={zoom} label="Nanny & Grandad's — upstairs">
    <Slab />
    <Carpet x={0} y={0} w={9.2} d={6.1} c="#9fb3c8" />
    <Carpet x={0} y={6.1} w={9.2} d={BY - 6.1} c="#d8c7a8" />
    <Carpet x={9.2} y={8.3} w={BX - 9.2} d={BY - 8.3} c="#efc3cf" />
    <Carpet x={9.2} y={2.5} w={3.2} d={5.8} c="#9a3a34" />
    <FloorPlane z={0.004} x={9.4} y={2.7}><rect width={280} height={540} fill="none" stroke="#e3c27a" strokeWidth={6} /></FloorPlane>
    <Wood x={9.2} y={0} w={3.2} d={2.5} />
    <Tiles x={12.4} y={0} w={BX - 12.4} d={6.05} a="#f4f2ee" b="#d9e6ea" s={40} />
    <FloorPlane z={0.006} x={2.2} y={2.6}><rect width={280} height={180} rx={20} fill="#3f5a7a" /><rect x={14} y={14} width={252} height={152} rx={14} fill="none" stroke="#bcdcea" strokeWidth={5} /></FloorPlane>
    <Rug x={2.8} y={7.0} w={3.6} d={2.4} c="#7a4a5a" b="#e3c27a" mid="#c98a8a" />
    <FloorPlane z={0.006} x={11.8} y={10.4}><circle cx={110} cy={110} r={110} fill="#f39ac6" /><circle cx={110} cy={110} r={80} fill="none" stroke="#fbf8f2" strokeWidth={8} /><path d="M110,145 C60,110 75,70 110,92 C145,70 160,110 110,145Z" fill="#e85a7a" /></FloorPlane>
    <FloorPlane z={0.006} x={13.3} y={1.3}><rect width={120} height={60} rx={14} fill="#9fd3c7" /></FloorPlane>
    <Shell segY={[[0, 9.2, '#cddcea'], [9.2, 12.4, '#efe4cf'], [12.4, BX, '#e4eef0']]} segX={[[0, 6.1, '#c5d6e6'], [6.1, BY, '#f0dfcf']]}>
      <PaperX y0={6.1} y1={BY} dot="#e3a2a8" leaf="#a8c08a" low="#e6cdb8" />
      <WindowY x0={3.2} z1={3.0} w={1.7} h={1.25} curtain="#3f6e9a" />
      <FaceY y={0.02} x0={12.4} z1={1.5}><rect width={560} height={150} fill="#d9e6ea" />{Array.from({ length: 28 }, (_, i) => <line key={i} x1={i * 20} x2={i * 20} y1={0} y2={150} stroke="#fbf8f2" strokeWidth={1.5} />)}{Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1={0} x2={560} y1={i * 21} y2={i * 21} stroke="#fbf8f2" strokeWidth={1.5} />)}</FaceY>
      <WindowY x0={13.8} z1={3.0} w={1.4} h={1.0} curtain="#9fd3c7" frosted />
      <Pic face="x" at={[2.6, 2.6]} w={1.0} h={0.7} />
      <Pic face="x" at={[10.4, 2.8]} w={0.7} h={0.85} art="oval" />
      <Pic face="x" at={[9.4, 2.7]} w={0.55} h={0.65} art="flowers" />
      <Pic face="x" at={[11.6, 2.7]} w={0.55} h={0.65} art="flowers" />
      <Pic at={[10.0, 3.0]} w={1.2} h={0.4} art="plates" />
      <FaceX x={0.02} y1={5.15} z1={2.4}><rect width={130} height={90} rx={8} fill="#c9a54a" /><rect x={6} y={6} width={118} height={78} rx={5} fill="#d7e6ea" /></FaceX>
    </Shell>

    {/* ===== Blue bedroom ===== */}
    <Box x={0} y={0.2} w={0.6} d={0.65} h={0.6} c={WALNUT} /><Lamp x={0.3} y={0.5} z={0.6} c="#bcdcea" />
    <BedX y0={1.0} wid={1.4} len={2.6} duvet="#6f97c2" />
    <Teddy at={[0.55, 1.75, 0.67]} />
    <Cabinet x={6.2} y={0} w={2.0} d={0.8} h={2.5} c={WALNUT} top={WALNUT} />
    <Cabinet x={0} y={3.6} w={0.6} d={1.6} h={1.0} face="x" art="drawers" c={WALNUT} />
    <Knicks list={[[0.3, 3.85, 1.0], [0.3, 4.4, 1.0], [0.3, 4.95, 1.0]]} k0={2} />
    <Box x={5.0} y={3.8} w={0.55} d={0.55} h={0.45} c={['#c9a777', '#b08f62', '#9c7e55']} />

    {/* ===== Airing cupboard ===== */}
    <Cylinder x={10.1} y={0.8} r={0.5} h={1.9} />
    {[0.9, 1.5, 2.1].map(z => <g key={z}><Box x={11.0} y={0.05} z={z} w={1.3} d={0.6} h={0.04} c={OAK} /><Towels x={11.1} y={0.12} z={z + 0.04} /><Towels x={11.7} y={0.12} z={z + 0.04} /></g>)}

    {/* ===== Bathroom ===== */}
    <Bath />
    <PedestalSink x={16.9} />
    <ToiletX y={1.9} />
    <Box x={17.2} y={4.8} w={0.55} d={0.65} h={0.7} c={['#d9b98a', '#c4a070', '#ad8a5c']} />
    <Plant x={17.4} y={1.4} s={0.9} />

    <LowWallX x={9.2} y0={0} y1={6.1} gaps={[[3.2, 4.6]]} />
    <LowWallY y={6.1} x0={0} x1={9.2} />
    <LowWallX x={12.4} y0={0} y1={6.05} gaps={[[3.5, 4.9]]} />
    <LowWallY y={2.5} x0={9.2} x1={12.4} gaps={[[10.2, 11.4]]} />
    <LowWallY y={6.05} x0={12.4} x1={BX} />

    {/* ===== Landing + stairwell ===== */}
    <Stairwell onClick={goDown} />
    <Box x={9.4} y={5.0} w={0.5} d={0.5} h={0.75} c={MAHOG} /><Knick at={[9.65, 5.25, 0.75]} k={5} />

    {/* ===== Nanny & Grandad's room ===== */}
    <Cabinet x={0} y={7.9} w={0.6} d={0.6} h={0.6} c={MAHOG} face="x" art="drawers" n={2} /><Lamp x={0.3} y={8.2} z={0.6} />
    <BedX y0={8.6} wid={2.4} len={3.0} duvet="#e3b08a" frame={MAHOG} pillows={2} />
    <Cabinet x={0} y={11.1} w={0.6} d={0.6} h={0.6} c={MAHOG} face="x" art="drawers" n={2} /><Lamp x={0.3} y={11.4} z={0.6} /><Knick at={[0.35, 11.6, 0.6]} k={1} />
    <Cabinet x={0} y={12.2} w={0.85} d={1.75} h={2.5} c={MAHOG} face="x" top={MAHOG} />
    <Cabinet x={3.2} y={6.2} w={1.8} d={0.6} h={0.75} c={MAHOG} art="drawers" n={2} />
    <Box x={3.7} y={6.25} z={0.75} w={0.8} d={0.06} h={0.85} c={MAHOG} />
    <FaceY y={6.31} x0={3.7} z1={1.55}><ellipse cx={40} cy={42} rx={34} ry={38} fill="#d7e6ea" stroke="#c9a54a" strokeWidth={4} /></FaceY>
    <Knicks list={[[3.4, 6.6, 0.75], [4.8, 6.6, 0.75], [4.6, 6.45, 0.75]]} k0={5} />
    <Box x={3.85} y={7.1} w={0.5} d={0.45} h={0.45} c={['#e3b08a', '#c9966e', '#b0825c']} />
    <Box x={3.45} y={9.0} w={0.5} d={1.8} h={0.45} c={['#e3b08a', '#c9966e', '#b0825c']} />
    {[[3.6, 11.4], [3.85, 11.4]].map(([a, b], i) => <Box key={i} x={a} y={b} w={0.18} d={0.32} h={0.08} c={['#8f3f45', '#773338', '#622a2e']} />)}
    <Armchair x={7.0} y={12.3} />

    <LowWallX x={9.2} y0={6.1} y1={BY} gaps={[[6.6, 8.0]]} />
    <LowWallY y={8.3} x0={9.2} x1={BX} gaps={[[9.6, 11.0]]} />

    {/* ===== Pink bedroom ===== */}
    <Box x={13.1} y={8.4} w={0.6} d={0.6} h={0.6} c={WHITE} /><Lamp x={13.4} y={8.7} z={0.6} c="#f39ac6" />
    <BedY x0={14.0} y0={8.35} wid={1.5} len={2.6} duvet="#f39ac6" />
    <Box x={16.2} y={8.45} w={0.9} d={0.5} h={0.5} c={['#fbf8f2', '#f7c6d6', '#e9a8c0']} />
    <Teddy at={[16.5, 8.7, 0.5]} c="#e98a3a" />
    <Cabinet x={9.3} y={11.2} w={0.65} d={2.0} h={2.2} c={WHITE} face="x" top={WHITE} knob="#e85a7a" />
    <DollsHouse x={11.6} y={13.0} />

    {/* ===== Front walls ===== */}
    <LowWallX x={BX} y0={0} y1={BY} />
    <LowWallY y={BY} x0={0} x1={BX} />

    {/* ===== Labels ===== */}
    <Tag show={L} at={[4.6, 0, 3.9]} text="Blue bedroom" />
    <Tag show={L} at={[10.8, 0.4, 2.9]} text="Airing cupboard" />
    <Tag show={L} at={[15.2, 0, 3.9]} text="Bathroom" />
    <Tag show={L} at={[10.8, 5.4, 1.4]} text="Landing" />
    <Tag show={L} at={[0, 10.0, 3.9]} text="Nanny & Grandad's room" />
    <Tag show={L} at={[14.2, 12.4, 1.9]} text="Pink bedroom" />
    <ClickTag at={[15.2, 7.2, 1.3]} text="Stairs ↓ Downstairs" onClick={goDown} />
  </ScrollStage>;
}

function FloorSwitch({ fl, setFl }) {
  const b = (id, label) => <button key={id} onClick={() => setFl(id)} style={{ border: 0, borderRadius: 999, padding: '8px 18px', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, background: fl === id ? '#fff6ea' : 'transparent', color: fl === id ? '#3b2a24' : '#fff6ea' }}>{label}</button>;
  return <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(59,42,36,.9)', zIndex: 2 }}>{b('down', 'Downstairs')}{b('up', 'Upstairs')}</div>;
}

function NannyHouseScene({ showLabels = true, animate = true, zoom = 0.75, floor = 'down' }) {
  const [fl, setFl] = React.useState(floor);
  React.useEffect(() => { setFl(floor); }, [floor]);
  const T = useClock(!animate);
  return <div style={{ position: 'absolute', inset: 0 }}>
    {fl === 'down' ? <Downstairs key="down" T={T} L={showLabels} zoom={zoom} goUp={() => setFl('up')} /> : <Upstairs key="up" L={showLabels} zoom={zoom} goDown={() => setFl('down')} />}
    <FloorSwitch fl={fl} setFl={setFl} />
  </div>;
}
window.NannyHouseScene = NannyHouseScene;

window.NannyDownScene = ({ showLabels = false }) => Downstairs({ T: useClock(false), L: showLabels, zoom: 0.75, goUp: null });
window.NannyUpScene = ({ showLabels = false }) => Upstairs({ L: showLabels, zoom: 0.75, goDown: null });

})();

;(function(){
const React = FakeReact;
// Nanny & Grandad's garden — small white-pebble courtyard behind the house. Exports window.NannyGardenScene.
// Same x as the house plan (x 0–18); y = distance from the house wall (0–7.5). Back wall y=0 is the house's rear wall:
//   big living-room window (x 1.4–7.6), dining window (x 9.4–12.6), back door (x 14.6–16.4) → house.
// Side wall x=0 (rendered garden wall). Front + right edges cut low. Water feature in the middle; pots round every edge;
// seating corner at x 0–3.4, y 0–3.4 looking in at the living room (TV) window.
const { P, pts, FloorPlane, FaceX, FaceY, Box, WHITE, Tag, IsoStage, shade } = window.Iso;
const { useClock } = window.NPC;

const RX = 18, RY = 7.5, HH = 4.2, GW = 2.0, LOW = 0.55;
const BACK_DOOR = { x0: 14.6, x1: 16.4 };   // house wall → Nanny & Grandad's house (dining room)
const FOUNT = { x: 9.2, y: 3.9 };
const TEAK = ['#b58a5a', '#9a7248', '#83603c'];
const rnd = (i, k) => { const a = Math.sin(i * k) * 43758.5453; return a - Math.floor(a); };
const ell = (r) => [r * 88 * 1.2247, r * 88 * 0.6124];   // floor circle of radius r → screen ellipse radii

// ---------- Ground ----------
function Pebbles() {
  const tones = ['#ffffff', '#f1eee8', '#e2ddd3', '#d6d0c4', '#f7f5f0', '#c9c2b4'];
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#8a8578" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#76716a" />
    <FloorPlane><rect width={RX * 100} height={RY * 100} fill="#ebe7df" />
      {Array.from({ length: 1500 }, (_, i) => <ellipse key={i} cx={rnd(i, 12.9898) * RX * 100} cy={rnd(i, 78.233) * RY * 100} rx={3 + rnd(i, 3.1) * 5} ry={2.5 + rnd(i, 5.7) * 3.5} fill={tones[i % 6]} />)}
    </FloorPlane>
    {/* sandstone pad under the seating corner */}
    <FloorPlane z={0.01} x={0.15} y={0.15}>{Array.from({ length: 9 }, (_, i) => <rect key={i} x={(i % 3) * 105} y={Math.floor(i / 3) * 105} width={100} height={100} fill={['#e3cfa8', '#d9c398', '#e9d8b6'][i % 3]} stroke="#c9b386" strokeWidth={2} />)}</FloorPlane>
    {/* stepping stones: back door → fountain */}
    {[[15.1, 0.5], [14.2, 1.3], [13.0, 1.9], [11.8, 2.6]].map(([x, y], i) => <FloorPlane key={i} z={0.01} x={x} y={y}><rect width={80} height={60} rx={10} fill="#a9a59c" stroke="#8f8b82" strokeWidth={2} /></FloorPlane>)}
  </g>;
}

// ---------- Walls ----------
function HouseWall() {
  const render = '#f1e8d4';
  return <g>
    <polygon points={pts([[0, 0, 0], [RX, 0, 0], [RX, 0, HH], [0, 0, HH]])} fill={render} />
    <polygon points={pts([[0, 0.01, 0], [RX, 0.01, 0], [RX, 0.01, 0.4], [0, 0.01, 0.4]])} fill="#b9876a" />
    <FaceY y={0.012} x0={0} z1={0.4}>{Array.from({ length: 2 }, (_, r) => Array.from({ length: 46 }, (_, k) => <rect key={r + '-' + k} x={k * 40 + (r % 2) * 20 - 20} y={r * 20 + 1} width={38} height={18} fill={k % 3 ? '#c4906f' : '#b07a5c'} />))}</FaceY>
    <polygon points={pts([[-0.2, -0.25, HH], [RX, -0.25, HH], [RX, 0, HH], [-0.2, 0, HH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[RX, -0.25, HH], [RX, 0, HH], [RX, 0, -0.35], [RX, -0.25, -0.35]])} fill="#e3d0ae" />
    {/* big living-room window, looking in at the TV room */}
    <FaceY y={0.02} x0={1.4} z1={2.95}>
      <rect x={-10} y={-10} width={640} height={220} fill="#fbf8f2" stroke="#ddd3bf" />
      <rect width={620} height={200} fill="#6f7f86" />
      <rect x={20} y={110} width={260} height={90} fill="#7e4626" /><rect x={20} y={95} width={260} height={30} rx={8} fill="#9a5a34" />
      <rect x={330} y={70} width={110} height={65} fill="#2a2a2c" /><rect x={336} y={76} width={98} height={53} fill="#8fc0e0" opacity={0.9} />
      <path d="M480,200 L480,120 L520,100 L560,120 L560,200Z" fill="#8f3f45" />
      <rect x={0} y={0} width={620} height={200} fill="#cfe3ea" opacity={0.28} />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${60 + i * 150},10 L${20 + i * 150},190`} stroke="#fff" strokeWidth={6} opacity={0.35} />)}
      {[155, 310, 465].map(x => <rect key={x} x={x - 4} y={0} width={8} height={200} fill="#fbf8f2" />)}<rect x={0} y={60} width={620} height={8} fill="#fbf8f2" />
      <rect x={-30} y={-18} width={40} height={225} fill="#b9cfa8" /><rect x={610} y={-18} width={40} height={225} fill="#b9cfa8" />
      <rect x={-20} y={200} width={660} height={14} fill="#fbf8f2" stroke="#ddd3bf" />
    </FaceY>
    {/* dining-room window */}
    <FaceY y={0.02} x0={9.4} z1={2.9}>
      <rect x={-10} y={-10} width={340} height={170} fill="#fbf8f2" stroke="#ddd3bf" /><rect width={320} height={150} fill="#7a8a90" />
      <rect x={60} y={95} width={200} height={10} fill="#f4efe4" /><rect x={130} y={70} width={14} height={26} fill="#f2c94c" /><rect x={180} y={70} width={14} height={26} fill="#f2c94c" />
      <rect width={320} height={150} fill="#cfe3ea" opacity={0.3} /><rect x={156} y={0} width={8} height={150} fill="#fbf8f2" /><rect x={0} y={50} width={320} height={7} fill="#fbf8f2" />
      <rect x={-20} y={150} width={360} height={13} fill="#fbf8f2" stroke="#ddd3bf" />
    </FaceY>
    {/* back door */}
    <g>
      <FaceY y={0.02} x0={BACK_DOOR.x0} z1={2.55}>
        <rect x={-10} y={-10} width={200} height={265} fill="#fbf8f2" stroke="#ddd3bf" />
        <rect x={10} y={0} width={160} height={255} fill="#f6f2ea" stroke="#d6cab3" strokeWidth={2} />
        <rect x={32} y={18} width={116} height={120} fill="#bcd6e0" /><path d="M50,30 L70,120" stroke="#fff" strokeWidth={5} opacity={0.6} />
        <rect x={32} y={155} width={116} height={80} fill="none" stroke="#d6cab3" strokeWidth={3} />
        <rect x={142} y={140} width={16} height={6} rx={3} fill="#9aa1a6" />
      </FaceY>
      <Box x={BACK_DOOR.x0 - 0.1} y={0} w={BACK_DOOR.x1 - BACK_DOOR.x0 + 0.2} d={0.45} h={0.18} c={['#d6d0c4', '#c9c2b4', '#b9b2a4']} />
      <FloorPlane z={0.181} x={BACK_DOOR.x0 + 0.2} y={0.05}><rect width={140} height={35} rx={4} fill="#8a6a3a" /></FloorPlane>
    </g>
    {/* outside light + drainpipe */}
    <FaceY y={0.03} x0={16.7} z1={2.6}><rect width={22} height={30} rx={4} fill="#2a2a2c" /><rect x={4} y={6} width={14} height={18} fill="#f2dfb0" /></FaceY>
    <FaceY y={0.03} x0={13.6} z1={HH}><rect width={12} height={HH * 100} fill="#5b5f66" /><rect x={-6} y={0} width={24} height={14} fill="#5b5f66" /></FaceY>
  </g>;
}
function SideWall() {
  return <g>
    <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, GW], [0, 0, GW]])} fill="#f6f2ea" />
    <FaceX x={0.012} y1={RY} z1={GW}>{Array.from({ length: 4 }, (_, i) => <rect key={i} x={40 + i * 170} y={20} width={130} height={150} fill="none" stroke="#c9a777" strokeWidth={3} />)}{Array.from({ length: 4 }, (_, i) => Array.from({ length: 5 }, (_, k) => <g key={i + '-' + k}><line x1={40 + i * 170 + k * 32} y1={20} x2={40 + i * 170 + k * 32} y2={170} stroke="#c9a777" strokeWidth={2} /></g>))}
      {Array.from({ length: 60 }, (_, i) => <ellipse key={'l' + i} cx={30 + rnd(i, 4.1) * 690} cy={40 + rnd(i, 9.3) * 150} rx={9} ry={5} transform={`rotate(${rnd(i, 2.2) * 180} ${30 + rnd(i, 4.1) * 690} ${40 + rnd(i, 9.3) * 150})`} fill={i % 3 ? '#5f9a4a' : '#86b55a'} />)}
      {Array.from({ length: 14 }, (_, i) => <circle key={'f' + i} cx={40 + rnd(i, 6.6) * 670} cy={40 + rnd(i, 1.7) * 120} r={5} fill="#f2f2f2" stroke="#e6e0f0" />)}
    </FaceX>
    <polygon points={pts([[-0.2, 0, GW], [0.05, 0, GW], [0.05, RY, GW], [-0.2, RY, GW]])} fill="#e3ddd0" />
    <polygon points={pts([[-0.2, RY, GW], [0.05, RY, GW], [0.05, RY, -0.35], [-0.2, RY, -0.35]])} fill="#d6cfbf" />
  </g>;
}
const LowY = ({ y, x0, x1 }) => <Box x={x0} y={y - 0.12} w={x1 - x0} d={0.24} h={LOW} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />;
const LowX = ({ x, y0, y1 }) => <Box x={x - 0.12} y={y0} w={0.24} d={y1 - y0} h={LOW} c={['#fbf8f2', '#ebe6dc', '#ddd6c9']} />;

// ---------- Pots & plants ----------
const POTS = { terra: '#c96a4a', blue: '#3f6e9a', stone: '#a9a59c', cream: '#efe6d2', green: '#5f8a6a', black: '#3a3a3c' };
function Pot({ x, y, kind = 'bush', pot = 'terra', s = 1, flower = '#e85a7a' }) {
  const [bx, by] = P(x, y, 0), c = POTS[pot] || pot, pw = 24 * s, ph = 34 * s, tx = bx, ty = by - ph;
  const potEl = <g><ellipse cx={bx} cy={by} rx={pw * 0.9} ry={pw * 0.35} fill="rgba(60,50,30,.18)" /><path d={`M${bx - pw * 0.72},${by} L${bx - pw},${ty} L${bx + pw},${ty} L${bx + pw * 0.72},${by} Z`} fill={c} /><path d={`M${bx + pw * 0.15},${by} L${bx + pw * 0.3},${ty} L${bx + pw},${ty} L${bx + pw * 0.72},${by} Z`} fill={shade(c, -0.15)} /><rect x={bx - pw * 1.08} y={ty - 6 * s} width={pw * 2.16} height={7 * s} rx={2} fill={shade(c, 0.1)} /><ellipse cx={tx} cy={ty - 5 * s} rx={pw * 0.95} ry={pw * 0.3} fill="#5a4030" /></g>;
  let plant;
  const G = ['#4f8a3e', '#6b9a44', '#86b55a', '#3f7a4a'];
  switch (kind) {
    case 'bush': plant = <g>{[[-14, -14, 20], [12, -16, 19], [0, -30, 22], [-6, -8, 16], [10, -6, 15]].map(([a, b, r], i) => <circle key={i} cx={tx + a * s} cy={ty + b * s} r={r * s} fill={G[i % 4]} />)}</g>; break;
    case 'topiary': plant = <g><rect x={tx - 2.5 * s} y={ty - 50 * s} width={5 * s} height={48 * s} fill="#7a5a3a" /><circle cx={tx} cy={ty - 66 * s} r={24 * s} fill="#3f7a4a" /><circle cx={tx - 7 * s} cy={ty - 73 * s} r={10 * s} fill="#5a9a5a" /></g>; break;
    case 'grass': plant = <g>{Array.from({ length: 16 }, (_, i) => { const a = (i / 15 - 0.5) * 1.6; return <path key={i} d={`M${tx},${ty - 4 * s} Q${tx + Math.sin(a) * 18 * s},${ty - 40 * s} ${tx + Math.sin(a) * 34 * s},${ty - (52 - Math.abs(a) * 18) * s}`} stroke={i % 2 ? '#a8b86a' : '#c9c27a'} strokeWidth={2.5 * s} fill="none" />; })}</g>; break;
    case 'spiky': plant = <g>{Array.from({ length: 12 }, (_, i) => { const a = (i / 11 - 0.5) * 2.4; return <path key={i} d={`M${tx - 3 * s},${ty - 4 * s} L${tx + Math.sin(a) * 42 * s},${ty - Math.cos(a) * 48 * s - 6 * s} L${tx + 3 * s},${ty - 4 * s}Z`} fill={i % 2 ? '#4f8a5a' : '#6fa86a'} />; })}</g>; break;
    case 'lavender': plant = <g>{Array.from({ length: 14 }, (_, i) => { const dx = (i - 6.5) * 3.2 * s, h = (36 + (i % 4) * 7) * s; return <g key={i}><line x1={tx + dx * 0.5} y1={ty - 4 * s} x2={tx + dx} y2={ty - h} stroke="#7a9a6b" strokeWidth={1.6 * s} /><ellipse cx={tx + dx} cy={ty - h - 4 * s} rx={2.6 * s} ry={7 * s} fill={i % 3 ? '#9b7cc4' : '#7a5aa8'} /></g>; })}</g>; break;
    case 'fern': plant = <g>{Array.from({ length: 8 }, (_, i) => { const px = tx + (i % 2 ? 1 : -1) * (6 + i * 2.6) * s, py = ty - (8 + i * 7) * s; return <ellipse key={i} cx={px} cy={py} rx={17 * s} ry={5.5 * s} transform={`rotate(${i % 2 ? 28 : -28} ${px} ${py})`} fill={G[i % 4]} />; })}</g>; break;
    case 'cactus': plant = <g><rect x={tx - 7 * s} y={ty - 46 * s} width={14 * s} height={44 * s} rx={7 * s} fill="#5f9a5a" /><rect x={tx + 5 * s} y={ty - 34 * s} width={14 * s} height={7 * s} rx={3} fill="#5f9a5a" /><rect x={tx + 12 * s} y={ty - 46 * s} width={8 * s} height={18 * s} rx={4 * s} fill="#5f9a5a" /><circle cx={tx} cy={ty - 47 * s} r={4 * s} fill="#f39ac6" /></g>; break;
    default: plant = <g>{[[-12, -12, 15], [10, -14, 15], [0, -24, 17]].map(([a, b, r], i) => <circle key={i} cx={tx + a * s} cy={ty + b * s} r={r * s} fill={G[(i + 1) % 4]} />)}{Array.from({ length: 9 }, (_, i) => <circle key={'f' + i} cx={tx + (rnd(i + x * 7, 3.3) - 0.5) * 40 * s} cy={ty - (8 + rnd(i + y * 5, 7.7) * 28) * s} r={4.5 * s} fill={i % 4 === 3 ? '#fbf8f2' : flower} />)}</g>;
  }
  return <g>{potEl}{plant}</g>;
}

// ---------- Water feature ----------
function Fountain({ T }) {
  const { x, y } = FOUNT, [cx, cy] = P(x, y, 0), [rx, ry] = ell(1.15), wall = 0.45 * 88, [ix, iy] = ell(0.98);
  const [, t1] = P(x, y, 1.05), [, t2] = P(x, y, 1.65), [r1x, r1y] = ell(0.55), [r2x, r2y] = ell(0.28);
  const drops = (tx, ty, R, n, k) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, f = ((T * 1.4 + i * 0.37 + k) % 1); return <circle key={k + '-' + i} cx={tx + Math.cos(a) * R * (0.9 + f * 0.25)} cy={ty + Math.sin(a) * R * 0.5 + f * f * 26} r={2} fill="#dff1f6" opacity={1 - f} />; });
  return <g>
    <ellipse cx={cx} cy={cy + 6} rx={rx + 10} ry={ry + 6} fill="rgba(60,50,30,.15)" />
    <path d={`M${cx - rx},${cy - wall} L${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy - wall} Z`} fill="#c9c2b4" />
    {[0.33, 0.66].map(f => <path key={f} d={`M${cx - rx},${cy - wall * f} A${rx},${ry} 0 0 0 ${cx + rx},${cy - wall * f}`} fill="none" stroke="#b5ad9e" strokeWidth={2} />)}
    <ellipse cx={cx} cy={cy - wall} rx={rx} ry={ry} fill="#ddd7cb" />
    <ellipse cx={cx} cy={cy - wall} rx={ix} ry={iy} fill="#7fb8c9" />
    {[0, 1, 2].map(i => { const f = (T * 0.5 + i / 3) % 1; return <ellipse key={i} cx={cx} cy={cy - wall} rx={r1x * (0.8 + f * 0.9)} ry={r1y * (0.8 + f * 0.9)} fill="none" stroke="#e6f4f8" strokeWidth={2} opacity={0.8 * (1 - f)} />; })}
    <rect x={cx - 9} y={t1} width={18} height={cy - wall - t1} fill="#c9c2b4" /><rect x={cx + 2} y={t1} width={7} height={cy - wall - t1} fill="#b5ad9e" />
    <path d={`M${cx - r1x},${t1} Q${cx},${t1 + r1y * 2.6} ${cx + r1x},${t1} Z`} fill="#c9c2b4" /><ellipse cx={cx} cy={t1} rx={r1x} ry={r1y} fill="#ddd7cb" /><ellipse cx={cx} cy={t1} rx={r1x - 6} ry={r1y - 3} fill="#8fc4d4" />
    <rect x={cx - 5} y={t2} width={10} height={t1 - t2} fill="#c9c2b4" />
    <path d={`M${cx - r2x},${t2} Q${cx},${t2 + r2y * 2.6} ${cx + r2x},${t2} Z`} fill="#c9c2b4" /><ellipse cx={cx} cy={t2} rx={r2x} ry={r2y} fill="#ddd7cb" /><ellipse cx={cx} cy={t2} rx={r2x - 4} ry={r2y - 2} fill="#8fc4d4" />
    <circle cx={cx} cy={t2 - 14} r={7} fill="#ddd7cb" />
    {Array.from({ length: 6 }, (_, i) => { const f = (T * 1.6 + i / 6) % 1; return <circle key={'s' + i} cx={cx + Math.sin(i * 2.1) * 3} cy={t2 - 18 - Math.sin(f * Math.PI) * 26} r={2.2} fill="#dff1f6" opacity={0.9 - f * 0.5} />; })}
    {drops(cx, t2, r2x, 10, 0)}{drops(cx, t1, r1x, 16, 0.5)}
  </g>;
}

// ---------- Seating corner ----------
function Seating() {
  const cushion = ['#b9cfa8', '#9fbe96', '#86a87e'];
  const chair = (x, y) => <g key={x}><Box x={x} y={y} w={0.6} d={0.6} h={0.45} c={TEAK} /><Box x={x + 0.05} y={y + 0.05} z={0.45} w={0.5} d={0.5} h={0.07} c={cushion} /><Box x={x} y={y + 0.52} z={0.45} w={0.6} d={0.08} h={0.55} c={TEAK} /></g>;
  return <g>
    {/* bench along the side wall, cushioned */}
    <Box x={0.15} y={0.35} w={0.65} d={2.4} h={0.45} c={TEAK} /><Box x={0.15} y={0.35} z={0.45} w={0.12} d={2.4} h={0.55} c={TEAK} />
    <Box x={0.27} y={0.4} z={0.45} w={0.5} d={2.3} h={0.08} c={cushion} />
    <Box x={0.3} y={0.6} z={0.53} w={0.14} d={0.5} h={0.35} c={['#f2c94c', '#d9b03a', '#c09a2c']} /><Box x={0.3} y={1.9} z={0.53} w={0.14} d={0.5} h={0.35} c={['#f39ac6', '#e07fae', '#c96a96']} />
    {/* round table */}
    {(() => { const [x, y] = P(1.9, 1.5, 0), [, t] = P(1.9, 1.5, 0.72), [rx, ry] = ell(0.45); return <g><rect x={x - 3} y={t} width={6} height={y - t} fill="#3a3a3c" /><ellipse cx={x} cy={y} rx={22} ry={8} fill="#3a3a3c" /><ellipse cx={x} cy={t + 4} rx={rx} ry={ry} fill="#2a2a2c" /><ellipse cx={x} cy={t} rx={rx} ry={ry} fill="#fbf8f2" stroke="#c9c2b4" /><rect x={x - 14} y={t - 14} width={9} height={11} rx={2} fill="#fbf8f2" stroke="#c9c2b4" /><rect x={x + 6} y={t - 12} width={9} height={11} rx={2} fill="#3f6e9a" /><ellipse cx={x + 22} cy={t - 2} rx={10} ry={4} fill="#c9a54a" /></g>; })()}
    {chair(1.55, 2.25)}{chair(2.45, 1.2)}
  </g>;
}

function NannyGardenScene({ showLabels = true, animate = true }) {
  const T = useClock(!animate), L = showLabels;
  const housePots = [[8.4, 0.35, 'topiary', 'black', 1.1], [9.0, 0.4, 'flowers', 'terra', 0.8, '#e0524a'], [13.0, 0.35, 'spiky', 'stone', 1.0], [17.3, 0.4, 'topiary', 'black', 1.1], [4.2, 0.35, 'lavender', 'cream', 0.8], [6.4, 0.35, 'flowers', 'blue', 0.8, '#f2c94c']];
  const sidePots = [[0.4, 3.8, 'fern', 'green', 1.1], [0.4, 4.7, 'flowers', 'terra', 0.9, '#f39ac6'], [0.4, 5.6, 'grass', 'stone', 1.0], [0.45, 6.5, 'bush', 'blue', 1.2]];
  const rightPots = [[17.5, 1.4, 'flowers', 'terra', 0.9, '#e85a7a'], [17.5, 2.4, 'lavender', 'stone', 1.0], [17.5, 3.4, 'cactus', 'terra', 0.9], [17.5, 4.4, 'bush', 'green', 1.1], [17.5, 5.4, 'flowers', 'cream', 0.9, '#7a4fd1'], [17.5, 6.4, 'spiky', 'black', 1.1]];
  const frontPots = Array.from({ length: 13 }, (_, i) => { const k = ['flowers', 'grass', 'bush', 'lavender', 'flowers', 'fern', 'topiary', 'flowers', 'spiky', 'bush', 'flowers', 'cactus', 'lavender'][i]; return [1.3 + i * 1.25, 7.05, k, ['terra', 'stone', 'blue', 'cream', 'terra', 'green', 'black'][i % 7], 0.75 + rnd(i, 2.7) * 0.5, ['#e0524a', '#f39ac6', '#f2c94c', '#fbf8f2'][i % 4]]; });
  const clusters = [[6.9, 3.2, 'flowers', 'terra', 0.7, '#f2a127'], [11.5, 4.7, 'lavender', 'stone', 0.8], [7.6, 5.0, 'grass', 'cream', 0.8], [12.2, 3.0, 'flowers', 'blue', 0.7, '#e85a7a']];
  const all = [...housePots, ...sidePots, ...rightPots, ...clusters].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const pot = (p, i) => <Pot key={p[0] + '-' + p[1]} x={p[0]} y={p[1]} kind={p[2]} pot={p[3]} s={p[4]} flower={p[5]} />;
  const [fx, fy] = [FOUNT.x, FOUNT.y];
  return <IsoStage cx={1340} cy={800} zoom={0.68} label="Nanny & Grandad's garden" defs={null}>
    <Pebbles />
    <HouseWall />
    <SideWall />
    <Seating />
    {all.filter(p => p[0] + p[1] < fx + fy).map(pot)}
    <Fountain T={T} />
    {all.filter(p => p[0] + p[1] >= fx + fy).map(pot)}
    <LowX x={RX} y0={0} y1={RY} />
    <LowY y={RY} x0={0} x1={RX} />
    {frontPots.map(pot)}
    <Tag show={L} at={[4.5, 0, 3.4]} text="Living room window" />
    <Tag show={L} at={[1.6, 1.6, 1.9]} text="Seating area" />
    <Tag show={L} at={[fx, fy, 2.6]} text="Water feature" />
    <g><Tag show={true} at={[(BACK_DOOR.x0 + BACK_DOOR.x1) / 2, 0, 3.05]} text="Back door → House" /></g>
  </IsoStage>;
}
window.NannyGardenScene = NannyGardenScene;

})();

;(function(){
const React = FakeReact;
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

function ClothesScene({ showLabels = false }) {
  const T = useClock(false), L = showLabels, onOpen = () => {};
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: PINK, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#f6e6e0' };
  return <IsoStage cx={1074} cy={826} zoom={0.68} label="Clothes Shop">
    <Slab RX={RX} RY={RY} /><Floor /><Walls />
    <Cubbies onOpen={onOpen} /><ShoeWall onOpen={onOpen} /><MirrorLogo /><FittingRooms />
    {adult({ at: [3.4, 1.05, 0], look: { ...LOOKS.mumBun, ...STAFF }, ph: 1, facing: 'back', pose: 'reach' })}
    {kid({ at: [12.1, 1.2, 0], look: LOOKS.girlPink, ph: 2, facing: 'back', pose: 'wave' })}
    <Rail x0={3} x1={6} y={3.2} cat="tops" path={G_TEE} len="TOPS" onOpen={onOpen} />
    <Rail x0={8} x1={11} y={3.2} cat="dresses" path={G_DRESS} len="DRESSES" onOpen={onOpen} />
    {kid({ at: [4.4, 4.0, 0], look: LOOKS.girlCurly, ph: 4, facing: 'back', pose: 'reach' })}
    {adult({ at: [9.6, 4.1, 0], look: LOOKS.mum, ph: 5, facing: 'back', pose: 'reach' })}
    <Rail x0={3} x1={6} y={5.6} cat="bottoms" path={G_TROUSER} len="TROUSERS" onOpen={onOpen} />
    <Rail x0={8} x1={11} y={5.6} cat="tops" path={G_LONG} len="HOODIES" onOpen={onOpen} />
    <Box x={2.6} y={7.6} w={2.6} d={1.0} h={0.3} c={WHITE} />
    <Mannequin at={[3.3, 8.1, 0.3]} o={{ body: 'berry-hoodie', legs: 'denim-jeans', shoes: 'white-trainers' }} />
    <Mannequin at={[4.6, 8.1, 0.3]} o={{ body: 'lilac-sundress', legs: 'white-leggings', shoes: 'gold-sandals' }} />
    <CapsTable onOpen={onOpen} />
    {kid({ at: [9.2, 9.3, 0], look: LOOKS.boyCap, ph: 7, facing: 'back', pose: 'reach' })}
    {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'reach' })}
    <Till onOpen={onOpen} cat="tops" />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.4]} text="Exit to town" />
  </IsoStage>;
}
window.ClothesScene = ClothesScene;

})();

;(function(){
const React = FakeReact;
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
  const fish = PETS.filter(p => p.cat === 'fish' && !(window.__petsOwned || []).includes(p.id));
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
  const birds = PETS.filter(p => p.cat === 'birds' && !(window.__petsOwned || []).includes(p.id));
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
  const gone = id => (window.__petsOwned || []).includes(id);
  return <g {...hit(onOpen, 'small')}>
    <Box x={0} y={1.0} w={1.1} d={5.4} h={2.4} c={OAK} />
    <FaceX x={1.1} y1={6.4} z1={2.4}>
      {pets.map((p, i) => { const x = (i % 2) * 270, y = Math.floor(i / 2) * 120; return <g key={p.id}>
        <rect x={x + 10} y={y + 10} width={250} height={102} fill="#f6ead2" />
        <rect x={x + 10} y={y + 92} width={250} height={20} fill="#e8c873" />
        {p.kind === 'hamster' && <g><circle cx={x + 70} cy={y + 64} r={34} fill="none" stroke="#5fa8d8" strokeWidth={5} /><line x1={x + 70} y1={y + 64} x2={x + 70} y2={y + 104} stroke="#5fa8d8" strokeWidth={4} /></g>}
        {!gone(p.id) && <g transform={`translate(${x + 150 + Math.sin(T * 0.4 + i) * (p.kind === 'tortoise' ? 30 : 12)} ${y + 106})`}><PetArt p={p} T={T} ph={i * 1.7} s={1.25} flip={Math.cos(T * 0.4 + i) < 0 && p.kind === 'tortoise'} /></g>}
        {Array.from({ length: 15 }, (_, k) => <line key={k} x1={x + 14 + k * 17} y1={y + 10} x2={x + 14 + k * 17} y2={y + 112} stroke="#8a9196" strokeWidth={1.5} opacity={.55} />)}
        <rect x={x + 10} y={y + 10} width={250} height={102} fill="none" stroke="#b58e5a" strokeWidth={6} />
      </g>; })}
    </FaceX>
    <FaceX x={0.02} y1={5.0} z1={3.4}>{signArt(220, 'SMALL PETS')}</FaceX>
  </g>;
}

function Pen({ T, onOpen, kidAt }) {
  const X0 = 2.6, X1 = 7.2, Y0 = 4.0, Y1 = 7.4, Z = 0.55, F = '#f6efe2', F2 = '#d8c9ae';
  const dogs = PETS.filter(p => p.cat === 'dogs' && !(window.__petsOwned || []).includes(p.id)).map((p, i) => {
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
    {!(window.__petsOwned || []).includes('mittens') && at([9.75, 5.05, 1.07], <PetArt p={m} T={T} ph={1} s={0.85} />, 'm')}
    {!(window.__petsOwned || []).includes('snowy') && at([9.55, 4.9, 1.99], <PetArt p={s} T={T} ph={3} s={0.85} flip />, 's')}
    <Box x={10.5} y={5.5} w={0.75} d={0.6} h={0.2} c={['#c9a16a', '#b58e5a', '#a07a4a']} />
    {!(window.__petsOwned || []).includes('ginger') && at([10.9, 5.85, 0.14], <PetArt p={g} T={T} ph={2} s={0.85} flip />, 'g')}
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

function PetShopRoom({ showLabels = false }) {
  const T = useClock(false), onOpen = () => {};
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: ACC, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#e4f0e4' };
  return <IsoStage cx={1074} cy={826} zoom={0.68} label="Pet Shop">
    <Slab RX={RX} RY={RY} /><Floor /><Walls /><Shelves />
    <Aquarium T={T} onOpen={onOpen} /><BirdCages T={T} onOpen={onOpen} /><Hutches T={T} onOpen={onOpen} />
    {adult({ at: [3.0, 1.3, 0], look: LOOKS.mum, ph: 1, facing: 'back', pose: 'reach' })}
    {adult({ at: [1.8, 3.4, 0], look: { ...LOOKS.dad, ...STAFF }, ph: 2, pose: 'stand' })}
    {kid({ at: [8.0, 1.3, 0], look: LOOKS.boyCap, ph: 3, facing: 'back', pose: 'wave' })}
    <Pen T={T} onOpen={onOpen} />
    <CatTree T={T} onOpen={onOpen} />
    {kid({ at: [3.6, 8.1, 0], look: LOOKS.boyRed, ph: 6, facing: 'back', pose: 'wave' })}
    {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'stand' })}
    <Till onOpen={onOpen} />
    <FrontWalls />
  </IsoStage>;
}
window.PetShopRoom = PetShopRoom;
window.PetKit = { PetArt, PETS, BY_ID, SIZE, CATS, HEART };

})();

export const SCENES = {
  hallway: window.HallwayScene, parents: window.ParentsRoomScene, chloe: window.ChloeRoomScene, bathroom: window.BathroomScene,
  attic: window.AtticScene, downhall: window.DownstairsHallScene, kitchen: window.KitchenScene, toilet: window.ToiletScene,
  living: window.LivingRoomScene, middle: window.MiddleBackRoomScene, garden: window.GardenScene,
  park: window.ParkScene, cafe: window.CafeScene, shop: window.SupermarketScene, school: window.SchoolScene,
  nannydown: window.NannyDownScene, nannyup: window.NannyUpScene, nannygarden: window.NannyGardenScene, clothes: window.ClothesScene, pets: window.PetShopRoom,
};
export const TownMapScene = window.TownMapScene;
export const NPC = window.NPC;
export const Iso = window.Iso;
export const HB = window.HBItems;
export const PetKit = window.PetKit;
