// World constants and the original names of Marisol Bay: its districts, cars, gangs, radio.
// Everything here is invented for this game.

export const CITY_NAME = 'Marisol Bay';

/** Distance between two parallel road centre lines, in metres. */
export const CELL = 80;
export const ROAD_WIDTH = 16;
export const SIDEWALK = 4;
/** Blocks per side: roads run on lines 0..GRID in both directions. */
export const GRID = 8;
export const HALF = (GRID * CELL) / 2;
/** Lane centre offset from the road centre line (one lane each way, drive on the right). */
export const LANE = 4;
/** Land edges: the island runs past the outer roads; the east side is the long beach. */
export const LAND = { minX: -HALF - 34, maxX: HALF + 86, minZ: -HALF - 34, maxZ: HALF + 34 };
export const BEACH_START = HALF + ROAD_WIDTH / 2 + SIDEWALK;
export const SHORE_X = HALF + 70;

export const FIXED_STEP = 1 / 60;
export const SAVE_KEY = 'marisol-bay-save-v1';

export function roadCoord(index) {
  return -HALF + index * CELL;
}

/** The road line index nearest to a coordinate, clamped to the grid. */
export function nearestRoadIndex(value) {
  return Math.max(0, Math.min(GRID, Math.round((value + HALF) / CELL)));
}

export const DISTRICTS = {
  strand: { name: 'Azul Strand', palette: ['#f6c6d0', '#9fe3dc', '#fff1c9', '#c9e6ff', '#ffd4a8', '#e8d1ff'], floors: [3, 9] },
  heights: { name: 'Coral Heights', palette: ['#e9eef2', '#bcd3e0', '#f2dfcf', '#d6e4e9', '#a9c4d6', '#f0e6da'], floors: [10, 30] },
  palmetto: { name: 'Palmetto Row', palette: ['#ffe3b3', '#c5ecd0', '#ffd0c2', '#d9d2ff', '#fff7e0', '#bfe7f0'], floors: [1, 2] },
  mercado: { name: 'Old Mercado', palette: ['#f2a65a', '#e8746b', '#f4d35e', '#7cc6b5', '#d9886a', '#efc7a0'], floors: [2, 5] },
  docks: { name: 'Sunline Docks', palette: ['#9aa5ad', '#b9a58f', '#8fa3a8', '#c4b8a6', '#a3968a', '#b0bec5'], floors: [1, 3] },
  park: { name: 'Flamingo Park', palette: ['#ffffff'], floors: [0, 0] },
};

/** Which district a block (bx, bz) belongs to. North is -z. */
export function districtOfBlock(bx, bz) {
  if (bx === 2 && bz === 4) return 'park';
  if (bx === 7) return 'strand';
  if (bx <= 2) return 'palmetto';
  if (bz <= 3) return 'heights';
  if (bz <= 5) return 'mercado';
  return 'docks';
}

export const CAR_MODELS = {
  brisa: { name: 'Lumo Brisa', kind: 'hatch', length: 3.9, width: 1.8, height: 1.45, maxSpeed: 34, accel: 13, grip: 7.5, mass: 1.0, colors: ['#ff7a59', '#4cc9f0', '#f7f7f2', '#ffd23f', '#7bd389'] },
  solana: { name: 'Orla Solana', kind: 'sedan', length: 4.6, width: 1.9, height: 1.45, maxSpeed: 38, accel: 14, grip: 7.0, mass: 1.15, colors: ['#2b2d42', '#d90429', '#edf2f4', '#8d99ae', '#3a86ff'] },
  vanta: { name: 'Kestra Vanta GT', kind: 'coupe', length: 4.5, width: 1.95, height: 1.2, maxSpeed: 52, accel: 22, grip: 8.5, mass: 1.0, colors: ['#ff006e', '#fb5607', '#00bbf9', '#f4f1de', '#9b5de5'] },
  mako: { name: 'Mako Haul Van', kind: 'van', length: 5.2, width: 2.1, height: 2.3, maxSpeed: 28, accel: 9, grip: 6.0, mass: 1.6, colors: ['#f1faee', '#a8dadc', '#e9c46a', '#264653'] },
  pelican: { name: 'Pelican Cab', kind: 'taxi', length: 4.6, width: 1.9, height: 1.5, maxSpeed: 36, accel: 13, grip: 7.0, mass: 1.1, colors: ['#ff9f1c'] },
  halcon: { name: 'Halcón Interceptor', kind: 'police', length: 4.8, width: 2.0, height: 1.5, maxSpeed: 47, accel: 20, grip: 8.0, mass: 1.25, colors: ['#f8f9fa'] },
};
export const TRAFFIC_MODELS = ['brisa', 'brisa', 'solana', 'solana', 'vanta', 'mako', 'pelican'];

export const GANGS = {
  gulls: { name: 'Neon Gulls', jacket: '#16e0bd', pants: '#1b1b2f' },
  salineros: { name: 'Los Salineros', jacket: '#f5f5f5', pants: '#3d405b' },
};

export const RADIO_STATIONS = [
  { id: 'salt', name: 'SALT 104.2', tagline: 'Coastal soul, all afternoon' },
  { id: 'pulse', name: 'PULSE 88.9', tagline: 'Neon synth after the sun' },
  { id: 'marea', name: 'RADIO MAREA 97.5', tagline: 'Cumbia del puerto' },
  { id: 'off', name: 'RADIO OFF', tagline: '' },
];

export const WEAPONS = [
  { id: 'fists', name: 'Fists', damage: 18, rate: 0.45, range: 1.8, mag: 0, spread: 0 },
  { id: 'pistol', name: 'Kestrel P9', damage: 34, rate: 0.22, range: 90, mag: 12, spread: 0.012, reload: 1.1 },
  { id: 'smg', name: 'Rattler SMG', damage: 20, rate: 0.075, range: 70, mag: 30, spread: 0.035, reload: 1.6 },
];
