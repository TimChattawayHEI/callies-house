// Crushes, sweethearts, weddings and babies (Tomodachi-style, kept cartoony).
// Only grown-ups she has made take part. In Callie's House, Mum and Dad are already married.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { rand, pick, speak, SFX } from './core.js';
import { NAMES, HeadIcon, Person, DEFAULT_OUTFITS } from './people.jsx';
import { NAME_IDEAS, SKINS, Keyboard, prettyName } from './folk.jsx';
import { friendship } from './personality.jsx';
import { familyWith } from './relations.js';
import { moodOf } from './mood.jsx';

export function initLove(W, saved) {
  W.love = (saved && saved.love) || { couples: [] };
  if (!W.fresh && !W.love.couples.some(c => c.a === 'mum' && c.b === 'dad')) W.love.couples.push({ a: 'mum', b: 'dad', married: true, t0: 0, kids: 3, fixed: true });
  W.loveNext = (W.T || 0) + rand(180, 280);
}
export const coupleOf = (W, id) => (W.love ? W.love.couples.find(c => c.a === id || c.b === id) : null);
export const partnerOf = (W, id) => { const c = coupleOf(W, id); return c ? (c.a === id ? c.b : c.a) : null; };
const grownUp = (W, id) => { const d = W.folk && W.folk.people[id]; return !!(d && (d.body === 'adult' || d.body === 'tall')); };
const playing = (W, id) => id === W.player || (W.net && W.net.other.player === id);
const free = (W, id) => W.people[id] && W.people[id].room && !playing(W, id) && !(W.mood[id] && (W.mood[id].need || W.mood[id].present));

// every few minutes on the main tablet: a crush, a proposal, or a baby on the way
export function stepLove(W) {
  if (!W.love || W.guest || W.bedtime || W.drive || W.T < W.loveNext) return;
  W.loveNext = W.T + rand(160, 300);
  const now = Date.now();
  for (const c of W.love.couples) {
    if (c.fixed) continue;
    const who = [c.a, c.b].filter(id => free(W, id));
    if (!who.length) continue;
    if (c.married && (c.kids || 0) < 2 && now - (c.at || 0) > 4 * 60 * 1000 && Math.random() < 0.5) { moodOf(W, pick(who)).need = { kind: 'baby', with: c.a === who[0] ? c.b : c.a, t0: W.T }; W.dirty = true; return; }
    if (!c.married && now - (c.at || 0) > 3 * 60 * 1000 && Math.random() < 0.6) { const id = pick(who); moodOf(W, id).need = { kind: 'propose', with: id === c.a ? c.b : c.a, t0: W.T }; W.dirty = true; return; }
  }
  const ppl = Object.keys(W.folk ? W.folk.people : {}).filter(id => grownUp(W, id) && !coupleOf(W, id) && W.people[id] && W.people[id].room && !playing(W, id));
  const pairs = [];
  for (const a of ppl) for (const b of ppl) if (a < b && !familyWith(W, a, b) && friendship(W, a, b) >= 3) pairs.push([a, b]);
  if (!pairs.length) return;
  const [a, b] = pick(pairs), who = free(W, a) ? a : free(W, b) ? b : null;
  if (!who) return;
  moodOf(W, who).need = { kind: 'crush', with: who === a ? b : a, t0: W.T }; W.dirty = true;
}
// does the other one like them back?
export const sayYes = (W, a, b) => Math.random() < (friendship(W, a, b) >= 6 ? 0.9 : 0.7);
export function becomeSweethearts(W, a, b) {
  if (coupleOf(W, a) || coupleOf(W, b)) return;
  W.love.couples.push({ a, b, married: false, at: Date.now(), kids: 0 });
  if (W.friends) { const k = a < b ? a + '|' + b : b + '|' + a; W.friends[k] = 10; }
  W.dirty = true;
}
export function marry(W, a, b) { const c = coupleOf(W, a); if (c) { c.married = true; c.at = Date.now(); } W.dirty = true; }
// a new baby: looks a bit like both of them
export function babyDef(W, a, b, name, boy) {
  const da = W.folk.people[a] || {}, db = W.folk.people[b] || {};
  const color = pick(['#e86a92', '#5b9bd5', '#7cc9a8', '#f2b84b', '#b58ee0']), top = boy ? pick(['tee', 'hoodie']) : pick(['dress', 'tee']);
  return { name, body: 'kid', skin: pick([da.skin, db.skin].filter(Boolean).concat(SKINS[0])), hair: boy ? pick(['short', 'curly']) : pick(['pony', 'long', 'curly']), hairCol: pick([da.hairCol, db.hairCol].filter(Boolean).concat('#6b4a33')), glasses: false, beard: false, voice: 'high', top, color };
}
export const loveLines = (W, id) => { const c = coupleOf(W, id); if (!c || c.fixed) return []; const o = c.a === id ? c.b : c.a; return [c.married ? `${NAMES[id]} is married to ${NAMES[o]}.` : `${NAMES[id]} and ${NAMES[o]} are sweethearts.`]; };

