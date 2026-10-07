// Core maths, projection, pathfinding, depth sorting, sound and speech.
export const S = 88, C = 0.866, OX = 922, OY = 430;
export const P = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
export const inv = (sx, sy, z = 0) => { const a = (sx - OX) / (C * S), b = (sy - OY + z * S) / (0.5 * S); return [(a + b) / 2, (b - a) / 2]; };
export const pts = arr => arr.map(p => P(...p).join(',')).join(' ');
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const prog = (T, a, b) => clamp((T - a) / (b - a), 0, 1);
export const arc = (p, h) => 4 * h * p * (1 - p);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const inside = (x, y, [x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const E = {
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outQuad: t => 1 - (1 - t) * (1 - t),
  outCubic: t => 1 - Math.pow(1 - t, 3),
};
export function shade(hex, k) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = c => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

/* ---------------- walkable grid per room ---------------- */
const GS = 0.2;
export function makeNav(room) {
  const [bx0, bx1, by0, by1] = room.bounds;
  const blocks = room.blocks;
  const free = (x, y, inf = 0.18) => {
    if (x < bx0 || x > bx1 || y < by0 || y > by1) return false;
    for (const [x0, x1, y0, y1] of blocks) if (x > x0 - inf && x < x1 + inf && y > y0 - inf && y < y1 + inf) return false;
    return true;
  };
  const nearestFree = (x, y, inf = 0.18) => {
    if (free(x, y, inf)) return [x, y];
    for (let r = 0.06; r < 6; r += 0.06) for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (free(px, py, inf)) return [px, py];
    }
    return [(bx0 + bx1) / 2, (by0 + by1) / 2];
  };
  const lineFree = (a, b) => {
    const n = Math.ceil(dist(a, b) / 0.07);
    for (let k = 1; k <= n; k++) { const t = k / n; if (!free(lerp(a[0], b[0], t), lerp(a[1], b[1], t))) return false; }
    return true;
  };
  const W = Math.ceil((bx1 + 0.5) / GS) + 4, H = Math.ceil((by1 + 0.5) / GS) + 4, OXg = Math.floor((bx0 - 0.4) / GS), OYg = Math.floor((by0 - 0.4) / GS);
  const cx = i => (i + OXg + 0.5) * GS, cy = j => (j + OYg + 0.5) * GS;
  const okCache = new Int8Array(W * H).fill(-1);
  const ok = (i, j) => { if (i < 0 || j < 0 || i >= W || j >= H) return false; const id = j * W + i; if (okCache[id] < 0) okCache[id] = free(cx(i), cy(j)) ? 1 : 0; return okCache[id] === 1; };
  const findPath = (from, to) => {
    const goal = nearestFree(to[0], to[1]);
    const start = free(from[0], from[1]) ? from : nearestFree(from[0], from[1]);
    if (lineFree(start, goal)) return start === from ? [goal] : [start, goal];
    const ci = p => [clamp(Math.floor(p[0] / GS) - OXg, 0, W - 1), clamp(Math.floor(p[1] / GS) - OYg, 0, H - 1)];
    const [si, sj] = ci(start), [gi, gj] = ci(goal);
    const idx = (i, j) => j * W + i;
    const gs = new Float32Array(W * H).fill(Infinity), came = new Int32Array(W * H).fill(-1), closed = new Uint8Array(W * H);
    const h = (i, j) => { const dx = Math.abs(i - gi), dy = Math.abs(j - gj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const open = [[si, sj]]; gs[idx(si, sj)] = 0;
    let found = false;
    while (open.length) {
      let bi = 0, bf = Infinity;
      for (let k = 0; k < open.length; k++) { const [i, j] = open[k], f = gs[idx(i, j)] + h(i, j); if (f < bf) { bf = f; bi = k; } }
      const [i, j] = open.splice(bi, 1)[0], id = idx(i, j);
      if (closed[id]) continue; closed[id] = 1;
      if (i === gi && j === gj) { found = true; break; }
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const ni = i + dx, nj = j + dy;
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        if (!(ni === gi && nj === gj) && !ok(ni, nj)) continue;
        if (dx && dy && (!ok(i + dx, j) || !ok(i, j + dy))) continue;
        const nid = idx(ni, nj); if (closed[nid]) continue;
        const ng = gs[id] + (dx && dy ? 1.414 : 1);
        if (ng < gs[nid]) { gs[nid] = ng; came[nid] = id; open.push([ni, nj]); }
      }
    }
    if (!found) return [start, goal];
    const cells = [];
    for (let id = idx(gi, gj); id >= 0 && id !== idx(si, sj); id = came[id]) cells.unshift([cx(id % W), cy(Math.floor(id / W))]);
    const raw = [start, ...cells.slice(0, -1), goal], out = [];
    let i = 0;
    while (i < raw.length - 1) { let j = raw.length - 1; while (j > i + 1 && !lineFree(raw[i], raw[j])) j--; out.push(raw[j]); i = j; }
    return out;
  };
  const randomFree = (n, area) => {
    const [x0, x1, y0, y1] = area || room.bounds; const out = []; let tries = 0;
    while (out.length < n && tries < 800) {
      tries++; const x = rand(x0, x1), y = rand(y0, y1);
      if (!free(x, y, 0.15)) continue;
      if (tries < 500 && out.some(p => dist(p, [x, y]) < 0.5)) continue;
      out.push([x, y]);
    }
    while (out.length < n) out.push(nearestFree((bx0 + bx1) / 2, (by0 + by1) / 2));
    return out;
  };
  return { free, nearestFree, lineFree, findPath, randomFree };
}

/* ---------------- depth sort ---------------- */
// furn: [{key, sort:[x0,x1,y0,y1], el}] in art order; dyn: [{key, x, y, z, el}]
// Screen rectangle of a 3D box (for working out what can overlap on screen).
export function screenRect([x0, x1, y0, y1], z0 = 0, z1 = 1) {
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const [sx, sy] = P(x, y, z); a = Math.min(a, sx); b = Math.max(b, sx); c = Math.min(c, sy); d = Math.max(d, sy); }
  return [a, b, c, d];
}
const hitRect = (r, s) => r[0] < s[1] && s[0] < r[1] && r[2] < s[3] && s[2] < r[3];
// Big town places: only order things that actually overlap on screen.
// furnEdges = pairs [i, j] (i drawn before j) worked out once per room; dyn nodes carry their own screen rect `sr`.
export function depthSortLoose(furn, dyn, furnEdges) {
  const nodes = [...furn.map(f => ({ ...f, isF: true })), ...dyn.map(d => ({ ...d, isF: false }))];
  const n = nodes.length, out = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  const edge = (a, b) => { out[a].push(b); indeg[b]++; };
  for (const [i, j] of furnEdges) edge(i, j);
  for (let fi = 0; fi < furn.length; fi++) {
    const [x0, x1, y0, y1] = furn[fi].sort, fr = furn[fi].sr;
    for (let di = furn.length; di < n; di++) {
      const nd = nodes[di];
      if (fr && nd.sr && !hitRect(fr, nd.sr)) continue;
      const { x, y } = nd;
      const within = x > x0 && x < x1 && y > y0 && y < y1;
      if (within || x >= x1 || y >= y1) edge(fi, di); else edge(di, fi);
    }
  }
  const depth = nd => (nd.isF ? nd.ord - 1e6 : nd.x + nd.y + (nd.z || 0) * 0.01);
  furn.forEach((f, i) => { nodes[i].ord = i; });
  const ready = []; for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
  const order = [], seen = new Uint8Array(n);
  while (ready.length) {
    let bi = 0; for (let k = 1; k < ready.length; k++) if (depth(nodes[ready[k]]) < depth(nodes[ready[bi]])) bi = k;
    const i = ready.splice(bi, 1)[0]; order.push(i); seen[i] = 1;
    for (const j of out[i]) if (--indeg[j] === 0) ready.push(j);
  }
  for (let i = 0; i < n; i++) if (!seen[i]) order.push(i);
  return order.map(i => nodes[i]);
}
// Is something standing at (x, y) in front of a piece of furniture? Things inside its footprint count as
// in front (sitting on a sofa, lying on a bed). Off a back corner, whichever is nearer the viewer wins.
export function inFront(x, y, [x0, x1, y0, y1]) {
  if (x > x0 && x < x1 && y > y0 && y < y1) return true;
  if (x >= x1 && y >= y0) return true;
  if (y >= y1 && x >= x0) return true;
  if (x >= x1) return x + y > x1 + y0;
  if (y >= y1) return x + y > x0 + y1;
  return false;
}
// Rooms: the furniture keeps its art order, and each person or thing is slotted into that order at the place
// that breaks the fewest in-front/behind rules, counting only furniture it could overlap on screen.
// (Slotting never fails, so nobody ends up drawn on top of everything when the rules disagree.)
export function depthSort(furn, dyn) {
  const n = furn.length;
  const fr = furn.map(f => f.sr || screenRect(f.sort, 0, f.bb ? f.bb[5] : 2.8));
  const depth = d => d.x + d.y + (d.z || 0) * 0.01;
  const ds = [...dyn].sort((a, b) => depth(a) - depth(b));
  let prev = 0;
  const slot = new Map();
  for (const d of ds) {
    const [sx, sy] = P(d.x, d.y, d.z || 0), r = d.sr || [sx - 32, sx + 32, sy - 215, sy + 15];
    const cost = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
      if (!hitRect(fr[i], r)) continue;
      if (inFront(d.x, d.y, furn[i].sort)) { for (let k = 0; k <= i; k++) cost[k]++; } else { for (let k = i + 1; k <= n; k++) cost[k]++; }
    }
    const best = Math.min(...cost);
    // the cheapest run of slots; stay as late as the last placed thing when we can, so nearer things draw later
    let lo = cost.indexOf(best), hi = lo; while (hi + 1 <= n && cost[hi + 1] === best) hi++;
    const k = prev >= lo && prev <= hi ? prev : prev < lo ? lo : (cost[prev] === best ? prev : lo);
    slot.set(d, k); prev = Math.max(prev, k);
  }
  const out = [];
  for (let k = 0; k <= n; k++) {
    for (const d of ds) if (slot.get(d) === k) out.push({ ...d, isF: false });
    if (k < n) out.push({ ...furn[k], isF: true });
  }
  return out;
}

