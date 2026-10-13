// Modèle des voitures, photos et zones + choix du mode d'exercice.
// Règle d'or : si quoi que ce soit manque (voiture, photo, zone validée),
// la fiche repasse en mode classique, sans jamais casser.
import type { Fiche } from './fiches';
import type { Point } from './geometrie';

export type IdVoiture = 'clio5' | 'yaris';
export type ChoixVoiture = IdVoiture | 'inconnue';
export type RolePhoto = 'vue-ensemble' | 'gros-plan';
export type StatutZone = 'brouillon' | 'valide';

export interface PhotoVehicule {
  /** Nom du fichier d'origine dans photos-source/<voiture>/ (sert d'identifiant). */
  fichier: string;
  alt: string;
  role: RolePhoto;
}

export interface Zone {
  id: string;
  /** Fiches concernées : une même zone sert aux fiches jumelles (ex. 8 et 70). */
  fiches: number[];
  /** Photo sur laquelle l'élève cherche (champ `fichier` d'une photo). */
  photo: string;
  /** Polygone en pourcentages de l'image (0–100). */
  polygone: Point[];
  libelle: string;
  grosPlan: string | null;
  statut: StatutZone;
}

/**
 * Repère propre à la voiture pour une vérification (« la manette est au bas du
 * rétroviseur »). Il complète la fiche officielle sans jamais la modifier.
 */
export interface Repere {
  fiches: number[];
  texte: string;
  /** D'où vient l'information (notice constructeur, moniteur…). */
  source: string;
}

export interface DonneesVehicule {
  schema: 'verifs-permis/vehicule@1';
  vehicule: { id: IdVoiture; nom: string; boite: 'manuelle' | 'automatique' };
  photos: PhotoVehicule[];
  zones: Zone[];
  reperes?: Repere[];
}

/** Repère de la voiture pour une fiche, s'il existe. */
export function repereDe(donnees: DonneesVehicule | undefined, fiche: number): Repere | undefined {
  return donnees?.reperes?.find((r) => r.fiches.includes(fiche));
}

/** Vrai si le point (en %) touche une des bonnes zones de l'exercice. */
export function bonneReponse(point: Point, zones: Zone[], pointDans: (p: Point, poly: Point[]) => boolean): boolean {
  return zones.some((z) => pointDans(point, z.polygone));
}

/** Une photo telle que produite par scripts/build-images.mjs. */
export interface PhotoConstruite {
  largeur: number;
  hauteur: number;
  largeurs: number[];
  formats: Array<'avif' | 'webp'>;
}

/** voiture → nom de base du fichier (sans extension) → photo construite. */
export type Manifeste = Record<string, Record<string, PhotoConstruite>>;

export interface PhotoPublique {
  fichier: string;
  alt: string;
  role: RolePhoto;
  largeur: number;
  hauteur: number;
  /** URL de repli (WebP de largeur moyenne). */
  src: string;
  srcset: { webp: string; avif: string | null };
}

export interface ChoixZone {
  id: string;
  libelle: string;
}

export type RaisonClassique = 'voiture-inconnue' | 'pas-localisable' | 'pas-de-zone' | 'pas-de-photo';

export type Exercice =
  | {
      mode: 'zone';
      zone: Zone;
      /** Toutes les zones validées de la même photo qui répondent à la fiche (ex. phare gauche ET droit). */
      zonesBonnes: Zone[];
      photo: PhotoPublique;
      grosPlan: PhotoPublique | null;
      choix: ChoixZone[];
    }
  | { mode: 'classique'; raison: RaisonClassique };

export const VOITURES: Record<IdVoiture, { nom: string; boite: string }> = {
  clio5: { nom: 'Clio 5', boite: 'Boîte manuelle' },
  yaris: { nom: 'Yaris', boite: 'Boîte automatique' },
};

export function nomDeBase(fichier: string): string {
  return fichier.replace(/\.[a-z0-9]+$/i, '');
}

export function photoConstruite(voiture: string, fichier: string, manifeste: Manifeste): PhotoConstruite | undefined {
  return manifeste[voiture]?.[nomDeBase(fichier)];
}

