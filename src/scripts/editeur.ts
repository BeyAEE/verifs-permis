// Éditeur de zones (outil interne). Circuit : choisir voiture/photo/fiche →
// dessiner → tester → enregistrer → exporter le JSON → committer.
import { pointDansPolygone, type Point } from '../lib/geometrie';
import { exporterVehicule, importerVehicule, nouvelId, validerVehicule } from '../lib/editeur-io';
import { nomDeBase, photoPublique, type DonneesVehicule, type IdVoiture, type Manifeste, type PhotoPublique, type Zone } from '../lib/vehicules';
import type { Fiche } from '../lib/fiches';
import { BASE, chargerFiches, echapper } from './commun';
import { Visionneuse } from './visionneuse';

interface DonneesEditeur {
  vehicules: Record<IdVoiture, DonneesVehicule>;
  manifeste: Manifeste;
  localisables: { fiches: Array<{ numero: number; element: string }>; aArbitrer: Array<{ numero: number; element: string }> };
}

const CLE_LOCALE = 'verifs-permis:editeur';
const racine = document.querySelector<HTMLElement>('[data-editeur]')!;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => racine.querySelector<T>(s)!;

const selVoiture = $<HTMLSelectElement>('#ed-voiture');
const selPhoto = $<HTMLSelectElement>('[data-photo]');
const selFiche = $<HTMLSelectElement>('[data-fiche]');
const champLibelle = $<HTMLInputElement>('#ed-libelle');
const champFiches = $<HTMLInputElement>('#ed-fiches');
const selGrosPlan = $<HTMLSelectElement>('#ed-gros-plan');
const conteneurPhoto = $('[data-zone-photo]');
const resultatTest = $('[data-resultat-test]');

let site: DonneesEditeur;
let fiches: Fiche[] = [];
let donnees: Record<IdVoiture, DonneesVehicule>;
let modifie = false;
let voiture: IdVoiture = 'clio5';
let photo: string | null = null;
const imagesLocales = new Map<string, PhotoPublique>(); // clé : voiture/fichier
let zoneId: string | null = null;
let points: Point[] = [];
let mode: 'dessin' | 'test' = 'dessin';
let vis: Visionneuse | null = null;
let poignees: HTMLElement[] = [];
let confirmationSuppression = 0;

// ── Persistance locale (évite de perdre un travail en cours) ─────────
function sauverLocal(): void {
  try {
    localStorage.setItem(CLE_LOCALE, JSON.stringify({ version: 1, donnees, modifie }));
  } catch {
    /* ignoré */
  }
}

function alerte(message: string | null): void {
  const el = $('[data-alerte]');
  el.hidden = !message;
  el.textContent = message ?? '';
}

function majEtat(): void {
  const d = donnees[voiture];
  const valides = d.zones.filter((z) => z.statut === 'valide').length;
  $('[data-etat]').textContent =
    `${d.vehicule.nom} · ${d.zones.length} zone(s) : ${valides} valide(s), ${d.zones.length - valides} brouillon(s)` +
    (modifie ? ' · modifications non exportées' : '');
}

function marquerModifie(): void {
  modifie = true;
  sauverLocal();
  majEtat();
}

// ── Listes déroulantes ──────────────────────────────────────────────
function remplirPhotos(): void {
  const d = donnees[voiture];
  if (!d.photos.length) {
    selPhoto.innerHTML = '<option value="">Aucune photo déclarée pour cette voiture</option>';
    photo = null;
    return;
  }
  selPhoto.innerHTML = d.photos
    .map((p) => {
      const publiee = !!site.manifeste[voiture]?.[nomDeBase(p.fichier)];
      return `<option value="${echapper(p.fichier)}">${echapper(p.fichier)} — ${p.role === 'vue-ensemble' ? 'vue d’ensemble' : 'gros plan'}${publiee ? '' : ' (pas encore publiée)'}</option>`;
    })
    .join('');
  const ensemble = d.photos.find((p) => p.role === 'vue-ensemble');
  photo = photo && d.photos.some((p) => p.fichier === photo) ? photo : (ensemble ?? d.photos[0]).fichier;
  selPhoto.value = photo;
  selGrosPlan.innerHTML =
    '<option value="">Aucun</option>' +
    d.photos
      .filter((p) => p.role === 'gros-plan')
      .map((p) => `<option value="${echapper(p.fichier)}">${echapper(p.fichier)}</option>`)
      .join('');
}

