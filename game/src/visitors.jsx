// Visitors: send someone you made to visit another tablet's world. Each tablet has a postbox code.
// A visitor stays for a while, then asks if they can live there for good.
import React, { useState } from 'react';
import { SFX, speak } from './core.js';
import { NAMES, HeadIcon, DEFAULT_OUTFITS } from './people.jsx';
import { Keyboard } from './folk.jsx';
import { netReady, db, token, newCode, goodCode } from './net.js';

const BOX_KEY = 'callies-house-postbox';
export const STAY_MS = 20 * 60 * 1000;
export function myPostbox() {
  let c = null; try { c = localStorage.getItem(BOX_KEY); } catch (e) { /* ignore */ }
  if (!goodCode(c)) { c = newCode(); try { localStorage.setItem(BOX_KEY, c); } catch (e) { /* ignore */ } }
  return c;
}
const FIELDS = ['name', 'body', 'skin', 'hair', 'hairCol', 'glasses', 'beard', 'voice', 'top', 'color', 'outfit', 'traits', 'likes'];
export async function sendVisitor(W, id, code) {
  const d = W.folk.people[id]; if (!d) throw new Error('nobody');
  const v = Object.fromEntries(FIELDS.filter(k => d[k] !== undefined).map(k => [k, d[k]]));
  const msg = { def: v, from: W.worldName || "Callie's House", sender: NAMES[W.player] || '', at: Date.now() };
  await token();
  await db('PATCH', `post/${code}`, { ['v' + Date.now().toString(36)]: JSON.stringify(msg) });
}
// anyone waiting in our postbox? (they are taken out so they only arrive once)
export async function checkPost() {
  if (!netReady()) return [];
  const code = myPostbox();
  await token();
  const box = await db('GET', `post/${code}`);
  if (!box) return [];
  const out = [];
  for (const [k, s] of Object.entries(box)) {
    try { out.push(JSON.parse(s)); } catch (e) { /* skip */ }
    try { await db('DELETE', `post/${code}/${k}`); } catch (e) { /* try again next time */ }
  }
  return out;
}

export function VisitPanel({ W, outfits, onSend, onClose }) {
  const [who, setWho] = useState(null), [code, setCode] = useState(''), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const mine = myPostbox(), ready = netReady();
  const ppl = Object.keys((W.folk && W.folk.people) || {}).filter(id => id !== W.player && W.people[id] && W.people[id].room && !W.folk.people[id].visitor);
  const key = ch => { setMsg(null); SFX.click(); if (ch === '<') setCode(c => c.slice(0, -1)); else if (/^[A-Z]$/.test(ch) && ch !== 'I' && ch !== 'O') setCode(c => (c + ch).slice(0, 6)); };
  const send = async () => {
    if (!who || !goodCode(code)) return;
    if (code === mine) { setMsg({ bad: true, t: 'That is your own postbox! Type the other tablet\'s code.' }); return; }
    setBusy(true);
    try { await sendVisitor(W, who, code); SFX.whoosh(); setMsg({ t: `${NAMES[who]} is on the way! Wave goodbye!` }); speak(`${NAMES[who]} is going on a visit!`, 'narrator'); onSend(who, code); setWho(null); setCode(''); }
    catch (e) { setMsg({ bad: true, t: e && e.status === 401 ? 'Firebase said no. The database rules need the postbox part.' : 'Could not send. Check the wi-fi.' }); }
    setBusy(false);
  };
  return <div className="sheet together" role="dialog" aria-label="Visitors" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Visitors', 'narrator')}>Visitors</button><button className="pill" onClick={onClose}>Close</button></div>
    {!ready ? <p className="nt-note">Visitors need Play together to be set up first.</p> : <>
      <div className="nt-box"><p><b>Your postbox code</b><small>Visitors from other tablets come here.</small></p><div className="nt-code">{mine.split('').map((c, i) => <span key={i} className="nt-ch on">{c}</span>)}</div></div>
      <div className="nt-box"><p><b>Send someone to visit</b><small>They go to the other tablet's world for a while.</small></p>
        {ppl.length ? <div className="care-grid">{ppl.map(id => <button key={id} className={'tile care-tile' + (who === id ? ' picked' : '')} onClick={() => { setWho(id); speak(NAMES[id], 'word'); SFX.pop(); }}><HeadIcon who={id} o={outfits[id] || DEFAULT_OUTFITS[id]} size={48} /><small>{NAMES[id]}</small></button>)}</div>
          : <p className="nt-note">Make someone first, then you can send them on a visit.</p>}
        {who && <><p className="nt-say">Type the other tablet's postbox code:</p>
          <div className="nt-code">{Array.from({ length: 6 }, (_, i) => <span key={i} className={'nt-ch' + (code[i] ? ' on' : '')}>{code[i] || ''}</span>)}</div>
          <Keyboard onKey={key} />
          <div className="pair"><button className="done" disabled={busy || code.length < 6} onClick={send}>{busy ? 'Sending...' : `Send ${NAMES[who]}!`}</button></div></>}
      </div></>}
    {msg && <p className={msg.bad ? 'nt-err' : 'bk-msg'} role="status">{msg.t}</p>}
  </div>;
}
export function StayPart({ id, from, onDo }) {
  return <><p className="care-q">{NAMES[id]} came to visit from {from}. Can {NAMES[id]} stay and live here?</p>
    <div className="pair care-ways"><button className="done" onClick={() => onDo('stay')}>Yes, stay!</button><button className="pill" onClick={() => onDo('goodbye')}>Wave goodbye</button></div></>;
}
