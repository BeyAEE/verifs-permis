#!/usr/bin/env node
// Photos d'origine (photos-source/<voiture>/) → versions publiées (public/photos/<voiture>/).
//
//   npm run images            traite les photos nouvelles ou modifiées
//   npm run images -- --tout  retraite tout
//   npm run images -- --purge supprime du manifeste les photos dont la source a disparu
//
// - Formats : WebP toujours, AVIF quand il est nettement plus léger (> 10 %).
// - Largeurs : 800, 1400 et 2400 px (sans jamais agrandir).
// - Métadonnées : TOUTES supprimées (EXIF, GPS, XMP, IPTC) et vérifiées après coup.
// - HEIC/HEIF (iPhone) : converti avec `sips` sur Mac. Ailleurs, convertis d'abord
//   en JPEG (ex. `heif-convert` de libheif) : certaines versions d'ImageMagick
//   échouent sur les HEIC récents.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { publierPhoto } from './lib/images.mjs';

const SOURCE = 'photos-source';
const SORTIE = 'public/photos';
const MANIFESTE = 'src/data/photos-manifest.json';
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.tif', '.tiff']);

const args = new Set(process.argv.slice(2));
const tout = args.has('--tout');
const purger = args.has('--purge');

const manifeste = existsSync(MANIFESTE) ? JSON.parse(await readFile(MANIFESTE, 'utf8')) : {};
let traitees = 0;
let ignorees = 0;

async function traiter(voiture, fichier) {
  const source = join(SOURCE, voiture, fichier);
  const nom = basename(fichier, extname(fichier));
  const dossierSortie = join(SORTIE, voiture);
  const temoin = join(dossierSortie, `${nom}-800.webp`);
  if (!tout && existsSync(temoin) && manifeste[voiture]?.[nom] && (await stat(temoin)).mtimeMs >= (await stat(source)).mtimeMs) {
    ignorees++;
    return;
  }
  const entree = await publierPhoto(source, dossierSortie, nom);
  manifeste[voiture] ??= {};
  manifeste[voiture][nom] = entree;
  traitees++;
  console.log(`✓ ${voiture}/${fichier} → ${entree.largeurs.join(', ')} px (${entree.formats.join(' + ').toUpperCase()}), sans métadonnées`);
}

if (existsSync(SOURCE)) {
  for (const voiture of (await readdir(SOURCE, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const fichiers = (await readdir(join(SOURCE, voiture))).filter((f) => EXTENSIONS.has(extname(f).toLowerCase()));
    for (const f of fichiers) await traiter(voiture, f);
    if (purger) {
      const presents = new Set(fichiers.map((f) => basename(f, extname(f))));
      for (const nom of Object.keys(manifeste[voiture] ?? {})) {
        if (!presents.has(nom)) {
          delete manifeste[voiture][nom];
          console.log(`– ${voiture}/${nom} retiré du manifeste`);
        }
      }
    }
  }
} else {
  console.log(`Aucun dossier ${SOURCE}/ : rien à traiter (le manifeste existant est conservé).`);
}

// Ordre stable pour des diffs propres.
const trie = Object.fromEntries(
  Object.keys(manifeste)
    .sort()
    .map((v) => [v, Object.fromEntries(Object.keys(manifeste[v]).sort().map((n) => [n, manifeste[v][n]]))]),
);
await writeFile(MANIFESTE, JSON.stringify(trie, null, 2) + '\n');

// Rappel : photos déclarées dans les fichiers voiture mais pas encore construites.
for (const fichierVoiture of await readdir('src/data/vehicules')) {
  const d = JSON.parse(await readFile(join('src/data/vehicules', fichierVoiture), 'utf8'));
  const manquantes = d.photos.filter((p) => !trie[d.vehicule.id]?.[basename(p.fichier, extname(p.fichier))]);
  if (manquantes.length) console.log(`ℹ ${d.vehicule.nom} : ${manquantes.length} photo(s) déclarée(s) sans fichier → ${manquantes.map((p) => p.fichier).join(', ')}`);
}
console.log(`Terminé : ${traitees} traitée(s), ${ignorees} inchangée(s).`);
