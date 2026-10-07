import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SCENES, Iso } from './rooms.gen.jsx';
import fs from 'fs';
const { C, S } = Iso;
const out = {};
const DEEP = new Set(['park', 'cafe', 'shop', 'school', 'nannydown', 'nannyup', 'nannygarden', 'clothes']);
const plainG = el => el.type === 'g' && Object.keys(el.props).every(k => k === 'children');
for (const [room, Scene] of Object.entries(SCENES)) {
  window.__sceneBegin(room);
  const stage = Scene({ showLabels: false });
  const { cx, cy, zoom } = stage.props;
  const list = [];
  const counts = {};
  const deep = DEEP.has(room);
  const flat = (ch, dx, dy) => React.Children.forEach(ch, el => {
    if (!el || typeof el !== 'object') return;
    if (el.type === React.Fragment) return flat(el.props.children, dx, dy);
    if (deep && plainG(el)) return flat(el.props.children, dx, dy);
    if (el.type === 'g' && typeof el.props.transform === 'string' && /^translate\(/.test(el.props.transform)) {
      const [tx, ty] = el.props.transform.match(/-?[\d.]+/g).map(Number);
      const a = tx / (C * S), b = ty / (0.5 * S);
      return flat(el.props.children, dx + (a + b) / 2, dy + (b - a) / 2);
    }
    let name = typeof el.type === 'function' ? el.type.name : 'host:' + el.type;
    counts[name] = (counts[name] || 0) + 1; const key = counts[name] > 1 ? name + '#' + counts[name] : name;
    const ptsAll = [];
    window.__trackP = (x, y, z) => ptsAll.push([x, y, z]);
    try { renderToStaticMarkup(el); } catch (e) { console.error(room, key, e.message); }
    window.__trackP = null;
    let bb = null, low = null;
    for (const [x0, y0, z] of ptsAll) {
      const x = x0 + dx, y = y0 + dy;
      if (!bb) bb = [x, x, y, y, z, z]; else { bb[0] = Math.min(bb[0], x); bb[1] = Math.max(bb[1], x); bb[2] = Math.min(bb[2], y); bb[3] = Math.max(bb[3], y); bb[4] = Math.min(bb[4], z); bb[5] = Math.max(bb[5], z); }
      if (z <= 0.6) { if (!low) low = [x, x, y, y]; else { low[0] = Math.min(low[0], x); low[1] = Math.max(low[1], x); low[2] = Math.min(low[2], y); low[3] = Math.max(low[3], y); } }
    }
    const r = v => v && v.map(n => Math.round(n * 100) / 100);
    const rec = { key, shift: dx || dy ? [r([dx])[0], r([dy])[0]] : undefined, bb: r(bb), low: r(low), n: ptsAll.length };
    if (name === 'Person') rec.at = r(el.props.at);
    list.push(rec);
  });
  flat(stage.props.children, 0, 0);
  out[room] = { cx, cy, zoom, items: list };
}
fs.writeFileSync('rooms.json', JSON.stringify(out, null, 1));
for (const [room, d] of Object.entries(out)) {
  if (process.argv[2] && process.argv[2] !== room) continue;
  console.log(`\n## ${room} cx=${d.cx} cy=${d.cy} zoom=${d.zoom}`);
  for (const it of d.items) console.log(`  ${it.key.padEnd(22)} bb=${JSON.stringify(it.bb)} low=${JSON.stringify(it.low)}${it.shift ? ' shift=' + it.shift : ''}${it.at ? ' at=' + it.at : ''}`);
}
