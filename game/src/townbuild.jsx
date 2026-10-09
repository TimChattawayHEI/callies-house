// Town builder: build your own shops on the town's empty plots, move houses and shops about,
// and visit the shops you made (each one has a shopkeeper and things to buy).
import React, { useState } from 'react';
import { pick, SFX, speak } from './core.js';
import { TB, NPC, Iso } from '../rooms.gen.jsx';
import { ROOMS, WORDS } from './rooms.jsx';
import { buildHouse, hx } from './homes.jsx';
import { PLACES, ORDER, plotGeo, plotUse, growTown, isRowPlot } from './town.jsx';
import { placeFamily } from './folk.jsx';
import { ItemIcon } from './items.jsx';

const { CATS, SHOPS, BY } = TB;
const { Box, FaceX, FaceY, FloorPlane } = Iso;
export { SHOPS, BY as SHOP_TYPES };
const CAT_SHORT = { 'Food shops': 'Food', 'Takeaways & cafés': 'Cafés', 'Everyday': 'Everyday', 'Hobbies & fun': 'Fun', 'Home & garden': 'Home', 'Style & beauty': 'Style' };
export const SIGN_COLS = ['#e0524a', '#c4622a', '#e3b04f', '#3f8a5a', '#2f8a76', '#3f7fc4', '#7a5aa8', '#c25a7a', '#3a3a3c'];

/* ---------------- the shops in the town ---------------- */
export function initTown(W, saved) {
  W.town = (saved && saved.town) || { shops: {}, n: 0, rows: 1 };
  if (!W.town.rows) W.town.rows = 1;
  for (const sh of Object.values(W.town.shops)) registerShop(sh);
}
export const shopRoom = sh => sh.id + ':shop';
export const shopPlace = sh => 's:' + sh.id;
// put a shop on the map and make its inside
export function registerShop(sh) {
  const T = BY[sh.type]; if (!T) return;
  const g = plotGeo(sh.plot);
  buildShopRoom(sh);
  PLACES[shopPlace(sh)] = { word: sh.name, say: sh.name, door: g.door, road: g.road, pin: [g.pin[0], g.pin[1], T.floors === 2 ? 3.6 : 2.4], room: shopRoom(sh), street: true, shop: sh.id };
  if (!ORDER.includes(shopPlace(sh))) ORDER.push(shopPlace(sh));
}
export function openShop(W, type, name, sign, plot) {
  const T = BY[type]; if (!T || W.coins < T.cost || plotUse(W)[plot] || !isRowPlot(plot)) return null;
  W.coins -= T.cost;
  const sh = { id: 's' + (++W.town.n), type, name: name.trim() || T.names[0], sign, plot, keeper: Math.floor(Math.random() * 1000) };
  W.town.shops[sh.id] = sh;
  registerShop(sh); growTown(W); W.dirty = true;
  return sh;
}
export function renameShop(W, id, name, sign) {
  const sh = W.town.shops[id]; if (!sh) return;
  sh.name = name.trim() || sh.name; if (sign) sh.sign = sign;
  registerShop(sh); W.dirty = true;
}
// move a shop or a house to another plot (shops only go on the high streets)
export function moveThing(W, loc, plot) {
  const used = plotUse(W); if (used[plot]) return false;
  if (loc.startsWith('s:')) { const sh = W.town.shops[loc.slice(2)]; if (!sh || !isRowPlot(plot)) return false; sh.plot = plot; registerShop(sh); }
  else if (loc.startsWith('h:')) { const f = W.folk.fams[loc.slice(2)]; if (!f) return false; f.plot = plot; placeFamily(f); }
  else return false;
  growTown(W); W.dirty = true;
  return true;
}
export function thingName(W, loc) {
  if (loc.startsWith('s:')) { const sh = W.town.shops[loc.slice(2)]; return sh ? sh.name : null; }
  if (loc.startsWith('h:')) { const f = W.folk.fams[loc.slice(2)]; return f ? `${f.name}'s house` : null; }
  return null;
}

