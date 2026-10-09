// New people made with the character maker, the families they belong to, and the houses they live in.
import React, { useState } from 'react';
import { rand, pick, dist, SFX, speak, VOICES } from './core.js';
import { BODY, HAIR, NAMES, DEFAULT_OUTFITS, OPTIONS, Person, HeadIcon } from './people.jsx';
import { nav, walkTo, travel, sitOn, say, later, SEATS, player } from './world.js';
import { ROOMS } from './rooms.jsx';
import { buildHouse, houseLook, houseRooms, entryRoom, makePlan, HOUSE_TYPES } from './homes.jsx';
import { HouseIcon } from './builder.jsx';
import { PLACES, ORDER, freePlot, plotGeo, growTown } from './town.jsx';
import { helloLine, personaOf, randomTraits, randomLikes, TraitPicker } from './personality.jsx';

export const CALLIE_FAM = ['callie', 'chloe', 'mum', 'dad', 'connor'];
const HOME_ROOMS = ['living', 'kitchen', 'middle', 'garden', 'downhall'];

export const BODIES = {
  kid: { word: 'child', L: 34, T: 40, R: 22, sw: 30, hw: 30, legW: 9, kid: true },
  teen: { word: 'teen', L: 46, T: 48, R: 22, sw: 32, hw: 30, legW: 9, kid: true },
  adult: { word: 'grown-up', L: 68, T: 58, R: 20, sw: 38, hw: 36, legW: 10 },
  tall: { word: 'tall', L: 74, T: 64, R: 21, sw: 46, hw: 40, legW: 12 },
};
export const SKINS = ['#f6d2b8', '#f0c9a8', '#e0ac85', '#c68b62', '#a0694a', '#6e4630'];
export const HAIRS = ['pony', 'long', 'short', 'curly', 'curtains', 'bald'];
export const HAIR_COLS = ['#c49a5e', '#e2c48a', '#6b4a33', '#2b1d16', '#b5452a', '#d4d0c8', '#f49ac1', '#5bb8ff', '#9b7cc4'];
const BRIGHT = ['#e86a92', '#5b9bd5', '#7cc9a8', '#f2b84b', '#b58ee0', '#ef6f5e', '#3d3f6b', '#2f7f86', '#2b2b2e'];
export const TOPS = ['tee', 'dress', 'hoodie', 'jumper', 'flannel'];
export const NAME_IDEAS = ['MIA', 'LEO', 'ZOE', 'MAX', 'AVA', 'SAM', 'LILY', 'TOM', 'EVIE', 'JACK', 'RUBY', 'BEN', 'ELLA', 'ALFIE', 'ROSA', 'FINN', 'IVY', 'OLLIE', 'POPPY', 'TED'];

export const isFolk = id => /^f\d+$/.test(id);
export const folkDef = (W, id) => W.folk && W.folk.people[id];

