/**
 * Downloads the Unsplash photos listed in src/lib/data/photos.json and writes optimised, self-hosted
 * copies to public/images/photos/ (3:2 at 1600×1067; the hero at 2400×1350), plus CREDITS.md.
 *
 *   node scripts/fetch-photos.mjs <empty-download-dir>
 *
 * Raw downloads go to the directory you pass (keep it outside the repo); only the re-encoded JPEGs
 * are written into the project. Photos are free under the Unsplash License (https://unsplash.com/license).
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rawDir = process.argv[2];
if (!rawDir) throw new Error('Usage: node scripts/fetch-photos.mjs <empty-download-dir>');

const { photos } = JSON.parse(await readFile(path.join(root, 'src/lib/data/photos.json'), 'utf8'));
const outDir = path.join(root, 'public/images/photos');
await mkdir(rawDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const existing = new Set(await readdir(rawDir));

for (const photo of photos) {
  const rawFile = path.join(rawDir, `${photo.name}.jpg`);
  if (!existing.has(`${photo.name}.jpg`)) {
    const width = photo.hero ? 2600 : 1800;
    const url = `https://images.unsplash.com/${photo.unsplash}?w=${width}&q=85&fm=jpg&fit=max`;
    const response = await fetch(url);
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !type.startsWith('image/')) throw new Error(`${photo.name}: ${response.status} ${type}`);
    await writeFile(rawFile, Buffer.from(await response.arrayBuffer()));
  }

  const [w, h] = photo.hero ? [2400, 1350] : [1600, 1067];
  const info = await sharp(rawFile)
    .rotate()
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 78, mozjpeg: true, progressive: true })
    .toFile(path.join(outDir, `${photo.name}.jpg`));
  console.log(`${photo.name}.jpg  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
}

const credits = [
  '# Photo credits',
  '',
  'Stock photography from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license).',
  'These are placeholders; replace them with real Al Khoury listing photos before launch.',
  '',
  '| File | Photographer | Source |',
  '| --- | --- | --- |',
  ...photos.map((p) => `| ${p.name}.jpg | ${p.author} | https://unsplash.com/photos/${p.page} |`),
  '',
].join('\n');
await writeFile(path.join(outDir, 'CREDITS.md'), credits);
console.log(`\n${photos.length} photos written to public/images/photos/`);
