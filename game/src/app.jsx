// Callie's House: the playable game.
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { P, inv, lerp, clamp, prog, arc, rand, pick, dist, depthSort, depthSortLoose, SFX, AUDIO, audio, speak, inside, E, achieve, earn } from './core.js';
import { initFolk, stepFolk, createPerson, editPerson, familyOf, isFolk, folkDef, placeAtHome, placeOfRoom, CreatorPanel, FamiliesPanel } from './folk.jsx';
import { houseLook, buildHouse, pieceAt, WORD as HB_WORD, ACT as HB_ACT, TOGGLE as HB_TOGGLE, BY_ID as HB_ITEM, geoOf, newLayout, houseRooms, entryRoom, dropRooms, HOUSE_TYPES, planOf } from './homes.jsx';
import { BuildPanel, BuildGrid, BuildMarker, addPiece, movePiece, turnPiece, colourPiece, putAway, rebuild, styleCost, styleChanged, isFree, WHY, rugOf, rugMoved, rugSized, onRug } from './builder.jsx';
import { initSky, stepSky, skySave, SkyBack, SkyIcon, Bulb, darkness, weatherNow, isLit, inHouseRoom, toggleLight, timeWord, puddleSpots, OUTSIDE, TIME_CYCLE, TIME_LABEL, WEATHER_CYCLE, WEATHER_LABEL } from './sky.jsx';
import { ShopPanel, optionsFor, TopIcon, BottomIcon, ShoeIcon, wearing as wearItem, CATS as SHOP_CATS } from './clothes.jsx';
import { STICKER, STICKERS, todos, JobsPanel, JobIcon } from './jobs.jsx';
import { PersonLying } from './people.jsx';
import { BookReader, storyFor, STORIES } from './books.jsx';
import { initQuests, stepQuests, QUESTS, completeQuest, startHide, hideHint, foundHider, stepHide, gather, releaseAll, startDance, startBbq, endBbq, toggleGoal, kickBall, stepFootball, GOAL, connorOut } from './fun.js';
import { MagnetPanel, freshMagnets, MAG_KEY, BurgerPanel, Album, PHOTO_KEY, PersonMenu } from './funui.jsx';
import { Iso } from '../rooms.gen.jsx';
import { Splash } from './splash.jsx';
import { Person, CallieLying, DEFAULT_OUTFITS, OPTIONS, LABELS, NAMES, HeadIcon, BODY, Accessory, Rosette, Specs } from './people.jsx';
import { ItemArt, ItemIcon, KINDS, HUNT_ORDER, Sandwich } from './items.jsx';
import { ROOMS, DOORMAP, WORDS, TOWN_WORDS, CONTAINERS, containerFor, roomLayers, liveLayers, TOWN, CALLIE_FOOT, startItems } from './rooms.jsx';
import { newWorld, update, nav, walkTo, scripted, goThrough, say, burst, wiggle, later, isTidy, TIDY_TOTAL, hopOnBed, hopOffBed, sitOn, SEATS, lunchTime, alarmSpider, huntTarget, spawnSpider, travel, HOMES, BEDS, player, inHouse, claimPlayer, releaseNpc, playerCatch, changeRoomPlayer } from './world.js';
import { roomOverlays, Effects, Spider } from './overlays.jsx';
import { MenuPanel, CAFE_MENU, LUNCH_MENU, IceCreamPanel, SECTIONS, GROC, newList, ShoppingList, ShelfPanel, CheckoutPanel } from './places.jsx';
import { grandsArrive, stepGrands, GRAND_HUGS } from './grand.js';
import { TownMap, PLACES, pickParty, homeNow, arriveAt, stepCompanion, compLine } from './town.jsx';
import { initAsks, stepAsks, ducksFed, schoolReady, schoolDone, dressed, KIDS } from './asks.js';
import { initErrands, stepErrands, errandTap, errandGive } from './errands.js';
import { initPersonality, stepSocial, AboutPanel } from './personality.jsx';
import { initPets, petHouse, savePets, stepPets, petDyn, adopt, feed, cleanHome, cleanMess, playWith, defOf, kindOf, petsIn, homeCenter, homeFront, HOMES as PET_HOMES, PetShopPanel, PetFoodPanel, PetMenu, PM_ICONS } from './pets.jsx';
import { SAVE_KEY, WorldPicker, skipIntro, currentWorld, nameWorld } from './worlds.jsx';
import { initTown, openShop as buildShop, renameShop, moveThing, thingName, ShopPickPanel, ShopNamePanel, ShopBuyPanel, keeperLines, SHOP_TYPES } from './townbuild.jsx';
import { initEncounters, stepCritters, tapCritter, CritterArt, stepPost, readLetter, LetterArt, LetterPanel, stepVisit } from './encounters.jsx';
import { initXmas, resetXmas, stepXmas, decorateXmas, isChristmas, TreePanel, TREE_AT } from './christmas.jsx';
import { initHalloween, resetHalloween, stepHalloween, decorate, isHalloween, seasonOf, SEASON_LABEL, SEASON_CYCLE, PumpkinPanel } from './halloween.jsx';

const PAINT_KEY = 'callies-house-paintings-v1';
const load = k => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
const PACK_MAX = 8;
const FILLINGS = ['ham', 'jam', 'egg', 'cheese', 'tuna'];

/* ---------------- poses ---------------- */
function poseOf(p, T, W) {
  const b = { mode: p.mode === 'sit' ? 'sit' : 'stand', facing: p.facing, flip: p.flip, walk: null, armL: 8, armR: 8, blink: (T + p.id.length) % 3.3 < 0.12 ? 1 : 0, mouthOpen: false };
  let z = p.z, twirl = 1;
  if (p.mode === 'walk' && !(p.scripted && p.path && p.path.length && Math.abs((p.path[0][2] ?? p.z) - p.z) > 0.6 && Math.hypot(p.path[0][0] - p.x, p.path[0][1] - p.y) < 0.2)) { b.walk = p.walkPhase; b.armL = Math.sin(p.walkPhase) * 20; b.armR = -Math.sin(p.walkPhase) * 20; }
  else if (p.mode === 'walk') { b.armL = b.armR = 150 + Math.sin(T * 10) * 12; b.facing = 'back'; } // climbing the ladder
  if (p.mode === 'hop') { b.armL = b.armR = 150; b.mouthOpen = true; }
  if (p.mode === 'ride' || p.rideSit) {
    b.mode = 'sit'; b.walk = null; const k = p.ride ? p.ride.kind : 'slide';
    if (k === 'swing') { b.armL = b.armR = 165; b.mouthOpen = true; b.facing = 'front'; }
    else if (k === 'sand') { b.armL = 30; b.armR = 40 + Math.sin(T * 8) * 35; b.facing = 'front'; }
    else if (k === 'zip') { b.armL = b.armR = 155; b.mouthOpen = true; b.facing = 'front'; }
    else { b.armL = b.armR = 120; b.mouthOpen = true; b.facing = 'front'; }
  }
  if (p.mode === 'sit') { const sway = Math.sin(T * 2 + p.id.length); b.armL = 20 + sway * 4; b.armR = 20 - sway * 4; }
  const npc = W && W.player !== p.id;
  if (p.reading) { b.armL = b.armR = 40; b.facing = 'front'; b.holding = <g transform="rotate(-40) translate(-6 -4)"><rect x={-14} y={-10} width={28} height={18} rx={2} fill={p.reading} /><rect x={-12} y={-8} width={24} height={14} fill="#fffaf0" /><line x1={0} x2={0} y1={-8} y2={6} stroke="#c9a16a" /></g>; }
  if (npc && p.mode === 'stand' && p.id === 'mum' && p.room === 'kitchen' && !p.goal && dist([p.x, p.y], [HOMES.mum.x, HOMES.mum.y]) < 0.3) { b.facing = 'back'; b.armR = 110 + Math.sin(T * 7) * 25; }
  if (npc && p.mode === 'stand' && p.id === 'chloe' && !p.goal) { b.armR = 28; b.holding = <g transform="rotate(150)"><rect x={-5} y={-4} width={10} height={16} rx={2} fill="#2b2b2e" /><rect x={-4} y={-2} width={8} height={11} fill="#8ec5ea" /></g>; }
  if (p.holding === 'can') { const pour = Math.sin(T * 1.5) > 0.2; b.armR = pour ? 75 : 30; b.holding = <g transform={`rotate(${pour ? -45 : -10})`}><path d="M-9,-2 h16 l-1,14 h-14z" fill="#5fa58a" /><path d="M7,0 l10,-6" stroke="#5fa58a" strokeWidth={3} />{pour && [0, 1, 2].map(i => <circle key={i} cx={19 + i * 2} cy={-4 + ((T * 6 + i * 0.4) % 1) * 18} r={1.6} fill="#8ec5ea" />)}</g>; }
  if (p.id === 'dad' && p.holding === 'cup') { b.armR = 95; b.holding = <g transform="rotate(-95)"><rect x={-8} y={-2} width={16} height={18} rx={3} fill="#cfe9f5" opacity={0.75} stroke="#8ec5ea" /><g transform="translate(0 12) scale(.6)"><circle r={5} fill="#2b2b2e" /></g></g>; }
  if (W && W.dance && p.room === 'living' && p.mode === 'stand' && !p.reading) {
    const ph = T * 4.2 + p.id.length * 1.3;
    b.facing = 'front'; b.armL = 115 + Math.sin(ph) * 55; b.armR = 115 - Math.sin(ph) * 55; b.mouthOpen = Math.sin(ph * 0.5) > 0;
    z += Math.abs(Math.sin(ph)) * 0.1; if (Math.sin(T * 0.8 + p.id.length) > 0.93) twirl = Math.cos(T * 9);
  }
  const a = p.action;
  if (a) {
    const q = prog(T, a.t0, a.t0 + a.dur);
    if (q >= 1) p.action = null;
    else if (a.kind === 'wave') { b.facing = 'front'; b.armR = 150 + Math.sin(T * 14) * 20; b.mouthOpen = true; }
    else if (a.kind === 'cheer') { b.facing = 'front'; b.armL = b.armR = lerp(8, 160, Math.min(1, q * 5)) + Math.sin(T * 18) * 8; b.mouthOpen = true; z += arc(prog(q, 0.15, 0.6), 0.3) + arc(prog(q, 0.6, 0.95), 0.15); }
    else if (a.kind === 'yay') { b.facing = 'front'; b.armL = b.armR = 140 * Math.sin(q * Math.PI); b.mouthOpen = true; z += arc(q, 0.15); }
    else if (a.kind === 'twirl') { b.facing = 'front'; twirl = Math.cos(q * Math.PI * 2); b.armL = b.armR = 70; b.mouthOpen = true; z += arc(q, 0.1); }
    else if (a.kind === 'jump') { b.facing = 'front'; b.armL = b.armR = 165; b.mouthOpen = true; z += arc(q, 0.45); }
    else if (a.kind === 'catch') { b.armR = 60 + 60 * Math.sin(q * Math.PI); }
    else if (a.kind === 'talk') { b.mouthOpen = Math.sin(T * 18) > 0; }
    else if (a.kind === 'eat') { b.armR = 110; b.mouthOpen = Math.sin(T * 14) > 0; }
    else if (a.kind === 'nose') { b.facing = 'front'; b.pinch = true; b.armL = 14; b.mouthOpen = false; }
    else if (a.kind === 'knock') { b.facing = 'back'; b.armR = 100 + Math.sin(T * 30) * 20; }
  }
  if (W && W.bubbles.some(x => x.anchor.type === 'person' && x.anchor.id === p.id && T - x.t0 < 1.2)) b.mouthOpen = b.mouthOpen || Math.sin(T * 16) > 0.2;
  b.twirl = twirl;
  return { b, z };
}

