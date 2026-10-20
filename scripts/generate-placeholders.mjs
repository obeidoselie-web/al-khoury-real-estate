/**
 * Generates the soft, illustrated placeholder photos in public/images/ so the site works fully
 * offline with no third-party image hosts. Run with `npm run images`. Replace with real photography
 * (or CMS image URLs) when available — see README.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'public', 'images');
const W = 1600;
const H = 1067;

const PALETTES = [
  { skyTop: '#f4d9c8', skyBottom: '#fbf0e8', ground: '#d8cbb7', far: '#e6d6c6', wall: '#f7f3ee', wall2: '#e9e1d7', glass: ['#9fb6c8', '#d6e1ea'], foliage: '#8a9a7b', sun: '#fbe3cf' },
  { skyTop: '#a8c8e6', skyBottom: '#eaf2fa', ground: '#cdd7c2', far: '#c4d3de', wall: '#fbfbfa', wall2: '#e4e6e8', glass: ['#7f9fbd', '#cfdeea'], foliage: '#7d9472', sun: '#fffaf0' },
  { skyTop: '#c6b7dc', skyBottom: '#f4e2df', ground: '#c9bfb4', far: '#d9cbd6', wall: '#f5efec', wall2: '#e2d6d2', glass: ['#8f8fb3', '#e3d8e6'], foliage: '#7f8a73', sun: '#fbe0d4' },
  { skyTop: '#cdd7db', skyBottom: '#f3f5f5', ground: '#bfc9b6', far: '#d3dcd9', wall: '#f8f8f6', wall2: '#dfe3e1', glass: ['#8aa2a8', '#d9e3e4'], foliage: '#6f8668', sun: '#ffffff' },
];

function defs(p, id) {
  return `
  <defs>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="glass${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.glass[0]}"/><stop offset="1" stop-color="${p.glass[1]}"/>
    </linearGradient>
    <linearGradient id="ground${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.ground}"/><stop offset="1" stop-color="${p.far}"/>
    </linearGradient>
    <filter id="soft${id}"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>`;
}

function backdrop(p, id, w, h, horizon) {
  return `
  <rect width="${w}" height="${h}" fill="url(#sky${id})"/>
  <circle cx="${w * 0.78}" cy="${h * 0.22}" r="${h * 0.09}" fill="${p.sun}" opacity="0.9" filter="url(#soft${id})"/>
  <path d="M0 ${horizon - 40} Q ${w * 0.25} ${horizon - 120} ${w * 0.5} ${horizon - 60} T ${w} ${horizon - 80} V ${horizon} H 0 Z" fill="${p.far}" opacity="0.8"/>
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#ground${id})"/>`;
}

function tree(x, baseY, size, color) {
  return `
  <rect x="${x - size * 0.05}" y="${baseY - size * 0.6}" width="${size * 0.1}" height="${size * 0.6}" fill="#8b7a68"/>
  <ellipse cx="${x}" cy="${baseY - size * 0.75}" rx="${size * 0.42}" ry="${size * 0.38}" fill="${color}"/>
  <ellipse cx="${x - size * 0.18}" cy="${baseY - size * 0.62}" rx="${size * 0.28}" ry="${size * 0.24}" fill="${color}" opacity="0.85"/>`;
}

function house(p, id, v) {
  const horizon = 700;
  const x = 260 + v * 40;
  const shift = v % 2 === 0 ? 0 : 120;
  return `
  ${backdrop(p, id, W, H, horizon)}
  <rect x="${x + shift}" y="430" width="760" height="270" fill="${p.wall}"/>
  <rect x="${x + shift + 40}" y="470" width="420" height="190" fill="url(#glass${id})"/>
  ${[1, 2, 3].map((i) => `<rect x="${x + shift + 40 + i * 105}" y="470" width="4" height="190" fill="${p.wall2}"/>`).join('')}
  <rect x="${x + shift + 500}" y="490" width="220" height="210" fill="${p.wall2}"/>
  <rect x="${x + shift + 540}" y="530" width="90" height="170" fill="#b59b80"/>
  <rect x="${x + shift + 300}" y="250" width="620" height="180" fill="${p.wall}"/>
  <rect x="${x + shift + 330}" y="285" width="560" height="110" fill="url(#glass${id})"/>
  <rect x="${x + shift + 280}" y="236" width="660" height="18" fill="${p.wall2}"/>
  <rect x="${x + shift - 20}" y="418" width="800" height="14" fill="${p.wall2}"/>
  <rect x="${x + shift - 60}" y="740" width="640" height="70" rx="6" fill="#8fc1d6" opacity="0.9"/>
  <rect x="${x + shift - 60}" y="740" width="640" height="10" fill="#ffffff" opacity="0.5"/>
  ${tree(x + shift - 120, 705, 300, p.foliage)}
  ${tree(x + shift + 1000, 705, 240, p.foliage)}
  ${tree(x + shift + 1130, 705, 180, p.foliage)}`;
}

function apartment(p, id, v) {
  const horizon = 820;
  const towers = [
    { x: 260 + v * 30, w: 360, top: 160 + v * 20 },
    { x: 700 + v * 25, w: 420, top: 300 - v * 15 },
    { x: 1180 - v * 20, w: 260, top: 420 },
  ];
  return `
  ${backdrop(p, id, W, H, horizon)}
  ${towers
    .map((t, ti) => {
      const rows = Math.floor((horizon - t.top - 40) / 64);
      const cols = Math.floor(t.w / 90);
      let windows = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          windows += `<rect x="${t.x + 24 + c * ((t.w - 28) / cols)}" y="${t.top + 30 + r * 64}" width="${(t.w - 28) / cols - 20}" height="40" rx="3" fill="url(#glass${id})"/>`;
        }
        if (ti === 1) windows += `<rect x="${t.x - 10}" y="${t.top + 72 + r * 64}" width="${t.w + 20}" height="6" fill="${p.wall2}"/>`;
      }
      return `<rect x="${t.x}" y="${t.top}" width="${t.w}" height="${horizon - t.top}" fill="${ti === 1 ? p.wall : p.wall2}"/>${windows}`;
    })
    .join('')}
  ${tree(180, horizon + 10, 220, p.foliage)}
  ${tree(1480, horizon + 10, 240, p.foliage)}`;
}

function commercial(p, id, v) {
  const horizon = 800;
  const x = 200 + v * 30;
  const w = 1200 - v * 60;
  const top = 300 + (v % 2) * 60;
  let mullions = '';
  for (let i = 0; i <= 14; i++) mullions += `<rect x="${x + 30 + i * ((w - 60) / 14)}" y="${top + 40}" width="5" height="${horizon - top - 100}" fill="${p.wall}" opacity="0.9"/>`;
  let bands = '';
  for (let r = 1; r < 5; r++) bands += `<rect x="${x}" y="${top + 40 + r * ((horizon - top - 100) / 5)}" width="${w}" height="12" fill="${p.wall}"/>`;
  return `
  ${backdrop(p, id, W, H, horizon)}
  <rect x="${x + w * 0.62}" y="${top - 200}" width="${w * 0.3}" height="200" fill="${p.wall2}"/>
  <rect x="${x + w * 0.62 + 30}" y="${top - 170}" width="${w * 0.3 - 60}" height="150" fill="url(#glass${id})" opacity="0.9"/>
  <rect x="${x}" y="${top}" width="${w}" height="${horizon - top}" fill="${p.wall}"/>
  <rect x="${x + 30}" y="${top + 40}" width="${w - 60}" height="${horizon - top - 100}" fill="url(#glass${id})"/>
  ${mullions}${bands}
  <rect x="${x - 20}" y="${top - 16}" width="${w + 40}" height="22" fill="${p.wall2}"/>
  <rect x="${x + w / 2 - 90}" y="${horizon - 60}" width="180" height="60" fill="#55606a"/>
  ${tree(x - 60, horizon + 10, 200, p.foliage)}
  ${tree(x + w + 70, horizon + 10, 200, p.foliage)}`;
}

function land(p, id, v) {
  const horizon = 520 + v * 20;
  const layers = [
    { y: horizon, color: p.far, amp: 70 },
    { y: horizon + 120, color: p.ground, amp: 90 },
    { y: horizon + 260, color: p.foliage, amp: 60, opacity: 0.55 },
    { y: horizon + 380, color: p.foliage, amp: 40, opacity: 0.8 },
  ];
  let trees = '';
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 9; i++) {
      const tx = 80 + i * 190 + (row % 2) * 90 + v * 12;
      const ty = horizon + 250 + row * 110;
      const size = 70 + row * 30;
      trees += `<ellipse cx="${tx}" cy="${ty - size * 0.4}" rx="${size * 0.5}" ry="${size * 0.36}" fill="${p.foliage}" opacity="${0.75 + row * 0.08}"/>
      <rect x="${tx - 4}" y="${ty - size * 0.1}" width="8" height="${size * 0.3}" fill="#8b7a68"/>`;
    }
  }
  return `
  <rect width="${W}" height="${H}" fill="url(#sky${id})"/>
  <circle cx="${W * (0.2 + v * 0.18)}" cy="${H * 0.2}" r="${H * 0.08}" fill="${p.sun}" opacity="0.95" filter="url(#soft${id})"/>
  ${layers
    .map(
      (l, i) =>
        `<path d="M0 ${l.y} C ${W * 0.2} ${l.y - l.amp} ${W * 0.4} ${l.y + l.amp * 0.4} ${W * 0.6} ${l.y - l.amp * 0.3} S ${W * 0.9} ${l.y - l.amp} ${W} ${l.y - l.amp * 0.2} V ${H} H 0 Z" fill="${l.color}" opacity="${l.opacity ?? 1}"/>${i === 1 ? trees : ''}`,
    )
    .join('')}`;
}

const SCENES = { house, apartment, commercial, land };

async function render(svgBody, id, p, file, width = W, height = H) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${defs(p, id)}${svgBody}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
  console.log('wrote', path.relative(root, file));
}

await mkdir(path.join(outDir, 'placeholders'), { recursive: true });

for (const [type, scene] of Object.entries(SCENES)) {
  for (let v = 0; v < 4; v++) {
    const p = PALETTES[(v + type.length) % PALETTES.length];
    await render(scene(p, `${type}${v}`, v), `${type}${v}`, p, path.join(outDir, 'placeholders', `${type}-${v + 1}.jpg`));
  }
}

// Hero: a wide villa scene at golden hour.
{
  const p = PALETTES[0];
  const body = house(p, 'hero', 1);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1200" viewBox="0 100 ${W} 800" preserveAspectRatio="xMidYMid slice">${defs(p, 'hero')}${body}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(outDir, 'hero.jpg'));
  console.log('wrote public/images/hero.jpg');
}
