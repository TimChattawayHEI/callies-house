// Pets: adopt them at the pet shop, then look after them at home.
// Dogs follow you around (and come to the park), cats wander the house, fish live in a tank,
// birds in a cage and the small pets in a hutch in the garden. They get hungry, dogs need walks,
// tanks and cages get dirty, and sometimes the dog leaves a little present in the garden.
import React, { useState } from 'react';
import { P, rand, pick, dist, SFX, speak, earn, achieve } from './core.js';
import { nav, later, player, setExtraBlocks } from './world.js';
import { ROOMS } from './rooms.jsx';
import { PetKit, Iso } from '../rooms.gen.jsx';

const { PetArt, PETS, BY_ID, SIZE, CATS, HEART } = PetKit;
const { Box, FaceX, FaceY, FloorPlane } = Iso;
export { PetArt, PETS, BY_ID };
export const MAX_PETS = 6;

/* ---------------- where everything lives ---------------- */
// Each kind of pet has one home in Callie's house, shared by all the pets of that kind.
const HOME_OF = { dog: 'bed', cat: 'tree', fish: 'tank', bird: 'cage', bunny: 'hutch', hamster: 'hutch', guinea: 'hutch', tortoise: 'hutch' };
export const HOMES = {
  // bowl: where the food bowl goes (offset from the home's corner)
  bed: { room: 'living', x: 0.75, y: 0.55, w: 0.8, d: 0.6, bowl: [0.5, 0.68], word: 'dog bed', name: 'the dog bed' },
  tree: { room: 'middle', x: 4.0, y: 2.55, w: 0.8, d: 0.7, bowl: [0.88, 0.25], word: 'cat tree', name: 'the cat tree' },
  tank: { room: 'living', x: 0.4, y: 1.55, w: 0.5, d: 1.3, face: 'x', word: 'fish tank', name: 'the fish tank' },
  cage: { room: 'middle', x: 0.55, y: 0.7, w: 0.55, d: 0.55, word: 'bird cage', name: 'the bird cage' },
  hutch: { room: 'garden', x: 1.8, y: 5.7, w: 1.6, d: 0.75, word: 'hutch', name: 'the hutch' },
};
const FOOD = {
  dog: 'dog food', cat: 'cat food', fish: 'fish food', bird: 'bird seed', bunny: 'carrots', guinea: 'carrots', tortoise: 'lettuce', hamster: 'seeds',
};
export const FOODS = ['dog food', 'cat food', 'fish food', 'bird seed', 'carrots', 'lettuce', 'seeds'];
const NOISE = { dog: ['Woof!', 'Woof woof!', 'Ruff!'], cat: ['Meow!', 'Purr...', 'Mew!'], bird: ['Tweet!', 'Cheep cheep!'], fish: ['Blub!', 'Bloop!'], bunny: ['Sniff sniff!'], hamster: ['Squeak!'], guinea: ['Wheek wheek!'], tortoise: ['...'] };
const KIND_WORD = { dog: 'dogs', cat: 'cats', fish: 'fish', bird: 'birds', bunny: 'bunnies', hamster: 'hamsters', guinea: 'guinea pigs', tortoise: 'tortoises' };
const CAT_ROOMS = ['living', 'middle', 'kitchen', 'garden'];
const callieHouse = r => !!(ROOMS[r] && !ROOMS[r].town && !ROOMS[r].fam);
const dogCanGo = r => callieHouse(r) || r === 'park' || r === 'pets';

/* ---------------- saving and loading ---------------- */
export function initPets(W, saved) {
  const s = (saved && saved.pets) || {};
  W.pets = (s.list || []).filter(p => BY_ID[p.id]).map(p => ({ ...p, path: null, op: 1 }));
  W.petDirt = s.dirt || {};
  W.petMess = s.mess || [];
  W.petStats = s.stats || { fed: 0, walks: 0, poo: 0, clean: 0 };
  W.pooNext = 200; W.petSayNext = 30; W.petRoom = W.room;
  for (const p of W.pets) if (p.with === undefined) p.with = BY_ID[p.id].kind === 'dog';
  W.petBlocks = {};
  updateBlocks(W);
}
export const savePets = W => ({ list: W.pets.map(({ id, room, x, y, hunger, walk, with: w }) => ({ id, room, x, y, hunger, walk, with: w })), dirt: W.petDirt, mess: W.petMess, stats: W.petStats });
export const defOf = p => BY_ID[p.id];
export const kindOf = p => BY_ID[p.id].kind;
export const homesOwned = W => [...new Set(W.pets.map(p => HOME_OF[kindOf(p)]))];
export const petsIn = (W, home) => W.pets.filter(p => HOME_OF[kindOf(p)] === home);
// pet homes are solid: people walk round them
function updateBlocks(W) {
  const by = {};
  for (const h of homesOwned(W)) {
    const H = HOMES[h], list = (by[H.room] = by[H.room] || []);
    list.push([H.x - 0.05, H.x + H.w + 0.05, H.y - 0.05, H.y + H.d + 0.05]);
    if (H.bowl) list.push([H.x + H.bowl[0] - 0.03, H.x + H.bowl[0] + 0.3, H.y + H.bowl[1] - 0.03, H.y + H.bowl[1] + 0.3]);
  }
  W.petBlocks = by;
  setExtraBlocks(by);
}