/* ---------------- sound effects ---------------- */
let AC = null;
export const AUDIO = { muted: false, unlocked: false, voice: true };
export function audio() {
  if (AUDIO.muted || !AUDIO.unlocked) return null;
  try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return null; }
  return AC;
}
function tone(f0, f1, dur, type = 'sine', vol = 0.12, delay = 0) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, delay = 0, q = 1) {
  const ac = audio(); if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; gn.gain.value = vol; src.buffer = buf;
  src.connect(f).connect(gn).connect(ac.destination); src.start(ac.currentTime + delay);
}
export const SFX = {
  pop: () => tone(500, 950, 0.09, 'sine', 0.12),
  plop: () => tone(320, 140, 0.13, 'triangle', 0.14),
  squeak: () => { tone(900, 1500, 0.08, 'sine', 0.09); tone(1500, 1000, 0.08, 'sine', 0.09, 0.09); },
  sparkle: () => [880, 1108, 1318, 1760].forEach((f, i) => tone(f, f * 1.01, 0.14, 'sine', 0.07, i * 0.07)),
  fanfare: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, f, i === 5 ? 0.5 : 0.16, 'triangle', 0.1, i * 0.12)),
  click: () => tone(1800, 1100, 0.03, 'square', 0.05),
  whoosh: () => noise(0.35, 0.25, 900),
  sizzle: () => noise(0.9, 0.12, 3200),
  tv: () => tone(180, 1200, 0.18, 'sawtooth', 0.04),
  door: () => tone(240, 170, 0.25, 'triangle', 0.08),
  slam: () => { noise(0.25, 0.9, 160, 0, 0.7); tone(90, 50, 0.3, 'sine', 0.3); },
  creak: () => tone(320, 520, 0.5, 'sawtooth', 0.025),
  knock: () => [0, 0.22, 0.44].forEach(d => { noise(0.08, 0.7, 380, d, 2); tone(140, 90, 0.08, 'sine', 0.2, d); }),
  thud: (d = 0) => { noise(0.18, 0.8, 120, d, 0.8); tone(70, 40, 0.22, 'sine', 0.3, d); },
  boing: () => tone(190, 520, 0.2, 'sine', 0.12),
  blind: () => noise(0.25, 0.1, 2000),
  flush: () => { noise(1.6, 0.3, 700, 0, 0.5); noise(1.2, 0.15, 2400, 0.3, 0.7); },
  water: (dur = 1.2) => noise(dur, 0.14, 2600, 0, 0.4),
  ding: () => { tone(1320, 1320, 0.6, 'sine', 0.1); tone(1980, 1980, 0.5, 'sine', 0.04); },
  doorbell: () => { tone(988, 988, 0.5, 'sine', 0.14); tone(784, 784, 0.7, 'sine', 0.14, 0.45); },
  splash: () => { noise(0.4, 0.4, 1200, 0, 0.6); noise(0.3, 0.2, 3000, 0.1); },
  kick: () => { tone(160, 90, 0.1, 'sine', 0.25); noise(0.06, 0.4, 500); },
  scream: () => { tone(900, 1400, 0.25, 'triangle', 0.08); tone(1400, 1100, 0.3, 'triangle', 0.08, 0.25); },
  nom: () => [0, 0.18, 0.36].forEach(d => tone(220, 160, 0.1, 'triangle', 0.1, d)),
  music: () => [523, 587, 659, 784, 659, 587, 523].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.06, i * 0.24)),
  fire: () => noise(1.2, 0.08, 500, 0, 0.3),
  kettle: () => { noise(1.4, 0.06, 1800, 0, 0.4); tone(1500, 1700, 0.9, 'sine', 0.035, 1.0); },
  spin: () => tone(120, 260, 1.4, 'sawtooth', 0.025),
  cheer: () => { noise(0.8, 0.15, 1500, 0, 0.3); SFX.sparkle(); },
  rock: () => tone(200, 160, 0.25, 'triangle', 0.06),
  coins: () => [1568, 2093, 1760, 2349].forEach((f, i) => tone(f, f, 0.09, 'square', 0.03, i * 0.06)),
  zip: () => noise(0.25, 0.15, 3500, 0, 2),
  party: (secs = 12) => {
    const beat = 0.42, n = Math.floor(secs / beat), mel = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 784, 659, 587];
    for (let i = 0; i < n; i++) {
      tone(110, 45, 0.16, 'sine', 0.28, i * beat);
      if (i % 2) noise(0.05, 0.12, 7000, i * beat, 3);
      tone(mel[i % mel.length], mel[i % mel.length], 0.18, 'square', 0.035, i * beat + 0.02);
      if (i % 4 === 0) tone(mel[i % mel.length] / 2, mel[i % mel.length] / 2, 0.35, 'triangle', 0.05, i * beat);
    }
  },
  shutter: () => { noise(0.06, 0.5, 3000, 0, 1); noise(0.08, 0.4, 2000, 0.09, 1); },
  car: () => { tone(80, 130, 1.3, 'sawtooth', 0.035); tone(130, 95, 1.3, 'sawtooth', 0.03, 1.3); tone(640, 640, 0.11, 'square', 0.045, 2.4); tone(640, 640, 0.11, 'square', 0.045, 2.6); },
  quack: () => { tone(520, 300, 0.12, 'sawtooth', 0.06); tone(480, 280, 0.12, 'sawtooth', 0.05, 0.16); },
  beep: (d = 0) => tone(1320, 1320, 0.08, 'square', 0.04, d),
  bell: () => [0, 0.25, 0.5].forEach((d, i) => tone(988 - i * 120, 980 - i * 120, 0.35, 'triangle', 0.08, d)),
  thunder: () => { noise(2.6, 0.7, 70, 0, 0.5); noise(1.4, 0.5, 160, 0.08, 0.6); tone(55, 32, 1.8, 'sine', 0.22); noise(0.5, 0.35, 400, 0.02, 0.8); },
  rain: (vol = 0.04) => noise(2.2, vol, 5200, 0, 0.25),
  giggle: () => [0, 0.12, 0.24, 0.36].forEach((d, i) => tone(900 + i * 60, 1300 + i * 60, 0.08, 'sine', 0.06, d)),
};

