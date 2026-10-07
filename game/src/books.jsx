// Little books to sit and read: short early-reader stories with a picture on every page.
import React, { useState, useEffect } from 'react';
import { speak, SFX } from './core.js';

export const STORIES = {
  bus: { title: 'The Big Red Bus', cover: '#ef8f8f', pages: ['The bus is red.', 'The bus is big.', 'Get on the bus!', 'Beep beep! Off we go!'] },
  sun: { title: 'Sun and Moon', cover: '#f3c95b', pages: ['The sun is up.', 'It is hot. Let us run!', 'Now the moon is up.', 'It is bed time. Shh!'] },
  fish: { title: 'Fish in a Dish', cover: '#7ab6e8', pages: ['I am a fish.', 'I sit in a dish.', 'I can swim and swim.', 'Splish, splash, fish!'] },
  dog: { title: 'Dog on a Log', cover: '#9be3a4', pages: ['A dog sat on a log.', 'The log went bump!', 'The dog fell in the mud.', 'Silly dog! Get in the bath!'] },
  spider: { title: 'Dad and the Spider', cover: '#6e4f8c', pages: ['A spider sat on the mat.', 'Callie said, "Dad! Dad!"', 'Dad got his cup.', 'Got it! Bye bye, spider!'] },
  pup: { title: 'Pip the Pup', cover: '#e7c46a', pages: ['Pip is a pup.', 'Pip can dig.', 'Pip digs and digs.', 'Pip got a big bone!'] },
};
const BY_COLOUR = { '#ef8f8f': 'bus', '#f3c95b': 'sun', '#7ab6e8': 'fish', '#9be3a4': 'dog', '#6e4f8c': 'spider' };
export const storyFor = it => BY_COLOUR[it && it.c] || 'pup';

