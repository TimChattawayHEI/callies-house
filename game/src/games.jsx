// Minigames: quick games to play with a character (or at the funfair).
// Pop the word, Picture match, Catch the fruit, Duck race.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SFX, speak, pick } from './core.js';
import { NAMES, HeadIcon, DEFAULT_OUTFITS } from './people.jsx';
import { Product, GROC } from './places.jsx';

// things with clear pictures
const WORDS = ['cake', 'ball', 'teddy', 'bread', 'apples', 'eggs', 'cheese', 'grapes', 'carrots', 'bananas', 'cookies'].filter(k => GROC[k]);
const word = k => GROC[k][0];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickN = (list, n, not = []) => shuffle(list.filter(x => !not.includes(x))).slice(0, n);

export const GAMES = [
  { id: 'pop', name: 'Pop the word', how: 'Pop the balloon with the right word!', color: '#e86a92' },
  { id: 'match', name: 'Picture match', how: 'Find a picture and its word.', color: '#5b9bd5' },
  { id: 'catch', name: 'Catch the fruit', how: 'Move the basket to catch the fruit.', color: '#7cc9a8' },
  { id: 'race', name: 'Duck race', how: 'Tap QUACK as fast as you can!', color: '#f2b84b' },
];
function GameIcon({ id }) {
  if (id === 'pop') return <svg viewBox="-20 -24 40 48" width="52" height="56" aria-hidden="true"><ellipse cx="0" cy="-6" rx="13" ry="16" fill="#e86a92" /><path d="M0,10 l-3,4 h6z" fill="#e86a92" /><path d="M0,14 q4,6 -2,12" stroke="#3b2a24" fill="none" /></svg>;
  if (id === 'match') return <svg viewBox="-22 -18 44 36" width="56" height="48" aria-hidden="true"><rect x="-20" y="-14" width="18" height="26" rx="4" fill="#5b9bd5" /><rect x="2" y="-14" width="18" height="26" rx="4" fill="#fff" stroke="#5b9bd5" strokeWidth="2" /><text x="11" y="4" fontSize="10" textAnchor="middle" fill="#3b2a24">cat</text></svg>;
  if (id === 'catch') return <svg viewBox="-22 -22 44 44" width="52" height="52" aria-hidden="true"><circle cx="-6" cy="-12" r="6" fill="#e23b3b" /><circle cx="8" cy="-4" r="5" fill="#f2b84b" /><path d="M-18,6 h36 l-5,14 h-26z" fill="#c4863a" /></svg>;
  return <svg viewBox="-24 -18 48 36" width="56" height="44" aria-hidden="true"><path d="M-16,4 q0,-14 14,-12 q6,-8 12,-2 q4,4 -2,8 h10 q-2,14 -18,14 q-16,0 -16,-8z" fill="#ffd45e" /><circle cx="6" cy="-6" r="1.8" fill="#3b2a24" /><path d="M12,-4 l6,1 -6,2z" fill="#f28a1c" /><path d="M-24,12 q12,-6 24,0 q12,6 24,0" stroke="#5b9bd5" strokeWidth="3" fill="none" /></svg>;
}

