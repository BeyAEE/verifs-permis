#!/usr/bin/env node
// Allège les pictogrammes extraits du PDF : 300 px de large au plus, PNG en palette.
import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';

for (const f of await readdir('public/pictogrammes')) {
  const chemin = `public/pictogrammes/${f}`;
  const avant = (await stat(chemin)).size;
  const tampon = await sharp(chemin).resize({ width: 300, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
  if (tampon.length < avant) await writeFile(chemin, tampon);
  console.log(`✓ ${f} : ${avant} → ${Math.min(avant, tampon.length)} o`);
}
