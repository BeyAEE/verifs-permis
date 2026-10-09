// Contenu d'une réponse (classique ou après « Trouve l'élément »).
import type { Fiche, Partie } from '../lib/fiches';
import { icone } from '../lib/icones';
import { echapper } from './commun';

export const SANS_REPONSE = 'Pas de réponse écrite pour cette vérification : il faut la faire ou la montrer sur la voiture.';
export const RAPPEL_MONITEUR = 'Sur la voiture de l’auto-école, demande à ton moniteur de te montrer.';

export function htmlReponse(fiche: Fiche, partie: Partie, rappel: boolean): string {
  const texte = fiche[partie].reponse;
  const corps = texte.trim()
    ? `<p class="reponse-texte">${echapper(texte)}</p>`
    : `<p class="reponse-texte reponse-absente">${SANS_REPONSE}</p>`;
  const note = partie === 'verification' && rappel ? `<p class="rappel">${icone('info')}<span>${RAPPEL_MONITEUR}</span></p>` : '';
  return corps + note;
}
