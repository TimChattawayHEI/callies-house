// Pocket & Hem, the clothes shop: a catalogue of things to buy with coins. Anything bought joins that
// person's wardrobe, so it shows up in Dress up too.
import React, { useState } from 'react';
import { shade, lum, SFX, speak } from './core.js';
import { Person, HeadIcon, Pattern, Shoe, Rosette, OPTIONS, DEFAULT_OUTFITS, HAIR, NAMES, BODY } from './people.jsx';

export const FAMILY = ['callie', 'chloe', 'mum', 'dad', 'connor'];

/* ---------------- little pictures of clothes ---------------- */
export const TOP_ICON = {
  dress: 'M-12,-20 L12,-20 L20,16 L-20,16Z', gown: 'M-11,-21 L11,-21 L16,-4 L24,20 L-24,20 L-16,-4Z',
  tee: 'M-14,-18 L14,-18 L22,-8 L15,-3 L13,16 L-13,16 L-15,-3 L-22,-8Z', kit: 'M-14,-18 L14,-18 L22,-8 L15,-3 L13,16 L-13,16 L-15,-3 L-22,-8Z',
  hoodie: 'M-14,-18 L14,-18 L22,6 L15,8 L14,18 L-14,18 L-15,8 L-22,6Z', flannel: 'M-14,-18 L14,-18 L22,8 L15,9 L14,18 L-14,18 L-15,9 L-22,8Z',
  jumper: 'M-14,-18 L14,-18 L22,10 L15,10 L14,18 L-14,18 L-15,10 L-22,10Z', jacket: 'M-14,-18 L14,-18 L22,10 L15,10 L14,18 L-14,18 L-15,10 L-22,10Z',
  tutu: 'M-12,-18 L12,-18 L18,-10 L13,-6 L12,4 L-12,4 L-13,-6 L-18,-10Z', dungas: 'M-10,-6 L10,-6 L12,20 L2,20 L0,8 L-2,20 L-12,20Z',
};
let iconN = 0;
export function TopIcon({ top = 'tee', color, pattern, size = 40 }) {
  const id = 'ti' + (iconN++ % 100000), d = TOP_ICON[top] || TOP_ICON.tee;
  return <svg viewBox="-26 -24 52 46" width={size} height={size} aria-hidden="true">
    <defs><clipPath id={id}><path d={d} /></clipPath></defs>
    {top === 'dungas' && <path d="M-9,-6 L-12,-20 M9,-6 L12,-20" stroke={color} strokeWidth={4} strokeLinecap="round" />}
    <path d={d} fill={color} stroke="rgba(0,0,0,.2)" />
    {top !== 'dungas' && <Pattern kind={pattern} color={color} clipId={id} box={[-24, -22, 24, 20]} scale={0.8} />}
    {top === 'jacket' && <><path d="M-4,-18 L4,-18 L3,18 L-3,18Z" fill="#fbf8f2" /><path d="M-4,-18 L-9,-6 L-3,-3Z M4,-18 L9,-6 L3,-3Z" fill={shade(color, -0.15)} /></>}
    {top === 'kit' && <text x={0} y={8} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily="'Baloo 2',sans-serif" fill={lum(color) > 0.6 ? '#2b2b2e' : '#fff'}>10</text>}
    {top === 'tutu' && [[-12, 6], [0, 8], [12, 6], [-6, 12], [6, 12]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={12} ry={6} fill={shade(color, 0.25)} opacity={0.9} />)}
    {top === 'dungas' && <rect x={-5} y={-2} width={10} height={6} rx={1} fill={shade(color, -0.15)} />}
  </svg>;
}
export function BottomIcon({ bottom, legs, size = 40 }) {
  const c = bottom === 'leopard' ? '#d9a55b' : legs;
  const leg = x => <g key={x}>
    <rect x={x} y={-20} width={10} height={38} rx={4} fill={bottom === 'shorts' ? '#f3cfb3' : c} />
    {bottom === 'shorts' && <rect x={x - 0.5} y={-20} width={11} height={14} rx={3} fill={c} />}
    {bottom === 'rainbow' && ['#ff8f8f', '#ffc46b', '#fff08a', '#9be3a4', '#8ec5ea', '#c7b6e6'].map((cc, i) => <rect key={i} x={x} y={-18 + i * 6} width={10} height={6} fill={cc} />)}
    {bottom === 'leopard' && [-12, 0, 12].map((y, i) => <Rosette key={i} x={x + 5} y={y} s={0.8} base="#d9a55b" k={i + x} />)}
    {bottom === 'ripped' && <rect x={x + 2} y={x < 0 ? -2 : 4} width={6} height={4} rx={2} fill="#f3cfb3" />}
    {bottom === 'joggers' && <rect x={x} y={12} width={10} height={3} fill={shade(c, -0.2)} />}
  </g>;
  return <svg viewBox="-20 -24 40 46" width={size} height={size} aria-hidden="true">
    {leg(-12)}{leg(2)}
    {bottom === 'skirt' && <path d="M-14,-22 L14,-22 L19,0 L-19,0Z" fill={c} stroke="rgba(0,0,0,.15)" />}
  </svg>;
}
export function ShoeIcon({ style, color, size = 40 }) {
  return <svg viewBox="-16 1 34 30" width={size} height={size} aria-hidden="true">
    <rect x={-5.5} y={0} width={11} height={20} rx={4} fill="#d9cfc2" />
    <g style={{ filter: 'drop-shadow(0 0 0.6px rgba(59,42,36,.55))' }}><Shoe style={style} c={color} L={20} w={11} skin="#f3cfb3" T={0} /></g>
  </svg>;
}

