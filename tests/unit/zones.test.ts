import { describe, it, expect } from 'vitest';
import {
  pointDansPolygone,
  ecranVersRelatif,
  relatifVersEcran,
  rectTransforme,
  zoomerAutour,
  borner,
  type Point,
  type Rect,
} from '../../src/lib/geometrie';
import { exercicePour, donneesPubliques, repereDe, type DonneesVehicule, type Manifeste } from '../../src/lib/vehicules';
import { importerVehicule, exporterVehicule, nouvelId } from '../../src/lib/editeur-io';
import { fiche } from '../../src/lib/fiches';

const carre: Point[] = [
  [10, 10],
  [30, 10],
  [30, 30],
  [10, 30],
];
const enL: Point[] = [
  [0, 0],
  [50, 0],
  [50, 20],
  [20, 20],
  [20, 60],
  [0, 60],
];

describe('point dans le polygone', () => {
  it('reconnaît l’intérieur et l’extérieur', () => {
    expect(pointDansPolygone([20, 20], carre)).toBe(true);
    expect(pointDansPolygone([5, 20], carre)).toBe(false);
    expect(pointDansPolygone([31, 31], carre)).toBe(false);
  });
  it('compte le bord comme dedans', () => {
    expect(pointDansPolygone([10, 20], carre)).toBe(true);
    expect(pointDansPolygone([30, 30], carre)).toBe(true);
  });
  it('gère un polygone concave', () => {
    expect(pointDansPolygone([10, 50], enL)).toBe(true);
    expect(pointDansPolygone([40, 50], enL)).toBe(false); // dans le « creux » du L
  });
  it('refuse un polygone de moins de 3 points', () => {
    expect(pointDansPolygone([0, 0], [[0, 0], [1, 1]] as Point[])).toBe(false);
  });
});

describe('conversion des coordonnées', () => {
  const base: Rect = { left: 16, top: 120, width: 343, height: 257.25 }; // photo 4:3 sur un écran de 375 px

  it('donne le même point relatif quelle que soit la taille d’écran', () => {
    const petit: Rect = { left: 0, top: 0, width: 360, height: 270 };
    const grand: Rect = { left: 200, top: 50, width: 1200, height: 900 };
    const p: Point = [62.5, 40];
    for (const r of [base, petit, grand]) {
      const [cx, cy] = relatifVersEcran(p, r);
      const [x, y] = ecranVersRelatif(cx, cy, r);
      expect(x).toBeCloseTo(62.5, 9);
      expect(y).toBeCloseTo(40, 9);
    }
  });

  it('reste exact après zoom et déplacement', () => {
    const t = zoomerAutour({ s: 1, tx: 0, ty: 0 }, 3, 100, 80, base.width, base.height);
    const rect = rectTransforme(base, t);
    const cible: Point = [37.25, 61.8];
    const [cx, cy] = relatifVersEcran(cible, rect);
    const [x, y] = ecranVersRelatif(cx, cy, rect);
    expect(x).toBeCloseTo(cible[0], 9);
    expect(y).toBeCloseTo(cible[1], 9);
  });

  it('garde fixe le point sous les doigts pendant le zoom', () => {
    const t0 = { s: 1.5, tx: -40, ty: -20 };
    const cx = 120;
    const cy = 90;
    const avant = ecranVersRelatif(base.left + cx, base.top + cy, rectTransforme(base, t0));
    const t1 = zoomerAutour(t0, 2, cx, cy, base.width, base.height);
    const apres = ecranVersRelatif(base.left + cx, base.top + cy, rectTransforme(base, t1));
    expect(apres[0]).toBeCloseTo(avant[0], 6);
    expect(apres[1]).toBeCloseTo(avant[1], 6);
  });

  it('borne le zoom et empêche l’image de sortir du cadre', () => {
    expect(borner({ s: 0.5, tx: 30, ty: 30 }, 300, 200)).toEqual({ s: 1, tx: 0, ty: 0 });
    const b = borner({ s: 2, tx: -1000, ty: 50 }, 300, 200);
    expect(b).toEqual({ s: 2, tx: -300, ty: 0 });
    expect(borner({ s: 50, tx: 0, ty: 0 }, 300, 200).s).toBe(6);
  });
});

