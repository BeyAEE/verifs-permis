// Page d'une fiche : révélation des réponses, « Tout afficher », et photo de
// la voiture choisie avec la zone en surbrillance quand elle existe.
import type { Fiche } from '../lib/fiches';
import { lireVoiture } from '../lib/stockage';
import { exercicePour } from '../lib/vehicules';
import { BASE, annoncer, chargerVehicules, libelleVoiture } from './commun';
import { htmlPhoto } from './trouve';
import { Visionneuse } from './visionneuse';

const page = document.querySelector<HTMLElement>('[data-fiche-page]')!;
const fiche = { numero: Number(page.dataset.numero), type: page.dataset.type } as Fiche;
const boutons = [...page.querySelectorAll<HTMLButtonElement>('[data-voir]')];
const tout = page.querySelector<HTMLButtonElement>('[data-tout]')!;
let visionneuse: Visionneuse | null = null;

function montrer(bouton: HTMLButtonElement, oui: boolean, annonce = true): void {
  const reponse = document.getElementById(bouton.getAttribute('aria-controls')!)!;
  reponse.hidden = !oui;
  bouton.setAttribute('aria-expanded', String(oui));
  bouton.querySelector('span')!.textContent = oui ? 'Masquer la réponse' : 'Voir la réponse';
  if (oui) {
    reponse.classList.remove('apparait');
    void reponse.offsetWidth; // relance l'animation
    reponse.classList.add('apparait');
    if (annonce) annoncer('Réponse : ' + (reponse.querySelector('.reponse-texte')?.textContent ?? '').trim());
    if (bouton.dataset.voir === 'verification') void afficherZone();
  }
  majTout();
}

function majTout(): void {
  const toutes = boutons.every((b) => b.getAttribute('aria-expanded') === 'true');
  tout.dataset.ouvert = String(toutes);
  tout.querySelector('span')!.textContent = toutes ? 'Tout masquer' : 'Tout afficher';
}

boutons.forEach((b) => b.addEventListener('click', () => montrer(b, b.getAttribute('aria-expanded') !== 'true')));
tout.addEventListener('click', () => {
  const ouvrir = tout.dataset.ouvert !== 'true';
  boutons.forEach((b) => montrer(b, ouvrir, false));
  annoncer(ouvrir ? 'Les 3 réponses sont affichées.' : 'Les réponses sont masquées.');
});

async function afficherZone(): Promise<void> {
  const cible = page.querySelector<HTMLElement>('[data-zone-photo]');
  const rappel = page.querySelector<HTMLElement>('[data-reponse="verification"] .rappel');
  if (!cible || fiche.type !== 'exterieure') return;
  visionneuse?.detruire();
  visionneuse = null;
  cible.innerHTML = '';
  if (rappel) rappel.hidden = false;

  const choix = lireVoiture();
  let donnees;
  try {
    donnees = await chargerVehicules();
  } catch {
    return; // pas de données : mode classique
  }
  const ex = exercicePour(fiche, choix, choix ? donnees.vehicules[choix] : undefined, donnees.manifeste, new Set(donnees.localisables), BASE);
  if (ex.mode !== 'zone') return;

  cible.innerHTML = `<p class="surtitre">Sur ta ${libelleVoiture(choix)}</p><div data-vis></div>`;
  visionneuse = new Visionneuse(cible.querySelector('[data-vis]')!, { photo: ex.photo });
  visionneuse.activer(false);
  visionneuse.dessinerZones(ex.zonesBonnes.map((z) => ({ points: z.polygone, classe: 'zone-bonne zone-revelee' })));
  if (ex.grosPlan) cible.insertAdjacentHTML('beforeend', htmlPhoto(ex.grosPlan, ex.zone.libelle));
  if (rappel) rappel.hidden = true;
}

document.addEventListener('voiture:changee', () => {
  const ouverte = page.querySelector<HTMLButtonElement>('[data-voir="verification"]')?.getAttribute('aria-expanded') === 'true';
  if (ouverte) void afficherZone();
});
