// Chargé sur toutes les pages : pastille voiture, choix au premier lancement,
// service worker et mise en cache des photos de la voiture choisie.
import { lireVoiture, ecrireVoiture } from '../lib/stockage';
import { VOITURES, nomDeBase, urlPhoto, type ChoixVoiture } from '../lib/vehicules';
import { BASE, annoncer, chargerVehicules, libelleVoiture } from './commun';

const fenetre = document.getElementById('choix-voiture') as HTMLDialogElement | null;

function majPastilles(): void {
  const choix = lireVoiture();
  const texte = libelleVoiture(choix);
  const detail = choix === 'clio5' || choix === 'yaris' ? ` (${VOITURES[choix].boite.toLowerCase()})` : '';
  document.querySelectorAll<HTMLElement>('[data-voiture-nom]').forEach((el) => (el.textContent = texte));
  document.querySelectorAll<HTMLButtonElement>('[data-ouvrir-voiture]').forEach((b) => {
    b.setAttribute('aria-label', choix ? `Ta voiture : ${texte}${detail}. Changer de voiture` : 'Choisir ta voiture');
  });
}

function ouvrirChoix(): void {
  if (!fenetre || fenetre.open) return;
  const choix = lireVoiture();
  fenetre.querySelectorAll<HTMLButtonElement>('[data-choix-voiture]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.choixVoiture === choix));
  });
  fenetre.showModal();
}

async function mettreEnCachePhotos(choix: ChoixVoiture): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const garder = choix === 'inconnue' ? null : `photos-${choix}`;
    for (const nom of await caches.keys()) if (nom.startsWith('photos-') && nom !== garder) await caches.delete(nom);
    if (!garder) return;
    const cache = await caches.open(garder); // sa présence active la mise en cache côté service worker
    const { vehicules, manifeste } = await chargerVehicules();
    const donnees = vehicules[choix];
    if (!donnees) return;
    const urls = donnees.photos.flatMap((p) => {
      const construite = manifeste[choix]?.[nomDeBase(p.fichier)];
      if (!construite) return [];
      // Une largeur par photo suffit hors ligne : le service worker sert la plus proche.
      const largeur = p.role === 'gros-plan' ? construite.largeurs[0] : construite.largeurs[Math.min(1, construite.largeurs.length - 1)];
      return [urlPhoto(BASE, choix, p.fichier, largeur, 'webp')];
    });
    await Promise.all(urls.map((u) => cache.add(u).catch(() => undefined)));
  } catch {
    /* hors ligne ou stockage indisponible : on réessaiera au prochain choix */
  }
}

fenetre?.addEventListener('click', (e) => {
  const bouton = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-choix-voiture]');
  if (bouton) {
    const choix = bouton.dataset.choixVoiture as ChoixVoiture;
    ecrireVoiture(choix);
    majPastilles();
    fenetre.close();
    annoncer(choix === 'inconnue' ? 'C’est noté, tu choisiras ta voiture plus tard.' : `C’est noté : tu apprends sur la ${libelleVoiture(choix)}.`);
    document.dispatchEvent(new CustomEvent('voiture:changee', { detail: choix }));
    void mettreEnCachePhotos(choix);
    return;
  }
  // Clic sur le fond assombri : fermer.
  if (e.target === fenetre) fenetre.close();
});

document.querySelectorAll('[data-ouvrir-voiture]').forEach((b) => b.addEventListener('click', ouvrirChoix));
majPastilles();

if (document.body.dataset.demanderVoiture === 'oui' && lireVoiture() === null) {
  ouvrirChoix();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE }).catch(() => undefined);
  });
}
