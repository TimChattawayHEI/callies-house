// Dreams: at night, peek at what someone is dreaming about. A little scene and a sentence to read.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { speak, SFX, pick } from './core.js';
import { NAMES, Person, DEFAULT_OUTFITS } from './people.jsx';
import { Product, GROC } from './places.jsx';
import { bestFriend } from './personality.jsx';

const word = k => (GROC[k] ? GROC[k][0] : k);
export function pickDream(W, id) {
  const m = W.mood && W.mood[id], bf = bestFriend(W, id), n = NAMES[id];
  const list = [
    { k: 'fly', text: `${n} dreamt about flying over the town!` },
    { k: 'rain', food: (m && m.fav) || 'cake', text: `${n} dreamt it was raining ${word((m && m.fav) || 'cake')}!` },
    { k: 'star', text: `${n} dreamt about being a pop star!` },
    { k: 'giant', text: `${n} dreamt a giant teddy came to tea!` },
    { k: 'sea', text: `${n} dreamt about swimming with the fish!` },
    { k: 'moon', text: `${n} dreamt about a trip to the moon!` },
  ];
  if (bf) list.push({ k: 'friend', with: bf, text: `${n} dreamt about playing with ${NAMES[bf]}!` });
  return pick(list);
}
const wordsOf = t => { const out = []; t.replace(/\S+/g, (w, i) => { out.push({ w, i }); return w; }); return out; };

