import type { Partie } from './fiches';

export interface Item {
  fiche: number;
  partie: Partie;
}

export interface Resultat extends Item {
  ok: boolean;
  /** « auto » : l'élève s'est évalué ; « zone » : mode Trouve l'élément. */
  mode: 'auto' | 'zone';
}

export interface Bilan {
  points: number;
  total: number;
  aRevoir: Item[];
}

/** Score d'une série d'entraînement : 1 point par question réussie. */
export function bilanSerie(resultats: Resultat[], totalPrevu = resultats.length): Bilan {
  return {
    points: resultats.filter((r) => r.ok).length,
    total: totalPrevu,
    aRevoir: resultats.filter((r) => !r.ok).map(({ fiche, partie }) => ({ fiche, partie })),
  };
}

/** Examen blanc : 3 questions, 1 point chacune, rien d'éliminatoire. */
export function bilanExamen(resultats: Resultat[]): Bilan {
  if (resultats.length !== 3) throw new RangeError("Un examen blanc compte exactement 3 questions");
  return bilanSerie(resultats, 3);
}

export function messageExamen(points: number): string {
  switch (points) {
    case 3:
      return 'Sans faute ! Tu prends les 3 points. Continue comme ça.';
    case 2:
      return 'Très bien : 2 points sur 3. Revois la question manquée et c’est parfait.';
    case 1:
      return '1 point sur 3. Rien d’éliminatoire, mais ces points comptent : révise cette fiche.';
    default:
      return '0 point cette fois. Pas de panique : revois les réponses ci-dessous et retente.';
  }
}

export function messageSerie(points: number, total: number): string {
  if (total === 0) return '';
  const taux = points / total;
  if (taux === 1) return 'Parfait, tu maîtrises toute la série !';
  if (taux >= 0.8) return 'Très bon score. Encore un petit effort sur les questions à revoir.';
  if (taux >= 0.5) return 'Bonne base. Reprends les questions à revoir pour progresser.';
  return 'C’est en s’entraînant qu’on progresse : recommence les questions à revoir.';
}

/** Mélange de Fisher-Yates (générateur injectable pour les tests). */
export function melanger<T>(liste: T[], aleatoire: () => number = Math.random): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}
