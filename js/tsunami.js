// Shared parts for TsunamiClear: the physics of long ocean waves (the full linear dispersion
// relation, shallow-water speed c = √(g·h), Green's law for shoaling, earthquake moment magnitude,
// a rule of thumb for how far a flood runs inland) plus small 3D parts (cross-section slabs whose
// outline can change every frame, chart boards) used by the chapters.
// Scenes are in scene units; each chapter says what a unit means. +x right, +y up, +z towards you.
import { THREE, M, box, sphere, canvasTexture, clamp } from './kit.js';

export const G = 9.81;            // m/s²
export const RHO = 1025;          // sea water, kg/m³

// ---------------------------------------------------------------- waves
// Shallow-water (long-wave) speed, valid when the wavelength is much more than about 20× the depth.
export const cShallow = (h) => Math.sqrt(G * Math.max(0, h));
export const kmh = (ms) => ms * 3.6;
// Linear (Airy) wave theory: ω² = g·k·tanh(k·h). Solved for k by Newton's method; it covers wind
// waves (deep water, c = g·T ÷ 2π) and tsunamis (shallow water, c = √(g·h)) with one formula.
export function waveNumber(T, h) {
  const w = (2 * Math.PI) / T;
  let k = (w * w) / G;                              // deep-water guess
  if (k * h < 1) k = w / Math.sqrt(G * h);          // shallow-water guess
  for (let i = 0; i < 30; i++) {
    const th = Math.tanh(k * h), f = G * k * th - w * w, df = G * th + G * k * h * (1 - th * th);
    const k2 = k - f / df; if (Math.abs(k2 - k) < 1e-12) { k = k2; break; } k = Math.max(1e-9, k2);
  }
  return k;
}
export function wave(T, h) {
  const k = waveNumber(T, h), L = (2 * Math.PI) / k, c = L / T;
  return { k, L, c, kh: k * h, regime: k * h < Math.PI / 10 ? 'shallow' : k * h > Math.PI ? 'deep' : 'between' };
}
// How the water's own to-and-fro shrinks with depth z (0 at the surface, −h at the bed), as a share
// of the surface's up-and-down motion: horizontal cosh(k(z+h)) ÷ sinh(kh), vertical sinh(k(z+h)) ÷ sinh(kh).
export function orbit(k, h, z) {
  const kh = k * h;
  if (kh > 20) { const e = Math.exp(k * z); return { x: e, y: e }; }
  return { x: Math.cosh(k * (z + h)) / Math.sinh(kh), y: Math.sinh(k * (z + h)) / Math.sinh(kh) };
}
// Green's law (1838): with no energy lost, wave height grows as depth falls: H₂ = H₁ (h₁ ÷ h₂)^¼.
export const green = (H0, h0, h) => H0 * Math.pow(h0 / Math.max(0.5, h), 0.25);

// ---------------------------------------------------------------- earthquakes
// Seismic moment M₀ = μ·L·W·D (rigidity × rupture area × average slip) and moment magnitude
// Mw = ⅔ (log₁₀ M₀ − 9.1) (Hanks & Kanamori 1979). μ = 30 GPa is the usual figure for a shallow
// megathrust; W = 150 km is about the width that slipped in 2004 (Lay et al. 2005, Science).
export const MU = 3e10, FAULT_W = 150e3;
export const momentMw = (Lkm, slip, W = FAULT_W) => (2 / 3) * (Math.log10(MU * Lkm * 1e3 * W * slip) - 9.1);
// Sea-floor uplift over a gently dipping thrust is a fraction of the slip: slip × sin(dip) for the
// vertical part, and more where the fault steepens near the trench. The model uses a quarter, which
// turns the 10–20 m of slip in 2004 into the "several metres" of uplift that was measured.
export const UPLIFT_SHARE = 0.25;
// Energy given to the sea: the potential energy of a hump η high over area A is ½ ρ g η² A.
export const humpEnergy = (eta, Lkm, widthKm = 100) => 0.5 * RHO * G * eta * eta * Lkm * 1e3 * widthKm * 1e3;
// How far a flood runs inland over flat ground (Hills & Mader 1997, as given in Bryant, "Tsunami:
// The Underrated Hazard"): x = 0.06 · H^(4/3) ÷ n², H = height at the shore (m), n = Manning's
// roughness (0.015 smooth ground, 0.03 buildings, 0.07 dense forest). A rule of thumb only.
export const inundation = (H, n) => (0.06 * Math.pow(Math.max(0, H), 4 / 3)) / (n * n);

