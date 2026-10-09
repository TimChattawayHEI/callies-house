// Jobs and happenings for the town she builds. They come from what is there:
// her shops (deliveries, shopping, working a shift, the money in the till) and the people she has made
// (lost things, jobs round the house, birthdays, popping out to see them, letters on the mat).
import React, { useState } from 'react';
import { rand, pick, SFX, speak, earn, achieve } from './core.js';
import { nav, say, later } from './world.js';
import { ROOMS } from './rooms.jsx';
import { NAMES, HeadIcon, DEFAULT_OUTFITS } from './people.jsx';
import { houseRooms, planOf, entryRoom } from './homes.jsx';
import { PLACES } from './town.jsx';
import { SHOP_TYPES, sellsOf } from './townbuild.jsx';
import { ItemIcon } from './items.jsx';
import { whereNow } from './townlife.js';
import { relsOf } from './relations.js';

const nm = id => NAMES[id] || 'them';
const famOf = (W, id) => { const d = W.folk.people[id]; return d && W.folk.fams[d.fam]; };
const others = W => Object.keys(W.folk.people).filter(id => W.people[id] && id !== W.player && !(W.net && W.net.other.player === id) && NAMES[id]);
const shops = W => Object.values((W.town && W.town.shops) || {}).filter(sh => SHOP_TYPES[sh.type]);
const shopThings = sh => sellsOf(sh.type).filter(t => t.kind);
const LOST = [['keys', 'my keys'], ['phone', 'my phone'], ['specs', 'my glasses'], ['purse', 'my purse'], ['scarf', 'my scarf'], ['brush', 'my hairbrush'], ['football', 'my ball'], ['remote', 'the TV remote']];
const CHORES = [
  { ids: ['p-tall', 'p-fern', 'p-cactus', 'p-shelf', 'p-bonsai', 'p-hanging'], card: 'Water the plants', ask: 'The plants are thirsty. Can you water them?', thanks: 'Happy plants!' },
  { ids: ['k-sink'], card: 'Wash the dishes', ask: 'Can you wash the dishes for me?', thanks: 'Sparkly plates!' },
  { ids: ['e-tv'], card: 'Turn on the TV', ask: 'Can you turn the TV on?', thanks: 'My favourite show!' },
  { ids: ['bed-single', 'bed-double', 'bed-bunk', 'bed-canopy', 'bed-day'], card: 'Make the bed', ask: 'Can you make my bed, please?', thanks: 'So neat!' },
  { ids: ['bookcase', 'cubes'], card: 'Tidy the shelf', ask: 'The shelf is a mess. Can you tidy it?', thanks: 'All tidy!' },
  { ids: ['k-oven'], card: 'Cook the dinner', ask: 'I am hungry. Can you help cook dinner?', thanks: 'Yum! Dinner!' },
  { ids: ['k-washer'], card: 'Put the washing on', ask: 'Can you put the washing on?', thanks: 'Clean clothes!' },
  { ids: ['e-record', 'e-speaker'], card: 'Put some music on', ask: 'Put some music on!', thanks: 'Good song!' },
];

/* ---------------- saving ---------------- */
export function initTownJobs(W, saved) {
  W.tj = (saved && saved.tj) || { job: null, n: 0, shifts: 0 };
  W.tj.next = (W.T || 0) + 35; W.coinSpot = null; W.coinNext = (W.T || 0) + 50; W.tjLetterNext = (W.T || 0) + 150;
  const j = W.tj.job;
  if (j && ((j.who && !W.people[j.who]) || (j.shop && !(W.town && W.town.shops[j.shop])))) W.tj.job = null;
  if (W.tj.job && ['lost', 'deliver', 'want'].includes(W.tj.job.type) && W.tj.job.stage !== 'pickup' && !W.items.some(i => i.tjob)) W.tj.job = null;
}
export const saveTownJobs = W => ({ job: W.tj.job, n: W.tj.n, shifts: W.tj.shifts || 0 });

