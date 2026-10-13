// Une question d'entraînement ou d'examen blanc : réponse révélée puis
// auto-évaluation, ou « Trouve l'élément » quand une zone validée existe.
import { libellePartie, type Fiche, type Partie } from '../lib/fiches';
import { icone } from '../lib/icones';
import type { Resultat } from '../lib/score';
import type { Exercice } from '../lib/vehicules';
import { choixQcu, type ChoixQcu } from '../lib/qcu';
import { annoncer, defilement, echapper } from './commun';
import { PICTOGRAMMES, htmlReponse, urlPictogramme, type RepereAffiche } from './reponses';
import { trouverElement } from './trouve';

export interface OptionsQuestion {
  conteneur: HTMLElement;
  fiche: Fiche;
  partie: Partie;
  position: number;
  total: number;
  exercice: Exercice;
  nomVoiture: string;
  mode: 'entrainement' | 'examen';
  libelleSuite: string;
  surFin: (r: Resultat) => void;
  /** Entraînement en QCU : toutes les fiches, pour piocher les mauvaises réponses. */
  qcu?: { fiches: Fiche[] };
  /** Repère de la voiture choisie pour cette vérification (« la manette est… »). */
  repere?: RepereAffiche;
}

const ICONES: Record<Partie, (f: Fiche) => string> = {
  verification: (f) => (f.type === 'interieure' ? 'volant' : 'exterieur'),
  securite: () => 'securite',
  secours: () => 'secours',
};

export function afficherQuestion(o: OptionsQuestion): void {
  const { fiche, partie } = o;
  o.conteneur.innerHTML = `
    <article class="carte question" aria-labelledby="question-titre">
      <div class="question-entete">
        <span class="pastille">${icone(ICONES[partie](fiche))}${libellePartie(partie, fiche.type)}</span>
        <span class="pastille">Fiche ${fiche.numero}</span>
      </div>
      <h2 id="question-titre" class="question-texte" tabindex="-1">${echapper(fiche[partie].question)}</h2>
      <div data-corps></div>
    </article>`;
  const corps = o.conteneur.querySelector<HTMLElement>('[data-corps]')!;
  const titre = o.conteneur.querySelector<HTMLElement>('#question-titre')!;
  titre.focus({ preventScroll: true });
  o.conteneur.scrollIntoView({ behavior: defilement(), block: 'start' });

  const zone = partie === 'verification' && o.exercice.mode === 'zone' ? o.exercice : null;
  if (zone) {
    let resultat: boolean | null = null;
    const trouve = trouverElement({
      conteneur: corps,
      fiche,
      exercice: zone,
      nomVoiture: o.nomVoiture,
      tentativeUnique: o.mode === 'examen',
      libelleContinuer: o.libelleSuite,
      repere: o.repere,
      surPremierResultat: (ok) => (resultat = ok),
      surContinuer: () => o.surFin({ fiche: fiche.numero, partie, ok: resultat === true, mode: 'zone' }),
      surClassique: () => {
        trouve.detruire();
        modeClassique(corps, o);
        corps.querySelector<HTMLButtonElement>('[data-voir]')?.focus();
      },
    });
    return;
  }
  const choix = o.qcu ? choixQcu(fiche, partie, o.qcu.fiches, PICTOGRAMMES) : null;
  if (choix) {
    modeQcu(corps, o, choix);
    return;
  }
  modeClassique(corps, o);
}

const LETTRES = ['A', 'B', 'C'];

