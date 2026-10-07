// The house: every room's doors, bounds, cupboards, words, plus Callie's own room (from the first version).
import React, { memo } from 'react';
import { SCENES, Iso } from '../rooms.gen.jsx';
import ROOMDATA from '../roomdata.json';
import { P, pts, lerp, screenRect } from './core.js';
import { Plush, Cloth } from './items.jsx';

const { Plane, FloorPlane, FaceX, FaceY, Box } = Iso;

/* ---------------- doors ---------------- */
// at: where you stand to go through; in: where you walk to after arriving; zone: tapping the floor here uses the door.
// exit/enter: scripted walks with height (stairs, ladder). label: word sign over the doorway.
export const ROOMS = {
  callie: {
    name: 'My room', box: [420, 20, 1080, 1040], bounds: [0.32, 6.72, 0.32, 5.72],
    doors: [{ id: 'hall', to: 'hallway', toDoor: 'messy', at: [6.5, 0.42], in: [6.2, 1.3], zone: [5.95, 7.0, -0.3, 0.7], hit: ['door'], label: { at: [6.5, 0, 3.75], text: 'Hall' } }],
  },
  hallway: {
    name: 'Upstairs', bounds: [0.3, 8.0, 0.3, 1.95],
    doors: [
      { id: 'messy', to: 'callie', toDoor: 'hall', at: [7.95, 1.1], in: [7.3, 1.1], zone: [7.6, 8.5, 0.62, 1.58], label: { at: [8.3, 1.1, 1.25], text: 'My room' } },
      { id: 'chloe', to: 'chloe', toDoor: 'hall', at: [0.42, 1.1], in: [1.0, 1.1], zone: [-0.3, 0.7, 0.62, 1.58], hit: ['ChloeDoor'], special: 'chloe', label: { at: [0, 1.1, 4.65], text: 'Chloe' } },
      { id: 'connor', at: [0.975, 0.45], zone: [0.5, 1.45, -0.3, 0.55], hit: ['ConnorDoor'], special: 'connor', label: { at: [0.97, 0, 4.65], text: 'Connor' } },
      { id: 'parents', to: 'parents', toDoor: 'hall', at: [6.875, 0.42], in: [6.875, 1.1], zone: [6.4, 7.35, -0.3, 0.6], hit: ['ParentsDoor'], label: { at: [6.87, 0, 4.65], text: 'Mum and Dad' } },
      { id: 'bathroom', to: 'bathroom', toDoor: 'hall', at: [3.9, 1.93], in: [3.9, 1.45], zone: [3.4, 4.4, 1.8, 2.6], label: { at: [3.9, 2.3, 1.25], text: 'Bath' } },
      { id: 'stairs', to: 'downhall', toDoor: 'stairs', at: [2.72, 0.5], zone: [2.95, 5.65, 0, 1.05], hit: ['Stairs'],
        exit: [[3.0, 0.5, 0], [4.5, 0.5, -1.15], [5.4, 0.5, -1.9]], enter: [[5.2, 0.5, -1.7], [3.0, 0.5, 0], [2.6, 0.85, 0]], label: { at: [4.1, 0.5, 1.1], text: 'Down' } },
      { id: 'attic', to: 'attic', toDoor: 'hatch', at: [2.6, 1.35], hit: ['AtticHatch', 'HatchFootprint'], ladder: true,
        exit: [[2.6, 0.75, 0], [2.6, 0.75, 3.3]], enter: [[2.6, 0.75, 3.1], [2.6, 0.75, 0], [2.6, 1.45, 0]], label: { at: [2.6, 0.7, 4.75], text: 'Attic' } },
    ],
  },
  parents: {
    name: 'Mum and Dad', bounds: [0.3, 7.8, 0.3, 6.8],
    doors: [{ id: 'hall', to: 'hallway', toDoor: 'parents', at: [6.075, 0.42], in: [6.075, 1.2], zone: [5.6, 6.55, -0.3, 0.6], hit: ['EntryDoor'], label: { at: [6.075, 0, 4.65], text: 'Hall' } }],
  },
  chloe: {
    name: "Chloe's room", bounds: [0.3, 4.4, 0.3, 2.8],
    doors: [{ id: 'hall', to: 'hallway', toDoor: 'chloe', at: [4.35, 1.225], in: [3.7, 1.225], zone: [4.1, 5.0, 0.75, 1.7], label: { at: [4.7, 1.225, 1.0], text: 'Hall' } }],
  },
  bathroom: {
    name: 'Bathroom', bounds: [0.3, 4.0, 0.3, 2.6],
    doors: [{ id: 'hall', to: 'hallway', toDoor: 'bathroom', at: [3.95, 1.825], in: [3.3, 1.825], zone: [3.7, 4.6, 1.35, 2.3], label: { at: [4.3, 1.825, 1.0], text: 'Hall' } }],
  },
  attic: {
    name: 'Attic', bounds: [0.3, 7.0, 1.0, 4.8],
    doors: [{ id: 'hatch', to: 'hallway', toDoor: 'attic', at: [5.9, 3.05], zone: [5.4, 6.4, 3.4, 4.3], hit: ['FloorHatch'],
      exit: [[5.9, 3.85, 0], [5.9, 3.85, -2.6]], enter: [[5.9, 3.85, -2.2], [5.9, 3.85, 0], [5.6, 3.0, 0]], label: { at: [5.9, 3.85, 1.6], text: 'Down' } }],
  },
  downhall: {
    name: 'Hall', bounds: [0.3, 7.3, 0.3, 2.2],
    doors: [
      { id: 'living', to: 'living', toDoor: 'hall', at: [0.775, 0.42], in: [0.775, 1.2], zone: [0.3, 1.25, -0.3, 0.6], hit: ['LivingRoomDoor'], label: { at: [0.78, 0, 4.65], text: 'Living room' } },
      { id: 'toilet', to: 'toilet', toDoor: 'hall', at: [0.42, 1.225], in: [1.1, 1.225], zone: [-0.3, 0.6, 0.75, 1.7], hit: ['ToiletDoor'], label: { at: [0, 1.22, 4.65], text: 'Toilet' } },
      { id: 'front', at: [1.075, 2.05], zone: [0.55, 1.6, 2.0, 2.9], hit: ['FrontDoorway'], special: 'front', label: { at: [1.07, 2.5, 1.2], text: 'Out' } },
      { id: 'kitchen', to: 'kitchen', toDoor: 'hall', at: [7.25, 1.625], in: [6.6, 1.625], zone: [7.0, 7.9, 1.15, 2.1], label: { at: [7.6, 1.62, 1.2], text: 'Kitchen' } },
      { id: 'stairs', to: 'hallway', toDoor: 'stairs', at: [1.3, 0.5], zone: [1.6, 7.5, 0, 0.91], hit: ['Staircase'],
        exit: [[1.55, 0.45, 0], [1.8, 0.45, 0.3], [7.0, 0.45, 4.0], [7.4, 0.45, 4.2]], enter: [[7.3, 0.45, 4.15], [1.8, 0.45, 0.3], [1.5, 0.45, 0], [1.25, 1.1, 0]], label: { at: [5.2, 0.45, 4.6], text: 'Up' } },
    ],
  },
  kitchen: {
    name: 'Kitchen', bounds: [0.3, 6.0, 0.3, 3.0], ceiling: true,
    doors: [
      { id: 'hall', to: 'downhall', toDoor: 'kitchen', at: [5.95, 2.7], in: [5.2, 2.7], zone: [5.8, 6.7, 2.25, 3.15], label: { at: [6.3, 2.7, 1.2], text: 'Hall' } },
      { id: 'garden', to: 'garden', toDoor: 'kitchen', at: [0.42, 1.825], in: [1.1, 1.825], zone: [-0.3, 0.6, 1.35, 2.3], hit: ['GardenDoor'], label: { at: [0, 1.825, 3.75], text: 'Garden' } },
      { id: 'middle', to: 'middle', toDoor: 'kitchen', at: [3.1, 0.35], in: [3.1, 1.1], zone: [2.55, 3.7, -0.3, 0.5], hit: ['ArchToLivingRoom'], label: { at: [3.05, 0, 3.25], text: 'Middle room' } },
    ],
  },
  toilet: {
    name: 'Toilet', bounds: [0.3, 3.0, 0.25, 1.3],
    doors: [{ id: 'hall', to: 'downhall', toDoor: 'toilet', at: [2.95, 0.775], in: [2.3, 0.775], zone: [2.7, 3.6, 0.3, 1.25], label: { at: [3.3, 0.775, 1.0], text: 'Hall' } }],
  },
  living: {
    name: 'Living room', bounds: [0.3, 7.3, 0.3, 5.3],
    doors: [
      { id: 'middle', to: 'middle', toDoor: 'living', at: [7.25, 1.675], in: [6.6, 1.675], zone: [7.0, 7.9, 0.75, 2.6], label: { at: [7.6, 1.675, 1.2], text: 'Middle room' } },
      { id: 'hall', to: 'downhall', toDoor: 'living', at: [5.4, 5.22], in: [5.4, 4.9], zone: [4.85, 5.8, 5.0, 5.9], label: { at: [5.33, 5.6, 1.2], text: 'Hall' } },
    ],
  },
  middle: {
    name: 'Middle room', bounds: [0.3, 10.1, 0.3, 3.4], ceiling: true,
    doors: [
      { id: 'living', to: 'living', toDoor: 'middle', at: [8.45, 0.42], in: [8.45, 1.2], zone: [7.75, 9.15, -0.3, 0.6], hit: ['BayDoors'], label: { at: [8.45, 0, 3.85], text: 'Living room' } },
      { id: 'kitchen', to: 'kitchen', toDoor: 'middle', at: [6.85, 3.35], in: [6.85, 2.7], zone: [6.3, 7.4, 3.1, 3.9], label: { at: [6.85, 3.7, 1.2], text: 'Kitchen' } },
    ],
  },
  garden: {
    name: 'Garden', bounds: [0.3, 9.7, 0.4, 7.2],
    doors: [
      { id: 'kitchen', to: 'kitchen', toDoor: 'garden', at: [5.675, 0.42], in: [5.0, 0.85], zone: [5.2, 6.15, -0.3, 0.6], hit: ['KitchenBackDoor'], label: { at: [5.675, 0, 3.65], text: 'Kitchen' } },
      { id: 'french', at: [8.15, 0.5], hit: ['FrenchDoors'], special: 'locked' },
      { id: 'garage', at: [1.4, 3.7], hit: ['Outbuilding'], special: 'garage', label: { at: [0.3, 3.7, 2.8], text: 'Garage' } },
    ],
  },
};
// Places in town. Their doors go back out to the town map.
const OUT = (at, inn, zone, label) => ({ id: 'out', at, in: inn, zone, special: 'map', label: { at: label, text: 'Out' } });
Object.assign(ROOMS, {
  park: { name: 'Park', town: true, bounds: [0.3, 15.7, 0.3, 11.7], cam: 1.05, doors: [{ ...OUT([15.45, 9.8], [14.3, 9.8], [15.3, 16.9, 9.0, 10.6], [16.15, 9.8, 1.95]), hit: ['EntranceGate'] }] },
  cafe: { name: 'Cafe', town: true, bounds: [0.3, 9.3, 0.3, 6.8], doors: [OUT([9.05, 5.45], [7.9, 5.45], [8.9, 10.4, 4.8, 6.1], [9.65, 5.45, 1.45])] },
  shop: { name: 'Shop', town: true, bounds: [0.3, 17.8, 0.3, 12.8], cam: 1.0, doors: [OUT([17.45, 11.7], [16.3, 11.7], [17.2, 18.9, 10.7, 12.7], [18.15, 11.7, 1.6])] },
  school: { name: 'School', town: true, bounds: [0.3, 31.8, 0.3, 15.8], cam: 1.15, doors: [OUT([2.5, 15.5], [2.5, 14.4], [1.5, 3.5, 15.3, 17.0], [2.5, 16.35, 1.45])] },
});
// Nanny and Grandad's: downstairs, upstairs and the garden, joined by their own doors and stairs.
Object.assign(ROOMS, {
  nannydown: { name: "Nanny's house", town: true, bounds: [0.3, 17.8, 0.3, 13.8], cam: 1.1, box: [-320, -60, 2760, 1990], doors: [
    OUT([11.5, 0.55], [11.5, 1.6], [10.6, 12.4, -0.3, 1.0], [11.5, 0, 3.35]),
    { id: 'garden', to: 'nannygarden', toDoor: 'house', at: [15.5, 13.5], in: [15.5, 12.6], zone: [14.6, 16.4, 13.3, 14.7], label: { at: [15.5, 14.1, 1.35], text: 'Garden' } },
    { id: 'up', to: 'nannyup', toDoor: 'down', at: [12.8, 4.45], zone: [11.35, 14.2, 4.8, 9.2], hit: ['StairsUp'], exit: [[12.8, 4.95, 0], [12.8, 9.0, 2.1]], enter: [[12.8, 9.0, 2.1], [12.8, 4.95, 0], [12.8, 4.3, 0]], label: { at: [12.8, 7.2, 3.2], text: 'Up' } },
  ] },
  nannyup: { name: "Nanny's house", town: true, bounds: [0.3, 17.8, 0.3, 13.8], cam: 1.1, box: [-320, -60, 2760, 1990], doors: [
    { id: 'down', to: 'nannydown', toDoor: 'up', at: [11.9, 7.2], zone: [12.4, 18, 6.05, 8.3], exit: [[12.6, 7.2, 0], [14.2, 7.2, -0.9]], enter: [[13.9, 7.2, -0.8], [12.6, 7.2, 0], [11.7, 7.2, 0]], label: { at: [14.2, 7.2, 1.3], text: 'Down' } },
  ] },
  nannygarden: { name: "Nanny's garden", town: true, bounds: [0.3, 17.6, 0.4, 7.1], cam: 1.0, doors: [
    { id: 'house', to: 'nannydown', toDoor: 'garden', at: [15.5, 0.65], in: [15.5, 1.6], zone: [14.6, 16.4, -0.3, 1.0], label: { at: [15.5, 0, 3.1], text: 'House' } },
  ] },
});
ROOMS.clothes = { name: 'Clothes shop', town: true, bounds: [0.3, 14.8, 0.3, 10.8], cam: 1.05, doors: [OUT([14.75, 9.8], [13.6, 9.8], [14.6, 16.1, 8.9, 10.7], [15.35, 9.8, 1.45])] };
export const TOWN = ['park', 'cafe', 'shop', 'school', 'nannydown', 'nannyup', 'nannygarden', 'clothes'];
export const DOORMAP = {};
for (const [rid, r] of Object.entries(ROOMS)) for (const d of r.doors) DOORMAP[rid + ':' + d.id] = d;

