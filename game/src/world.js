// Game world: people, walking between rooms, story events, spiders, timers.
import { makeNav, lerp, clamp, prog, arc, rand, pick, dist, SFX, speak, achieve } from './core.js';
import { ROOMS, DOORMAP, route, doorTo, roomLayers, CONTAINERS, startItems } from './rooms.jsx';
import { HUNT_ORDER, SURPRISES, KINDS } from './items.jsx';

const navCache = {};
let extraBlocks = {};
export function nav(rid) {
  if (!navCache[rid]) { const L = roomLayers(rid); navCache[rid] = makeNav({ bounds: ROOMS[rid].bounds, blocks: L.blocks.concat(extraBlocks[rid] || []) }); }
  return navCache[rid];
}
export const resetNav = rid => { delete navCache[rid]; };
// things put down while playing (pet beds, tanks...) that people walk round
export function setExtraBlocks(by) {
  for (const r of new Set([...Object.keys(extraBlocks), ...Object.keys(by)])) delete navCache[r];
  extraBlocks = by;
}

export const HOMES = {
  mum: { room: 'kitchen', x: 4.55, y: 1.15, face: 'back' },
  dad: { room: 'living', x: 2.2, y: 3.05, seat: [3.15, 4.7, 0.42], face: 'back' },
  chloe: { room: 'chloe', x: 2.35, y: 1.55, face: 'front' },
};
export const player = W => W.people[W.player];
export const inHouse = p => !!(p.room && ROOMS[p.room]);
// Beds anyone can lie on: where to stand, where to lie (x, y, height), which way the head points on screen.
export const BEDS = {
  'callie:bed': { room: 'callie', stand: [2.3, 2.45], lie: [2.25, 1.05, 0.95], rot: -62, blanket: '#f6eef1' },
  'parents:DoubleBed': { room: 'parents', stand: [5.9, 3.15], lie: [5.5, 5.0, 0.95], rot: 118, blanket: '#cfdcd6' },
  'chloe:StorageBed': { room: 'chloe', stand: [1.75, 1.65], lie: [0.72, 1.45, 0.86], rot: 58, blanket: '#2f4a6b' },
  'nannyup:BedX': { room: 'nannyup', stand: [2.4, 2.8], lie: [1.4, 1.7, 0.6], rot: -62, blanket: '#6f97c2' },
  'nannyup:BedX#2': { room: 'nannyup', stand: [2.3, 11.4], lie: [1.6, 9.8, 0.62], rot: -62, blanket: '#e3b08a' },
  'nannyup:BedY': { room: 'nannyup', stand: [13.6, 10.3], lie: [14.75, 9.6, 0.62], rot: 58, blanket: '#f39ac6' },
};
export const SEATS = {
  'living:BlueLSofa': { stand: [2.2, 3.05], seat: [2.2, 4.75, 0.42], face: 'back' },
  'living:GreenSofa': { stand: [5.35, 3.7], seat: [6.15, 3.7, 0.42], face: 'back', flip: true },
  'garden:RattanSofa': { stand: [8.75, 2.75], seat: [8.75, 1.75, 0.42], face: 'front' },
  'garden:RattanChair': { stand: [5.6, 2.05], seat: [5.62, 1.42, 0.42], face: 'front' },
  'garden:RattanChair#2': { stand: [7.72, 2.05], seat: [7.72, 1.42, 0.42], face: 'front' },
  'middle:OfficeChair': { stand: [1.16, 2.35], seat: [1.16, 1.75, 0.4], face: 'front' },
  'cafe:Chair': { stand: [2.5, 2.69], seat: [2.04, 2.69, 0.5], face: 'back', flip: true },
  'cafe:Chair#2': { stand: [2.5, 4.99], seat: [2.04, 4.99, 0.5], face: 'back', flip: true },
  'cafe:Chair#5': { stand: [5.15, 3.03], seat: [5.69, 3.03, 0.5], face: 'front', flip: true },
  'cafe:Chair#6': { stand: [6.39, 4.3], seat: [6.39, 3.64, 0.5], face: 'back', flip: true },
  'cafe:WindowBench': { stand: [1.1, 3.9], seat: [0.38, 3.9, 0.6], face: 'front' },
  'park:Bench#3': { stand: [2.05, 11.4], seat: [1.3, 11.52, 0.45], face: 'front', flip: true },
  'park:Bench#2': { stand: [11.75, 9.55], seat: [11.75, 8.92, 0.45], face: 'front', flip: true },
  'park:Bench': { stand: [15.3, 9.25], seat: [15.3, 8.62, 0.45], face: 'front', flip: true },
  'nannydown:LeatherSofa': { stand: [3.6, 9.75], seat: [3.6, 8.6, 0.57], face: 'front', flip: true },
  'nannydown:BigArmchair': { stand: [5.8, 11.6], seat: [5.8, 12.75, 0.59], face: 'back' },
  'nannydown:Armchair': { stand: [14.7, 12.95], seat: [14.7, 12.05, 0.52], face: 'front', flip: true },
  'nannydown:ChintzSofa': { stand: [16.2, 9.15], seat: [16.2, 8.25, 0.54], face: 'front', flip: true },
  'nannyup:Armchair': { stand: [8.6, 13.1], seat: [7.6, 13.1, 0.52], face: 'front', flip: true },
  'nannygarden:Seating': { stand: [1.1, 1.5], seat: [0.5, 1.5, 0.53], face: 'front' },
  'school:PlayBench': { stand: [27.85, 15.4], seat: [27.1, 15.42, 0.45], face: 'front', flip: true },
};

