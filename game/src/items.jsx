// Things you can pick up, carry in the backpack and put away.
import React from 'react';

export function Plush({ kind, s = 1 }) {
  if (kind === 'bear') return <g transform={`scale(${s})`}>
    <circle cx={-13} cy={-44} r={7} fill="#f6c3cd" /><circle cx={13} cy={-44} r={7} fill="#f6c3cd" />
    <ellipse cx={0} cy={-12} rx={16} ry={14} fill="#f6c3cd" /><ellipse cx={0} cy={-11} rx={9} ry={8} fill="#fff4f6" />
    <circle cx={0} cy={-34} r={15} fill="#f8ccd4" /><ellipse cx={0} cy={-29} rx={7} ry={5} fill="#fff1f3" />
    <circle cx={-6} cy={-36} r={2.2} fill="#c2306a" /><circle cx={6} cy={-36} r={2.2} fill="#c2306a" />
    <path d="M-2,-31 L2,-31 0,-28Z" fill="#d62f7a" />
  </g>;
  if (kind === 'moon') return <g transform={`scale(${s})`}><path d="M10,-38 A20,20 0 1 0 14,-4" fill="none" stroke="#6c7fd6" strokeWidth={14} strokeLinecap="round" /><path d="M-12,-4 l-6,8 10,-2Z" fill="#9fe0e8" /></g>;
  if (kind === 'dino') return <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={-14} rx={18} ry={14} fill="#77c776" /><circle cx={12} cy={-28} r={10} fill="#77c776" />
    {[-10, -2, 6].map(x => <path key={x} d={`M${x - 4},-26 L${x},-34 ${x + 4},-26Z`} fill="#f39b4d" />)}
    <circle cx={15} cy={-30} r={2.2} fill="#222" />
  </g>;
  if (kind === 'sheep') return <g transform={`scale(${s})`}>
    {[[-10, -16], [0, -22], [10, -16], [-6, -8], [6, -8]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={10} fill="#fbf6ea" stroke="#e5dccb" />)}
    <ellipse cx={-16} cy={-22} rx={7} ry={8} fill="#5b4b44" /><circle cx={-18} cy={-24} r={1.6} fill="#fff" />
  </g>;
  return <g transform={`scale(${s})`}>
    <ellipse cx={-6} cy={-46} rx={4} ry={12} fill="#c8b1e8" /><ellipse cx={6} cy={-46} rx={4} ry={12} fill="#c8b1e8" />
    <circle cx={0} cy={-28} r={11} fill="#d3c0ee" /><ellipse cx={0} cy={-9} rx={13} ry={11} fill="#d3c0ee" />
    <circle cx={-4} cy={-29} r={1.8} fill="#333" /><circle cx={4} cy={-29} r={1.8} fill="#333" />
  </g>;
}
export function Cloth({ c, stripe }) {
  return <g>
    <path d="M-24,-6 C-14,-14 6,-12 24,-8 C28,0 20,8 4,10 C-10,12 -26,8 -24,-6Z" fill={c} stroke="rgba(0,0,0,.12)" />
    {stripe && [-14, -4, 6, 16].map(x => <line key={x} x1={x} y1={-12} x2={x - 2} y2={10} stroke={stripe} strokeWidth={3} />)}
  </g>;
}
export const BookArt = ({ c }) => <g><rect x={-20} y={-14} width={40} height={28} rx={2} fill={c} stroke="rgba(0,0,0,.15)" /><rect x={-20} y={-14} width={6} height={28} fill="rgba(0,0,0,.15)" /></g>;

const FILL = { ham: '#f2a5a5', jam: '#c4304f', egg: '#ffe27a', cheese: '#f7c948', tuna: '#d9c7a8' };
export function Sandwich({ fillings = [] }) {
  return <g transform="translate(0 -10)">
    <path d="M-18,8 L18,8 L0,-16Z" fill="#e8c48c" stroke="#b98a4e" strokeWidth={1.5} strokeLinejoin="round" />
    {fillings.map((f, i) => <path key={i} d={`M${-17 + i},${6 - i * 3} L${17 - i},${6 - i * 3}`} stroke={FILL[f] || '#9be3a4'} strokeWidth={4} strokeLinecap="round" />)}
    <path d={`M-16,${2 - fillings.length * 3} L16,${2 - fillings.length * 3} L0,-18Z`} fill="#f3d6a4" stroke="#b98a4e" strokeWidth={1.5} strokeLinejoin="round" />
  </g>;
}

