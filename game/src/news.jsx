// Town News: short headlines about what has happened in her town, read on a TV.
// Big words, read aloud with each word lighting up as it is said; tap a word to hear it again.
import React, { useEffect, useMemo, useState } from 'react';
import { speak, SFX, pick } from './core.js';
import { NAMES, HeadIcon, DEFAULT_OUTFITS } from './people.jsx';

export function initNews(W, saved) {
  W.news = (saved && saved.news) || { n: 0, list: [] };
  W.newsSeen = saved && saved.newsSeen != null ? saved.newsSeen : W.news.n;
}
// a new story; the same story twice in a row is skipped
export function addNews(W, text, who = [], kind = 'news') {
  if (!W.news) return;
  const last = W.news.list[W.news.list.length - 1];
  if (last && last.text === text) return;
  W.news.n++;
  W.news.list.push({ id: W.news.n, text, who: who.filter(Boolean).slice(0, 3), kind, day: new Date().toDateString() });
  W.news.list = W.news.list.slice(-30);
  W.dirty = true;
}
export const unread = W => (W.news ? W.news.list.filter(s => s.id > (W.newsSeen || 0)).length : 0);

// a few stories to fill the programme when not much has happened
function fillers(W) {
  const out = [], ppl = Object.keys(W.mood || {}).filter(id => NAMES[id] && W.people[id] && W.people[id].room);
  if (ppl.length) {
    const top = ppl.slice().sort((a, b) => (W.mood[b].lvl * 100 + W.mood[b].h) - (W.mood[a].lvl * 100 + W.mood[a].h))[0];
    out.push({ id: 'f1', text: `${NAMES[top]} is the happiest person in town!`, who: [top], kind: 'happy' });
    const secret = ppl.find(id => !W.mood[id].known.fav);
    if (secret) out.push({ id: 'f2', text: `What is ${NAMES[secret]}'s favourite food? Can you find out?`, who: [secret], kind: 'food' });
  }
  const w = W.weather && W.weather.kind;
  out.push({ id: 'f3', text: w === 'rain' ? 'It is raining today. Get your wellies!' : w === 'snow' ? 'It is snowing! Time for a snowman!' : 'The sun is out today. Have a lovely day!', who: [], kind: 'weather' });
  return out;
}

// split a headline into words, keeping where each one starts
const wordsOf = t => { const out = []; t.replace(/\S+/g, (w, i) => { out.push({ w, i }); return w; }); return out; };

export function NewsPanel({ W, outfits, onClose }) {
  const stories = useMemo(() => {
    const fresh = W.news.list.filter(s => s.id > (W.newsSeen || 0));
    const recent = fresh.length ? fresh : W.news.list.slice(-5);
    const list = [...recent];
    for (const f of fillers(W)) if (list.length < 4) list.push(f);
    return list;
  }, []);
  const host = useMemo(() => { const ppl = Object.keys(W.mood || {}).filter(id => NAMES[id] && W.people[id] && W.people[id].room && id !== W.player); return ppl.length ? pick(ppl) : null; }, []);
  const [i, setI] = useState(0), [ci, setCi] = useState(-1);
  const s = stories[i];
  const read = () => { setCi(0); if (!speak(s.text, 'narrator', c => setCi(c))) setCi(-1); };
  useEffect(() => { SFX.tv(); const t = setTimeout(read, 450); return () => clearTimeout(t); }, [i]);
  useEffect(() => { W.newsSeen = W.news.n; W.dirty = true; }, []);
  const words = wordsOf(s.text);
  const on = words.reduce((k, x, j) => (ci >= x.i ? j : k), -1);
  return <div className="sheet newsp" role="dialog" aria-label="Town News" onPointerDown={e => e.stopPropagation()}>
    <div className="tv-box">
      <div className="tv-screen">
        <div className="tv-top"><span className="tv-live">LIVE</span><b>TOWN NEWS</b>{host && <span className="tv-host"><HeadIcon who={host} o={outfits[host] || DEFAULT_OUTFITS[host]} size={34} /><small>with {NAMES[host]}</small></span>}</div>
        <p className="tv-head">{words.map((x, j) => <button key={j} className={'tv-w' + (j === on ? ' on' : '')} onClick={() => speak(x.w.replace(/[!?.,:]/g, ''), 'word')}>{x.w}</button>)}</p>
        {s.who && s.who.length > 0 && <div className="tv-faces">{s.who.filter(id => NAMES[id]).map(id => <HeadIcon key={id} who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={70} />)}</div>}
      </div>
      <div className="tv-legs"><span /><span /></div>
    </div>
    <div className="tv-bar">
      <button className="pill" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
      <button className="pill" onClick={read}>Read it again</button>
      <span className="tv-n">{i + 1} / {stories.length}</span>
      {i < stories.length - 1 ? <button className="done" onClick={() => { SFX.click(); setI(i + 1); }}>Next</button> : <button className="done" onClick={onClose}>The end</button>}
    </div>
  </div>;
}
export function NewsChip({ n, onClick }) {
  if (!n) return null;
  return <button className="news-chip" onClick={onClick} aria-label={`Town News, ${n} new`}>
    <svg viewBox="0 0 30 26" width="26" height="22" aria-hidden="true"><rect x="2" y="5" width="26" height="17" rx="3" fill="#3b2a24" /><rect x="5" y="8" width="20" height="11" rx="1.5" fill="#7cc9e8" /><path d="M10,1 l5,4 l5,-4" stroke="#3b2a24" strokeWidth="2" fill="none" /></svg>
    <span>News</span><b>{n}</b>
  </button>;
}