/* ---------------- adopting ---------------- */
export function adopt(W, id) {
  const def = BY_ID[id]; if (!def || W.pets.some(p => p.id === id) || W.coins < def.price || W.pets.length >= MAX_PETS) return false;
  W.coins -= def.price;
  const H = HOMES[HOME_OF[def.kind]], c = player(W);
  const pet = { id, hunger: rand(0.1, 0.4), walk: rand(0, 0.3), with: def.kind === 'dog', room: H.room, x: H.x + H.w / 2, y: H.y + H.d + 0.4, path: null, op: 1 };
  if (def.kind === 'dog') { const t = nav(W.room).nearestFree(c.x + 0.7, c.y + 0.5); Object.assign(pet, { room: W.room, x: t[0], y: t[1] }); }
  W.pets.push(pet);
  if (!W.petDirt[HOME_OF[def.kind]]) W.petDirt[HOME_OF[def.kind]] = 0;
  updateBlocks(W); W.dirty = true;
  later(W, 1.5, () => achieve(W, 'pet'));
  if (W.pets.length >= 3) later(W, 3, () => achieve(W, 'petfamily'));
  return true;
}

/* ---------------- moving about ---------------- */
function goTo(p, x, y) {
  const path = nav(p.room).findPath([p.x, p.y], [x, y]);
  p.path = path && path.length ? path.map(q => [q[0], q[1]]) : null;
}
function stepMove(p, dt, speed) {
  if (!p.path || !p.path.length) { p.walking = false; return; }
  let rem = speed * dt;
  while (rem > 0 && p.path.length) {
    const [tx, ty] = p.path[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 1e-3) p.flip = (dx - dy) < 0;
    if (d <= rem) { p.x = tx; p.y = ty; p.path.shift(); rem -= d; } else { p.x += dx / d * rem; p.y += dy / d * rem; rem = 0; }
  }
  p.walking = !!p.path.length;
  if (!p.path.length) p.path = null;
}
const noise = (W, p, fx) => { const k = kindOf(p), t = pick(NOISE[k]); fx.word(t, P(p.x, p.y, 0.9)); };