/* ---------------- inside a shop ---------------- */
const KEEPERS = ['mum', 'dad', 'gran', 'mumBun', 'girlBlue', 'grandad'];
const lighten = c => hx(c, 0.6);
function keeperLook(sh) {
  const L = NPC.LOOKS, keys = KEEPERS.filter(k => L[k]), base = L[keys[sh.keeper % keys.length]] || L.mum;
  return { ...base, top: sh.sign, apron: '#fbf6ee', long: false, dress: false };
}
function buildShopRoom(sh) {
  const T = BY[sh.type], RX = 10, RY = 7, rk = 'shop';
  const wall = lighten(T.wall);
  const fam = {
    id: sh.id, seed: sh.keeper || 1, store: {},
    plan: { type: 'shop', entry: rk, rooms: { [rk]: { rk, kind: 'shop', floor: 0, name: sh.name, RX, RY, win: null, doorsY: [], doorsX: [], out: [RY - 2, RY], rug: { x: 3, y: 2, w: 4, d: 3 } } } },
    rooms: { [rk]: { style: { wall, paper: 'none', paperInk: '#ffffff', trim: '#fffaf0', floor: 'check', floorColor: '#f1ece2', windowStyle: 'wide', curtainStyle: 'none', curtain: '#ffffff', doorStyle: 'glazed', doorColor: sh.sign, rug: 'none', rugColor: '#ffffff', mood: 'day' },
      items: [{ id: 'p-tall', x: 9, y: 0, rot: 0 }, { id: 'p-fern', x: 0, y: 6, rot: 1 }] } },
  };
  buildHouse(fam);
  const rid = shopRoom(sh), R = ROOMS[rid];
  Object.assign(R, { decor: false, town: true, shop: sh.id, place: shopPlace(sh), fam: undefined, name: sh.name });
  const gc = T.gc, ink = T.ink || '#fbf8f2';
  const fs = Math.min(64, 1500 / Math.max(6, sh.name.length * 1.1));
  const extra = [
    { key: 'Display', kind: 'wall', hit: 'obj', el: <FaceY y={0.02} x0={0.8} z1={3.5}>
      <rect x={0} y={0} width={780} height={78} rx={10} fill={sh.sign} /><text x={390} y={56} textAnchor="middle" fontSize={fs} fontWeight="800" fill={ink} fontFamily="'Baloo 2', sans-serif">{sh.name}</text>
      <rect x={0} y={100} width={780} height={190} rx={6} fill="#fbf8f2" stroke={hx(T.wall, -0.1)} strokeWidth={6} />
      <g transform="translate(10 102) scale(2.0)"><TB.Goods kind={T.goods} gc={gc} x0={0} y0={0} w={380} h={92} /></g>
    </FaceY> },
    { key: 'Display2', kind: 'wall', hit: 'obj', el: <FaceX x={0.02} y1={5.2} z1={2.6}>
      <rect x={0} y={0} width={400} height={160} rx={6} fill="#fbf8f2" stroke={hx(T.wall, -0.1)} strokeWidth={6} />
      <g transform="translate(6 4) scale(1.95)"><TB.Goods kind={T.goods === 'counter' ? 'shelf' : T.goods} gc={[...gc].reverse()} x0={0} y0={0} w={200} h={78} /></g>
    </FaceX> },
    { key: 'Table', kind: 'furn', hit: 'obj', sort: [5.6, 7.8, 2.4, 3.6], block: [5.6, 7.8, 2.4, 3.6], el: <g>
      <Box x={5.6} y={2.4} w={2.2} d={1.2} h={0.75} c={['#ecd09c', '#dcb67e', '#c9a16a']} />
      {[0, 1, 2, 3, 4, 5].map(i => { const col = gc[i % gc.length]; return <Box key={i} x={5.75 + (i % 3) * 0.7} y={2.55 + Math.floor(i / 3) * 0.55} z={0.75} w={0.45} d={0.38} h={0.18 + (i % 2) * 0.1} c={[col, hx(col, -0.12), hx(col, -0.22)]} />; })}
    </g> },
    { key: 'Counter', kind: 'furn', hit: 'obj', sort: [1.4, 4.4, 4.4, 5.1], block: [1.4, 4.4, 4.4, 5.1], el: <g>
      <Box x={1.4} y={4.4} w={3.0} d={0.7} h={1.0} c={['#fbf6ee', sh.sign, hx(sh.sign, -0.15)]} />
      <Box x={3.4} y={4.5} z={1.0} w={0.5} d={0.42} h={0.22} c={['#3a3a3c', '#2a2a2c', '#202022']} />
      <FaceX x={3.9} y1={4.85} z1={1.6}><rect x={0} y={0} width={30} height={34} rx={3} fill="#2a2a2c" /><rect x={3} y={3} width={24} height={20} fill="#8fd0e0" /></FaceX>
      <Box x={1.7} y={4.5} z={1.0} w={0.5} d={0.4} h={0.3} c={['#f2c94c', '#d9a92c', '#c4952a']} />
    </g> },
    { key: 'Keeper', kind: 'person', hit: 'npc', at: [2.6, 3.75, 0], props: { s: 1.08, look: keeperLook(sh) }, render: ctx => <NPC.Person at={[2.6, 3.75, 0]} look={keeperLook(sh)} s={1.08} T={ctx.T} ph={2} pose="stand" /> },
  ];
  const front = R.gen.findIndex(i => i.kind === 'front');
  R.gen.splice(front < 0 ? R.gen.length : front, 0, ...extra);
  Object.assign(WORDS, { Display: T.type.toLowerCase(), Display2: T.type.toLowerCase(), Table: 'table', Counter: 'till' });
}