function remplirFiches(): void {
  const locs = new Map(site.localisables.fiches.map((l) => [l.numero, l.element]));
  const autres = fiches.filter((f) => f.type === 'exterieure' && !locs.has(f.numero));
  selFiche.innerHTML =
    `<optgroup label="Fiches localisables">${site.localisables.fiches
      .map((l) => `<option value="${l.numero}">Fiche ${l.numero} — ${echapper(l.element)}</option>`)
      .join('')}</optgroup>` +
    `<optgroup label="Autres vérifications extérieures">${autres.map((f) => `<option value="${f.numero}">Fiche ${f.numero}</option>`).join('')}</optgroup>`;
}

/** Fiches jumelles (même vérification) : 8 → [8, 70]. */
function jumelles(numero: number): number[] {
  const q = fiches[numero - 1]?.verification.question;
  return fiches.filter((f) => f.verification.question === q).map((f) => f.numero);
}

function majQuestion(): void {
  const f = fiches[Number(selFiche.value) - 1];
  $('[data-question-fiche]').textContent = f ? f.verification.question : '';
}

// ── Photo et dessin ─────────────────────────────────────────────────
function photoCourante(): PhotoPublique | null {
  if (!photo) return null;
  const locale = imagesLocales.get(`${voiture}/${photo}`);
  if (locale) return locale;
  const d = donnees[voiture];
  const p = d.photos.find((x) => x.fichier === photo);
  const construite = p && site.manifeste[voiture]?.[nomDeBase(p.fichier)];
  return p && construite ? photoPublique(BASE, voiture, p, construite) : null;
}

function zonesDeLaPhoto(): Zone[] {
  return donnees[voiture].zones.filter((z) => z.photo === photo);
}

function afficherPhoto(): void {
  vis?.detruire();
  vis = null;
  poignees = [];
  conteneurPhoto.innerHTML = '';
  const p = photoCourante();
  if (!p) {
    conteneurPhoto.innerHTML = `<p class="doux">${
      photo
        ? 'Cette photo n’est pas encore publiée. Lance « npm run images » après l’avoir mise dans photos-source/, ou ouvre-la depuis ton appareil avec le lien ci-dessus.'
        : 'Aucune photo pour cette voiture.'
    }</p>`;
    return;
  }
  vis = new Visionneuse(conteneurPhoto, {
    photo: p,
    surTouche: surTouche,
    ignorerCible: (cible) => cible instanceof HTMLElement && cible.classList.contains('poignee'),
    surTransformation: placerPoignees,
  });
  dessiner();
}

function dessiner(): void {
  if (!vis) return;
  const autres = zonesDeLaPhoto()
    .filter((z) => z.id !== zoneId)
    .map((z) => ({ points: z.polygone, classe: 'zone-autre' }));
  const courante = points.length >= 2 ? [{ points, classe: 'zone-editee' }] : [];
  vis.dessinerZones([...autres, ...courante]);
  // Poignées : une par sommet, recréées seulement si leur nombre change.
  if (poignees.length !== points.length || mode === 'test') {
    poignees.forEach((p) => p.remove());
    poignees = mode === 'test' ? [] : points.map((_, i) => creerPoignee(i));
  }
  placerPoignees();
}

function creerPoignee(i: number): HTMLElement {
  const el = document.createElement('span');
  el.className = 'poignee' + (i === 0 ? ' premiere' : '');
  el.setAttribute('aria-hidden', 'true');
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId) || !vis) return;
    const [x, y] = vis.versRelatif(e.clientX, e.clientY);
    points[i] = [Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y))];
    dessiner();
  });
  el.addEventListener('pointerup', (e) => el.releasePointerCapture(e.pointerId));
  vis!.scene.append(el);
  return el;
}