function person(id, room, x, y, extra = {}) {
  return { id, room, x, y, z: 0, mode: 'stand', path: null, then: null, facing: 'front', flip: false, walkPhase: 0, action: null, op: 1, speed: id === 'callie' ? 2.3 : 2.15, holding: null, ...extra };
}

export function newWorld(save) {
  const items = save && Array.isArray(save.items) ? mergeItems(save.items) : startItems();
  const W = {
    T: 0, room: 'callie',
    people: {
      callie: person('callie', 'callie', 6.5, 0.6, { op: 0 }),
      chloe: person('chloe', 'chloe', HOMES.chloe.x, HOMES.chloe.y, { home: true }),
      mum: person('mum', 'kitchen', HOMES.mum.x, HOMES.mum.y, { facing: 'back' }),
      dad: person('dad', 'living', HOMES.dad.seat[0], HOMES.dad.seat[1], { z: HOMES.dad.seat[2], mode: 'sit', facing: 'back', seat: 'dad' }),
      connor: person('connor', 'connorRoom', 0.975, 0.45),
    },
    player: 'callie', prevPlayer: 'callie',
    items,
    spiders: [],
    flags: {
      lights: save ? save.lights !== false : true, blind: save ? !!save.blind : false, tv: false, cooking: false, myDoor: true,
      lunch: false, livingTV: true, fire: false, fridge: false, hob: false, ladder: 0, eyes: 'hidden', bbq: 0,
    },
    anim: {}, fx: [], bubbles: [], timers: [], mice: [],
    chloeDoor: null, connorDoor: null, shower: -99, mirrorFog: -99, doodles: [], flush: null, washer: -99, kettle: -99, micro: -99, music: -99, tap: -99, leaves: -99,
    ball: { x: 6.5, y: 4.8, vx: 0, vy: 0, z: 0, vz: 0 }, parcel: null,
    hunt: save && save.hunt ? save.hunt : { idx: 0, done: [] },
    nextCeiling: 6, nextMuffle: 18, nextSpider: 25, nextBell: 110, bedtime: null, fade: null, shake: 0, sleepT: 0,
    dirty: false, tidyWas: 0,
  };
  W.tidyWas = W.items.filter(isTidy).length;
  return W;
}
function mergeItems(saved) {
  const base = startItems(); const byId = Object.fromEntries(saved.map(s => [s.id, s]));
  const out = base.map(it => (byId[it.id] ? { ...it, ...byId[it.id] } : it));
  for (const s of saved) if (!out.find(o => o.id === s.id)) out.push(s);
  return out;
}
export const isTidy = it => it.home && it.loc.s === 'in' && it.loc.box === it.home;
export const TIDY_TOTAL = 14;

/* ---------------- timers, bubbles, fx ---------------- */
export const later = (W, d, fn) => W.timers.push({ at: W.T + d, fn });
let bubbleId = 0;
export function say(W, who, text, anchor, opts = {}) {
  if (W.out && anchor && (anchor.type === 'off' || anchor.type === 'ceiling')) return { id: -1 };
  const b = { id: ++bubbleId, who, text, anchor: anchor || { type: 'person', id: who }, t0: W.T, dur: opts.dur || Math.max(2.6, 1.2 + text.split(' ').length * 0.55), style: opts.style || 'say', spoken: false, quiet: !!opts.quiet };
  W.bubbles = W.bubbles.filter(x => !(x.anchor.type === b.anchor.type && x.anchor.id === b.anchor.id && b.anchor.type === 'person'));
  W.bubbles.push(b);
  return b;
}
export const burst = (W, kind, at, extra = {}) => W.fx.push({ kind, at, t0: W.T, room: W.room, ...extra });
export const wiggle = (W, key, kind = 'wiggle') => { W.anim[W.room + ':' + key] = { kind, t0: W.T }; };

