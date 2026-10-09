// The concert: pick who sings, pick a kind of song, choose the words, then watch the show.
// Every word lights up as it is sung, so she reads along.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SFX, speak, sing, pick } from './core.js';
import { NAMES, HeadIcon, Person, DEFAULT_OUTFITS } from './people.jsx';
import { Keyboard, prettyName } from './folk.jsx';

export const STYLES = {
  pop: { word: 'Happy pop', beat: 0.56, notes: [523, 587, 659, 698, 784, 698, 659, 587], wave: 'triangle', lights: ['#ff7eb6', '#ffd45e', '#7cc9e8'], move: 'bounce' },
  rock: { word: 'Loud rock', beat: 0.44, notes: [330, 392, 440, 392, 494, 440, 392, 330], wave: 'sawtooth', lights: ['#ef4b4b', '#5b7cff', '#ffd45e'], move: 'jump' },
  lull: { word: 'Sleepy song', beat: 0.82, notes: [392, 440, 494, 523, 494, 440, 392, 349], wave: 'sine', lights: ['#9b7cc4', '#5b9bd5', '#bfe0f7'], move: 'sway' },
};
const LINES = [
  { t: 'I love my', words: ['cat', 'dog', 'mum', 'dad', 'bed', 'hat', 'teddy', 'cake'] },
  { t: 'We play in the', words: ['sun', 'rain', 'park', 'sea', 'snow', 'mud'] },
  { t: 'Up, up, up to the', words: ['sky', 'moon', 'stars', 'top', 'sun'] },
  { t: 'La la la, I am so', words: ['happy', 'silly', 'big', 'fast', 'sleepy', 'loud'] },
];
const RATIO = f => f / 523;

export function ConcertPanel({ people, first, outfits, onDone, onClose }) {
  const [step, setStep] = useState('who');
  const [who, setWho] = useState(first ? [first] : []);
  const [style, setStyle] = useState('pop');
  const [fill, setFill] = useState(() => LINES.map(() => null));
  const [typing, setTyping] = useState(null), [typed, setTyped] = useState('');
  const toggle = id => { SFX.pop(); speak(NAMES[id], 'word'); setWho(w => (w.includes(id) ? w.filter(x => x !== id) : w.length >= 3 ? [...w.slice(1), id] : [...w, id])); };
  const lines = LINES.map((L, i) => `${L.t} ${fill[i] || '...'}`);
  if (step === 'show') return <Show who={who} style={style} lines={lines} outfits={outfits} onEnd={again => { if (again) setStep('show2'); else { onDone(who, lines[0]); } }} />;
  if (step === 'show2') return <Show key="again" who={who} style={style} lines={lines} outfits={outfits} onEnd={() => onDone(who, lines[0])} />;
  return <div className="sheet concert-pick" role="dialog" aria-label="Concert" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Concert time!', 'narrator')}>Concert time!</button><button className="pill" onClick={onClose}>Close</button></div>
    {step === 'who' && <>
      <p className="care-q">Who will sing? Pick up to 3.</p>
      <div className="care-grid">{people.map(id => <button key={id} className={'tile care-tile' + (who.includes(id) ? ' picked' : '')} aria-pressed={who.includes(id)} onClick={() => toggle(id)}><HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={52} /><small>{NAMES[id]}</small></button>)}</div>
      <div className="pair"><button className="done" disabled={!who.length} onClick={() => { setStep('style'); speak('What kind of song?', 'narrator'); }}>Next</button></div>
    </>}
    {step === 'style' && <>
      <p className="care-q">What kind of song?</p>
      <div className="care-grid three">{Object.entries(STYLES).map(([k, S]) => <button key={k} className={'tile care-tile style-' + k + (style === k ? ' picked' : '')} onClick={() => { setStyle(k); speak(S.word, 'word'); S.notes.slice(0, 4).forEach((f, i) => setTimeout(() => SFX.note(f, 0.2, S.wave), i * S.beat * 400)); }}><span className="st-note">{k === 'rock' ? '⚡' : k === 'lull' ? '☾' : '♪'}</span><small>{S.word}</small></button>)}</div>
      <div className="pair"><button className="pill" onClick={() => setStep('who')}>Back</button><button className="done" onClick={() => { setStep('words'); speak('Now choose the words.', 'narrator'); }}>Next</button></div>
    </>}
    {step === 'words' && <>
      <p className="care-q">Choose the words for the song!</p>
      <div className="song-lines">{LINES.map((L, i) => <div key={i} className="song-line">
        <button className="song-start" onClick={() => speak(L.t, 'narrator')}>{L.t}</button>
        <div className="song-chips">{L.words.map(w => <button key={w} className={'pill song-chip' + (fill[i] === w ? ' on' : '')} onClick={() => { speak(w, 'word'); setFill(f => f.map((x, j) => (j === i ? w : x))); }}>{w}</button>)}
          <button className={'pill song-chip own' + (fill[i] && !L.words.includes(fill[i]) ? ' on' : '')} onClick={() => { setTyping(i); setTyped(''); }}>{fill[i] && !L.words.includes(fill[i]) ? fill[i] : 'My word'}</button></div>
      </div>)}</div>
      {typing != null && <div className="song-type"><b>{LINES[typing].t} {typed || '...'}</b><Keyboard onKey={k => { SFX.click(); if (k === '<') setTyped(t => t.slice(0, -1)); else setTyped(t => (t + k).slice(0, 10)); }} /><div className="pair"><button className="pill" onClick={() => setTyping(null)}>Cancel</button><button className="done" disabled={!typed} onClick={() => { const w = prettyName(typed).toLowerCase(); setFill(f => f.map((x, j) => (j === typing ? w : x))); speak(w, 'word'); setTyping(null); }}>Use it</button></div></div>}
      <div className="pair"><button className="pill" onClick={() => setFill(LINES.map(L => pick(L.words)))}>Pick for me</button><button className="pill" onClick={() => setStep('style')}>Back</button><button className="done" disabled={fill.some(x => !x)} onClick={() => setStep('show')}>Start the show!</button></div>
    </>}
  </div>;
}

