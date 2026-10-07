// Errands: little jobs the family asks for while she plays. One at a time, every minute or two.
// Kinds: find something they lost, make them a sandwich (reading the filling), do something
// in a room (tap the sink, the kettle...), or take something to someone at another house.
import { rand, pick, SFX, earn, achieve } from './core.js';
import { say, later, nav, inHouse } from './world.js';
import { CONTAINERS, ROOMS } from './rooms.jsx';
import { NAMES } from './people.jsx';

const HOME_FLOORS = ['living', 'kitchen', 'middle', 'downhall', 'hallway', 'garden', 'bathroom'];
const HIDE_BOXES = ['kitchen:cupboard', 'living:cupboard', 'middle:cupboard', 'middle:basket', 'middle:bag', 'parents:drawers', 'bathroom:drawers', 'chloe:desk', 'attic:trunk'];
const FIND_TIP = 'Look all round the house, then give it to ';

export const ERRANDS = [
  // find something
  { id: 'keys', type: 'find', who: 'dad', kind: 'keys', ask: 'Have you seen my keys? Can you find them?', card: "Find Dad's keys", thanks: 'My keys! Thank you!' },
  { id: 'phone', type: 'find', who: 'mum', kind: 'phone', ask: 'Where is my phone? Can you find it for me?', card: "Find Mum's phone", thanks: 'My phone! Thank you, my love.' },
  { id: 'specs', type: 'find', who: 'dad', kind: 'specs', ask: 'I cannot find my reading glasses!', card: "Find Dad's glasses", thanks: 'Now I can see! Thank you!' },
  { id: 'remote', type: 'find', who: 'dad', kind: 'remote', ask: 'Who has the TV remote? Can you find it?', card: 'Find the TV remote', thanks: 'The remote! Time for football.' },
  { id: 'purse', type: 'find', who: 'mum', kind: 'purse', ask: 'I need my purse for the shops. Can you find it?', card: "Find Mum's purse", thanks: 'My purse! Thank you!' },
  { id: 'scarf', type: 'find', who: 'chloe', kind: 'scarf', ask: 'Where is my black scarf?', card: "Find Chloe's scarf", thanks: 'My scarf. Thanks.' },
  { id: 'brush', type: 'find', who: 'chloe', kind: 'brush', ask: 'Has anyone seen my hairbrush?', card: "Find Chloe's brush", thanks: 'My brush! Thanks.' },
  { id: 'football', type: 'find', who: 'dad', kind: 'football', ask: 'I lost the football. Can you find it?', card: 'Find the ball', thanks: 'The ball! Shall we play in the garden?' },
  // make a sandwich (the fridge is in the middle room)
  { id: 'sand-dad', type: 'food', who: 'dad', ask: 'I am so hungry! Can you make me a sandwich?', card: 'Make Dad a sandwich', thanks: 'Yum! Thank you!' },
  { id: 'sand-cheese', type: 'food', who: 'mum', fill: 'cheese', ask: 'Can you make me a cheese sandwich, please?', card: 'Make Mum a cheese sandwich', thanks: 'Cheese! My favourite. Thank you!' },
  { id: 'sand-jam', type: 'food', who: 'chloe', fill: 'jam', ask: 'Make me a jam sandwich? Please?', card: 'Make Chloe a jam sandwich', thanks: 'Jam! Nice one.' },
  { id: 'sand-egg', type: 'food', who: 'dad', fill: 'egg', ask: 'I fancy an egg sandwich!', card: 'Make Dad an egg sandwich', thanks: 'Egg! Lovely. Thank you!' },
  { id: 'sand-ham', type: 'food', who: 'mum', fill: 'ham', ask: 'Could you make me a ham sandwich?', card: 'Make Mum a ham sandwich', thanks: 'Ham! Thank you, my love.' },
  // do something somewhere
  { id: 'teeth', type: 'do', who: 'mum', room: 'bathroom', keys: ['BasinUnit'], ask: 'Time to brush your teeth!', card: 'Brush your teeth', tip: 'Go to the bathroom upstairs and tap the sink.', thanks: 'Lovely clean teeth!' },
  { id: 'dishes', type: 'do', who: 'mum', room: 'kitchen', keys: ['SinkUnit', 'SinkWorktop', 'DishRack'], ask: 'Can you wash the dishes for me?', card: 'Wash the dishes', tip: 'Go to the kitchen and tap the sink.', thanks: 'Clean plates! Thank you!' },
  { id: 'washing', type: 'do', who: 'mum', room: 'kitchen', keys: ['WashingMachine'], ask: 'Can you put the washing on?', card: 'Put the washing on', tip: 'Tap the washing machine in the kitchen.', thanks: 'Thank you! What a helper.' },
  { id: 'kettle', type: 'do', who: 'mum', room: 'kitchen', keys: ['Kettle'], ask: 'I would love a cup of tea. Can you put the kettle on?', card: 'Put the kettle on', tip: 'The kettle is on the worktop in the kitchen.', thanks: 'A cup of tea! Thank you!' },
  { id: 'tv', type: 'do', who: 'dad', room: 'living', keys: ['TVUnit'], ask: 'Can you turn the TV on for me?', card: 'Turn the TV on', tip: 'The TV is in the living room.', thanks: 'Football time! Thanks!' },
  { id: 'music', type: 'do', who: 'chloe', room: 'living', keys: ['RecordPlayer'], ask: 'Put some music on!', card: 'Play some music', tip: 'Tap the record player in the living room.', thanks: 'Good song!' },
  { id: 'fire', type: 'do', who: 'dad', room: 'living', keys: ['Fireplace', 'ChimneyBreast'], ask: 'Brr! It is cold. Can you put the fire on?', card: 'Put the fire on', tip: 'Tap the fire in the living room.', thanks: 'Nice and warm!' },
  { id: 'plants', type: 'do', who: 'mum', room: 'middle', keys: ['SillPlants'], ask: 'The plants are thirsty. Can you water them?', card: 'Water the plants', tip: 'The plants are on the window sill in the middle room.', thanks: 'Happy plants! Thank you!' },
  { id: 'shower', type: 'do', who: 'dad', room: 'bathroom', keys: ['ShowerTray', 'ShowerScreens', 'ShowerFittings'], ask: 'You are muddy! Time for a shower.', card: 'Have a shower', tip: 'Go to the bathroom upstairs and tap the shower.', thanks: 'All clean!' },
  { id: 'paint', type: 'do', who: 'mum', room: 'middle', keys: ['ArtEasel'], ask: 'Can you paint me a picture?', card: 'Paint a picture', tip: 'The easel is in the middle room.', thanks: 'A painting for me? I love it!' },
  { id: 'read', type: 'do', who: 'dad', room: 'living', keys: ['BookTower'], ask: 'Shall we read a book? Get one from the living room!', card: 'Read a book', tip: 'Tap the pile of books in the living room.', thanks: 'Super reading!' },
  { id: 'swing', type: 'do', who: 'dad', room: 'park', keys: ['Swing', 'SwingFrame'], ask: 'Shall we go to the park? Have a go on the swings!', card: 'Go on the swings', tip: 'Go out of the front door and tap Park on the map. Then tap the swings.', thanks: 'Wheee!' },
  { id: 'slide', type: 'do', who: 'mum', room: 'park', keys: ['Slide', 'TowerFront', 'TowerBack'], ask: 'Go to the park and go down the slide!', card: 'Go down the slide', tip: 'Go out of the front door and tap Park on the map. Then tap the slide.', thanks: 'Wheee!' },
  // take something to someone
  { id: 'paper', type: 'take', who: 'dad', to: 'grandad', kind: 'paper', ask: 'Can you take this newspaper to Grandad?', card: 'Take the paper to Grandad', tip: "Go to Nanny and Grandad's house, then give it to Grandad.", thanks: 'My paper! Thank you, sweetheart.' },
  { id: 'flowers', type: 'take', who: 'mum', to: 'nanny', kind: 'flowers', ask: 'Can you give these flowers to Nanny?', card: 'Take the flowers to Nanny', tip: "Go to Nanny and Grandad's house, then give them to Nanny.", thanks: 'Flowers for me? How lovely!' },
  { id: 'cake', type: 'take', who: 'mum', to: 'folk', kind: 'cake', ask: 'I made a cake for {name}. Can you take it round?', card: 'Take the cake to {name}', tip: "Go to {name}'s house on New Street, then give it to {name}.", thanks: 'A cake! Thank you!' },
];
export const ERRAND = Object.fromEntries(ERRANDS.map(e => [e.id, e]));
const fill = (s, name) => (s || '').replace(/\{name\}/g, name || '');

