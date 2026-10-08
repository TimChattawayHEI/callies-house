import pathlib, re
R = pathlib.Path('rooms')
order = ['iso-kit','house-builder-items','hallway-scene','parents-room-scene','chloe-room-scene','bathroom-scene','attic-scene','downstairs-hall-scene','kitchen-scene','toilet-scene','living-room-scene','middle-room-scene','back-room-scene','middle-back-room-scene','garden-scene',
         'npc-kit','town-map-scene','park-scene','cafe-scene','supermarket-scene','school-scene','nanny-house-scene','nanny-garden-scene','clothes-shop-scene','pet-shop-scene']

def must(s, a, b, name, count=1):
    n = s.count(a)
    assert n >= 1, f'patch not found in {name}: {a[:70]}'
    return s.replace(a, b) if count == 0 else s.replace(a, b, count)

def patch(name, s):
    if name == 'npc-kit':
        # the game drives the clock: no hooks, read the shared scene time
        s = re.sub(r'function useClock\(frozen\) \{.*?\n\}\n', 'function useClock(frozen) { return frozen ? 0 : (window.__sceneT || 0); }\n', s, count=1, flags=re.S)
    if name == 'park-scene':
        s = must(s, '{slideU < 0.75 && kid({ at: slidePos(slideU / 0.75),', '{kid({ at: slidePos(Math.min(1, slideU / 0.75)),', name)
        s = must(s, "{zipU < 0.95 && <g>{ln(zp.top, zp.seat, '#5b5f66', 3, 'rope')}{kid({ at: zp.seat, look: LOOKS.boyGreen, pose: 'sit', ph: 5, shadow: false, armL: 172, armR: 172 })}</g>}",
                 "{<g>{window.__parkZip ? kid({ at: [10.15, 2.35, 0], look: LOOKS.boyGreen, pose: 'wave', ph: 5 }) : <>{ln(zp.top, zp.seat, '#5b5f66', 3, 'rope')}{kid({ at: zp.seat, look: LOOKS.boyGreen, pose: 'sit', ph: 5, shadow: false, armL: 172, armR: 172 })}</>}</g>}", name)
        s = must(s, '<Swing x={2.0} a={swing2} />', '<Swing x={2.0} a={window.__parkSwing != null ? window.__parkSwing : swing2} />', name)
        s = must(s, '    <FrontFences />\n', '    <Fence x0={PLAY.x1} y0={PLAY.y0} x1={PLAY.x1} y1={PLAY.y1} />\n    <Fence x0={PLAY.x0} y0={PLAY.y1} x1={PLAY.gate0} y1={PLAY.y1} />\n    <Fence x0={PLAY.gate1} y0={PLAY.y1} x1={PLAY.x1} y1={PLAY.y1} />\n', name)
    if name == 'school-scene':
        s = must(s, '<a href="Town Map.dc.html" style={{ cursor: \'pointer\' }}>', '<g>', name, 0)
        s = s.replace('</a>', '</g>')
    if name == 'nanny-house-scene':
        for h in ['Town Map.dc.html', 'Nanny Garden.dc.html']:
            s = s.replace('<a href="%s" style={{ cursor: \'pointer\' }}>' % h, '<g>')
        s = s.replace('</a>', '</g>')
        assert '<a ' not in s
        # Nanny and Grandad are real characters in the game, so the scene's own figures come out
        s = must(s, "    {adult([1.4, 3.7, 0], { ...LOOKS.gran, hair: '#cfcac0', apron: '#f39ac6' }, { facing: 'back', pose: 'reach' })}\n", '', name)
        s = must(s, "<LeatherSofa sitter={adult([5.0, 8.6, 0.57], { ...LOOKS.grandad, style: 'short', hair: '#a9a59c', glasses: false }, { pose: 'sit', armL: 40, armR: 40 })} />", '<LeatherSofa sitter={null} />', name)
        s += "\nwindow.NannyDownScene = ({ showLabels = false }) => Downstairs({ T: useClock(false), L: showLabels, zoom: 0.75, goUp: null });\nwindow.NannyUpScene = ({ showLabels = false }) => Upstairs({ L: showLabels, zoom: 0.75, goDown: null });\n"
    if name == 'nanny-garden-scene':
        s = s.replace('<a href="Nanny and Grandads House.dc.html" style={{ cursor: \'pointer\' }}>', '<g>').replace('</a>', '</g>')
        assert '<a ' not in s
    if name == 'town-map-scene':
        s = must(s, "<a key={l.id} href={l.href} onClick={(e) => { if (onPick) { e.preventDefault(); onPick(l.id); } }}", "<g key={l.id} data-loc={l.id}", name)
        s = must(s, '</a>; })}', '</g>; })}', name)
    if name == 'clothes-shop-scene':
        # the game has its own shop panel, so export just the room (no state, no panel)
        s += """
function ClothesScene({ showLabels = false }) {
  const T = useClock(false), L = showLabels, onOpen = () => {};
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: PINK, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#f6e6e0' };
  return <IsoStage cx={1074} cy={826} zoom={0.68} label="Clothes Shop">
    <Slab RX={RX} RY={RY} /><Floor /><Walls />
    <Cubbies onOpen={onOpen} /><ShoeWall onOpen={onOpen} /><MirrorLogo /><FittingRooms />
    {adult({ at: [3.4, 1.05, 0], look: { ...LOOKS.mumBun, ...STAFF }, ph: 1, facing: 'back', pose: 'reach' })}
    {kid({ at: [12.1, 1.2, 0], look: LOOKS.girlPink, ph: 2, facing: 'back', pose: 'wave' })}
    <Rail x0={3} x1={6} y={3.2} cat="tops" path={G_TEE} len="TOPS" onOpen={onOpen} />
    <Rail x0={8} x1={11} y={3.2} cat="dresses" path={G_DRESS} len="DRESSES" onOpen={onOpen} />
    {kid({ at: [4.4, 4.0, 0], look: LOOKS.girlCurly, ph: 4, facing: 'back', pose: 'reach' })}
    {adult({ at: [9.6, 4.1, 0], look: LOOKS.mum, ph: 5, facing: 'back', pose: 'reach' })}
    <Rail x0={3} x1={6} y={5.6} cat="bottoms" path={G_TROUSER} len="TROUSERS" onOpen={onOpen} />
    <Rail x0={8} x1={11} y={5.6} cat="tops" path={G_LONG} len="HOODIES" onOpen={onOpen} />
    <Box x={2.6} y={7.6} w={2.6} d={1.0} h={0.3} c={WHITE} />
    <Mannequin at={[3.3, 8.1, 0.3]} o={{ body: 'berry-hoodie', legs: 'denim-jeans', shoes: 'white-trainers' }} />
    <Mannequin at={[4.6, 8.1, 0.3]} o={{ body: 'lilac-sundress', legs: 'white-leggings', shoes: 'gold-sandals' }} />
    <CapsTable onOpen={onOpen} />
    {kid({ at: [9.2, 9.3, 0], look: LOOKS.boyCap, ph: 7, facing: 'back', pose: 'reach' })}
    {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'reach' })}
    <Till onOpen={onOpen} cat="tops" />
    <FrontWalls />
    <Tag show={L} at={[RX + 0.1, (DOOR.y0 + DOOR.y1) / 2, 1.4]} text="Exit to town" />
  </IsoStage>;
}
window.ClothesScene = ClothesScene;
"""
    if name == 'pet-shop-scene':
        # pets she has adopted have gone home, so they leave the shop
        own = "!(window.__petsOwned || []).includes"
        s = must(s, "const fish = PETS.filter(p => p.cat === 'fish');", "const fish = PETS.filter(p => p.cat === 'fish' && %s(p.id));" % own, name)
        s = must(s, "const birds = PETS.filter(p => p.cat === 'birds');", "const birds = PETS.filter(p => p.cat === 'birds' && %s(p.id));" % own, name)
        s = must(s, "const pets = ['pip', 'clover', 'shelly', 'nibbles'].map(id => BY_ID[id]);", "const pets = ['pip', 'clover', 'shelly', 'nibbles'].map(id => BY_ID[id]);\n  const gone = id => (window.__petsOwned || []).includes(id);", name)
        s = must(s, "<g transform={`translate(${x + 150 + Math.sin(T * 0.4 + i)", "{!gone(p.id) && <g transform={`translate(${x + 150 + Math.sin(T * 0.4 + i)", name)
        s = must(s, "flip={Math.cos(T * 0.4 + i) < 0 && p.kind === 'tortoise'} /></g>", "flip={Math.cos(T * 0.4 + i) < 0 && p.kind === 'tortoise'} /></g>}", name)
        s = must(s, "const dogs = PETS.filter(p => p.cat === 'dogs').map(", "const dogs = PETS.filter(p => p.cat === 'dogs' && %s(p.id)).map(" % own, name)
        s = must(s, "{at([9.75, 5.05, 1.07], <PetArt p={m}", "{%s('mittens') && at([9.75, 5.05, 1.07], <PetArt p={m}" % own, name)
        s = must(s, "{at([9.55, 4.9, 1.99], <PetArt p={s}", "{%s('snowy') && at([9.55, 4.9, 1.99], <PetArt p={s}" % own, name)
        s = must(s, "{at([10.9, 5.85, 0.14], <PetArt p={g}", "{%s('ginger') && at([10.9, 5.85, 0.14], <PetArt p={g}" % own, name)
        s += """
function PetShopRoom({ showLabels = false }) {
  const T = useClock(false), onOpen = () => {};
  const kid = (p) => <Person s={0.78} T={T} {...p} />;
  const adult = (p) => <Person s={1.08} T={T} {...p} />;
  const STAFF = { top: ACC, legs: '#2a2a2c', shoes: '#2a2a2c', apron: '#e4f0e4' };
  return <IsoStage cx={1074} cy={826} zoom={0.68} label="Pet Shop">
    <Slab RX={RX} RY={RY} /><Floor /><Walls /><Shelves />
    <Aquarium T={T} onOpen={onOpen} /><BirdCages T={T} onOpen={onOpen} /><Hutches T={T} onOpen={onOpen} />
    {adult({ at: [3.0, 1.3, 0], look: LOOKS.mum, ph: 1, facing: 'back', pose: 'reach' })}
    {adult({ at: [1.8, 3.4, 0], look: { ...LOOKS.dad, ...STAFF }, ph: 2, pose: 'stand' })}
    {kid({ at: [8.0, 1.3, 0], look: LOOKS.boyCap, ph: 3, facing: 'back', pose: 'wave' })}
    <Pen T={T} onOpen={onOpen} />
    <CatTree T={T} onOpen={onOpen} />
    {kid({ at: [3.6, 8.1, 0], look: LOOKS.boyRed, ph: 6, facing: 'back', pose: 'wave' })}
    {adult({ at: [12.6, 7.6, 0], look: { ...LOOKS.girlBlue, ...STAFF, long: false, dress: false }, ph: 8, pose: 'stand' })}
    <Till onOpen={onOpen} />
    <FrontWalls />
  </IsoStage>;
}
window.PetShopRoom = PetShopRoom;
window.PetKit = { PetArt, PETS, BY_ID, SIZE, CATS, HEART };
"""
    return s

