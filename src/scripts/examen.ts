// Examen blanc : tirage au compteur (ou saisie des 2 derniers chiffres),
// 3 questions, résultat sur 3 points.
import { chiffresCompteur, compteurAleatoire, ficheDepuisCompteur, formaterKm } from '../lib/compteur';
import { PARTIES, libellePartie, type Fiche } from '../lib/fiches';
import { icone } from '../lib/icones';
import { bilanExamen, messageExamen, type Resultat } from '../lib/score';
import { lireVoiture, lireSession, ecrireSession, effacerSession } from '../lib/stockage';
import { exercicePour } from '../lib/vehicules';
import { BASE, animationsReduites, annoncer, chargerFiches, chargerVehicules, echapper, libelleVoiture, type DonneesClient } from './commun';
import { afficherQuestion } from './question';
import { htmlReponse } from './reponses';
import { animerScore } from './series';

interface Examen {
  km: number | null;
  fiche: number;
  index: number;
  resultats: Resultat[];
}

const SESSION = 'examen';
const racine = document.querySelector<HTMLElement>('[data-examen]')!;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => racine.querySelector<T>(s)!;
const vues = Object.fromEntries([...racine.querySelectorAll<HTMLElement>('[data-vue]')].map((v) => [v.dataset.vue!, v]));
const rouleaux = [...racine.querySelectorAll<HTMLElement>('.rouleau')];
const lancer = $<HTMLButtonElement>('[data-lancer]');
const commencer = $<HTMLButtonElement>('[data-commencer]');

let fiches: Fiche[] = [];
let vehicules: DonneesClient | null = null;
let examen: Examen | null = null;
let positions = rouleaux.map(() => 0);

function montrerVue(nom: 'depart' | 'question' | 'resultat'): void {
  for (const [cle, vue] of Object.entries(vues)) vue.hidden = cle !== nom;
}

// ── Compteur à rouleaux ──────────────────────────────────────────────
function placer(rouleau: HTMLElement, index: number, transition: string): void {
  const bande = rouleau.firstElementChild as HTMLElement;
  bande.style.transition = transition;
  bande.style.transform = `translateY(-${index * 2.5}%)`; // 40 chiffres par bande
}

function animerCompteur(km: number): Promise<void> {
  const chiffres = chiffresCompteur(km).map(Number);
  racine.querySelector('[data-compteur]')!.classList.remove('compteur-arrete');
  if (animationsReduites()) {
    rouleaux.forEach((r, i) => placer(r, chiffres[i], 'none'));
    positions = chiffres;
    racine.querySelector('[data-compteur]')!.classList.add('compteur-arrete');
    return Promise.resolve();
  }
  return new Promise((fin) => {
    rouleaux.forEach((r, i) => placer(r, positions[i], 'none'));
    void racine.offsetWidth;
    rouleaux.forEach((r, i) => {
      const tours = 1 + Math.floor(i / 2); // les derniers chiffres tournent plus, comme un vrai compteur
      placer(r, tours * 10 + chiffres[i], `transform ${0.9 + i * 0.2}s cubic-bezier(.15,.7,.2,1)`);
    });
    const dernier = rouleaux[rouleaux.length - 1].firstElementChild as HTMLElement;
    dernier.addEventListener(
      'transitionend',
      () => {
        rouleaux.forEach((r, i) => placer(r, chiffres[i], 'none')); // retour discret au premier tour
        positions = chiffres;
        racine.querySelector('[data-compteur]')!.classList.add('compteur-arrete');
        fin();
      },
      { once: true },
    );
  });
}

async function tirer(): Promise<void> {
  lancer.disabled = true;
  commencer.hidden = true;
  $('[data-tirage-resultat]').textContent = '';
  const km = compteurAleatoire();
  const numero = ficheDepuisCompteur(km);
  await animerCompteur(km);
  $('[data-tirage-resultat]').innerHTML = `${formaterKm(km)} → c’est la <strong>fiche ${numero}</strong>&nbsp;!`;
  examen = { km, fiche: numero, index: 0, resultats: [] };
  lancer.disabled = false;
  lancer.innerHTML = `${icone('compteur')}Relancer le compteur`;
  lancer.classList.replace('bouton-rouge', 'bouton-contour');
  lancer.classList.remove('bouton-geant');
  commencer.hidden = false;
  commencer.focus({ preventScroll: true });
}

// ── Questions ────────────────────────────────────────────────────────
function demarrer(): void {
  if (!examen) return;
  ecrireSession(SESSION, examen);
  montrerVue('question');
  afficherCourante();
}