/* ---------------- the bits of the care panel ---------------- */
const Hearts = () => <svg viewBox="-20 -16 40 32" width={44} height={36} aria-hidden="true"><path d="M-6,10 C-20,0 -16,-12 -6,-4 C4,-12 8,0 -6,10Z" fill="#e86a92" /><path d="M8,6 C-2,-1 1,-10 8,-4 C15,-10 18,-1 8,6Z" fill="#f6a9c3" /></svg>;
const Ring = () => <svg viewBox="-16 -18 32 34" width={40} height={42} aria-hidden="true"><circle cx={0} cy={4} r={10} fill="none" stroke="#f2b84b" strokeWidth={4} /><path d="M-5,-8 l5,-7 5,7 -5,4z" fill="#bfe0f7" stroke="#7cc9e8" /></svg>;
export function LovePart({ W, id, kind, outfits, onDo }) {
  const m = moodOf(W, id), other = m.need && m.need.with, name = NAMES[id], on = NAMES[other];
  const two = <div className="care-heads"><HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={58} />{kind === 'propose' ? <Ring /> : <Hearts />}<HeadIcon who={other} o={outfits[other] || DEFAULT_OUTFITS[other]} size={58} /></div>;
  if (kind === 'crush') return <>{two}<p className="care-q">{name} really likes {on}! Should {name} tell {on}?</p>
    <div className="pair care-ways"><button className="done" onClick={() => onDo('confess')}>Yes, tell {on}!</button><button className="pill" onClick={() => onDo('notnow')}>Not now</button></div></>;
  if (kind === 'propose') return <>{two}<p className="care-q">{name} wants to marry {on}! Shall we have a wedding?</p>
    <div className="pair care-ways"><button className="done" onClick={() => onDo('wedding')}>Yes! A wedding!</button><button className="pill" onClick={() => onDo('notnow')}>Not yet</button></div></>;
  if (kind === 'baby') return <BabyPick W={W} id={id} other={other} outfits={outfits} onDo={onDo} />;
  return null;
}
function BabyPick({ W, id, other, outfits, onDo }) {
  const [boy, setBoy] = useState(null), [name, setName] = useState(null), [typing, setTyping] = useState(false), [typed, setTyped] = useState('');
  const ideas = useMemo(() => { const used = new Set(Object.values(NAMES).map(n => String(n).toUpperCase())); const l = NAME_IDEAS.filter(n => !used.has(n)); const out = []; while (out.length < 6 && l.length) out.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]); return out; }, []);
  return <>
    <div className="care-heads"><HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={54} /><span className="baby-plus">+</span><HeadIcon who={other} o={outfits[other] || DEFAULT_OUTFITS[other]} size={54} /></div>
    <p className="care-q">{NAMES[id]} and {NAMES[other]} are having a baby!</p>
    <p className="care-q small-q">Is it a boy or a girl?</p>
    <div className="pair care-ways"><button className={'pill song-chip' + (boy === true ? ' on' : '')} onClick={() => { setBoy(true); speak('boy', 'word'); }}>boy</button><button className={'pill song-chip' + (boy === false ? ' on' : '')} onClick={() => { setBoy(false); speak('girl', 'word'); }}>girl</button></div>
    {boy != null && <><p className="care-q small-q">What shall we call the baby?</p>
      <div className="song-chips centre">{ideas.map(n => <button key={n} className={'pill song-chip' + (name === n ? ' on' : '')} onClick={() => { setName(n); speak(prettyName(n), 'word'); }}>{prettyName(n)}</button>)}<button className="pill song-chip own" onClick={() => { setTyping(true); setTyped(''); }}>{name && !ideas.includes(name) ? prettyName(name) : 'My name'}</button></div></>}
    {typing && <div className="song-type"><b>{typed ? prettyName(typed) : '...'}</b><Keyboard onKey={k => { SFX.click(); if (k === '<') setTyped(t => t.slice(0, -1)); else setTyped(t => (t + k).slice(0, 10)); }} /><div className="pair"><button className="pill" onClick={() => setTyping(false)}>Cancel</button><button className="done" disabled={typed.length < 2} onClick={() => { setName(typed); speak(prettyName(typed), 'word'); setTyping(false); }}>Use it</button></div></div>}
    <div className="pair care-ways"><button className="done" disabled={boy == null || !name} onClick={() => onDo('baby', { name: prettyName(name), boy })}>Welcome the baby!</button></div>
  </>;
}

