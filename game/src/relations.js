// How people are related: "Tom is Rosa's dad", "Mia is Rosa's best friend".
// Family live together; family and friends start off liking each other.
import { NAMES } from './people.jsx';

const KID_WORDS = ['brother', 'sister', 'son', 'daughter', 'grandson', 'granddaughter', 'cousin', 'friend', 'best friend'];
const ADULT_WORDS = ['mum', 'dad', 'brother', 'sister', 'son', 'daughter', 'nan', 'grandad', 'aunt', 'uncle', 'cousin', 'husband', 'wife', 'friend', 'best friend'];
export const relWords = body => (body === 'kid' || body === 'teen' ? KID_WORDS : ADULT_WORDS);
export const FAMILY = new Set(['mum', 'dad', 'brother', 'sister', 'son', 'daughter', 'nan', 'grandad', 'grandson', 'granddaughter', 'husband', 'wife']);
const START = w => (w === 'best friend' ? 8 : FAMILY.has(w) ? 6 : w === 'friend' ? 4 : 5);

export const relsOf = W => (W.folk && W.folk.rels) || [];
// a is b's w
export function setRels(W, id, list) {
  if (!W.folk.rels) W.folk.rels = [];
  W.folk.rels = W.folk.rels.filter(r => r.a !== id);
  for (const [b, w] of Object.entries(list || {})) if (w && b !== id && NAMES[b]) {
    W.folk.rels.push({ a: id, b, w });
    if (W.friends) { const k = id < b ? id + '|' + b : b + '|' + id; W.friends[k] = Math.max(W.friends[k] || 0, START(w)); }
  }
  W.dirty = true;
}
export const relsFrom = (W, id) => Object.fromEntries(relsOf(W).filter(r => r.a === id).map(r => [r.b, r.w]));
// what x is to y ("dad"), either way round
export function wordFor(W, x, y) {
  const r = relsOf(W).find(q => q.a === x && q.b === y); if (r) return r.w;
  const back = relsOf(W).find(q => q.a === y && q.b === x); if (!back) return null;
  const turn = { mum: 'child', dad: 'child', nan: 'grandchild', grandad: 'grandchild', son: 'parent', daughter: 'parent', grandson: 'grandparent', granddaughter: 'grandparent', husband: 'partner', wife: 'partner', aunt: 'cousin', uncle: 'cousin' };
  return turn[back.w] || back.w;
}
export const related = (W, x, y) => !!wordFor(W, x, y);
export const familyWith = (W, x, y) => { const r = relsOf(W).find(q => (q.a === x && q.b === y) || (q.a === y && q.b === x)); return !!(r && FAMILY.has(r.w)); };
// sentences for the About screen
export function relLines(W, id) {
  return relsOf(W).filter(r => (r.a === id || r.b === id) && NAMES[r.a] && NAMES[r.b]).map(r => `${NAMES[r.a]} is ${NAMES[r.b]}'s ${r.w}.`);
}
// what you call them ("Hi, Dad!")
export function callName(W, who, by) {
  const w = wordFor(W, who, by);
  const CALL = { mum: 'Mum', dad: 'Dad', nan: 'Nanny', grandad: 'Grandad', aunt: `Auntie ${NAMES[who]}`, uncle: `Uncle ${NAMES[who]}` };
  return CALL[w] || NAMES[who];
}
