// Personalities: five sliders and a few likes for everyone, the friendships between them,
// and the little chats, games and grumbles that happen when people share a room.
import React from 'react';
import { rand, pick, dist, SFX, speak } from './core.js';
import { say, later, walkTo, nav } from './world.js';
import { NAMES } from './people.jsx';
import { ItemIcon } from './items.jsx';
import { relLines, wordFor, callName, familyWith } from './relations.js';

/* ---------------- the sliders ---------------- */
// 0..4 from the left word to the right word. 2 is in the middle.
export const TRAITS = [
  { id: 'chat', lo: 'shy', hi: 'chatty' },
  { id: 'bounce', lo: 'calm', hi: 'bouncy' },
  { id: 'tidy', lo: 'messy', hi: 'tidy' },
  { id: 'cheer', lo: 'grumpy', hi: 'cheery' },
  { id: 'brave', lo: 'scared', hi: 'brave' },
];
export const LIKES = {
  football: { word: 'football', say: ['I love football!', 'Football is the best!'], yes: ['Me too! Goal!', 'Me too! Shall we play?'] },
  music: { word: 'music', say: ['I love music!', 'I like loud music!'], yes: ['Me too! La la la!', 'Me too! Turn it up!'] },
  books: { word: 'books', say: ['I love books!', 'I am reading a good book.'], yes: ['Me too! Books are the best.', 'Me too! Read it to me!'] },
  food: { word: 'food', icon: 'cake', say: ['I am hungry! I love food!', 'I love cake!'], yes: ['Me too! Yum!', 'Cake! Yes please!'] },
  animals: { word: 'animals', icon: 'butterfly', say: ['I love animals!', 'I wish I had a cat.'], yes: ['Me too! Cats are the best.', 'Me too! And dogs!'] },
  dancing: { word: 'dancing', say: ['I love dancing!', 'Shall we dance?'], yes: ['Me too! Let us dance!', 'Yes! Dance party!'], dance: true },
  games: { word: 'games', icon: 'controller', say: ['I love games!', 'I am the best at games!'], yes: ['Me too! Rematch?', 'No, I am the best!'] },
  painting: { word: 'painting', icon: 'pen', say: ['I love painting!', 'I painted a big red bus.'], yes: ['Me too! I painted a cat.', 'Me too! Let us paint!'] },
};
const MID = { chat: 2, bounce: 2, tidy: 2, cheer: 2, brave: 2 };
// Callie's family as they really are. Tap "About" on anyone to change them.
export const FAMILY_TRAITS = {
  callie: { t: { chat: 4, bounce: 4, tidy: 1, cheer: 4, brave: 2 }, likes: ['animals', 'dancing', 'books'] },
  chloe: { t: { chat: 1, bounce: 1, tidy: 2, cheer: 1, brave: 3 }, likes: ['music', 'painting'] },
  mum: { t: { chat: 3, bounce: 2, tidy: 4, cheer: 3, brave: 2 }, likes: ['food', 'books'] },
  dad: { t: { chat: 3, bounce: 3, tidy: 2, cheer: 4, brave: 4 }, likes: ['football', 'food'] },
  connor: { t: { chat: 2, bounce: 3, tidy: 0, cheer: 2, brave: 3 }, likes: ['games', 'football'] },
  nanny: { t: { chat: 4, bounce: 1, tidy: 4, cheer: 4, brave: 2 }, likes: ['food', 'animals'] },
  grandad: { t: { chat: 2, bounce: 0, tidy: 3, cheer: 3, brave: 4 }, likes: ['football', 'books'] },
};
export const randomTraits = () => Object.fromEntries(TRAITS.map(t => [t.id, Math.floor(rand(1, 4))]));
export const randomLikes = () => { const k = Object.keys(LIKES); const a = pick(k); return [a, pick(k.filter(x => x !== a))]; };