function afficherCourante(): void {
  if (!examen) return;
  if (examen.index >= 3) return afficherResultat();
  const fiche = fiches[examen.fiche - 1];
  const partie = PARTIES[examen.index];
  const choix = lireVoiture();
  const exercice = vehicules
    ? exercicePour(fiche, choix, choix ? vehicules.vehicules[choix] : undefined, vehicules.manifeste, new Set(vehicules.localisables), BASE)
    : ({ mode: 'classique', raison: 'voiture-inconnue' } as const);

  $('[data-titre-examen]').textContent = `Fiche ${fiche.numero} · question ${examen.index + 1} sur 3`;
  const barre = $('[data-progression]');
  barre.setAttribute('aria-valuenow', String(examen.index));
  barre.setAttribute('aria-valuetext', `Question ${examen.index + 1} sur 3`);
  (barre.firstElementChild as HTMLElement).style.width = `${(examen.index / 3) * 100}%`;

  afficherQuestion({
    conteneur: $('[data-question]'),
    fiche,
    partie,
    position: examen.index + 1,
    total: 3,
    exercice,
    nomVoiture: libelleVoiture(choix),
    mode: 'examen',
    libelleSuite: examen.index < 2 ? 'Question suivante' : 'Voir mon résultat',
    surFin: (r) => {
      examen!.resultats.push(r);
      examen!.index++;
      ecrireSession(SESSION, examen);
      afficherCourante();
    },
  });
}

function afficherResultat(): void {
  if (!examen) return;
  const fiche = fiches[examen.fiche - 1];
  const bilan = bilanExamen(examen.resultats);
  effacerSession(SESSION);
  montrerVue('resultat');
  $('[data-resultat-fiche]').textContent = examen.km !== null ? `Fiche ${fiche.numero} · compteur ${formaterKm(examen.km)}` : `Fiche ${fiche.numero}`;
  animerScore($('[data-score]'), bilan.points);
  const message = messageExamen(bilan.points);
  $('[data-message]').textContent = message;
  $('[data-recap]').innerHTML = examen.resultats
    .map(
      (r) => `<li class="carte recap-item">
        <div class="question-entete">
          <span class="pastille">${libellePartie(r.partie, fiche.type)}</span>
          <span class="verdict-mini ${r.ok ? 'bon' : 'faux'}">${icone(r.ok ? 'check' : 'croix')}${r.ok ? '1 point' : '0 point'}</span>
        </div>
        <p class="question-texte">${echapper(fiche[r.partie].question)}</p>
        <div class="reponse">${htmlReponse(fiche, r.partie, r.mode === 'auto')}</div>
      </li>`,
    )
    .join('');
  $<HTMLAnchorElement>('[data-lien-fiche]').href = `${BASE}fiche/${fiche.numero}/`;
  $<HTMLAnchorElement>('[data-lien-fiche]').textContent = `Voir la fiche ${fiche.numero}`;
  annoncer(`Résultat : ${bilan.points} point${bilan.points > 1 ? 's' : ''} sur 3. ${message}`);
  vues.resultat.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function reinitialiser(): void {
  examen = null;
  effacerSession(SESSION);
  commencer.hidden = true;
  lancer.innerHTML = `${icone('compteur')}Lancer le compteur`;
  lancer.classList.replace('bouton-contour', 'bouton-rouge');
  lancer.classList.add('bouton-geant');
  $('[data-tirage-resultat]').textContent = '';
  montrerVue('depart');
  window.scrollTo({ top: 0 });
  lancer.focus({ preventScroll: true });
}

// ── Événements ───────────────────────────────────────────────────────
lancer.addEventListener('click', () => void tirer());
commencer.addEventListener('click', demarrer);
racine.querySelector('[data-recommencer]')!.addEventListener('click', reinitialiser);

const champ = document.getElementById('deux-chiffres') as HTMLInputElement;
const erreur = $('[data-erreur]');
champ.addEventListener('input', () => {
  champ.value = champ.value.replace(/\D/g, '').slice(0, 2);
  erreur.hidden = true;
  champ.removeAttribute('aria-invalid');
});
$<HTMLFormElement>('[data-saisie]').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!/^\d{1,2}$/.test(champ.value)) {
    erreur.textContent = 'Saisis 1 ou 2 chiffres, par exemple 26 (ou 00 pour la fiche 100).';
    erreur.hidden = false;
    champ.setAttribute('aria-invalid', 'true');
    champ.focus();
    return;
  }
  const numero = ficheDepuisCompteur(champ.value.padStart(2, '0'));
  examen = { km: null, fiche: numero, index: 0, resultats: [] };
  annoncer(`Compteur terminé par ${champ.value.padStart(2, '0')} : c’est la fiche ${numero}.`);
  demarrer();
});

// Chargement : boutons inactifs tant que les fiches ne sont pas là.
lancer.disabled = true;
Promise.all([chargerFiches(), chargerVehicules().catch(() => null)]).then(([f, v]) => {
  fiches = f;
  vehicules = v;
  lancer.disabled = false;
  const enCours = lireSession<Examen>(SESSION);
  if (enCours && enCours.index < 3) {
    examen = enCours;
    montrerVue('question');
    afficherCourante();
  }
});
