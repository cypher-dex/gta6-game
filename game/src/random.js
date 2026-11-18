// Seeded randomness and small math helpers shared by every system. All simulation randomness goes
// through one seeded generator, so a `?shot=<name>&seed=1` scene renders the same frame every time.

export function createRandom(seed) {
  let a = seed | 0;
  const random = function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.range = (lo, hi) => lo + random() * (hi - lo);
  random.int = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  random.pick = (list) => list[Math.floor(random() * list.length)];
  random.chance = (p) => random() < p;
  return random;
}

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);
export const dist = (ax, az, bx, bz) => Math.sqrt(dist2(ax, az, bx, bz));

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(a) {
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
}

/** Heading angle whose forward vector (sin, cos) points from a to b. */
export function headingTo(ax, az, bx, bz) {
  return Math.atan2(bx - ax, bz - az);
}

/** Exponential smoothing factor for a rate per second over dt (frame-rate independent). */
export function damp(rate, dt) {
  return 1 - Math.exp(-rate * dt);
}
