// Decorate mode for New Street houses: buy furniture with coins, move it on the grid, turn it, recolour it,
// put it away, and change the walls, floor, windows, doors and lighting. Based on the House Builder design.
import React from 'react';
import { Iso } from '../rooms.gen.jsx';
import { P, clamp, SFX, speak } from './core.js';
import { nav } from './world.js';
import { geoOf, planOf, typeOf, HOUSE_TYPES, OPT, BY_ID, ITEMS, CATS, ItemThumb, whyNot, findSpot, fpOf, isWall, buildHouse, FloorArt, Patterns, hx, WORD, floorBase } from './homes.jsx';

const { FloorPlane, Plane, pts } = Iso;
export const TABS = [['house', 'House'], ['things', 'Things'], ['walls', 'Walls'], ['floor', 'Floor'], ['windows', 'Windows'], ['light', 'Light']];

/* ---------------- changing the house ---------------- */
export const isFree = W => !!(W.folk && W.folk.creative);
// what a style change costs (prices from the design)
export function styleCost(W, a, b) {
  if (isFree(W)) return 0;
  let n = 0; const ch = (...k) => k.some(x => a[x] !== b[x]);
  // each wall is paid for on its own: paint 5, wallpaper 12
  const sa = sideOf(a), sb = sideOf(b);
  if (a.wall !== b.wall) n += 5;
  if (sa.wall !== sb.wall) n += 5;
  if (a.paper !== b.paper && a.paper !== 'none') n += 12;
  if (sa.paper !== sb.paper && sa.paper !== 'none') n += 12;
  if (ch('trim')) n += 5;
  if (ch('floor', 'floorColor')) n += 20;
  if (ch('rug', 'rugColor') && a.rug !== 'none') n += 15;
  if (ch('windowStyle')) n += 30;
  if (ch('curtainStyle', 'curtain') && a.curtainStyle !== 'none') n += 10;
  if (ch('doorStyle', 'doorColor')) n += 15;
  return n;
}
export const styleChanged = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].some(k => a[k] !== b[k]);
// the side wall can be different from the back wall
export const sideOf = s => ({ wall: s.wallX ?? s.wall, paper: s.paperX ?? s.paper, paperInk: s.inkX ?? s.paperInk });
const XK = { wall: 'wallX', paper: 'paperX', paperInk: 'inkX' };
export function wallPatch(s, side, key, v) {
  const xk = XK[key];
  if (side === 'back') return { [key]: v, [xk]: s[xk] ?? s[key] };
  if (side === 'side') return { [xk]: v };
  return { [key]: v, [xk]: undefined };
}
// the rug: where it is and how big
export const rugOf = (g, s) => s.rugAt || g.rug;
export function rugMoved(g, s, x, y) {
  const r = rugOf(g, s), RY = Math.floor(g.RY);
  const nx = clamp(Math.round((x - r.w / 2) * 10) / 10, 0, Math.max(0, g.RX - r.w)), ny = clamp(Math.round((y - r.d / 2) * 10) / 10, 0, Math.max(0, RY - r.d));
  return { ...r, x: +nx.toFixed(1), y: +ny.toFixed(1) };
}
export function rugSized(g, s, k, turn) {
  const r = rugOf(g, s), RY = Math.floor(g.RY);
  let w = turn ? r.d : r.w * k, d = turn ? r.w : r.d * k;
  w = clamp(Math.round(w * 10) / 10, 1.2, g.RX - 0.4); d = clamp(Math.round(d * 10) / 10, 1.0, RY - 0.4);
  const cx = r.x + r.w / 2, cy = r.y + r.d / 2;
  return { w, d, x: +clamp(cx - w / 2, 0, g.RX - w).toFixed(1), y: +clamp(cy - d / 2, 0, RY - d).toFixed(1) };
}
export const onRug = (g, s, x, y) => { if (!s.rug || s.rug === 'none') return false; const r = rugOf(g, s); return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.d; };
// rebuild one room and get anyone out of the way
export function rebuild(W, fam, rk, standUp) {
  buildHouse(fam, rk);
  const rid = fam.id + ':' + rk, N = nav(rid);
  for (const p of Object.values(W.people)) {
    if (p.room !== rid) continue;
    if (standUp && (p.mode === 'sit' || p.mode === 'lie')) { p.mode = 'stand'; p.z = 0; p.bed = null; p.seatStand = null; }
    if (p.mode === 'stand' || p.mode === 'walk') { if (!N.free(p.x, p.y)) [p.x, p.y] = N.nearestFree(p.x, p.y); p.path = null; if (p.mode === 'walk') { p.mode = 'stand'; p.goal = null; p.then = null; } }
  }
  W.dirty = true;
}
export function piecePrice(W, fam, id) { return (fam.store[id] || 0) > 0 || isFree(W) ? 0 : BY_ID[id].p; }
export function addPiece(W, fam, rk, id, near) {
  const R = fam.rooms[rk], it = BY_ID[id];
  const q = findSpot(geoOf(fam, rk), R.items, { id, x: 0, y: 0, rot: 0 }, -1, near);
  if (!q) return { why: 'room' };
  const cost = piecePrice(W, fam, id);
  if (cost > W.coins) return { why: 'coins', cost };
  if (fam.store[id]) { fam.store[id]--; if (!fam.store[id]) delete fam.store[id]; } else W.coins -= cost;
  R.items.push(q); fam.locked = true; rebuild(W, fam, rk);
  return { i: R.items.length - 1, cost, it };
}
export function movePiece(W, fam, rk, i, cx, cy) {
  const R = fam.rooms[rk], p = R.items[i], [w, d] = fpOf(p), g = geoOf(fam, rk);
  const x = clamp(Math.floor(cx) - Math.floor((w - 1) / 2), 0, g.RX - w), y = isWall(p) ? 0 : clamp(Math.floor(cy) - Math.floor((d - 1) / 2), 0, Math.floor(g.RY) - d);
  if (x === p.x && y === p.y) return 'same';
  const q = { ...p, x, y }, why = whyNot(g, R.items, q, i);
  if (why) return why;
  R.items[i] = q; rebuild(W, fam, rk, true); return '';
}
export function turnPiece(W, fam, rk, i) {
  const R = fam.rooms[rk], p = R.items[i]; if (isWall(p)) return 'wall';
  const [w, d] = fpOf(p);
  let q = { ...p, rot: ((p.rot || 0) + 1) % 4 };
  const g = geoOf(fam, rk);
  if (whyNot(g, R.items, q, i)) q = findSpot(g, R.items, q, i, [p.x + w / 2, p.y + d / 2], false);
  if (!q) return 'full';
  R.items[i] = q; rebuild(W, fam, rk, true); return '';
}
export function colourPiece(W, fam, rk, i, col) {
  const R = fam.rooms[rk], p = { ...R.items[i] };
  if (col) p.col = col; else delete p.col;
  R.items[i] = p; rebuild(W, fam, rk);
}
export function putAway(W, fam, rk, i) {
  const R = fam.rooms[rk], p = R.items[i];
  R.items.splice(i, 1); fam.store[p.id] = (fam.store[p.id] || 0) + 1;
  rebuild(W, fam, rk, true);
}
export const WHY = { door: 'Keep the door clear!', full: 'Something is in the way!', path: 'Leave a path to walk!', wall: 'That is the wall!', room: 'No room for that here!', coins: 'Not enough coins!' };