/* ---------------- the show ---------------- */
function Show({ who, style, lines, outfits, onEnd }) {
  const S = STYLES[style];
  const [t, setT] = useState(0), [pos, setPos] = useState({ l: -1, w: -1 }), [end, setEnd] = useState(false);
  const words = useMemo(() => lines.map(l => l.split(' ')), [lines]);
  const raf = useRef(0);
  useEffect(() => { const t0 = performance.now(); const loop = n => { setT((n - t0) / 1000); raf.current = requestAnimationFrame(loop); }; raf.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf.current); }, []);
  useEffect(() => {
    // curtain up, then each word on a beat, a little gap between lines, a big finish
    const steps = []; let at = 1.6, k = 0;
    words.forEach((ws, l) => { ws.forEach((w, wi) => { steps.push({ at, l, w: wi, note: S.notes[k++ % S.notes.length] }); at += S.beat; }); at += S.beat; });
    const timers = steps.map(s => setTimeout(() => {
      setPos({ l: s.l, w: s.w });
      const singer = who[(s.l + s.w) % who.length];
      SFX.note(s.note, S.beat * 0.9, S.wave, 0.06); SFX.drum();
      sing(words[s.l][s.w].replace(/[,.!?]/g, ''), singer, RATIO(s.note) * (style === 'lull' ? 0.95 : 1.05), style === 'lull' ? 0.7 : 0.95);
    }, s.at * 1000));
    timers.push(setTimeout(() => { setEnd(true); SFX.cheer(); SFX.fanfare(); }, (at + 0.3) * 1000));
    SFX.whoosh();
    return () => timers.forEach(clearTimeout);
  }, []);
  const curtain = Math.min(1, t / 1.4);
  const beatT = (t * 1000) / (S.beat * 1000);
  const n = who.length, xs = n === 1 ? [400] : n === 2 ? [300, 500] : [230, 400, 570];
  return <div className="concert" role="dialog" aria-label="The show" onPointerDown={e => e.stopPropagation()}>
    <svg className="stage" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
      <defs>
        {S.lights.map((c, i) => <linearGradient key={i} id={'beam' + i} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity="0.75" /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>)}
      </defs>
      <rect width="800" height="500" fill="#2a1b3d" />
      <path d="M0,330 L800,330 L800,500 L0,500Z" fill="#7a4a2a" />
      <path d="M60,330 L740,330 L800,380 L0,380Z" fill="#9a6338" />
      {[0, 1, 2].map(i => { const a = Math.sin(t * (style === 'rock' ? 2.2 : 1.1) + i * 2) * 120, x = 160 + i * 240; return <polygon key={i} points={`${x},0 ${x + a - 90},380 ${x + a + 90},380`} fill={`url(#beam${i})`} />; })}
      {who.map((id, i) => {
        const singing = pos.l >= 0 && !end && (pos.l + pos.w) % n === i;
        const ph = beatT * Math.PI;
        const dy = S.move === 'jump' ? -Math.abs(Math.sin(ph)) * 26 : S.move === 'bounce' ? -Math.abs(Math.sin(ph)) * 12 : 0;
        const rot = S.move === 'sway' ? Math.sin(ph / 2) * 6 : 0;
        const arms = singing ? (Math.sin(ph) > 0 ? -70 : -40) : end ? -80 : 8;
        const pose = { facing: 'front', flip: false, walk: null, armL: arms, armR: singing ? 8 : arms, blink: 0, mouthOpen: singing && Math.sin(t * 14) > -0.3, mode: 'stand' };
        return <g key={id} transform={`translate(${xs[i]} ${360 + dy}) rotate(${rot}) scale(1.3)`}><Person who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} pose={pose} T={t} uid={'stage-' + id} /></g>;
      })}
      {pos.l >= 0 && !end && [0, 1, 2].map(i => { const ph = (t * 0.7 + i / 3) % 1, x = xs[(pos.l + pos.w) % n] + 40 + Math.sin(ph * 6 + i) * 20; return <text key={i} x={x} y={200 - ph * 160} fontSize={28 + ph * 10} fill={S.lights[i]} opacity={1 - ph}>♪</text>; })}
      <g transform={`translate(${-400 * curtain} 0)`}><rect x="0" y="0" width="410" height="500" fill="#c4304f" />{[40, 120, 200, 280, 360].map(x => <rect key={x} x={x} y="0" width="16" height="500" fill="#a3253f" />)}</g>
      <g transform={`translate(${400 * curtain} 0)`}><rect x="390" y="0" width="410" height="500" fill="#c4304f" />{[430, 510, 590, 670, 750].map(x => <rect key={x} x={x} y="0" width="16" height="500" fill="#a3253f" />)}</g>
      <path d="M0,0 H800 V36 Q600,60 400,36 Q200,60 0,36Z" fill="#a3253f" />
      {Array.from({ length: 13 }, (_, i) => <circle key={i} cx={30 + i * 62} cy={492 - (end ? Math.abs(Math.sin(t * 8 + i)) * 10 : 0)} r={26} fill="#1b1028" />)}
      {end && Array.from({ length: 24 }, (_, i) => { const ph = (t * 0.5 + i / 24) % 1; return <rect key={i} x={(i * 97) % 800} y={ph * 500} width="10" height="16" fill={S.lights[i % 3]} transform={`rotate(${i * 40 + t * 200} ${(i * 97) % 800} ${ph * 500})`} />; })}
    </svg>
    <div className="lyrics">
      {pos.l < 0 ? <p className="ly-line dim">The show is about to start...</p>
        : end ? <p className="ly-line">Hooray! What a show!</p>
          : <p className="ly-line">{words[pos.l].map((w, j) => <span key={j} className={j === pos.w ? 'on' : j < pos.w ? 'sung' : ''}>{w} </span>)}</p>}
      {end && <div className="pair"><button className="pill" onClick={() => onEnd(true)}>Sing it again!</button><button className="done" onClick={() => onEnd(false)}>Bravo! Done</button></div>}
    </div>
  </div>;
}
