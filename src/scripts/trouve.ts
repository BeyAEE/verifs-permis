// Mode « Trouve l'élément » : l'élève touche la photo de SA voiture puis valide.
import { pointDansPolygone, type Point } from '../lib/geometrie';
import { icone } from '../lib/icones';
import type { Fiche } from '../lib/fiches';
import { bonneReponse, type Exercice } from '../lib/vehicules';
import { annoncer, defilement, echapper } from './commun';
import { htmlReponse } from './reponses';
import { Visionneuse } from './visionneuse';

export type ExerciceZone = Extract<Exercice, { mode: 'zone' }>;

export interface OptionsTrouve {
  conteneur: HTMLElement;
  fiche: Fiche;
  exercice: ExerciceZone;
  nomVoiture: string;
  /** Examen blanc : une seule tentative, comme le jour J. */
  tentativeUnique: boolean;
  /** Le premier résultat est celui qui compte pour le score. */
  surPremierResultat: (ok: boolean) => void;
  surContinuer: () => void;
  libelleContinuer: string;
  /** Repli clavier quand la photo n'a pas assez de zones nommées pour une liste. */
  surClassique: () => void;
}

let compteur = 0;

export function htmlPhoto(photo: ExerciceZone['photo'], legende: string, classe = ''): string {
  return `<figure class="gros-plan ${classe}">
    <picture>
      ${photo.srcset.avif ? `<source type="image/avif" srcset="${photo.srcset.avif}" sizes="(min-width: 900px) 700px, 100vw">` : ''}
      <source type="image/webp" srcset="${photo.srcset.webp}" sizes="(min-width: 900px) 700px, 100vw">
      <img src="${photo.src}" alt="${echapper(photo.alt)}" width="${photo.largeur}" height="${photo.hauteur}" loading="lazy" decoding="async">
    </picture>
    <figcaption>${echapper(legende)}</figcaption>
  </figure>`;
}