/* ---------------- what the room shows while decorating ---------------- */
export function BuildGrid({ g, piece, rug }) {
  const RY = Math.floor(g.RY);
  const lines = [];
  for (let i = 1; i < g.RX; i++) lines.push(<line key={'a' + i} x1={i * 100} x2={i * 100} y1={0} y2={RY * 100} />);
  for (let j = 1; j < RY; j++) lines.push(<line key={'b' + j} x1={0} x2={g.RX * 100} y1={j * 100} y2={j * 100} />);
  let sel = null;
  if (piece) {
    const [w, d] = fpOf(piece);
    sel = isWall(piece)
      ? <Plane o={[piece.x, 0.03, 3.6]} u={[1, 0, 0]} v={[0, 0, -1]}><rect x={-6} y={-6} width={w * 100 + 12} height={300} rx={10} fill="#2f8a76" fillOpacity={0.18} stroke="#2f8a76" strokeWidth={5} strokeDasharray="14 8" /></Plane>
      : <polygon points={pts([[piece.x, piece.y, 0.03], [piece.x + w, piece.y, 0.03], [piece.x + w, piece.y + d, 0.03], [piece.x, piece.y + d, 0.03]])} fill="#2f8a76" fillOpacity={0.3} stroke="#2f8a76" strokeWidth={4} />;
  }
  if (rug) sel = <FloorPlane x={rug.x} y={rug.y} z={0.04}><rect x={-8} y={-8} width={rug.w * 100 + 16} height={rug.d * 100 + 16} rx={14} fill="#2f8a76" fillOpacity={0.15} stroke="#2f8a76" strokeWidth={7} strokeDasharray="18 10" /></FloorPlane>;
  return <g pointerEvents="none"><FloorPlane z={0.03}><g stroke="#fff" strokeWidth={2.5} opacity={0.65} strokeDasharray="8 8">{lines}</g></FloorPlane>{sel}</g>;
}
// a bouncing arrow over the piece being moved
export function BuildMarker({ piece, rug, T }) {
  if (!piece && !rug) return null;
  let x, y;
  if (rug) [x, y] = P(rug.x + rug.w / 2, rug.y + rug.d / 2, 0.9);
  else { const [w, d] = fpOf(piece), it = BY_ID[piece.id], top = Math.max(...it.b.map(b => b[2] + b[5])); [x, y] = P(piece.x + w / 2, isWall(piece) ? 0.1 : piece.y + d / 2, top + 0.4); }
  const bob = Math.sin(T * 5) * 8;
  return <g pointerEvents="none" transform={`translate(${x} ${y - 20 + bob})`}><path d="M-16,-30 h32 v16 h14 l-30,28 -30,-28 h14z" fill="#2f8a76" stroke="#fff" strokeWidth={4} strokeLinejoin="round" /></g>;
}

