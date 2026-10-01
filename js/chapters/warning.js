// Chapter 5: warning systems. A timeline model of an end-to-end tsunami warning: seismic waves
// (P-waves, about 8 km/s through the upper mantle) reach seismometers in seconds to minutes; the
// tsunami crosses the ocean at √(g·h); a bottom pressure recorder on the sea bed feels the extra
// weight of water as the wave passes (Δp = ρ·g·η) and reports through a surface buoy and satellite;
// tide gauges confirm it at the coast. The lead time is the wave's arrival minus the first bulletin.
// Indian Tsunami Early Warning Centre (ITEWC): set up by the Ministry of Earth Sciences at INCOIS,
// Hyderabad, inaugurated 15 October 2007; a seismic network, bottom pressure recorders and tide
// gauges; a database of pre-computed model scenarios; first bulletins about 10 minutes after a big
// undersea quake (INCOIS; NDMA "Tsunami"; Nayak & Kumar 2008). The 15 minutes added for the
// shallow shelf is a round figure. Sea-bed sensors of the DART kind resolve about a millimetre of
// sea-level change in 6,000 m of water (NOAA NDBC / PMEL).
import { THREE, M, compact, box, sphere, clamp, slab, waterMat, rockMat, HEX, COL, G, RHO, cShallow, kmh, fmtN, fmtT, board, panelBg, placeBoard, fitNarrow, inReel, hut } from '../tsunami.js';
import { beam, smooth } from '../kit.js';

const SRC = -9, SHORE = 6, SEA = 3, BED = 0.7, FB = 0.4, LOOP = 14;
const times = (s) => {
  const c = cShallow(s.h), arr = (s.D * 1000) / c + 900, bpr = (FB * s.D * 1000) / c, seis = Math.min(s.D / 8, 120), bull = s.bull * 60;
  return { c, arr, bpr, seis, bull, lead: arr - bull, end: Math.max(arr, bull) + 600 };
};