/* ---------------- speech (read aloud) ---------------- */
export const VOICES = {
  callie: { pitch: 1.6, rate: 0.95 }, chloe: { pitch: 1.3, rate: 0.95 }, mum: { pitch: 1.15, rate: 0.92 },
  dad: { pitch: 0.65, rate: 0.9 }, kid: { pitch: 1.5, rate: 0.98 }, nanny: { pitch: 1.1, rate: 0.86 }, grandad: { pitch: 0.72, rate: 0.84 }, lady: { pitch: 1.2, rate: 0.92 }, man: { pitch: 0.75, rate: 0.92 }, connor: { pitch: 0.85, rate: 1.08 }, narrator: { pitch: 1.05, rate: 0.82 }, word: { pitch: 1.05, rate: 0.75 },
};
let voiceList = [];
function loadVoices() { try { voiceList = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; } catch (e) { voiceList = []; } }
if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { /* ignore */ } }
function bestVoice() {
  const en = voiceList.filter(v => /^en/i.test(v.lang));
  return en.find(v => /en[-_]GB/i.test(v.lang) && /female|libby|sonia|serena|kate|google uk english female/i.test(v.name))
    || en.find(v => /en[-_]GB/i.test(v.lang)) || en.find(v => /en[-_]US/i.test(v.lang)) || en[0] || null;
}
// Inside the Android app the web voice may be missing, so the tablet's own text-to-speech is used instead.
const CAP = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null;
const NATIVE_TTS = CAP && CAP.registerPlugin ? CAP.registerPlugin('TextToSpeech') : null;
let ttsWord = null;
if (NATIVE_TTS) try { NATIVE_TTS.addListener('onRangeStart', e => { if (ttsWord && e) ttsWord(e.start); }); } catch (e) { /* older plugin: no word events */ }
export function speak(text, who = 'narrator', onWord) {
  if (AUDIO.muted || !AUDIO.voice || !AUDIO.unlocked) return false;
  if (NATIVE_TTS) {
    const cfg = VOICES[who] || VOICES.narrator;
    ttsWord = onWord || null;
    NATIVE_TTS.stop().catch(() => {}).then(() => NATIVE_TTS.speak({ text: text.replace(/\.\.\./g, ', '), lang: 'en-GB', pitch: cfg.pitch, rate: cfg.rate, volume: 1.0, category: 'playback' })).catch(() => {});
    return true;
  }
  try {
    const ss = window.speechSynthesis; if (!ss) return false;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, ', '));
    const v = bestVoice(); if (v) u.voice = v;
    const cfg = VOICES[who] || VOICES.narrator; u.pitch = cfg.pitch; u.rate = cfg.rate; u.lang = v ? v.lang : 'en-GB';
    if (onWord) u.onboundary = e => { if (e.name === 'word' || e.name === undefined) onWord(e.charIndex); };
    ss.speak(u);
    return true;
  } catch (e) { return false; }
}

// Stickers: remember something Callie has done (once). The game shows the sticker via W.onAchieve.
export function achieve(W, id) {
  if (!W.ach) W.ach = {};
  if (W.ach[id]) return false;
  W.ach[id] = Date.now(); W.dirty = true;
  if (W.onAchieve) W.onAchieve(id);
  earn(W, 10);
  return true;
}
// Coins to spend at the clothes shop.
export function earn(W, n) {
  W.coins = (W.coins || 0) + n; W.dirty = true;
  if (W.onCoins) W.onCoins(n);
}