/* ---------------- the catalogue ---------------- */
// [id, category, words to read, price, what it changes]
const RAW = [
  // tops
  ['t-red', 'tops', 'red tee', 8, { top: 'tee', color: '#e0524a', pattern: 'plain' }],
  ['t-sun', 'tops', 'sun top', 8, { top: 'tee', color: '#f2c94c', pattern: 'plain' }],
  ['t-dino', 'tops', 'dino top', 12, { top: 'tee', color: '#7cc9a8', pattern: 'dino' }],
  ['t-uni', 'tops', 'unicorn top', 14, { top: 'tee', color: '#c7b6e6', pattern: 'unicorn' }],
  ['t-star', 'tops', 'star top', 10, { top: 'tee', color: '#3d3f6b', pattern: 'stars' }],
  ['t-heart', 'tops', 'heart top', 10, { top: 'tee', color: '#ff9ec4', pattern: 'hearts' }],
  ['t-flower', 'tops', 'flower top', 12, { top: 'tee', color: '#5b9bd5', pattern: 'flowers' }],
  ['t-glitter', 'tops', 'glitter top', 16, { top: 'tee', color: '#b58ee0', pattern: 'glitter' }],
  ['t-tiedye', 'tops', 'tie-dye top', 15, { top: 'tee', color: '#fbf8f2', pattern: 'tiedye' }],
  ['t-zebra', 'tops', 'zebra top', 14, { top: 'tee', color: '#fbf8f2', pattern: 'zebra' }],
  ['t-bee', 'tops', 'bee jumper', 14, { top: 'jumper', color: '#f2c94c', pattern: 'bee' }],
  ['t-leopard', 'tops', 'leopard top', 18, { top: 'jumper', color: '#d9a55b', pattern: 'leopard' }],
  ['t-xmas', 'tops', 'Christmas jumper', 18, { top: 'jumper', color: '#d9363e', pattern: 'xmas' }],
  ['t-pumpkin', 'tops', 'pumpkin top', 12, { top: 'tee', color: '#2b2b2e', pattern: 'pumpkin' }],
  ['t-kit', 'tops', 'red kit', 18, { top: 'kit', color: '#d9363e', pattern: 'plain' }],
  ['t-kitb', 'tops', 'blue kit', 18, { top: 'kit', color: '#3f6e9a', pattern: 'stripes' }],
  ['t-jacket', 'tops', 'denim jacket', 22, { top: 'jacket', color: '#4f6fa3', pattern: 'plain' }],
  ['t-pjacket', 'tops', 'pink jacket', 22, { top: 'jacket', color: '#e86a92', pattern: 'plain' }],
  ['t-dung', 'tops', 'dungarees', 20, { top: 'dungas', color: '#4f6fa3', pattern: 'plain' }],
  ['t-dungp', 'tops', 'pink dungarees', 20, { top: 'dungas', color: '#f39ac6', pattern: 'plain' }],
  ['t-hood', 'tops', 'black hoodie', 18, { top: 'hoodie', color: '#2b2b2e', pattern: 'plain' }],
  ['t-skull', 'tops', 'skull hoodie', 20, { top: 'hoodie', color: '#2b2b2e', pattern: 'skull' }],
  ['t-gamer', 'tops', 'gamer hoodie', 20, { top: 'hoodie', color: '#3f6e9a', pattern: 'pad' }],
  ['t-check', 'tops', 'red shirt', 16, { top: 'flannel', color: '#c4433c', pattern: 'check' }],
  // dresses
  ['d-party', 'dresses', 'party dress', 24, { top: 'dress', color: '#f39ac6', pattern: 'glitter' }],
  ['d-tutu', 'dresses', 'pink tutu', 22, { top: 'tutu', color: '#f7a9c4', pattern: 'plain' }],
  ['d-tutub', 'dresses', 'blue tutu', 22, { top: 'tutu', color: '#8ec5ea', pattern: 'plain' }],
  ['d-princess', 'dresses', 'princess dress', 30, { top: 'gown', color: '#c7b6e6', pattern: 'glitter' }],
  ['d-gold', 'dresses', 'gold gown', 30, { top: 'gown', color: '#f2c94c', pattern: 'stars' }],
  ['d-mermaid', 'dresses', 'mermaid dress', 28, { top: 'gown', color: '#3fb7a8', pattern: 'scales' }],
  ['d-sun', 'dresses', 'sun dress', 20, { top: 'dress', color: '#f2d36b', pattern: 'flowers' }],
  ['d-spot', 'dresses', 'spotty dress', 18, { top: 'dress', color: '#d9465f', pattern: 'spots' }],
  ['d-rainbow', 'dresses', 'rainbow dress', 22, { top: 'dress', color: '#fbf8f2', pattern: 'rainbow' }],
  ['d-leopard', 'dresses', 'leopard dress', 22, { top: 'dress', color: '#d9a55b', pattern: 'leopard' }],
  ['d-black', 'dresses', 'black dress', 18, { top: 'dress', color: '#2b2b2e', pattern: 'plain' }],
  // trousers and skirts
  ['b-jeans', 'bottoms', 'blue jeans', 14, { bottom: 'jeans', legs: '#4f6fa3' }],
  ['b-black', 'bottoms', 'black jeans', 14, { bottom: 'jeans', legs: '#2a2a2c' }],
  ['b-ripped', 'bottoms', 'ripped jeans', 16, { bottom: 'ripped', legs: '#7fa0c8' }],
  ['b-jog', 'bottoms', 'grey joggers', 12, { bottom: 'joggers', legs: '#9aa1a6' }],
  ['b-jogp', 'bottoms', 'pink joggers', 12, { bottom: 'joggers', legs: '#f6c9d7' }],
  ['b-shorts', 'bottoms', 'blue shorts', 10, { bottom: 'shorts', legs: '#5b9bd5' }],
  ['b-shortr', 'bottoms', 'red shorts', 10, { bottom: 'shorts', legs: '#e0524a' }],
  ['b-skirt', 'bottoms', 'pink skirt', 12, { bottom: 'skirt', legs: '#e86a92' }],
  ['b-skirtb', 'bottoms', 'black skirt', 12, { bottom: 'skirt', legs: '#2b2b2e' }],
  ['b-purple', 'bottoms', 'purple leggings', 10, { bottom: 'leggings', legs: '#9b7cc4' }],
  ['b-rainbow', 'bottoms', 'rainbow leggings', 16, { bottom: 'rainbow', legs: '#fbf8f2' }],
  ['b-leopard', 'bottoms', 'leopard trousers', 18, { bottom: 'leopard', legs: '#d9a55b' }],
  // shoes
  ['s-white', 'shoes', 'white trainers', 12, { shoeStyle: 'trainers', shoes: '#fbf8f2', feet: 'shoes' }],
  ['s-pink', 'shoes', 'pink trainers', 12, { shoeStyle: 'trainers', shoes: '#e96d9a', feet: 'shoes' }],
  ['s-light', 'shoes', 'light-up shoes', 20, { shoeStyle: 'sparkle', shoes: '#fbf8f2', feet: 'shoes' }],
  ['s-boots', 'shoes', 'black boots', 16, { shoeStyle: 'boots', shoes: '#2b2b2e', feet: 'shoes' }],
  ['s-red', 'shoes', 'red boots', 16, { shoeStyle: 'boots', shoes: '#c4433c', feet: 'shoes' }],
  ['s-well', 'shoes', 'green wellies', 14, { shoeStyle: 'wellies', shoes: '#5f9a3e', feet: 'shoes' }],
  ['s-wellp', 'shoes', 'pink wellies', 14, { shoeStyle: 'wellies', shoes: '#f39ac6', feet: 'shoes' }],
  ['s-sand', 'shoes', 'gold sandals', 12, { shoeStyle: 'sandals', shoes: '#e3b04f', feet: 'shoes' }],
  ['s-slip', 'shoes', 'bunny slippers', 14, { shoeStyle: 'slippers', shoes: '#fbf8f2', feet: 'shoes' }],
  ['s-slipp', 'shoes', 'pink slippers', 14, { shoeStyle: 'slippers', shoes: '#f7a9c4', feet: 'shoes' }],
  // hats and things for your head
  ['h-none', 'hats', 'no hat', 0, { acc: 'none' }],
  ['h-cap', 'hats', 'red cap', 8, { acc: 'cap' }], ['h-capb', 'hats', 'blue cap', 8, { acc: 'capblue' }],
  ['h-capp', 'hats', 'pink cap', 8, { acc: 'cappink' }], ['h-capg', 'hats', 'green cap', 8, { acc: 'capgreen' }],
  ['h-beanie', 'hats', 'beanie', 10, { acc: 'beanie' }], ['h-bobble', 'hats', 'bobble hat', 12, { acc: 'bobble' }],
  ['h-sun', 'hats', 'sun hat', 14, { acc: 'sunhat' }], ['h-crown', 'hats', 'crown', 20, { acc: 'crown' }],
  ['h-tiara', 'hats', 'tiara', 20, { acc: 'tiara' }], ['h-party', 'hats', 'party hat', 8, { acc: 'party' }],
  ['h-witch', 'hats', 'witch hat', 14, { acc: 'witch' }], ['h-cowboy', 'hats', 'cowboy hat', 16, { acc: 'cowboy' }],
  ['h-santa', 'hats', 'Santa hat', 12, { acc: 'santa' }], ['h-top', 'hats', 'top hat', 16, { acc: 'tophat' }],
  ['h-bunny', 'hats', 'bunny ears', 12, { acc: 'bunny' }], ['h-cat', 'hats', 'cat ears', 12, { acc: 'ears' }],
  ['h-horn', 'hats', 'unicorn horn', 14, { acc: 'horn' }], ['h-flower', 'hats', 'flower', 6, { acc: 'flower' }],
  ['h-bow', 'hats', 'bow', 6, { acc: 'bow' }], ['h-phones', 'hats', 'headphones', 18, { acc: 'headphones' }],
  // glasses
  ['g-none', 'glasses', 'no glasses', 0, { specs: 'none' }],
  ['g-sun', 'glasses', 'sunglasses', 12, { specs: 'sun' }], ['g-star', 'glasses', 'star glasses', 14, { specs: 'star' }],
  ['g-heart', 'glasses', 'heart glasses', 14, { specs: 'heart' }], ['g-nerd', 'glasses', 'big glasses', 10, { specs: 'nerd' }],
  // hair dye
  ['c-mine', 'hair', 'my own hair', 0, { hair: 'natural' }],
  ['c-pink', 'hair', 'pink hair', 15, { hair: '#f49ac1' }], ['c-blue', 'hair', 'blue hair', 15, { hair: '#5bb8ff' }],
  ['c-purple', 'hair', 'purple hair', 15, { hair: '#9b7cc4' }], ['c-green', 'hair', 'green hair', 15, { hair: '#5fbf6a' }],
  ['c-blonde', 'hair', 'blonde hair', 12, { hair: '#e2c48a' }], ['c-red', 'hair', 'red hair', 12, { hair: '#c9472c' }],
  ['c-black', 'hair', 'black hair', 12, { hair: '#2b1d16' }], ['c-white', 'hair', 'white hair', 12, { hair: '#eeeae2' }],
];
export const CATALOG = RAW.map(([id, cat, word, price, set]) => ({ id, cat, word, price, set }));
export const ITEM = Object.fromEntries(CATALOG.map(i => [i.id, i]));
export const CATS = [['tops', 'Tops'], ['dresses', 'Dresses'], ['bottoms', 'Trousers'], ['shoes', 'Shoes'], ['hats', 'Hats'], ['glasses', 'Glasses'], ['hair', 'Hair']];
const natural = who => (DEFAULT_OUTFITS[who] && DEFAULT_OUTFITS[who].hair) || HAIR[who];
export const fits = (it, who) => !(it.cat === 'hair' && who === 'dad');
export const owns = (wardrobe, who, it) => it.price === 0 || !!(wardrobe && wardrobe[who] && wardrobe[who].includes(it.id));
export const resolve = (who, set) => (set.hair === 'natural' ? { ...set, hair: natural(who) } : set);
// what someone would look like with the item on (dungarees/dresses look odd with a skirt over them, so those reset the bottom half)
export function wearing(o, who, it) {
  const s = resolve(who, it.set), n = { ...o, ...s };
  if (s.feet === 'shoes' && who === 'chloe' && s.shoeStyle) n.boots = s.shoeStyle === 'boots';
  return n;
}
export const isWorn = (o, who, it) => Object.entries(resolve(who, it.set)).every(([k, v]) => (o[k] ?? DEFAULT_FOR(who, k)) === v);
function DEFAULT_FOR(who, k) {
  if (k === 'hair') return natural(who);
  if (k === 'specs') return 'none';
  if (k === 'acc') return 'none';
  if (k === 'shoeStyle') return who === 'chloe' ? 'boots' : 'shoe';
  if (k === 'bottom') return who === 'callie' ? 'leggings' : 'jeans';
  if (k === 'feet') return 'shoes';
  return DEFAULT_OUTFITS[who] ? DEFAULT_OUTFITS[who][k] : undefined;
}
// Dress up choices: what everyone starts with, plus everything bought.
export function optionsFor(who, wardrobe) {
  const base = OPTIONS[who] || {}, out = {};
  for (const [k, v] of Object.entries(base)) out[k] = [...v];
  const add = (k, v) => { if (v == null) return; if (!out[k]) { const d = DEFAULT_FOR(who, k); out[k] = d != null && d !== v ? [d] : []; } if (!out[k].includes(v)) out[k].push(v); };
  for (const id of (wardrobe && wardrobe[who]) || []) { const it = ITEM[id]; if (!it) continue; for (const [k, v] of Object.entries(resolve(who, it.set))) if (k !== 'feet') add(k, v); }
  return out;
}

