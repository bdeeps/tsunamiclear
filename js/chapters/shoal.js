// Chapter 4: reaching the shore. The wave is followed from 4,000 m of ocean to the beach with the
// long-wave (WKB) solution: every part of the wave train arrives at x after τ(x) = ∫ dx ÷ √(g·h),
// and its height follows Green's law, H = H₀ (h₀ ÷ h)^¼ (Green 1838), which is energy conservation
// for a wave that slows without breaking. Green's law overshoots very close to shore, where the wave
// steepens, breaks and loses energy, so the growth is stopped at 5 m depth; flooding of the land is a
// simple "bathtub" fill to the water level at the shoreline. Real run-up depends on the shape of the
// coast and can be several times higher (51 m near Banda Aceh in 2004) or much lower.
// The picture: the sea is 390 km wide; the last 3 km of sea and 3 km of land are magnified.
// Wave heights are drawn at 0.22 units a metre, far larger than the depth scale.
import { THREE, M, compact, clamp, slab, waterMat, rockMat, HEX, G, green, cShallow, kmh, fmtN, fmtM, fmtT, fitNarrow, ship, palm, hut } from '../tsunami.js';
import { smooth } from '../kit.js';

const SEA = 5, VSW = 0.22, COAST = 390, ZOOM = 387, END = 393;
const depth = (km) => (km <= 180 ? 4000 : km <= 260 ? 4000 - 3800 * smooth((km - 180) / 80) : Math.max(0, 200 * (1 - (km - 260) / 130)));
const elev = (km) => Math.max(0, (km - COAST) * 2);                       // land rises 2 m per km
const xs = (km) => (km <= ZOOM ? -10 + (15 * km) / ZOOM : 5 + ((km - ZOOM) * 5) / 6);
const kmOf = (x) => (x <= 5 ? ((x + 10) * ZOOM) / 15 : ZOOM + ((x - 5) * 6) / 5);
const bedY = (h) => SEA - (1.6 * (1 - Math.exp((-h * VSW) / 1.6)) + 2.6 * Math.sqrt(h / 4000));
// Travel time from the left edge, tabulated every half kilometre.
const TAU = (() => { const a = [0]; for (let i = 1; i <= COAST * 2; i++) a.push(a[i - 1] + 500 / cShallow(Math.max(5, depth((i - 0.5) / 2)))); return a; })();
const tau = (km) => { const u = clamp(km, 0, COAST) * 2, i = Math.min(COAST * 2 - 1, Math.floor(u)); return TAU[i] + (TAU[i + 1] - TAU[i]) * (u - i); };
// The wave train as it passes one place: four waves, the second the largest.
const AMPS = [0.7, 1, 0.8, 0.5];
const train = (u, T, sign) => { if (u <= 0 || u >= 4 * T) return 0; const n = Math.floor(u / T), e = Math.min(1, u / (T * 0.15), (4 * T - u) / (T * 0.15)); return sign * AMPS[n] * Math.sin((2 * Math.PI * u) / T) * e; };
const STN = [{ km: 90 }, { km: 262 }, { km: 364 }, { km: 386.75 }];   // open ocean, shelf edge, near shore, just off the beach