export function initPersonality(W, saved) {
  W.traits = (saved && saved.traits) || {};
  W.friends = (saved && saved.friends) || {};
  W.socialNext = 12; W.soloNext = 30; W.chatting = null; W.spiderSaid = {};
}
export function personaOf(W, id) {
  const def = W.folk && W.folk.people[id];
  if (def && def.traits) return { t: { ...MID, ...def.traits }, likes: def.likes || [] };
  if (W.traits && W.traits[id]) return W.traits[id];
  return FAMILY_TRAITS[id] || { t: MID, likes: [] };
}
export function setPersona(W, id, t, likes) {
  const def = W.folk && W.folk.people[id];
  if (def) { def.traits = t; def.likes = likes; } else W.traits[id] = { t, likes };
  W.dirty = true;
}

/* ---------------- friendships ---------------- */
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
export const friendship = (W, a, b) => W.friends[pairKey(a, b)] || 0;
const befriend = (W, a, b, n) => { const k = pairKey(a, b); W.friends[k] = Math.max(-3, Math.min(10, (W.friends[k] || 0) + n)); W.dirty = true; };
export function bestFriend(W, id) {
  let best = null, n = 2.5;
  for (const [k, v] of Object.entries(W.friends)) { const [a, b] = k.split('|'); const other = a === id ? b : b === id ? a : null; if (other && NAMES[other] && v > n) { n = v; best = other; } }
  return best;
}

/* ---------------- words that describe someone ---------------- */
const levelWord = (tr, v) => (v === 0 ? 'very ' + tr.lo : v === 1 ? tr.lo : v === 3 ? tr.hi : v === 4 ? 'very ' + tr.hi : null);
export const sliderWord = (tr, v) => levelWord(tr, v) || `a bit ${tr.lo}, a bit ${tr.hi}`;
const andList = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export function describe(W, id) {
  const P = personaOf(W, id), name = NAMES[id] || 'They';
  const words = TRAITS.map(tr => levelWord(tr, P.t[tr.id])).filter(Boolean);
  const out = [];
  if (words.length) out.push(`${name} is ${andList(words.slice(0, 2))}.`);
  if (words.length > 2) out.push(`${name} is ${andList(words.slice(2))} too.`);
  if (P.likes.length) out.push(`${name} likes ${andList(P.likes.map(l => LIKES[l] ? LIKES[l].word : l))}.`);
  for (const l of relLines(W, id)) out.push(l);
  const bf = bestFriend(W, id); if (bf && !relLines(W, id).some(l => l.includes(NAMES[bf]))) out.push(`${name}'s best friend is ${NAMES[bf]}.`);
  return out;
}
export function helloLine(W, id) {
  const t = personaOf(W, id).t, me = NAMES[W.player];
  if (t.cheer <= 0) return pick(['Hmph. Hello.', 'Oh. It is you.']);
  if (t.chat <= 1) return pick(['Oh... hi.', 'Um... hello.']);
  if (t.chat >= 4) return pick([`Hello, ${me}! I am so happy to see you!`, `${me}! Come in! Come in!`, 'Hello! Guess what? I had cake!']);
  if (t.bounce >= 4) return pick([`Hi, ${me}! Wheee!`, 'Hello! Shall we play?']);
  return pick(['Hello!', 'Hi there!', `Hi, ${me}!`, 'Hello, friend!']);
}

/* ---------------- who can join in ---------------- */
const CALLIE_FAM = ['callie', 'chloe', 'mum', 'dad', 'connor'];
const calm = W => !W.hide && !W.dance && !W.photo && !W.bedtime && !W.drive && !W.fade && !(W.flags && W.flags.bbq) && !W.panelOpen;
function free(W, p) {
  return p && p.room === W.room && p.op >= 0.99 && (p.mode === 'stand' || p.mode === 'sit') && !p.path && !p.goal && !p.hiding && !p.ride && !p.reading && !(p.action && W.T < p.action.t0 + p.action.dur)
    && !(p.busy && p.busy !== 'out') && !(p.chatUntil > W.T) && !(p.id === 'dad' && p.job);
}
// Callie's own family stay put (other things rely on where they stand), everyone else can walk over.
const canWalk = (W, p) => p.mode === 'stand' && p.id !== W.player && !p.netRemote && (!CALLIE_FAM.includes(p.id) || (W.out && (W.out.party || []).includes(p.id)));
function face(p, q) { if (p.mode !== 'stand') return; p.facing = 'front'; p.flip = ((q.x - p.x) - (q.y - p.y)) < 0; }

