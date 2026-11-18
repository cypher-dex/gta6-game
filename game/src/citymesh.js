// Turns the city plan into three.js meshes: merged facades per style, roofs and details, roads,
// crossings, sidewalks, lawns, the beach and pier, shop signs and billboards.

import * as THREE from 'three';
import { GeometryBuilder } from './geombuilder.js';
import { GRID, ROAD_WIDTH, SIDEWALK, LAND, SHORE_X, roadCoord } from './config.js';
import { makeFacadeTexture, makeRoadTexture, makeCrossingTexture, makeSidewalkTexture, makeGroundTexture, makeSignTexture, makeBillboardTexture } from './textures.js';

const FLOOR = 3.5;
const BAY = 8;

function lambert(options) {
  return new THREE.MeshLambertMaterial(options);
}

function shadowed(mesh, cast = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

/** Build every static city mesh into a group and return it. */
export function buildCityMeshes(layout) {
  const group = new THREE.Group();
  group.name = 'city';
  buildGround(group, layout);
  buildRoads(group);
  buildBlocksGround(group, layout);
  buildBuildings(group, layout);
  buildSigns(group, layout);
  buildPier(group, layout);
  return group;
}

function buildGround(group, layout) {
  const sand = makeGroundTexture('sand');
  sand.repeat.set(1, 1);
  const b = new GeometryBuilder();
  const y = -0.02;
  b.flat(LAND.minX - 6, LAND.minZ - 6, SHORE_X, LAND.maxZ + 6, y, '#ffffff', 1 / 12);
  // Sloping skirts down into the sea on every side.
  const drop = -2.4, run = 34;
  const x0 = LAND.minX - 6, x1 = SHORE_X, z0 = LAND.minZ - 6, z1 = LAND.maxZ + 6;
  b.quad([x1, y, z1], [x1 + run, drop, z1 + run], [x1 + run, drop, z0 - run], [x1, y, z0], [0.07, 1, 0], [x1 / 12, z1 / 12, (x1 + run) / 12, z1 / 12, (x1 + run) / 12, z0 / 12, x1 / 12, z0 / 12], '#ffffff');
  b.quad([x0, y, z0], [x0 - run, drop, z0 - run], [x0 - run, drop, z1 + run], [x0, y, z1], [-0.07, 1, 0], [0, 0, 3, 0, 3, 50, 0, 50], '#ffffff');
  b.quad([x0, y, z1], [x0 - run, drop, z1 + run], [x1 + run, drop, z1 + run], [x1, y, z1], [0, 1, 0.07], [0, 0, 3, 0, 3, 50, 0, 50], '#ffffff');
  b.quad([x1, y, z0], [x1 + run, drop, z0 - run], [x0 - run, drop, z0 - run], [x0, y, z0], [0, 1, -0.07], [0, 0, 3, 0, 3, 50, 0, 50], '#ffffff');
  const ground = shadowed(new THREE.Mesh(b.build(), lambert({ map: sand, vertexColors: true })), false);
  ground.name = 'ground';
  group.add(ground);
}

function buildRoads(group) {
  const roads = new GeometryBuilder();
  const crossings = new GeometryBuilder();
  const y = 0.02, hw = ROAD_WIDTH / 2;
  for (let i = 0; i <= GRID; i += 1) {
    const c = roadCoord(i);
    for (let j = 0; j < GRID; j += 1) {
      const a = roadCoord(j) + hw, e = roadCoord(j + 1) - hw;
      const len = (e - a) / ROAD_WIDTH;
      // Road along z at x = c: u across x, v along z.
      roads.quad([c - hw, y, e], [c + hw, y, e], [c + hw, y, a], [c - hw, y, a], [0, 1, 0], [0, len, 1, len, 1, 0, 0, 0], '#ffffff');
      // Road along x at z = c: u across z, v along x.
      roads.quad([a, y, c + hw], [e, y, c + hw], [e, y, c - hw], [a, y, c - hw], [0, 1, 0], [1, 0, 1, len, 0, len, 0, 0], '#ffffff');
    }
    for (let j = 0; j <= GRID; j += 1) {
      const d = roadCoord(j);
      crossings.quad([c - hw, y, d + hw], [c + hw, y, d + hw], [c + hw, y, d - hw], [c - hw, y, d - hw], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], '#ffffff');
    }
  }
  group.add(shadowed(new THREE.Mesh(roads.build(), lambert({ map: makeRoadTexture() })), false));
  group.add(shadowed(new THREE.Mesh(crossings.build(), lambert({ map: makeCrossingTexture() })), false));
}

