// The plan of Marisol Bay as plain data: the road grid, each block's district and lots, the
// buildings standing on them, palm and prop positions, named places, and the sidewalk loops
// pedestrians walk. citymesh.js turns this into geometry; the systems query it for collisions.

import { CELL, GRID, HALF, ROAD_WIDTH, SIDEWALK, LAND, BEACH_START, SHORE_X, roadCoord, districtOfBlock, DISTRICTS, nearestRoadIndex } from './config.js';
import { ColliderGrid } from './collision.js';

/** Named places the story, shops and respawns use. Positions are filled in by placeLandmarks. */
export const PLACE_NAMES = {
  garage: 'Cinder Garage',
  market: 'Mercado de la Luna',
  pier: 'Pier 7',
  hospital: 'St. Iris Medical',
  police: 'MBPD Central',
  ammo: 'Dockside Surplus',
  spray: 'Shine & Spray',
  plaza: 'Gull Plaza',
  bank: 'Tidewater Savings',
  lookout: 'Azul Lookout',
};

/** Landmark lots: which block, which corner, colour and sign text. */
const LANDMARKS = [
  { id: 'garage', bx: 1, bz: 2, color: '#3d3d46', sign: 'CINDER GARAGE', height: 6 },
  { id: 'spray', bx: 2, bz: 1, color: '#ff4d8d', sign: 'SHINE & SPRAY', height: 6 },
  { id: 'market', bx: 4, bz: 4, color: '#e85d3f', sign: 'MERCADO DE LA LUNA', height: 8 },
  { id: 'ammo', bx: 5, bz: 6, color: '#5b6b4a', sign: 'DOCKSIDE SURPLUS', height: 7 },
  { id: 'hospital', bx: 1, bz: 5, color: '#f4f7f8', sign: 'ST. IRIS MEDICAL', height: 18 },
  { id: 'police', bx: 4, bz: 2, color: '#28406e', sign: 'MBPD CENTRAL', height: 14 },
  { id: 'bank', bx: 7, bz: 3, color: '#e9dfc4', sign: 'TIDEWATER SAVINGS', height: 12 },
];

const BILLBOARDS = [
  'LUMO BRISA · DRIVE THE BREEZE',
  'SALT 104.2 · COASTAL SOUL',
  'KESTRA VANTA GT · BORN FAST',
  'PELICAN CAB · WE KNOW THE BAY',
  'CORAL COLA · ICE COLD SUN',
  'RADIO MAREA 97.5',
];

export function blockBounds(bx, bz) {
  return {
    minX: roadCoord(bx) + ROAD_WIDTH / 2,
    maxX: roadCoord(bx + 1) - ROAD_WIDTH / 2,
    minZ: roadCoord(bz) + ROAD_WIDTH / 2,
    maxZ: roadCoord(bz + 1) - ROAD_WIDTH / 2,
  };
}

/** Build the whole plan. `rng` is the seeded generator, so a seed always gives the same city. */
export function generateCityLayout(rng) {
  const layout = {
    blocks: [],
    buildings: [],
    palms: [],
    umbrellas: [],
    containers: [],
    billboards: [],
    signs: [],
    lamps: [],
    places: {},
    parkingSpots: [],
    colliders: new ColliderGrid(),
  };
  for (let bz = 0; bz < GRID; bz += 1) {
    for (let bx = 0; bx < GRID; bx += 1) {
      const district = districtOfBlock(bx, bz);
      const bounds = blockBounds(bx, bz);
      const block = { bx, bz, district, ...bounds, landmark: LANDMARKS.find((l) => l.bx === bx && l.bz === bz) ?? null };
      layout.blocks.push(block);
      fillBlock(layout, block, rng);
    }
  }
  placeStreetProps(layout, rng);
  placeBeach(layout, rng);
  placeNamedSpots(layout);
  for (const b of layout.buildings) layout.colliders.add(b);
  for (const c of layout.containers) layout.colliders.add(c);
  // The island's edges, as tall invisible walls.
  const wall = 400;
  layout.colliders.add({ minX: LAND.minX - wall, maxX: LAND.minX, minZ: LAND.minZ - wall, maxZ: LAND.maxZ + wall, height: 50, invisible: true });
  layout.colliders.add({ minX: LAND.maxX, maxX: LAND.maxX + wall, minZ: LAND.minZ - wall, maxZ: LAND.maxZ + wall, height: 50, invisible: true });
  layout.colliders.add({ minX: LAND.minX, maxX: LAND.maxX, minZ: LAND.minZ - wall, maxZ: LAND.minZ, height: 50, invisible: true });
  // The south wall opens onto the pier, whose rails keep cars on the boards.
  const pier = layout.pier, ph = pier.width / 2;
  layout.colliders.add({ minX: LAND.minX, maxX: pier.x - ph, minZ: LAND.maxZ, maxZ: LAND.maxZ + wall, height: 50, invisible: true });
  layout.colliders.add({ minX: pier.x + ph, maxX: LAND.maxX, minZ: LAND.maxZ, maxZ: LAND.maxZ + wall, height: 50, invisible: true });
  layout.colliders.add({ minX: pier.x - ph - 1, maxX: pier.x - ph, minZ: LAND.maxZ - 1, maxZ: pier.z1, height: 1.5, invisible: true });
  layout.colliders.add({ minX: pier.x + ph, maxX: pier.x + ph + 1, minZ: LAND.maxZ - 1, maxZ: pier.z1, height: 1.5, invisible: true });
  layout.colliders.add({ minX: pier.x - ph - 1, maxX: pier.x + ph + 1, minZ: pier.z1, maxZ: pier.z1 + 1, height: 1.5, invisible: true });
  layout.colliders.add({ minX: pier.x - 3, maxX: pier.x + 3, minZ: pier.z1 - 8, maxZ: pier.z1 - 3, height: 4, invisible: true });
  return layout;
}

