import json
R = json.load(open('rooms.json'))
BG = {'Slab','Floor','Carpet','TileFloor','PlankTileFloor','Floorboards','Lawn','Patio','SteppingStones','Walls','HallWalls','GableWall','KneeWall','RoofSlope','RidgeBeam','Cobwebs','EavesShadow','Moonlight','WindowLight','HatchFootprint','HallDoorway','BayDoorway','KitchenDoorway','FrontDoorway','BathMat','ToiletMat','PatternRug','FloorCushion','FloorClothes','HouseWall','GardenWall','Stairs','EnsuiteRoom','EnsuiteSink','EnsuiteShower','ArchJamb','AlcoveShelves','ArchToLivingRoom','Tag','MiddleDoorway','KitchenWindow','DownpipeAndLantern','ClimbingShrub','SinkWindow','GardenDoor','KitchenBackDoor','FrenchDoors','BayDoors','LivingRoomDoor','ToiletDoor','ConnorDoor','ParentsDoor','ChloeDoor','EntryDoor','LouvreDoor','AtticHatch','PaddlingPool','FloorHatch','FloorLantern','Outbuilding'}
FLOORHIT = {'Floor','Carpet','TileFloor','PlankTileFloor','Floorboards','Lawn','Patio','SteppingStones','WindowLight','Moonlight','EavesShadow','HatchFootprint','HallDoorway','BayDoorway','KitchenDoorway','FrontDoorway','BathMat','ToiletMat','PatternRug','FloorCushion','FloorClothes','Slab'}
FRONT = {'FrontWalls','FrontWall','FrontFences'}
# per-room overrides: key -> dict(sort=[x0,x1,y0,y1] | None, block=[...] | None, kind=...)
O = {
 'hallway': {'_block': [[2.95,5.65,0,1.05]]},
 'parents': {'StandFan': dict(sort=[6.35,6.85,1.05,1.55], block=[6.35,6.85,1.05,1.55]), 'ChestOfDrawers': dict(block=[3,4.2,0.05,1.1]),
             'FittedWardrobes': dict(sort=[0,1.2,1.8,7], block=[0,1.2,1.8,7])},
 'chloe': {'BridgeCupboards': dict(kind='wall', block=[1.3,1.45,0,0.6]), 'BedToys': dict(sort=[0.05,1.37,0.05,2.7], block=None)},
 'bathroom': {'BasinUnit': dict(sort=[1.45,2.31,0,0.55], block=[1.45,2.31,0,0.55]), 'Toilet': dict(sort=[2.75,3.37,0,0.75], block=[2.75,3.37,0,0.75]),
              'DrawerTower': dict(sort=[0.02,0.44,0.97,2.6], block=[0.02,0.44,0.97,2.6]), 'ShowerScreens': dict(sort=[0,1.45,0,1.21])},
 'attic': {'RockingHorse': dict(sort=[3.5,5.2,1.9,2.3], block=[3.5,5.2,1.9,2.3]), 'DressUpRail': dict(kind='furn', sort=[0.75,2.7,3.55,3.85], block=[0.75,2.7,3.55,3.85]),
           'DressUpMirror': dict(kind='furn', sort=[3.2,3.9,3.85,4.15], block=[3.2,3.9,3.85,4.15]), 'Cobwebs': dict(kind='bg'), 'RockingHorse_': {},
           'DustMotes': dict(kind='overlay'), 'GoldGlow': dict(kind='overlay'), 'LanternGlow': dict(kind='overlay'), 'FairyLights': dict(kind='overlay'), 'host:rect': dict(kind='overlay'), 'GlowingEyes': dict(kind='hidden'),
           '_block': [[5.4,6.4,3.4,4.3]]},
 'downhall': {'Staircase': dict(sort=[1.6,7.5,0,0.91], block=[1.6,7.5,0,0.91]), 'RadiatorCover': dict(block=[2.94,4.66,2.0,2.4]), 'RadiatorTop': dict(kind='furn', sort=[2.94,4.66,2.0,2.4])},
 'kitchen': {'RadiatorWorktop': dict(sort=[5.48,6.2,0.72,2.07], block=[5.48,6.2,0.72,2.07]), 'FrontCounter': dict(sort=[0.77,3.12,2.25,3.2], block=[0.77,3.12,2.25,3.2]),
             'Microwave': dict(kind='furn', sort=[2.25,3.0,2.6,3.05]), 'Kettle': dict(kind='furn', sort=[0.95,1.2,2.7,2.95]), 'MilkBottle': dict(kind='furn', sort=[1.3,1.45,2.82,2.97]), 'CoffeeMachine': dict(kind='furn', sort=[1.5,1.92,2.6,3.0])},
 'toilet': {'Toilet': dict(sort=[0,0.8,0.4,1.1], block=[0,0.8,0.4,1.1]), 'BasinUnit': dict(sort=[1.65,2.51,0,0.55], block=[1.65,2.51,0,0.55])},
 'living': {'Fireplace': dict(sort=[1.72,3.48,0.42,0.9], block=[1.72,3.48,0.42,0.9]), 'TableClutter': dict(sort=[2.9,4.2,2.3,3.35]), 'FloorLampAndPlant': dict(block=[0.3,1.15,4.85,5.35])},
 'middle': {'ArtEasel': dict(kind='furn', sort=[1.65,2.45,0.05,0.4], block=[1.65,2.45,0.05,0.4]), 'CoatRack': dict(kind='furn', sort=[6.85,7.75,0.4,0.7], block=[6.85,7.75,0.4,0.7]),
            'OpeningPiers': dict(sort=[3.55,3.8,0,3.6], block=None), 'Trainers': dict(block=None), 'SchoolBag': dict(block=None),
            '_block': [[3.5,3.85,0,0.4],[3.5,3.85,3.2,3.6]]},
 'garden': {'Tree': dict(kind='furn', sort=[0.6,1.0,1.5,1.9], block=[0.55,1.05,1.45,1.95]), 'KitchenBackDoor': dict(kind='bg'), 'ShoppingBag': dict(kind='furn', sort=[6.1,6.45,0.25,0.45], block=None),
            'DeckChair': dict(kind='wall'), 'Outbuilding': dict(kind='furn', sort=[-1.4,1.05,2.6,4.6], block=[-1.4,1.05,2.6,4.6]), 'GardenWasteBags': dict(block=[0.25,1.45,2,2.65])},
}
out = {}
for room, d in R.items():
    if room in ('park', 'cafe', 'shop', 'school', 'nannydown', 'nannyup', 'nannygarden', 'clothes'): continue
    ov = O.get(room, {})
    items = []
    after_overlay = False
    for it in d['items']:
        k = it['key']; base = k.split('#')[0]
        bb, low = it['bb'], it['low']
        o = ov.get(k, ov.get(base, {}))
        if base.startswith('host:') and k not in ov: kind = 'bg'
        elif base in FRONT: kind = 'front'
        elif base in BG: kind = 'bg'
        elif bb is None: kind = 'bg'
        elif bb[5] <= 0.06: kind = 'bg'
        elif bb[4] >= 0.8 or low is None: kind = 'wall'
        else: kind = 'furn'
        kind = o.get('kind', kind)
        sort = o.get('sort', (low or (bb[:4] if bb else None)) if kind == 'furn' else None)
        if 'block' in o: block = o['block']
        elif kind == 'furn' and low and bb and bb[5] > 0.25 and (low[1]-low[0]) > 0.05 and (low[3]-low[2]) > 0.05 and bb[4] < 0.3: block = low
        else: block = None
        hit = 'floor' if base in FLOORHIT else ('none' if kind in ('front',) or base in ('Walls','HallWalls','GableWall','KneeWall','RoofSlope','RidgeBeam','Cobwebs','HouseWall','GardenWall','Tag') or base.startswith('host:') else 'obj')
        if kind == 'overlay': hit = 'none'
        items.append(dict(key=k, kind=kind, sort=sort, block=block, hit=hit))
    out[room] = dict(cx=d['cx'], cy=d['cy'], zoom=d['zoom'], items=items, extraBlock=ov.get('_block', []))