/* ---------------- moving people ---------------- */
export function walkTo(W, p, x, y, then) {
  if (p.mode === 'lie') { hopOffBed(W, p, () => walkTo(W, p, x, y, then)); return; }
  if (p.mode === 'hop') { p.queue = () => walkTo(W, p, x, y, then); return; }
  if (p.mode === 'sit') standUp(p);
  if (!p.room) return;
  const path = nav(p.room).findPath([p.x, p.y], [x, y]);
  p.action = null; p.task = null; p.mode = 'walk'; p.path = path.map(q => [q[0], q[1], 0]); p.then = then || null; p.scripted = false;
}
export function scripted(p, pts, then, opts = {}) {
  p.mode = 'walk'; p.path = pts.map(q => [...q]); p.then = then || null; p.scripted = true; p.fadeOut = !!opts.fadeOut; p.fadeIn = !!opts.fadeIn;
  p.segTotal = 0; for (let i = 0; i < pts.length; i++) p.segTotal += dist(i ? pts[i - 1] : [p.x, p.y], pts[i]) + Math.abs((pts[i][2] || 0) - (i ? pts[i - 1][2] || 0 : p.z));
  p.segDone = 0;
}
function standUp(p) {
  if (p.mode !== 'sit') return;
  if (p.seatStand) { p.x = p.seatStand[0]; p.y = p.seatStand[1]; }
  p.z = 0; p.mode = 'stand'; p.seat = null; p.seatStand = null;
}
export function sitOn(W, p, seat) {
  walkTo(W, p, seat.stand[0], seat.stand[1], () => {
    p.mode = 'hop'; p.hop = { from: [p.x, p.y, 0], to: seat.seat, t0: W.T, dur: 0.45, end: 'sit' };
    p.seatStand = seat.stand; p.sitFace = seat.face; p.sitFlip = !!seat.flip; SFX.boing();
  });
}
export function hopOnBed(W, p, bedId = 'callie:bed') {
  const bed = BEDS[bedId];
  walkTo(W, p, bed.stand[0], bed.stand[1], () => {
    p.mode = 'hop'; p.bed = bedId; p.hop = { from: [p.x, p.y, 0], to: bed.lie, t0: W.T, dur: 0.55, end: 'lie' };
    p.tabletOn = p.id === 'callie' && bedId === 'callie:bed'; p.tablet = 0; p.sleep = false; p.darkT = 0; SFX.boing();
  });
}
export function hopOffBed(W, p, then) {
  const bed = BEDS[p.bed || 'callie:bed'];
  p.mode = 'hop'; p.sleep = false;
  p.hop = { from: [p.x, p.y, p.z], to: [bed.stand[0], bed.stand[1], 0], t0: W.T, dur: 0.5, end: 'stand' };
  p.queue = then || null; p.bed = null; SFX.boing();
  if (W.bedtime) cancelBedtime(W);
}

