/**
 * Value noise + fBm.
 *
 * Small, deterministic, dependency-free. Used to drive Eminence's volatility
 * surface and Game X's terrain — the latter mirroring how the game itself
 * generates chunks, so the site's landscape and the product's landscape come
 * from the same kind of function.
 */

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

// Quintic smoothstep — C2 continuous, so fBm doesn't show grid creases.
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;

/** 2D value noise in −1..1 */
export function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = fade(xf);
  const v = fade(yf);

  const n00 = hash(xi, yi);
  const n10 = hash(xi + 1, yi);
  const n01 = hash(xi, yi + 1);
  const n11 = hash(xi + 1, yi + 1);

  return mix(mix(n00, n10, u), mix(n01, n11, u), v) * 2 - 1;
}

/** Fractal Brownian motion — octaves of noise at halving amplitude. */
export function fbm(x, y, octaves = 4, lacunarity = 2.02, gain = 0.5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq) * amp;
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum / norm;
}
