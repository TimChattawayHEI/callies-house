// The family: body shapes, outfits, dress-up options and the drawing code.
import React from 'react';
import { shade, lum } from './core.js';

export const STAR_D = 'M0,-9 L3,-3 9,-2 4,2 6,9 0,5 -6,9 -4,2 -9,-2 -3,-3Z';
export const HEART_D = 'M0,10 C-13,1 -10,-10 0,-3 C10,-10 13,1 0,10Z';
const BOLT_D = 'M2,-10 L-5,1 0,1 -3,10 5,-2 0,-2Z';
const RAINBOW = ['#ff8f8f', '#ffc46b', '#fff08a', '#9be3a4', '#8ec5ea', '#c7b6e6'];

// Body measurements in screen pixels at room scale (1 world unit = 88px tall). Callie ~1.2m, Chloe ~1.45m, adults 1.65-1.8m.
export const BODY = {
  callie: { L: 34, T: 40, R: 22, sw: 30, hw: 30, legW: 9, skin: '#f6d2b8', hair: 'pony', kid: true },
  chloe: { L: 46, T: 48, R: 22, sw: 32, hw: 30, legW: 9, skin: '#f3cfb3', hair: 'long', glasses: true, kid: true },
  mum: { L: 68, T: 58, R: 20, sw: 38, hw: 36, legW: 10, skin: '#f6d6c0', hair: 'long', glasses: true },
  dad: { L: 72, T: 64, R: 21, sw: 46, hw: 40, legW: 12, skin: '#f0c9a8', hair: 'bald', glasses: true, beard: '#6b4a2e' },
  connor: { L: 76, T: 62, R: 20, sw: 34, hw: 30, legW: 9, skin: '#f3d3bb', hair: 'short' },
  nanny: { L: 58, T: 56, R: 21, sw: 36, hw: 42, legW: 10, skin: '#f6d6c0', hair: 'long', neckGlasses: true },
  grandad: { L: 64, T: 60, R: 21, sw: 42, hw: 40, legW: 11, skin: '#f0c9a8', hair: 'curtains', glasses: true },
};
export const HAIR = { callie: '#c49a5e', chloe: '#6b4a33', mum: '#b5452a', dad: '#6b4a2e', connor: '#e7c983', nanny: '#dcd8d0', grandad: '#c3bfb7' };
export const NAMES = { callie: 'Callie', chloe: 'Chloe', mum: 'Mum', dad: 'Dad', connor: 'Connor', nanny: 'Nanny', grandad: 'Grandad' };

export const DEFAULT_OUTFITS = {
  callie: { top: 'dress', color: '#e86a92', pattern: 'plain', hair: '#c49a5e', legs: '#9b7cc4', bottom: 'leggings', shoes: '#e96d9a', acc: 'none' },
  chloe: { top: 'flannel', color: '#3f5e3a', pattern: 'check', legs: '#4f6d8f', bottom: 'ripped', shoes: '#2b2b2e', boots: true, feet: 'shoes', acc: 'none' },
  mum: { top: 'jumper', color: '#2f7f86', pattern: 'plain', legs: '#3d4f6b', bottom: 'jeans', shoes: '#fbf8f2', acc: 'none' },
  dad: { top: 'tee', color: '#3d3f6b', pattern: 'plain', legs: '#4f6d8f', bottom: 'jeans', shoes: '#2b2b2e', acc: 'none' },
  connor: { top: 'hoodie', color: '#2b2b2e', pattern: 'plain', legs: '#7d848c', bottom: 'joggers', shoes: '#fbf8f2', acc: 'headset' },
  nanny: { top: 'dress', color: '#c25a7a', pattern: 'spots', legs: '#e8d6c8', bottom: 'jeans', shoes: '#6b4a2e', acc: 'none' },
  grandad: { top: 'jumper', color: '#7a8f5a', pattern: 'plain', legs: '#5b5f66', bottom: 'jeans', shoes: '#4a3020', acc: 'none' },
};

const BRIGHT = ['#e86a92', '#5b9bd5', '#7cc9a8', '#f2b84b', '#b58ee0', '#ef6f5e', '#ffffff', '#3d3f6b'];
const GRUNGE = ['#2b2b2e', '#4a4f57', '#7d848c', '#2f4a6b', '#4f6d8f', '#3f5e3a', '#6b7f4a', '#4b3566', '#6e4f8c'];
const ADULT = ['#2f7f86', '#3d3f6b', '#b5452a', '#e7c46a', '#7cc9a8', '#e86a92', '#fbf8f2', '#2b2b2e', '#6b2236', '#5b9bd5'];
const DENIM = ['#4f6d8f', '#2f4a6b', '#2b2b2e', '#7d848c', '#3f5e3a', '#4b3566'];
export const OPTIONS = {
  callie: {
    top: ['dress', 'tee', 'hoodie'], color: BRIGHT, pattern: ['plain', 'stripes', 'spots', 'stars', 'hearts', 'rainbow'],
    hair: ['#c49a5e', '#d8b26e', '#e2c48a', '#9c7044', '#5a3a26', '#2b1d16', '#e07a4f', '#f49ac1'],
    legs: ['#9b7cc4', '#e86a92', '#5b9bd5', '#7cc9a8', '#3d3f6b', '#ffffff', '#f2b84b'],
    shoes: ['#e96d9a', '#f2b84b', '#ffffff', '#3d3f6b', '#ef6f5e', '#7cc9a8', '#b58ee0'],
    acc: ['none', 'bow', 'crown', 'ears', 'flower', 'horn', 'glasses', 'witch'],
  },
  chloe: {
    top: ['flannel', 'hoodie', 'tee', 'jumper'], color: GRUNGE, pattern: ['plain', 'stripes', 'check', 'bolt'],
    legs: DENIM, bottom: ['ripped', 'jeans'], feet: ['shoes', 'bare'], shoes: ['#2b2b2e', '#4a4f57', '#4b3566', '#2f4a6b', '#3f5e3a'],
    acc: ['none', 'beanie', 'headphones'],
  },
  mum: {
    top: ['jumper', 'tee', 'dress', 'flannel'], color: ADULT.concat(['#d9a55b']), pattern: ['plain', 'leopard', 'stripes', 'spots', 'check'],
    bottom: ['jeans', 'leopard'], legs: DENIM.concat(['#b5452a', '#d9a55b']), shoes: ['#fbf8f2', '#2b2b2e', '#b5452a', '#e7c46a', '#5b9bd5'],
    acc: ['none', 'flower', 'crown', 'ears', 'horn', 'witch', 'bow'],
  },
  dad: {
    top: ['tee', 'hoodie', 'flannel', 'jumper'], color: ADULT, pattern: ['plain', 'stripes', 'check', 'spots'],
    legs: DENIM.concat(['#c9a16a']), shoes: ['#2b2b2e', '#fbf8f2', '#8a5a33', '#5b9bd5'],
    acc: ['none', 'cap', 'beanie', 'crown', 'horn', 'ears', 'party', 'witch'],
  },
  connor: {
    top: ['hoodie', 'tee'], color: GRUNGE.concat(['#5b9bd5', '#ef6f5e']), pattern: ['plain', 'stripes', 'bolt'],
    legs: ['#7d848c', '#2b2b2e', '#2f4a6b', '#3f5e3a'], shoes: ['#fbf8f2', '#2b2b2e', '#ef6f5e'],
    acc: ['headset', 'cap', 'crown', 'none'],
  },
};
export const LABELS = {
  dress: 'Dress', tee: 'T-shirt', hoodie: 'Hoodie', flannel: 'Shirt', jumper: 'Jumper',
  plain: 'Plain', stripes: 'Stripes', spots: 'Spots', stars: 'Stars', hearts: 'Hearts', rainbow: 'Rainbow', check: 'Check', bolt: 'Bolt',
  none: 'Nothing', bow: 'Bow', crown: 'Crown', ears: 'Cat ears', flower: 'Flower', horn: 'Unicorn horn', glasses: 'Heart glasses', witch: 'Witch hat',
  beanie: 'Beanie', leopard: 'Leopard', gown: 'Long dress', tutu: 'Tutu', jacket: 'Jacket', dungas: 'Dungarees', kit: 'Football top', dino: 'Dino', unicorn: 'Unicorn', flowers: 'Flowers', glitter: 'Glitter', tiedye: 'Tie-dye', zebra: 'Zebra', bee: 'Bee', xmas: 'Christmas', pumpkin: 'Pumpkin', skull: 'Skull', pad: 'Gamer', scales: 'Mermaid', skirt: 'Skirt', shorts: 'Shorts', leggings: 'Leggings', rainbowL: 'Rainbow', joggers: 'Joggers', shoe: 'Shoes', trainers: 'Trainers', boots: 'Boots', wellies: 'Wellies', sandals: 'Sandals', slippers: 'Slippers', sparkle: 'Light-up shoes', sunhat: 'Sun hat', bobble: 'Bobble hat', tiara: 'Tiara', cowboy: 'Cowboy hat', santa: 'Santa hat', tophat: 'Top hat', bunny: 'Bunny ears', capblue: 'Blue cap', cappink: 'Pink cap', capgreen: 'Green cap', sun: 'Sunglasses', star: 'Star glasses', heart: 'Heart glasses', nerd: 'Big glasses', shoes: 'Boots on', bare: 'Bare feet', headphones: 'Headphones', cap: 'Cap', party: 'Party hat', headset: 'Headset', ripped: 'Ripped jeans', jeans: 'Jeans',
};

