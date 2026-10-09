// Play together: share this world with another tablet, or join one with a code.
import React, { useEffect, useState } from 'react';
import { SFX, speak } from './core.js';
import { HeadIcon, NAMES, DEFAULT_OUTFITS } from './people.jsx';
import { Keyboard, registerPerson } from './folk.jsx';
import { netReady, db, token, goodCode, newCode } from './net.js';
import { currentWorld, joinCodeOf, joinWorld, netOf, setNet, switchWorld, SAVE_KEY } from './worlds.jsx';

const FAMILY = ['callie', 'chloe', 'mum', 'dad', 'connor'];
// things that belong to the person playing on this tablet, not to the shared world
const PERSONAL = ['coins', 'wardrobe', 'ach', 'visited', 'tj', 'met', 'lettersRead', 'letter', 'goalUp', 'muted', 'voice', 'player', 'uniform'];
const readJSON = k => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };

function CodeBoxes({ code }) {
  return <div className="nt-code" aria-label={`Code ${code.split('').join(' ')}`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className={'nt-ch' + (code[i] ? ' on' : '')}>{code[i] || ''}</span>)}</div>;
}

/* ---------------- the panel (from the grown-ups menu) ---------------- */
export function TogetherPanel({ W, status, other, onShare, onStop, onClose, saveNow }) {
  const [typing, setTyping] = useState(''), [err, setErr] = useState(null);
  const joined = joinCodeOf(currentWorld()), net = netOf(currentWorld()), ready = netReady();
  const otherName = other && other.player ? NAMES[other.player] || other.name : null;
  const key = ch => { setErr(null); if (ch === '<') setTyping(t => t.slice(0, -1)); else if (/^[A-Z]$/.test(ch) && ch !== 'I' && ch !== 'O') setTyping(t => (t + ch).slice(0, 6)); SFX.click(); };
  const join = async () => {
    if (!goodCode(typing)) { setErr('Type all 6 letters of the code.'); return; }
    setErr('Looking...');
    try { await token(); const meta = await db('GET', `rooms/${typing}/meta`); if (!meta) { setErr('There is no game with that code. Check the letters.'); return; } SFX.sparkle(); joinWorld(typing, meta.world ? `${meta.world} with ${meta.name || 'a friend'}` : 'Playing together', saveNow); }
    catch (e) { setErr('Could not reach the internet. Check the wi-fi and try again.'); }
  };
  const line = status === 'together' ? `Playing with ${otherName || 'the other tablet'}!` : status === 'waiting' ? 'Waiting for the other tablet...' : status === 'connecting' ? 'Connecting...' : null;
  return <div className="sheet together" role="dialog" aria-label="Play together" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head"><button className="room-chip" onClick={() => speak('Play together!', 'narrator')}>Play together</button><button className="pill" onClick={onClose}>Close</button></div>
    {!ready ? <p className="nt-note">Play together needs setting up first: a grown-up adds the Firebase details to the app.</p>
      : joined ? <div className="nt-box">
        <p><b>This tablet is visiting another tablet's world.</b></p>
        {line && <p className={'nt-status ' + status}>{line}</p>}
        <div className="pair"><button className="pill" onClick={() => switchWorld('callie', saveNow)}>Leave and go home</button></div>
      </div>
      : <>
        <div className="nt-box">
          <p><b>Share this world</b><small>The other tablet joins in and you play in it together.</small></p>
          {status && status !== 'off' && net.code ? <>
            <p className="nt-say">On the other tablet: <b>Play together</b>, then type:</p>
            <CodeBoxes code={net.code} />
            {line && <p className={'nt-status ' + status}>{line}</p>}
            <button className="pill" onClick={onStop}>Stop sharing</button>
          </> : <button className="done" onClick={onShare}>Share this world</button>}
        </div>
        <div className="nt-box">
          <p><b>Join another tablet</b><small>Type the code from the other tablet.</small></p>
          <CodeBoxes code={typing} />
          <Keyboard onKey={key} />
          <div className="pair"><button className="done" disabled={typing.length < 6} onClick={join}>Join</button></div>
        </div>
      </>}
    {err && <p className="nt-err" role="status">{err}</p>}
  </div>;
}
export function startSharing() {
  const id = currentWorld(), n = netOf(id);
  const code = n.code || newCode();
  setNet(id, { code, on: true });
  return code;
}
export const stopSharing = () => setNet(currentWorld(), { on: false });

/* ---------------- the little badge at the top while together ---------------- */
export function NetChip({ status, other, outfits, onClick }) {
  if (!status || status === 'off') return null;
  const who = other && other.player;
  return <button className={'net-chip ' + status} onClick={onClick} aria-label={status === 'together' ? `Playing with ${NAMES[who] || 'the other tablet'}` : 'Waiting for the other tablet'}>
    <span className="net-dot" />{status === 'together' && who && NAMES[who] ? <><HeadIcon who={who} o={(outfits && outfits[who]) || DEFAULT_OUTFITS[who]} size={26} /><small>{NAMES[who]}</small></> : <small>{status === 'connecting' ? 'Connecting' : 'Waiting'}</small>}
  </button>;
}