/* ---------------- the panel ---------------- */
const Coin = () => <span className="coin" aria-hidden="true" />;
const Price = ({ n }) => (n ? <span className="price"><Coin />{n}</span> : <span className="price free">Free</span>);
function PaperTile({ paper, ink, wall }) {
  const id = 'pp-' + paper;
  return <svg viewBox="0 0 60 60" width="44" height="44" aria-hidden="true"><defs><Patterns id={id} paper={paper} ink={ink} wall={wall} /></defs><rect width="60" height="60" rx="8" fill={paper === 'none' ? wall : `url(#${id})`} /></svg>;
}
function FloorTile({ floor, color }) {
  return <svg viewBox="0 0 60 60" width="44" height="44" aria-hidden="true"><clipPath id={'fc-' + floor}><rect width="60" height="60" rx="8" /></clipPath><g clipPath={`url(#fc-${floor})`}><FloorArt RX={0.6} RY={0.6} floor={floor} color={color} /></g></svg>;
}
function RugTile({ shape, color }) {
  if (shape === 'none') return <svg viewBox="0 0 60 40" width="52" height="34" aria-hidden="true"><path d="M14,8 L46,32 M46,8 L14,32" stroke="#c9b8a6" strokeWidth="5" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 60 40" width="52" height="34" aria-hidden="true">{shape === 'round' ? <ellipse cx="30" cy="20" rx="24" ry="16" fill={color} stroke={hx(color, -0.15)} strokeWidth="3" />
    : <rect x={shape === 'runner' ? 2 : 6} y={shape === 'runner' ? 12 : 4} width={shape === 'runner' ? 56 : 48} height={shape === 'runner' ? 16 : 32} rx="4" fill={color} stroke={hx(color, -0.15)} strokeWidth="3" strokeDasharray={shape === 'fringe' ? '3 3' : undefined} />}</svg>;
}
const say = w => speak(w, 'word');