// Route between rooms (for the family walking around the house).
const ADJ = {};
for (const [rid, r] of Object.entries(ROOMS)) ADJ[rid] = r.doors.filter(d => d.to).map(d => ({ to: d.to, door: d }));
export function route(from, to) {
  if (from === to || !ADJ[from] || !ADJ[to]) return [from];
  const prev = { [from]: null }, q = [from];
  while (q.length) { const r = q.shift(); for (const { to: n } of ADJ[r]) if (!(n in prev)) { prev[n] = r; q.push(n); if (n === to) q.length = 0; } }
  if (!(to in prev)) return [from];
  const path = []; for (let r = to; r; r = prev[r]) path.unshift(r); return path;
}
// Rooms made while playing (new families' houses) join the map of doors here.
export function registerRoom(rid, def) {
  ROOMS[rid] = def; delete cache[rid];
  for (const d of def.doors) DOORMAP[rid + ':' + d.id] = d;
  ADJ[rid] = def.doors.filter(d => d.to).map(d => ({ to: d.to, door: d }));
}
export function unregisterRoom(rid) {
  if (!ROOMS[rid]) return;
  for (const d of ROOMS[rid].doors) delete DOORMAP[rid + ':' + d.id];
  delete ROOMS[rid]; delete ADJ[rid]; delete cache[rid];
}
export const doorTo = (from, to) => (to ? ROOMS[from].doors.find(d => d.to === to) : null);