/* ---------------- the little scenes ---------------- */
// Each returns lines: [who ('a' or 'b'), text, extra] plus how much closer it makes them.
function chatScene(W, a, b) {
  const A = personaOf(W, a), B = personaOf(W, b);
  const like = pick(A.likes.length ? A.likes : Object.keys(LIKES)), L = LIKES[like];
  const lines = [['a', pick(L.say)]];
  if (B.likes.includes(like)) { lines.push(['b', pick(L.yes), L.dance ? 'twirl' : 'yay', 'hearts']); if (L.dance) lines.push(['a', 'Wheee!', 'twirl']); return { lines, n: 2 }; }
  const mine = B.likes.find(x => x !== like);
  if (B.t.cheer <= 1) { lines.push(['b', pick(['Boring!', 'Not for me.', 'Hmph. No thanks.'])]); return { lines, n: -0.5 }; }
  lines.push(['b', mine ? `Oh. I like ${LIKES[mine].word} more!` : 'That is nice!']);
  if (mine && A.t.cheer >= 2) lines.push(['a', pick([`${LIKES[mine].word[0].toUpperCase() + LIKES[mine].word.slice(1)} is fun too!`, 'Cool!'])]);
  return { lines, n: 0.6 };
}
function complimentScene(W, a, b) {
  const B = personaOf(W, b);
  const lines = [['a', pick(['I like your hair!', 'I like your top!', 'You are so funny!', 'You are my friend!', 'You are kind.'])]];
  lines.push(['b', B.t.cheer <= 0 ? 'Hmph. Thanks.' : B.t.chat <= 1 ? 'Oh... thank you.' : pick(['Thank you! I like yours too!', 'Aww, thank you!']), B.t.cheer >= 2 ? 'yay' : null, B.t.cheer >= 1 ? 'hearts' : null]);
  return { lines, n: 1 };
}
const JOKES = [
  [['a', 'Knock knock!'], ['b', 'Who is there?'], ['a', 'Cow.'], ['b', 'Cow who?'], ['a', 'No! Cows say MOO!']],
  [['a', 'What do cats like to eat?'], ['b', 'What?'], ['a', 'Mice cream!']],
  [['a', 'What do you call a sleepy dinosaur?'], ['b', 'What?'], ['a', 'A dino-snore!']],
  [['a', 'Why did the egg hide?'], ['b', 'Why?'], ['a', 'It was a little chicken!']],
];
function jokeScene(W, a, b) {
  const B = personaOf(W, b), lines = pick(JOKES).map(l => [...l]);
  if (B.t.cheer <= 1) { lines.push(['b', 'Not funny.']); lines.push(['a', 'I think it is funny!']); return { lines, n: 0 }; }
  lines.push(['b', pick(['Ha ha ha!', 'Hee hee! Tell me another!', 'Ha! That is so silly!']), 'cheer', 'hearts']);
  return { lines, n: 1.2 };
}
function playScene(W, a, b) {
  const B = personaOf(W, b), lines = [['a', pick(['Shall we dance?', 'Let us jump up and down!', 'Twirl with me!']), 'jump']];
  if (B.t.bounce <= 1) { lines.push(['b', pick(['No thank you. I am a bit tired.', 'Maybe later.'])]); lines.push(['a', 'Ok!']); return { lines, n: 0 }; }
  lines.push(['b', pick(['Yes!', 'Wheee!', 'Ok!']), 'twirl', 'spark']); lines.push(['a', 'Wheee!', 'twirl']);
  return { lines, n: 1.5 };
}
function grumbleScene(W, a, b) {
  const B = personaOf(W, b), lines = [['a', pick(['Can you be quiet, please?', 'Hmph. I am in a bad mood.', 'Do not talk to me.', 'I am SO bored.'])]];
  if (B.t.cheer >= 3) { lines.push(['b', pick(['Cheer up! Here is a hug.', 'Aww. Do you want a hug?']), null, 'hearts']); lines.push(['a', '...Ok. Thank you.']); return { lines, n: 1 }; }
  if (B.t.cheer <= 1) { lines.push(['b', 'No, YOU be quiet!']); lines.push(['a', 'Hmph!']); return { lines, n: -1 }; }
  lines.push(['b', B.t.chat <= 1 ? 'Oh... sorry.' : 'Ok, ok!']); return { lines, n: -0.3 };
}
function tidyScene(W, a, b) {
  const A = personaOf(W, a), B = personaOf(W, b);
  if (A.t.tidy >= 3) {
    const lines = [['a', pick(['Who made this mess?', 'Please put your things away!', 'Tidy up, please!'])]];
    lines.push(['b', B.t.cheer <= 1 ? 'I like my mess!' : pick(['Not me!', 'Oops! Sorry!'])]);
    return { lines, n: B.t.tidy >= 2 ? 0 : -0.3 };
  }
  return { lines: [['a', pick(['I like it messy!', 'Tidy up? No way!'])], ['b', B.t.tidy >= 3 ? 'Please tidy up!' : 'Me too! Mess is fun!', null, B.t.tidy >= 3 ? null : 'spark']], n: B.t.tidy >= 3 ? -0.3 : 1 };
}
function braveScene(W, a, b) {
  const A = personaOf(W, a), B = personaOf(W, b);
  if (A.t.brave >= 3) return { lines: [['a', pick(['I am not scared of spiders!', 'I am not scared of the dark!'])], ['b', B.t.brave <= 1 ? 'Eek! I am!' : 'Me neither!']], n: B.t.brave <= 1 ? 0.3 : 1 };
  return { lines: [['a', pick(['I do not like spiders.', 'I am scared of the dark.'])], ['b', B.t.brave >= 3 ? 'Do not worry. I will keep you safe!' : 'Me too! Eek!', null, B.t.brave >= 3 ? 'hearts' : null]], n: 1.2 };
}
function familyScene(W, a, b) {
  const wa = wordFor(W, b, a), call = callName(W, b, a), back = callName(W, a, b);
  const kidToParent = ['mum', 'dad', 'nan', 'grandad', 'aunt', 'uncle'].includes(wa);
  const lines = kidToParent
    ? [['a', pick([`I love you, ${call}!`, `${call}, can we go to the park?`, `${call}, I am hungry!`, `Look at me, ${call}!`]), 'yay', 'hearts'], ['b', pick([`I love you too, ${back}!`, 'Ok, my love!', 'You are a star!']), null, 'hearts']]
    : [['a', pick([`Hello, ${call}!`, `${call}! You are the best.`, `Shall we play, ${call}?`]), 'wave'], ['b', pick([`Hi, ${back}!`, 'Yes please!', 'You are the best too!']), 'yay', 'hearts']];
  return { lines, n: 0.8 };
}
function hugScene(W, a, b) {
  return { lines: [['a', pick(['You are my best friend!', 'I am so happy you are here!']), 'yay', 'hearts'], ['b', pick(['You are my best friend too!', 'Best friends!']), 'yay', 'hearts']], n: 0.5 };
}
function pickScene(W, a, b) {
  const t = personaOf(W, a).t, u = personaOf(W, b).t, opts = [];
  const add = (f, w) => { if (w > 0) opts.push([f, w]); };
  add(chatScene, 2 + t.chat);
  add(complimentScene, t.cheer >= 2 ? t.cheer : 0);
  add(jokeScene, t.cheer >= 3 ? t.chat + t.cheer - 3 : 0);
  add(playScene, t.bounce >= 3 ? t.bounce * 1.4 : 0);
  add(grumbleScene, t.cheer <= 1 ? (2 - t.cheer) * 2 : 0);
  add(tidyScene, (t.tidy >= 3 && u.tidy <= 2) || (t.tidy <= 1) ? 2 : 0);
  add(braveScene, t.brave >= 3 || t.brave <= 1 ? 1.2 : 0);
  add(hugScene, friendship(W, a, b) >= 6 ? 4 : 0);
  add(familyScene, wordFor(W, b, a) ? 5 : 0);
  let r = Math.random() * opts.reduce((s, o) => s + o[1], 0);
  for (const [f, w] of opts) { r -= w; if (r <= 0) return f; }
  return chatScene;
}