function buildBlocksGround(group, layout) {
  const walk = new GeometryBuilder();
  const grass = new GeometryBuilder();
  const plaza = new GeometryBuilder();
  const curb = 0.16;
  for (const block of layout.blocks) {
    walk.box(block.minX, 0, block.minZ, block.maxX, curb, block.maxZ, '#ffffff', { uScale: 1 / 4, vScale: 1 / 4 });
    const inset = SIDEWALK;
    const target = block.district === 'palmetto' || block.district === 'park' ? grass : plaza;
    if (block.district !== 'heights' && block.district !== 'mercado') {
      target.flat(block.minX + inset, block.minZ + inset, block.maxX - inset, block.maxZ - inset, curb + 0.01, block.district === 'docks' ? '#b9b3a6' : '#ffffff');
    }
  }
  // Outer sidewalks around the edge roads.
  const lo = roadCoord(0) - ROAD_WIDTH / 2, hi = roadCoord(GRID) + ROAD_WIDTH / 2;
  walk.box(lo - SIDEWALK, 0, lo - SIDEWALK, hi + SIDEWALK, curb, lo, '#ffffff', { uScale: 1 / 4, vScale: 1 / 4 });
  walk.box(lo - SIDEWALK, 0, hi, hi + SIDEWALK, curb, hi + SIDEWALK, '#ffffff', { uScale: 1 / 4, vScale: 1 / 4 });
  walk.box(lo - SIDEWALK, 0, lo, lo, curb, hi, '#ffffff', { uScale: 1 / 4, vScale: 1 / 4 });
  walk.box(hi, 0, lo, hi + SIDEWALK, curb, hi, '#ffffff', { uScale: 1 / 4, vScale: 1 / 4 });
  const walkTex = makeSidewalkTexture();
  group.add(shadowed(new THREE.Mesh(walk.build(), lambert({ map: walkTex })), false));
  group.add(shadowed(new THREE.Mesh(grass.build(), lambert({ map: makeGroundTexture('grass') })), false));
  group.add(shadowed(new THREE.Mesh(plaza.build(), lambert({ map: makeGroundTexture('plaza'), vertexColors: true })), false));
}