function addBuilding(layout, block, minX, maxX, minZ, maxZ, height, color, style) {
  const b = { minX, maxX, minZ, maxZ, height, color, style, district: block.district };
  layout.buildings.push(b);
  return b;
}

function fillBlock(layout, block, rng) {
  const { minX, maxX, minZ, maxZ, district } = block;
  const inX0 = minX + SIDEWALK + 1, inX1 = maxX - SIDEWALK - 1;
  const inZ0 = minZ + SIDEWALK + 1, inZ1 = maxZ - SIDEWALK - 1;
  const palette = DISTRICTS[district].palette;
  const [fLo, fHi] = DISTRICTS[district].floors;
  const floors = () => rng.int(fLo, fHi);
  const land = block.landmark;
  if (district === 'park') {
    for (let i = 0; i < 14; i += 1) layout.palms.push({ x: rng.range(inX0 + 2, inX1 - 2), z: rng.range(inZ0 + 2, inZ1 - 2), scale: rng.range(0.85, 1.25), rot: rng.range(0, 6.28) });
    block.fountain = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
    return;
  }
  const lots = [];
  if (district === 'heights') {
    const half = (inX0 + inX1) / 2, halfZ = (inZ0 + inZ1) / 2;
    if (rng.chance(0.35) && !land) {
      lots.push([inX0 + 4, inX1 - 4, inZ0 + 4, inZ1 - 4, 'tower']);
    } else {
      lots.push([inX0, half - 2, inZ0, halfZ - 2, 'tower'], [half + 2, inX1, inZ0, halfZ - 2, 'tower'], [inX0, half - 2, halfZ + 2, inZ1, 'tower'], [half + 2, inX1, halfZ + 2, inZ1, 'tower']);
    }
  } else if (district === 'strand') {
    const halfZ = (inZ0 + inZ1) / 2;
    lots.push([inX0, inX1 - 6, inZ0, halfZ - 3, 'hotel'], [inX0, inX1 - 6, halfZ + 3, inZ1, 'hotel']);
  } else if (district === 'palmetto') {
    const n = 3, w = (inX1 - inX0) / n, d = (inZ1 - inZ0) / n;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (i === 1 && j === 1) continue;
        const x0 = inX0 + i * w + 3, z0 = inZ0 + j * d + 3;
        lots.push([x0, x0 + w - rng.range(5, 8), z0, z0 + d - rng.range(5, 8), 'house']);
        layout.palms.push({ x: x0 + w - 2.5, z: z0 + d - 2.5, scale: rng.range(0.8, 1.15), rot: rng.range(0, 6.28) });
      }
    }
  } else if (district === 'mercado') {
    const n = 3, w = (inX1 - inX0) / n;
    for (let i = 0; i < n; i += 1) {
      lots.push([inX0 + i * w, inX0 + (i + 1) * w - 0.5, inZ0, inZ0 + 22, 'shop']);
      lots.push([inX0 + i * w, inX0 + (i + 1) * w - 0.5, inZ1 - 22, inZ1, 'shop']);
    }
    layout.palms.push({ x: (inX0 + inX1) / 2, z: (inZ0 + inZ1) / 2, scale: 1.1, rot: 0 });
  } else if (district === 'docks') {
    lots.push([inX0, inX1, inZ0, inZ0 + 26, 'warehouse']);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        if (rng.chance(0.25)) continue;
        const x0 = inX0 + 2 + col * 13.5, z0 = inZ0 + 31 + row * 7;
        const stack = rng.int(1, 3);
        layout.containers.push({ minX: x0, maxX: x0 + 12, minZ: z0, maxZ: z0 + 2.6 * 2, height: 2.7 * stack, color: rng.pick(['#d1495b', '#00798c', '#edae49', '#30638e', '#66a182', '#f08a4b']), stack });
      }
    }
  }
  lots.forEach((lot, index) => {
    const [x0, x1, z0, z1, style] = lot;
    if (land && index === 0) {
      const b = addBuilding(layout, block, x0, x1, z0, z1, land.height, land.color, 'landmark');
      b.landmark = land.id;
      layout.signs.push({ text: land.sign, building: b, id: land.id });
      layout.places[land.id] = frontOfBuilding(b);
      return;
    }
    const f = style === 'tower' ? floors() : style === 'hotel' ? rng.int(4, 9) : floors();
    const h = style === 'house' ? 3.4 * f + 0.4 : 3.5 * f + 1;
    const b = addBuilding(layout, block, x0, x1, z0, z1, h, rng.pick(palette), style);
    if (style === 'tower' && f > 14 && rng.chance(0.6)) b.setback = { height: h * rng.range(0.55, 0.7), inset: rng.range(3, 6) };
    if (style === 'hotel') b.bands = rng.pick(['#ff6f91', '#2ec4b6', '#ff9f1c', '#5e60ce']);
    if (style === 'shop') b.awning = rng.pick(['#e63946', '#2a9d8f', '#f4a261', '#264653', '#ffb703']);
    if ((style === 'tower' || style === 'hotel') && rng.chance(0.3) && layout.billboards.length < 12) {
      layout.billboards.push({ building: b, text: BILLBOARDS[layout.billboards.length % BILLBOARDS.length] });
    }
  });
}

