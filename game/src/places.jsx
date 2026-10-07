// Things to do in town: the cafe menu, ice creams at the park, the shopping list, school lunch.
import React, { useState } from 'react';
import { SFX, speak, pick } from './core.js';
import { ItemArt } from './items.jsx';
import { HeadIcon, NAMES } from './people.jsx';

const Icon = ({ it, size = 52 }) => <svg viewBox="-30 -52 60 60" width={size} height={size} aria-hidden="true"><ItemArt it={it} /></svg>;
const money = p => '£' + (p / 100).toFixed(2);

/* ---------------- cafe and school lunch menus ---------------- */
export const CAFE_MENU = [
  { kind: 'hotchoc', word: 'hot chocolate', price: 310 }, { kind: 'juice', word: 'juice', price: 220 }, { kind: 'water', word: 'water', price: 120 },
  { kind: 'cake', word: 'cake', price: 300 }, { kind: 'croissant', word: 'croissant', price: 230 }, { kind: 'crisps', word: 'crisps', price: 110 },
  { kind: 'coffee', word: 'coffee', price: 280, grown: true },
];
export const LUNCH_MENU = [
  { kind: 'pizza', word: 'pizza' }, { kind: 'apple', word: 'apple' }, { kind: 'juice', word: 'juice' }, { kind: 'water', word: 'water' }, { kind: 'cake', word: 'cake' },
];
export function MenuPanel({ title, menu, free, onPay, onClose }) {
  const [tray, setTray] = useState([]);
  const total = tray.reduce((a, k) => a + (menu.find(m => m.kind === k).price || 0), 0);
  return <div className="sheet menu-sheet" role="dialog" aria-label={title} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(title, 'narrator')}>{title}</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="menu-grid">{menu.map(m => <button key={m.kind} className="tile menu-item" onClick={() => { speak(m.word, 'word'); SFX.pop(); setTray(t => (t.length >= 3 ? [...t.slice(1), m.kind] : [...t, m.kind])); }}>
      <Icon it={{ kind: m.kind }} /><span className="mi-word">{m.word}</span>{!free && <span className="mi-price">{money(m.price)}</span>}</button>)}</div>
    <div className="menu-foot">
      <div className="tray-row">{tray.length ? tray.map((k, i) => <button key={i} className="tray-thing" aria-label={'take out ' + k} onClick={() => setTray(t => t.filter((_, j) => j !== i))}><Icon it={{ kind: k }} size={40} /></button>) : <span className="empty">Tap what you would like.</span>}</div>
      {!free && tray.length > 0 && <button className="price-total" onClick={() => speak(`That is ${(total / 100).toFixed(2)} pounds`, 'narrator')}>{money(total)}</button>}
      <button className="done" disabled={!tray.length} onClick={() => { onPay(tray); setTray([]); }}>{free ? 'Yes please!' : 'Pay'}</button>
    </div>
  </div>;
}