/* ---------------- making a job ---------------- */
function makeJob(W) {
  const ppl = others(W), sh = shops(W), opts = [];
  const add = (w, f) => { if (w > 0) opts.push([w, f]); };
  const thingShops = sh.filter(s => shopThings(s).length);
  add(thingShops.length && ppl.length ? 3 : 0, () => { const s = pick(thingShops), t = pick(shopThings(s)), to = pick(ppl);
    return { type: 'deliver', shop: s.id, word: t.word, kind: t.kind, to, from: 'keeper', stage: 'pickup', ask: `Please can you take some ${t.word} to ${nm(to)}?`, coins: 6 }; });
  add(thingShops.length && ppl.length ? 3 : 0, () => { const s = pick(thingShops), t = pick(shopThings(s)), who = pick(ppl);
    return { type: 'want', who, shop: s.id, word: t.word, kind: t.kind, stage: 'buy', ask: `I would love some ${t.word}! Can you get me some from ${s.name}?`, coins: 7 }; });
  const homed = ppl.filter(id => famOf(W, id));
  add(homed.length ? 2.5 : 0, () => { const who = pick(homed), [kind, words] = pick(LOST); return { type: 'lost', who, kind, word: words, stage: 'find', ask: `Oh no! I lost ${words}. Can you find it?`, coins: 6 }; });
  const chorePeople = homed.map(id => ({ id, list: CHORES.filter(c => hasPiece(W, famOf(W, id), c.ids)) })).filter(x => x.list.length);
  add(chorePeople.length ? 2.5 : 0, () => { const x = pick(chorePeople), c = pick(x.list); return { type: 'chore', who: x.id, fam: famOf(W, x.id).id, ids: c.ids, card: c.card, ask: c.ask, thanks: c.thanks, stage: 'do', coins: 5 }; });
  const out = ppl.filter(id => W.people[id].trip && W.people[id].room !== W.room);
  add(out.length ? 2 : 0, () => { const who = pick(out); return { type: 'visit', who, stage: 'go', ask: `I am at ${whereNow(W, who)}. Come and say hello!`, coins: 4 }; });
  add(ppl.length && sh.length && !W.tj.bday ? 1 : 0, () => { const who = pick(ppl); return { type: 'birthday', who, stage: 'present', ask: `It is my birthday today! Will you come to my party?`, coins: 10 }; });
  add(sh.length ? 2 : 0, () => { const s = pick(sh); return { type: 'shift', shop: s.id, from: 'keeper', stage: 'go', ask: `${s.name} is very busy! Can you come and help?`, coins: 5 }; });
  if (!opts.length) return null;
  let r = Math.random() * opts.reduce((a, o) => a + o[0], 0);
  for (const [w, f] of opts) { r -= w; if (r <= 0) return f(); }
  return opts[0][1]();
}
const hasPiece = (W, fam, ids) => !!(fam && fam.rooms && Object.values(fam.rooms).some(r => (r.items || []).some(p => ids.includes(p.id))));
function hide(W, job) {
  const fam = famOf(W, job.who); if (!fam) return false;
  const rooms = houseRooms(fam).filter(r => ROOMS[r] && !ROOMS[r].outdoor && planOf(fam).rooms[r.split(':')[1]] && planOf(fam).rooms[r.split(':')[1]].kind !== 'garden');
  const room = pick(rooms); if (!room) return false;
  const [x, y] = nav(room).randomFree(1)[0];
  W.items = W.items.filter(i => i.id !== 'tj-' + job.kind);
  W.items.push({ id: 'tj-' + job.kind, kind: job.kind, rot: rand(-25, 25), tjob: true, room, loc: { s: 'floor', x, y } });
  job.room = room; return true;
}
const giver = (W, job) => job.who || null;
const off = (W, id) => (W.people[id] && W.people[id].room === W.room ? null : { type: 'off', id });

