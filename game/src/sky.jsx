// Time of day and weather. A game day runs morning to night; at dusk the lights need turning on.
// Weather comes and goes: sunny, cloudy, rain and thunderstorms, with a rainbow after the rain.
import React from 'react';
import { P, rand, pick, clamp, lerp, SFX, speak, achieve } from './core.js';
import { say, later, nav } from './world.js';
import { ROOMS } from './rooms.jsx';

export const HOUR = 40; // real seconds per game hour in the daytime
export const OUTSIDE = new Set(['garden', 'park', 'nannygarden']);
export const LIGHT_ROOMS = ['downhall', 'living', 'kitchen', 'middle'];
export const TIME_CYCLE = ['auto', 'day', 'night'], TIME_LABEL = { auto: 'Auto', day: 'Day', night: 'Night' };
export const WEATHER_CYCLE = ['auto', 'sun', 'cloud', 'rain', 'storm'], WEATHER_LABEL = { auto: 'Auto', sun: 'Sunny', cloud: 'Cloudy', rain: 'Rain', storm: 'Storm' };

export function initSky(W, saved) {
  const s = (saved && saved.sky) || {};
  W.clock = s.clock != null ? s.clock : 9;
  W.lights = s.lights || {};
  W.timePick = s.timePick || 'auto'; W.weatherPick = s.weatherPick || 'auto';
  W.weather = { kind: 'sun', next: 100 + rand(0, 60) };
  W.lightAsk = null; W.bedAsk = false;
}
export const skySave = W => ({ clock: W.clock, lights: W.lights, timePick: W.timePick, weatherPick: W.weatherPick });

export function daylight(h) {
  if (h >= 8 && h < 18) return 1;
  if (h >= 6 && h < 8) return (h - 6) / 2;
  if (h >= 18 && h < 20) return 1 - (h - 18) / 2;
  return 0;
}
export const darkness = W => 1 - daylight(W.clock);
export const weatherNow = W => (W.weatherPick !== 'auto' ? W.weatherPick : W.weather.kind);
export const isWet = W => { const k = weatherNow(W); return k === 'rain' || k === 'storm'; };
export const isLit = (W, rid) => (rid === 'callie' ? !!W.flags.lights : !!W.lights[rid]);
export const inHouseRoom = rid => ROOMS[rid] && !ROOMS[rid].town && !OUTSIDE.has(rid);
export function timeWord(h) { return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 20 ? 'evening' : 'night'; }

const offOr = (W, id) => (W.people[id] && W.people[id].room === W.room ? null : { type: 'off', id });
const grownUp = W => (W.player === 'mum' ? 'dad' : 'mum');

