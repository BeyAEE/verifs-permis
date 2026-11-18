#!/usr/bin/env node
// Image de partage 1200×630 aux couleurs de la charte ECF 2026 → public/og.png
// Fond Bleu ECF, logo ECF contour (fond coloré), textes en Affogato blanc,
// filet Rouge ECF en pied. Rendu avec sharp (aucun navigateur nécessaire).
import sharp from 'sharp';

const L = 1200;
const H = 630;
const BLEU = '#124483';
const ROUGE = '#da1f26';
const police = (graisse) => `src/fonts/Affogato-${graisse}.ttf`;

async function texte(contenu, graisse, taille, largeur) {
  return sharp({
    text: {
      text: `<span foreground="#ffffff" size="${taille * 1024}">${contenu}</span>`,
      font: graisse === 'Regular' ? 'Affogato' : `Affogato ${graisse}`,
      fontfile: police(graisse),
      width: largeur,
      rgba: true,
      dpi: 72,
      spacing: Math.round(taille * 0.12),
    },
  }).png().toBuffer();
}

// Logo contour : 300 px de large, zone de protection (≈ 0,115 × largeur) respectée.
const logo = await sharp('public/logo-ecf-contour.svg', { density: 300 }).resize({ width: 300 }).png().toBuffer();

const titre = await texte('QUESTIONS DE VÉRIFICATION\nDU PERMIS B', 'Bold', 64, 1040);
const sousTitre = await texte('Les 100 fiches · Entraînement · Examen blanc', 'Regular', 32, 1040);
const lieu = await texte('Auto-école ECF Picco Pechberty · Albi', 'Medium', 28, 1040);

await sharp({ create: { width: L, height: H, channels: 4, background: BLEU } })
  .composite([
    { input: logo, left: 80, top: 64 },
    { input: titre, left: 80, top: 250 },
    { input: sousTitre, left: 80, top: 445 },
    { input: lieu, left: 80, top: 520 },
    { input: { create: { width: L, height: 14, channels: 4, background: ROUGE } }, left: 0, top: H - 14 },
  ])
  .flatten({ background: BLEU })
  .png({ compressionLevel: 9 })
  .toFile('public/og.png');
console.log('✓ public/og.png');