/* ---------------- the games menu ---------------- */
export function GamesPanel({ me, buddy, outfits, title, onFinish, onClose }) {
  const [game, setGame] = useState(null);
  const done = score => { const g = game; setGame(null); onFinish(g, score); };
  if (game === 'pop') return <PopGame buddy={buddy} outfits={outfits} onDone={done} />;
  if (game === 'match') return <MatchGame buddy={buddy} outfits={outfits} onDone={done} />;
  if (game === 'catch') return <CatchGame buddy={buddy} outfits={outfits} onDone={done} />;
  if (game === 'race') return <RaceGame me={me} buddy={buddy} outfits={outfits} onDone={done} />;
  return <div className="sheet games" role="dialog" aria-label="Games" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip care-who" onClick={() => speak(title || 'Let us play a game!', 'narrator')}>{buddy && <HeadIcon who={buddy} o={outfits[buddy] || DEFAULT_OUTFITS[buddy]} size={40} />}<span>{title || (buddy ? `Play with ${NAMES[buddy]}!` : 'Games')}</span></button><button className="pill" onClick={onClose}>Close</button></div>
    <div className="game-grid">{GAMES.map(g => <button key={g.id} className="tile game-tile" style={{ '--gc': g.color }} onClick={() => { SFX.pop(); speak(g.name, 'word'); setGame(g.id); }}><GameIcon id={g.id} /><b>{g.name}</b><small>{g.how}</small></button>)}</div>
  </div>;
}
function Frame({ title, score, buddy, outfits, children, onQuit, wide }) {
  return <div className={'game-full' + (wide ? ' wide' : '')} role="dialog" aria-label={title} onPointerDown={e => e.stopPropagation()}>
    <div className="game-top"><b>{title}</b>{buddy && <span className="game-buddy"><HeadIcon who={buddy} o={outfits[buddy] || DEFAULT_OUTFITS[buddy]} size={34} /><small>{NAMES[buddy]} is cheering!</small></span>}<span className="game-score">★ {score}</span><button className="pill" onClick={onQuit}>Stop</button></div>
    {children}
  </div>;
}
function Finish({ score, line, onDone }) {
  useEffect(() => { SFX.fanfare(); speak(line, 'narrator'); }, []);
  return <div className="game-end"><p>{line}</p><div className="game-stars">{Array.from({ length: Math.max(1, Math.min(5, Math.ceil(score / 2))) }, (_, i) => <span key={i}>★</span>)}</div><button className="done" onClick={() => onDone(score)}>Done</button></div>;
}

/* ---------------- Pop the word ---------------- */
function PopGame({ buddy, outfits, onDone }) {
  const ROUNDS = 6;
  const make = () => { const want = pick(WORDS); return { want, opts: shuffle([want, ...pickN(WORDS, 3, [want])]), id: Math.random() }; };
  const [r, setR] = useState(make), [n, setN] = useState(0), [score, setScore] = useState(0), [wrong, setWrong] = useState(null), [popped, setPopped] = useState(null);
  useEffect(() => { if (n < ROUNDS) { const t = setTimeout(() => speak(`Pop the ${word(r.want)}!`, 'narrator'), 300); return () => clearTimeout(t); } return undefined; }, [r]);
  if (n >= ROUNDS) return <Frame title="Pop the word" score={score} buddy={buddy} outfits={outfits} onQuit={() => onDone(score)}><Finish score={score} line={`You popped ${score} words!`} onDone={onDone} /></Frame>;
  const tap = k => {
    if (popped) return;
    speak(word(k), 'word');
    if (k !== r.want) { setWrong(k); SFX.boing(); setTimeout(() => setWrong(null), 500); return; }
    setPopped(k); SFX.pop(); setScore(s => s + 1);
    setTimeout(() => { setPopped(null); setN(x => x + 1); setR(make()); }, 650);
  };
  return <Frame title="Pop the word" score={score} buddy={buddy} outfits={outfits} onQuit={() => onDone(score)}>
    <div className="pop-ask"><span>Pop the</span><button className="pop-pic" onClick={() => speak(word(r.want), 'word')}><Product id={r.want} size={70} /></button><span>{n + 1}/{ROUNDS}</span></div>
    <div className="pop-sky">{r.opts.map((k, i) => <button key={r.id + k} className={'balloon' + (wrong === k ? ' wobble' : '') + (popped === k ? ' popped' : '')} style={{ '--bc': ['#e86a92', '#5b9bd5', '#7cc9a8', '#f2b84b'][i], animationDelay: `${i * 0.35}s` }} onClick={() => tap(k)}><span>{word(k)}</span></button>)}</div>
  </Frame>;
}