// just the clock ticking (the visiting tablet uses this; the main tablet decides the rest)
export function clockStep(W, dt) {
  if (W.timePick === 'day') W.clock = 12; else if (W.timePick === 'night') W.clock = 22;
  else if (!W.bedtime) W.clock = (W.clock + dt * (W.clock >= 20 || W.clock < 6 ? 2 : 1) / HOUR) % 24;
}
export function stepSky(W, dt) {
  if (W.morningFlash && W.morningFlash !== W.dayFlash) { W.dayFlash = W.morningFlash; newDay(W); }
  // the clock (nights go a bit quicker)
  const was = W.clock;
  if (W.timePick === 'day') W.clock = 12;
  else if (W.timePick === 'night') W.clock = 22;
  else if (!W.bedtime) W.clock = (W.clock + dt * (W.clock >= 20 || W.clock < 6 ? 2 : 1) / HOUR) % 24;
  const crossed = h => (was < h && W.clock >= h) || (was > W.clock && W.clock >= h && h < 1);
  const home = !W.out && !W.bedtime && !W.drive;
  if (crossed(19) && home && W.timePick === 'auto') askLights(W);
  if (W.timePick === 'night' && !W.lightAsk && !W.lightAskDone && home) askLights(W);
  if (crossed(20.75) && home && !W.bedAsk) { W.bedAsk = true; const g = grownUp(W); say(W, g, W.player === 'callie' ? 'Bedtime, Callie! Into bed and turn off your light.' : 'Bedtime for Callie soon!', offOr(W, g)); }
  if (crossed(7)) { W.lightAskDone = false; W.bedAsk = false; }
  if (W.lightAsk && LIGHT_ROOMS.every(r => isLit(W, r))) {
    W.lightAsk = null; W.lightAskDone = true;
    const g = grownUp(W); say(W, g, pick(['Thank you! Nice and bright.', 'Lights on. Well done!']), offOr(W, g));
    later(W, 1.5, () => achieve(W, 'lights'));
  }
  // the weather
  const wx = W.weather;
  if (W.weatherPick === 'auto' && W.T > wx.next) {
    const old = wx.kind, r = Math.random();
    wx.kind = old !== 'sun' && r < 0.55 ? 'sun' : r < 0.35 ? 'sun' : r < 0.55 ? 'cloud' : r < 0.82 ? 'rain' : 'storm';
    wx.next = W.T + rand(110, 220);
    if (wx.kind !== old) weatherChanged(W, old, wx.kind);
  }
  const k = weatherNow(W);
  if (k !== W.lastKind) { if (W.lastKind && W.weatherPick !== 'auto') weatherChanged(W, W.lastKind, k); W.lastKind = k; }
  // rain sounds, and lightning in a storm
  if ((k === 'rain' || k === 'storm') && W.T > (W.rainSound || 0)) { W.rainSound = W.T + 1.9; SFX.rain(OUTSIDE.has(W.room) ? 0.07 : 0.025); }
  if (k === 'storm' && W.T > (W.nextFlash || 0)) {
    W.nextFlash = W.T + rand(7, 14); W.flash = W.T; W.boltX = Math.random();
    later(W, rand(0.4, 1.1), () => SFX.thunder());
    W.flashes = (W.flashes || 0) + 1;
    if (W.flashes === 2 && !W.out) later(W, 1.6, () => { const who = pick(['callie', 'dad', 'connor'].filter(id => W.people[id].room === W.room) || []) || 'callie'; say(W, who, pick(['Boom! Thunder!', 'Wow! Lightning!', 'That was loud!']), offOr(W, who)); });
    if (W.flashes === 3) later(W, 2, () => achieve(W, 'storm'));
  }
}
function weatherChanged(W, old, k) {
  const wasWet = old === 'rain' || old === 'storm', wet = k === 'rain' || k === 'storm';
  if (wet) { W.puddles = W.T; W.flashes = 0; W.nextFlash = W.T + 3; }
  if (wasWet && !wet) { W.puddleEnd = W.T + 60; if (daylight(W.clock) > 0.5) W.rainbow = { t0: W.T, until: W.T + 50 }; }
  if (W.bedtime || W.drive) return;
  const me = W.player;
  if (wet && !wasWet) say(W, me, k === 'storm' ? 'Oh no! A storm!' : pick(['It is raining!', 'Look, rain!', 'Pitter patter, rain!']));
  else if (wasWet && !wet && W.rainbow) say(W, me, OUTSIDE.has(W.room) ? 'The rain stopped! Look, a rainbow!' : 'The rain stopped! Is there a rainbow outside?');
}
export function askLights(W) {
  W.lightAsk = { t0: W.T };
  const g = grownUp(W);
  say(W, g, 'It is getting dark! Can you turn the lights on?', offOr(W, g));
}
export function toggleLight(W, rid) {
  if (rid === 'callie') W.flags.lights = !W.flags.lights; else W.lights[rid] = !W.lights[rid];
  W.dirty = true; SFX.click();
  return isLit(W, rid);
}
// morning after bedtime
export function newDay(W) { W.clock = 7; W.lights = {}; W.lightAsk = null; W.lightAskDone = false; W.bedAsk = false; if (W.weatherPick === 'auto') { W.weather.kind = 'sun'; W.weather.next = W.T + rand(100, 180); } }

