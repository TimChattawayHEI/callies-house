// Jobs: what to do now (with tips), and a sticker book of things Callie has done.
import React, { useState } from 'react';
import { speak, SFX } from './core.js';
import { ItemIcon, HUNT_ORDER } from './items.jsx';
import { ROOMS, CONTAINERS } from './rooms.jsx';
import { NAMES } from './people.jsx';
import { QUESTS } from './fun.js';
import { isHalloween } from './halloween.jsx';
import { isChristmas } from './christmas.jsx';
import { KIDS } from './asks.js';
import { LIGHT_ROOMS, isLit } from './sky.jsx';
import { GROC } from './places.jsx';
import { errandTodo } from './errands.js';
import { petTodos } from './pets.jsx';
import { tjTodo } from './townjobs.jsx';
import { moodTodos } from './mood.jsx';
import { whereNow } from './townlife.js';

// Stickers. title: short words she can read. joke: the bit for whoever is reading with her. how: a tip if she has not got it yet.
export const STICKERS = [
  { id: 'controller', icon: 'controller', title: 'Found the controller', joke: "Connor got his controller back. Five whole seconds of peace and quiet!", how: 'When Connor loses his controller, find it and knock on his door.' },
  { id: 'tablet', icon: 'tablet', title: 'Found the tablet', joke: 'Chloe said thank you. She nearly smiled!', how: "When Chloe loses her tablet, find it and give it to her." },
  { id: 'hunt', icon: 'bus', title: 'Word hunter', joke: 'Found all 8 hidden things. Super reader!', how: 'Find all the things on the "Find the..." card.' },
  { id: 'tidy', icon: 'bear', title: 'Tidy room', joke: 'Mum had to sit down. A tidy room!', how: 'Put your toys in the basket, clothes in the box and books on the desk.' },
  { id: 'spider', icon: 'spider', title: 'Spider spotter', joke: 'Dad to the rescue! Bye bye, spider.', how: 'If you see a spider, tap it and call Dad.' },
  { id: 'spider5', icon: 'spider', title: 'Spider catcher', joke: 'Five spiders caught! Dad needs a bigger cup.', how: 'Catch 5 spiders with Dad.', count: W => [W.spiderN || 0, 5] },
  { id: 'spider10', icon: 'spider', title: 'Spider boss', joke: 'Ten spiders! The spiders are telling their friends about you.', how: 'Catch 10 spiders with Dad.', count: W => [W.spiderN || 0, 10] },
  { id: 'lunch', icon: 'sandwich', title: 'Lunch time', joke: 'Chloe came out of her room. For food, obviously.', how: 'Open the fridge in the middle room.' },
  { id: 'feed', icon: 'sandwich', title: 'Fed Connor', joke: 'Connor ate a sandwich and said thanks. Sort of.', how: 'Make a sandwich and knock on Connor\'s door.' },
  { id: 'hide', icon: 'star', title: 'Hide and seek', joke: 'Found them! Nobody can hide from Callie.', how: 'Tap someone in the family and play hide and seek.' },
  { id: 'goal', icon: 'ball', title: 'GOAL!', joke: 'Dad dived the wrong way. Again.', how: 'Get the goal out of the garage and score past Dad.' },
  { id: 'dance', icon: 'music', title: 'Dance party', joke: 'Even Connor danced. Probably.', how: 'Tap the record player in the living room.' },
  { id: 'stinky', icon: 'stink', title: 'Stinky feet!', joke: 'Pooh! Someone get Chloe some socks.', how: 'Take Chloe\'s boots off in Dress up, then walk past the family.' },
  { id: 'clothes', icon: 'coin', title: 'New clothes!', joke: 'Mum says it was a bargain.', how: 'Go to the clothes shop and buy something.' },
  { id: 'fashion', icon: 'coin', title: 'Fashion star', joke: 'Ten new things! The wardrobe is getting full.', how: 'Buy 10 things at the clothes shop.', count: W => [Object.values(W.wardrobe || {}).reduce((n, l) => n + l.length, 0), 10] },
  { id: 'lights', icon: 'bulb', title: 'Light helper', joke: 'Click! No more bumping into the sofa in the dark.', how: 'When it gets dark, turn the lights on for Mum.' },
  { id: 'storm', icon: 'storm', title: 'Storm watcher', joke: 'Boom! Even Dad jumped.', how: 'Watch a thunderstorm. Count the flashes!' },
  { id: 'puddle', icon: 'puddle', title: 'Puddle jumper', joke: 'Splash! Wellies are best for this.', how: 'When it rains, go outside and jump in a puddle.' },
  { id: 'rainbow', icon: 'rainbow', title: 'Rainbow spotter', joke: 'Red, orange, yellow, green, blue and purple!', how: 'After the rain, look for a rainbow outside.' },
  { id: 'levelup', icon: 'star', title: 'Level up!', joke: 'So happy they went up a level. Party hats on!', how: 'Help someone until their heart meter is full.' },
  { id: 'favfood', icon: 'star', title: 'Favourite food', joke: 'You found their favourite food. Yum yum yum!', how: 'Feed someone their secret favourite food.' },
  { id: 'makeup', icon: 'letter', title: 'Friends again', joke: 'Sorry said, hugs given. Best friends again!', how: 'Help two friends who fell out make up.' },
  { id: 'concert', icon: 'music', title: 'Superstar', joke: 'The crowd went wild! Encore! Encore!', how: 'Put on a concert. Tap someone, then Sing.' },
  { id: 'news', icon: 'star', title: 'Newsreader', joke: 'And that was the news. Back to you!', how: 'Watch Town News. Tap the News button when it shows.' },
  { id: 'sweethearts', icon: 'heart', title: 'Sweethearts', joke: 'Two people, one big crush. Aww!', how: 'Help someone tell their crush how they feel.' },
  { id: 'wedding', icon: 'heart', title: 'Wedding bells', joke: 'I do! I do! Pass the cake!', how: 'Have a wedding for two sweethearts.' },
  { id: 'baby', icon: 'heart', title: 'New baby', joke: 'Welcome to the world, little one!', how: 'Help a married couple welcome a baby.' },
  { id: 'games', icon: 'ball', title: 'Game time', joke: 'Ready, steady, PLAY!', how: 'Play a game with someone. Tap them, then Play.' },
  { id: 'champion', icon: 'star', title: 'Duck champion', joke: 'Fastest duck in town! Quack quack!', how: 'Win the duck race.' },
  { id: 'special', icon: 'star', title: 'Big build', joke: 'Something special is open in town!', how: 'Build the funfair, the concert hall or the flats.' },
  { id: 'gift', icon: 'star', title: 'A present', joke: 'Someone made you a present. How kind!', how: 'Open a present someone made for you.' },
  { id: 'dreams', icon: 'star', title: 'Sweet dreams', joke: 'Shh! Someone is dreaming...', how: 'At night, peek at someone dreaming.' },
  { id: 'guest', icon: 'star', title: 'A visitor', joke: 'Knock knock! Someone came from far away!', how: 'Have a visitor come from another tablet.' },
  { id: 'traveller', icon: 'star', title: 'Off on a trip', joke: 'Pack your bags! Off to see the world!', how: 'Send someone to visit another tablet. Grown-ups menu, Visitors.' },
  { id: 'maker', icon: 'star', title: 'New friend', joke: 'Everyone say hello! The street just got bigger.', how: 'Tap Families and make a new person.' },
  { id: 'decor', icon: 'sofa', title: 'Home maker', joke: 'A new thing for the house. It looks great!', how: 'In a New Street house, tap Decorate and buy something.' },
  { id: 'makeover', icon: 'roller', title: 'Room makeover', joke: 'New walls! The whole family came to have a look.', how: 'Tap Decorate and change the walls or the floor.' },
  { id: 'photo', icon: 'camera', title: 'Say cheese!', joke: 'A family photo with everyone looking. Nearly.', how: 'Tap the camera button at the top.' },
  { id: 'paint', icon: 'pen', title: 'Little artist', joke: 'A painting for the fridge!', how: 'Tap the easel in the middle room.' },
  { id: 'magnet', icon: 'key', title: 'Fridge speller', joke: 'Made a real word with the magnets!', how: 'Open the fridge, tap Magnets and make a word.' },
  { id: 'burger', icon: 'burger', title: 'BBQ chef', joke: 'Dad says it is the best burger ever.', how: 'Tap the BBQ in the garden.' },
  { id: 'book', icon: 'book', title: 'Bookworm', joke: 'Read a whole book!', how: 'Find a book and read it.' },
  { id: 'sleep', icon: 'moon', title: 'Sweet dreams', joke: 'Night night! Even the teddies are asleep.', how: 'Turn off the light and get into bed.' },
  { id: 'pumpkin', icon: 'pumpkin', title: 'Spooky pumpkin', joke: 'The scariest pumpkin in the street!', how: 'Carve the pumpkin in the kitchen.' },
  { id: 'spooky', icon: 'spooky', title: 'Spooky house', joke: 'Bats, cobwebs and a happy Mum.', how: 'At Halloween, find the spooky box in the attic for Mum.' },
  { id: 'xmas', icon: 'xmasbox', title: 'Merry house', joke: 'Tinsel everywhere. Even on Dad.', how: 'At Christmas, find the Christmas box in the attic for Mum.' },
  { id: 'tree', icon: 'tree', title: 'Christmas tree', joke: 'The best tree in the whole town!', how: 'At Christmas, decorate the tree in the living room.' },
  { id: 'snowman', icon: 'snowman', title: 'Hello, snowman!', joke: 'He said hello back. Probably.', how: 'At Christmas, find the snowman in the garden.' },
  { id: 'slide', icon: 'star', title: 'Wheee!', joke: 'Down the big slide at the park!', how: 'Go to the park and go down the slide.' },
  { id: 'zip', icon: 'zip', title: 'Zoom!', joke: 'Down the zip line! Fastest girl in the park.', how: 'Go to the park and tap the zip line.' },
  { id: 'ducks', icon: 'duck', title: 'Duck feeder', joke: 'Six happy ducks. One very full duck.', how: 'Take some bread to the park and feed the ducks.' },
  { id: 'school', icon: 'uniform', title: 'Ready for school', joke: 'Uniform on and out the door. Mum is amazed!', how: 'When Mum says it is time for school, put your uniform on and go.' },
  { id: 'icecream', icon: 'icecream', title: 'Ice cream!', joke: 'An ice cream from the van. With sprinkles?', how: 'Go to the park and visit the ice cream van.' },
  { id: 'cafe', icon: 'hotchoc', title: 'Cafe treat', joke: 'Hot chocolate at the cafe. Very grown up.', how: 'Go to the cafe and order at the till.' },
  { id: 'shop', icon: 'shopping', title: 'Super shopper', joke: 'Got everything on the list. Mum did not have to help!', how: 'Go to the shop and find everything on the list.' },
  { id: 'hopscotch', icon: 'star', title: 'Hopscotch', joke: '1, 2, 3, 4... all the way to 8!', how: 'Go to school and play hopscotch in the playground.' },
  { id: 'nanny', icon: 'biscuit', title: 'Big cuddle', joke: 'Nanny and Grandad love a cuddle.', how: "Go to Nanny and Grandad's and give them a hug." },
  { id: 'helper', icon: 'keys', title: 'Little helper', joke: 'Five jobs done! Mum wants to know who you are and what you did with Callie.', how: 'When someone asks for help, do the job.', count: W => [W.errN || 0, 5] },
  { id: 'superhelper', icon: 'star', title: 'Super helper', joke: 'Fifteen jobs! Dad is thinking of retiring.', how: 'Do 15 jobs for the family.', count: W => [W.errN || 0, 15] },
  { id: 'animals', icon: 'butterfly', title: 'Animal friend', joke: 'A butterfly, a bird and a cat. Who is next? A giraffe?', how: 'Go outside and tap a butterfly, a bird and a cat.', count: W => [['butterfly', 'bird', 'cat'].filter(k => (W.met || {})[k]).length, 3] },
  { id: 'post', icon: 'letter', title: 'Post reader', joke: 'Three letters read all by herself!', how: 'When the post comes, read the letter on the mat.', count: W => [W.lettersRead || 0, 3] },
  { id: 'visitor', icon: 'cake', title: 'Play date', joke: 'A friend came round to play. Put the kettle on!', how: 'Make a friend in Families. One day they will knock on the door.' },
  { id: 'townhelper', icon: 'star', title: 'Town helper', joke: 'Five jobs for the town! Everyone knows your name now.', how: 'In your own world, do 5 jobs for people.', count: W => [(W.tj && W.tj.n) || 0, 5] },
  { id: 'townhero', icon: 'star', title: 'Town hero', joke: 'Twenty jobs! They are going to build you a statue.', how: 'In your own world, do 20 jobs for people.', count: W => [(W.tj && W.tj.n) || 0, 20] },
  { id: 'shopshift', icon: 'shopping', title: 'Shop helper', joke: 'You served the customers. The till goes ding!', how: 'In one of your shops, tap the counter and help in the shop.' },
  { id: 'party', icon: 'cake', title: 'Party time', joke: 'Happy birthday to you! Cake for everyone.', how: 'When someone has a birthday, give them a present.' },
  { id: 'lucky', icon: 'coin', title: 'Lucky coin', joke: 'A shiny coin on the ground. Finders keepers!', how: 'In your own world, look for a shiny coin in town.' },
  { id: 'myshop', icon: 'shopping', title: 'Shopkeeper', joke: 'Your very own shop! Open all hours.', how: 'Open the town map, tap Build and make a shop.' },
  { id: 'highstreet', icon: 'shopping', title: 'High street', joke: 'Five shops! Callie is basically the mayor now.', how: 'Build 5 shops in town.', count: W => [Object.keys((W.town && W.town.shops) || {}).length, 5] },
  { id: 'visitshop', icon: 'star', title: 'Open for business', joke: 'Your first customer was you. Good start.', how: 'Go inside a shop you built.' },
  { id: 'pet', icon: 'paw', title: 'My first pet', joke: 'A new member of the family! Mum says she is not cleaning up after it.', how: 'Go to the pet shop and adopt a pet.' },
  { id: 'petfamily', icon: 'paw', title: 'Pet family', joke: 'Three pets! The house is getting noisy.', how: 'Adopt 3 pets from the pet shop.' },
  { id: 'petfeed', icon: 'paw', title: 'Pet feeder', joke: 'Ten dinners served. The pets think you are the best.', how: 'Feed your pets 10 times.', count: W => [(W.petStats || {}).fed || 0, 10] },
  { id: 'walkies', icon: 'paw', title: 'Walkies!', joke: 'A big walk in the park. One very happy dog.', how: 'Take your dog to the park.' },
  { id: 'poo', icon: 'poo', title: 'Poo patrol', joke: 'Three poos scooped. Dad is very proud. And a bit sick.', how: 'Clean up the dog poo in the garden 3 times.', count: W => [(W.petStats || {}).poo || 0, 3] },
  { id: 'petcare', icon: 'paw', title: 'Clean home', joke: 'Sparkly tanks and tidy cages. Five stars!', how: 'Clean a pet home 3 times.', count: W => [(W.petStats || {}).clean || 0, 3] },
  { id: 'explorer', icon: 'star', title: 'Explorer', joke: 'Been to every place on the map!', how: 'Visit every place on the map.' },
];
export const STICKER = Object.fromEntries(STICKERS.map(s => [s.id, s]));

