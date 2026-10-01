// Chapter 6: 26 December 2004 and staying safe. An evacuation model: a family 100 m from the
// beach, a warning time, a delay before they move, and high ground some distance inland.
// Walking pace 4 km/h (a mixed group with children and elders). Flood front speed on land 4 m/s,
// about 14 km/h: video analysis in Banda Aceh gave 2–5 m/s, more near the shore (Fritz et al. 2006).
// How far the flood runs over flat ground: x = 0.06 · H^(4/3) ÷ n² (Hills & Mader 1997; Bryant,
// "Tsunami: The Underrated Hazard"), n = Manning roughness: 0.015 open ground, 0.03 buildings,
// 0.07 dense forest. It is a rule of thumb for flat land and a single wave. Trees stop helping as
// the water deepens: Shuto (1987) found coastal forest in Japan effective below about 3–4 m of flow
// and broken above it, so the forest's roughness is faded to that of open buildings between 3 and 6 m.
// 2004 figures: magnitude 9.1 (USGS) to 9.3; about 227,900 dead or missing in 14 countries (USGS);
// India: 10,749 dead and 5,640 missing by the Ministry of Home Affairs' count, with other tallies
// giving about 12,400 confirmed dead, roughly 8,000 of them in Tamil Nadu and 3,500 in the Andaman
// and Nicobar Islands. Guidance: NDMA "Tsunami: Do's & Don'ts" and INCOIS/IOC natural warning signs.
// Mangroves: Danielsen et al. 2005 (Science 310) and Kathiresan & Rajendran 2005 reported less
// damage behind trees in Tamil Nadu; Kerr, Baird & Campbell 2006 showed distance from the sea and
// height of the land explain most of it. Simeulue: 7 deaths among about 78,000 (McAdoo et al. 2006).
import { THREE, M, compact, box, clamp, slab, waterMat, rockMat, HEX, inundation, fmtN, fmtM, fmtT, fitNarrow, palm, hut, person } from '../tsunami.js';
import { smooth } from '../kit.js';

const SHORE_X = -7, UNIT = 250, SEA = 0.8, LAND = 0.85, VS = 0.1, HOME = 100, WALK = 4 / 3.6, FLOW = 4, LOOP = 15;
const X = (m) => SHORE_X + m / UNIT;
const COVER = { open: { n: 0.015, name: 'open ground' }, town: { n: 0.03, name: 'buildings' }, forest: { n: 0.07, name: 'dense forest' } };
const rough = (s) => (s.cover === 'forest' ? 0.07 - 0.04 * clamp((s.H - 3) / 3, 0, 1) : COVER[s.cover].n);
function plan(s) {
  const xh = HOME + s.far * 1000, Tarr = s.warn * 60, start = s.wait * 60, reach = start + (s.far * 1000) / WALK;
  const xmaxFree = inundation(s.H, rough(s)), xmax = Math.min(xmaxFree, xh + 40);
  const pos = (t) => Math.min(xh, HOME + WALK * Math.max(0, t - start)), front = (t) => clamp(FLOW * (t - Tarr), 0, xmax);
  let caught = -1; const end = Tarr + xmax / FLOW + 60;
  for (let t = Tarr; t <= end; t += 5) if (pos(t) < xh && front(t) >= pos(t)) { caught = t; break; }
  // The place they must get past: the high ground, or the edge of the flood if it stops sooner.
  const clearAt = Math.min(xh, xmaxFree + 20), clear = start + Math.max(0, clearAt - HOME) / WALK;
  return { xh, Tarr, start, reach, clear, xmax, xmaxFree, pos, front, caught, end, spare: Tarr + clearAt / FLOW - clear, floodsHome: xmaxFree >= HOME };
}