/* ---------------- every frame ---------------- */
// fx: { toast(text), coinAt(), done(job, who) }
export function stepTownJobs(W, dt, fx) {
  if (!W.tj) return;
  // shops take money while she plays
  if (!W.guest) for (const sh of shops(W)) sh.till = Math.min(25, (sh.till || 0) + dt / 40);
  if ((!W.fresh || !W.owner) && !W.guest) return;
  // a lucky coin in town
  if (!W.coinSpot && W.T > W.coinNext && ROOMS[W.room] && (ROOMS[W.room].town || ROOMS[W.room].outdoor)) {
    W.coinNext = W.T + rand(70, 140);
    if (Math.random() < 0.6) { const [x, y] = nav(W.room).randomFree(1)[0]; W.coinSpot = { room: W.room, x, y }; }
  }
  if (W.coinSpot && W.coinSpot.room !== W.room) W.coinSpot = null;
  // letters on the mat at home
  stepLetters(W);
  if (W.tj.job || W.T < W.tj.next || W.drive || W.hide || W.photo) return;
  W.tj.next = W.T + 20;
  const job = makeJob(W); if (!job) return;
  if (job.type === 'lost' && !hide(W, job)) return;
  if (job.type === 'birthday') W.tj.bday = W.T;
  job.t0 = W.T; W.tj.job = job; W.dirty = true;
  SFX.ding();
  const who = giver(W, job);
  if (who) say(W, who, job.ask, off(W, who));
  else { const s = W.town.shops[job.shop]; fx.toast(job.ask); speak(job.ask, 'narrator'); void s; }
}
function finish(W, fx, who, line) {
  const job = W.tj.job; if (!job) return;
  W.tj.job = null; W.tj.next = W.T + rand(45, 100); W.tj.n = (W.tj.n || 0) + 1; W.dirty = true;
  W.items = W.items.filter(i => !i.tjob);
  earn(W, job.coins || 5); SFX.fanfare();
  if (who && W.friends) { const k = who < W.player ? who + '|' + W.player : W.player + '|' + who; W.friends[k] = Math.min(10, (W.friends[k] || 0) + 1); }
  if (who && line) later(W, 0.3, () => say(W, who, line, off(W, who)));
  if (W.tj.n >= 5) later(W, 2, () => achieve(W, 'townhelper'));
  if (W.tj.n >= 20) later(W, 3, () => achieve(W, 'townhero'));
  fx.done && fx.done(job, who);
}

/* ---------------- hooks from the game ---------------- */
// tapped the counter in one of her shops: hand over a delivery
export function tjPickup(W, sh) {
  const job = W.tj && W.tj.job;
  if (!job || job.type !== 'deliver' || job.stage !== 'pickup' || job.shop !== sh.id) return null;
  job.stage = 'give'; W.dirty = true;
  return { id: 'tj-' + job.kind, kind: job.kind, label: undefined, tjob: true, c: sh.sign, room: W.room, rot: 0, loc: { s: 'floor', x: 0, y: 0 } };
}
// bought something: is it what someone wanted?
export function tjBought(W, sh, t, it) {
  const job = W.tj && W.tj.job;
  if (job && job.type === 'want' && job.shop === sh.id && job.word === t.word && it) { it.tjob = true; job.stage = 'give'; W.dirty = true; return true; }
  if (job && job.type === 'birthday' && it) { it.tjob = true; job.stage = 'give'; W.dirty = true; return true; }
  return false;
}
// gave someone something: returns null (not a job), '' (job done) or a line to say
export function tjGive(W, who, it, fx) {
  const job = W.tj && W.tj.job; if (!job) return null;
  if (job.type === 'birthday' && who === job.who) { W.items = W.items.filter(i => i !== it); finish(W, fx, who, 'A present for me! Thank you!'); fx.party && fx.party(who); later(W, 2, () => achieve(W, 'party')); return ''; }
  if (!it.tjob) return null;
  const target = job.type === 'deliver' ? job.to : job.who;
  if (who !== target) return `That is for ${nm(target)}!`;
  finish(W, fx, who, job.type === 'lost' ? pick(['You found it! Thank you!', 'Hooray! Thank you!']) : pick([`${job.word[0].toUpperCase() + job.word.slice(1)}! Thank you!`, 'For me? Thank you!']));
  return '';
}
// tapped a piece of furniture in someone's house
export function tjTap(W, room, key, fx) {
  const job = W.tj && W.tj.job;
  if (!job || job.type !== 'chore' || !room.startsWith(job.fam + ':') || !job.ids.includes(key.split('#')[0])) return false;
  later(W, 1.5, () => { if (W.tj.job === job) finish(W, fx, job.who, job.thanks); });
  return true;
}
// tapped a person: was she looking for them?
export function tjSeen(W, id, fx) {
  const job = W.tj && W.tj.job;
  if (!job || job.type !== 'visit' || job.who !== id) return false;
  finish(W, fx, id, pick(['You came! Hooray!', 'Hello! I am so happy to see you!'])); return true;
}
export function tjShiftDone(W, shopId, fx) {
  W.tj.shifts = (W.tj.shifts || 0) + 1; W.dirty = true;
  later(W, 1.5, () => achieve(W, 'shopshift'));
  const job = W.tj.job;
  if (job && job.type === 'shift' && job.shop === shopId) finish(W, fx, null, null);
}
export function tapLuckyCoin(W) {
  if (!W.coinSpot) return false;
  W.coinSpot = null; earn(W, 2); SFX.coins(); later(W, 1, () => achieve(W, 'lucky'));
  return true;
}