export function JobIcon({ kind, size = 34, grey }) {
  const simple = { star: 'M0,-11 L3.5,-3.5 11.5,-3 5.5,2.5 7,10.5 0,6 -7,10.5 -5.5,2.5 -11.5,-3 -3.5,-3.5Z' };
  if (kind === 'heart') return <svg viewBox="-14 -14 28 28" width={size} height={size} aria-hidden="true" style={grey ? { filter: 'grayscale(1)', opacity: 0.35 } : null}><path d="M0,10 C-14,0 -10,-12 0,-4 C10,-12 14,0 0,10Z" fill="#e86a92" /></svg>;
  if (kind === 'star' || kind === 'music' || kind === 'camera' || kind === 'spider' || kind === 'pumpkin' || kind === 'ball' || kind === 'zip' || kind === 'snowman' || kind === 'stink' || kind === 'coin' || kind === 'bulb' || kind === 'storm' || kind === 'puddle' || kind === 'rainbow' || kind === 'sofa' || kind === 'roller' || kind === 'paw' || kind === 'poo')
    return <svg viewBox="-14 -14 28 28" width={size} height={size} aria-hidden="true" style={grey ? { filter: 'grayscale(1)', opacity: 0.35 } : null}>
      {kind === 'star' && <path d={simple.star} fill="#ffd45e" stroke="#e0a92e" strokeWidth={1.5} />}
      {kind === 'music' && <text x={0} y={8} textAnchor="middle" fontSize={22} fill="#e86a92">♫</text>}
      {kind === 'camera' && <g><rect x={-11} y={-6} width={22} height={15} rx={3} fill="#3d3f6b" /><circle r={5} cy={1.5} fill="#bfe0f7" /><rect x={-5} y={-9} width={8} height={4} fill="#3d3f6b" /></g>}
      {kind === 'spider' && <g stroke="#2b2b2e" strokeWidth={1.5} fill="none">{[-1, 1].map(s => [0, 1, 2].map(i => <path key={s + '' + i} d={`M0,${i * 3 - 2} q${s * 6},-5 ${s * 10},${i * 3}`} />))}<circle r={5} fill="#2b2b2e" /></g>}
      {kind === 'pumpkin' && <g><ellipse rx={11} ry={9} fill="#f28a1c" /><path d="M-5,-2 l2,-4 2,4z M3,-2 l2,-4 2,4z M-5,3 q5,4 10,0" fill="#5a2a06" /><rect x={-1} y={-12} width={2.5} height={4} fill="#5b7a2e" /></g>}
      {kind === 'bulb' && <g><path d="M0,-11 a7,7 0 0 1 4.5,12.5 v3 h-9 v-3 A7,7 0 0 1 0,-11z" fill="#ffd23f" stroke="#8a6a3a" strokeWidth={1.2} /><rect x={-4} y={5} width={8} height={4} rx={1} fill="#8a8f96" /></g>}
      {kind === 'storm' && <g><ellipse cy={-3} rx={11} ry={6} fill="#9aa3ad" /><circle cx={-4} cy={-7} r={5} fill="#9aa3ad" /><path d="M1,1 l-4,6 h4 l-3,6" fill="none" stroke="#ffd23f" strokeWidth={2.2} strokeLinejoin="round" /></g>}
      {kind === 'puddle' && <g><ellipse cy={5} rx={12} ry={5} fill="#8fb4d6" /><ellipse cx={0} cy={5} rx={6} ry={2.4} fill="none" stroke="#fff" /><path d="M-6,-2 l-3,-6 M0,-3 v-7 M6,-2 l3,-6" stroke="#74c0fc" strokeWidth={2} strokeLinecap="round" /></g>}
      {kind === 'rainbow' && <g fill="none" strokeWidth={2.6}>{['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#9775fa'].map((c, i) => <path key={i} d={`M${-12 + i * 2.2},6 A${12 - i * 2.2},${12 - i * 2.2} 0 0 1 ${12 - i * 2.2},6`} stroke={c} />)}</g>}
      {kind === 'coin' && <g><circle r={11} fill="#f2c94c" stroke="#d9a92c" strokeWidth={2} /><circle r={6.5} fill="none" stroke="#d9a92c" strokeWidth={1.5} /></g>}
      {kind === 'stink' && <g><ellipse cy={8} rx={10} ry={5} fill="#f3cfb3" stroke="#e2b493" />{[-6, 0, 6].map(x => <path key={x} d={`M${x},2 q4,-5 0,-9 q-4,-4 0,-8`} fill="none" stroke="#8bc34a" strokeWidth={2.2} strokeLinecap="round" />)}</g>}
      {kind === 'zip' && <g><line x1={-13} y1={-9} x2={13} y2={-3} stroke="#5b5f66" strokeWidth={2} /><line x1={2} y1={-6} x2={2} y2={2} stroke="#5b5f66" strokeWidth={1.5} /><circle cx={2} cy={6} r={4} fill="#f6d2b8" /><path d="M-2,10 h8 l2,4 h-12z" fill="#e86a92" /></g>}
      {kind === 'snowman' && <g><circle cy={5} r={7} fill="#fff" stroke="#c9d6e2" /><circle cy={-5} r={5} fill="#fff" stroke="#c9d6e2" /><rect x={-4} y={-14} width={8} height={5} fill="#2b2b2e" /><path d="M0,-5 l4,1 -4,1z" fill="#f28a2e" /></g>}
      {kind === 'sofa' && <g><rect x={-12} y={-6} width={24} height={9} rx={3} fill="#3f8a8a" /><rect x={-13} y={0} width={26} height={8} rx={3} fill="#5fa8a8" /><rect x={-10} y={8} width={3} height={3} fill="#8a5a3a" /><rect x={7} y={8} width={3} height={3} fill="#8a5a3a" /></g>}
      {kind === 'roller' && <g><rect x={-11} y={-11} width={20} height={9} rx={3} fill="#e8a2b4" stroke="#c97c92" strokeWidth={1.2} /><path d="M9,-6.5 h3 v7 h-11 v4" fill="none" stroke="#6b6f74" strokeWidth={2} /><rect x={-2.5} y={4} width={5} height={10} rx={2} fill="#8a5a3a" /></g>}
      {kind === 'paw' && <g fill="#c25a7a"><ellipse cx={0} cy={4} rx={7} ry={6} /><circle cx={-7} cy={-3} r={3} /><circle cx={-2.5} cy={-7.5} r={3} /><circle cx={2.5} cy={-7.5} r={3} /><circle cx={7} cy={-3} r={3} /></g>}
      {kind === 'poo' && <g><ellipse cx={0} cy={8} rx={11} ry={4.5} fill="#6b4226" /><ellipse cx={0} cy={3} rx={8.5} ry={4} fill="#7a4d2c" /><ellipse cx={0} cy={-2} rx={5.5} ry={3.4} fill="#87573a" /><path d="M0,-5 q3,-4 1,-7" stroke="#87573a" strokeWidth={3} fill="none" strokeLinecap="round" /><circle cx={-3} cy={3} r={1.2} fill="#fff" /><circle cx={3} cy={3} r={1.2} fill="#fff" /></g>}
      {kind === 'ball' && <g><circle r={10} fill="#fff" stroke="#2b2b2e" /><path d="M0,-4 l3.5,2.5 -1.3,4 -4.4,0 -1.3,-4Z" fill="#2b2b2e" /></g>}
    </svg>;
  return <span style={grey ? { filter: 'grayscale(1)', opacity: 0.35, display: 'grid' } : { display: 'grid' }}><ItemIcon it={{ kind }} size={size} /></span>;
}

