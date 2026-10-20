/**
 * Generates the favicon (src/app/icon.svg), Apple touch icon (src/app/apple-icon.png) and a standalone
 * mark (public/brand/mark.svg) from the same path data as src/components/BrandMark.tsx.
 * Run with `npm run brand` after changing the mark.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = await readFile(path.join(root, 'src/components/BrandMark.tsx'), 'utf8');

const pick = (name) => {
  const match = source.match(new RegExp(`export const ${name} =([\\s\\S]*?);`));
  if (!match) throw new Error(`Could not read ${name} from BrandMark.tsx`);
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');
};

const solid = pick('MARK_SOLID_PATH');
const line = pick('MARK_LINE_PATH');
const gradient = `<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="84">
    <stop offset="0" stop-color="#f3dc9e"/><stop offset=".45" stop-color="#d2ab5e"/><stop offset="1" stop-color="#9c7130"/>
  </linearGradient>`;
const mark = `<path d="${solid}" fill="url(#g)"/><path d="${line}" fill="none" stroke="url(#g)" stroke-width="1.6"/>`;

/** Gold mark centred on a black rounded tile, like the brand's profile image. */
const tile = (size, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>${gradient}</defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0b0b0c"/>
  <g transform="translate(${size * 0.17} ${size * 0.2}) scale(${(size * 0.66) / 100})">${mark}</g>
</svg>
`;

await mkdir(path.join(root, 'public/brand'), { recursive: true });
await writeFile(path.join(root, 'src/app/icon.svg'), tile(64, 14));
await writeFile(
  path.join(root, 'public/brand/mark.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 84"><defs>${gradient}</defs>${mark}</svg>\n`,
);
// iOS applies its own corner mask, so the touch icon is a full square.
await sharp(Buffer.from(tile(180, 0))).png().toFile(path.join(root, 'src/app/apple-icon.png'));
console.log('wrote src/app/icon.svg, src/app/apple-icon.png, public/brand/mark.svg');
