// QCU : 3 choix, 1 bonne réponse. Les mauvaises réponses sont TOUJOURS des
// réponses officielles d'autres fiches (aucun texte inventé), choisies pour ne
// pas être correctes elles aussi : on écarte les fiches qui posent la même
// question et les réponses identiques ou presque identiques à la bonne.
import type { Fiche, Partie } from './fiches';
import { normaliser } from './recherche';
import { melanger } from './score';

export interface Pictogramme {
  fiche: number;
  fichier: string;
  alt: string;
}

export interface ChoixQcu {
  /** Numéro de la fiche d'où vient la réponse. */
  fiche: number;
  texte?: string;
  image?: Pictogramme;
  correct: boolean;
}

const mots = (t: string) => new Set(normaliser(t).split(' ').filter((m) => m.length > 2));

/** Similarité de Jaccard sur les mots (0 = rien en commun, 1 = mêmes mots). */
export function similarite(a: string, b: string): number {
  const A = mots(a);
  const B = mots(b);
  if (!A.size && !B.size) return 1;
  let commun = 0;
  for (const m of A) if (B.has(m)) commun++;
  return commun / (A.size + B.size - commun);
}

export const SEUIL_SIMILARITE = 0.5;

/** Trois premiers mots de la question, normalisés : « quel est le », « pourquoi doit on »… */
export function debutQuestion(q: string): string[] {
  return normaliser(q).split(' ').slice(0, 3);
}

function motsCommunsAuDebut(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

function distracteursTexte(fiche: Fiche, partie: Partie, fiches: Fiche[], aleatoire: () => number): ChoixQcu[] {
  const bonne = fiche[partie].reponse;
  const question = normaliser(fiche[partie].question);
  const vus = new Set<string>([normaliser(bonne)]);
  const candidats: ChoixQcu[] = [];
  for (const g of melanger(fiches, aleatoire)) {
    const texte = g[partie].reponse;
    const cle = normaliser(texte);
    if (g.numero === fiche.numero || !texte.trim() || vus.has(cle)) continue;
    if (normaliser(g[partie].question) === question) continue; // même question : sa réponse serait juste aussi
    if (similarite(texte, bonne) >= SEUIL_SIMILARITE) continue;
    vus.add(cle);
    candidats.push({ fiche: g.numero, texte, correct: false });
  }
  // Longueur comparable, pour que la bonne réponse ne se repère pas à sa taille.
  const proches = candidats.filter((c) => {
    const r = c.texte!.length / Math.max(1, bonne.length);
    return r >= 0.5 && r <= 2;
  });
  // Plus crédibles : réponses à des questions de même forme (« Quel est le risque… »,
  // « Pourquoi… », « Comment… »). Tri stable : l'ordre aléatoire départage les ex æquo.
  const forme = debutQuestion(fiche[partie].question);
  const parForme = (c: ChoixQcu) => motsCommunsAuDebut(forme, debutQuestion(fiches[c.fiche - 1][partie].question));
  return [...(proches.length >= 2 ? proches : candidats)].sort((a, b) => parForme(b) - parForme(a)).slice(0, 2);
}

function distracteursImage(picto: Pictogramme, pictos: Pictogramme[], aleatoire: () => number): ChoixQcu[] {
  const vus = new Set([picto.alt, picto.fichier]);
  const sortie: ChoixQcu[] = [];
  for (const p of melanger(pictos, aleatoire)) {
    if (vus.has(p.alt) || vus.has(p.fichier)) continue;
    vus.add(p.alt);
    vus.add(p.fichier);
    sortie.push({ fiche: p.fiche, image: p, correct: false });
    if (sortie.length === 2) break;
  }
  return sortie;
}

/**
 * Les 3 choix mélangés, ou null si le QCU n'a pas de sens pour cette question
 * (vérification sans pictogramme, réponse vide, pas assez de distracteurs).
 */
export function choixQcu(
  fiche: Fiche,
  partie: Partie,
  fiches: Fiche[],
  pictos: Pictogramme[],
  aleatoire: () => number = Math.random,
): ChoixQcu[] | null {
  if (partie === 'verification') {
    const picto = pictos.find((p) => p.fiche === fiche.numero);
    if (!picto) return null;
    const autres = distracteursImage(picto, pictos, aleatoire);
    if (autres.length < 2) return null;
    return melanger([{ fiche: fiche.numero, image: picto, correct: true }, ...autres], aleatoire);
  }
  const bonne = fiche[partie].reponse;
  if (!bonne.trim()) return null;
  const autres = distracteursTexte(fiche, partie, fiches, aleatoire);
  if (autres.length < 2) return null;
  return melanger([{ fiche: fiche.numero, texte: bonne, correct: true }, ...autres], aleatoire);
}