function buildBuildings(group, layout) {
  const walls = { tower: new GeometryBuilder(), hotel: new GeometryBuilder(), house: new GeometryBuilder() };
  const plain = new GeometryBuilder();
  const roofs = new GeometryBuilder();
  for (const b of layout.buildings) {
    const style = b.style === 'tower' || b.style === 'landmark' ? 'tower' : b.style === 'house' ? 'house' : b.style === 'warehouse' ? null : 'hotel';
    const uv = { uScale: 1 / BAY, vScale: 1 / FLOOR };
    if (b.style === 'warehouse') {
      plain.box(b.minX, 0, b.minZ, b.maxX, b.height + 3, b.maxZ, b.color, { faces: 'sides' });
      roofs.gable(b.minX, b.minZ, b.maxX, b.maxZ, b.height + 3, 3, '#7d8a91');
      // Roll-up doors.
      for (let x = b.minX + 4; x < b.maxX - 6; x += 12) plain.box(x, 0, b.maxZ, x + 6, 5, b.maxZ + 0.15, '#56606a');
      continue;
    }
    if (b.setback) {
      walls[style].box(b.minX, 0, b.minZ, b.maxX, b.setback.height, b.maxZ, b.color, { ...uv, faces: 'sides', top: roofs, topColor: '#c9c3b8' });
      const s = b.setback.inset;
      walls[style].box(b.minX + s, b.setback.height, b.minZ + s, b.maxX - s, b.height, b.maxZ - s, b.color, { ...uv, faces: 'sides', top: roofs, topColor: '#b8b2a7' });
      addRoofDetails(plain, b.minX + s, b.minZ + s, b.maxX - s, b.maxZ - s, b.height, b);
    } else {
      walls[style].box(b.minX, 0, b.minZ, b.maxX, b.height, b.maxZ, b.color, { ...uv, faces: 'sides', top: b.style === 'house' ? null : roofs, topColor: '#cfc8bb' });
      if (b.style === 'house') {
        roofs.gable(b.minX - 0.6, b.minZ - 0.6, b.maxX + 0.6, b.maxZ + 0.6, b.height, 2.6, '#c8553d');
      } else {
        // Parapet lip.
        plain.box(b.minX - 0.2, b.height, b.minZ - 0.2, b.maxX + 0.2, b.height + 0.6, b.minZ + 0.4, b.color);
        plain.box(b.minX - 0.2, b.height, b.maxZ - 0.4, b.maxX + 0.2, b.height + 0.6, b.maxZ + 0.2, b.color);
        plain.box(b.minX - 0.2, b.height, b.minZ, b.minX + 0.4, b.height + 0.6, b.maxZ, b.color);
        plain.box(b.maxX - 0.4, b.height, b.minZ, b.maxX + 0.2, b.height + 0.6, b.maxZ, b.color);
        addRoofDetails(plain, b.minX, b.minZ, b.maxX, b.maxZ, b.height, b);
      }
    }
    if (b.bands) {
      // Art-deco hotel: coloured floor bands and a central fin on the long faces.
      for (let y = FLOOR * 2; y < b.height - 1; y += FLOOR * 2) {
        plain.box(b.minX - 0.25, y - 0.25, b.minZ - 0.25, b.maxX + 0.25, y + 0.15, b.maxZ + 0.25, b.bands, { faces: 'sides' });
      }
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      plain.box(b.maxX - 0.2, 0, cz - 1.2, b.maxX + 1.0, b.height + 3.5, cz + 1.2, b.bands);
      plain.box(cx - 3, b.height, cz - 3, cx + 3, b.height + 2.2, cz + 3, '#ffffff');
    }
    if (b.awning) {
      plain.box(b.minX + 0.5, 3.2, b.minZ - 1.8, b.maxX - 0.5, 3.6, b.minZ, b.awning);
      plain.box(b.minX + 0.5, 3.2, b.maxZ, b.maxX - 0.5, 3.6, b.maxZ + 1.8, b.awning);
    }
    if (b.style === 'house') {
      // Front door and a low garden wall.
      const cx = (b.minX + b.maxX) / 2;
      plain.box(cx - 0.7, 0, b.maxZ, cx + 0.7, 2.3, b.maxZ + 0.08, '#6b4f3a');
    }
  }
  for (const c of layout.containers) {
    for (let s = 0; s < c.stack; s += 1) {
      const y = s * 2.7;
      plain.box(c.minX, y, c.minZ, c.maxX, y + 2.6, c.minZ + 2.5, c.color);
      plain.box(c.minX, y, c.minZ + 2.6, c.maxX, y + 2.6, c.maxZ, s % 2 ? '#d1495b' : c.color);
    }
  }
  for (const block of layout.blocks) {
    if (block.fountain) {
      const f = block.fountain;
      plain.box(f.x - 6, 0, f.z - 6, f.x + 6, 0.8, f.z + 6, '#e8e1d3');
      plain.box(f.x - 5, 0.8, f.z - 5, f.x + 5, 0.85, f.z + 5, '#4fc3dc');
      plain.box(f.x - 0.8, 0, f.z - 0.8, f.x + 0.8, 3.2, f.z + 0.8, '#f2ece0');
      plain.box(f.x - 2, 3.2, f.z - 2, f.x + 2, 3.5, f.z + 2, '#f2ece0');
    }
  }
  for (const l of layout.lifeguards) {
    plain.box(l.x - 0.2, 0, l.z - 0.2, l.x + 0.2, 2.6, l.z + 0.2, '#ffffff');
    plain.box(l.x - 2.2, 2.6, l.z - 2.2, l.x + 2.2, 5.2, l.z + 2.2, '#ff6f61');
    plain.box(l.x - 2.6, 5.2, l.z - 2.6, l.x + 2.6, 5.6, l.z + 2.6, '#2ec4b6');
  }
  const facadeMats = {
    tower: lambert({ map: makeFacadeTexture('tower'), vertexColors: true }),
    hotel: lambert({ map: makeFacadeTexture('hotel'), vertexColors: true }),
    house: lambert({ map: makeFacadeTexture('house'), vertexColors: true }),
  };
  for (const key of Object.keys(walls)) group.add(shadowed(new THREE.Mesh(walls[key].build(), facadeMats[key])));
  group.add(shadowed(new THREE.Mesh(plain.build(), lambert({ vertexColors: true }))));
  group.add(shadowed(new THREE.Mesh(roofs.build(), lambert({ vertexColors: true }))));
}

