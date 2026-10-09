// Import / export des fichiers voiture pour l'éditeur de zones.
// L'export est canonique (ordre des clés fixe, coordonnées arrondies) pour que
// les diffs Git restent lisibles et qu'un aller-retour soit sans perte.
import type { DonneesVehicule, PhotoVehicule, Zone } from './vehicules';
import type { Point } from './geometrie';

export type Validation = { ok: true; donnees: DonneesVehicule } | { ok: false; erreurs: string[] };

const ROLES = ['vue-ensemble', 'gros-plan'];
const STATUTS = ['brouillon', 'valide'];
const IDS = ['clio5', 'yaris'];

const arrondir = (n: number) => Math.round(n * 100) / 100;

export function validerVehicule(objet: unknown): Validation {
  const erreurs: string[] = [];
  const o = objet as Partial<DonneesVehicule> | null;
  if (!o || typeof o !== 'object') return { ok: false, erreurs: ['Le fichier ne contient pas un objet JSON.'] };
  if (o.schema !== 'verifs-permis/vehicule@1') erreurs.push('« schema » doit valoir « verifs-permis/vehicule@1 ».');
  if (!o.vehicule || !IDS.includes(o.vehicule.id)) erreurs.push('« vehicule.id » doit être « clio5 » ou « yaris ».');
  if (!Array.isArray(o.photos)) erreurs.push('« photos » doit être une liste.');
  if (!Array.isArray(o.zones)) erreurs.push('« zones » doit être une liste.');
  if (erreurs.length) return { ok: false, erreurs };

  const fichiers = new Set<string>();
  o.photos!.forEach((p: PhotoVehicule, i) => {
    if (!p?.fichier) erreurs.push(`Photo ${i + 1} : « fichier » manquant.`);
    else if (fichiers.has(p.fichier)) erreurs.push(`Photo « ${p.fichier} » en double.`);
    else fichiers.add(p.fichier);
    if (!p?.alt?.trim()) erreurs.push(`Photo ${p?.fichier ?? i + 1} : texte alternatif manquant.`);
    if (!ROLES.includes(p?.role)) erreurs.push(`Photo ${p?.fichier ?? i + 1} : rôle invalide.`);
  });

  const ids = new Set<string>();
  o.zones!.forEach((z: Zone, i) => {
    const nom = z?.id ? `Zone « ${z.id} »` : `Zone ${i + 1}`;
    if (!z?.id) erreurs.push(`${nom} : « id » manquant.`);
    else if (ids.has(z.id)) erreurs.push(`${nom} : identifiant en double.`);
    else ids.add(z.id);
    if (!Array.isArray(z?.fiches) || z.fiches.length === 0 || !z.fiches.every((n) => Number.isInteger(n) && n >= 1 && n <= 100))
      erreurs.push(`${nom} : « fiches » doit lister des numéros de 1 à 100.`);
    if (!fichiers.has(z?.photo)) erreurs.push(`${nom} : photo « ${z?.photo} » inconnue.`);
    if (z?.grosPlan != null && !fichiers.has(z.grosPlan)) erreurs.push(`${nom} : gros plan « ${z.grosPlan} » inconnu.`);
    if (!Array.isArray(z?.polygone) || z.polygone.length < 3) erreurs.push(`${nom} : il faut au moins 3 points.`);
    else if (!z.polygone.every((p) => Array.isArray(p) && p.length === 2 && p.every((c) => typeof c === 'number' && c >= 0 && c <= 100)))
      erreurs.push(`${nom} : coordonnées hors de 0–100 %.`);
    if (!z?.libelle?.trim()) erreurs.push(`${nom} : libellé manquant.`);
    if (!STATUTS.includes(z?.statut)) erreurs.push(`${nom} : statut « brouillon » ou « valide » attendu.`);
  });

  return erreurs.length ? { ok: false, erreurs } : { ok: true, donnees: normaliser(o as DonneesVehicule) };
}

/** Forme canonique (ordre des clés, arrondi au centième de %). */
export function normaliser(d: DonneesVehicule): DonneesVehicule {
  return {
    schema: 'verifs-permis/vehicule@1',
    vehicule: { id: d.vehicule.id, nom: d.vehicule.nom, boite: d.vehicule.boite },
    photos: d.photos.map((p) => ({ fichier: p.fichier, alt: p.alt, role: p.role })),
    zones: d.zones.map((z) => ({
      id: z.id,
      fiches: [...z.fiches].sort((a, b) => a - b),
      photo: z.photo,
      polygone: z.polygone.map(([x, y]) => [arrondir(x), arrondir(y)] as Point),
      libelle: z.libelle.trim(),
      grosPlan: z.grosPlan ?? null,
      statut: z.statut,
    })),
  };
}

export function exporterVehicule(d: DonneesVehicule): string {
  // Une zone par bloc, un polygone sur une ligne : diffs Git lisibles.
  const n = normaliser(d);
  const polygones = n.zones.map((z) => '[' + z.polygone.map(([x, y]) => `[${x},${y}]`).join(', ') + ']');
  const avecMarques = { ...n, zones: n.zones.map((z, i) => ({ ...z, polygone: `@@polygone-${i}@@` })) };
  return JSON.stringify(avecMarques, null, 2).replace(/"@@polygone-(\d+)@@"/g, (_m, i: string) => polygones[Number(i)]) + '\n';
}

export function importerVehicule(texte: string): Validation {
  let objet: unknown;
  try {
    objet = JSON.parse(texte);
  } catch (e) {
    return { ok: false, erreurs: [`JSON illisible : ${(e as Error).message}`] };
  }
  return validerVehicule(objet);
}

/** Identifiant lisible et unique pour une nouvelle zone. */
export function nouvelId(libelle: string, existants: Iterable<string>): string {
  const racine =
    libelle
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'zone';
  const pris = new Set(existants);
  if (!pris.has(racine)) return racine;
  let i = 2;
  while (pris.has(`${racine}-${i}`)) i++;
  return `${racine}-${i}`;
}
