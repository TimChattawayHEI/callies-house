// Family asks: little quests a grown-up sets. Feed the ducks (find bread, go to the park),
// and school mornings (uniforms on, off to school). Each one ends with a sticker.
import { rand, SFX, achieve, earn } from './core.js';
import { say, later, inHouse } from './world.js';

export const KIDS = ['callie', 'chloe'];
const off = (W, id) => (W.people[id] && W.people[id].room === W.room ? null : { type: 'off', id });

export function initAsks(W, saved) {
  const s = (saved && saved.asks) || {};
  const keep = k => (s[k] && s[k].state === 'active' ? 'active' : 'idle');
  W.asks = { ducks: { state: keep('ducks'), nextT: 150, who: (s.ducks && s.ducks.who) || 'dad' }, school: { state: keep('school'), nextT: 300, morning: null } };
  W.uniform = (saved && saved.uniform) || {};
  W.spiderN = (saved && saved.spiderN) || 0;
  if (W.asks.ducks.state === 'active') addBread(W);
}
export function addBread(W) {
  if (!W.items.find(i => i.kind === 'bread')) W.items.push({ id: 'q-bread', kind: 'bread', room: 'kitchen', loc: { s: 'in', box: 'kitchen:cupboard', order: -1 }, rot: 0 });
  W.dirty = true;
}
const calm = W => !W.out && !W.bedtime && !W.photo && !W.dance && !W.hide && !W.drive;

export function stepAsks(W) {
  const A = W.asks; if (!A) return;
  // the morning after bedtime is a school morning
  if (W.morningFlash && A.school.morning !== W.morningFlash && W.T - W.morningFlash > 6) { A.school.morning = W.morningFlash; if (A.school.state === 'idle') A.school.nextT = W.T; }
  if (A.school.state === 'idle' && W.T > A.school.nextT && calm(W) && W.player !== 'mum' && inHouse(W.people.mum) && W.people.mum.mode !== 'lie') startSchool(W);
  else if (A.ducks.state === 'idle' && W.T > A.ducks.nextT && calm(W) && !(A.school.state === 'active')) startDucks(W);
}

/* ---------------- feed the ducks ---------------- */
export function startDucks(W) {
  const A = W.asks.ducks, who = W.player === 'dad' ? 'mum' : 'dad';
  A.state = 'active'; A.who = who; W.dirty = true; addBread(W);
  SFX.quack();
  say(W, who, 'Shall we feed the ducks at the park? Get some bread from the kitchen!', off(W, who));
}
// at the pond with bread in the bag: the ducks come over for a feast
export function ducksFed(W) {
  const A = W.asks.ducks;
  W.items = W.items.filter(i => i.kind !== 'bread');
  A.state = 'idle'; A.nextT = W.T + rand(480, 720); W.dirty = true;
  later(W, 3.2, () => { if (!achieve(W, 'ducks')) earn(W, 5); });
}

/* ---------------- school morning ---------------- */
export function startSchool(W) {
  const A = W.asks.school;
  A.state = 'active'; W.dirty = true;
  const me = W.player, lead = KIDS.includes(me) ? me : null;
  SFX.bell();
  say(W, 'mum', lead ? `Time for school! Put your uniform on, ${lead === 'callie' ? 'Callie' : 'Chloe'}!` : 'Time for school! Uniforms on, girls!', off(W, 'mum'));
  // the girl you are not playing gets ready on her own
  for (const k of KIDS) if (k !== me) {
    later(W, k === 'chloe' ? 9 : 6, () => {
      if (A.state !== 'active' || W.uniform[k]) return;
      W.uniform[k] = true; W.dirty = true;
      say(W, k, k === 'chloe' ? 'Ugh. Fine. Uniform on.' : 'I am ready for school!', off(W, k));
    });
  }
}
export const schoolReady = W => W.asks && W.asks.school.state === 'active' && (!KIDS.includes(W.player) || W.uniform[W.player]);
export function schoolDone(W) {
  const A = W.asks.school;
  if (A.state !== 'active') return;
  A.state = 'idle'; A.nextT = W.T + rand(720, 960); W.dirty = true;
  later(W, 4, () => { if (!achieve(W, 'school')) earn(W, 5); });
}

/* ---------------- school uniforms ---------------- */
const UNIFORM = {
  callie: { top: 'jumper', color: '#3f6e9a', pattern: 'plain', legs: '#5b5f66', bottom: 'skirt', shoes: '#2a2a2c', boots: false },
  chloe: { top: 'jumper', color: '#3f6e9a', pattern: 'plain', legs: '#5b5f66', bottom: 'jeans', shoes: '#2a2a2c', boots: false, feet: 'shoes' },
};
export const UNIFORM_LOOK = UNIFORM;
export function dressed(W, outfits) {
  if (!W.uniform || !(W.uniform.callie || W.uniform.chloe)) return outfits;
  const o = { ...outfits };
  for (const k of KIDS) if (W.uniform[k]) o[k] = { ...outfits[k], ...UNIFORM[k], acc: k === 'callie' && ['bow', 'flower', 'glasses'].includes(outfits[k].acc) ? outfits[k].acc : 'none' };
  return o;
}
