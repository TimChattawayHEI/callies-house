// Family activities: hide and seek, lost-item quests, photo time, dance party, BBQ and garden football.
import { rand, pick, dist, clamp, SFX, speak, achieve, earn } from './core.js';
import { ROOMS, CONTAINERS } from './rooms.jsx';
import { NAMES } from './people.jsx';
import { nav, say, later, travel, walkTo, burst, sendHome, inHouse, HOMES } from './world.js';

/* ---------------- shared helpers ---------------- */
export function connorOut(W) {
  const p = W.people.connor;
  if (inHouse(p)) return p;
  p.room = 'hallway'; p.x = 0.975; p.y = 0.4; p.z = 0; p.mode = 'stand'; p.op = 1; p.path = null;
  W.connorDoor = { t0: W.T, mode: 'open' }; later(W, 1.4, () => { W.connorDoor = null; });
  return p;
}
// Send someone back to what they normally do.
export function returnHome(W, id) {
  const p = W.people[id];
  p.busy = null; p.hiding = false;
  if (W.player === id || !inHouse(p)) return;
  if (id === 'connor') {
    travel(W, p, { room: 'hallway', x: 0.975, y: 0.45, then: () => { W.connorDoor = { t0: W.T, mode: 'open' }; SFX.door(); later(W, 0.4, () => { if (!p.busy && !p.goal && W.player !== 'connor') { p.room = 'connorRoom'; p.path = null; W.nextCeiling = W.T + 8; } }); later(W, 1.2, () => { W.connorDoor = null; }); } });
  } else if (id === 'chloe') { if (!W.flags.lunch) sendHome(W, 'chloe'); }
  else if (id === 'mum' || id === 'dad') { if (!(id === 'dad' && W.people.dad.job)) sendHome(W, id); }
}
function free(W, p) { return p.id !== W.player && !p.hiding && !p.busy && !(p.id === 'dad' && p.job) && p.mode !== 'lie'; }

/* ---------------- hide and seek ---------------- */
export const HIDE_SPOTS = [
  { room: 'living', x: 2.55, y: 2.05, word: 'table' },
  { room: 'kitchen', x: 2.3, y: 2.0, word: 'worktop' },
  { room: 'middle', x: 1.5, y: 2.35, word: 'sofa' },
  { room: 'parents', x: 5.3, y: 3.25, word: 'bed' },
  { room: 'garden', x: 3.9, y: 0.05, word: 'BBQ' },
  { room: 'attic', x: 3.3, y: 0.45, word: 'chair' },
  { room: 'callie', x: 4.95, y: 2.2, word: 'toy box' },
  { room: 'bathroom', x: 0.6, y: 0.6, word: 'shower' },
  { room: 'downhall', x: 3.8, y: 1.95, word: 'radiator' },
];
export function startHide(W, who) {
  const p = W.people[who];
  if (W.hide || who === W.player || !free(W, p)) return false;
  p.goal = null; p.path = null; p.then = null; if (p.mode === 'walk' || p.mode === 'sit') { p.mode = 'stand'; p.z = 0; }
  p.busy = 'hide';
  say(W, who, 'Count to ten! No peeking!');
  const spots = HIDE_SPOTS.filter(s => s.room !== W.room);
  const spot = pick(spots);
  W.hide = { who, spot, phase: 'count', t0: W.T + 1.6, nextGiggle: W.T + 20 };
  later(W, 1.6, () => {
    p.room = spot.room; p.x = spot.x; p.y = spot.y; p.z = 0; p.mode = 'sit'; p.facing = 'front'; p.flip = false; p.seatStand = [spot.x, spot.y]; p.hiding = true; p.op = 1;
    for (let i = 1; i <= 10; i++) later(W, i * 0.55, () => { SFX.click(); speak(String(i), 'word'); });
    later(W, 6.0, () => { if (W.hide) { W.hide.phase = 'seek'; speak('Ready or not, here I come!', 'narrator'); } });
  });
  return true;
}
export function hideHint(W) {
  const h = W.hide; if (!h || h.phase !== 'seek') return;
  const sameRoom = W.people[W.player].room === h.spot.room;
  SFX.squeak();
  say(W, h.who, sameRoom ? `Hee hee! I am by the ${h.spot.word}!` : `I am in the ${ROOMS[h.spot.room].name}!`, sameRoom ? null : { type: 'off', id: h.who }, { style: 'muffled' });
}
export function foundHider(W, onFound) {
  const h = W.hide; if (!h) return;
  const p = W.people[h.who];
  W.hide = null;
  p.hiding = false; p.mode = 'stand'; p.z = 0; p.action = { kind: 'cheer', t0: W.T, dur: 1.4 };
  SFX.fanfare(); say(W, h.who, pick(['You found me!', 'Oh no! You found me!', 'Found me! Well done!']));
  onFound && onFound(p);
  later(W, 2, () => achieve(W, 'hide'));
  later(W, 3.5, () => returnHome(W, h.who));
}
export function stepHide(W, dt, onFound) {
  const h = W.hide; if (!h || h.phase !== 'seek') return;
  const me = W.people[W.player], p = W.people[h.who];
  if (me.room === h.spot.room && dist([me.x, me.y], [p.x, p.y]) < 0.95) { foundHider(W, onFound); return; }
  if (W.T > h.nextGiggle) { h.nextGiggle = W.T + rand(16, 24); hideHint(W); }
}

