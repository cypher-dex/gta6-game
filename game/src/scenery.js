// Instanced street dressing: curved palm trees with feathered fronds, street lamps and beach
// umbrellas, each kind one draw call however many there are.

import * as THREE from 'three';
import { makeFrondTexture } from './textures.js';

const dummy = new THREE.Object3D();

/** A tapered, gently bent trunk 8 m tall, its crown at local (1.2, 8, 0). */
function palmTrunkGeometry() {
  const g = new THREE.CylinderGeometry(0.18, 0.32, 8, 7, 8);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i) + 4;
    const t = y / 8;
    pos.setX(i, pos.getX(i) + t * t * 1.2);
    pos.setY(i, y);
    // Ring bumps along the trunk.
    const ring = 1 + 0.08 * Math.sin(y * 9);
    pos.setX(i, (pos.getX(i) - t * t * 1.2) * ring + t * t * 1.2);
    pos.setZ(i, pos.getZ(i) * ring);
  }
  g.computeVertexNormals();
  return g;
}

/** Nine drooping fronds around the crown, as textured bent strips. */
function palmCrownGeometry() {
  const parts = [];
  const count = 9;
  for (let f = 0; f < count; f += 1) {
    const strip = new THREE.PlaneGeometry(4.2, 1.1, 6, 1);
    const pos = strip.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i) + 2.1; // 0..4.2 outward
      const across = pos.getY(i); // leaf width
      pos.setXYZ(i, x, 0.55 * x - 0.2 * x * x + Math.abs(across) * 0.3, across * (1 - x / 5.5));
    }
    strip.rotateY((f / count) * Math.PI * 2 + (f % 2) * 0.2);
    parts.push(strip);
  }
  const merged = mergeSimple(parts);
  merged.translate(1.2, 8, 0);
  return merged;
}

/** Merge position/normal/uv geometries without the examples' utils. */
function mergeSimple(geos) {
  const positions = [], normals = [], uvs = [], indices = [];
  let offset = 0;
  for (const g of geos) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv.array;
    positions.push(...p); normals.push(...n); uvs.push(...u);
    for (const idx of g.index.array) indices.push(idx + offset);
    offset += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  out.setIndex(indices);
  out.computeVertexNormals();
  return out;
}

export function buildScenery(layout) {
  const group = new THREE.Group();
  group.name = 'scenery';
  const palms = layout.palms;
  const trunk = new THREE.InstancedMesh(palmTrunkGeometry(), new THREE.MeshLambertMaterial({ color: '#9b7b56' }), palms.length);
  const crown = new THREE.InstancedMesh(palmCrownGeometry(), new THREE.MeshLambertMaterial({ map: makeFrondTexture(), alphaTest: 0.4, side: THREE.DoubleSide }), palms.length);
  palms.forEach((p, i) => {
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.set(0, p.rot, 0);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    crown.setMatrixAt(i, dummy.matrix);
  });
  trunk.castShadow = crown.castShadow = true;
  group.add(trunk, crown);

  const lampGeo = mergeSimple([
    new THREE.CylinderGeometry(0.1, 0.14, 7, 6).translate(0, 3.5, 0),
    new THREE.BoxGeometry(0.12, 0.12, 2.4).translate(0, 7, 1.1),
    new THREE.BoxGeometry(0.5, 0.18, 0.8).translate(0, 6.9, 2.2),
  ]);
  const lamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshLambertMaterial({ color: '#59606a' }), layout.lamps.length);
  layout.lamps.forEach((l, i) => {
    dummy.position.set(l.x, 0, l.z);
    dummy.rotation.set(0, l.rot, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    lamps.setMatrixAt(i, dummy.matrix);
  });
  lamps.castShadow = true;
  group.add(lamps);

  const umbrellaGeo = new THREE.ConeGeometry(2.2, 0.9, 10, 1, true).translate(0, 2.6, 0);
  const umbrellas = new THREE.InstancedMesh(umbrellaGeo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), layout.umbrellas.length);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 5).translate(0, 1.3, 0), new THREE.MeshLambertMaterial({ color: '#f1f1f1' }), layout.umbrellas.length);
  const towels = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.04, 2.0).translate(1.6, 0.03, 0.4), new THREE.MeshLambertMaterial(), layout.umbrellas.length);
  const color = new THREE.Color();
  layout.umbrellas.forEach((u, i) => {
    dummy.position.set(u.x, 0, u.z);
    dummy.rotation.set(0.12, i * 1.7, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    umbrellas.setMatrixAt(i, dummy.matrix);
    poles.setMatrixAt(i, dummy.matrix);
    dummy.rotation.set(0, i * 1.7, 0);
    dummy.updateMatrix();
    towels.setMatrixAt(i, dummy.matrix);
    umbrellas.setColorAt(i, color.set(u.color));
    towels.setColorAt(i, color.set(i % 2 ? '#ffffff' : '#ffd166'));
  });
  umbrellas.castShadow = true;
  group.add(umbrellas, poles, towels);
  return group;
}
