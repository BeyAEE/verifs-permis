// Cœur du traitement des photos, partagé par le script et les tests.
import sharp from 'sharp';
import { writeFile, mkdir, rm, mkdtemp } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { execFileSync } from 'node:child_process';

export const LARGEURS = [800, 1400, 2400];

/** Rend un fichier lisible par sharp (HEIC → JPEG via sips sur Mac). */
export async function versLisible(chemin) {
  const ext = extname(chemin).toLowerCase();
  if (ext !== '.heic' && ext !== '.heif') return { chemin, nettoyer: async () => {} };
  if (platform() !== 'darwin') {
    throw new Error(
      `${chemin} : HEIC non pris en charge ici. Convertis-le en JPEG (ex. « heif-convert photo.heic photo.jpg ») puis vérifie le résultat à l'œil.`,
    );
  }
  const dossier = await mkdtemp(join(tmpdir(), 'verifs-heic-'));
  const jpeg = join(dossier, basename(chemin, ext) + '.jpg');
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '95', chemin, '--out', jpeg], { stdio: 'ignore' });
  const meta = await sharp(jpeg).metadata();
  if (!meta.width || !meta.height) throw new Error(`${chemin} : conversion HEIC ratée (image vide).`);
  return { chemin: jpeg, nettoyer: () => rm(dossier, { recursive: true, force: true }) };
}

export async function verifierSansMetadonnees(fichier) {
  const m = await sharp(fichier).metadata();
  if (m.exif || m.xmp || m.iptc) {
    throw new Error(`${fichier} contient encore des métadonnées : publication refusée.`);
  }
}

/**
 * Publie une photo : redressée, sans métadonnées, en WebP (+ AVIF si utile).
 * Retourne l'entrée du manifeste.
 */
export async function publierPhoto(source, dossierSortie, nom, largeursVoulues = LARGEURS) {
  await mkdir(dossierSortie, { recursive: true });
  const lisible = await versLisible(source);
  try {
    // rotate() applique l'orientation EXIF avant la suppression des métadonnées.
    const redressee = await sharp(lisible.chemin).rotate().toBuffer({ resolveWithObject: true });
    const { width, height } = redressee.info;
    const largeurs = [...new Set(largeursVoulues.map((l) => Math.min(l, width)))];
    let avifUtile = true;
    for (const l of largeurs) {
      const base = sharp(redressee.data).resize({ width: l, withoutEnlargement: true });
      const webp = await base.clone().webp({ quality: 80, effort: 5 }).toBuffer();
      const avif = await base.clone().avif({ quality: 52, effort: 4 }).toBuffer();
      await writeFile(join(dossierSortie, `${nom}-${l}.webp`), webp);
      if (avif.length < webp.length * 0.9) await writeFile(join(dossierSortie, `${nom}-${l}.avif`), avif);
      else avifUtile = false;
    }
    for (const l of largeurs) {
      await verifierSansMetadonnees(join(dossierSortie, `${nom}-${l}.webp`));
      if (avifUtile) await verifierSansMetadonnees(join(dossierSortie, `${nom}-${l}.avif`));
      else await rm(join(dossierSortie, `${nom}-${l}.avif`), { force: true });
    }
    return { largeur: width, hauteur: height, largeurs, formats: avifUtile ? ['avif', 'webp'] : ['webp'] };
  } finally {
    await lisible.nettoyer();
  }
}