function placerPoignees(): void {
  if (!vis) return;
  poignees.forEach((el, i) => {
    const [x, y] = vis!.versScene(points[i]);
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
}

function surTouche(p: Point): void {
  if (mode === 'dessin') {
    points.push(p);
    dessiner();
    return;
  }
  // Mode test : comme un élève.
  vis!.placerMarqueur(p);
  const candidates = [...zonesDeLaPhoto().filter((z) => z.id !== zoneId), ...(points.length >= 3 ? [{ id: zoneId ?? '(en cours)', libelle: champLibelle.value || 'Zone en cours', polygone: points, fiches: lireFiches() } as Zone] : [])];
  const touchees = candidates.filter((z) => pointDansPolygone(p, z.polygone));
  const numero = Number(selFiche.value);
  const bonne = touchees.some((z) => z.fiches.includes(numero));
  vis!.placerMarqueur(p, bonne ? 'bon' : 'faux');
  vis!.dessinerZones(candidates.map((z) => ({ points: z.polygone, classe: touchees.includes(z) ? 'zone-bonne' : 'zone-autre' })));
  resultatTest.textContent = touchees.length
    ? `${bonne ? '✓ Bonne réponse pour la fiche ' + numero : '✗ Pas la fiche ' + numero} : ${touchees.map((z) => `« ${z.libelle} » (fiches ${z.fiches.join(', ')})`).join(', ')}`
    : `✗ Hors de toute zone (${p[0].toFixed(1)} %, ${p[1].toFixed(1)} %)`;
}

// ── Formulaire de zone ──────────────────────────────────────────────
function lireFiches(): number[] {
  return [...new Set(champFiches.value.split(/[\s,;]+/).filter(Boolean).map(Number))].filter((n) => Number.isInteger(n) && n >= 1 && n <= 100);
}

function statut(): 'brouillon' | 'valide' {
  return (racine.querySelector<HTMLInputElement>('input[name="ed-statut"]:checked')?.value as 'brouillon' | 'valide') ?? 'brouillon';
}

function chargerZone(z: Zone | null): void {
  zoneId = z?.id ?? null;
  points = z ? z.polygone.map(([x, y]) => [x, y] as Point) : [];
  champLibelle.value = z?.libelle ?? '';
  champFiches.value = (z?.fiches ?? jumelles(Number(selFiche.value))).join(', ');
  selGrosPlan.value = z?.grosPlan ?? '';
  racine.querySelector<HTMLInputElement>(`input[name="ed-statut"][value="${z?.statut ?? 'brouillon'}"]`)!.checked = true;
  $('[data-supprimer]').hidden = !z;
  if (z && z.fiches.length) selFiche.value = String(z.fiches[0]);
  majQuestion();
  resultatTest.textContent = '';
  vis?.placerMarqueur(null);
  dessiner();
  listerZones();
}

function listerZones(): void {
  const zones = zonesDeLaPhoto();
  $('[data-zones]').innerHTML = zones.length
    ? zones
        .map(
          (z) => `<li><button type="button" data-zone="${echapper(z.id)}" aria-current="${z.id === zoneId}">
            <span><strong>${echapper(z.libelle)}</strong><br><small class="doux">Fiches ${z.fiches.join(', ')} · ${z.polygone.length} points</small></span>
            <span class="statut pastille ${z.statut === 'valide' ? 'statut-valide' : ''}">${z.statut}</span>
          </button></li>`,
        )
        .join('')
    : '<li class="doux">Aucune zone sur cette photo pour l’instant.</li>';
}

function enregistrer(): void {
  const numeros = lireFiches();
  const erreurs = [];
  if (!photo) erreurs.push('choisis une photo');
  if (points.length < 3) erreurs.push('trace au moins 3 points');
  if (!champLibelle.value.trim()) erreurs.push('donne un libellé');
  if (!numeros.length) erreurs.push('indique au moins une fiche');
  if (erreurs.length) {
    alerte('Impossible d’enregistrer : ' + erreurs.join(', ') + '.');
    return;
  }
  alerte(null);
  const d = donnees[voiture];
  const zone: Zone = {
    id: zoneId ?? nouvelId(champLibelle.value, d.zones.map((z) => z.id)),
    fiches: numeros,
    photo: photo!,
    polygone: points.map(([x, y]) => [x, y] as Point),
    libelle: champLibelle.value.trim(),
    grosPlan: selGrosPlan.value || null,
    statut: statut(),
  };
  const i = d.zones.findIndex((z) => z.id === zone.id);
  if (i >= 0) d.zones[i] = zone;
  else d.zones.push(zone);
  zoneId = zone.id;
  marquerModifie();
  $('[data-supprimer]').hidden = false;
  listerZones();
  dessiner();
  $('[data-etat]').textContent += ` · « ${zone.libelle} » enregistrée`;
}

// ── Import / export ─────────────────────────────────────────────────
function exporter(): string | null {
  const v = validerVehicule(donnees[voiture]);
  if (!v.ok) {
    alerte('Le fichier n’est pas valide : ' + v.erreurs.join(' '));
    return null;
  }
  alerte(null);
  return exporterVehicule(v.donnees);
}

async function importer(fichier: File): Promise<void> {
  const v = importerVehicule(await fichier.text());
  if (!v.ok) {
    alerte('Import refusé : ' + v.erreurs.join(' '));
    return;
  }
  donnees[v.donnees.vehicule.id] = v.donnees;
  voiture = v.donnees.vehicule.id;
  selVoiture.value = voiture;
  marquerModifie();
  alerte(null);
  changerVoiture();
  $('[data-etat]').textContent += ` · fichier « ${fichier.name} » importé`;
}

function changerVoiture(): void {
  voiture = selVoiture.value as IdVoiture;
  photo = null;
  remplirPhotos();
  afficherPhoto();
  chargerZone(null);
  majEtat();
}

// ── Événements ──────────────────────────────────────────────────────
selVoiture.addEventListener('change', changerVoiture);
selPhoto.addEventListener('change', () => {
  photo = selPhoto.value || null;
  afficherPhoto();
  chargerZone(null);
});
selFiche.addEventListener('change', () => {
  majQuestion();
  if (!zoneId) champFiches.value = jumelles(Number(selFiche.value)).join(', ');
});
racine.querySelectorAll<HTMLInputElement>('input[name="ed-mode"]').forEach((r) =>
  r.addEventListener('change', () => {
    mode = r.value as 'dessin' | 'test';
    $('[data-outils-dessin]').hidden = mode === 'test';
    $('[data-formulaire]').hidden = mode === 'test';
    $('[data-aide-mode]').textContent =
      mode === 'dessin'
        ? 'Touche la photo pour ajouter des points. Fais glisser un point pour l’ajuster. Pince pour zoomer.'
        : 'Touche la photo comme le ferait un élève : le résultat s’affiche en dessous.';
    resultatTest.textContent = '';
    vis?.placerMarqueur(null);
    dessiner();
  }),
);
$('[data-annuler-point]').addEventListener('click', () => {
  points.pop();
  dessiner();
});
$('[data-effacer]').addEventListener('click', () => {
  points = [];
  dessiner();
});
$('[data-enregistrer]').addEventListener('click', enregistrer);
$('[data-nouvelle]').addEventListener('click', () => chargerZone(null));
$('[data-supprimer]').addEventListener('click', (e) => {
  const bouton = e.currentTarget as HTMLButtonElement;
  if (Date.now() - confirmationSuppression > 4000) {
    confirmationSuppression = Date.now();
    bouton.textContent = 'Confirmer la suppression';
    window.setTimeout(() => (bouton.textContent = 'Supprimer cette zone'), 4000);
    return;
  }
  donnees[voiture].zones = donnees[voiture].zones.filter((z) => z.id !== zoneId);
  bouton.textContent = 'Supprimer cette zone';
  marquerModifie();
  chargerZone(null);
});
$('[data-zones]').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-zone]');
  if (b) chargerZone(donnees[voiture].zones.find((z) => z.id === b.dataset.zone) ?? null);
});
$<HTMLInputElement>('[data-importer]').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) void importer(f);
  (e.target as HTMLInputElement).value = '';
});
$<HTMLInputElement>('[data-image-locale]').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f || !photo) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    const p = donnees[voiture].photos.find((x) => x.fichier === photo)!;
    imagesLocales.set(`${voiture}/${photo}`, {
      fichier: p.fichier,
      alt: p.alt,
      role: p.role,
      largeur: img.naturalWidth,
      hauteur: img.naturalHeight,
      src: url,
      srcset: { webp: '', avif: null },
    });
    afficherPhoto();
  };
  img.src = url;
});
$('[data-exporter]').addEventListener('click', () => {
  const texte = exporter();
  if (!texte) return;
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
  lien.download = `${voiture}.json`;
  lien.click();
  URL.revokeObjectURL(lien.href);
  modifie = false;
  sauverLocal();
  majEtat();
  $('[data-etat]').textContent += ` · ${voiture}.json téléchargé : remplace src/data/vehicules/${voiture}.json puis committe`;
});
$('[data-copier]').addEventListener('click', async () => {
  const texte = exporter();
  if (!texte) return;
  try {
    await navigator.clipboard.writeText(texte);
    $('[data-etat]').textContent += ' · JSON copié';
  } catch {
    alerte('Copie impossible ici : utilise « Exporter ».');
  }
});
$('[data-reinitialiser]').addEventListener('click', () => {
  localStorage.removeItem(CLE_LOCALE);
  donnees = structuredClone(site.vehicules);
  modifie = false;
  alerte(null);
  changerVoiture();
});

// ── Démarrage ───────────────────────────────────────────────────────
Promise.all([fetch(BASE + 'editeur/donnees.json').then((r) => r.json() as Promise<DonneesEditeur>), chargerFiches()]).then(([d, f]) => {
  site = d;
  fiches = f;
  donnees = structuredClone(d.vehicules);
  try {
    const local = JSON.parse(localStorage.getItem(CLE_LOCALE) ?? 'null');
    if (local?.version === 1 && local.modifie) {
      donnees = local.donnees;
      modifie = true;
      alerte('Tes modifications non exportées ont été restaurées. Pense à exporter le fichier.');
    }
  } catch {
    /* ignoré */
  }
  remplirFiches();
  changerVoiture();
});