/* ---------------- registering a person with the game ---------------- */
export function registerPerson(def) {
  const B = BODIES[def.body] || BODIES.kid;
  BODY[def.id] = { L: B.L, T: B.T, R: B.R, sw: B.sw, hw: B.hw, legW: B.legW, kid: !!B.kid, skin: def.skin, hair: def.hair, glasses: !!def.glasses,
    beard: def.beard && !B.kid ? def.hairCol : undefined, sides: def.hair === 'bald' ? def.hairCol : undefined };
  HAIR[def.id] = def.hairCol; NAMES[def.id] = def.name;
  DEFAULT_OUTFITS[def.id] = def.outfit;
  const base = B.kid ? OPTIONS.callie : OPTIONS.mum;
  OPTIONS[def.id] = { ...base, top: TOPS, hair: HAIR_COLS };
  const kidV = def.body === 'kid' ? 1.6 : def.body === 'teen' ? 1.3 : 1.12;
  VOICES[def.id] = { pitch: def.voice === 'low' ? kidV * 0.62 : kidV, rate: 0.94 };
}
export function outfitFor(body, top, color) {
  const kid = body === 'kid' || body === 'teen';
  return { top, color, pattern: 'plain', legs: kid ? pick(['#9b7cc4', '#5b9bd5', '#3d3f6b', '#e86a92']) : pick(['#4f6d8f', '#2f4a6b', '#2b2b2e', '#7d848c']), bottom: kid ? 'leggings' : 'jeans', shoes: pick(['#fbf8f2', '#2b2b2e', '#e96d9a', '#5b9bd5']), acc: 'none' };
}
const blank = (id, room, x, y) => ({ id, room, x, y, z: 0, mode: 'stand', path: null, then: null, facing: 'front', flip: false, walkPhase: 0, action: null, op: 1, speed: 1.9, holding: null, nextAct: 0 });
const homeRooms = (W, def) => (def.fam === 'home' ? HOME_ROOMS : W.folk.fams[def.fam] ? houseRooms(W.folk.fams[def.fam]) : HOME_ROOMS);
export function placeAtHome(W, id) {
  const def = folkDef(W, id); if (!def) return;
  const rid = homeRooms(W, def)[0], [x, y] = nav(rid).randomFree(1)[0];
  const p = W.people[id] || (W.people[id] = blank(id, rid, x, y));
  Object.assign(p, { room: rid, x, y, z: 0, mode: 'stand', path: null, goal: null, then: null, busy: null, op: 1, seatStand: null, bed: null, reading: null, action: null, nextAct: (W.T || 0) + rand(4, 12) });
}

/* ---------------- families and houses ---------------- */
export function registerFamily(fam) {
  buildHouse(fam);
  placeFamily(fam);
  if (!ORDER.includes('h:' + fam.id)) ORDER.push('h:' + fam.id);
}
// where the house is on the map (also used after moving it)
export function placeFamily(fam) {
  const g = plotGeo(fam.plot);
  PLACES['h:' + fam.id] = { word: fam.name, say: `${fam.name}'s house`, door: g.door, road: g.road, pin: g.pin, room: entryRoom(fam), street: true, fam: fam.id };
}
export function initFolk(W, saved) {
  W.folk = (saved && saved.folk) || { n: 0, people: {}, fams: {} };
  for (const fam of Object.values(W.folk.fams)) registerFamily(fam);
  for (const def of Object.values(W.folk.people)) { registerPerson(def); placeAtHome(W, def.id); }
}
export { freePlot };
// Make a new person. fam: 'new' (a new house), 'home' (Callie's house) or an existing family id.
export function createPerson(W, d, famChoice) {
  const n = ++W.folk.n, id = 'f' + n;
  let fam = famChoice;
  if (famChoice === 'new') {
    const plot = freePlot(W); if (plot == null) return null;
    fam = 'h' + n;
    const seed = Math.floor(Math.random() * 1e9);
    W.folk.fams[fam] = { id: fam, name: d.name, seed, plot, members: [], plan: makePlan(d.house || 'terrace', seed) };
    registerFamily(W.folk.fams[fam]); growTown(W);
  }
  const def = { ...d, id, fam };
  W.folk.people[id] = def;
  if (fam !== 'home') W.folk.fams[fam].members.push(id);
  registerPerson(def); placeAtHome(W, id);
  W.dirty = true;
  return def;
}
// Change someone after they were made: looks, name, voice, clothes, and which house they live in.
export function editPerson(W, id, d, famChoice) {
  const def = folkDef(W, id); if (!def) return null;
  const oldName = def.name, oldFam = def.fam;
  Object.assign(def, { name: d.name, body: d.body, skin: d.skin, hair: d.hair, hairCol: d.hairCol, glasses: d.glasses, beard: d.beard, voice: d.voice, top: d.top, color: d.color, traits: d.traits, likes: d.likes });
  def.outfit = { ...def.outfit, top: d.top, color: d.color };
  // a family named after this person takes the new name too
  if (oldFam !== 'home' && W.folk.fams[oldFam] && W.folk.fams[oldFam].name === oldName && oldName !== d.name) {
    const fam = W.folk.fams[oldFam]; fam.name = d.name;
    const pl = PLACES['h:' + fam.id]; if (pl) { pl.word = d.name; pl.say = `${d.name}'s house`; }
  }
  let to = famChoice || oldFam;
  if (to === 'new') {
    const plot = freePlot(W);
    if (plot == null) to = oldFam;
    else { const n = ++W.folk.n, seed = Math.floor(Math.random() * 1e9); to = 'h' + n; W.folk.fams[to] = { id: to, name: d.name, seed, plot, members: [], plan: makePlan(d.house || 'terrace', seed) }; registerFamily(W.folk.fams[to]); growTown(W); }
  }
  if (to !== oldFam) {
    if (oldFam !== 'home' && W.folk.fams[oldFam]) W.folk.fams[oldFam].members = W.folk.fams[oldFam].members.filter(m => m !== id);
    if (to !== 'home') W.folk.fams[to].members.push(id);
    def.fam = to;
  }
  registerPerson(def);
  W.dirty = true;
  return { def, moved: to !== oldFam };
}
export function familyOf(W, id) {
  const def = folkDef(W, id);
  const homeJoin = Object.values(W.folk.people).filter(p => p.fam === 'home').map(p => p.id);
  if (def && def.fam !== 'home') return [...W.folk.fams[def.fam].members];
  return [...CALLIE_FAM, ...homeJoin];
}
export const placeOfRoom = rid => (ROOMS[rid] && ROOMS[rid].place) || null;

