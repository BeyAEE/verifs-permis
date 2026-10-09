// Contenu d'une réponse (classique ou après « Trouve l'élément »).
import type { Fiche, Partie } from '../lib/fiches';
import type { Pictogramme } from '../lib/qcu';
import { icone } from '../lib/icones';
import donneesPictos from '../data/pictogrammes.json';
import donneesNotes from '../data/notes.json';
import { echapper } from './commun';

export const SANS_REPONSE = 'Pas de réponse écrite pour cette vérification : il faut la faire ou la montrer sur la voiture.';
export const RAPPEL_MONITEUR = 'Sur la voiture de l’auto-école, demande à ton moniteur de te montrer.';
export const PICTOGRAMMES: Pictogramme[] = donneesPictos.pictogrammes;

const BASE_PICTOS = import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'pictogrammes/';

export function urlPictogramme(p: Pictogramme): string {
  return BASE_PICTOS + p.fichier;
}

/** Pictogramme officiel de la réponse (voyant, commande), s'il y en a un. */
export function pictogrammeDe(fiche: number): Pictogramme | undefined {
  return PICTOGRAMMES.find((p) => p.fiche === fiche);
}

export function htmlPictogramme(p: Pictogramme): string {
  return `<figure class="pictogramme">
    <img src="${urlPictogramme(p)}" alt="${echapper(p.alt)}" loading="lazy" decoding="async">
    <figcaption>Pictogramme de la fiche officielle</figcaption>
  </figure>`;
}

/** « Bon à savoir » : information complémentaire, la même pour tous les élèves. */
export function noteDe(fiche: number): string | undefined {
  return donneesNotes.notes.find((n) => n.fiches.includes(fiche))?.texte;
}

/** Repère propre à la voiture choisie, affiché à la place du rappel générique. */
export interface RepereAffiche {
  texte: string;
  nomVoiture: string;
}

export function htmlRepere(r: RepereAffiche): string {
  return `<p class="repere">${icone('voiture')}<span><strong>Sur ta ${echapper(r.nomVoiture)} :</strong> ${echapper(r.texte)}</span></p>`;
}

export function htmlReponse(fiche: Fiche, partie: Partie, rappel: boolean, repere?: RepereAffiche): string {
  const texte = fiche[partie].reponse;
  const picto = partie === 'verification' ? pictogrammeDe(fiche.numero) : undefined;
  let corps = '';
  if (picto) corps += htmlPictogramme(picto);
  if (texte.trim()) corps += `<p class="reponse-texte">${echapper(texte)}</p>`;
  else if (!picto) corps += `<p class="reponse-texte reponse-absente">${SANS_REPONSE}</p>`;
  const bonASavoir = partie === 'verification' ? noteDe(fiche.numero) : undefined;
  if (bonASavoir) corps += `<p class="bon-a-savoir">${icone('info')}<span><strong>Bon à savoir :</strong> ${echapper(bonASavoir)}</span></p>`;
  const note =
    partie !== 'verification' || !rappel ? '' : repere ? htmlRepere(repere) : `<p class="rappel">${icone('info')}<span>${RAPPEL_MONITEUR}</span></p>`;
  return corps + note;
}