/* ---------------- words for everything (read aloud when tapped) ---------------- */
export const TOWN_WORDS = {
  Cubbies: 'tops', ShoeWall: 'shoes', MirrorLogo: 'mirror', FittingRooms: 'fitting room', Rail: 'clothes', Mannequin: 'dummy', CapsTable: 'hats',
  Swing: 'swing', SwingFrame: 'swings', Slide: 'slide', TowerFront: 'slide', TowerBack: 'slide', ZipLine: 'zip line', MerryGoRound: 'roundabout', Sandpit: 'sand', SeeSaw: 'see-saw',
  Duck: 'duck', Reeds: 'pond', Bench: 'bench', Bin: 'bin', VanBack: 'ice cream', VanFront: 'ice cream', EntranceGate: 'gate', Tree: 'tree', Fence: 'fence', Hedges: 'hedge',
  BackCounter: 'counter', CoffeeMachine: 'coffee', Grinder: 'coffee', DrinksFridge: 'fridge', CrispStand: 'crisps', ServingCounter: 'counter', Till: 'till', CakeDisplay: 'cake',
  CollectPoint: 'collect', Table: 'table', Chair: 'chair', Armchair: 'chair', Cup: 'cup', Plant: 'plant', WindowBench: 'seat', MenuBoards: 'menu', Windows: 'window',
  VegStand: 'fruit', Chiller: 'fridge', ShelfRun: 'shelf', AisleSign: 'aisle', Trolley: 'trolley', TrolleyBay: 'trolley', BasketStack: 'basket', MagazineRack: 'magazines',
  SelfCheckout: 'till', TillShopping: 'shopping', FlowerBuckets: 'flowers', SectionSign: 'sign',
  Whiteboard: 'board', Frieze: 'letters', CoatPegs: 'pegs', TeacherDesk: 'desk', ReadingCorner: 'books', SmallChair: 'chair', KidsTable: 'table', Bookcase: 'books', Beanbag: 'beanbag',
  DisplayBoard: 'pictures', SinkUnit: 'sink', Easel: 'paint', WallBars: 'climb', ClimbRopes: 'rope', GymMat: 'mat', Cones: 'cones', Ball: 'ball', PEBench: 'bench', Lockers: 'lockers',
  WaterFountain: 'water', ReceptionDesk: 'desk', WaitingChairs: 'chairs', TrophyCabinet: 'cups', SchoolSign: 'school', LunchTable: 'table', FrontBench: 'bench', Bins: 'bins',
  PlayFrame: 'climb', Goal: 'goal', PlayBench: 'bench', PlayTree: 'tree', NoticeBoard: 'board', SchoolWindowX: 'window',
  RunY: 'cupboard', RunX: 'cupboard', Sink: 'sink', UpperY: 'cupboard', UpperX: 'cupboard', Fridge: 'fridge', Cooker: 'cooker', Knicks: 'pots', Knick: 'pot',
  GrandfatherClock: 'clock', PhoneTable: 'phone', Sideboard: 'cupboard', Toilet: 'toilet', PedestalSink: 'sink', Shower: 'shower', Bookshelf: 'books', TV: 'TV',
  StairsUp: 'stairs', UnderStairs: 'cupboard', LeatherSofa: 'sofa', Lamp: 'lamp', BigArmchair: 'chair', ChintzSofa: 'sofa', DiningTable: 'table', Cabinet: 'cupboard',
  BedX: 'bed', BedY: 'bed', Teddy: 'teddy', Cylinder: 'tank', Towels: 'towels', Bath: 'bath', ToiletX: 'toilet', DollsHouse: 'dolls house', Seating: 'seat', Fountain: 'fountain'
};
export const WORDS = {
  StorageBed: 'bed', DoubleBed: 'bed', Duvet: 'bed', bed: 'bed', TVUnit: 'TV', tv: 'TV', Desk: 'desk', desk: 'desk',
  Wardrobe: 'wardrobe', FittedWardrobes: 'wardrobe', wardrobe: 'wardrobe', DisplayShelves: 'toys', BedToys: 'toys', BridgeCupboards: 'cupboard',
  RadiatorCover: 'radiator', CurtainWindow: 'window', AnimePoster: 'poster', DeskFan: 'fan', LaundryBasket: 'basket',
  ChestOfDrawers: 'drawers', StandFan: 'fan', AlcoveLedge: 'shelf', LouvreDoor: 'shower', EnsuiteShower: 'shower', EnsuiteSink: 'sink', EnsuiteRoom: 'shower',
  ShowerTray: 'shower', ShowerScreens: 'shower', ShowerFittings: 'shower', RoundMirror: 'mirror', BasinUnit: 'sink', Toilet: 'toilet', Towels: 'towel',
  DrawerTower: 'drawers', BlindWindow: 'window', SillBottles: 'bottles', TreasureChest: 'chest', 'TreasureChest#2': 'gold', SheetedChair: 'chair',
  CardboardBoxes: 'boxes', OldTrunk: 'trunk', RockingHorse: 'horse', DressUpRail: 'dress up', DressUpMirror: 'mirror', MoonWindow: 'moon', FloorHatch: 'hatch',
  Staircase: 'stairs', Stairs: 'stairs', RadiatorTop: 'radiator', Dishwasher: 'dishwasher', SinkUnit: 'sink', WashingMachine: 'washer', SinkWorktop: 'sink',
  DishRack: 'plates', Oven: 'oven', HobRunUnits: 'cupboard', HobWorktop: 'hob', CasserolePot: 'pot', ChoppingBoard: 'board', HobWallCabinets: 'cupboard',
  RadiatorWorktop: 'radiator', PedalBin: 'bin', LarderUnit: 'cupboard', FrontCounter: 'worktop', Kettle: 'kettle', MilkBottle: 'milk', CoffeeMachine: 'coffee',
  Microwave: 'microwave', BoilerCupboard: 'cupboard', HobTiles: 'tiles', ToiletBrush: 'brush', CleaningBottles: 'bottles', HangingTowel: 'towel',
  SashWindow: 'window', 'SashWindow#2': 'window', StarMapPoster: 'stars', ChimneyBreast: 'fire', Fireplace: 'fire', MantelOrnaments: 'vase', ToyBaskets: 'toys',
  Sideboard: 'cupboard', TableLamp: 'lamp', RecordPlayer: 'music', DrinksBottles: 'bottles', CoffeeTable: 'table', TableClutter: 'table', GreenSofa: 'sofa',
  BlueLSofa: 'sofa', FloorLampAndPlant: 'lamp', BookTower: 'books', RowingMachine: 'rowing', RomanBlindWindow: 'window', SillPlants: 'plants',
  VanityMirror: 'mirror', DressingTable: 'drawers', MakeupBottles: 'makeup', ArtEasel: 'paint', YarnBag: 'wool', Trainers: 'shoes', OfficeChair: 'chair',
  ClothesSofa: 'sofa', MacrameHanging: 'art', RadiatorAndAirer: 'washing', AmericanFridge: 'fridge', CoatRack: 'coats', IroningBoard: 'iron',
  WhiteSideboard: 'cupboard', SchoolBag: 'bag', LaundryBaskets: 'basket', BayDoors: 'door', Outbuilding: 'garage', GardenWasteBags: 'bags',
  BambooCorner: 'bamboo', CoveredBBQ: 'BBQ', DeckChair: 'chair', ShoppingBag: 'bag', RattanChair: 'chair', 'RattanChair#2': 'chair', GlassTable: 'table',
  RattanSofa: 'sofa', Tree: 'tree', KitchenBackDoor: 'door', FrenchDoors: 'door', KitchenWindow: 'window', PaddlingPool: 'pool',
  ConnorDoor: 'door', ParentsDoor: 'door', ChloeDoor: 'door', EntryDoor: 'door', LivingRoomDoor: 'door', ToiletDoor: 'door', GardenDoor: 'door',
  AtticHatch: 'hatch', HatchFootprint: 'hatch', ArchToLivingRoom: 'arch', door: 'door', window: 'window', switch: 'light', kitchen: 'kitchen', basket: 'toy box', box: 'box',
  OpeningPiers: 'wall', Cobwebs: 'web', FairyLights: 'lights', FloorLantern: 'lamp', CurtainWindow_: 'window', FrontDoorway: 'door', goal: 'goal',
};

