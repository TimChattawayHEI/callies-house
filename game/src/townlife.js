// Town life: the people she has made go out and about (the park, the cafe, her shops, each other's
// houses) and come home again, so she bumps into them all over town.
import { rand, pick, dist } from './core.js';
import { nav, walkTo, say, later, SEATS, sitOn } from './world.js';
import { ROOMS } from './rooms.jsx';
import { PLACES } from './town.jsx';
import { placeAtHome } from './folk.jsx';
import { personaOf, helloLine, friendship } from './personality.jsx';
import { familyWith } from './relations.js';
import { SHOP_TYPES } from './townbuild.jsx';

const LIKE_SHOPS = { food: ['Food shops', 'Takeaways & cafés'], books: ['books', 'newsagent'], music: ['music'], games: ['games', 'computer', 'toys'], painting: ['crafts'], animals: ['pets'], football: ['sports'], dancing: ['clothes', 'shoes'] };
const roomOf = place => { const P = PLACES[place]; return P ? P.room || place : null; };
const doorOf = rid => { const R = ROOMS[rid]; return R && R.doors ? (R.doors.find(d => d.special === 'map') || R.doors[0]) : null; };
export const onTrip = (W, id) => !!(W.people[id] && W.people[id].trip);

function destinations(W, def) {
  const out = [], likes = personaOf(W, def.id).likes || [], has = l => likes.includes(l);
  const add = (place, w) => { const rid = roomOf(place); if (rid && ROOMS[rid] && w > 0) out.push({ place, room: rid, w }); };
  add('park', 3 + (has('football') || has('animals') || has('dancing') ? 3 : 0));
  add('cafe', 2 + (has('food') ? 3 : 0));
  add('shop', 1.5); add('clothes', 1); add('pets', 1 + (has('animals') ? 3 : 0));
  for (const sh of Object.values((W.town && W.town.shops) || {})) {
    const T = SHOP_TYPES[sh.type]; if (!T) continue;
    const liked = likes.some(l => (LIKE_SHOPS[l] || []).some(k => k === T.cat || k === T.id));
    add('s:' + sh.id, 2 + (liked ? 3 : 0));
  }
  for (const f of Object.values(W.folk.fams)) if (f.id !== def.fam) {
    const friends = f.members.some(m => friendship(W, def.id, m) >= 3);
    add('h:' + f.id, friends ? 3 : 0.6);
  }
  return out;
}
const weighted = list => { let r = Math.random() * list.reduce((s, x) => s + x.w, 0); for (const x of list) { r -= x.w; if (r <= 0) return x; } return list[0]; };

