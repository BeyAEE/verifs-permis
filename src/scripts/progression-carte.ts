// Remplit la carte « Ta progression » (accueil et S'entraîner).
import { effacerProgression, lireProgression, resume, type Resume } from '../lib/progression';
import { annoncer } from './commun';

export const EVENEMENT_PROGRESSION = 'progression-modifiee';

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}

function detail(r: Resume): string {
  const morceaux: string[] = [];
  if (r.questionsARevoir) morceaux.push(`${pluriel(r.questionsARevoir, 'question')} à revoir`);
  if (r.jamaisVues) morceaux.push(`${pluriel(r.jamaisVues, 'fiche')} jamais ${r.jamaisVues > 1 ? 'vues' : 'vue'}`);
  if (!morceaux.length) return 'Bravo, tu maîtrises les 100 fiches !';
  return morceaux.join(' · ');
}

export function majCarteProgression(racine: ParentNode = document): Resume | null {
  const carte = racine.querySelector<HTMLElement>('[data-carte-progression]');
  if (!carte) return null;
  const r = resume(lireProgression());
  carte.hidden = r.repondues === 0;
  carte.querySelector('[data-maitrisees]')!.textContent = String(r.maitrisees);
  const barre = carte.querySelector<HTMLElement>('[data-barre-maitrise]')!;
  barre.setAttribute('aria-valuenow', String(r.maitrisees));
  barre.setAttribute('aria-valuetext', `${r.maitrisees} fiches maîtrisées sur 100`);
  (barre.firstElementChild as HTMLElement).style.width = `${r.maitrisees}%`;
  carte.querySelector('[data-detail-progression]')!.textContent = detail(r);
  const lien = carte.querySelector<HTMLElement>('[data-lien-points-faibles]');
  if (lien) {
    lien.hidden = r.questionsARevoir === 0;
    lien.querySelector('[data-libelle-points-faibles]')!.textContent = `Revoir mes points faibles (${r.questionsARevoir})`;
  }
  return r;
}

document.addEventListener('click', (e) => {
  const bouton = (e.target as HTMLElement).closest('[data-effacer-progression]');
  if (!bouton) return;
  if (!window.confirm('Effacer toute ta progression ? Les fiches maîtrisées et les points faibles seront remis à zéro sur cet appareil.')) return;
  effacerProgression();
  majCarteProgression();
  document.dispatchEvent(new CustomEvent(EVENEMENT_PROGRESSION));
  annoncer('Ta progression a été effacée.');
});

// Retour arrière (cache du navigateur) : la carte doit refléter la dernière série.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) majCarteProgression();
});
