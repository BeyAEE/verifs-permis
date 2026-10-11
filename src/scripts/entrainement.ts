// Entraînement : choix de la série → questions → bilan.
// La série en cours vit en mémoire de session (sessionStorage).
import { bilanSerie, messageSerie, type Item, type Resultat } from '../lib/score';
import { lireVoiture, lireSession, ecrireSession, effacerSession } from '../lib/stockage';
import { enregistrerReponse, lireProgression, pointsFaibles, resume } from '../lib/progression';
import { exercicePour, repereDe } from '../lib/vehicules';
import type { Fiche } from '../lib/fiches';
import { BASE, annoncer, chargerFiches, chargerVehicules, defilement, libelleVoiture, type DonneesClient } from './commun';
import { afficherQuestion } from './question';
import { NOMS_SERIES, animerScore, htmlARevoir, itemsSerie, type TypeSerie } from './series';
import { EVENEMENT_PROGRESSION, majCarteProgression } from './progression-carte';

interface Serie {
  type: TypeSerie;
  items: Item[];
  index: number;
  resultats: Resultat[];
  /** QCU : 3 choix au lieu de l'auto-évaluation (quand la question s'y prête). */
  qcu: boolean;
}

const SESSION = 'entrainement';
const SESSION_MODE = 'mode-reponse';
const AIDES = {
  auto: 'Tu réponds dans ta tête, puis tu dis honnêtement si tu savais.',
  qcu: '3 réponses, une seule est juste. Les vérifications sans pictogramme restent en auto-évaluation.',
};

function modeChoisi(): boolean {
  return racine.querySelector<HTMLInputElement>('input[name="mode-reponse"]:checked')?.value === 'qcu';
}
const racine = document.querySelector<HTMLElement>('[data-entrainement]')!;
const vues = Object.fromEntries([...racine.querySelectorAll<HTMLElement>('[data-vue]')].map((v) => [v.dataset.vue!, v]));
const $ = <T extends HTMLElement = HTMLElement>(s: string) => racine.querySelector<T>(s)!;

let fiches: Fiche[] = [];
let vehicules: DonneesClient | null = null;
let serie: Serie | null = null;

function montrerVue(nom: 'choix' | 'question' | 'bilan'): void {
  for (const [cle, vue] of Object.entries(vues)) vue.hidden = cle !== nom;
}

function sauver(): void {
  if (serie) ecrireSession(SESSION, serie);
}

function majReprise(): void {
  const enCours = lireSession<Serie>(SESSION);
  const bloc = $('[data-reprise]');
  bloc.hidden = !(enCours && enCours.index < enCours.items.length);
  if (enCours) $('[data-reprise-detail]').textContent = `(${NOMS_SERIES[enCours.type]}, question ${enCours.index + 1} sur ${enCours.items.length})`;
}

/** Carte « Mes points faibles » et carte de progression, d'après le stockage local. */
function majProgression(): void {
  majCarteProgression(racine);
  const n = resume(lireProgression()).questionsARevoir;
  const carte = $('[data-serie="faibles"]');
  carte.hidden = n === 0;
  $('[data-detail-faibles]').textContent =
    n > 30 ? `30 des ${n} questions ratées la dernière fois` : `${n} question${n > 1 ? 's' : ''} ratée${n > 1 ? 's' : ''} la dernière fois`;
}

function demarrer(type: TypeSerie, items: Item[], qcu = modeChoisi()): void {
  serie = { type, items, index: 0, resultats: [], qcu };
  sauver();
  montrerVue('question');
  afficherCourante();
}

function repereAffiche(numero: number) {
  const choix = lireVoiture();
  const r = choix && choix !== 'inconnue' ? repereDe(vehicules?.vehicules[choix], numero) : undefined;
  return r ? { texte: r.texte, nomVoiture: libelleVoiture(choix) } : undefined;
}

function afficherCourante(): void {
  if (!serie) return;
  if (serie.index >= serie.items.length) return afficherBilan();

  const { fiche: numero, partie } = serie.items[serie.index];
  const fiche = fiches[numero - 1];
  const choix = lireVoiture();
  const exercice = vehicules
    ? exercicePour(fiche, choix, choix ? vehicules.vehicules[choix] : undefined, vehicules.manifeste, new Set(vehicules.localisables), BASE)
    : ({ mode: 'classique', raison: 'voiture-inconnue' } as const);

  $('[data-nom-serie]').textContent = `${NOMS_SERIES[serie.type]} · ${serie.index + 1}/${serie.items.length}`;
  const barre = $('[data-progression]');
  barre.setAttribute('aria-valuemax', String(serie.items.length));
  barre.setAttribute('aria-valuenow', String(serie.index));
  barre.setAttribute('aria-valuetext', `Question ${serie.index + 1} sur ${serie.items.length}`);
  (barre.firstElementChild as HTMLElement).style.width = `${(serie.index / serie.items.length) * 100}%`;

  afficherQuestion({
    conteneur: $('[data-question]'),
    fiche,
    partie,
    position: serie.index + 1,
    total: serie.items.length,
    exercice,
    nomVoiture: libelleVoiture(choix),
    mode: 'entrainement',
    libelleSuite: serie.index + 1 < serie.items.length ? 'Question suivante' : 'Voir mon score',
    qcu: serie.qcu ? { fiches } : undefined,
    repere: repereAffiche(fiche.numero),
    surFin: (r) => {
      enregistrerReponse(r, r.ok);
      serie!.resultats.push(r);
      serie!.index++;
      sauver();
      afficherCourante();
    },
  });
}