/* ---------------- Picture match ---------------- */
function MatchGame({ buddy, outfits, onDone }) {
  const cards = useMemo(() => shuffle(pickN(WORDS, 6).flatMap(k => [{ k, pic: true }, { k, pic: false }])).map((c, i) => ({ ...c, i })), []);
  const [open, setOpen] = useState([]), [got, setGot] = useState([]), [tries, setTries] = useState(0);
  const done = got.length === 6;
  const tap = c => {
    if (open.length === 2 || open.includes(c.i) || got.includes(c.k)) return;
    SFX.click(); if (!c.pic) speak(word(c.k), 'word');
    const o = [...open, c.i]; setOpen(o);
    if (o.length === 2) {
      setTries(t => t + 1);
      const [a, b] = o.map(i => cards[i]);
      if (a.k === b.k && a.pic !== b.pic) { setTimeout(() => { setGot(g => [...g, a.k]); setOpen([]); SFX.sparkle(); speak(word(a.k), 'word'); }, 500); }
      else setTimeout(() => setOpen([]), 1100);
    }
  };
  const score = Math.max(1, 12 - Math.max(0, tries - 6));
  return <Frame title="Picture match" score={got.length} buddy={buddy} outfits={outfits} onQuit={() => onDone(got.length)}>
    {done ? <Finish score={score} line={`All matched in ${tries} goes!`} onDone={onDone} />
      : <div className="match-grid">{cards.map(c => { const up = open.includes(c.i) || got.includes(c.k); return <button key={c.i} className={'mcard' + (up ? ' up' : '') + (got.includes(c.k) ? ' got' : '')} onClick={() => tap(c)}>{up ? (c.pic ? <Product id={c.k} size={54} /> : <b>{word(c.k)}</b>) : <span>?</span>}</button>; })}</div>}
  </Frame>;
}

