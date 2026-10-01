// A small, honest model of the Indian Ocean for TsunamiClear's travel-time map. No data files:
// coastlines are hand-drawn polygons on a 0.5° grid and the depth is a simplified map (shelves near
// land, deep basins, a shallower Bay of Bengal and Andaman Sea, and the main ridges). A tsunami is a
// shallow-water wave, so it moves at c = √(g·h); the first-arrival time at every cell is found by
// Dijkstra's shortest-path method over the grid (a discrete solution of the eikonal equation).
// It is good to roughly 10–20 %: real warning centres use measured bathymetry at about 2-arc-minute
// (GEBCO / ETOPO) or finer and solve the full shallow-water equations.
export const G = 9.81;
export const GRID = { lon0: 35, lat0: -20, d: 0.5, W: 150, H: 96 };
const { lon0, lat0, d, W, H } = GRID;
export const lonOf = (i) => lon0 + (i + 0.5) * d;
export const latOf = (j) => lat0 + (j + 0.5) * d;
export const cellOf = (lon, lat) => [Math.floor((lon - lon0) / d), Math.floor((lat - lat0) / d)];
const KM = 111.2; // km per degree of latitude

// Coastlines as [lon, lat] polygons, drawn by hand from an atlas. Rough on purpose.
const LAND = [
  // Africa's east coast and the Horn
  [[35, -20], [37, -17.5], [40.5, -15], [40.5, -10.5], [39.3, -7], [39, -5], [40, -2.5], [42.5, -0.3], [45.3, 2], [47.5, 4.5], [49, 7], [50.8, 10.3], [51.2, 11.8], [49, 11.3], [45, 10.5], [43.3, 11.5], [42.7, 13], [39.5, 15.5], [37.5, 18.5], [37, 21], [35.5, 24], [35, 24.5]],
  // Arabia
  [[35, 28], [37, 24.5], [39, 21], [41, 17], [43, 13], [45, 12.8], [48.5, 14], [52, 16.5], [55, 17.5], [57.7, 19], [59.8, 22.5], [58.5, 23.7], [56.5, 24.5], [56.3, 26.2], [54.5, 24.2], [51.6, 24.2], [51.3, 26], [50, 26.5], [48.5, 28]],
  // Iran, Pakistan, India, Bangladesh, Myanmar, the Malay Peninsula and Indochina
  [[51, 28], [52.5, 27], [56, 27], [57.2, 25.5], [61.5, 25.2], [66.5, 25.4], [67.3, 24], [68.5, 23.3], [69, 22.3], [70.3, 20.9], [72, 21.2], [72.6, 22.2], [72.8, 19], [73.3, 16], [74.3, 14], [75, 12], [76.3, 9.5], [77.5, 8.1], [78.2, 8.9], [79.2, 9.3], [79.8, 10.3], [79.9, 12], [80.3, 13.1], [80.1, 15.2], [81.2, 16.3], [82.3, 16.6], [84.8, 19.2], [86.5, 20.3], [87, 21.5], [89, 21.8], [90.5, 22.5], [91.8, 22.3], [92.3, 20.7], [94.3, 18.5], [94.5, 16], [95.4, 15.8], [97.2, 16.8], [97.7, 15], [98.2, 12], [98.6, 10], [98.3, 8], [99.6, 6.5], [100.4, 5.3], [100.9, 3], [103.5, 1.4], [104.3, 1.4], [103.4, 4], [102.2, 6.2], [100.9, 7.5], [100, 10], [100, 13.4], [101, 12.6], [102.9, 11.7], [105, 10], [106.8, 10.4], [109.2, 11.8], [109.3, 15], [110, 16], [110, 28]],
  // Sri Lanka
  [[79.9, 9.8], [81.2, 8.5], [81.9, 7], [81.2, 6.2], [80.2, 6], [79.7, 8]],
  // Sumatra
  [[95.3, 5.6], [97.5, 5.2], [100.3, 2.5], [103.5, -1], [106, -3.3], [105.8, -5.9], [104.5, -5.9], [102.2, -4], [100.3, -1], [98.7, 1.7], [97.2, 3.2]],
  // Java (west) and Borneo's western edge
  [[105.2, -6.8], [108, -6.5], [110, -6.8], [110, -8.2], [106.5, -7.4]],
  [[109, 2], [110, 2], [110, -3], [109.3, -1]],
  // Madagascar (north)
  [[49.3, -12], [50.5, -15.5], [49, -19], [47.5, -20], [44.3, -20], [44, -17], [46, -15.7], [48, -13.5]],
];
// Island chains too thin for polygons: single land cells. The gaps between them (such as the
// Ten Degree Channel) stay open, as they are in the real ocean.
const ISLETS = [
  [92.75, 13.25], [92.75, 12.75], [92.75, 12.25], [92.75, 11.75], [92.6, 10.75], // Andaman Islands
  [92.8, 9.2], [93.5, 8], [93.8, 7],                                             // Nicobar Islands
  [96, 2.6], [97.5, 1.1], [99, -1.5],                                            // Simeulue, Nias, Siberut
  [54, 12.5],                                                                    // Socotra
];
function inPoly(p, x, y) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// A tiny binary heap for Dijkstra.
class Heap {
  constructor() { this.k = []; this.v = []; }
  push(key, val) { const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val); while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= k[i]) break; [k[p], k[i]] = [k[i], k[p]]; [v[p], v[i]] = [v[i], v[p]]; i = p; } }
  pop() {
    const k = this.k, v = this.v, top = [k[0], v[0]], lk = k.pop(), lv = v.pop();
    if (k.length) { k[0] = lk; v[0] = lv; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < k.length && k[l] < k[m]) m = l; if (r < k.length && k[r] < k[m]) m = r; if (m === i) break; [k[m], k[i]] = [k[i], k[m]]; [v[m], v[i]] = [v[i], v[m]]; i = m; } }
    return top;
  }
  get size() { return this.k.length; }
}