const roomName = r => (ROOMS[r] ? ROOMS[r].name : 'the house');
// Where is a thing? Turned into a tip she can hear.
function whereIs(W, it) {
  if (!it) return null;
  if (it.loc.s === 'pack') return 'It is in your bag!';
  if (it.loc.s === 'in') { const B = CONTAINERS[it.loc.box]; return `Look in the ${B.word} in ${roomName(B.room)}.`; }
  return `Look in ${roomName(it.room)}.`;
}
// Everything to do right now, most urgent first.
// stickers that only happen in Callie's House
export const CALLIE_ONLY = new Set(['controller', 'tablet', 'hunt', 'tidy', 'spider', 'spider5', 'spider10', 'lunch', 'feed', 'hide', 'goal', 'dance', 'stinky', 'lights', 'paint', 'magnet', 'burger', 'sleep', 'pumpkin', 'spooky', 'xmas', 'tree', 'snowman', 'ducks', 'school', 'helper', 'superhelper', 'post', 'visitor']);
export function todos(W) {
  const list = [];
  if (W.hide && W.hide.phase === 'seek') list.push({ id: 'hide', icon: 'star', text: `Find ${NAMES[W.hide.who]}!`, tip: `${NAMES[W.hide.who]} is hiding in ${roomName(W.hide.spot.room)}.` });
  if (W.room === 'shop' && W.shop && !W.shop.done) { const left = W.shop.list.filter(g => !W.shop.got.includes(g)); list.push({ id: 'shop', icon: 'shopping', text: left.length ? 'Shopping list' : 'Go to the till', tip: left.length ? `We still need ${left.map(g => GROC[g][0]).join(', ')}.` : 'Tap a till to pay.', shop: true }); }
  if (W.room === 'cafe' && W.cafe) list.push({ id: 'cafe', icon: W.cafe.order[0], text: W.cafe.ready ? 'Collect your order' : 'Waiting for your order', tip: W.cafe.ready ? 'Tap COLLECT on the counter.' : 'It will be ready soon.' });
  if (!W.fresh) for (const [who, q] of Object.entries(W.quests || {})) if (q.state === 'active') { const Q = QUESTS[who], it = W.items.find(i => i.quest === who); list.push({ id: 'q-' + who, icon: Q.kind, text: `Find ${Q.chip}`, tip: (whereIs(W, it) || '') + (who === 'connor' ? ' Then knock on his door.' : ' Then give it to Chloe.') }); }
  if (!W.fresh && isHalloween(W) && W.hw && W.hw.stage === 'asked') list.push({ id: 'spooky', icon: 'spooky', text: 'Get the spooky box', tip: 'It is in the cardboard boxes in the attic. Then give it to Mum.' });
  if (!W.fresh && isHalloween(W) && W.hw && !W.hw.pumpkin) list.push({ id: 'pumpkin', icon: 'pumpkin', text: 'Carve the pumpkin', tip: 'The pumpkin is in the kitchen, on top of the washing machine.' });
  if (!W.fresh && W.lightAsk && !W.out) { const n = LIGHT_ROOMS.filter(r => isLit(W, r)).length; const dark = LIGHT_ROOMS.filter(r => !isLit(W, r)).map(roomName);
    list.unshift({ id: 'lights', icon: 'bulb', text: 'Turn the lights on', count: `${n}/${LIGHT_ROOMS.length}`, tip: `Tap the light bulb button. Still dark: ${dark.join(', ')}.` }); }
  if (!W.fresh && W.bedAsk && !W.bedtime && !W.out && W.player === 'callie') list.unshift({ id: 'bed', icon: 'moon', text: 'Go to bed', tip: 'Go to your room, get into bed, then turn off the light.' });
  const A = W.asks;
  if (!W.fresh && A && A.school.state === 'active' && !W.out) {
    const kid = KIDS.includes(W.player) ? W.player : null;
    if (kid && !W.uniform[kid]) list.push({ id: 'uniform', icon: 'uniform', text: 'Put your uniform on', tip: kid === 'callie' ? 'Open the wardrobe in your room and tap School uniform.' : "Open the wardrobe in Chloe's room and tap School uniform." });
    else list.push({ id: 'school', icon: 'uniform', text: 'Go to school', tip: 'Go to the front door, then tap School on the map.' });
  }
  if (!W.fresh && A && A.ducks.state === 'active') { const br = W.items.find(i => i.kind === 'bread'); const got = br && br.loc.s === 'pack';
    list.push({ id: 'ducks', icon: 'duck', text: got ? 'Feed the ducks' : 'Get some bread', tip: got ? (W.room === 'park' ? 'Tap the ducks on the pond.' : 'Go to the park. Tap the front door, then Park.') : 'Look in the cupboard in the kitchen.' }); }
  if (!W.fresh && isChristmas(W) && W.xm && W.xm.stage === 'asked') list.push({ id: 'xmas', icon: 'xmasbox', text: 'Get the Christmas box', tip: 'It is in the cardboard boxes in the attic. Then give it to Mum.' });
  if (!W.fresh && isChristmas(W) && W.xm && W.xm.stage === 'decorated' && !W.xm.tree) list.push({ id: 'tree', icon: 'tree', text: 'Decorate the tree', tip: 'The tree is in the living room. Tap it!' });
  const job = !W.fresh && errandTodo(W, whereIs);
  if (job) list.push(job);
  for (const t of tjTodo(W)) list.push(t);
  for (const t of petTodos(W)) list.push(t);
  for (const t of moodTodos(W, id => whereNow(W, id))) list.push(t);
  if (W.letter && (!W.out || W.fresh)) list.push({ id: 'letter', icon: 'letter', text: 'Read the letter', tip: W.fresh ? 'It is on the mat inside your front door.' : 'It is on the mat by the front door.' });
  const target = !W.fresh && HUNT_ORDER[W.hunt.idx];
  if (target) list.push({ id: 'hunt', icon: target, text: `Find the ${target}`, count: `${W.hunt.idx + 1}/${HUNT_ORDER.length}`, tip: whereIs(W, W.items.find(i => i.kind === target)) || 'Look all round the house!' });
  return list;
}

