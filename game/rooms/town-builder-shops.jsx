// Town builder: 44 UK shop types, one parametric iso shopfront, plus the town map with plots.
// Exports window.TB (data), TBShopArt, TBShopGrid, TBCatalogue, TBTown.
const { P, pts, FloorPlane, FaceY, Box, Tag, IsoStage, shade } = window.Iso;

const CATS = ['Food shops', 'Takeaways & cafés', 'Everyday', 'Hobbies & fun', 'Home & garden', 'Style & beauty'];
// [id, type, sells, names, wall, sign, awning, goods, goods colours, floors, cost, extra, signInk]
const RAW = {
  'Food shops': [
    ['bakery', 'Bakery', 'Bread, cakes, sausage rolls', ['The Rolling Pin', 'Crusty Corner', 'Upper Crust'], '#efe2c4', '#b0603a', '#e9875a', 'round', ['#d9a35a', '#c98a42', '#e9c27a'], 2, 60],
    ['butcher', 'Butcher', 'Sausages, mince, bacon', ['Prime Cuts', 'Sizzle & Son', 'The Chop Shop'], '#fbf8f2', '#9a2f36', '#9a2f36', 'shelf', ['#d9677a', '#c4433c', '#f3a6a0'], 2, 70],
    ['greengrocer', 'Greengrocer', 'Fruit, veg, herbs', ['Fresh & Fruity', 'The Veg Box', 'Green Grocers'], '#e9dcc4', '#3f8a5a', '#3f8a5a', 'round', ['#e0524a', '#f2c94c', '#8fbf5a', '#e9875a'], 1, 50],
    ['fishmonger', 'Fishmonger', 'Fresh fish, prawns, crab', ['The Daily Catch', 'Plaice to Be', 'Hook & Line'], '#cfe3f2', '#2f5f8a', '#3f7fc4', 'shelf', ['#9fb6bf', '#e9875a', '#c9ced2'], 2, 65],
    ['cheese', 'Cheese shop', 'Cheddar, stilton, crackers', ['Say Cheese', 'The Big Cheese', 'Curds & Whey'], '#f6dfa8', '#8a6a2a', null, 'round', ['#f2c94c', '#e9c27a', '#fbf8f2'], 1, 60],
    ['deli', 'Deli', 'Olives, cold meats, pickles', ['The Larder', 'Pickle & Pantry', 'Good Things'], '#d9d5cf', '#3a3a3c', '#3a3a3c', 'tall', ['#3f8a5a', '#c4433c', '#e9c27a'], 2, 70],
    ['sweets', 'Sweet shop', 'Pick & mix, lollies, fudge', ['Sugar Rush', 'The Sweetie Jar', 'Pick n Mix'], '#f6d6de', '#c25a7a', '#f39ac6', 'tall', ['#f39ac6', '#f2c94c', '#9b7cc4', '#8fbf5a'], 1, 55],
    ['cakes', 'Cake shop', 'Cupcakes, birthday cakes, iced buns', ['Icing on Top', 'Buttercup Bakes', 'Sprinkles'], '#fbf8f2', '#c25a7a', '#e8a2b4', 'round', ['#f39ac6', '#fbf8f2', '#e9c27a'], 2, 65],
  ],
  'Takeaways & cafés': [
    ['chippy', 'Fish & chip shop', 'Fish, chips, mushy peas', ['The Golden Fryer', 'Chip Ahoy', 'The Codfather'], '#cfe3f2', '#3f7fc4', null, 'counter', ['#f2c94c', '#e9c27a', '#c9ced2'], 2, 75],
    ['chinese', 'Chinese takeaway', 'Noodles, spring rolls, rice', ['Golden Dragon', 'Lucky Star', 'Jade Garden'], '#e9dcc4', '#c4433c', null, 'counter', ['#f2c94c', '#c4433c', '#fbf8f2'], 2, 75],
    ['curry', 'Curry house', 'Curries, naan, poppadoms', ['The Spice Box', 'Masala Hut', 'Taj Palace'], '#f3c9b4', '#8a3f6a', '#e9875a', 'counter', ['#e9875a', '#f2c94c', '#c4433c'], 2, 75],
    ['pizza', 'Pizza place', 'Pizza, garlic bread, dips', ['Slice of Life', 'Mamma Mia', 'Dough Bros'], '#fbf8f2', '#3f8a5a', '#e0524a', 'counter', ['#e9875a', '#e0524a', '#f2c94c'], 1, 70],
    ['icecream', 'Ice cream parlour', 'Ice cream, sundaes, milkshakes', ['The Scoop', 'Sundae Best', 'Cone Zone'], '#cfeee4', '#c25a7a', '#f39ac6', 'round', ['#f39ac6', '#fbf8f2', '#8fbf5a', '#e9c27a'], 1, 65],
    ['tearoom', 'Tea room', 'Tea, scones, cake stands', ['The Teapot', 'Cream Tea Corner', "Mrs Bun's"], '#efe2c4', '#4a6a52', '#4a6a52', 'round', ['#fbf8f2', '#e8a2b4', '#e9c27a'], 2, 60],
    ['sandwich', 'Sandwich bar', 'Sandwiches, wraps, soup', ['The Butty Bar', 'Lunch Box', 'Between the Bread'], '#f6dfa8', '#b0603a', null, 'shelf', ['#e9c27a', '#8fbf5a', '#fbf8f2'], 1, 50],
    ['coffee', 'Coffee shop', 'Coffee, hot chocolate, muffins', ['The Daily Grind', 'Bean There', 'Mug Life'], '#e9dcc4', '#2f6f6a', '#e0524a', 'counter', ['#8a5a3a', '#fbf8f2', '#e9c27a'], 1, 60],
  ],
  'Everyday': [
    ['newsagent', 'Newsagent', 'Papers, comics, sweets', ['The Paper Shop', 'Read All About It', 'News & Things'], '#c9ced2', '#3f7fc4', null, 'shelf', ['#fbf8f2', '#e0524a', '#3f7fc4', '#f2c94c'], 2, 45],
    ['corner', 'Corner shop', 'Milk, bread, snacks', ['Open All Hours', 'Pop In', 'The Corner Shop'], '#e9dcc4', '#3f8a5a', '#f2c94c', 'shelf', ['#e0524a', '#f2c94c', '#3f7fc4', '#8fbf5a'], 2, 40],
    ['chemist', 'Chemist', 'Plasters, medicine, toothpaste', ['High St Chemist', 'Feel Better', 'Park Pharmacy'], '#fbf8f2', '#3f8a5a', null, 'shelf', ['#fbf8f2', '#bcdcea', '#8fbf5a'], 2, 60, 'cross'],
    ['post', 'Post office', 'Stamps, parcels, cards', ['First Class', 'Stamp & Send', 'The Post Box'], '#e9dcc4', '#c4433c', null, 'shelf', ['#f2c94c', '#c4433c', '#d8b484'], 2, 55],
    ['pound', 'Pound shop', 'A bit of everything', ['Bits & Bobs', 'Everything £1', 'Bargain Bin'], '#fbf8f2', '#9b4fb0', '#f2c94c', 'shelf', ['#e0524a', '#f2c94c', '#3f7fc4', '#8fbf5a', '#f39ac6'], 1, 40],
    ['launderette', 'Launderette', 'Washes, dries, ironing', ['Bubbles', 'Spin City', 'Suds'], '#cfe3f2', '#2f6f9a', null, 'wash', ['#fbf8f2', '#bcdcea'], 1, 50],
    ['phone', 'Phone shop', 'Phones, cases, chargers', ['Ring Ring', 'Call Me', 'Phone Home'], '#5b5f66', '#7a5aa8', null, 'screen', ['#3a3a3c', '#bcdcea', '#f39ac6'], 1, 70],
    ['computer', 'Computer shop', 'Laptops, games, headphones', ['Byte Size', 'Pixel Palace', 'Plug In'], '#c9ced2', '#3a3a3c', null, 'screen', ['#3a3a3c', '#5fa8d8', '#8fbf5a'], 1, 80],
  ],
  'Hobbies & fun': [
    ['toys', 'Toy shop', 'Teddies, games, building bricks', ['Toy Box', 'Play Time', 'The Toy Cupboard'], '#f6dfa8', '#e0524a', '#3f7fc4', 'shelf', ['#e0524a', '#3f7fc4', '#f2c94c', '#8fbf5a'], 2, 70],
    ['books', 'Bookshop', 'Books, maps, bookmarks', ['Chapter One', 'The Book Nook', 'Page Turners'], '#4a6a52', '#efe2c4', null, 'shelf', ['#c4433c', '#3f7fc4', '#f2c94c', '#8a5a3a'], 2, 60, null, '#3b2a24'],
    ['games', 'Comic & games shop', 'Comics, board games, cards', ['Level Up', 'Game On', 'Dice & Dragons'], '#3d4a6b', '#f2c94c', null, 'shelf', ['#9b7cc4', '#e0524a', '#5fa8d8'], 2, 65, null, '#3b2a24'],
    ['music', 'Music shop', 'Guitars, drums, keyboards', ['Rock On', 'The Music Box', 'Hi-Fi'], '#3a3a3c', '#e0524a', null, 'tall', ['#c96a4a', '#e9c27a', '#fbf8f2'], 2, 75],
    ['sports', 'Sports shop', 'Football kits, trainers, balls', ['Goal!', 'Kit Bag', 'Top Sport'], '#c9ced2', '#3f7fc4', null, 'hang', ['#e0524a', '#3f7fc4', '#fbf8f2'], 1, 70],
    ['bikes', 'Bike shop', 'Bikes, helmets, puncture kits', ['Spokes', 'Pedal Power', 'Chain Reaction'], '#cfe7dc', '#2f8a76', null, 'wheels', ['#3a3a3c', '#e0524a'], 1, 65],
    ['crafts', 'Craft shop', 'Wool, paint, glitter', ['Knit & Natter', 'Glue & Glitter', 'The Craft Corner'], '#ddd2f0', '#7a5aa8', '#9b7cc4', 'round', ['#f39ac6', '#5fa8d8', '#f2c94c', '#8fbf5a'], 2, 55],
  ],
  'Home & garden': [
    ['florist', 'Florist', 'Flowers, bouquets, plants', ['Petals', 'Bloom & Grow', 'The Flower Pot'], '#fbf8f2', '#4a6a52', '#f39ac6', 'flowers', ['#f39ac6', '#e0524a', '#f2c94c', '#9b7cc4'], 1, 60],
    ['hardware', 'Hardware shop', 'Hammers, nails, paint', ['Nuts & Bolts', 'Fix It', 'The Tool Shed'], '#e9dcc4', '#c4622a', null, 'tall', ['#5b5f66', '#e9875a', '#3f7fc4'], 2, 60],
    ['garden', 'Garden centre', 'Plants, seeds, gnomes', ['Green Fingers', 'The Potting Shed', 'Grow Your Own'], '#d8e5b8', '#3f8a5a', '#8fbf5a', 'flowers', ['#8fbf5a', '#6b9a44', '#f2c94c'], 1, 80],
    ['furniture', 'Furniture shop', 'Sofas, beds, lamps', ['Comfy Corner', 'Sit Down', 'Home Sweet Home'], '#c9c6bc', '#8a5a3a', null, 'shelf', ['#3f8a8a', '#e3b04f', '#d9465f'], 2, 85],
    ['charity', 'Charity shop', 'Second-hand clothes, books, toys', ['Second Chance', 'Pre-Loved', 'Helping Hands'], '#efe2c4', '#2f8a76', null, 'hang', ['#e8a2b4', '#5fa8d8', '#f2c94c'], 2, 35],
    ['antiques', 'Antiques shop', 'Old clocks, teapots, treasures', ['Bygones', 'Old & Gold', 'The Curiosity Shop'], '#6e4529', '#c9a54a', null, 'shelf', ['#c9a54a', '#fbf8f2', '#9a4a3a'], 2, 70, null, '#3b2a24'],
    ['pets', 'Pet shop', 'Pet food, toys, fish tanks', ['Paws & Claws', 'The Pet Pad', 'Whiskers'], '#cfe3f2', '#c4622a', '#f2c94c', 'shelf', ['#e9875a', '#5fa8d8', '#8fbf5a'], 1, 65],
  ],
  'Style & beauty': [
    ['clothes', 'Clothes shop', 'Tops, jeans, jackets', ['Threads', 'The Wardrobe', 'Style Street'], '#fbf8f2', '#3a3a3c', null, 'hang', ['#e0524a', '#5fa8d8', '#f2c94c', '#f39ac6'], 2, 75],
    ['shoes', 'Shoe shop', 'Trainers, wellies, school shoes', ['Happy Feet', 'Sole Mates', 'Best Foot Forward'], '#e9dcc4', '#b0603a', null, 'shelf', ['#3a3a3c', '#e0524a', '#fbf8f2'], 2, 70],
    ['hair', 'Hairdresser', 'Haircuts, colours, blow-dries', ['Hair We Go', 'Curl Up & Dye', 'The Snip'], '#f6d6de', '#c25a7a', null, 'salon', ['#bcdcea', '#3a3a3c'], 1, 60],
    ['barber', 'Barber', 'Short back & sides, beard trims', ['Short Back & Sides', 'Fade Away', 'Clippers'], '#3a3a3c', '#fbf8f2', null, 'salon', ['#bcdcea', '#9a2f36'], 1, 55, 'pole', '#3b2a24'],
    ['jeweller', 'Jewellers', 'Rings, watches, necklaces', ['Sparkle', 'Gold Star', 'The Gem Box'], '#3d4a6b', '#c9a54a', null, 'round', ['#c9a54a', '#fbf8f2', '#9b7cc4'], 2, 90, null, '#3b2a24'],
    ['optician', 'Opticians', 'Glasses, sunglasses, eye tests', ['Eye Spy', 'Specs Appeal', 'See Clearly'], '#fbf8f2', '#2f6f9a', null, 'specs', ['#3a3a3c', '#c96a4a', '#3f7fc4'], 2, 70],
    ['nails', 'Nail bar', 'Nail painting, gems, glitter', ['Polished', 'Nail It', 'Glitter Tips'], '#ddd2f0', '#c25a7a', '#f39ac6', 'tall', ['#e0524a', '#f39ac6', '#9b7cc4', '#5fa8d8'], 1, 55],
  ],
};
const SHOPS = [];
CATS.forEach(cat => RAW[cat].forEach(([id, type, sells, names, wall, sign, awn, goods, gc, floors, cost, extra, ink]) =>
  SHOPS.push({ id, type, cat, sells, names, wall, sign, awn, goods, gc, floors, cost, extra, ink: ink || '#fbf8f2' })));
