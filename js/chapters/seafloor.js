// Chapter 1: the sea floor moves. A cutaway of a subduction zone that stores strain for centuries and
// lets it go in a megathrust earthquake, lifting the sea floor and the whole column of water on it.
// Numbers: moment magnitude Mw = ⅔ (log₁₀(μ·L·W·D) − 9.1) with μ = 30 GPa and W = 150 km (Hanks &
// Kanamori 1979; Lay et al. 2005). 2004: rupture 1,200–1,300 km, slip up to about 15–20 m, sea floor
// raised by several metres (USGS; Lay et al. 2005, Science 308). The India plate moves under the Burma
// microplate at very roughly 4 cm a year off northern Sumatra (USGS tectonic summary gives 40–50 mm/yr
// for India relative to Sunda). The picture is not to scale: heights are stretched about 20 times and
// the plate's dip is steepened. The initial sea-surface hump copies the sea-floor movement and splits
// into two waves of half the height running opposite ways (the standard long-wave solution).
import { THREE, M, compact, box, clamp, slab, waterMat, rockMat, HEX, momentMw, UPLIFT_SHARE, humpEnergy, fmtN, fmtJ, fitNarrow } from '../tsunami.js';
import { arrow, smooth } from '../kit.js';

const XT = -3, SEA = 4.5, RATE = 0.04;      // trench x, sea level y, plate speed m/yr
const VS = 0.2;                             // scene units per metre of sea-floor or wave movement
const bump = (x, c, w) => Math.exp(-((x - c) ** 2) / (2 * w * w));
const oceanTop = (x) => (x < XT ? 1.5 - 0.6 * smooth((x + 7) / 4) : 0.9 - (x - XT) * 0.32);
const upperTop0 = (x) => { const p = clamp((x - XT) / 7, 0, 1); return x <= 4 ? 0.9 + 3.1 * (1 - (1 - p) ** 2) : x <= 7 ? 4 + ((x - 4) / 3) * 0.5 : 4.5 + ((x - 7) / 3) * 0.7; };
// Sea-floor movement in the quake, as a share of the uplift: up near the trench, down nearer land.
const quakeShape = (x) => bump(x, -1.1, 1.3) - 0.4 * bump(x, 3.0, 1.4);
const slideShape = (x) => 1.6 * (bump(x, -2.2, 0.5) - bump(x, -0.6, 0.5));

