// Procedural canvas textures: facades, asphalt with lane markings, crosswalks, sidewalks, sand,
// grass, signs and billboards. Drawn at load from code, so the game ships no image files.

import * as THREE from 'three';
import { createRandom } from './random.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function speckle(ctx, w, h, count, rng, colors, size = 2) {
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    ctx.fillRect(rng() * w, rng() * h, size * rng() + 0.5, size * rng() + 0.5);
  }
}

/** Facade tile: two window bays by one floor. Walls are white so vertex colours tint them. */
export function makeFacadeTexture(style) {
  const c = canvas(256, 128), ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 128);
  const rng = createRandom(style.length * 97);
  speckle(ctx, 256, 128, 500, rng, ['#f1f1f1', '#fafafa', '#e9e9e9'], 3);
  for (let bay = 0; bay < 2; bay += 1) {
    const x = bay * 128;
    if (style === 'tower') {
      // Curtain wall: wide glass with thin mullions.
      const g = ctx.createLinearGradient(0, 8, 0, 112);
      g.addColorStop(0, '#9cc9e6'); g.addColorStop(0.45, '#4f86b0'); g.addColorStop(1, '#23466b');
      ctx.fillStyle = g;
      ctx.fillRect(x + 6, 10, 116, 96);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(x + 6, 10); ctx.lineTo(x + 50, 10); ctx.lineTo(x + 6, 70); ctx.fill();
      ctx.fillStyle = '#d7dde2';
      ctx.fillRect(x + 62, 10, 4, 96);
    } else if (style === 'house') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 34, 30, 60, 62);
      const g = ctx.createLinearGradient(0, 34, 0, 88);
      g.addColorStop(0, '#a9d6ef'); g.addColorStop(1, '#3d6585');
      ctx.fillStyle = g;
      ctx.fillRect(x + 40, 36, 48, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 62, 36, 4, 50);
      ctx.fillStyle = 'rgba(40,40,40,0.25)';
      ctx.fillRect(x + 30, 92, 68, 6);
    } else {
      // Hotel / shop: tall window with a balcony rail and a shade.
      const g = ctx.createLinearGradient(0, 20, 0, 104);
      g.addColorStop(0, '#b6def2'); g.addColorStop(0.5, '#5f97bd'); g.addColorStop(1, '#2d5070');
      ctx.fillStyle = g;
      ctx.fillRect(x + 24, 20, 80, 84);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + 24, 20, 20, 84);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 20, 14, 88, 8);
      ctx.fillStyle = '#f7f7f7';
      ctx.fillRect(x + 18, 86, 92, 4);
      for (let r = 0; r < 9; r += 1) ctx.fillRect(x + 20 + r * 11, 86, 2.5, 20);
      ctx.fillRect(x + 16, 104, 96, 5);
    }
  }
  return toTexture(c);
}

/** Road tile (u across 16 m, v along 16 m): asphalt, double yellow centre, white edge lines. */
export function makeRoadTexture() {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const rng = createRandom(11);
  ctx.fillStyle = '#3b3e45';
  ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, 4000, rng, ['#34373d', '#43464d', '#4a4c52', '#2f3136'], 2);
  // Tyre-worn lanes.
  ctx.fillStyle = 'rgba(20,20,24,0.18)';
  for (const u of [44, 76, 180, 212]) ctx.fillRect(u - 7, 0, 14, 256);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(122, 0, 4, 256);
  ctx.fillRect(130, 0, 4, 256);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(10, 0, 4, 256);
  ctx.fillRect(242, 0, 4, 256);
  return toTexture(c);
}

/** Intersection tile: plain asphalt framed by zebra crossings on each side. */
export function makeCrossingTexture() {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const rng = createRandom(12);
  ctx.fillStyle = '#3b3e45';
  ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, 4000, rng, ['#34373d', '#43464d', '#4a4c52'], 2);
  ctx.fillStyle = '#ececec';
  for (let i = 0; i < 9; i += 1) {
    const p = 22 + i * 24;
    ctx.fillRect(p, 4, 12, 30);
    ctx.fillRect(p, 222, 12, 30);
    ctx.fillRect(4, p, 30, 12);
    ctx.fillRect(222, p, 30, 12);
  }
  return toTexture(c);
}

export function makeSidewalkTexture() {
  const c = canvas(128, 128), ctx = c.getContext('2d');
  const rng = createRandom(13);
  ctx.fillStyle = '#d9d3c7';
  ctx.fillRect(0, 0, 128, 128);
  speckle(ctx, 128, 128, 900, rng, ['#cfc8bb', '#e2ddd2', '#c8c0b1'], 2);
  ctx.strokeStyle = '#b9b1a3';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 128; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  return toTexture(c);
}

export function makeGroundTexture(kind) {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  const rng = createRandom(kind.length * 7);
  const base = { grass: '#6fae4f', sand: '#ecd7a6', plaza: '#cfc5b4', dirt: '#9c8d72' }[kind];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const tones = {
    grass: ['#5f9d43', '#7dbb5a', '#86c463', '#58913d'],
    sand: ['#e3cc96', '#f3e2b9', '#dcc28a', '#f6e8c6'],
    plaza: ['#c4b9a6', '#d8cfc0', '#bcb09b'],
    dirt: ['#8f8167', '#a7987c'],
  }[kind];
  speckle(ctx, 256, 256, 6000, rng, tones, 3);
  return toTexture(c);
}

/** A shop sign: bold text on a coloured panel. */
export function makeSignTexture(text, bg = '#1d3557', fg = '#ffffff') {
  const c = canvas(512, 96), ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 84);
  ctx.fillStyle = fg;
  ctx.font = 'bold 44px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 44;
  while (ctx.measureText(text).width > 470 && size > 18) {
    size -= 2;
    ctx.font = `bold ${size}px "Arial Black", Arial, sans-serif`;
  }
  ctx.fillText(text, 256, 50);
  return toTexture(c, false);
}

/** A billboard poster: a sunset gradient with the ad line, in the city's own brands. */
export function makeBillboardTexture(text, index) {
  const c = canvas(512, 256), ctx = c.getContext('2d');
  const palettes = [['#ff6b6b', '#ffd166'], ['#06d6a0', '#118ab2'], ['#8338ec', '#ff006e'], ['#ffbe0b', '#fb5607'], ['#3a86ff', '#80ffdb'], ['#f15bb5', '#fee440']];
  const [a, b] = palettes[index % palettes.length];
  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.arc(400, 200, 120, 0, Math.PI * 2); ctx.fill();
  const [head, tail] = text.split(' · ');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = 'italic 900 58px "Arial Black", Arial, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.fillText(head, 28, 110, 460);
  if (tail) {
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(tail, 30, 170, 460);
  }
  return toTexture(c, false);
}

/** Soft round dot used by particles, flashes and the sun glow. */
export function makeGlowTexture() {
  const c = canvas(64, 64), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(c, false);
}

/** Palm frond: a feathered leaf on a transparent background. */
export function makeFrondTexture() {
  const c = canvas(128, 32), ctx = c.getContext('2d');
  ctx.strokeStyle = '#4c7a2b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(128, 16); ctx.stroke();
  for (let i = 4; i < 124; i += 4) {
    const len = 14 * Math.sin((i / 128) * Math.PI) + 2;
    ctx.strokeStyle = i % 8 ? '#5f9a35' : '#4f8a2c';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(i, 16); ctx.lineTo(i + 6, 16 - len); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 16); ctx.lineTo(i + 6, 16 + len); ctx.stroke();
  }
  return toTexture(c, false);
}