// ── Repli automatique en mode classique ────────────────────────────────────
const manifeste: Manifeste = {
  clio5: {
    'clio5-moteur': { largeur: 4000, hauteur: 3000, largeurs: [800, 1400, 2400], formats: ['avif', 'webp'] },
    'clio5-frein': { largeur: 2000, hauteur: 1500, largeurs: [800, 1400], formats: ['webp'] },
  },
};
const donnees = (zones: DonneesVehicule['zones'], photos?: DonneesVehicule['photos']): DonneesVehicule => ({
  schema: 'verifs-permis/vehicule@1',
  vehicule: { id: 'clio5', nom: 'Clio 5', boite: 'manuelle' },
  photos: photos ?? [
    { fichier: 'clio5-moteur.jpg', alt: 'Moteur', role: 'vue-ensemble' },
    { fichier: 'clio5-frein.jpg', alt: 'Frein', role: 'gros-plan' },
    { fichier: 'clio5-absente.jpg', alt: 'Pas encore prise', role: 'vue-ensemble' },
  ],
  zones,
});
const zoneFrein = {
  id: 'liquide-frein',
  fiches: [8, 70],
  photo: 'clio5-moteur.jpg',
  polygone: carre,
  libelle: 'Bocal de liquide de frein',
  grosPlan: 'clio5-frein.jpg',
  statut: 'valide' as const,
};
const localisables = new Set([2, 8, 12, 70]);

describe('choix du mode d’exercice', () => {
  it('utilise « Trouve l’élément » quand tout est disponible', () => {
    const ex = exercicePour(fiche(8), 'clio5', donnees([zoneFrein]), manifeste, localisables, '/verifs-permis/');
    expect(ex.mode).toBe('zone');
    if (ex.mode !== 'zone') return;
    expect(ex.photo.src).toBe('/verifs-permis/photos/clio5/clio5-moteur-1400.webp');
    expect(ex.photo.srcset.avif).toContain('clio5-moteur-2400.avif 2400w');
    expect(ex.grosPlan?.srcset.avif).toBeNull();
    expect(ex.choix).toEqual([{ id: 'liquide-frein', libelle: 'Bocal de liquide de frein' }]);
  });

  it('sert aussi la fiche jumelle (70)', () => {
    expect(exercicePour(fiche(70), 'clio5', donnees([zoneFrein]), manifeste, localisables).mode).toBe('zone');
  });

  it.each([
    ['vérification intérieure', 1, 'clio5', [zoneFrein], 'interieure'],
    ['« Je ne sais pas encore »', 8, 'inconnue', [zoneFrein], 'voiture-inconnue'],
    ['aucune voiture choisie', 8, null, [zoneFrein], 'voiture-inconnue'],
    ['fiche non localisable', 4, 'clio5', [zoneFrein], 'pas-localisable'],
    ['aucune zone', 8, 'clio5', [], 'pas-de-zone'],
    ['zone en brouillon', 8, 'clio5', [{ ...zoneFrein, statut: 'brouillon' as const }], 'pas-de-zone'],
    ['photo pas encore construite', 8, 'clio5', [{ ...zoneFrein, photo: 'clio5-absente.jpg' }], 'pas-de-photo'],
  ])('repasse en classique : %s', (_cas, numero, choix, zones, raison) => {
    const ex = exercicePour(fiche(numero as number), choix as any, donnees(zones as any), manifeste, localisables);
    expect(ex).toEqual({ mode: 'classique', raison });
  });

  it('repasse en classique si la voiture n’a aucune donnée', () => {
    expect(exercicePour(fiche(8), 'yaris', undefined, manifeste, localisables)).toEqual({ mode: 'classique', raison: 'voiture-inconnue' });
  });

  it('ne casse pas si le gros plan manque', () => {
    const ex = exercicePour(fiche(8), 'clio5', donnees([{ ...zoneFrein, grosPlan: 'clio5-absente.jpg' }]), manifeste, localisables);
    expect(ex.mode).toBe('zone');
    if (ex.mode === 'zone') expect(ex.grosPlan).toBeNull();
  });

  it('n’envoie jamais de brouillon au navigateur', () => {
    const pub = donneesPubliques(donnees([zoneFrein, { ...zoneFrein, id: 'b', statut: 'brouillon' }]), manifeste);
    expect(pub.zones.map((z) => z.id)).toEqual(['liquide-frein']);
    expect(pub.photos.map((p) => p.fichier)).toEqual(['clio5-moteur.jpg', 'clio5-frein.jpg']);
  });
});