function afficherBilan(): void {
  if (!serie) return;
  const bilan = bilanSerie(serie.resultats);
  effacerSession(SESSION);
  montrerVue('bilan');
  $('[data-score-texte]').textContent = `${bilan.points} sur ${bilan.total}`;
  animerScore($('[data-score]'), bilan.points);
  $('[data-total]').textContent = String(bilan.total);
  $('[data-message]').textContent = bilan.total ? messageSerie(bilan.points, bilan.total) : 'Aucune question répondue pour cette série.';
  const { maitrisees } = resume(lireProgression());
  $('[data-bilan-progression]').textContent = `Ta progression : ${maitrisees} fiche${maitrisees > 1 ? 's' : ''} maîtrisée${maitrisees > 1 ? 's' : ''} sur 100.`;
  $('[data-a-revoir]').innerHTML = htmlARevoir(bilan.aRevoir, fiches);
  $('[data-a-revoir-bloc]').hidden = bilan.aRevoir.length === 0;
  $<HTMLButtonElement>('[data-recommencer-revoir]').hidden = bilan.aRevoir.length === 0;
  annoncer(`Série terminée : ${bilan.points} sur ${bilan.total}. ${$('[data-message]').textContent}`);
  vues.bilan.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: defilement() });
  serie = { ...serie, items: bilan.aRevoir, index: 0, resultats: [] }; // prêt pour « recommencer »
}

racine.addEventListener('click', (e) => {
  const cible = (e.target as HTMLElement).closest<HTMLElement>('button');
  if (!cible || !fiches.length) return;
  if (cible.dataset.serie === 'faibles') {
    const items = pointsFaibles(lireProgression());
    if (items.length) demarrer('faibles', items);
  } else if (cible.dataset.serie) {
    const type = cible.dataset.serie as Exclude<TypeSerie, 'revoir' | 'faibles'>;
    demarrer(type, itemsSerie(type, fiches));
  } else if (cible.hasAttribute('data-reprendre')) {
    serie = lireSession<Serie>(SESSION);
    if (serie) {
      montrerVue('question');
      afficherCourante();
    }
  } else if (cible.hasAttribute('data-abandonner')) {
    effacerSession(SESSION);
    majReprise();
    racine.querySelector<HTMLButtonElement>('[data-serie]')?.focus();
  } else if (cible.hasAttribute('data-arreter')) {
    afficherBilan();
  } else if (cible.hasAttribute('data-recommencer-revoir') && serie?.items.length) {
    demarrer('revoir', serie.items, serie.qcu);
  } else if (cible.hasAttribute('data-nouvelle')) {
    serie = null;
    majReprise();
    majProgression();
    montrerVue('choix');
    window.scrollTo({ top: 0 });
    racine.querySelector<HTMLButtonElement>('[data-serie]')?.focus();
  }
});

// Mode de réponse mémorisé pour la session.
racine.querySelectorAll<HTMLInputElement>('input[name="mode-reponse"]').forEach((r) => {
  if (r.value === (lireSession<string>(SESSION_MODE) ?? 'auto')) r.checked = true;
  r.addEventListener('change', () => {
    ecrireSession(SESSION_MODE, r.value);
    $('[data-aide-mode]').textContent = AIDES[r.value as 'auto' | 'qcu'];
  });
});
$('[data-aide-mode]').textContent = AIDES[modeChoisi() ? 'qcu' : 'auto'];

// Chargement : les fiches sont indispensables, les voitures facultatives.
racine.querySelectorAll<HTMLButtonElement>('[data-serie]').forEach((b) => (b.disabled = true));
Promise.all([chargerFiches(), chargerVehicules().catch(() => null)]).then(([f, v]) => {
  fiches = f;
  vehicules = v;
  racine.querySelectorAll<HTMLButtonElement>('[data-serie]').forEach((b) => (b.disabled = false));
  majReprise();
  majProgression();
  racine.dataset.pret = 'oui';
  // Arrivée depuis « Revoir mes points faibles » (page d'accueil).
  const faibles = $('[data-serie="faibles"]');
  if (location.hash === '#points-faibles' && !faibles.hidden) {
    faibles.scrollIntoView({ block: 'center', behavior: defilement() });
    faibles.focus({ preventScroll: true });
  }
});

document.addEventListener(EVENEMENT_PROGRESSION, () => {
  majProgression();
  racine.querySelector<HTMLButtonElement>('[data-serie]:not([hidden])')?.focus();
});