/** A point on the sidewalk in front of a building's nearest road-facing side. */
function frontOfBuilding(b) {
  const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
  const roadX = Math.round((cx + HALF) / CELL) * CELL - HALF;
  const roadZ = Math.round((cz + HALF) / CELL) * CELL - HALF;
  if (Math.abs(cx - roadX) < Math.abs(cz - roadZ)) {
    const side = Math.sign(roadX - cx);
    return { x: side > 0 ? b.maxX + 3 : b.minX - 3, z: cz, facing: side > 0 ? Math.PI / 2 : -Math.PI / 2 };
  }
  const side = Math.sign(roadZ - cz);
  return { x: cx, z: side > 0 ? b.maxZ + 3 : b.minZ - 3, facing: side > 0 ? 0 : Math.PI };
}

function placeStreetProps(layout, rng) {
  // Palms line Strand Avenue (the east road) and the median-less boulevards; lamps at corners.
  const strandX = roadCoord(GRID);
  for (let z = -HALF + 14; z < HALF - 10; z += 13) {
    if (Math.abs(((z + HALF) % CELL)) < 12 || Math.abs(((z + HALF) % CELL) - CELL) < 12) continue;
    layout.palms.push({ x: strandX + ROAD_WIDTH / 2 + 2.2, z, scale: rng.range(1.0, 1.3), rot: rng.range(0, 6.28) });
    layout.palms.push({ x: strandX - ROAD_WIDTH / 2 - 2.2, z: z + 6, scale: rng.range(0.9, 1.2), rot: rng.range(0, 6.28) });
  }
  for (let i = 0; i <= GRID; i += 1) {
    for (let j = 0; j <= GRID; j += 1) {
      const x = roadCoord(i), z = roadCoord(j);
      layout.lamps.push({ x: x + ROAD_WIDTH / 2 + 1, z: z + ROAD_WIDTH / 2 + 1, rot: Math.PI * 1.25 });
      if (rng.chance(0.5)) layout.lamps.push({ x: x - ROAD_WIDTH / 2 - 1, z: z - ROAD_WIDTH / 2 - 1, rot: Math.PI * 0.25 });
    }
  }
  // Palms along the main east-west boulevard (road line 4).
  const boulevardZ = roadCoord(4);
  for (let x = -HALF + 20; x < HALF; x += 16) {
    if (Math.abs(((x + HALF) % CELL)) < 14 || Math.abs(((x + HALF) % CELL) - CELL) < 14) continue;
    layout.palms.push({ x, z: boulevardZ - ROAD_WIDTH / 2 - 2, scale: rng.range(0.9, 1.15), rot: rng.range(0, 6.28) });
    layout.palms.push({ x: x + 8, z: boulevardZ + ROAD_WIDTH / 2 + 2, scale: rng.range(0.9, 1.15), rot: rng.range(0, 6.28) });
  }
}

