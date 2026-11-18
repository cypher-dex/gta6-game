// Static collision for the city: axis-aligned building boxes in a uniform grid, with circle
// push-out for walkers and cars, and a 3D ray cast for bullets, camera and line of sight.

const CELL_SIZE = 24;

export class ColliderGrid {
  constructor() {
    this.cells = new Map();
    this.boxes = [];
    this.stamp = 0;
  }

  key(cx, cz) {
    return cx * 4096 + cz;
  }

  /** Add a box { minX, maxX, minZ, maxZ, height }. */
  add(box) {
    box.mark = 0;
    this.boxes.push(box);
    const cx0 = Math.floor(box.minX / CELL_SIZE), cx1 = Math.floor(box.maxX / CELL_SIZE);
    const cz0 = Math.floor(box.minZ / CELL_SIZE), cz1 = Math.floor(box.maxZ / CELL_SIZE);
    for (let cx = cx0; cx <= cx1; cx += 1) {
      for (let cz = cz0; cz <= cz1; cz += 1) {
        const k = this.key(cx, cz);
        let list = this.cells.get(k);
        if (!list) this.cells.set(k, (list = []));
        list.push(box);
      }
    }
  }

  /** Boxes overlapping a rectangle, each once. */
  query(minX, minZ, maxX, maxZ, out = []) {
    out.length = 0;
    this.stamp += 1;
    const cx0 = Math.floor(minX / CELL_SIZE), cx1 = Math.floor(maxX / CELL_SIZE);
    const cz0 = Math.floor(minZ / CELL_SIZE), cz1 = Math.floor(maxZ / CELL_SIZE);
    for (let cx = cx0; cx <= cx1; cx += 1) {
      for (let cz = cz0; cz <= cz1; cz += 1) {
        const list = this.cells.get(this.key(cx, cz));
        if (!list) continue;
        for (const box of list) {
          if (box.mark === this.stamp) continue;
          box.mark = this.stamp;
          if (box.maxX >= minX && box.minX <= maxX && box.maxZ >= minZ && box.minZ <= maxZ) out.push(box);
        }
      }
    }
    return out;
  }

  /**
   * Push a circle at pos {x, z} out of every box it overlaps. Returns the summed push normal
   * {x, z, depth} of the deepest contact, or null when it touched nothing.
   */
  resolveCircle(pos, radius) {
    const found = this.query(pos.x - radius, pos.z - radius, pos.x + radius, pos.z + radius, scratch);
    let hit = null;
    for (const box of found) {
      const nx = Math.max(box.minX, Math.min(pos.x, box.maxX));
      const nz = Math.max(box.minZ, Math.min(pos.z, box.maxZ));
      let dx = pos.x - nx, dz = pos.z - nz;
      let d2 = dx * dx + dz * dz;
      if (d2 >= radius * radius) continue;
      let depth;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        dx /= d; dz /= d;
        depth = radius - d;
      } else {
        // Centre inside the box: leave by the nearest face.
        const left = pos.x - box.minX, right = box.maxX - pos.x, top = pos.z - box.minZ, bottom = box.maxZ - pos.z;
        const m = Math.min(left, right, top, bottom);
        dx = m === left ? -1 : m === right ? 1 : 0;
        dz = m === top ? -1 : m === bottom ? 1 : 0;
        depth = m + radius;
      }
      pos.x += dx * depth;
      pos.z += dz * depth;
      if (!hit || depth > hit.depth) hit = { x: dx, z: dz, depth };
    }
    return hit;
  }

  /** Distance along a 3D ray to the first box it enters, or Infinity. Direction must be normalised. */
  raycast(ox, oy, oz, dx, dy, dz, maxDist) {
    const minX = Math.min(ox, ox + dx * maxDist), maxX = Math.max(ox, ox + dx * maxDist);
    const minZ = Math.min(oz, oz + dz * maxDist), maxZ = Math.max(oz, oz + dz * maxDist);
    const found = this.query(minX, minZ, maxX, maxZ, scratch);
    let best = Infinity;
    for (const box of found) {
      const t = rayBox(ox, oy, oz, dx, dy, dz, box.minX, 0, box.minZ, box.maxX, box.height, box.maxZ);
      if (t >= 0 && t < best && t <= maxDist) best = t;
    }
    return best;
  }

  /** True when nothing blocks the straight line between two points at the given heights. */
  lineOfSight(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-4) return true;
    return this.raycast(ax, ay, az, dx / len, dy / len, dz / len, len) >= len;
  }
}

const scratch = [];

/** Slab test: entry distance of a ray into a box, 0 when starting inside, -1 when missed. */
export function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1) {
  let tmin = 0, tmax = Infinity;
  const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i += 1) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return -1;
    } else {
      let t1 = (lo[i] - o[i]) / d[i], t2 = (hi[i] - o[i]) / d[i];
      if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }
  }
  return tmin;
}
