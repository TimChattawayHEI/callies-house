// Random encounters: animals outside (butterflies, birds, a cat, a balloon at the park),
// letters on the doormat to read, and friends from New Street knocking to come and play.
import React from 'react';
import { P, rand, pick, SFX, speak, achieve, earn, dist } from './core.js';
import { say, later, nav, travel, walkTo } from './world.js';
import { ROOMS } from './rooms.jsx';
import { OUTSIDE } from './sky.jsx';
import { NAMES } from './people.jsx';

/* ---------------- animals ---------------- */
const KIND_ROOMS = {
  butterfly: r => OUTSIDE.has(r) || r === 'park',
  bird: r => OUTSIDE.has(r) || r === 'park' || r === 'school',
  cat: r => r === 'garden' || r === 'nannygarden' || (ROOMS[r] && ROOMS[r].rk === 'garden'),
  balloon: r => r === 'park',
};
const WINGS = ['#f39ac6', '#ffd45e', '#8ec5ea', '#b58ee0', '#ff9a3d'];
export function initEncounters(W, saved) {
  W.critters = []; W.critNext = 20; W.critId = 0;
  W.met = (saved && saved.met) || {};
  W.letter = (saved && saved.letter) || null; W.letterNext = 120; W.lettersRead = (saved && saved.lettersRead) || 0;
  W.visit = null; W.visitNext = 240;
}
export function stepCritters(W, dt) {
  const R = W.room;
  W.critters = W.critters.filter(c => c.room === R && W.T < c.until && (c.kind !== 'balloon' || c.z < 7));
  const fits = Object.keys(KIND_ROOMS).filter(k => KIND_ROOMS[k](R) && !W.critters.some(c => c.kind === k));
  if (W.T > W.critNext && fits.length && W.critters.length < 2 && !W.bedtime) {
    W.critNext = W.T + rand(25, 55);
    const night = W.clock != null && (W.clock < 6.5 || W.clock > 20);
    const kind = pick(fits.filter(k => !night || k === 'cat'));
    if (kind) {
      const N = nav(R), [x, y] = N.randomFree(1)[0];
      W.critters.push({ id: ++W.critId, kind, room: R, x, y, z: kind === 'butterfly' ? 1.2 : kind === 'balloon' ? 0.4 : 0, tx: x, ty: y, until: W.T + rand(35, 60), t0: W.T, col: pick(WINGS), flip: false, sit: 0, fled: 0 });
    }
  }
  for (const c of W.critters) {
    const speed = c.fled ? 3.5 : c.kind === 'butterfly' ? 0.9 : c.kind === 'cat' ? 0.5 : c.kind === 'bird' ? 0.8 : 0.25;
    if (c.kind === 'balloon') { c.z += dt * (c.fled ? 1.6 : 0.35); c.x += Math.sin(W.T * 0.8 + c.id) * dt * 0.3; continue; }
    if (c.fled) { c.z += dt * 2.5; c.x += dt * speed; c.y -= dt * speed; if (c.z > 6) c.until = 0; continue; }
    if (c.sit > W.T) continue;
    const d = Math.hypot(c.tx - c.x, c.ty - c.y);
    if (d < 0.1) {
      const [nx, ny] = nav(c.room).randomFree(1)[0];
      c.tx = c.x + (nx - c.x) * (c.kind === 'butterfly' ? 0.6 : 0.4); c.ty = c.y + (ny - c.y) * (c.kind === 'butterfly' ? 0.6 : 0.4);
      if (c.kind !== 'butterfly' && rand(0, 1) < 0.6) c.sit = W.T + rand(1.5, 5);
    } else { const k = Math.min(1, dt * speed / d); c.flip = c.tx > c.x; c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k; }
    if (c.kind === 'butterfly') c.z = 1.1 + Math.sin(W.T * 2 + c.id) * 0.35;
    if (c.kind === 'bird') c.z = c.sit > W.T ? 0 : Math.abs(Math.sin(W.T * 9 + c.id)) * 0.12;
  }
}
const SOUND = { butterfly: () => SFX.sparkle(), bird: () => SFX.squeak(), cat: () => SFX.squeak(), balloon: () => SFX.pop() };
const LINES = { butterfly: ['A butterfly!', 'So pretty!', 'Flutter flutter!'], bird: ['Tweet tweet!', 'A little bird!', 'Hello, bird!'], cat: ['Meow!', 'Hello, kitty!', 'Purr purr!'], balloon: ['Pop!', 'A red balloon!', 'Up it goes!'] };
// tap an animal: it reacts, says its name, and counts towards the animal sticker
export function tapCritter(W, id, me, fx) {
  const c = W.critters.find(x => String(x.id) === String(id)); if (!c) return;
  const word = { butterfly: 'butterfly', bird: 'bird', cat: 'cat', balloon: 'balloon' }[c.kind];
  SOUND[c.kind]();
  fx(word, P(c.x, c.y, c.z + 0.6));
  if (c.kind === 'cat') { c.sit = W.T + 4; fx(null, P(c.x, c.y, 0.8), 'hearts'); later(W, 0.5, () => say(W, me, pick(LINES.cat))); }
  else if (c.kind === 'balloon') { c.fled = 1; fx(null, P(c.x, c.y, c.z + 0.6), 'confetti'); }
  else { c.fled = 1; later(W, 0.4, () => say(W, me, pick(LINES[c.kind]))); }
  if (!W.met[c.kind]) { W.met[c.kind] = W.T; W.dirty = true; earn(W, 2); }
  if (['butterfly', 'bird', 'cat'].every(k => W.met[k])) later(W, 1.5, () => achieve(W, 'animals'));
}
export function CritterArt({ c, T }) {
  const flap = Math.sin(T * 16 + c.id);
  if (c.kind === 'butterfly') return <g transform={`scale(${c.flip ? -1 : 1} 1)`}>
    <g transform={`scale(${0.35 + Math.abs(flap) * 0.65} 1)`}><ellipse cx={-9} cy={-6} rx={10} ry={8} fill={c.col} /><ellipse cx={9} cy={-6} rx={10} ry={8} fill={c.col} /><ellipse cx={-7} cy={5} rx={7} ry={6} fill={c.col} opacity={0.75} /><ellipse cx={7} cy={5} rx={7} ry={6} fill={c.col} opacity={0.75} /></g>
    <rect x={-1.5} y={-10} width={3} height={20} rx={1.5} fill="#3b2a24" /></g>;
  if (c.kind === 'bird') return <g transform={`scale(${c.flip ? -1 : 1} 1)`}>
    <ellipse cx={0} cy={-8} rx={12} ry={9} fill="#5b9bd5" /><circle cx={9} cy={-15} r={6} fill="#5b9bd5" /><path d="M14,-15 l6,1.5 -6,2Z" fill="#f2b84b" /><circle cx={10} cy={-16} r={1.4} fill="#222" />
    <path d={`M-4,-10 q-6,${c.fled ? -14 * flap : -6} -12,0`} fill="#3f78ad" /><ellipse cx={2} cy={-5} rx={6} ry={4} fill="#ffd9a8" />
    {!c.fled && <path d="M-2,0 v4 M3,0 v4" stroke="#f2b84b" strokeWidth={1.5} />}</g>;
  if (c.kind === 'cat') { const walk = c.sit > T ? 0 : Math.sin(T * 8) * 3; return <g transform={`scale(${c.flip ? 1 : -1} 1)`}>
    <ellipse cx={0} cy={-12} rx={16} ry={10} fill="#f2a65a" /><path d={`M-12,-4 v${6 + walk} M-6,-4 v${6 - walk} M6,-4 v${6 + walk} M12,-4 v${6 - walk}`} stroke="#e08d3e" strokeWidth={4} strokeLinecap="round" />
    <circle cx={-16} cy={-22} r={9} fill="#f2a65a" /><path d="M-23,-27 l1,-9 6,6 M-10,-27 l-1,-9 -6,6" fill="#f2a65a" stroke="#f2a65a" strokeWidth={2} strokeLinejoin="round" />
    <circle cx={-19} cy={-23} r={1.5} fill="#222" /><circle cx={-13} cy={-23} r={1.5} fill="#222" /><path d="M-17,-19 l1,1 1,-1" stroke="#c96b2a" fill="none" strokeWidth={1.2} />
    <path d={`M15,-14 q14,${-4 + Math.sin(T * 3) * 6} 10,-20`} fill="none" stroke="#f2a65a" strokeWidth={5} strokeLinecap="round" />
    <path d="M-4,-18 q4,-3 8,0 M2,-14 q4,-3 8,0" stroke="#e08d3e" strokeWidth={2} fill="none" /></g>; }
  return <g><path d={`M0,0 q-4,10 0,${20 + c.z * 10}`} fill="none" stroke="#3b2a24" strokeWidth={1.2} transform="translate(0 -6)" /><ellipse cx={0} cy={-20} rx={14} ry={18} fill="#e0524a" /><ellipse cx={-5} cy={-27} rx={4} ry={6} fill="#fff" opacity={0.5} /><path d="M-3,-2 l3,-3 3,3z" fill="#c43b33" /></g>;
}