export function stepPerson(W, p, dt) {
  const T = W.T;
  if (p.mode === 'walk' && p.path) {
    let remaining = p.speed * (p.scripted ? 0.85 : 1) * dt;
    while (remaining > 0 && p.path.length) {
      const tgt = p.path[0], dx = tgt[0] - p.x, dy = tgt[1] - p.y, dz = (tgt[2] ?? p.z) - p.z;
      const d = Math.hypot(dx, dy, dz);
      if (Math.hypot(dx, dy) > 1e-3) { const sdx = (dx - dy), sdy = (dx + dy); p.flip = sdx < 0; p.facing = sdy < -0.05 && Math.abs(sdy) > Math.abs(sdx) * 0.4 ? 'back' : 'front'; }
      else if (Math.abs(dz) > 1e-3) p.facing = dz > 0 ? 'back' : 'front';
      if (d <= remaining) { p.x = tgt[0]; p.y = tgt[1]; p.z = tgt[2] ?? p.z; p.path.shift(); remaining -= d; p.segDone = (p.segDone || 0) + d; }
      else { p.x += (dx / d) * remaining; p.y += (dy / d) * remaining; p.z += (dz / d) * remaining; p.segDone = (p.segDone || 0) + remaining; remaining = 0; }
    }
    if (p.scripted && p.segTotal) {
      const f = clamp(p.segDone / p.segTotal, 0, 1);
      if (p.fadeOut) p.op = clamp((1 - f) / 0.35, 0, 1);
      if (p.fadeIn) p.op = clamp(f / 0.3, 0, 1);
    }
    p.walkPhase += dt * (p.id === 'callie' ? 11 : 8);
    if (!p.path.length) { p.mode = 'stand'; p.path = null; p.scripted = false; if (p.z < 0.05) p.z = 0; const f = p.then; p.then = null; if (f) f(); }
  } else if (p.mode === 'hop') {
    const h = p.hop, q = prog(T, h.t0, h.t0 + h.dur);
    p.x = lerp(h.from[0], h.to[0], q); p.y = lerp(h.from[1], h.to[1], q); p.z = lerp(h.from[2], h.to[2], q) + arc(q, 0.6);
    if (q >= 1) {
      p.hop = null;
      if (h.end === 'lie') { p.mode = 'lie'; [p.x, p.y, p.z] = BEDS[p.bed || 'callie:bed'].lie; }
      else if (h.end === 'sit') { p.mode = 'sit'; [p.x, p.y, p.z] = h.to; p.facing = p.sitFace || 'back'; p.flip = !!p.sitFlip; }
      else { p.mode = 'stand'; p.z = 0; p.facing = 'front'; }
      const q2 = p.queue; p.queue = null; if (q2) q2();
    }
  } else if (p.mode === 'lie') {
    const myBed = p.id === 'callie' && p.bed === 'callie:bed' && W.player === 'callie';
    if (!myBed) { p.tablet = 0; return; }
    if (!W.flags.lights) { p.darkT = (p.darkT || 0) + dt; if (p.darkT > 1.2 && !p.sleep) { p.sleep = true; startBedtime(W); } } else { p.darkT = 0; if (p.sleep) { p.sleep = false; cancelBedtime(W); } }
    const want = p.tabletOn && !p.sleep ? 1 : 0;
    p.tablet = lerp(p.tablet || 0, want, 1 - Math.exp(-dt * 9));
  }
}

/* ---------------- going through doors ---------------- */
export function changeRoomPlayer(W, door) {
  const c = player(W);
  const target = DOORMAP[door.to + ':' + door.toDoor];
  W.fade = { t0: W.T };
  later(W, 0.28, () => {
    W.room = door.to; c.room = door.to; W.bubbles = W.bubbles.filter(b => b.anchor.type !== 'world');
    W.fx = [];
    if (target.enter) { c.x = target.enter[0][0]; c.y = target.enter[0][1]; c.z = target.enter[0][2]; c.op = 0; scripted(c, target.enter.slice(1), () => { c.op = 1; }, { fadeIn: true }); }
    else { c.x = target.at[0]; c.y = target.at[1]; c.z = 0; c.op = 1; walkTo(W, c, target.in[0], target.in[1]); }
    if (door.to === 'callie') { W.flags.myDoor = true; later(W, 1.2, () => { W.flags.myDoor = false; SFX.door(); }); }
    if (ROOMS[door.to].ceiling) W.nextCeiling = W.T + rand(4, 9);
    W.dirty = true;
  });
}
export function goThrough(W, door, onBlocked) {
  const c = player(W);
  if (door.special) { onBlocked && onBlocked(door); return; }
  walkTo(W, c, door.at[0], door.at[1], () => {
    if (W.room === 'callie') { W.flags.myDoor = true; SFX.door(); }
    if (door.ladder) { W.flags.ladder = W.flags.ladder || 0.01; }
    if (door.exit) scripted(c, door.exit, () => changeRoomPlayer(W, door), { fadeOut: true });
    else later(W, W.room === 'callie' ? 0.25 : 0.05, () => changeRoomPlayer(W, door));
  });
}
// Family members use the same doors, just without the screen fade.
function npcThrough(W, p, door, then) {
  const go = () => {
    const target = DOORMAP[door.to + ':' + door.toDoor];
    p.room = null; p.op = 0;
    later(W, door.exit ? 1.0 : 0.55, () => {
      p.room = door.to;
      if (target.enter) { p.x = target.enter[0][0]; p.y = target.enter[0][1]; p.z = target.enter[0][2]; scripted(p, target.enter.slice(1), () => { p.op = 1; then && then(); }, { fadeIn: true }); }
      else { p.x = target.at[0]; p.y = target.at[1]; p.z = 0; p.op = 1; walkTo(W, p, target.in[0], target.in[1], then); }
    });
  };
  if (door.exit) scripted(p, door.exit, go, { fadeOut: true }); else go();
}
export function travel(W, p, goal) {
  p.goal = goal;
  const step = () => {
    if (p.goal !== goal || !inHouse(p)) return;
    if (p.room === goal.room) { walkTo(W, p, goal.x, goal.y, () => { if (p.goal === goal) { p.goal = null; if (goal.face) p.facing = goal.face; goal.then && goal.then(); } }); return; }
    const r = route(p.room, goal.room), d = doorTo(p.room, r[1]);
    if (!d) return;
    walkTo(W, p, d.at[0], d.at[1], () => npcThrough(W, p, d, step));
  };
  if (p.mode === 'sit') standUp(p);
  step();
}
export function sendHome(W, who) {
  const p = W.people[who], h = HOMES[who];
  travel(W, p, { room: h.room, x: h.x, y: h.y, face: h.face, then: () => {
    if (who === 'dad') { p.mode = 'hop'; p.hop = { from: [p.x, p.y, 0], to: h.seat, t0: W.T, dur: 0.45, end: 'sit' }; p.sitFace = 'back'; p.sitFlip = false; p.seatStand = [h.x, h.y]; }
    if (who === 'chloe') p.home = true;
  } });
}