/* ---------------- cupboards and baskets you can open ---------------- */
export const CONTAINERS = {
  'callie:basket': { room: 'callie', keys: ['basket'], word: 'toy box', at: [4.95, 3.35] },
  'callie:box': { room: 'callie', keys: ['box'], word: 'box', at: [1.75, 4.45] },
  'callie:desk': { room: 'callie', keys: ['desk'], word: 'desk', at: [1.45, 2.6] },
  'chloe:basket': { room: 'chloe', keys: ['LaundryBasket'], word: 'basket', at: [2.9, 1.95] },
  'chloe:desk': { room: 'chloe', keys: ['Desk'], word: 'desk', at: [2.7, 0.85] },
  'parents:drawers': { room: 'parents', keys: ['ChestOfDrawers'], word: 'drawers', at: [3.6, 1.45] },
  'bathroom:drawers': { room: 'bathroom', keys: ['DrawerTower'], word: 'drawers', at: [0.75, 1.75] },
  'bathroom:sink': { room: 'bathroom', keys: [], word: 'cupboard', at: [1.9, 0.85] },
  'attic:chest': { room: 'attic', keys: ['TreasureChest'], word: 'chest', at: [1.0, 1.2] },
  'attic:trunk': { room: 'attic', keys: ['OldTrunk'], word: 'trunk', at: [5.6, 1.8] },
  'attic:boxes': { room: 'attic', keys: ['CardboardBoxes'], word: 'boxes', at: [6.6, 1.2] },
  'kitchen:cupboard': { room: 'kitchen', keys: ['LarderUnit', 'HobRunUnits', 'HobWallCabinets', 'BoilerCupboard'], word: 'cupboard', at: [1.05, 2.0] },
  'kitchen:dishwasher': { room: 'kitchen', keys: ['Dishwasher'], word: 'dishwasher', at: [0.5, 1.1] },
  'kitchen:bin': { room: 'kitchen', keys: ['PedalBin'], word: 'bin', at: [5.25, 2.0] },
  'living:basket': { room: 'living', keys: ['ToyBaskets'], word: 'toy box', at: [0.95, 2.65] },
  'living:cupboard': { room: 'living', keys: ['Sideboard'], word: 'cupboard', at: [4.8, 0.9] },
  'middle:cupboard': { room: 'middle', keys: ['WhiteSideboard'], word: 'cupboard', at: [9.3, 1.0] },
  'middle:basket': { room: 'middle', keys: ['LaundryBaskets'], word: 'basket', at: [8.2, 2.6] },
  'middle:bag': { room: 'middle', keys: ['SchoolBag'], word: 'bag', at: [5.6, 2.0] },
  'middle:drawers': { room: 'middle', keys: ['DressingTable'], word: 'drawers', at: [0.85, 0.95] },
};
export const containerFor = (room, key) => Object.keys(CONTAINERS).find(id => CONTAINERS[id].room === room && CONTAINERS[id].keys.includes(key));

/* ---------------- starting items (toys, clothes, the word-hunt things) ---------------- */
export function startItems() {
  const PLUSH = [['bear', 1.5, 0.75, -12], ['moon', 2.1, 1.45, 18], ['dino', 2.7, 0.65, -8], ['sheep', 1.0, 1.55, 10], ['bunny', 3.2, 1.35, -15]];
  const CLOTHES = [['#c7b6e6', null, 3.1, 5.3, 20], ['#f6f1f0', '#e86a6a', 3.8, 4.55, -30], ['#f6c9d7', '#f2c66b', 2.1, 4.1, 50], ['#bfe3d8', null, 4.5, 5.25, -10], ['#f2f2ee', null, 3.3, 3.85, 80], ['#8ec5ea', null, 1.6, 3.75, -60]];
  const BOOKS = [['#ef8f8f', 1.45, 2.6, 30], ['#f3c95b', 1.8, 3.05, -25], ['#7ab6e8', 1.35, 3.35, 70]];
  const out = [];
  PLUSH.forEach(([k, x, y, r], i) => out.push({ id: 'p' + i, kind: k, home: 'callie:basket', room: 'callie', loc: { s: 'bed', x, y }, rot: r }));
  CLOTHES.forEach(([c, st, x, y, r], i) => out.push({ id: 'c' + i, kind: 'cloth', c, stripe: st, home: 'callie:box', room: 'callie', loc: { s: 'floor', x, y }, rot: r }));
  BOOKS.forEach(([c, x, y, r], i) => out.push({ id: 'b' + i, kind: 'book', c, home: 'callie:desk', room: 'callie', loc: { s: 'floor', x, y }, rot: r }));
  const hunt = [
    ['bus', 'living', { s: 'floor', x: 6.95, y: 3.3 }], ['duck', 'bathroom', { s: 'in', box: 'bathroom:drawers' }], ['cup', 'kitchen', { s: 'in', box: 'kitchen:cupboard' }],
    ['key', 'living', { s: 'in', box: 'living:basket' }], ['pen', 'parents', { s: 'in', box: 'parents:drawers' }], ['sock', 'chloe', { s: 'floor', x: 2.1, y: 2.25 }],
    ['hat', 'attic', { s: 'in', box: 'attic:chest' }], ['car', 'attic', { s: 'in', box: 'attic:boxes' }],
  ];
  hunt.forEach(([k, room, loc]) => out.push({ id: 'h-' + k, kind: k, room, loc, rot: 0 }));
  out.push({ id: 'x-book', kind: 'book', c: '#9be3a4', room: 'middle', loc: { s: 'in', box: 'middle:bag' }, rot: 0 });
  out.push({ id: 'x-c1', kind: 'cloth', c: '#4f6d8f', room: 'chloe', loc: { s: 'in', box: 'chloe:basket' }, rot: 0 });
  out.push({ id: 'x-c2', kind: 'cloth', c: '#2b2b2e', stripe: '#6e4f8c', room: 'chloe', loc: { s: 'floor', x: 1.9, y: 1.4 }, rot: 30 });
  out.push({ id: 'x-c3', kind: 'cloth', c: '#e7c46a', room: 'middle', loc: { s: 'in', box: 'middle:basket' }, rot: 0 });
  out.push({ id: 'x-dino2', kind: 'dino', room: 'living', loc: { s: 'in', box: 'living:basket' }, rot: 0 });
  out.push({ id: 'x-book2', kind: 'book', c: '#6e4f8c', room: 'chloe', loc: { s: 'in', box: 'chloe:desk' }, rot: 0 });
  out.push({ id: 'x-yoyo', kind: 'yoyo', room: 'attic', loc: { s: 'in', box: 'attic:trunk' }, rot: 0 });
  return out;
}

/* ---------------- Callie's room (the original Messy Room) ---------------- */
const RX = 7, RY = 6, RH = 4.2;
const OAK = ['#ecd09c', '#dcb67e', '#c9a16a'], WHITE = ['#fbf8f2', '#ebe6dc', '#ddd6c9'], MINT = ['#cfeee4', '#b4ddd0', '#9fcdbf'];
const CARD = ['#d8b484', '#c49c69', '#b08757'], TOYBOX = ['#d9a868', '#c89356', '#b17f46'], DARK = ['#2a2a2e', '#1d1d20', '#151517'];
const STAR_D = 'M0,-9 L3,-3 9,-2 4,2 6,9 0,5 -6,9 -4,2 -9,-2 -3,-3Z';
const WallY = ({ children }) => <Plane o={[0, 0, RH]} u={[1, 0, 0]} v={[0, 0, -1]}>{children}</Plane>;

