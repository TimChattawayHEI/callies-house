// Houses on New Street, built from the House Builder pieces. Each family keeps its own rooms:
// fam.rooms[rk] = { style: {...}, items: [{ id, x, y, rot, col }] } and fam.store = { id: count } (things put away).
// A seed makes the first layout, then the family can decorate.
import React from 'react';
import { Iso, HB } from '../rooms.gen.jsx';
import { P } from './core.js';
import { registerRoom, unregisterRoom, WORDS, CONTAINERS } from './rooms.jsx';
import { SEATS, BEDS, resetNav } from './world.js';
import { OUTSIDE, isLit, darkness } from './sky.jsx';

const { Plane, FloorPlane, FaceX, FaceY, Box, Slab, WallCap, BackWallY, BackWallX, pts, archPath } = Iso;
export const { ITEMS, BY_ID, CATS, ItemThumb } = HB;
export const RH = 4.2, DH = 3.2;
// one extra piece for garages (and anywhere else she fancies): a car
if (!BY_ID['x-car']) {
  const RED = '#d9465f', BLK = '#34343a', W = (x, y) => [x, y, 0, 0.6, 0.22, 0.45, BLK];
  const car = { id: 'x-car', n: 'Car', c: 'tech', p: 150, f: [4, 2], b: [W(0.5, 0.12), W(2.9, 0.12), [0.2, 0.3, 0.25, 3.6, 1.4, 0.65, RED], [1.1, 0.4, 0.9, 1.7, 1.2, 0.55, '#bfe3f2'], [1.05, 0.35, 1.45, 1.8, 1.3, 0.1, RED], [3.78, 0.45, 0.5, 0.04, 0.3, 0.15, '#fff3b0'], [3.78, 1.25, 0.5, 0.04, 0.3, 0.15, '#fff3b0'], W(0.5, 1.66), W(2.9, 1.66)] };
  ITEMS.push(car); BY_ID[car.id] = car;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pickR = (r, a) => a[Math.floor(r() * a.length)];
// the same colour maths as the House Builder pieces, so recolouring finds their shades
export function hx(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, '0')).join('');
}
const cols = (c) => [hx(c, 0.14), c, hx(c, -0.12)];

/* ---------------- choices (from the House Builder design) ---------------- */
export const OPT = {
  paints: ['#f7efe2', '#f5e8cf', '#e9d6b6', '#dfe8e2', '#cfe7dc', '#bfe0e8', '#c8d6ef', '#ddd2f0', '#f6d6de', '#f3c9b4', '#f6dfa8', '#d8e5b8', '#a8c9a0', '#8fb3c9', '#3d4a6b', '#3b2a24'],
  papers: [['none', 'None'], ['stripe', 'Stripes'], ['dots', 'Dots'], ['check', 'Check'], ['diamond', 'Diamonds'], ['wave', 'Waves'], ['flowers', 'Flowers'], ['stars', 'Stars']],
  inks: ['#e8a2b4', '#e3b04f', '#9fcdbf', '#5fa8d8', '#b9a3e3', '#3d4a6b', '#d9465f'],
  trims: ['#fffaf0', '#ebe6dc', '#d9b47e', '#8a5a3a', '#3f8a8a', '#3d4a6b', '#34343a'],
  floors: [['oak', 'Oak', '#c98f55'], ['walnut', 'Walnut', '#8a5a3a'], ['carpet', 'Carpet', '#b9c7de'], ['tile', 'Tiles', '#dfe9ee'], ['check', 'Checker', '#f1ece2'], ['lino', 'Lino', '#cfe7dc']],
  carpets: ['#b9c7de', '#e9d6b6', '#c9c4bb', '#f3c9d4', '#cfe7dc', '#b9a3e3', '#3d4a6b'],
  rugs: [['none', 'No rug'], ['round', 'Round'], ['rect', 'Rectangle'], ['runner', 'Runner'], ['fringe', 'Fringed']],
  rugCols: ['#e3b04f', '#d9465f', '#3f8a8a', '#e8a2b4', '#f1ece2', '#9b7cc4', '#5f9a3e'],
  windows: [['sash', 'Sash'], ['round', 'Arched'], ['wide', 'Wide']],
  curtains: [['curtains', 'Curtains'], ['blind', 'Blind'], ['none', 'None']],
  curtainCols: ['#c25a7a', '#3f8a8a', '#e3b04f', '#f1ece2', '#3d4a6b', '#9b7cc4'],
  doors: [['panel', 'Panel'], ['glazed', 'Glazed'], ['stable', 'Stable']],
  doorCols: ['#f8f3ea', '#3f8a8a', '#d9465f', '#e3b04f', '#8a5a3a', '#3d4a6b'],
  moods: [['day', 'Daylight'], ['warm', 'Warm'], ['evening', 'Evening']],
  itemCols: ['#d9465f', '#e8a2b4', '#e3b04f', '#5f9a3e', '#3f8a8a', '#5fa8d8', '#3d4a6b', '#b9a3e3', '#8a5a3a', '#f1ece2', '#34343a'],
};
export const floorBase = f => (OPT.floors.find(x => x[0] === f) || OPT.floors[0])[2];

/* ---------------- house types and random plans ---------------- */
// A plan is { type, entry, rooms: { rk: { rk, kind, name, floor, RX, RY, win, doorsY, doorsX, out, rug } } }.
// doorsY: doors in the back wall [to, cell x]; doorsX: doors in the left wall [to, cell y]; out: the gap to the street.
export const HOUSE_TYPES = {
  flat: { name: 'Flat', note: 'Cosy, one floor, a balcony', facts: ['1 floor', '1 or 2 bedrooms', '5 or 6 rooms'] },
  terrace: { name: 'Terrace', note: 'Two floors, a long back garden', facts: ['2 floors', '2 or 3 bedrooms', '8 to 10 rooms'] },
  detached: { name: 'Detached', note: 'Big, with a garage and garden', facts: ['2 floors', '3 or 4 bedrooms', '11 to 14 rooms'] },
};
const KINDS = {
  hall: ['Hall', 7, 6], living: ['Living room', 9, 7], kitchen: ['Kitchen', 8, 6], dining: ['Dining room', 7, 6], toilet: ['Toilet', 5, 4],
  garage: ['Garage', 8, 6], landing: ['Landing', 7, 6], bedbig: ['Bedroom', 8, 6], bed: ['Bedroom', 7, 6], box: ['Box room', 5, 5],
  bath: ['Bathroom', 6, 5], balcony: ['Balcony', 6, 3], garden: ['Garden', 9, 6.5],
};
export const OUTDOOR_KINDS = new Set(['garden', 'balcony']);
// the first New Street houses (before house types): one floor, five rooms and a garden
const LEGACY = {
  type: 'house', entry: 'living', rooms: {
    living: { kind: 'living', floor: 0, name: 'Living room', RX: 9, RY: 7, win: { x0: 3.3, x1: 5.7, z0: 1.75, z1: 3.4 }, doorsY: [['bath', 1], ['kitchen', 7]], doorsX: [['bed1', 1], ['bed2', 4]], out: [5, 7], rug: { x: 2.2, y: 1.4, w: 4.6, d: 2.4 } },
    kitchen: { kind: 'kitchen', floor: 0, name: 'Kitchen', RX: 7, RY: 6, win: { x0: 1.4, x1: 3.6, z0: 1.8, z1: 3.3 }, doorsY: [['garden', 5]], doorsX: [['living', 3]], rug: { x: 1.6, y: 2.6, w: 3.8, d: 2.8 } },
    bed1: { kind: 'bedbig', floor: 0, name: 'Bedroom', RX: 7, RY: 6, win: { x0: 1.3, x1: 3.7, z0: 1.8, z1: 3.4 }, doorsY: [['living', 5]], doorsX: [], rug: { x: 1.8, y: 3.1, w: 3.2, d: 2.2 } },
    bed2: { kind: 'bed', floor: 0, name: 'Bedroom', RX: 7, RY: 6, win: { x0: 2.2, x1: 4.4, z0: 1.8, z1: 3.3 }, doorsY: [['living', 5]], doorsX: [], rug: { x: 1.8, y: 2.7, w: 3.0, d: 2.2 } },
    bath: { kind: 'bath', floor: 0, name: 'Bathroom', RX: 6, RY: 5, win: { x0: 0.4, x1: 2.6, z0: 1.85, z1: 3.3 }, doorsY: [['living', 4]], doorsX: [], rug: { x: 1.2, y: 1.5, w: 2.4, d: 1.4 } },
    garden: { kind: 'garden', floor: 0, name: 'Garden', RX: 9, RY: 6.5, doorsY: [['kitchen', 1]], doorsX: [] },
  },
};
export const planOf = fam => fam.plan || LEGACY;
export const geoOf = (fam, rk) => planOf(fam).rooms[rk];
export const typeOf = fam => planOf(fam).type;
export const decorRooms = fam => Object.keys(planOf(fam).rooms).filter(rk => planOf(fam).rooms[rk].kind !== 'garden');
export const houseRooms = fam => Object.keys(planOf(fam).rooms).map(rk => fam.id + ':' + rk);
export const entryRoom = fam => fam.id + ':' + planOf(fam).entry;

