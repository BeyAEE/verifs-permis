// Données côté build : voitures (réelles ou de test selon le build), photos
// construites et fiches localisables.
import clio5 from '@vehicules/clio5.json';
import yaris from '@vehicules/yaris.json';
import manifeste from '@manifeste-photos';
import localisables from '../data/localisables.json';
import { donneesPubliques, type DonneesVehicule, type Manifeste } from './vehicules';

export const NOM_SITE = 'Vérifs permis B';
export const ECOLE = 'ECF Albi';

export const VEHICULES = { clio5, yaris } as unknown as Record<'clio5' | 'yaris', DonneesVehicule>;
export const MANIFESTE = manifeste as Manifeste;
export const LOCALISABLES = new Set<number>(localisables.fiches.map((l) => l.numero));

/** Ce que le navigateur reçoit : jamais de brouillon ni de photo absente. */
export function donneesClient() {
  const vehicules = Object.fromEntries(Object.entries(VEHICULES).map(([id, d]) => [id, donneesPubliques(d, MANIFESTE)]));
  const manifesteFiltre: Manifeste = {};
  for (const [id, d] of Object.entries(vehicules)) {
    manifesteFiltre[id] = {};
    for (const p of d.photos) {
      const cle = p.fichier.replace(/\.[a-z0-9]+$/i, '');
      if (MANIFESTE[id]?.[cle]) manifesteFiltre[id][cle] = MANIFESTE[id][cle];
    }
  }
  return { vehicules, manifeste: manifesteFiltre, localisables: [...LOCALISABLES] };
}

export function url(chemin = ''): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + chemin.replace(/^\//, '');
}