describe('éditeur : import / export', () => {
  it('fait un aller-retour sans perte', () => {
    const d = donnees([
      zoneFrein,
      { ...zoneFrein, id: 'batterie', fiches: [24], polygone: [[40.123456, 50], [60, 50.987654], [55, 70]], statut: 'brouillon', grosPlan: null },
    ]);
    const texte = exporterVehicule(d);
    const v = importerVehicule(texte);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(exporterVehicule(v.donnees)).toBe(texte);
    expect(v.donnees.zones[1].polygone[0]).toEqual([40.12, 50]);
  });

  it('écrit chaque polygone sur une ligne', () => {
    expect(exporterVehicule(donnees([zoneFrein]))).toContain('"polygone": [[10,10], [30,10], [30,30], [10,30]]');
  });

  it('refuse un fichier incohérent avec des messages clairs', () => {
    const v = importerVehicule(JSON.stringify(donnees([{ ...zoneFrein, photo: 'inconnue.jpg', polygone: [[0, 0]], statut: 'ok' as any }])));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.join('\n')).toMatch(/photo « inconnue.jpg »[\s\S]*3 points[\s\S]*statut/);
    expect(importerVehicule('{pas du json').ok).toBe(false);
  });

  it('génère des identifiants lisibles et uniques', () => {
    expect(nouvelId('Bocal de liquide de frein', [])).toBe('bocal-de-liquide-de-frein');
    expect(nouvelId('Batterie', ['batterie', 'batterie-2'])).toBe('batterie-3');
  });
});

describe('repères propres à la voiture', () => {
  const avecReperes = (reperes: unknown) => ({ ...donnees([zoneFrein]), reperes }) as DonneesVehicule;

  it('sont conservés par l’aller-retour de l’éditeur', () => {
    const d = avecReperes([{ fiches: [65, 1], texte: ' Bouton à gauche du volant. ', source: 'Notice' }]);
    const v = importerVehicule(exporterVehicule(d));
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.donnees.reperes).toEqual([{ fiches: [1, 65], texte: 'Bouton à gauche du volant.', source: 'Notice' }]);
  });

  it('sont refusés s’ils sont incomplets', () => {
    const v = importerVehicule(JSON.stringify(avecReperes([{ fiches: [0], texte: '', source: '' }])));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.join(' ')).toMatch(/Repère 1 : « fiches »[\s\S]*texte manquant[\s\S]*source manquante/);
  });

  it('sont envoyés au navigateur et retrouvés par fiche', () => {
    const pub = donneesPubliques(avecReperes([{ fiches: [3, 67], texte: 'Manette au bas du rétroviseur.', source: 'Notice' }]), manifeste);
    expect(repereDe(pub, 67)?.texte).toBe('Manette au bas du rétroviseur.');
    expect(repereDe(pub, 5)).toBeUndefined();
    expect(repereDe(undefined, 3)).toBeUndefined();
  });
});
