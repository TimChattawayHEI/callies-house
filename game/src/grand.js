// Nanny and Grandad: they live at their house and potter about between the kitchen, upstairs and the garden.
import { rand, pick, dist, SFX } from './core.js';
import { nav, walkTo, travel, sitOn, say, later, SEATS } from './world.js';

const ROOMS_OF_NANNY = ['nannydown', 'nannyup', 'nannygarden'];
const blank = (id, room, x, y, extra = {}) => ({ id, room, x, y, z: 0, mode: 'stand', path: null, then: null, facing: 'front', flip: false, walkPhase: 0, action: null, op: 1, speed: 1.6, holding: null, nextAct: 0, act: null, ...extra });

// Grandad's own end of the sofa (Callie sits at the other end).
const OWN = { 'grandad:sofa': { stand: [5.4, 9.75], seat: [5.4, 8.6, 0.57], face: 'front', flip: true } };
const seatOf = k => SEATS[k] || OWN[k];
// Things they like doing. seat = a SEATS key to sit on; face = which way to look when they get there.
const ACTS = {
  nanny: [
    { id: 'cook', room: 'nannydown', at: [1.35, 3.7], face: 'back', flip: true, line: ['I am making a cake!', 'Something smells yummy!'] },
    { id: 'sink', room: 'nannydown', at: [2.4, 1.25], face: 'back', line: ['Washing up!', 'Who wants a cup of tea?'] },
    { id: 'towels', room: 'nannyup', at: [11.4, 1.15], face: 'back', line: ['Folding the towels.', 'Nice and warm!'] },
    { id: 'water', room: 'nannygarden', at: [6.4, 1.0], face: 'back', line: ['Watering my flowers!', 'Look at my pretty flowers!'], hold: 'can' },
    { id: 'pots', room: 'nannygarden', at: [16.9, 3.4], face: 'front', flip: true, line: ['My cactus is growing!', 'Lovely lavender!'], hold: 'can' },
    { id: 'table', room: 'nannydown', at: [10.9, 10.4], face: 'front', line: ['Time to lay the table.', 'Dinner soon!'] },
    { id: 'sit', room: 'nannydown', seat: 'nannydown:Armchair', line: ['Ooh, a sit down!', 'My feet are tired!'] },
  ],
  grandad: [
    { id: 'sofa', room: 'nannydown', seat: 'grandad:sofa', line: ['Time for the news.', 'Is the football on?'] },
    { id: 'clock', room: 'nannydown', at: [9.9, 1.15], face: 'back', line: ['Tick tock! Winding the clock.', 'Bong, bong!'] },
    { id: 'fountain', room: 'nannygarden', at: [9.2, 5.5], face: 'back', line: ['Look at the water!', 'I fixed the fountain!'] },
    { id: 'bench', room: 'nannygarden', seat: 'nannygarden:Seating', line: ['Lovely and sunny!', 'Ahh, that is nice.'] },
    { id: 'paper', room: 'nannydown', seat: 'nannydown:BigArmchair', line: ['Reading my paper.', 'Where are my glasses?'] },
    { id: 'bed', room: 'nannyup', at: [4.2, 9.5], face: 'front', line: ['Just having a look.', 'Ooh, my knees!'] },
  ],
};

export function grandsArrive(W) {
  const nanny = W.people.nanny || (W.people.nanny = blank('nanny', 'nannydown', 1.6, 3.7));
  const gd = W.people.grandad || (W.people.grandad = blank('grandad', 'nannydown', 3.6, 9.7));
  Object.assign(nanny, { room: 'nannydown', x: 2.0, y: 3.7, z: 0, mode: 'stand', path: null, goal: null, then: null, holding: null, act: 'cook', nextAct: W.T + rand(14, 20), facing: 'back', flip: true, op: 1 });
  const s = OWN['grandad:sofa'];
  Object.assign(gd, { room: 'nannydown', mode: 'sit', path: null, goal: null, then: null, holding: null, act: 'sofa', nextAct: W.T + rand(20, 30), op: 1, seatStand: s.stand, facing: s.face, flip: !!s.flip });
  [gd.x, gd.y, gd.z] = s.seat;
}

// Every so often each of them wanders off to do something else.
export function stepGrands(W) {
  if (!W.out || W.out.place !== 'nanny') return;
  for (const id of ['nanny', 'grandad']) {
    const p = W.people[id];
    if (!p || !ROOMS_OF_NANNY.includes(p.room) || p.goal || p.busy || p.mode === 'walk' || p.mode === 'hop' || W.T < p.nextAct) continue;
    if (p.hugT && W.T - p.hugT < 6) { p.nextAct = W.T + 4; continue; }
    const options = ACTS[id].filter(a => a.id !== p.act && !(a.seat && Object.values(W.people).some(q => q !== p && q.room === a.room && q.mode === 'sit' && dist([q.x, q.y], seatOf(a.seat).seat) < 0.4)));
    const a = pick(options);
    p.act = a.id; p.nextAct = W.T + rand(18, 30); p.holding = null;
    const arrive = () => {
      if (a.hold) p.holding = a.hold;
      if (a.face) { p.facing = a.face; p.flip = !!a.flip; }
      if (a.line && p.room === W.room) later(W, 0.6, () => { if (p.room === W.room) say(W, id, pick(a.line)); });
      if (a.id === 'clock') later(W, 1.2, () => { if (p.room === W.room) SFX.bell(); });
    };
    if (p.mode === 'sit') { p.mode = 'stand'; p.z = 0; if (p.seatStand) { p.x = p.seatStand[0]; p.y = p.seatStand[1]; } p.seatStand = null; }
    if (a.seat) { const s = seatOf(a.seat); travel(W, p, { room: a.room, x: s.stand[0], y: s.stand[1], then: () => { sitOn(W, p, s); later(W, 0.6, arrive); } }); }
    else { const t = nav(a.room).nearestFree(a.at[0], a.at[1]); travel(W, p, { room: a.room, x: t[0], y: t[1], then: arrive }); }
  }
}
export const GRAND_HUGS = {
  nanny: ['Hello, my darling!', 'Give Nanny a big cuddle!', 'You are getting so big!', 'Would you like a biscuit?', 'I love you to the moon!'],
  grandad: ['Hello, sweetheart!', 'Big hug for Grandad!', 'Who is this? It is Callie!', 'Shall we play a game?', 'Ooh, careful of my knees!'],
};
