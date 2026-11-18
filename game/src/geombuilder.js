// Merges many boxes and quads into one BufferGeometry with vertex colours and world-space UVs,
// so the whole city draws in a handful of calls.

import * as THREE from 'three';

const tmpColor = new THREE.Color();

export class GeometryBuilder {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.colors = [];
    this.indices = [];
  }

  /** Quad from four corners (counter-clockwise seen from the front), uv corners and a colour. */
  quad(a, b, c, d, n, uv, color) {
    const base = this.positions.length / 3;
    tmpColor.set(color);
    const corners = [a, b, c, d];
    for (let i = 0; i < 4; i += 1) {
      this.positions.push(corners[i][0], corners[i][1], corners[i][2]);
      this.normals.push(n[0], n[1], n[2]);
      this.uvs.push(uv[i * 2], uv[i * 2 + 1]);
      this.colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  /**
   * Axis-aligned box. `uScale`/`vScale` map metres to texture repeats on the sides; `faces`
   * picks which faces to emit ('sides', 'top', 'all'); `top` may be another builder for the roof.
   */
  box(x0, y0, z0, x1, y1, z1, color, { uScale = 1, vScale = 1, faces = 'all', top = null, topColor = null } = {}) {
    const sides = faces === 'all' || faces === 'sides';
    if (sides) {
      const v0 = y0 * vScale, v1 = y1 * vScale;
      // +z face
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0 * uScale, v0, x1 * uScale, v0, x1 * uScale, v1, x0 * uScale, v1], color);
      // -z face
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [-x1 * uScale, v0, -x0 * uScale, v0, -x0 * uScale, v1, -x1 * uScale, v1], color);
      // +x face
      this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [-z1 * uScale, v0, -z0 * uScale, v0, -z0 * uScale, v1, -z1 * uScale, v1], color);
      // -x face
      this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0 * uScale, v0, z1 * uScale, v0, z1 * uScale, v1, z0 * uScale, v1], color);
    }
    if (faces === 'all' || faces === 'top' || top) {
      const target = top ?? this;
      target.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [x0 / 8, z1 / 8, x1 / 8, z1 / 8, x1 / 8, z0 / 8, x0 / 8, z0 / 8], topColor ?? color);
    }
  }

  /** Horizontal quad at height y with world-space UVs scaled by `scale`. */
  flat(x0, z0, x1, z1, y, color, scale = 1 / 8) {
    this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [x0 * scale, -z1 * scale, x1 * scale, -z1 * scale, x1 * scale, -z0 * scale, x0 * scale, -z0 * scale], color);
  }

  /** A pitched (gable) roof over a rectangle, ridge along the longer side. */
  gable(x0, z0, x1, z1, y, rise, color) {
    const alongX = x1 - x0 >= z1 - z0;
    if (alongX) {
      const zm = (z0 + z1) / 2, ny = 0.8, nz = 0.6;
      this.quad([x0, y, z1], [x1, y, z1], [x1, y + rise, zm], [x0, y + rise, zm], [0, ny, nz], [0, 0, 1, 0, 1, 1, 0, 1], color);
      this.quad([x1, y, z0], [x0, y, z0], [x0, y + rise, zm], [x1, y + rise, zm], [0, ny, -nz], [0, 0, 1, 0, 1, 1, 0, 1], color);
      this.tri([x0, y, z0], [x0, y, z1], [x0, y + rise, zm], [-1, 0, 0], color);
      this.tri([x1, y, z1], [x1, y, z0], [x1, y + rise, zm], [1, 0, 0], color);
    } else {
      const xm = (x0 + x1) / 2, ny = 0.8, nx = 0.6;
      this.quad([x1, y, z1], [x1, y, z0], [xm, y + rise, z0], [xm, y + rise, z1], [nx, ny, 0], [0, 0, 1, 0, 1, 1, 0, 1], color);
      this.quad([x0, y, z0], [x0, y, z1], [xm, y + rise, z1], [xm, y + rise, z0], [-nx, ny, 0], [0, 0, 1, 0, 1, 1, 0, 1], color);
      this.tri([x0, y, z1], [x1, y, z1], [xm, y + rise, z1], [0, 0, 1], color);
      this.tri([x1, y, z0], [x0, y, z0], [xm, y + rise, z0], [0, 0, -1], color);
    }
  }

  tri(a, b, c, n, color) {
    const base = this.positions.length / 3;
    tmpColor.set(color);
    for (const p of [a, b, c]) {
      this.positions.push(p[0], p[1], p[2]);
      this.normals.push(n[0], n[1], n[2]);
      this.uvs.push(0, 0);
      this.colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
    this.indices.push(base, base + 1, base + 2);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    g.setIndex(this.indices);
    g.computeBoundingSphere();
    return g;
  }
}