src = """import React from 'react';
window.React = React;
// Scenes are called as plain functions by the game, so hooks are replaced with simple stand-ins.
const __memo = new Map(); let __mk = '', __mi = 0;
window.__sceneBegin = k => { __mk = k; __mi = 0; };
const FakeReact = { ...React, useMemo: f => { const k = __mk + ':' + (__mi++); if (!__memo.has(k)) __memo.set(k, f()); return __memo.get(k); },
  useState: v => [typeof v === 'function' ? v() : v, () => {}], useEffect: () => {}, useLayoutEffect: () => {}, useRef: v => ({ current: v }), useCallback: f => f };
"""
for n in order:
    body = patch(n, (R/(n+'.jsx')).read_text())
    src += f"\n;(function(){{\nconst React = FakeReact;\n{body}\n}})();\n"
src += """
export const SCENES = {
  hallway: window.HallwayScene, parents: window.ParentsRoomScene, chloe: window.ChloeRoomScene, bathroom: window.BathroomScene,
  attic: window.AtticScene, downhall: window.DownstairsHallScene, kitchen: window.KitchenScene, toilet: window.ToiletScene,
  living: window.LivingRoomScene, middle: window.MiddleBackRoomScene, garden: window.GardenScene,
  park: window.ParkScene, cafe: window.CafeScene, shop: window.SupermarketScene, school: window.SchoolScene,
  nannydown: window.NannyDownScene, nannyup: window.NannyUpScene, nannygarden: window.NannyGardenScene, clothes: window.ClothesScene, pets: window.PetShopRoom,
};
export const TownMapScene = window.TownMapScene;
export const NPC = window.NPC;
export const Iso = window.Iso;
export const HB = window.HBItems;
export const PetKit = window.PetKit;
"""
pathlib.Path('rooms.gen.jsx').write_text(src)
print('ok')
