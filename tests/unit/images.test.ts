// Traitement des photos : métadonnées (dont GPS) supprimées, orientation appliquée, HEIC.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { execFileSync } from 'node:child_process';
import { publierPhoto } from '../../scripts/lib/images.mjs';

let dossier: string;
let source: string;

beforeAll(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'verifs-images-'));
  source = join(dossier, 'iphone.jpg');
  // Photo « portrait » prise en paysage (Orientation 6) avec une position GPS.
  await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#3a414b' } })
    .composite([{ input: Buffer.from('<svg width="600" height="400"><rect width="600" height="400" fill="#d9b100"/></svg>'), left: 0, top: 0 }])
    .jpeg({ quality: 90 })
    .withExif({
      IFD0: { Make: 'Apple', Model: 'iPhone' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '43/1 55/1 4200/100', GPSLongitudeRef: 'E', GPSLongitude: '2/1 8/1 3000/100' },
    })
    .withMetadata({ orientation: 6 })
    .toFile(source);
});

afterAll(async () => {
  await rm(dossier, { recursive: true, force: true });
});

describe('publication des photos', () => {
  it('la photo de départ contient bien des métadonnées EXIF (dont GPS)', async () => {
    const m = await sharp(source).metadata();
    expect(m.exif).toBeDefined();
    expect(m.exif!.includes(Buffer.from('iPhone'))).toBe(true);
    expect(m.orientation).toBe(6);
  });

  it('supprime toutes les métadonnées et applique l’orientation', async () => {
    const sortie = join(dossier, 'sortie');
    const entree = await publierPhoto(source, sortie, 'moteur');
    // Orientation 6 = rotation de 90° : 3000×2000 devient 2000×3000.
    expect(entree.largeur).toBe(2000);
    expect(entree.hauteur).toBe(3000);
    expect(entree.largeurs).toEqual([800, 1400, 2000]);
    const fichiers = await readdir(sortie);
    expect(fichiers.filter((f) => f.endsWith('.webp'))).toHaveLength(3);
    for (const f of fichiers) {
      const m = await sharp(join(sortie, f)).metadata();
      expect(m.exif, f).toBeUndefined();
      expect(m.xmp, f).toBeUndefined();
      expect(m.iptc, f).toBeUndefined();
    }
  });

  it.runIf(platform() === 'darwin')('convertit les HEIC d’iPhone (sips) et vérifie le résultat', async () => {
    const heic = join(dossier, 'photo.heic');
    execFileSync('sips', ['-s', 'format', 'heic', source, '--out', heic], { stdio: 'ignore' });
    const entree = await publierPhoto(heic, join(dossier, 'heic'), 'photo');
    expect(entree.largeur).toBeGreaterThan(0);
    const m = await sharp(join(dossier, 'heic', `photo-800.webp`)).metadata();
    expect(m.width).toBe(800);
    expect(m.exif).toBeUndefined();
  });
});