/* ---------------- running it ---------------- */
const weighted = (list, w) => { let r = Math.random() * list.reduce((s, x) => s + w(x), 0); for (const x of list) { r -= w(x); if (r <= 0) return x; } return list[0]; };
function play(W, a, b, scene, fx) {
  const pa = W.people[a], pb = W.people[b];
  const { lines, n } = scene(W, a, b);
  const shyB = personaOf(W, b).t.chat <= 1 && personaOf(W, b).t.cheer >= 2 && b !== W.player;
  let t = 0;
  const until = W.T + 1 + lines.length * 2.3;
  pa.chatUntil = until; pb.chatUntil = until; if (pa.nextAct != null) pa.nextAct = Math.max(pa.nextAct, until + 2); if (pb.nextAct != null) pb.nextAct = Math.max(pb.nextAct, until + 2);
  W.chatting = { a, b, until };
  lines.forEach(([who, text, act, burst], i) => {
    const id = who === 'a' ? a : b, other = who === 'a' ? b : a;
    later(W, t, () => {
      const p = W.people[id], q = W.people[other];
      if (!p || !q || p.room !== W.room || q.room !== W.room) return;
      face(p, q);
      say(W, id, shyB && who === 'b' && i === 1 && !text.startsWith('Oh') && !text.startsWith('Um') ? 'Um... ' + text : text);
      if (act && p.mode === 'stand') p.action = { kind: act, t0: W.T, dur: act === 'twirl' ? 0.8 : 1.2 };
      if (burst) fx(burst, id);
    });
    t += Math.max(2.1, 1.0 + text.split(' ').length * 0.42);
  });
  later(W, t, () => { befriend(W, a, b, n); if (W.chatting && W.chatting.a === a) W.chatting = null; });
}
export function stepSocial(W, fx) {
  if (!W.friends) return;
  // a spider in the room: scared people squeal, brave people shrug
  for (const s of W.spiders || []) {
    if (s.caught || s.room !== W.room) continue;
    for (const p of Object.values(W.people)) {
      if (p.room !== W.room || p.id === W.player || p.id === 'callie' || p.id === 'chloe' || p.id === 'dad' || p.mode === 'lie' || dist([p.x, p.y], [s.x, s.y]) > 2.2) continue;
      if (W.T - (W.spiderSaid[p.id] || -99) < 25) continue;
      const b = personaOf(W, p.id).t.brave;
      if (b <= 1) { W.spiderSaid[p.id] = W.T; say(W, p.id, pick(['Eek! A spider!', 'Help! A spider!'])); if (canWalk(W, p)) { const t = nav(W.room).nearestFree(p.x + (p.x - s.x) * 1.5, p.y + (p.y - s.y) * 1.5); walkTo(W, p, t[0], t[1]); } }
      else if (b >= 3) { W.spiderSaid[p.id] = W.T; say(W, p.id, pick(['It is only a little spider.', 'Hello, little spider!'])); }
    }
  }
  if (!calm(W) || (W.chatting && W.T < W.chatting.until)) return;
  if (W.bubbles.some(bb => bb.anchor.type === 'person' && W.T - bb.t0 < 1.5)) return;
  const here = Object.values(W.people).filter(p => free(W, p));
  const npcs = here.filter(p => p.id !== W.player && !p.netRemote);
  // on your own: bouncy people bounce, tidy people spot mess, grumpy people grumble
  if (W.T > W.soloNext && npcs.length) {
    W.soloNext = W.T + rand(25, 45);
    const p = pick(npcs), t = personaOf(W, p.id).t;
    const mess = (W.items || []).find(i => i.room === W.room && i.loc.s === 'floor' && !i.errand);
    if (t.bounce >= 4 && p.mode === 'stand') { p.action = { kind: 'jump', t0: W.T, dur: 1.2 }; say(W, p.id, pick(['Wheee!', 'I can not sit still!', 'Boing boing!'])); return; }
    if (t.tidy >= 4 && mess) { say(W, p.id, pick(['Who left this here?', 'What a mess!', 'Tidy up time!'])); return; }
    if (t.cheer <= 0) { say(W, p.id, pick(['Hmph.', 'I am bored.'])); return; }
    if (t.bounce <= 0 && p.mode === 'sit') { say(W, p.id, pick(['Ahh. Nice and quiet.', 'Time for a rest.'])); return; }
  }
  if (W.T < W.socialNext || !npcs.length || here.length < 2) return;
  W.socialNext = W.T + rand(10, 18);
  const a = weighted(npcs, p => 0.4 + personaOf(W, p.id).t.chat);
  const others = here.filter(p => p !== a && (canWalk(W, a) || dist([a.x, a.y], [p.x, p.y]) < 4.5));
  if (!others.length) return;
  const b = weighted(others, p => 1 + Math.max(0, friendship(W, a.id, p.id)) * 0.4 + (p.id === W.player ? 1.2 : 0) + personaOf(W, a.id).likes.filter(l => personaOf(W, p.id).likes.includes(l)).length);
  const scene = pickScene(W, a.id, b.id);
  W.chatting = { a: a.id, b: b.id, until: W.T + 6 };
  a.chatUntil = W.T + 6; b.chatUntil = W.T + 6;
  if (canWalk(W, a) && dist([a.x, a.y], [b.x, b.y]) > 1.7) {
    const ang = Math.atan2(a.y - b.y, a.x - b.x), t = nav(W.room).nearestFree(b.x + Math.cos(ang) * 1.1, b.y + Math.sin(ang) * 1.1);
    walkTo(W, a, t[0], t[1], () => play(W, a.id, b.id, scene, fx));
  } else play(W, a.id, b.id, scene, fx);
}

