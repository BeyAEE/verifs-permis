#!/usr/bin/env node
// Icônes de l'application et logo de l'en-tête, à partir de public/logo-ecf.png.
// À relancer seulement si le logo change : `node scripts/icones.mjs`.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const LOGO = 'public/logo-ecf.png';
const BLANC = { r: 255, g: 255, b: 255, alpha: 1 };

async function carre(taille, part, sortie) {
  const interieur = Math.round(taille * part);
  const logo = await sharp(LOGO).resize(interieur, interieur, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: taille, height: taille, channels: 4, background: BLANC } })
    .composite([{ input: logo, gravity: 'center' }])
    .flatten({ background: BLANC })
    .png({ compressionLevel: 9 })
    .toFile(sortie);
  console.log('✓', sortie);
}

await mkdir('public/icones', { recursive: true });
await mkdir('public/img', { recursive: true });
await carre(192, 0.82, 'public/icones/icon-192.png');
await carre(512, 0.82, 'public/icones/icon-512.png');
await carre(512, 0.6, 'public/icones/icon-maskable-512.png'); // zone sûre des icônes adaptatives
await carre(180, 0.82, 'public/icones/apple-touch-icon.png');
await carre(32, 0.95, 'public/icones/favicon-32.png');

// Logo d'en-tête : 40 px affichés → 80 px pour les écrans haute densité.
await sharp(LOGO).resize(80, 80, { fit: 'contain', background: BLANC }).flatten({ background: BLANC }).webp({ quality: 90 }).toFile('public/img/logo-ecf-80.webp');
await sharp(LOGO).resize(80, 80, { fit: 'contain', background: BLANC }).flatten({ background: BLANC }).png().toFile('public/img/logo-ecf-80.png');
console.log('✓ logo d’en-tête');