// Each kind: what it's called (read aloud) and how it's drawn (sprite, origin at the floor).
export const KINDS = {
  bear: { word: 'bear', art: () => <Plush kind="bear" s={1} /> },
  moon: { word: 'moon', art: () => <Plush kind="moon" s={1} /> },
  dino: { word: 'dino', art: () => <Plush kind="dino" s={1} /> },
  sheep: { word: 'sheep', art: () => <Plush kind="sheep" s={1} /> },
  bunny: { word: 'bunny', art: () => <Plush kind="bunny" s={1} /> },
  cloth: { word: 'top', art: it => <g transform="translate(0 -6) scale(1.3)"><Cloth c={it.c} stripe={it.stripe} /></g> },
  book: { word: 'book', art: it => <g transform="translate(0 -12)"><BookArt c={it.c} /></g> },
  sandwich: { word: 'sandwich', art: it => <Sandwich fillings={it.fillings} /> },
  duck: { word: 'duck', art: () => <g transform="translate(0 -4)">
    <ellipse cx={0} cy={-10} rx={16} ry={10} fill="#ffd23f" /><circle cx={9} cy={-22} r={8} fill="#ffd23f" />
    <path d="M15,-22 l9,2 -9,3Z" fill="#f28a2e" /><circle cx={11} cy={-24} r={1.8} fill="#222" /><path d="M-14,-12 q-6,-8 0,-10" fill="none" stroke="#f0b81e" strokeWidth={3} /></g> },
  hat: { word: 'hat', art: () => <g transform="translate(0 -4)">
    <ellipse cx={0} cy={-4} rx={22} ry={6} fill="#c94f4f" /><path d="M-13,-4 C-13,-26 13,-26 13,-4Z" fill="#d95f5f" /><rect x={-13} y={-10} width={26} height={5} fill="#3b2a24" /></g> },
  cup: { word: 'cup', art: () => <g transform="translate(0 -2)">
    <path d="M-11,-26 L11,-26 L9,0 L-9,0Z" fill="#5b9bd5" /><ellipse cx={0} cy={-26} rx={11} ry={3.5} fill="#8ec5ea" />
    <path d="M10,-20 q10,0 9,8 q-1,6 -10,5" fill="none" stroke="#5b9bd5" strokeWidth={3.5} /><circle cx={0} cy={-13} r={4} fill="#ffd45e" /></g> },
  sock: { word: 'sock', art: () => <g transform="translate(0 -4) rotate(-20)">
    <path d="M-6,-30 L6,-30 L6,-8 Q18,-6 18,0 Q16,6 4,6 L-6,6 Q-8,0 -6,-8Z" fill="#7cc9a8" />
    {[-24, -16].map(y => <rect key={y} x={-6} y={y} width={12} height={4} fill="#fbf8f2" />)}</g> },
  key: { word: 'key', art: () => <g transform="translate(0 -6)">
    <circle cx={-10} cy={-6} r={8} fill="none" stroke="#e0a92e" strokeWidth={4} /><rect x={-3} y={-8} width={22} height={4} fill="#e0a92e" /><rect x={13} y={-4} width={3} height={6} fill="#e0a92e" /><rect x={8} y={-4} width={3} height={5} fill="#e0a92e" /></g> },
  bus: { word: 'bus', art: () => <g transform="translate(0 -2)">
    <rect x={-22} y={-24} width={44} height={20} rx={4} fill="#e23b3b" />{[-16, -6, 4].map(x => <rect key={x} x={x} y={-21} width={8} height={7} fill="#cfe9f5" />)}
    <rect x={14} y={-21} width={6} height={13} fill="#cfe9f5" /><circle cx={-12} cy={-3} r={4.5} fill="#2b2b2e" /><circle cx={12} cy={-3} r={4.5} fill="#2b2b2e" /></g> },
  pen: { word: 'pen', art: () => <g transform="translate(0 -6) rotate(-25)">
    <rect x={-18} y={-3} width={30} height={7} rx={2} fill="#3d6fd1" /><path d="M12,-3 L20,0.5 L12,4Z" fill="#f3d6a4" /><path d="M18,-0.2 L20,0.5 18,1.2Z" fill="#222" /><rect x={-18} y={-3} width={6} height={7} fill="#2b4f9e" /></g> },
  car: { word: 'car', art: () => <g transform="translate(0 -2)">
    <path d="M-20,-6 L-20,-14 L-10,-16 L-4,-24 L10,-24 L16,-16 L20,-14 L20,-6Z" fill="#7cc9a8" />
    <path d="M-2,-22 L8,-22 L12,-16 L-6,-16Z" fill="#cfe9f5" /><circle cx={-11} cy={-4} r={5} fill="#2b2b2e" /><circle cx={11} cy={-4} r={5} fill="#2b2b2e" /></g> },
  robot: { word: 'robot', art: () => <g transform="translate(0 -2)">
    <rect x={-10} y={-24} width={20} height={16} rx={3} fill="#b5bcc0" /><rect x={-12} y={-40} width={24} height={15} rx={4} fill="#c9ced2" />
    <circle cx={-5} cy={-33} r={3} fill="#5eea6b" /><circle cx={5} cy={-33} r={3} fill="#5eea6b" /><line x1={0} y1={-40} x2={0} y2={-47} stroke="#9aa1a6" strokeWidth={2} /><circle cx={0} cy={-48} r={2.5} fill="#ef6f5e" />
    <rect x={-8} y={-8} width={5} height={8} fill="#9aa1a6" /><rect x={3} y={-8} width={5} height={8} fill="#9aa1a6" /></g> },
  kite: { word: 'kite', art: () => <g transform="translate(0 -8)">
    <path d="M0,-34 L14,-14 L0,6 L-14,-14Z" fill="#ef6f5e" /><path d="M0,-34 L0,6 M-14,-14 L14,-14" stroke="#fff" strokeWidth={1.5} />
    <path d="M0,6 q6,6 0,10 q-6,4 0,8" fill="none" stroke="#3b2a24" strokeWidth={1.5} /></g> },
  wand: { word: 'wand', art: () => <g transform="translate(0 -4) rotate(-30)">
    <rect x={-2} y={-24} width={4} height={26} rx={2} fill="#b58ee0" /><path d={'M0,-37 L3,-31 9,-30 4,-26 6,-19 0,-23 -6,-19 -4,-26 -9,-30 -3,-31Z'} fill="#ffd45e" /></g> },
  yoyo: { word: 'yo-yo', art: () => <g transform="translate(0 -14)"><circle r={11} fill="#5b9bd5" /><circle r={4} fill="#ffd45e" /><line x1={0} y1={-11} x2={0} y2={-26} stroke="#3b2a24" strokeWidth={1.5} /></g> },
  controller: { word: 'controller', art: () => <g transform="translate(0 -8)">
    <path d="M-20,-6 Q-22,-14 -12,-14 L12,-14 Q22,-14 20,-6 L18,6 Q16,12 10,8 L6,4 L-6,4 L-10,8 Q-16,12 -18,6Z" fill="#2b2b2e" />
    <path d="M-13,-8 v8 M-17,-4 h8" stroke="#7d848c" strokeWidth={2.6} strokeLinecap="round" />
    <circle cx={10} cy={-8} r={2.4} fill="#5b9bd5" /><circle cx={14} cy={-4} r={2.4} fill="#e23b3b" /><circle cx={6} cy={-4} r={2.4} fill="#ffd45e" /><circle cx={10} cy={0} r={2.4} fill="#7cc9a8" /></g> },
  tablet: { word: 'tablet', art: () => <g transform="translate(0 -6) rotate(-12)">
    <rect x={-20} y={-15} width={40} height={28} rx={4} fill="#3d6fd1" /><rect x={-17} y={-12} width={34} height={22} rx={2} fill="#bfe0f7" />
    <circle cx={6} cy={-2} r={5} fill="#fff" opacity={0.8} /><path d="M-12,6 l6,-6 4,4 6,-8 6,10Z" fill="#7cc9a8" opacity={0.8} /></g> },
  burger: { word: 'burger', art: it => <Burger layers={it.layers} /> },
  hotchoc: { word: 'hot chocolate', food: 'drink', art: () => <g transform="translate(0 -4)">
    <path d="M-12,-22 h22 l-2,20 q0,4 -4,4 h-10 q-4,0 -4,-4z" fill="#f3e6cf" stroke="#c9b48c" strokeWidth={1.5} /><path d="M10,-17 q8,0 8,6 q0,6 -9,6" fill="none" stroke="#c9b48c" strokeWidth={3} />
    <ellipse cx={-1} cy={-22} rx={11} ry={3.5} fill="#7a4a2a" /><path d="M-8,-24 q3,-9 7,-6 q4,-6 8,2 q-7,4 -15,4z" fill="#fffaf0" /></g> },
  coffee: { word: 'coffee', food: 'drink', art: () => <g transform="translate(0 -4)">
    <path d="M-10,-24 h20 l-3,24 h-14z" fill="#fbf8f2" stroke="#c9c2b4" /><rect x={-9} y={-16} width={18} height={8} fill="#2f6f6a" /><rect x={-12} y={-28} width={24} height={5} rx={2} fill="#3a3a3c" /></g> },
  juice: { word: 'juice', food: 'drink', art: () => <g transform="translate(0 -4)">
    <path d="M-10,-24 h20 l-2,24 h-16z" fill="#d4ecf0" opacity={0.7} /><path d="M-9,-17 h18 l-2,17 h-14z" fill="#f2a127" /><path d="M3,-30 l-2,18" stroke="#e85a7a" strokeWidth={3} strokeLinecap="round" /><circle cx={7} cy={-24} r={4} fill="#f7c948" stroke="#e0a92e" /></g> },
  water: { word: 'water', food: 'drink', art: () => <g transform="translate(0 -3)">
    <rect x={-7} y={-26} width={14} height={26} rx={5} fill="#bfe0f7" stroke="#8ec5ea" /><rect x={-4} y={-32} width={8} height={6} rx={2} fill="#3d8fe0" /><rect x={-7} y={-16} width={14} height={7} fill="#3d8fe0" /></g> },
  croissant: { word: 'croissant', food: 'food', art: () => <g transform="translate(0 -8)"><path d="M-20,4 Q0,-22 20,4 Q0,-6 -20,4Z" fill="#e3a54a" stroke="#c4863a" strokeWidth={1.5} />{[-8, 0, 8].map(d => <line key={d} x1={d} y1={-9} x2={d * 1.3} y2={0} stroke="#c4863a" strokeWidth={1.5} />)}</g> },
  cake: { word: 'cake', food: 'food', art: () => <g transform="translate(0 -4)"><path d="M-16,0 L-16,-14 L16,-20 L16,-6Z" fill="#f2e3b0" /><path d="M-16,-14 L16,-20 L4,-26 Z" fill="#f7c6d6" /><path d="M-16,-14 L-16,0 L16,-6 L16,-20" fill="none" stroke="#e3b06a" strokeWidth={1.5} /><rect x={-16} y={-9} width={32} height={3} fill="#e85a7a" transform="skewY(-10)" /><circle cx={4} cy={-28} r={3.5} fill="#e23b3b" /></g> },
  crisps: { word: 'crisps', food: 'food', art: () => <g transform="translate(0 -4) rotate(-8)"><path d="M-12,-28 h24 l-2,4 l2,22 l-2,4 h-20 l-2,-4 l2,-22z" fill="#e0524a" /><circle cx={0} cy={-13} r={7} fill="#f7c948" /><rect x={-10} y={-26} width={20} height={4} fill="#fff" opacity={0.6} /></g> },
  icecream: { word: 'ice cream', food: 'food', art: it => { const sc = (it.scoops && it.scoops.length ? it.scoops : ['strawberry']).slice(0, 3); const col = { strawberry: '#f7a9c4', vanilla: '#fff3d6', chocolate: '#8a5a3a', mint: '#a8e6c8' };
    return <g transform="translate(0 -2)"><path d="M-9,-16 L0,4 L9,-16Z" fill="#e3b06a" stroke="#c4863a" strokeWidth={1.2} /><path d="M-6,-12 l9,10 M0,-16 l6,7 M-3,-16 l-4,6" stroke="#c4863a" strokeWidth={1} />
      {sc.map((s, i) => <circle key={i} cx={0} cy={-20 - i * 11} r={10} fill={col[s] || '#f7a9c4'} stroke="rgba(0,0,0,.12)" />)}
      {it.sprinkles && sc.map((s, i) => [-4, 3, 0].map((d, k) => <rect key={i + '-' + k} x={d} y={-24 - i * 11 + k * 3} width={3} height={1.6} rx={0.8} fill={['#e23b3b', '#3d8fe0', '#ffd23f'][k]} />))}</g>; } },
  pizza: { word: 'pizza', food: 'food', art: () => <g transform="translate(0 -6)"><path d="M-16,-14 L16,-14 L0,12Z" fill="#f7c948" stroke="#e3a54a" strokeWidth={3} strokeLinejoin="round" />{[[-6, -9], [5, -8], [0, 0]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} fill="#c4433c" />)}</g> },
  biscuit: { word: 'biscuit', food: 'food', art: () => <g transform="translate(0 -8)"><circle r={13} fill="#e3b06a" stroke="#c4863a" strokeWidth={2} />{[[-5, -4], [4, -5], [0, 4], [6, 3], [-6, 5]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} fill="#7a4a2a" />)}</g> },
  apple: { word: 'apple', food: 'food', art: () => <g transform="translate(0 -12)"><circle cx={-4} cy={0} r={10} fill="#e23b3b" /><circle cx={4} cy={0} r={10} fill="#e23b3b" /><path d="M0,-9 q1,-6 4,-8" stroke="#6b4a2e" strokeWidth={2} fill="none" /><path d="M2,-12 q6,-4 9,0 q-5,3 -9,0z" fill="#5fbf6a" /></g> },
  shopping: { word: 'shopping', art: () => <g transform="translate(0 -2)"><rect x={-9} y={-30} width={8} height={12} rx={2} fill="#bfe0f7" /><circle cx={6} cy={-24} r={6} fill="#e23b3b" /><path d="M-16,-20 h32 l-3,20 h-26z" fill="#d8b484" stroke="#b08757" strokeWidth={1.5} /><path d="M-8,-20 q8,-8 16,0" fill="none" stroke="#b08757" strokeWidth={2} /></g> },
  spooky: { word: 'spooky box', art: () => <g transform="translate(0 -4)">
    <path d="M-20,-14 L0,-23 L20,-14 L0,-5Z" fill="#3b2a24" /><path d="M-20,-14 L0,-5 L0,16 L-20,7Z" fill="#f28a1c" /><path d="M20,-14 L0,-5 L0,16 L20,7Z" fill="#d8721a" />
    <path d="M-15,-2 l3,-4 3,4z M-8,1 l3,-4 3,4z" fill="#2b2b2e" /><path d="M-15,6 q5,4 11,1" stroke="#2b2b2e" strokeWidth={1.6} fill="none" />
    <g transform="translate(10 -27) scale(.45)"><path d="M0,-3 C3,-9 9,-9 13,-14 C13,-6 19,-5 24,-7 C20,0 15,4 8,3 C4,7 -4,7 -8,3 C-15,4 -20,0 -24,-7 C-19,-5 -13,-6 -13,-14 C-9,-9 -3,-9 0,-3Z" fill="#8e5ad1" /></g></g> },
  xmasbox: { word: 'Christmas box', art: () => <g transform="translate(0 -4)">
    <path d="M-20,-14 L0,-23 L20,-14 L0,-5Z" fill="#2f7d4a" /><path d="M-20,-14 L0,-5 L0,16 L-20,7Z" fill="#e23b3b" /><path d="M20,-14 L0,-5 L0,16 L20,7Z" fill="#c22e2e" />
    <path d="M-10,-9 L-10,12 M10,-9 L10,12" stroke="#f2c230" strokeWidth={4} /><path d="M-12,-19 L8,-10" stroke="#f2c230" strokeWidth={4} />
    <path d="M0,-21 q-9,-10 -12,-3 q3,5 12,3 q9,2 12,-3 q-3,-7 -12,3" fill="#f2c230" /></g> },
  bread: { word: 'bread', art: () => <g transform="translate(0 -4)">
    <path d="M-22,0 L-22,-14 Q-24,-28 -8,-28 L10,-28 Q26,-28 22,-14 L22,0Z" fill="#e3a54a" stroke="#b97c34" strokeWidth={1.5} />
    <path d="M-22,-14 Q-24,-28 -8,-28 L10,-28 Q26,-28 22,-14Z" fill="#f2c47a" />{[-10, 0, 10].map(x => <path key={x} d={`M${x - 3},-24 l6,-2`} stroke="#b97c34" strokeWidth={2} strokeLinecap="round" />)}</g> },
  uniform: { word: 'uniform', art: () => <g transform="translate(0 -6)"><path d="M-14,-24 L14,-24 L22,-12 L15,-8 L13,8 L-13,8 L-15,-8 L-22,-12Z" fill="#3f6e9a" /><path d="M-6,-24 L0,-16 L6,-24Z" fill="#fff" /><path d="M-13,8 L13,8 L16,18 L-16,18Z" fill="#5b5f66" /></g> },
  tree: { word: 'tree', art: () => <g transform="translate(0 -2) scale(.17)"><path d="M0,-280 L60,-176 Q30,-166 0,-174 Q-30,-166 -60,-176Z M0,-218 L84,-112 Q40,-102 0,-110 Q-40,-102 -84,-112Z M0,-150 L105,-44 Q50,-34 0,-42 Q-50,-34 -105,-44Z" fill="#2f7d4a" /><rect x={-14} y={-44} width={28} height={44} fill="#c23b3b" /><path d="M0,-306 L7,-289 25,-288 11,-276 16,-258 0,-268 -16,-258 -11,-276 -25,-288 -7,-289Z" fill="#ffd23f" />{[[-40, -70], [30, -64], [-20, -140], [24, -130], [0, -200]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={['#e23b3b', '#f2c230', '#3d8fe0', '#f06aa8', '#e23b3b'][i]} />)}</g> },
  parcel: { word: 'box', art: () => <g transform="translate(0 -2)">
    <path d="M-22,-10 L0,-20 L22,-10 L0,0Z" fill="#d8b484" /><path d="M-22,-10 L0,0 L0,22 L-22,12Z" fill="#c49c69" transform="translate(0 -22)" />
    <path d="M22,-10 L0,0 L0,22 L22,12Z" fill="#b08757" transform="translate(0 -22)" /><path d="M-11,-15 L11,-5" stroke="#e86a92" strokeWidth={4} transform="translate(0 -22)" /></g> },
};
const LAYER = { burger: ['#7a4a2a', 7], cheese: ['#f7c948', 3], tomato: ['#e23b3b', 3], lettuce: ['#7cc96a', 3], ketchup: ['#c4304f', 2], onion: ['#f2e6f0', 2] };
export function Burger({ layers = [] }) {
  let y = -5;
  return <g>
    <path d="M-17,0 Q-17,-5 -14,-5 L14,-5 Q17,-5 17,0Z" fill="#e2a95e" />
    {layers.map((l, i) => { const [col, h] = LAYER[l] || ['#999', 3]; y -= h; return <rect key={i} x={-18} y={y} width={36} height={h + 0.5} rx={h / 2} fill={col} />; })}
    <path d={`M-17,${y} Q-17,${y - 16} 0,${y - 16} Q17,${y - 16} 17,${y}Z`} fill="#e9b46a" />
    {[-8, 0, 7].map(x => <ellipse key={x} cx={x} cy={y - 9} rx={1.6} ry={1} fill="#fff6d8" />)}
  </g>;
}
export const BURGER_LAYERS = Object.keys(LAYER);
export const SURPRISES = ['robot', 'kite', 'wand', 'yoyo'];
export const HUNT_ORDER = ['bus', 'duck', 'cup', 'key', 'pen', 'sock', 'hat', 'car'];

export function ItemArt({ it, s = 1 }) {
  const k = KINDS[it.kind] || KINDS.bear;
  return <g transform={`scale(${s})`}>{k.art(it)}</g>;
}
export function ItemIcon({ it, size = 44 }) {
  return <svg viewBox="-30 -52 60 60" width={size} height={size} aria-hidden="true"><ItemArt it={it} /></svg>;
}