/* ---------------- what they get up to ---------------- */
export function stepFolk(W) {
  if (!W.folk) return;
  const me = player(W), party = (W.out && W.out.party) || [];
  for (const def of Object.values(W.folk.people)) {
    const p = W.people[def.id];
    if (!p || p.id === W.player || party.includes(p.id) || !p.room) continue;
    const rooms = homeRooms(W, def);
    if (!rooms.includes(p.room)) continue;
    // say hello when someone comes into the room
    if (p.room === W.room && W.T - (p.helloT || -99) > 60 && me && me.room === W.room && dist([me.x, me.y], [p.x, p.y]) < 3) {
      p.helloT = W.T; later(W, 0.4, () => { if (p.room === W.room) { say(W, p.id, helloLine(W, p.id)); if (p.mode === 'stand') p.action = { kind: 'wave', t0: W.T, dur: 1.4 }; } });
    }
    if (p.goal || p.busy || p.mode === 'walk' || p.mode === 'hop' || p.mode === 'lie' || W.T < (p.nextAct || 0)) continue;
    if (p.hugT && W.T - p.hugT < 6) { p.nextAct = W.T + 4; continue; }
    p.nextAct = W.T + rand(12, 26);
    if (p.mode === 'sit') { p.mode = 'stand'; p.z = 0; if (p.seatStand) { p.x = p.seatStand[0]; p.y = p.seatStand[1]; } p.seatStand = null; }
    const r = Math.random();
    // chatty people come and find you
    if (r < 0.3 && personaOf(W, p.id).t.chat >= 3 && rooms.includes(W.room) && W.room !== p.room && Math.random() < 0.6) { const t = nav(W.room).randomFree(1)[0]; travel(W, p, { room: W.room, x: t[0], y: t[1] }); continue; }
    if (r < 0.25) { const to = pick(rooms.filter(x => x !== p.room)); const t = nav(to).randomFree(1)[0]; travel(W, p, { room: to, x: t[0], y: t[1] }); continue; }
    const seats = Object.keys(SEATS).filter(k => k.startsWith(p.room + ':')).map(k => SEATS[k]).filter(s => !Object.values(W.people).some(q => q !== p && q.room === p.room && q.mode === 'sit' && dist([q.x, q.y], s.seat) < 0.4));
    if (r < 0.55 && seats.length) { sitOn(W, p, pick(seats)); continue; }
    const t = nav(p.room).randomFree(1)[0]; walkTo(W, p, t[0], t[1]);
  }
}