// ---------------------------------------------------------------- formatting
export const fmtN = (v, d = 0) => v.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtM = (m) => (m >= 1000 ? `${fmtN(m / 1000, m >= 10000 ? 0 : 1)} km` : m >= 10 ? `${fmtN(m)} m` : m >= 1 ? `${m.toFixed(1)} m` : `${Math.round(m * 100)} cm`);
export const fmtT = (sec) => { const m = Math.round(sec / 60); return m < 1 ? `${Math.round(sec)} s` : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
export const fmtJ = (J) => { const e = Math.floor(Math.log10(J)); return `${(J / 10 ** e).toFixed(1)} × 10${String(e).replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])} J`; };
export const inReel = () => document.body.classList.contains('gb-reel');

// ---------------------------------------------------------------- boards
export const COL = { sea: '#4aa8ff', deep: '#12395f', wave: '#8ef0ff', hot: '#ff7a59', ok: '#a3e635', bad: '#ff5a8a', warn: '#ffd35a', land: '#6c7a52', soft: 'rgba(255,255,255,.55)' };
export const HEX = { sea: 0x2f8fe0, deep: 0x12395f, wave: 0x8ef0ff, hot: 0xff7a59, ok: 0xa3e635, bad: 0xff5a8a, warn: 0xffd35a, land: 0x6c7a52, rock: 0x6b5d52, sand: 0xd9c38a, plate: 0x4d5a66, plate2: 0x8a6f55, mantle: 0x7a3b2a };
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.fillText(text, 22, 38);
  if (sub) { g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, 22, 64); }
}
// Place a board: beside the model on a wide screen, elsewhere in the tall reel video.
export function placeBoard(b, wide, reel) {
  const [p, r = 0, s = 1] = inReel() && reel ? reel : wide;
  b.mesh.position.set(...p); b.mesh.rotation.set(0, r, 0); b.mesh.scale.setScalar(s);
}
// On a phone the stage is small, so the readout keeps its headline and first two rows only.
export function compact(html) {
  if (window.innerWidth >= 560 || inReel()) return html;
  let n = 0;
  return html.replace(/<small[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (n++ < 2 ? m : ''));
}
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.16 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}

// ---------------------------------------------------------------- parts
// A cross-section slab: a strip n segments long between z0 and z1 whose top and bottom outlines are
// set by functions of x and can change every frame (rock that bends, water with a moving surface).
export function slab(n, z0, z1, mat) {
  const pos = new Float32Array((n + 1) * 6 * 3), idx = [];
  for (let i = 0; i < n; i++) {
    const a = i * 6, b = a + 6;
    idx.push(a + 1, b + 1, b, a + 1, b, a);             // front face
    idx.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3); // top face
    idx.push(b + 5, a + 5, a + 4, b + 5, a + 4, b + 4); // back face
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  m.set = (x0, x1, top, bot) => {
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, t = top(x), b = Math.min(t, bot(x)), o = i * 18;
      pos.set([x, t, z1, x, b, z1, x, t, z1, x, t, z0, x, t, z0, x, b, z0], o);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  };
  return m;
}
export const waterMat = (opacity = 0.55) => new THREE.MeshStandardMaterial({ color: HEX.sea, transparent: true, opacity, roughness: 0.2, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
export const rockMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });

// A simple ship, a palm tree and a small house, each about one unit in size.
export function ship(color = 0xd9dde6) {
  const g = new THREE.Group(), hull = box(1, 0.16, 0.26, M.plastic(0x2a3344)), deck = box(0.3, 0.2, 0.2, M.plastic(color)), fun = box(0.08, 0.16, 0.08, M.plastic(HEX.hot));
  hull.position.y = 0.06; deck.position.set(-0.22, 0.24, 0); fun.position.set(-0.22, 0.42, 0); g.add(hull, deck, fun); return g;
}
export function palm(h = 1) {
  const g = new THREE.Group(), tr = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * h, 0.05 * h, h, 6), M.matte(0x7a5b3a)); tr.position.y = h / 2; g.add(tr);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.09 * h, 0.5 * h, 4), M.matte(0x3f8f4a)); l.position.set(Math.cos(i * 1.05) * 0.2 * h, h * 0.98, Math.sin(i * 1.05) * 0.2 * h); l.rotation.set(Math.sin(i * 1.05) * 1.2, 0, -Math.cos(i * 1.05) * 1.2); g.add(l); }
  return g;
}
export function hut(w = 0.5, color = 0xd8cbb0, roof = 0xb5533c) {
  const g = new THREE.Group(), b = box(w, w * 0.6, w * 0.8, M.matte(color)); b.position.y = w * 0.3;
  const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, w * 0.4, 4), M.matte(roof)); r.rotation.y = Math.PI / 4; r.position.y = w * 0.8; g.add(b, r); return g;
}
export function person(color = 0xffd35a, h = 0.3) {
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.16, h * 0.5, 4, 8), M.plastic(color)), hd = sphere(h * 0.14, M.plastic(0xe0b48c), 12);
  b.position.y = h * 0.42; hd.position.y = h * 0.88; g.add(b, hd); return g;
}
export { THREE, M, box, sphere, clamp };