/* ---------------- the screens ---------------- */
const FACE = {
  shy: <g><circle cx={-4} cy={-1} r={1.6} fill="#3b2a24" /><circle cx={4} cy={-1} r={1.6} fill="#3b2a24" /><ellipse cx={-6.5} cy={3} rx={2.5} ry={1.5} fill="#f39ac6" /><ellipse cx={6.5} cy={3} rx={2.5} ry={1.5} fill="#f39ac6" /><path d="M-2,5 h4" stroke="#3b2a24" strokeWidth={1.4} strokeLinecap="round" /></g>,
  chatty: <g><circle cx={-4} cy={-2} r={1.6} fill="#3b2a24" /><circle cx={4} cy={-2} r={1.6} fill="#3b2a24" /><ellipse cx={0} cy={5} rx={3.5} ry={2.8} fill="#a8323e" /></g>,
  calm: <g><path d="M-6,-1 q2,2 4,0 M2,-1 q2,2 4,0" stroke="#3b2a24" strokeWidth={1.4} fill="none" strokeLinecap="round" /><path d="M-3,5 q3,2 6,0" stroke="#3b2a24" strokeWidth={1.4} fill="none" strokeLinecap="round" /></g>,
  bouncy: <g><circle cx={-4} cy={-2} r={1.8} fill="#3b2a24" /><circle cx={4} cy={-2} r={1.8} fill="#3b2a24" /><path d="M-5,3 q5,6 10,0z" fill="#a8323e" /><path d="M-12,-9 l-3,-3 M12,-9 l3,-3 M0,-13 v-3" stroke="#f2b84b" strokeWidth={2} strokeLinecap="round" /></g>,
  messy: <g><circle cx={-4} cy={-1} r={1.6} fill="#3b2a24" /><circle cx={4} cy={-1} r={1.6} fill="#3b2a24" /><path d="M-4,5 q2,-2 4,0 q2,2 4,0" stroke="#3b2a24" strokeWidth={1.4} fill="none" /><path d="M-9,-10 q3,-4 6,0 q3,4 6,0 q3,-4 6,0" stroke="#8a5a3a" strokeWidth={1.6} fill="none" /></g>,
  tidy: <g><circle cx={-4} cy={-1} r={1.6} fill="#3b2a24" /><circle cx={4} cy={-1} r={1.6} fill="#3b2a24" /><path d="M-3,4 q3,2.5 6,0" stroke="#3b2a24" strokeWidth={1.4} fill="none" strokeLinecap="round" /><path d="M11,-11 l1,3 3,1 -3,1 -1,3 -1,-3 -3,-1 3,-1z" fill="#ffd45e" /></g>,
  grumpy: <g><path d="M-7,-5 l5,2 M7,-5 l-5,2" stroke="#3b2a24" strokeWidth={1.6} strokeLinecap="round" /><circle cx={-4} cy={-1} r={1.5} fill="#3b2a24" /><circle cx={4} cy={-1} r={1.5} fill="#3b2a24" /><path d="M-4,7 q4,-4 8,0" stroke="#3b2a24" strokeWidth={1.5} fill="none" strokeLinecap="round" /></g>,
  cheery: <g><path d="M-6,-1 q2,-3 4,0 M2,-1 q2,-3 4,0" stroke="#3b2a24" strokeWidth={1.5} fill="none" strokeLinecap="round" /><path d="M-6,3 q6,7 12,0z" fill="#a8323e" /></g>,
  scared: <g><circle cx={-4} cy={-1} r={2.6} fill="#fff" stroke="#3b2a24" strokeWidth={1} /><circle cx={4} cy={-1} r={2.6} fill="#fff" stroke="#3b2a24" strokeWidth={1} /><circle cx={-4} cy={-1} r={1} fill="#3b2a24" /><circle cx={4} cy={-1} r={1} fill="#3b2a24" /><path d="M-4,6 l2,-1.5 2,1.5 2,-1.5 2,1.5" stroke="#3b2a24" strokeWidth={1.2} fill="none" /></g>,
  brave: <g><path d="M-7,-4 l5,1 M7,-4 l-5,1" stroke="#3b2a24" strokeWidth={1.5} strokeLinecap="round" /><circle cx={-4} cy={-1} r={1.6} fill="#3b2a24" /><circle cx={4} cy={-1} r={1.6} fill="#3b2a24" /><path d="M-4,4 q4,3 8,0" stroke="#3b2a24" strokeWidth={1.6} fill="none" strokeLinecap="round" /></g>,
};
export const Face = ({ k, size = 30 }) => <svg viewBox="-16 -16 32 32" width={size} height={size} aria-hidden="true"><circle r={12} fill="#ffd9a8" stroke="#e0a978" strokeWidth={1.2} />{FACE[k]}</svg>;
export function LikeIcon({ k, size = 34 }) {
  const L = LIKES[k];
  if (L.icon) return <ItemIcon it={{ kind: L.icon }} size={size} />;
  return <svg viewBox="-14 -14 28 28" width={size} height={size} aria-hidden="true">
    {k === 'football' && <g><circle r={10} fill="#fff" stroke="#2b2b2e" strokeWidth={1.4} /><path d="M0,-4 l3.8,2.8 -1.5,4.4 -4.6,0 -1.5,-4.4Z" fill="#2b2b2e" /><path d="M0,-4 v-6 M3.8,-1.2 l6,-2 M2.3,3.2 l3.5,5.5 M-2.3,3.2 l-3.5,5.5 M-3.8,-1.2 l-6,-2" stroke="#2b2b2e" strokeWidth={1} /></g>}
    {k === 'books' && <g><path d="M-11,-7 q5.5,-3 11,0 v15 q-5.5,-3 -11,0z" fill="#5b9bd5" stroke="#3f78ad" /><path d="M0,-7 q5.5,-3 11,0 v15 q-5.5,-3 -11,0z" fill="#e86a92" stroke="#c2456f" /><path d="M-8,-3 h5 M-8,0 h5 M3,-3 h5 M3,0 h5" stroke="#fff" strokeWidth={1} /></g>}
    {k === 'music' && <text x={0} y={8} textAnchor="middle" fontSize={22} fill="#e86a92">♫</text>}
    {k === 'dancing' && <g><circle cy={-8} r={3.5} fill="#f6d2b8" /><path d="M0,-4 l0,7 M0,-2 l-7,-4 M0,-2 l7,-6 M0,3 l-5,8 M0,3 l6,7" stroke="#b58ee0" strokeWidth={2.6} strokeLinecap="round" fill="none" /><path d="M-1,1 l-6,6 h14z" fill="#e86a92" /></g>}
  </svg>;
}
// five sliders and the likes, used in the character maker and the About screen
export function TraitPicker({ t, likes, onT, onLikes, who }) {
  const setT = (tr, v) => { onT({ ...t, [tr.id]: v }); speak(sliderWord(tr, v), 'word'); SFX.pop(); };
  const toggle = k => { const on = likes.includes(k); const next = on ? likes.filter(x => x !== k) : [...likes, k].slice(-3); onLikes(next); speak(on ? `not ${LIKES[k].word}` : LIKES[k].word, 'word'); SFX.click(); };
  return <div className="traits">
    {TRAITS.map(tr => <div key={tr.id} className="trait-row">
      <button className="trait-end" aria-pressed={t[tr.id] <= 1} onClick={() => setT(tr, Math.max(0, t[tr.id] - 1))}><Face k={tr.lo} /><span>{tr.lo}</span></button>
      <span className="trait-dots" role="radiogroup" aria-label={`${tr.lo} or ${tr.hi}`}>{[0, 1, 2, 3, 4].map(v => <button key={v} className="dot" role="radio" aria-checked={t[tr.id] === v} aria-label={sliderWord(tr, v)} onClick={() => setT(tr, v)} />)}</span>
      <button className="trait-end hi" aria-pressed={t[tr.id] >= 3} onClick={() => setT(tr, Math.min(4, t[tr.id] + 1))}><span>{tr.hi}</span><Face k={tr.hi} /></button>
    </div>)}
    <div className="likes-head">{who ? `${who} likes...` : 'Likes...'}</div>
    <div className="choices likes">{Object.keys(LIKES).map(k => <button key={k} className="tile like-tile" aria-pressed={likes.includes(k)} onClick={() => toggle(k)}><LikeIcon k={k} /><small>{LIKES[k].word}</small></button>)}</div>
  </div>;
}
export function AboutPanel({ W, who, head, onClose }) {
  const [, force] = React.useState(0);
  const P = personaOf(W, who);
  const name = NAMES[who];
  const update = (t, likes) => { setPersona(W, who, t, likes); force(n => n + 1); };
  const lines = describe(W, who);
  return <div className="sheet about" role="dialog" aria-label={`About ${name}`} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(`All about ${name}`, 'narrator')}>{head}About {name}</button><button className="done" onClick={onClose}>Done</button></div>
    <div className="about-body">
      <div className="about-says">{lines.map((l, i) => <button key={i} className="about-line" onClick={() => speak(l, 'narrator')}>{l}</button>)}</div>
      <TraitPicker t={P.t} likes={P.likes} who={name} onT={t => update(t, P.likes)} onLikes={l => update(P.t, l)} />
    </div>
  </div>;
}
