import donnees from '../data/fiches.json';

export type TypeVerification = 'interieure' | 'exterieure';
export type Partie = 'verification' | 'securite' | 'secours';

export interface QuestionReponse {
  question: string;
  reponse: string;
}

export interface Fiche {
  numero: number;
  type: TypeVerification;
  verification: QuestionReponse;
  securite: QuestionReponse;
  secours: QuestionReponse;
}

export const FICHES: Fiche[] = donnees.fiches as Fiche[];
export const PARTIES: Partie[] = ['verification', 'securite', 'secours'];

export function fiche(numero: number): Fiche {
  const f = FICHES[numero - 1];
  if (!f || f.numero !== numero) throw new RangeError(`Fiche ${numero} introuvable`);
  return f;
}

export function libellePartie(partie: Partie, type: TypeVerification): string {
  if (partie === 'verification') return type === 'interieure' ? 'Vérification intérieure' : 'Vérification extérieure';
  return partie === 'securite' ? 'Sécurité routière' : 'Premiers secours';
}

export function libelleType(type: TypeVerification): string {
  return type === 'interieure' ? 'Intérieure' : 'Extérieure';
}

/** Fiche précédente / suivante, en boucle (1 ↔ 100). */
export function voisines(numero: number): { precedente: number; suivante: number } {
  return { precedente: numero === 1 ? 100 : numero - 1, suivante: numero === 100 ? 1 : numero + 1 };
}