export default {
  id: 'shoal',
  short: 'Reaching the shore',
  title: 'Reaching the shore',
  subtitle: 'As the sea gets shallow the wave slows, bunches up and grows.',
  view: { pos: [0.3, 7.4, 22], target: [0.3, 4.9, 0] },
  learn: `<p>Out at sea a tsunami is fast, long and low. Near land the depth falls, and so does the speed: 713 km/h in 4,000 m, about 160 km/h in 200 m, only 36 km/h in 10 m. The front of the wave slows first and the back catches up, so the wave <b>bunches up</b>. Its energy is squeezed into a shorter, slower wave, and the only way left is <b>up</b>. This is <b>shoaling</b>.</p>
    <p><b>Green's law</b> puts a number on it: the height grows as the fourth root of the fall in depth. From 4,000 m to 10 m the depth falls 400 times, so the wave grows about 4.5 times. Bays, harbours and river mouths can funnel it higher still.</p>
    <p>It rarely arrives as a curling surf wave. It comes as a <b>fast-rising flood</b>, like a tide that takes minutes instead of hours and does not stop, or as a wall of churning water. It carries boats, cars and wreckage, and it flows faster than anyone can run.</p>
    <p>It is also <b>not one wave</b>. A tsunami is a train of waves 10 to 60 minutes apart, going on for hours, and <b>the first is often not the biggest</b>. People who went back to the shore after the first wave in 2004 were caught by the second and third.</p>
    <p><b>The sea pulls back.</b> A wave has troughs as well as crests. If a trough arrives first, the sea drains away from the beach for several minutes and leaves fish and boats on bare sand. That happened in Thailand and on parts of the Indian coast in 2004. It is nature's warning that the crest is minutes away. It does not always happen: sometimes the crest comes first.</p>
    <p class="tip"><b>Try it:</b> choose <b>trough first</b> and watch the beach drain before the flood. Then raise the height out at sea a little and see what it does at the shore.</p>`,
  terms: [
    { t: 'Shoaling', d: 'A wave growing taller as it moves into shallower water and slows down.' },
    { t: 'Green’s law', d: 'Wave height is proportional to depth to the power −¼, so long as the wave does not break.' },
    { t: 'Drawback', d: 'The sea draining away from the shore when a tsunami’s trough arrives before its crest.' },
    { t: 'Run-up', d: 'The highest point on land that the water reaches, measured above normal sea level.' },
    { t: 'Inundation', d: 'How far inland the flood goes.' },
  ],
  defaults: { H0: 0.6, T: 20, first: 'trough' },
  controls: [
    { key: 'H0', type: 'range', label: 'Wave height out at sea (above normal sea level)', min: 0.2, max: 2, step: 0.1, fmt: (v) => `${v.toFixed(1)} m`, hint: 'About 0.6 m was measured in the open ocean in 2004.' },
    { key: 'T', type: 'range', label: 'Time between waves', min: 10, max: 40, step: 5, fmt: (v) => `${v} min` },
    { key: 'first', type: 'seg', label: 'What arrives first', options: [{ v: 'trough', label: 'A trough: the sea pulls back' }, { v: 'crest', label: 'A crest: the sea rises' }] },
    { type: 'buttons', label: 'Wave', items: [{ label: 'Send it again', act: (s, inst) => inst.seek?.(0) }, { label: 'Skip to the shore', act: (s, inst) => inst.seek?.(-1) }] },
  ],
  quiz: [
    { q: 'Why does a tsunami grow taller near the shore?', options: ['The wind gets stronger', 'It slows down in shallow water, so its energy is squeezed into a shorter, taller wave', 'More water is added from rivers', 'The tide is higher'], answer: 1, why: 'Speed falls with depth, the wave bunches up, and Green’s law says its height grows as depth to the power −¼.' },
    { q: 'The sea suddenly drains far out from the beach. What should you do?', options: ['Walk out to look at the sea bed', 'Collect the stranded fish', 'Go to high ground at once', 'Wait and watch'], answer: 2, why: 'A trough has arrived first. The crest follows within minutes.' },
    { q: 'After the first wave, when is it safe to go back to the shore?', options: ['Straight away', 'After 10 minutes', 'Only when the authorities say so, usually hours later', 'When the sea looks calm'], answer: 2, why: 'A tsunami is a train of waves that can go on for hours, and the first is often not the biggest.' },
  ],
  reel: [
    { ms: 7000, caption: 'Near land the wave slows, bunches up and grows. Sometimes the sea pulls back first.', set: { H0: 0.8, T: 20, first: 'trough' }, act: (s, inst) => inst.seek?.(-1), view: { pos: [6.2, 6, 9.5], target: [6.4, 4.8, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const N = 260, X0 = -10, X1 = 10;
    const ground = slab(N, -1.4, 1.4, rockMat(HEX.sand)), sea = slab(N, -1.4, 1.4, waterMat(0.5)); root.add(ground, sea);
    const groundY = (x) => { const km = kmOf(x); return km < COAST ? bedY(depth(km)) : SEA + elev(km) * VSW; };
    ground.set(X0, X1, groundY, () => 0.2);
    const boat = ship(); boat.scale.setScalar(0.8); root.add(boat);
    [[390.15, 0.8], [390.3, -0.7], [390.5, 0.2]].forEach(([km, z]) => { const p = palm(0.9); p.position.set(xs(km), SEA + elev(km) * VSW, z); root.add(p); });
    [[390.9, 0.5], [391.4, -0.5], [392, 0.6], [392.6, -0.3]].forEach(([km, z]) => { const hh = hut(0.5); hh.position.set(xs(km), SEA + elev(km) * VSW, z); root.add(hh); });
    const cut = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 5.6), M.ghost(0xffffff, 0.35)); cut.position.set(5, 3.4, 1.42); root.add(cut);
    const posts = STN.map((st, i) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.glow(HEX.warn)); root.add(p); return { st, p, lab: stage.label('', [xs(st.km), SEA + 1.3 + (i % 2) * 0.75, 0], root) }; });
    const minor = [posts[1].lab, posts[2].lab, stage.label('Last 3 km of sea and first 3 km of land, magnified', [7.4, 0.5, 1.5], root), stage.label('390 km of sea, squeezed', [-3, 0.5, 1.5], root)];
    const lState = stage.label('', [6.2, SEA + 3.1, 0], root, 'hot');

    let t = 0, key = '';
    const tc = tau(COAST);
    const hEff = (km) => Math.max(5, depth(km));
    return {
      seek(v) { t = v < 0 ? tc - 900 : v; },
      update(dt, s) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        const T = s.T * 60, sign = s.first === 'trough' ? -1 : 1, k2 = `${s.H0}|${s.T}|${s.first}`;
        if (k2 !== key) { if (key) t = Math.min(t, tc - 900); key = k2; }
        t += dt * 420; if (t > tc + 4 * T + 1200) t = 0;
        const eta = (km) => green(s.H0, 4000, hEff(km)) * train(t - tau(km), T, sign);
        const es = eta(COAST);
        sea.set(X0, X1, (x) => { const km = kmOf(x); return km < COAST ? SEA + eta(km) * VSW : elev(km) < es ? SEA + es * VSW : groundY(x) - 0.01; }, groundY);
        boat.position.set(xs(60), SEA + eta(60) * VSW, 0);
        posts.forEach(({ st, p, lab }) => {
          const h = hEff(st.km), e = eta(st.km);
          p.position.set(xs(st.km), SEA + e * VSW + 0.1, 1.2);
          lab.element.innerHTML = `${fmtM(Math.round(depth(st.km)))} deep · ${fmtN(kmh(cShallow(h)))} km/h · <b>${green(s.H0, 4000, h).toFixed(1)} m</b>`;
        });
        const u = t - tc;
        lState.element.innerHTML = u < -60 ? `Reaches the beach in ${fmtT(-u)}` : u > 4 * T ? 'The waves die away over hours' : es < -0.3 ? '<b>The sea pulls back</b>: get to high ground' : es > 0.3 ? `Wave ${Math.min(4, Math.floor(u / T) + 1)} floods in` : `Between waves · wave ${Math.min(4, Math.floor(u / T) + 1)} of 4`;
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const at = (h) => green(s.H0, 4000, h), T = s.T * 60, big = at(5);
        return compact(`<div class="big">${s.H0.toFixed(1)} m at sea, ${at(10).toFixed(1)} m near the shore</div>
          <div class="row"><span>At 4,000 m: ${fmtN(kmh(cShallow(4000)))} km/h</span><b>${fmtM(cShallow(4000) * T)} long</b></div>
          <div class="row"><span>At 200 m: ${fmtN(kmh(cShallow(200)))} km/h, ${at(200).toFixed(1)} m high</span><b>${fmtM(cShallow(200) * T)} long</b></div>
          <div class="row"><span>At 10 m: ${fmtN(kmh(cShallow(10)))} km/h, ${at(10).toFixed(1)} m high</span><b>${fmtM(cShallow(10) * T)} long</b></div>
          <div class="row"><span>${s.first === 'trough' ? 'Sea pulls back for about' : 'First rise lasts about'}</span><b>${Math.round(s.T / 2)} min</b></div>
          <small>Green's law: H = H₀ × (4,000 ÷ depth)^¼. The biggest of the four waves here is the second, about ${big.toFixed(1)} m at the beach. Real coasts can focus it far higher.</small>`);
      },
    };
  },
};
