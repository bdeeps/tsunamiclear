// Chapter 3: across the ocean. A live travel-time model of 26 December 2004 on a hand-made map of
// the Indian Ocean (js/ocean.js): the wave moves at c = √(g·h) through a simplified depth map and
// Dijkstra's method finds when it first reaches every cell. The rupture unzips north at 2.5 km/s.
// Reported arrivals (ranges, because gauges and eyewitnesses differ): northern Sumatra and the
// Nicobars within about 15–30 minutes; Thailand, Sri Lanka and India's east coast about 2 hours;
// Chennai's tide gauge 09:05 IST, 2 h 36 min after the quake; the Maldives 3–3½ h; Somalia about
// 7 h (NOAA; IOC-UNESCO; Nagarajan et al. 2006; Wikipedia "2004 Indian Ocean earthquake and tsunami").
// The model lands within about 10–20 % of these; it knows nothing about wave height.
import { THREE, M, compact, clamp, HEX, fmtN, fmtT, fitNarrow, inReel } from '../tsunami.js';
import { canvasTexture } from '../kit.js';
import { GRID, buildOcean, travelTimes, PLACES, seaCell, ruptureLine, RUPTURE_KM, lonOf, latOf } from '../ocean.js';

const { W, H, lon0, lat0, d } = GRID;
const SX = 0.2, CX = lon0 + (W * d) / 2, CZ = lat0 + (H * d) / 2;
const mapX = (lon) => (lon - CX) * SX, mapZ = (lat) => -(lat - CZ) * SX;
const PERIOD = 1500;   // seconds between the drawn crests (tsunami periods in 2004 were roughly 20–40 minutes)
const clock = (h) => { const m = Math.round(6 * 60 + 29 + h * 60); return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m >= 720 ? 'pm' : 'am'}`; };

export default {
  id: 'across',
  short: 'Across the ocean',
  title: 'Across the ocean',
  subtitle: '26 December 2004: minutes to Aceh, about two hours to India and Sri Lanka, seven to Africa.',
  view: { pos: [0.6, 13.5, 8.2], target: [0.6, 0, 0.4] },
  learn: `<p>Once the wave is made, its path is simple physics. At every point it moves at <b>√(g × depth)</b>, so if you know the depth of the sea you can work out when it will arrive anywhere. This map does that live for the earthquake of <b>26 December 2004</b>, which began off Sumatra at about 6:29 in the morning, Indian time.</p>
    <p>The break did not happen at one point. It <b>unzipped northwards</b> for about 1,300 km in 8 to 10 minutes, past the Nicobar and Andaman Islands. So the wave started along a long line, and most of its energy went out sideways from that line: <b>east</b> to Sumatra and Thailand, and <b>west</b> to Sri Lanka and India.</p>
    <p>Reported times, all approximate: northern Sumatra and the Nicobar Islands were hit within about <b>15 to 30 minutes</b>. Thailand, Sri Lanka and the coast of Tamil Nadu were hit after about <b>2 hours</b>; the tide gauge at Chennai recorded the first wave at 9:05 am, 2 hours 36 minutes after the quake. The Maldives followed after 3 to 3½ hours and Somalia after about <b>7 hours</b>.</p>
    <p>The fronts are not circles. They race ahead over deep water and lag over shallow shelves, so they <b>bend</b> towards coasts and wrap around islands. That is how the wave turned the corner of Sri Lanka and still hit Kerala on the far side of India.</p>
    <p>Two hours was enough time to walk to safety. There was simply no system to tell anyone.</p>
    <p class="tip"><b>Try it:</b> drag the time. Then shorten the break: if only the southern end had slipped, the wave would have reached India later.</p>`,
  terms: [
    { t: 'Travel time', d: 'How long the first wave takes to reach a place. It depends only on the depth of sea along the way.' },
    { t: 'Refraction', d: 'Waves bending towards shallower water because the part in shallow water slows down.' },
    { t: 'Near-field', d: 'Coasts so close to the source that the wave arrives in minutes, before any official warning.' },
    { t: 'Far-field', d: 'Coasts hours away, where a warning system can save almost everyone.' },
  ],
  defaults: { t: 0, play: true, len: 1300 },
  controls: [
    { key: 't', type: 'range', label: 'Time after the earthquake', min: 0, max: 9, step: 0.05, fmt: (v) => `${fmtT(v * 3600)} · ${clock(v)} IST` },
    { key: 'play', type: 'toggle', label: 'Play', hint: 'One hour passes in about two seconds.' },
    { key: 'len', type: 'range', label: 'Length of the break', min: 100, max: 1300, step: 100, fmt: (v) => `${fmtN(v)} km`, ends: ['100 km', '1,300 km (2004)'] },
  ],
  quiz: [
    { q: 'About how long did the 2004 tsunami take to reach the coast of Tamil Nadu?', options: ['About 5 minutes', 'About 2 hours', 'About 12 hours', 'About 2 days'], answer: 1, why: 'Chennai’s tide gauge recorded it 2 hours 36 minutes after the quake. In deep water it travelled at 600–700 km/h.' },
    { q: 'Why do tsunami fronts bend towards a coast and wrap around islands?', options: ['Wind pushes them', 'The wave slows in shallow water, so the front swings round', 'Islands attract water', 'The Earth’s spin'], answer: 1, why: 'Speed is √(g × depth). The part of the front over shallower water falls behind, which turns the wave.' },
    { q: 'Which places can an official warning not help much?', options: ['Coasts 7 hours away', 'Coasts right next to the source, hit within minutes', 'Ships at sea', 'Places far inland'], answer: 1, why: 'In the near-field the wave beats any bulletin. There the earthquake itself is the warning.' },
  ],
  reel: [
    { ms: 7000, caption: '26 December 2004. The wave reached Aceh in minutes, India and Sri Lanka in about two hours.', set: { play: false, len: 1300, t: 0 }, anim: { t: [0, 2.7] }, view: { pos: [3.4, 8.5, 4.6], target: [3.4, 0, -0.6] }, spin: 0 },
    { ms: 6000, caption: 'Seven hours later it reached Africa. There was no warning system in the Indian Ocean.', set: { play: false, len: 1300, t: 2.7 }, anim: { t: [2.7, 7.6] }, view: { pos: [0.6, 15, 5.5], target: [0.6, 0, 0.2] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const oc = buildOcean();
    let T = null, len = -1;
    const PX = 8;
    const base = canvasTexture(W * PX, H * PX, (g) => {
      if (!T) return;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const n = j * W + i, y = (H - 1 - j) * PX;
        if (oc.land[n]) g.fillStyle = '#566246';
        else { const k = clamp(Math.sqrt(oc.depth[n] / 4500), 0, 1); g.fillStyle = `rgb(${Math.round(46 - 34 * k)},${Math.round(120 - 82 * k)},${Math.round(160 - 78 * k)})`; }
        g.fillRect(i * PX, y, PX, PX);
      }
      // Hourly lines: where the whole hour changes between neighbouring cells.
      g.fillStyle = 'rgba(255,255,255,.5)';
      for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
        const n = j * W + i, a = T[n]; if (!isFinite(a)) continue;
        const ha = Math.floor(a / 3600);
        if ((isFinite(T[n + 1]) && Math.floor(T[n + 1] / 3600) !== ha) || (isFinite(T[n + W]) && Math.floor(T[n + W] / 3600) !== ha)) g.fillRect(i * PX + PX / 2, (H - 1 - j) * PX - PX / 2 + PX / 2, PX / 2.5, PX / 2.5);
      }
      g.strokeStyle = '#ff7a59'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
      ruptureLine(len, 10).forEach((p, i) => { const x = ((p.lon - lon0) / d) * PX, y = (H - (p.lat - lat0) / d) * PX; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
    });
    const map = new THREE.Mesh(new THREE.PlaneGeometry(W * d * SX, H * d * SX), new THREE.MeshBasicMaterial({ map: base.tex, toneMapped: false }));
    map.rotation.x = -Math.PI / 2; root.add(map);
    const slabUnder = new THREE.Mesh(new THREE.BoxGeometry(W * d * SX + 0.2, 0.25, H * d * SX + 0.2), M.matte(0x1a2130)); slabUnder.position.y = -0.135; root.add(slabUnder);
    // The moving wave: a small canvas (one pixel per cell, smoothed by the graphics card) on a
    // mesh that is also raised into a ridge where the crests are.
    const ov = document.createElement('canvas'); ov.width = W; ov.height = H;
    const og = ov.getContext('2d'), img = og.createImageData(W, H), otex = new THREE.CanvasTexture(ov); otex.colorSpace = THREE.SRGBColorSpace;
    const wgeo = new THREE.PlaneGeometry(W * d * SX, H * d * SX, W - 1, H - 1);
    const wave = new THREE.Mesh(wgeo, new THREE.MeshBasicMaterial({ map: otex, transparent: true, toneMapped: false, depthWrite: false }));
    wave.rotation.x = -Math.PI / 2; wave.position.y = 0.02; root.add(wave);
    const wp = wgeo.attributes.position;

    const pins = PLACES.map((p) => {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 10), M.glow(0xffffff)); pin.rotation.x = Math.PI; pin.position.set(mapX(p.lon), 0.2, mapZ(p.lat)); root.add(pin);
      return { p, pin, cell: seaCell(oc, p.lon, p.lat), lab: stage.label(p.name, [mapX(p.lon), 0.55, mapZ(p.lat)], root) };
    });
    const minorIds = ['blair', 'naga', 'lanka'];
    const minor = pins.filter((q) => minorIds.includes(q.p.id)).map((q) => q.lab);
    const lRup = stage.label('The break', [mapX(90.2), 0.3, mapZ(8.5)], root, 'hot'); minor.push(lRup);
    minor.push(stage.label('India', [mapX(77.5), 0.2, mapZ(17)], root), stage.label('Africa', [mapX(40), 0.2, mapZ(2)], root), stage.label('Sumatra', [mapX(101.5), 0.2, mapZ(-0.5)], root));

    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        const L = Math.min(RUPTURE_KM, s.len >= 1300 ? RUPTURE_KM : s.len);
        if (L !== len) { len = L; T = travelTimes(oc, len); base.redraw(); }
        if (s.play && !inReel()) { s.t += dt / 2; if (s.t > 9) s.t = 0; }
        const t = s.t * 3600;
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
          const n = j * W + i, row = H - 1 - j, o = (row * W + i) * 4, a = t - T[n];
          let v = 0, crest = 0;
          if (a > 0 && isFinite(a)) { const env = Math.exp(-a / 5000) * clamp(a / 240, 0, 1); crest = Math.cos((a / PERIOD) * Math.PI * 2 - 0.6); v = env * Math.max(0, crest) ** 1.5; }
          img.data[o] = 200; img.data[o + 1] = 245; img.data[o + 2] = 255; img.data[o + 3] = Math.round(235 * v);
          wp.setZ(row * W + i, v * 0.22);
        }
        og.putImageData(img, 0, 0); otex.needsUpdate = true; wp.needsUpdate = true;
        pins.forEach((q) => {
          const at = T[q.cell], hit = t >= at;
          q.pin.material.color.setHex(hit ? HEX.hot : 0xffffff);
          q.lab.element.className = 'lbl' + (hit ? ' hot' : '');
          q.lab.element.innerHTML = `${q.p.name} · ${fmtT(at)}`;
        });
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); otex.dispose(); },
      readout: (s) => {
        if (!T) return '';
        const t = s.t * 3600, rows = pins.map((q) => ({ ...q, at: T[q.cell] })).sort((a, b) => a.at - b.at);
        const hitN = rows.filter((r) => t >= r.at).length, next = rows.find((r) => t < r.at);
        const pick = ['aceh', 'chennai', 'lanka', 'somalia'].map((id) => rows.find((r) => r.p.id === id));
        return compact(`<div class="big">${fmtT(t)} after the quake</div>
          <div class="row"><span>Clock in India</span><b>${clock(s.t)}</b></div>
          <div class="row"><span>${next ? 'Next: ' + next.p.name : 'All marked places reached'}</span><b>${next ? 'in ' + fmtT(next.at - t) : hitN + ' of ' + rows.length}</b></div>
          ${pick.map((r) => `<div class="row"><span>${r.p.name}: model ${fmtT(r.at)}</span><b>reported ${r.p.say}</b></div>`).join('')}
          <small>${len < RUPTURE_KM - 1 ? 'A shorter break than 2004: the reported times no longer apply. ' : ''}A simplified depth map, good to about 10–20 %. White dots mark each hour.</small>`);
      },
    };
  },
};