const FLOOR_NAME = ['Downstairs', 'Upstairs'];
const KIND_COL = { hall: '#f6dfa8', living: '#f6dfa8', kitchen: '#cfe7dc', dining: '#f6dfa8', toilet: '#cfe3f2', garage: '#dcdcdc', landing: '#f3c9d4', bedbig: '#f3c9d4', bed: '#f3c9d4', box: '#f3c9d4', bath: '#cfe3f2', balcony: '#cfe3b4', garden: '#cfe3b4' };
function HouseIcon({ type, size = 48 }) {
  return <svg viewBox="0 0 60 50" width={size} height={size * 50 / 60} aria-hidden="true">
    {type === 'flat' && <g><rect x={14} y={4} width={32} height={44} fill="#c9d8e6" stroke="#5a3d32" strokeWidth={2} />{[10, 22, 34].map(y => <g key={y}><rect x={19} y={y} width={8} height={7} fill="#fff" /><rect x={33} y={y} width={8} height={7} fill="#fff" /></g>)}<rect x={26} y={40} width={8} height={8} fill="#8a5a3a" /></g>}
    {type === 'terrace' && <g>{[2, 20, 38].map((x, i) => <g key={x}><rect x={x} y={18} width={18} height={30} fill={i === 1 ? '#f3d6cf' : '#e9e4dc'} stroke="#5a3d32" strokeWidth={2} /><path d={`M${x - 1},18 L${x + 9},8 L${x + 19},18Z`} fill="#9a4a3a" /></g>)}<rect x={26} y={36} width={6} height={12} fill="#8a5a3a" /></g>}
    {type === 'detached' && <g><path d="M6,22 L26,6 L46,22Z" fill="#9a4a3a" /><rect x={9} y={22} width={34} height={26} fill="#f2e2b6" stroke="#5a3d32" strokeWidth={2} /><rect x={43} y={30} width={14} height={18} fill="#dcdcdc" stroke="#5a3d32" strokeWidth={2} /><rect x={22} y={36} width={7} height={12} fill="#8a5a3a" /><rect x={13} y={27} width={7} height={6} fill="#fff" /><rect x={32} y={27} width={7} height={6} fill="#fff" /></g>}
    {type === 'house' && <g><path d="M6,24 L30,6 L54,24Z" fill="#9a4a3a" /><rect x={10} y={24} width={40} height={24} fill="#e2b06a" stroke="#5a3d32" strokeWidth={2} /><rect x={26} y={34} width={8} height={14} fill="#8a5a3a" /></g>}
  </svg>;
}
function HouseTab({ fam, rk, onGoRoom, onNewLayout }) {
  const plan = planOf(fam), type = typeOf(fam), T = HOUSE_TYPES[type];
  const floors = [...new Set(Object.values(plan.rooms).map(g => g.floor))].sort();
  return <>
    <div className="house-head"><HouseIcon type={type} /><div><button className="sel-name" onClick={() => say(`${fam.name}'s house`)}>{fam.name}'s {T ? T.name.toLowerCase() : 'house'}</button><p className="sel-tip">{Object.keys(plan.rooms).length} rooms{T ? ' · ' + T.facts[0] : ''}</p></div></div>
    {floors.map(f => <div key={f} className="opt-row"><h3>{floors.length > 1 ? FLOOR_NAME[f] : 'Rooms'}</h3>
      <div className="room-list">{Object.entries(plan.rooms).filter(([, g]) => g.floor === f).map(([k, g]) => { const n = fam.rooms[k] ? fam.rooms[k].items.length : 0;
        return <button key={k} className="room-row" aria-current={k === rk} onClick={() => { if (g.kind === 'garden') { say('Garden'); return; } say(g.name); onGoRoom(k); }}>
          <span className="dot" style={{ background: KIND_COL[g.kind] }} /><b>{g.name}</b><small>{k === rk ? 'You are here' : g.kind === 'garden' ? 'Outside' : n ? `${n} things` : 'Empty'}</small></button>; })}</div></div>)}
    {!fam.locked ? <div className="opt-row"><h3>Try a different house</h3><p className="sel-tip">Free until you buy something.</p>
      <div className="type-row">{Object.entries(HOUSE_TYPES).map(([k, t]) => <button key={k} className="type-tile" aria-pressed={k === type} onClick={() => { say(t.name); onNewLayout(k); }}><HouseIcon type={k} size={54} /><b>{t.name}</b><small>{t.note}</small></button>)}</div>
      {T && <button className="pill" onClick={() => { say('New rooms!'); onNewLayout(type); }}>Mix up the rooms</button>}</div>
      : <p className="sel-tip">Tap a room to go and decorate it.</p>}
  </>;
}
export { HouseIcon };