// pick door cells on the back and left walls, keeping doors two cells apart
function placeDoors(R, targets) {
  const outdoor = OUTDOOR_KINDS.has(R.kind);
  for (let tries = 0; tries < 4; tries++) {
    const { RX, RY } = R, used = { y: [], x: [] }, odd = n => Array.from({ length: n }, (_, i) => i).filter(c => c % 2 === 1);
    const pref = outdoor ? [['y', 1], ['y', Math.floor(RX / 2)], ['y', RX - 2]]
      : [['x', 1], ['y', RX - 2], ['x', RY - 2], ['y', 1], ['x', 3], ['y', 3], ['y', RX - 4], ['x', RY - 4], ...odd(RX - 1).map(c => ['y', c]), ...odd(RY - 1).map(c => ['x', c])];
    R.doorsY = []; R.doorsX = [];
    let all = true;
    for (const to of targets) {
      const slot = pref.find(([w, c]) => c >= 1 && c <= (w === 'y' ? RX - 2 : RY - 2) && used[w].every(u => Math.abs(u - c) >= 2));
      if (!slot) { all = false; break; }
      used[slot[0]].push(slot[1]);
      (slot[0] === 'y' ? R.doorsY : R.doorsX).push([to, slot[1]]);
    }
    if (all) break;
    R.RX += 2; // not enough wall for all the doors: make the room longer
  }
  // the window goes in the widest gap left on the back wall
  const { RX } = R;
  const spans = [[0.2, RX - 0.2]];
  for (const [, x] of R.doorsY) { const a = x - 0.25, b = x + 1.25; for (let i = spans.length - 1; i >= 0; i--) { const [s, e] = spans[i]; if (a < e && b > s) spans.splice(i, 1, ...[[s, a], [b, e]].filter(([p, q]) => q - p > 0.1)); } }
  const best = spans.sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0];
  if (best && best[1] - best[0] >= 1.7 && R.kind !== 'garden') { const w = Math.min(2.4, best[1] - best[0] - 0.5), m = (best[0] + best[1]) / 2; R.win = { x0: +(m - w / 2).toFixed(2), x1: +(m + w / 2).toFixed(2), z0: 1.8, z1: 3.35 }; }
}
export function makePlan(type, seed) {
  const r = rng(seed * 31 + 7), coin = p => r() < p, rooms = {}, links = [];
  const add = (rk, kind, floor, name, size) => { const [n, RX, RY] = KINDS[kind]; const [X, Y] = size || [RX + (['living', 'kitchen', 'bed', 'bedbig'].includes(kind) && coin(0.4) ? 1 : 0), RY]; rooms[rk] = { rk, kind, floor, name: name || n, RX: X, RY: Y, doorsY: [], doorsX: [] }; };
  const link = (a, b) => links.push([a, b]);
  let entry;
  if (type === 'flat') {
    entry = 'living'; add('living', 'living', 0); add('kitchen', 'kitchen', 0); add('bath', 'bath', 0);
    const beds = coin(0.5) ? 2 : 1;
    for (let i = 1; i <= beds; i++) { add('bed' + i, i === 1 ? 'bedbig' : 'bed', 0, beds > 1 ? 'Bedroom ' + i : 'Bedroom'); link('living', 'bed' + i); }
    add('balcony', 'balcony', 0); link('living', 'kitchen'); link('living', 'bath'); link('kitchen', 'balcony');
  } else {
    const big = type === 'detached';
    entry = 'hall'; add('hall', 'hall', 0, null, big ? [8, 6] : [7, 6]); add('living', 'living', 0); add('kitchen', 'kitchen', 0);
    link('hall', 'living'); link('hall', 'kitchen');
    if (big) { add('dining', 'dining', 0); link('kitchen', 'dining'); add('garage', 'garage', 0); link('hall', 'garage'); }
    if (coin(0.5)) { add('toilet', 'toilet', 0); link('hall', 'toilet'); }
    add('garden', 'garden', 0, null, big ? [10, 7] : [12, 5]); link('kitchen', 'garden');
    add('landing', 'landing', 1, null, big ? [8, 6] : [7, 6]); link('hall', 'landing');
    const beds = big ? (coin(0.5) ? 4 : 3) : (coin(0.5) ? 3 : 2);
    for (let i = 1; i <= beds; i++) { add('bed' + i, i === 1 ? 'bedbig' : 'bed', 1, 'Bedroom ' + i); link('landing', 'bed' + i); }
    add('bath', 'bath', 1); link('landing', 'bath');
    if (big && coin(0.5)) { add('box', 'box', 1); link(beds === 4 ? 'bed1' : 'landing', 'box'); }
  }
  rooms[entry].out = [rooms[entry].RY - 2, rooms[entry].RY];
  for (const rk of Object.keys(rooms)) placeDoors(rooms[rk], links.filter(l => l.includes(rk)).map(([a, b]) => (a === rk ? b : a)));
  for (const R of Object.values(rooms)) R.rug = { x: +(R.RX * 0.22).toFixed(1), y: +(R.RY * 0.3).toFixed(1), w: +(R.RX * 0.5).toFixed(1), d: +(R.RY * 0.42).toFixed(1) };
  return { type, entry, rooms };
}

// cells next to doors stay clear so everyone can get in and out
function reservedCells(g) {
  const s = new Set(), add = (x, y) => s.add(x + ',' + y);
  for (const [, x] of g.doorsY) { add(x, 0); add(x, 1); }
  for (const [, y] of g.doorsX) { add(0, y); add(1, y); }
  if (g.out) for (let y = g.out[0]; y < g.out[1]; y++) { add(g.RX - 1, y); add(g.RX - 2, y); }
  return s;
}
const doorCells = g => [...g.doorsY.map(([, x]) => [x, 0]), ...g.doorsX.map(([, y]) => [0, y]), ...(g.out ? [[g.RX - 1, g.out[0]]] : [])];

/* ---------------- placing things on the grid ---------------- */
export const fpOf = p => { const it = BY_ID[p.id]; return (p.rot || 0) % 2 ? [it.f[1], it.f[0]] : it.f; };
export const isWall = p => !!(BY_ID[p.id] && BY_ID[p.id].wall);
function cellsOf(p) { const [w, d] = fpOf(p), out = []; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push((p.x + i) + ',' + (p.y + j)); return out; }
function occupancy(items, skip) { const s = new Set(); items.forEach((p, i) => { if (i !== skip && !isWall(p) && BY_ID[p.id]) cellsOf(p).forEach(c => s.add(c)); }); return s; }
function connected(g, occ) {
  const goals = doorCells(g); if (!goals.length) return true;
  const RY = Math.floor(g.RY), key = (x, y) => x + ',' + y, seen = new Set([key(...goals[0])]), q = [goals[0]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (nx < 0 || ny < 0 || nx >= g.RX || ny >= RY || seen.has(k) || occ.has(k)) continue; seen.add(k); q.push([nx, ny]); } }
  return goals.every(c => seen.has(key(...c))) && seen.size >= Math.min(6, g.RX * RY / 3);
}
// can p go here? returns '' if yes, or a reason
export function whyNot(g, items, p, skip = -1) {
  const [w, d] = fpOf(p);
  if (isWall(p)) {
    if (p.x < 0 || p.x + w > g.RX + 0.01) return 'wall';
    const hitDoor = g.doorsY.some(([, x]) => p.x < x + 1.05 && p.x + w > x - 0.05);
    return hitDoor ? 'door' : '';
  }
  if (p.x < 0 || p.y < 0 || p.x + w > g.RX || p.y + d > Math.floor(g.RY)) return 'wall';
  const res = reservedCells(g), occ = occupancy(items, skip), mine = cellsOf(p);
  if (mine.some(c => res.has(c))) return 'door';
  if (mine.some(c => occ.has(c))) return 'full';
  mine.forEach(c => occ.add(c));
  return connected(g, occ) ? '' : 'path';
}
// somewhere it fits, starting near (x, y)
export function findSpot(g, items, p, skip = -1, near, turn = true) {
  const spots = [];
  const rots = isWall(p) || !turn ? [p.rot || 0] : [p.rot || 0, ((p.rot || 0) + 1) % 4];
  const [cx, cy] = near || [g.RX / 2, g.RY / 2];
  for (const rot of rots) for (let x = 0; x < g.RX; x++) for (let y = 0; y < (isWall(p) ? 1 : g.RY); y++) {
    const q = { ...p, x, y: isWall(p) ? 0 : y, rot }; const [w, d] = fpOf(q);
    spots.push([Math.hypot(x + w / 2 - cx, (isWall(p) ? 0 : y + d / 2 - cy)) + (rot !== (p.rot || 0) ? 3 : 0), q]);
  }
  spots.sort((a, b) => a[0] - b[0]);
  for (const [, q] of spots) if (!whyNot(g, items, q, skip)) return q;
  return null;
}