/* ---------------- ice cream van ---------------- */
const FLAVOURS = [['strawberry', '#f7a9c4'], ['vanilla', '#fff3d6'], ['chocolate', '#8a5a3a'], ['mint', '#a8e6c8']];
export function IceCreamPanel({ outfits, onMake, onClose }) {
  const [scoops, setScoops] = useState(['strawberry']);
  const [sprinkles, setSprinkles] = useState(false);
  const [forWho, setForWho] = useState(null);
  return <div className="sheet fridge" role="dialog" aria-label="Ice cream" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Make an ice cream!', 'narrator')}>Ice cream!</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="fridge-body">
      <svg viewBox="-30 -56 60 64" width="90" height="96" aria-hidden="true"><ItemArt it={{ kind: 'icecream', scoops, sprinkles }} /></svg>
      <div className="choices">{FLAVOURS.map(([f, col]) => <button key={f} className="tile food" onClick={() => { speak(f, 'word'); SFX.pop(); setScoops(s => (s.length >= 3 ? [...s.slice(1), f] : [...s, f])); }}>
        <svg viewBox="-14 -14 28 28" width="34" height="34"><circle r={12} fill={col} stroke="rgba(0,0,0,.15)" /></svg><span>{f}</span></button>)}
        <button className="tile food" aria-pressed={sprinkles} onClick={() => { setSprinkles(v => !v); speak('sprinkles', 'word'); SFX.sparkle(); }}><svg viewBox="-14 -14 28 28" width="34" height="34">{[[-6, -4, '#e23b3b'], [4, -6, '#3d8fe0'], [0, 3, '#ffd23f'], [7, 4, '#4cc76a'], [-7, 6, '#e86a92']].map(([x, y, c], i) => <rect key={i} x={x} y={y} width={6} height={2.5} rx={1.2} fill={c} transform={`rotate(${i * 40} ${x} ${y})`} />)}</svg><span>sprinkles</span></button>
        <button className="tile food" onClick={() => { setScoops([]); SFX.whoosh(); }}><span>empty</span></button></div>
      <div className="for-who"><span>Who is it for?</span>{['callie', 'chloe', 'mum', 'dad', 'connor'].map(w => <button key={w} className="who" aria-pressed={forWho === w} onClick={() => { setForWho(w); speak(NAMES[w], 'word'); }}><HeadIcon who={w} o={outfits[w]} size={32} /><small>{NAMES[w]}</small></button>)}</div>
      <button className="done" disabled={!scoops.length} onClick={() => { onMake(scoops, sprinkles, forWho); setScoops(['strawberry']); setSprinkles(false); }}>Make it!</button>
    </div>
  </div>;
}

