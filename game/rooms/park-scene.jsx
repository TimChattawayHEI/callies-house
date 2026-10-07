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
    <Swing x={2.0} a={swing2} />
    {kid({ at: swingPos(3.4, swingA), look: LOOKS.girlPink, pose: 'sit', ph: 1, shadow: false, armL: 160, armR: 160 })}
    <Swing x={3.4} a={swingA} seat="#e0524a" />
    <TowerBack />
    {kid({ at: [6.9, 1.8, TW.deck], look: LOOKS.boyCap, pose: 'wave', ph: 3 })}
    <TowerFront />
    <Slide />
    {slideU < 0.75 && kid({ at: slidePos(slideU / 0.75), look: LOOKS.girlBlue, pose: 'sit', ph: 4, shadow: false, armL: 120, armR: 120 })}
    <ZipLine />
    {zipU < 0.95 && <g>{ln(zp.top, zp.seat, '#5b5f66', 3, 'rope')}{kid({ at: zp.seat, look: LOOKS.boyGreen, pose: 'sit', ph: 5, shadow: false, armL: 172, armR: 172 })}</g>}
    <MerryGoRound T={T} kid={(at) => kid({ at, look: LOOKS.girlCurly, pose: 'sit', ph: 6, shadow: false, armR: 60 })} />
    <Sandpit />
    {kid({ at: [8.7, 4.2, 0.3], look: LOOKS.boyRed, pose: 'sit', ph: 7, armR: 40 + Math.sin(T * 4) * 20 })}
    <SeeSaw tilt={tilt} kids={(a, b) => [kid({ at: a, look: LOOKS.girlBlue, pose: 'sit', ph: 8, shadow: false, armL: 70, armR: 70, flip: true }), kid({ at: b, look: LOOKS.boyCap, pose: 'sit', ph: 9, shadow: false, armL: 70, armR: 70 })]} />
    <Reeds />
    {[[0, 0.9, 0.2], [1, 1.4, 0.55], [2, 0.6, 1.0]].map(([i, sp, off]) => { const a = T * 0.25 * sp + off * 6; return <Duck key={i} at={[POND.x + Math.cos(a) * POND.rx * 0.6, POND.y + Math.sin(a) * POND.ry * 0.55, 0]} T={T} ph={i} flip={Math.sin(a) < 0} />; })}
    <FrontFences />
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