/* ---------------- opening a world on the other tablet ---------------- */
// Gets the world from the main tablet, then lets the game start with it.
export function JoinGate({ children }) {
  const code = joinCodeOf(currentWorld());
  const [st, setSt] = useState({ s: 'connecting' });
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!netReady()) { setSt({ s: 'nonet' }); return; }
      try {
        await token();
        const meta = await db('GET', `rooms/${code}/meta`);
        if (dead) return;
        if (!meta) { setSt({ s: 'nocode' }); return; }
        setSt({ s: 'connecting', meta });
        const req = JSON.stringify(String(Date.now()) + Math.random().toString(36).slice(2, 6));
        await db('DELETE', `rooms/${code}/g`);
        await db('PATCH', `rooms/${code}/g/e`, { req });
        let got = null;
        for (let i = 0; i < 24 && !dead; i++) {
          await new Promise(r => setTimeout(r, i < 4 ? 400 : 700));
          const sv = await db('GET', `rooms/${code}/save`);
          if (sv && sv.at === req && sv.s) { got = sv; break; }
        }
        if (dead) return;
        if (!got) { setSt({ s: 'nohost', meta }); return; }
        const save = JSON.parse(got.s);
        let hostWho = null; try { hostWho = JSON.parse((await db('GET', `rooms/${code}/h/e/who`)) || 'null'); } catch (e) { /* ignore */ }
        const taken = hostWho && hostWho.p;
        const mine = readJSON(SAVE_KEY) || {};
        const folk = (save.folk && save.folk.people) || {};
        for (const d of Object.values(folk)) registerPerson(d);
        const choices = [...(save.fresh ? [] : FAMILY), ...Object.keys(folk)].filter(id => id !== taken && NAMES[id]);
        const finish = player => {
          const out = { ...save };
          for (const k of PERSONAL) if (k in mine) out[k] = mine[k]; else if (k !== 'player') delete out[k];
          if (out.coins == null) out.coins = 60;
          out.player = player;
          try { localStorage.setItem(SAVE_KEY, JSON.stringify(out)); } catch (e) { /* storage full */ }
          setSt({ s: 'go' });
        };
        if (mine.player && choices.includes(mine.player)) finish(mine.player);
        else if (choices.length === 1) finish(choices[0]);
        else if (!choices.length) setSt({ s: 'full', meta });
        else setSt({ s: 'pick', meta, choices, finish, outfits: { ...DEFAULT_OUTFITS, ...(save.outfits || {}) }, taken });
      } catch (e) { if (!dead) setSt({ s: 'offline' }); }
    })();
    return () => { dead = true; };
  }, [tries]);
  if (st.s === 'go') return children;
  const host = st.meta && st.meta.name ? `${st.meta.name}'s tablet` : 'the other tablet';
  const back = <button className="pill" onClick={() => { try { localStorage.setItem('callies-house-worlds', JSON.stringify({ ...JSON.parse(localStorage.getItem('callies-house-worlds') || '{"list":[]}'), current: 'callie' })); } catch (e) { /* ignore */ } window.location.reload(); }}>Back to my worlds</button>;
  const again = <button className="done" onClick={() => setTries(t => t + 1)}>Try again</button>;
  return <div className="nt-gate">
    <div className="sheet nt-gate-box" role="dialog" aria-label="Play together">
      <div className="box-head"><button className="room-chip">Play together</button></div>
      {st.s === 'connecting' && <p className="nt-say">Joining {st.meta ? `${st.meta.world || 'the world'} on ${host}` : 'the game'}...</p>}
      {st.s === 'nohost' && <><p className="nt-say">{host[0].toUpperCase() + host.slice(1)} isn't open yet. Open the game on it, then tap Try again.</p><div className="pair">{again}{back}</div></>}
      {st.s === 'nocode' && <><p className="nt-say">That game has gone. Ask for a new code.</p><div className="pair">{back}</div></>}
      {st.s === 'offline' && <><p className="nt-say">Could not reach the internet. Check the wi-fi.</p><div className="pair">{again}{back}</div></>}
      {st.s === 'nonet' && <><p className="nt-say">Play together isn't set up in this app.</p><div className="pair">{back}</div></>}
      {st.s === 'full' && <><p className="nt-say">Everyone in that world is already being played. Make a new person on {host} first.</p><div className="pair">{again}{back}</div></>}
      {st.s === 'pick' && <>
        <p className="nt-say"><b>Who do you want to be?</b></p>
        <div className="nt-pick">{st.choices.map(id => <button key={id} className="who" onClick={() => { SFX.sparkle(); speak(NAMES[id], 'word'); st.finish(id); }}><HeadIcon who={id} o={st.outfits[id] || DEFAULT_OUTFITS[id]} size={54} /><small>{NAMES[id]}</small></button>)}</div>
      </>}
    </div>
  </div>;
}
export { PERSONAL };