// Sixteen directions (king and knight moves) keep the wave fronts close to round.
const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
const segKm = (lonA, latA, lonB, latB) => { const m = Math.cos(((latA + latB) / 2) * Math.PI / 180); return Math.hypot((lonB - lonA) * m, latB - latA) * KM; };
function ridgeDist(lon, lat, line) { // degrees to a polyline
  let best = 1e9;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i], [bx, by] = line[i + 1];
    const t = Math.max(0, Math.min(1, ((lon - ax) * (bx - ax) + (lat - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
    best = Math.min(best, Math.hypot(lon - ax - t * (bx - ax), lat - ay - t * (by - ay)));
  }
  return best;
}
const MID_RIDGE = [[51, 13], [57, 10], [62, 4], [67, -3], [68, -12], [70, -20]];   // Carlsberg and Central Indian ridges
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

// Simplified depth in metres from position and distance to the nearest land (km).
function depthAt(lon, lat, dist) {
  let base = 4400;                                                                 // the open basins are 4–5 km deep
  if (lon > 80 && lon < 93.2 && lat > 4) base = Math.max(1800, 3900 - (lat - 5) * 120);   // Bay of Bengal: the Bengal Fan fills it in northwards
  if (lon > 55 && lon < 76 && lat > 8) base = Math.max(3000, 4400 - (lat - 8) * 90);      // Arabian Sea
  if (ridgeDist(lon, lat, MID_RIDGE) < 2.5) base = Math.min(base, 3200);
  if (Math.abs(lon - 90) < 1 && lat < 8) base = Math.min(base, 2600);              // Ninety East Ridge
  if (lon > 72 && lon < 74.2 && lat > -1 && lat < 14) base = Math.min(base, 1800); // Laccadive–Maldive ridge
  if (lon > 93.2 && lat > 4.5 && lat < 17.5) base = lon > 97.4 ? 130 : 1800;       // Andaman Sea and its eastern shelf
  if (lon > 97.5 && lat < 6.5 && lat > -1 && lon - 97.5 > (6 - lat) * 0.2) base = Math.min(base, 60); // Malacca Strait
  if (lon > 100 && lat > -6.5) base = 60;                                          // Sunda Shelf
  const shelf = lon > 67 && lon < 76 && lat > 8 && lat < 25 ? 160 : 60;            // India's west-coast shelf is wide, the east coast's is narrow
  const h = dist < shelf ? 15 + 150 * (dist / shelf) : lerp(165, base, (dist - shelf) / 120);
  return Math.min(h, Math.max(base, 40));
}

export function buildOcean() {
  const N = W * H, land = new Uint8Array(N), depth = new Float32Array(N), dist = new Float32Array(N).fill(1e9);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = lonOf(i), y = latOf(j); if (LAND.some((p) => inPoly(p, x, y))) land[j * W + i] = 1; }
  ISLETS.forEach(([x, y]) => { const [i, j] = cellOf(x, y); land[j * W + i] = 1; });
  // Distance to the nearest land.
  const hp = new Heap();
  for (let n = 0; n < N; n++) if (land[n]) { dist[n] = 0; hp.push(0, n); }
  while (hp.size) {
    const [t, n] = hp.pop(); if (t > dist[n]) continue;
    const i = n % W, j = (n / W) | 0;
    for (let m = 0; m < 8; m++) { const a = i + MOVES[m][0], b = j + MOVES[m][1]; if (a < 0 || b < 0 || a >= W || b >= H) continue; const q = b * W + a, t2 = t + segKm(lonOf(i), latOf(j), lonOf(a), latOf(b)); if (t2 < dist[q]) { dist[q] = t2; hp.push(t2, q); } }
  }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const n = j * W + i; depth[n] = land[n] ? 0 : depthAt(lonOf(i), latOf(j), dist[n]); }
  return { land, depth, dist };
}