/* ---------------- patterns ---------------- */
// a leopard rosette: a broken dark ring round a slightly darker middle
export function Rosette({ x, y, s = 1, base, k = 0 }) {
  return <g transform={`translate(${x} ${y}) rotate(${(k * 73) % 360}) scale(${s})`}>
    <ellipse rx={2.3} ry={1.9} fill={shade(base, -0.16)} />
    <path d="M-3.4,-0.6 A3.4,3 0 0 1 0.6,-3 M2.6,-1.8 A3.4,3 0 0 1 2.2,2.4 M0.6,3 A3.4,3 0 0 1 -3.1,1.2" fill="none" stroke="#3b2a1c" strokeWidth={1.5} strokeLinecap="round" />
  </g>;
}

export function Pattern({ kind, color, clipId, box, scale = 1, T = 0 }) {
  if (!kind || kind === 'plain') return null;
  const [x0, y0, x1, y1] = box;
  const ink = lum(color) > 0.62 ? shade(color, -0.32) : 'rgba(255,255,255,.72)';
  const els = [];
  if (kind === 'stripes') for (let y = y0 + 3, k = 0; y < y1; y += 11 * scale, k++) els.push(<rect key={k} x={x0 - 2} y={y} width={x1 - x0 + 4} height={4.5 * scale} fill={ink} />);
  if (kind === 'rainbow') { const h = (y1 - y0) / RAINBOW.length; RAINBOW.forEach((c, k) => els.push(<rect key={k} x={x0 - 2} y={y0 + k * h} width={x1 - x0 + 4} height={h + 0.5} fill={c} />)); }
  if (kind === 'check') {
    const dark = lum(color) > 0.4 ? shade(color, -0.35) : shade(color, 0.35), red = '#8c2f2f';
    for (let y = y0, k = 0; y < y1; y += 12 * scale, k++) els.push(<rect key={'h' + k} x={x0 - 2} y={y} width={x1 - x0 + 4} height={5 * scale} fill={dark} opacity={0.75} />);
    for (let x = x0, k = 0; x < x1; x += 12 * scale, k++) els.push(<rect key={'v' + k} x={x} y={y0 - 2} width={5 * scale} height={y1 - y0 + 4} fill={dark} opacity={0.6} />);
    for (let y = y0 + 8 * scale, k = 0; y < y1; y += 24 * scale, k++) els.push(<rect key={'r' + k} x={x0 - 2} y={y} width={x1 - x0 + 4} height={1.6 * scale} fill={red} opacity={0.7} />);
  }
  const cx0 = (x0 + x1) / 2, cy0 = y0 + (y1 - y0) * 0.4, motif = (k, el) => els.push(<g key={k} transform={`translate(${cx0} ${cy0}) scale(${scale})`}>{el}</g>);
  if (kind === 'bee') for (let y = y0 + 4, k = 0; y < y1; y += 10 * scale, k++) els.push(<rect key={k} x={x0 - 2} y={y} width={x1 - x0 + 4} height={4.5 * scale} fill="#2b2b2e" />);
  if (kind === 'zebra') for (let i = 0, x = x0 - 10; x < x1 + 10; x += 9 * scale, i++) els.push(<path key={i} d={`M${x},${y0 - 2} q6,${(y1 - y0) * 0.25} 0,${(y1 - y0) * 0.5} q-6,${(y1 - y0) * 0.25} 2,${(y1 - y0) * 0.5 + 4}`} fill="none" stroke="#2b2b2e" strokeWidth={3.2 * scale} />);
  if (kind === 'flowers') { const step = 15 * scale; let k = 0; for (let y = y0 + 6, r = 0; y < y1 + 4; y += step, r++) for (let x = x0 + (r % 2 ? step / 2 : 3); x < x1 + 4; x += step, k++) els.push(<g key={k} transform={`translate(${x} ${y}) scale(${scale * 0.9})`}>{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 3.2} cy={Math.sin(a * Math.PI / 180) * 3.2} r={2.6} fill={k % 2 ? '#fff' : '#ffb3cf'} />)}<circle r={1.8} fill="#ffd23f" /></g>); }
  if (kind === 'glitter') for (let k = 0; k < 40; k++) { const x = x0 + ((k * 37) % 100) / 100 * (x1 - x0), y = y0 + ((k * 61) % 100) / 100 * (y1 - y0), tw = 0.4 + 0.6 * Math.abs(Math.sin(T * 3 + k)); els.push(<path key={k} d={`M${x},${y - 2.2} L${x + 0.7},${y - 0.7} ${x + 2.2},${y} ${x + 0.7},${y + 0.7} ${x},${y + 2.2} ${x - 0.7},${y + 0.7} ${x - 2.2},${y} ${x - 0.7},${y - 0.7}Z`} fill={k % 3 ? '#fff' : '#ffd45e'} opacity={tw} />); }
  if (kind === 'scales') { const step = 7 * scale; for (let y = y0, r = 0; y < y1 + 6; y += step * 0.75, r++) for (let x = x0 - 4 + (r % 2 ? step / 2 : 0); x < x1 + 6; x += step) els.push(<path key={x + '-' + y} d={`M${x - step / 2},${y} a${step / 2},${step / 2} 0 0 0 ${step},0`} fill="none" stroke={shade(color, 0.3)} strokeWidth={1.4} />); }
  if (kind === 'tiedye') ['#ff8fbf', '#ffd45e', '#8ec5ea', '#9be3a4', '#c7b6e6'].forEach((c, i) => els.push(<circle key={i} cx={cx0} cy={cy0 + 4} r={(5 - i) * 7 * scale} fill={c} opacity={0.75} />));
  if (kind === 'dino') motif('d', <path d="M-12,8 L-12,2 Q-12,-6 -2,-6 L4,-6 L6,-12 Q10,-15 13,-11 L12,-6 L14,-4 L10,-3 L9,2 L12,8 L7,8 L5,4 L-6,4 L-7,8Z M-12,2 L-18,6 L-12,4Z" fill={lum(color) > 0.55 ? '#3f8a5a' : '#9be3a4'} />);
  if (kind === 'skull') motif('s', <g><path d="M-8,0 Q-8,-11 0,-11 Q8,-11 8,0 L5,3 L5,7 L-5,7 L-5,3Z" fill="#fbf8f2" /><circle cx={-3.2} cy={-2} r={2.2} fill="#2b2b2e" /><circle cx={3.2} cy={-2} r={2.2} fill="#2b2b2e" /><path d="M-2,5 V7 M0,5 V7 M2,5 V7" stroke="#2b2b2e" strokeWidth={0.8} /></g>);
  if (kind === 'pad') motif('p', <g><path d="M-12,-3 Q-13,-8 -7,-8 L7,-8 Q13,-8 12,-3 L11,4 Q10,8 6,6 L3,3 L-3,3 L-6,6 Q-10,8 -11,4Z" fill={lum(color) > 0.4 ? '#2b2b2e' : '#fbf8f2'} /><path d="M-8,-4 v5 M-10.5,-1.5 h5" stroke={lum(color) > 0.4 ? '#fbf8f2' : '#2b2b2e'} strokeWidth={1.6} /><circle cx={6} cy={-3} r={1.4} fill="#e23b3b" /><circle cx={8.6} cy={-0.6} r={1.4} fill="#5b9bd5" /></g>);
  if (kind === 'pumpkin') motif('pk', <g><ellipse rx={10} ry={8} fill="#f28a1c" /><path d="M-5,-2 l2,-4 2,4z M3,-2 l2,-4 2,4z M-5,3 q5,4 10,0" fill="#3b2a24" /><rect x={-1} y={-11} width={2.4} height={4} fill="#5b7a2e" /></g>);
  if (kind === 'xmas') { for (let x = x0, k = 0; x < x1; x += 7 * scale, k++) els.push(<path key={'z' + k} d={`M${x},${y1 - 9 * scale} l${3.5 * scale},${-4 * scale} l${3.5 * scale},${4 * scale}`} fill="none" stroke="#fbf8f2" strokeWidth={1.6} />); motif('t', <g><path d="M0,-12 L7,-2 L4,-2 L9,6 L-9,6 L-4,-2 L-7,-2Z" fill="#2f7d4a" /><rect x={-1.5} y={6} width={3} height={3} fill="#7a4a2a" /><path d="M0,-15 l1.2,2.5 2.6,0.3 -2,1.8 0.6,2.6 -2.4,-1.3 -2.4,1.3 0.6,-2.6 -2,-1.8 2.6,-0.3Z" fill="#ffd23f" /><circle cx={-3} cy={1} r={1.2} fill="#e23b3b" /><circle cx={3} cy={-3} r={1.2} fill="#ffd23f" /></g>); }
  if (kind === 'unicorn') motif('u', <g><path d="M-8,8 Q-10,-2 -4,-6 L4,-9 Q10,-6 9,0 L6,2 L1,0 L-1,8Z" fill="#fbf8f2" /><path d="M3,-9 L8,-18 L6,-8Z" fill="#ffd45e" /><path d="M-4,-6 Q-10,-4 -9,4 M-2,-7 Q-8,-8 -10,-2" stroke="#ff8fbf" strokeWidth={2.4} fill="none" /><circle cx={4} cy={-4} r={1} fill="#2b2b2e" /></g>);
  if (kind === 'leopard') {
    const step = 11 * scale; let k = 0;
    for (let y = y0 + 4, r = 0; y < y1 + 4; y += step, r++) for (let x = x0 + (r % 2 ? step / 2 : 1); x < x1 + 4; x += step, k++) els.push(<Rosette key={k} x={x + ((k * 37) % 5) - 2} y={y + ((k * 53) % 5) - 2} s={scale * (0.85 + ((k * 29) % 4) / 10)} base={color} k={k} />);
  }
  if (kind === 'bolt') { const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * 0.38; els.push(<path key="b" d={BOLT_D} transform={`translate(${cx} ${cy}) scale(${1.15 * scale})`} fill={lum(color) > 0.5 ? '#2b2b2e' : '#e7d36a'} />); }
  if (kind === 'spots' || kind === 'stars' || kind === 'hearts') {
    const step = (kind === 'spots' ? 11 : 15) * scale;
    for (let y = y0 + 5, r = 0; y < y1 + 4; y += step, r++) for (let x = x0 + (r % 2 ? step / 2 : 2); x < x1 + 4; x += step) {
      const key = `${x}-${y}`;
      if (kind === 'spots') els.push(<circle key={key} cx={x} cy={y} r={2.7 * scale} fill={ink} />);
      else els.push(<path key={key} d={kind === 'stars' ? STAR_D : HEART_D} transform={`translate(${x} ${y}) scale(${0.44 * scale})`} fill={ink} />);
    }
  }
  return <g clipPath={`url(#${clipId})`}>{els}</g>;
}