/* ---------------- colours of a placed piece ---------------- */
const MAIN = { 'x-car': 2, 'bed-single': 4, 'bed-double': 5, 'bed-canopy': 4, 'bed-bunk': 1 };
export function mainColour(it) {
  if (MAIN[it.id] != null) return it.b[MAIN[it.id]][6];
  let best = it.b[0], v = 0; for (const b of it.b) { const vol = b[3] * b[4] * Math.max(b[5], 0.05); if (vol > v) { v = vol; best = b; } }
  return best[6];
}
const KS = [-0.2, -0.15, -0.12, -0.1, -0.08, -0.05, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2];
function recolour(boxes, from, to) {
  const map = { [from]: to }; KS.forEach(k => { map[hx(from, k)] = hx(to, k); });
  return boxes.map(b => (map[b[6]] ? [...b.slice(0, 6), map[b[6]]] : b));
}
// screens and lamps light up when switched on
const SCREEN = { 'e-tv': '#2c3a52', 'e-pc': '#5a6cc4', 'e-arcade': '#1f2024', 'e-console': '#5fa8d8' };
const SHADE = { 'l-floor': '#f4e7cf', 'l-table': '#f4e7cf', 'l-pendant': '#e3b04f', 'l-desk': '#d9465f', 'l-lava': '#f39ac6', 'l-fairy': '#fff3b0' };
export const TOGGLE = new Set([...Object.keys(SCREEN), ...Object.keys(SHADE)]);
const TV_COLS = ['#7fd0ff', '#ffd45e', '#9be3a4', '#f39ac6', '#b9a3e3'];
export function placedBoxes(p, on, T = 0) {
  const it = BY_ID[p.id];
  let b = HB.rotBoxes(it, p.rot || 0);
  if (p.col) b = recolour(b, mainColour(it), p.col);
  if (on && SCREEN[p.id]) { const c = TV_COLS[Math.floor(T * 1.4) % TV_COLS.length]; b = b.map(x => (x[6] === SCREEN[p.id] ? [...x.slice(0, 6), c] : x)); }
  if (on && SHADE[p.id]) b = b.map(x => (x[6] === SHADE[p.id] ? [...x.slice(0, 6), p.id === 'l-lava' ? ['#f39ac6', '#ffb36b', '#ff7ab8'][Math.floor(T * 0.8) % 3] : '#fff6c0'] : x));
  return b;
}
export const PieceArt = ({ p, on, T, x = p.x, y = p.y, z = p.z || 0 }) => <g>{placedBoxes(p, on, T).map(([bx, by, bz, w, d, h, c], i) => <Box key={i} x={x + bx} y={y + by} z={z + bz} w={w} d={d} h={h} c={cols(c)} />)}</g>;
// the real extent of a piece on the floor (tighter than its cells)
function extent(p) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9;
  for (const [bx, by, bz, w, d] of placedBoxes(p)) { x0 = Math.min(x0, bx); x1 = Math.max(x1, bx + w); y0 = Math.min(y0, by); y1 = Math.max(y1, by + d); z0 = Math.min(z0, bz); }
  return { r: [p.x + x0, p.x + x1, p.y + y0, p.y + y1], z0 };
}

/* ---------------- what each piece is for ---------------- */
export const WORD = {
  'bed-single': 'bed', 'bed-double': 'bed', 'bed-bunk': 'bunk beds', 'bed-cot': 'cot', 'bed-day': 'day bed', 'bed-canopy': 'bed',
  'chair-arm': 'chair', 'sofa-2': 'sofa', 'sofa-3': 'sofa', 'sofa-corner': 'sofa', beanbag: 'bean bag', 'chair-dining': 'chair', stool: 'stool',
  'table-dining': 'table', 'table-coffee': 'table', desk: 'desk', 'table-side': 'table', 'table-cafe': 'table', dresser: 'mirror',
  wardrobe: 'wardrobe', drawers: 'drawers', bookcase: 'books', toybox: 'toy box', cubes: 'shelf', sideboard: 'cupboard',
  'k-base': 'cupboard', 'k-oven': 'cooker', 'k-fridge': 'fridge', 'k-sink': 'sink', 'k-island': 'worktop', 'k-washer': 'washer',
  'b-bath': 'bath', 'b-toilet': 'toilet', 'b-basin': 'sink', 'b-shower': 'shower', 'b-rail': 'towel', 'b-vanity': 'sink',
  'l-floor': 'lamp', 'l-table': 'lamp', 'l-pendant': 'light', 'l-lava': 'lava lamp', 'l-desk': 'lamp', 'l-fairy': 'lights',
  'p-tall': 'plant', 'p-cactus': 'cactus', 'p-fern': 'fern', 'p-hanging': 'plant', 'p-shelf': 'plants', 'p-bonsai': 'tree',
  'a-print': 'picture', 'a-poster': 'poster', 'a-mirror': 'mirror', 'a-clock': 'clock', 'a-shelf': 'shelf', 'a-gallery': 'pictures',
  't-dollhouse': 'doll house', 't-train': 'train', 't-teddy': 'teddy', 't-tent': 'tent', 't-easel': 'paint', 't-horse': 'horse',
  'e-tv': 'TV', 'e-pc': 'computer', 'e-console': 'games', 'e-speaker': 'music', 'e-record': 'music', 'e-arcade': 'games',
  'x-car': 'car', 'pet-dogbed': 'dog bed', 'pet-cattree': 'cat tree', 'pet-fish': 'fish', 'pet-hamster': 'hamster', 'pet-bird': 'bird', 'pet-bowls': 'bowls',
};
export const ACT = {
  wardrobe: 'dress', dresser: 'dress', bookcase: 'book', 'k-fridge': 'fridge', 'k-oven': 'cook', 'k-sink': 'sink', 'b-basin': 'sink', 'b-vanity': 'sink',
  'b-bath': 'bath', 'b-shower': 'shower', 'b-toilet': 'flush', 'k-washer': 'wash', 'e-record': 'music', 'e-speaker': 'music',
  't-easel': 'paint', 't-horse': 'rock', 't-teddy': 'hug', 'a-mirror': 'mirror', 'a-clock': 'clock', 't-train': 'train',
  'x-car': 'car', 'pet-fish': 'pet', 'pet-hamster': 'pet', 'pet-bird': 'pet', 'pet-cattree': 'pet', 'pet-dogbed': 'pet', 't-dollhouse': 'hug', 't-tent': 'tent',
};
const SEATDEF = { // local spots (piece facing +y): [x, y, z, dir]
  'chair-arm': [[1, 1.0, 0.65]], 'sofa-2': [[0.95, 1.05, 0.65], [2.05, 1.05, 0.65]], 'sofa-3': [[1.0, 1.05, 0.65], [2.0, 1.05, 0.65], [3.0, 1.05, 0.65]],
  'sofa-corner': [[2.6, 1.0, 0.64], [1.0, 2.7, 0.64, 3]], beanbag: [[0.5, 0.55, 0.5]], 'chair-dining': [[0.5, 0.5, 0.7]], stool: [[0.5, 0.5, 1.12]], 'bed-day': [[1.5, 1.0, 0.7]], 'x-car': [[1.7, 0.95, 0.75, 3]],
};
const BEDDEF = { 'bed-single': [[1.0, 1.35, 0.74]], 'bed-double': [[0.85, 1.4, 0.76], [2.15, 1.4, 0.76]], 'bed-canopy': [[0.85, 1.4, 0.76], [2.15, 1.4, 0.76]], 'bed-bunk': [[0.9, 1.45, 0.66], [0.9, 1.45, 2.06]], 'bed-cot': [[1.0, 1.0, 0.66]] };
const BOXES = { toybox: 'toy box', drawers: 'drawers', sideboard: 'cupboard', cubes: 'shelf', 'k-base': 'cupboard', 'k-island': 'cupboard', 'b-vanity': 'cupboard', 'table-side': 'drawer' };
const DIRV = [[0, 1], [-1, 0], [0, -1], [1, 0]];
const FACE = [['front', false], ['back', true], ['back', false], ['front', true]];
const HEADROT = [-120, -60, 60, 120]; // lying with the head pointing +y, -x, -y, +x
function rotPt(px, py, rot, f) { let [fw, fd] = f; for (let k = 0; k < rot; k++) { [px, py] = [fd - py, px]; [fw, fd] = [fd, fw]; } return [px, py]; }