/* ---------------- drawing ---------------- */
export function mix(a, b, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t, 0, 1))).toString(16).padStart(2, '0')).join('');
}
const STARS = Array.from({ length: 40 }, (_, i) => [((i * 0.618) % 1), ((i * 0.377 + 0.11) % 1) * 0.6, 1 + (i % 3)]);
const DROPS = Array.from({ length: 110 }, (_, i) => [((i * 0.618 + 0.05) % 1), (i * 0.371) % 1, 0.8 + ((i * 7) % 5) / 10]);
// Behind the room: the sky (sand by day, deep blue at night, grey in the rain), stars, the moon, rain and lightning.
export function SkyBack({ W, T, box, outdoor }) {
  const [vx, vy, vw, vh] = box, x0 = vx - vw * 0.5, y0 = vy - vh * 0.5, w = vw * 2, h = vh * 2;
  const dk = darkness(W), k = weatherNow(W), wet = k === 'rain' || k === 'storm', grey = k === 'storm' ? 0.75 : wet ? 0.5 : k === 'cloud' ? 0.25 : 0;
  const fill = mix(mix('#efe2d0', k === 'storm' ? '#76808c' : '#a3acb6', grey), '#232748', dk * 0.92);
  const rb = outdoor && W.rainbow && T < W.rainbow.until ? W.rainbow : null;
  const flash = W.flash && T - W.flash < 0.5 ? 1 - (T - W.flash) / 0.5 : 0;
  return <g pointerEvents="none">
    <rect x={-8000} y={-8000} width={20000} height={20000} fill={fill} />
    {dk > 0.3 && !wet && STARS.map(([a, b, r], i) => <circle key={i} cx={vx + a * vw} cy={vy + b * vh} r={r * 1.6} fill="#fff6d8" opacity={(dk - 0.3) * (0.5 + 0.5 * Math.abs(Math.sin(T * 1.3 + i)))} />)}
    {dk > 0.3 && <g opacity={dk} transform={`translate(${vx + vw * 0.86} ${vy + vh * 0.16})`}><circle r={42} fill="#fff6d8" /><circle cx={18} cy={-10} r={38} fill={fill} /></g>}
    {wet && DROPS.map(([a, b, s], i) => { const x = x0 + a * w, y = y0 + ((b + T * 0.55 * s) % 1) * h; return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 34 * s} stroke="#5f86b3" strokeWidth={3} strokeLinecap="round" opacity={0.6} />; })}
    {rb && <g data-hit="obj:rainbow" pointerEvents="visibleStroke" style={{ cursor: 'pointer' }} opacity={Math.min(1, (T - rb.t0) / 3, (rb.until - T) / 4) * 0.8}>{['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#9775fa'].map((col, i) => <path key={i} d={`M${vx + vw * 0.08 + i * 20},${vy + vh * 0.62} A${vw * 0.42 - i * 20},${vh * 0.5 - i * 20} 0 0 1 ${vx + vw * 0.92 - i * 20},${vy + vh * 0.62}`} fill="none" stroke={col} strokeWidth={21} />)}</g>}
    {flash > 0 && <><rect x={-8000} y={-8000} width={20000} height={20000} fill="#fff" opacity={flash * 0.6} />
      <path d={`M${vx + vw * (0.1 + W.boltX * 0.8)},${vy} l-30,${vh * 0.18} l40,4 l-46,${vh * 0.2} l34,2 l-40,${vh * 0.18}`} fill="none" stroke="#fffbd0" strokeWidth={6} strokeLinejoin="round" opacity={flash} /></>}
  </g>;
}