/* ---------------- letters on the doormat ---------------- */
const LETTERS = [
  { from: 'Nanny', lines: ['Dear Callie,', 'I love you lots.', 'Come and see me soon!', 'Love from Nanny'] },
  { from: 'Grandad', lines: ['Dear Callie,', 'The ducks are big and fat.', 'Shall we feed them?', 'Love from Grandad'] },
  { from: 'School', lines: ['Dear Callie,', 'Well done for good reading!', 'You are a star!', 'From your teacher'] },
  { from: 'the Tooth Fairy', lines: ['Dear Callie,', 'Keep your teeth clean.', 'Brush them every day!', 'From the Tooth Fairy'] },
  { from: 'the zoo', lines: ['Dear Callie,', 'The lion says roar!', 'The cat says meow.', 'From the zoo'] },
  { from: 'Mia', lines: ['Dear Callie,', 'Can you come to play?', 'We can go to the park.', 'Love from your friend'] },
  { from: 'Santa', lines: ['Dear Callie,', 'Have you been good?', 'I think you have!', 'Ho ho ho! Santa'], month: 11 },
  { from: 'the farm', lines: ['Dear Callie,', 'The pig is in the mud.', 'The hen has an egg.', 'From the farm'] },
  { from: 'Auntie', lines: ['Dear Callie,', 'I saw a big red bus.', 'It went beep beep!', 'Love from Auntie'] },
  { from: 'the moon', lines: ['Dear Callie,', 'I come out at night.', 'Look up and wave!', 'From the moon'] },
];
export function stepPost(W) {
  if (W.letter || W.T < W.letterNext || W.out || W.bedtime || W.hide) return;
  const choices = LETTERS.map((l, i) => i).filter(i => LETTERS[i].month == null || LETTERS[i].month === new Date().getMonth());
  const i = pick(choices.filter(i => i !== W.lastLetter).length ? choices.filter(i => i !== W.lastLetter) : choices);
  W.letter = { i, x: 1.7 + rand(-0.2, 0.3), y: 1.75 + rand(-0.1, 0.2) }; W.lastLetter = i; W.dirty = true;
  SFX.plop(); later(W, 0.15, () => SFX.plop());
  const g = ['mum', 'dad'].find(k => k !== W.player && W.people[k] && W.people[k].room);
  if (g) later(W, 0.6, () => say(W, g, pick(['Post! A letter for you!', 'The post is here!', 'There is a letter on the mat!']), W.people[g].room === W.room ? null : { type: 'off', id: g }));
}
export const letterOf = W => (W.letter ? (W.letter.lines ? { from: W.letter.from, lines: W.letter.lines } : LETTERS[W.letter.i]) : null);
export function readLetter(W) {
  W.letter = null; W.letterNext = W.T + rand(300, 480); W.lettersRead = (W.lettersRead || 0) + 1; W.dirty = true;
  earn(W, 3); if (W.lettersRead >= 3) later(W, 1, () => achieve(W, 'post'));
}
export function LetterArt() {
  return <g transform="rotate(-8)"><rect x={-24} y={-16} width={48} height={30} rx={3} fill="#fff6ea" stroke="#e3d0ae" strokeWidth={2} /><path d="M-24,-16 L0,2 L24,-16" fill="none" stroke="#e3d0ae" strokeWidth={2} /><rect x={12} y={-12} width={8} height={9} fill="#e86a92" /></g>;
}
// the opened letter: every word can be tapped to hear it
export function LetterPanel({ W, onClose }) {
  const L = letterOf(W); if (!L) return null;
  const all = L.lines.join(' ');
  return <div className="sheet letter-sheet" role="dialog" aria-label={`A letter from ${L.from}`} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(`A letter from ${L.from}`, 'narrator')}>A letter!</button><button className="done" onClick={onClose}>Done</button></div>
    <div className="letter-paper">
      <span className="stamp" aria-hidden="true">★</span>
      {L.lines.map((ln, i) => <p key={i} className={i === 0 ? 'dear' : i === L.lines.length - 1 ? 'sign' : ''}>{ln.split(' ').map((w, j) => <button key={j} className="lw" onClick={() => speak(w.replace(/[^A-Za-z']/g, ''), 'word')}>{w}</button>)}</p>)}
    </div>
    <button className="pill read-it" onClick={() => speak(all, 'narrator')}>Read it to me</button>
  </div>;
}

/* ---------------- friends from New Street come to play ---------------- */
export function stepVisit(W, folkHome) {
  const v = W.visit;
  if (v) {
    const p = W.people[v.who];
    if (!p) { W.visit = null; return; }
    if (W.T > v.until && !v.leaving) {
      v.leaving = true;
      say(W, v.who, pick(['Bye! See you soon!', 'I have to go home now. Bye!', 'Thank you for having me!']), p.room === W.room ? null : { type: 'off', id: v.who });
      p.busy = 'visit'; travel(W, p, { room: 'downhall', x: 1.2, y: 1.9, then: () => { later(W, 0.4, () => { W.visit = null; p.busy = null; folkHome(W, v.who); }); } });
    }
    return;
  }
  if (W.T < W.visitNext || W.out || W.bedtime || W.hide || W.photo || !W.folk) return;
  const folk = Object.values(W.folk.people).filter(d => d.fam !== 'home' && W.people[d.id] && W.people[d.id].id !== W.player && !(W.out && (W.out.party || []).includes(d.id)));
  W.visitNext = W.T + rand(420, 720);
  if (!folk.length) return;
  const d = pick(folk), p = W.people[d.id];
  SFX.doorbell && SFX.doorbell();
  W.visit = { who: d.id, until: W.T + rand(90, 150) };
  later(W, 1.2, () => {
    Object.assign(p, { room: 'downhall', x: 1.2, y: 1.9, z: 0, mode: 'stand', path: null, goal: null, then: null, busy: 'visit', op: 1, facing: 'front' });
    say(W, d.id, pick([`Hello! It is me, ${d.name}! Can I come in?`, `Hi! Can I come and play?`, `Knock knock! It is ${d.name}!`]), W.room === 'downhall' ? null : { type: 'off', id: d.id });
    later(W, 2.5, () => { if (W.visit && W.visit.who === d.id) { p.busy = null; travel(W, p, { room: 'living', x: rand(3, 5), y: rand(2.5, 3.5) }); } });
    later(W, 3, () => achieve(W, 'visitor'));
  });
}
export const isVisitor = (W, id) => !!(W.visit && W.visit.who === id);
void dist; void walkTo; void NAMES;