/* ---------------- every frame ---------------- */
export function stepPets(W, dt, fx) {
  if (!W.pets) return;
  window.__petsOwned = W.pets.map(p => p.id);
  if (!W.pets.length) return;
  const c = player(W), R = W.room, moved = W.petRoom !== R;
  W.petRoom = R;
  const home = !W.out && callieHouse(R);
  // needs grow slowly while she plays
  for (const p of W.pets) {
    const k = kindOf(p), was = p.hunger;
    p.hunger = Math.min(1, (p.hunger || 0) + dt / 300);
    if (k === 'dog') { const w0 = p.walk; p.walk = Math.min(1, (p.walk || 0) + dt / 480); if (w0 < 1 && p.walk >= 1) fx.need(p, 'walk'); }
    if (was < 1 && p.hunger >= 1) fx.need(p, 'hungry');
  }
  for (const h of homesOwned(W)) if (h !== 'bed' && h !== 'tree') { const d0 = W.petDirt[h] || 0; W.petDirt[h] = Math.min(1, d0 + dt / 420); if (d0 < 1 && W.petDirt[h] >= 1) fx.need({ home: h }, 'dirty'); }
  // the dog sometimes leaves a present in the garden
  const dogs = W.pets.filter(p => kindOf(p) === 'dog');
  if (dogs.length && W.T > W.pooNext && !W.bedtime) {
    W.pooNext = W.T + rand(300, 480);
    if (W.petMess.length < 3) {
      const d = pick(dogs), [x, y] = nav('garden').randomFree(1, [2.5, 9.2, 2.6, 6.9])[0];
      W.petMess.push({ id: 'm' + Math.round(W.T * 10), x, y, who: d.id }); W.dirty = true;
      fx.need(d, 'poo');
    }
  }
  // dogs come with you: round the house, to the park and to the pet shop
  dogs.forEach((p, i) => {
    if (moved || (p.with && p.room !== R && !p.enterAt)) {
      if (dogCanGo(R) && (callieHouse(R) || p.with || R === 'park')) { p.with = true; p.enterAt = W.T + 0.7 + i * 0.3; p.room = null; }
      else { p.with = false; p.enterAt = null; const H = HOMES.bed; Object.assign(p, { room: H.room, x: H.x + H.w / 2, y: H.y + H.d / 2, path: null, sleep: true }); }
    }
    if (p.enterAt && W.T > p.enterAt) {
      p.enterAt = null; p.sleep = false;
      const t = nav(R).nearestFree(c.x + 0.5 - i * 0.4, c.y + 0.6 + i * 0.3);
      Object.assign(p, { room: R, x: t[0], y: t[1], path: null, op: 0 });
    }
    if (p.room !== R) return;
    p.op = Math.min(1, (p.op || 0) + dt * 3);
    if (p.busyUntil > W.T) { stepMove(p, dt, 3.2); return; }
    const d = dist([p.x, p.y], [c.x, c.y]);
    if (d > 1.9 && (!p.path || W.T > (p.repath || 0))) {
      p.repath = W.T + 0.6;
      const a = Math.atan2(p.y - c.y, p.x - c.x), t = nav(R).nearestFree(c.x + Math.cos(a + i * 0.7) * 0.9, c.y + Math.sin(a + i * 0.7) * 0.9);
      goTo(p, t[0], t[1]);
    }
    stepMove(p, dt, d > 3.5 ? 3.4 : 2.6);
  });
  // cats please themselves
  W.pets.filter(p => kindOf(p) === 'cat').forEach(p => {
    if (!CAT_ROOMS.includes(p.room)) p.room = HOMES.tree.room;
    if (W.T < (p.next || 0)) { if (p.room === R) stepMove(p, dt, 1.3); return; }
    p.next = W.T + rand(6, 14); p.sleep = false; p.nap = false;
    const r = Math.random();
    if (p.room !== R && home && r < 0.15 && CAT_ROOMS.includes(R)) { const [x, y] = nav(R).randomFree(1)[0]; Object.assign(p, { room: R, x, y, path: null, op: 0 }); return; }
    if (r < 0.2 && p.room !== R) { p.room = pick(CAT_ROOMS); const [x, y] = nav(p.room).randomFree(1)[0]; Object.assign(p, { x, y, path: null }); return; }
    if (p.room !== R) return;
    if (r < 0.35 && p.room === HOMES.tree.room) { const H = HOMES.tree; goTo(p, H.x + H.w + 0.25, H.y + H.d / 2); p.nap = true; return; }
    if (r < 0.6) { const t = nav(R).nearestFree(c.x + rand(-1, 1), c.y + rand(0.4, 1.2)); goTo(p, t[0], t[1]); return; }
    const [x, y] = nav(R).randomFree(1)[0]; goTo(p, x, y);
  });
  for (const p of W.pets) if (p.room === R) p.op = Math.min(1, (p.op == null ? 1 : p.op) + dt * 2.5);
  // now and then someone in the room makes a noise
  if (W.T > W.petSayNext) {
    W.petSayNext = W.T + rand(18, 40);
    const here = W.pets.filter(p => p.room === R || (HOMES[HOME_OF[kindOf(p)]].room === R && !['dog', 'cat'].includes(kindOf(p))));
    if (here.length) { const p = pick(here), k = kindOf(p); if (k !== 'tortoise') { const at = ['dog', 'cat'].includes(k) ? [p.x, p.y] : homeCenter(HOME_OF[k]); fx.word(pick(NOISE[k]), P(at[0], at[1], 1.0)); } }
  }
  // the walk: be at the park with your dog for a moment
  if (R === 'park') for (const p of dogs) if (p.room === 'park' && p.walk > 0.6) {
    p.parkT = (p.parkT || 0) + dt;
    if (p.parkT > 4) { p.parkT = 0; p.walk = 0; W.petStats.walks++; W.dirty = true; earn(W, 4); fx.done(p, 'walk'); later(W, 2, () => achieve(W, 'walkies')); }
  }
}
export const homeCenter = h => { const H = HOMES[h]; return [H.x + H.w / 2, H.y + H.d / 2]; };
// where to stand to look after a home
export const homeFront = h => { const H = HOMES[h]; return H.face === 'x' ? [H.x + H.w + 0.45, H.y + H.d / 2] : [H.x + H.w / 2, H.y + H.d + 0.45]; };

/* ---------------- looking after them ---------------- */
export const foodFor = p => FOOD[kindOf(p)];
export function feed(W, ids, food) {
  const pets = W.pets.filter(p => ids.includes(p.id));
  const want = pets.filter(p => FOOD[kindOf(p)] === food);
  if (!want.length) { const k = kindOf(pets[0]); return { ok: false, line: `${KIND_WORD[k][0].toUpperCase() + KIND_WORD[k].slice(1)} do not eat ${food}!`, hint: `${KIND_WORD[k][0].toUpperCase() + KIND_WORD[k].slice(1)} eat ${FOOD[k]}.` }; }
  const wasHungry = want.some(p => p.hunger > 0.5);
  for (const p of want) p.hunger = 0;
  W.petStats.fed++; W.dirty = true;
  if (wasHungry) earn(W, 2);
  if (W.petStats.fed >= 10) later(W, 2, () => achieve(W, 'petfeed'));
  return { ok: true, line: pick(['Yum yum!', 'Munch munch!', 'Crunch crunch!']), pets: want };
}
export function cleanHome(W, h) {
  const was = W.petDirt[h] || 0; W.petDirt[h] = 0; W.petStats.clean++; W.dirty = true;
  if (was > 0.5) earn(W, 3);
  if (W.petStats.clean >= 3) later(W, 2, () => achieve(W, 'petcare'));
  return was;
}
export function cleanMess(W, id) {
  W.petMess = W.petMess.filter(m => m.id !== id); W.petStats.poo++; W.dirty = true; earn(W, 2);
  if (W.petStats.poo >= 3) later(W, 2, () => achieve(W, 'poo'));
}
export function playWith(W, p, c) {
  const k = kindOf(p);
  if (k === 'dog') {
    // a quick run round in a circle
    p.busyUntil = W.T + 2.4; p.path = [];
    for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI * 2; const t = nav(p.room).nearestFree(c.x + Math.cos(a) * 1.3, c.y + Math.sin(a) * 1.3); p.path.push(t); }
  } else p.jumpT = W.T;
}