// In front of an outdoor place: rain, puddles to splash in, and a rainbow.
const PUDDLES = { garden: [[3.0, 5.0], [6.4, 4.4], [4.6, 6.4]], park: [[8.2, 7.2], [5.2, 9.4], [12.6, 9.6], [9.4, 3.6]], nannygarden: [[5.2, 5.4], [12.2, 5.6], [14.6, 3.4]] };
const pSpot = {};
export function puddlesOn(W) { return isWet(W) || (W.puddleEnd && W.T < W.puddleEnd); }
export function puddleSpots(rid) { return (PUDDLES[rid] || []).map(([x, y], i) => pSpot[rid + i] || (pSpot[rid + i] = nav(rid).nearestFree(x, y, 0.15))); }
export function skyOverlays(rid, c, bg, sorted, top) {
  const { T, W } = c;
  if (!OUTSIDE.has(rid) || !ROOMS[rid].bounds) return;
  const k = weatherNow(W), wet = k === 'rain' || k === 'storm';
  if (puddlesOn(W)) {
    const grow = W.puddles ? clamp((T - W.puddles) / 8, 0.15, 1) : 1, fade = !wet && W.puddleEnd ? clamp((W.puddleEnd - T) / 20, 0, 1) : 1;
    puddleSpots(rid).forEach(([x, y], i) => { const g = P(x, y, 0.01), s = grow * fade;
      bg.push(<g key={'pud' + i} data-hit={'obj:puddle' + i} style={{ cursor: 'pointer' }} transform={`translate(${g[0]} ${g[1]}) scale(${s})`}>
        <ellipse rx={88} ry={36} fill="#7fa6cc" opacity={0.8} /><ellipse rx={62} ry={23} cx={-10} cy={-4} fill="#b9d3ea" opacity={0.65} />
        {wet && [0, 1].map(j => { const ph = (T * 0.9 + i * 0.3 + j * 0.5) % 1; return <ellipse key={j} cx={(j ? 18 : -14)} cy={j ? 4 : -4} rx={6 + ph * 18} ry={(6 + ph * 18) * 0.42} fill="none" stroke="#fff" strokeWidth={1.5} opacity={1 - ph} />; })}
      </g>); });
  }
  if (wet) {
    const [x0, x1, y0, y1] = ROOMS[rid].bounds;
    top.push(<g key="rain" pointerEvents="none">{DROPS.slice(0, 90).map(([a, b, s], i) => { const z = 5 * (1 - ((T * 1.4 * s + b) % 1)); const p = P(x0 + (x1 - x0) * a, y0 + (y1 - y0) * ((b * 3.7) % 1), z); return <line key={i} x1={p[0]} y1={p[1]} x2={p[0] - 5} y2={p[1] + 26} stroke="#6f9cc9" strokeWidth={2.8} strokeLinecap="round" opacity={0.85} />; })}</g>);
  }
}
// The light switch in the corner of the screen (house rooms only).
export function Bulb({ on }) {
  return <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
    {on && <circle cx={16} cy={13} r={13} fill="#ffe680" opacity={0.55} />}
    <path d="M16,4 a9,9 0 0 1 5.5,16 v3 h-11 v-3 A9,9 0 0 1 16,4z" fill={on ? '#ffd23f' : '#d8d2c6'} stroke="#8a6a3a" strokeWidth={1.6} />
    <rect x={11} y={23.5} width={10} height={3} rx={1} fill="#8a8f96" /><rect x={12} y={27} width={8} height={2.5} rx={1} fill="#8a8f96" />
    {on && <path d="M13,15 q3,-4 6,0" fill="none" stroke="#e0a92e" strokeWidth={1.6} />}
  </svg>;
}
export function SkyIcon({ W, size = 26 }) {
  const dk = darkness(W) > 0.5, k = weatherNow(W);
  return <svg viewBox="-16 -16 32 32" width={size} height={size} aria-hidden="true">
    {k === 'sun' || k === 'cloud' ? (dk ? <g><circle r={9} fill="#f2c94c" /><circle cx={5} cy={-3} r={8} fill="#fffaf0" /></g> : <g>{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1={0} y1={-10} x2={0} y2={-14} stroke="#ffd23f" strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${a})`} />)}<circle r={8} fill="#ffd23f" /></g>) : null}
    {k !== 'sun' && <g transform={k === 'cloud' ? 'translate(3 4)' : ''}><ellipse cx={0} cy={0} rx={12} ry={7} fill={k === 'storm' ? '#9aa3ad' : '#e9edf2'} /><circle cx={-4} cy={-4} r={6} fill={k === 'storm' ? '#9aa3ad' : '#e9edf2'} /><circle cx={4} cy={-5} r={7} fill={k === 'storm' ? '#9aa3ad' : '#e9edf2'} /></g>}
    {(k === 'rain' || k === 'storm') && [-6, 0, 6].map(x => <line key={x} x1={x} y1={8} x2={x - 2} y2={13} stroke="#74c0fc" strokeWidth={2} strokeLinecap="round" />)}
    {k === 'storm' && <path d="M2,4 l-4,6 h4 l-3,6" fill="none" stroke="#ffd23f" strokeWidth={2} strokeLinejoin="round" />}
  </svg>;
}