json.dump(out, open('roomdata.json','w'))
for room, d in out.items():
    print(room, ' | '.join(f"{i['key']}:{i['kind'][0]}{'B' if i['block'] else ''}" for i in d['items'] if i['kind']!='bg'))

# ---------------- town locations (park, cafe, shop, school) ----------------
def F(sort=None, block='same', kind='furn'):
    d = dict(kind=kind, sort=sort)
    d['block'] = sort if block == 'same' else block
    return d
LOC = {
 'park': {
   'Hedges': dict(kind='wall'), 'BackFences': dict(kind='wall'), 'NearRailings': dict(kind='front'),
   'Tree': F([0.1,0.3,-0.4,-0.2], None), 'Tree#2': F([9.45,9.75,0.05,0.35]), 'Tree#3': F([-0.4,-0.2,10.4,10.6], None), 'Tree#4': F([15.3,15.5,-0.4,-0.2], None),
   'SwingFrame': F([1.3,4.5,1.05,2.15], None), 'Swing': F([1.78,2.22,1.6,1.7], None), 'Swing#2': F([3.18,3.62,1.6,1.7], None),
   'TowerBack': F([5.93,7.67,1.03,2.77], [5.85,7.75,0.95,2.85]), 'TowerFront': F([6.1,7.67,2.63,3.2], None), 'Slide': F([6.75,7.45,2.7,5.3], [6.75,7.45,3.0,5.3]),
   'ZipLine': F([10.53,15.7,0.83,2.11], None), 'MerryGoRound': F([1.85,3.8,4.05,6.0], [1.75,3.85,3.95,6.05]), 'Sandpit': F([7.9,9.9,3.4,5.1]),
   'SeeSaw': F([4.6,7.6,6.7,7.1]), 'Reeds': F([12.04,15.31,4.4,5.9], None),
   'Duck': F([13.5,13.7,6.4,6.5], None), 'Duck#2': F([11.7,11.9,5.5,5.6], None), 'Duck#3': F([14.3,14.5,5.4,5.5], None),
   'Fence': F([10.2,10.25,0.8,8.2], [10.1,10.3,0.8,8.3]), 'Fence#2': F([0.8,4.4,8.2,8.25], [0.8,4.4,8.1,8.3]), 'Fence#3': F([5.4,10.2,8.2,8.25], [5.4,10.3,8.1,8.3]),
   'Bench': F([14.2,15.7,8.36,8.85]), 'Bench#2': F([10.6,12.1,8.66,9.15]), 'Bench#3': F([0.2,1.7,11.26,11.75]), 'Bin': F([13.6,13.98,8.6,8.98]),
   'VanBack': F([1,4.6,9,10.5], [1.0,5.75,9.0,10.5]), 'host:g': F([2.2,2.4,9.8,10.0], None), 'VanFront': F([1.5,5.71,9.1,10.5], None),
   'EntranceGate': F([15.88,16.13,9.08,11.15], None), 'host:line': dict(kind='hidden'),
   '_block': [[11.0,15.2,4.7,6.7],[11.6,14.6,4.3,7.1],[0,10.3,0,0.85],[0,0.85,0,8.3],
              [1.2,1.4,0.95,1.15],[1.2,1.4,2.05,2.25],[4.4,4.6,0.95,1.15],[4.4,4.6,2.05,2.25],[10.5,11.5,0.8,1.8],[15.1,15.75,0.9,1.7],
              [15.88,16.12,9.08,9.32],[15.88,16.12,10.28,10.52]],
 },
 'cafe': {
   'BackCounter': F([1,6.8,0,0.6], None), 'CoffeeMachine': F([2.6,3.9,0.05,0.55], None), 'Grinder': F([4.15,6.04,0.1,0.5], None),
   'ServingCounter': F([1.6,6.8,1.3,2.0], None), 'Till': F([2.0,2.5,1.4,1.95], None), 'CakeDisplay': F([4.3,6.3,1.35,1.95], None), 'CollectPoint': F([6.45,6.6,1.45,2.01], None),
   'Table#3': F([3.42,4.18,4.42,5.18]), 'Table#4': F([5.32,6.08,3.22,3.98]), 'Table': F([0.85,1.65,2.35,3.05]), 'Table#2': F([0.85,1.65,4.65,5.35]),
   'FaceX': F([0.95,1.35,4.85,5.15], None), 'FloorPlane': F([3.85,4.07,4.85,5.07], None), 'FaceY': F([7.6,8.06,3.9,3.97], None),
   'WindowBench': F([0,0.65,1.7,6.6]),
   '_block': [[0.95,6.9,0,2.05]],
 },
 'shop': {
   'VegStand': F([0,1.4,1,8.7], [0,1.45,1,8.75]),
   'Trolley': F([3.35,3.9,4.25,5.1], None), 'Trolley#2': F([12.11,12.66,2.5,3.35], None), 'Box': F([8.38,8.82,6.6,7.0], None),
   'TillShopping': F([4.7,5.58,9.75,9.93], None), 'TillShopping#2': F([7.3,8.18,9.75,9.93], None), 'FaceY': F([13.4,14.4,9.55,9.6], None),
   'TrolleyBay': F([16.2,16.75,9.0,10.7]), 'Trolley#3': F([4.2,4.75,10.4,11.25]),
   **{('AisleSign' + ('' if i == 0 else '#%d' % (i + 1))): F([3.07 + i * 1.75, 4.07 + i * 1.75, 7.25, 7.35], None) for i in range(8)},
   '_block': [[0.2,0.7,8.2,8.7]],
 },
 'school': {
   'Floors': dict(kind='bg'), 'BackWalls': dict(kind='bg'), 'MainEntrance': dict(kind='bg'), 'PlaygroundMarkings': dict(kind='bg'), 'LibraryRug': dict(kind='bg'), 'Hoops': dict(kind='bg'), 'PlaygroundDoor': dict(kind='bg'),
   'ReadingCorner': F([6.2,7.2,3.2,4.2], [6.25,7.0,3.25,3.75]), 'Easel': F([14.85,15.55,4.5,4.65]), 'ClimbRopes': F([20.1,21.5,0.95,1.05], None), 'GymMat': F([16.8,18.4,1.8,2.9], None),
   'Cones': F([16.9,19.5,4.5,4.7], None), 'Ball': F([20.2,20.4,4.7,4.9], None), 'Ball#2': F([30.4,30.6,4.3,4.5], None),
   'WaterFountain': F([10.4,10.9,7.15,7.55]),
   'LowWallX': F([7.9,8.1,0,7], None), 'LowWallX#2': F([15.9,16.1,0,7], None), 'LowWallY': F([0,22,6.9,7.1], None), 'LowWallY#2': F([0,22,9.4,9.6], None),
   'LowWallX#3': F([5.9,6.1,9.5,16], None), 'LowWallX#4': F([10.9,11.1,9.5,16], None), 'LowWallX#5': F([21.9,22.1,0,16], None), 'LowWallY#3': F([0,22,15.9,16.1], None),
   'Beanbag': F([6.9,7.7,11.7,12.3], None), 'Beanbag#2': F([9.3,10.1,12.3,12.9], None),
   'ServingCounter': F([11.5,17.1,10,10.75]), 'LunchTable': F([12.2,20.8,11.1,12.35], [12.2,20.8,11.6,12.35]), 'LunchTable#2': F([12.2,20.8,12.9,14.15], [12.2,20.8,13.4,14.15]),
   'LunchTable#3': F([12.2,20.8,14.5,15.75], [12.2,20.8,15.0,15.75]), 'FrontBench': F([12.2,20.8,12.55,12.85], None), 'FrontBench#2': F([12.2,20.8,14.35,14.65], None),
   'PlayFence': dict(kind='wall'), 'PlayFence#2': dict(kind='front'), 'PlayFence#3': dict(kind='front'), 'host:ellipse': dict(kind='overlay'),
   'PlayTree': F([31.0,31.4,0.4,0.8]), 'PlayTree#2': F([22.6,23.0,15.0,15.4]),
   '_block': [[7.9,8.1,0,7],[15.9,16.1,0,7],[0,5,6.9,7.1],[6,13,6.9,7.1],[14,18,6.9,7.1],[19.5,22,6.9,7.1],
              [0,2,9.4,9.6],[4.5,6.5,9.4,9.6],[10.5,18,9.4,9.6],[20,22,9.4,9.6],[5.9,6.1,9.5,12.6],[5.9,6.1,13.6,16],[10.9,11.1,9.5,16],
              [21.9,22.1,0,7.2],[21.9,22.1,9.3,16],[0,1.5,15.9,16.1],[3.5,22,15.9,16.1]],
 },
 'nannydown': {
   'Shell': dict(kind='bg'), 'Slab': dict(kind='bg'),
   'LowWallX': F([7.9,8.1,0,7], None), 'LowWallY': F([0,8,6.9,7.1]), 'LowWallX#2': F([14.1,14.3,0,4.9], None), 'LowWallY#2': F([14.2,18,4.8,5.0]),
   'LowWallX#3': F([14.1,14.3,4.9,7.1], None), 'LowWallY#3': F([14.2,18,7.0,7.2], None), 'LowWallX#4': F([7.9,8.1,7,9.3]), 'LowWallX#5': F([7.9,8.1,12.1,14]),
   'LowWallX#6': dict(kind='front'), 'LowWallY#4': dict(kind='front'), 'Windowsill': dict(kind='front'),
   'PedestalSink': F([15.6,16.68,0.02,1.12], [15.6,16.2,0.02,0.5]), 'StairsUp': F([11.35,14.2,4.8,9.2], [11.35,14.2,4.9,9.2]), 'UnderStairs': F([14.5,17.8,5,6.8], None),
   'Lamp': F([7.6,7.9,7.3,7.6]), 'Lamp#2': F([0.4,0.6,12.5,12.7], None), 'Lamp#3': F([15.7,15.9,9.75,9.95], None), 'FloorPlane#3': F([0.15,1.15,12.4,13.4], None),
   '_block': [[7.9,8.1,0,4.9],[7.9,8.1,6.6,7],[14.1,14.3,0,0.8],[14.1,14.3,2.6,4.9],[14.2,18,4.9,7.1]],
 },
 'nannyup': {
   'Shell': dict(kind='bg'), 'Slab': dict(kind='bg'), 'Stairwell': dict(kind='bg'),
   'Cylinder': F([9.6,10.6,0.3,1.3]), 'PedestalSink': F([16.9,17.98,0.02,1.12], [16.9,17.5,0.02,0.5]), 'FaceY': F([3.7,4.7,6.28,6.34], None),
   'Lamp': F([0.2,0.4,0.4,0.6], None), 'Lamp#2': F([0.2,0.4,8.1,8.3], None), 'Lamp#3': F([0.2,0.4,11.3,11.5], None), 'Lamp#4': F([13.3,13.5,8.6,8.8], None),
   'Teddy': F([0.45,0.65,1.65,1.85], None), 'Teddy#2': F([16.4,16.6,8.6,8.8], None), 'Box#11': F([3.6,3.78,11.4,11.72], None), 'Box#12': F([3.85,4.03,11.4,11.72], None),
   'LowWallX': F([9.1,9.3,0,6.1], None), 'LowWallY': F([0,9.2,6.0,6.2]), 'LowWallX#2': F([12.3,12.5,0,6.05], None), 'LowWallY#2': F([9.2,12.4,2.4,2.6], None),
   'LowWallY#3': F([12.4,18,5.95,6.15]), 'LowWallX#3': F([9.1,9.3,6.1,14], None), 'LowWallY#4': F([9.2,18,8.2,8.4], None),
   'LowWallX#4': dict(kind='front'), 'LowWallY#5': dict(kind='front'),
   '_block': [[9.1,9.3,0,3.2],[9.1,9.3,4.6,6.1],[12.3,12.5,0,3.5],[12.3,12.5,4.9,6.05],[9.2,10.2,2.4,2.6],[11.4,12.4,2.4,2.6],[12.4,18,6.05,8.3],
              [9.1,9.3,6.1,6.6],[9.1,9.3,8.0,14],[9.2,9.6,8.2,8.4],[11.0,18,8.2,8.4]],
 },
 'clothes': {
   'Walls': dict(kind='bg'), 'FittingRooms': dict(kind='wall'), 'FrontWalls': dict(kind='front'),
   'Cubbies': F([1,6,0,0.55]), 'ShoeWall': F([7,10.2,0,0.35]),
   '_block': [[0,1.6,1,6.3],[0.15,1.05,6.95,8.45],[0.25,0.95,9.35,10.05]],
 },
 'pets': {
   'Walls': dict(kind='bg'), 'FrontWalls': dict(kind='front'), 'Floor': dict(kind='bg'),
   'Shelves': F([10.5,14.5,0,0.45]), 'Aquarium': F([0.8,5.2,0,0.8]), 'BirdCages': F([6.4,9.7,0,0.7]), 'Hutches': F([0,1.1,1,6.4]),
   'Pen': F([2.6,7.2,4,7.42]), 'CatTree': F([9.0,11.25,4.3,6.1], None), 'Till': F([11.6,14.2,8,8.75]),
   '_block': [[9.0,10.2,4.3,5.4],[10.5,11.25,5.5,6.1]],
 },
 'nannygarden': {
   'HouseWall': dict(kind='wall'), 'SideWall': dict(kind='wall'), 'LowX': dict(kind='front'), 'LowY': dict(kind='front'),
   'Seating': F([0.15,3.05,0.35,2.85], None), 'Fountain': F([8.05,10.35,2.75,5.05]),
   '_block': [[0.15,0.8,0.35,2.75],[1.45,2.35,1.05,1.95],[1.55,2.15,2.25,2.85],[2.45,3.05,1.2,1.8],[0,18,0,0.3]],
 },
}
for room, ov in LOC.items():
    d = R[room]; items = []
    for it in d['items']:
        k = it['key']; base = k.split('#')[0]; bb, low = it['bb'], it['low']
        o = ov.get(k, {})
        if base == 'Pot' and bb and k not in ov: o = F([bb[0] - 0.3, bb[0] + 0.3, bb[2] - 0.25, bb[2] + 0.25])
        if base == 'Person': kind = 'person'
        elif base in ('Tag', 'ClickTag') or base in ('host:line',): kind = 'hidden'
        elif base in FRONT: kind = 'front'
        elif base in BG or bb is None or bb[5] <= 0.06: kind = 'bg'
        elif low is None and ((bb[0] == bb[1] and bb[0] < 0.1) or (bb[2] == bb[3] and bb[2] < 0.1)): kind = 'wall'
        else: kind = 'furn'
        kind = o.get('kind', kind)
        sort = o['sort'] if 'sort' in o else ((low or bb[:4]) if kind == 'furn' else None)
        if 'block' in o: block = o['block']
        elif kind == 'furn' and low and bb[5] > 0.3 and (low[1]-low[0]) > 0.05 and (low[3]-low[2]) > 0.05 and bb[4] < 0.3: block = low
        else: block = None
        hit = 'npc' if kind == 'person' else ('none' if kind in ('front', 'overlay', 'hidden') or base in ('Walls', 'Slab', 'Floor', 'Floors', 'BackWalls', 'Grass', 'Paths', 'Hedges') else ('floor' if kind == 'bg' else 'obj'))
        rec = dict(key=k, kind=kind, sort=sort, block=block, hit=hit)
        if it.get('at'): rec['at'] = it['at']
        if bb: rec['bb'] = bb
        items.append(rec)
    out[room] = dict(cx=d.get('cx'), cy=d.get('cy'), zoom=d['zoom'], items=items, extraBlock=ov.get('_block', []))
json.dump(out, open('roomdata.json','w'))
print('locations ok')