export default {
  id: 'seafloor',
  short: 'The sea floor moves',
  title: 'The sea floor moves',
  subtitle: 'A tsunami starts when something shoves a whole column of ocean, most often a giant undersea earthquake.',
  view: { pos: [0, 7, 21], target: [0, 1.5, 0] },
  learn: `<p>A <b>tsunami</b> is not a big version of the waves you see at the beach. Wind makes those. A tsunami is made when a huge volume of sea is pushed up or down all at once, from the sea floor to the surface.</p>
    <p>The usual cause is a <b>subduction zone</b>. Off Sumatra the India plate slides under the Burma plate at very roughly 4 cm a year, about as fast as your fingernails grow. The two plates do not slide smoothly. Their edges <b>stick</b>, so the upper plate is dragged down and squeezed like a bent ruler, storing strain for centuries.</p>
    <p>When the stuck patch finally fails, the upper plate <b>snaps back up</b> in a <b>megathrust earthquake</b>. The sea floor jumps by metres over an area the size of a state, and it lifts all the water above it. That hump of water has to go somewhere. It splits in two: one wave heads out across the ocean and the other heads for the nearby coast.</p>
    <p>On 26 December 2004 the fault broke along about 1,300 km, slipped by up to 15–20 m and raised the sea floor by several metres (USGS; Lay and others, 2005). The model's magnitude is worked out from the size of the break: longer and bigger slips mean a far bigger quake.</p>
    <p><b>Other causes.</b> Undersea and coastal <b>landslides</b> can make very high but local waves. <b>Volcanoes</b> do it too: Krakatoa in 1883, and in 2018 a side of Anak Krakatau slid into the sea with no earthquake to warn anyone. Very rarely a <b>meteorite</b> could do it. A tsunami is not a storm surge (see <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/cycloneclear/">CycloneClear</a>), which is water piled up by a cyclone's wind and low pressure, and it has nothing to do with the tide.</p>
    <p class="tip"><b>Try it:</b> watch the edge bend, then press <b>Let it slip</b>. Make the break longer and the slip bigger and see the magnitude and the wave grow. Then switch the cause to a landslide.</p>`,
  terms: [
    { t: 'Tsunami', d: 'A series of very long waves made when a large volume of water is suddenly moved. Japanese for “harbour wave”.' },
    { t: 'Subduction zone', d: 'Where one plate of the Earth’s crust slides under another, usually at a deep ocean trench.' },
    { t: 'Megathrust earthquake', d: 'A very large quake on the sloping fault between two plates at a subduction zone.' },
    { t: 'Rupture', d: 'The part of a fault that breaks and slips in one earthquake. In 2004 it was about 1,300 km long.' },
    { t: 'Moment magnitude (Mw)', d: 'Earthquake size from the area that slipped times how far it slipped. One step up is about 32 times the energy.' },
  ],
  defaults: { slip: 12, len: 1300, cause: 'quake' },
  controls: [
    { key: 'cause', type: 'seg', label: 'Cause', options: [{ v: 'quake', label: 'Megathrust quake' }, { v: 'slide', label: 'Landslide or volcano collapse' }] },
    { key: 'slip', type: 'range', label: 'How far the fault slips', min: 1, max: 20, step: 0.5, fmt: (v) => `${v} m`, hint: 'The average slip in 2004 was about 10 m, with patches of 15–20 m.' },
    { key: 'len', type: 'range', label: 'Length of the break', min: 50, max: 1600, step: 50, fmt: (v) => `${fmtN(v)} km`, ends: ['50 km', '1,600 km'] },
    { type: 'buttons', label: 'Fault', items: [{ label: 'Let it slip', act: (s, inst) => inst.snap?.() }, { label: 'Start again', act: (s, inst) => inst.restart?.() }] },
  ],
  quiz: [
    { q: 'What makes most big tsunamis?', options: ['Strong wind over the sea', 'The pull of the Moon', 'The sea floor suddenly moving up or down in an undersea earthquake', 'Heavy rain'], answer: 2, why: 'A megathrust quake lifts or drops the sea floor and the whole column of water above it. Wind makes ordinary waves and the Moon makes tides.' },
    { q: 'Between earthquakes, what is happening at a subduction zone?', options: ['Nothing at all', 'The plates are stuck and the upper plate slowly bends, storing strain', 'The sea is slowly rising', 'The plates are moving apart'], answer: 1, why: 'The edge is locked, so centuries of plate movement are stored as bending. The quake releases it in minutes.' },
    { q: 'Which of these can cause a tsunami without any earthquake?', options: ['A high tide', 'A cyclone', 'The side of a volcano sliding into the sea', 'A full Moon'], answer: 2, why: 'That is what happened at Anak Krakatau in December 2018. A cyclone raises a storm surge, which is a different thing.' },
  ],
  reel: [
    { ms: 6000, caption: 'A tsunami starts on the sea floor. Two plates stick, and the upper one bends for centuries.', set: { cause: 'quake', slip: 12, len: 1300 }, act: (s, inst) => inst.restart?.(0.25), view: { pos: [-1, 4.5, 11], target: [-0.5, 2.6, 0] }, spin: 0 },
    { ms: 6000, caption: 'Then it snaps up in a giant earthquake and lifts the whole sea above it.', set: { cause: 'quake', slip: 12, len: 1300 }, act: (s, inst) => inst.snap?.(), view: { pos: [0, 5.5, 13], target: [0, 3.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const sec = new THREE.Group(); root.add(sec);
    const N = 120, X0 = -10, X1 = 10;
    const mantle = slab(60, -0.5, 0.5, rockMat(HEX.mantle)), wedge = slab(60, -0.5, 0.5, rockMat(0x8a4631)), ocean = slab(N, -0.5, 0.5, rockMat(0x39424d)), upper = slab(N, -0.5, 0.5, rockMat(HEX.plate2)), sea = slab(N, -0.5, 0.5, waterMat(0.5));
    sec.add(mantle, wedge, ocean, upper, sea);
    mantle.set(X0, X1, (x) => oceanTop(x) - 1, () => -4.2);
    wedge.set(XT, X1, () => -1.2, oceanTop);
    ocean.set(X0, X1, oceanTop, (x) => oceanTop(x) - 1);
    // The locked patch of the fault, drawn as a glowing strip on the front face.
    const lockMat = M.glow(HEX.hot), lockPts = [];
    for (let x = -2.4; x <= 1.6; x += 0.2) lockPts.push(new THREE.Vector3(x, oceanTop(x) + 0.03, 0));
    const lock = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lockPts), 30, 0.07, 8), lockMat); root.add(lock);
    // A loose block for the landslide.
    const block = box(1.5, 0.4, 0.9, rockMat(0xa58a6a)); sec.add(block);
    // Arrows: the plate's steady movement and the jump of the sea floor.
    const aPlate = arrow(0xffffff, 1.4, 0.3, 0.05); aPlate.rotation.z = -Math.PI / 2; aPlate.position.set(-8.6, 0.9, 0.6); root.add(aPlate);
    const aUp = arrow(HEX.hot, 1, 0.3, 0.06); aUp.position.set(-1.1, 2.6, 0.6); root.add(aUp);
    // A boat far out and a village on the coast, to give the scale of things.
    const boat = box(0.5, 0.12, 0.2, M.plastic(0xe8eef8)); root.add(boat);
    const town = new THREE.Group(); [[7.9, 0.2], [8.5, -0.2], [9.2, 0.15]].forEach(([x, z]) => { const h = box(0.35, 0.3, 0.3, M.matte(0xd8cbb0)); h.position.set(x, 4.5 + ((x - 7) / 3) * 0.7 + 0.15, z); town.add(h); }); root.add(town);

    const minor = [];
    const lSea = stage.label('Sea level', [-8.4, SEA + 0.5, 0], root);
    const lO = stage.label('India plate, sliding under', [-6.5, 0.2, 0.6], root);
    const lU = stage.label('Burma plate', [4.6, 2, 0.6], root);
    const lLock = stage.label('', [-0.4, 0.2, 0.7], root, 'hot');
    minor.push(stage.label('Trench', [XT, 0.3, 0.7], root), stage.label('Coast', [8.6, 5.9, 0], root), lSea, lU);
    const lState = stage.label('', [0, SEA + 1.7, 0], root, 'hot');

    let clock = 0, phase = 'load', k = 0, tau = 0, hold = 0, flash = 0, lastCause = 'quake', slideK = 0, uNow = 0;
    const startWave = () => { phase = 'wave'; tau = 0; };
    const restart = (k0 = 0) => { phase = 'load'; k = k0; tau = 0; hold = 0; slideK = 0; };
    return {
      restart,
      snap() { if (phase === 'load' || phase === 'hold') { phase = 'snap'; hold = 0; uNow = k; } },
      update(dt, s) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        if (s.cause !== lastCause) { lastCause = s.cause; restart(); }
        const quake = s.cause === 'quake';
        const u = quake ? s.slip * UPLIFT_SHARE : 6;                 // metres of sea-floor movement (a slide: a block some metres thick)
        const zs = 1.6 + 4.4 * (s.len / 1600); sec.scale.z = quake ? zs : 2.2;
        // The cycle: load for centuries, hold, snap, waves, and round again.
        if (phase === 'load') { k = Math.min(1, k + dt / 7); if (k >= 1) { phase = 'hold'; hold = 0; } }
        else if (phase === 'hold') { hold += dt; if (hold > 1.4) { phase = 'snap'; hold = 0; uNow = 1; } }
        else if (phase === 'snap') { hold += dt; flash = 1; if (quake) k = uNow * (1 - smooth(hold / 0.35)); else slideK = smooth(hold / 1.5); if (hold > (quake ? 0.35 : 1.5)) { k = 0; startWave(); } }
        else { tau += dt; if (tau > 7.5) restart(); }
        flash = Math.max(0, flash - dt * 1.2);
        const stored = quake ? k : 0;
        // Rock: the upper plate is dragged down at its toe and bulges behind while the fault is locked.
        upper.set(XT, X1, (x) => upperTop0(x) - stored * u * VS * quakeShape(x), (x) => Math.max(oceanTop(x), -1.2));
        const shape = quake ? quakeShape : slideShape, c = 2.3 * tau, amp = u * VS * (quake ? uNow : 1);
        const eta = (x) => (phase === 'wave' ? 0.5 * amp * (shape(x - c) + shape(x + c)) : phase === 'snap' ? amp * (quake ? (uNow - k) / Math.max(0.01, uNow) : slideK) * shape(x) : 0);
        const floor = (x) => (x < XT ? oceanTop(x) : upperTop0(x) - stored * u * VS * quakeShape(x));
        sea.set(X0, X1, (x) => SEA + eta(x), floor);
        // The landslide block rides down the slope.
        block.visible = !quake;
        const bx = 0.6 - 2.8 * (phase === 'load' || phase === 'hold' ? 0 : phase === 'snap' ? slideK : 1), bx2 = bx + 0.2;
        block.position.set(bx, upperTop0(bx) + 0.22, 0); block.rotation.z = Math.atan2(upperTop0(bx2) - upperTop0(bx), 0.2);
        lock.visible = quake; lockMat.color.setHex(phase === 'load' || phase === 'hold' ? HEX.hot : 0xffe27a); lock.position.z = sec.scale.z * 0.5 + 0.03;
        aPlate.position.z = sec.scale.z * 0.5 + 0.1;
        aUp.set(0.5 + u * VS * 1.5); aUp.visible = quake && (phase === 'snap' || (phase === 'wave' && tau < 1.2)); aUp.position.z = sec.scale.z * 0.5 + 0.1;
        boat.position.set(-7, SEA + eta(-7) + 0.05, 0);
        clock += dt; root.position.x = flash > 0.4 && quake ? Math.sin(clock * 55) * 0.05 * flash : 0;
        const years = (k * s.slip) / RATE;
        lLock.visible = quake;
        lLock.element.innerHTML = phase === 'load' || phase === 'hold' ? `Stuck: ${(k * s.slip).toFixed(1)} m of strain` : 'Slipped';
        lState.element.innerHTML = !quake ? (phase === 'wave' ? 'A short, steep wave: huge nearby, fading fast' : phase === 'snap' ? 'The slope gives way' : 'A loose slope under the sea')
          : phase === 'load' ? `Bending for <b>${fmtN(Math.round(years / 10) * 10)} years</b>` : phase === 'hold' ? 'About to fail…' : phase === 'snap' ? '<b>Earthquake</b>: the sea floor jumps' : 'The hump splits: one wave out to sea, one to the coast';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        if (s.cause !== 'quake') return compact(`<div class="big">A landslide tsunami</div>
          <div class="row"><span>Area moved</span><b>a few km across</b></div>
          <div class="row"><span>Wavelength</span><b>short: a few km</b></div>
          <small>Highest recorded: 524 m up a hillside at Lituya Bay, Alaska, in 1958, from a rockfall. Such waves are local: they spread out and fade far faster than an earthquake's.</small>`);
        const mw = momentMw(s.len, s.slip), up = s.slip * UPLIFT_SHARE, E = humpEnergy(up, s.len);
        return compact(`<div class="big">Magnitude ${mw.toFixed(1)}</div>
          <div class="row"><span>Sea floor lifted by about</span><b>${up.toFixed(1)} m</b></div>
          <div class="row"><span>Strain stored over about</span><b>${fmtN(Math.round(s.slip / RATE / 10) * 10)} years</b></div>
          <div class="row"><span>Energy given to the sea</span><b>${fmtJ(E)}</b></div>
          <small>${mw >= 9 ? 'This is the size of 26 December 2004 (magnitude 9.1–9.3).' : mw >= 8 ? 'A great earthquake. Tsunamis that cross oceans usually need magnitude 8 or more.' : mw >= 7 ? 'Big enough for a damaging local tsunami.' : 'Usually too small to make a dangerous tsunami.'} The sea-floor and wave movements are drawn hundreds of times too big.</small>`);
      },
    };
  },
};