/* ---------------- speech bubbles (HTML, positioned over the scene) ---------------- */
function Bubble({ b, x, y, reading, onWord, onClose }) {
  const words = b.text.split(' ');
  let idx = -1;
  if (reading && reading.id === b.id) { let n = 0; for (let i = 0; i < words.length; i++) { if (reading.ci >= n) idx = i; n += words[i].length + 1; } }
  return <div className={'bubble ' + b.style + (b.anchor.type === 'off' ? ' off' : '')} style={b.anchor.type === 'off' ? undefined : { left: x, top: y }} onPointerDown={e => e.stopPropagation()}>
    {b.anchor.type === 'off' && <span className="who"><HeadIcon who={b.who} o={DEFAULT_OUTFITS[b.who]} size={34} /><b>{NAMES[b.who]}</b></span>}
    {b.anchor.type === 'ceiling' && <span className="who"><b>Connor</b><small> (upstairs)</small></span>}
    <span className="words">{words.map((w, i) => <button key={i} className={'w' + (i === idx ? ' on' : '')} onClick={() => onWord(w.replace(/[^A-Za-z'-]/g, '') || w)}>{w}</button>)}</span>
  </div>;
}

/* ---------------- dress-up ---------------- */
function DressUp({ people = ['callie', 'chloe', 'mum', 'dad', 'connor'], outfits, who, setWho, onPick, onDone, T, uniform = {}, onUniform, wardrobe }) {
  const o = outfits[who], opt = optionsFor(who, wardrobe);
  const pose = { mode: 'stand', facing: 'front', flip: false, walk: null, armL: 10 + Math.sin(T * 2) * 4, armR: 10 - Math.sin(T * 2) * 4, blink: T % 3.3 < 0.12 ? 1 : 0, mouthOpen: false };
  const B = BODY[who], hTot = B.L + B.T + B.R * 2 + 30 + (o.acc && o.acc !== 'none' ? 40 : 0);
  const swatches = (key, title) => opt[key] && <div className="opt-row"><h3>{title}</h3><div className="choices">{opt[key].map(v => <button key={v} className="sw" style={{ '--c': v }} aria-pressed={o[key] === v} aria-label={title} onClick={() => onPick(who, key, v)} />)}</div></div>;
  const tiles = (key, title, render) => opt[key] && <div className="opt-row"><h3>{title}</h3><div className="choices">{opt[key].map(v => <button key={v} className="tile" aria-pressed={o[key] === v} aria-label={LABELS[v] || v} title={LABELS[v] || v} onClick={() => onPick(who, key, v)}>{render(v)}</button>)}</div></div>;
  return <div className="sheet dress" role="dialog" aria-label="Dress up" onPointerDown={e => e.stopPropagation()}>
    <div className="tabs">{people.map(w => <button key={w} className="tab" aria-pressed={w === who} onClick={() => { setWho(w); speak(NAMES[w], 'word'); }}><HeadIcon who={w} o={outfits[w]} size={40} /><span>{NAMES[w]}</span></button>)}</div>
    <div className="dress-body">
      <div className="preview">
        <svg viewBox={`-70 ${-hTot} 140 ${hTot + 16}`} aria-hidden="true"><ellipse cx={0} cy={4} rx={50} ry={10} fill="rgba(90,60,30,.12)" /><Person who={who} o={o} pose={pose} T={T} uid={'prev-' + who} /></svg>
        {(who === 'callie' || who === 'chloe') && <button className="pill uni" aria-pressed={!!uniform[who]} onClick={() => onUniform(who)}><svg viewBox="-26 -30 52 52" width="26" height="26" aria-hidden="true"><path d="M-14,-24 L14,-24 L22,-12 L15,-8 L13,8 L-13,8 L-15,-8 L-22,-12Z" fill="#3f6e9a" /><path d="M-6,-24 L0,-16 L6,-24Z" fill="#fff" /></svg>School uniform</button>}
        <button className="done" onClick={onDone}>Done</button>
      </div>
      <div className="opts">
        {tiles('top', 'Top', v => <TopIcon top={v} color={o.color} pattern="plain" />)}
        {swatches('color', 'Colour')}
        {tiles('pattern', 'Pattern', v => <TopIcon top={o.top === 'dungas' ? 'tee' : o.top} color={o.color} pattern={v} />)}
        {swatches('hair', 'Hair')}
        {tiles('bottom', 'Trousers', v => <BottomIcon bottom={v} legs={o.legs} />)}
        {swatches('legs', who === 'callie' ? 'Leggings' : who === 'mum' ? 'Trouser colour' : 'Trousers')}
        {tiles('feet', 'Feet', v => <svg viewBox="-20 -20 40 40" width="38" height="38">{v === 'bare' ? <g><ellipse cx={0} cy={4} rx={14} ry={9} fill="#f3cfb3" />{[-9, -4, 1, 6, 10].map((x, i) => <circle key={i} cx={x} cy={-7 + Math.abs(i - 1) * 0.8} r={i === 0 ? 3.6 : 2.6} fill="#f3cfb3" stroke="#e2b493" strokeWidth={0.8} />)}<path d="M-12,-14 q3,-5 0,-9 M0,-15 q3,-5 0,-9 M11,-14 q3,-5 0,-9" stroke="#8bc34a" strokeWidth={2} fill="none" strokeLinecap="round" /></g> : <g><rect x={-8} y={-16} width={13} height={22} rx={3} fill={o.shoes} /><ellipse cx={2} cy={7} rx={15} ry={7} fill={o.shoes} /><line x1={-8} x2={15} y1={10} y2={10} stroke="#e7c46a" strokeWidth={1.5} /></g>}</svg>)}
        {tiles('shoeStyle', 'Shoes', v => <ShoeIcon style={v} color={o.shoes} />)}
        {swatches('shoes', who === 'chloe' ? 'Boot colour' : 'Shoe colour')}
        {tiles('acc', 'Hats', v => <svg viewBox="-46 -80 92 92" width="40" height="40"><circle cx={0} cy={0} r={27} fill={BODY[who].skin} /><Accessory kind={v} back={false} hairD="#6b4a33" R={27} /></svg>)}
        {tiles('specs', 'Glasses', v => <svg viewBox="-32 -30 64 60" width="40" height="40"><circle cx={0} cy={2} r={27} fill={BODY[who].skin} /><Specs kind={v} />{v === 'none' && <text x={0} y={8} textAnchor="middle" fontSize={14} fontWeight="700" fill="#8a6f62">none</text>}</svg>)}
      </div>
    </div>
  </div>;
}
/* ---------------- painting ---------------- */
const PAINTS = ['#2b2b2e', '#ef4b4b', '#ff9a3d', '#ffd23f', '#4cc76a', '#3d8fe0', '#8e5ad1', '#ff7ab8', '#8a5a33', '#ffffff'];
function PaintPanel({ onDone, onClose }) {
  const ref = useRef(null), drawing = useRef(null);
  const [col, setCol] = useState('#3d8fe0'), [size, setSize] = useState(14);
  useEffect(() => { const cv = ref.current, g = cv.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, cv.width, cv.height); }, []);
  const posOf = e => { const r = ref.current.getBoundingClientRect(); return [(e.clientX - r.left) * ref.current.width / r.width, (e.clientY - r.top) * ref.current.height / r.height]; };
  const down = e => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); drawing.current = posOf(e); dot(drawing.current); };
  const dot = ([x, y]) => { const g = ref.current.getContext('2d'); g.fillStyle = col; g.beginPath(); g.arc(x, y, size / 2, 0, Math.PI * 2); g.fill(); };
  const move = e => { if (!drawing.current) return; const p = posOf(e), g = ref.current.getContext('2d'); g.strokeStyle = col; g.lineWidth = size; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...drawing.current); g.lineTo(...p); g.stroke(); drawing.current = p; };
  const up = () => { drawing.current = null; };
  const clear = () => { const g = ref.current.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, ref.current.width, ref.current.height); SFX.whoosh(); };
  return <div className="paint" role="dialog" aria-label="Painting" onPointerDown={e => e.stopPropagation()}>
    <div className="paint-top"><b className="paint-title">Paint!</b><div className="paint-btns"><button className="pill" onClick={clear}>Clear</button><button className="pill" onClick={onClose}>Close</button><button className="done" onClick={() => onDone(ref.current.toDataURL('image/jpeg', 0.75))}>Done</button></div></div>
    <canvas ref={ref} width={800} height={600} className="canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    <div className="palette">
      {PAINTS.map(c => <button key={c} className="sw big" style={{ '--c': c }} aria-pressed={col === c} aria-label="paint colour" onClick={() => { setCol(c); SFX.click(); }} />)}
      <span className="sizes">{[6, 14, 30].map(s => <button key={s} className="tile size" aria-pressed={size === s} aria-label={'brush ' + s} onClick={() => setSize(s)}><span style={{ width: s, height: s, background: col }} /></button>)}</span>
    </div>
  </div>;
}

/* ---------------- the game ---------------- */
function App() {
  const saved = useRef(load(SAVE_KEY)).current;
  const Wref = useRef(null);
  if (!Wref.current) Wref.current = newWorld(saved);
  const W = Wref.current;
  if (!W.quests) initQuests(W, saved && saved.quests);
  if (!W.goal) W.goal = { up: !!(saved && saved.goalUp), t0: -9 };
  if (!W.hw) initHalloween(W, saved);
  if (!W.ach) W.ach = (saved && saved.ach) || {};
  if (!W.asks) initAsks(W, saved);
  if (W.errN == null) initErrands(W, saved);
  if (!W.critters) initEncounters(W, saved);
  if (!W.friends) initPersonality(W, saved);
  if (!W.pets) initPets(W, saved);
  if (!W.town) initTown(W, saved);
  if (!W.folk) initFolk(W, saved);
  if (W.clock == null) initSky(W, saved);
  if (W.coins == null) W.coins = saved && saved.coins != null ? saved.coins : 60;
  if (!W.wardrobe) W.wardrobe = (saved && saved.wardrobe) || {};
  if (!W.xm) initXmas(W, saved);
  if (!W.visited) W.visited = (saved && saved.visited) || {};
  // a new world: no Callie family, you live in the house you made for yourself
  if (W.fresh == null) {
    W.fresh = !!(saved && saved.fresh); W.worldId = currentWorld();
    if (W.fresh) {
      for (const id of ['callie', 'chloe', 'mum', 'dad', 'connor']) Object.assign(W.people[id], { room: null, op: 0, path: null, mode: 'stand' });
      W.owner = (saved && saved.owner && W.folk.people[saved.owner]) ? saved.owner : null;
      W.worldName = (saved && saved.worldName) || 'New world';
      if (W.owner) {
        W.player = saved.player && W.folk.people[saved.player] ? saved.player : W.owner; W.prevPlayer = W.player;
        const fam = W.folk.people[W.player].fam;
        if (PLACES['h:' + fam]) arriveAt(W, 'h:' + fam, []);
        petHouse(W);
      } else W.player = 'callie';
    }
  }
  const [outfits, setOutfits] = useState(() => ({ ...DEFAULT_OUTFITS, ...Object.fromEntries(Object.entries((saved && saved.outfits) || {}).map(([k, v]) => [k, { ...DEFAULT_OUTFITS[k], ...v }])) }));
  const [paintings, setPaintings] = useState(() => load(PAINT_KEY) || []);
  const [panel, setPanel] = useState(null); // {kind:'dress'|'box'|'fridge'|'paint', ...}
  const [dressWho, setDressWho] = useState('callie');
  const [packOpen, setPackOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const [muted, setMuted] = useState(!!(saved && saved.muted));
  const [voice, setVoice] = useState(saved ? saved.voice !== false : true);
  const [menu, setMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hint, setHint] = useState(true);
  const [fillings, setFillings] = useState([]);
  const [reading, setReading] = useState(null);
  const [toast, setToast] = useState(null);
  const [stickerPop, setStickerPop] = useState(null);
  const [coinPop, setCoinPop] = useState(null);
  const popQ = useRef([]);
  const [magnets, setMagnetsRaw] = useState(() => load(MAG_KEY) || freshMagnets());
  const setMagnets = fn => setMagnetsRaw(m => { const n = typeof fn === 'function' ? fn(m) : fn; store(MAG_KEY, n); return n; });
  const [photos, setPhotos] = useState(() => load(PHOTO_KEY) || []);
  const [pmenu, setPmenu] = useState(null);
  const [petMenu, setPetMenu] = useState(null); // {pet} or {home}
  const [splash, setSplash] = useState(() => { const skip = skipIntro(); const on = !skip && (!window.__DEBUG || !!window.__SPLASH); window.__splashing = on; return on; }); // the opening animation
  const [worlds, setWorlds] = useState(null); // the world picker: 'start' after the splash, 'menu' from the menu
  const [build, setBuild] = useState(null); // decorating a New Street room: { rid, fam, rk, tab, cat, sel, saved }
  const [, setFrame] = useState(0);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const svgRef = useRef(null), press = useRef(null), drag = useRef(null);
  const av = useRef({ tv: 0, door: 1, blind: W.flags.blind ? 1 : 0, cook: 0, livingTV: 1, fire: 0, fridge: 0, ladder: 0 }).current;
  const st = useRef({}); st.current = { outfits, paintings, panel, sel, muted, voice };
  AUDIO.muted = muted; AUDIO.voice = voice;
  const c = player(W);
  const me = c.id;
  window.__back = () => { if (build) endBuild(); else if (panel) { if (panel.kind === 'book') closeBook(); else setPanel(null); } else if (petMenu) setPetMenu(null); else if (pmenu) setPmenu(null); else if (menu) setMenu(false); else if (packOpen) setPackOpen(false); else if (sel) setSel(null); };
  if (window.__DEBUG) { window.__W = W; window.__tap = (h, pt) => onTap(h, pt || [960, 540]); window.__switch = id => switchTo(id); window.__pick = id => pickPlace(id); window.__ROOMS = ROOMS; window.__nav = nav; window.__openMap = () => openMap(); window.__buildHouse = buildHouse; window.__SEATS = SEATS; window.__goPlace = id => goPlace(id); window.__adopt = id => adopt(W, id); window.__worldsUI = () => setWorlds('menu'); window.__give = (who, id) => give(who, W.items.find(i => i.id === id)); }

  useEffect(() => { const r = () => setSize({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  useEffect(() => { const h = setTimeout(() => setHint(false), 12000); return () => clearTimeout(h); }, []);

  // first entrance: Callie walks in and waves
  useEffect(() => {
    if (W.fresh) return;
    later(W, 0.6, () => { SFX.door(); });
    later(W, 0.8, () => { c.op = 1; walkTo(W, c, 3.5, 3.5, () => { c.action = { kind: 'wave', t0: W.T, dur: 1.6 }; later(W, 0.4, () => { W.flags.myDoor = false; SFX.door(); }); }); });
    spawnSpider(W, 'hallway');
  }, []);

  W.panelOpen = !!panel;
  // saving
  const saveNow = () => {
    store(SAVE_KEY, { items: W.items.map(({ id, kind, c: col, stripe, fillings: f, room, loc, rot, home, quest, layers, forWho, errand, label, bought }) => ({ id, kind, c: col, stripe, fillings: f, room, loc, rot, home, quest, layers, forWho, errand, label, bought })), hw: { stage: W.hw.stage, year: W.hw.year, pumpkin: W.hw.pumpkin }, xm: { stage: W.xm.stage, year: W.xm.year, tree: W.xm.tree }, asks: { ducks: { state: W.asks.ducks.state, who: W.asks.ducks.who }, school: { state: W.asks.school.state } }, uniform: W.uniform, spiderN: W.spiderN, seasonPick: W.seasonPick, folk: W.folk, sky: skySave(W), coins: W.coins, wardrobe: W.wardrobe, ach: W.ach, visited: W.visited, outfits: st.current.outfits, hunt: W.hunt, quests: W.quests, errand: W.errand, errN: W.errN, traits: W.traits, friends: W.friends, pets: savePets(W), town: W.town, fresh: W.fresh, owner: W.owner, player: W.fresh ? W.player : undefined, worldName: W.worldName, met: W.met, lettersRead: W.lettersRead, letter: W.letter, goalUp: W.goal.up, lights: W.flags.lights, blind: W.flags.blind, muted: st.current.muted, voice: st.current.voice });
    W.dirty = false;
  };
  useEffect(() => { W.dirty = true; }, [outfits, muted, voice]);
  useEffect(() => { document.body.classList.toggle('building', !!build); }, [!!build]);
  // Android app: the back button closes whatever is open instead of quitting the game
  useEffect(() => {
    const cap = window.Capacitor; if (!cap || !cap.isNativePlatform || !cap.isNativePlatform() || !cap.registerPlugin) return undefined;
    const h = cap.registerPlugin('App').addListener('backButton', () => window.__back && window.__back());
    return () => { Promise.resolve(h).then(x => x && x.remove && x.remove()).catch(() => {}); };
  }, []);
  useEffect(() => { const t = setInterval(() => { if (W.dirty) saveNow(); }, 2500); const v = () => { if (document.hidden) saveNow(); }; document.addEventListener('visibilitychange', v); return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); }; }, []);

  // main loop
  const tickRef = useRef(null);
  tickRef.current = dt => {
    update(W, dt);
    const k = r => 1 - Math.exp(-dt * r);
    av.tv = lerp(av.tv, W.flags.tv ? 1 : 0, k(8)); av.door = lerp(av.door, W.flags.myDoor ? 1 : 0, k(5));
    av.blind = lerp(av.blind, W.flags.blind ? 1 : 0, k(4)); av.cook = lerp(av.cook, W.flags.cooking ? 1 : 0, k(5));
    av.livingTV = lerp(av.livingTV, W.flags.livingTV ? 1 : 0, k(8)); av.fire = lerp(av.fire, W.flags.fire ? 1 : 0, k(3));
    av.fridge = lerp(av.fridge, W.flags.fridge ? 1 : 0, k(6)); av.hob = lerp(av.hob || 0, W.flags.hob ? 1 : 0, k(5));
    if (W.flags.ladder > 0 && W.flags.ladder < 1) W.flags.ladder = Math.min(1, W.flags.ladder + dt * 2.5);
    if (W.flags.ladder >= 1 && W.room === 'hallway' && c.room === 'hallway' && c.mode !== 'walk' && W.T - (W.ladderT || 0) > 4) W.flags.ladder = 0;
    stepQuests(W);
    stepCompanion(W);
    stepGrands(W);
    stepFolk(W);
    stepRide();
    stepHalloween(W);
    stepXmas(W);
    stepAsks(W);
    stepErrands(W, it => { if (it) { SFX.pop(); wordFx(KINDS[it.kind].word, headAt(c)); } });
    stepCritters(W, dt);
    stepPost(W);
    stepVisit(W, placeAtHome);
    stepPets(W, dt, petFx);
    stepSocial(W, (kind, id) => { const p = W.people[id]; if (p && p.room === W.room) burst(W, kind, headAt(p), kind === 'hearts' ? {} : { n: 10, spread: 80 }); });
    stepSky(W, dt);
    stepStink();
    stepHide(W, dt, p => { burst(W, 'confetti', headAt(p)); showToast(`You found ${NAMES[p.id]}!`); });
    stepFootball(W, s => { SFX.cheer(); if (s.kicker === W.player) later(W, 2, () => achieve(W, 'goal')); const k = W.people[s.kicker]; burst(W, 'confetti', P(6.4, 7.0, 1.2)); burst(W, 'word', P(6.4, 7.0, 1.6), { text: 'GOAL!', life: 2 }); if (k && k.room === 'garden') { k.action = { kind: 'cheer', t0: W.T, dur: 1.6 }; say(W, k.id, 'GOAL!'); } });
    // Dad cheers at the football
    const dad = W.people.dad;
    if (W.room === 'living' && dad.room === 'living' && dad.mode === 'sit' && W.flags.livingTV && W.T > (W.nextGoal || 12)) { W.nextGoal = W.T + rand(25, 45); say(W, 'dad', pick(['GOAL!', 'Yes! GOAL!', 'Come on, ref!', 'What a goal!'])); dad.action = { kind: 'yay', t0: W.T, dur: 0.8 }; }
    // tidy check (Callie's room)
    const tidy = W.items.filter(isTidy).length;
    if (tidy === TIDY_TOTAL && W.tidyWas < TIDY_TOTAL) {
      later(W, 0.3, () => { SFX.fanfare(); showToast('All tidy! Brilliant!'); later(W, 2.5, () => { if (!achieve(W, 'tidy')) earn(W, 5); }); if (c.mode === 'stand') c.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; [P(2.2, 1.1, 1.3), P(4.95, 2.75, 0.9), P(1.6, 5.15, 1.1), P(0.5, 2.5, 1.6)].forEach((a, i) => later(W, i * 0.15, () => burst(W, 'spark', a, { n: 14, spread: 150 }))); });
    }
    W.tidyWas = tidy;
  };
  useEffect(() => {
    let raf, last = 0;
    let skip = 0;
    // big town places draw at most 30 times a second so slower tablets keep up
    const loop = now => { if (window.__splashing) { last = 0; raf = requestAnimationFrame(loop); return; } if (!last) last = now; const dt = Math.min(0.05, (now - last) / 1000); last = now; tickRef.current(dt); const town = ROOMS[W.room] && ROOMS[W.room].town; if (!town || (skip = 1 - skip)) setFrame(f => (f + 1) % 1e6); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // read new bubbles aloud
  useEffect(() => {
    for (const b of W.bubbles) {
      if (b.spoken) continue; b.spoken = true;
      const visible = b.anchor.type === 'off' || b.anchor.type === 'ceiling' && ROOMS[W.room].ceiling || (b.anchor.type === 'person' && W.people[b.anchor.id] && W.people[b.anchor.id].room === W.room) || (b.anchor.type === 'world' && b.anchor.room === W.room);
      if (visible && !b.quiet) speak(b.text, b.who, ci => setReading({ id: b.id, ci }));
    }
  });

  // Chloe with bare feet: everyone she walks past holds their nose
  const STINK = { callie: ['Stinky! Put some shoes on, Chloe!', 'Pooh! Chloe, your feet!'], mum: ['Stinky! Put some shoes on!', 'Chloe! Shoes on, please!'], dad: ['Pooh! What is that smell?', 'Stinky! Put some shoes on!'], connor: ['Ugh! Stinky feet!', 'Put some shoes on, Chloe!'], nanny: ['Ooh! Shoes on, darling!', 'Stinky! Put some shoes on!'], grandad: ['Phew! Who let the cheese out?', 'Stinky! Put some shoes on!'] };
  function stepStink() {
    const ch = W.people.chloe, o = st.current.outfits.chloe;
    if (!o || o.feet !== 'bare' || W.uniform.chloe || ch.room !== W.room || ch.mode === 'lie' || ch.op < 0.5 || W.bedtime || W.T < (W.stinkT || 0)) return;
    for (const p of Object.values(W.people)) {
      if (p === ch || p.room !== ch.room || p.mode === 'lie' || p.hiding || p.op < 0.5 || !STINK[p.id] || W.T < (p.stinkT || 0)) continue;
      if (dist([p.x, p.y], [ch.x, ch.y]) > 1.35) continue;
      p.stinkT = W.T + 25; W.stinkT = W.T + 6;
      say(W, p.id, pick(STINK[p.id]));
      if (p.mode === 'stand' && !p.ride && !p.busy) { p.action = { kind: 'nose', t0: W.T, dur: 2.2 }; if (p.id !== W.player && !p.goal) p.facing = 'front'; }
      SFX.boing();
      if (Math.random() < 0.5) later(W, 2, () => say(W, 'chloe', pick(['My feet are fine!', 'Whatever.', 'They do NOT smell!', 'Ugh. Fine.'])));
      later(W, 3, () => achieve(W, 'stinky'));
      break;
    }
  }
  function showToast(t, ms = 3000) { setToast(t); setTimeout(() => setToast(null), ms); }
  // a new sticker slides in; more than one wait their turn
  const nextPop = () => {
    const id = popQ.current[0]; if (!id) { setStickerPop(null); return; }
    const S = STICKER[id]; setStickerPop({ id, t: Date.now() }); SFX.sparkle(); speak(`New sticker! ${S.title}!`, 'narrator');
    setTimeout(() => { popQ.current.shift(); nextPop(); }, 4200);
  };
  W.onCoins = n => { const t = Date.now(); setCoinPop({ n, t }); setTimeout(() => setCoinPop(p => (p && p.t === t ? null : p)), 1800); };
  W.onAchieve = id => { if (!STICKER[id]) return; popQ.current.push(id); if (popQ.current.length === 1) nextPop(); };
  const wordFx = (word, at) => { burst(W, 'word', at, { text: word, life: 1.8 }); speak(word, 'word'); };
  const inPack = () => W.items.filter(i => i.loc.s === 'pack').sort((a, b) => (a.packT || 0) - (b.packT || 0));
  const inBox = id => W.items.filter(i => i.loc.s === 'in' && i.loc.box === id).sort((a, b) => (a.loc.order || 0) - (b.loc.order || 0));
  const headAt = p => { const B = BODY[p.id]; const g = P(p.x, p.y, p.z); return p.mode === 'lie' ? [g[0] + 30, g[1] - 40] : [g[0], g[1] - (B.L + B.T + B.R * 2 + 14) + (p.mode === 'sit' ? B.L - 10 : 0)]; };

  /* ----- moving things around ----- */
  function toPack(it, fromAt) {
    if (inPack().length >= PACK_MAX) { say(W, me, 'My bag is full!'); return false; }
    it.loc = { s: 'pack' }; it.packT = W.T; it.room = null; W.dirty = true;
    SFX.pop(); if (fromAt) burst(W, 'spark', fromAt, { n: 8, spread: 60 });
    wordFx(it.label || (KINDS[it.kind] ? KINDS[it.kind].word : it.kind), headAt(c));
    if (it.kind === 'spooky') { if (me === 'mum') later(W, 0.6, () => decorate(W, t => showToast(t))); else later(W, 0.6, () => { SFX.sparkle(); showToast('Found the spooky box!'); say(W, me, 'The spooky box! Take it to Mum!'); }); }
    else if (it.kind === 'xmasbox') { if (me === 'mum') later(W, 0.6, () => decorateXmas(W, t => showToast(t))); else later(W, 0.6, () => { SFX.sparkle(); showToast('Found the Christmas box!'); say(W, me, 'The Christmas box! Take it to Mum!'); }); }
    else if (it.kind === 'bread' && W.asks.ducks.state === 'active') later(W, 0.6, () => { SFX.sparkle(); say(W, me, 'Bread for the ducks! Now to the park!'); });
    else if (it.quest) later(W, 0.6, () => { SFX.sparkle(); showToast(`Found ${NAMES[it.quest]}'s ${it.kind}!`); say(W, me, `${NAMES[it.quest]}'s ${it.kind}!`); });
    if (huntTarget(W) === it.kind && !it.bought) {
      W.hunt.done.push(it.kind); W.hunt.idx++;
      later(W, 0.8, () => { SFX.fanfare(); say(W, me, `I found the ${it.kind}!`); c.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; burst(W, 'confetti', headAt(c)); showToast(`You found the ${it.kind}!`); earn(W, 5); if (!huntTarget(W)) later(W, 2.5, () => achieve(W, 'hunt')); });
    }
    return true;
  }
  function putIn(it, boxId) { it.loc = { s: 'in', box: boxId, order: W.T }; it.room = CONTAINERS[boxId].room; W.dirty = true; SFX.pop(); }
  function dropOnFloor(it, x, y) { const [fx, fy] = nav(W.room).nearestFree(x, y, 0.05); it.loc = { s: 'floor', x: fx, y: fy }; it.room = W.room; it.rot = rand(-20, 20); W.dirty = true; SFX.plop(); }
  /* ----- the town builder ----- */
  const tbOf = () => (panel && panel.kind === 'map' && panel.tb) || null;
  const setTb = tb => setPanel(pn => (pn && pn.kind === 'map' ? { ...pn, tb } : pn));
  function tbPlot(k) {
    const tb = tbOf(); if (!tb) return;
    if (tb.moving) {
      const ok = moveThing(W, tb.moving.loc, k);
      if (!ok) { speak(tb.moving.loc.startsWith('s:') ? 'Shops go on the high streets.' : 'Someone lives there!', 'narrator'); SFX.click(); return; }
      SFX.sparkle(); speak(`${tb.moving.name} is here now!`, 'narrator');
      if (tb.then) { const then = tb.then; setTb(null); setPanel(pn => ({ ...pn, picked: then, tb: null })); later(W, 0.5, () => goPlace(then)); return; }
      setTb({}); return;
    }
    if (typeof k === 'number') { speak('New Street is for houses. Make a new person to build a house!', 'narrator'); SFX.click(); return; }
    setTb({ plot: k, step: 'pick' }); speak('What kind of shop?', 'narrator'); SFX.pop();
  }
  function tbThing(loc) {
    const name = thingName(W, loc); if (!name) return;
    speak(name, 'word'); SFX.pop(); setTb({ thing: loc });
  }
  function tbOpen(type, name, sign) {
    const tb = tbOf(); if (!tb) return;
    if (tb.rename) { renameShop(W, tb.rename, name, sign); SFX.sparkle(); setTb({}); speak(`${name}!`, 'word'); return; }
    const sh = buildShop(W, type, name, sign, tb.plot); if (!sh) return;
    SFX.coins(); later(W, 0.3, () => SFX.fanfare());
    speak(`${sh.name} is open!`, 'narrator'); setTb({ opened: sh.id });
    later(W, 2, () => achieve(W, 'myshop')); if (Object.keys(W.town.shops).length >= 5) later(W, 3, () => achieve(W, 'highstreet'));
  }
  function tbBar() {
    const tb = tbOf(); if (!tb) return null;
    const done = <button className="done" onClick={() => { setTb(null); SFX.zip(); }}>Done</button>;
    if (tb.moving) return <><b className="map-word small">Where shall {tb.moving.name} go?</b>{tb.then ? <button className="done" onClick={() => { const then = tb.then; setPanel(pn => ({ ...pn, picked: then, tb: null })); later(W, 0.4, () => goPlace(then)); }}>Keep it here</button> : <button className="pill" onClick={() => setTb({})}>Cancel</button>}</>;
    if (tb.opened && W.town.shops[tb.opened]) { const sh = W.town.shops[tb.opened]; return <><b className="map-word small">{sh.name} is open!</b><button className="pill" onClick={() => setTb({})}>Build more</button><button className="done" onClick={() => { setPanel(pn => ({ ...pn, picked: 's:' + sh.id, tb: null })); later(W, 0.3, () => goPlace('s:' + sh.id)); }}>Go inside</button></>; }
    if (tb.thing) { const loc = tb.thing, name = thingName(W, loc), shop = loc.startsWith('s:') && W.town.shops[loc.slice(2)];
      return <><b className="map-word small">{name}</b><button className="pill" onClick={() => { setTb({ moving: { loc, name } }); speak('Tap where it should go', 'narrator'); }}>Move</button>{shop && <button className="pill" onClick={() => setTb({ rename: shop.id, type: shop.type, step: 'name' })}>Rename</button>}{done}</>; }
    return <><b className="map-word small">Tap a + to build a shop</b>{done}</>;
  }
  function tbSheets() {
    const tb = tbOf(); if (!tb) return null;
    if (tb.step === 'pick') return <ShopPickPanel W={W} plot={tb.plot} start={tb.type} onClose={() => setTb({})} onNext={type => { setTb({ ...tb, type, step: 'name' }); speak('Give it a name!', 'narrator'); }} />;
    if (tb.step === 'name') return <ShopNamePanel key={tb.rename || tb.type} W={W} type={tb.type} rename={tb.rename && W.town.shops[tb.rename]} onBack={() => setTb(tb.rename ? {} : { ...tb, step: 'pick' })} onOpen={(n, sg) => tbOpen(tb.type, n, sg)} />;
    return null;
  }
  function openTownShop(sh) {
    const t = SHOP_TYPES[sh.type];
    if (t.id === 'pets') { setPanel({ kind: 'petshop', cat: 'dogs' }); return; }
    if (t.id === 'clothes' || t.id === 'shoes') { openShop(t.id === 'shoes' ? 'shoes' : 'tops'); return; }
    if (t.id === 'icecream') { setPanel({ kind: 'icecream' }); return; }
    setPanel({ kind: 'townshop', id: sh.id }); speak('What would you like?', 'narrator');
  }
  function buyThing(sh, t) {
    if (W.coins < t.price) { say(W, me, 'I need more coins!'); return; }
    W.coins -= t.price; W.dirty = true; SFX.coins();
    const at = P(2.6, 4.75, 1.3);
    if (t.service) {
      setPanel(null);
      later(W, 0.5, () => { c.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; burst(W, 'spark', headAt(c), { n: 16, spread: 120 }); SFX.sparkle(); say(W, me, pick(['Ta-da! Do you like it?', 'All done! So pretty!', 'Look at me!'])); });
      npcSay('Keeper', pick(['There you go!', 'Lovely!', 'All done!']), [2.6, 3.75, 2.4], 'lady');
      return;
    }
    const it = { id: 'b' + Math.round(W.T * 1000), kind: t.kind || 'shopping', label: t.kind ? undefined : t.word, c: sh.sign, bought: true, room: W.room, loc: { s: 'floor', x: c.x, y: c.y }, rot: 0 };
    W.items.push(it); if (!toPack(it, at)) { W.items = W.items.filter(x => x !== it); W.coins += t.price; return; }
    npcSay('Keeper', pick(['Here you go!', 'Thank you!', 'Enjoy it!']), [2.6, 3.75, 2.4], 'lady');
    if (!t.kind) later(W, 0.6, () => speak(t.word, 'word'));
  }
  /* ----- pets ----- */
  const grownUp = () => ['mum', 'dad'].find(k => k !== W.player && W.people[k] && W.people[k].room) || null;
  const petFx = {
    word: (t, at) => { burst(W, 'word', at, { text: t, life: 1.6 }); speak(t, 'word'); },
    need: (p, kind) => {
      if (W.out || W.bedtime) return;
      const g = grownUp(), name = p.id ? defOf(p).name : null;
      const line = kind === 'hungry' ? `${name} is hungry!` : kind === 'walk' ? `${name} wants to go for a walk!` : kind === 'poo' ? `Oh no! ${name} did a poo in the garden!` : `${PET_HOMES[p.home].name[0].toUpperCase() + PET_HOMES[p.home].name.slice(1)} is dirty!`;
      SFX.ding();
      if (g) later(W, 0.4, () => say(W, g, line, W.people[g].room === W.room ? null : { type: 'off', id: g }));
      else showToast(line);
    },
    done: (p, kind) => { const d = W.pets.find(q => q.id === p.id); if (d && d.room === W.room) { burst(W, 'hearts', P(d.x, d.y, 0.8)); petFx.word('Woof woof!', P(d.x, d.y, 1.0)); } showToast(`Walkies! ${defOf(p).name} loves the park!`); SFX.fanfare(); },
  };
  const petAt = p => (['dog', 'cat'].includes(kindOf(p)) && p.room === W.room ? [p.x, p.y] : homeCenter(Object.keys(PET_HOMES).find(h => petsIn(W, h).includes(p))));
  function walkToPet(at, then) { const t = nav(W.room).nearestFree(at[0] + 0.55, at[1] + 0.75); walkTo(W, c, t[0], t[1], () => { c.facing = 'back'; c.flip = (at[0] - c.x) - (at[1] - c.y) < 0; then && then(); }); }
  function petTap(id) {
    const p = W.pets.find(q => q.id === id); if (!p) return;
    setPmenu(null); petFx.word(defOf(p).name, P(p.x, p.y, 1.0));
    walkToPet([p.x, p.y], () => setPetMenu({ pet: id }));
  }
  function homeTap(h) {
    const at = homeCenter(h); setPmenu(null);
    wordFx(PET_HOMES[h].word, P(at[0], at[1], 1.2));
    const f = homeFront(h), t = nav(W.room).nearestFree(f[0], f[1]);
    walkTo(W, c, t[0], t[1], () => { c.facing = 'back'; c.flip = (at[0] - c.x) - (at[1] - c.y) < 0; setPetMenu({ home: h }); });
  }
  function messTap(id) {
    const m = W.petMess.find(q => q.id === id); if (!m) return;
    walkToPet([m.x, m.y], () => { SFX.plop(); burst(W, 'word', P(m.x, m.y, 0.5), { text: 'Scoop!', life: 1.4 }); cleanMess(W, id); later(W, 0.5, () => say(W, me, pick(['Yuck! Into the bin!', 'Pooh! All gone!', 'Eww! Got it!']))); later(W, 1.4, () => { SFX.sparkle(); showToast('All clean! Well done!'); }); });
  }
  function petCuddle(ids) {
    setPetMenu(null);
    for (const id of ids) { const p = W.pets.find(q => q.id === id); const at = petAt(p); burst(W, 'hearts', P(at[0], at[1], 0.8)); }
    const p = W.pets.find(q => q.id === ids[0]); SFX.sparkle(); petFx.word(pick({ dog: ['Woof!', 'Lick lick!'], cat: ['Purr...', 'Meow!'], fish: ['Blub!'], bird: ['Tweet!'] }[kindOf(p)] || ['Squeak!']), P(...petAt(p), 1.0));
    c.action = { kind: 'yay', t0: W.T, dur: 0.8 };
  }
  function petFeed(ids, food) {
    const r = feed(W, ids, food);
    const p0 = W.pets.find(q => q.id === ids[0]), at = petAt(p0);
    speak(food, 'word');
    if (!r.ok) { later(W, 0.5, () => { say(W, me, r.line); later(W, 1.8, () => speak(r.hint, 'narrator')); }); return; }
    setPanel(null); SFX.nom(); burst(W, 'word', P(at[0], at[1], 0.9), { text: r.line, life: 1.6 });
    later(W, 0.4, () => { for (const p of r.pets) { const a = petAt(p); burst(W, 'hearts', P(a[0], a[1], 0.8)); } });
    later(W, 1.2, () => say(W, me, pick(['Good pet!', 'There you go!', 'Yum yum!'])));
  }
  function petClean(h) {
    setPetMenu(null);
    const at = homeCenter(h), was = cleanHome(W, h);
    SFX.water(2); c.action = { kind: 'yay', t0: W.T, dur: 0.8 };
    [0, 1, 2, 3].forEach(i => later(W, 0.3 + i * 0.35, () => burst(W, 'spark', P(at[0] + rand(-0.4, 0.4), at[1] + rand(-0.2, 0.2), 0.9), { n: 8, spread: 60 })));
    later(W, 1.6, () => { SFX.sparkle(); say(W, me, was > 0.5 ? 'Sparkly clean!' : 'All clean!'); });
  }
  // a job finished: a cheer, a sparkle and a toast
  function jobDone(E, thanker) {
    const p = W.people[thanker];
    if (p && p.room === W.room) { burst(W, 'confetti', headAt(p)); if (p.mode === 'stand' && !p.action) p.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; }
    if (c.mode === 'stand') c.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
    burst(W, 'spark', headAt(c), { n: 12, spread: 90 });
    showToast('Job done! Well done!');
  }
  function give(who, it) {
    const p = W.people[who];
    if (!p || p.room !== W.room) { say(W, me, `${NAMES[who]} is not here.`); return; }
    walkTo(W, c, ...nav(W.room).nearestFree(p.x + 0.6, p.y + 0.5), () => {
      const job = errandGive(W, who, it, jobDone);
      if (job === '') { if (it.kind === 'sandwich' || it.kind === 'cake') { SFX.nom(); p.action = { kind: 'eat', t0: W.T, dur: 2 }; } else p.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; burst(W, 'hearts', headAt(p)); return; }
      if (job) { say(W, who, job); return; }
      if (it.kind === 'spooky') { if (who === 'mum') decorate(W, t => showToast(t)); else say(W, who, 'Give it to Mum!'); return; }
      if (it.kind === 'xmasbox') { if (who === 'mum') decorateXmas(W, t => showToast(t)); else say(W, who, 'Give it to Mum!'); return; }
      if (it.kind === 'bread') { say(W, who, 'That bread is for the ducks!'); return; }
      if (it.quest && it.quest === who) {
        completeQuest(W, who, it, Q => { say(W, who, Q.thanks); p.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; burst(W, 'confetti', headAt(p)); showToast(`${NAMES[who]} has the ${it.kind}!`); });
        return;
      }
      if (it.quest) { say(W, who, `That is ${NAMES[it.quest]}'s ${it.kind}!`); return; }
      if (it.kind === 'burger') {
        W.items = W.items.filter(x => x !== it); SFX.nom(); p.action = { kind: 'eat', t0: W.T, dur: 2 }; burst(W, 'hearts', headAt(p));
        const l = it.layers || [];
        const line = it.forWho === who ? 'My burger! Yum!' : l.includes('ketchup') && who === 'connor' ? 'Ketchup! Yes!' : !l.includes('burger') ? 'No burger in it? Ha!' : 'Yum! A burger!';
        later(W, 0.4, () => say(W, who, line)); W.dirty = true;
        return;
      }
      if (it.kind === 'shopping') {
        W.items = W.items.filter(x => x !== it); W.dirty = true;
        later(W, 0.3, () => say(W, who, who === 'mum' || who === 'dad' ? 'Thank you for doing the shopping!' : who === me ? 'Our shopping!' : 'Ooh, shopping!')); burst(W, 'hearts', headAt(p));
        return;
      }
      if (KINDS[it.kind] && KINDS[it.kind].food) {
        W.items = W.items.filter(x => x !== it); W.dirty = true; SFX.nom(); p.action = { kind: 'eat', t0: W.T, dur: 2 }; burst(W, 'hearts', headAt(p));
        const drink = KINDS[it.kind].food === 'drink';
        const line = it.kind === 'icecream' && it.forWho === who ? 'My ice cream! Yum!' : who === 'chloe' && it.kind === 'icecream' ? 'Ice cream? Ok. Thanks, Callie.' : drink ? pick(['Slurp! Yum!', 'Mmm!', 'Lovely!']) : pick(['Yum!', 'Yummy!', 'Mmm, thank you!']);
        later(W, 0.4, () => say(W, who, line));
        return;
      }
      if (it.kind === 'sandwich') {
        W.items = W.items.filter(x => x !== it); SFX.nom(); p.action = { kind: 'eat', t0: W.T, dur: 2 }; burst(W, 'hearts', headAt(p));
        const f = it.fillings || [];
        let line = 'Yum! Thank you!';
        if (who === 'chloe') line = !f.length ? 'Just bread? Ok...' : f.includes('jam') && f.length > 1 ? `${f[0][0].toUpperCase() + f[0].slice(1)} and ${f[1]}? Weird... but yum!` : 'Yum! Thanks, Callie.';
        if (who === 'dad') line = 'My fave! Yum!';
        if (who === 'connor') later(W, 2, () => achieve(W, 'feed'));
        later(W, 0.4, () => say(W, who, line));
      } else later(W, 0.2, () => say(W, who, `Nice ${KINDS[it.kind] ? KINDS[it.kind].word : 'thing'}!`));
      W.dirty = true;
    });
  }
  function flingOut(boxId) {
    const list = inBox(boxId); if (!list.length) { SFX.boing(); return; }
    const spots = nav(W.room).randomFree(list.length, [1.4, 6.4, 2.3, 5.6]);
    list.forEach((it, k) => { it.loc = { s: 'floor', x: spots[k][0], y: spots[k][1] }; it.room = W.room; it.rot = rand(-60, 60); it.fly = { from: P(...(CONTAINERS[boxId].at || [3, 3]), 0.8), t0: W.T + k * 0.1 }; later(W, k * 0.1 + 0.6, () => SFX.plop()); });
    SFX.whoosh(); W.dirty = true; setPanel(null);
  }

  /* ----- family photo ----- */
  function startPhoto() {
    if (W.photo || W.bedtime) return;
    setPanel(null); setPmenu(null);
    W.photo = { stage: 'gather', room: W.room };
    const offs = [[0.7, -0.6], [-0.6, 0.7], [1.35, -1.2], [-1.2, 1.35], [0.3, -1.5]];
    const n = gather(W, W.room, i => nav(W.room).nearestFree(c.x + offs[i % 5][0], c.y + offs[i % 5][1]), 'photo');
    say(W, me, n ? 'Photo time! Everyone come here!' : 'Say cheese!');
    c.facing = 'front';
  }
  function snapPhoto() {
    if (!W.photo || W.photo.stage !== 'gather') return;
    W.photo.stage = 'count'; W.photo.t0 = W.T;
    [3, 2, 1].forEach((n, i) => later(W, i * 0.8, () => { SFX.click(); speak(String(n), 'word'); }));
    later(W, 2.3, () => { speak('Cheese!', 'narrator'); for (const p of Object.values(W.people)) if (p.room === W.room && p.mode !== 'lie') { p.facing = 'front'; p.action = { kind: 'cheer', t0: W.T, dur: 1.8 }; } });
    later(W, 2.75, () => { SFX.shutter(); W.flashT = W.T; capturePhoto(); });
    later(W, 4.2, () => { W.photo = null; releaseAll(W, 'photo'); });
  }
  function cancelPhoto() { W.photo = null; releaseAll(W, 'photo'); }
  function capturePhoto() {
    try {
      const svg = svgRef.current, w = 900, h = 675;
      const clone = svg.cloneNode(true);
      const fam = Object.values(W.people).filter(p => p.room === W.room && p.op > 0.5);
      if (fam.length) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const p of fam) { const g = P(p.x, p.y, p.z), hgt = BODY[p.id].L + BODY[p.id].T + BODY[p.id].R * 2 + 20; x0 = Math.min(x0, g[0] - 50); x1 = Math.max(x1, g[0] + 50); y0 = Math.min(y0, g[1] - hgt); y1 = Math.max(y1, g[1] + 20); }
        let cw = x1 - x0 + 160, ch = y1 - y0 + 120; if (cw / ch > 4 / 3) ch = cw * 3 / 4; else cw = ch * 4 / 3;
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        clone.setAttribute('viewBox', `${cx - cw / 2} ${cy - ch / 2} ${cw} ${ch}`);
      }
      clone.setAttribute('width', w); clone.setAttribute('height', h); clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const str = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const g = cv.getContext('2d'); g.fillStyle = '#efe2d0'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
        let url; try { url = cv.toDataURL('image/jpeg', 0.78); } catch (e) { return; }
        setPhotos(ps => { const n = [...ps, url].slice(-9); store(PHOTO_KEY, n); return n; });
        showToast('Photo saved!'); later(W, 2, () => achieve(W, 'photo'));
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
    } catch (e) { /* photo could not be taken */ }
  }

  /* ----- going out ----- */
  function openMap() {
    if (W.bedtime || W.drive) return;
    setSel(null); setPackOpen(false); setPmenu(null);
    setPanel({ kind: 'map', here: W.out ? W.out.place : 'home', picked: null });
    speak('Where shall we go?', 'narrator');
  }
  function pickPlace(id) { setPanel(pn => (pn && pn.kind === 'map' ? { ...pn, picked: id } : pn)); speak(PLACES[id].word, 'word'); SFX.pop(); }
  function goPlace(id) {
    const here = W.out ? W.out.place : 'home';
    if (id === here || W.drive) return;
    if (id === 'school' && W.asks.school.state === 'active' && KIDS.includes(W.player) && !W.uniform[W.player]) {
      setPanel(null); say(W, W.player, 'I need my school uniform on first!'); later(W, 1.2, () => speak('Your uniform is in your wardrobe.', 'narrator')); return;
    }
    const plan = isFolk(W.player) ? { lead: W.player, party: (W.out && W.out.party) || [] } : id === 'school' ? pickParty(W, 'school') : W.out ? { lead: W.player, party: W.out.party || [] } : pickParty(W, id);
    if (W.hide) { const hp = W.people[W.hide.who]; hp.hiding = false; hp.busy = null; hp.mode = 'stand'; hp.z = 0; W.hide = null; }
    if (W.photo) cancelPhoto();
    W.drive = { from: here, to: id, t0: W.T, dur: 2.8 };
    SFX.car(); speak(id === 'home' ? 'Going home!' : `Going to ${PLACES[id].say}!`, 'narrator');
    later(W, 2.9, () => {
      W.fade = { t0: W.T };
      later(W, 0.28, () => {
        // anyone not coming along goes back home; at school you play as one of the girls
        const going = new Set([plan.lead, ...plan.party]);
        const leave = k => { if (isFolk(k)) placeAtHome(W, k); else if (k === 'connor') { W.people.connor.busy = null; releaseNpc(W, 'connor'); } else homeNow(W, k); };
        if (W.out) for (const k of W.out.party || []) if (!going.has(k)) leave(k);
        // visitors at Callie's house go back to their own houses
        if (!W.out) for (const d of Object.values(W.folk.people)) { const q = W.people[d.id]; if (d.fam !== 'home' && q && !going.has(d.id) && q.room && !placeOfRoom(q.room)) placeAtHome(W, d.id); }
        if (plan.lead !== W.player) { const old = W.player; W.people[old].reading = null; claimPlayer(W, plan.lead); W.player = plan.lead; if (!going.has(old)) leave(old); }
        arriveAt(W, id, plan.party); if (id === 'nanny') grandsArrive(W); W.drive = null; setPanel(null);
        later(W, 0.9, () => greet(id, here, plan));
        W.visited[id] = 1; W.dirty = true; if (['cafe', 'school', 'park', 'shop', 'nanny'].every(k => W.visited[k])) later(W, 4, () => achieve(W, 'explorer'));
      });
    });
  }
  function greet(id, from, plan = {}) {
    const me = W.player, c = player(W), off = who => (W.people[who] && W.people[who].room === W.room ? null : { type: 'off', id: who });
    if (id.startsWith('s:')) {
      const sh = W.town.shops[id.slice(2)]; if (!sh) return;
      const L = keeperLines(sh);
      npcSay('Keeper', L[0], [2.6, 3.75, 2.4], 'lady'); later(W, 2.6, () => npcSay('Keeper', L[1], [2.6, 3.75, 2.4], 'lady'));
      later(W, 5.5, () => achieve(W, 'visitshop'));
      return;
    }
    if (id.startsWith('h:')) {
      const fam = W.folk.fams[id.slice(2)];
      if (fam && fam.members.includes(me)) say(W, me, pick(['Home sweet home!', 'I am home!']));
      else if (fam) say(W, me, `Hello, ${fam.name}! Can we come in?`);
      return;
    }
    if (id === 'school' && !isFolk(me)) {
      // Mum just drops them off at the gate
      say(W, 'mum', pick(['Have a lovely day at school! Bye!', 'Be good! See you at home time!', 'Love you! Have fun at school!']), off('mum'));
      c.action = { kind: 'wave', t0: W.T, dur: 1.6 };
      const other = W.out && W.out.party[0];
      if (other) later(W, 3.2, () => say(W, other, other === 'chloe' ? 'Come on, Callie. Let us go in.' : 'Bye Mum! Come on, Chloe!'));
      if (W.asks.school.state === 'active' && schoolReady(W)) schoolDone(W);
      return;
    }
    if (id === 'home' && from === 'school') { say(W, 'mum', 'Welcome home! How was school?', off('mum')); return; }
    const lines = {
      home: [me, 'Home again!'],
      park: [null, ['Let us play at the park!', 'The park! Have fun!']],
      cafe: [null, ['What would you like? Order at the till.', 'Let us get a treat!']],
      shop: [null, ['Can you help me with the shopping? Here is our list!']],
      nanny: [null, ['Let us say hello to Nanny and Grandad!']],
      clothes: [null, ['Let us find some new clothes!', 'Ooh, look at all the clothes!']],
      pets: [null, ['Look at all the pets!', 'Which pet do you like best?', 'Puppies! Kittens! Fish!']],
    }[id];
    if (!lines) return;
    if (lines[0]) say(W, lines[0], lines[1]); else { if (W.out && W.out.comp) compLine(W, lines[1]); else say(W, me, pick(lines[1])); }
    if (id !== 'home') { c.action = { kind: 'cheer', t0: W.T, dur: 1.2 }; }
    if (id === 'park' && W.asks.ducks.state === 'active' && W.items.some(i => i.kind === 'bread' && i.loc.s === 'pack')) later(W, 3, () => say(W, me, 'Let us feed the ducks! They are by the pond.'));
    if (id === 'nanny') { later(W, 2.2, () => { const n = W.people.nanny; if (n) { say(W, 'nanny', `Hello, ${NAMES[me]}! Come in, come in!`); n.action = { kind: 'wave', t0: W.T, dur: 1.6 }; } }); later(W, 5, () => { if (W.people.grandad && W.people.grandad.room === W.room) say(W, 'grandad', 'Is that my Callie?'); }); }
    if (id === 'shop' && (!W.shop || W.shop.done)) { W.shop = { list: newList(), got: [], basket: [] }; later(W, 2.5, () => speak('We need ' + W.shop.list.map(g => GROC[g][0]).join(', ') + '.', 'narrator')); }
  }

  /* ----- things to do in town ----- */
  const swingPos = a => [2.0, 1.6 + Math.sin(a) * 1.95, 2.7 - Math.cos(a) * 1.95];
  function startRide(kind, from, extra = {}) {
    c.mode = 'hop'; c.hop = { from: [c.x, c.y, c.z], to: from, t0: W.T, dur: 0.45, end: 'stand' }; SFX.boing();
    c.queue = () => { c.mode = 'ride'; c.ride = { kind, t0: W.T, ...extra }; [c.x, c.y, c.z] = from; c.facing = 'front'; c.flip = kind === 'swing'; };
  }
  function endRide(then) {
    const r = c.ride; if (!r) return;
    const off = { swing: [2.0, 2.55, 0], mgr: [2.8, 6.45, 0], sand: [8.9, 5.55, 0] }[r.kind] || [c.x, c.y + 0.5, 0];
    c.ride = null; if (r.kind === 'swing') window.__parkSwing = null;
    c.mode = 'hop'; c.hop = { from: [c.x, c.y, c.z], to: off, t0: W.T, dur: 0.45, end: 'stand' }; c.queue = then || null; SFX.boing();
  }
  function stepRide() {
    const r = c.ride; if (!r || c.mode !== 'ride') return;
    const t = W.T - r.t0;
    if (r.kind === 'swing') { const a = Math.sin(t * 2.2) * Math.min(0.62, 0.12 + t * 0.1); window.__parkSwing = a; [c.x, c.y, c.z] = swingPos(a); c.y += 0.05; if (t > 2 && !r.said) { r.said = true; say(W, me, 'Wheee! Higher!'); } }
    if (r.kind === 'mgr') { const a = ((window.__sceneT || 0) * 45 + 210) * Math.PI / 180; c.x = 2.8 + Math.cos(a) * 0.72; c.y = 5.0 + Math.sin(a) * 0.72; c.z = 0.32; c.flip = Math.sin(a) < 0; if (t > 9) endRide(() => say(W, me, 'I am dizzy!')); }
    if (r.kind === 'sand' && t > 1 && !r.said) { r.said = true; say(W, me, 'Dig, dig, dig!'); }
    if (r.kind === 'zip') {
      const u = clamp(t / 3.0, 0, 1), k = 0.08 + (0.3 * u + 0.7 * u * u) * 0.82, cz = ZIP.za + (ZIP.zb - ZIP.za) * k;
      c.x = ZIP.x0 + (ZIP.x1 - ZIP.x0) * k; c.y = ZIP.y + 0.05; c.z = cz + zipHands(c.id)[1] / 88 - 0.28; r.cz = cz;
      if (t > 0 && !r.said) { r.said = true; say(W, me, 'Wheeeee!'); SFX.whoosh(); }
      if (u >= 1) { c.ride = null; c.mode = 'hop'; c.hop = { from: [c.x, c.y, c.z], to: [...nav('park').nearestFree(15.0, 2.5), 0], t0: W.T, dur: 0.5, end: 'stand' }; SFX.boing(); c.queue = () => { window.__parkZip = null; c.action = { kind: 'cheer', t0: W.T, dur: 1.2 }; say(W, me, 'Again! Again!'); later(W, 1.5, () => achieve(W, 'zip')); }; }
    }
  }
  function rideSwing() {
    if (W.room !== 'park') return;
    walkTo(W, c, 2.0, 2.55, () => { startRide('swing', swingPos(0)); wordFx('swing', P(2.0, 1.6, 2.4));
      const o = W.out, m = o && o.comp && W.people[o.comp];
      if (m && m.room === 'park') { walkTo(W, m, ...nav('park').nearestFree(2.0, 0.95), () => { m.facing = 'front'; m.action = { kind: 'catch', t0: W.T, dur: 30 }; }); later(W, 3, () => compLine(W, ['Here we go!', 'Hold on tight!'])); } });
  }
  function doSlide() {
    walkTo(W, c, ...nav('park').nearestFree(6.28, 3.4), () => {
      wordFx('slide', P(7.1, 3.5, 2.4));
      const up = [[6.28, 3.0, 0.55], [6.28, 2.78, 1.8], [7.0, 2.3, 1.8], [7.1, 2.7, 1.85]];
      const down = []; for (let k = 1; k <= 8; k++) { const u = k / 8, kk = Math.min(1, u * 1.15); down.push([7.1, 2.7 + (5.0 - 2.7) * kk, 1.85 + (0.3 - 1.85) * Math.min(1, kk * 1.1) + 0.05]); }
      down.push([7.1, 5.7, 0]);
      scripted(c, up, () => { c.rideSit = true; say(W, me, 'Wheee!'); SFX.whoosh(); scripted(c, down, () => { c.rideSit = false; c.mode = 'stand'; c.z = 0; c.action = { kind: 'cheer', t0: W.T, dur: 1 }; later(W, 1.2, () => achieve(W, 'slide')); }); });
    });
  }
  const ZIP = { x0: 11.0, x1: 15.6, y: 1.3, za: 3.3, zb: 2.2 };
  // where the hands are when holding the zip line bar (arms up at 155 degrees, sitting)
  const zipHands = id => { const B = BODY[id], arm = B.T * 0.92 + 4, sy = -B.T - 5; return [B.sw / 2 - 4 + 0.42 * arm, sy - 0.906 * arm]; };
  function rideZip() {
    if (W.room !== 'park' || c.ride || c.mode !== 'stand' && c.mode !== 'walk') return;
    walkTo(W, c, ...nav('park').nearestFree(11.9, 2.3), () => {
      wordFx('zip line', P(12.2, 1.3, 3.6));
      window.__parkZip = 1;
      scripted(c, [[11.75, 1.95, 0], [11.6, 1.7, 0.8], [11.4, 1.4, 1.5], [11.2, 1.3, 1.55]], () => {
        c.mode = 'ride'; c.ride = { kind: 'zip', t0: W.T + 0.6 }; c.facing = 'front'; c.flip = false; say(W, me, 'Ready, steady...');
      });
      const o = W.out, m = o && o.comp && W.people[o.comp];
      if (m && m.room === 'park') walkTo(W, m, ...nav('park').nearestFree(13.4, 2.6), () => { m.facing = 'front'; later(W, 2, () => compLine(W, ['Hold on tight!', 'Wow, look at you go!'])); });
    });
  }
  function feedDucks() {
    const bread = inPack().find(i => i.kind === 'bread');
    if (bread) {
      walkTo(W, c, ...nav('park').nearestFree(12.4, 7.35), () => {
        c.facing = 'back'; c.action = { kind: 'catch', t0: W.T, dur: 0.8 }; say(W, me, 'Here you go, ducks!');
        [[13.58, 6.47], [11.8, 5.57], [14.37, 5.47], [12.6, 6.6], [13.9, 5.0], [12.2, 6.1]].forEach(([x, y], i) => later(W, 0.4 + i * 0.45, () => { SFX.quack(); burst(W, 'splash', [x, y, 0.05]); burst(W, 'word', P(x, y, 0.6), { text: String(i + 1), life: 1.1 }); speak(String(i + 1), 'word'); }));
        later(W, 3.4, () => { c.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; say(W, me, 'Six ducks! They love the bread!'); compLine(W, 'Well done! Happy ducks!'); });
        later(W, 0.8, () => { if (W.asks.ducks.state === 'active') ducksFed(W); else { W.items = W.items.filter(i => i !== bread); W.dirty = true; later(W, 3, () => achieve(W, 'ducks')); } });
      });
      return;
    }
    if (W.asks.ducks.state === 'active') later(W, 2.6, () => say(W, me, 'I need some bread for the ducks!'));
    walkTo(W, c, ...nav('park').nearestFree(12.4, 7.35), () => {
      c.facing = 'back'; c.action = { kind: 'catch', t0: W.T, dur: 0.8 }; SFX.quack(); later(W, 0.5, () => SFX.quack());
      [[13.58, 6.47], [11.8, 5.57], [14.37, 5.47]].forEach(([x, y], i) => later(W, 0.3 + i * 0.5, () => { burst(W, 'splash', [x, y, 0.05]); speak(['one duck', 'two ducks', 'three ducks'][i], 'word'); }));
      later(W, 2.0, () => say(W, me, 'Quack quack! Three ducks!'));
    });
  }
  function npcSay(key, text, at, voice) { W.bubbles = W.bubbles.filter(b => b.anchor.type !== 'world'); say(W, voice, text, { type: 'world', room: W.room, at }); }
  function npcTap(key) {
    const li = liveLayers(W.room, W.T).items.find(i => i.key === key); if (!li || !li.at) return;
    const s = (li.props && li.props.s) || 1, look = (li.props && li.props.look) || {}, kid = s < 0.9;
    const voice = kid ? 'kid' : look.beard || look.style === 'bald' || look.style === 'short' || look.style === 'cap' ? 'man' : 'lady';
    const lines = {
      park: kid ? ['Hi!', 'Want to play?', 'Wheee!', 'Tag! You are it!', 'I like the slide!'] : ['Hello!', 'Lovely day!', 'Hi there!', 'Have fun!'],
      cafe: li.at[1] < 1.3 ? ['What would you like?', 'Order at the till!', 'Hello!'] : kid ? ['Hi!', 'I like cake!', 'Yum!'] : ['Hello!', 'Yum!', 'Lovely!'],
      shop: kid ? ['Hi!', 'I want sweets!', 'Look at the toys!'] : ['Hello!', 'Can I help?', 'Hi there!'],
      nannydown: ['Hello, my darling!', 'Give Nanny a cuddle!', 'Would you like a biscuit?', 'Have you been a good girl?'],
      clothes: kid ? ['Hi!', 'I like your top!', 'Look at my new shoes!'] : ['Hello! Lovely to see you!', 'Try it on in the fitting room!', 'That looks great on you!', 'Can I help you?'],
      pets: kid ? ['I love the puppies!', 'Look at the fish!', 'I want a kitten!'] : ['Hello! Would you like a pet?', 'All our pets need a good home.', 'Tap a pet to meet them!'],
      school: kid ? ['Hi Callie!', 'Play with me!', 'I like school!', 'Look at my picture!'] : ['Good morning!', 'Hello, Callie!', 'Well done!'],
    }[W.room] || (ROOMS[W.room] && ROOMS[W.room].shop && W.town.shops[ROOMS[W.room].shop] ? keeperLines(W.town.shops[ROOMS[W.room].shop]) : ['Hello!']);
    const line = pick(lines);
    npcSay(key, line, [li.at[0], li.at[1], (li.at[2] || 0) + (kid ? 1.75 : 2.4)], voice);
    if (line.includes('biscuit')) later(W, 1.8, () => giveFood('biscuit', {}, P(li.at[0], li.at[1], 1.6)));
    burst(W, 'hearts', P(li.at[0], li.at[1], (li.at[2] || 0) + (kid ? 1.4 : 2.0)));
  }
  function hopscotch() {
    const sq = [[23.89, 10.39, '1'], [23.89, 11.19, '2'], [23.89, 11.99, '3, 4'], [23.89, 12.79, '5'], [23.89, 13.59, '6, 7'], [23.89, 14.39, '8']];
    walkTo(W, c, 23.89, 9.65, () => {
      say(W, me, 'Hopscotch!');
      const hopTo = i => {
        if (i >= sq.length) { c.action = { kind: 'cheer', t0: W.T, dur: 1.4 }; SFX.fanfare(); say(W, me, 'I did it!'); burst(W, 'confetti', P(c.x, c.y, 1.4)); later(W, 1.5, () => achieve(W, 'hopscotch')); return; }
        c.mode = 'hop'; c.hop = { from: [c.x, c.y, 0], to: [sq[i][0], sq[i][1], 0], t0: W.T, dur: 0.42, end: 'stand' };
        c.queue = () => { speak(sq[i][2], 'word'); burst(W, 'word', P(c.x, c.y, 1.7), { text: sq[i][2], life: 1 }); SFX.pop(); later(W, 0.35, () => hopTo(i + 1)); };
      };
      hopTo(0);
    });
  }
  function giveFood(kind, extra, fromAt, line) {
    const it = { id: kind + Math.round(W.T * 1000) + Math.floor(Math.random() * 99), kind, room: W.room, loc: { s: 'floor', x: c.x, y: c.y }, rot: 0, ...extra };
    W.items.push(it); if (!toPack(it, fromAt)) W.items = W.items.filter(x => x !== it);
  }
  function cafeOrder(tray) {
    const kidMe = !['mum', 'dad', 'connor'].includes(me);
    const at = [2.3, 1.05, 2.45];
    let order = tray;
    if (kidMe && tray.includes('coffee')) { order = tray.map(k => (k === 'coffee' ? 'hotchoc' : k)); npcSay('barista', 'Coffee is for grown-ups! Here is a hot chocolate.', at, 'man'); }
    else npcSay('barista', 'Coming up!', at, 'man');
    SFX.coins(); setPanel(null);
    W.cafe = { order, ready: false };
    later(W, 4, () => { if (W.cafe && W.room === 'cafe') { W.cafe.ready = true; npcSay('barista', `${NAMES[me]}! Your order is ready!`, [3.3, 0.95, 2.45], 'lady'); SFX.ding(); } });
  }
  function cafeCollect() {
    if (!W.cafe) { say(W, me, 'I need to order first.'); return; }
    if (!W.cafe.ready) { say(W, me, 'Not ready yet!'); return; }
    walkTo(W, c, ...nav('cafe').nearestFree(6.6, 2.45), () => { c.facing = 'back'; const o = W.cafe.order; W.cafe = null; o.forEach((k, i) => later(W, i * 0.35, () => giveFood(k, {}, P(6.5, 1.6, 1.2)))); later(W, 0.4, () => say(W, me, 'Thank you!')); later(W, 2.2, () => achieve(W, 'cafe')); });
  }
  function shopTake(id) {
    const sh = W.shop; if (!sh) return;
    sh.basket.push(id); speak(GROC[id][0], 'word'); SFX.pop();
    if (sh.list.includes(id) && !sh.got.includes(id)) {
      sh.got.push(id); SFX.sparkle(); showToast(`Got the ${GROC[id][0]}!`);
      if (sh.got.length === sh.list.length) later(W, 0.8, () => compLine(W, 'That is everything! Now to the till.'));
    }
    setFrame(f => f + 1);
  }
  function shopCheckout(key, item) {
    const sh = W.shop; if (!sh || !sh.basket.length) { say(W, me, 'Our basket is empty!'); return; }
    const s = item && item.sort; const x = s ? (s[0] + s[1]) / 2 : c.x;
    walkTo(W, c, ...nav('shop').nearestFree(x + 0.3, 10.55), () => {
      c.facing = 'back'; const t0 = W.T + 0.3;
      sh.basket.forEach((id, i) => later(W, 0.3 + i * 0.7, () => { SFX.beep(); speak(GROC[id][0], 'word'); }));
      setPanel({ kind: 'till', t0 });
    });
  }
  function shopPay() {
    const sh = W.shop; SFX.coins(); setPanel(null);
    giveFood('shopping', { things: sh.basket.slice(0, 12) }, P(c.x, c.y, 1.2));
    const missing = sh.list.filter(id => !sh.got.includes(id));
    later(W, 1.0, () => compLine(W, missing.length ? `Oh! We forgot the ${GROC[missing[0]][0]}!` : 'Well done! We got everything!'));
    if (!missing.length) later(W, 3, () => { if (!achieve(W, 'shop')) earn(W, 5); });
    W.shop = { list: newList(), got: [], basket: [], done: true };
  }
  function sitSchoolChair(key, item) {
    const p0 = item.props || {}; const sx = p0.x + 0.18, sy = p0.y + 0.18, faceFront = p0.back !== 's';
    const taken = liveLayers(W.room, W.T).items.some(i => i.kind === 'person' && i.at && Math.hypot(i.at[0] - sx, i.at[1] - sy) < 0.3);
    if (taken) { say(W, me, 'Someone is sitting there!'); return; }
    sitOn(W, c, { stand: nav('school').nearestFree(sx - 0.45, sy), seat: [sx, sy, 0.36], face: faceFront ? 'front' : 'back', flip: faceFront });
    wordFx('chair', P(sx, sy, 1.2));
  }
  function townTap(key, item, pt, top) {
    const R = W.room, base = key.split('#')[0];
    if (R === 'park') {
      if (base === 'Swing' || base === 'SwingFrame') { rideSwing(); return true; }
      if (key === 'Slide' || key === 'TowerFront' || key === 'TowerBack') { doSlide(); return true; }
      if (base === 'ZipLine') { rideZip(); return true; }
      if (key === 'MerryGoRound') { walkTo(W, c, ...nav('park').nearestFree(2.8, 6.4), () => { startRide('mgr', [2.8, 5.72, 0.32]); wordFx('roundabout', top); }); return true; }
      if (key === 'Sandpit') { walkTo(W, c, ...nav('park').nearestFree(8.9, 5.55), () => { startRide('sand', [8.95, 4.75, 0.28]); wordFx('sand', top); }); return true; }
      if (base === 'Duck' || key === 'Reeds') { feedDucks(); return true; }
      if (key === 'VanBack' || key === 'VanFront' || key === 'host:g') { walkTo(W, c, ...nav('park').nearestFree(2.1, 11.0), () => { c.facing = 'back'; wordFx('ice cream', top); npcSay('ices', 'What flavour would you like?', [2.3, 10.5, 2.9], 'lady'); setPanel({ kind: 'icecream' }); }); return true; }
    }
    if (R === 'clothes') {
      const CAT = { Cubbies: 'tops', Rail: 'tops', 'Rail#2': 'dresses', 'Rail#3': 'bottoms', 'Rail#4': 'tops', ShoeWall: 'shoes', CapsTable: 'hats', Till: 'tops', Box: 'dresses', Mannequin: 'dresses', 'Mannequin#2': 'dresses', MirrorLogo: 'glasses' };
      const s = item && item.sort, at = s ? [(s[0] + s[1]) / 2, Math.min(10.4, s[3] + 0.55)] : [c.x, c.y];
      if (base === 'FittingRooms') { walkTo(W, c, ...nav('clothes').nearestFree(2.0, 3.6), () => { wordFx('fitting room', top); setDressWho(me); setPanel({ kind: 'dress' }); }); return true; }
      if (CAT[key]) { walkTo(W, c, ...nav('clothes').nearestFree(at[0], at[1]), () => { c.facing = 'back'; c.flip = false; wordFx(TOWN_WORDS[base] || 'clothes', top); openShop(CAT[key]); }); return true; }
    }
    if (ROOMS[R] && ROOMS[R].shop) {
      const sh = W.town.shops[ROOMS[R].shop];
      if (sh && ['Counter', 'Display', 'Display2', 'Table'].includes(key)) {
        wordFx(key === 'Counter' ? 'till' : SHOP_TYPES[sh.type].type.toLowerCase(), top);
        walkTo(W, c, ...nav(R).nearestFree(2.7, 5.6), () => { c.facing = 'back'; c.flip = false; setPackOpen(false); openTownShop(sh); });
        return true;
      }
    }
    if (R === 'pets') {
      const CAT = { Pen: 'dogs', CatTree: 'cats', Hutches: 'small', Aquarium: 'fish', BirdCages: 'birds', Till: 'mine' };
      const s = item && item.sort, at = s ? [(s[0] + s[1]) / 2, Math.min(10.4, s[3] + 0.6)] : [c.x, c.y];
      if (key === 'Shelves') { walkTo(W, c, ...nav('pets').nearestFree(12.5, 1.1), () => { c.facing = 'back'; say(W, me, 'Pet food and toys!'); }); wordFx('pet food', top); return true; }
      if (CAT[key]) { wordFx(TOWN_WORDS[key] || 'pets', top); walkTo(W, c, ...nav('pets').nearestFree(at[0], at[1]), () => { c.facing = 'back'; c.flip = false; setPackOpen(false); setPmenu(null); setPanel({ kind: 'petshop', cat: CAT[key] }); speak(CAT[key] === 'mine' ? 'Your pets!' : 'Which one would you like?', 'narrator'); }); return true; }
    }
    if (R === 'cafe') {
      if (key === 'Till' || key === 'ServingCounter' || key === 'CakeDisplay') { if (W.cafe && W.cafe.ready) { cafeCollect(); return true; } walkTo(W, c, ...nav('cafe').nearestFree(2.15, 2.3), () => { c.facing = 'back'; c.flip = false; setPanel({ kind: 'cafe' }); speak('What would you like?', 'narrator'); }); return true; }
      if (key === 'CollectPoint') { cafeCollect(); return true; }
      if (key === 'MenuBoards') { say(W, me, 'Hot chocolate, juice, cake, croissant!'); return true; }
    }
    if (R === 'nannydown') {
      if (key === 'GrandfatherClock') { walkNear(key, item, () => { SFX.bell(); say(W, me, 'Tick tock! Bong!'); }); wordFx('clock', top); return true; }
      if (key === 'PhoneTable') { walkNear(key, item, () => { SFX.ding(); later(W, 0.4, () => SFX.ding()); say(W, me, 'Hello? It is Callie!'); }); wordFx('phone', top); return true; }
      if (key === 'Caddies') { walkNear(key, item, () => say(W, me, 'Tea, coffee, sugar!')); return true; }
      if (key === 'Bookshelf') { walkNear(key, item, () => readBook(pick(Object.keys(STORIES)), null)); wordFx('books', top); return true; }
      if (key === 'LeatherSofa') { if (W.people.grandad && W.people.grandad.room === R) say(W, 'grandad', pick(['Come and sit with Grandad!', 'Mind my newspaper!'])); walkNear(key, item); return true; }
      if (key === 'Cooker' || key === 'Fridge') { walkNear(key, item, () => wiggle(W, key)); wordFx(key === 'Fridge' ? 'fridge' : 'cooker', top); later(W, 0.8, () => { const n = W.people.nanny; if (n && n.room === R) say(W, 'nanny', key === 'Fridge' ? 'Are you hungry? Have a biscuit!' : 'Careful, it is hot!'); }); if (key === 'Fridge') later(W, 2.2, () => giveFood('biscuit', {}, P(6.8, 0.8, 1.4))); return true; }
    }
    if (R === 'nannyup') {
      if (key === 'Bath') { walkNear(key, item, () => { SFX.splash(); SFX.quack(); burst(W, 'splash', [14.6, 0.6, 0.8]); say(W, me, 'Quack! A duck in the bath!'); }); wordFx('bath', top); return true; }
      if (key === 'DollsHouse') { walkNear(key, item, () => { burst(W, 'spark', top, { n: 12, spread: 90 }); say(W, me, 'A dolls house! So pretty!'); }); return true; }
      if (key.startsWith('Teddy')) { walkNear(key, item, () => burst(W, 'hearts', top)); wordFx('teddy', top); return true; }
    }
    if (R === 'nannygarden') {
      if (key === 'Fountain') { walkTo(W, c, ...nav('nannygarden').nearestFree(9.2, 5.4), () => { c.facing = 'back'; SFX.water(2); [[8.8, 3.6], [9.6, 4.1], [9.2, 3.5]].forEach(([x, y], i) => later(W, i * 0.3, () => burst(W, 'splash', [x, y, 0.6]))); later(W, 0.8, () => { burst(W, 'spark', P(9.2, 3.9, 1.8), { n: 14, spread: 100 }); say(W, me, 'I made a wish!'); }); }); wordFx('fountain', top); return true; }
      if (base === 'Pot' && item && item.props) { const w = { flowers: 'flowers', lavender: 'lavender', cactus: 'cactus', fern: 'fern', bush: 'bush', topiary: 'tree', grass: 'grass', spiky: 'plant' }[item.props.kind] || 'plant'; walkNear(key, item, () => wiggle(W, key)); wordFx(w, top); return true; }
    }
    if (R === 'shop') {
      if (SECTIONS[key]) { const S = SECTIONS[key]; walkTo(W, c, ...nav('shop').nearestFree(...S.stand), () => { wordFx(S.name.split(' ')[0].toLowerCase(), top); setPanel({ kind: 'shelf', section: key }); }); return true; }
      if (base === 'Till' || base === 'SelfCheckout' || base === 'TillShopping') { shopCheckout(key, item); return true; }
    }
    if (R === 'school') {
      if (base === 'SmallChair' && item) { sitSchoolChair(key, item); return true; }
      if (base === 'Whiteboard') { walkNear(key, item, () => say(W, me, base === 'Whiteboard' && key === 'Whiteboard' ? '2 + 3 = 5. A a, B b, C c!' : '2 + 3 = 5!')); return true; }
      if (key === 'Frieze') { say(W, me, 'A B C D E F G H I J K L M N!'); return true; }
      if (key === 'ReadingCorner' || base === 'Bookcase' || base === 'Beanbag') { walkNear(key, item, () => readBook(pick(Object.keys(STORIES)), null)); wordFx('books', top); return true; }
      if (key === 'CoatPegs') { say(W, me, me === 'callie' ? 'This is my peg!' : 'Callie has a peg here!'); wordFx('peg', top); return true; }
      if (key === 'ServingCounter') { walkTo(W, c, ...nav('school').nearestFree(14.0, 10.98), () => { c.facing = 'back'; npcSay('lunch', 'What would you like for lunch?', [13.0, 9.75, 2.4], 'lady'); setPanel({ kind: 'lunch' }); }); return true; }
    }
    const word = TOWN_WORDS[base]; if (word) { walkNear(key, item, () => wiggle(W, key)); wordFx(word, top); return true; }
    return false;
  }

  /* ----- reading and switching who you play ----- */
  function readBook(storyId, it) {
    c.mode = 'sit'; c.z = 0; c.seatStand = [c.x, c.y]; c.facing = 'front'; c.reading = STORIES[storyId].cover; c.path = null;
    setSel(null); setPackOpen(false); setPanel({ kind: 'book', story: storyId, itemId: it ? it.id : null });
  }
  function toggleUniform(who) {
    const on = !W.uniform[who]; W.uniform[who] = on; W.dirty = true; SFX.sparkle(); speak(on ? 'uniform' : 'my clothes', 'word');
    const p = W.people[who]; if (p.room === W.room && p.mode === 'stand') p.action = { kind: 'twirl', t0: W.T, dur: 0.7 };
    if (on && W.asks.school.state === 'active' && who === W.player) later(W, 0.8, () => { say(W, who, 'Ready for school!'); later(W, 2.2, () => speak('Now go to the front door.', 'narrator')); });
    setFrame(f => f + 1);
  }
  function openShop(cat) { setSel(null); setPackOpen(false); setPmenu(null); setPanel({ kind: 'clothes', cat }); speak('What would you like?', 'narrator'); }
  function shopBuy(who, it) {
    if (W.coins < it.price) return;
    W.coins -= it.price; W.wardrobe[who] = [...(W.wardrobe[who] || []), it.id]; W.dirty = true;
    SFX.coins(); later(W, 0.3, () => SFX.sparkle());
    shopWear(who, it, true);
    showToast(`New ${it.word}!`);
    const n = Object.values(W.wardrobe).reduce((a, l) => a + l.length, 0);
    later(W, 1.6, () => achieve(W, 'clothes')); if (n >= 10) later(W, 5, () => achieve(W, 'fashion'));
  }
  function shopWear(who, it, quiet) {
    if (W.uniform[who]) W.uniform[who] = false;
    setOutfits(o => ({ ...o, [who]: wearItem(o[who], who, it) }));
    const p = W.people[who]; if (p.room === W.room && p.mode === 'stand') { p.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; later(W, 0.5, () => say(W, who, pick(quiet ? ['I love it!', 'Thank you!', 'So cool!'] : ['Looking good!', 'Ta-da!']))); }
    W.dirty = true;
  }
  function openJobs(tab) { setSel(null); setPackOpen(false); setPmenu(null); setPanel({ kind: 'jobs', tab }); SFX.pop(); speak(tab === 'stickers' ? 'Stickers' : 'Jobs', 'word'); }
  function closeBook() { achieve(W, 'book'); c.reading = null; if (c.mode === 'sit' && c.z === 0) { c.mode = 'stand'; c.seatStand = null; } setPanel(null); }
  // is this person here with you (same house or place)?
  function samePlace(q) {
    const room = q && (q.room || (q.goal && q.goal.room));
    if (!room) return false;
    if (W.out) return (W.out.party || []).includes(q.id) || placeOfRoom(room) === W.out.place || q.id === W.player;
    return !!ROOMS[room] && !placeOfRoom(room) && !ROOMS[room].town;
  }
  function rowIds() {
    const ids = [...familyOf(W, W.player)];
    if (W.out) for (const k of W.out.party || []) ids.push(k);
    for (const d of Object.values(W.folk.people)) { const q = W.people[d.id]; if (q && samePlace(q)) ids.push(d.id); }
    if (!ids.includes(W.player)) ids.push(W.player);
    return [...new Set(ids)].filter(k => W.people[k] && NAMES[k]);
  }
  function makeFirst(d) {
    const def = createPerson(W, d, 'new'); if (!def) return;
    W.owner = def.id; W.player = def.id; W.prevPlayer = def.id;
    W.worldName = `${def.name}'s world`; nameWorld(currentWorld(), W.worldName, [def.hairCol, def.color, def.skin]);
    setOutfits(o => ({ ...o, [def.id]: def.outfit }));
    arriveAt(W, 'h:' + def.fam, []); petHouse(W);
    W.dirty = true; saveNow(); SFX.fanfare(); setFrame(n => n + 1);
    later(W, 0.8, () => { speak(`Welcome to ${def.name}'s world! This is your house.`, 'narrator'); const q = W.people[def.id]; if (q) q.action = { kind: 'wave', t0: W.T, dur: 1.6 }; });
    later(W, 5, () => speak('Tap Families to make your family and friends.', 'narrator'));
  }
  function makePerson(d, home) {
    const def = createPerson(W, d, home);
    if (!def) { showToast('New Street is full!'); return; }
    setOutfits(o => ({ ...o, [def.id]: def.outfit }));
    SFX.fanfare(); showToast(`Welcome, ${def.name}!`); later(W, 2, () => achieve(W, 'maker'));
    const place = home === 'home' ? 'home' : 'h:' + def.fam, here = W.out ? W.out.place : 'home';
    if (home === 'new') {
      // she chooses where the new house goes on the map
      setPanel({ kind: 'map', here, picked: null, tb: { moving: { loc: place, name: `${def.name}'s house` }, then: place } });
      later(W, 0.8, () => speak(`Where shall ${def.name}'s house go? Tap a space on the map.`, 'narrator'));
      return;
    }
    if (place === here) { setPanel(null); later(W, 0.8, () => { const q = W.people[def.id]; if (q && q.room === W.room) { say(W, def.id, `Hello! I am ${def.name}!`); q.action = { kind: 'wave', t0: W.T, dur: 1.6 }; } else say(W, def.id, `Hello! I am ${def.name}!`, { type: 'off', id: def.id }); }); return; }
    setPanel({ kind: 'map', here, picked: place }); later(W, 0.6, () => goPlace(place));
  }
  function savePerson(id, d, home) {
    const r = editPerson(W, id, d, home); if (!r) return;
    setOutfits(o => ({ ...o, [id]: { ...(o[id] || r.def.outfit), top: d.top, color: d.color } }));
    const q = W.people[id], busy = id === W.player || (W.out && (W.out.party || []).includes(id));
    if (r.moved && q && !busy) placeAtHome(W, id);
    setPanel(null); SFX.sparkle(); showToast(`Hello, ${r.def.name}!`);
    if (q && q.room === W.room && q.mode === 'stand') { q.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; later(W, 0.6, () => say(W, id, pick(['I love it!', 'Do you like my new look?', 'Ta-da!']))); }
  }
  function switchTo(id, fromDoor) {
    const p = W.people[id], old = W.player;
    if (p && !p.room && p.goal && id !== 'connor' && !W.bedtime) { say(W, old, `${NAMES[id]} is coming!`); return; }
    if (id === old || (!inHouse(p) && id !== 'connor') || W.bedtime) return;
    if (!samePlace(p) && id !== 'connor') { say(W, old, isFolk(id) ? `${NAMES[id]} is at their house.` : `${NAMES[id]} is at home.`); return; }
    W.people[old].reading = null; setPanel(null); setSel(null);
    if (!W.out) claimPlayer(W, id); else {
      p.goal = null; p.path = null; p.then = null; if (p.mode === 'walk') p.mode = 'stand'; p.busy = null;
      const resident = q => { const d = folkDef(W, q); return d && 'h:' + d.fam === W.out.place; };
      W.out.party = (W.out.party || []).filter(k => k !== id);
      if (!resident(old)) { W.out.party.push(old); W.people[old].busy = 'out'; }
      W.out.comp = W.out.party[0] || null;
    }
    W.prevPlayer = old; W.player = id;
    if (!fromDoor && !W.out) releaseNpc(W, old);
    if (p.room !== W.room) { W.fade = { t0: W.T }; later(W, 0.28, () => { W.room = p.room; W.fx = []; }); }
    later(W, 0.35, () => { if (p.mode === 'stand') p.action = { kind: 'wave', t0: W.T, dur: 1.2 }; say(W, id, pick(['It is me!', 'My turn!', `I am ${NAMES[id]}!`])); });
    setDressWho(id); W.dirty = true; SFX.sparkle();
  }

  /* ----- taps ----- */
  function walkNear(key, item, then) {
    const s = item && (item.sort || item.block);
    if (s) { const t = nav(W.room).nearestFree((s[0] + s[1]) / 2, s[3] + 0.35); walkTo(W, c, t[0], t[1], then); }
    else then && then();
  }
  function objTop(item, pt) { const s = item && (item.sort || item.block); return s ? P((s[0] + s[1]) / 2, (s[2] + s[3]) / 2, 1.4) : [pt[0], pt[1] - 40]; }
  function doorAction(door) {
    if (W.fade) return;
    if (door.special === 'chloe') {
      walkTo(W, c, door.at[0] + 0.2, door.at[1], () => {
        const ch = W.people.chloe;
        if (ch.room === 'chloe' && me !== 'chloe' && !(W.chloeInvite > W.T)) {
          SFX.creak(); W.chloeDoor = { t0: W.T, mode: 'peek' };
          later(W, 0.7, () => say(W, 'chloe', 'You are not allowed in!', { type: 'world', room: 'hallway', at: [0, 1.1, 2.6] }, { style: 'shout' }));
          later(W, 2.5, () => { SFX.slam(); W.shake = 1.2; });
          later(W, 3.1, () => { say(W, me, me === 'callie' ? 'Hmph!' : 'Ok, ok!'); W.chloeDoor = null; });
        } else { SFX.creak(); W.chloeDoor = { t0: W.T, mode: 'open' }; later(W, 0.3, () => goThrough(W, { ...door, special: null })); later(W, 1.5, () => { W.chloeDoor = null; }); }
      });
      return;
    }
    if (door.special === 'connor' && me === 'connor') {
      walkTo(W, c, door.at[0], door.at[1], () => {
        W.connorDoor = { t0: W.T, mode: 'open' }; SFX.door(); say(W, 'connor', 'Back to my game!');
        later(W, 0.6, () => { c.room = 'connorRoom'; W.nextCeiling = W.T + 6; switchTo(W.prevPlayer && W.prevPlayer !== 'connor' ? W.prevPlayer : 'callie', true); });
        later(W, 1.4, () => { W.connorDoor = null; });
      });
      return;
    }
    if (door.special === 'connor' && W.people.connor.room !== 'connorRoom') { walkTo(W, c, door.at[0], door.at[1] + 0.15, () => say(W, me, 'Connor is not in there.')); return; }
    if (door.special === 'connor') {
      walkTo(W, c, door.at[0], door.at[1] + 0.15, () => {
        c.facing = 'back'; c.action = { kind: 'knock', t0: W.T, dur: 0.7 }; SFX.knock();
        const ctl = inPack().find(i => i.kind === 'controller');
        const sw = inPack().find(i => i.kind === 'sandwich');
        if (ctl) {
          later(W, 1.0, () => { SFX.creak(); W.connorDoor = { t0: W.T, mode: 'peek', fillings: [] }; });
          later(W, 2.1, () => completeQuest(W, 'connor', ctl, Q => { say(W, 'connor', Q.thanks, { type: 'world', room: 'hallway', at: [1.3, 0, 2.6] }, { style: 'shout' }); burst(W, 'confetti', P(1.0, 0.3, 2.2)); showToast('Connor has his controller!'); }));
          later(W, 4.8, () => { SFX.door(); W.connorDoor = null; });
        } else if (sw) {
          later(W, 1.0, () => { SFX.creak(); W.connorDoor = { t0: W.T, mode: 'peek', fillings: sw.fillings }; });
          later(W, 2.1, () => { W.items = W.items.filter(x => x !== sw); W.dirty = true; });
          later(W, 2.4, () => say(W, 'connor', '...thanks.', { type: 'world', room: 'hallway', at: [1.3, 0, 2.6] })); later(W, 4.4, () => achieve(W, 'feed'));
          later(W, 4.6, () => { SFX.door(); W.connorDoor = null; });
        } else {
          later(W, 0.9, () => { W.connorDoor = { t0: W.T, mode: 'shout' }; SFX.thud(); say(W, 'connor', 'GO AWAY!', { type: 'world', room: 'hallway', at: [0.97, 0, 2.6] }, { style: 'shout' }); });
          later(W, 2.0, () => { W.connorDoor = null; });
        }
      });
      return;
    }
    if (door.special === 'front' || door.special === 'map') { walkTo(W, c, door.at[0], door.at[1], () => openMap()); return; }
    if (door.special === 'garage') { walkTo(W, c, door.at[0], door.at[1], () => { toggleGoal(W); wordFx('goal', P(4.0, 6.0, 1.4)); say(W, me, W.goal.up ? 'Football!' : 'All done.'); }); return; }
    if (door.special === 'locked') { walkTo(W, c, door.at[0], door.at[1], () => say(W, me, 'It is locked.')); return; }
    if (door.ladder) W.ladderT = W.T;
    goThrough(W, door);
  }

  function objTap(key, item, pt) {
    const R = W.room, T = W.T, f = W.flags;
    const word = WORDS[key];
    const top = objTop(item, pt);
    // doors by tapping the door itself
    const door = ROOMS[R].doors.find(d => d.hit && d.hit.includes(key));
    if (door) { doorAction(door); return; }
    errandTap(W, R, key, jobDone);
    // cupboards
    const boxId = containerFor(R, key);
    if (boxId) {
      const B = CONTAINERS[boxId];
      walkTo(W, c, ...nav(R).nearestFree(...B.at), () => { SFX.zip(); wiggle(W, key); wordFx(B.word, top); setPanel({ kind: 'box', id: boxId }); setPackOpen(false); });
      return;
    }
    let bedId = BEDS[R + ':' + key] ? R + ':' + key : (R === 'chloe' && (key === 'Duvet' || key === 'BedToys')) ? 'chloe:StorageBed' : null;
    if (bedId && BEDS[bedId + '~1'] && c.mode !== 'lie') { const busy = b => Object.values(W.people).some(p => p !== c && p.room === R && p.mode === 'lie' && p.bed === b); if (busy(bedId) && !busy(bedId + '~1')) bedId += '~1'; }
    if (bedId) {
      const other = Object.values(W.people).find(p => p !== c && p.room === R && p.mode === 'lie' && p.bed === bedId && bedId !== 'parents:DoubleBed');
      if (c.mode === 'lie') { hopOffBed(W, c); return; }
      if (other) { say(W, me, `${NAMES[other.id]} is in this bed!`); return; }
      wordFx('bed', top); hopOnBed(W, c, bedId); return;
    }
    if (R === 'living' && key === 'BookTower') { walkNear(key, item, () => readBook(pick(['pup', 'bus', 'dog', 'fish']), null)); wordFx('books', top); return; }
    const seatTaken = st => Object.values(W.people).find(q => q !== c && q.room === R && q.mode === 'sit' && dist([q.x, q.y], st.seat) < 0.45);
    const seatOpts = [key, key + '~1', key + '~2'].map(k => SEATS[R + ':' + k]).filter(Boolean);
    const seat = seatOpts.find(st => !seatTaken(st)) || seatOpts[0];
    if (seat) {
      const sitter = seatTaken(seat);
      if (sitter) { say(W, me, `${NAMES[sitter.id]} is sitting there!`); return; }
      wordFx(word || TOWN_WORDS[key.split('#')[0]], top); sitOn(W, c, seat); if (R === 'nannydown' && key === 'LeatherSofa') later(W, 2.5, () => { const g = W.people.grandad; if (g && g.room === R) say(W, 'grandad', g.mode === 'sit' ? 'Hello, sweetheart! Shall we watch TV?' : 'Comfy sofa, eh?'); }); return; }
    const hp = pieceAt(R, key);
    if (hp && hbTap(hp, key, item, top)) return;
    if (R === 'callie') {
      if (key === 'tv') { f.tv = !f.tv; SFX.tv(); wordFx('TV', P(0.45, 3.2, 2.6)); if (f.tv && c.mode !== 'lie') walkTo(W, c, 2.1, 3.3, () => { if (f.tv) { c.mode = 'sit'; c.facing = 'back'; c.flip = false; c.seatStand = [2.1, 3.3]; } }); return; }
      if (key === 'kitchen') { f.cooking = !f.cooking; if (f.cooking) { SFX.sizzle(); wordFx('cook', top); walkTo(W, c, 5.1, 1.3, () => { c.facing = 'back'; }); } else SFX.click(); return; }
      if (key === 'window') { f.blind = !f.blind; SFX.blind(); wordFx('window', P(2.5, 0, 3.0)); W.dirty = true; return; }
      if (key === 'switch') { f.lights = !f.lights; SFX.click(); wordFx(f.lights ? 'on' : 'off', P(1.0, 0, 2.6)); W.dirty = true; return; }
      if (key === 'wardrobe') { walkTo(W, c, 1.45, 4.5, () => { SFX.door(); setDressWho(me); setPanel({ kind: 'dress' }); }); wordFx('wardrobe', top); return; }
      if (key === 'gallery') { wordFx('art', P(0.01, 1.2, 3.2)); return; }
    }
    if (R === 'middle' && key === 'AmericanFridge') {
      walkTo(W, c, 6.3, 1.35, () => { c.facing = 'back'; c.flip = false; f.fridge = true; SFX.door(); wordFx('fridge', top); setFillings([]); setPanel({ kind: 'fridge' }); lunchTime(W); });
      return;
    }
    if (R === 'middle' && key === 'ArtEasel') { walkTo(W, c, 2.05, 0.75, () => { c.facing = 'back'; wordFx('paint', top); setPanel({ kind: 'paint' }); }); return; }
    if ((R === 'parents' && key === 'FittedWardrobes') || (R === 'chloe' && key === 'Wardrobe') || (R === 'attic' && key === 'DressUpRail')) {
      walkNear(key, item, () => { SFX.door(); wordFx(R === 'attic' ? 'dress up' : 'wardrobe', top); setDressWho(R === 'parents' ? (me === 'dad' || me === 'mum' ? me : 'mum') : R === 'chloe' ? 'chloe' : me); setPanel({ kind: 'dress' }); });
      return;
    }
    if (R === 'living') {
      if (key === 'TVUnit') { f.livingTV = !f.livingTV; SFX.tv(); wordFx('TV', top); if (!f.livingTV && W.people.dad.room === 'living' && W.people.dad.mode === 'sit') later(W, 0.4, () => say(W, 'dad', 'Hey! I was watching that!')); return; }
      if (key === 'Fireplace' || key === 'ChimneyBreast') { walkNear(key, item, () => { f.fire = !f.fire; if (f.fire) SFX.fire(); wordFx('fire', top); }); return; }
      if (key === 'RecordPlayer') { walkNear(key, item, () => { W.music = W.T; wordFx('music', top); if (W.dance) return; W.music = W.T + 7; startDance(W); }); return; }
    }
    if (R === 'kitchen') {
      if (key === 'HobWorktop' || key === 'CasserolePot' || key === 'Oven') { walkTo(W, c, 4.2, 1.25, () => { c.facing = 'back'; f.hob = !f.hob; if (f.hob) SFX.sizzle(); wordFx('hob', top); if (W.people.mum.room === 'kitchen') later(W, 0.5, () => say(W, 'mum', f.hob ? 'Careful, it is hot!' : 'Thank you!')); }); return; }
      if (key === 'Kettle') { walkTo(W, c, 1.1, 2.0, () => { W.kettle = W.T; SFX.kettle(); wordFx('kettle', top); }); return; }
      if (key === 'Microwave') { walkTo(W, c, 2.6, 2.0, () => { W.micro = W.T; later(W, 2.2, () => { SFX.ding(); burst(W, 'word', top, { text: 'Ding!', life: 1.4 }); }); wordFx('microwave', top); }); return; }
      if (key === 'WashingMachine') { walkTo(W, c, 1.95, 1.1, () => { W.washer = W.T; SFX.spin(); wordFx('washer', top); }); return; }
      if (key === 'SinkUnit' || key === 'SinkWorktop' || key === 'DishRack') { walkTo(W, c, 1.15, 1.1, () => { c.facing = 'back'; W.tap = W.T; SFX.water(); wordFx('sink', top); }); return; }
    }
    if (R === 'bathroom' || R === 'toilet') {
      if (key === 'Toilet') { walkNear(key, item, () => { W.flush = { room: R, t0: W.T }; SFX.flush(); burst(W, 'word', top, { text: 'Flush!', life: 1.6 }); speak('Flush!', me); }); return; }
      if (key === 'BasinUnit') { walkNear(key, item, () => { c.facing = 'back'; SFX.water(); wordFx('sink', top); }); return; }
    }
    if (R === 'bathroom') {
      if (key === 'ShowerTray' || key === 'ShowerScreens' || key === 'ShowerFittings') { walkTo(W, c, 1.5, 1.5, () => { W.shower = W.T; W.doodles = []; SFX.water(5); wordFx('shower', top); }); return; }
      if (key === 'RoundMirror') {
        const fog = W.T - W.shower < 36;
        walkTo(W, c, 2.0, 1.1, () => { c.facing = 'back'; if (fog) { W.doodles.push({ x: 16 + Math.random() * 44, y: 16 + Math.random() * 44, kind: pick(['heart', 'smile', 'star']) }); if (W.doodles.length > 5) W.doodles.shift(); SFX.squeak(); wordFx('draw', top); } else wordFx('mirror', top); });
        return;
      }
    }
    if (R === 'attic') {
      if (key === 'eyes') {
        walkTo(W, c, 2.8, 1.35, () => {
          say(W, me, 'Who is there?');
          later(W, 1.4, () => { W.eyesT = W.T; W.flags.eyes = 'revealed'; SFX.squeak(); W.mice = [{ id: 1, x: 1.7, y: 1.15, tx: 3.5, ty: 2.8, t: 0, life: 9, dir: 1 }, { id: 2, x: 2.15, y: 1.2, tx: 4.6, ty: 3.6, t: 0, life: 9.5, dir: 1 }]; });
          later(W, 1.9, () => say(W, me, 'Mice! Squeak squeak!'));
        });
        return;
      }
      if (key === 'TreasureChest#2') { walkNear(key, item, () => { W.coins = W.T; SFX.coins(); wordFx('gold', top); }); return; }
      if (key === 'RockingHorse') { walkNear(key, item, () => { wiggle(W, key, 'rock'); SFX.rock(); later(W, 0.6, () => SFX.rock()); later(W, 1.2, () => SFX.rock()); wordFx('horse', top); }); return; }
      if (key === 'SheetedChair') { walkNear(key, item, () => { wiggle(W, key); say(W, me, 'Boo!'); }); return; }
      if (key === 'DressUpMirror') { walkNear(key, item, () => { c.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; burst(W, 'spark', headAt(c)); wordFx('mirror', top); }); return; }
    }
    if (R === 'garden') {
      if (key === 'ball') {
        const b = W.ball; let sx = b.x + 0.35, sy = b.y + 0.35;
        if (W.goal.up) { const gx = (GOAL.x0 + GOAL.x1) / 2 - b.x, gy = GOAL.y - b.y, d = Math.hypot(gx, gy) || 1; sx = b.x - gx / d * 0.45; sy = b.y - gy / d * 0.45; }
        walkTo(W, c, ...nav('garden').nearestFree(sx, sy), () => { kickBall(W, c); wordFx('kick', headAt(c)); });
        return;
      }
      if (key === 'goal') { walkTo(W, c, 6.4, 6.0, () => { toggleGoal(W); }); return; }
      if (key === 'CoveredBBQ') { walkNear(key, item, () => { startBbq(W); SFX.sizzle(); wordFx('BBQ', top); setPanel({ kind: 'bbq' }); }); return; }
      if (key === 'Tree') { walkTo(W, c, 1.3, 2.4, () => { W.leaves = W.T; SFX.whoosh(); wordFx('tree', top); }); return; }
    }
    if (R === 'downhall' && key === 'parcel') {
      const pc = W.parcel;
      walkTo(W, c, pc.x + 0.5, pc.y - 0.2, () => {
        pc.opened = true; SFX.fanfare(); burst(W, 'confetti', P(pc.x, pc.y, 0.6));
        const it = { id: 'gift-' + Math.round(W.T * 100), kind: pc.kind, room: null, loc: { s: 'floor', x: pc.x, y: pc.y }, rot: 0 };
        W.items.push(it); it.room = 'downhall';
        later(W, 0.6, () => { say(W, me, `A ${KINDS[pc.kind].word}!`); toPack(it, P(pc.x, pc.y, 0.3)); W.parcel = null; });
      });
      return;
    }
    if (key === 'xtree' && R === 'living') { walkTo(W, c, ...nav('living').nearestFree(TREE_AT[0] + 0.3, TREE_AT[1] + 1.0), () => { c.facing = 'back'; c.flip = false; wordFx('tree', top); setPanel({ kind: 'tree' }); }); return; }
    if (key === 'present') { SFX.boing(); wordFx('present', [pt[0], pt[1] - 30]); const g = ['mum', 'dad'].find(k => W.people[k].room === R && k !== me) || me; later(W, 0.6, () => say(W, g, pick(['Not until Christmas Day!', 'No peeking!', 'Hands off! Ha ha!']))); return; }
    if (key.startsWith('puddle')) {
      const sp = puddleSpots(R)[+key.slice(6)] || [c.x, c.y];
      walkTo(W, c, ...nav(R).nearestFree(sp[0], sp[1], 0.05), () => {
        c.action = { kind: 'jump', t0: W.T, dur: 0.7 };
        later(W, 0.55, () => { SFX.splash(); burst(W, 'splash', [sp[0], sp[1], 0.05]); burst(W, 'word', P(sp[0], sp[1], 1.4), { text: 'splash!', life: 1.4 }); speak('splash', 'word');
          const o = dressed(W, outfits)[me] || {}; later(W, 0.6, () => say(W, me, o.shoeStyle === 'wellies' ? 'My wellies keep me dry!' : pick(['Splash! Wet feet!', 'Splish splash!', 'Again!'])));
          later(W, 2, () => achieve(W, 'puddle')); });
      });
      return;
    }
    if (key === 'rainbow') { SFX.sparkle(); wordFx('rainbow', [pt[0], pt[1]]); later(W, 1.5, () => achieve(W, 'rainbow')); return; }
    if (key === 'snowman') { SFX.boing(); wordFx('snowman', [pt[0], pt[1] - 40]); later(W, 1.5, () => achieve(W, 'snowman')); return; }
    if (key === 'bat') { if (W.bat && !W.bat.flee) { W.bat.flee = W.T; SFX.squeak(); wordFx('bat', top); } return; }
    if (key === 'jack') { SFX.boing(); wordFx('pumpkin', [pt[0], pt[1] - 30]); return; }
    if (R === 'kitchen' && key === 'pumpkin') { walkTo(W, c, ...nav('kitchen').nearestFree(2.0, 1.15), () => { c.facing = 'back'; c.flip = false; wordFx('pumpkin', top); setPanel({ kind: 'pumpkin' }); }); return; }
    if ((TOWN.includes(R) || (ROOMS[R] && ROOMS[R].shop)) && townTap(key, item, pt, top)) return;
    // anything else: walk over, it wiggles and says its name
    walkNear(key, item, () => wiggle(W, key));
    if (word) wordFx(word, top); else SFX.pop();
  }

  // things in New Street houses
  function hbTap(hp, key, item, top) {
    const fam = W.folk.fams[hp.fam], p = fam && fam.rooms[hp.rk] && fam.rooms[hp.rk].items[hp.i]; if (!p) return false;
    const id = p.id, word = HB_WORD[id] || 'this', onKey = W.room + ':' + key;
    if (HB_TOGGLE.has(id)) {
      walkNear(key, item, () => { W.hbOn = W.hbOn || {}; const on = W.hbOn[onKey] = !W.hbOn[onKey]; if (id.startsWith('e-')) SFX.tv(); else SFX.click(); wordFx(on ? (id.startsWith('e-') ? word : 'on') : 'off', top); if (on && id.startsWith('e-') && id !== 'e-tv') { c.action = { kind: 'cheer', t0: W.T, dur: 1 }; later(W, 0.8, () => say(W, me, pick(['I win!', 'This game is fun!', 'Level up!']))); } });
      return true;
    }
    const go = f => walkNear(key, item, () => { if (c.mode === 'stand') c.facing = 'back'; f(); });
    switch (HB_ACT[id]) {
      case 'dress': go(() => { SFX.door(); wordFx(word, top); setDressWho(me); setPanel({ kind: 'dress' }); }); return true;
      case 'book': go(() => readBook(pick(['pup', 'bus', 'dog', 'fish']), null)); wordFx('books', top); return true;
      case 'fridge': go(() => { SFX.door(); wordFx('fridge', top); setFillings([]); setPanel({ kind: 'fridge' }); }); return true;
      case 'cook': go(() => { SFX.sizzle(); wordFx('cook', top); }); return true;
      case 'sink': go(() => { SFX.water(); wordFx('sink', top); }); return true;
      case 'bath': go(() => { SFX.water(3); wordFx('bath', top); burst(W, 'spark', top, { n: 12, spread: 80 }); later(W, 0.8, () => say(W, me, pick(['Bubbles!', 'Bath time!', 'Splish splash!']))); }); return true;
      case 'shower': go(() => { SFX.water(4); wordFx('shower', top); }); return true;
      case 'flush': go(() => { SFX.flush(); burst(W, 'word', top, { text: 'Flush!', life: 1.6 }); speak('Flush!', me); }); return true;
      case 'wash': go(() => { SFX.spin(); wiggle(W, key); wordFx('washer', top); }); return true;
      case 'music': go(() => { SFX.party(6); wordFx('music', top); c.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; later(W, 0.9, () => { c.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; }); }); return true;
      case 'paint': go(() => { wordFx('paint', top); setPanel({ kind: 'paint' }); }); return true;
      case 'rock': go(() => { wiggle(W, key, 'rock'); SFX.rock(); later(W, 0.6, () => SFX.rock()); later(W, 1.2, () => SFX.rock()); wordFx(word, top); }); return true;
      case 'hug': go(() => { wiggle(W, key); burst(W, 'hearts', top); wordFx(word, top); }); return true;
      case 'mirror': go(() => { c.action = { kind: 'twirl', t0: W.T, dur: 0.8 }; burst(W, 'spark', headAt(c)); wordFx('mirror', top); }); return true;
      case 'clock': SFX.click(); later(W, 0.3, () => SFX.click()); wordFx('tick tock', top); return true;
      case 'train': go(() => { wiggle(W, key); SFX.whoosh(); burst(W, 'word', top, { text: 'Choo choo!', life: 1.6 }); speak('Choo choo!', me); }); return true;
      case 'pet': go(() => { wiggle(W, key); burst(W, 'hearts', top); wordFx(word, top); }); return true;
      case 'tent': go(() => { wordFx('tent', top); later(W, 0.6, () => say(W, me, 'A secret den!')); }); return true;
      default: return false;
    }
  }
  function personTap(id) {
    const p = W.people[id];
    if (id === me) {
      if (c.mode === 'lie') { if (c.sleep) burst(W, 'hearts', headAt(c)); else if (c.bed === 'callie:bed' && me === 'callie') { c.tabletOn = !c.tabletOn; SFX.pop(); } else hopOffBed(W, c); return; }
      if (c.reading) return;
      c.action = { kind: 'cheer', t0: W.T, dur: 1.2 }; SFX.sparkle(); burst(W, 'spark', headAt(c), { n: 10, spread: 90 }); burst(W, 'hearts', headAt(c));
      say(W, me, pick({ callie: ['Hello!', 'I am Callie!', 'Yay!', 'I like my house!'], chloe: ['Hi. I am Chloe.', 'Whatever.', 'I like black.'], mum: ['Hello!', 'Who wants tea?', 'Time to tidy up!'], dad: ['Hello!', 'Who wants a snack?', 'Dad jokes!'], connor: ['Yo!', 'I am Connor.', 'Rematch?'] }[me] || [`I am ${NAMES[me]}!`, 'Hello!', 'Yay!', 'I like my house!']));
      return;
    }
    if (W.hide && W.hide.who === id && W.hide.phase === 'seek') { foundHider(W, q => { burst(W, 'confetti', headAt(q)); showToast(`You found ${NAMES[id]}!`); }); return; }
    const mine = inPack().find(i => i.quest === id);
    if (mine) { give(id, mine); return; }
    setPmenu({ who: id });
  }
  function hugPerson(id) {
    const p = W.people[id];
    setPmenu(null);
    const lines = {
      callie: ['Hello!', 'Play with me!', 'Big hug!', 'I love you!', 'Hee hee!'],
      connor: ['Yo.', 'What?', 'Want to play?', 'I am hungry.'],
      chloe: ['Hi.', 'Ugh. What?', 'I am busy.', 'Go away, Callie.', 'Ok... one hug.', 'Nice top.'],
      mum: ['Hello, my love!', 'Did you tidy up?', 'Big hug!', 'I love you!', 'Nice top!'],
      dad: ['Hi, Callie!', 'Big hug!', 'Who wants a snack?', 'I love you!', 'Tickle time!'],
      ...GRAND_HUGS,
    }[id] || [`Hi, ${NAMES[me]}!`, 'Big hug!', 'Hello!', 'Want to play?', 'I like your top!'];
    p.hugT = W.T;
    walkTo(W, c, ...nav(W.room).nearestFree(p.x + 0.6, p.y + 0.6), () => { burst(W, 'hearts', headAt(p)); const line = pick(lines); say(W, id, line); if (p.mode !== 'sit') p.facing = 'front'; if (line.includes('biscuit')) later(W, 1.8, () => giveFood('biscuit', {}, headAt(p))); if (GRAND_HUGS[id]) later(W, 2.5, () => achieve(W, 'nanny')); });
  }

  function placeSelected(hit, pt, item) {
    const it = W.items.find(i => i.id === sel); setSel(null); setPackOpen(false);
    if (!it) return;
    if (hit && hit.startsWith('person:')) { give(hit.slice(7), it); return; }
    if (hit && hit.startsWith('obj:')) {
      const key = hit.slice(4), boxId = containerFor(W.room, key) || (W.room === 'callie' ? { basket: 'callie:basket', box: 'callie:box', desk: 'callie:desk' }[key] : null);
      if (boxId) { walkTo(W, c, ...nav(W.room).nearestFree(...CONTAINERS[boxId].at), () => { putIn(it, boxId); wiggle(W, key); burst(W, 'spark', objTop(item, pt), { n: 8, spread: 60 }); }); return; }
      if (W.room === 'hallway' && key === 'ConnorDoor') { doorAction(ROOMS.hallway.doors.find(d => d.id === 'connor')); return; }
      if (W.room === 'callie' && key === 'bed') { walkTo(W, c, 2.3, 2.45, () => { it.loc = { s: 'bed', x: rand(1.2, 3.4), y: rand(0.6, 1.7) }; it.room = 'callie'; SFX.plop(); W.dirty = true; }); return; }
    }
    const [x, y] = inv(pt[0], pt[1], 0);
    const [fx, fy] = nav(W.room).nearestFree(x, y, 0.1);
    walkTo(W, c, fx, fy, () => dropOnFloor(it, fx + 0.25, fy + 0.25));
  }

  /* ----- decorating a New Street house ----- */
  function startBuild() {
    const Rm = ROOMS[W.room]; if (!Rm || !Rm.fam || !Rm.decor) return;
    const fam = W.folk.fams[Rm.fam];
    setPanel(null); setSel(null); setPackOpen(false); setPmenu(null);
    setBuild({ rid: W.room, fam: Rm.fam, rk: Rm.rk, tab: 'things', cat: 'mine', sel: null, saved: { ...fam.rooms[Rm.rk].style } });
    if (!Object.keys(fam.store).length) setBuild(b => ({ ...b, cat: 'seating' }));
    SFX.sparkle(); speak(`Decorate the ${Rm.name}!`, 'narrator');
  }
  const patchBuild = p => setBuild(b => b && ({ ...b, ...p }));
  const buildFam = () => W.folk.fams[build.fam];
  function applyStyle() {
    const b = build, fam = buildFam(), R = fam.rooms[b.rk], cost = styleCost(W, R.style, b.saved);
    if (cost > W.coins) { showToast(WHY.coins); SFX.thud(); return false; }
    W.coins -= cost; W.dirty = true; if (cost) SFX.coins(); SFX.sparkle();
    if (['wall', 'paper', 'floor', 'floorColor'].some(k => R.style[k] !== b.saved[k])) later(W, 1.2, () => achieve(W, 'makeover'));
    patchBuild({ saved: { ...R.style } }); showToast('Looks lovely!');
    const fan = Object.values(W.people).find(q => q.id !== me && q.room === W.room && NAMES[q.id]);
    if (fan) later(W, 0.8, () => say(W, fan.id, pick(['Wow! I love it!', 'So pretty!', 'Ooh, nice!', 'Looks great!'])));
    return true;
  }
  function undoStyle() { const fam = buildFam(); fam.rooms[build.rk].style = { ...build.saved }; rebuild(W, fam, build.rk); SFX.whoosh(); patchBuild({}); }
  function setStyle(p) { const fam = buildFam(), R = fam.rooms[build.rk]; R.style = { ...R.style, ...p }; rebuild(W, fam, build.rk); SFX.pop(); patchBuild({}); }
  // keep style changes she can pay for, put the rest back
  function settleStyle() {
    const b = build, fam = buildFam(), R = fam.rooms[b.rk];
    if (R && styleChanged(R.style, b.saved) && !(styleCost(W, R.style, b.saved) <= W.coins && applyStyle())) { R.style = { ...b.saved }; rebuild(W, fam, b.rk); }
  }
  function endBuild() {
    if (!build) return;
    settleStyle(); setBuild(null); SFX.zip(); W.dirty = true;
  }
  const standHere = (p, rid, x, y) => Object.assign(p, { room: rid, x, y, z: 0, mode: 'stand', path: null, goal: null, then: null, bed: null, seatStand: null, busy: p.busy === 'out' ? p.busy : null });
  function buildGo(k) {
    const fam = buildFam(), rid = fam.id + ':' + k, g = geoOf(fam, k); if (!fam.rooms[k]) return;
    settleStyle();
    standHere(c, rid, ...nav(rid).nearestFree(g.RX / 2, g.RY / 2 + 1));
    W.fade = { t0: W.T }; later(W, 0.28, () => { W.room = rid; W.fx = []; });
    setBuild(b => ({ ...b, rid, rk: k, sel: null, saved: { ...fam.rooms[k].style } }));
  }
  function buildNewLayout(type) {
    const fam = buildFam(), old = houseRooms(fam);
    newLayout(fam, type); buildHouse(fam);
    const now = houseRooms(fam), entry = entryRoom(fam);
    dropRooms(old.filter(r => !now.includes(r)));
    if (PLACES['h:' + fam.id]) PLACES['h:' + fam.id].room = entry;
    for (const p of Object.values(W.people)) {
      const r = p.room || (p.goal && p.goal.room);
      if (r && (old.includes(r) || now.includes(r))) standHere(p, entry, ...nav(entry).randomFree(1)[0]);
    }
    standHere(c, entry, ...nav(entry).nearestFree(geoOf(fam, planOf(fam).entry).RX / 2, 2));
    W.fade = { t0: W.T }; later(W, 0.28, () => { W.room = entry; W.fx = []; });
    setBuild(b => ({ ...b, rid: entry, rk: planOf(fam).entry, sel: null, saved: { ...fam.rooms[planOf(fam).entry].style } }));
    SFX.whoosh(); showToast(`A new ${HOUSE_TYPES[type].name.toLowerCase()}!`); W.dirty = true;
  }
  function buildPick(id) {
    const fam = buildFam(), it = HB_ITEM[id];
    speak(HB_WORD[id] || it.n, 'word');
    const r = addPiece(W, fam, build.rk, id, [c.x, c.y]);
    if (r.why) { showToast(WHY[r.why]); SFX.thud(); return; }
    SFX.plop(); if (r.cost) SFX.coins();
    const q = fam.rooms[build.rk].items[r.i]; burst(W, 'spark', P(q.x + 0.5, q.y + 0.5, 0.9), { n: 10, spread: 70 });
    patchBuild({ sel: r.i });
    later(W, 1.5, () => achieve(W, 'decor'));
  }
  function buildTap(hit, pt) {
    const fam = buildFam(), items = fam.rooms[build.rk].items, g = geoOf(fam, build.rk), st = fam.rooms[build.rk].style;
    const [fx, fy] = inv(pt[0], pt[1], 0);
    // walls tab: tap a wall to paint just that one
    if (build.tab === 'walls' && !(hit && hit.startsWith('obj:')) && (fy < -0.05 || fx < -0.05)) { const side = fy < -0.05 && fy < fx ? 'back' : 'side'; patchBuild({ wallSide: side }); speak(side === 'back' ? 'Back wall' : 'Side wall', 'word'); SFX.pop(); return; }
    // the rug
    if (build.sel === 'rug') { if (hit && hit.startsWith('obj:')) { patchBuild({ sel: null }); } else { setStyle({ rugAt: rugMoved(g, st, fx, fy) }); SFX.plop(); return; } }
    if (!(hit && hit.startsWith('obj:')) && build.sel == null && onRug(g, st, fx, fy)) { patchBuild({ sel: 'rug', tab: 'floor' }); speak('rug', 'word'); SFX.pop(); return; }
    if (hit && hit.startsWith('obj:')) {
      const hp = pieceAt(W.room, hit.slice(4));
      if (hp) { if (hp.i === build.sel) { patchBuild({ sel: null }); SFX.click(); return; } patchBuild({ sel: hp.i, tab: 'things' }); speak(HB_WORD[items[hp.i].id] || 'this', 'word'); SFX.pop(); return; }
    }
    if (build.sel == null) { showToast('Tap a thing to move it.'); return; }
    const p = typeof build.sel === 'number' && items[build.sel]; if (!p) return;
    let [x, y] = inv(pt[0], pt[1], 0);
    if (HB_ITEM[p.id].wall && y < 0.3) x = (pt[0] - P(0, 0, 0)[0]) / (P(1, 0, 0)[0] - P(0, 0, 0)[0]);
    const why = movePiece(W, fam, build.rk, build.sel, x, y);
    if (why === 'same') return;
    if (why) { showToast(WHY[why]); SFX.thud(); return; }
    SFX.plop(); patchBuild({});
  }

  function onTap(hit, pt) {
    if (W.fade && W.T - W.fade.t0 < 0.6) return;
    if (build) { buildTap(hit, pt); return; }
    if (c.mode === 'ride') { endRide(); return; }
    if (hit && hit.startsWith('npc:')) { npcTap(hit.slice(4)); return; }
    const L = roomLayers(W.room);
    const itemOf = key => L.items.find(i => i.key === key);
    if (sel) { placeSelected(hit, pt, hit && hit.startsWith('obj:') ? itemOf(hit.slice(4)) : null); return; }
    if (hit && hit.startsWith('item:')) {
      const it = W.items.find(i => i.id === hit.slice(5)); if (!it) return;
      if (it.loc.s === 'in') { onTap('obj:' + ({ 'callie:basket': 'basket', 'callie:box': 'box', 'callie:desk': 'desk' }[it.loc.box] || ''), pt); return; }
      if (it.kind === 'book' && it.loc.s === 'floor') { walkTo(W, c, ...nav(W.room).nearestFree(it.loc.x + 0.3, it.loc.y + 0.3), () => readBook(storyFor(it), it)); return; }
      const z = it.loc.s === 'bed' ? 0.95 : 0;
      const target = it.loc.s === 'bed' ? [2.3, 2.45] : nav(W.room).nearestFree(it.loc.x + 0.3, it.loc.y + 0.3);
      walkTo(W, c, target[0], target[1], () => toPack(it, P(it.loc.x, it.loc.y, z + 0.3)));
      return;
    }
    if (hit && hit.startsWith('person:')) { personTap(hit.slice(7)); return; }
    if (hit && hit.startsWith('pet:')) { petTap(hit.slice(4)); return; }
    if (hit && hit.startsWith('pethome:')) { homeTap(hit.slice(8)); return; }
    if (hit && hit.startsWith('mess:')) { messTap(hit.slice(5)); return; }
    if (hit && hit.startsWith('critter:')) { tapCritter(W, hit.slice(8), me, (w, at, k) => { if (w) wordFx(w, at); if (k) burst(W, k, at); }); return; }
    if (hit === 'letter' && W.letter) { walkTo(W, c, ...nav(W.room).nearestFree(W.letter.x + 0.4, W.letter.y + 0.4), () => { SFX.zip(); wordFx('letter', P(W.letter.x, W.letter.y, 0.4)); setPanel({ kind: 'letter' }); setPackOpen(false); }); return; }
    if (hit && hit.startsWith('spider:')) { const s = W.spiders.find(x => String(x.id) === hit.slice(7)); if (s) { if (me === 'dad') playerCatch(W, s); else if (!s.alarmed) alarmSpider(W, s, me); else say(W, me, W.player === 'dad' ? 'Dad, get it!' : 'Dad is coming!'); wordFx('spider', P(s.x, s.y, 0.4)); } return; }
    if (hit && hit.startsWith('door:')) { const d = DOORMAP[W.room + ':' + hit.slice(5)]; if (d) { speak(d.label ? d.label.text : 'door', 'word'); doorAction(d); } return; }
    if (hit && hit.startsWith('obj:')) { const key = hit.slice(4); objTap(key, itemOf(key), pt); return; }
    // the floor: doors first, then walking
    const [x, y] = inv(pt[0], pt[1], 0);
    const door = ROOMS[W.room].doors.find(d => d.zone && inside(x, y, d.zone));
    if (door) { doorAction(door); return; }
    if (W.room === 'park' && ((x - 13.1) / 2.4) ** 2 + ((y - 5.7) / 1.7) ** 2 < 1) { feedDucks(); return; }
    if (W.room === 'school' && x > 23.0 && x < 24.8 && y > 9.9 && y < 14.9) { hopscotch(); return; }
    const [bx0, bx1, by0, by1] = ROOMS[W.room].bounds;
    if (x < bx0 - 0.6 || y < by0 - 0.6 || x > bx1 + 0.6 || y > by1 + 0.6) return;
    burst(W, 'ripple', P(...nav(W.room).nearestFree(x, y, 0.05), 0.02), { life: 0.7 });
    walkTo(W, c, x, y);
  }

  const toSvg = e => { const svg = svgRef.current, p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const r = p.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; };
  const hitOf = el => { const h = el && el.closest && el.closest('[data-hit]'); return h ? h.getAttribute('data-hit') : null; };
  const onPointerDown = e => {
    if (press.current) return;
    AUDIO.unlocked = true; audio();
    if (hint) setHint(false);
    if (menu) setMenu(false);
    if (pmenu) setPmenu(null);
    press.current = { id: e.pointerId, cx: e.clientX, cy: e.clientY, hit: hitOf(e.target), pt: toSvg(e), moved: false };
    try { svgRef.current.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  const onPointerMove = e => {
    const pr = press.current; if (!pr || pr.id !== e.pointerId) return;
    const pt = toSvg(e);
    if (!pr.moved && Math.hypot(e.clientX - pr.cx, e.clientY - pr.cy) > 10) {
      pr.moved = true;
      if (pr.hit && pr.hit.startsWith('item:')) { const it = W.items.find(i => i.id === pr.hit.slice(5)); if (it && (it.loc.s === 'floor' || it.loc.s === 'bed')) { const z = it.loc.s === 'bed' ? 0.95 : 0; const b = P(it.loc.x, it.loc.y, z); drag.current = { id: it.id, off: [b[0] - pr.pt[0], b[1] - pr.pt[1]], pt }; SFX.pop(); } }
    }
    if (drag.current) drag.current.pt = pt;
  };
  const onPointerUp = e => {
    const pr = press.current; if (!pr || pr.id !== e.pointerId) return;
    press.current = null;
    const d = drag.current; drag.current = null;
    if (d) {
      const it = W.items.find(i => i.id === d.id); if (!it) return;
      svgRef.current.style.pointerEvents = 'none'; const under = document.elementFromPoint(e.clientX, e.clientY); svgRef.current.style.pointerEvents = '';
      const h = hitOf(under) || '', key = h.startsWith('obj:') ? h.slice(4) : null;
      const boxId = key && (containerFor(W.room, key) || (W.room === 'callie' ? { basket: 'callie:basket', box: 'callie:box', desk: 'callie:desk' }[key] : null));
      if (boxId) { putIn(it, boxId); SFX.sparkle(); burst(W, 'spark', [d.pt[0], d.pt[1]], { n: 8, spread: 60 }); if (c.mode === 'stand' && !c.action) c.action = { kind: 'yay', t0: W.T, dur: 0.6 }; return; }
      const base = [d.pt[0] + d.off[0], d.pt[1] + d.off[1]];
      if (W.room === 'callie') { const [bx, by] = inv(base[0], base[1], 0.95); if (inside(bx, by, [0.45, 3.8, 0.25, 1.95])) { it.loc = { s: 'bed', x: bx, y: by }; SFX.plop(); W.dirty = true; return; } }
      const [x, y] = inv(base[0], base[1], 0); dropOnFloor(it, x, y);
    } else if (!pr.moved) onTap(pr.hit, pr.pt);
  };

  /* ----- render ----- */
  const T = W.T, R = W.room, L = liveLayers(R, T);
  const ctx = { T, W, av, paintings, outfits, inBox };
  const animT = (item) => {
    const a = W.anim[R + ':' + item.key]; if (!a) return undefined;
    const q = (T - a.t0) / (a.kind === 'rock' ? 2.4 : 0.5); if (q >= 1) { delete W.anim[R + ':' + item.key]; return undefined; }
    const s = item.sort || item.block; if (!s) return undefined;
    const pv = P((s[0] + s[1]) / 2, (s[2] + s[3]) / 2, 0);
    if (a.kind === 'rock') return `rotate(${Math.sin(q * Math.PI * 5) * 7 * (1 - q)} ${pv[0]} ${pv[1]})`;
    const k = 1 + Math.sin(q * Math.PI) * 0.06 * (1 - q);
    return `translate(${pv[0]} ${pv[1]}) scale(${k} ${2 - k}) translate(${-pv[0]} ${-pv[1]})`;
  };
  const ov = roomOverlays(R, ctx);
  const ATTACH = { record: 'Sideboard', kpumpkin: 'WashingMachine', spookylabel: 'CardboardBoxes', tv: 'TVUnit', fire: 'Fireplace', fridgeart: 'AmericanFridge', fridgein: 'AmericanFridge', easelart: 'ArtEasel', micro: 'Microwave', washer: 'WashingMachine', flush: 'Toilet' };
  const attached = {}; const ovBg = [];
  for (const el of ov.bg) { const k = ATTACH[el.key]; if (k) (attached[k] = attached[k] || []).push(el); else ovBg.push(el); }
  const buildHere = build && build.rid === R, selPiece = buildHere && typeof build.sel === 'number' ? W.folk.fams[build.fam].rooms[build.rk].items[build.sel] : null;
  const selRug = buildHere && build.sel === 'rug' ? rugOf(geoOf(W.folk.fams[build.fam], build.rk), W.folk.fams[build.fam].rooms[build.rk].style) : null;
  if (buildHere) ovBg.push(<BuildGrid key="bgrid" g={geoOf(W.folk.fams[build.fam], build.rk)} piece={selPiece} rug={selRug} />);
  const wrap = item => {
    const hit = item.hit === 'obj' ? 'obj:' + item.key : item.hit === 'npc' ? 'npc:' + item.key : item.hit;
    return <g key={item.key} data-hit={hit === 'none' ? undefined : hit} pointerEvents={hit === 'none' ? 'none' : undefined} style={hit && hit.startsWith('obj:') ? { cursor: 'pointer' } : undefined} transform={animT(item)}>{item.render ? item.render(ctx) : item.el}{attached[item.key]}</g>;
  };
  const bgEls = L.items.filter(i => i.kind === 'bg' || i.kind === 'wall').map(wrap);
  // camera
  let [vx, vy, vw, vh] = L.box;
  const wideB = size.w >= 700 && size.w > size.h * 1.1;
  const sz = build ? (wideB ? { w: size.w - Math.min(410, Math.round(size.w * 0.42)), h: size.h } : { w: size.w, h: Math.round(size.h * 0.48) }) : size;
  const aspect = sz.w / Math.max(1, sz.h);
  const camZ = ROOMS[R].cam;
  if (camZ) {
    // big places: a closer camera that follows whoever you are playing
    let nw = 1920 / camZ, nh = 1080 / camZ;
    if (aspect < 1.05) { nw *= aspect < 0.7 ? 0.5 : 0.7; nh = nw / aspect; } else if (aspect < 16 / 9) nh = nw / aspect; else nw = nh * aspect;
    nw = Math.min(nw, vw); nh = Math.min(nh, vh);
    const fp = P(c.x, c.y, (c.z || 0) + 0.9);
    const tx = clamp(fp[0] - nw / 2, vx, vx + vw - nw), ty = clamp(fp[1] - nh / 2, vy, vy + vh - nh);
    if (!av.cam || av.cam.room !== R || W.fade) av.cam = { room: R, x: tx, y: ty }; else { av.cam.x = lerp(av.cam.x, tx, 0.1); av.cam.y = lerp(av.cam.y, ty, 0.1); }
    vx = av.cam.x; vy = av.cam.y; vw = nw; vh = nh;
  } else if (aspect < 1.05 && !build) { const nw = vw * (aspect < 0.7 ? 0.64 : 0.8), nh = Math.min(vh, nw / aspect); const fp = P(c.x, c.y, c.z); vx = clamp(fp[0] - nw / 2, vx, vx + vw - nw); vy = vy + (vh - nh) * 0.5; vw = nw; vh = nh; }
  // big places: only draw what the camera can see
  const vis = r => !L.live || !r || (r[1] > vx - 150 && r[0] < vx + vw + 150 && r[3] > vy - 150 && r[2] < vy + vh + 300);
  const furn = L.items.filter(i => i.kind === 'furn').map((i, k) => (vis(i.sr) ? { key: i.key, sort: i.sort, sr: i.sr, bb: i.bb, ok: k, el: wrap(i) } : null)).filter(Boolean);
  const frontEls = L.items.filter(i => i.kind === 'front').map(wrap);
  const overlayEls = L.items.filter(i => i.kind === 'overlay').map(wrap);
  const dyn = [...ov.sorted];
  for (const i of L.items) if (i.kind === 'person' && i.at) { const g = P(i.at[0], i.at[1], i.at[2] || 0); if (vis([g[0] - 40, g[0] + 40, g[1] - 220, g[1] + 20])) dyn.push({ key: 'npc-' + i.key, x: i.at[0], y: i.at[1], z: i.at[2] || 0, el: wrap(i) }); }
  if (R === 'garden' && (W.goal.up || T - W.goal.t0 < 0.5)) {
    const q = W.goal.up ? E.outBack(clamp((T - W.goal.t0) / 0.5, 0, 1)) : 1 - clamp((T - W.goal.t0) / 0.4, 0, 1);
    const g = GOAL, pv = P(6.4, 7.05, 0), H = 0.95, HB = 0.6;
    const ln = (a, b, w, col) => { const A = P(...a), B = P(...b); return <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col} strokeWidth={w} strokeLinecap="round" />; };
    const net = [];
    for (let k = 0; k <= 8; k++) { const x = g.x0 + (g.x1 - g.x0) * k / 8; net.push(<g key={'n' + k}>{ln([x, g.y, H], [x, g.back, HB], 1.2, 'rgba(255,255,255,.7)')}{ln([x, g.back, HB], [x, g.back, 0], 1.2, 'rgba(255,255,255,.7)')}</g>); }
    for (let k = 1; k <= 4; k++) { const z = HB * k / 5; net.push(<g key={'h' + k}>{ln([g.x0, g.back, z], [g.x1, g.back, z], 1.2, 'rgba(255,255,255,.6)')}</g>); }
    dyn.push({ key: 'goal', x: 6.4, y: 7.1, z: 0, el: <g data-hit="obj:goal" style={{ cursor: 'pointer' }} transform={`translate(${pv[0]} ${pv[1]}) scale(${q}) translate(${-pv[0]} ${-pv[1]})`}>
      <polygon points={[P(g.x0, g.y, 0), P(g.x1, g.y, 0), P(g.x1, g.back, 0), P(g.x0, g.back, 0)].map(p => p.join(',')).join(' ')} fill="rgba(255,255,255,.12)" />
      {net}
      {ln([g.x0, g.back, 0], [g.x0, g.back, HB], 4, '#e8e8e8')}{ln([g.x1, g.back, 0], [g.x1, g.back, HB], 4, '#e8e8e8')}{ln([g.x0, g.back, HB], [g.x1, g.back, HB], 4, '#e8e8e8')}
      {ln([g.x0, g.y, H], [g.x0, g.back, HB], 4, '#e8e8e8')}{ln([g.x1, g.y, H], [g.x1, g.back, HB], 4, '#e8e8e8')}
      {ln([g.x0, g.y, 0], [g.x0, g.y, H], 7, '#fff')}{ln([g.x1, g.y, 0], [g.x1, g.y, H], 7, '#fff')}{ln([g.x0, g.y, H], [g.x1, g.y, H], 7, '#fff')}
    </g> });
  }
  if (R === 'living' && photos.length) ovBg.push(<Iso.FaceY key="wallphoto" y={0.012} x0={4.45} z1={2.62}><rect x={-4} y={-4} width={88} height={66} rx={3} fill="#8a6a45" /><image href={photos[photos.length - 1]} x={0} y={0} width={80} height={58} preserveAspectRatio="xMidYMid slice" /></Iso.FaceY>);
  if (R === 'living' && W.dance) { for (let i = 0; i < 6; i++) { const a = T * 1.6 + i * 1.05, cx = 3.6 + Math.cos(a) * 1.6, cy = 2.2 + Math.sin(a) * 1.0, s = P(cx, cy, 0.01); ovBg.push(<ellipse key={'disco' + i} cx={s[0]} cy={s[1]} rx={46} ry={24} fill={['#ff7ab8', '#3d8fe0', '#ffd23f', '#4cc76a', '#8e5ad1', '#ff9a3d'][i]} opacity={0.35} pointerEvents="none" />); } }
  const wear = dressed(W, outfits);
  for (const p of Object.values(W.people)) {
    if (p.room !== R) continue;
    const g = P(p.x, p.y, 0);
    let el;
    if (p.mode === 'lie' && !(p.id === 'callie' && p.bed === 'callie:bed')) { const gp = P(p.x, p.y, p.z), bed = BEDS[p.bed] || BEDS['callie:bed']; el = <g transform={`translate(${gp[0]} ${gp[1]})`}><PersonLying who={p.id} o={wear[p.id]} T={T} rot={bed.rot} sleep={!!W.bedtime} blanket={bed.blanket} /></g>; }
    else if (p.mode === 'lie' && p.id === 'callie') { const gp = P(p.x, p.y, p.z); el = <g transform={`translate(${gp[0]} ${gp[1]}) rotate(27)`}><CallieLying o={wear.callie} T={T} kick={p.sleep ? 0 : 1} tablet={p.tablet || 0} sleep={p.sleep} /></g>; }
    else { const { b, z } = poseOf(p, T, W); const gp = P(p.x, p.y, z); el = <g transform={`translate(${gp[0]} ${gp[1]})`}>{p.ride && p.ride.kind === 'zip' && p.ride.cz && (() => { const [hx, hy] = zipHands(p.id), ty = -(p.ride.cz - z) * 88; return <g pointerEvents="none"><line x1={0} y1={ty} x2={-hx} y2={hy} stroke="#5b5f66" strokeWidth={2.5} /><line x1={0} y1={ty} x2={hx} y2={hy} stroke="#5b5f66" strokeWidth={2.5} /><line x1={-hx - 4} y1={hy} x2={hx + 4} y2={hy} stroke="#e0524a" strokeWidth={6} strokeLinecap="round" /><rect x={-9} y={ty - 6} width={18} height={10} rx={3} fill="#e0524a" /></g>; })()}<Person who={p.id} o={wear[p.id]} pose={b} T={T} uid={'w-' + p.id} />{wear[p.id].feet === 'bare' && <g pointerEvents="none">{[-12, 0, 12].map((x, i) => { const ph = (T * 0.7 + i * 0.33) % 1; return <path key={i} d={`M${x},${-4 - ph * 50} q8,-9 0,-18 q-8,-9 0,-18`} fill="none" stroke="#6fae2e" strokeWidth={4} strokeLinecap="round" opacity={0.9 * Math.sin(ph * Math.PI)} />; })}</g>}</g>; void g; }
    dyn.push({ key: 'person-' + p.id, x: p.x, y: p.y, z: p.z, el: <g data-hit={'person:' + p.id} style={{ cursor: 'pointer' }} opacity={p.op}>{el}</g> });
  }
  for (const s of W.spiders) if (s.room === R && !s.caught) { const g = P(s.x, s.y, 0); dyn.push({ key: 'spider' + s.id, x: s.x, y: s.y, z: 0, el: <g data-hit={'spider:' + s.id} style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]})`}><circle r={18} cy={-6} fill="transparent" /><Spider s={s} T={T} /></g> }); }
  for (const d of petDyn(W, R, T)) dyn.push(d);
  for (const cr of W.critters) if (cr.room === R) { const g = P(cr.x, cr.y, cr.z), sh = P(cr.x, cr.y, 0); dyn.push({ key: 'critter' + cr.id, x: cr.x, y: cr.y, z: 0, el: <g data-hit={'critter:' + cr.id} style={{ cursor: 'pointer' }}>
    {cr.kind !== 'balloon' && <ellipse cx={sh[0]} cy={sh[1] + 2} rx={cr.kind === 'cat' ? 26 : 13} ry={cr.kind === 'cat' ? 7 : 4} fill="rgba(60,30,10,.14)" />}
    <g transform={`translate(${g[0]} ${g[1]})`}><circle r={34} cy={-16} fill="transparent" /><g transform="scale(1.5)"><CritterArt c={cr} T={T} /></g></g></g> }); }
  if (W.letter && R === 'downhall') { const g = P(W.letter.x, W.letter.y, 0); dyn.push({ key: 'letter', x: W.letter.x, y: W.letter.y, z: 0, el: <g data-hit="letter" style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]})`}><circle r={30} cy={-4} fill="transparent" /><g transform={`translate(0 ${-Math.abs(Math.sin(T * 3)) * 4})`}><LetterArt /></g></g> }); }
  for (const it of W.items) {
    if (it.room !== R || (it.loc.s !== 'floor' && it.loc.s !== 'bed') || (drag.current && drag.current.id === it.id)) continue;
    const z = it.loc.s === 'bed' ? 0.95 : 0; let b = P(it.loc.x, it.loc.y, z); let rot = it.rot || 0, flat = it.kind === 'cloth' || it.kind === 'book' ? 0.6 : 1;
    if (it.fly) { const q = prog(T, it.fly.t0, it.fly.t0 + 0.7); if (q < 1) { b = [lerp(it.fly.from[0], b[0], q), lerp(it.fly.from[1], b[1], q) - arc(q, 150)]; rot += (1 - q) * 360; flat = 1; } else it.fly = null; }
    dyn.push({ key: 'item' + it.id, x: it.loc.x, y: it.loc.y, z, el: <g data-hit={'item:' + it.id} style={{ cursor: 'grab' }} transform={`translate(${b[0]} ${b[1]})`}>
      <ellipse cx={0} cy={2} rx={20} ry={6} fill="rgba(60,30,10,.12)" /><circle cx={0} cy={-14} r={24} fill="transparent" />
      <g transform={`rotate(${it.kind === 'cloth' || it.kind === 'book' ? rot : rot * 0.3}) scale(1 ${flat})`}><ItemArt it={it} s={1.05} /></g></g> });
  }
  let scene;
  if (L.furnEdges) { for (const d of dyn) { const g = P(d.x, d.y, d.z || 0); d.sr = [g[0] - 30, g[0] + 30, g[1] - 215, g[1] + 15]; } const ix = new Map(furn.map((f, n) => [f.ok, n])); const edges = []; for (const [a, b] of L.furnEdges) { const ia = ix.get(a), ib = ix.get(b); if (ia !== undefined && ib !== undefined) edges.push([ia, ib]); } scene = depthSortLoose(furn, dyn, edges).map(n => <g key={n.key}>{n.el}</g>); }
  else scene = depthSort(furn, dyn).map(n => <g key={n.key}>{n.el}</g>);
  // door signs
  const doorSigns = ROOMS[R].doors.filter(d => d.label).map(d => { const [x, y] = P(...d.label.at); const w = d.label.text.length * 10 + 30;
    return <g key={'ds' + d.id} data-hit={'door:' + d.id} style={{ cursor: 'pointer' }} transform={`translate(${x} ${y})`}><rect x={-w / 2} y={-17} width={w} height={34} rx={17} fill="#3b2a24" opacity={0.9} /><text x={0} y={7} textAnchor="middle" fontSize={19} fontFamily="'Andika','Baloo 2',sans-serif" fontWeight="700" fill="#fff6ea">{d.label.text}</text></g>; });
  // drag ghost
  let dragEl = null;
  if (drag.current) { const it = W.items.find(i => i.id === drag.current.id); if (it) { const bpt = [drag.current.pt[0] + drag.current.off[0], drag.current.pt[1] + drag.current.off[1]]; dragEl = <g pointerEvents="none" transform={`translate(${bpt[0]} ${bpt[1] - 16}) scale(1.15)`}><ItemArt it={it} /></g>; } }
  // night and dim
  const night = W.bedtime && W.bedtime.night ? clamp((T - W.bedtime.night) / 1.2, 0, 1) : 0;
  const dk = darkness(W), wxNow = weatherNow(W), wetNow = wxNow === 'rain' || wxNow === 'storm', outdoor = OUTSIDE.has(R), houseRoom = inHouseRoom(R), litNow = houseRoom && isLit(W, R);
  const dim = Math.min(0.8, (R === 'callie' ? (!W.flags.lights ? Math.max(0.58, dk * 0.62) : dk * 0.12) : houseRoom ? dk * (litNow ? 0.12 : 0.6) : outdoor ? dk * 0.5 : dk * 0.12)
    + (outdoor && wetNow ? 0.1 : outdoor && wxNow === 'cloud' ? 0.05 : 0) + night * 0.4);
  const flashA = W.flash && T - W.flash < 0.5 ? (1 - (T - W.flash) / 0.5) * (outdoor ? 0.55 : 0.2) : 0;
  const morning = W.morningFlash && T - W.morningFlash < 2 ? 1 - (T - W.morningFlash) / 2 : 0;
  const fadeA = W.fade ? (T - W.fade.t0 < 0.28 ? (T - W.fade.t0) / 0.28 : Math.max(0, 1 - (T - W.fade.t0 - 0.28) / 0.3)) : 0;
  if (W.fade && T - W.fade.t0 > 0.6) W.fade = null;
  const sh = W.shake > 0 ? [Math.sin(T * 70) * 5 * W.shake, Math.cos(T * 60) * 4 * W.shake] : [0, 0];
  // bubbles on screen
  const bubbles = [];
  const ctm = svgRef.current && svgRef.current.getScreenCTM();
  const toScreen = ([x, y]) => (ctm ? [ctm.a * x + ctm.c * y + ctm.e, ctm.b * x + ctm.d * y + ctm.f] : [x, y]);
  const offBubbles = []; const topFree = size.w < 640 ? 118 : 70;
  for (const b of W.bubbles) {
    let pos = null;
    if (b.anchor.type === 'person') { const p = W.people[b.anchor.id]; if (p && p.room === R) pos = toScreen(headAt(p)); }
    else if (b.anchor.type === 'world') { if (b.anchor.room === R) pos = toScreen(P(...b.anchor.at)); }
    else if (b.anchor.type === 'ceiling') { if (ROOMS[R].ceiling) pos = [size.w / 2, topFree + 95]; }
    else if (b.anchor.type === 'off') { offBubbles.push(<Bubble key={b.id} b={b} reading={reading} onWord={w => speak(w, 'word')} />); continue; }
    if (!pos) continue;
    bubbles.push(<Bubble key={b.id} b={b} x={clamp(pos[0], 120, size.w - 120)} y={b.anchor.type === 'off' ? pos[1] : clamp(pos[1], topFree + 80, size.h - 40)} reading={reading} onWord={w => speak(w, 'word')} />);
  }
  const pack = inPack();
  const target = huntTarget(W);
  const jobList = todos(W), now = jobList.find(j => j.id !== 'hide' && j.id !== 'shop');
  const shownJob = W.hide ? 'hide' : R === 'shop' && W.shop && !W.shop.done ? 'shop' : now && now.id, moreJobs = jobList.filter(j => j.id !== shownJob).length;
  const tidy = W.items.filter(isTidy).length;
  const counts = [['bear', i => KINDS[i.kind] && ['bear', 'moon', 'dino', 'sheep', 'bunny'].includes(i.kind) && i.home], ['cloth', i => i.kind === 'cloth' && i.home], ['book', i => i.kind === 'book' && i.home]]
    .map(([k, f]) => [k, W.items.filter(i => f(i) && isTidy(i)).length, W.items.filter(f).length]);

  return <>
    <svg ref={svgRef} className={'scene' + (build ? ' building' : '')} style={build ? { width: sz.w, height: sz.h } : undefined} viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; drag.current = null; }}
      onContextMenu={e => e.preventDefault()} role="img" aria-label={ROOMS[R].name}>
      <defs>
        <clipPath id="floorclip"><rect x={0} y={0} width={700} height={600} /></clipPath>
        <radialGradient id="fireglow"><stop offset="0" stopColor="#ffb43d" stopOpacity=".45" /><stop offset="1" stopColor="#ffb43d" stopOpacity="0" /></radialGradient>
        <radialGradient id="lampglow"><stop offset="0" stopColor="#fff2b8" stopOpacity=".9" /><stop offset="1" stopColor="#fff2b8" stopOpacity="0" /></radialGradient>
        <radialGradient id="tvglow"><stop offset="0" stopColor="#bfe6ff" stopOpacity=".7" /><stop offset="1" stopColor="#bfe6ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="tabglow"><stop offset="0" stopColor="#ffd0e6" stopOpacity=".9" /><stop offset="1" stopColor="#ffd0e6" stopOpacity="0" /></radialGradient>
      </defs>
      <SkyBack W={W} T={T} box={[vx, vy, vw, vh]} outdoor={OUTSIDE.has(R)} />
      <g transform={`translate(${sh[0]} ${sh[1]})`}>
        <ellipse cx={960} cy={1010} rx={620} ry={60} fill="rgba(90,60,30,.10)" />
        {bgEls}
        {ovBg}
        {scene}
        {frontEls}
        {R === 'callie' && <ellipse cx={P(1.6, 3.2, 0.02)[0]} cy={P(1.6, 3.2, 0.02)[1]} rx={170} ry={95} fill="url(#tvglow)" opacity={av.tv * (0.55 + 0.1 * Math.sin(T * 7))} pointerEvents="none" />}
        {overlayEls}
        {buildHere && <BuildMarker piece={selPiece} rug={selRug} T={T} />}
        {ov.top}
        <Effects fx={W.fx} T={T} room={R} />
        <rect x={-8000} y={-8000} width={20000} height={20000} fill="#1a1c3d" opacity={dim} pointerEvents="none" />
        {dim > 0.05 && R === 'callie' && W.people.callie.mode === 'lie' && W.people.callie.room === 'callie' && <ellipse cx={P(2.25, 1.05, 1)[0]} cy={P(2.25, 1.05, 1)[1]} rx={200} ry={120} fill="url(#tabglow)" opacity={(W.people.callie.tablet || 0) * 0.5} pointerEvents="none" />}
        {R === 'callie' && W.people.callie.mode === 'lie' && W.people.callie.sleep && [0, 1, 2].map(i => { const ph = (T * 0.6 + i / 3) % 1, b = P(2.6, 1.0, 1.4); return <text key={i} x={b[0] + 20 + ph * 40} y={b[1] - ph * 90} fontSize={22 + ph * 18} fontFamily="'Andika','Baloo 2',sans-serif" fontWeight="700" fill="#fff6d8" opacity={Math.sin(ph * Math.PI)} pointerEvents="none">z</text>; })}
        {!W.bedtime && doorSigns}
        {dragEl}
      </g>
      <rect x={-8000} y={-8000} width={20000} height={20000} fill="#fff6d8" opacity={morning * 0.6} pointerEvents="none" />
      {litNow && dk > 0.05 && <rect x={-8000} y={-8000} width={20000} height={20000} fill="#ffb347" opacity={dk * 0.07} pointerEvents="none" />}
      {flashA > 0 && <rect x={-8000} y={-8000} width={20000} height={20000} fill="#fff" opacity={flashA} pointerEvents="none" />}
      {W.flashT && T - W.flashT < 0.6 && <rect x={-8000} y={-8000} width={20000} height={20000} fill="#fff" opacity={1 - (T - W.flashT) / 0.6} pointerEvents="none" />}
      <rect x={-8000} y={-8000} width={20000} height={20000} fill="#2b1d16" opacity={fadeA} pointerEvents="none" />
    </svg>

    <div className="bubbles">{bubbles}</div>

    <div className="hud">
      <div className="left">
        <div className="chip-row"><button className="room-chip" onClick={() => speak(ROOMS[R].name, 'word')}>{ROOMS[R].name}</button><button className={'coin-chip' + (coinPop ? ' bump' : '')} onClick={() => speak(`${W.coins} coins`, 'narrator')} aria-label={`${W.coins} coins`}><span className="coin" aria-hidden="true" />{W.coins}{coinPop && <span key={coinPop.t} className="coin-plus">+{coinPop.n}</span>}</button><button className="sky-chip" onClick={() => { const w = { sun: 'sunny', cloud: 'cloudy', rain: 'raining', storm: 'stormy' }[wxNow]; speak(`It is ${timeWord(W.clock)}. It is ${w}.`, 'narrator'); }} aria-label={`${timeWord(W.clock)}, ${wxNow}`}><SkyIcon W={W} /></button></div>
        {houseRoom && (dk > 0.15 || W.lightAsk || R === 'callie') && <button className={'bulb-btn' + (litNow ? ' on' : '') + (W.lightAsk && !litNow ? ' ask' : '')} onClick={() => { const on = toggleLight(W, R); wordFx(on ? 'on' : 'off', headAt(c)); }} aria-label={litNow ? 'Turn the light off' : 'Turn the light on'} aria-pressed={litNow}><Bulb on={litNow} /><span>{litNow ? 'on' : 'off'}</span></button>}
        {ROOMS[R].fam && ROOMS[R].decor && !build && <button className="decor-btn" onClick={startBuild} aria-label="Decorate this room"><JobIcon kind="roller" size={26} /><span>Decorate</span></button>}
        {R === 'callie' && <div className={'meter' + (tidy === TIDY_TOTAL ? ' all' : '')} aria-label={`Tidied ${tidy} of ${TIDY_TOTAL}`}>
          {counts.map(([k, a, b]) => <span key={k} className={'cat' + (a === b ? ' done' : '')}><ItemIcon it={{ kind: k === 'bear' ? 'bear' : k, c: '#c7b6e6' }} size={26} /><span>{a}/{b}</span></span>)}
        </div>}
      </div>
      <div className="mid">
        <div className="now-row">
          {W.hide ? <div className="quest hide">{W.hide.phase === 'count' ? <span>Counting...</span> : <><span>Find {NAMES[W.hide.who]}!</span><button className="pill" onClick={() => hideHint(W)}>Where are you?</button></>}</div>
            : R === 'shop' && W.shop && !W.shop.done ? <ShoppingList list={W.shop.list} got={W.shop.got} onRead={() => speak('We need ' + W.shop.list.map(g => GROC[g][0]).join(', ') + '.', 'narrator')} />
            : now ? (now.id === 'hunt' ? <button className="hunt" onClick={() => speak(`Find the ${target}.`, 'narrator')}><span className="hunt-q">Find the</span> <b>{target}</b><span className="hunt-n">{W.hunt.idx + 1}/{HUNT_ORDER.length}</span></button>
              : <button className={'quest now' + (now.id === 'spooky' || now.id === 'pumpkin' ? ' spooky' : '')} onClick={() => speak(now.text, 'narrator')}><JobIcon kind={now.icon} size={28} /><span>{now.text}</span></button>)
            : W.fresh ? (Object.keys(W.folk.people).length < 2 ? <button className="quest now" onClick={() => { speak('Make your family and friends!', 'narrator'); setPanel({ kind: 'fams' }); }}><JobIcon kind="star" size={28} /><span>Make your family</span></button>
              : !Object.keys(W.town.shops).length ? <button className="quest now" onClick={() => { speak('Build a shop in town!', 'narrator'); openMap(); later(W, 0.3, () => setPanel(pn => (pn && pn.kind === 'map' ? { ...pn, tb: {} } : pn))); }}><JobIcon kind="shopping" size={28} /><span>Build a shop</span></button>
              : <button className="hunt done-all" onClick={() => openJobs('stickers')}>Stickers</button>)
            : <button className="hunt done-all" onClick={() => openJobs('stickers')}>You found them all!</button>}
          <button className={'jobs-btn' + (stickerPop ? ' glow' : '')} onClick={() => openJobs()} aria-label={`Jobs, ${jobList.length} to do`}>
            <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="6" y="5" width="20" height="25" rx="3" fill="#fffaf0" stroke="#8a5a33" strokeWidth="2.2" /><rect x="11" y="2.5" width="10" height="5.5" rx="2" fill="#e0a92e" stroke="#8a5a33" strokeWidth="1.8" /><path d="M10,14 l2,2 4,-4 M10,22 l2,2 4,-4" fill="none" stroke="#4cc76a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5,15 h4 M18.5,23 h4" stroke="#8a5a33" strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="jobs-word">Jobs</span>
            {moreJobs > 0 && <span className="badge">{moreJobs}</span>}
          </button>
        </div>
        {offBubbles.slice(-2)}
      </div>
      <div className="tools">
        <button className="iconbtn" onClick={() => { if (W.photo) return; startPhoto(); }} aria-label="Family photo"><svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="7" width="18" height="13" rx="3" fill="currentColor" /><path d="M8,7 l2,-3 h4 l2,3z" fill="currentColor" /><circle cx="12" cy="13.5" r="4" fill="#fffaf0" /><circle cx="12" cy="13.5" r="2.2" fill="currentColor" /></svg></button>
        <button className="iconbtn" onClick={() => setVoice(v => !v)} aria-label={voice ? 'Turn reading voice off' : 'Turn reading voice on'} aria-pressed={voice}><svg viewBox="0 0 24 24" width="24" height="24"><path d="M5,5 h14 a2,2 0 0 1 2,2 v8 a2,2 0 0 1 -2,2 h-8 l-4,3 v-3 h-2 a2,2 0 0 1 -2,-2 v-8 a2,2 0 0 1 2,-2z" fill={voice ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" /><text x="12" y="14.5" textAnchor="middle" fontSize="9" fontWeight="800" fill={voice ? '#fffaf0' : 'currentColor'}>abc</text></svg></button>
        <button className="iconbtn" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}><svg viewBox="0 0 24 24" width="24" height="24"><path d="M4,9 L8,9 13,5 13,19 8,15 4,15Z" fill="currentColor" />{muted ? <path d="M16,9 L21,14 M21,9 L16,14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /> : <path d="M16,9 Q18.5,12 16,15 M18.5,6.5 Q23,12 18.5,17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg></button>
        <button className="iconbtn" onClick={() => { setMenu(m => !m); setConfirmReset(false); }} aria-label="Grown-up menu" aria-expanded={menu}><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="5" cy="12" r="2.2" fill="currentColor" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><circle cx="19" cy="12" r="2.2" fill="currentColor" /></svg></button>
        {menu && <div className="menu" onPointerDown={e => e.stopPropagation()}>
          {!confirmReset ? <><p>Grown-ups</p><button className="pill" onClick={() => { setMenu(false); setWorlds('menu'); }}>Change world</button><button className="pill" onClick={() => { W.seasonPick = SEASON_CYCLE[(SEASON_CYCLE.indexOf(W.seasonPick) + 1) % SEASON_CYCLE.length]; W.dirty = true; if (isHalloween(W) && W.hw.stage === 'none') W.hw.askT = Math.min(W.hw.askT, W.T + 4); if (isChristmas(W) && W.xm.stage === 'none') W.xm.askT = Math.min(W.xm.askT, W.T + 4); SFX.click(); }}>Season: {SEASON_LABEL[W.seasonPick]}{W.seasonPick === 'auto' ? ` (${seasonOf('auto') === 'none' ? 'none now' : SEASON_LABEL[seasonOf('auto')]})` : ''}</button><button className="pill" onClick={() => { W.timePick = TIME_CYCLE[(TIME_CYCLE.indexOf(W.timePick) + 1) % TIME_CYCLE.length]; if (W.timePick === 'auto') W.clock = 9; W.dirty = true; SFX.click(); }}>Time: {TIME_LABEL[W.timePick]}</button><button className="pill" onClick={() => { W.weatherPick = WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(W.weatherPick) + 1) % WEATHER_CYCLE.length]; W.dirty = true; SFX.click(); }}>Weather: {WEATHER_LABEL[W.weatherPick]}</button><button className="pill" onClick={() => { earn(W, 50); SFX.coins(); }}>Give 50 coins</button><button className="pill" onClick={() => { W.folk.creative = !W.folk.creative; W.dirty = true; SFX.click(); }}>Decorating: {isFree(W) ? 'Free' : 'Coins'}</button><button className="pill" onClick={() => setConfirmReset(true)}>Start again</button></>
            : <><p>Put everything back and start again? Her paintings and stickers stay.</p><div className="pair"><button className="pill warn" onClick={() => { W.items = startItems(); W.hunt = { idx: 0, done: [] }; resetHalloween(W); resetXmas(W); W.asks.ducks.state = 'idle'; W.asks.school.state = 'idle'; W.uniform = {}; setOutfits(DEFAULT_OUTFITS); W.dirty = true; saveNow(); setMenu(false); setConfirmReset(false); SFX.whoosh(); }}>Yes, start again</button><button className="pill" onClick={() => setConfirmReset(false)}>Cancel</button></div></>}
        </div>}
      </div>
    </div>

    <div className="bottom">
      <button className={'pack-btn' + (sel ? ' active' : '')} onClick={() => { setPackOpen(o => !o); setSel(null); SFX.zip(); }} aria-label={`Backpack, ${pack.length} things`} aria-expanded={packOpen}>
        <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path d="M12,16 Q12,8 24,8 Q36,8 36,16 L38,40 Q38,44 34,44 L14,44 Q10,44 10,40Z" fill="#e86a92" /><path d="M18,10 Q18,4 24,4 Q30,4 30,10" fill="none" stroke="#c94f7e" strokeWidth="3" /><rect x="16" y="26" width="16" height="12" rx="3" fill="#f6a9c3" /><circle cx="24" cy="20" r="2" fill="#ffd45e" /></svg>
        <span className="count">{pack.length}</span>
      </button>
      {packOpen && <div className="tray" onPointerDown={e => e.stopPropagation()}>
        {pack.length ? pack.map(it => <button key={it.id} className="slot" aria-pressed={sel === it.id} onClick={() => { const nv = sel === it.id ? null : it.id; setSel(nv); speak(KINDS[it.kind] ? KINDS[it.kind].word : 'thing', 'word'); }}><ItemIcon it={it} size={46} /><small>{KINDS[it.kind] ? KINDS[it.kind].word : ''}</small></button>)
          : <span className="empty">My bag is empty. Tap toys to pick them up!</span>}
      </div>}
      <div className="who-pick" role="group" aria-label="Who are you playing?">{rowIds().map(id => <button key={id} className={'who' + (id !== me && !samePlace(W.people[id]) ? ' away' : '')} aria-pressed={me === id} aria-label={'Play as ' + NAMES[id]} onClick={() => { speak(NAMES[id], 'word'); switchTo(id); }}><HeadIcon who={id} o={dressed(W, outfits)[id] || DEFAULT_OUTFITS[id]} size={34} /><small>{NAMES[id]}</small></button>)}<button className="who fam-btn" onClick={() => { setPanel({ kind: 'fams' }); setPackOpen(false); speak('Families', 'word'); SFX.pop(); }} aria-label="Families"><svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true"><path d="M4,16 L17,5 L30,16" fill="none" stroke="#c94f7e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="8" y="15" width="18" height="14" fill="#f6a9c3" /><path d="M17,18 v8 M13,22 h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg><small>Families</small></button></div>
      <button className="dress-btn" onClick={() => { setDressWho(me); setPanel({ kind: 'dress' }); SFX.sparkle(); }} aria-label="Dress up"><svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><path d="M8,6 L13,3 C13,7 19,7 19,3 L24,6 29,12 25,15 22,13 22,29 10,29 10,13 7,15 3,12Z" fill="#e86a92" stroke="#c94f7e" strokeWidth="1.5" strokeLinejoin="round" /></svg></button>
    </div>
    {sel && <div className="hint-sel">Tap where to put it, or tap someone to give it to them.{(() => { const it = W.items.find(i => i.id === sel); return it && it.kind === 'book' ? <button className="pill read-it" onClick={() => readBook(storyFor(it), null)}>Read it!</button> : null; })()}</div>}
    {panel && panel.kind === 'book' && <BookReader storyId={panel.story} reader={NAMES[me]} onClose={closeBook} canBag={!!panel.itemId} onBag={() => { const it = W.items.find(i => i.id === panel.itemId); if (it) toPack(it, headAt(c)); closeBook(); }} />}
    {hint && !panel && <div className="hint">Tap to walk. Tap things to hear their names. Tap the door signs to go to other rooms.</div>}
    {toast && <div className="toast">{toast}</div>}
    {stickerPop && STICKER[stickerPop.id] && <button key={stickerPop.t} className="sticker-pop" onPointerDown={e => e.stopPropagation()} onClick={() => openJobs('stickers')}><JobIcon kind={STICKER[stickerPop.id].icon} size={46} /><span><small>New sticker!</small><b>{STICKER[stickerPop.id].title}</b></span></button>}
    {splash && <Splash onStart={() => { window.__splashing = false; setSplash(false); AUDIO.unlocked = true; audio(); SFX.sparkle(); setWorlds('start'); later(W, 0.4, () => speak('Which world shall we play?', 'narrator')); }} />}
    {worlds && !splash && <WorldPicker closable={worlds === 'menu'} saveNow={saveNow} onClose={() => setWorlds(null)} onPlay={() => { setWorlds(null); later(W, 0.3, () => speak(W.fresh ? (W.owner ? `Welcome back to ${W.worldName}!` : 'A new world! First, make yourself.') : "Welcome to Callie's House!", 'narrator')); }} />}
    {W.fresh && !W.owner && !splash && !worlds && <div className="first-run"><CreatorPanel key="first" first W={W} T={T} onClose={() => setWorlds('menu')} onMake={makeFirst} /></div>}
    {build && W.folk.fams[build.fam] && <BuildPanel W={W} fam={W.folk.fams[build.fam]} rk={build.rk} b={build} coins={W.coins} onGoRoom={buildGo} onNewLayout={buildNewLayout}
      onWallSide={v => patchBuild({ wallSide: v })} onRugPick={() => { patchBuild({ sel: 'rug' }); SFX.pop(); }}
      onRugSize={(k, turn) => { const f = buildFam(); setStyle({ rugAt: rugSized(geoOf(f, build.rk), f.rooms[build.rk].style, k, turn) }); patchBuild({ sel: 'rug' }); }}
      onTab={t => patchBuild({ tab: t, sel: t === 'things' || t === 'floor' ? build.sel : null })} onCat={k => patchBuild({ cat: k })} onPick={buildPick}
      onTurn={() => { const why = turnPiece(W, buildFam(), build.rk, build.sel); if (why) { showToast(WHY[why]); SFX.thud(); } else { SFX.whoosh(); patchBuild({}); } }}
      onColour={col => { colourPiece(W, buildFam(), build.rk, build.sel, col); SFX.sparkle(); patchBuild({}); }}
      onPutAway={() => { const id = buildFam().rooms[build.rk].items[build.sel].id; putAway(W, buildFam(), build.rk, build.sel); SFX.zip(); showToast(`${HB_ITEM[id].n} put away.`); patchBuild({ sel: null }); }}
      onDeselect={() => { patchBuild({ sel: null }); SFX.click(); }}
      onStyle={setStyle} onApply={applyStyle} onUndo={undoStyle} onDone={endBuild} />}
    {panel && panel.kind === 'clothes' && <ShopPanel people={rowIds()} me={me} outfits={dressed(W, outfits)} wardrobe={W.wardrobe} coins={W.coins} start={panel.cat} T={T} onBuy={shopBuy} onWear={(who, it) => shopWear(who, it)} onClose={() => { setPanel(null); SFX.zip(); }} />}
    {panel && panel.kind === 'fams' && <FamiliesPanel W={W} outfits={dressed(W, outfits)} here={W.out ? W.out.place : 'home'} onClose={() => { setPanel(null); SFX.zip(); }} onNew={() => setPanel({ kind: 'maker' })} onEdit={id => setPanel({ kind: 'maker', edit: id })} onAbout={id => setPanel({ kind: 'about', who: id, back: 'fams' })} onVisit={place => { setPanel({ kind: 'map', here: W.out ? W.out.place : 'home', picked: place }); later(W, 0.5, () => goPlace(place)); }} />}
    {panel && panel.kind === 'maker' && <CreatorPanel key={panel.edit || 'new'} W={W} T={T} edit={panel.edit} onClose={() => setPanel(panel.edit ? { kind: 'fams' } : null)} onMake={panel.edit ? (d, home) => savePerson(panel.edit, d, home) : makePerson} />}
    {panel && panel.kind === 'about' && <AboutPanel key={panel.who} W={W} who={panel.who} head={<HeadIcon who={panel.who} o={dressed(W, outfits)[panel.who] || DEFAULT_OUTFITS[panel.who]} size={30} />} onClose={() => { setPanel(panel.back ? { kind: panel.back } : null); SFX.zip(); }} />}
    {panel && panel.kind === 'petshop' && <PetShopPanel W={W} T={T} start={panel.cat} onClose={() => { setPanel(null); SFX.zip(); }} onAdopt={id => { const ok = adopt(W, id); if (ok) { const d = defOf({ id }); SFX.coins(); later(W, 0.3, () => SFX.fanfare()); showToast(`${d.name} is coming home!`); speak(`${d.name} is coming home with you!`, 'narrator'); } return ok; }} />}
    {panel && panel.kind === 'petfood' && <PetFoodPanel key={panel.ids.join()} W={W} ids={panel.ids} onClose={() => setPanel(null)} onFeed={f => petFeed(panel.ids, f)} />}
    {panel && panel.kind === 'townshop' && W.town.shops[panel.id] && <ShopBuyPanel W={W} sh={W.town.shops[panel.id]} onBuy={t => buyThing(W.town.shops[panel.id], t)} onClose={() => { setPanel(null); SFX.zip(); }} />}
    {panel && panel.kind === 'letter' && <LetterPanel W={W} onClose={() => { readLetter(W); setPanel(null); SFX.zip(); }} />}
    {panel && panel.kind === 'jobs' && <JobsPanel W={W} start={panel.tab} onClose={() => { setPanel(null); SFX.zip(); }} />}
    {petMenu && (() => {
      const pet = petMenu.pet && W.pets.find(q => q.id === petMenu.pet), h = petMenu.home;
      if (!pet && !h) return null;
      const ids = pet ? [pet.id] : petsIn(W, h).map(q => q.id);
      const at = pet ? [pet.x, pet.y, 0.9] : [...homeCenter(h), h === 'cage' || h === 'tree' ? 1.8 : 1.3];
      if (pet && pet.room !== R) return null;
      if (h && PET_HOMES[h].room !== R) return null;
      const s = toScreen(P(...at));
      const title = pet ? defOf(pet).name : ids.map(id => defOf({ id }).name).join(', ');
      const buttons = [{ label: 'Feed', icon: PM_ICONS.feed, go: () => { setPetMenu(null); setPanel({ kind: 'petfood', ids }); speak('What do they eat?', 'narrator'); } },
        { label: 'Cuddle', icon: PM_ICONS.cuddle, go: () => petCuddle(ids) }];
      if (pet) buttons.push({ label: 'Play', icon: PM_ICONS.play, go: () => { setPetMenu(null); playWith(W, pet, c); petFx.word(kindOf(pet) === 'dog' ? 'Woof woof!' : 'Meow!', P(pet.x, pet.y, 1.0)); later(W, 0.6, () => say(W, me, pick(['Good boy!', 'Wheee!', 'Catch!', 'Fetch!']))); } });
      if (h && h !== 'bed' && h !== 'tree') buttons.push({ label: 'Clean', icon: PM_ICONS.clean, go: () => petClean(h) });
      return <PetMenu x={clamp(s[0], 130, size.w - 130)} y={clamp(s[1] - 20, 120, size.h - 120)} title={title} buttons={buttons} onClose={() => setPetMenu(null)} />;
    })()}
    {pmenu && (() => { const p = W.people[pmenu.who]; if (!p || p.room !== R) return null; const s = toScreen(headAt(p)); const free = !W.hide && !p.busy && !(p.id === 'dad' && p.job) && p.mode !== 'lie';
      return <PersonMenu who={pmenu.who} x={clamp(s[0], 110, size.w - 110)} y={clamp(s[1] - 20, 120, size.h - 120)} canHide={free && !GRAND_HUGS[pmenu.who] && !isFolk(pmenu.who)} onClose={() => setPmenu(null)} onHug={() => hugPerson(pmenu.who)} onEdit={isFolk(pmenu.who) ? () => { setPmenu(null); setPanel({ kind: 'maker', edit: pmenu.who }); } : null} onAbout={() => { setPmenu(null); setPanel({ kind: 'about', who: pmenu.who }); }} onHide={() => { setPmenu(null); startHide(W, pmenu.who); }} />; })()}
    {W.hide && W.hide.phase === 'count' && T > W.hide.t0 && <div className="countdown">{Math.min(10, Math.floor((T - W.hide.t0) / 0.55) + 1)}</div>}
    {W.photo && W.photo.stage === 'count' && T - W.photo.t0 < 2.4 && <div className="countdown">{3 - Math.floor((T - W.photo.t0) / 0.8)}</div>}
    {W.photo && W.photo.stage === 'gather' && <div className="photo-bar" onPointerDown={e => e.stopPropagation()}><span>Everyone get together!</span><button className="done" onClick={snapPhoto}>Snap!</button><button className="pill" onClick={() => setPanel({ kind: 'album' })}>Photos</button><button className="pill" onClick={cancelPhoto}>Cancel</button></div>}
    {panel && panel.kind === 'magnets' && <MagnetPanel magnets={magnets} setMagnets={setMagnets} onMade={() => achieve(W, 'magnet')} onClose={() => { setPanel(null); W.flags.fridge = false; }} />}
    {panel && panel.kind === 'bbq' && <BurgerPanel outfits={outfits} onClose={() => { setPanel(null); endBbq(W); }} onMake={(layers, forWho) => { const it = { id: 'bg' + Math.round(W.T * 1000), kind: 'burger', layers, forWho, room: R, loc: { s: 'floor', x: c.x, y: c.y }, rot: 0 }; W.items.push(it); if (!toPack(it, headAt(c))) W.items = W.items.filter(x => x !== it); else { if (forWho) say(W, me, `A burger for ${NAMES[forWho]}!`); later(W, 1.5, () => achieve(W, 'burger')); } }} />}
    {panel && panel.kind === 'album' && <Album photos={photos} onClose={() => setPanel(null)} />}
    {panel && panel.kind === 'cafe' && <MenuPanel title="Menu" menu={CAFE_MENU} onClose={() => setPanel(null)} onPay={cafeOrder} />}
    {panel && panel.kind === 'lunch' && <MenuPanel title="Lunch" menu={LUNCH_MENU} free onClose={() => setPanel(null)} onPay={tray => { setPanel(null); tray.forEach((k, i) => later(W, i * 0.3, () => giveFood(k, {}, P(13.5, 10.3, 1.2)))); npcSay('lunch', 'Here you go! Enjoy your lunch.', [13.0, 9.75, 2.4], 'lady'); }} />}
    {panel && panel.kind === 'icecream' && <IceCreamPanel outfits={outfits} onClose={() => setPanel(null)} onMake={(scoops, sprinkles, forWho) => { SFX.coins(); giveFood('icecream', { scoops, sprinkles, forWho }, P(2.3, 10.4, 1.6)); npcSay('ices', 'Here you go!', [2.3, 10.5, 2.9], 'lady'); later(W, 2, () => achieve(W, 'icecream')); }} />}
    {panel && panel.kind === 'shelf' && W.shop && <ShelfPanel section={panel.section} basket={W.shop.basket} list={W.shop.list} onTake={shopTake} onClose={() => setPanel(null)} />}
    {panel && panel.kind === 'till' && W.shop && <CheckoutPanel basket={W.shop.basket} list={W.shop.list} T={T} t0={panel.t0} onPay={shopPay} onClose={() => setPanel(null)} />}
    {panel && panel.kind === 'map' && <TownMap W={W} build={panel.tb || null} onPlot={tbPlot} onThing={tbThing} onBuild={W.drive ? null : () => { setTb({}); speak('Tap a plus to build a shop!', 'narrator'); }} bar={panel.tb ? tbBar() : null} fams={Object.values(W.folk.fams).map(f => ({ ...f, look: houseLook(f.seed) }))} here={panel.here} picked={panel.picked} T={T} drive={W.drive} onPick={pickPlace} onGo={goPlace} onClose={() => { if (!W.drive) setPanel(null); }}>{panel.tb ? tbSheets() : null}</TownMap>}
    {panel && panel.kind === 'tree' && <TreePanel start={W.xm.tree} T={T} onClose={() => setPanel(null)} onDone={d => {
      setPanel(null); W.xm.tree = d; W.dirty = true; SFX.fanfare(); const at = P(TREE_AT[0], TREE_AT[1], 2.2);
      burst(W, 'spark', at, { n: 18, spread: 140 }); later(W, 0.2, () => wordFx('Sparkly!', at)); c.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
      const g = ['mum', 'dad'].find(k => W.people[k].room === 'living' && k !== me); if (g) later(W, 1.2, () => say(W, g, pick(['What a beautiful tree!', 'Wow! Look at the tree!', 'Best tree ever!'])));
      later(W, 3, () => achieve(W, 'tree'));
    }} />}
    {panel && panel.kind === 'pumpkin' && <PumpkinPanel start={W.hw.pumpkin} T={T} onClose={() => setPanel(null)} onDone={d => {
      setPanel(null); W.hw.pumpkin = d; W.dirty = true; SFX.sparkle(); const at = P(1.92, 0.4, 1.6);
      burst(W, 'spark', at, { n: 14, spread: 110 }); later(W, 0.2, () => wordFx('Spooky!', at)); c.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
      const mum = W.people.mum; if (mum.room === 'kitchen' && me !== 'mum') later(W, 1.2, () => say(W, 'mum', pick(['Ooh! So scary!', 'What a spooky pumpkin!', 'I love it!']))); later(W, 3, () => achieve(W, 'pumpkin'));
    }} />}
    {night > 0.3 && <div className="goodnight" style={{ opacity: night }} onClick={() => speak('Good night, Callie!', 'narrator')}><svg viewBox="0 0 60 60" width="70" height="70" aria-hidden="true"><circle cx="30" cy="30" r="22" fill="#fff6d8" /><circle cx="40" cy="24" r="20" fill="#2b2f55" /></svg><span>Good night, Callie!</span></div>}

    {panel && panel.kind === 'dress' && <DressUp people={rowIds()} outfits={dressed(W, outfits)} who={dressWho} setWho={setDressWho} T={T} uniform={W.uniform} onUniform={toggleUniform} wardrobe={W.wardrobe}
      onPick={(who, k, v) => { if (W.uniform[who]) { W.uniform[who] = false; W.dirty = true; } if (k === 'pattern' && v === 'leopard') setOutfits(o => ({ ...o, [who]: { ...o[who], color: '#d9a55b' } })); setOutfits(o => ({ ...o, [who]: { ...o[who], [k]: v } })); SFX.sparkle(); const p = W.people[who]; if (p.room === R && p.mode === 'stand') p.action = { kind: 'twirl', t0: W.T, dur: 0.7 }; }}
      onDone={() => setPanel(null)} />}
    {panel && panel.kind === 'box' && (() => {
      const B = CONTAINERS[panel.id], inside2 = inBox(panel.id);
      return <div className="sheet box" role="dialog" aria-label={B.word} onPointerDown={e => e.stopPropagation()}>
        <div className="box-head"><button className="room-chip" onClick={() => speak(B.word, 'word')}>{B.word}</button><button className="done" onClick={() => { setPanel(null); SFX.zip(); }}>Done</button></div>
        <div className="box-cols">
          <div><h3>Inside</h3><div className="slots">{inside2.length ? inside2.map(it => <button key={it.id} className="slot" onClick={() => { toPack(it, null); }}><ItemIcon it={it} size={46} /><small>{KINDS[it.kind] ? KINDS[it.kind].word : ''}</small></button>) : <span className="empty">Nothing in here.</span>}</div>
            {panel.id.startsWith('callie:') && inside2.length > 0 && <button className="pill" onClick={() => flingOut(panel.id)}>Tip it out!</button>}</div>
          <div><h3>My bag</h3><div className="slots">{pack.length ? pack.map(it => <button key={it.id} className="slot" onClick={() => { putIn(it, panel.id); speak(KINDS[it.kind] ? KINDS[it.kind].word : 'thing', 'word'); }}><ItemIcon it={it} size={46} /><small>{KINDS[it.kind] ? KINDS[it.kind].word : ''}</small></button>) : <span className="empty">My bag is empty.</span>}</div></div>
        </div>
      </div>;
    })()}
    {panel && panel.kind === 'fridge' && <div className="sheet fridge" role="dialog" aria-label="Make a sandwich" onPointerDown={e => e.stopPropagation()}>
      <div className="box-head"><button className="room-chip" onClick={() => speak('Make a sandwich!', 'narrator')}>Make a sandwich!</button><div className="pair"><button className="pill" onClick={() => { setPanel({ kind: 'magnets' }); speak('Fridge magnets', 'narrator'); }}>Magnets</button><button className="pill" onClick={() => { setPanel(null); W.flags.fridge = false; SFX.door(); }}>Close</button></div></div>
      <div className="fridge-body">
        <svg viewBox="-30 -36 60 46" width="120" height="92" aria-hidden="true"><Sandwich fillings={fillings} /></svg>
        <div className="choices">{FILLINGS.map(fl => <button key={fl} className="tile food" aria-pressed={fillings.includes(fl)} onClick={() => { speak(fl, 'word'); setFillings(f => f.includes(fl) ? f.filter(x => x !== fl) : f.length >= 2 ? [f[1], fl] : [...f, fl]); SFX.pop(); }}><svg viewBox="-16 -16 32 32" width="34" height="34"><circle r={13} fill={{ ham: '#f2a5a5', jam: '#c4304f', egg: '#fff6e0', cheese: '#f7c948', tuna: '#d9c7a8' }[fl]} stroke="rgba(0,0,0,.15)" />{fl === 'egg' && <circle r={6} fill="#ffd23f" />}</svg><span>{fl}</span></button>)}</div>
        <button className="done" onClick={() => { const it = { id: 's' + Math.round(W.T * 1000), kind: 'sandwich', fillings, room: R, loc: { s: 'floor', x: c.x, y: c.y }, rot: 0 }; W.items.push(it); if (toPack(it, headAt(c))) { setFillings([]); } else W.items = W.items.filter(x => x !== it); }}>Make it!</button>
      </div>
    </div>}
    {panel && panel.kind === 'paint' && <PaintPanel onClose={() => setPanel(null)} onDone={src => { const next = [...paintings, src].slice(-6); setPaintings(next); store(PAINT_KEY, next); setPanel(null); SFX.fanfare(); showToast('Lovely painting!'); say(W, me, 'I made a painting!'); c.action = { kind: 'cheer', t0: W.T, dur: 1.2 }; later(W, 2.5, () => achieve(W, 'paint')); }} />}
  </>;
}

createRoot(document.getElementById('app')).render(<App />);