export function urlPhoto(base: string, voiture: string, fichier: string, largeur: number, format: 'webp' | 'avif'): string {
  return `${base.replace(/\/?$/, '/')}photos/${voiture}/${nomDeBase(fichier)}-${largeur}.${format}`;
}

export function photoPublique(base: string, voiture: string, photo: PhotoVehicule, construite: PhotoConstruite): PhotoPublique {
  const ensemble = (format: 'webp' | 'avif') =>
    construite.largeurs.map((l) => `${urlPhoto(base, voiture, photo.fichier, l, format)} ${l}w`).join(', ');
  const moyenne = construite.largeurs[Math.min(1, construite.largeurs.length - 1)];
  return {
    fichier: photo.fichier,
    alt: photo.alt,
    role: photo.role,
    largeur: construite.largeur,
    hauteur: construite.hauteur,
    src: urlPhoto(base, voiture, photo.fichier, moyenne, 'webp'),
    srcset: { webp: ensemble('webp'), avif: construite.formats.includes('avif') ? ensemble('avif') : null },
  };
}

/** Zones exploitables par le site : statut « valide » ET photo réellement construite. */
export function zonesUtilisables(donnees: DonneesVehicule, manifeste: Manifeste): Zone[] {
  const id = donnees.vehicule.id;
  const photos = new Set(donnees.photos.map((p) => p.fichier));
  return donnees.zones.filter((z) => z.statut === 'valide' && photos.has(z.photo) && photoConstruite(id, z.photo, manifeste));
}

/**
 * Données envoyées au navigateur : sans brouillons ni photos absentes,
 * pour qu'un brouillon ne puisse jamais apparaître en ligne.
 */
export function donneesPubliques(donnees: DonneesVehicule, manifeste: Manifeste): DonneesVehicule {
  const id = donnees.vehicule.id;
  return {
    ...donnees,
    photos: donnees.photos.filter((p) => photoConstruite(id, p.fichier, manifeste)),
    zones: zonesUtilisables(donnees, manifeste),
  };
}

export function exercicePour(
  fiche: Fiche,
  choix: ChoixVoiture | null,
  donnees: DonneesVehicule | undefined,
  manifeste: Manifeste,
  localisables: ReadonlySet<number>,
  base = '/',
): Exercice {
  if (!choix || choix === 'inconnue' || !donnees) return { mode: 'classique', raison: 'voiture-inconnue' };
  if (!localisables.has(fiche.numero)) return { mode: 'classique', raison: 'pas-localisable' };

  const voiture = donnees.vehicule.id;
  const validees = donnees.zones.filter((z) => z.statut === 'valide' && z.fiches.includes(fiche.numero));
  if (validees.length === 0) return { mode: 'classique', raison: 'pas-de-zone' };

  const parFichier = new Map(donnees.photos.map((p) => [p.fichier, p]));
  for (const zone of validees) {
    const photo = parFichier.get(zone.photo);
    const construite = photo && photoConstruite(voiture, photo.fichier, manifeste);
    if (!photo || !construite) continue;

    const gp = zone.grosPlan ? parFichier.get(zone.grosPlan) : undefined;
    const gpConstruite = gp && photoConstruite(voiture, gp.fichier, manifeste);

    const memesPhoto = zonesUtilisables(donnees, manifeste).filter((z) => z.photo === zone.photo);
    const vus = new Set<string>();
    const choix = memesPhoto
      .filter((z) => (vus.has(z.libelle) ? false : (vus.add(z.libelle), true)))
      .map((z) => ({ id: z.id, libelle: z.libelle }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));

    return {
      mode: 'zone',
      zone,
      zonesBonnes: memesPhoto.filter((z) => z.fiches.includes(fiche.numero)),
      photo: photoPublique(base, voiture, photo, construite),
      grosPlan: gp && gpConstruite ? photoPublique(base, voiture, gp, gpConstruite) : null,
      choix,
    };
  }
  return { mode: 'classique', raison: 'pas-de-photo' };
}