/** Air-conditioners, a water tank and a stair hut on a flat roof. */
function addRoofDetails(builder, x0, z0, x1, z1, y, b) {
  const w = x1 - x0, d = z1 - z0;
  const seed = Math.abs(Math.floor(x0 * 13 + z0 * 7));
  builder.box(x0 + w * 0.15, y, z0 + d * 0.2, x0 + w * 0.15 + 3, y + 2.4, z0 + d * 0.2 + 3, '#d6d0c4');
  if (seed % 3 !== 0) builder.box(x0 + w * 0.6, y, z0 + d * 0.55, x0 + w * 0.6 + 2.2, y + 1.3, z0 + d * 0.55 + 1.6, '#a7b0b6');
  if (seed % 2 === 0) builder.box(x0 + w * 0.3, y, z0 + d * 0.65, x0 + w * 0.3 + 1.8, y + 1.2, z0 + d * 0.65 + 2.6, '#9aa3a9');
  if (b.style === 'tower' && b.height > 50) {
    builder.box((x0 + x1) / 2 - 0.25, y, (z0 + z1) / 2 - 0.25, (x0 + x1) / 2 + 0.25, y + 12, (z0 + z1) / 2 + 0.25, '#e04848');
  }
}

/** Front-facing sign plane for landmark buildings and roof billboards. */
function buildSigns(group, layout) {
  const signColors = { garage: ['#1b1b1f', '#ff9f1c'], spray: ['#ffffff', '#ff4d8d'], market: ['#fff3d6', '#c0392b'], ammo: ['#2f3a24', '#e9d985'], hospital: ['#d62839', '#ffffff'], police: ['#0b1f44', '#ffffff'], bank: ['#14532d', '#f6e7b4'] };
  for (const sign of layout.signs) {
    const b = sign.building;
    const front = layout.places[sign.id];
    const [bg, fg] = signColors[sign.id] ?? ['#1d3557', '#ffffff'];
    const tex = makeSignTexture(sign.text, bg, fg);
    const width = Math.min(14, Math.max(b.maxX - b.minX, b.maxZ - b.minZ) - 1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 96 / 512), new THREE.MeshBasicMaterial({ map: tex }));
    const y = Math.min(b.height - 1.2, 5.2);
    placeOnFace(mesh, b, front, y);
    group.add(mesh);
  }
  layout.billboards.forEach((bill, index) => {
    const b = bill.building;
    const tex = makeBillboardTexture(bill.text, index);
    const board = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    panel.position.y = 6;
    board.add(panel);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(12.4, 6.4, 0.3), lambert({ color: '#333840' }));
    frame.position.set(0, 6, -0.2);
    board.add(frame);
    for (const px of [-4, 4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), lambert({ color: '#555b63' }));
      post.position.set(px, 1.5, -0.2);
      board.add(post);
    }
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const baseY = b.setback ? b.height : b.height + 0.6;
    board.position.set(cx, baseY, cz);
    // Face the nearer road side.
    board.rotation.y = (index % 2 === 0) ? 0 : Math.PI / 2;
    board.traverse((o) => { o.castShadow = true; });
    group.add(board);
  });
}

function placeOnFace(mesh, b, front, y) {
  const off = 0.08;
  if (front.facing === 0) mesh.position.set((b.minX + b.maxX) / 2, y, b.maxZ + off);
  else if (front.facing === Math.PI) { mesh.position.set((b.minX + b.maxX) / 2, y, b.minZ - off); mesh.rotation.y = Math.PI; }
  else if (front.facing > 0) { mesh.position.set(b.maxX + off, y, (b.minZ + b.maxZ) / 2); mesh.rotation.y = Math.PI / 2; }
  else { mesh.position.set(b.minX - off, y, (b.minZ + b.maxZ) / 2); mesh.rotation.y = -Math.PI / 2; }
}

function buildPier(group, layout) {
  const p = layout.pier;
  const b = new GeometryBuilder();
  const hw = p.width / 2;
  b.box(p.x - hw, 0.2, p.z0, p.x + hw, 0.6, p.z1, '#9c6b43');
  for (let z = p.z0 + 4; z < p.z1; z += 6) {
    b.box(p.x - hw - 0.3, -3, z, p.x - hw + 0.3, 1.6, z + 0.6, '#6e4b2f');
    b.box(p.x + hw - 0.3, -3, z, p.x + hw + 0.3, 1.6, z + 0.6, '#6e4b2f');
  }
  b.box(p.x - hw - 0.2, 1.3, p.z0, p.x - hw + 0.2, 1.5, p.z1, '#e8e2d0');
  b.box(p.x + hw - 0.2, 1.3, p.z0, p.x + hw + 0.2, 1.5, p.z1, '#e8e2d0');
  // A bait shack at the end.
  b.box(p.x - 3, 0.6, p.z1 - 8, p.x + 3, 3.6, p.z1 - 3, '#4ea8de');
  b.gable(p.x - 3.4, p.z1 - 8.4, p.x + 3.4, p.z1 - 2.6, 3.6, 1.4, '#f1faee');
  group.add(shadowed(new THREE.Mesh(b.build(), lambert({ vertexColors: true }))));
}