/* ---------------- the job card ---------------- */
export function tjTodo(W) {
  const out = [], job = W.tj && W.tj.job;
  if (job) {
    const sh = job.shop && W.town.shops[job.shop], where = id => whereNow(W, id) || 'their house';
    const T = {
      deliver: () => ({ text: `Take ${job.word} to ${nm(job.to)}`, tip: job.stage === 'pickup' ? `First go to ${sh.name} and tap the counter.` : `${nm(job.to)} is at ${where(job.to)}. Give them the ${job.word}.`, icon: job.kind }),
      want: () => ({ text: `Get ${job.word} for ${nm(job.who)}`, tip: job.stage === 'buy' ? `Buy ${job.word} at ${sh.name}.` : `Give the ${job.word} to ${nm(job.who)}. They are at ${where(job.who)}.`, icon: job.kind }),
      lost: () => { const it = W.items.find(i => i.tjob); return { text: `Find ${nm(job.who)}'s ${job.kind === 'specs' ? 'glasses' : job.kind === 'football' ? 'ball' : job.kind}`, tip: it && it.loc.s === 'pack' ? `Give it to ${nm(job.who)}.` : `Look in ${nm(job.who)}'s house${job.room && ROOMS[job.room] ? ', in the ' + ROOMS[job.room].name.toLowerCase() : ''}.`, icon: job.kind }; },
      chore: () => ({ text: job.card, tip: `Go to ${nm(job.who)}'s house and do it there.`, icon: 'star' }),
      visit: () => ({ text: `Say hello to ${nm(job.who)}`, tip: `${nm(job.who)} is at ${where(job.who)}. Go there and tap them.`, icon: 'star' }),
      birthday: () => ({ text: `${nm(job.who)}'s birthday!`, tip: job.stage === 'present' ? `Buy a present at a shop, then give it to ${nm(job.who)}.` : `Give the present to ${nm(job.who)}. They are at ${where(job.who)}.`, icon: 'cake' }),
      shift: () => ({ text: `Help at ${sh.name}`, tip: `Go to ${sh.name}, tap the counter, then Help in the shop.`, icon: 'shopping' }),
    }[job.type];
    if (T) { const t = T(); out.push({ id: 'tj', icon: t.icon, text: t.text, tip: t.tip }); }
  }
  const rich = shops(W).filter(s => (s.till || 0) >= 12).sort((a, b) => b.till - a.till)[0];
  if (rich) out.push({ id: 'till', icon: 'coin', text: `Collect money at ${rich.name}`, tip: `Go to ${rich.name} and tap the counter.` });
  return out;
}

/* ---------------- letters for the new worlds ---------------- */
function stepLetters(W) {
  if (W.letter || W.T < W.tjLetterNext) return;
  W.tjLetterNext = W.T + rand(240, 420);
  const me = NAMES[W.player], ppl = others(W), sh = shops(W);
  const owner = W.folk.people[W.owner], fam = owner && W.folk.fams[owner.fam]; if (!fam) return;
  const opts = [];
  if (ppl.length) {
    const a = pick(ppl), b = nm(a);
    opts.push([`Dear ${me},`, 'Can you come and play?', 'We can go to the park.', `Love from ${b}`]);
    opts.push([`Dear ${me},`, 'You are my best friend.', 'I like your house!', `Love from ${b}`]);
    opts.push([`Dear ${me},`, 'I had a big cake today.', 'It was yummy!', `From ${b}`]);
    const rel = relsOf(W).find(r => r.b === W.player && NAMES[r.a]);
    if (rel) opts.push([`Dear ${me},`, `I love you lots.`, 'See you soon!', `Love from your ${rel.w}`]);
  }
  if (sh.length) { const s = pick(sh), t = pick(sellsOf(s.type)); if (t) opts.push([`Dear ${me},`, `Come to ${s.name}!`, `We have ${t.word}.`, `From ${s.name}`]); }
  opts.push([`Dear ${me},`, 'The sun is out.', 'Look up and wave!', 'From the sky']);
  const lines = pick(opts), entry = entryRoom(fam), door = (ROOMS[entry].doors || []).find(d => d.special === 'map');
  if (!door) return;
  const at = nav(entry).nearestFree(door.at[0] - 1.0, door.at[1] - 0.3);
  W.letter = { i: -1, lines, from: lines[lines.length - 1], room: entry, x: at[0], y: at[1] }; W.dirty = true;
  SFX.plop(); later(W, 0.15, () => SFX.plop());
  if (W.room === entry) speak('Post!', 'narrator');
}