/* ---------------- shoes ---------------- */
export const SHOE_STYLES = ['shoe', 'trainers', 'boots', 'wellies', 'sandals', 'slippers', 'sparkle'];
export function Shoe({ style, c, L, w, skin, T = 0 }) {
  const sole = <ellipse cx={2} cy={L + 1} rx={w * 0.85} ry={4.8} fill={c} />;
  switch (style) {
    case 'trainers': return <g>{sole}<path d={`M${-w * 0.7},${L + 4} L${w + 2},${L + 4}`} stroke="#fbf8f2" strokeWidth={2.2} strokeLinecap="round" /><circle cx={3} cy={L - 1} r={1.2} fill="#fbf8f2" /><circle cx={6} cy={L} r={1.2} fill="#fbf8f2" /></g>;
    case 'sparkle': { const lit = ['#ff5c9a', '#5eea6b', '#5bb8ff', '#ffd23f'][Math.floor(T * 6) % 4]; return <g>{sole}<path d={`M${-w * 0.7},${L + 4} L${w + 2},${L + 4}`} stroke={lit} strokeWidth={2.6} strokeLinecap="round" /><circle cx={-w * 0.55} cy={L + 2} r={2.2} fill={lit} /></g>; }
    case 'boots': return <g><rect x={-w / 2 - 1} y={L - 10} width={w + 2} height={12} rx={3} fill={c} /><ellipse cx={2.5} cy={L + 1} rx={w * 0.85} ry={4.5} fill={c} /><line x1={-w / 2} x2={w} y1={L + 3} y2={L + 3} stroke="#e7c46a" strokeWidth={1.2} /></g>;
    case 'wellies': return <g><rect x={-w / 2 - 1.5} y={L * 0.55} width={w + 3} height={L * 0.45 + 2} rx={2.5} fill={c} /><ellipse cx={2.5} cy={L + 1.5} rx={w * 0.9} ry={4.6} fill={c} /><rect x={-w / 2} y={L * 0.6} width={2} height={L * 0.3} rx={1} fill="#fff" opacity={0.35} /></g>;
    case 'sandals': return <g><ellipse cx={2} cy={L + 1} rx={w * 0.8} ry={4.2} fill={skin} /><ellipse cx={2} cy={L + 3.5} rx={w * 0.9} ry={2} fill={c} /><path d={`M${-w / 2},${L - 1} L${w / 2 + 2},${L + 1} M0,${L - 2} L${w},${L - 1}`} stroke={c} strokeWidth={1.8} /></g>;
    case 'slippers': return <g><ellipse cx={2} cy={L + 1} rx={w * 0.95} ry={5.6} fill={c} /><ellipse cx={4} cy={L - 6} rx={1.8} ry={5} fill={c} transform={`rotate(-12 4 ${L - 6})`} /><ellipse cx={8} cy={L - 6} rx={1.8} ry={5} fill={c} transform={`rotate(12 8 ${L - 6})`} /><circle cx={9} cy={L} r={1.1} fill="#2b2b2e" /><circle cx={12} cy={L + 1.5} r={1.4} fill="#f39ac6" /></g>;
    default: return sole;
  }
}
/* ---------------- sunglasses and fun glasses ---------------- */
export const SPECS = ['none', 'sun', 'star', 'heart', 'nerd'];
export function Specs({ kind }) {
  if (!kind || kind === 'none') return null;
  if (kind === 'sun') return <g><rect x={-18} y={-5} width={16} height={11} rx={4} fill="#2b2b2e" /><rect x={2} y={-5} width={16} height={11} rx={4} fill="#2b2b2e" /><path d="M-2,-1 L2,-1 M-18,-2 L-27,-4 M18,-2 L27,-4" stroke="#2b2b2e" strokeWidth={2.5} /><rect x={-15} y={-3} width={5} height={2.5} rx={1} fill="#fff" opacity={0.5} /></g>;
  if (kind === 'star') return <g>{[-9.5, 10.5].map(x => <path key={x} transform={`translate(${x} 1) scale(1.15)`} d={STAR_D} fill="#ffd45e" stroke="#e86a92" strokeWidth={2} strokeLinejoin="round" />)}<path d="M-1.5,0 L1.5,0" stroke="#e86a92" strokeWidth={2.5} /></g>;
  if (kind === 'heart') return <g>{[-9.5, 10.5].map(x => <path key={x} transform={`translate(${x} 1) scale(1.0)`} d={HEART_D} fill="#ff5c9a" opacity={0.92} />)}</g>;
  if (kind === 'nerd') return <g fill="rgba(255,255,255,.2)" stroke="#2b2b2e" strokeWidth={3.4}><rect x={-19} y={-7} width={17} height={15} rx={3} /><rect x={2} y={-7} width={17} height={15} rx={3} /><path d="M-2,-1 L2,-1" /></g>;
  return null;
}