const BY = Object.fromEntries(SHOPS.map(s => [s.id, s]));
const ROOFS = ['#9a4a3a', '#7a4a3a', '#5b5f66', '#8a5a3a'];
const W = 2.0, D = 1.6;
const heightOf = (s) => s.floors === 2 ? 2.2 : 1.3;

function Goods({ kind, gc, x0, y0, w, h }) {
  const c = (i) => gc[i % gc.length], out = [];
  const shelves = [y0 + 36, y0 + h - 4];
  if (kind === 'shelf' || kind === 'tall' || kind === 'screen' || kind === 'specs') {
    shelves.forEach((sy, r) => {
      out.push(<rect key={'s' + r} x={x0 + 4} y={sy} width={w - 8} height={3} fill="#a8876a" />);
      for (let i = 0; i < 6; i++) {
        const ix = x0 + 10 + i * ((w - 20) / 6), k = i + r * 2;
        if (kind === 'shelf') out.push(<rect key={r + '-' + i} x={ix} y={sy - (k % 2 ? 16 : 22)} width={12} height={k % 2 ? 16 : 22} rx={2} fill={c(k)} />);
        if (kind === 'tall') out.push(<g key={r + '-' + i}><rect x={ix + 2} y={sy - 26} width={9} height={26} rx={3} fill={c(k)} /><rect x={ix + 4} y={sy - 31} width={5} height={6} fill={shade(c(k), -0.25)} /></g>);
        if (kind === 'screen' && i % 2 === 0) out.push(<g key={r + '-' + i}><rect x={ix} y={sy - 26} width={26} height={24} rx={3} fill={c(0)} /><rect x={ix + 3} y={sy - 23} width={20} height={16} fill={c(1 + (k % 2))} /></g>);
        if (kind === 'specs' && i % 2 === 0) out.push(<g key={r + '-' + i} fill="none" stroke={c(k)} strokeWidth={3}><circle cx={ix + 6} cy={sy - 10} r={6} /><circle cx={ix + 22} cy={sy - 10} r={6} /><line x1={ix + 12} y1={sy - 10} x2={ix + 16} y2={sy - 10} /></g>);
      }
    });
  } else if (kind === 'round') {
    shelves.forEach((sy, r) => {
      out.push(<rect key={'s' + r} x={x0 + 4} y={sy} width={w - 8} height={3} fill="#a8876a" />);
      for (let i = 0; i < 6; i++) out.push(<circle key={r + '-' + i} cx={x0 + 16 + i * ((w - 24) / 6)} cy={sy - 9} r={8.5} fill={c(i + r)} stroke={shade(c(i + r), -0.2)} strokeWidth={1.5} />);
    });
  } else if (kind === 'hang') {
    out.push(<rect key="rail" x={x0 + 6} y={y0 + 10} width={w - 12} height={3} fill="#8a8f96" />);
    for (let i = 0; i < 5; i++) { const ix = x0 + 14 + i * ((w - 28) / 5); out.push(<polygon key={i} points={`${ix + 4},${y0 + 14} ${ix + 16},${y0 + 14} ${ix + 20},${y0 + 56} ${ix},${y0 + 56}`} fill={c(i)} />); }
  } else if (kind === 'flowers') {
    for (let i = 0; i < 5; i++) { const ix = x0 + 12 + i * ((w - 24) / 5); out.push(<g key={i}><rect x={ix} y={y0 + h - 22} width={16} height={20} fill="#9aa1a6" /><circle cx={ix + 4} cy={y0 + h - 28} r={7} fill={c(i)} /><circle cx={ix + 12} cy={y0 + h - 32} r={7} fill={c(i + 1)} /><circle cx={ix + 8} cy={y0 + h - 40} r={6} fill="#6b9a44" /></g>); }
  } else if (kind === 'counter') {
    out.push(<rect key="menu" x={x0 + 14} y={y0 + 8} width={w - 28} height={26} rx={3} fill="#3a3a3c" />);
    [0, 1, 2].forEach(i => out.push(<rect key={'m' + i} x={x0 + 22} y={y0 + 13 + i * 7} width={w - 44 - i * 14} height={3} fill={c(i)} />));
    out.push(<rect key="ctr" x={x0 + 4} y={y0 + h - 26} width={w - 8} height={26} fill={c(2)} />);
    out.push(<rect key="top" x={x0 + 4} y={y0 + h - 30} width={w - 8} height={5} fill="#c9ced2" />);
  } else if (kind === 'wash') {
    for (let i = 0; i < 3; i++) { const ix = x0 + 8 + i * ((w - 16) / 3); out.push(<g key={i}><rect x={ix} y={y0 + h - 36} width={32} height={34} rx={3} fill={c(0)} stroke="#9aa1a6" strokeWidth={2} /><circle cx={ix + 16} cy={y0 + h - 18} r={10} fill={c(1)} stroke="#9aa1a6" strokeWidth={3} /></g>); }
  } else if (kind === 'wheels') {
    [0, 1].forEach(i => { const ix = x0 + 14 + i * 52; out.push(<g key={i} fill="none" stroke={c(0)} strokeWidth={3}><circle cx={ix + 6} cy={y0 + h - 14} r={11} /><circle cx={ix + 36} cy={y0 + h - 14} r={11} /><polyline points={`${ix + 6},${y0 + h - 14} ${ix + 18},${y0 + h - 34} ${ix + 30},${y0 + h - 34} ${ix + 36},${y0 + h - 14}`} stroke={c(1)} /></g>); });
  } else if (kind === 'salon') {
    [0, 1].forEach(i => { const ix = x0 + 14 + i * 52; out.push(<g key={i}><rect x={ix} y={y0 + 8} width={36} height={34} rx={14} fill={c(0)} stroke="#fbf8f2" strokeWidth={3} /><rect x={ix + 6} y={y0 + h - 30} width={24} height={14} rx={4} fill={c(1)} /><rect x={ix + 6} y={y0 + h - 44} width={24} height={16} rx={4} fill={c(1)} /><rect x={ix + 16} y={y0 + h - 16} width={4} height={14} fill="#8a8f96" /></g>); });
  }
  return <g>{out}</g>;
}

