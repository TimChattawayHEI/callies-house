// NPC people in the same style as the Messy Room girl, with a small idle loop. Exports window.NPC.
// <Person at={[x,y,z]} s={scale} look={{...}} pose="stand|sit|wave|reach|up" facing="front|back" T={seconds} ph={phase} />
// `at` is the feet point (or the seat point when pose="sit"). Kids s≈0.8, adults s≈1.1.
const { P, shade } = window.Iso;

// One shared clock (≈30fps). Pass frozen=true for a still frame.
function useClock(frozen) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (frozen) return;
    let r, last = 0; const s = performance.now();
    const f = (n) => { if (n - last > 33) { last = n; setT((n - s) / 1000); } r = requestAnimationFrame(f); };
    r = requestAnimationFrame(f);
    return () => cancelAnimationFrame(r);
  }, [frozen]);
  return t;
}

function HairBack({ L, back }) {
  const d = shade(L.hair, -0.18);
  switch (L.style) {
    case 'pony': return <ellipse cx={0} cy={-136} rx={33} ry={34} fill={d} />;
    case 'bob': return <path d="M-34,-136 C-34,-178 34,-178 34,-136 L33,-108 Q0,-102 -33,-108Z" fill={d} />;
    case 'long': return <path d="M-34,-136 C-34,-178 34,-178 34,-136 L32,-88 Q0,-82 -32,-88Z" fill={d} />;
    case 'curly': return <g fill={d}>{[[-24, -150], [0, -164], [24, -150], [-28, -126], [28, -126], [-14, -160], [14, -160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} />)}</g>;
    case 'bald': return back ? <ellipse cx={0} cy={-136} rx={28} ry={29} fill={L.skin} /> : null;
    default: return <ellipse cx={0} cy={-138} rx={30} ry={31} fill={d} />;
  }
}

function HairFront({ L }) {
  const h = L.hair, hl = shade(L.hair, 0.22);
  switch (L.style) {
    case 'pony': return <g><path d="M-29,-136 C-28,-168 26,-176 30,-138 C20,-150 4,-156 -6,-150 C-14,-146 -22,-142 -29,-136Z" fill={h} /><path d="M-4,-160 C6,-163 14,-160 20,-154" fill="none" stroke={hl} strokeWidth={3} strokeLinecap="round" /></g>;
    case 'bob': case 'long': return <path d="M-30,-130 C-31,-172 31,-172 30,-130 C26,-150 10,-156 0,-151 C-10,-156 -26,-150 -30,-130Z" fill={h} />;
    case 'curly': return <g fill={h}>{[-20, -8, 4, 16].map((x, i) => <circle key={i} cx={x} cy={-158 + (i % 2) * 3} r={10} />)}</g>;
    case 'bald': return <g><path d="M-27,-128 q-3,-10 0,-18 M27,-128 q3,-10 0,-18" stroke={h} strokeWidth={5} strokeLinecap="round" fill="none" /></g>;
    case 'cap': return <g><path d="M-29,-140 C-28,-172 28,-172 29,-140Z" fill={L.cap || '#d9465f'} /><path d="M-6,-142 Q20,-146 40,-138 Q20,-134 -6,-138Z" fill={shade(L.cap || '#d9465f', -0.2)} /></g>;
    default: return <path d="M-28,-140 C-28,-170 28,-172 29,-140 C22,-150 10,-154 0,-152 C-10,-154 -22,-150 -28,-140Z" fill={h} />;
  }
}