const RoomShell = memo(function RoomShell() {
  const planks = [];
  for (let i = 0; i < 12; i++) {
    const off = (i * 137) % 260;
    planks.push(<rect key={i} x={0} y={i * 50} width={700} height={50} fill={i % 2 ? '#b77f4d' : '#ad7543'} />);
    for (let k = -1; k < 4; k++) planks.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#8d5a2e" strokeWidth={2} />);
    planks.push(<line key={'h' + i} x1={0} y1={i * 50} x2={700} y2={i * 50} stroke="#8d5a2e" strokeWidth={1.5} opacity={0.6} />);
  }
  return <g>
    <polygon points={pts([[0, RY, 0], [RX, RY, 0], [RX, RY, -0.35], [0, RY, -0.35]])} fill="#8a5a33" />
    <polygon points={pts([[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]])} fill="#734a29" />
    <FloorPlane><g clipPath="url(#floorclip)">{planks}</g></FloorPlane>
    <polygon points={pts([[0, 0, 0], [RX, 0, 0], [RX, 0, RH], [0, 0, RH]])} fill="#f5e8cf" />
    <polygon points={pts([[0, 0, 0], [0, RY, 0], [0, RY, RH], [0, 0, RH]])} fill="#e9d6b6" />
    <polygon points={pts([[-0.2, -0.2, RH], [RX, -0.2, RH], [RX, 0, RH], [0, 0, RH], [0, RY, RH], [-0.2, RY, RH]])} fill="#fffaf0" stroke="#d9c6a6" strokeWidth={1} />
    <polygon points={pts([[RX, -0.2, RH], [RX, 0, RH], [RX, 0, -0.35], [RX, -0.2, -0.35]])} fill="#e3d0ae" />
    <polygon points={pts([[-0.2, RY, RH], [0, RY, RH], [0, RY, -0.35], [-0.2, RY, -0.35]])} fill="#cdb791" />
    <polygon points={pts([[0, 0.01, 0], [RX, 0.01, 0], [RX, 0.01, 0.18], [0, 0.01, 0.18]])} fill="#fffaf2" />
    <polygon points={pts([[0.01, 0, 0], [0.01, RY, 0], [0.01, RY, 0.18], [0.01, 0, 0.18]])} fill="#f3eadb" />
    <polygon points={pts([[0, 0.01, RH - 0.15], [RX, 0.01, RH - 0.15], [RX, 0.01, RH], [0, 0.01, RH]])} fill="#fffdf7" />
  </g>;
});
const RoomFixtures = memo(function RoomFixtures() {
  return <g>
    <Box x={1.5} y={0} z={1.5} w={2.0} d={0.2} h={0.1} c={WHITE} />
    <Box x={1.7} y={0.02} z={0.35} w={1.6} d={0.12} h={0.75} c={WHITE} />
    <FloorPlane z={0.01}>
      <ellipse cx={380} cy={385} rx={125} ry={105} fill="#efb3c2" />
      <ellipse cx={380} cy={385} rx={100} ry={82} fill="none" stroke="#fbd9e1" strokeWidth={9} />
      <ellipse cx={380} cy={385} rx={60} ry={48} fill="none" stroke="#e595aa" strokeWidth={6} />
    </FloorPlane>
  </g>;
});
function Window({ blind, day, T }) {
  const bh = 215 * (1 - blind), slats = [];
  for (let i = 0; i < 14; i++) { const y = 60 + i * 15; if (y < 55 + bh - 6) slats.push(<line key={i} x1={165} x2={335} y1={y} y2={y} stroke="#43475a" strokeWidth={3} />); }
  const drift = (T * 6) % 220;
  return <WallY>
    <rect x={155} y={45} width={190} height={235} fill="#fffaf2" stroke="#e2d4bb" strokeWidth={2} />
    <svg x={165} y={55} width={170} height={215} overflow="hidden">
      {day ? <g>
        <rect width={170} height={215} fill="#8fcdf4" /><rect y={110} width={170} height={105} fill="#b9e3fb" />
        <circle cx={128} cy={44} r={20} fill="#ffe27a" />
        <g transform={`translate(${drift - 50} 0)`}><ellipse cx={20} cy={90} rx={26} ry={10} fill="#fff" /><ellipse cx={34} cy={82} rx={16} ry={10} fill="#fff" /></g>
        <rect y={178} width={170} height={37} fill="#9fd88f" /><ellipse cx={40} cy={182} rx={60} ry={16} fill="#8cce7c" />
      </g> : <g>
        <rect width={170} height={215} fill="#232a4d" />
        <circle cx={122} cy={44} r={15} fill="#fff6d8" /><circle cx={114} cy={39} r={13} fill="#232a4d" />
        {[[30, 30], [60, 70], [140, 100], [90, 25], [40, 120], [150, 160], [80, 150]].map(([a, b], i) =>
          <circle key={i} cx={a} cy={b} r={1.8 + (i % 2)} fill="#fff6d8" opacity={0.5 + 0.5 * Math.abs(Math.sin(T * 2 + i))} />)}
        <rect y={178} width={170} height={37} fill="#1d2440" />
      </g>}
    </svg>
    <rect x={248} y={55} width={4} height={215} fill="#fffaf2" /><rect x={165} y={158} width={170} height={4} fill="#fffaf2" />
    <rect x={165} y={55} width={170} height={bh} fill="#2b2e38" />{slats}
    <rect x={162} y={55 + bh - 5} width={176} height={7} rx={3} fill="#43475a" />
    <line x1={182} y1={55} x2={182} y2={55 + bh + 22} stroke="#cbb898" strokeWidth={1.5} />
    <rect x={179} y={55 + bh + 20} width={7} height={10} rx={3} fill="#3d6fd1" />
  </WallY>;
}
function LightSwitch({ on }) {
  return <Plane o={[0.85, 0.01, 2.35]} u={[1, 0, 0]} v={[0, 0, -1]}>
    <rect x={-26} y={-26} width={82} height={82} fill="transparent" />
    <rect x={0} y={0} width={30} height={30} rx={4} fill="#fffaf2" stroke="#cbb898" strokeWidth={2} />
    <rect x={10} y={on ? 5 : 14} width={10} height={11} rx={2} fill={on ? '#ffd45e' : '#d9c6a6'} stroke="#cbb898" />
  </Plane>;
}
function MyDoor({ open }) {
  const th = open * 1.25, hx = 6.95, ex = hx - 0.9 * Math.cos(th), ey = 0.9 * Math.sin(th);
  const k = P(lerp(hx, ex, 0.88), lerp(0.03, ey, 0.88) + 0.04, 1.6);
  return <g>
    <polygon points={pts([[5.95, 0.01, 0], [7.0, 0.01, 0], [7.0, 0.01, 3.4], [5.95, 0.01, 3.4]])} fill="#fffaf2" stroke="#e0d1b6" strokeWidth={1} />
    <polygon points={pts([[6.05, 0.02, 0], [6.95, 0.02, 0], [6.95, 0.02, 3.3], [6.05, 0.02, 3.3]])} fill="#6d5644" />
    <polygon points={pts([[hx, 0.03, 0], [ex, ey + 0.03, 0], [ex, ey + 0.03, 3.3], [hx, 0.03, 3.3]])} fill={open > 0.5 ? '#e8e0d0' : '#f8f3ea'} stroke="#d6cab3" strokeWidth={1.2} />
    <circle cx={k[0]} cy={k[1]} r={5} fill="#b9973f" />
    <Plane o={[6.25, 0.035, 2.75]} u={[1, 0, 0]} v={[0, 0, -1]} opacity={1 - open}>
      <rect x={0} y={0} width={50} height={26} rx={6} fill="#ffe1ec" stroke="#e86a92" strokeWidth={2} />
      <text x={25} y={18} textAnchor="middle" fontSize={14} fontWeight="800" fontFamily="'Andika','Baloo 2',sans-serif" fill="#c2306a">Callie</text>
    </Plane>
  </g>;
}
const Bed = memo(function Bed() {
  return <g>
    <Box x={0.1} y={0.1} w={0.18} d={1.95} h={1.55} c={WHITE} />
    {[0.5, 0.85, 1.2, 1.55].map(y => <polygon key={y} points={pts([[0.28, y, 0.95], [0.28, y + 0.08, 0.95], [0.28, y + 0.08, 1.4], [0.28, y, 1.4]])} fill="#e3ddd1" />)}
    <Box x={0.28} y={1.9} w={0.14} d={0.14} h={0.3} c={WHITE} /><Box x={3.75} y={1.9} w={0.14} d={0.14} h={0.3} c={WHITE} /><Box x={3.75} y={0.12} w={0.14} d={0.14} h={0.3} c={WHITE} />
    <Box x={0.28} y={0.1} w={3.62} d={1.95} h={0.3} z={0.3} c={WHITE} />
    <Box x={0.32} y={0.14} w={3.54} d={1.87} h={0.3} z={0.6} c={['#e7cfe9', '#d8b9dc', '#c9a7cf']} />
    <FloorPlane z={0.9} x={0.4} y={0.25}><rect x={0} y={4} width={62} height={150} rx={26} fill="#d9d1c2" /></FloorPlane>
    <FloorPlane z={1.06} x={0.4} y={0.25}><rect x={0} y={0} width={62} height={150} rx={26} fill="#fffaf1" stroke="#e5dccb" strokeWidth={2} /></FloorPlane>
    <FloorPlane z={0.92} x={1.1} y={0.1}><path d="M0,10 C60,-10 150,20 230,0 C270,10 290,60 280,110 C285,160 270,195 200,198 C130,205 60,190 10,196 C-10,150 8,90 0,10Z" fill="#cdb7cf" /></FloorPlane>
    <FloorPlane z={1.02} x={1.1} y={0.1}>
      <path d="M0,10 C60,-10 150,20 230,0 C270,10 290,60 280,110 C285,160 270,195 200,198 C130,205 60,190 10,196 C-10,150 8,90 0,10Z" fill="#f6eef1" stroke="#d6c3d6" strokeWidth={2} />
      <path d="M40,60 C90,40 140,80 200,50 M30,130 C100,110 170,150 250,120" fill="none" stroke="#e3d2e4" strokeWidth={6} strokeLinecap="round" />
      {[[50, 30], [120, 95], [210, 30], [235, 160], [80, 165], [160, 150], [245, 90], [30, 95]].map(([a, b], i) => <g key={i} transform={`translate(${a} ${b})`}><path d={STAR_D} fill="#c38bd0" /></g>)}
      {[[90, 55], [180, 110], [140, 25], [60, 120], [220, 190]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={7} fill="#e8a4c8" />)}
    </FloorPlane>
  </g>;
});
const ToyKitchen = memo(function ToyKitchen() {
  return <g>
    {[4.35, 5.85].map(x => <Box key={x} x={x} y={0.6} w={0.1} d={0.1} h={0.25} c={OAK} />)}
    <Box x={4.3} y={0.05} z={0.22} w={1.7} d={0.7} h={1.08} c={WHITE} />
    <FaceY y={0.75} x0={4.3} z1={1.3}>
      <rect x={6} y={8} width={52} height={92} rx={4} fill="#eef2ee" stroke="#c8d2cc" strokeWidth={2} /><rect x={14} y={20} width={20} height={26} rx={3} fill="#b7c4c8" />
      <rect x={62} y={8} width={52} height={92} fill="#cdeee3" stroke="#a5cbbf" strokeWidth={2} /><rect x={70} y={40} width={36} height={40} rx={4} fill="#8fb7b5" />
      {[0, 1, 2, 3].map(i => <circle key={i} cx={72 + i * 11} cy={22} r={4} fill="#fff" stroke="#9db" />)}
      <rect x={118} y={8} width={48} height={44} fill="#f6f6f2" stroke="#d1d1c9" strokeWidth={2} /><rect x={118} y={56} width={48} height={44} fill="#f6f6f2" stroke="#d1d1c9" strokeWidth={2} />
    </FaceY>
    <Box x={4.28} y={0.03} z={1.3} w={1.74} d={0.74} h={0.08} c={['#e0a463', '#c98a47', '#b77a3c']} />
    <Box x={4.3} y={0.05} z={1.38} w={1.7} d={0.07} h={1.0} c={['#fff', '#f4f3ee', '#e6e2d8']} />
    <Box x={4.3} y={0.12} z={1.38} w={0.06} d={0.5} h={1.0} c={MINT} /><Box x={5.94} y={0.12} z={1.38} w={0.06} d={0.5} h={1.0} c={MINT} />
    <Box x={4.3} y={0.05} z={2.3} w={1.7} d={0.55} h={0.08} c={['#e0a463', '#c98a47', '#b77a3c']} />
    <Box x={4.42} y={0.12} z={2.38} w={0.45} d={0.42} h={0.42} c={['#fafafa', '#ececec', '#dcdcdc']} />
    <FloorPlane z={1.385} x={4.95} y={0.2}>
      {[[0, 0], [24, 0], [0, 24], [24, 24]].map(([a, b], i) => <rect key={i} x={a} y={b} width={21} height={21} fill="#25262b" stroke="#55575f" strokeWidth={3} />)}
      <ellipse cx={80} cy={25} rx={18} ry={14} fill="#a8b0b4" />
    </FloorPlane>
    <g transform={`translate(${P(4.6, 0.45, 1.38)[0]} ${P(4.6, 0.45, 1.38)[1]})`}><rect x={-9} y={-34} width={18} height={34} rx={5} fill="#e7739c" /><rect x={-7} y={-40} width={14} height={8} rx={3} fill="#f39dbb" /></g>
  </g>;
});
function Cooking({ T, on }) {
  if (on < 0.02) return null;
  const glow = on * (0.75 + 0.25 * Math.sin(T * 9)), base = P(5.08, 0.33, 1.4);
  return <g pointerEvents="none">
    <FloorPlane z={1.39} x={4.95} y={0.2}>{[[0, 0], [24, 0], [0, 24], [24, 24]].map(([a, b], i) => <rect key={i} x={a + 3} y={b + 3} width={15} height={15} rx={7} fill="#ff7a3d" opacity={glow * (i % 2 ? 0.8 : 1)} />)}</FloorPlane>
    <FaceY y={0.751} x0={4.3} z1={1.3}><rect x={70} y={40} width={36} height={40} rx={4} fill="#ffcf7a" opacity={on * 0.85} /></FaceY>
    {[0, 1, 2].map(i => { const ph = (T * 0.7 + i / 3) % 1; return <circle key={i} cx={base[0] + Math.sin(ph * 7 + i) * 8} cy={base[1] - ph * 80} r={6 + ph * 10} fill="#fff" opacity={on * 0.55 * Math.sin(ph * Math.PI)} />; })}
  </g>;
}
const DeskBase = memo(function DeskBase() {
  return <g>
    <Box x={0} y={2.3} w={0.85} d={0.8} h={1.2} c={WHITE} />
    <FaceX x={0.85} y1={3.1} z1={1.15}>{[0, 1, 2].map(i => <g key={i}><rect x={6} y={6 + i * 36} width={68} height={32} fill="#f7f4ee" stroke="#d6d0c4" strokeWidth={2} /><circle cx={40} cy={22 + i * 36} r={4} fill="#c9d6dd" /></g>)}</FaceX>
    <Box x={0} y={3.5} w={1.0} d={0.9} h={1.2} c={OAK} />
    <FaceX x={1.0} y1={4.4} z1={1.15}><rect x={8} y={6} width={74} height={100} fill="none" stroke="#b78f59" strokeWidth={2} /><path d="M22,14 A12,12 0 0 0 58,14" fill="#6b625a" /></FaceX>
    <Box x={0} y={2.2} z={1.2} w={1.15} d={2.25} h={0.08} c={OAK} />
  </g>;
});
const TVBody = memo(function TVBody() {
  return <g><Box x={0.32} y={3.05} z={1.28} w={0.32} d={0.42} h={0.04} c={DARK} /><Box x={0.44} y={3.2} z={1.32} w={0.06} d={0.12} h={0.16} c={DARK} /><Box x={0.42} y={2.55} z={1.45} w={0.1} d={1.4} h={0.92} c={['#2b2b30', '#202024', '#18181b']} /></g>;
});
function TVScreen({ on, T }) {
  const k = T * 1.4, hue = 190 + 40 * Math.sin(k * 0.6), by = 60 - Math.abs(Math.sin(k * 2.2)) * 32;
  return <FaceX x={0.525} y1={3.9} z1={2.32}>
    <rect x={0} y={0} width={130} height={82} fill="#0e0f14" />
    {on > 0.01 && <g opacity={on}>
      <rect x={0} y={0} width={130} height={82} fill={`hsl(${hue} 70% 72%)`} /><rect x={0} y={60} width={130} height={22} fill="#8fd18a" /><circle cx={100} cy={18} r={9} fill="#ffe27a" />
      <g transform={`translate(${40 + Math.sin(k) * 22} ${by})`}><ellipse cx={0} cy={0} rx={13} ry={12} fill="#ff8fb8" /><circle cx={-4} cy={-3} r={2.4} fill="#222" /><circle cx={5} cy={-3} r={2.4} fill="#222" /></g>
    </g>}
  </FaceX>;
}
const Overhead = memo(function Overhead() {
  const handle = y1 => <FaceX x={0.7} y1={y1} z1={3.9}><path d="M38,90 A16,14 0 0 1 72,90Z" fill="#5d564f" /><path d="M42,90 A12,9 0 0 1 68,90" fill="none" stroke="#d6d9dc" strokeWidth={3} /></FaceX>;
  return <g><Box x={0} y={2.0} z={3.0} w={0.7} d={2.4} h={0.9} c={OAK} />{handle(3.2)}{handle(4.4)}</g>;
});
const MyWardrobe = memo(function MyWardrobe() {
  return <g>
    <Box x={0} y={4.45} w={1.1} d={1.55} h={RH - 0.02} c={OAK} />
    <line x1={P(1.1, 5.22, 0.05)[0]} y1={P(1.1, 5.22, 0.05)[1]} x2={P(1.1, 5.22, 4.1)[0]} y2={P(1.1, 5.22, 4.1)[1]} stroke="#b28c57" strokeWidth={1.5} />
    <FaceX x={1.1} y1={5.22} z1={2.3}><path d="M0,-18 A14,18 0 0 1 0,18Z" fill="#5d564f" /></FaceX>
    <FaceX x={1.1} y1={6.0} z1={2.3}><path d="M78,-18 A14,18 0 0 0 78,18Z" fill="#5d564f" /></FaceX>
    <FaceX x={1.1} y1={5.9} z1={3.6}>
      <rect x={14} y={0} width={56} height={42} rx={10} fill="#fffaf2" stroke="#c9a16a" strokeWidth={2} />
      <path d="M28,12 L34,8 40,8 C40,13 44,13 44,8 L50,8 56,12 53,18 49,16 49,32 35,32 35,16 31,18Z" fill="#e86a92" />
    </FaceX>
  </g>;
});
const ToyBoxBase = memo(function ToyBoxBase() {
  return <g>
    <Box x={4.6} y={2.4} w={0.7} d={0.7} h={0.55} c={TOYBOX} />
    <FloorPlane z={0.55} x={4.6} y={2.4}><rect x={6} y={6} width={58} height={58} fill="#8c6a45" /></FloorPlane>
    <FaceY y={3.1} x0={4.6} z1={0.45}><circle cx={35} cy={18} r={10} fill="#f6c3cd" /><circle cx={27} cy={10} r={4} fill="#f6c3cd" /><circle cx={43} cy={10} r={4} fill="#f6c3cd" /></FaceY>
  </g>;
});
function CardBox({ clothes }) {
  return <g>
    <Box x={1.2} y={4.75} w={0.8} d={0.8} h={0.75} c={CARD} />
    <FloorPlane z={0.75} x={1.2} y={4.75}><rect x={6} y={6} width={68} height={68} fill="#8c6a45" /></FloorPlane>
    {clothes.map((it, i) => <FloorPlane key={it.id} z={0.68 + i * 0.03} x={1.25} y={4.8}>
      <ellipse cx={20 + (i * 23) % 45} cy={22 + (i * 17) % 40} rx={18} ry={14} fill={it.c} stroke="rgba(0,0,0,.1)" />
      {it.stripe && <ellipse cx={20 + (i * 23) % 45} cy={22 + (i * 17) % 40} rx={10} ry={7} fill="none" stroke={it.stripe} strokeWidth={3} />}
    </FloorPlane>)}
    <polygon points={pts([[2.0, 4.75, 0.75], [2.0, 5.55, 0.75], [2.3, 5.6, 0.95], [2.3, 4.8, 0.95]])} fill="#cfa877" stroke="rgba(70,45,25,.25)" />
  </g>;
}
const shadeHex = (hex, k) => { if (typeof hex !== 'string' || hex[0] !== '#') hex = '#c7b6e6'; const n = parseInt(hex.slice(1), 16); const f = c => Math.round(c * (1 + k)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
export function Gallery({ paintings }) {
  if (!paintings.length) return null;
  return <FaceX x={0.012} y1={1.95} z1={3.35}>
    {paintings.slice(-3).map((src, i) => <g key={i} transform={`translate(${8 + i * 60} ${(i % 2) * 6})`}>
      <rect x={-3} y={-3} width={56} height={44} rx={2} fill="#c9a16a" /><image href={src} x={0} y={0} width={50} height={38} preserveAspectRatio="xMidYMid slice" />
    </g>)}
  </FaceX>;
}

export const CALLIE_FOOT = {
  bed: [0.1, 3.9, 0.1, 2.05], kitchen: [4.28, 6.02, 0.03, 0.77], desk: [0, 1.15, 2.0, 4.45],
  basket: [4.6, 5.3, 2.4, 3.1], box: [1.2, 2.3, 4.75, 5.6], wardrobe: [0, 1.1, 4.45, 6.0],
};
// Callie's room as a list of layers; dynamic pieces are render functions of (ctx).
export function callieItems() {
  return [
    { key: 'shell', kind: 'bg', hit: 'floor', el: <RoomShell /> },
    { key: 'window', kind: 'bg', hit: 'obj', render: c => <Window blind={c.av.blind} day={!c.W.bedtime && c.W.clock >= 6.5 && c.W.clock < 19.5} T={c.T} /> },
    { key: 'gallery', kind: 'bg', hit: 'obj', render: c => <Gallery paintings={c.paintings} /> },
    { key: 'fixtures', kind: 'bg', hit: 'floor', el: <RoomFixtures /> },
    { key: 'switch', kind: 'bg', hit: 'obj', render: c => <LightSwitch on={c.W.flags.lights} /> },
    { key: 'door', kind: 'bg', hit: 'obj', render: c => <MyDoor open={c.av.door} /> },
    { key: 'bed', kind: 'furn', sort: CALLIE_FOOT.bed, block: CALLIE_FOOT.bed, hit: 'obj', el: <Bed /> },
    { key: 'kitchen', kind: 'furn', sort: CALLIE_FOOT.kitchen, block: CALLIE_FOOT.kitchen, hit: 'obj', render: c => <g><ToyKitchen /><Cooking T={c.T} on={c.av.cook} /></g> },
    { key: 'desk', kind: 'furn', sort: CALLIE_FOOT.desk, block: CALLIE_FOOT.desk, hit: 'obj', render: c => <g>
      <DeskBase />
      {c.inBox('callie:desk').map((it, i) => <g key={it.id} data-hit={'item:' + it.id}><Box x={0.18} y={2.3} z={1.28 + i * 0.08} w={0.62} d={0.48} h={0.08} c={[it.c || '#c7b6e6', shadeHex(it.c, -0.1), shadeHex(it.c, -0.2)]} /></g>)}
      <g data-hit="obj:tv"><TVBody /><TVScreen on={c.av.tv} T={c.T} /></g><Overhead />
    </g> },
    { key: 'basket', kind: 'furn', sort: CALLIE_FOOT.basket, block: CALLIE_FOOT.basket, hit: 'obj', render: c => <g>
      <ToyBoxBase />
      {c.inBox('callie:basket').map((it, i) => { const b = P(4.95, 2.75, 0.55); return <g key={it.id} transform={`translate(${b[0] - 22 + i * 11} ${b[1] + 2 - (i % 2) * 7}) scale(.8)`}><Plush kind={it.kind} s={1.15} /></g>; })}
    </g> },
    { key: 'box', kind: 'furn', sort: CALLIE_FOOT.box, block: CALLIE_FOOT.box, hit: 'obj', render: c => <CardBox clothes={c.inBox('callie:box').filter(i => i.kind === 'cloth')} /> },
    { key: 'wardrobe', kind: 'furn', sort: CALLIE_FOOT.wardrobe, block: CALLIE_FOOT.wardrobe, hit: 'obj', el: <MyWardrobe /> },
  ];
}

/* ---------------- building the scene rooms from the Claude Design files ---------------- */
const SCENE_OF = { nannydown: 'nannydown', nannyup: 'nannyup', nannygarden: 'nannygarden', hallway: 'hallway', parents: 'parents', chloe: 'chloe', bathroom: 'bathroom', attic: 'attic', downhall: 'downhall', kitchen: 'kitchen', toilet: 'toilet', living: 'living', middle: 'middle', garden: 'garden', park: 'park', cafe: 'cafe', shop: 'shop', school: 'school', clothes: 'clothes' };
const DEEP = new Set(['park', 'cafe', 'shop', 'school', 'nannydown', 'nannyup', 'nannygarden', 'clothes']);
const plainG = el => el.type === 'g' && Object.keys(el.props).every(k => k === 'children');
// Split a scene into its pieces, keeping each piece's translate wrappers.
function flattenStage(stage, deep) {
  const flat = [], counts = {};
  const walk = (ch, wrap) => React.Children.forEach(ch, el => {
    if (!el || typeof el !== 'object') return;
    if (el.type === React.Fragment) return walk(el.props.children, wrap);
    if (deep && plainG(el)) return walk(el.props.children, wrap);
    if (el.type === 'g' && typeof el.props.transform === 'string' && /^translate\(/.test(el.props.transform)) {
      const t = el.props.transform; return walk(el.props.children, x => wrap(<g transform={t}>{x}</g>));
    }
    const name = typeof el.type === 'function' ? el.type.name : 'host:' + el.type;
    counts[name] = (counts[name] || 0) + 1;
    flat.push({ key: counts[name] > 1 ? name + '#' + counts[name] : name, el: wrap(el), at: name === 'Person' ? el.props.at : null, raw: el });
  });
  walk(stage.props.children, x => x);
  return flat;
}
function callScene(rid, T) {
  window.__sceneT = T; window.__sceneBegin(rid);
  return SCENES[SCENE_OF[rid]]({ showLabels: false, spooky: true });
}
// Compare two renders of a scene to find which pieces move (people, swings, ducks...).
const ser = (v, d = 0) => {
  if (d > 7) return '~';
  if (v == null || typeof v !== 'object') return typeof v === 'function' ? 'f' : String(v);
  if (Array.isArray(v)) return '[' + v.map(x => ser(x, d + 1)).join(',') + ']';
  if (v.$$typeof) return '<' + (typeof v.type === 'function' ? v.type.name : v.type) + ser(v.props, d + 1) + '>';
  return '{' + Object.keys(v).map(k => k + ':' + ser(v[k], d + 1)).join(',') + '}';
};
const cache = {};
export function roomLayers(rid) {
  if (cache[rid]) return cache[rid];
  const R = ROOMS[rid];
  let items, box, blocks, live = false, furnEdges = null;
  if (R.gen) {
    items = R.gen; box = R.box;
    blocks = items.filter(i => i.block).map(i => i.block);
  } else if (rid === 'callie') {
    items = callieItems();
    box = R.box;
    blocks = items.filter(i => i.block).map(i => i.block);
  } else {
    const data = ROOMDATA[SCENE_OF[rid]], deep = DEEP.has(rid);
    const stage = callScene(rid, 0);
    const flat = flattenStage(stage, deep);
    let moving = null;
    if (deep) {
      live = true;
      const flat2 = flattenStage(callScene(rid, 0.77), deep);
      // idle breathing alone does not count as moving (keeps big places light on tablets)
      const noT = pr => { const { T: _t, ...rest } = pr; return ser(rest); };
      moving = flat.map((f, i) => !flat2[i] || noT(f.raw.props) !== noT(flat2[i].raw.props));
    }
    items = data.items.map((d, i) => {
      const f = flat[i];
      if (!f || f.key !== d.key) console.warn('room data mismatch', rid, i, d.key, f && f.key);
      return { ...d, idx: i, el: f ? f.el : null, anim: !!(moving && moving[i]), props: deep && f ? f.raw.props : null };
    }).filter(i => i.kind !== 'hidden' && !i.key.startsWith('Tag'));
    if (stage.props.cx != null) { const w = 1920 / data.zoom, h = 1080 / data.zoom; box = [data.cx - w / 2, data.cy - h / 2, w, h]; }
    else box = R.box || [-400, -40, 3820, 2660]; // the school is one big scrolling map
    blocks = items.filter(i => i.block).map(i => i.block).concat(data.extraBlock || []);
    if (deep) {
      // screen rectangles + which pieces overlap, so the family and the people in town sort in properly
      const furn = items.filter(i => i.kind === 'furn');
      for (const f of furn) {
        const s0 = f.sort, b0 = f.bb || [...s0, 0, 1];
        const r1 = screenRect(s0, b0[4], b0[5]), r2 = screenRect(b0.slice(0, 4), b0[4], b0[5]);
        f.sr = [Math.min(r1[0], r2[0]), Math.max(r1[1], r2[1]), Math.min(r1[2], r2[2]), Math.max(r1[3], r2[3])];
      }
      const edges = [];
      for (let i = 0; i < furn.length; i++) for (let j = i + 1; j < furn.length; j++) { const a = furn[i].sr, b = furn[j].sr; if (a[0] < b[1] && b[0] < a[1] && a[2] < b[3] && b[2] < a[3]) edges.push([i, j]); }
      furnEdges = edges;
    }
    if (stage.props.defs) items.unshift({ key: '__defs', kind: 'bg', hit: 'none', el: <defs>{stage.props.defs}</defs> });
  }
  cache[rid] = { items, box, blocks, live, furnEdges };
  return cache[rid];
}
// Town places have moving people: re-run the scene about 15 times a second and swap in just the moving pieces.
export function liveLayers(rid, T) {
  const base = roomLayers(rid);
  if (!base.live) return base;
  const q = Math.floor(T * 10) / 10;
  if (base.q === q && base.cur) return base.cur;
  base.q = q;
  const flat = flattenStage(callScene(rid, q), true);
  const items = base.items.map(it => (it.anim && flat[it.idx] && flat[it.idx].key === it.key ? { ...it, el: flat[it.idx].el, at: flat[it.idx].at || it.at } : it));
  base.cur = { ...base, items };
  return base.cur;
}
