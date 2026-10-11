// Choix de la voiture (stockage local). La progression de l'élève a sa
// propre clé, voir progression.ts.
import type { ChoixVoiture } from './vehicules';

const CLE = 'verifs-permis:v1';
const CLE_SESSION = 'verifs-permis:session:';

export interface EtatLocal {
  version: 1;
  voiture: ChoixVoiture | null;
}

const VIDE: EtatLocal = { version: 1, voiture: null };
const CHOIX_VALIDES: ReadonlyArray<ChoixVoiture> = ['clio5', 'yaris', 'inconnue'];

export function lireEtat(stockage: Storage | undefined = globalThis.localStorage): EtatLocal {
  try {
    const brut = stockage?.getItem(CLE);
    if (!brut) return { ...VIDE };
    const etat = JSON.parse(brut) as Partial<EtatLocal>;
    const voiture = CHOIX_VALIDES.includes(etat.voiture as ChoixVoiture) ? (etat.voiture as ChoixVoiture) : null;
    return { version: 1, voiture };
  } catch {
    return { ...VIDE };
  }
}

export function lireVoiture(stockage?: Storage): ChoixVoiture | null {
  return lireEtat(stockage).voiture;
}

export function ecrireVoiture(choix: ChoixVoiture, stockage: Storage | undefined = globalThis.localStorage): void {
  try {
    stockage?.setItem(CLE, JSON.stringify({ ...lireEtat(stockage), voiture: choix }));
  } catch {
    /* navigation privée ou stockage plein : le site reste utilisable */
  }
}

/** Série en cours : mémoire de session uniquement (perdue à la fermeture de l'onglet). */
export function lireSession<T>(nom: string): T | null {
  try {
    const brut = globalThis.sessionStorage?.getItem(CLE_SESSION + nom);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function ecrireSession(nom: string, valeur: unknown): void {
  try {
    globalThis.sessionStorage?.setItem(CLE_SESSION + nom, JSON.stringify(valeur));
  } catch {
    /* ignoré */
  }
}

export function effacerSession(nom: string): void {
  try {
    globalThis.sessionStorage?.removeItem(CLE_SESSION + nom);
  } catch {
    /* ignoré */
  }
}
