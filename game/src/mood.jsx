// Tomodachi-style care: everyone has a happiness meter, a thought bubble when they need something,
// a secret favourite and worst food, and sometimes friends fall out and need help to make up.
import React, { useMemo, useState } from 'react';
import { rand, pick, speak, SFX, achieve, earn } from './core.js';
import { say, later } from './world.js';
import { NAMES, HeadIcon, OPTIONS, DEFAULT_OUTFITS } from './people.jsx';
import { Product, GROC } from './places.jsx';
import { TopIcon } from './clothes.jsx';
import { personaOf, friendship } from './personality.jsx';

export const FOODS = ['apples', 'bananas', 'carrots', 'grapes', 'cheese', 'eggs', 'yogurt', 'peas', 'icecream', 'fishfingers', 'pizza', 'bread', 'cake', 'cookies', 'cereal', 'porridge', 'pasta', 'beans', 'soup', 'rice', 'crisps', 'sweets', 'choc', 'honey'].filter(k => GROC[k]);
export const foodWord = k => (GROC[k] ? GROC[k][0] : k);
const cap = s => s[0].toUpperCase() + s.slice(1);
const PRESENTS = ['teddy', 'ball', 'crayons', 'bubbles', 'cake', 'sweets'].filter(k => GROC[k]);
const COLOURS = [['red', '#e0524a'], ['blue', '#5b9bd5'], ['green', '#4cc76a'], ['yellow', '#f2b84b'], ['pink', '#e86a92'], ['purple', '#9b7cc4'], ['black', '#2b2b2e'], ['orange', '#f28a1c']];
const TOP_WORD = { tee: 'T-shirt', dress: 'dress', hoodie: 'hoodie', jumper: 'jumper', flannel: 'shirt' };
const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
export const NEED_LINE = {
  hungry: () => 'I am hungry!',
  clothes: () => 'I want new clothes!',
  friend: () => 'I want a new friend!',
  play: () => 'Play a game with me!',
  fight: n => `I fell out with ${NAMES[n.with] || 'my friend'}.`,
  levelup: () => 'I am so happy! I went up a level!',
};