/* ---------------- supermarket ---------------- */
// id: [word, shape, colour, colour 2]
export const GROC = {
  apples: ['apples', 'round', '#e23b3b'], bananas: ['bananas', 'bunch', '#f7d23f'], carrots: ['carrots', 'carrot', '#f28a1c'], grapes: ['grapes', 'grapes', '#8e5ad1'], oranges: ['oranges', 'round', '#f2a127'],
  milk: ['milk', 'carton', '#fbf8f2', '#3d8fe0'], cheese: ['cheese', 'wedge', '#f7c948'], eggs: ['eggs', 'eggs', '#fff6e0'], yogurt: ['yogurt', 'pot', '#f7c6d6', '#e85a7a'], butter: ['butter', 'block', '#fff0a8', '#3f8a5a'],
  ham: ['ham', 'pack', '#f2a5a5'], chicken: ['chicken', 'pack', '#f2d2b0'], sausages: ['sausages', 'pack', '#c96a4a'],
  peas: ['peas', 'bag', '#4cc76a', '#3d8fe0'], icecream: ['ice cream', 'tub', '#f7c6d6', '#3d8fe0'], fishfingers: ['fish fingers', 'box', '#3d8fe0', '#f2a127'], pizza: ['pizza', 'box', '#e0524a', '#f7c948'],
  bread: ['bread', 'loaf', '#e3b06a'], buns: ['buns', 'round', '#e3a54a'], cake: ['cake', 'cake', '#f7c6d6'], cookies: ['cookies', 'round', '#c4863a'],
  cereal: ['cereal', 'box', '#f2c94c', '#e0524a'], porridge: ['porridge', 'box', '#c9a777', '#3f7fc4'],
  pasta: ['pasta', 'bag', '#f7d78a', '#e0524a'], beans: ['beans', 'tin', '#3fb6c9', '#e98a3a'], soup: ['soup', 'tin', '#e0524a', '#fbf8f2'], rice: ['rice', 'bag', '#fbf8f2', '#3f8a5a'],
  crisps: ['crisps', 'bag', '#e0524a', '#f7c948'], sweets: ['sweets', 'bag', '#e85a7a', '#7a4fd1'], choc: ['chocolate', 'bar', '#7a4a2a', '#8e5ad1'],
  juice: ['juice', 'carton', '#f2a127', '#4cc76a'], pop: ['pop', 'bottle', '#e0524a'], water: ['water', 'bottle', '#bfe0f7'],
  jam: ['jam', 'jar', '#c4304f'], honey: ['honey', 'jar', '#f2a127'], flour: ['flour', 'bag', '#fbf8f2', '#3f7fc4'],
  soap: ['soap', 'bottle', '#a8e6c8'], bubbles: ['bubbles', 'bottle', '#bfe0f7'], toiletroll: ['loo roll', 'roll', '#fbf8f2'],
  ball: ['ball', 'round', '#3d8fe0'], teddy: ['teddy', 'teddy', '#c4863a'], crayons: ['crayons', 'box', '#ffd23f', '#e23b3b'],
  plasters: ['plasters', 'box', '#f7c6d6', '#3d8fe0'], toothpaste: ['toothpaste', 'tube', '#fbf8f2', '#3d8fe0'], nappies: ['nappies', 'pack', '#bcdcea'],
};
export const SECTIONS = {
  VegStand: { name: 'Fruit and veg', items: ['apples', 'bananas', 'carrots', 'grapes', 'oranges'], stand: [2.0, 4.8] },
  Chiller: { name: 'Meat', items: ['ham', 'chicken', 'sausages'], stand: [3.6, 1.5] },
  'Chiller#2': { name: 'Dairy', items: ['milk', 'cheese', 'eggs', 'yogurt', 'butter'], stand: [7.6, 1.5] },
  'Chiller#3': { name: 'Frozen', items: ['peas', 'icecream', 'fishfingers', 'pizza'], stand: [11.9, 1.5] },
  'Chiller#4': { name: 'Bakery', items: ['bread', 'buns', 'cake', 'cookies'], stand: [16.0, 1.5] },
};
const AISLE_ITEMS = [['cereal', 'porridge'], ['pasta', 'beans', 'soup', 'rice'], ['crisps', 'sweets', 'choc'], ['juice', 'pop', 'water'], ['jam', 'honey', 'flour'], ['soap', 'bubbles', 'toiletroll'], ['ball', 'teddy', 'crayons'], ['plasters', 'toothpaste', 'nappies']];
const AISLE_NAMES = ['Bread and cereal', 'Tins and pasta', 'Snacks and sweets', 'Drinks', 'Baking and breakfast', 'Household', 'Toys and games', 'Baby and health'];
AISLE_ITEMS.forEach((items, i) => { const x = 2.4 + i * 1.75 + 0.7 + 0.525; SECTIONS[i ? 'ShelfRun#' + (i + 1) : 'ShelfRun'] = { name: AISLE_NAMES[i], items, stand: [x, 5.0], aisle: i + 1 }; SECTIONS[i ? 'AisleSign#' + (i + 1) : 'AisleSign'] = SECTIONS[i ? 'ShelfRun#' + (i + 1) : 'ShelfRun']; });
const LIST_POOL = ['milk', 'eggs', 'jam', 'ham', 'cake', 'bread', 'apples', 'bananas', 'carrots', 'peas', 'pasta', 'beans', 'juice', 'crisps', 'cheese', 'buns', 'honey', 'soap'];
export function newList() { const l = []; while (l.length < 3) { const g = pick(LIST_POOL); if (!l.includes(g)) l.push(g); } return l; }
export const PRICE = id => 50 + ((id.length * 37) % 9) * 25;

