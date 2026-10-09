import type { Fiche, TypeVerification } from './fiches';

/** Minuscules, sans accents, apostrophes et espaces unifiés. */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}

/** Texte indexé d'une fiche : numéro + les 6 textes. */
export function texteIndexe(f: Fiche): string {
  return normaliser(
    [
      String(f.numero),
      f.verification.question,
      f.verification.reponse,
      f.securite.question,
      f.securite.reponse,
      f.secours.question,
      f.secours.reponse,
    ].join(' '),
  );
}

export type FiltreType = 'toutes' | TypeVerification;

/** Une fiche correspond si chaque mot de la requête est présent (ET logique). */
export function correspond(texte: string, requete: string): boolean {
  const mots = normaliser(requete).split(' ').filter(Boolean);
  return mots.every((m) => texte.includes(m));
}

export function filtrerFiches(fiches: Fiche[], requete: string, type: FiltreType = 'toutes'): number[] {
  return fiches
    .filter((f) => (type === 'toutes' || f.type === type) && correspond(texteIndexe(f), requete))
    .map((f) => f.numero);
}