/* ---------------- accessories (drawn relative to head centre, scaled to head radius) ---------------- */
export function Accessory({ kind, back, hairD, R = 27 }) {
  const s = R / 27;
  const g = inner => <g transform={`scale(${s})`}>{inner}</g>;
  switch (kind) {
    case 'bow': return g(<g transform="translate(19 -27) rotate(22)"><path d="M0,0 L-13,-9 L-13,9Z" fill="#e96d9a" /><path d="M0,0 L13,-9 L13,9Z" fill="#e96d9a" /><circle r={4.5} fill="#c94f7e" /></g>);
    case 'crown': return g(<g>
      <path d="M-17,-26 L-19,-47 L-9,-36 L0,-51 L9,-36 L19,-47 L17,-26Z" fill="#ffd45e" stroke="#e0a92e" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={-9} cy={-31} r={2.6} fill="#ff8fbf" /><circle cx={0} cy={-31} r={2.6} fill="#8ec5ea" /><circle cx={9} cy={-31} r={2.6} fill="#ff8fbf" /></g>);
    case 'ears': return g(<g>
      <path d="M-28,-12 L-25,-48 L-6,-31Z" fill={hairD} /><path d="M-23,-19 L-22,-40 L-11,-30Z" fill="#f6b6c8" />
      <path d="M28,-12 L25,-48 L6,-31Z" fill={hairD} /><path d="M23,-19 L22,-40 L11,-30Z" fill="#f6b6c8" /></g>);
    case 'flower': return g(<g transform="translate(-21 -25)">
      {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 6} cy={Math.sin(a * Math.PI / 180) * 6} r={5.5} fill="#ff9ec4" />)}
      <circle r={4} fill="#ffd45e" /></g>);
    case 'horn': return g(<g>
      <path d="M-7,-30 L0,-68 L7,-30Z" fill="#ffe7a3" stroke="#e0b94e" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M-5,-38 L5,-42 M-4,-47 L4,-51 M-2,-56 L3,-59" stroke="#e0b94e" strokeWidth={1.5} /></g>);
    case 'glasses': return back ? null : g(<g>
      <path d={HEART_D} transform="translate(-9 3) scale(.95)" fill="#ff5c9a" opacity={0.92} />
      <path d={HEART_D} transform="translate(10 3) scale(.95)" fill="#ff5c9a" opacity={0.92} /></g>);
    case 'witch': return g(<g>
      <ellipse cx={0} cy={-24} rx={36} ry={8} fill="#3b2a4f" />
      <path d="M-18,-26 L4,-78 L16,-26Z" fill="#4b3566" stroke="#3b2a4f" strokeWidth={2} strokeLinejoin="round" />
      <rect x={-17} y={-34} width={33} height={7} fill="#ffd45e" /></g>);
    case 'beanie': return g(<g>
      <path d="M-29,-12 C-30,-44 30,-44 29,-12Z" fill="#3a3d44" />
      <rect x={-30} y={-16} width={60} height={9} rx={4} fill="#2b2b2e" />
      {[-20, -10, 0, 10, 20].map(x => <line key={x} x1={x} x2={x} y1={-15} y2={-8} stroke="#4a4f57" strokeWidth={2} />)}</g>);
    case 'headphones': return g(<g>
      <path d="M-27,-6 C-30,-42 30,-42 27,-6" fill="none" stroke="#2b2b2e" strokeWidth={5} />
      <rect x={-33} y={-12} width={10} height={18} rx={4} fill="#4b3566" /><rect x={23} y={-12} width={10} height={18} rx={4} fill="#4b3566" /></g>);
    case 'headset': return g(<g>
      <path d="M-27,-6 C-30,-42 30,-42 27,-6" fill="none" stroke="#222" strokeWidth={5} />
      <rect x={-33} y={-12} width={10} height={18} rx={4} fill="#3a3d44" /><rect x={23} y={-12} width={10} height={18} rx={4} fill="#3a3d44" />
      {!back && <path d="M-28,4 Q-24,22 -8,20" fill="none" stroke="#222" strokeWidth={3} />}{!back && <circle cx={-7} cy={20} r={3} fill="#5eea6b" />}</g>);
    case 'cap': return g(<g>
      <path d="M-28,-14 C-28,-44 28,-44 28,-14Z" fill="#c94f4f" />
      {!back && <path d="M-6,-16 Q22,-20 40,-12 L38,-8 Q16,-12 -6,-10Z" fill="#a83c3c" />}
      <circle cx={0} cy={-41} r={3} fill="#a83c3c" /></g>);
    case 'sunhat': return g(<g><ellipse cx={0} cy={-22} rx={44} ry={10} fill="#f2d48a" stroke="#d9b45a" strokeWidth={1.5} /><path d="M-22,-24 C-22,-50 22,-50 22,-24Z" fill="#f6dc96" /><rect x={-22} y={-30} width={44} height={6} fill="#e86a92" />{!back && <circle cx={16} cy={-28} r={5} fill="#ff9ec4" />}</g>);
    case 'bobble': return g(<g><path d="M-29,-10 C-30,-46 30,-46 29,-10Z" fill="#5b9bd5" /><rect x={-30} y={-16} width={60} height={10} rx={4} fill="#fbf8f2" />{[-18, -6, 6, 18].map(x => <path key={x} d={`M${x},-38 l4,8 -4,8`} fill="none" stroke="#fbf8f2" strokeWidth={2} />)}<circle cx={0} cy={-46} r={9} fill="#fbf8f2" /></g>);
    case 'tiara': return g(<g><path d="M-18,-26 L-12,-38 L-6,-30 L0,-44 L6,-30 L12,-38 L18,-26Z" fill="#dfe6ee" stroke="#a9b6c4" strokeWidth={1.5} strokeLinejoin="round" /><circle cx={0} cy={-35} r={3.4} fill="#ff5c9a" /><circle cx={-12} cy={-31} r={2} fill="#8ec5ea" /><circle cx={12} cy={-31} r={2} fill="#8ec5ea" /></g>);
    case 'cowboy': return g(<g><path d="M-44,-20 Q-40,-12 -26,-16 L26,-16 Q40,-12 44,-20 Q40,-26 26,-24 L-26,-24 Q-40,-26 -44,-20Z" fill="#9a6a3a" /><path d="M-22,-22 C-24,-52 -8,-46 0,-50 C8,-46 24,-52 22,-22Z" fill="#a8763f" /><rect x={-22} y={-28} width={44} height={6} fill="#5a3a22" /></g>);
    case 'santa': return g(<g><path d="M-28,-14 C-24,-50 18,-58 34,-30 L26,-26 C18,-42 -8,-40 -16,-16Z" fill="#d9363e" /><rect x={-31} y={-20} width={62} height={10} rx={5} fill="#fbf8f2" /><circle cx={32} cy={-26} r={7} fill="#fbf8f2" /></g>);
    case 'tophat': return g(<g><ellipse cx={0} cy={-24} rx={34} ry={7} fill="#2b2b2e" /><rect x={-18} y={-66} width={36} height={42} rx={3} fill="#2b2b2e" /><rect x={-18} y={-34} width={36} height={7} fill="#c94f4f" /></g>);
    case 'bunny': return g(<g>{[-1, 1].map(k => <g key={k} transform={`translate(${k * 12} -26) rotate(${k * 12})`}><ellipse cx={0} cy={-22} rx={8} ry={22} fill="#fbf8f2" stroke="#e2d9cc" strokeWidth={1.5} /><ellipse cx={0} cy={-20} rx={4} ry={15} fill="#f6b6c8" /></g>)}<path d="M-26,-14 C-26,-34 26,-34 26,-14" fill="none" stroke="#e86a92" strokeWidth={5} /></g>);
    case 'capblue': case 'cappink': case 'capgreen': { const c = { capblue: '#3f6e9a', cappink: '#e86a92', capgreen: '#3f8a5a' }[kind]; return g(<g>
      <path d="M-28,-14 C-28,-44 28,-44 28,-14Z" fill={c} />
      {!back && <path d="M-6,-16 Q22,-20 40,-12 L38,-8 Q16,-12 -6,-10Z" fill={shade(c, -0.18)} />}
      <circle cx={0} cy={-41} r={3} fill={shade(c, -0.18)} /></g>); }
    case 'party': return g(<g>
      <path d="M-14,-26 L2,-74 L16,-26Z" fill="#8ec5ea" stroke="#5b9bd5" strokeWidth={2} strokeLinejoin="round" />
      {[[-6, -36], [6, -44], [0, -56], [8, -32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.6} fill={['#ffd45e', '#ff8fbf', '#9be3a4', '#ffd45e'][i]} />)}
      <circle cx={2} cy={-75} r={5} fill="#ffd45e" /></g>);
    default: return null;
  }
}