/* ---------------- spiders ---------------- */
let spiderId = 0;
const SPIDER_ROOMS = ['hallway', 'kitchen', 'living', 'middle', 'bathroom', 'parents', 'downhall', 'attic', 'chloe', 'toilet', 'callie'];
export function spawnSpider(W, room) {
  const r = room || pick(SPIDER_ROOMS.filter(x => x !== W.room && !W.spiders.some(s => s.room === x)));
  const [x, y] = nav(r).randomFree(1)[0];
  W.spiders.push({ id: ++spiderId, room: r, x, y, tx: x, ty: y, wait: rand(0.5, 2), alarmed: false, caught: false, dir: 0 });
}
function stepSpider(W, s, dt) {
  if (s.caught) return;
  const dad = W.people.dad;
  if (dad.room === s.room && dist([dad.x, dad.y], [s.x, s.y]) < 1.4) return; // freezes when Dad is near
  if (s.wait > 0) { s.wait -= dt; return; }
  const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
  if (d < 0.03) { s.wait = rand(0.6, 2.4); const nv = nav(s.room); for (let k = 0; k < 8; k++) { const a = rand(0, Math.PI * 2), r = rand(0.3, 1.1), nx = s.x + Math.cos(a) * r, ny = s.y + Math.sin(a) * r; if (nv.free(nx, ny, 0.05)) { s.tx = nx; s.ty = ny; break; } } return; }
  const v = Math.min(d, 0.45 * dt); s.x += dx / d * v; s.y += dy / d * v; s.dir = Math.atan2(dy, dx);
}
export function alarmSpider(W, s, who = 'callie') {
  if (s.alarmed) return;
  s.alarmed = true;
  const p = W.people[who];
  SFX.scream();
  say(W, who, who === 'chloe' ? 'Ew! Dad! A spider!' : who === 'connor' ? 'Dad! Spider! Get it!' : who === 'mum' ? 'Dad! Spider, please!' : 'Dad! A spider!', null, { style: 'shout' });
  if ((p.mode === 'stand' || p.mode === 'walk') && who !== 'mum') {
    const ax = p.x - s.x, ay = p.y - s.y, d = Math.hypot(ax, ay) || 1;
    const t = nav(p.room).nearestFree(p.x + ax / d * 1.3, p.y + ay / d * 1.3);
    if (who === W.player) { p.action = { kind: 'jump', t0: W.T, dur: 0.6 }; later(W, 0.5, () => { if (p.mode === 'stand') walkTo(W, p, t[0], t[1]); }); }
    else walkTo(W, p, t[0], t[1]);
  }
  callDad(W, s);
}
function callDad(W, s) {
  const dad = W.people.dad;
  if (W.player === 'dad' || dad.hiding) { later(W, 8, () => { if (!s.caught) s.alarmed = false; }); return; }
  dad.busy = null;
  if (dad.job) { if (!dad.queue2) dad.queue2 = []; dad.queue2.push(s); return; }
  dad.job = s;
  later(W, 1.2, () => {
    say(W, 'dad', dad.room === W.room ? 'On my way!' : 'On my way!', dad.room === W.room ? null : { type: 'off', id: 'dad' });
    travel(W, dad, { room: s.room, x: s.x, y: s.y + 0.5, then: () => catchSpider(W, s) });
  });
}
function catchSpider(W, s) {
  const dad = W.people.dad;
  if (dist([dad.x, dad.y], [s.x, s.y]) > 0.8 && !s.caught) { travel(W, dad, { room: s.room, x: s.x, y: s.y + 0.4, then: () => catchSpider(W, s) }); return; }
  dad.action = { kind: 'catch', t0: W.T, dur: 0.8 };
  later(W, 0.5, () => {
    s.caught = true; dad.holding = 'cup'; SFX.pop();
    say(W, 'dad', 'Got it!');
    later(W, 1.6, () => travel(W, dad, { room: 'garden', x: 7.0, y: 5.5, then: () => {
      dad.holding = null; say(W, 'dad', 'Bye bye, spider!'); spiderCaught(W);
      W.spiders = W.spiders.filter(x => x !== s);
      W.nextSpider = W.T + rand(60, 120);
      later(W, 1.8, () => {
        dad.job = null;
        const nxt = dad.queue2 && dad.queue2.shift();
        if (nxt) callDad(W, nxt); else sendHome(W, 'dad');
      });
    } }));
  });
}