export function Product({ id, size = 54 }) {
  const [, shape, c1, c2 = '#fbf8f2'] = GROC[id] || ['', 'box', '#ccc'];
  let el;
  switch (shape) {
    case 'round': el = <g>{[[-8, 4], [8, 4], [0, -8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={c1} stroke="rgba(0,0,0,.15)" />)}</g>; break;
    case 'bunch': el = <g>{[-10, 0, 10].map((r, i) => <path key={i} d="M-14,6 Q0,-18 16,-6 Q2,-8 -14,6Z" fill={c1} stroke="#c9a52e" transform={`rotate(${r - 10})`} />)}</g>; break;
    case 'carrot': el = <g>{[-8, 0, 8].map((x, i) => <g key={i} transform={`translate(${x} 0) rotate(${(i - 1) * 12})`}><path d="M-4,-8 L4,-8 L0,16Z" fill={c1} /><path d="M-3,-8 l-3,-8 M0,-8 l0,-9 M3,-8 l3,-8" stroke="#4cc76a" strokeWidth={2.5} strokeLinecap="round" /></g>)}</g>; break;
    case 'grapes': el = <g>{[[-6, -8], [6, -8], [0, -8], [-3, 0], [3, 0], [0, 8], [-9, 0], [9, 0]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill={c1} />)}<path d="M0,-14 l2,-6" stroke="#4cc76a" strokeWidth={3} /></g>; break;
    case 'carton': el = <g><path d="M-10,-10 L0,-18 L10,-10 V18 H-10Z" fill={c1} stroke="rgba(0,0,0,.2)" /><rect x={-10} y={0} width={20} height={10} fill={c2} /></g>; break;
    case 'wedge': el = <g><path d="M-16,10 L16,10 L16,-4 L-16,4Z" fill={c1} stroke="#e0a92e" /><path d="M-16,4 L16,-4 L6,-12Z" fill="#ffe27a" /><circle cx={4} cy={4} r={2.5} fill="#e0a92e" /><circle cx={-8} cy={7} r={2} fill="#e0a92e" /></g>; break;
    case 'eggs': el = <g><rect x={-18} y={0} width={36} height={12} rx={3} fill="#c9b48c" />{[-11, 0, 11].map(x => <ellipse key={x} cx={x} cy={-2} rx={5.5} ry={7} fill={c1} stroke="#e8dcc0" />)}</g>; break;
    case 'pot': el = <g><path d="M-11,-10 h22 l-3,22 h-16z" fill={c1} /><rect x={-12} y={-13} width={24} height={4} rx={2} fill={c2} /></g>; break;
    case 'block': el = <g><rect x={-15} y={-6} width={30} height={14} rx={2} fill={c1} /><rect x={-15} y={-6} width={30} height={5} fill={c2} /></g>; break;
    case 'pack': el = <g><rect x={-16} y={-10} width={32} height={22} rx={4} fill="#fbf8f2" stroke="#ddd" />{[-7, 0, 7].map(x => <ellipse key={x} cx={x} cy={1} rx={6} ry={7} fill={c1} />)}</g>; break;
    case 'bag': el = <g><path d="M-12,-14 h24 l2,4 l-2,24 h-24 l-2,-24z" fill={c1} /><rect x={-9} y={-4} width={18} height={10} rx={3} fill={c2} /></g>; break;
    case 'tub': el = <g><path d="M-14,-8 h28 l-3,18 h-22z" fill={c1} /><rect x={-15} y={-12} width={30} height={5} rx={2} fill={c2} /></g>; break;
    case 'box': el = <g><rect x={-11} y={-16} width={22} height={30} rx={2} fill={c1} /><rect x={-8} y={-6} width={16} height={9} rx={2} fill={c2} /></g>; break;
    case 'loaf': el = <g><path d="M-17,10 V-2 Q-17,-12 -8,-12 Q0,-16 8,-12 Q17,-12 17,-2 V10Z" fill={c1} stroke="#c4863a" /><path d="M-8,-8 l3,6 M0,-10 l3,6 M8,-8 l3,6" stroke="#c4863a" strokeWidth={1.5} /></g>; break;
    case 'cake': el = <g><rect x={-14} y={-4} width={28} height={14} rx={2} fill="#f2e3b0" /><path d="M-15,-4 Q0,-12 15,-4 v3 h-30z" fill={c1} /><circle cx={0} cy={-11} r={3} fill="#e23b3b" /></g>; break;
    case 'tin': el = <g><rect x={-10} y={-12} width={20} height={24} rx={2} fill={c1} /><rect x={-10} y={-5} width={20} height={10} fill={c2} /><ellipse cx={0} cy={-12} rx={10} ry={3} fill="#c9ced2" /></g>; break;
    case 'bottle': el = <g><path d="M-4,-18 h8 v5 q7,3 7,10 v19 h-22 v-19 q0,-7 7,-10z" fill={c1} stroke="rgba(0,0,0,.15)" /><rect x={-5} y={-22} width={10} height={5} rx={2} fill="#3d8fe0" /></g>; break;
    case 'jar': el = <g><rect x={-11} y={-10} width={22} height={22} rx={4} fill={c1} /><rect x={-12} y={-15} width={24} height={6} rx={2} fill="#fbf8f2" stroke="#ddd" /><rect x={-7} y={-3} width={14} height={8} rx={2} fill="#fffaf0" opacity={0.8} /></g>; break;
    case 'bar': el = <g><rect x={-16} y={-6} width={32} height={14} rx={2} fill={c2} /><rect x={-16} y={-6} width={12} height={14} rx={2} fill={c1} /></g>; break;
    case 'roll': el = <g>{[-8, 8].map(x => <g key={x}><rect x={x - 7} y={-12} width={14} height={24} rx={3} fill={c1} stroke="#ddd" /><ellipse cx={x} cy={-12} rx={7} ry={3} fill="#e6e3da" /></g>)}</g>; break;
    case 'teddy': el = <g><circle cx={0} cy={4} r={10} fill={c1} /><circle cx={0} cy={-9} r={8} fill={c1} /><circle cx={-6} cy={-15} r={3.5} fill={c1} /><circle cx={6} cy={-15} r={3.5} fill={c1} /><circle cx={-3} cy={-10} r={1.2} fill="#3b2a24" /><circle cx={3} cy={-10} r={1.2} fill="#3b2a24" /></g>; break;
    case 'tube': el = <g><path d="M-16,-4 h26 l6,4 l-6,4 h-26z" fill={c1} stroke="#ddd" /><rect x={-16} y={-4} width={10} height={8} fill={c2} /></g>; break;
    default: el = <rect x={-12} y={-12} width={24} height={24} fill={c1} />;
  }
  return <svg viewBox="-22 -22 44 44" width={size} height={size} aria-hidden="true">{el}</svg>;
}
export function ShoppingList({ list, got, onRead }) {
  return <button className="shop-list" onClick={onRead} aria-label="Shopping list">
    <b>List</b>{list.map(id => <span key={id} className={'li' + (got.includes(id) ? ' got' : '')}><Product id={id} size={30} /><span>{GROC[id][0]}</span></span>)}
  </button>;
}
export function ShelfPanel({ section, basket, list, onTake, onClose }) {
  const S = SECTIONS[section];
  return <div className="sheet menu-sheet" role="dialog" aria-label={S.name} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(S.name, 'narrator')}>{S.aisle ? `Aisle ${S.aisle}: ` : ''}{S.name}</button><button className="done" onClick={onClose}>Done</button></div>
    <div className="menu-grid">{S.items.map(id => <button key={id} className={'tile menu-item' + (list.includes(id) ? ' on-list' : '')} onClick={() => onTake(id)}>
      <Product id={id} /><span className="mi-word">{GROC[id][0]}</span>{basket.filter(b => b === id).length > 0 && <span className="mi-count">{basket.filter(b => b === id).length}</span>}</button>)}</div>
    <div className="menu-foot"><span className="basket-label">Basket</span><div className="tray-row">{basket.length ? basket.slice(-8).map((id, i) => <span key={i} className="tray-thing"><Product id={id} size={36} /></span>) : <span className="empty">Tap things to put them in the basket.</span>}</div></div>
  </div>;
}
export function CheckoutPanel({ basket, list, T, t0, onPay, onClose }) {
  const shown = Math.min(basket.length, Math.floor((T - t0) / 0.7));
  const total = basket.slice(0, shown).reduce((a, id) => a + PRICE(id), 0);
  const done = shown >= basket.length;
  return <div className="sheet menu-sheet" role="dialog" aria-label="Till" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Beep beep!', 'narrator')}>Till</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="till-list">{basket.slice(0, shown).map((id, i) => <div key={i} className="till-line"><Product id={id} size={30} /><span>{GROC[id][0]}</span><b>{money(PRICE(id))}</b></div>)}
      {!basket.length && <span className="empty">The basket is empty.</span>}</div>
    <div className="menu-foot"><button className="price-total" onClick={() => speak(`That is ${(total / 100).toFixed(2)} pounds`, 'narrator')}>{money(total)}</button>
      <button className="done" disabled={!done || !basket.length} onClick={onPay}>Pay</button></div>
  </div>;
}