function Person({ at, s = 1, look = {}, pose = 'stand', facing = 'front', flip = false, T = 0, ph = 0, armL, armR, shadow = true, hold }) {
  const L = { skin: '#f6d2b8', hair: '#6b4a2e', style: 'short', top: '#4f86c6', legs: '#3b4a6b', shoes: '#2a2a2c', dress: false, ...look };
  const [px, py] = P(...at);
  const back = facing === 'back', sit = pose === 'sit';
  const br = Math.sin(T * 2.2 + ph) * 1.4;
  const blink = ((T + ph * 1.7) % 3.6) < 0.13 ? 1 : 0;
  let aL = armL ?? 8 + Math.sin(T * 1.5 + ph) * 3, aR = armR ?? 8 + Math.sin(T * 1.5 + ph + 1.3) * 3;
  if (pose === 'wave') aR = 150 + Math.sin(T * 9 + ph) * 22;
  if (pose === 'reach') aR = 75 + Math.sin(T * 3 + ph) * 8;
  if (pose === 'up') { aL = 165; aR = 165; }
  const legTop = L.dress ? -50 : -60, legH = L.dress ? 46 : 56;
  const arm = (side, ang) => <g transform={`translate(${side * 15} ${-98 + br}) rotate(${ang})`}>
    <rect x={-5} y={-3} width={10} height={44} rx={5} fill={L.skin} />
    <rect x={-6} y={-4} width={12} height={L.long ? 38 : 14} rx={6} fill={L.top} />
    {side === 1 && hold}
  </g>;
  return <g transform={`translate(${px} ${py}) scale(${s * (flip ? -1 : 1)} ${s})`}>
    <g transform={`translate(0 ${sit ? 42 : 0})`}>
      {shadow && <ellipse cx={0} cy={sit ? -40 : 0} rx={30} ry={9} fill="rgba(60,30,10,.18)" />}
      {!sit && <g>
        <g transform={`translate(-8 ${legTop})`}><rect x={-5} y={0} width={10} height={legH} rx={5} fill={L.legs} /><ellipse cx={2} cy={legH + 1} rx={8} ry={5} fill={L.shoes} /></g>
        <g transform={`translate(8 ${legTop})`}><rect x={-5} y={0} width={10} height={legH} rx={5} fill={L.legs} /><ellipse cx={2} cy={legH + 1} rx={8} ry={5} fill={L.shoes} /></g>
      </g>}
      {sit && <g><ellipse cx={0} cy={-46} rx={34} ry={12} fill={L.legs} /><ellipse cx={-26} cy={-44} rx={7} ry={5} fill={L.shoes} /><ellipse cx={26} cy={-44} rx={7} ry={5} fill={L.shoes} /></g>}
      {back && arm(-1, aL)}{back && arm(1, -aR)}
      {!back && L.style === 'pony' && <g transform={`translate(22 ${-150 + br}) rotate(${Math.sin(T * 3 + ph) * 6})`}><path d="M0,0 C18,4 22,30 10,46 C4,30 -2,16 0,0Z" fill={shade(L.hair, -0.18)} /></g>}
      <g transform={`translate(0 ${br * 0.5})`}>
        {L.dress
          ? <g><path d="M-16,-106 L16,-106 L27,-46 Q0,-40 -27,-46Z" fill={L.top} /><path d="M-27,-46 Q0,-40 27,-46 L28,-42 Q0,-36 -28,-42Z" fill={shade(L.top, -0.15)} /></g>
          : <g><path d="M-17,-106 L17,-106 L20,-56 Q0,-52 -20,-56Z" fill={L.top} />{L.apron && <path d="M-12,-92 H12 L15,-50 H-15Z" fill={L.apron} />}</g>}
      </g>
      {!back && arm(-1, aL)}{!back && arm(1, -aR)}
      <g transform={`translate(0 ${br})`}>
        <rect x={-5} y={-114} width={10} height={10} fill={shade(L.skin, -0.08)} />
        <HairBack L={L} back={back} />
        {!back && <g>
          <circle cx={0} cy={-134} r={27} fill={L.skin} />
          <HairFront L={L} />
          <g><ellipse cx={-9} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /><ellipse cx={10} cy={-133} rx={3.6} ry={4.6 * (1 - blink)} fill="#3b2a24" /></g>
          {L.glasses && <g fill="none" stroke="#2a2a2c" strokeWidth={2}><circle cx={-9} cy={-133} r={8} /><circle cx={10} cy={-133} r={8} /><line x1={-1} x2={2} y1={-133} y2={-133} /></g>}
          <circle cx={-17} cy={-123} r={5} fill="#f5a3b4" opacity={.6} /><circle cx={18} cy={-123} r={5} fill="#f5a3b4" opacity={.6} />
          {L.beard ? <path d="M-22,-128 Q-20,-104 0,-102 Q20,-104 22,-128 Q12,-114 0,-116 Q-12,-114 -22,-128Z" fill={shade(L.hair, -0.1)} />
            : <path d="M-5,-121 q5,5 10,0" fill="none" stroke="#a3485a" strokeWidth={2} strokeLinecap="round" />}
        </g>}
        {back && <g>
          {L.style === 'curly' && <g fill={shade(L.hair, -0.18)}><circle cx={0} cy={-138} r={28} /><circle cx={-18} cy={-118} r={12} /><circle cx={18} cy={-118} r={12} /></g>}
          {L.style !== 'bald' && L.style !== 'curly' && <path d="M-30,-140 C-30,-110 -20,-100 0,-100 C20,-100 30,-110 30,-140Z" fill={shade(L.hair, -0.18)} />}
          {L.style === 'cap' && <path d="M-29,-140 C-28,-172 28,-172 29,-140Z" fill={L.cap || '#d9465f'} />}
          {L.style === 'pony' && <g transform={`translate(0 -158) rotate(${Math.sin(T * 3 + ph) * 6})`}><circle cx={0} cy={0} r={6} fill="#e96d9a" /><path d="M-6,2 C-14,20 -8,38 4,44 C8,28 10,14 6,2Z" fill={L.hair} /></g>}
        </g>}
        {L.style === 'bun' && <circle cx={0} cy={-172} r={12} fill={L.hair} />}
      </g>
    </g>
  </g>;
}