export function initTownLife(W) {
  W.tlRoom = W.room;
  for (const id of Object.keys((W.folk && W.folk.people) || {})) if (W.people[id]) W.people[id].nextTrip = (W.T || 0) + rand(25, 120);
}
function arrive(W, p, dest) {
  const door = doorOf(dest.room), here = dest.room === W.room;
  if (here && door) {
    Object.assign(p, { room: dest.room, x: door.at[0], y: door.at[1], z: 0, mode: 'stand', path: null, goal: null, then: null, op: 1, seat: null, seatStand: null, action: null });
    const t = nav(dest.room).nearestFree((door.in || door.at)[0] + rand(-1, 1), (door.in || door.at)[1] + rand(-1, 1));
    walkTo(W, p, t[0], t[1]);
  } else {
    const [x, y] = nav(dest.room).randomFree(1)[0];
    Object.assign(p, { room: dest.room, x, y, z: 0, mode: 'stand', path: null, goal: null, then: null, op: 1, seat: null, seatStand: null, action: null });
  }
  p.nextAct = W.T + rand(3, 8);
}
function goHome(W, p) {
  if (p.trip && p.trip.leaving) return;
  if (p.room === W.room) {
    const door = doorOf(p.room);
    p.trip.leaving = true;
    if (p.mode === 'sit') { p.mode = 'stand'; if (p.seatStand) { p.x = p.seatStand[0]; p.y = p.seatStand[1]; } p.z = 0; p.seatStand = null; }
    if (door) { say(W, p.id, pick(['Bye!', 'See you later!', 'Time to go home!'])); walkTo(W, p, door.at[0], door.at[1], () => { p.trip = null; placeAtHome(W, p.id); p.nextTrip = W.T + rand(60, 150); }); return; }
  }
  p.trip = null; placeAtHome(W, p.id); p.nextTrip = W.T + rand(60, 150);
}
// fx.hello(p): someone she knows is here
export function stepTownLife(W, fx) {
  if (!W.folk || W.hide || W.photo || W.drive || W.bedtime) return;
  const party = (W.out && W.out.party) || [], ppl = Object.values(W.folk.people);
  const away = ppl.filter(d => onTrip(W, d.id)).length;
  const entered = W.tlRoom !== W.room; W.tlRoom = W.room;
  if (entered) {
    const here = ppl.map(d => W.people[d.id]).filter(p => p && p.trip && p.room === W.room && p.id !== W.player);
    if (here.length) { const p = pick(here); later(W, 1.6, () => { if (p.room === W.room) { say(W, p.id, helloLine(W, p.id)); if (p.mode === 'stand') p.action = { kind: 'wave', t0: W.T, dur: 1.4 }; fx.hello && fx.hello(p); } }); }
  }
  for (const def of ppl) {
    const p = W.people[def.id];
    if (!p || p.id === W.player || party.includes(p.id) || (p.busy && p.busy !== 'trip') || p.mode === 'lie' || (W.visit && W.visit.who === p.id) || !p.room && !p.trip) continue;
    if (p.trip) {
      if (W.T > p.trip.until) { goHome(W, p); continue; }
      if (p.room !== W.room || p.trip.leaving || p.chatUntil > W.T) continue;
      if (p.path || p.goal || p.mode === 'walk' || p.mode === 'hop' || W.T < (p.nextAct || 0)) continue;
      p.nextAct = W.T + rand(7, 15);
      if (p.mode === 'sit' && Math.random() < 0.6) continue;
      if (p.mode === 'sit') { p.mode = 'stand'; p.z = 0; if (p.seatStand) { p.x = p.seatStand[0]; p.y = p.seatStand[1]; } p.seatStand = null; }
      const seats = Object.keys(SEATS).filter(k => k.startsWith(p.room + ':')).map(k => SEATS[k]).filter(s => !Object.values(W.people).some(q => q !== p && q.room === p.room && q.mode === 'sit' && dist([q.x, q.y], s.seat) < 0.4));
      if (seats.length && Math.random() < 0.3) { sitOn(W, p, pick(seats)); continue; }
      const t = nav(p.room).nearestFree(p.x + rand(-3, 3), p.y + rand(-3, 3)); walkTo(W, p, t[0], t[1]);
      continue;
    }
    if (W.T < (p.nextTrip || 0)) continue;
    p.nextTrip = W.T + rand(50, 140);
    if (p.room === W.room || Math.random() < 0.4 || away >= Math.max(1, Math.ceil(ppl.length / 2))) continue;
    const dests = destinations(W, def).filter(x => x.room !== p.room); if (!dests.length) continue;
    const dest = weighted(dests);
    p.trip = { place: dest.place, room: dest.room, until: W.T + rand(80, 170) };
    arrive(W, p, dest);
    // grown-ups sometimes bring one of their children
    if (def.body !== 'kid' && def.body !== 'teen' && Math.random() < 0.5) {
      const kid = ppl.find(k => (k.body === 'kid' || k.body === 'teen') && familyWith(W, k.id, def.id) && W.people[k.id] && !W.people[k.id].trip && k.id !== W.player && !party.includes(k.id) && W.people[k.id].room !== W.room);
      if (kid) { const q = W.people[kid.id]; q.trip = { ...p.trip, with: def.id }; arrive(W, q, dest); }
    }
  }
}
// where someone is, in words, for job tips
export function whereNow(W, id) {
  const p = W.people[id]; if (!p || !p.room) return null;
  const R = ROOMS[p.room]; if (!R) return null;
  if (p.trip && PLACES[p.trip.place]) return PLACES[p.trip.place].say;
  return R.place && PLACES[R.place] ? PLACES[R.place].say : R.name;
}