// The 2004 rupture, south to north: it began off Simeulue (3.3° N, 95.9° E) and unzipped north along
// the Sunda Trench past the Nicobar and Andaman Islands for 1,200–1,300 km at about 2.5 km/s, so the
// north end broke about 8–10 minutes after the south (Lay et al. 2005; Ammon et al. 2005, Science).
export const RUPTURE = [[95.6, 3.1], [94.3, 5.3], [93.1, 7.3], [92.2, 9.3], [91.9, 11.3], [92.1, 13.2], [92.6, 14.4]];
export const RUPTURE_KM = (() => { let s = 0; for (let i = 1; i < RUPTURE.length; i++) s += segKm(...RUPTURE[i - 1], ...RUPTURE[i]); return s; })();
export const RUPTURE_SPEED = 2.5; // km/s
// Points along the first `km` of the rupture, with the delay (s) before each one breaks.
export function ruptureLine(km, step = 20) {
  const out = []; let s = 0;
  for (let i = 1; i < RUPTURE.length && s < km; i++) {
    const [ax, ay] = RUPTURE[i - 1], [bx, by] = RUPTURE[i], L = segKm(ax, ay, bx, by);
    for (let u = 0; u < L && s + u <= km; u += step) out.push({ lon: ax + (bx - ax) * (u / L), lat: ay + (by - ay) * (u / L), delay: (s + u) / RUPTURE_SPEED });
    s += L;
  }
  return out;
}