/* ---------------- lost things: Connor's controller, Chloe's tablet ---------------- */
export const QUESTS = {
  connor: { kind: 'controller', id: 'q-controller', ask: 'Where is my controller?!', thanks: 'YES! My controller! Now I can win!', chip: "Connor's controller",
    spots: [{ box: 'living:cupboard' }, { box: 'kitchen:bin' }, { box: 'middle:basket' }, { room: 'garden', x: 2.6, y: 5.2 }, { room: 'downhall', x: 5.6, y: 1.8 }, { room: 'bathroom', x: 2.4, y: 1.9 }, { room: 'living', x: 6.9, y: 4.9 }, { box: 'attic:trunk' }] },
  chloe: { kind: 'tablet', id: 'q-tablet', ask: 'Has anyone seen my blue tablet?', thanks: 'My tablet! Thanks, Callie. You can come in my room!', chip: "Chloe's tablet",
    spots: [{ box: 'parents:drawers' }, { box: 'kitchen:cupboard' }, { box: 'middle:drawers' }, { room: 'garden', x: 8.0, y: 4.2 }, { room: 'middle', x: 9.2, y: 2.7 }, { room: 'toilet', x: 1.6, y: 1.0 }, { room: 'living', x: 0.9, y: 4.0 }, { room: 'callie', x: 5.6, y: 4.6 }] },
};
export function initQuests(W, saved) {
  W.quests = saved || { connor: { state: 'idle', nextT: 50 }, chloe: { state: 'idle', nextT: 110 } };
  for (const q of Object.values(W.quests)) if (q.state === 'idle') q.nextT = Math.min(q.nextT || 60, 120);
}
function startQuest(W, who) {
  const Q = QUESTS[who], q = W.quests[who];
  W.items = W.items.filter(i => i.id !== Q.id);
  const options = Q.spots.filter(s => (s.box ? CONTAINERS[s.box].room : s.room) !== W.room);
  const s = pick(options);
  const it = { id: Q.id, kind: Q.kind, rot: rand(-30, 30), quest: who };
  if (s.box) { it.loc = { s: 'in', box: s.box, order: W.T }; it.room = CONTAINERS[s.box].room; }
  else { const f = nav(s.room).nearestFree(s.x, s.y, 0.05); it.loc = { s: 'floor', x: f[0], y: f[1] }; it.room = s.room; }
  W.items.push(it); q.state = 'active'; W.dirty = true;
  const p = W.people[who];
  if (who === 'connor' && p.room === 'connorRoom') {
    if (ROOMS[W.room].ceiling) say(W, 'connor', Q.ask, { type: 'ceiling', id: 'connor' }, { style: 'shout' });
    else say(W, 'connor', Q.ask, { type: 'off', id: 'connor' }, { style: 'shout' });
    SFX.thud();
  } else say(W, who, Q.ask, p.room === W.room ? null : { type: 'off', id: who });
}
export function stepQuests(W) {
  for (const who of ['connor', 'chloe']) {
    const q = W.quests[who];
    if (q.state === 'idle' && W.T > q.nextT && !W.bedtime && !W.out && W.player !== who) startQuest(W, who);
  }
}
export function questFor(it) { return it && it.quest; }
export function completeQuest(W, who, it, onDone) {
  const Q = QUESTS[who], q = W.quests[who];
  W.items = W.items.filter(i => i !== it);
  q.state = 'idle'; q.nextT = W.T + rand(360, 540); W.dirty = true;
  SFX.fanfare();
  if (who === 'connor') W.connorWins = 3;
  if (who === 'chloe') W.chloeInvite = W.T + 300;
  onDone && onDone(Q);
  later(W, 2.2, () => { if (!achieve(W, who === 'connor' ? 'controller' : 'tablet')) earn(W, 5); });
}

/* ---------------- gathering the family (photos, dancing) ---------------- */
export function gather(W, room, spotFn, kind) {
  const ids = ['callie', 'chloe', 'mum', 'dad', 'connor'].filter(id => id !== W.player);
  let n = 0;
  ids.forEach((id, i) => {
    const p = id === 'connor' ? connorOut(W) : W.people[id];
    if (!free(W, p) || !inHouse(p)) return;
    p.busy = kind;
    const [x, y] = spotFn(i, n++);
    later(W, 0.3 + i * 0.4, () => travel(W, p, { room, x, y, face: 'front', then: () => { p.flip = false; } }));
  });
  return n;
}
export function releaseAll(W, kind) {
  for (const p of Object.values(W.people)) if (p.busy === kind) later(W, rand(0.2, 1.5), () => returnHome(W, p.id));
}