// A few ready-made looks so crowds vary.
const LOOKS = {
  girlPink: { hair: '#8a5a3a', style: 'pony', top: '#f39ac6', legs: '#9b7cc4', shoes: '#e96d9a', dress: true },
  girlBlue: { hair: '#e8c26a', style: 'bob', top: '#5fa8d8', legs: '#f4f2ee', shoes: '#3b4a6b', dress: true },
  girlCurly: { skin: '#8d5a3b', hair: '#2a1a12', style: 'curly', top: '#f2c94c', legs: '#3b4a6b', shoes: '#f4f2ee' },
  boyRed: { hair: '#4a3020', style: 'short', top: '#d9465f', legs: '#3b4a6b', shoes: '#2a2a2c' },
  boyGreen: { skin: '#c99272', hair: '#1d1410', style: 'short', top: '#5fbf6a', legs: '#6b5a48', shoes: '#f4f2ee' },
  boyCap: { hair: '#c99a5c', style: 'cap', cap: '#3f6e9a', top: '#f4f2ee', legs: '#3b4a6b', shoes: '#d9465f' },
  mum: { hair: '#6b3a24', style: 'long', top: '#7a9a6b', legs: '#2f3a52', shoes: '#f4f2ee', long: true },
  mumBun: { skin: '#e2b08c', hair: '#2a1a12', style: 'bun', top: '#c25a7a', legs: '#2a2a2c', shoes: '#2a2a2c', long: true },
  dad: { hair: '#3a2a1c', style: 'short', top: '#3f6e9a', legs: '#5b5f66', shoes: '#2a2a2c', beard: true, long: true },
  grandad: { hair: '#d9d6ce', style: 'bald', top: '#a8865a', legs: '#5b5f66', shoes: '#4a3020', glasses: true, long: true },
  gran: { hair: '#e6e3dc', style: 'curly', top: '#9b7cc4', legs: '#5b5f66', shoes: '#4a3020', glasses: true, long: true },
};

window.NPC = { useClock, Person, LOOKS };