// First-arrival time (seconds after the quake starts) at every cell, for a rupture `km` long.
export function travelTimes(ocean, km = RUPTURE_KM) {
  const { land, depth } = ocean, N = W * H, T = new Float32Array(N).fill(Infinity), hp = new Heap();
  const speed = new Float32Array(N); for (let n = 0; n < N; n++) speed[n] = land[n] ? 0 : Math.sqrt(G * depth[n]) / 1000; // km/s
  for (const p of ruptureLine(km)) { const [i, j] = cellOf(p.lon, p.lat); const n = j * W + i; if (!land[n] && p.delay < T[n]) { T[n] = p.delay; hp.push(p.delay, n); } }
  const ok = (i, j) => i >= 0 && j >= 0 && i < W && j < H && !land[j * W + i];
  while (hp.size) {
    const [t, n] = hp.pop(); if (t > T[n]) continue;
    const i = n % W, j = (n / W) | 0;
    for (const [dx, dy] of MOVES) {
      const a = i + dx, b = j + dy; if (!ok(a, b)) continue;
      const sx = Math.sign(dx), sy = Math.sign(dy);
      if (Math.abs(dx) + Math.abs(dy) === 2 && !ok(i + sx, j) && !ok(i, j + sy)) continue;             // no squeezing through a diagonal wall
      if (Math.abs(dx) === 2 && (!ok(i + sx, j) || !ok(i + sx, j + sy))) continue;                     // knight moves need open water on the way
      if (Math.abs(dy) === 2 && (!ok(i, j + sy) || !ok(i + sx, j + sy))) continue;
      const q = b * W + a, t2 = t + segKm(lonOf(i), latOf(j), lonOf(a), latOf(b)) / ((speed[n] + speed[q]) / 2);
      if (t2 < T[q]) { T[q] = t2; hp.push(t2, q); }
    }
  }
  return T;
}

// Places on the map, with the reported arrival of the first wave on 26 December 2004 (hours after
// the quake began at 00:58:53 UTC, 06:28:53 IST). Sources: Chennai tide gauge 09:05 IST (Survey of
// India / NIO; Nagarajan et al. 2006); "within 15 minutes" in northern Sumatra and the Nicobars and
// about 2 h to Sri Lanka, Thailand and India, about 7 h to Somalia (NOAA; IOC-UNESCO; Wikipedia,
// "2004 Indian Ocean earthquake and tsunami"); Maldives about 3–3½ h (Malé tide gauge, UHSLC).
// Eyewitness and gauge times differ by many minutes, so each is a range.
export const PLACES = [
  { id: 'aceh', name: 'Banda Aceh', lon: 95.2, lat: 5.7, rep: [0.25, 0.35], say: '15–20 min' },
  { id: 'nicobar', name: 'Car Nicobar', lon: 92.8, lat: 9.6, rep: [0.1, 0.5], say: 'minutes to ½ h' },
  { id: 'blair', name: 'Port Blair', lon: 93.1, lat: 11.6, rep: [0.3, 1], say: 'within the hour' },
  { id: 'phuket', name: 'Phuket', lon: 98.1, lat: 7.9, rep: [1.5, 2], say: '1½–2 h' },
  { id: 'lanka', name: 'Sri Lanka (east)', lon: 82.2, lat: 7.6, rep: [1.7, 2.1], say: 'about 2 h' },
  { id: 'chennai', name: 'Chennai', lon: 80.6, lat: 13.1, rep: [2.4, 2.7], say: '2 h 36 min' },
  { id: 'naga', name: 'Nagapattinam', lon: 80.2, lat: 10.8, rep: [2.2, 2.8], say: 'about 2½ h' },
  { id: 'male', name: 'Malé, Maldives', lon: 73.6, lat: 4.2, rep: [3.1, 3.6], say: '3–3½ h' },
  { id: 'somalia', name: 'Hafun, Somalia', lon: 51.6, lat: 10.4, rep: [7, 7.6], say: 'about 7 h' },
];
// Nearest open-water cell to a place.
export function seaCell(ocean, lon, lat) {
  const [ci, cj] = cellOf(lon, lat); let best = -1, bd = 1e9;
  for (let j = cj - 3; j <= cj + 3; j++) for (let i = ci - 3; i <= ci + 3; i++) {
    if (i < 0 || j < 0 || i >= W || j >= H || ocean.land[j * W + i]) continue;
    const dd = segKm(lon, lat, lonOf(i), latOf(j)); if (dd < bd) { bd = dd; best = j * W + i; }
  }
  return best;
}