/* ---------------- the character maker ---------------- */
export function Keyboard({ onKey }) {
  const rows = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];
  return <div className="kb">{rows.map(r => <div key={r} className="kb-row">{r.split('').map(ch => <button key={ch} className="kb-key" onClick={() => onKey(ch)}>{ch}</button>)}{r === 'VWXYZ' && <button className="kb-key wide" onClick={() => onKey('<')} aria-label="Delete a letter">⌫</button>}</div>)}</div>;
}
export const prettyName = s => (s ? s[0] + s.slice(1).toLowerCase() : '');
export function CreatorPanel({ W, T, onMake, onClose, edit }) {
  const old = edit ? folkDef(W, edit) : null;
  const [d, setD] = useState(() => old ? { name: old.name.toUpperCase(), body: old.body, skin: old.skin, hair: old.hair, hairCol: old.hairCol, glasses: !!old.glasses, beard: !!old.beard, voice: old.voice || 'high', top: old.top || (old.outfit && old.outfit.top) || 'tee', color: old.color || (old.outfit && old.outfit.color) || BRIGHT[0], traits: old.traits || randomTraits(), likes: old.likes || randomLikes() }
    : { name: '', body: 'kid', skin: pick(SKINS), hair: pick(['pony', 'long', 'short', 'curly']), hairCol: pick(HAIR_COLS.slice(0, 5)), glasses: false, beard: false, voice: 'high', top: pick(['tee', 'dress', 'hoodie']), color: pick(BRIGHT), traits: randomTraits(), likes: randomLikes() });
  const [home, setHome] = useState(old ? old.fam : freePlot(W) != null ? 'new' : 'home');
  const [house, setHouse] = useState('terrace');
  const set = (k, v, word) => { setD(o => ({ ...o, [k]: v })); if (word) speak(word, 'word'); SFX.pop(); };
  const name = prettyName(d.name);
  const outfit = { top: d.top, color: d.color, pattern: 'plain', legs: d.body === 'kid' || d.body === 'teen' ? '#9b7cc4' : '#4f6d8f', bottom: 'jeans', shoes: '#fbf8f2', acc: 'none' };
  registerPerson({ ...d, id: '__new', name: name || 'New', outfit });
  const B = BODY.__new, hTot = B.L + B.T + B.R * 2 + 34;
  const pose = { mode: 'stand', facing: 'front', flip: false, walk: null, armL: 10 + Math.sin(T * 2) * 4, armR: 10 - Math.sin(T * 2) * 4, blink: T % 3.3 < 0.12 ? 1 : 0, mouthOpen: false };
  const key = ch => { if (ch === '<') { setD(o => ({ ...o, name: o.name.slice(0, -1) })); SFX.click(); return; } if (d.name.length >= 10) return; setD(o => ({ ...o, name: o.name + ch })); speak(ch.toLowerCase(), 'word'); };
  const fams = Object.values(W.folk.fams);
  const adult = d.body === 'adult' || d.body === 'tall';
  const sw = (k, list) => <div className="choices">{list.map(v => <button key={v} className="sw" style={{ '--c': v }} aria-pressed={d[k] === v} aria-label={k} onClick={() => set(k, v)} />)}</div>;
  const hairIcon = h => { registerPerson({ ...d, hair: h, id: '__h' + h, name: 'x', outfit }); return <HeadIcon who={'__h' + h} o={outfit} size={40} />; };
  return <div className="sheet maker" role="dialog" aria-label="Make a new person" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(old ? `Change ${old.name}` : 'Make a new person!', 'narrator')}>{old ? `Change ${prettyName(old.name.toUpperCase())}` : 'Make a new person!'}</button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="dress-body">
      <div className="preview">
        <svg viewBox={`-70 ${-hTot} 140 ${hTot + 16}`} aria-hidden="true"><ellipse cx={0} cy={4} rx={50} ry={10} fill="rgba(90,60,30,.12)" /><Person who="__new" o={outfit} pose={pose} T={T} uid="maker" /></svg>
        <button className={'name-big' + (name ? '' : ' empty')} onClick={() => name && speak(name, 'word')}>{name || 'Name?'}</button>
      </div>
      <div className="opts">
        <div className="opt-row"><h3>Name</h3><Keyboard onKey={key} /><div className="pair"><button className="pill" onClick={() => { const n = pick(NAME_IDEAS); setD(o => ({ ...o, name: n })); speak(prettyName(n), 'word'); }}>Mix a name</button>{name && <button className="pill" onClick={() => speak(`Hello! I am ${name}!`, '__new')}>Say hello</button>}</div></div>
        <div className="opt-row"><h3>Who</h3><div className="choices">{Object.entries(BODIES).map(([k, b]) => <button key={k} className="tile word-tile" aria-pressed={d.body === k} onClick={() => set('body', k, b.word)}>{b.word}</button>)}</div></div>
        <div className="opt-row"><h3>Skin</h3>{sw('skin', SKINS)}</div>
        <div className="opt-row"><h3>Hair</h3><div className="choices">{HAIRS.map(h => <button key={h} className="tile" aria-pressed={d.hair === h} aria-label={h} onClick={() => set('hair', h)}>{hairIcon(h)}</button>)}</div>{sw('hairCol', HAIR_COLS)}</div>
        <div className="opt-row"><h3>Face</h3><div className="choices">
          <button className="tile word-tile" aria-pressed={d.glasses} onClick={() => set('glasses', !d.glasses, 'glasses')}>glasses</button>
          {adult && <button className="tile word-tile" aria-pressed={d.beard} onClick={() => set('beard', !d.beard, 'beard')}>beard</button>}
          <button className="tile word-tile" aria-pressed={d.voice === 'high'} onClick={() => { set('voice', 'high'); later0(() => speak(`Hello! I am ${name || 'new'}!`, '__new')); }}>high voice</button>
          <button className="tile word-tile" aria-pressed={d.voice === 'low'} onClick={() => { set('voice', 'low'); later0(() => speak(`Hello! I am ${name || 'new'}!`, '__new')); }}>low voice</button>
        </div></div>
        <div className="opt-row"><h3>Clothes</h3><div className="choices">{TOPS.map(t => <button key={t} className="tile word-tile" aria-pressed={d.top === t} onClick={() => set('top', t, t === 'tee' ? 'T-shirt' : t === 'flannel' ? 'shirt' : t)}>{t === 'tee' ? 'T-shirt' : t === 'flannel' ? 'shirt' : t}</button>)}</div>{sw('color', BRIGHT)}</div>
        <div className="opt-row"><h3>Personality</h3><TraitPicker t={d.traits} likes={d.likes} who={name} onT={t => setD(o => ({ ...o, traits: t }))} onLikes={l => setD(o => ({ ...o, likes: l }))} /></div>
        <div className="opt-row"><h3>Home</h3><div className="choices">
          <button className="tile word-tile" disabled={freePlot(W) == null} aria-pressed={home === 'new'} onClick={() => { setHome('new'); speak('A new house!', 'narrator'); }}>new house</button>
          <button className="tile word-tile" aria-pressed={home === 'home'} onClick={() => { setHome('home'); speak("Callie's house", 'narrator'); }}>Callie's house</button>
          {fams.map(f => <button key={f.id} className="tile word-tile fam-tile" aria-pressed={home === f.id} onClick={() => { setHome(f.id); speak(`${f.name}'s house`, 'narrator'); }}><span className="fam-heads">{f.members.slice(0, 3).map(m => <HeadIcon key={m} who={m} o={DEFAULT_OUTFITS[m]} size={22} />)}</span>{f.name}'s</button>)}
        </div>{freePlot(W) == null && <small className="note">The town is full, so pick a family to join.</small>}
        {home === 'new' && <div className="type-row">{Object.entries(HOUSE_TYPES).map(([k, t]) => <button key={k} className="type-tile" aria-pressed={house === k} onClick={() => { setHouse(k); speak(t.name, 'word'); SFX.pop(); }}><HouseIcon type={k} size={54} /><b>{t.name}</b><small>{t.note}</small></button>)}</div>}</div>
        <button className="done make-go" disabled={!name} onClick={() => onMake({ ...d, name, house, outfit: outfitFor(d.body, d.top, d.color) }, home)}>{!name ? 'Type a name first' : old ? `Save ${name}!` : `Make ${name}!`}</button>
      </div>
    </div>
  </div>;
}
const later0 = f => setTimeout(f, 120);

/* ---------------- families: who lives where ---------------- */
export function FamiliesPanel({ W, outfits, here, onVisit, onNew, onEdit, onAbout, onClose }) {
  const [editing, setEditing] = useState(false);
  const homeJoin = Object.values(W.folk.people).filter(p => p.fam === 'home').map(p => p.id);
  const fams = [{ id: 'home', place: 'home', name: 'Callie', members: [...CALLIE_FAM, ...homeJoin], look: { wall: '#e2b06a', roof: '#9a4a3a' } },
    ...Object.values(W.folk.fams).map(f => ({ id: f.id, place: 'h:' + f.id, name: f.name, members: f.members, look: houseLook(f.seed), type: f.plan ? f.plan.type : 'house' }))];
  return <div className="sheet families" role="dialog" aria-label="Families" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Families', 'word')}>Families</button><button className="done" onClick={onClose}>Done</button></div>
    <div className="fam-list">
      {fams.map(f => <div key={f.id} className="fam-card">
        {f.type ? <HouseIcon type={f.type} size={46} /> : <svg viewBox="-30 -34 60 50" width="46" height="40" aria-hidden="true"><path d="M-24,-6 L0,-28 L24,-6Z" fill={f.look.roof} /><rect x={-20} y={-7} width={40} height={22} fill={f.look.wall} /><rect x={-5} y={2} width={10} height={13} fill="#5a3d32" /></svg>}
        <button className="fam-name" onClick={() => speak(`${f.name}'s house`, 'narrator')}>{f.name}'s house</button>
        <span className="fam-heads">{f.members.map(m => { const can = editing; return <button key={m} className={'fam-head' + (can ? ' can-edit' : '')} onClick={() => { speak(NAMES[m], 'word'); if (can) { if (isFolk(m)) onEdit(m); else onAbout(m); } }} aria-label={can ? `Change ${NAMES[m]}` : NAMES[m]}><HeadIcon who={m} o={outfits[m] || DEFAULT_OUTFITS[m]} size={34} /><small>{NAMES[m]}</small>{can && <span className="pencil" aria-hidden="true">✎</span>}</button>; })}</span>
        {here === f.place ? <span className="here">You are here</span> : <button className="pill" onClick={() => onVisit(f.place)}>Visit</button>}
      </div>)}
    </div>
    <div className="pair fam-actions">{<button className={'pill' + (editing ? ' on' : '')} aria-pressed={editing} onClick={() => { setEditing(e => !e); speak(editing ? 'Done' : 'Tap someone to change them', 'narrator'); }}>{editing ? 'Stop changing' : 'Change someone'}</button>}<button className="done make-go" onClick={onNew}>Make a new person</button></div>
    {editing && <small className="note">Tap someone with a pencil to change them.</small>}
  </div>;
}