/* ---------------- room art (walls, floor, window, door) ---------------- */
export function Patterns({ id, paper, ink, wall }) {
  const bg = <rect width="400" height="400" fill={wall} />;
  const P_ = (w, h, kids) => <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">{bg}{kids}</pattern>;
  switch (paper) {
    case 'stripe': return P_(44, 44, <rect x={0} y={0} width={18} height={44} fill={ink} opacity={0.55} />);
    case 'dots': return P_(40, 40, <g fill={ink}><circle cx={10} cy={10} r={5} /><circle cx={30} cy={30} r={5} /></g>);
    case 'check': return P_(60, 60, <g fill={ink} opacity={0.35}><rect width={30} height={60} /><rect width={60} height={30} /></g>);
    case 'diamond': return P_(50, 50, <path d="M25,6 L44,25 L25,44 L6,25 Z" fill="none" stroke={ink} strokeWidth={3} />);
    case 'wave': return P_(80, 36, <path d="M0,18 Q20,4 40,18 T80,18" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />);
    case 'flowers': return P_(70, 70, <g fill={ink}>{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={20 + 7 * Math.cos(a * Math.PI / 180)} cy={20 + 7 * Math.sin(a * Math.PI / 180)} r={5} />)}<circle cx={20} cy={20} r={3.5} fill={wall} /><circle cx={55} cy={55} r={4} opacity={0.6} /></g>);
    case 'stars': return P_(60, 60, <g fill={ink}><path d="M15,5 L18,13 L26,13 L20,18 L22,26 L15,21 L8,26 L10,18 L4,13 L12,13 Z" /><circle cx={45} cy={42} r={3} /></g>);
    default: return null;
  }
}
export function FloorArt({ RX, RY, floor, color }) {
  const W = RX * 100, H = RY * 100, k = [];
  if (floor === 'oak' || floor === 'walnut') {
    for (let j = 1; j < RY * 4; j++) k.push(<line key={'l' + j} x1={0} x2={W} y1={j * 25} y2={j * 25} stroke={hx(color, -0.12)} strokeWidth={2} />);
    for (let j = 0; j < RY * 4; j++) for (let i = (j % 3) * 60 + 40; i < W; i += 190) k.push(<line key={j + '-' + i} x1={i} x2={i} y1={j * 25} y2={j * 25 + 25} stroke={hx(color, -0.12)} strokeWidth={2} />);
  } else if (floor === 'tile') {
    for (let i = 50; i < W; i += 50) k.push(<line key={'x' + i} x1={i} x2={i} y1={0} y2={H} stroke="#fff" strokeWidth={3} opacity={0.8} />);
    for (let j = 50; j < H; j += 50) k.push(<line key={'y' + j} x1={0} x2={W} y1={j} y2={j} stroke="#fff" strokeWidth={3} opacity={0.8} />);
  } else if (floor === 'check') {
    for (let i = 0; i < W; i += 50) for (let j = 0; j < H; j += 50) if (((i + j) / 50) % 2) k.push(<rect key={i + '.' + j} x={i} y={j} width={50} height={50} fill={hx(color, -0.5)} />);
  } else if (floor === 'carpet') {
    for (let i = 0; i < 90; i++) k.push(<circle key={i} cx={(i * 97) % W} cy={(i * 53) % H} r={2} fill={hx(color, -0.08)} />);
  } else if (floor === 'lino') {
    for (let i = -H; i < W; i += 40) k.push(<line key={'d' + i} x1={i} y1={H} x2={i + H} y2={0} stroke={hx(color, -0.08)} strokeWidth={12} />);
    return <svg x={0} y={0} width={W} height={H} overflow="hidden"><rect width={W} height={H} fill={color} />{k}</svg>;
  }
  return <g><rect width={W} height={H} fill={color} />{k}</g>;
}
const winShape = (w, style) => (style === 'round' ? archPath(RH, w.x0, w.x1, w.z0, w.z1 - (w.x1 - w.x0) / 2) : `M${w.x0 * 100},${(RH - w.z0) * 100} V${(RH - w.z1) * 100} H${w.x1 * 100} V${(RH - w.z0) * 100} Z`);
function WindowArt({ w, style, frame }) {
  const a = w.x0 * 100, b = w.x1 * 100, t = (RH - w.z1) * 100, bt = (RH - w.z0) * 100, m = (a + b) / 2, shape = winShape(w, style);
  return <g>
    <path d={shape} fill="#bfe3f2" opacity={0.22} /><path d={`M${a},${bt - 40} L${b},${t + 30} V${t + 70} L${a},${bt}`} fill="#fff" opacity={0.25} />
    <path d={shape} fill="none" stroke={frame} strokeWidth={10} />
    <line x1={m} x2={m} y1={t} y2={bt} stroke={frame} strokeWidth={7} />
    {style !== 'wide' && <line x1={a} x2={b} y1={(t + bt) / 2 + 10} y2={(t + bt) / 2 + 10} stroke={frame} strokeWidth={7} />}
    <rect x={a - 14} y={bt} width={b - a + 28} height={12} fill={frame} />
  </g>;
}
function CurtainArt({ w, style, color }) {
  if (style === 'none') return null;
  const a = w.x0 * 100, b = w.x1 * 100, t = (RH - w.z1) * 100 - 26, bt = (RH - w.z0) * 100 + 30, d = hx(color, -0.15);
  if (style === 'blind') return <g><rect x={a - 6} y={t + 14} width={b - a + 12} height={70} fill={color} /><line x1={a} x2={b} y1={t + 50} y2={t + 50} stroke={d} strokeWidth={3} /><rect x={a - 6} y={t + 80} width={b - a + 12} height={8} fill={d} /></g>;
  const panel = (x, dir) => <path d={`M${x},${t} h${dir * 60} q${-dir * 22},${(bt - t) * 0.45} ${dir * 6},${bt - t} h${-dir * 66} Z`} fill={color} stroke={d} strokeWidth={2} />;
  return <g><rect x={a - 40} y={t - 6} width={b - a + 80} height={7} rx={3} fill="#3b2a24" />{panel(a - 34, 1)}{panel(b + 34, -1)}</g>;
}
function DoorArt({ o, u, style, color, frame, stairs }) {
  const w = 110, h = DH * 100, dk = hx(color, -0.12);
  if (stairs) return <Plane o={o} u={u} v={[0, 0, -1]}>
    <rect x={-10} y={-10} width={w + 20} height={h + 10} fill={frame} />
    <rect x={0} y={0} width={w} height={h} fill="#4a3a30" />
    {Array.from({ length: 8 }, (_, k) => <g key={k}><rect x={0} y={h - (k + 1) * 34} width={w} height={34} fill={k % 2 ? '#a07a52' : '#b58a5e'} /><rect x={0} y={h - (k + 1) * 34} width={w} height={6} fill="#d9b47e" /></g>)}
    {stairs === 'down' && <rect x={0} y={0} width={w} height={h} fill="#2b1d16" opacity={0.45} />}
    <line x1={8} y1={h - 20} x2={w - 8} y2={30} stroke={color} strokeWidth={8} strokeLinecap="round" />
  </Plane>;
  const panels = style === 'glazed' ? [[14, 18, w - 28, 140, '#bfe3f2'], [14, 190, w - 28, 110, dk]] : style === 'stable' ? [[12, 18, w - 24, 125, dk], [12, 170, w - 24, 130, dk]] : [[12, 18, w / 2 - 18, 120, dk], [w / 2 + 6, 18, w / 2 - 18, 120, dk], [12, 160, w / 2 - 18, 140, dk], [w / 2 + 6, 160, w / 2 - 18, 140, dk]];
  return <Plane o={o} u={u} v={[0, 0, -1]}>
    <rect x={-10} y={-10} width={w + 20} height={h + 10} fill={frame} />
    <rect x={0} y={0} width={w} height={h} fill={color} />
    {panels.map(([x, y, pw, ph, f], i) => <rect key={i} x={x} y={y} width={pw} height={ph} rx={3} fill={f} opacity={f === dk ? 0.7 : 1} />)}
    {style === 'stable' && <rect x={0} y={150} width={w} height={6} fill={dk} />}
    <circle cx={w - 16} cy={h * 0.52} r={6} fill="#c9a54a" />
  </Plane>;
}
function Shell({ g, s, uid }) {
  const { RX, RY } = g, paper = s.paper !== 'none', paperX = (s.paperX ?? s.paper) !== 'none';
  const fillY = paper ? `url(#${uid}y)` : s.wall, fillX = paperX ? `url(#${uid}x)` : hx(s.wallX ?? s.wall, -0.07), trim = s.trim, trimX = hx(trim, -0.08);
  return <g>
    <Slab RX={RX} RY={RY} />
    <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, RH], [0, 0, RH]])} fill={fillX} />
    <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>
      <path d={`M0,0 H${RX * 100} V${RH * 100} H0 Z ${g.win ? winShape(g.win, s.windowStyle) : ''}`} fill={fillY} fillRule="evenodd" />
      {g.win && <WindowArt w={g.win} style={s.windowStyle} frame={trim} />}
      {g.win && <CurtainArt w={g.win} style={s.curtainStyle} color={s.curtain} />}
    </Plane>
    <FloorPlane><FloorArt RX={RX} RY={RY} floor={s.floor} color={s.floorColor} /></FloorPlane>
    <polygon points={pts([[0.01, 0.01, 0], [RX, 0.01, 0], [RX, 0.01, 0.28], [0.01, 0.01, 0.28]])} fill={trim} />
    <polygon points={pts([[0.01, 0.01, 0], [0.01, RY, 0], [0.01, RY, 0.28], [0.01, 0.01, 0.28]])} fill={trimX} />
    <polygon points={pts([[0.01, 0.01, RH - 0.18], [RX, 0.01, RH - 0.18], [RX, 0.01, RH], [0.01, 0.01, RH]])} fill={trim} />
    <polygon points={pts([[0.01, 0.01, RH - 0.18], [0.01, RY, RH - 0.18], [0.01, RY, RH], [0.01, 0.01, RH]])} fill={trimX} />
    <WallCap RX={RX} RY={RY} RH={RH} />
  </g>;
}
function Rug({ g, s }) {
  if (!s.rug || s.rug === 'none') return null;
  let { x, y, w, d } = s.rugAt || g.rug; const c = s.rugColor;
  if (s.rug === 'runner') { y = y + d / 2 - 0.6; d = 1.2; }
  return <FloorPlane x={x} y={y} z={0.02}>{s.rug === 'round'
    ? <ellipse cx={w * 50} cy={d * 50} rx={w * 50} ry={d * 50} fill={c} stroke={hx(c, -0.15)} strokeWidth={10} />
    : <rect width={w * 100} height={d * 100} rx={8} fill={c} stroke={hx(c, -0.15)} strokeWidth={10} strokeDasharray={s.rug === 'fringe' ? '6 6' : undefined} />}</FloorPlane>;
}
function FrontEdge({ RX, RY, gap, trim = '#fffaf0', rail }) {
  if (rail) { const c = ['#e9f6fb', 'rgba(191,227,242,.55)', 'rgba(170,210,230,.55)']; return <g><Box x={0} y={RY} w={RX} d={0.1} h={1.1} c={c} /><Box x={RX} y={0} w={0.1} d={RY + 0.1} h={1.1} c={c} /><Box x={0} y={RY} z={1.1} w={RX + 0.1} d={0.12} h={0.08} c={cols('#5b5f66')} /><Box x={RX} y={0} z={1.1} w={0.12} d={RY + 0.1} h={0.08} c={cols('#5b5f66')} /></g>; }
  const c = [trim, '#ead8b8', '#e3d0ae'], h = 0.55;
  return <g>
    <Box x={0} y={RY} w={RX} d={0.2} h={h} c={c} />
    {gap ? <><Box x={RX} y={0} w={0.2} d={gap[0]} h={h} c={c} />{gap[1] < RY && <Box x={RX} y={gap[1]} w={0.2} d={RY + 0.2 - gap[1]} h={h} c={c} />}</> : <Box x={RX} y={0} w={0.2} d={RY + 0.2} h={h} c={c} />}
  </g>;
}

