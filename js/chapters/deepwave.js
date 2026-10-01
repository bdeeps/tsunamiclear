// Chapter 2: a wave unlike others. Linear (Airy) wave theory, ω² = g·k·tanh(k·h), solved live for
// the chosen period and depth (wave() in tsunami.js). A wind wave is short, so in deep water only
// the top half-wavelength of the sea moves; a tsunami is hundreds of kilometres long, so even the
// deep ocean is "shallow" to it, the whole column moves and its speed is c = √(g·h).
// Each dot is a parcel of water following the theory's orbit: horizontal cosh(k(z+h)) ÷ sinh(kh),
// vertical sinh(k(z+h)) ÷ sinh(kh), times the surface amplitude. For a tsunami the sideways motion is
// 5–10 times the up-and-down motion; the picture caps it at 3.2 times so the dots stay apart.
// Open-ocean heights: about 0.6 m was measured by the Jason-1 satellite two hours after the 2004
// quake (Gower 2005, Eos; NOAA); 2 m is taken for an ordinary wind sea.
import { THREE, M, compact, box, clamp, slab, waterMat, rockMat, HEX, COL, G, wave, orbit, cShallow, kmh, fmtN, fmtM, board, panelBg, title, placeBoard, fitNarrow, inReel, ship } from '../tsunami.js';
import { swarm } from '../kit.js';

const KINDS = { 8: { name: 'Wind wave', a: 1 }, 16: { name: 'Swell', a: 1 }, 600: { name: 'Tsunami', a: 0.3 }, 1800: { name: 'Tsunami', a: 0.3 } };
const BED = 0.6, SEA = 5.2, X0 = -7, X1 = 7, LD = 7, A = 0.26;
const nearest = (T) => Object.keys(KINDS).map(Number).reduce((a, b) => (Math.abs(Math.log(b / T)) < Math.abs(Math.log(a / T)) ? b : a));