/* one picture per page, drawn simply */
function Picture({ id, p }) {
  const sky = <><rect width="200" height="150" fill="#cfe9f5" /><rect y="110" width="200" height="40" fill="#9fd88f" /></>;
  if (id === 'bus') return <svg viewBox="0 0 200 150">{sky}<circle cx="170" cy="28" r="14" fill="#ffd45e" />
    <rect y="112" width="200" height="16" fill="#8a8f96" />
    <g transform={`translate(${p === 4 ? 70 : 30} ${p === 2 ? 10 : 30}) scale(${p === 2 ? 1.25 : 1})`}>
      <rect x="0" y="34" width="120" height="50" rx="8" fill="#e23b3b" />{[8, 34, 60].map(x => <rect key={x} x={x} y="42" width="20" height="16" rx="2" fill="#cfe9f5" />)}
      <rect x="90" y="42" width="22" height="34" fill={p === 3 ? '#3b2a24' : '#cfe9f5'} /><circle cx="24" cy="86" r="10" fill="#2b2b2e" /><circle cx="96" cy="86" r="10" fill="#2b2b2e" />
    </g>
    {p === 3 && <g><circle cx="155" cy="96" r="8" fill="#f6d2b8" /><rect x="149" y="104" width="12" height="18" rx="4" fill="#e86a92" /></g>}
    {p === 4 && <g stroke="#5a3d32" strokeWidth="3" strokeLinecap="round"><path d="M40,60 l-14,-6 M40,72 l-16,0 M40,84 l-14,6" /></g>}
  </svg>;
  if (id === 'sun') { const night = p >= 3; return <svg viewBox="0 0 200 150"><rect width="200" height="150" fill={night ? '#232a4d' : '#cfe9f5'} /><rect y="110" width="200" height="40" fill={night ? '#2f4a3a' : '#9fd88f'} />
    {night ? <g><circle cx="150" cy="40" r="20" fill="#fff6d8" /><circle cx="140" cy="34" r="17" fill="#232a4d" />{[[30, 30], [70, 50], [100, 20], [180, 90]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#fff6d8" />)}</g>
      : <g><circle cx="150" cy="40" r="22" fill="#ffd45e" />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={150 + Math.cos(i * 0.785) * 28} y1={40 + Math.sin(i * 0.785) * 28} x2={150 + Math.cos(i * 0.785) * 38} y2={40 + Math.sin(i * 0.785) * 38} stroke="#ffd45e" strokeWidth="4" strokeLinecap="round" />)}</g>}
    {p === 2 && <g><circle cx="60" cy="88" r="9" fill="#f6d2b8" /><path d="M52,98 h16 l4,16 h-24z" fill="#e86a92" /><path d="M54,114 l-6,8 M66,114 l6,8" stroke="#9b7cc4" strokeWidth="4" /></g>}
    {p === 4 && <g><rect x="30" y="92" width="80" height="20" rx="4" fill="#c7b6e6" /><circle cx="44" cy="90" r="9" fill="#f6d2b8" /><path d="M48,86 q4,-6 8,0" stroke="#5a3d32" fill="none" /><text x="70" y="80" fontSize="14" fill="#fff6d8">z z</text></g>}
  </svg>; }
  if (id === 'fish') return <svg viewBox="0 0 200 150"><rect width="200" height="150" fill="#fff6e8" />
    {p >= 2 && <ellipse cx="100" cy="110" rx="80" ry="22" fill="#e7e1d3" />}
    {p >= 2 && <ellipse cx="100" cy="104" rx="70" ry="16" fill="#8ec5ea" />}
    <g transform={`translate(${p === 3 ? 120 : 100} ${p >= 2 ? 96 : 75}) scale(${p >= 2 ? 0.7 : 1.3}) rotate(${p === 3 ? -10 : 0})`}>
      <ellipse cx="0" cy="0" rx="26" ry="16" fill="#ff9a3d" /><path d="M24,0 l18,-14 0,28z" fill="#ff7a2e" /><circle cx="-12" cy="-4" r="4" fill="#fff" /><circle cx="-13" cy="-4" r="2" fill="#222" /></g>
    {p === 4 && [[60, 70], [80, 56], [130, 60], [150, 74]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#8ec5ea" />)}
  </svg>;
  if (id === 'dog') return <svg viewBox="0 0 200 150">{sky}
    {p >= 3 && <ellipse cx="100" cy="122" rx="60" ry="12" fill="#7a5a3a" />}
    {p <= 2 && <g><rect x="40" y="96" width="120" height="20" rx="10" fill="#9a6b45" /><circle cx="160" cy="106" r="10" fill="#c49c69" /></g>}
    {p === 4 ? <g><rect x="50" y="90" width="100" height="30" rx="14" fill="#fff" stroke="#c9ced2" strokeWidth="3" />{[70, 95, 120].map(x => <circle key={x} cx={x} cy={84} r="9" fill="#fff" stroke="#e5e5e5" />)}<circle cx="100" cy="76" r="12" fill="#c49c69" /></g>
      : <g transform={`translate(${p === 2 ? 110 : 90} ${p === 3 ? 108 : 82}) rotate(${p === 2 ? 25 : 0})`}><ellipse cx="0" cy="0" rx="22" ry="12" fill={p === 3 ? '#7a5a3a' : '#c49c69'} /><circle cx="-20" cy="-10" r="10" fill={p === 3 ? '#7a5a3a' : '#c49c69'} /><ellipse cx="-26" cy="-4" rx="4" ry="8" fill="#8a5a33" /><circle cx="-22" cy="-12" r="2" fill="#222" /><path d="M20,-6 q10,-10 6,-16" stroke="#c49c69" strokeWidth="4" fill="none" /></g>}
    {p === 2 && <text x="40" y="60" fontSize="18" fontWeight="700" fill="#b5452a">BUMP!</text>}
  </svg>;
  if (id === 'spider') return <svg viewBox="0 0 200 150"><rect width="200" height="150" fill="#f5e8cf" /><rect y="105" width="200" height="45" fill="#b77f4d" /><rect x="60" y="112" width="80" height="22" rx="4" fill="#e86a92" />
    {p <= 3 && <g transform={`translate(${p === 3 ? 130 : 100} 118)`}>{[-1, 1].map(s => [0, 1, 2, 3].map(i => <path key={s + '' + i} d={`M0,-4 q${s * 8},${-8 + i * 3} ${s * 13},${2 + i * 2}`} stroke="#2b2b2e" strokeWidth="2" fill="none" />))}<circle r="7" cy="-4" fill="#2b2b2e" /><circle cx="2" cy="-6" r="2" fill="#fff" /></g>}
    {p === 2 && <g><circle cx="40" cy="70" r="11" fill="#f6d2b8" /><path d="M30,82 h20 l6,22 h-32z" fill="#e86a92" /><text x="56" y="56" fontSize="16" fontWeight="700" fill="#b5452a">Dad!</text></g>}
    {p >= 3 && <g><circle cx="150" cy="44" r="13" fill="#f0c9a8" /><path d="M138,48 q12,22 24,0" fill="#6b4a2e" /><rect x="136" y="60" width="28" height="44" rx="6" fill="#3d3f6b" /><rect x={p === 4 ? 116 : 162} y={p === 4 ? 96 : 66} width="16" height="20" rx="3" fill="#cfe9f5" stroke="#8ec5ea" /></g>}
    {p === 4 && <text x="20" y="40" fontSize="18" fontWeight="700" fill="#3f9b6e">Got it!</text>}
  </svg>;
  return <svg viewBox="0 0 200 150">{sky}
    {p >= 3 && <ellipse cx="110" cy="118" rx="30" ry="8" fill="#7a5a3a" />}
    <g transform="translate(90 92)"><ellipse cx="0" cy="0" rx="22" ry="13" fill="#e7c46a" /><circle cx="-18" cy="-12" r="12" fill="#e7c46a" /><ellipse cx="-26" cy="-10" rx="5" ry="9" fill="#b98a4e" /><circle cx="-22" cy="-14" r="2" fill="#222" /><circle cx="-29" cy="-9" r="2.4" fill="#222" />
      {p >= 2 && <path d={`M18,8 l${p === 3 ? 10 : 6},10`} stroke="#e7c46a" strokeWidth="5" strokeLinecap="round" />}</g>
    {p === 4 && <g transform="translate(130 70) rotate(-20)"><rect x="-18" y="-4" width="36" height="8" rx="4" fill="#fffaf0" /><circle cx="-18" cy="-4" r="5" fill="#fffaf0" /><circle cx="-18" cy="4" r="5" fill="#fffaf0" /><circle cx="18" cy="-4" r="5" fill="#fffaf0" /><circle cx="18" cy="4" r="5" fill="#fffaf0" /></g>}
  </svg>;
}

export function BookReader({ storyId, reader, onClose, onBag, canBag }) {
  const S = STORIES[storyId] || STORIES.pup;
  const last = S.pages.length + 1;
  const [page, setPage] = useState(0);
  const [hi, setHi] = useState(null);
  const text = page === 0 ? S.title : page === last ? 'The End!' : S.pages[page - 1];
  const words = text.split(' ');
  const read = () => { setHi({ ci: 0 }); speak(text, 'narrator', ci => setHi({ ci })); };
  useEffect(() => { read(); if (page === last) SFX.fanfare(); }, [page]);
  let idx = -1; if (hi) { let n = 0; for (let i = 0; i < words.length; i++) { if (hi.ci >= n) idx = i; n += words[i].length + 1; } }
  return <div className="book" role="dialog" aria-label={S.title} onPointerDown={e => e.stopPropagation()}>
    <div className="book-top"><span className="book-who">{reader} is reading</span><div className="pair">{canBag && <button className="pill" onClick={onBag}>Put in my bag</button>}<button className="pill" onClick={onClose}>Close</button></div></div>
    <div className="book-page" style={{ '--cover': S.cover }}>
      <div className="book-pic">{page === 0 || page === last ? <div className="cover"><Picture id={storyId} p={page === 0 ? 1 : S.pages.length} /></div> : <Picture id={storyId} p={page} />}</div>
      <div className={'book-text' + (page === 0 ? ' title' : '')}>{words.map((w, i) => <button key={i} className={'w' + (i === idx ? ' on' : '')} onClick={() => speak(w.replace(/[^A-Za-z'-]/g, '') || w, 'word')}>{w}</button>)}</div>
    </div>
    <div className="book-nav">
      <button className="turn" disabled={page === 0} onClick={() => { setPage(p => p - 1); SFX.whoosh(); }} aria-label="Back a page">◀</button>
      <button className="pill readme" onClick={read}>Read to me</button>
      <span className="dots">{Array.from({ length: last + 1 }, (_, i) => <i key={i} className={i === page ? 'on' : ''} />)}</span>
      <button className="turn" disabled={page === last} onClick={() => { setPage(p => p + 1); SFX.whoosh(); }} aria-label="Next page">▶</button>
    </div>
  </div>;
}