export function initErrands(W, saved) {
  W.errand = (saved && saved.errand) || null;
  W.errN = (saved && saved.errN) || 0;
  W.errandNext = 45;
  W.errRecent = [];
  // a job that needs an item whose item has gone is dropped
  if (W.errand && ['find', 'take'].includes(ERRAND[W.errand.id] && ERRAND[W.errand.id].type) && !W.items.find(i => i.errand === W.errand.id)) W.errand = null;
  if (W.errand && !ERRAND[W.errand.id]) W.errand = null;
}
const calm = W => !W.out && !W.bedtime && !W.photo && !W.dance && !W.hide && !W.drive && !W.lightAsk && !(W.asks && W.asks.school.state === 'active');
const off = (W, id) => (W.people[id] && W.people[id].room === W.room ? null : { type: 'off', id });
const homeFolk = W => Object.values((W.folk && W.folk.people) || {}).filter(d => d.fam !== 'home' && W.people[d.id]);

function placeItem(W, it) {
  const box = rand(0, 1) < 0.5 ? pick(HIDE_BOXES.filter(b => CONTAINERS[b] && CONTAINERS[b].room !== W.room)) : null;
  if (box) { it.loc = { s: 'in', box, order: W.T }; it.room = CONTAINERS[box].room; return; }
  const room = pick(HOME_FLOORS.filter(r => r !== W.room && ROOMS[r]));
  const [x, y] = nav(room).randomFree(1)[0];
  it.loc = { s: 'floor', x, y }; it.room = room;
}