export function JobsPanel({ W, start, onClose }) {
  const [tab, setTab] = useState(start === 'stickers' ? 'stickers' : 'todo');
  const list = todos(W), got = W.ach || {};
  // ideas: stickers not got yet, skipping ones already on the jobs list
  const covered = new Set(list.map(x => ({ 'q-connor': 'controller', 'q-chloe': 'tablet', uniform: 'school' }[x.id] || x.id)));
  const offSeason = s => (s.how.startsWith('At Christmas') && !isChristmas(W)) || (s.how.startsWith('At Halloween') && !isHalloween(W));
  const ideas = STICKERS.filter(s => !got[s.id] && !covered.has(s.id) && !offSeason(s) && !(W.fresh && CALLIE_ONLY.has(s.id))).slice(0, 3);
  const n = STICKERS.filter(s => got[s.id]).length;
  return <div className="sheet jobs" role="dialog" aria-label="Jobs" onPointerDown={e => e.stopPropagation()}>
    <div className="box-head">
      <div className="pair"><button className="tab-btn" aria-pressed={tab === 'todo'} onClick={() => { setTab('todo'); speak('Jobs', 'word'); }}>Jobs</button><button className="tab-btn" aria-pressed={tab === 'stickers'} onClick={() => { setTab('stickers'); speak('Stickers', 'word'); }}>Stickers <small>{n}/{STICKERS.length}</small></button></div>
      <button className="done" onClick={onClose}>Done</button>
    </div>
    {tab === 'todo' ? <div className="jobs-body">
      {list.map(j => <div key={j.id} className="job">
        <JobIcon kind={j.icon} size={40} />
        <button className="job-text" onClick={() => speak(j.text, 'narrator')}>{j.text}{j.count && <small> {j.count}</small>}</button>
        {j.tip && <button className="pill tip" onClick={() => { speak(j.tip, 'narrator'); SFX.pop(); }}>Tip</button>}
      </div>)}
      {!list.length && <p className="empty">No jobs right now. Try something new!</p>}
      {ideas.length > 0 && <><h3>Things to try</h3>{ideas.map(s => <div key={s.id} className="job idea"><JobIcon kind={s.icon} size={34} grey /><button className="job-text small" onClick={() => speak(s.how, 'narrator')}>{s.how}</button></div>)}</>}
    </div> : <div className="stickers">{STICKERS.map(s => { const on = !!got[s.id]; return <button key={s.id} className={'sticker' + (on ? ' on' : '')} onClick={() => speak(on ? `${s.title}! ${s.joke}` : s.how, 'narrator')}>
      <JobIcon kind={s.icon} size={44} grey={!on} /><b>{on ? s.title : '?'}</b>{on && <small>{s.joke}</small>}{!on && s.count && <small className="count">{Math.min(...s.count(W))}/{s.count(W)[1]}</small>}</button>; })}</div>}
  </div>;
}