function Roof({ x, y, w, d, z, rise, c }) {
  const my = y + d / 2;
  return <g>
    <polygon points={pts([[x - 0.1, y - 0.1, z], [x + w + 0.1, y - 0.1, z], [x + w + 0.1, my, z + rise], [x - 0.1, my, z + rise]])} fill={shade(c, -0.1)} />
    <polygon points={pts([[x - 0.1, y + d + 0.1, z], [x + w + 0.1, y + d + 0.1, z], [x + w + 0.1, my, z + rise], [x - 0.1, my, z + rise]])} fill={c} stroke={shade(c, -0.25)} strokeWidth={1.5} />
    <polygon points={pts([[x + w + 0.1, y - 0.1, z], [x + w + 0.1, y + d + 0.1, z], [x + w + 0.1, my, z + rise]])} fill={shade(c, -0.3)} />
  </g>;
}

function ShopBuilding({ shop, x = 0, y = 0, name, sign, pavement = true }) {
  const s = typeof shop === 'string' ? BY[shop] : shop; if (!s) return null;
  const h = heightOf(s), gy = (h - 1.3) * 100, sg = sign || s.sign, label = name ?? s.names[0];
  const fs = Math.min(19, 176 / Math.max(1, label.length * 0.52));
  const roofC = ROOFS[SHOPS.indexOf(s) % ROOFS.length];
  const fy = y + D;
  return <g>
    {pavement && <FloorPlane z={0.004} x={x - 0.15} y={y - 0.1}><rect width={(W + 0.3) * 100} height={(D + 0.75) * 100} fill="#c9c6bc" /></FloorPlane>}
    <Box x={x} y={y} w={W} d={D} h={h} c={[s.floors === 2 ? '#9aa1a6' : '#9aa1a6', s.wall, shade(s.wall, -0.16)]} />
    <FaceY y={fy} x0={x} z1={h}>
      {s.floors === 2 && [26, 134].map(wx => <rect key={wx} x={wx} y={18} width={40} height={50} fill="#bcdcea" stroke="#fbf8f2" strokeWidth={4} />)}
      <rect x={0} y={gy} width={200} height={28} fill={sg} />
      {s.extra === 'cross' && <g fill={s.ink}><rect x={10} y={gy + 9} width={18} height={10} /><rect x={14} y={gy + 5} width={10} height={18} /></g>}
      <text x={s.extra === 'cross' ? 110 : 100} y={gy + 20} textAnchor="middle" fontSize={fs} fontWeight="800" fill={s.ink} fontFamily="'Baloo 2', sans-serif">{label}</text>
      <rect x={12} y={gy + 40} width={118} height={78} fill="#e3eff2" stroke="#fbf8f2" strokeWidth={4} />
      <Goods kind={s.goods} gc={s.gc} x0={12} y0={gy + 40} w={118} h={78} />
      <rect x={144} y={gy + 40} width={42} height={90} fill={shade(sg, -0.12)} stroke="#fbf8f2" strokeWidth={3} />
      <rect x={151} y={gy + 48} width={28} height={36} fill="#bcdcea" />
      <circle cx={178} cy={gy + 94} r={3} fill="#e3c26a" />
      {s.extra === 'pole' && <g><rect x={132} y={gy + 44} width={8} height={56} rx={4} fill="#fbf8f2" />{[0, 1, 2, 3].map(i => <rect key={i} x={132} y={gy + 50 + i * 12} width={8} height={5} fill={i % 2 ? '#3f7fc4' : '#c4433c'} />)}</g>}
    </FaceY>
    {s.awn && <g>
      <polygon points={pts([[x + 0.1, fy, 0.98], [x + 1.32, fy, 0.98], [x + 1.32, fy + 0.38, 0.74], [x + 0.1, fy + 0.38, 0.74]])} fill={s.awn} />
      {[0, 1, 2].map(i => <polygon key={i} points={pts([[x + 0.3 + i * 0.4, fy, 0.98], [x + 0.5 + i * 0.4, fy, 0.98], [x + 0.5 + i * 0.4, fy + 0.38, 0.74], [x + 0.3 + i * 0.4, fy + 0.38, 0.74]])} fill="#fbf8f2" />)}
    </g>}
    {s.floors === 2 && <Roof x={x} y={y} w={W} d={D} z={h} rise={0.75} c={roofC} />}
    {s.floors === 2 && <Box x={x + 1.5} y={y + 0.3} z={h + 0.2} w={0.22} d={0.22} h={0.6} c={['#b55a3e', '#9a4a3a', '#843f31']} />}
  </g>;
}