/* ---------------- jobs for the job card ---------------- */
export function petTodos(W) {
  const out = []; if (!W.pets || !W.pets.length) return out;
  const nm = p => defOf(p).name;
  for (const p of W.pets) if (p.hunger >= 1) out.push({ id: 'feed-' + p.id, icon: 'paw', text: `Feed ${nm(p)}`, tip: ['dog', 'cat'].includes(kindOf(p)) ? `Tap ${nm(p)}, then tap Feed.` : `Tap ${HOMES[HOME_OF[kindOf(p)]].name}, then tap Feed. It is in ${ROOMS[HOMES[HOME_OF[kindOf(p)]].room].name.toLowerCase()}.` });
  for (const p of W.pets) if (kindOf(p) === 'dog' && p.walk >= 1) out.push({ id: 'walk-' + p.id, icon: 'paw', text: `Take ${nm(p)} for a walk`, tip: `Go to the park with ${nm(p)}. Tap the front door, then Park.` });
  if (W.petMess.length) out.push({ id: 'poo', icon: 'poo', text: 'Clean up the poo', count: W.petMess.length > 1 ? String(W.petMess.length) : undefined, tip: 'It is in the garden. Tap it to scoop it up.' });
  for (const h of homesOwned(W)) if ((W.petDirt[h] || 0) >= 1) out.push({ id: 'clean-' + h, icon: 'paw', text: `Clean ${HOMES[h].name}`, tip: `Tap ${HOMES[h].name} in ${ROOMS[HOMES[h].room].name.toLowerCase()}, then tap Clean.` });
  return out;
}

/* ---------------- drawing ---------------- */
const Need = ({ kind }) => <g pointerEvents="none">
  <circle r={17} fill="#fff" stroke="#3b2a24" strokeWidth={2} /><circle cx={-12} cy={18} r={4} fill="#fff" stroke="#3b2a24" strokeWidth={1.5} />
  {kind === 'hungry' && <g><path d="M-10,-1 h20 l-3,8 h-14z" fill="#5b9bd5" /><circle cx={-4} cy={-3} r={2.5} fill="#a0694a" /><circle cx={1} cy={-4} r={2.5} fill="#a0694a" /><circle cx={5} cy={-2.5} r={2.5} fill="#a0694a" /></g>}
  {kind === 'walk' && <g><path d="M-9,8 q0,-14 10,-14 q8,0 8,7" fill="none" stroke="#e0524a" strokeWidth={3} /><circle cx={9} cy={1} r={3} fill="#e0524a" /></g>}
  {kind === 'dirty' && <g>{[-6, 0, 6].map(x => <path key={x} d={`M${x},9 q4,-5 0,-9 q-4,-4 0,-9`} fill="none" stroke="#7d9b3a" strokeWidth={2.4} strokeLinecap="round" />)}</g>}