export function BuildPanel({ W, fam, rk, b, coins, onWallSide, onRugPick, onRugSize, onGoRoom, onNewLayout, onTab, onCat, onPick, onTurn, onColour, onPutAway, onDeselect, onStyle, onApply, onUndo, onDone }) {
  const R = fam.rooms[rk], s = R.style, sel = typeof b.sel === 'number' ? R.items[b.sel] : null, free = isFree(W);
  const cost = styleCost(W, s, b.saved), changed = styleChanged(s, b.saved);
  const sw = (key, list, word) => <div className="choices">{list.map(c => <button key={c} className="sw" style={{ '--c': c }} aria-pressed={s[key] === c} aria-label={word} onClick={() => { onStyle({ [key]: c }); if (word) say(word); }} />)}</div>;
  const words = (key, list) => <div className="choices">{list.map(([v, label]) => <button key={v} className="tile word-tile" aria-pressed={s[key] === v} onClick={() => { onStyle({ [key]: v }); say(label); }}>{label}</button>)}</div>;
  const store = Object.entries(fam.store).filter(([, n]) => n > 0);
  const cat = b.cat || 'mine';
  const list = cat === 'mine' ? store.map(([id]) => BY_ID[id]) : ITEMS.filter(i => i.c === cat);
  return <div className="build-panel" role="dialog" aria-label="Decorate" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head">
      <button className="room-chip" onClick={() => say(`Decorate the ${geoOf(fam, rk).name}`)}>{geoOf(fam, rk).name}</button>
      <span className="coin-chip" aria-label={free ? 'Everything is free' : `${coins} coins`}><Coin />{free ? 'Free' : coins}</span>
      <button className="done" onClick={onDone}>Done</button>
    </div>
    <div className="build-tabs" role="tablist">{TABS.map(([k, label]) => <button key={k} role="tab" className="build-tab" aria-selected={b.tab === k} onClick={() => { onTab(k); say(label); }}>{label}</button>)}</div>
    <div className="build-body">
      {b.tab === 'house' && <HouseTab fam={fam} rk={rk} onGoRoom={onGoRoom} onNewLayout={onNewLayout} />}
      {b.tab === 'things' && sel && <div className="sel-card">
        <div className="sel-top"><span className="sel-thumb"><ItemThumb id={sel.id} size={58} /></span><button className="sel-name" onClick={() => say(WORD[sel.id] || BY_ID[sel.id].n)}>{BY_ID[sel.id].n}</button></div>
        <p className="sel-tip">Tap the floor to move it.</p>
        <div className="pair">
          {!isWall(sel) && <button className="pill" onClick={onTurn}>Turn</button>}
          <button className="pill" onClick={onPutAway}>Put away</button>
          <button className="pill" onClick={onDeselect}>OK</button>
        </div>
        <div className="choices">{OPT.itemCols.map(c => <button key={c} className="sw small" style={{ '--c': c }} aria-pressed={sel.col === c} aria-label="colour" onClick={() => onColour(c)} />)}<button className="tile word-tile small" aria-pressed={!sel.col} onClick={() => onColour(null)}>First colour</button></div>
      </div>}
      {b.tab === 'things' && <>
        <div className="cat-row">
          <button className="pill cat" aria-pressed={cat === 'mine'} onClick={() => { onCat('mine'); say('My things'); }}>My things{store.length ? ` (${store.reduce((a, [, n]) => a + n, 0)})` : ''}</button>
          {CATS.map(c => <button key={c.id} className="pill cat" aria-pressed={cat === c.id} onClick={() => { onCat(c.id); say(c.label.replace('&', 'and')); }}>{c.label}</button>)}
        </div>
        {cat === 'mine' && !list.length && <p className="sel-tip">Things you put away go here.</p>}
        <div className="item-grid">{list.map(it => { const n = fam.store[it.id] || 0, price = piecePrice(W, fam, it.id);
          return <button key={it.id} className={'item-card' + (price > coins ? ' dear' : '')} onClick={() => onPick(it.id)}>
            {n > 0 && <span className="owned">×{n}</span>}
            <span className="thumb"><ItemThumb id={it.id} size={56} /></span>
            <span className="nm">{it.n}</span>
            <Price n={price} />
          </button>; })}</div>
      </>}
      {b.tab === 'walls' && (() => { const side = b.wallSide || 'both', cur = side === 'side' ? sideOf(s) : s, per = side === 'both' ? 2 : 1;
        const wsw = (key, list, word) => <div className="choices">{list.map(c => <button key={c} className="sw" style={{ '--c': c }} aria-pressed={cur[key] === c} aria-label={word || 'colour'} onClick={() => { onStyle(wallPatch(s, side, key, c)); if (word) say(word); }} />)}</div>;
        return <>
        <div className="opt-row"><h3>Which walls?</h3><div className="choices">{[['both', 'Both walls'], ['back', 'Back wall'], ['side', 'Side wall']].map(([v, label]) => <button key={v} className="tile word-tile" aria-pressed={side === v} onClick={() => { onWallSide(v); say(label); }}>{label}</button>)}</div><p className="sel-tip small">Or tap a wall in the room.</p></div>
        <div className="opt-row"><h3>Paint {!free && <small>{5 * per} coins</small>}</h3>{wsw('wall', OPT.paints, 'paint')}</div>
        <div className="opt-row"><h3>Wallpaper {!free && <small>{12 * per} coins</small>}</h3><div className="choices">{OPT.papers.map(([v, label]) => <button key={v} className="tile pic-tile" aria-pressed={cur.paper === v} aria-label={label} onClick={() => { onStyle(wallPatch(s, side, 'paper', v)); say(label); }}><PaperTile paper={v} ink={cur.paperInk} wall={cur.wall} /><small>{label}</small></button>)}</div></div>
        {cur.paper !== 'none' && <div className="opt-row"><h3>Pattern colour</h3>{wsw('paperInk', OPT.inks)}</div>}
        <div className="opt-row"><h3>Skirting and trim {!free && <small>5 coins</small>}</h3>{sw('trim', OPT.trims)}</div>
      </>; })()}
      {b.tab === 'floor' && <>
        <div className="opt-row"><h3>Floor {!free && <small>20 coins</small>}</h3><div className="choices">{OPT.floors.map(([v, label, c]) => <button key={v} className="tile pic-tile" aria-pressed={s.floor === v} onClick={() => { onStyle({ floor: v, floorColor: v === 'carpet' ? (OPT.carpets.includes(s.floorColor) ? s.floorColor : OPT.carpets[0]) : c }); say(label); }}><FloorTile floor={v} color={v === 'carpet' && s.floor === 'carpet' ? s.floorColor : c} /><small>{label}</small></button>)}</div></div>
        {s.floor === 'carpet' && <div className="opt-row"><h3>Carpet colour</h3>{sw('floorColor', OPT.carpets, 'carpet')}</div>}
        <div className="opt-row"><h3>Rug {!free && <small>15 coins</small>}</h3><div className="choices">{OPT.rugs.map(([v, label]) => <button key={v} className="tile pic-tile" aria-pressed={s.rug === v} onClick={() => { onStyle({ rug: v }); say(label); }}><RugTile shape={v} color={s.rugColor} /><small>{label}</small></button>)}</div></div>
        {s.rug !== 'none' && <div className="opt-row"><h3>Rug colour</h3>{sw('rugColor', OPT.rugCols, 'rug')}</div>}
        {s.rug !== 'none' && <div className={'opt-row' + (b.sel === 'rug' ? ' sel-card' : '')}><h3>Move the rug</h3>
          {b.sel === 'rug' ? <p className="sel-tip">Tap the floor to move it.</p> : <p className="sel-tip small">Tap the rug in the room, or:</p>}
          <div className="pair">{b.sel !== 'rug' && <button className="pill" onClick={onRugPick}>Move it</button>}<button className="pill" onClick={() => onRugSize(0.8)}>Smaller</button><button className="pill" onClick={() => onRugSize(1.25)}>Bigger</button><button className="pill" onClick={() => onRugSize(1, true)}>Turn</button>{b.sel === 'rug' && <button className="pill" onClick={onDeselect}>OK</button>}</div></div>}
      </>}
      {b.tab === 'windows' && <>
        <div className="opt-row"><h3>Window {!free && <small>30 coins</small>}</h3>{words('windowStyle', OPT.windows)}</div>
        <div className="opt-row"><h3>Curtains {!free && <small>10 coins</small>}</h3>{words('curtainStyle', OPT.curtains)}{s.curtainStyle !== 'none' && sw('curtain', OPT.curtainCols, 'curtains')}</div>
        <div className="opt-row"><h3>Doors {!free && <small>15 coins</small>}</h3>{words('doorStyle', OPT.doors)}{sw('doorColor', OPT.doorCols, 'door')}</div>
      </>}
      {b.tab === 'light' && <>
        <div className="opt-row"><h3>Lighting</h3>{words('mood', OPT.moods)}</div>
        <p className="sel-tip">Lamps glow at night. Tap a lamp to switch it on.</p>
      </>}
    </div>
    {b.tab !== 'things' && b.tab !== 'house' && changed && <div className="apply-row"><button className="pill" onClick={onUndo}>Undo</button><button className="done" disabled={cost > coins} onClick={onApply}>{cost ? <>Buy for <Coin />{cost}</> : 'Keep it!'}</button></div>}
  </div>;
}
export { floorBase };