function modeQcu(corps: HTMLElement, o: OptionsQuestion, choix: ChoixQcu[]): void {
  const { fiche, partie } = o;
  const images = choix.every((c) => c.image);
  corps.innerHTML = `
    <p class="consigne doux">${icone('cible')}<span>${images ? 'Quel est le bon pictogramme ?' : 'Choisis la bonne réponse.'}</span></p>
    <div class="qcu${images ? ' qcu-images' : ''}" role="group" aria-label="Réponses proposées">
      ${choix
        .map(
          (c, i) => `<button type="button" class="choix-qcu" data-i="${i}">
            <span class="lettre" aria-hidden="true">${LETTRES[i]}</span>
            ${c.image ? `<img src="${urlPictogramme(c.image)}" alt="${echapper(c.image.alt)}">` : `<span>${echapper(c.texte!)}</span>`}
          </button>`,
        )
        .join('')}
    </div>
    <div class="qcu-retour" hidden tabindex="-1"></div>`;
  const boutons = [...corps.querySelectorAll<HTMLButtonElement>('.choix-qcu')];
  const retour = corps.querySelector<HTMLElement>('.qcu-retour')!;
  const bonne = choix.findIndex((c) => c.correct);

  boutons.forEach((b, i) =>
    b.addEventListener('click', () => {
      const ok = i === bonne;
      boutons.forEach((x, j) => {
        x.disabled = true;
        x.classList.add(j === bonne ? 'juste' : j === i ? 'faux' : 'ecarte');
      });
      const message = ok ? 'Bonne réponse !' : `Raté : la bonne réponse était la ${LETTRES[bonne]}.`;
      retour.innerHTML = `
        <p class="verdict ${ok ? 'verdict-bon' : 'verdict-faux'}">${icone(ok ? 'check' : 'croix')}<span>${message}</span></p>
        ${partie === 'verification' ? `<div class="reponse">${htmlReponse(fiche, partie, true, o.repere)}</div>` : ''}
        <button type="button" class="bouton bouton-principal bouton-large" data-suite>${echapper(o.libelleSuite)}${icone('fleche-droite')}</button>`;
      retour.hidden = false;
      retour.classList.add('apparait');
      const bonneReponse = choix[bonne].texte ?? choix[bonne].image!.alt;
      annoncer(ok ? `Bonne réponse : ${bonneReponse}` : `Raté. La bonne réponse était : ${bonneReponse}`);
      retour.querySelector<HTMLButtonElement>('[data-suite]')!.focus({ preventScroll: true });
      retour.scrollIntoView({ behavior: defilement(), block: 'nearest' });
      retour
        .querySelector('[data-suite]')!
        .addEventListener('click', () => o.surFin({ fiche: fiche.numero, partie, ok, mode: 'qcu' }), { once: true });
    }),
  );
}

function modeClassique(corps: HTMLElement, o: OptionsQuestion): void {
  const { fiche, partie } = o;
  corps.innerHTML = `
    <p class="consigne doux">${icone('info')}<span>Réponds dans ta tête ou à voix haute, puis regarde la réponse.</span></p>
    <button type="button" class="bouton bouton-contour bouton-large" data-voir aria-expanded="false" aria-controls="reponse-courante">${icone('oeil')}Voir la réponse</button>
    <div class="reponse" id="reponse-courante" hidden tabindex="-1">${htmlReponse(fiche, partie, true, o.repere)}</div>
    <div class="auto-eval" hidden>
      <p class="etiquette" id="auto-eval-titre">Tu savais&nbsp;?</p>
      <div class="rangee" role="group" aria-labelledby="auto-eval-titre">
        <button type="button" class="bouton bouton-vert" data-ok>${icone('check')}Je savais</button>
        <button type="button" class="bouton bouton-a-revoir" data-ko>${icone('croix')}À revoir</button>
      </div>
    </div>`;
  const voir = corps.querySelector<HTMLButtonElement>('[data-voir]')!;
  const reponse = corps.querySelector<HTMLElement>('.reponse')!;
  const autoEval = corps.querySelector<HTMLElement>('.auto-eval')!;

  voir.addEventListener('click', () => {
    reponse.hidden = false;
    reponse.classList.add('apparait');
    autoEval.hidden = false;
    autoEval.classList.add('apparait');
    voir.hidden = true;
    voir.setAttribute('aria-expanded', 'true');
    annoncer('Réponse : ' + (reponse.textContent ?? '').trim());
    corps.querySelector<HTMLButtonElement>('[data-ok]')!.focus({ preventScroll: true });
    autoEval.scrollIntoView({ behavior: defilement(), block: 'nearest' });
  });

  const finir = (ok: boolean) => o.surFin({ fiche: fiche.numero, partie, ok, mode: 'auto' });
  corps.querySelector('[data-ok]')!.addEventListener('click', () => finir(true));
  corps.querySelector('[data-ko]')!.addEventListener('click', () => finir(false));
}