// every spider Dad catches counts towards the spider stickers
export function spiderCaught(W) {
  W.spiderN = (W.spiderN || 0) + 1; W.dirty = true;
  achieve(W, 'spider');
  if (W.spiderN >= 5) later(W, 4.5, () => achieve(W, 'spider5'));
  if (W.spiderN >= 10) later(W, 9, () => achieve(W, 'spider10'));
}

/* ---------------- story moments ---------------- */
export function playerCatch(W, s) {
  const dad = W.people.dad;
  walkTo(W, dad, ...nav(dad.room).nearestFree(s.x, s.y + 0.45), () => {
    dad.action = { kind: 'catch', t0: W.T, dur: 0.8 };
    later(W, 0.5, () => { s.caught = true; dad.holding = 'cup'; SFX.pop(); say(W, 'dad', 'Got it! Bye bye, spider!'); later(W, 1.5, () => spiderCaught(W)); });
    later(W, 3.0, () => { dad.holding = null; W.spiders = W.spiders.filter(x => x !== s); W.nextSpider = W.T + rand(60, 120); });
  });
}
// When you stop playing someone, the grown-ups and Connor go back to what they were doing.
export function releaseNpc(W, id) {
  const p = W.people[id];
  if (!inHouse(p)) return;
  if (id === 'connor') {
    say(W, 'connor', 'Back to my game!');
    travel(W, p, { room: 'hallway', x: 0.975, y: 0.45, then: () => { W.connorDoor = { t0: W.T, mode: 'open' }; SFX.door(); later(W, 0.4, () => { if (!p.busy && !p.goal && W.player !== 'connor') { p.room = 'connorRoom'; p.path = null; W.nextCeiling = W.T + 8; } }); later(W, 1.2, () => { W.connorDoor = null; }); } });
  } else if (id === 'dad' || id === 'mum') { if (p.mode !== 'lie') later(W, 1.5, () => { if (W.player !== id && !p.job) sendHome(W, id); }); }
}
export function claimPlayer(W, id) {
  const p = W.people[id];
  p.goal = null; p.path = null; p.then = null; if (p.mode === 'walk') p.mode = 'stand'; p.action = null;
  if (id === 'dad' && p.job) { if (!p.job.caught) p.job.alarmed = false; p.job = null; p.queue2 = []; p.holding = null; }
  if (id === 'connor' && !inHouse(p)) {
    p.room = 'hallway'; p.x = 0.975; p.y = 0.4; p.z = 0; p.mode = 'stand'; p.op = 1;
    W.connorDoor = { t0: W.T, mode: 'open' }; SFX.door(); later(W, 1.4, () => { W.connorDoor = null; });
    walkTo(W, p, 1.1, 1.3);
  }
}
export function lunchTime(W) {
  const chloe = W.people.chloe;
  if (W.flags.lunch || W.bedtime) return;
  if (W.player === 'chloe' || chloe.room !== 'chloe' || chloe.mode === 'lie') { W.flags.lunch = true; return; }
  W.flags.lunch = true;
  later(W, 1.0, () => {
    if (chloe.room !== W.room) say(W, 'chloe', 'Is it lunch?', { type: 'off', id: 'chloe' }, { quiet: true });
    chloe.home = false;
    travel(W, chloe, { room: 'middle', x: 5.15, y: 1.45, face: 'front', then: () => { say(W, 'chloe', 'Is it lunch?'); chloe.flip = true; later(W, 1.5, () => achieve(W, 'lunch')); } });
  });
}
export function startBedtime(W) {
  if (W.bedtime) return;
  W.bedtime = { t0: W.T };
  W.uniform = {};
  const door = { type: 'world', room: 'callie', at: [6.5, 0.1, 2.4] };
  const lines = [['mum', 'Night night, Callie!'], ['dad', 'Sleep tight!'], ['chloe', 'Night, Callie.'], ['connor', 'Night!']];
  lines.forEach(([who, text], i) => later(W, 0.8 + i * 2.2, () => { if (W.bedtime) say(W, who, text, { ...door, at: [6.5 - i * 0.15, 0.1, 2.6 + (i % 2) * 0.4] }, { style: who === 'connor' ? 'muffled' : 'say' }); }));
  later(W, 9.5, () => { if (W.bedtime) { W.bedtime.night = W.T; speak('Good night, Callie!', 'narrator'); } });
  later(W, 14.5, () => { if (W.bedtime) morning(W); });
}
export function cancelBedtime(W) { W.bedtime = null; }
function morning(W) {
  const c = W.people.callie;
  const cn = W.people.connor; cn.room = 'connorRoom'; cn.path = null; cn.goal = null; cn.mode = 'stand';
  for (const p of Object.values(W.people)) if (p.mode === 'lie' && p.id !== 'callie') { p.mode = 'stand'; p.z = 0; p.bed = null; }
  W.bedtime = null; W.flags.lights = true; W.flags.lunch = false; W.flags.fridge = false;
  c.mode = 'stand'; c.sleep = false; c.bed = null; c.x = 2.3; c.y = 2.45; c.z = 0; c.facing = 'front'; c.room = 'callie'; W.room = player(W).room;
  const chloe = W.people.chloe; chloe.room = 'chloe'; chloe.x = HOMES.chloe.x; chloe.y = HOMES.chloe.y; chloe.mode = 'stand'; chloe.path = null; chloe.goal = null; chloe.home = true; chloe.op = 1;
  const mum = W.people.mum; mum.room = 'kitchen'; mum.x = HOMES.mum.x; mum.y = HOMES.mum.y; mum.mode = 'stand'; mum.path = null; mum.goal = null; mum.facing = 'back'; mum.op = 1;
  const dad = W.people.dad; dad.room = 'living'; [dad.x, dad.y, dad.z] = HOMES.dad.seat; dad.mode = 'sit'; dad.path = null; dad.goal = null; dad.job = null; dad.queue2 = []; dad.holding = null; dad.facing = 'back'; dad.op = 1; dad.seatStand = [HOMES.dad.x, HOMES.dad.y];
  W.spiders = []; W.nextSpider = W.T + 30;
  say(W, 'callie', 'Good morning!');
  c.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
  W.morningFlash = W.T;
  later(W, 1.5, () => achieve(W, 'sleep'));
}

