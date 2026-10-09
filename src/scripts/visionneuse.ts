// Visionneuse photo : pincement, double tap, boutons + / −, plein écran.
// Le calque image est transformé (translate + scale, origine 0 0) ; les zones
// sont dessinées dans un SVG du même calque, en pourcentages (viewBox 0 0 100 100).
import {
  borner,
  ecranVersRelatif,
  rectTransforme,
  relatifVersEcran,
  zoomerAutour,
  type Point,
  type Transformation,
} from '../lib/geometrie';
import { icone } from '../lib/icones';
import type { PhotoPublique } from '../lib/vehicules';
import { echapper } from './commun';

export interface OptionsVisionneuse {
  photo: PhotoPublique;
  /** Appelé quand l'élève touche un point de la photo (en %). */
  surTouche?: (p: Point) => void;
  /** Laisse passer les gestes sur un sommet (éditeur). */
  ignorerCible?: (cible: EventTarget | null) => boolean;
  legende?: string;
}

const SEUIL_TAP = 8; // px
const DELAI_DOUBLE = 320; // ms

export class Visionneuse {
  readonly racine: HTMLElement;
  readonly scene: HTMLElement;
  readonly calque: HTMLElement;
  readonly svg: SVGSVGElement;
  private marqueurEl: HTMLElement;
  private t: Transformation = { s: 1, tx: 0, ty: 0 };
  private pointeurs = new Map<number, { x: number; y: number }>();
  private debut: { x: number; y: number; temps: number; id: number } | null = null;
  private multi = false;
  private deplace = false;
  private dernierTap: { x: number; y: number; temps: number } | null = null;
  private marqueur: Point | null = null;
  private actif = true;
  private observateur: ResizeObserver;
  private quitterPleinEcran = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.pleinEcran(false);
  };

  constructor(
    conteneur: HTMLElement,
    private options: OptionsVisionneuse,
  ) {
    const { photo } = options;
    const ratio = `${photo.largeur} / ${photo.hauteur}`;
    this.racine = document.createElement('div');
    this.racine.className = 'visionneuse';
    this.racine.innerHTML = `
      <div class="vis-scene" style="aspect-ratio:${ratio};--ratio:${(photo.largeur / photo.hauteur).toFixed(4)}">
        <div class="vis-calque">
          <picture>
            ${photo.srcset.avif ? `<source type="image/avif" srcset="${photo.srcset.avif}" sizes="(min-width: 900px) 760px, 100vw">` : ''}
            <source type="image/webp" srcset="${photo.srcset.webp}" sizes="(min-width: 900px) 760px, 100vw">
            <img src="${photo.src}" alt="${echapper(photo.alt)}" width="${photo.largeur}" height="${photo.hauteur}" loading="lazy" decoding="async" draggable="false">
          </picture>
          <svg class="vis-zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
        </div>
        <span class="vis-marqueur" hidden></span>
      </div>
      <div class="vis-controles">
        <button type="button" class="vis-bouton" data-zoom="plus" aria-label="Zoomer">${icone('zoom-plus')}</button>
        <button type="button" class="vis-bouton" data-zoom="moins" aria-label="Dézoomer">${icone('zoom-moins')}</button>
        <button type="button" class="vis-bouton" data-zoom="reset" aria-label="Revenir à la photo entière">${icone('recadrer')}</button>
        <button type="button" class="vis-bouton" data-plein-ecran aria-label="Afficher en plein écran" aria-pressed="false">${icone('plein-ecran')}</button>
      </div>`;
    conteneur.append(this.racine);
    this.scene = this.racine.querySelector('.vis-scene')!;
    this.calque = this.racine.querySelector('.vis-calque')!;
    this.svg = this.racine.querySelector('svg')!;
    this.marqueurEl = this.racine.querySelector('.vis-marqueur')!;

    this.scene.addEventListener('pointerdown', this.surDown);
    this.scene.addEventListener('pointermove', this.surMove);
    this.scene.addEventListener('pointerup', this.surUp);
    this.scene.addEventListener('pointercancel', this.surCancel);
    this.scene.addEventListener('wheel', this.surMolette, { passive: false });
    this.racine.querySelector('.vis-controles')!.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b) return;
      if (b.dataset.zoom === 'plus') this.zoomer(1.6);
      else if (b.dataset.zoom === 'moins') this.zoomer(1 / 1.6);
      else if (b.dataset.zoom === 'reset') this.appliquer({ s: 1, tx: 0, ty: 0 });
      else if (b.hasAttribute('data-plein-ecran')) this.pleinEcran(!this.racine.classList.contains('plein-ecran'));
    });
    this.observateur = new ResizeObserver(() => this.appliquer(this.t));
    this.observateur.observe(this.scene);
    this.appliquer(this.t);
  }

  /** Coordonnées écran → % de l'image, quel que soit le zoom. */
  versRelatif(clientX: number, clientY: number): Point {
    const r = this.scene.getBoundingClientRect();
    return ecranVersRelatif(clientX, clientY, rectTransforme({ left: r.left, top: r.top, width: r.width, height: r.height }, this.t));
  }

  /** % de l'image → px dans la scène (pour placer des éléments non zoomés). */
  versScene(p: Point): [number, number] {
    const r = this.scene.getBoundingClientRect();
    return relatifVersEcran(p, rectTransforme({ left: 0, top: 0, width: r.width, height: r.height }, this.t));
  }

  get transformation(): Transformation {
    return { ...this.t };
  }

  activer(oui: boolean): void {
    this.actif = oui;
    this.scene.classList.toggle('vis-inactive', !oui);
  }

  placerMarqueur(p: Point | null, etat: 'neutre' | 'bon' | 'faux' = 'neutre'): void {
    this.marqueur = p;
    this.marqueurEl.hidden = !p;
    this.marqueurEl.dataset.etat = etat;
    this.majMarqueur();
  }

  dessinerZones(zones: Array<{ points: Point[]; classe: string }>): void {
    this.svg.innerHTML = zones
      .map(({ points, classe }) => {
        const pts = points.map(([x, y]) => `${x},${y}`).join(' ');
        return `<g class="${classe}"><polygon class="halo" points="${pts}"/><polygon class="trait" points="${pts}"/></g>`;
      })
      .join('');
  }

  appliquer(t: Transformation): void {
    const r = this.scene.getBoundingClientRect();
    this.t = borner(t, r.width || 1, r.height || 1);
    this.calque.style.transform = `translate(${this.t.tx}px, ${this.t.ty}px) scale(${this.t.s})`;
    this.scene.classList.toggle('vis-zoomee', this.t.s > 1.001);
    this.majMarqueur();
  }

  zoomer(facteur: number, cx?: number, cy?: number): void {
    const r = this.scene.getBoundingClientRect();
    this.appliquer(zoomerAutour(this.t, facteur, cx ?? r.width / 2, cy ?? r.height / 2, r.width, r.height));
  }

  pleinEcran(oui: boolean): void {
    this.racine.classList.toggle('plein-ecran', oui);
    document.documentElement.classList.toggle('vis-plein-ecran', oui);
    const bouton = this.racine.querySelector<HTMLButtonElement>('[data-plein-ecran]')!;
    bouton.setAttribute('aria-pressed', String(oui));
    bouton.setAttribute('aria-label', oui ? 'Quitter le plein écran' : 'Afficher en plein écran');
    bouton.innerHTML = icone(oui ? 'reduire' : 'plein-ecran');
    if (oui) document.addEventListener('keydown', this.quitterPleinEcran);
    else document.removeEventListener('keydown', this.quitterPleinEcran);
    bouton.focus();
    this.appliquer({ s: 1, tx: 0, ty: 0 });
  }

  detruire(): void {
    this.pleinEcran(false);
    this.observateur.disconnect();
    this.racine.remove();
  }

  // ── Gestes ──────────────────────────────────────────────────────────
  private majMarqueur(): void {
    if (!this.marqueur) return;
    const [x, y] = this.versScene(this.marqueur);
    this.marqueurEl.style.transform = `translate(${x}px, ${y}px)`;
  }

  private local(e: PointerEvent): { x: number; y: number } {
    const r = this.scene.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private surDown = (e: PointerEvent): void => {
    if (this.options.ignorerCible?.(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.scene.setPointerCapture(e.pointerId);
    this.pointeurs.set(e.pointerId, this.local(e));
    if (this.pointeurs.size === 1) {
      this.debut = { ...this.local(e), temps: performance.now(), id: e.pointerId };
      this.multi = false;
      this.deplace = false;
    } else {
      this.multi = true;
    }
  };

  private surMove = (e: PointerEvent): void => {
    const avant = this.pointeurs.get(e.pointerId);
    if (!avant) return;
    const maintenant = this.local(e);

    if (this.pointeurs.size >= 2) {
      const [a, b] = [...this.pointeurs.values()];
      const autre = a === avant ? b : a;
      const dAvant = Math.hypot(avant.x - autre.x, avant.y - autre.y);
      const dApres = Math.hypot(maintenant.x - autre.x, maintenant.y - autre.y);
      const milieu = { x: (maintenant.x + autre.x) / 2, y: (maintenant.y + autre.y) / 2 };
      const milieuAvant = { x: (avant.x + autre.x) / 2, y: (avant.y + autre.y) / 2 };
      const r = this.scene.getBoundingClientRect();
      const zoome = zoomerAutour(this.t, dAvant > 0 ? dApres / dAvant : 1, milieu.x, milieu.y, r.width, r.height);
      this.appliquer({ ...zoome, tx: zoome.tx + (milieu.x - milieuAvant.x), ty: zoome.ty + (milieu.y - milieuAvant.y) });
      e.preventDefault();
    } else if (this.debut) {
      const distance = Math.hypot(maintenant.x - this.debut.x, maintenant.y - this.debut.y);
      if (distance > SEUIL_TAP) this.deplace = true;
      if (this.deplace && this.t.s > 1.001) {
        this.appliquer({ ...this.t, tx: this.t.tx + (maintenant.x - avant.x), ty: this.t.ty + (maintenant.y - avant.y) });
        e.preventDefault();
      }
    }
    this.pointeurs.set(e.pointerId, maintenant);
  };

  private surUp = (e: PointerEvent): void => {
    if (!this.pointeurs.has(e.pointerId)) return;
    const fin = this.local(e);
    this.pointeurs.delete(e.pointerId);
    const debut = this.debut;
    if (this.pointeurs.size > 0) return;
    this.debut = null;
    if (!debut || this.multi || this.deplace || performance.now() - debut.temps > 600) return;

    const maintenant = performance.now();
    const double =
      this.dernierTap && maintenant - this.dernierTap.temps < DELAI_DOUBLE && Math.hypot(fin.x - this.dernierTap.x, fin.y - this.dernierTap.y) < 30;
    if (double) {
      this.dernierTap = null;
      if (this.t.s > 1.5) this.appliquer({ s: 1, tx: 0, ty: 0 });
      else this.zoomer(2.5 / this.t.s, fin.x, fin.y);
      return;
    }
    this.dernierTap = { ...fin, temps: maintenant };
    if (this.actif && this.options.surTouche) {
      const r = this.scene.getBoundingClientRect();
      const p = this.versRelatif(r.left + fin.x, r.top + fin.y);
      if (p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100) this.options.surTouche(p);
    }
  };

  private surCancel = (e: PointerEvent): void => {
    this.pointeurs.delete(e.pointerId);
    if (this.pointeurs.size === 0) this.debut = null;
  };

  private surMolette = (e: WheelEvent): void => {
    // Pincement au pavé tactile (ctrlKey) ou molette en plein écran.
    if (!e.ctrlKey && !this.racine.classList.contains('plein-ecran')) return;
    e.preventDefault();
    const r = this.scene.getBoundingClientRect();
    this.zoomer(Math.exp(-e.deltaY / 300), e.clientX - r.left, e.clientY - r.top);
  };
}
