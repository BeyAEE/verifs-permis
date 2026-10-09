#!/usr/bin/env node
// Génère la photo de test (compartiment moteur stylisé) et son manifeste.
// Zones de test VALIDÉES, distinctes des vraies données : tests/fixtures/vehicules/.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const L = 1600;
const H = 1200;
// Rectangles en % — doivent correspondre aux polygones de tests/fixtures/vehicules/clio5.json
const pieces = [
  { x: 12, y: 18, l: 18, h: 20, coul: '#d9b100', txt: 'LIQUIDE FREIN' },
  { x: 62, y: 16, l: 22, h: 24, coul: '#2f7de1', txt: 'LAVE-GLACE' },
  { x: 40, y: 50, l: 18, h: 18, coul: '#e65c2e', txt: 'HUILE' },
  { x: 68, y: 58, l: 20, h: 22, coul: '#3aa36b', txt: 'REFROIDISSEMENT' },
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}">
  <rect width="100%" height="100%" fill="#2a2f36"/>
  <rect x="5%" y="8%" width="90%" height="84%" rx="40" fill="#3a414b"/>
  ${pieces
    .map(
      (p) => `<rect x="${p.x}%" y="${p.y}%" width="${p.l}%" height="${p.h}%" rx="24" fill="${p.coul}"/>
      <text x="${p.x + p.l / 2}%" y="${p.y + p.h / 2}%" font-family="sans-serif" font-size="34" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${p.txt}</text>`,
    )
    .join('')}
  <text x="50%" y="96%" font-family="sans-serif" font-size="28" fill="#9aa4b2" text-anchor="middle">PHOTO DE TEST</text>
</svg>`;

const dossier = 'tests/fixtures/photos/clio5';
await mkdir(dossier, { recursive: true });
const base = sharp(Buffer.from(svg)).png();
for (const l of [800, 1400]) {
  await base.clone().resize({ width: l }).webp({ quality: 70 }).toFile(`${dossier}/test-moteur-${l}.webp`);
}
// Gros plan de test
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#d9b100"/><text x="50%" y="50%" font-family="sans-serif" font-size="56" font-weight="700" fill="#222" text-anchor="middle" dominant-baseline="middle">GROS PLAN FREIN</text></svg>`))
  .webp({ quality: 70 })
  .toFile(`${dossier}/test-frein-800.webp`);

await writeFile(
  'tests/fixtures/photos-manifest.json',
  JSON.stringify(
    {
      clio5: {
        'test-frein': { largeur: 800, hauteur: 600, largeurs: [800], formats: ['webp'] },
        'test-moteur': { largeur: L, hauteur: H, largeurs: [800, 1400], formats: ['webp'] },
      },
    },
    null,
    2,
  ) + '\n',
);
console.log('✓ photos de test générées');