/* ---------------- what each shop sells ---------------- */
// words on the shop's sign list, matched to things in the game where there is one
const THING = {
  bread: 'bread', cakes: 'cake', 'birthday cakes': 'cake', cupcakes: 'cake', 'iced buns': 'cake', muffins: 'cake', scones: 'biscuit', 'cake stands': 'cake', crackers: 'biscuit',
  fruit: 'apple', pizza: 'pizza', 'garlic bread': 'bread', 'ice cream': 'icecream', sundaes: 'icecream', milkshakes: 'juice', tea: 'cup', coffee: 'coffee', 'hot chocolate': 'hotchoc',
  sandwiches: 'sandwich', wraps: 'sandwich', soup: 'cup', snacks: 'crisps', milk: 'juice', chips: 'crisps', papers: 'paper', comics: 'book', books: 'book', maps: 'paper', bookmarks: 'book',
  stamps: 'letter', cards: 'letter', parcels: 'parcel', phones: 'phone', teddies: 'bear', toys: 'bear', 'board games': 'book', balls: 'football', 'football kits': 'cloth', helmets: 'hat',
  wool: 'scarf', paint: 'pen', glitter: 'wand', flowers: 'flowers', bouquets: 'flowers', plants: 'flowers', seeds: 'flowers', 'second-hand clothes': 'cloth', tops: 'cloth', jeans: 'cloth', jackets: 'cloth',
  glasses: 'specs', sunglasses: 'specs', teapots: 'cup', 'pet food': 'bread', 'pick & mix': 'sweets', lollies: 'sweets', fudge: 'sweets', sweets: 'sweets', games: 'controller', laptops: 'phone', headphones: 'phone', chargers: 'phone', cases: 'phone',
};
const SERVICE = new Set(['haircuts', 'colours', 'blow-dries', 'short back & sides', 'beard trims', 'nail painting', 'gems', 'washes', 'dries', 'ironing', 'eye tests']);
export function sellsOf(type) {
  const T = BY[type]; if (!T) return [];
  return T.sells.split(/,\s*/).map(w => w.trim().toLowerCase()).filter(Boolean).map(w => ({ word: w, kind: THING[w] && THING[w] !== 'sweets' ? THING[w] : null, service: SERVICE.has(w), price: SERVICE.has(w) ? 4 : 3 }));
}
export function keeperLines(sh) {
  const T = BY[sh.type], s = sellsOf(sh.type).map(x => x.word);
  return [`Welcome to ${sh.name}!`, `We sell ${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}.`, 'What would you like?', 'Hello! Lovely to see you!', `This is the best ${T.type.toLowerCase()} in town!`];
}