export function stepErrands(W, onHand) {
  if (W.errand || W.T < W.errandNext || !calm(W)) return;
  const ok = E => {
    if (E.who === W.player || !W.people[E.who] || !inHouse(W.people[E.who]) || W.people[E.who].mode === 'lie') return false;
    if (W.errRecent.includes(E.id)) return false;
    if (E.type === 'take' && E.to === 'folk' && !homeFolk(W).length) return false;
    if (E.type === 'take' && E.to === W.player) return false; // Nanny and Grandad only appear once you visit

    return true;
  };
  const choices = ERRANDS.filter(ok); if (!choices.length) { W.errandNext = W.T + 30; return; }
  const E = pick(choices), job = { id: E.id, t0: W.T };
  if (E.type === 'take' && E.to === 'folk') { const d = pick(homeFolk(W)); job.to = d.id; job.name = d.name; }
  if (E.type === 'find') { const it = { id: 'e-' + E.kind, kind: E.kind, rot: rand(-25, 25), errand: E.id }; W.items = W.items.filter(i => i.id !== it.id); placeItem(W, it); W.items.push(it); }
  if (E.type === 'take') { const it = { id: 'e-' + E.kind, kind: E.kind, rot: 0, errand: E.id, loc: { s: 'pack' }, packT: W.T, room: null }; W.items = W.items.filter(i => i.id !== it.id); W.items.push(it); job.give = true; }
  W.errand = job; W.errRecent = [...W.errRecent, E.id].slice(-6); W.dirty = true;
  SFX.ding();
  say(W, E.who, fill(E.ask, job.name), off(W, E.who));
  // things to take are handed over straight away
  if (job.give && onHand) later(W, 1.2, () => onHand(W.items.find(i => i.errand === E.id)));
}

// what the job card says
export function errandTodo(W, whereIs) {
  const job = W.errand; if (!job) return null;
  const E = ERRAND[job.id], who = NAMES[E.who] || E.who, name = job.name;
  const it = W.items.find(i => i.errand === job.id);
  let tip = E.tip ? fill(E.tip, name) : '';
  if (E.type === 'find') tip = (it && it.loc.s === 'pack') ? `Give it to ${who}.` : (whereIs(W, it) || FIND_TIP + who + '.');
  if (E.type === 'food') tip = `Open the big fridge in the middle room${E.fill ? `, pick ${E.fill}` : ''}, make it, then give it to ${who}.`;
  return { id: 'errand', icon: E.kind || (E.type === 'food' ? 'sandwich' : 'star'), text: fill(E.card, name), tip };
}

function finish(W, onDone) {
  const job = W.errand, E = ERRAND[job.id];
  W.errand = null; W.errandNext = W.T + rand(50, 110); W.errN = (W.errN || 0) + 1; W.dirty = true;
  W.items = W.items.filter(i => i.errand !== job.id);
  const thanker = E.type === 'take' ? (job.to || E.to) : E.who;
  later(W, 0.3, () => say(W, thanker, E.thanks, off(W, thanker)));
  SFX.fanfare(); earn(W, 5);
  if (W.errN >= 5) later(W, 2, () => achieve(W, 'helper'));
  if (W.errN >= 15) later(W, 3, () => achieve(W, 'superhelper'));
  onDone && onDone(E, thanker);
}
// tapped something in a room
export function errandTap(W, room, key, onDone) {
  const job = W.errand; if (!job) return false;
  const E = ERRAND[job.id];
  if (E.type !== 'do' || E.room !== room || !E.keys.some(k => k === key || key.split('#')[0] === k)) return false;
  later(W, 1.6, () => { if (W.errand === job) finish(W, onDone); });
  return true;
}
// gave something to someone: returns a line to say if it was for a job, or null
export function errandGive(W, who, it, onDone) {
  const job = W.errand;
  if (it.errand) {
    if (!job || it.errand !== job.id) { W.items = W.items.filter(i => i !== it); return 'Thank you!'; }
    const E = ERRAND[job.id], target = E.type === 'take' ? (job.to || E.to) : E.who;
    if (who !== target) return `That is for ${NAMES[target] || job.name}!`;
    finish(W, onDone); return '';
  }
  if (job && it.kind === 'sandwich') {
    const E = ERRAND[job.id];
    if (E.type !== 'food' || E.who !== who) return null;
    if (E.fill && !(it.fillings || []).includes(E.fill)) return `I asked for a ${E.fill} sandwich!`;
    W.items = W.items.filter(i => i !== it);
    finish(W, onDone); return '';
  }
  return null;
}