export function trouverElement(o: OptionsTrouve): { detruire: () => void } {
  const id = `trouve-${++compteur}`;
  const { exercice } = o;
  const avecListe = exercice.choix.length >= 2;
  const racine = document.createElement('div');
  racine.className = 'trouve';
  racine.innerHTML = `
    <p class="consigne" tabindex="-1">${icone('doigt')}<span>Touche l’endroit sur la photo de ta <strong>${echapper(o.nomVoiture)}</strong>, puis valide. Tu peux zoomer avec deux doigts.</span></p>
    <div data-vis></div>
    <button type="button" class="bouton bouton-principal bouton-large" data-valider disabled>Valider</button>
    ${
      avecListe
        ? `<details class="trouve-liste">
            <summary>Choisir dans une liste plutôt</summary>
            <fieldset>
              <legend class="visuellement-cache">Éléments visibles sur la photo</legend>
              ${exercice.choix
                .map(
                  (c) =>
                    `<label class="option-liste"><input type="radio" name="${id}" value="${echapper(c.id)}"><span>${echapper(c.libelle)}</span></label>`,
                )
                .join('')}
            </fieldset>
            <button type="button" class="bouton bouton-contour bouton-large" data-valider-liste disabled>Valider ce choix</button>
          </details>`
        : `<button type="button" class="lien-discret" data-classique>Je ne peux pas utiliser la photo : voir la réponse</button>`
    }
    <div class="trouve-resultat" data-resultat hidden tabindex="-1"></div>`;
  o.conteneur.append(racine);

  let point: Point | null = null;
  let premier = true;
  let termine = false;

  const valider = racine.querySelector<HTMLButtonElement>('[data-valider]')!;
  const validerListe = racine.querySelector<HTMLButtonElement>('[data-valider-liste]');
  const resultat = racine.querySelector<HTMLElement>('[data-resultat]')!;

  const vis = new Visionneuse(racine.querySelector('[data-vis]')!, {
    photo: exercice.photo,
    surTouche: (p) => {
      if (termine) return;
      point = p;
      vis.placerMarqueur(p);
      valider.disabled = false;
    },
  });

  racine.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((r) =>
    r.addEventListener('change', () => {
      if (validerListe && !termine) validerListe.disabled = false;
    }),
  );

  const saisies = [valider, racine.querySelector<HTMLElement>('.trouve-liste'), racine.querySelector<HTMLElement>('[data-classique]')].filter(
    (el): el is HTMLElement => !!el,
  );

  function conclure(ok: boolean): void {
    termine = true;
    vis.activer(false);
    valider.disabled = true;
    if (validerListe) validerListe.disabled = true;
    saisies.forEach((el) => (el.hidden = true));
    vis.appliquer({ s: 1, tx: 0, ty: 0 });
    vis.dessinerZones(exercice.zonesBonnes.map((z) => ({ points: z.polygone, classe: ok ? 'zone-bonne' : 'zone-bonne zone-revelee' })));
    if (point) vis.placerMarqueur(point, ok ? 'bon' : 'faux');

    if (premier) {
      premier = false;
      o.surPremierResultat(ok);
    }

    const bonnes = [...new Set(exercice.zonesBonnes.map((z) => z.libelle))].join(' ou ');
    const message = ok
      ? 'Bravo, c’est bien là !'
      : `Pas tout à fait. La bonne zone est en surbrillance verte. Il fallait trouver : ${bonnes}.`;
    const peutReessayer = !ok && !o.tentativeUnique;
    resultat.innerHTML = `
      <p class="verdict ${ok ? 'verdict-bon' : 'verdict-faux'}">${icone(ok ? 'check' : 'croix')}<span>${echapper(message)}</span></p>
      ${exercice.grosPlan ? htmlPhoto(exercice.grosPlan, exercice.zone.libelle) : `<p class="libelle-zone">${echapper(exercice.zone.libelle)}</p>`}
      <div class="reponse"><p class="surtitre">Réponse officielle</p>${htmlReponse(o.fiche, 'verification', false)}</div>
      <div class="rangee">
        ${peutReessayer ? `<button type="button" class="bouton bouton-contour" data-reessayer>${icone('recadrer')}Réessayer</button>` : ''}
        <button type="button" class="bouton bouton-principal" data-continuer>${echapper(o.libelleContinuer)}${icone('fleche-droite')}</button>
      </div>`;
    resultat.hidden = false;
    resultat.classList.add('apparait');
    annoncer(message);
    resultat.focus({ preventScroll: true });
    resultat.scrollIntoView({ behavior: defilement(), block: 'nearest' });
  }

  valider.addEventListener('click', () => {
    if (!point || termine) return;
    conclure(bonneReponse(point, exercice.zonesBonnes, pointDansPolygone));
  });

  validerListe?.addEventListener('click', () => {
    const choisi = racine.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (!choisi || termine) return;
    point = null;
    vis.placerMarqueur(null);
    conclure(exercice.zonesBonnes.some((z) => z.id === choisi.value));
  });

  racine.querySelector('[data-classique]')?.addEventListener('click', () => o.surClassique());

  resultat.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.hasAttribute('data-continuer')) o.surContinuer();
    if (b.hasAttribute('data-reessayer')) {
      termine = false;
      point = null;
      vis.activer(true);
      vis.dessinerZones([]);
      vis.placerMarqueur(null);
      resultat.hidden = true;
      saisies.forEach((el) => (el.hidden = false));
      valider.disabled = true;
      racine.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((r) => (r.checked = false));
      annoncer('Nouvel essai : touche la photo puis valide.');
      racine.querySelector<HTMLElement>('.consigne')!.focus({ preventScroll: true });
      vis.scene.scrollIntoView({ behavior: defilement(), block: 'center' });
    }
  });

  return {
    detruire: () => {
      vis.detruire();
      racine.remove();
    },
  };
}