export function DreamPanel({ id, dream, outfits, onDone }) {
  const [t, setT] = useState(0), [ci, setCi] = useState(-1);
  const raf = useRef(0);
  useEffect(() => { const t0 = performance.now(); const loop = n => { setT((n - t0) / 1000); raf.current = requestAnimationFrame(loop); }; raf.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf.current); }, []);
  const read = () => { setCi(0); if (!speak(dream.text, 'narrator', c => setCi(c))) setCi(-1); };
  useEffect(() => { SFX.sparkle(); const x = setTimeout(read, 900); return () => clearTimeout(x); }, []);
  const o = outfits[id] || DEFAULT_OUTFITS[id];
  const bg = dream.k === 'sea' ? ['#3d8fe0', '#163a5c'] : dream.k === 'moon' ? ['#1b1028', '#3d3f6b'] : dream.k === 'star' ? ['#2a1b3d', '#5a2a6b'] : ['#c7b6e6', '#f6d2e8'];
  const pose = (up, open) => ({ facing: 'front', flip: false, walk: null, armL: up ? -80 : 8, armR: up ? -80 : 8, blink: 0, mouthOpen: !!open, mode: 'stand' });
  const bob = Math.sin(t * 2) * 10;
  const words = wordsOf(dream.text), on = words.reduce((k, x, j) => (ci >= x.i ? j : k), -1);
  const stars = useMemo(() => Array.from({ length: 30 }, () => [Math.random() * 800, Math.random() * 420, 1 + Math.random() * 2.5]), []);
  return <div className="concert dream" role="dialog" aria-label="A dream" onPointerDown={e => e.stopPropagation()}>
    <svg className="stage" viewBox="0 0 800 460" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="dbg" cx="50%" cy="40%" r="75%"><stop offset="0" stopColor={bg[1]} /><stop offset="1" stopColor={bg[0]} /></radialGradient></defs>
      <rect width="800" height="460" fill="url(#dbg)" />
      {(dream.k === 'moon' || dream.k === 'star' || dream.k === 'fly') && stars.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))} />)}
      {dream.k === 'fly' && <g>{[0, 1, 2, 3].map(i => { const x = ((i * 230 - t * 60) % 1000 + 1000) % 1000 - 100; return <g key={i} transform={`translate(${x} ${120 + i * 70})`} opacity={0.9}><ellipse rx={60} ry={20} fill="#fff" /><ellipse cx={-30} cy={-10} rx={30} ry={18} fill="#fff" /></g>; })}
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={60 + i * 120} y={400 - (i % 3) * 30} width={70} height={60 + (i % 3) * 30} fill="#7a6aa8" opacity={0.6} />)}
        <g transform={`translate(400 ${250 + bob}) rotate(-12) scale(1.1)`}><Person who={id} o={o} pose={pose(true, true)} T={t} uid="dream-fly" /></g></g>}
      {dream.k === 'rain' && <g>{Array.from({ length: 22 }, (_, i) => { const y = ((t * 120 + i * 53) % 520) - 60, x = (i * 37) % 800; return <g key={i} transform={`translate(${x} ${y})`}><Product id={dream.food} size={46} /></g>; })}
        <g transform={`translate(400 ${400 + bob * 0.3}) scale(1.2)`}><Person who={id} o={o} pose={pose(true, true)} T={t} uid="dream-rain" /></g></g>}
      {dream.k === 'star' && <g><polygon points={`400,0 ${300 + Math.sin(t) * 60},460 ${500 + Math.sin(t) * 60},460`} fill="#ffd45e" opacity={0.25} />
        {[0, 1, 2].map(i => { const ph = (t * 0.6 + i / 3) % 1; return <text key={i} x={470 + Math.sin(ph * 6) * 30} y={260 - ph * 200} fontSize={36} fill="#ffd45e" opacity={1 - ph}>♪</text>; })}
        <g transform={`translate(400 ${410 - Math.abs(Math.sin(t * 4)) * 14}) scale(1.25)`}><Person who={id} o={{ ...o, acc: 'crown' }} pose={pose(Math.sin(t * 4) > 0, true)} T={t} uid="dream-star" /></g></g>}
      {dream.k === 'giant' && <g><g transform={`translate(430 ${60 + bob * 0.5}) scale(5)`}><Product id="teddy" size={60} /></g>
        <rect x="120" y="360" width="260" height="20" rx="8" fill="#c4863a" />
        <g transform="translate(240 345) scale(1)"><Product id="cake" size={40} /></g>
        <g transform={`translate(220 ${400})`}><Person who={id} o={o} pose={pose(false, Math.sin(t * 3) > 0)} T={t} uid="dream-giant" /></g></g>}
      {dream.k === 'sea' && <g>{Array.from({ length: 14 }, (_, i) => { const x = ((i * 90 + t * (30 + (i % 3) * 20)) % 900) - 50, y = 80 + (i * 47) % 320; return <g key={i} transform={`translate(${x} ${y})`}><ellipse rx={18} ry={10} fill={['#f28c28', '#ffd45e', '#e86a92'][i % 3]} /><path d="M-16,0 l-12,-8 v16z" fill={['#e0661c', '#f2b84b', '#c94f7e'][i % 3]} /></g>; })}
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={(i * 83) % 800} cy={460 - ((t * 50 + i * 60) % 480)} r={6} fill="none" stroke="#bfe0f7" strokeWidth={2} />)}
        <g transform={`translate(400 ${280 + bob}) rotate(70) scale(1.1)`}><Person who={id} o={o} pose={pose(true, false)} T={t} uid="dream-sea" /></g></g>}
      {dream.k === 'moon' && <g><circle cx={580} cy={170} r={110} fill="#f2ecd2" /><circle cx={540} cy={140} r={18} fill="#ddd5b5" /><circle cx={620} cy={210} r={26} fill="#ddd5b5" />
        <g transform={`translate(${200 + t * 25 % 300} ${330 - (t * 25 % 300) * 0.6})`}><path d="M-20,30 L0,-40 20,30z" fill="#e0524a" /><rect x={-16} y={-10} width={32} height={50} rx={8} fill="#fbf8f2" /><circle cy={10} r={8} fill="#7cc9e8" /><path d="M-10,40 l10,25 10,-25z" fill="#ffd45e" opacity={0.6 + 0.4 * Math.sin(t * 20)} /></g>
        <g transform={`translate(560 ${300 + bob * 0.5}) scale(0.8)`}><Person who={id} o={o} pose={pose(true, true)} T={t} uid="dream-moon" /></g></g>}
      {dream.k === 'friend' && <g>{Array.from({ length: 10 }, (_, i) => { const ph = (t * 0.3 + i / 10) % 1; return <path key={i} d="M0,8 C-12,0 -9,-9 0,-3 C9,-9 12,0 0,8Z" fill="#e86a92" opacity={1 - ph} transform={`translate(${200 + i * 45} ${400 - ph * 380}) scale(2)`} />; })}
        <g transform={`translate(320 ${400 - Math.abs(Math.sin(t * 3)) * 16}) scale(1.2)`}><Person who={id} o={o} pose={pose(true, true)} T={t} uid="dream-a" /></g>
        <g transform={`translate(480 ${400 - Math.abs(Math.sin(t * 3 + 1)) * 16}) scale(1.2)`}><Person who={dream.with} o={outfits[dream.with] || DEFAULT_OUTFITS[dream.with]} pose={pose(true, true)} T={t} uid="dream-b" /></g></g>}
      <g opacity={0.9}>{[0, 1, 2].map(i => { const ph = (t * 0.4 + i / 3) % 1; return <text key={i} x={60 + ph * 40} y={80 - ph * 50} fontSize={30 + ph * 20} fill="#fff" opacity={1 - ph} fontWeight="800">z</text>; })}</g>
    </svg>
    <div className="lyrics">
      <p className="ly-line dream-line">{words.map((x, j) => <span key={j} className={j === on ? 'on' : ''} onClick={() => speak(x.w.replace(/[!?.,]/g, ''), 'word')}>{x.w} </span>)}</p>
      <div className="pair"><button className="pill" onClick={read}>Read it again</button><button className="done" onClick={onDone}>Sweet dreams!</button></div>
    </div>
  </div>;
}