/* ---------------- the shop counter ---------------- */
function Coin({ s = 18 }) { return <span className="coin" style={{ width: s, height: s }} aria-hidden="true" />; }
function ItemPic({ it, who, o }) {
  const s = resolve(who, it.set);
  if (it.cat === 'tops' || it.cat === 'dresses') return <TopIcon top={s.top} color={s.color} pattern={s.pattern} size={54} />;
  if (it.cat === 'bottoms') return <BottomIcon bottom={s.bottom} legs={s.legs} size={54} />;
  if (it.cat === 'shoes') return <ShoeIcon style={s.shoeStyle} color={s.shoes} size={54} />;
  return <HeadIcon who={who} o={{ ...o, ...s }} size={54} />;
}
export function ShopPanel({ people = FAMILY, me, outfits, wardrobe, coins, start = 'tops', T, onBuy, onWear, onClose }) {
  const [who, setWho] = useState(people.includes(me) ? me : people[0]);
  const [cat, setCat] = useState(start);
  const [sel, setSel] = useState(null);
  const o = outfits[who], it = sel && ITEM[sel];
  const preview = it ? wearing(o, who, it) : o;
  const items = CATALOG.filter(i => i.cat === cat && fits(i, who));
  const B = BODY[who], hTot = B.L + B.T + B.R * 2 + 34 + (preview.acc && preview.acc !== 'none' ? 46 : 0);
  const pose = { mode: 'stand', facing: 'front', flip: false, walk: null, armL: 10 + Math.sin(T * 2) * 4, armR: 10 - Math.sin(T * 2) * 4, blink: T % 3.3 < 0.12 ? 1 : 0, mouthOpen: false, twirl: 1 };
  let btn = { label: 'Tap something to try it on', off: true };
  if (it && isWorn(o, who, it)) btn = { label: 'Wearing it!', off: true };
  else if (it && owns(wardrobe, who, it)) btn = { label: 'Wear it', go: () => { onWear(who, it); SFX.sparkle(); } };
  else if (it && coins < it.price) btn = { label: `Need ${it.price - coins} more`, off: true, coin: true };
  else if (it) btn = { label: `Buy for ${it.price}`, go: () => onBuy(who, it), coin: true };
  return <div className="sheet clothes-shop" role="dialog" aria-label="Clothes shop" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head">
      <button className="shop-title" onClick={() => speak('Pocket and Hem', 'narrator')}>Pocket &amp; Hem</button>
      <div className="pair"><button className="coin-pill" onClick={() => speak(`${coins} coins`, 'narrator')}><Coin s={20} />{coins}</button><button className="done" onClick={onClose}>Done</button></div>
    </div>
    <div className="tabs who-tabs">{people.map(w => <button key={w} className="tab" aria-pressed={w === who} onClick={() => { setWho(w); setSel(null); speak(`For ${NAMES[w]}`, 'word'); }}><HeadIcon who={w} o={outfits[w]} size={36} /><span>{NAMES[w]}</span></button>)}</div>
    <div className="shop-body">
      <div className="shop-preview">
        <svg viewBox={`-70 ${-hTot} 140 ${hTot + 16}`} aria-hidden="true"><ellipse cx={0} cy={4} rx={50} ry={10} fill="rgba(90,60,30,.14)" /><Person who={who} o={preview} pose={pose} T={T} uid={'shop-' + who} /></svg>
        <span className="try-note">{it ? (isWorn(o, who, it) ? 'Wearing it' : 'Trying on') : NAMES[who]}</span>
      </div>
      <div className="shop-right">
        <div className="cat-pills">{CATS.map(([id, label]) => <button key={id} className="cat-pill" aria-pressed={cat === id} onClick={() => { setCat(id); setSel(null); speak(label, 'word'); SFX.click(); }}>{label}</button>)}</div>
        <div className="shop-grid">{items.map(i => { const on = sel === i.id, has = owns(wardrobe, who, i), worn = isWorn(o, who, i);
          return <button key={i.id} className={'shop-item' + (on ? ' on' : '')} onClick={() => { setSel(on ? null : i.id); speak(i.word, 'word'); SFX.pop(); }}>
            {worn && <span className="worn">ON</span>}
            <span className="pic"><ItemPic it={i} who={who} o={o} /></span>
            <b>{i.word}</b>
            <small className={has ? 'owned' : ''}>{has ? (i.price ? 'Got it' : 'Free') : <><Coin s={13} />{i.price}</>}</small>
          </button>; })}</div>
      </div>
    </div>
    <button className={'done shop-go' + (btn.off ? ' off' : '')} disabled={btn.off} onClick={btn.go}>{btn.label}{btn.coin && <Coin s={18} />}</button>
  </div>;
}