/* ---------------- dance party ---------------- */
export function startDance(W) {
  if (W.dance) return;
  W.dance = { t0: W.T, until: W.T + 14 };
  SFX.party(14);
  say(W, W.player, 'Dance party!');
  const n = gather(W, 'living', i => nav('living').nearestFree(2.6 + (i % 3) * 0.9, 1.4 + Math.floor(i / 3) * 0.8), 'dance');
  if (n) later(W, 0.8, () => say(W, 'mum', 'Dance party? Yes!', W.people.mum.room === W.room ? null : { type: 'off', id: 'mum' }));
  later(W, 3, () => achieve(W, 'dance'));
  later(W, 14, () => { W.dance = null; releaseAll(W, 'dance'); });
}

/* ---------------- BBQ ---------------- */
export function startBbq(W) {
  const dad = W.people.dad;
  W.flags.bbq = W.T;
  if (dad.id !== W.player && free(W, dad)) {
    dad.busy = 'bbq';
    say(W, 'dad', 'BBQ time!', dad.room === W.room ? null : { type: 'off', id: 'dad' });
    travel(W, dad, { room: 'garden', x: 3.9, y: 1.2, face: 'back' });
  }
}
export function endBbq(W) { const dad = W.people.dad; if (dad.busy === 'bbq') { say(W, 'dad', 'Enjoy!'); later(W, 8, () => returnHome(W, 'dad')); } }

/* ---------------- garden football ---------------- */
export const GOAL = { x0: 5.6, x1: 7.2, y: 6.8, back: 7.3, keeper: [6.4, 6.5] };
export function toggleGoal(W) {
  const g = W.goal;
  g.up = !g.up; g.t0 = W.T; W.dirty = true;
  const dad = W.people.dad;
  if (g.up) {
    SFX.boing(); later(W, 0.15, () => SFX.pop());
    if (dad.id !== W.player && (free(W, dad) || dad.busy === 'bbq')) { dad.busy = 'keeper'; later(W, 1, () => { say(W, 'dad', 'I am in goal!', dad.room === W.room ? null : { type: 'off', id: 'dad' }); travel(W, dad, { room: 'garden', x: GOAL.keeper[0], y: GOAL.keeper[1], face: 'back' }); }); }
  } else { SFX.whoosh(); if (dad.busy === 'keeper') returnHome(W, 'dad'); }
}
export function kickBall(W, kicker) {
  const b = W.ball, g = W.goal;
  let tx, ty;
  if (g.up) { tx = clamp((GOAL.x0 + GOAL.x1) / 2 + rand(-0.9, 0.9), 5.3, 7.5); ty = 7.15; }
  else { tx = b.x + (b.x - kicker.x) * 3; ty = b.y + (b.y - kicker.y) * 3; }
  const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1, sp = g.up ? 4.4 : 4.2;
  b.vx = dx / d * sp; b.vy = dy / d * sp; b.vz = g.up ? 1.6 : 3;
  SFX.kick();
  const dad = W.people.dad;
  const keeper = g.up && dad.busy === 'keeper' && dad.room === 'garden' && dist([dad.x, dad.y], GOAL.keeper) < 0.8;
  W.shot = g.up ? { t0: W.T, aimX: tx, save: keeper && Math.random() < 0.35, keeper, kicker: kicker.id } : null;
  if (keeper) { dad.action = { kind: 'catch', t0: W.T + 0.3, dur: 0.8 }; travel(W, dad, { room: 'garden', x: clamp(W.shot.save ? tx : tx + (tx > 6.4 ? -0.8 : 0.8), 5.7, 7.1), y: GOAL.keeper[1], face: 'back' }); }
}
export function stepFootball(W, onGoal) {
  const s = W.shot, b = W.ball; if (!s) return;
  const dad = W.people.dad;
  if (s.save && b.y > 6.3 && Math.abs(b.x - dad.x) < 1.3) {
    b.vy = -Math.abs(b.vy) * 0.5; b.vx *= 0.4; SFX.kick(); W.shot = null;
    say(W, 'dad', pick(['Saved! Ha ha!', 'What a save!', 'Not today!']));
    dad.action = { kind: 'cheer', t0: W.T, dur: 1.2 };
    later(W, 1.5, () => travel(W, dad, { room: 'garden', x: GOAL.keeper[0], y: GOAL.keeper[1], face: 'back' }));
    return;
  }
  if (b.y > GOAL.y && b.x > GOAL.x0 && b.x < GOAL.x1) {
    W.shot = null; b.vx *= 0.1; b.vy = 0.3; b.vz = 0;
    onGoal && onGoal(s);
    if (s.keeper) { later(W, 0.6, () => say(W, 'dad', pick(['Oh no!', 'What a goal!', 'Too good!']))); later(W, 1.8, () => travel(W, dad, { room: 'garden', x: GOAL.keeper[0], y: GOAL.keeper[1], face: 'back' })); }
    later(W, 2.4, () => { b.x = 6.4; b.y = 4.8; b.vx = b.vy = b.vz = 0; b.z = 0; });
    return;
  }
  if (W.T - s.t0 > 3) W.shot = null;
}
export { NAMES, HOMES };