/* ---------------- screens ---------------- */
const Coin = ({ s = 18 }) => <i className="coin" style={{ width: s, height: s }} />;
export function ShopArt({ type, name, sign, h = 120 }) { return <div className="shop-art" style={{ height: h }}><TB.TBShopArt shop={type} name={name} sign={sign} /></div>; }
// 1: pick what kind of shop
export function ShopPickPanel({ W, plot, start, onNext, onClose }) {
  const [cat, setCat] = useState(start ? BY[start].cat : CATS[0]);
  const [sel, setSel] = useState(start || null);
  const it = sel && BY[sel];
  return <div className="sheet tb-pick" role="dialog" aria-label="Build a shop" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Build a shop. What will it sell?', 'narrator')}>Build a shop</button><span className="coins-pill"><i />{W.coins}</span><button className="pill" onClick={onClose}>Close</button></div>
    <div className="pet-tabs">{CATS.map(c => <button key={c} className={'pill' + (c === cat ? ' on' : '')} aria-pressed={c === cat} onClick={() => { setCat(c); speak(c, 'word'); SFX.click(); }}>{CAT_SHORT[c]}</button>)}</div>
    <div className="tb-grid">{SHOPS.filter(s => s.cat === cat).map(s => <button key={s.id} className="tb-card" aria-pressed={sel === s.id} onClick={() => { setSel(s.id); speak(`${s.type}. ${s.sells}.`, 'narrator'); SFX.pop(); }}>
      <ShopArt type={s.id} h={86} /><b>{s.type}</b><small>{s.sells}</small><span className="pet-price"><i />{s.cost}</span></button>)}</div>
    <div className="tb-foot">{it ? <button className="tb-says" onClick={() => speak(`${it.type}. It sells ${it.sells}.`, 'narrator')}><b>{it.type}</b> sells {it.sells.toLowerCase()}</button> : <span className="tb-says">Tap a shop to see it.</span>}
      <button className="done" disabled={!it} onClick={() => onNext(sel)}>Next: name it</button></div>
  </div>;
}
// 2: give it a name and a sign colour, then open it
const ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];
export function ShopNamePanel({ W, type, rename, onOpen, onBack }) {
  const T = BY[type];
  const [name, setName] = useState(rename ? rename.name : T.names[0]);
  const [sign, setSign] = useState(rename ? rename.sign : T.sign);
  const [typed, setTyped] = useState(false);
  const key = ch => {
    if (ch === '<') { setName(n => n.slice(0, -1)); SFX.click(); return; }
    const start = !typed ? '' : name;
    if (start.length >= 18) return;
    const next = ch === ' ' ? (start.endsWith(' ') || !start ? start : start + ' ') : start + (!start || start.endsWith(' ') ? ch : ch.toLowerCase());
    setName(next); setTyped(true); if (ch !== ' ') speak(ch.toLowerCase(), 'word');
  };
  const idea = n => { setName(n); setTyped(true); speak(n, 'word'); SFX.pop(); };
  const all = SHOPS.filter(s => s.cat === T.cat).flatMap(s => s.names);
  const short = W.coins < T.cost;
  return <div className="sheet tb-name" role="dialog" aria-label="Name your shop" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(rename ? 'Change the name' : 'Name your shop', 'narrator')}>{rename ? 'Change the name' : 'Name your shop'}</button><span className="coins-pill"><i />{W.coins}</span></div>
    <div className="tb-name-body">
      <div className="tb-preview"><ShopArt type={type} name={name || ' '} sign={sign} h={170} /><button className="name-big" onClick={() => name && speak(name, 'word')}>{name || 'Name?'}</button></div>
      <div className="tb-name-opts">
        <div className="kb">{ROWS.map(r => <div key={r} className="kb-row">{r.split('').map(ch => <button key={ch} className="kb-key" onClick={() => key(ch)}>{ch}</button>)}{r === 'VWXYZ' && <><button className="kb-key wide" onClick={() => key(' ')} aria-label="Space">space</button><button className="kb-key wide" onClick={() => key('<')} aria-label="Delete a letter">⌫</button></>}</div>)}</div>
        <div className="tb-ideas">{T.names.map(n => <button key={n} className="pill" onClick={() => idea(n)}>{n}</button>)}<button className="pill dark" onClick={() => idea(pick(all.filter(n => n !== name)))}>Surprise me</button></div>
        <div className="choices tb-signs">{SIGN_COLS.map(c => <button key={c} className="sw" style={{ '--c': c }} aria-pressed={sign === c} aria-label="sign colour" onClick={() => { setSign(c); SFX.pop(); }} />)}</div>
      </div>
    </div>
    <div className="tb-foot"><button className="pill" onClick={onBack}>Back</button>
      {rename ? <button className="done" disabled={!name.trim()} onClick={() => onOpen(name, sign)}>Save the name</button>
        : <button className="done" disabled={!name.trim() || short} onClick={() => onOpen(name, sign)}>{short ? `You need ${T.cost - W.coins} more coins` : <>Open it! <span className="coin-tag"><i />{T.cost}</span></>}</button>}</div>
  </div>;
}
// inside: buy things
function ThingIcon({ t, size = 48 }) {
  if (t.kind) return <ItemIcon it={{ kind: t.kind, c: '#5b9bd5' }} size={size} />;
  if (t.service) return <svg viewBox="-14 -14 28 28" width={size} height={size} aria-hidden="true"><path d="M0,-11 L3,-3 11,-3 5,2 7,10 0,5 -7,10 -5,2 -11,-3 -3,-3Z" fill="#ffd45e" stroke="#e0a92e" strokeWidth={1.4} /></svg>;
  return <ItemIcon it={{ kind: 'shopping' }} size={size} />;
}
export function ShopBuyPanel({ W, sh, onBuy, onClose, onShift, onCollect, onShow }) {
  const T = BY[sh.type], list = sellsOf(sh.type);
  return <div className="sheet tb-buy" role="dialog" aria-label={sh.name} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(`${sh.name}. What would you like?`, 'narrator')}>{sh.name}</button><span className="coins-pill"><i />{W.coins}</span><button className="pill" onClick={onClose}>Close</button></div>
    <div className="tb-work">{onShow && <button className="pill build-pill" onClick={onShow}>Put on a show</button>}{onShift && <button className="pill build-pill" onClick={onShift}>Help in the shop</button>}{onCollect && Math.floor(sh.till || 0) >= 1 && <button className="pill dark" onClick={onCollect}>Collect <span className="coin-tag"><i />{Math.floor(sh.till)}</span></button>}</div>
    <p className="tb-q">What would you like?</p>
    <div className="tb-things">{list.map(t => <button key={t.word} className="tile food-tile" disabled={W.coins < t.price} onClick={() => onBuy(t)}><ThingIcon t={t} /><span>{t.word}</span><span className="pet-price"><i />{t.price}</span></button>)}</div>
    <small className="note">{T.type}</small>
  </div>;
}