export function ringDoorbell(W) {
  if (W.parcel) return;
  SFX.doorbell();
  W.parcel = { x: 1.1, y: 1.75, kind: pick(SURPRISES), opened: false };
  say(W, 'mum', 'Ding dong! A box for Callie!', W.room === 'downhall' ? { type: 'world', room: 'downhall', at: [1.1, 2.4, 2.2] } : { type: 'off', id: 'mum' });
}

/* ---------------- per-frame update ---------------- */
const CONNOR_LINES = ['NOOO!', 'Not fair!', 'Come on!', 'Rematch!', 'So close!', 'That was MY goal!', 'I hate this game!', 'Who passed to him?!', 'My car is upside down!', 'Lag! LAG!'];
export function update(W, dt, hooks) {
  W.T += dt;
  const T = W.T;
  const due = W.timers.filter(t => t.at <= T); W.timers = W.timers.filter(t => t.at > T); due.forEach(t => t.fn());
  for (const p of Object.values(W.people)) if (inHouse(p)) stepPerson(W, p, dt);
  const c = player(W);
  if (c.op < 1 && !c.scripted && c.room && !W.fade) c.op = Math.min(1, c.op + dt * 3);
  // spiders
  for (const s of W.spiders) {
    stepSpider(W, s, dt);
    for (const who of ['callie', 'chloe']) {
      const k = W.people[who];
      if (!s.alarmed && !s.caught && !k.hiding && k.room === s.room && dist([k.x, k.y], [s.x, s.y]) < (who === W.player ? 1.05 : 1.5) && k.mode !== 'lie') alarmSpider(W, s, who);
    }
  }
  if (W.out) { W.nextSpider = Math.max(W.nextSpider, T + 30); W.nextBell = Math.max(W.nextBell, T + 60); }
  if (!W.bedtime && T > W.nextSpider && W.spiders.filter(s => !s.caught).length < 2) { spawnSpider(W); W.nextSpider = T + rand(70, 140); }
  // Connor through the ceiling
  const gaming = W.people.connor.room === 'connorRoom';
  if (gaming && ROOMS[W.room].ceiling && !W.bedtime && T > W.nextCeiling) {
    W.nextCeiling = T + rand(14, 26);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) { SFX.thud(i * 0.22); later(W, i * 0.22, () => { W.shake = 1; }); }
    const won = W.connorWins > 0; if (won) W.connorWins--;
    say(W, 'connor', won ? pick(['I WON!', 'YES! Champion!', 'Get in! I won!']) : pick(CONNOR_LINES), { type: 'ceiling', id: 'connor' }, { style: 'shout' });
  }
  if (gaming && W.room === 'hallway' && !W.bedtime && T > W.nextMuffle) {
    W.nextMuffle = T + rand(22, 40);
    SFX.thud(); say(W, 'connor', pick(['Noooo!', 'Come on!', 'Rematch!']), { type: 'world', room: 'hallway', at: [0.97, 0, 2.6] }, { style: 'muffled' });
  }
  if (!W.bedtime && T > W.nextBell && !W.parcel) { W.nextBell = T + rand(200, 320); ringDoorbell(W); }
  W.shake = Math.max(0, W.shake - dt * 4);
  // garden ball
  const b = W.ball;
  if (Math.abs(b.vx) + Math.abs(b.vy) > 0.01 || b.z > 0) {
    const n = nav('garden');
    let nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (!n.free(nx, b.y, 0.05)) { b.vx *= -0.7; nx = b.x; }
    if (!n.free(b.x, ny, 0.05)) { b.vy *= -0.7; ny = b.y; }
    b.x = nx; b.y = ny; b.vz -= 12 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = Math.abs(b.vz) > 1 ? -b.vz * 0.45 : 0;
    const f = Math.exp(-dt * 1.4); b.vx *= f; b.vy *= f; if (Math.hypot(b.vx, b.vy) < 0.05) { b.vx = 0; b.vy = 0; }
  }
  // splashing in the paddling pool
  if (W.room === 'garden' && c.mode === 'walk' && c.x > 4.6 && c.x < 5.45 && c.y > 3.0 && c.y < 3.65 && T - (W.lastSplash || 0) > 0.45) {
    W.lastSplash = T; SFX.splash(); burst(W, 'splash', [c.x, c.y, 0.05]);
    if (!W.saidSplash || T - W.saidSplash > 8) { W.saidSplash = T; say(W, c.id, 'Splash!'); }
  }
  // attic mice
  for (const m of W.mice) {
    m.t += dt;
    if (m.t > m.life) continue;
    const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
    if (d < 0.05) { const t = nav('attic').randomFree(1, [1.2, 6.5, 1.1, 4.6])[0]; m.tx = t[0]; m.ty = t[1]; }
    else { const v = Math.min(d, 1.6 * dt); m.x += dx / d * v; m.y += dy / d * v; m.dir = dx - dy; }
  }
  W.mice = W.mice.filter(m => m.t <= m.life);
  if (W.flags.eyes === 'revealed' && !W.mice.length && T - (W.eyesT || 0) > 50) W.flags.eyes = 'hidden';
  // bubbles expire
  W.bubbles = W.bubbles.filter(bb => T - bb.t0 < bb.dur);
  W.fx = W.fx.filter(f => T - f.t0 < (f.life || 1.6));
  hooks && hooks.afterUpdate && hooks.afterUpdate();
}

export function huntTarget(W) { return HUNT_ORDER[W.hunt.idx] || null; }
export { KINDS, CONTAINERS };