</g>;
const PAD = ['#b9a3e3', '#a48ccf', '#9078bb'], ROPE = ['#e8d6b0', '#d8c294', '#c9b07c'], PINKBED = ['#e8a2b4', '#d68aa0', '#c4788e'], BLUE = ['#5fa8d8', '#4f8ac0', '#3f7aae'];
function Bowl({ x, y, full }) {
  return <g><Box x={x} y={y} w={0.26} d={0.26} h={0.07} c={BLUE} />{full && <FloorPlane z={0.072} x={x} y={y}>{[[8, 9], [15, 7], [12, 15], [19, 14], [7, 17]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3.5} fill="#a0694a" />)}</FloorPlane>}</g>;
}
function HomeArt({ h, W, T }) {
  const H = HOMES[h], { x, y, w, d } = H, pets = petsIn(W, h), dirt = W.petDirt[h] || 0;
  const full = pets.some(p => p.hunger < 0.4);
  if (h === 'bed') return <g>
    <Box x={x} y={y} w={w} d={d} h={0.16} c={PINKBED} />
    <FloorPlane z={0.162} x={x + 0.08} y={y + 0.08}><rect x={0} y={0} width={(w - 0.16) * 100} height={(d - 0.16) * 100} rx={18} fill="#f7d6df" /><path d={`M8,${(d - 0.16) * 50} h${(w - 0.16) * 100 - 16}`} stroke="#eab9c6" strokeWidth={3} /></FloorPlane>
    <Bowl x={x + H.bowl[0]} y={y + H.bowl[1]} full={full} />
  </g>;
  if (h === 'tree') {
    const nap = pets.find(p => p.nap && p.room === H.room && !p.walking && !p.path);
    return <g>
      <Box x={x} y={y} w={w} d={d} h={0.12} c={PAD} />
      <Box x={x + 0.27} y={y + 0.22} w={0.26} d={0.26} h={0.85} c={ROPE} />
      <Box x={x + 0.05} y={y + 0.05} z={0.85} w={0.7} d={0.6} h={0.1} c={PAD} />
      <Box x={x + 0.3} y={y + 0.25} z={0.95} w={0.22} d={0.22} h={0.55} c={ROPE} />
      <Box x={x + 0.12} y={y + 0.1} z={1.5} w={0.55} d={0.5} h={0.1} c={PAD} />
      {nap && (() => { const g = P(x + 0.4, y + 0.35, 0.95); return <g transform={`translate(${g[0]} ${g[1]})`}><PetArt p={defOf(nap)} T={0} s={0.7} /><text x={22} y={-46 - (T % 2) * 6} fontSize={16} fontWeight="800" fill="#7d6bb0" opacity={0.8}>z z</text></g>; })()}
      <Bowl x={x + H.bowl[0]} y={y + H.bowl[1]} full={full} />
    </g>;
  }
  if (h === 'tank') {
    const fish = pets, len = H.face === 'x' ? d : w, face = ch => (H.face === 'x' ? <FaceX x={x + w} y1={y + d} z1={1.22}>{ch}</FaceX> : <FaceY y={y + d} x0={x} z1={1.22}>{ch}</FaceY>);
    return <g>
      <Box x={x} y={y} w={w} d={d} h={0.6} c={['#ecd09c', '#dcb67e', '#c9a16a']} />
      <Box x={x} y={y} z={0.6} w={w} d={d} h={0.62} c={['#cfeaf2', '#a9d8e8', '#93cbe0']} />
      {face(<>
        <rect x={3} y={8} width={len * 100 - 6} height={54} fill="#7cc3e0" />
        <path d={`M3,62 V55 Q40,50 70,55 T${len * 100 - 3},54 V62 Z`} fill="#e8d3a2" />
        {[[18, 56, 26], [30, 56, 18], [len * 100 - 24, 55, 30]].map(([a, b, hh], i) => <path key={i} d={`M${a},${b} q${i % 2 ? 6 : -6},${-hh / 2} 0,${-hh}`} fill="none" stroke="#3f8a5a" strokeWidth={4} strokeLinecap="round" />)}
        {fish.map((f, i) => { const u = ((T * (0.12 + i * 0.03) + i * 0.6) % 2), right = u < 1, fx = right ? 16 + u * (len * 100 - 32) : len * 100 - 16 - (u - 1) * (len * 100 - 32), fy = 22 + i * 11 + Math.sin(T * 1.3 + i) * 4;
          return <g key={f.id} transform={`translate(${fx} ${fy + 10})`}><PetArt p={defOf(f)} T={T} ph={i} flip={!right} s={0.45} /></g>; })}
        {[0, 1, 2].map(i => { const k = ((T * 0.5 + i * 0.33) % 1); return <circle key={i} cx={len * 100 - 40 + Math.sin(T * 3 + i) * 3} cy={56 - k * 44} r={2 + i % 2} fill="none" stroke="#e8f6fb" strokeWidth={1.5} />; })}
        <rect x={3} y={8} width={len * 100 - 6} height={54} fill="#6f8f2e" opacity={dirt * 0.6} />
        {dirt > 0.4 && [[20, 20], [60, 34], [100, 18], [40, 46]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={5} fill="#5d7a24" opacity={dirt * 0.7} />)}
        <rect x={0} y={0} width={len * 100} height={8} fill="#2f6b5f" />
      </>)}
    </g>;
  }
  if (h === 'cage') {
    const birds = pets;
    return <g>
      <Box x={x + 0.22} y={y + 0.22} w={0.16} d={0.16} h={0.9} c={['#9aa1a6', '#8a9196', '#7a8186']} />
      <Box x={x + 0.05} y={y + 0.05} w={0.5} d={0.5} h={0.04} c={['#9aa1a6', '#8a9196', '#7a8186']} />
      <Box x={x} y={y} z={0.9} w={w} d={d} h={0.06} c={['#c9a54a', '#b8943c', '#a8842e']} />
      {dirt > 0.4 && <FloorPlane z={0.962} x={x} y={y}>{[[10, 12], [30, 40], [45, 20], [20, 50]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3} fill="#8a6a3a" opacity={dirt} />)}</FloorPlane>}
      <FaceY y={y + d / 2} x0={x} z1={1.75}>
        <path d={`M4,30 A${(w * 100 - 8) / 2},28 0 0 1 ${w * 100 - 4},30`} fill="none" stroke="#c9a54a" strokeWidth={2.5} />
        {Array.from({ length: 7 }, (_, k) => { const bx = 4 + k * (w * 100 - 8) / 6; return <line key={k} x1={bx} y1={30 - Math.sqrt(Math.max(0, 1 - ((bx - w * 50) / (w * 50 - 4)) ** 2)) * 28} x2={bx} y2={85} stroke="#c9a54a" strokeWidth={1.6} />; })}
        <line x1={10} y1={66} x2={w * 100 - 10} y2={66} stroke="#8a6a4a" strokeWidth={3} strokeLinecap="round" />
        {birds.map((b, i) => <g key={b.id} transform={`translate(${18 + i * 24} 66)`}><PetArt p={defOf(b)} T={T} ph={i * 2} s={0.62} flip={i % 2 === 1} /></g>)}
      </FaceY>
    </g>;
  }
  if (h === 'hutch') {
    const small = pets;
    return <g>
      <Box x={x} y={y} w={w} d={d} h={0.75} c={['#ecd09c', '#dcb67e', '#c9a16a']} />
      <Box x={x - 0.06} y={y - 0.06} z={0.75} w={w + 0.12} d={d + 0.12} h={0.08} c={['#b5452a', '#9a3a24', '#80301e']} />
      <FaceY y={y + d} x0={x} z1={0.75}>
        <rect x={6} y={8} width={w * 65} height={60} fill="#f6ead2" />
        <rect x={6} y={56} width={w * 65} height={12} fill="#e8c873" />
        {dirt > 0.4 && [[20, 60], [50, 62], [80, 59]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3.5} fill="#8a6a3a" opacity={dirt} />)}
        {small.map((p, i) => <g key={p.id} transform={`translate(${26 + i * 26 + Math.sin(T * 0.5 + i) * (kindOf(p) === 'tortoise' ? 6 : 3)} 66)`}><PetArt p={defOf(p)} T={T} ph={i * 1.7} s={0.6} /></g>)}
        {Array.from({ length: 10 }, (_, k) => <line key={k} x1={10 + k * w * 6.5} y1={8} x2={10 + k * w * 6.5} y2={68} stroke="#8a9196" strokeWidth={1.2} opacity={0.6} />)}
        <rect x={6} y={8} width={w * 65} height={60} fill="none" stroke="#b58e5a" strokeWidth={4} />
        <rect x={w * 70} y={8} width={w * 26} height={60} fill="#dcb67e" stroke="#b58e5a" strokeWidth={3} />
        <circle cx={w * 83} cy={40} r={11} fill="#5a3d32" />
      </FaceY>
    </g>;
  }
  return null;
}
// everything pet-shaped in this room, ready to be depth-sorted with the people
export function petDyn(W, R, T) {
  const out = []; if (!W.pets || !W.pets.length) return out;
  for (const h of homesOwned(W)) {
    const H = HOMES[h]; if (H.room !== R) continue;
    const need = petsIn(W, h).some(p => p.hunger >= 1 && !['dog', 'cat'].includes(kindOf(p))) ? 'hungry' : (W.petDirt[h] || 0) >= 1 ? 'dirty' : null;
    const top = P(H.x + H.w / 2, H.y + H.d / 2, h === 'tree' ? 1.9 : h === 'cage' ? 2.0 : h === 'tank' ? 1.6 : 1.1);
    out.push({ key: 'pethome-' + h, x: H.x + H.w / 2, y: H.y + H.d, z: 0, el: <g data-hit={'pethome:' + h} style={{ cursor: 'pointer' }}><HomeArt h={h} W={W} T={T} />{need && <g transform={`translate(${top[0] + 30} ${top[1] - 20}) scale(1.5)`}><Need kind={need} /></g>}</g> });
  }
  for (const p of W.pets) {
    if (p.room !== R || !['dog', 'cat'].includes(kindOf(p))) continue;
    if (kindOf(p) === 'cat' && p.nap && !p.walking && !p.path && R === HOMES.tree.room && dist([p.x, p.y], homeCenter('tree')) < 1.2) continue;
    const jump = p.jumpT && W.T - p.jumpT < 0.6 ? Math.sin((W.T - p.jumpT) / 0.6 * Math.PI) * 0.35 : 0;
    const g = P(p.x, p.y, jump), bob = p.walking ? -Math.abs(Math.sin(T * 12)) * 3 : 0;
    const need = p.hunger >= 1 ? 'hungry' : kindOf(p) === 'dog' && p.walk >= 1 ? 'walk' : null, s = 1.0;
    out.push({ key: 'pet-' + p.id, x: p.x, y: p.y, z: 0, el: <g data-hit={'pet:' + p.id} style={{ cursor: 'pointer' }} opacity={p.op == null ? 1 : p.op} transform={`translate(${g[0]} ${g[1]})`}>
      <ellipse cx={0} cy={2 + jump * 88} rx={30} ry={8} fill="rgba(60,30,10,.14)" /><circle cx={0} cy={-24} r={34} fill="transparent" />
      <g transform={`translate(0 ${bob})`}><PetArt p={defOf(p)} T={T} ph={p.id.length} flip={!!p.flip} s={s} /></g>
      {need && <g transform="translate(30 -86) scale(1.5)"><Need kind={need} /></g>}
    </g> });
  }
  for (const m of W.petMess) if (R === 'garden') {
    const g = P(m.x, m.y, 0);
    out.push({ key: 'mess-' + m.id, x: m.x, y: m.y, z: 0, el: <g data-hit={'mess:' + m.id} style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]})`}>
      <circle r={26} cy={-6} fill="transparent" />
      <ellipse cx={0} cy={0} rx={12} ry={5} fill="#6b4226" /><ellipse cx={0} cy={-5} rx={9} ry={4.5} fill="#7a4d2c" /><ellipse cx={0} cy={-10} rx={5.5} ry={3.5} fill="#87573a" /><path d="M0,-13 q3,-4 1,-6" stroke="#87573a" strokeWidth={3} fill="none" strokeLinecap="round" />
      {[0, 1].map(i => <path key={i} d={`M${-8 + i * 14},-16 q4,-6 0,-11 q-4,-5 0,-10`} fill="none" stroke="#8bc34a" strokeWidth={2} opacity={0.4 + 0.4 * Math.sin(T * 3 + i)} />)}
    </g> });
  }
  return out;
}

/* ---------------- screens ---------------- */
export function PetIcon({ id, T = 0, size = 64 }) {
  const p = BY_ID[id];
  return <svg width={size} height={size * 0.78} viewBox="-42 -62 92 70" aria-hidden="true" style={{ display: 'block' }}><PetArt p={p} T={T} ph={p.price} s={SIZE[p.kind]} /></svg>;
}
const TABS = CATS;
export function PetShopPanel({ W, T, start, onAdopt, onClose }) {
  const [cat, setCat] = useState(start || 'dogs');
  const [sel, setSel] = useState(null);
  const [hearts, setHearts] = useState(-1);
  const owned = W.pets.map(p => p.id);
  const items = cat === 'mine' ? owned.map(id => BY_ID[id]) : PETS.filter(p => p.cat === cat);
  const it = sel && BY_ID[sel], show = it || items[0];
  const has = it && owned.includes(it.id);
  let btn = { label: 'Tap a pet to meet them', off: true };
  if (it && has) btn = { label: `Cuddle ${it.name}`, go: () => { setHearts(T + 1.8); SFX.sparkle(); speak(pick(NOISE[it.kind]), 'word'); } };
  else if (it && owned.length >= MAX_PETS) btn = { label: 'Your house is full of pets!', off: true };
  else if (it && W.coins < it.price) btn = { label: `You need ${it.price - W.coins} more coins`, off: true };
  else if (it) btn = { label: `Adopt ${it.name}`, go: () => { if (onAdopt(it.id)) { setHearts(T + 1.8); setCat('mine'); } }, coin: it.price };
  const hk = hearts > T ? 1 - (hearts - T) / 1.8 : -1;
  const pickPet = p => { setSel(sel === p.id ? null : p.id); speak(`${p.name}. ${p.desc}.`, 'narrator'); SFX.pop(); };
  return <div className="sheet petshop" role="dialog" aria-label="Pet shop" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Paws and Whiskers. Pick a pet!', 'narrator')}>Paws &amp; Whiskers</button><span className="coins-pill"><i />{W.coins}</span><button className="pill" onClick={onClose}>Close</button></div>
    <div className="pet-body">
      <div className={'pet-stage ' + cat}>
        {show ? <svg viewBox="-62 -80 130 92" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <ellipse cx={4} cy={2} rx={44} ry={6} fill="rgba(59,42,36,.1)" />
          <PetArt p={show} T={T} ph={0} s={SIZE[show.kind]} />
          {hk >= 0 && [-22, 4, 28].map((x, i) => <path key={i} d={HEART} fill="#e96d9a" transform={`translate(${x + Math.sin(T * 4 + i) * 3} ${-40 - hk * 30 - i * 4}) scale(${1.1 - hk * 0.4})`} opacity={1 - hk} />)}
        </svg> : <p className="pet-empty">No pets yet. Pick one from the shop!</p>}
        {show && <button className="pet-name" onClick={() => speak(`${show.name}. ${show.desc}.`, 'narrator')}><b>{show.name}</b><small>{show.desc}</small></button>}
      </div>
      <div className="pet-pick">
        <div className="pet-tabs">{TABS.map(c => <button key={c.id} className={'pill' + (c.id === cat ? ' on' : '')} aria-pressed={c.id === cat} onClick={() => { setCat(c.id); setSel(null); speak(c.label, 'word'); }}>{c.label}{c.id === 'mine' && owned.length ? ` (${owned.length})` : ''}</button>)}</div>
        <div className="pet-grid">{items.map(p => { const mine = owned.includes(p.id);
          return <button key={p.id} className="pet-tile" aria-pressed={sel === p.id} onClick={() => pickPet(p)}>
            <PetIcon id={p.id} T={sel === p.id ? T : 0} size={60} /><b>{p.name}</b><small>{p.desc}</small>
            <span className={'pet-price' + (mine ? ' mine' : '')}>{mine ? 'Yours' : <><i />{p.price}</>}</span></button>; })}</div>
        <button className="done pet-go" disabled={btn.off} onClick={btn.go}>{btn.label}{btn.coin ? <span className="coin-tag"><i />{btn.coin}</span> : null}</button>
      </div>
    </div>
  </div>;
}
// food choice: read the words and pick the right one
export function PetFoodPanel({ W, ids, onFeed, onClose }) {
  const pets = W.pets.filter(p => ids.includes(p.id));
  const right = pets.length ? FOOD[kindOf(pets[0])] : null;
  const [opts] = useState(() => { const o = new Set([right]); while (o.size < 4) o.add(pick(FOODS)); return [...o].sort(() => Math.random() - 0.5); });
  if (!pets.length) return null;
  const names = pets.map(p => defOf(p).name);
  const who = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
  return <div className="sheet petfood" role="dialog" aria-label="Pet food" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(`What do ${KIND_WORD[kindOf(pets[0])]} eat?`, 'narrator')}>Food for {who}</button><button className="pill" onClick={onClose}>Close</button></div>
    <p className="petfood-q">What do {KIND_WORD[kindOf(pets[0])]} eat?</p>
    <div className="petfood-grid">{opts.map(f => <button key={f} className="tile food-tile" onClick={() => onFeed(f)}><FoodIcon f={f} /><span>{f}</span></button>)}</div>
  </div>;
}
export function FoodIcon({ f, size = 54 }) {
  return <svg viewBox="-20 -20 40 40" width={size} height={size} aria-hidden="true">
    {(f === 'dog food' || f === 'cat food') && <g><path d="M-12,-14 h24 v26 q0,4 -4,4 h-16 q-4,0 -4,-4z" fill={f === 'dog food' ? '#e0524a' : '#9b7cc4'} /><rect x={-12} y={-6} width={24} height={10} fill="#fbf6ee" />{f === 'dog food' ? <path d="M-6,-1 h12 M-8,-3 a2,2 0 1 1 0,4 M8,-3 a2,2 0 1 0 0,4" stroke="#a0694a" strokeWidth={2.2} fill="none" /> : <g><ellipse cx={0} cy={-1} rx={6} ry={3} fill="#5b9bd5" /><path d="M-6,-1 l-4,-3 v6z" fill="#5b9bd5" /></g>}</g>}
    {f === 'fish food' && <g><rect x={-9} y={-14} width={18} height={26} rx={3} fill="#f2c94c" /><rect x={-9} y={-16} width={18} height={6} rx={2} fill="#e0524a" /><ellipse cx={0} cy={2} rx={5} ry={3} fill="#f28c28" /><path d="M-5,2 l-3,-3 v6z" fill="#f28c28" /></g>}
    {f === 'bird seed' && <g><path d="M-12,-10 q12,-6 24,0 l-3,22 h-18z" fill="#c9a16a" />{[[-4, 2], [2, -2], [5, 5], [-2, 7], [0, 0]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={1.8} ry={1.1} fill="#5a3d32" />)}</g>}
    {f === 'carrots' && <g>{[-6, 4].map((dx, i) => <g key={i} transform={`translate(${dx} 0) rotate(${i ? 15 : -15})`}><path d="M-3,-6 L3,-6 L0,14 Z" fill="#f28a1c" /><path d="M-2,-6 l-3,-7 M0,-6 v-8 M2,-6 l3,-7" stroke="#4cc76a" strokeWidth={2} /></g>)}</g>}
    {f === 'lettuce' && <g><circle r={12} fill="#7cc96a" /><path d="M0,-12 v24 M-8,-6 q8,6 16,0 M-9,3 q9,6 18,0" stroke="#4f9a40" strokeWidth={1.6} fill="none" /></g>}
    {f === 'seeds' && <g><ellipse cx={0} cy={6} rx={14} ry={6} fill="#5b9bd5" />{[[-6, 2], [-2, 0], [3, 1], [7, 3], [0, 4], [-4, 5], [5, 5]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={2} ry={1.2} fill="#d9b26a" stroke="#a0694a" strokeWidth={0.5} />)}</g>}
  </svg>;
}
export function PetMenu({ x, y, title, buttons, onClose }) {
  return <div className="pmenu petmenu" style={{ left: x, top: y }} onPointerDown={e => e.stopPropagation()}>
    <span className="pm-title">{title}</span>
    {buttons.map(b => <button key={b.label} className="pm" onClick={b.go}>{b.icon}<span>{b.label}</span></button>)}
    <button className="pm close" onClick={onClose} aria-label="Close">×</button>
  </div>;
}
export const PM_ICONS = {
  feed: <svg viewBox="-12 -12 24 24" width="30" height="30"><path d="M-10,0 h20 l-3,8 h-14z" fill="#5b9bd5" /><circle cx={-4} cy={-2} r={3} fill="#a0694a" /><circle cx={2} cy={-3} r={3} fill="#a0694a" /><circle cx={6} cy={-1} r={2.5} fill="#a0694a" /></svg>,
  cuddle: <svg viewBox="-12 -12 24 24" width="30" height="30"><path d="M0,10 C-13,1 -10,-10 0,-3 C10,-10 13,1 0,10Z" fill="#e86a92" /></svg>,
  play: <svg viewBox="-12 -12 24 24" width="30" height="30"><circle r={9} fill="#e96d6d" /><path d="M-9,0 q9,-5 18,0" stroke="#fff" strokeWidth={2} fill="none" /></svg>,
  clean: <svg viewBox="-12 -12 24 24" width="30" height="30"><rect x={-9} y={-4} width={18} height={11} rx={3} fill="#f2c94c" /><circle cx={-5} cy={-8} r={2.5} fill="#bfe0f7" /><circle cx={1} cy={-9} r={3} fill="#bfe0f7" /><circle cx={6} cy={-7} r={2} fill="#bfe0f7" /></svg>,
};
