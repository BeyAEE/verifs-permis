// Progression de l'élève, gardée uniquement sur son appareil (stockage local).
// Pour chaque question (fiche × partie), on retient les 3 dernières réponses
// ('1' juste, '0' fausse, la plus récente à la fin). La dernière fait foi :
//   - question sue : dernière réponse juste ;
//   - fiche maîtrisée : ses 3 questions sues ;
//   - point faible : question dont la dernière réponse était fausse.
import { PARTIES, type Partie } from './fiches';
import { melanger, type Item } from './score';

export const CLE_PROGRESSION = 'verifs-permis:progression';
const MEMOIRE = 3;
const NB_FICHES = 100;
const CLE_VALIDE = /^(\d{1,3}):(verification|securite|secours)$/;
const HISTORIQUE_VALIDE = /^[01]{1,3}$/;

export interface Progression {
  version: 1;
  /** « 12:securite » → « 101 » */
  questions: Record<string, string>;
}

export type EtatQuestion = 'jamais' | 'sue' | 'a-revoir';
export type EtatFiche = 'jamais' | 'commencee' | 'maitrisee' | 'a-revoir';

export interface Resume {
  /** Questions déjà répondues au moins une fois (sur 300). */
  repondues: number;
  maitrisees: number;
  /** Fiches avec au moins une question ratée la dernière fois. */
  fichesARevoir: number;
  questionsARevoir: number;
  jamaisVues: number;
}

export function vide(): Progression {
  return { version: 1, questions: {} };
}

const cle = (fiche: number, partie: Partie) => `${fiche}:${partie}`;

/** Lit la progression ; ignore tout ce qui n'a pas la bonne forme. */
export function lireProgression(stockage: Storage | undefined = globalThis.localStorage): Progression {
  try {
    const brut = stockage?.getItem(CLE_PROGRESSION);
    if (!brut) return vide();
    const donnees = JSON.parse(brut) as Partial<Progression>;
    const questions: Record<string, string> = {};
    for (const [k, v] of Object.entries(donnees.questions ?? {})) {
      const m = CLE_VALIDE.exec(k);
      if (m && Number(m[1]) >= 1 && Number(m[1]) <= NB_FICHES && typeof v === 'string' && HISTORIQUE_VALIDE.test(v)) questions[k] = v;
    }
    return { version: 1, questions };
  } catch {
    return vide();
  }
}

export function ecrireProgression(p: Progression, stockage: Storage | undefined = globalThis.localStorage): void {
  try {
    stockage?.setItem(CLE_PROGRESSION, JSON.stringify(p));
  } catch {
    /* navigation privée ou stockage plein : le site reste utilisable */
  }
}

export function effacerProgression(stockage: Storage | undefined = globalThis.localStorage): void {
  try {
    stockage?.removeItem(CLE_PROGRESSION);
  } catch {
    /* ignoré */
  }
}

/** Ajoute une réponse à l'historique de la question (sans modifier `p`). */
export function noter(p: Progression, { fiche, partie }: Item, ok: boolean): Progression {
  const k = cle(fiche, partie);
  const historique = ((p.questions[k] ?? '') + (ok ? '1' : '0')).slice(-MEMOIRE);
  return { version: 1, questions: { ...p.questions, [k]: historique } };
}

/** Enregistre une réponse d'entraînement ou d'examen blanc. */
export function enregistrerReponse(item: Item, ok: boolean, stockage?: Storage): void {
  ecrireProgression(noter(lireProgression(stockage), item, ok), stockage);
}

export function etatQuestion(p: Progression, fiche: number, partie: Partie): EtatQuestion {
  const h = p.questions[cle(fiche, partie)];
  if (!h) return 'jamais';
  return h.endsWith('1') ? 'sue' : 'a-revoir';
}

export function etatFiche(p: Progression, fiche: number): EtatFiche {
  const etats = PARTIES.map((partie) => etatQuestion(p, fiche, partie));
  if (etats.includes('a-revoir')) return 'a-revoir';
  if (etats.every((e) => e === 'sue')) return 'maitrisee';
  if (etats.every((e) => e === 'jamais')) return 'jamais';
  return 'commencee';
}

export function resume(p: Progression): Resume {
  const r: Resume = { repondues: Object.keys(p.questions).length, maitrisees: 0, fichesARevoir: 0, questionsARevoir: 0, jamaisVues: 0 };
  for (let fiche = 1; fiche <= NB_FICHES; fiche++) {
    const etat = etatFiche(p, fiche);
    if (etat === 'maitrisee') r.maitrisees++;
    else if (etat === 'a-revoir') r.fichesARevoir++;
    else if (etat === 'jamais') r.jamaisVues++;
    for (const partie of PARTIES) if (etatQuestion(p, fiche, partie) === 'a-revoir') r.questionsARevoir++;
  }
  return r;
}

/** Série « Mes points faibles » : questions ratées la dernière fois, mélangées. */
export function pointsFaibles(p: Progression, max = 30, aleatoire: () => number = Math.random): Item[] {
  const items: Item[] = [];
  for (let fiche = 1; fiche <= NB_FICHES; fiche++) {
    for (const partie of PARTIES) if (etatQuestion(p, fiche, partie) === 'a-revoir') items.push({ fiche, partie });
  }
  return melanger(items, aleatoire).slice(0, max);
}