function bounds() {
  const c = [];
  [-0.15, W + 0.15].forEach(a => [-0.1, D + 0.65].forEach(b => [0, 3.1].forEach(z => c.push(P(a, b, z)))));
  const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}
const VB = bounds();
function TBShopArt({ shop = 'bakery', name, sign, height = '100%' }) {
  return <svg viewBox={`${VB[0] - 6} ${VB[1] - 6} ${VB[2] + 12} ${VB[3] + 12}`} width="100%" height={height} style={{ display: 'block' }}>
    <ShopBuilding shop={shop} name={name} sign={sign} />
  </svg>;
}

const coin = (sz) => <span style={{ width: sz, height: sz, borderRadius: '50%', background: '#f2c94c', boxShadow: 'inset 0 -2px 0 #d9a92c', flex: 'none' }} />;
function Card({ s, on, art = 170, showNames }) {
  return <div style={{ background: '#fff', borderRadius: 20, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: "'Baloo 2', sans-serif", color: '#3b2a24',
    boxShadow: on ? '0 0 0 4px #2f8a76, 0 10px 24px rgba(59,42,36,.14)' : 'inset 0 0 0 2px #efe2d0' }}>
    <div style={{ height: art, borderRadius: 14, background: '#e6efe0' }}><TBShopArt shop={s.id} /></div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{s.type}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 800 }}>{coin(15)}{s.cost}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#8a6f62', lineHeight: 1.25, textWrap: 'pretty' }}>{s.sells}</div>
    {showNames && <div style={{ fontSize: 13, fontWeight: 700, color: '#2f8a76', lineHeight: 1.25 }}>{s.names.join(' · ')}</div>}
  </div>;
}