/* ---------------- the wedding ---------------- */
export function WeddingPanel({ a, b, guests, outfits, homes, onDone }) {
  const [step, setStep] = useState(0), [t, setT] = useState(0), [move, setMove] = useState(null);
  const raf = useRef(0);
  useEffect(() => { const t0 = performance.now(); const loop = n => { setT((n - t0) / 1000); raf.current = requestAnimationFrame(loop); }; raf.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf.current); }, []);
  const lines = [`${NAMES[a]} and ${NAMES[b]} are getting married!`, `Do you, ${NAMES[a]}, promise to always be kind to ${NAMES[b]}?`, `Do you, ${NAMES[b]}, promise to always be kind to ${NAMES[a]}?`, `You are married! Hooray!`];
  useEffect(() => { const id = setTimeout(() => speak(lines[Math.min(step, 3)], 'narrator'), 300); if (step === 3) { SFX.bell(); setTimeout(() => SFX.fanfare(), 900); } return () => clearTimeout(id); }, [step]);
  const say = who => { speak('I do!', who); SFX.sparkle(); setTimeout(() => setStep(s => s + 1), 1200); };
  const crown = o => ({ ...o, acc: 'flower' });
  const pose = (who, i) => ({ facing: 'front', flip: false, walk: null, armL: step === 3 ? -80 : 8, armR: step === 3 ? -80 : 8, blink: 0, mouthOpen: (step === 1 && i === 0) || (step === 2 && i === 1), mode: 'stand' });
  const gs = guests.slice(0, 6);
  return <div className="concert wedding" role="dialog" aria-label="The wedding" onPointerDown={e => e.stopPropagation()}>
    <svg className="stage" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe0f7" /><stop offset="1" stopColor="#fff2f6" /></linearGradient></defs>
      <rect width="800" height="500" fill="url(#wsky)" />
      <path d="M0,300 Q400,270 800,300 V500 H0Z" fill="#8fd37a" />
      <path d="M340,500 L380,300 H420 L460,500Z" fill="#f6eef1" />
      <rect x="290" y="130" width="16" height="200" fill="#fff" stroke="#e2d1b6" /><rect x="494" y="130" width="16" height="200" fill="#fff" stroke="#e2d1b6" />
      <path d="M290,140 Q400,40 510,140" fill="none" stroke="#fff" strokeWidth="16" />
      {Array.from({ length: 13 }, (_, i) => { const u = i / 12, x = 290 + u * 220, y = 140 - Math.sin(u * Math.PI) * 78; return <circle key={i} cx={x} cy={y} r={11} fill={['#f49ac1', '#ffd45e', '#e86a92', '#fff'][i % 4]} />; })}
      {[a, b].map((id, i) => { const dy = step === 3 ? -Math.abs(Math.sin(t * 6 + i)) * 18 : 0; return <g key={id} transform={`translate(${i ? 440 : 360} ${330 + dy}) scale(1.15)`}><Person who={id} o={crown(outfits[id] || DEFAULT_OUTFITS[id])} pose={pose(id, i)} T={t} uid={'wed-' + id} /></g>; })}
      {gs.map((id, i) => { const x = [250, 550, 165, 635, 80, 720][i]; return <g key={id} transform={`translate(${x} 482) scale(0.8)`}><Person who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} pose={{ facing: 'back', flip: false, walk: null, armL: step === 3 ? -70 : 6, armR: step === 3 ? -70 : 6, blink: 0, mouthOpen: false, mode: 'stand' }} T={t} uid={'guest-' + id} /></g>; })}
      {step === 3 && Array.from({ length: 30 }, (_, i) => { const ph = (t * 0.45 + i / 30) % 1, x = (i * 89) % 800; return <path key={i} d="M0,6 C-8,0 -6,-6 0,-2 C6,-6 8,0 0,6Z" fill={['#e86a92', '#f6a9c3', '#ffd45e'][i % 3]} transform={`translate(${x} ${ph * 500}) scale(1.6)`} />; })}
    </svg>
    <div className="lyrics">
      <p className="ly-line wed">{lines[Math.min(step, 3)]}</p>
      {step === 0 && <button className="done" onClick={() => setStep(1)}>Start the wedding</button>}
      {step === 1 && <button className="done big-do" onClick={() => say(a)}>{NAMES[a]}: I do!</button>}
      {step === 2 && <button className="done big-do" onClick={() => say(b)}>{NAMES[b]}: I do!</button>}
      {step === 3 && <>{homes.length > 1 && <div className="pair">{homes.map(h => <button key={h.fam} className={'pill song-chip' + (move === h.fam ? ' on' : '')} onClick={() => { setMove(h.fam); speak(h.label, 'word'); }}>{h.label}</button>)}</div>}
        <button className="done" disabled={homes.length > 1 && !move} onClick={() => onDone(move)}>{homes.length > 1 ? 'Off they go!' : 'Hooray! Done'}</button></>}
    </div>
  </div>;
}
