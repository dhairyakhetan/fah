// Writes public/terranotes/editions/<id>/articles/<slug>/cover-card.webp: a 480px-wide, q78 copy of each article's cover.jpg.
// The cards on the home page are ~210-340px wide, so decoding the 900-1200px original for every one of them (rotated,
// swinging) is what made the article line heavy. The article page itself and link previews keep cover.jpg.
// Run after adding or changing a cover:  node scripts/terranotes/tools/make-card-covers.mjs
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('../../../public/terranotes/editions/', import.meta.url).pathname;
let n = 0;
for (const ed of readdirSync(ROOT)) {
  const arts = join(ROOT, ed, 'articles');
  if (!existsSync(arts)) continue;
  for (const slug of readdirSync(arts)) {
    const src = join(arts, slug, 'cover.jpg');
    if (!existsSync(src) || !statSync(src).isFile()) continue;
    const info = await sharp(src).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(arts, slug, 'cover-card.webp'));
    console.log(`${ed}/${slug}: ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}k`);
    n++;
  }
}
console.log(`${n} card covers`);
