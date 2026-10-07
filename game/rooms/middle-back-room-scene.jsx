// Middle room + back room joined into one long room. Static, no character. Exports window.MiddleBackRoomScene.
// Reuses every furniture component from middle-room-scene.jsx and back-room-scene.jsx.
// Back room sits at x 0..3.8 (window wall on x = 0); middle room is shifted along by DX = 3.8.
// A pier, header beam and plaster corbels at x = 3.8 mark where the two areas meet.
const { P, pts, FloorPlane, Box, Slab, BackWallY, BackWallX, WallCap, StripY, StripX, Tag, IsoStage, C, S } = window.Iso;
const BK = window.BackRoomParts, MD = window.MiddleRoomParts;

const DX = BK.RX, RX = BK.RX + MD.RX, RY = MD.RY, RH = MD.RH;
const SHIFT = `translate(${DX * C * S} ${DX * 0.5 * S})`; // world x + DX, as a screen offset

function Floor() {
  const p = [];
  for (let i = 0; i < RY * 2; i++) {
    const off = (i * 137) % 260;
    p.push(<rect key={i} x={0} y={i * 50} width={RX * 100} height={50} fill={i % 2 ? '#a26c3f' : '#966238'} />);
    for (let k = -1; k < 6; k++) p.push(<line key={i + '-' + k} x1={off + k * 260} y1={i * 50} x2={off + k * 260} y2={i * 50 + 50} stroke="#7a4b26" strokeWidth={2} />);
    p.push(<line key={'h' + i} x1={0} y1={i * 50} x2={RX * 100} y2={i * 50} stroke="#7a4b26" strokeWidth={1.5} opacity={.6} />);
  }
  return <FloorPlane><g clipPath="url(#mbfloor)">{p}</g></FloorPlane>;
}

function Walls() {
  const bay0 = DX + MD.BAY.x0 - 0.1, bay1 = DX + MD.BAY.x1 + 0.1;
  return <g>
    <BackWallY RX={RX} RH={RH} />
    <BackWallX RY={RY} RH={RH} />
    <WallCap RX={RX} RY={RY} RH={RH} />
    <StripY x0={0} x1={bay0} z0={0} z1={0.18} fill="#fffaf2" />
    <StripY x0={bay1} x1={RX} z0={0} z1={0.18} fill="#fffaf2" />
    <StripX y0={0} y1={RY} z0={0} z1={0.18} fill="#f3eadb" />
    <StripY x0={0} x1={RX} z0={RH - 0.18} z1={RH} fill="#fffdf7" />
    <StripX y0={0} y1={RY} z0={RH - 0.18} z1={RH} fill="#f6efe2" />
  </g>;
}

// Where the back room meets the middle room: a full-height pier on the back wall, a low stub at the front
// (kept low like the cut-away front walls so it doesn't hide the dressing table and easel).
function OpeningPiers() {
  const c = ['#fffaf0', '#f3e6cc', '#ead8b8'], t = 0.25, { y0, y1 } = MD.BACK;
  return <g>
    <Box x={DX - t} y={0} w={t} d={y0} h={RH} c={c} />
    <Box x={DX - t} y={y1} w={t} d={RY - y1} h={0.55} c={c} />
  </g>;
}

function MiddleBackRoomScene({ showLabels = true }) {
  const L = showLabels;
  return <IsoStage cx={1180} cy={560} zoom={1.0} label="Middle and back room" defs={<clipPath id="mbfloor"><rect x={0} y={0} width={RX * 100} height={RY * 100} /></clipPath>}>
    <Slab RX={RX} RY={RY} />
    <Floor />
    <BK.WindowLight />
    <Walls />
    {/* back room end */}
    <BK.RomanBlindWindow />
    <BK.SillPlants />
    <BK.VanityMirror />
    <BK.DressingTable />
    <BK.MakeupBottles />
    <BK.ArtEasel />
    <BK.YarnBag />
    <BK.Trainers />
    <BK.OfficeChair />
    <BK.ClothesSofa />
    <BK.FrontWall />
    <OpeningPiers />
    {/* middle room end, shifted along by DX */}
    <g transform={SHIFT}>
      <MD.MacrameHanging />
      <MD.BayDoors />
      <MD.RadiatorAndAirer />
      <MD.AmericanFridge />
      <MD.CoatRack />
      <MD.IroningBoard />
      <MD.WhiteSideboard />
      <MD.KitchenDoorway />
      <MD.SchoolBag />
      <MD.LaundryBaskets />
      <MD.FrontWalls />
    </g>
    {/* Doorway labels: bay doors → Living room (back wall); arch → Kitchen (front wall) */}
    <Tag show={L} at={[DX + (MD.BAY.x0 + MD.BAY.x1) / 2, 0, 3.85]} text="Living room" />
    <Tag show={L} at={[DX + (MD.KITCHEN.x0 + MD.KITCHEN.x1) / 2, RY + 0.1, 1.2]} text="Kitchen" />
  </IsoStage>;
}
window.MiddleBackRoomScene = MiddleBackRoomScene;
