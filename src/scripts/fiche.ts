// Page d'une fiche : révélation des réponses, « Tout afficher », et photo de
// la voiture choisie. La photo est visible dès la question ; la zone n'est
// surlignée (et le gros plan montré) qu'avec la réponse.
import type { Fiche } from '../lib/fiches';
import { lireVoiture } from '../lib/stockage';
import { exercicePour, repereDe, type Exercice } from '../lib/vehicules';
import { BASE, annoncer, chargerVehicules, libelleVoiture } from './commun';
import { htmlPhoto } from './trouve';
import { RAPPEL_MONITEUR, htmlRepere } from './reponses';
import { icone } from '../lib/icones';
import { Visionneuse } from './visionneuse';

const page = document.querySelector<HTMLElement>('[data-fiche-page]')!;
const fiche = { numero: Number(page.dataset.numero), type: page.dataset.type } as Fiche;
const boutons = [...page.querySelectorAll<HTMLButtonElement>('[data-voir]')];
const tout = page.querySelector<HTMLButtonElement>('[data-tout]')!;
let visionneuse: Visionneuse | null = null;
let exercice: Extract<Exercice, { mode: 'zone' }> | null = null;

function montrer(bouton: HTMLButtonElement, oui: boolean, annonce = true): void {
  const reponse = document.getElementById(bouton.getAttribute('aria-controls')!)!;
  reponse.hidden = !oui;
  bouton.setAttribute('aria-expanded', String(oui));
  bouton.querySelector('span')!.textContent = oui ? 'Masquer la réponse' : 'Voir la réponse';
  if (oui) {
    reponse.classList.remove('apparait');
    void reponse.offsetWidth; // relance l'animation
    reponse.classList.add('apparait');
    if (annonce) {
      const picto = reponse.querySelector<HTMLImageElement>('.pictogramme img')?.alt;
      annoncer('Réponse : ' + (picto ?? reponse.querySelector('.reponse-texte')?.textContent ?? '').trim());
    }
  }
  if (bouton.dataset.voir === 'verification') revelerZone(oui);
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

/** Photo de la voiture choisie, sous la question (sans la zone). */
async function afficherPhoto(): Promise<void> {
  const cible = page.querySelector<HTMLElement>('[data-zone-photo]');
  if (!cible) return;
  visionneuse?.detruire();
  visionneuse = null;
  exercice = null;
  cible.innerHTML = '';

  const choix = lireVoiture();
  let donnees;
  try {
    donnees = await chargerVehicules();
  } catch {
    return; // pas de données : mode classique
  }
  const ex = exercicePour(fiche, choix, choix ? donnees.vehicules[choix] : undefined, donnees.manifeste, new Set(donnees.localisables), BASE);
  if (ex.mode === 'zone') {
    exercice = ex;
    cible.innerHTML = `<p class="surtitre">Sur ta ${libelleVoiture(choix)}</p><div data-vis></div>`;
    visionneuse = new Visionneuse(cible.querySelector('[data-vis]')!, { photo: ex.photo });
    visionneuse.activer(false);
  }
  const ouverte = page.querySelector<HTMLButtonElement>('[data-voir="verification"]')?.getAttribute('aria-expanded') === 'true';
  revelerZone(ouverte);
}

/** Avec la réponse : zone surlignée sur la photo, gros plan, et plus de rappel générique. */
function revelerZone(oui: boolean): void {
  const grosPlan = page.querySelector<HTMLElement>('[data-gros-plan]');
  const rappel = page.querySelector<HTMLElement>('[data-reponse="verification"] .rappel');
  const montrer = oui && exercice !== null;
  visionneuse?.dessinerZones(
    montrer ? exercice!.zonesBonnes.map((z) => ({ points: z.polygone, classe: 'zone-bonne zone-revelee' })) : [],
  );
  if (grosPlan) grosPlan.innerHTML = montrer && exercice!.grosPlan ? htmlPhoto(exercice!.grosPlan, exercice!.zone.libelle) : '';
  if (rappel) rappel.hidden = montrer;
}
void afficherPhoto();

/** Rappel générique ↔ repère de la voiture choisie (ex. « manette au bas du rétroviseur »). */
async function majRepere(): Promise<void> {
  const note = page.querySelector<HTMLElement>('[data-reponse="verification"] .rappel, [data-reponse="verification"] .repere');
  if (!note) return;
  const choix = lireVoiture();
  let texte: string | undefined;
  if (choix && choix !== 'inconnue') {
    try {
      texte = repereDe((await chargerVehicules()).vehicules[choix], fiche.numero)?.texte;
    } catch {
      /* hors ligne sans données : rappel générique */
    }
  }
  // On ne remplace que si le type change (évite d'écraser un rappel masqué par la photo de zone).
  if (texte) note.outerHTML = htmlRepere({ texte, nomVoiture: libelleVoiture(choix) });
  else if (note.classList.contains('repere')) note.outerHTML = `<p class="rappel">${icone('info')}<span>${RAPPEL_MONITEUR}</span></p>`;
}
void majRepere();

document.addEventListener('voiture:changee', () => {
  void majRepere();
  void afficherPhoto();
});