export default {
  id: 'deepwave',
  short: 'A wave unlike others',
  title: 'A wave unlike others',
  subtitle: 'A wind wave stirs only the top of the sea. A tsunami moves all of it, at the speed of a jet.',
  view: { pos: [0, 4.5, 21], target: [0, 2.2, 0] },
  learn: `<p>Every water wave is a pattern that travels while the water itself only shuffles to and fro (see <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/waveclear/">WaveClear</a>). What sets a tsunami apart is its <b>length</b>.</p>
    <p>A wind wave is perhaps 100 m from crest to crest. Its motion dies away quickly below the surface: half a wavelength down, the water is almost still. A diver 50 m under a storm feels little.</p>
    <p>A tsunami is <b>100 to 500 km</b> from crest to crest, because the patch of sea floor that made it was that big. The ocean is only 4 or 5 km deep, so to a wave that long it is a shallow puddle. The <b>whole depth</b> moves together, and the wave's speed depends on just one thing, the depth:</p>
    <p><b>c = √(g × h)</b>. With g = 9.81 m/s² and h = 4,000 m that is 198 m/s, about <b>713 km/h</b>. At 5,000 m it is about 797 km/h. A tsunami crosses an ocean about as fast as a passenger jet.</p>
    <p>Out there it is also <b>low</b>: usually under a metre high and taking 10 to 30 minutes to pass. A ship rises and falls by a few millimetres a second and its crew notice nothing. That is why fishermen at sea on 26 December 2004 came home to find their villages gone, and why the Japanese word means <b>harbour wave</b>. It is also why “tidal wave” is the wrong name: tides come from the Moon and Sun, twice a day, on a timetable.</p>
    <p class="tip"><b>Try it:</b> switch between a wind wave and a tsunami and watch how deep the dots move. Then make the sea shallower and see the tsunami slow down.</p>`,
  terms: [
    { t: 'Wavelength', d: 'The distance from one crest to the next. About 100 m for a wind wave, hundreds of kilometres for a tsunami.' },
    { t: 'Period', d: 'The time between one crest and the next. Seconds for wind waves, 10 to 60 minutes for a tsunami.' },
    { t: 'Shallow-water wave', d: 'A wave much longer than the water is deep. Its speed is √(g × h) and the whole depth moves.' },
    { t: 'Tidal wave', d: 'An old, wrong name for a tsunami. Tides are caused by the Moon and Sun, not by earthquakes.' },
  ],
  defaults: { T: 600, h: 4000 },
  controls: [
    { key: 'T', type: 'seg', label: 'Kind of wave', options: [{ v: 8, label: 'Wind wave, 8 s' }, { v: 16, label: 'Swell, 16 s' }, { v: 600, label: 'Tsunami, 10 min' }, { v: 1800, label: 'Tsunami, 30 min' }], hint: 'The time from one crest to the next.' },
    { key: 'h', type: 'log', label: 'Depth of the sea', min: 10, max: 6000, fmt: (v) => fmtM(Math.round(v)), ends: ['10 m, near shore', '6,000 m'], hint: 'The Bay of Bengal is about 2,000–4,000 m deep; the open Indian Ocean 4,000–5,000 m.' },
  ],
  quiz: [
    { q: 'What sets the speed of a tsunami in the open ocean?', options: ['The strength of the earthquake', 'The depth of the water', 'The wind', 'The tide'], answer: 1, why: 'c = √(g × h). In 4,000 m of water that is about 713 km/h, whatever the size of the quake.' },
    { q: 'Why does a ship in deep water not notice a tsunami passing?', options: ['Ships are too heavy', 'The wave is under a metre high and hundreds of kilometres long, so it lifts the ship very slowly', 'Tsunamis travel under the sea bed', 'It passes too quickly to feel'], answer: 1, why: 'A rise of half a metre spread over many minutes is a few millimetres a second.' },
    { q: 'How is a tsunami different from a wind wave below the surface?', options: ['It moves only the top metre', 'It moves the water all the way to the sea floor', 'It does not move water at all', 'It moves only the sea floor'], answer: 1, why: 'A tsunami is so long that the whole depth of the ocean moves together. A wind wave’s motion fades within half a wavelength.' },
  ],
  reel: [
    { ms: 6000, caption: 'A wind wave only stirs the top of the sea. Deep down, the water is still.', set: { T: 8, h: 4000 }, view: { pos: [0, 4.6, 12.5], target: [0, 3.4, 0] }, spin: 0 },
    { ms: 6000, caption: 'A tsunami moves the whole ocean, top to bottom, at √(g × h): over 700 km/h.', set: { T: 600, h: 4000 }, view: { pos: [0, 4.6, 12.5], target: [0, 3.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const bed = slab(2, -1.6, 1.6, rockMat(HEX.rock)); bed.set(X0, X1, () => BED, () => 0); root.add(bed);
    const sea = slab(140, -1.6, 1.6, waterMat(0.32)); root.add(sea);
    const COLS = 15, ROWS = 9, dots = swarm(COLS * ROWS, new THREE.SphereGeometry(0.075, 10, 8), M.glow(0xcfefff)); root.add(dots);
    const boat = ship(); boat.scale.setScalar(0.9); root.add(boat);
    const minor = [];
    const lTop = stage.label('', [0, SEA + 1.5, 0], root, 'hot');
    const lBed = stage.label('', [4.6, BED - 0.45, 1.7], root);
    const lBoat = stage.label('', [-2.5, SEA + 0.75, 0], root);
    minor.push(lBoat, stage.label('Sea floor', [-5.5, BED - 0.45, 1.7], root));

    let cur = null;
    const brd = board(root, 9.4, 4.3, 780, 360, (g, w, h) => {
      panelBg(g, w, h);
      if (!cur) return;
      title(g, 'Tsunami speed against depth: c = √(g × h)', 'The dot is this wave, in km/h.');
      const x0 = 70, x1 = w - 190, y0 = h - 44, y1 = 88, X = (d) => x0 + (d / 6000) * (x1 - x0), Y = (v) => y0 - (v / 1000) * (y0 - y1);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.fillStyle = COL.soft; g.font = '19px sans-serif';
      [0, 2000, 4000, 6000].forEach((d) => { g.beginPath(); g.moveTo(X(d), y0); g.lineTo(X(d), y1); g.stroke(); g.fillText(fmtN(d) + ' m', X(d) - 24, y0 + 26); });
      [[900, 'jet airliner'], [320, 'fast train'], [100, 'car on a highway']].forEach(([v, n]) => { g.strokeStyle = 'rgba(255,255,255,.3)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.setLineDash([]); g.fillText(`${n} ${v}`, x1 + 8, Y(v) + 5); });
      g.strokeStyle = COL.wave; g.lineWidth = 3; g.beginPath();
      for (let d = 0; d <= 6000; d += 50) { const y = Y(kmh(cShallow(d))); if (d) g.lineTo(X(d), y); else g.moveTo(X(d), y); } g.stroke(); g.lineWidth = 1;
      const v = kmh(cur.c); g.fillStyle = cur.T >= 600 ? COL.ok : COL.warn; g.beginPath(); g.arc(X(cur.h), Y(v), 9, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(`${fmtN(v)} km/h`, Math.min(X(cur.h) + 14, x1 - 90), Y(v) + (v > 800 ? 26 : -12));
    }, [0, -2.6, 1.7]);

    let key = '', ph = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor);
        placeBoard(brd, [[0, -2.6, 1.7], 0, 1], [[0, -2.3, 1.7], 0, 0.85]);
        brd.mesh.visible = !narrow || inReel();
        const T = nearest(s.T), K = KINDS[T], w = wave(T, s.h);
        const k2 = `${T}|${Math.round(s.h)}`; if (k2 !== key) { key = k2; cur = { T, h: s.h, c: w.c }; brd.redraw(); }
        ph += (dt / (T >= 600 ? 3.6 : T === 16 ? 3.2 : 2.2)) * Math.PI * 2;
        const th = (x) => (2 * Math.PI * x) / LD - ph;
        sea.set(X0, X1, (x) => SEA + A * Math.cos(th(x)), () => BED);
        for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
          const x = X0 + 0.5 + (i * (X1 - X0 - 1)) / (COLS - 1), f = j / (ROWS - 1), z = -s.h * f, o = orbit(w.k, s.h, z);
          const y = SEA - f * (SEA - BED - 0.12), ox = Math.min(o.x, 3.2), oy = o.y;
          dots.place(i * ROWS + j, [x - A * ox * Math.sin(th(x)), y + A * oy * Math.cos(th(x)) - (j ? 0.08 : 0.02), (j % 3) * 0.5 - 0.5], null, 0.55 + 0.45 * clamp(Math.hypot(ox, oy), 0, 1));
        }
        dots.done();
        const bx = -2.5; boat.position.set(bx, SEA + A * Math.cos(th(bx)) - 0.02, 0); boat.rotation.z = Math.atan(-A * ((2 * Math.PI) / LD) * Math.sin(th(bx)));
        const ob = orbit(w.k, s.h, -s.h).x / orbit(w.k, s.h, 0).x;
        lTop.element.innerHTML = `${K.name}: this view is <b>${fmtM(2 * w.L)}</b> wide and ${fmtM(Math.round(s.h))} deep${T >= 600 ? ' · time speeded up' : ''}`;
        lBed.element.innerHTML = ob > 0.9 ? 'The sea floor feels all of it' : ob > 0.02 ? `At the sea floor: ${Math.round(ob * 100)} % of the motion` : 'Still water down here';
        lBoat.element.innerHTML = T >= 600 ? `Ship rises ${(K.a * ((2 * Math.PI) / T) * 1000).toFixed(1)} mm a second` : 'Ship pitches and rolls';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const T = nearest(s.T), K = KINDS[T], w = wave(T, s.h), ob = orbit(w.k, s.h, -s.h).x / orbit(w.k, s.h, 0).x;
        const u = K.a * ((2 * Math.PI) / T) * orbit(w.k, s.h, 0).x;
        return compact(`<div class="big">${fmtN(kmh(w.c))} km/h</div>
          <div class="row"><span>Crest to crest</span><b>${fmtM(w.L)}</b></div>
          <div class="row"><span>Height out at sea</span><b>${T >= 600 ? 'about 0.6 m' : 'about 2 m'}</b></div>
          <div class="row"><span>Motion reaching the sea floor</span><b>${ob > 0.995 ? 'all of it' : ob < 0.005 ? 'none' : Math.round(ob * 100) + ' %'}</b></div>
          <div class="row"><span>The water itself moves at</span><b>${u >= 1 ? u.toFixed(1) + ' m/s' : (u * 100).toFixed(u < 0.1 ? 1 : 0) + ' cm/s'}</b></div>
          <small>${w.regime === 'shallow' ? `A shallow-water wave: c = √(9.81 × ${fmtN(Math.round(s.h))}) = ${cShallow(s.h).toFixed(0)} m/s.` : w.regime === 'deep' ? `A deep-water wave: its speed depends on its period, c = g × T ÷ 2π = ${((G * T) / (2 * Math.PI)).toFixed(1)} m/s, and it does not feel the bottom.` : 'In between: the wave is starting to feel the bottom and slow down.'}</small>`);
      },
    };
  },
};