export default {
  id: 'safe',
  short: '2004 and staying safe',
  title: '26 December 2004, and staying safe',
  subtitle: 'What happened, who survived and why, and what to do if the sea ever warns you.',
  view: { pos: [-1.6, 6.8, 17.5], target: [-1.6, 3, 0] },
  learn: `<p><b>The day.</b> At 6:29 am Indian time on Sunday 26 December 2004, a magnitude 9.1 to 9.3 earthquake broke the sea floor off Sumatra. The tsunami that followed killed about <b>2.3 lakh people in 14 countries</b> (USGS: about 227,900 dead or missing), most of them in Aceh. In India the official count was about 10,700 dead and 5,600 missing; other tallies give about 12,400 confirmed dead. Tamil Nadu lost about 8,000 people, most in Nagapattinam district, and the Andaman and Nicobar Islands about 3,500, with Puducherry, Kerala and Andhra Pradesh also hit. All such figures are estimates.</p>
    <p><b>People who knew.</b> On Simeulue island, closest to the earthquake, an old teaching called <b>smong</b>, handed down since a tsunami in 1907, says: if the ground shakes hard and the sea draws back, run for the hills. Almost everyone did, and only about seven of some 78,000 islanders died. The <b>Moken</b> sea people of Thailand's Surin Islands and tribal communities of the Andamans read the same signs and moved uphill. On a beach in Phuket a ten-year-old, <b>Tilly Smith</b>, saw the sea froth and pull back, remembered a geography lesson from two weeks before and told her parents; about a hundred people left that beach in time.</p>
    <p><b>Mangroves and shelter belts.</b> After 2004, studies in Tamil Nadu found villages behind mangroves and casuarina belts less damaged. Later work showed that much of the difference came from those villages being farther from the sea and on higher ground. The fair summary: thick coastal forest can slow and weaken a small or moderate flood and catch debris, but it will not stop a large tsunami, and it is no substitute for getting away. The model below shows the same thing.</p>
    <p><b>What to do</b> (NDMA and INCOIS). Any one of these is your warning: a <b>strong earthquake</b>, or one that goes on for a long time, while you are near the coast; the <b>sea suddenly pulling back</b> or rising strangely; a <b>loud roar</b> from the sea. Then:</p>
    <p>1. <b>Go at once</b> to high ground or inland, on foot. NDMA suggests 30 m above sea level or 3 km inland if you can; if not, the upper floors of a strong concrete building. Do not wait for an official warning.<br>2. <b>Do not go to look</b> at the sea or the exposed sea bed.<br>3. <b>Stay there for hours.</b> More waves follow, and the first is often not the largest. Come back only when the authorities say so.<br>4. Stay away from rivers and creeks that lead to the sea; the wave runs up them.<br>5. A boat in deep water is safer staying out there than coming into harbour.<br>Emergency number: <b>112</b>. NDMA helpline: <b>1078</b>. Official bulletins: INCOIS (tsunami.incois.gov.in).</p>
    <p>Related boxes: <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/cycloneclear/">CycloneClear</a> for storm surges, <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/stormclear/">StormClear</a> for thunderstorms and lightning, <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/tornadoclear/">TornadoClear</a> for tornadoes and <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/waveclear/">WaveClear</a> for how waves work.</p>
    <p class="tip"><b>Try it:</b> give the family 20 minutes and see how much waiting they can afford. Then change the ground from open to forest, and make the wave bigger.</p>`,
  terms: [
    { t: 'Natural warning', d: 'A strong or long earthquake, the sea pulling back, or a roar from the sea. Any one means go now.' },
    { t: 'High ground', d: 'Land well above the sea. NDMA suggests 30 m up or 3 km inland where possible.' },
    { t: 'Vertical evacuation', d: 'Climbing to the upper floors of a strong building when there is no time to get inland.' },
    { t: 'Smong', d: 'The Simeulue islanders’ word and teaching about tsunamis, passed down since 1907.' },
    { t: 'Shelter belt', d: 'A strip of trees such as mangroves or casuarina along a coast. It helps against small floods and wind, not large tsunamis.' },
  ],
  defaults: { warn: 20, wait: 5, far: 0.8, H: 5, cover: 'town' },
  controls: [
    { key: 'warn', type: 'range', label: 'Time from the warning sign to the wave', min: 5, max: 150, step: 5, fmt: (v) => `${v} min`, ends: ['5 min: Nicobar', '150 min: Chennai'] },
    { key: 'wait', type: 'range', label: 'How long they wait before moving', min: 0, max: 60, step: 1, fmt: (v) => (v ? `${v} min` : 'They go at once') },
    { key: 'far', type: 'range', label: 'Distance to high ground', min: 0.2, max: 2.8, step: 0.1, fmt: (v) => `${v.toFixed(1)} km` },
    { key: 'H', type: 'range', label: 'Height of the water at the shore', min: 1, max: 10, step: 0.5, fmt: (v) => `${v} m` },
    { key: 'cover', type: 'seg', label: 'What the flood crosses', options: [{ v: 'open', label: 'Open ground' }, { v: 'town', label: 'Buildings' }, { v: 'forest', label: 'Dense forest all the way' }], hint: 'A narrow belt of trees is not the same as forest all the way. Big waves snap trees.' },
  ],
  quiz: [
    { q: 'You are on a beach and feel a strong earthquake that goes on for a minute. What do you do?', options: ['Wait for a message on your phone', 'Go to high ground or inland at once, on foot', 'Go to the water’s edge to check the sea', 'Carry on as before'], answer: 1, why: 'Near the source the wave can arrive in minutes. The shaking is the warning, and official bulletins may come too late.' },
    { q: 'How long should you stay on high ground after the first wave?', options: ['10 minutes', 'Until the sea looks normal', 'Hours, until the authorities say it is safe', 'There is only ever one wave'], answer: 2, why: 'A tsunami is a train of waves over many hours, and later waves can be larger than the first.' },
    { q: 'Why did so few people die on Simeulue island, close to the 2004 earthquake?', options: ['The wave missed it', 'An oral tradition told them to run to the hills after a strong quake', 'They had sirens', 'It has no coast'], answer: 1, why: 'The teaching called smong, kept since a 1907 tsunami, sent almost everyone uphill within minutes.' },
  ],
  reel: [
    { ms: 7000, caption: 'A strong quake, the sea pulling back, or a roar: go to high ground at once, and stay there for hours.', set: { warn: 20, wait: 2, far: 1, H: 5, cover: 'town' }, act: (s, inst) => inst.seek?.(0), view: { pos: [-1.5, 4.5, 11], target: [-1.5, 1.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root); stage.floor.visible = false;
    const X0 = -10, X1 = 6.2, N = 220;
    const ground = slab(N, -1.8, 1.8, rockMat(0x7c8a5a)), sea = slab(N, -1.8, 1.8, waterMat(0.55)); root.add(ground, sea);
    let xhNow = -1;
    const groundY = (x) => { const m = (x - SHORE_X) * UNIT; return m < 0 ? Math.max(0.15, LAND + m / 900) : LAND + 2.4 * smooth((m - xhNow) / 180); };
    const group = (make, pts) => { const g = new THREE.Group(); pts.forEach(([m, z, sc = 1]) => { const o = make(); o.scale.setScalar(sc); o.position.set(X(m), LAND, z); o.userData.m = m; g.add(o); }); root.add(g); return g; };
    const rnd = (i) => ((Math.sin(i * 127.1) * 43758.5) % 1 + 1) % 1;
    const huts = group(() => hut(0.42), Array.from({ length: 16 }, (_, i) => [160 + i * 150 + rnd(i) * 60, -1.4 + rnd(i + 40) * 2.8]));
    const trees = group(() => palm(0.75), Array.from({ length: 46 }, (_, i) => [40 + i * 55 + rnd(i + 9) * 30, -1.6 + rnd(i + 77) * 3.2, 0.8 + rnd(i + 5) * 0.5]));
    const beachPalms = group(() => palm(0.8), [[20, 1.3], [35, -1.2]]);
    const flag = new THREE.Group(); const pole = box(0.05, 1.1, 0.05, M.metal()); pole.position.y = 0.55; const cloth = box(0.5, 0.3, 0.03, M.glow(HEX.ok)); cloth.position.set(0.27, 0.95, 0); flag.add(pole, cloth); root.add(flag);
    const fam = [0xffd35a, 0xff7a59, 0x8ef0ff, 0xffffff].map((c, i) => { const p = person(c, i === 2 ? 0.5 : 0.68); root.add(p); return p; });
    const minor = [stage.label('Sea', [X(-500), SEA + 0.8, 0], root)];
    const lHigh = stage.label('High ground', [0, 0, 0], root, 'hot'), lFam = stage.label('', [0, 0, 0], root), lState = stage.label('', [-4.5, 3.4, 0], root, 'hot'), lMax = stage.label('', [0, 0, 0], root);
    minor.push(lMax);

    let td = 0, key = '';
    return {
      seek(v) { td = v; },
      update(dt, s) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        const p = plan(s), k2 = JSON.stringify([s.warn, s.wait, s.far, s.H, s.cover]);
        if (k2 !== key) { if (key) td = 0; key = k2; xhNow = p.xh; ground.set(X0, X1, groundY, () => 0); flag.position.set(X(p.xh + 420), LAND + 2.4, 0); lHigh.position.set(X(p.xh + 420), LAND + 3.9, 0);
          huts.visible = s.cover === 'town'; trees.visible = s.cover === 'forest'; beachPalms.visible = s.cover !== 'forest';
          [huts, trees].forEach((g) => g.children.forEach((o) => { o.visible = o.userData.m < p.xh - 30; })); }
        const total = Math.max(p.end, p.reach) + 240;                                               // the whole story fits one loop
        td = (td + dt) % LOOP; const tt = Math.min((td / (LOOP - 2)) * total, total);
        const f = p.front(tt), flooding = tt >= p.Tarr, k = flooding ? Math.min(1, (tt - p.Tarr) / 90) : 0;
        const draw = !flooding && tt > p.Tarr - 420 ? smooth((tt - (p.Tarr - 420)) / 300) : 0;          // the sea pulls back in the last minutes
        const rise = s.H * VS * k;
        sea.set(X0, X1, (x) => { const m = (x - SHORE_X) * UNIT; return m < 0 ? SEA - draw * 0.5 * smooth((m + 900) / 900) + rise : m <= f && f > 0 ? Math.max(groundY(x) + 0.02, SEA + rise * (1 - 0.85 * (m / f))) : groundY(x) - 0.01; }, groundY);
        const caught = p.caught >= 0 && tt >= p.caught, at = caught ? p.pos(p.caught) : p.pos(tt);
        fam.forEach((q, i) => { const m = Math.max(0, at - i * 14) + (at >= p.xh ? 200 + i * 20 : 0); q.position.set(X(m), groundY(X(m)), -0.3 + i * 0.25); q.visible = !caught; });
        lFam.position.set(fam[0].position.x, fam[0].position.y + 1.25, 0);
        lFam.element.innerHTML = caught ? 'The water reached them' : at >= p.xh ? '<b>Safe</b> on high ground' : tt < p.start ? 'Still at home' : 'Walking inland';
        lFam.element.className = 'lbl' + (caught ? ' hot' : '');
        lMax.position.set(X(Math.min(p.xmax, 4000)), LAND + 1.2, 1.9); lMax.element.innerHTML = `Flood reaches ${fmtM(Math.round(p.xmax / 10) * 10)} inland`;
        lState.element.innerHTML = tt < p.Tarr - 420 ? `Warning sign · wave in ${fmtT(p.Tarr - tt)}` : !flooding ? `The sea pulls back · wave in ${fmtT(p.Tarr - tt)}` : f < p.xmax ? 'The first wave floods in' : 'More waves follow for hours: stay up';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const p = plan(s), safe = p.caught < 0;
        return compact(`<div class="big ${safe ? 'ok' : 'no'}">${safe ? (p.floodsHome ? 'They are safe' : 'The flood stops short of their home') : 'They left too late'}</div>
          <div class="row"><span>${p.floodsHome ? 'They get clear of the flood after' : 'They reach high ground after'}</span><b>${fmtT(p.floodsHome ? p.clear : p.reach)}</b></div>
          <div class="row"><span>The wave reaches the shore after</span><b>${fmtT(p.Tarr)}</b></div>
          <div class="row"><span>Flood runs inland over ${COVER[s.cover].name}</span><b>${p.xmaxFree > 5000 ? 'more than 5 km' : fmtM(Math.round(p.xmaxFree / 10) * 10)}</b></div>
          <div class="row"><span>${safe ? 'Time to spare' : 'Short by'}</span><b>${p.floodsHome ? fmtT(Math.abs(p.spare)) : 'the water never reaches them'}</b></div>
          <small>Walking at 4 km/h from 100 m behind the beach; the flood moves at about 14 km/h. ${safe ? 'Every minute of waiting eats into the margin.' : 'Leaving ' + fmtT(Math.max(60, -p.spare)) + ' sooner would have been enough.'} ${s.cover === 'forest' && s.H > 3 ? 'Above about 3 m the trees start to snap and help less.' : 'A rule-of-thumb model.'}</small>`);
      },
    };
  },
};