/* ---------------- Catch the fruit ---------------- */
const FRUIT = ['apples', 'bananas', 'grapes', 'carrots', 'cake'].filter(k => GROC[k]);
function CatchGame({ buddy, outfits, onDone }) {
  const LEN = 30;
  const box = useRef(null), st = useRef({ x: 0.5, items: [], next: 0, t: 0, score: 0, id: 0 });
  const [, tick] = useState(0), [over, setOver] = useState(false);
  useEffect(() => {
    let raf, last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const S = st.current; S.t += dt;
      if (S.t >= LEN) { setOver(true); SFX.whoosh(); return; }
      if (S.t > S.next) { S.next = S.t + 0.75 - Math.min(0.35, S.t / 90); S.items.push({ id: S.id++, k: pick(FRUIT), x: 0.08 + Math.random() * 0.84, y: -0.1, v: 0.28 + Math.random() * 0.12 + S.t / 200 }); }
      for (const it of S.items) it.y += it.v * dt;
      S.items = S.items.filter(it => {
        if (it.y > 0.82 && it.y < 0.95 && Math.abs(it.x - S.x) < 0.11) { S.score++; SFX.pop(); return false; }
        return it.y < 1.05;
      });
      tick(n => n + 1); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const move = e => { const r = box.current.getBoundingClientRect(); st.current.x = Math.max(0.06, Math.min(0.94, (e.clientX - r.left) / r.width)); };
  const S = st.current;
  return <Frame title="Catch the fruit" score={S.score} buddy={buddy} outfits={outfits} onQuit={() => onDone(S.score)}>
    {over ? <Finish score={Math.ceil(S.score / 3)} line={`You caught ${S.score} things!`} onDone={() => onDone(Math.ceil(S.score / 3))} />
      : <div className="catch-box" ref={box} onPointerMove={move} onPointerDown={move}>
        <div className="catch-time" style={{ width: `${100 - (S.t / LEN) * 100}%` }} />
        {S.items.map(it => <span key={it.id} className="fruit" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}><Product id={it.k} size={46} /></span>)}
        <span className="basket" style={{ left: `${S.x * 100}%` }}><svg viewBox="-40 -14 80 34" width="96" height="40" aria-hidden="true"><path d="M-38,-10 h76 l-8,26 h-60z" fill="#c4863a" stroke="#8a5a33" strokeWidth="3" /><path d="M-30,-2 h60 M-27,6 h54" stroke="#8a5a33" strokeWidth="2" /></svg></span>
      </div>}
  </Frame>;
}

/* ---------------- Duck race ---------------- */
function RaceGame({ me, buddy, outfits, onDone }) {
  const racers = useMemo(() => [me, buddy || null].filter(Boolean).concat(['duck1', 'duck2']).slice(0, 3), []);
  const st = useRef({ pos: racers.map(() => 0), go: false, winner: null, t: 0 }), [, tick] = useState(0), [count, setCount] = useState(3);
  useEffect(() => {
    const ids = [setTimeout(() => setCount(2), 900), setTimeout(() => setCount(1), 1800), setTimeout(() => { setCount(0); st.current.go = true; SFX.ding(); speak('Go!', 'narrator'); }, 2700)];
    let raf, last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const S = st.current;
      if (S.go && !S.winner) {
        S.t += dt;
        racers.forEach((r, i) => { if (i > 0) S.pos[i] += dt * (0.042 + Math.sin(S.t * (1.3 + i)) * 0.012 + (r === buddy ? 0.004 : 0)); });
        const w = S.pos.findIndex(p => p >= 1); if (w >= 0) { S.winner = racers[w]; if (w === 0) SFX.fanfare(); else SFX.boing(); }
      }
      tick(n => n + 1); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { ids.forEach(clearTimeout); cancelAnimationFrame(raf); };
  }, []);
  const quack = () => { const S = st.current; if (!S.go || S.winner) return; S.pos[0] = Math.min(1, S.pos[0] + 0.035); SFX.quack(); };
  const S = st.current, won = S.winner === me;
  const label = r => (r === 'duck1' ? 'Dotty' : r === 'duck2' ? 'Puddles' : NAMES[r]);
  return <Frame title="Duck race" score={Math.round(S.pos[0] * 100) + '%'} buddy={null} outfits={outfits} onQuit={() => onDone(0)} wide>
    <div className="race">
      {racers.map((r, i) => <div key={r} className="lane"><span className="lane-name">{label(r)}</span>
        <span className="racer" style={{ left: `${S.pos[i] * 86}%` }}>
          <svg viewBox="-24 -18 48 36" width="62" height="46" aria-hidden="true"><path d="M-16,4 q0,-14 14,-12 q6,-8 12,-2 q4,4 -2,8 h10 q-2,14 -18,14 q-16,0 -16,-8z" fill={['#ffd45e', '#f6a9c3', '#bfe0f7'][i]} /><circle cx="6" cy="-6" r="1.8" fill="#3b2a24" /><path d="M12,-4 l6,1 -6,2z" fill="#f28a1c" /></svg>
          {NAMES[r] && <span className="racer-head"><HeadIcon who={r} o={outfits[r] || DEFAULT_OUTFITS[r]} size={34} /></span>}
        </span><span className="flag"><svg viewBox="0 0 20 28" width="22" height="30" aria-hidden="true"><rect x="1" y="2" width="2" height="26" fill="#3b2a24" /><path d="M3,2 h15 v11 h-15z" fill="#fff" stroke="#3b2a24" /><path d="M3,2 h5v4h-5z M13,2h5v4h-5z M8,6h5v4h-5z M3,10h5v3h-5z M13,10h5v3h-5z" fill="#3b2a24" /></svg></span></div>)}
    </div>
    {S.winner ? <Finish score={won ? 8 : 3} line={won ? 'You won the duck race!' : `${label(S.winner)} won! Well done for trying!`} onDone={onDone} />
      : <div className="race-go">{count > 0 ? <b className="count">{count}</b> : <button className="done quack" onPointerDown={quack}>QUACK!</button>}</div>}
  </Frame>;
}