export default {
  id: 'warning',
  short: 'Warning systems',
  title: 'Warning systems',
  subtitle: 'An earthquake’s waves travel 40 times faster than the tsunami. That gap is where lives are saved.',
  view: { pos: [0.5, 6.5, 22], target: [0.5, 2.6, 0] },
  learn: `<p>A tsunami in the open sea moves at about 700 km/h. An earthquake's own waves move through rock at about <b>8 km a second</b>, 40 times faster. So the ground can tell us about the quake long before the water arrives. A warning system has three kinds of sensor:</p>
    <p><b>Seismometers</b> pick up the quake within a minute or two and give its place, depth and size. That says a tsunami is <i>possible</i>. <b>Bottom pressure recorders</b> sit on the deep sea bed and weigh the water above them; when a tsunami passes, the pressure rises by a tiny amount, and a buoy at the surface sends the reading up to a satellite. That says a tsunami is <i>real</i>. <b>Tide gauges</b> at ports then show its true height at the coast.</p>
    <p><b>India's centre.</b> After 2004 the government set up the <b>Indian Tsunami Early Warning Centre</b> at INCOIS in Hyderabad. It was inaugurated in October 2007 and works round the clock. Running a full computer model after a quake would take too long, so the centre keeps a library of <b>pre-computed scenarios</b>. When a big undersea quake happens it picks the nearest match, reads off arrival times and wave heights for each stretch of coast, and sends its first bulletin in about <b>10 minutes</b> (INCOIS). It then watches the sea-bed sensors and tide gauges and upgrades or cancels. It also advises other Indian Ocean countries.</p>
    <p><b>Why was there nothing in 2004?</b> The Pacific had a warning system from 1949, because Pacific tsunamis are frequent. Big Indian Ocean tsunamis are rare; the last had been in 1945. There were no deep-sea sensors, few real-time tide gauges and no agreed way to pass a message to coastal towns. Scientists in Hawaii saw the earthquake within minutes but had no one to call.</p>
    <p><b>The limit.</b> For the Andaman and Nicobar Islands a quake on the nearby trench sends a wave in minutes. No bulletin can beat that. There, and anywhere you feel a strong or long quake at the coast, the shaking itself is the warning.</p>
    <p class="tip"><b>Try it:</b> move the earthquake closer to the coast until the wave beats the bulletin. Then move it far away and see how many minutes people get.</p>`,
  terms: [
    { t: 'Seismometer', d: 'An instrument that records the ground shaking. A network of them locates and sizes a quake in minutes.' },
    { t: 'Bottom pressure recorder', d: 'A sensor on the deep sea bed that detects a passing tsunami from the tiny rise in water pressure.' },
    { t: 'DART buoy', d: 'Deep-ocean Assessment and Reporting of Tsunamis: a sea-bed recorder linked by sound to a surface buoy and a satellite.' },
    { t: 'Tide gauge', d: 'A sea-level recorder at a port. It confirms a tsunami’s height at the coast.' },
    { t: 'INCOIS', d: 'Indian National Centre for Ocean Information Services, Hyderabad, home of the tsunami warning centre.' },
  ],
  defaults: { D: 1500, h: 3500, bull: 10 },
  controls: [
    { key: 'D', type: 'log', label: 'Earthquake’s distance from the coast', min: 50, max: 5000, fmt: (v) => `${fmtN(Math.round(v / 10) * 10)} km`, ends: ['50 km', '5,000 km'], hint: 'Nicobar to the Sunda Trench: about 100 km. Chennai to the 2004 break: about 1,500 km.' },
    { key: 'h', type: 'range', label: 'Depth of the ocean on the way', min: 1000, max: 5000, step: 100, fmt: (v) => `${fmtN(v)} m` },
    { key: 'bull', type: 'range', label: 'First bulletin goes out after', min: 5, max: 30, step: 1, fmt: (v) => `${v} min` },
  ],
  quiz: [
    { q: 'What does a sea-bed pressure recorder measure?', options: ['The earthquake’s magnitude', 'The tiny rise in pressure as a tsunami’s extra water passes overhead', 'Wind speed', 'Water temperature'], answer: 1, why: 'More water above means more pressure: Δp = ρ × g × height. It confirms that a tsunami really exists.' },
    { q: 'Where is India’s tsunami warning centre?', options: ['IMD, New Delhi', 'INCOIS, Hyderabad', 'ISRO, Bengaluru', 'NIO, Goa'], answer: 1, why: 'The Indian Tsunami Early Warning Centre at INCOIS, Hyderabad, was inaugurated in October 2007.' },
    { q: 'Why can a warning centre not protect a coast right beside the earthquake?', options: ['The sensors do not work there', 'The wave arrives in minutes, before a bulletin can be issued and acted on', 'Tsunamis are smaller nearby', 'It can, easily'], answer: 1, why: 'Near the source the shaking is the only warning. Do not wait for a message: go to high ground.' },
  ],
  reel: [
    { ms: 7000, caption: 'Earthquake waves outrun the tsunami. Seismometers, sea-bed sensors and tide gauges turn that into a warning.', set: { D: 1500, h: 3500, bull: 10 }, act: (s, inst) => inst.seek?.(0), view: { pos: [0, 6, 14], target: [0, 4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const groundY = (x) => (x < 4.4 ? BED : x < SHORE ? BED + (SEA - BED) * smooth((x - 4.4) / 1.6) : SEA + 0.4 * smooth((x - SHORE) / 0.8));
    const ground = slab(120, -1.6, 1.6, rockMat(HEX.rock)); ground.set(-10, 10, groundY, () => 0); root.add(ground);
    const sea = slab(160, -1.6, 1.6, waterMat(0.42)); root.add(sea);
    const xb = SRC + (SHORE - SRC) * FB;
    // Sea-bed recorder, its buoy and the satellite.
    const bpr = box(0.5, 0.25, 0.5, M.plastic(HEX.warn)); bpr.position.set(xb, BED + 0.13, 0);
    const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16), M.plastic(0xffc233)); const mast = beam([0, 0, 0], [0, 0.6, 0], 0.03, M.metal()); buoy.add(mast);
    const cable = beam([xb, BED + 0.3, 0], [xb, SEA - 0.1, 0], 0.012, M.matte(0x222831));
    const sat = new THREE.Group(); const sb = box(0.4, 0.3, 0.3, M.metal(0xd0d6e0)); const p1 = box(0.7, 0.02, 0.3, M.plastic(0x2a56c6)); p1.position.x = 0.55; const p2 = p1.clone(); p2.position.x = -0.55; sat.add(sb, p1, p2); sat.position.set(4.2, 8.4, -0.5);
    // On land: seismometer, tide gauge, siren, the warning centre and a few homes.
    const seismo = box(0.35, 0.25, 0.35, M.plastic(0x8ef0ff)); seismo.position.set(7.4, SEA + 0.53, 1);
    const gauge = beam([SHORE - 0.25, SEA - 0.6, 0.9], [SHORE - 0.25, SEA + 0.7, 0.9], 0.05, M.metal(0xe8eef8));
    const centre = new THREE.Group(); const cb = box(1.3, 0.9, 1, M.matte(0xcfd6e2)); cb.position.y = 0.45; const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), M.metal(0xffffff)); dish.rotation.x = Math.PI; dish.position.set(0.3, 1.25, 0); const lamp = sphere(0.13, M.glow(0x444a55), 12); lamp.position.set(-0.4, 1.05, 0.2); centre.add(cb, dish, lamp); centre.position.set(8.9, SEA + 0.4, -0.4);
    const siren = new THREE.Group(); siren.add(beam([0, 0, 0], [0, 1.5, 0], 0.04, M.metal())); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), M.plastic(HEX.hot)); horn.rotation.z = Math.PI / 2; horn.position.set(-0.1, 1.5, 0); siren.add(horn); siren.position.set(6.7, SEA + 0.35, -0.9);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 48), M.glow(HEX.hot, { transparent: true })); ring.position.set(6.7, SEA + 1.85, -0.9); ring.rotation.y = Math.PI / 2;
    const homes = [[7.3, -0.6], [7.9, 0.9], [8.2, -1.1]].map(([x, z]) => { const hh = hut(0.4); hh.position.set(x, SEA + 0.4, z); return hh; });
    const star = sphere(0.22, M.glow(HEX.hot), 16); star.position.set(SRC, BED, 0);
    const pwave = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 8, 64), M.glow(0xffffff, { transparent: true })); pwave.position.set(SRC, BED, 1.62);
    root.add(bpr, buoy, cable, sat, seismo, gauge, centre, siren, ring, star, pwave, ...homes);
    const V = (x, y, z) => new THREE.Vector3(x, y, z), cPos = V(8.9, SEA + 1.6, -0.4);
    const paths = {
      seis: [V(7.4, SEA + 0.7, 1), cPos],
      bpr: [V(xb, BED + 0.3, 0), V(xb, SEA + 0.6, 0), V(4.2, 8.4, -0.5), cPos],
      bull: [cPos, V(6.7, SEA + 1.85, -0.9)],
      gauge: [V(SHORE - 0.25, SEA + 0.7, 0.9), cPos],
    };
    const dots = Object.fromEntries(Object.keys(paths).map((k) => { const m = sphere(0.12, M.glow(k === 'bull' ? HEX.hot : HEX.ok), 12); m.visible = false; root.add(m); return [k, m]; }));
    const along = (pts, u, out) => { const n = pts.length - 1, f = clamp(u, 0, 0.9999) * n, i = Math.floor(f); return out.lerpVectors(pts[i], pts[i + 1], f - i); };

    const minor = [
      stage.label('Sea-bed pressure recorder', [xb, BED - 0.4, 1.7], root), stage.label('Buoy', [xb - 0.9, SEA + 0.7, 0], root), stage.label('Satellite', [4.2, 9.1, -0.5], root),
      stage.label('Seismometer', [7.4, SEA + 0.05, 1.7], root), stage.label('Tide gauge', [SHORE - 0.3, SEA + 1.1, 1.2], root), stage.label('Siren', [6.2, SEA + 2.5, -0.9], root),
    ];
    const lC = stage.label('Warning centre (INCOIS)', [8.9, SEA + 2.3, -0.4], root, 'hot');
    const lQ = stage.label('Earthquake', [SRC + 0.6, BED - 0.4, 1.7], root, 'hot');
    const lClock = stage.label('', [-1, SEA + 1.4, 0], root, 'hot');

    let cur = null, tNow = 0;
    const brd = board(root, 14, 4.2, 1100, 330, (g, w, h) => {
      panelBg(g, w, h);
      if (!cur) return;
      g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Minutes after the earthquake', 24, 44);
      const x0 = 40, x1 = w - 40, y = 190, X = (t) => x0 + (t / cur.end) * (x1 - x0);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.fillStyle = cur.lead > 0 ? 'rgba(163,230,53,.35)' : 'rgba(255,90,138,.45)'; g.fillRect(X(Math.min(cur.bull, cur.arr)), y - 13, Math.abs(X(cur.arr) - X(cur.bull)), 26);
      // [time, name, colour, row (-2, -1 above; 1, 2 below), anchor]
      [[cur.seis, 'Quake detected', COL.wave, -2, 0], [cur.bpr, 'Sea-bed sensor confirms', COL.ok, -1, 0.5], [cur.bull, 'First bulletin', COL.warn, 1, 0], [cur.arr, 'Wave reaches the coast', COL.bad, 2, 1]].forEach(([t, name, col, row, anchor]) => {
        g.fillStyle = col; g.beginPath(); g.arc(X(t), y, 11, 0, 7); g.fill();
        g.font = '26px sans-serif'; const txt = `${name} · ${fmtT(t)}`, tw = g.measureText(txt).width;
        g.fillText(txt, clamp(X(t) - tw * anchor, 8, w - tw - 8), y + (row < 0 ? row * 34 + 8 : row * 36 + 14));
      });
      g.fillStyle = '#fff'; g.fillRect(X(Math.min(tNow, cur.end)) - 2, y - 26, 4, 52);
    }, [0, -2.4, 1.7]);

    let td = 0, key = '', lastDraw = 0;
    const v = new THREE.Vector3();
    return {
      seek(x) { td = x; },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor);
        placeBoard(brd, [[0, -2.4, 1.7], 0, 1], [[0, -1.9, 1.7], 0, 0.6]);
        brd.mesh.visible = !narrow || inReel();
        const tm = times(s), k2 = `${Math.round(s.D)}|${s.h}|${s.bull}`;
        if (k2 !== key) { key = k2; cur = tm; lastDraw = -1; }
        td = (td + dt) % LOOP; const rate = tm.end / (LOOP - 1.5); tNow = Math.min(tm.end, td * rate);
        if (Math.abs(td - lastDraw) > 0.1) { lastDraw = td; brd.redraw(); }
        // The tsunami: two humps leave the source; one runs to the coast.
        const xf = SRC + (SHORE - SRC) * Math.min(1, tNow / tm.arr), gone = tNow >= tm.arr;
        const hump = (x, c, a) => a * Math.exp(-(((x - c) / 0.8) ** 2));
        sea.set(-10, SHORE + 0.9, (x) => SEA + hump(x, xf, gone ? 0.15 + 0.3 * Math.max(0, 1 - (tNow - tm.arr) / 300) : 0.3 + 0.25 * smooth((xf - 3.5) / 2.5)) + (gone ? 0.25 * smooth((x - 5) / 1.2) * Math.min(1, (tNow - tm.arr) / 200) : 0), groundY);
        buoy.position.set(xb, SEA + hump(xb, xf, 0.3) + 0.05, 0);
        // The seismic wave flashes across in the first moments.
        const pk = clamp(td / 0.7, 0, 1); pwave.scale.setScalar(0.2 + 17 * pk); pwave.material.opacity = 1 - pk; pwave.visible = pk < 1;
        star.scale.setScalar(1 + 0.5 * Math.max(0, 1 - td));
        // Messages.
        const shoot = (k, at, dur = 0.9) => { const u = (td - Math.max(at / rate, k === 'seis' ? 0.7 : 0)) / dur; dots[k].visible = u > 0 && u < 1; if (dots[k].visible) dots[k].position.copy(along(paths[k], u, v)); };
        shoot('seis', tm.seis, 0.5); shoot('bpr', tm.bpr, 1.2); shoot('bull', tm.bull, 0.5); shoot('gauge', tm.arr, 0.5);
        const warned = tNow >= tm.bull;
        lamp.material.color.setHex(warned ? 0xff5a3a : 0x444a55);
        ring.visible = warned; ring.scale.setScalar(1 + ((td * 2) % 1) * 1.6); ring.material.opacity = 1 - ((td * 2) % 1);
        bpr.material.emissive?.setHex(tNow >= tm.bpr && tNow < tm.bpr + tm.end * 0.08 ? 0xffaa00 : 0);
        lClock.element.innerHTML = `${fmtT(tNow)} after the quake · wave at ${fmtN(kmh(tm.c))} km/h`;
        lC.element.innerHTML = warned ? 'Warning centre: <b>bulletin sent</b>' : tNow >= tm.seis ? 'Warning centre: working out the quake' : 'Warning centre (INCOIS)';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const tm = times(s), dp = RHO * G * 0.5, p0 = RHO * G * s.h;
        return compact(`<div class="big">${tm.lead > 60 ? `${fmtT(tm.lead)} of warning` : tm.lead > -60 ? 'No time at all' : `The wave wins by ${fmtT(-tm.lead)}`}</div>
          <div class="row"><span>Wave reaches the coast after</span><b>${fmtT(tm.arr)}</b></div>
          <div class="row"><span>First bulletin after</span><b>${fmtT(tm.bull)}</b></div>
          <div class="row"><span>Sea-bed sensor confirms after</span><b>${fmtT(tm.bpr)}</b></div>
          <div class="row"><span>A 50 cm wave adds</span><b>${fmtN(Math.round(dp / 10) * 10)} Pa to ${(p0 / 1e6).toFixed(0)} million</b></div>
          <small class="${tm.lead > 1800 ? 'ok' : tm.lead > 60 ? '' : 'no'}">${tm.lead > 1800 ? 'Far-field: enough time for sirens, messages and a walk to high ground.' : tm.lead > 60 ? 'Tight. People still need to hear the warning and move.' : 'Near-field: the shaking is the only warning. Go to high ground at once.'}</small>`);
      },
    };
  },
};