/* ---------------- state ---------------- */
export function initMood(W, saved) {
  W.mood = (saved && saved.mood) || {};
  W.fights = (saved && saved.fights) || [];
  W.needNext = (W.T || 0) + 20; W.fightNext = (W.T || 0) + rand(150, 260);
}
export function moodOf(W, id) {
  if (!W.mood[id]) {
    const fav = pick(FOODS); let worst = pick(FOODS); while (worst === fav) worst = pick(FOODS);
    W.mood[id] = { h: Math.round(rand(15, 45)), lvl: 1, need: null, fav, worst, known: {}, gifts: [] };
  }
  return W.mood[id];
}
const busyNet = (W, id) => id === W.player || (W.net && W.net.other.player === id);
// the people who can have needs right now: about in the world, not being played
function residents(W) {
  return Object.keys(W.people).filter(id => NAMES[id] && W.people[id].room && !busyNet(W, id) && !['nanny', 'grandad'].includes(id));
}
export const fighting = (W, a, b) => (W.fights || []).some(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
export const bubbleOf = (W, id) => { const m = W.mood && W.mood[id]; if (!m) return null; if (m.present) return 'levelup'; return m.need ? m.need.kind : null; };

export function addHappy(W, id, n, fx) {
  const m = moodOf(W, id);
  m.h += n; W.dirty = true;
  while (m.h >= 100) {
    m.h -= 100; m.lvl++; m.present = true;
    later(W, 1.2, () => { if (fx && fx.levelUp) fx.levelUp(id, m.lvl); });
  }
}
function clearNeed(W, id) { const m = moodOf(W, id); m.need = null; W.dirty = true; }

/* ---------------- every frame (on the main tablet) ---------------- */
export function stepMood(W, fx) {
  if (!W.mood || W.guest || W.bedtime || W.hide || W.drive || W.photo) return;
  if (W.T > W.needNext) {
    W.needNext = W.T + rand(35, 70);
    const ppl = residents(W);
    const active = ppl.filter(id => bubbleOf(W, id)).length;
    const free = ppl.filter(id => !bubbleOf(W, id));
    if (active < 3 && free.length) {
      const here = free.filter(id => W.people[id].room === W.room);
      const id = here.length && Math.random() < 0.65 ? pick(here) : pick(free);
      const t = personaOf(W, id), likes = t.likes || [], has = l => likes.includes(l);
      const opts = [['hungry', 3 + (has('food') ? 2 : 0)], ['clothes', 2 + (has('dancing') ? 2 : 0)], ['friend', 1.5 + (t.t && t.t.chat >= 3 ? 1.5 : 0)], ['play', 2 + (has('games') || has('football') ? 2 : 0)]];
      let r = Math.random() * opts.reduce((s, o) => s + o[1], 0), kind = opts[0][0];
      for (const [k, w] of opts) { r -= w; if (r <= 0) { kind = k; break; } }
      moodOf(W, id).need = { kind, t0: W.T }; W.dirty = true;
      if (W.people[id].room === W.room) { say(W, id, NEED_LINE[kind](moodOf(W, id).need)); SFX.pop(); }
    }
  }
  if (W.T > W.fightNext) {
    W.fightNext = W.T + rand(220, 380);
    if (!W.fights.length) {
      const ppl = residents(W).filter(id => !bubbleOf(W, id));
      const pairs = [];
      for (let i = 0; i < ppl.length; i++) for (let j = i + 1; j < ppl.length; j++) {
        const a = ppl[i], b = ppl[j];
        if (friendship(W, a, b) < 1) continue;
        const near = W.people[a].room === W.people[b].room;
        pairs.push([a, b, near ? (W.people[a].room === W.room ? 4 : 2) : 0.5]);
      }
      if (pairs.length) {
        let r = Math.random() * pairs.reduce((s, p) => s + p[2], 0), pr = pairs[0];
        for (const p of pairs) { r -= p[2]; if (r <= 0) { pr = p; break; } }
        startFight(W, pr[0], pr[1], fx);
      }
    }
  }
}
export function startFight(W, a, b, fx) {
  W.fights.push({ a, b, t0: W.T });
  if (W.friends) W.friends[key(a, b)] = Math.max(0, (W.friends[key(a, b)] || 0) - 3);
  moodOf(W, a).need = { kind: 'fight', with: b, t0: W.T };
  moodOf(W, b).need = { kind: 'fight', with: a, t0: W.T };
  W.dirty = true;
  const here = id => W.people[id] && W.people[id].room === W.room;
  if (here(a)) { say(W, a, pick(['That is MINE!', 'You took my seat!', 'Stop copying me!', 'You broke my crayon!'])); SFX.boing(); }
  if (here(b)) later(W, 1.8, () => say(W, b, pick(['Hmph! Not friends!', 'Did not!', 'You are mean!', 'I am not talking to you!'])));
  fx && fx.fight && fx.fight(a, b);
}
export function makeUp(W, a, fx) {
  const f = (W.fights || []).find(x => x.a === a || x.b === a); if (!f) return;
  const b = f.a === a ? f.b : f.a;
  W.fights = W.fights.filter(x => x !== f);
  if (W.friends) W.friends[key(a, b)] = Math.max(4, W.friends[key(a, b)] || 0);
  for (const id of [a, b]) { const m = moodOf(W, id); if (m.need && m.need.kind === 'fight') m.need = null; }
  addHappy(W, a, 25, fx); addHappy(W, b, 25, fx);
  earn(W, 4);
  later(W, 1, () => achieve(W, 'makeup'));
  fx && fx.madeUp && fx.madeUp(a, b);
}

/* ---------------- doing things for people ---------------- */
// returns 'fav' | 'worst' | 'ok'
export function feed(W, id, food, fx) {
  const m = moodOf(W, id);
  const how = food === m.fav ? 'fav' : food === m.worst ? 'worst' : 'ok';
  if (how === 'fav') { m.known.fav = true; later(W, 2, () => achieve(W, 'favfood')); }
  if (how === 'worst') m.known.worst = true;
  if (m.need && m.need.kind === 'hungry') { clearNeed(W, id); earn(W, 3); }
  addHappy(W, id, how === 'fav' ? 40 : how === 'ok' ? 20 : 5, fx);
  return how;
}
export const reactLine = (id, food, how) => (how === 'fav' ? `${cap(foodWord(food))}! My FAVOURITE!` : how === 'worst' ? `Yuck! I do not like ${foodWord(food)}!` : pick(['Yum! Thank you!', 'Mmm, tasty!', 'That was nice!']));
export function dress(W, id, fx) { if (moodOf(W, id).need && moodOf(W, id).need.kind === 'clothes') { clearNeed(W, id); earn(W, 3); } addHappy(W, id, 25, fx); }
export function befriend(W, id, other, fx) {
  if (W.friends) W.friends[key(id, other)] = Math.min(10, (W.friends[key(id, other)] || 0) + 3);
  if (moodOf(W, id).need && moodOf(W, id).need.kind === 'friend') { clearNeed(W, id); earn(W, 3); }
  addHappy(W, id, 25, fx); if (W.mood[other] || NAMES[other]) addHappy(W, other, 10, fx);
}
export function played(W, id, fx) { if (moodOf(W, id).need && moodOf(W, id).need.kind === 'play') { clearNeed(W, id); earn(W, 3); } addHappy(W, id, 30, fx); }
export function givePresent(W, id, k) { const m = moodOf(W, id); m.present = false; m.gifts = [...(m.gifts || []), k].slice(-12); W.dirty = true; earn(W, 10); later(W, 1, () => achieve(W, 'levelup')); }

// for the Jobs list
export function moodTodos(W, where) {
  const out = [];
  for (const id of Object.keys(W.mood || {})) {
    const k = bubbleOf(W, id); if (!k || !W.people[id] || !W.people[id].room || busyNet(W, id)) continue;
    const w = where(id);
    out.push({ id: 'need-' + id, icon: k === 'play' ? 'ball' : k === 'fight' ? 'letter' : 'star', text: k === 'levelup' ? `${NAMES[id]} went up a level!` : `${NAMES[id]}: ${NEED_LINE[k](moodOf(W, id).need)}`, tip: `${NAMES[id]} is ${w ? 'at ' + w : 'about'}. Tap the bubble over their head.` });
  }
  return out.slice(0, 4);
}

/* ---------------- the thought bubble ---------------- */
function Storm() { return <g><path d="M-14,2 a8,8 0 0 1 4,-14 a10,10 0 0 1 18,-1 a7,7 0 0 1 6,14z" fill="#6b7280" /><path d="M-2,4 l-5,10 h5 l-3,9 10,-13 h-5 l3,-6z" fill="#ffd45e" /></g>; }
function Star() { return <path d="M0,-15 L4.4,-5 15,-4.6 6.8,2.4 9.4,13 0,7 -9.4,13 -6.8,2.4 -15,-4.6 -4.4,-5z" fill="#ffd45e" stroke="#e0a92e" strokeWidth="1.5" />; }
function Heart() { return <path d="M0,12 C-16,1 -12,-13 0,-4 C12,-13 16,1 0,12Z" fill="#e86a92" />; }
export function NeedBubble({ kind, x, y, T, outfit }) {
  const bob = Math.sin(T * 3 + x) * 4;
  const icon = kind === 'hungry' ? <g transform="translate(-18 -19)"><Product id="apples" size={36} /></g>
    : kind === 'clothes' ? <g transform="translate(-16 -16)"><TopIcon top={(outfit && outfit.top) || 'tee'} color="#e86a92" size={32} /></g>
    : kind === 'friend' ? <Heart /> : kind === 'play' ? <g transform="translate(-17 -18)"><Product id="ball" size={34} /></g>
    : kind === 'fight' ? <Storm /> : <Star />;
  return <g transform={`translate(${x} ${y - 6 + bob}) scale(1.3)`} style={{ cursor: 'pointer' }}>
    <circle cx={-40} cy={26} r={5} fill="#fff" stroke="#3b2a24" strokeWidth={2.5} />
    <circle cx={-28} cy={18} r={8} fill="#fff" stroke="#3b2a24" strokeWidth={2.5} />
    <ellipse cx={0} cy={0} rx={34} ry={28} fill={kind === 'levelup' ? '#fff6c8' : '#fff'} stroke="#3b2a24" strokeWidth={3} />
    {icon}
  </g>;
}

/* ---------------- the care panel ---------------- */
// fx: { eat(id, food, how), dressed(id, outfit), friends(id, other), played(id), makeUp(id), present(id, k) }
export function CarePanel({ W, id, outfits, people, onClose, onDo }) {
  const m = moodOf(W, id), kind = m.present ? 'levelup' : m.need ? m.need.kind : null, name = NAMES[id];
  const head = <HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={46} />;
  return <div className="sheet care" role="dialog" aria-label={`Help ${name}`} onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip care-who" onClick={() => speak(kind ? NEED_LINE[kind](m.need || {}) : `${name} is happy.`, id)}>{head}<span>{kind ? NEED_LINE[kind](m.need || {}) : `${name} is happy!`}</span></button><button className="pill" onClick={onClose}>Close</button></div>
    <Meter m={m} />
    {kind === 'hungry' && <FoodPick W={W} id={id} onPick={f => onDo('eat', f)} />}
    {kind === 'clothes' && <ClothesPick id={id} outfit={outfits[id] || DEFAULT_OUTFITS[id]} onPick={o => onDo('dress', o)} />}
    {kind === 'friend' && <FriendPick W={W} id={id} people={people} outfits={outfits} onPick={o => onDo('friend', o)} />}
    {kind === 'play' && <WordGame onDone={() => onDo('played')} />}
    {kind === 'fight' && <MakeUp W={W} id={id} other={m.need.with} outfits={outfits} onDone={() => onDo('makeup')} />}
    {kind === 'levelup' && <PresentPick name={name} lvl={m.lvl} onPick={k => onDo('present', k)} />}
    {!kind && <FoodPick W={W} id={id} snack onPick={f => onDo('eat', f)} />}
  </div>;
}
export function Meter({ m }) {
  return <div className="care-meter" aria-label={`Happiness ${m.h} of 100, level ${m.lvl}`}>
    <span className="care-lvl">Level {m.lvl}</span>
    <span className="care-bar"><span style={{ width: Math.max(4, m.h) + '%' }} /></span>
    <Heart2 />
  </div>;
}
const Heart2 = () => <svg viewBox="-14 -14 28 28" width={26} height={26} aria-hidden="true"><path d="M0,10 C-14,0 -10,-12 0,-4 C10,-12 14,0 0,10Z" fill="#e86a92" /></svg>;
function FoodPick({ W, id, snack, onPick }) {
  const m = moodOf(W, id);
  const foods = useMemo(() => { const l = []; while (l.length < 6) { const f = pick(FOODS); if (!l.includes(f)) l.push(f); } return l; }, [id]);
  return <><p className="care-q">{snack ? `Give ${NAMES[id]} a snack?` : `What shall ${NAMES[id]} eat?`}</p>
    <div className="care-grid">{foods.map(f => <button key={f} className="tile care-tile" onClick={() => { speak(foodWord(f), 'word'); onPick(f); }}><Product id={f} size={50} /><small>{foodWord(f)}</small>{(m.known.fav && f === m.fav) && <b className="care-tag fav">favourite</b>}{(m.known.worst && f === m.worst) && <b className="care-tag worst">yuck</b>}</button>)}</div></>;
}
function ClothesPick({ id, outfit, onPick }) {
  const opts = useMemo(() => {
    const tops = (OPTIONS[id] && OPTIONS[id].top) || ['tee', 'hoodie', 'jumper', 'dress'];
    const l = []; let n = 0;
    while (l.length < 4 && n++ < 40) { const top = pick(tops), [cw, col] = pick(COLOURS); if (!l.some(o => o.top === top && o.color === col) && !(top === outfit.top && col === outfit.color)) l.push({ top, color: col, word: `${cw} ${TOP_WORD[top] || top}` }); }
    return l;
  }, [id]);
  return <><p className="care-q">Pick something new to wear!</p>
    <div className="care-grid">{opts.map(o => <button key={o.word} className="tile care-tile" onClick={() => { speak(o.word, 'word'); onPick({ ...outfit, top: o.top, color: o.color, pattern: 'plain', word: o.word }); }}><TopIcon top={o.top} color={o.color} size={50} /><small>{o.word}</small></button>)}</div></>;
}
function FriendPick({ W, id, people, outfits, onPick }) {
  const list = people.filter(o => o !== id && friendship(W, id, o) < 8 && !fighting(W, id, o)).slice(0, 6);
  if (!list.length) return <p className="care-q">Make someone new first, so {NAMES[id]} can meet them!</p>;
  return <><p className="care-q">Who should {NAMES[id]} make friends with?</p>
    <div className="care-grid">{list.map(o => <button key={o} className="tile care-tile" onClick={() => { speak(NAMES[o], 'word'); onPick(o); }}><HeadIcon who={o} o={outfits[o] || DEFAULT_OUTFITS[o]} size={50} /><small>{NAMES[o]}</small></button>)}</div></>;
}
// "Find the ...": three goes at matching a word to its picture
function WordGame({ onDone }) {
  const rounds = useMemo(() => [0, 1, 2].map(() => { const set = []; while (set.length < 3) { const f = pick(FOODS.concat(['teddy', 'ball', 'crayons'].filter(k => GROC[k]))); if (!set.includes(f)) set.push(f); } return { set, want: pick(set) }; }), []);
  const [i, setI] = useState(0), [oops, setOops] = useState(null);
  const R = rounds[i];
  if (!R) return null;
  const tap = f => {
    if (f !== R.want) { setOops(f); SFX.click(); speak(foodWord(f), 'word'); return; }
    SFX.sparkle(); speak(foodWord(f), 'word'); setOops(null);
    if (i === 2) onDone(); else setI(i + 1);
  };
  return <><p className="care-q">Find the <button className="care-word" onClick={() => speak(foodWord(R.want), 'word')}>{foodWord(R.want)}</button>! <span className="care-n">{i + 1}/3</span></p>
    <div className="care-grid three">{R.set.map(f => <button key={f + i} data-k={f} className={'tile care-tile' + (oops === f ? ' oops' : '')} onClick={() => tap(f)}><Product id={f} size={64} /></button>)}</div></>;
}
// Saying sorry: put the words in order to write the letter, or give a present
function MakeUp({ W, id, other, outfits, onDone }) {
  const [way, setWay] = useState(null);
  const words = useMemo(() => ['I', 'am', 'sorry', NAMES[other] + '!'], [other]);
  const shuffled = useMemo(() => [...words, pick(['cat', 'big', 'sun', 'dog'])].sort(() => Math.random() - 0.5), [words]);
  const [got, setGot] = useState(0), [oops, setOops] = useState(null);
  const tapWord = (w, i) => {
    speak(w.replace('!', ''), 'word');
    if (w === words[got]) { SFX.pop(); setOops(null); if (got + 1 === words.length) { later(W, 0.2, () => {}); setGot(got + 1); setTimeout(onDone, 900); } else setGot(got + 1); }
    else { setOops(i); SFX.click(); }
  };
  if (!way) return <><p className="care-q">Help {NAMES[id]} and {NAMES[other]} be friends again!</p>
    <div className="care-heads"><HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={54} /><Storm2 /><HeadIcon who={other} o={outfits[other] || DEFAULT_OUTFITS[other]} size={54} /></div>
    <div className="pair care-ways"><button className="done" onClick={() => { setWay('letter'); speak('Write a sorry letter.', 'narrator'); }}>Write a sorry letter</button><button className="pill" onClick={() => setWay('present')}>Give a present (5 coins)</button></div></>;
  if (way === 'present') return <PresentPick name={NAMES[other]} sorry cost={5} coins={W.coins} onPick={() => { W.coins -= 5; onDone(); }} />;
  return <><p className="care-q">Tap the words in order: <b>{words.join(' ')}</b></p>
    <div className="care-letter">{words.map((w, i) => <span key={i} className={'care-slot' + (i < got ? ' on' : '')}>{i < got ? w : ''}</span>)}</div>
    <div className="care-words">{shuffled.map((w, i) => { const used = words.indexOf(w) > -1 && words.indexOf(w) < got; return <button key={i} disabled={used} className={'pill care-wbtn' + (oops === i ? ' oops' : '')} onClick={() => tapWord(w, i)}>{w}</button>; })}</div></>;
}
const Storm2 = () => <svg viewBox="-20 -16 40 34" width={44} height={38} aria-hidden="true"><Storm /></svg>;
function PresentPick({ name, lvl, sorry, cost, coins, onPick }) {
  const opts = useMemo(() => { const l = []; while (l.length < 3) { const k = pick(PRESENTS); if (!l.includes(k)) l.push(k); } return l; }, []);
  const poor = cost && coins < cost;
  return <><p className="care-q">{sorry ? `Pick a present for ${name}.` : `${name} is now level ${lvl}! Pick a present.`}</p>
    {poor && <p className="care-q small">You need {cost} coins.</p>}
    <div className="care-grid three">{opts.map(k => <button key={k} disabled={poor} className="tile care-tile" onClick={() => { speak(foodWord(k), 'word'); onPick(k); }}><Product id={k} size={58} /><small>{foodWord(k)}</small></button>)}</div></>;
}

/* ---------------- About page bits ---------------- */
export function moodLines(W, id) {
  const m = W.mood && W.mood[id]; if (!m) return [];
  const out = [`${NAMES[id]} is level ${m.lvl}.`];
  out.push(m.known.fav ? `Favourite food: ${foodWord(m.fav)}.` : 'Favourite food: ???');
  out.push(m.known.worst ? `Worst food: ${foodWord(m.worst)}.` : 'Worst food: ???');
  const f = (W.fights || []).find(x => x.a === id || x.b === id);
  if (f) out.push(`${NAMES[id]} has fallen out with ${NAMES[f.a === id ? f.b : f.a]}.`);
  return out;
}