function TBShopGrid({ cat = 'Food shops', sel }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
    {SHOPS.filter(s => cat === 'All' || s.cat === cat).map(s => <Card key={s.id} s={s} on={s.id === sel} art={150} />)}
  </div>;
}

function TBCatalogue() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 36, fontFamily: "'Baloo 2', sans-serif", color: '#3b2a24' }}>
    {CATS.map(cat => <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><span style={{ fontSize: 32, fontWeight: 800 }}>{cat}</span><span style={{ fontSize: 18, fontWeight: 700, color: '#8a6f62' }}>{RAW[cat].length} shops</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 14 }}>
        {SHOPS.filter(s => s.cat === cat).map(s => <Card key={s.id} s={s} art={190} showNames />)}
      </div>
    </div>)}
  </div>;
}

// ---------- Town map: two rows of 7 plots on a high street ----------
const RX = 17.6, RY = 10.2;
const plotXY = (p) => [0.6 + (+p.slice(1) - 1) * 2.4, p[0] === 'A' ? 2.2 : 6.3];
const PLOTS = ['A', 'B'].flatMap(r => [1, 2, 3, 4, 5, 6, 7].map(i => r + i));

function Tree({ x, y, s = 1 }) {
  const [tx, ty] = P(x, y, 0), [cx, cy] = P(x, y, 1.2 * s);
  return <g><ellipse cx={tx} cy={ty} rx={20 * s} ry={8 * s} fill="rgba(40,60,20,.2)" /><rect x={tx - 3} y={cy} width={6} height={ty - cy} fill="#7a5a3a" /><circle cx={cx} cy={cy - 6} r={24 * s} fill="#6b9a44" /><circle cx={cx + 10 * s} cy={cy - 16 * s} r={16 * s} fill="#8fbf5a" /></g>;
}
function EmptyPlot({ p, on }) {
  const [x, y] = plotXY(p), [mx, my] = P(x + 1, y + 0.8, 0.02);
  return <g>
    <FloorPlane z={0.006} x={x - 0.15} y={y - 0.1}><rect width={230} height={235} fill={on ? '#cfe8d6' : '#9cc95a'} stroke={on ? '#2f8a76' : '#fbf8f2'} strokeWidth={on ? 10 : 6} strokeDasharray={on ? 'none' : '22 14'} rx={10} /></FloorPlane>
    <ellipse cx={mx} cy={my} rx={26} ry={15} fill={on ? '#2f8a76' : 'rgba(251,248,242,.85)'} />
    <text x={mx} y={my + 8} textAnchor="middle" fontSize={26} fontWeight="800" fill={on ? '#fff' : '#5f7a4a'} fontFamily="'Baloo 2', sans-serif">+</text>
  </g>;
}
function TBTown({ placed = [], sel, ghost, cx = 1204, cy = 905, zoom = 0.7, dim }) {
  const at = Object.fromEntries(placed.map(p => [p.plot, p]));
  const row = (r) => PLOTS.filter(p => p[0] === r).map(p => {
    const [x, y] = plotXY(p);
    if (at[p]) return <ShopBuilding key={p} shop={at[p].id} name={at[p].name} sign={at[p].sign} x={x} y={y} />;
    if (ghost && ghost.plot === p) return <g key={p}><EmptyPlot p={p} on /><g opacity={0.82}><ShopBuilding shop={ghost.id} name={ghost.name} x={x} y={y} pavement={false} /></g></g>;
    return <EmptyPlot key={p} p={p} on={p === sel} />;
  });
  const tags = PLOTS.filter(p => at[p]).map(p => { const [x, y] = plotXY(p), h = heightOf(BY[at[p].id]); return <Tag key={p} at={[x + 1, y + 0.8, h + (BY[at[p].id].floors === 2 ? 1.05 : 0.35)]} text={at[p].name} />; });
  return <IsoStage cx={cx} cy={cy} zoom={zoom} label="Town builder map">
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#6b4a2e" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#5a3d26" />
    <FloorPlane><rect width={RX * 100} height={RY * 100} fill="#86b955" /></FloorPlane>
    <FloorPlane z={0.003}>
      {[[380, 70], [790, 70]].map(([py, ph], i) => <rect key={'pv' + i} x={0} y={py} width={RX * 100} height={ph} fill="#c9c6bc" />)}
      {[450, 860].map((ry, i) => <g key={'rd' + i}><rect x={0} y={ry} width={RX * 100} height={100} fill="#5b5f66" /><line x1={0} x2={RX * 100} y1={ry + 50} y2={ry + 50} stroke="#fbf8f2" strokeWidth={5} strokeDasharray="30 24" /></g>)}
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={790 + i * 20} y={455} width={12} height={90} fill="#fbf8f2" />)}
    </FloorPlane>
    <Tree x={0.3} y={0.6} s={0.9} /><Tree x={8.2} y={0.5} /><Tree x={16.9} y={0.8} s={0.9} />
    {row('A')}
    {[2.9, 7.7, 12.5, 17.0].map((x, i) => <Tree key={i} x={x} y={5.9} s={0.75} />)}
    {row('B')}
    {tags}
    {dim && <rect x={-2000} y={-2000} width={8000} height={8000} fill="#3b2a24" opacity={0.45} />}
  </IsoStage>;
}

window.TB = { CATS, SHOPS, BY };
Object.assign(window, { TBShopArt, TBShopGrid, TBCatalogue, TBTown });