/* ---------------- a first layout from the seed ---------------- */
const WET = new Set(['kitchen', 'bath', 'toilet']);
function startStyle(r, kind) {
  const floor = WET.has(kind) ? pickR(r, ['tile', 'check', 'lino']) : kind === 'garage' ? 'tile' : kind === 'balcony' ? pickR(r, ['tile', 'oak'])
    : ['living', 'hall', 'landing', 'dining'].includes(kind) ? pickR(r, ['oak', 'walnut', 'carpet']) : pickR(r, ['carpet', 'carpet', 'oak']);
  const s = {
    wall: pickR(r, OPT.paints.slice(0, 13)), paper: r() < 0.45 ? pickR(r, OPT.papers.slice(1))[0] : 'none', paperInk: pickR(r, OPT.inks), trim: pickR(r, OPT.trims.slice(0, 3)),
    floor, floorColor: floor === 'carpet' ? pickR(r, OPT.carpets.slice(0, 6)) : floorBase(floor),
    windowStyle: pickR(r, ['sash', 'sash', 'round', 'wide']), curtainStyle: WET.has(kind) ? pickR(r, ['blind', 'none', 'curtains']) : pickR(r, ['curtains', 'curtains', 'blind']), curtain: pickR(r, OPT.curtainCols),
    doorStyle: pickR(r, ['panel', 'panel', 'glazed', 'stable']), doorColor: pickR(r, OPT.doorCols), rug: ['kitchen', 'garage', 'toilet'].includes(kind) ? 'none' : kind === 'hall' || kind === 'landing' ? 'runner' : pickR(r, ['round', 'rect', 'fringe', 'none']), rugColor: pickR(r, OPT.rugCols), mood: 'day',
  };
  if (kind === 'garage') Object.assign(s, { wall: '#e9e4dc', paper: 'none', floorColor: '#c9ccd1', curtainStyle: 'none', doorStyle: 'panel' });
  if (kind === 'balcony') Object.assign(s, { paper: 'none', curtainStyle: 'none', rug: 'none' });
  return s;
}
const tint = (r, n = 0.5) => (r() < n ? pickR(r, OPT.itemCols) : undefined);
const topOf = id => Math.max(...BY_ID[id].b.map(b => b[2] + b[5]));
// fill one room with things that suit it, wherever they fit around the doors
function furnish(g, r, kind, extra = {}) {
  const L = [], RX = g.RX, RY = Math.floor(g.RY);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fp = (id, rot) => { const f = BY_ID[id].f; return rot % 2 ? [f[1], f[0]] : f; };
  const underWin = (id, x, y, rot) => { if (!g.win || y > 0) return false; const [w] = fp(id, rot); return x < g.win.x1 && x + w > g.win.x0 && topOf(id) > (BY_ID[id].wall ? 1.4 : g.win.z0); };
  const put = (id, x, y, rot = 0, col) => { if (!BY_ID[id]) return null; const q = { id, x, y, rot }; if (col) q.col = col; if (underWin(id, x, y, rot) || whyNot(g, L, q)) return null; L.push(q); return q; };
  const first = (id, cands, col) => { for (const [x, y, rot = 0] of cands) { const q = put(id, x, y, rot, col); if (q) return q; } return null; };
  const range = n => Array.from({ length: Math.max(0, n) }, (_, i) => i);
  const back = id => shuffle(range(RX - fp(id, 0)[0] + 1)).map(x => [x, 0, 0]);
  const left = id => shuffle(range(RY - fp(id, 3)[1] + 1)).map(y => [0, y, 3]);
  const near = (id, rot, cx, cy) => { const [w, d] = fp(id, rot), c = []; for (let x = 0; x <= RX - w; x++) for (let y = 0; y <= RY - d; y++) c.push([x, y, rot, Math.hypot(x + w / 2 - cx, y + d / 2 - cy)]); return c.sort((a, b) => a[3] - b[3]); };
  const corner = id => { const [w, d] = fp(id, 0); return shuffle([[RX - w, 0], [0, 0], [RX - w, RY - d], [0, RY - d]]).map(([x, y]) => [x, y, 0]); };
  const wall = id => shuffle(range(RX - fp(id, 0)[0] + 1)).map(x => [x + 0.05, 0, 0]);
  const any = (id, rot = 0) => near(id, rot, RX / 2, RY / 2);
  const tableSet = (id, cx, cy, col) => {
    const t = first(id, near(id, 0, cx, cy).filter(c => c[1] >= 1), tint(r, 0.5)); if (!t) return;
    const [w, d] = fp(id, 0);
    for (const [x, y, rot] of [[t.x, t.y - 1, 0], [t.x + w - 1, t.y - 1, 0], [t.x, t.y + d, 2], [t.x + w - 1, t.y + d, 2]]) put('chair-dining', x, y, rot, col);
  };
  const plant = () => first(pickR(r, ['p-tall', 'p-fern', 'p-bonsai', 'p-cactus']), corner('p-tall'));
  const art = (ids) => first(pickR(r, ids), wall(ids[0]));
  if (kind === 'living') {
    const mid = g.win ? (g.win.x0 + g.win.x1) / 2 : RX / 2;
    const tv = first('e-tv', back('e-tv').sort((a, b) => Math.abs(a[0] + 1 - mid) - Math.abs(b[0] + 1 - mid)));
    const sofa = pickR(r, ['sofa-3', 'sofa-2', 'sofa-2', 'sofa-3']), col = tint(r, 0.7);
    if (tv) { first(sofa, near(sofa, 2, tv.x + 1, 4.3).filter(c => c[1] >= 3), col) || first(sofa, any(sofa, 2), col); first('table-coffee', near('table-coffee', 0, tv.x + 1, 2.4).filter(c => c[1] >= 1)); }
    else first(sofa, any(sofa, 0), col);
    if (r() < 0.65) first('chair-arm', near('chair-arm', 1, RX - 1.5, RY / 2 - 0.5), tint(r, 0.7)); else first('beanbag', near('beanbag', 0, RX - 1.5, RY / 2), tint(r, 0.6));
    first('bookcase', left('bookcase')); first('l-floor', corner('l-floor')); plant();
    art(['a-print', 'a-gallery', 'a-clock']); if (r() < 0.5) first('e-record', near('e-record', 0, RX - 1, RY - 2));
  } else if (kind === 'kitchen') {
    const run = ['k-fridge', 'k-base', 'k-sink', 'k-oven', 'k-base'];
    let done = false;
    for (const x0 of shuffle(range(RX - run.length + 1))) { const n = L.length; if (run.every((id, k) => put(id, x0 + k, 0))) { done = true; break; } L.length = n; }
    if (!done) run.forEach(id => first(id, back(id)));
    first('k-washer', back('k-washer'));
    if (extra.dining) { if (r() < 0.6) first('k-island', near('k-island', 0, RX / 2, RY / 2 + 0.5).filter(c => c[1] >= 2)); else tableSet('table-cafe', RX / 2, RY / 2 + 0.6, tint(r, 0.6)); }
    else tableSet('table-dining', RX / 2, RY / 2 + 0.6, tint(r, 0.6));
    plant(); art(['a-clock', 'a-shelf']);
  } else if (kind === 'dining') {
    tableSet('table-dining', RX / 2, RY / 2 + 0.3, tint(r, 0.6));
    first('sideboard', back('sideboard'), tint(r, 0.4)); plant(); first('l-floor', corner('l-floor')); art(['a-gallery', 'a-print']);
  } else if (kind === 'hall') {
    first(pickR(r, ['sideboard', 'drawers', 'cubes']), back('sideboard')); plant(); art(['a-mirror']); art(['a-clock', 'a-print']);
    if (r() < 0.3) first('pet-bowls', any('pet-bowls'));
  } else if (kind === 'landing') {
    first('bookcase', back('bookcase')); plant(); art(['a-print', 'a-poster']); if (r() < 0.4) first('beanbag', any('beanbag'), tint(r, 0.6));
  } else if (kind === 'toilet') {
    first('b-toilet', back('b-toilet')); first('b-basin', left('b-basin')) || first('b-basin', back('b-basin')); art(['a-mirror']); if (r() < 0.5) first('p-cactus', corner('p-cactus'));
  } else if (kind === 'garage') {
    first('x-car', near('x-car', 0, RX / 2, RY / 2 + 0.5).filter(c => c[1] >= 1)); first('cubes', back('cubes')); first('drawers', left('drawers'));
    if (r() < 0.5) first('k-washer', back('k-washer')); if (r() < 0.4) first('pet-dogbed', any('pet-dogbed'));
  } else if (kind === 'bedbig') {
    const mid = g.win ? (g.win.x0 + g.win.x1) / 2 : RX / 2, id = pickR(r, ['bed-double', 'bed-double', 'bed-canopy']);
    const bed = first(id, back(id).sort((a, b) => Math.abs(a[0] + 1.5 - mid) - Math.abs(b[0] + 1.5 - mid)), tint(r, 0.8)) || first('bed-double', any('bed-double'), tint(r, 0.8));
    if (bed && !bed.rot) { put('table-side', bed.x - 1, 0); put('table-side', bed.x + 3, 0); }
    first('wardrobe', left('wardrobe'), tint(r, 0.4)); first('drawers', left('drawers')); first('l-floor', corner('l-floor'));
    if (r() < 0.5) first('chair-arm', near('chair-arm', 1, RX - 1.5, RY - 2), tint(r, 0.6)); else plant();
    art(['a-mirror', 'a-print']); if (r() < 0.3) first('dresser', back('dresser'));
  } else if (kind === 'bed' || kind === 'box') {
    const id = kind === 'box' ? 'bed-single' : pickR(r, ['bed-single', 'bed-bunk', 'bed-single']);
    first(id, back(id).sort((a, b) => Math.min(a[0], RX - 2 - a[0]) - Math.min(b[0], RX - 2 - b[0])), tint(r, 0.8)) || first(id, any(id), tint(r, 0.8));
    first('toybox', back('toybox'), tint(r, 0.6));
    if (kind === 'bed') { const desk = first('desk', back('desk')); if (desk) put('chair-dining', desk.x, 1, 2, tint(r, 0.6)); }
    first(pickR(r, ['t-dollhouse', 't-teddy', 't-easel', 'pet-hamster']), any('t-teddy'));
    if (kind === 'bed') { const big = pickR(r, ['t-tent', 't-train', 't-horse']); first(big, near(big, 0, RX - 2, RY - 2)); first('beanbag', any('beanbag'), tint(r, 0.6)); first('l-lava', any('l-lava')); }
    art(['a-poster', 'a-print']);
  } else if (kind === 'bath') {
    first('b-bath', back('b-bath')); first('b-toilet', back('b-toilet')); first('b-basin', left('b-basin'));
    if (r() < 0.5) first('b-shower', corner('b-shower')); else plant();
    art(['b-rail']); if (r() < 0.5) art(['a-mirror']);
  } else if (kind === 'balcony') {
    const t = first('table-cafe', near('table-cafe', 0, RX / 2 + 0.5, 1.5)); if (t) { put('chair-dining', t.x - 1, t.y, 3, tint(r, 0.6)); put('chair-dining', t.x + 2, t.y, 1, tint(r, 0.6)); }
    first('p-tall', corner('p-tall')); first('p-fern', corner('p-fern')); if (r() < 0.5) first('p-cactus', any('p-cactus'));
  }
  return L;
}
export function furnishPlan(plan, seed) {
  const r = rng(seed * 13 + 5), rooms = {}, dining = !!plan.rooms.dining;
  for (const [rk, g] of Object.entries(plan.rooms)) if (g.kind !== 'garden') rooms[rk] = { style: startStyle(r, g.kind), items: furnish(g, r, g.kind, { dining }) };
  return rooms;
}
// the first New Street houses kept their hand-made layout
function legacyItems(r, rk) {
  const L = [];
  const add = (id, x, y, rot = 0, col) => L.push(col ? { id, x, y, rot, col } : { id, x, y, rot });
  if (rk === 'living') {
    add('e-tv', 3, 0); add(r() < 0.5 ? 'sofa-3' : 'sofa-2', 2, 4, 2, tint(r, 0.7)); add('table-coffee', 3, 2);
    if (r() < 0.65) add('chair-arm', 6, 2, 1, tint(r, 0.7)); else add('beanbag', 6, 2, 1, tint(r, 0.5));
    add(pickR(r, ['p-tall', 'p-fern', 'p-bonsai']), 8, 0); add('bookcase', 0, 2, 3); add('l-floor', 0, 6);
    add(pickR(r, ['a-print', 'a-clock']), 2.05, 0); if (r() < 0.5) add('e-record', 8, 4);
  } else if (rk === 'kitchen') {
    add('k-fridge', 0, 0); add('k-base', 1, 0); add('k-sink', 2, 0); add('k-oven', 3, 0); add('k-base', 4, 0); add('k-washer', 6, 0);
    const wood = tint(r, 0.5); add('table-dining', 2, 3, 0, wood);
    const ch = tint(r, 0.6); add('chair-dining', 2, 2, 0, ch); add('chair-dining', 4, 2, 0, ch); add('chair-dining', 2, 5, 2, ch); add('chair-dining', 4, 5, 2, ch);
    add(pickR(r, ['p-fern', 'p-tall', 'p-cactus']), 6, 5); add('a-clock', 6, 0);
  } else if (rk === 'bed1') {
    add(r() < 0.7 ? 'bed-double' : 'bed-canopy', 1, 0, 0, tint(r, 0.8)); add('table-side', 0, 0); add('table-side', 4, 0);
    add('wardrobe', 0, 4, 3, tint(r, 0.4)); add('drawers', 0, 2, 3); add('l-floor', 6, 0); add('a-mirror', 4.0, 0);
    add(pickR(r, ['p-tall', 'p-fern', 'chair-arm']), 5, 3, 1, tint(r, 0.5));
  } else if (rk === 'bed2') {
    add(r() < 0.5 ? 'bed-single' : 'bed-bunk', 0, 0, 0, tint(r, 0.8)); add('toybox', 2, 0, 0, tint(r, 0.6)); add('desk', 3, 0); add('chair-dining', 3, 1, 2, tint(r, 0.6));
    add(pickR(r, ['t-dollhouse', 't-teddy', 't-easel']), 6, 0); const big = pickR(r, ['t-tent', 't-train', 't-horse']); add(big, 4, 3);
    add('beanbag', 1, 4, 0, tint(r, 0.6)); add(pickR(r, ['a-poster', 'a-print']), 6.1, 0); add('l-lava', 2, 3);
  } else if (rk === 'bath') {
    add('b-bath', 0, 0); add('b-toilet', 3, 0); add('b-basin', 0, 2, 3);
    if (r() < 0.5) add('b-shower', 4, 3); else add('p-fern', 5, 4);
    add('b-rail', 5.05, 0); if (r() < 0.5) add('a-mirror', 0.9, 0);
  }
  return L;
}
export function ensureRooms(fam) {
  if (!fam.rooms) {
    if (fam.plan) fam.rooms = furnishPlan(fam.plan, fam.seed);
    else { const r = rng(fam.seed * 13 + 5); fam.rooms = {}; for (const rk of ['living', 'kitchen', 'bed1', 'bed2', 'bath']) fam.rooms[rk] = { style: startStyle(r, LEGACY.rooms[rk].kind), items: legacyItems(r, rk) }; }
  }
  if (!fam.store) fam.store = {};
  return fam;
}
// a new house of a type (or a new layout of the same type): everything is made again from a new seed
export function newLayout(fam, type) {
  fam.seed = Math.floor(Math.random() * 1e9);
  fam.plan = makePlan(type, fam.seed); fam.rooms = furnishPlan(fam.plan, fam.seed); fam.store = {}; fam.locked = false;
  return fam;
}