/* ---------------- working a shift: serve the customers ---------------- */
const NPC_FACES = ['#f6d2b8', '#e0ac85', '#a0694a', '#f0c9a8', '#6e4630'];
export function ShiftPanel({ W, sh, onCoin, onDone, onClose }) {
  const T = SHOP_TYPES[sh.type], list = sellsOf(sh.type).map(t => t.word);
  const other = SHOP_TYPES[pick(Object.keys(SHOP_TYPES).filter(k => k !== sh.type))];
  const [round, setRound] = useState(() => newCustomer(W, list));
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState(null);
  const [choices] = useState(() => [...list, ...sellsOf(other.id).map(t => t.word).slice(0, 1)].sort(() => Math.random() - 0.5));
  const total = 4;
  const ask = `Can I have ${round.want}, please?`;
  React.useEffect(() => { const t = setTimeout(() => speak(ask, round.voice), 300); return () => clearTimeout(t); }, [round]);
  const tap = w => {
    if (msg === 'ok') return;
    speak(w, 'word');
    if (w !== round.want) { setMsg('no'); SFX.click(); setTimeout(() => speak(`No, I asked for ${round.want}!`, round.voice), 700); return; }
    setMsg('ok'); SFX.coins(); onCoin(2);
    setTimeout(() => speak(pick(['Thank you!', 'Lovely, thanks!', 'Perfect!']), round.voice), 500);
    setTimeout(() => { if (n + 1 >= total) { onDone(); return; } setN(n + 1); setMsg(null); setRound(newCustomer(W, list, round.who)); }, 1700);
  };
  const thing = sellsOf(sh.type).find(t => t.word === round.want);
  return <div className="sheet tj-shift" role="dialog" aria-label="Help in the shop" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak(`Help at ${sh.name}`, 'narrator')}>Help at {sh.name}</button><span className="shift-n">{n + 1} / {total}</span><button className="pill" onClick={onClose}>Stop</button></div>
    <div className="shift-body">
      <div className="customer">{round.who ? <HeadIcon who={round.who} o={DEFAULT_OUTFITS[round.who]} size={92} /> : <svg viewBox="-30 -30 60 60" width="92" height="92" aria-hidden="true"><circle r={24} fill={round.face} /><circle cx={-8} cy={-3} r={3} fill="#3b2a24" /><circle cx={8} cy={-3} r={3} fill="#3b2a24" /><path d="M-8,8 q8,7 16,0" stroke="#3b2a24" strokeWidth={2.5} fill="none" strokeLinecap="round" /><path d="M-24,-6 q2,-24 24,-24 q22,0 24,24 q-6,-12 -24,-12 q-18,0 -24,12z" fill={round.hair} /></svg>}
        <small>{round.who ? NAMES[round.who] : 'Customer'}</small></div>
      <button className={'shift-ask' + (msg === 'ok' ? ' ok' : msg === 'no' ? ' no' : '')} onClick={() => speak(ask, round.voice)}>{msg === 'ok' ? 'Thank you!' : msg === 'no' ? `No, I asked for ${round.want}!` : ask}</button>
    </div>
    <p className="shift-q">Tap what they want:</p>
    <div className="tb-things">{choices.map(w => <button key={w} className={'tile food-tile' + (msg === 'ok' && w === round.want ? ' right' : '')} onClick={() => tap(w)}>{thing && w === round.want && msg === 'ok' ? <ItemIcon it={{ kind: thing.kind || 'shopping', c: sh.sign }} size={44} /> : null}<span>{w}</span></button>)}</div>
    <small className="note">{T.type} · 2 coins for each customer</small>
  </div>;
}
function newCustomer(W, list, last) {
  const ppl = others(W).filter(id => id !== last);
  const who = ppl.length && Math.random() < 0.6 ? pick(ppl) : null;
  return { who, want: pick(list), voice: who || pick(['lady', 'man', 'kid']), face: pick(NPC_FACES), hair: pick(['#3b2a24', '#c49a5e', '#e2c48a', '#b5452a', '#2b1d16']) };
}
export { PLACES };