function placeBeach(layout, rng) {
  // Umbrellas and towels along the sand, palms at the top of the beach, a lifeguard hut.
  for (let z = -HALF; z < HALF; z += 9) {
    if (rng.chance(0.55)) layout.umbrellas.push({ x: BEACH_START + rng.range(22, 52), z: z + rng.range(-3, 3), color: rng.pick(['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c']) });
    if (rng.chance(0.4)) layout.palms.push({ x: BEACH_START + rng.range(4, 16), z: z + rng.range(-3, 3), scale: rng.range(1.0, 1.4), rot: rng.range(0, 6.28) });
  }
  layout.lifeguards = [{ x: BEACH_START + 40, z: -120 }, { x: BEACH_START + 40, z: 110 }];
  layout.pier = { x: roadCoord(6) + 10, z0: LAND.maxZ - 6, z1: LAND.maxZ + 70, width: 9 };
}

function placeNamedSpots(layout) {
  // Gull Plaza: the open square at the heart of Coral Heights, in front of block (5,1).
  layout.places.plaza = { x: roadCoord(5) + 26, z: roadCoord(2) - ROAD_WIDTH / 2 - 2, facing: 0 };
  layout.places.pier = { x: layout.pier.x, z: layout.pier.z1 - 10, facing: 0 };
  layout.places.lookout = { x: BEACH_START + 30, z: roadCoord(1), facing: Math.PI / 2 };
  // Parked cars along curbs, nose along the road, on the right-hand lane edge.
  const spots = [[1, 2.5, 'z'], [3, 1.5, 'x'], [5, 3.5, 'z'], [6, 4.5, 'x'], [2, 5.5, 'x'], [7, 2.5, 'z'], [4, 6.5, 'z'], [0, 3.5, 'z'], [6, 0.5, 'z'], [8, 5.5, 'z'], [3, 7.5, 'x'], [5, 1.5, 'x']];
  for (const [line, along, axis] of spots) {
    const fixed = roadCoord(line), moving = roadCoord(0) + along * CELL;
    if (axis === 'z') layout.parkingSpots.push({ x: fixed + 6.6, z: moving, heading: Math.PI });
    else layout.parkingSpots.push({ x: moving, z: fixed + 6.6, heading: Math.PI / 2 });
  }
}

/** Which named district a world position is in (the beach counts as Azul Strand). */
export function districtAt(x, z) {
  const bx = Math.max(0, Math.min(GRID - 1, Math.floor((x + HALF) / CELL)));
  const bz = Math.max(0, Math.min(GRID - 1, Math.floor((z + HALF) / CELL)));
  if (x > HALF) return DISTRICTS.strand.name;
  return DISTRICTS[districtOfBlock(bx, bz)].name;
}

/** The nearest intersection (road line indices) to a point. */
export function nearestNode(x, z) {
  return { i: nearestRoadIndex(x), j: nearestRoadIndex(z) };
}

/** True when a point lies on a road surface (not a sidewalk or a block). */
export function isOnRoad(x, z) {
  const ox = ((x + HALF) % CELL + CELL) % CELL, oz = ((z + HALF) % CELL + CELL) % CELL;
  const nearX = ox < ROAD_WIDTH / 2 || ox > CELL - ROAD_WIDTH / 2;
  const nearZ = oz < ROAD_WIDTH / 2 || oz > CELL - ROAD_WIDTH / 2;
  const inside = x > -HALF - ROAD_WIDTH / 2 && x < HALF + ROAD_WIDTH / 2 && z > -HALF - ROAD_WIDTH / 2 && z < HALF + ROAD_WIDTH / 2;
  return inside && (nearX || nearZ);
}

/** Height of the walkable surface at a point: the pier deck, the sloping beach, or flat land. */
export function groundHeightAt(layout, x, z) {
  const p = layout.pier;
  if (Math.abs(x - p.x) <= p.width / 2 && z >= p.z0 && z <= p.z1) return 0.6;
  if (x > SHORE_X) return Math.max(-2.4, -((x - SHORE_X) / 34) * 2.4);
  return 0;
}