/* ---------------- the outside of the house (map) ---------------- */
const HOUSE = ['#e2b06a', '#f3d6cf', '#cfe3d4', '#d6dcef', '#f2e2b6', '#e8c4b0', '#c9d8e6'];
const ROOFS = ['#9a4a3a', '#5b5f66', '#7a4a3a', '#4f6d8f', '#6b7f4a'];
const ACCENT = ['#e86a92', '#5b9bd5', '#f2b84b', '#7cc9a8', '#b58ee0', '#ef6f5e'];
export function houseLook(seed) { const r = rng(seed * 7 + 3); return { wall: pickR(r, HOUSE), roof: pickR(r, ROOFS), door: pickR(r, ACCENT) }; }

/* ---------------- the garden (not decorated yet) ---------------- */
function Tree({ x, y }) { const g = P(x, y, 1.8); return <g><Box x={x - 0.15} y={y - 0.15} w={0.3} d={0.3} h={1.9} c={cols('#8a6242')} />{[[-50, -10, 55], [40, -20, 50], [0, -60, 60], [-30, -90, 45], [35, -85, 45]].map(([dx, dy, rr], i) => <circle key={i} cx={g[0] + dx} cy={g[1] + dy} r={rr} fill={['#6b9a44', '#7aa84e', '#8fbf5a'][i % 3]} />)}</g>; }
function Bench({ x, y, c }) { return <g>{[0, 1.3].map(a => <Box key={a} x={x + a} y={y} w={0.12} d={0.5} h={0.42} c={cols('#3a3a3c')} />)}<Box x={x} y={y} z={0.42} w={1.42} d={0.5} h={0.07} c={cols(c)} /><Box x={x} y={y + 0.42} z={0.49} w={1.42} d={0.08} h={0.45} c={cols(c)} /></g>; }
function Trampoline({ x, y }) { const a = P(x, y, 0.5); return <g>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([u, v], i) => { const p = P(x + u * 0.8, y + v * 0.8, 0), q = P(x + u * 0.8, y + v * 0.8, 0.5); return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#3a3a3c" strokeWidth={4} />; })}<ellipse cx={a[0]} cy={a[1]} rx={120} ry={60} fill="#3f6e9a" /><ellipse cx={a[0]} cy={a[1]} rx={102} ry={50} fill="#2b2b2e" /></g>; }
function Pool({ x, y }) { const a = P(x, y, 0.25); return <g><ellipse cx={a[0]} cy={a[1] + 18} rx={110} ry={54} fill="#5b9bd5" /><ellipse cx={a[0]} cy={a[1]} rx={110} ry={54} fill="#7cc9e8" stroke="#e86a92" strokeWidth={12} /><path d={`M${a[0] - 40},${a[1]} q20,-8 40,0 q20,8 40,0`} fill="none" stroke="#fff" strokeWidth={4} opacity={0.7} /></g>; }
function Flowers({ x, y, w, r }) { return <FloorPlane z={0.01} x={x} y={y}><rect x={0} y={0} width={w * 100} height={60} rx={10} fill="#8a5a33" />{[...Array(Math.round(w * 5))].map((_, i) => <circle key={i} cx={12 + i * 20} cy={20 + (i % 2) * 20} r={8} fill={pickR(r, ['#f39ac6', '#ffd45e', '#ef6f5e', '#b58ee0', '#fbf8f2'])} />)}</FloorPlane>; }
function GardenShell({ RX, RY }) {
  return <g>
    <Slab RX={RX} RY={RY} />
    <FloorPlane><rect x={0} y={0} width={RX * 100} height={RY * 100} fill="#86b955" />{[...Array(60)].map((_, i) => <path key={i} d={`M${(i * 131) % (RX * 100)},${(i * 71) % (RY * 100)} l4,-12 l4,12`} fill="none" stroke="#6fa045" strokeWidth={3} />)}</FloorPlane>
    <BackWallY RX={RX} RH={2.6} fill="#c9825f" /><FaceY y={0.005} x0={0} z1={2.6}>{[...Array(Math.ceil(RX * 100 / 40))].map((_, i) => [...Array(13)].map((__, j) => <rect key={i + '-' + j} x={i * 40 + (j % 2) * 20} y={j * 20} width={38} height={18} fill={(i + j) % 3 ? '#c27a57' : '#b56f4f'} />))}</FaceY>
    <BackWallX RY={RY} RH={1.4} fill="#a9784a" /><FaceX x={0.01} y1={RY} z1={1.4}>{[...Array(Math.ceil(RY * 100 / 25))].map((_, i) => <rect key={i} x={i * 25} y={0} width={22} height={140} fill={i % 2 ? '#b8885a' : '#a9784a'} />)}</FaceX>
  </g>;
}

/* ---------------- turning the data into game rooms ---------------- */
const roomBox = (RX, RY) => { const xs = [P(0, RY, 0)[0], P(RX, 0, 0)[0]], ys = [P(0, 0, RH)[1], P(RX, RY, -0.35)[1]]; return [xs[0] - 160, ys[0] - 120, xs[1] - xs[0] + 320, ys[1] - ys[0] + 200]; };
const dY = (id, to, cell, text, z = 3.55) => ({ id, to, toDoor: null, at: [cell + 0.5, 0.42], in: [cell + 0.5, 1.3], zone: [cell, cell + 1, -0.3, 0.7], hit: ['door-' + id], label: { at: [cell + 0.5, 0, z], text } });
const dX = (id, to, cell, text) => ({ id, to, toDoor: null, at: [0.42, cell + 0.5], in: [1.3, cell + 0.5], zone: [-0.3, 0.7, cell, cell + 1], hit: ['door-' + id], label: { at: [0, cell + 0.5, 3.55], text } });
// what a door sign says: the room's name, or Upstairs / Downstairs
const doorText = (plan, g, to) => { const t = plan.rooms[to]; return !t ? to : t.floor > g.floor ? 'Upstairs' : t.floor < g.floor ? 'Downstairs' : t.name; };
const stairsOf = (plan, g, to) => { const t = plan.rooms[to]; return t && t.floor !== g.floor ? (t.floor > g.floor ? 'up' : 'down') : null; };
const bgItem = (key, el, hit = 'none') => ({ key, kind: 'bg', hit, el });
export const HBROOMS = {}; // rid -> { fam, rk, pieces: { key: index } }
export const pieceKey = (p, i) => p.id + '#' + i;

// paint order for pieces on the grid: things further back first
function paintOrder(list) {
  const n = list.length, ind = new Array(n).fill(0), out = list.map(() => []);
  const ov = (a0, a1, b0, b1) => a0 < b1 - 1e-6 && b0 < a1 - 1e-6;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue; const a = list[i].r, b = list[j].r;
    if ((a[1] <= b[0] + 1e-6 && ov(a[2], a[3], b[2], b[3])) || (a[3] <= b[2] + 1e-6 && ov(a[0], a[1], b[0], b[1]))) { out[i].push(j); ind[j]++; }
  }
  const key = i => (list[i].r[0] + list[i].r[1] + list[i].r[2] + list[i].r[3]) / 2, ready = [], order = [];
  for (let i = 0; i < n; i++) if (!ind[i]) ready.push(i);
  while (ready.length) { ready.sort((p, q) => key(p) - key(q)); const i = ready.shift(); order.push(i); for (const j of out[i]) if (--ind[j] === 0) ready.push(j); }
  for (let i = 0; i < n; i++) if (!order.includes(i)) order.push(i);
  return order.map(i => list[i]);
}

function buildRoom(fam, rk, ids) {
  const plan = planOf(fam), g = plan.rooms[rk], R = fam.rooms[rk], s = R.style, rid = ids[rk], uid = 'hb' + rid.replace(/[^a-z0-9]/gi, '');
  const items = [], seats = {}, beds = {}, boxes = {}, pieces = {};
  items.push(bgItem('__defs', <defs><Patterns id={uid + 'y'} paper={s.paper} ink={s.paperInk} wall={s.wall} /><Patterns id={uid + 'x'} paper={s.paperX ?? s.paper} ink={hx(s.inkX ?? s.paperInk, -0.08)} wall={hx(s.wallX ?? s.wall, -0.07)} />
    <radialGradient id="hbglow"><stop offset="0" stopColor="#ffe3a0" stopOpacity=".75" /><stop offset=".45" stopColor="#ffd98a" stopOpacity=".3" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient></defs>));
  items.push(bgItem('shell', <Shell g={g} s={s} uid={uid} />, 'floor'));
  items.push(bgItem('rug', <Rug g={g} s={s} />, 'floor'));
  for (const [id, x] of g.doorsY) items.push(bgItem('door-' + id, <DoorArt o={[x - 0.05, 0.02, DH]} u={[1, 0, 0]} style={s.doorStyle} color={s.doorColor} frame={s.trim} stairs={stairsOf(plan, g, id)} />, 'obj'));
  for (const [id, y] of g.doorsX) items.push(bgItem('door-' + id, <DoorArt o={[0.02, y - 0.05, DH]} u={[0, 1, 0]} style={s.doorStyle} color={s.doorColor} frame={hx(s.trim, -0.08)} stairs={stairsOf(plan, g, id)} />, 'obj'));
  const occ = occupancy(R.items, -1);
  const freeAt = (x, y) => x > 0.25 && y > 0.25 && x < g.RX - 0.25 && y < g.RY - 0.25 && !occ.has(Math.floor(x) + ',' + Math.floor(y));
  const standBy = (pt, rect, dirs) => {
    for (const d of dirs) { const [vx, vy] = DIRV[d]; const q = [vx ? (vx > 0 ? rect[1] + 0.45 : rect[0] - 0.45) : pt[0], vy ? (vy > 0 ? rect[3] + 0.45 : rect[2] - 0.45) : pt[1]]; if (freeAt(...q)) return q; }
    const [vx, vy] = DIRV[dirs[0]]; return [vx ? (vx > 0 ? rect[1] + 0.45 : rect[0] - 0.45) : pt[0], vy ? (vy > 0 ? rect[3] + 0.45 : rect[2] - 0.45) : pt[1]];
  };
  const lamps = [], floorList = [];
  R.items.forEach((p, i) => {
    const it = BY_ID[p.id]; if (!it) return;
    const key = pieceKey(p, i), rot = p.rot || 0, f = it.f, [fw, fd] = fpOf(p);
    pieces[key] = i; WORDS[key] = WORD[p.id] || it.n.toLowerCase();
    const toggle = TOGGLE.has(p.id);
    const el = <PieceArt p={p} />;
    const render = toggle ? (ctx => <PieceArt p={p} on={!!(ctx.W.hbOn && ctx.W.hbOn[rid + ':' + key])} T={ctx.T} />) : undefined;
    if (it.c === 'lights') lamps.push({ p, key });
    if (it.wall) { items.push({ key, kind: 'wall', hit: 'obj', el, render, sort: [p.x, p.x + fw, 0, 0.3] }); return; }
    const { r, z0 } = extent(p), cellR = [p.x, p.x + fw, p.y, p.y + fd];
    floorList.push({ key, kind: 'furn', hit: 'obj', el, render, sort: r, block: z0 < 1.4 && p.id !== 'sofa-corner' ? r : undefined, r });
    const W2 = (lx, ly) => { const [x, y] = rotPt(lx, ly, rot, f); return [p.x + x, p.y + y]; };
    (SEATDEF[p.id] || []).forEach(([lx, ly, z, dl = 0], k) => {
      const [x, y] = W2(lx, ly), d = (dl + rot) % 4, [face, flip] = FACE[d];
      seats[key + (k ? '~' + k : '')] = { stand: standBy([x, y], cellR, [d, (d + 1) % 4, (d + 3) % 4, (d + 2) % 4]), seat: [x, y, z], face, flip };
    });
    (BEDDEF[p.id] || []).forEach(([lx, ly, z], k) => {
      const [x, y] = W2(lx, ly), side = (3 + rot) % 4;
      beds[key + (k ? '~' + k : '')] = { stand: standBy([x, y], cellR, [side, (side + 2) % 4, rot % 4]), lie: [x, y, z], rot: HEADROT[(2 + rot) % 4], blanket: p.col || mainColour(it) };
    });
    if (p.id === 'sofa-corner') { // an L shape: block both arms
      const rectOf = (a, b) => { const [ax, ay] = W2(...a), [bx, by] = W2(...b); return [Math.min(ax, bx), Math.max(ax, bx), Math.min(ay, by), Math.max(ay, by)]; };
      items.push({ key: key + '/a', kind: 'blk', block: rectOf([0.1, 0.1], [3.9, 1.6]) }, { key: key + '/b', kind: 'blk', block: rectOf([0.1, 1.6], [1.6, 3.9]) });
    }
    if (BOXES[p.id]) { const [x, y] = W2(fw / 2, fd), d = rot % 4; boxes[key] = { keys: [key], word: BOXES[p.id], at: standBy([x, y], cellR, [d, (d + 1) % 4, (d + 3) % 4]) }; }
  });
  items.push(...paintOrder(floorList).map(({ r, ...x }) => x));
  items.push({ key: 'front', kind: 'front', hit: 'none', el: <FrontEdge RX={g.RX} RY={g.RY} gap={g.out} trim={s.trim} rail={g.kind === 'balcony'} /> });
  // lamps glow at night when the light is on, or when switched on
  items.push({ key: 'glow', kind: 'overlay', hit: 'none', render: ctx => {
    const W = ctx.W, dark = darkness(W), lit = isLit(W, rid) && dark > 0.25, mood = s.mood;
    const on = lamps.filter(l => (W.hbOn && W.hbOn[rid + ':' + l.key]) || lit || mood === 'evening');
    return <g pointerEvents="none">
      {mood !== 'day' && <polygon points={pts([[-0.2, -0.2, RH], [g.RX + 0.2, -0.2, RH], [g.RX + 0.2, -0.2, -0.35], [g.RX + 0.2, g.RY + 0.2, -0.35], [-0.2, g.RY + 0.2, -0.35], [-0.2, g.RY + 0.2, RH]])} fill={mood === 'warm' ? '#ffb45a' : '#3a3a78'} opacity={mood === 'warm' ? 0.14 : 0.3} style={{ mixBlendMode: 'multiply' }} />}
      {on.map(({ p, key }) => { const wall = isWall(p), [fw, fd] = fpOf(p), top = p.id === 'l-floor' ? 2.4 : p.id === 'l-pendant' ? 2.8 : wall ? 3.3 : 0.7; const [x, y] = P(p.x + fw / 2, (wall ? 0.1 : p.y + fd / 2), top);
        return <ellipse key={key} cx={x} cy={y} rx={wall ? 220 : 190} ry={wall ? 110 : 130} fill="url(#hbglow)" />; })}
    </g>; } });
  const doors = [...g.doorsY.map(([id, x]) => dY(id, ids[id], x, doorText(plan, g, id))), ...g.doorsX.map(([id, y]) => dX(id, ids[id], y, doorText(plan, g, id)))];
  if (g.out) doors.unshift({ id: 'out', at: [g.RX - 0.3, (g.out[0] + g.out[1]) / 2], in: [g.RX - 1.5, (g.out[0] + g.out[1]) / 2], zone: [g.RX - 0.45, g.RX + 0.9, g.out[0], g.out[1]], special: 'map', label: { at: [g.RX + 0.15, (g.out[0] + g.out[1]) / 2, 1.5], text: 'Out' } });
  return { name: g.name, RX: g.RX, RY: g.RY, items, seats, beds, containers: boxes, doors, pieces, outdoor: g.kind === 'balcony' };
}

function buildGarden(fam, rk, ids) {
  const g = geoOf(fam, rk), r = rng(fam.seed), RX = g.RX, RY = g.RY, extra = (r(), r());
  const [to, cell] = g.doorsY[0] || ['kitchen', 1], cx = cell + 0.2;
  const tx = Math.min(5.0, RX * 0.55), ty = RY * 0.6, fx = Math.max(cx + 3.2, RX - 4.2);
  const items = [
    bgItem('shell', <GardenShell RX={RX} RY={RY} />, 'floor'),
    bgItem('door-' + to, <g><FaceY y={0.02} x0={cx} z1={2.3}><rect x={-6} y={-6} width={107} height={236} fill="#fbf8f2" /><rect x={0} y={0} width={95} height={230} fill="#8a6242" /></FaceY><FaceY y={0.02} x0={cx + 2.0} z1={2.3}><rect x={0} y={0} width={140} height={100} fill="#fbf8f2" /><rect x={8} y={8} width={124} height={84} fill="#cfe6f2" /></FaceY></g>, 'obj'),
    bgItem('flowers', <Flowers x={fx} y={0.2} w={Math.min(3.8, RX - fx - 0.2)} r={r} />, 'floor'),
    { key: 'tree', kind: 'furn', hit: 'obj', sort: [0.3, 0.9, RY - 1.9, RY - 1.3], block: [0.3, 0.9, RY - 1.9, RY - 1.3], el: <Tree x={0.6} y={RY - 1.6} /> },
    { key: 'bench', kind: 'furn', hit: 'obj', sort: [RX - 2.8, RX - 1.38, 0.9, 1.4], block: [RX - 2.8, RX - 1.38, 0.9, 1.4], el: <Bench x={RX - 2.8} y={0.9} c={pickR(r, ['#c9a16a', '#a87b4f', '#e2c393', '#8a6242'])} /> },
    extra < 0.5 ? { key: 'trampoline', kind: 'furn', hit: 'obj', sort: [tx - 0.8, tx + 0.8, ty - 0.8, ty + 0.8], block: [tx - 0.8, tx + 0.8, ty - 0.8, ty + 0.8], el: <Trampoline x={tx} y={ty} /> } : { key: 'pool', kind: 'furn', hit: 'obj', sort: [tx - 1, tx + 1, ty - 1, ty + 1], block: [tx - 1, tx + 1, ty - 1, ty + 1], el: <Pool x={tx} y={ty} /> },
    { key: 'front', kind: 'front', hit: 'none', el: <FrontEdge RX={RX} RY={RY} /> },
  ];
  Object.assign(WORDS, { tree: 'tree', bench: 'bench', trampoline: 'trampoline', pool: 'pool', flowers: 'flowers' });
  return { name: 'Garden', RX, RY, items, outdoor: true, seats: { bench: { stand: [RX - 2.1, 1.9], seat: [RX - 2.1, 1.2, 0.45], face: 'front' } }, beds: {}, containers: {},
    doors: [{ id: to, to: ids[to], toDoor: null, at: [cx + 0.48, 0.42], in: [cx + 0.48, 1.3], zone: [cx, cx + 0.95, -0.3, 0.7], hit: ['door-' + to], label: { at: [cx + 0.48, 0, 2.95], text: geoOf(fam, to) ? geoOf(fam, to).name : 'Kitchen' } }] };
}

export const roomIds = fam => Object.fromEntries(Object.keys(planOf(fam).rooms).map(rk => [rk, fam.id + ':' + rk]));
// rooms that no longer exist after a new layout
export function dropRooms(rids) {
  for (const rid of rids) { unregisterRoom(rid); OUTSIDE.delete(rid); delete HBROOMS[rid]; resetNav(rid); for (const T of [SEATS, BEDS, CONTAINERS]) for (const key of Object.keys(T)) if (key.startsWith(rid + ':')) delete T[key]; }
}
// Build (or rebuild) all the rooms of one family's house and register them with the game.
export function buildHouse(fam, only) {
  ensureRooms(fam);
  const f = fam.id, place = 'h:' + f, ids = roomIds(fam), plan = planOf(fam);
  const keys = only ? [only] : Object.keys(plan.rooms);
  for (const k of keys) {
    const R = plan.rooms[k].kind === 'garden' ? buildGarden(fam, k, ids) : buildRoom(fam, k, ids);
    const rid = ids[k];
    for (const d of R.doors) if (d.to) d.toDoor = k;
    for (const T of [SEATS, BEDS, CONTAINERS]) for (const key of Object.keys(T)) if (key.startsWith(rid + ':')) delete T[key];
    registerRoom(rid, { name: R.name, gen: R.items, place, fam: f, rk: k, decor: plan.rooms[k].kind !== 'garden', floor: plan.rooms[k].floor, box: roomBox(R.RX, R.RY), bounds: [0.3, R.RX - 0.25, 0.3, R.RY - 0.25], doors: R.doors, outdoor: !!R.outdoor });
    if (R.outdoor) OUTSIDE.add(rid); else OUTSIDE.delete(rid);
    for (const [key, s] of Object.entries(R.seats)) SEATS[rid + ':' + key] = s;
    for (const [key, b] of Object.entries(R.beds)) BEDS[rid + ':' + key] = { room: rid, ...b };
    for (const [key, c] of Object.entries(R.containers)) CONTAINERS[rid + ':' + key] = { room: rid, ...c };
    HBROOMS[rid] = { fam: f, rk: k, pieces: R.pieces || {} };
    resetNav(rid);
  }
  return { ids, place, name: fam.name };
}
export const pieceAt = (rid, key) => { const h = HBROOMS[rid]; return h && h.pieces[key] != null ? { ...h, i: h.pieces[key] } : null; };