/* ---------------- the person sprite (feet at 0,0) ---------------- */
// pose: { facing:'front'|'back', flip, walk(phase|null), armL, armR, mode:'stand'|'sit', blink, mouthOpen, holding }
export function Person({ who, o, pose, T, uid }) {
  const B = BODY[who];
  const { L, T: TT, R, sw, hw, legW } = B;
  const skin = B.skin, skinD = shade(skin, -0.08);
  const hair = o.hair || HAIR[who];
  const hairD = shade(hair, -0.18), hairL = shade(hair, 0.22);
  const back = pose.facing === 'back', sit = pose.mode === 'sit';
  const walk = pose.walk;
  const legA = walk != null ? Math.sin(walk) * (B.kid ? 24 : 18) : 0;
  const bob = walk != null ? -Math.abs(Math.cos(walk)) * 3.5 : 0;
  const ys = -(L + TT), yh = -L;
  const hc = ys - 5 - R * 0.92;
  const top = o.top || 'tee', gown = top === 'gown', isDress = top === 'dress' || gown;
  const longSleeve = top === 'hoodie' || top === 'jumper' || top === 'flannel' || top === 'jacket' || gown;
  const col = o.color, colD = shade(col, -0.15);
  const dung = top === 'dungas', bodyCol = dung ? '#fbf8f2' : col, sleeveCol = dung ? '#fbf8f2' : top === 'flannel' ? colD : col;
  const hem = gown ? yh + L * 0.9 : yh + L * 0.42;
  const clipId = `cl-${uid}`;
  const torsoD = isDress
    ? `M${-sw / 2 + 3},${ys} L${sw / 2 - 3},${ys} L${hw / 2 + (gown ? 18 : 12)},${hem} Q0,${hem + L * 0.08} ${-hw / 2 - (gown ? 18 : 12)},${hem}Z`
    : `M${-sw / 2},${ys + 5} Q${-sw / 2},${ys} ${-sw / 2 + 6},${ys} L${sw / 2 - 6},${ys} Q${sw / 2},${ys} ${sw / 2},${ys + 5} L${hw / 2 + (top === 'hoodie' ? 3 : 1)},${yh + 4} L${-hw / 2 - (top === 'hoodie' ? 3 : 1)},${yh + 4}Z`;
  const box = isDress ? [-hw / 2 - 20, ys, hw / 2 + 20, hem + L * 0.1] : [-sw / 2 - 2, ys, sw / 2 + 2, yh + 6];
  const armLen = TT * 0.92 + 4;
  const arm = (side, ang) => <g key={'a' + side} transform={`translate(${side * (sw / 2 - 4)} ${ys + 5}) rotate(${ang})`}>
    <rect x={-legW / 2 + 0.5} y={-3} width={legW - 1} height={armLen} rx={(legW - 1) / 2} fill={skin} />
    <rect x={-legW / 2 - 0.5} y={-4} width={legW + 1} height={longSleeve ? armLen - 4 : armLen * 0.36} rx={(legW + 1) / 2} fill={sleeveCol} />
    {pose.holding && side === 1 && <g transform={`translate(0 ${armLen})`}>{pose.holding}</g>}
  </g>;
  const legCol = dung ? col : o.legs, shoe = o.shoes;
  const shoeStyle = o.shoeStyle || (o.boots ? 'boots' : 'shoe');
  const leg = (dx, ang, k) => <g key={'l' + k} transform={`translate(${dx} ${yh}) rotate(${ang})`}>
    <rect x={-legW / 2} y={0} width={legW} height={L} rx={legW / 2} fill={o.bottom === 'shorts' ? skin : o.bottom === 'leopard' ? '#d9a55b' : legCol} />
    {o.bottom === 'ripped' && <><rect x={-legW / 2 + 2} y={L * 0.48} width={legW - 4} height={4} rx={2} fill={skin} /><line x1={-legW / 2 + 2} x2={legW / 2 - 2} y1={L * 0.47} y2={L * 0.47} stroke="#e9e3d6" strokeWidth={1} /></>}
    {o.bottom === 'shorts' && !dung && <rect x={-legW / 2 - 0.5} y={-2} width={legW + 1} height={L * 0.36} rx={3} fill={legCol} />}
    {o.bottom === 'rainbow' && ['#ff8f8f', '#ffc46b', '#fff08a', '#9be3a4', '#8ec5ea', '#c7b6e6'].map((c, i) => <rect key={i} x={-legW / 2} y={2 + i * (L - 4) / 6} width={legW} height={(L - 4) / 6 + 0.5} fill={c} />)}
    {o.bottom === 'joggers' && <rect x={-legW / 2} y={L - 9} width={legW} height={3} fill={shade(legCol, -0.2)} />}
    {o.bottom === 'leopard' && [0.1, 0.27, 0.44, 0.61, 0.78].map((f, i) => <Rosette key={i} x={(i % 2 ? 2 : -2)} y={L * f + 3} s={0.75} base="#d9a55b" k={i + k * 5} />)}
    {o.feet === 'bare' ? <><ellipse cx={2} cy={L + 1} rx={legW * 0.8} ry={4.2} fill={skin} />{[0, 1, 2].map(t => <circle key={t} cx={6 + t * 2.4} cy={L - 1.2} r={1.2} fill={skinD} />)}</>
      : <Shoe style={shoeStyle} c={shoe} L={L} w={legW} skin={skin} T={T} />}
  </g>;
  const legs = sit
    ? <g><ellipse cx={0} cy={yh + 6} rx={hw / 2 + 16} ry={10} fill={o.bottom === 'leopard' ? '#d9a55b' : legCol} />{o.bottom === 'leopard' && [-14, -2, 10].map((x, i) => <Rosette key={i} x={x} y={yh + 5 + (i % 2) * 3} s={0.8} base="#d9a55b" k={i} />)}<ellipse cx={-hw / 2 - 12} cy={yh + 8} rx={7} ry={5} fill={o.feet === 'bare' || shoeStyle === 'sandals' ? skin : shoe} /><ellipse cx={hw / 2 + 12} cy={yh + 8} rx={7} ry={5} fill={o.feet === 'bare' || shoeStyle === 'sandals' ? skin : shoe} /></g>
    : <g>{leg(-hw / 4, legA, 0)}{leg(hw / 4, -legA, 1)}</g>;
  // hair behind the body (long hair, ponytail)
  const longBack = B.hair === 'long' && <path d={`M${-R - 2},${hc - 2} C${-R - 6},${hc + R * 1.6} ${-R - 2},${ys + TT * 0.45} ${-R + 4},${ys + TT * 0.42} L${R - 4},${ys + TT * 0.42} C${R + 2},${ys + TT * 0.45} ${R + 6},${hc + R * 1.6} ${R + 2},${hc - 2}Z`} fill={hairD} />;
  const pony = Math.sin(T * 6) * 6 + (walk != null ? Math.sin(walk) * 10 : 0);
  const sc = R / 27;
  const face = <g transform={`translate(0 ${hc})`}>
    <circle cx={0} cy={2 * sc} r={R} fill={skin} />
    <g transform={`scale(${sc})`}>
      {B.beard && <path d="M-26,0 C-26,30 -16,46 0,48 C16,46 26,30 26,0 C20,14 12,18 0,18 C-12,18 -20,14 -26,0Z" fill={B.beard} />}
      {B.beard && <path d="M-11,13 Q0,7 11,13 Q6,16 0,15 Q-6,16 -11,13Z" fill={shade(B.beard, -0.15)} />}
      {pose.sleep ? <g fill="none" stroke="#5a3d32" strokeWidth={2.5} strokeLinecap="round"><path d="M-13,1 q4,4 8,0" /><path d="M6,1 q4,4 8,0" /></g>
        : <><ellipse cx={-9} cy={1} rx={3.4} ry={4.4 * (1 - pose.blink)} fill="#3b2a24" /><ellipse cx={10} cy={1} rx={3.4} ry={4.4 * (1 - pose.blink)} fill="#3b2a24" /></>}
      {!B.beard && <><circle cx={-17} cy={11} r={5} fill="#f5a3b4" opacity={B.kid ? 0.7 : 0.45} /><circle cx={18} cy={11} r={5} fill="#f5a3b4" opacity={B.kid ? 0.7 : 0.45} /></>}
      {B.beard
        ? <path d={pose.mouthOpen ? 'M-5,20 q5,7 10,0Z' : 'M-5,20 q5,4 10,0'} fill={pose.mouthOpen ? '#7a2f3a' : 'none'} stroke="#7a2f3a" strokeWidth={2} strokeLinecap="round" />
        : <path d={pose.mouthOpen ? 'M-5,13 q5,8 10,0Z' : 'M-5,13 q5,5 10,0'} fill={pose.mouthOpen ? '#c2475f' : 'none'} stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />}
      {B.glasses && <g fill="none" stroke="#3b2a24" strokeWidth={2.2}><circle cx={-9.5} cy={1} r={7.5} /><circle cx={10.5} cy={1} r={7.5} /><path d="M-2,0 Q0.5,-2 3,0" /><path d="M-17,0 L-26,-3 M18,0 L26,-3" /></g>}
      {B.glasses && <g fill="#fff" opacity={0.25}><circle cx={-9.5} cy={1} r={6.5} /><circle cx={10.5} cy={1} r={6.5} /></g>}
      <Specs kind={o.specs} />
      {/* hair on top */}
      {B.hair === 'pony' && <><path d="M-29,-2 C-28,-34 26,-42 30,-4 C20,-16 4,-22 -6,-16 C-14,-12 -22,-8 -29,-2Z" fill={hair} /><path d="M-4,-26 C6,-29 14,-26 20,-20" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" /></>}
      {B.hair === 'long' && <><path d="M-30,6 C-32,-36 30,-40 30,4 C26,-12 16,-20 4,-22 C-2,-14 -14,-12 -24,-14 C-26,-6 -28,0 -30,6Z" fill={hair} /><path d="M-30,6 C-32,22 -30,34 -26,40 L-24,10Z" fill={hair} /><path d="M30,4 C32,22 30,34 26,40 L24,10Z" fill={hair} /><path d="M0,-24 C8,-26 16,-22 20,-16" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" /></>}
      {B.hair === 'short' && <path d="M-27,-2 C-30,-30 -10,-40 6,-36 C22,-34 32,-20 27,-2 C24,-12 20,-16 16,-12 L14,-18 L8,-12 L4,-19 L-2,-11 L-6,-18 L-11,-10 L-16,-16 L-20,-8Z" fill={hair} />}
      {B.hair === 'bald' && <ellipse cx={-8} cy={-16} rx={9} ry={5} fill="#fff" opacity={0.35} transform="rotate(-20 -8 -16)" />}
      {B.hair === 'bald' && <><path d="M-27,4 Q-29,-6 -26,-10 L-24,8Z" fill={B.sides || B.beard} /><path d="M27,4 Q29,-6 26,-10 L24,8Z" fill={B.sides || B.beard} /></>}
      {B.hair === 'curtains' && <><path d="M-31,6 C-35,-46 35,-46 31,6 C29,-5 23,-10 14,-8 C6,-7 1,-14 0,-22 C-1,-14 -6,-7 -14,-8 C-23,-10 -29,-5 -31,6Z" fill={hair} /><path d="M-31,6 Q-32,12 -28,15 L-26,2Z M31,6 Q32,12 28,15 L26,2Z" fill={hair} /><path d="M0,-22 C-3,-13 -9,-10 -17,-11 M0,-22 C3,-13 9,-10 17,-11" fill="none" stroke={hairD} strokeWidth={1.6} strokeLinecap="round" /><path d="M-21,-22 C-16,-28 -10,-31 -4,-32" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" /></>}
      {B.hair === 'curly' && <g fill={hair}>{[[-24, -6, 10], [-20, -20, 11], [-8, -28, 12], [6, -29, 12], [19, -22, 11], [26, -8, 10], [-27, 6, 8], [27, 6, 8]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} stroke={hairD} strokeWidth={1} />)}</g>}
      <Accessory kind={o.acc} back={false} hairD={hairD} R={27} />
    </g>
    {pose.pinch && <g><path d={`M${sw / 2 - 4},${ys - hc + 5} Q${sw / 2 + 4},${(ys - hc) * 0.4} ${4 * sc},${9 * sc}`} fill="none" stroke={longSleeve ? (top === 'flannel' ? colD : col) : skin} strokeWidth={legW + 1} strokeLinecap="round" /><circle cx={3 * sc} cy={9 * sc} r={legW * 0.75} fill={skin} stroke={skinD} strokeWidth={1} /></g>}
  </g>;
  const headBack = <g transform={`translate(0 ${hc})`}>
    <circle cx={0} cy={2 * sc} r={R} fill={B.hair === 'bald' ? skin : hairD} />
    <g transform={`scale(${sc})`}>
      {B.hair === 'bald' && <><ellipse cx={8} cy={-14} rx={9} ry={5} fill="#fff" opacity={0.3} /><path d="M-27,6 Q0,30 27,6 L26,16 Q0,36 -26,16Z" fill={B.beard} opacity={0.0} /></>}
      {B.hair === 'long' && <path d="M-29,0 C-30,40 -24,60 -18,70 L18,70 C24,60 30,40 29,0Z" fill={hairD} />}
      {B.hair === 'pony' && <><path d="M-12,-26 C0,-32 12,-28 18,-18" fill="none" stroke={hairL} strokeWidth={3} strokeLinecap="round" /><g transform={`translate(0 -22) rotate(${pony})`}><circle cx={0} cy={0} r={6} fill="#e96d9a" /><path d="M-6,2 C-14,20 -8,38 4,44 C8,28 10,14 6,2Z" fill={hair} /></g></>}
      {B.hair === 'short' && <path d="M-27,4 C-30,-30 30,-30 27,4Z" fill={hair} />}
      {B.hair === 'curtains' && <path d="M-31,14 C-35,-46 35,-46 31,14 Q0,22 -31,14Z" fill={hair} />}
      {B.hair === 'curly' && <g fill={hair}>{[[-24, -4, 11], [-12, -22, 13], [6, -24, 13], [22, -10, 11], [-20, 14, 10], [20, 14, 10], [0, 4, 16]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>}
      {B.sides && <><path d="M-27,4 Q-29,-6 -26,-10 L-24,8Z" fill={B.sides} /><path d="M27,4 Q29,-6 26,-10 L24,8Z" fill={B.sides} /></>}
      {B.beard && <><path d="M-27,4 Q-29,18 -22,28 L-20,8Z" fill={B.beard} /><path d="M27,4 Q29,18 22,28 L20,8Z" fill={B.beard} /></>}
      <Accessory kind={o.acc} back={true} hairD={hairD} R={27} />
    </g>
  </g>;
  const hood = top === 'hoodie' && <path d={`M${-R * 0.8},${ys + 2} Q0,${ys + 12} ${R * 0.8},${ys + 2} Q${R * 0.6},${ys - 8} 0,${ys - 8} Q${-R * 0.6},${ys - 8} ${-R * 0.8},${ys + 2}Z`} fill={colD} />;
  const sx = pose.flip ? -1 : 1;
  const sitDrop = sit ? L - 10 : 0;
  return <g transform={`scale(${sx * (pose.twirl ?? 1)} 1) translate(0 ${bob + sitDrop})`}>
    <defs><clipPath id={clipId}><path d={torsoD} /></clipPath></defs>
    <ellipse cx={0} cy={-sitDrop} rx={sw * 0.75} ry={8} fill="rgba(60,30,10,.18)" />
    {!back && longBack}
    {B.hair === 'pony' && !back && <g transform={`translate(${22 * sc} ${hc - 14 * sc}) rotate(${pony}) scale(${sc})`}><path d="M0,0 C18,4 22,30 10,46 C4,30 -2,16 0,0Z" fill={hairD} /></g>}
    {legs}
    {back && arm(-1, pose.armL)}{back && arm(1, -pose.armR)}
    {o.bottom === 'skirt' && !isDress && <path d={`M${-hw / 2 - 2},${yh - 2} L${hw / 2 + 2},${yh - 2} L${hw / 2 + 9},${yh + L * 0.36} L${-hw / 2 - 9},${yh + L * 0.36}Z`} fill={legCol} />}
    {!back && hood}
    <path d={torsoD} fill={bodyCol} />
    {!dung && <Pattern kind={o.pattern} color={col} clipId={clipId} box={box} scale={B.kid ? 1 : 1.15} T={T} />}
    {dung && <g><rect x={-sw * 0.3} y={ys + TT * 0.34} width={sw * 0.6} height={TT * 0.66 + 4} rx={3} fill={col} />{!back && <rect x={-sw * 0.14} y={ys + TT * 0.45} width={sw * 0.28} height={TT * 0.2} rx={2} fill={colD} />}
      <path d={`M${-sw * 0.28},${ys + TT * 0.36} L${-sw / 2 + 5},${ys + 1} M${sw * 0.28},${ys + TT * 0.36} L${sw / 2 - 5},${ys + 1}`} stroke={col} strokeWidth={3.2} strokeLinecap="round" />
      {!back && [-1, 1].map(k => <circle key={k} cx={k * sw * 0.24} cy={ys + TT * 0.4} r={1.8} fill="#e7c46a" />)}</g>}
    {top === 'jacket' && !back && <g><path d={`M-6,${ys} L6,${ys} L5,${yh + 4} L-5,${yh + 4}Z`} fill="#fbf8f2" /><path d={`M-6,${ys} L-11,${ys + TT * 0.32} L-4,${ys + TT * 0.42} Z M6,${ys} L11,${ys + TT * 0.32} L4,${ys + TT * 0.42} Z`} fill={colD} />{[0.55, 0.75].map(f => <circle key={f} cx={-7} cy={ys + TT * f} r={1.6} fill={shade(col, -0.35)} />)}</g>}
    {top === 'kit' && <g>{!back && <path d={`M-7,${ys} L0,${ys + 7} L7,${ys}`} fill="none" stroke="#fbf8f2" strokeWidth={3} />}<text x={0} y={ys + TT * (back ? 0.62 : 0.66)} textAnchor="middle" fontSize={back ? TT * 0.46 : TT * 0.3} fontWeight="800" fontFamily="'Baloo 2',sans-serif" fill={lum(col) > 0.6 ? '#2b2b2e' : '#fbf8f2'}>10</text></g>}
    {top === 'tutu' && <g>{[[-1, 0], [1, 0], [0, 1], [-1.4, 2], [1.4, 2], [0, 3]].map(([dx, r], i) => <ellipse key={i} cx={dx * hw * 0.32} cy={yh + 2 + r * 3} rx={hw / 2 + 4} ry={7 + r} fill={shade(col, 0.28 - r * 0.05)} opacity={0.88} />)}{[-1, 0, 1].map(k => <circle key={'g' + k} cx={k * hw * 0.4} cy={yh + 6} r={1.4} fill="#fff" />)}</g>}
    {top === 'flannel' && !back && <><path d={`M-5,${ys} L0,${ys + 10} L5,${ys} L4,${yh + 4} L-4,${yh + 4}Z`} fill="#2b2b2e" /><line x1={-5} x2={-5} y1={ys + 2} y2={yh + 4} stroke={colD} strokeWidth={2} /><line x1={5} x2={5} y1={ys + 2} y2={yh + 4} stroke={colD} strokeWidth={2} /></>}
    {top === 'hoodie' && !back && <><path d={`M${-sw * 0.28},${yh - TT * 0.3} h${sw * 0.56} l-3,${TT * 0.24} h${-sw * 0.56 + 6}Z`} fill={colD} /><line x1={-4} x2={-5} y1={ys + 4} y2={ys + 16} stroke="#e9e3d6" strokeWidth={1.6} /><line x1={4} x2={5} y1={ys + 4} y2={ys + 16} stroke="#e9e3d6" strokeWidth={1.6} /></>}
    {back && top === 'hoodie' && <path d={`M${-R * 0.75},${ys + 1} Q0,${ys + TT * 0.42} ${R * 0.75},${ys + 1}Z`} fill={colD} />}
    {isDress && <path d={`M${-hw / 2 - 12},${yh + L * 0.42} Q0,${yh + L * 0.5} ${hw / 2 + 12},${yh + L * 0.42} L${hw / 2 + 12.5},${yh + L * 0.46} Q0,${yh + L * 0.55} ${-hw / 2 - 12.5},${yh + L * 0.46}Z`} fill={colD} />}
    {!back && arm(-1, pose.armL)}{!back && !pose.pinch && arm(1, -pose.armR)}
    <rect x={-4.5} y={ys - 7} width={9} height={9} fill={skinD} />
    {B.neckGlasses && !back && <g><path d={`M-7,${ys - 2} Q-9,${ys + TT * 0.3} 0,${ys + TT * 0.36} Q9,${ys + TT * 0.3} 7,${ys - 2}`} fill="none" stroke="#d9b45a" strokeWidth={1.3} strokeDasharray="2 1.4" /><g transform={`translate(0 ${ys + TT * 0.38}) rotate(-8)`} fill="rgba(255,255,255,.35)" stroke="#3b2a24" strokeWidth={1.6}><circle cx={-5.5} cy={0} r={4.6} /><circle cx={5.5} cy={0} r={4.6} /><path d="M-1,-0.5 Q0,-2 1,-0.5" fill="none" /></g></g>}
    {back ? <>{B.hair === 'long' && <path d={`M${-R},${hc} C${-R - 3},${hc + R * 1.6} ${-R + 2},${ys + TT * 0.5} ${-R + 6},${ys + TT * 0.48} L${R - 6},${ys + TT * 0.48} C${R - 2},${ys + TT * 0.5} ${R + 3},${hc + R * 1.6} ${R},${hc}Z`} fill={hairD} />}{headBack}</> : face}
  </g>;
}

/* ---------------- Callie lying in bed (from the original scene, recoloured by her outfit) ---------------- */
export function CallieLying({ o, T, kick, tablet, sleep }) {
  const hair = o.hair, hairD = shade(hair, -0.18), SKIN = '#f6d2b8', SKIN_D = '#e9b99b';
  const k1 = sleep ? 10 : 40 + Math.sin(T * 5) * 30 * kick, k2 = sleep ? 5 : 40 + Math.sin(T * 5 + 2) * 30 * kick;
  const breath = sleep ? Math.sin(T * 2) * 1.5 : 0;
  return <g transform="scale(.78)">
    <ellipse cx={-10} cy={4} rx={80} ry={10} fill="rgba(60,30,10,.12)" />
    {[k1, k2].map((k, i) => <g key={i} transform={`translate(${-48 - i * 3} ${-8 - i * 2})`}>
      <rect x={-34} y={-5} width={36} height={11} rx={5} fill={o.legs} />
      <g transform={`translate(-32 0) rotate(${-k - 90})`}><rect x={-5} y={0} width={10} height={36} rx={5} fill={o.legs} /><ellipse cx={0} cy={37} rx={7} ry={5} fill={o.shoes} /></g>
    </g>)}
    <ellipse cx={-10} cy={-12 - breath} rx={44} ry={15} fill={o.color} />
    <defs><clipPath id="lie-clip"><ellipse cx={-10} cy={-12} rx={44} ry={15} /></clipPath></defs>
    <Pattern kind={o.pattern} color={o.color} clipId="lie-clip" box={[-54, -28, 34, 4]} />
    <rect x={30} y={-30} width={10} height={14} fill={SKIN_D} />
    <g transform={`translate(54 -30) rotate(${sleep ? 0 : 10})`}>
      <ellipse cx={0} cy={-2} rx={31} ry={30} fill={hairD} />
      <circle cx={0} cy={0} r={25} fill={SKIN} />
      <path d="M-27,-2 C-26,-32 24,-38 28,-4 C18,-16 4,-20 -6,-15 C-14,-11 -20,-8 -27,-2Z" fill={hair} />
      <g fill="none" stroke="#5a3d32" strokeWidth={2.5} strokeLinecap="round"><path d="M-12,4 q5,4 10,0" /><path d="M6,4 q5,4 10,0" /></g>
      <circle cx={-14} cy={12} r={4.5} fill="#f5a3b4" opacity={0.7} /><circle cx={17} cy={12} r={4.5} fill="#f5a3b4" opacity={0.7} />
      <path d="M-3,14 q4,4 8,0" fill="none" stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />
      <g transform="scale(.9)"><Accessory kind={o.acc === 'glasses' && sleep ? 'none' : o.acc} back={false} hairD={hairD} /></g>
    </g>
    {tablet > 0.01 && <g transform={`translate(96 -14) scale(${tablet}) rotate(-8)`}>
      <rect x={-22} y={-30} width={44} height={32} rx={6} fill="#ff8fbf" />
      <rect x={-18} y={-26} width={36} height={24} rx={3} fill={`hsl(${(T * 80) % 360} 75% 80%)`} />
      <circle cx={0} cy={-14} r={5} fill="#fff" opacity={0.9} />
    </g>}
    <g transform={`translate(${sleep ? 30 : 74} -10)`}><rect x={-4} y={-4} width={30} height={9} rx={4} fill={SKIN} /></g>
  </g>;
}

/* ---------------- head icon for tabs and voice bubbles ---------------- */
export function HeadIcon({ who, o, size = 40 }) {
  const pose = { facing: 'front', flip: false, walk: null, armL: 8, armR: 8, blink: 0, mouthOpen: false, mode: 'stand' };
  const B = BODY[who], hc = -(B.L + B.T) - 5 - B.R * 0.92;
  const pad = B.R * 1.9;
  return <svg viewBox={`${-pad} ${hc - pad - (o.acc && o.acc !== 'none' ? B.R * 0.9 : 0)} ${pad * 2} ${pad * 2 + (o.acc && o.acc !== 'none' ? B.R * 0.9 : 0)}`} width={size} height={size} aria-hidden="true">
    <Person who={who} o={o} pose={pose} T={0} uid={'icon-' + who} />
  </svg>;
}

/* anyone lying on a bed: the standing figure tipped over, tucked under a blanket */
export function PersonLying({ who, o, T, rot, sleep, blanket = '#f6eef1' }) {
  const B = BODY[who], H = B.L + B.T + B.R * 2 + 6;
  const breath = Math.sin(T * (sleep ? 2 : 3)) * 1.2;
  const pose = { facing: 'front', flip: false, walk: null, armL: 4, armR: 4, blink: 0, mouthOpen: false, mode: 'stand', sleep };
  return <g transform={`rotate(${rot})`}>
    <g transform={`translate(0 ${H * 0.45})`}>
      <Person who={who} o={o} pose={pose} T={T} uid={'lie-' + who} />
      <rect x={-(B.sw / 2 + 12)} y={-(B.L + B.T * 0.75) - breath} width={B.sw + 24} height={B.L + B.T * 0.75 + 10 + breath} rx={14} fill={blanket} stroke="rgba(0,0,0,.12)" strokeWidth={2} />
      <path d={`M${-(B.sw / 2 + 8)},${-(B.L + B.T * 0.6)} q${B.sw / 2 + 8},8 ${B.sw + 16},0`} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={3} />
    </g>
  </g>;
}
