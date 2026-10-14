// Animation « l'examen en 1 minute » : une horloge unique `t` (en secondes) pilote
// toutes les scènes, ce qui permet pause, reprise et rendu image par image.
// Mouvement réduit : chaque scène s'affiche directement dans son état final.

interface Scene {
  titre: string;
  sousTitre: string;
  duree: number;
  /** p : avancement de la scène (0 → 1) ; s : secondes écoulées dans la scène. */
  dessiner: (p: number, s: number) => void;
}

const racine = document.querySelector<HTMLElement>('[data-animation-examen]');
if (racine) initialiser(racine);

function initialiser(racine: HTMLElement): void {
  const svg = racine.querySelector('svg')!;
  const a = <T extends SVGElement = SVGElement>(nom: string) => svg.querySelector<T>(`[data-a="${nom}"]`)!;
  const groupes = [...svg.querySelectorAll<SVGGElement>('[data-scene]')];
  const titre = a<SVGTextElement>('titre');
  const sousTitre = racine.querySelector<HTMLElement>('[data-sous-titre]')!;
  const lancer = racine.querySelector<HTMLButtonElement>('[data-lancer]')!;
  const pause = racine.querySelector<HTMLButtonElement>('[data-pause]')!;
  const recommencer = racine.querySelector<HTMLButtonElement>('[data-recommencer]')!;
  const avancement = racine.querySelector<HTMLElement>('[data-avancement] > div')!;
  const temps = racine.querySelector<HTMLElement>('[data-temps]')!;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  // ── Outils ────────────────────────────────────────────────────────────
  const borne = (v: number) => Math.min(1, Math.max(0, v));
  const entre = (p: number, debut: number, fin: number) => borne((p - debut) / (fin - debut));
  const sortie = (x: number) => 1 - (1 - x) ** 3; // décélération
  const douce = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  const rebond = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2; // dépasse un peu puis revient
  const opacite = (el: Element, v: number) => el.setAttribute('opacity', v.toFixed(3));
  const echelle = (el: Element, s: number, cx: number, cy: number, dx = 0, dy = 0) =>
    el.setAttribute('transform', `translate(${(cx + dx).toFixed(1)} ${(cy + dy).toFixed(1)}) scale(${Math.max(0, s).toFixed(3)}) translate(${-cx} ${-cy})`);
  const pop = (el: Element, x: number, cx: number, cy: number) => {
    echelle(el, x <= 0 ? 0 : x >= 1 ? 1 : rebond(x), cx, cy);
    opacite(el, borne(x * 4));
  };
  /** Arrivée glissée avec rebond (depuis dx, dy). */
  const arrivee = (el: Element, x: number, dx: number, dy: number) => {
    const r = x <= 0 ? 0 : x >= 1 ? 1 : rebond(x);
    el.setAttribute('transform', `translate(${(dx * (1 - r)).toFixed(1)} ${(dy * (1 - r)).toFixed(1)})`);
    opacite(el, borne(x * 3));
  };
  const placerSurChemin = (voiture: Element, chemin: SVGPathElement, k: number, taille = 1.3) => {
    const long = chemin.getTotalLength();
    const d = long * borne(k);
    const p1 = chemin.getPointAtLength(Math.max(0, d - 1));
    const p2 = chemin.getPointAtLength(Math.min(long, d + 1));
    const p = chemin.getPointAtLength(d);
    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    voiture.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${taille})`);
  };
  const tracer = (chemin: SVGPathElement, k: number) => {
    const long = chemin.getTotalLength();
    chemin.setAttribute('stroke-dasharray', `${long} ${long}`);
    chemin.setAttribute('stroke-dashoffset', `${long * (1 - borne(k))}`);
  };
  /** Les tirets de la route défilent tant que la voiture roule. */
  const defiler = (tirets: Element, s: number) => tirets.setAttribute('stroke-dashoffset', (-s * 90).toFixed(1));
  const bezier = (t: number, p0: number, p1: number, p2: number) => (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;

  // Confettis : petites pièces lancées en gerbe, retombant avec la gravité.
  const COULEURS = ['#db1418', '#14a856', '#ffffff', '#8fb8ff', '#ffcf3f'];
  function creerConfettis(groupe: Element): SVGRectElement[] {
    return Array.from({ length: 22 }, (_, i) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('width', i % 3 ? '7' : '5');
      r.setAttribute('height', i % 2 ? '11' : '7');
      r.setAttribute('rx', '1.5');
      r.setAttribute('fill', COULEURS[i % COULEURS.length]);
      r.setAttribute('opacity', '0');
      groupe.appendChild(r);
      return r;
    });
  }
  function gerbe(pieces: SVGRectElement[], cx: number, cy: number, tau: number): void {
    pieces.forEach((r, i) => {
      if (tau <= 0 || tau >= 1.3) {
        r.setAttribute('opacity', '0');
        return;
      }
      const angle = -Math.PI / 2 + ((i / pieces.length) - 0.5) * Math.PI * 1.6 + ((i * 37) % 10) / 40;
      const vitesse = 170 + ((i * 53) % 7) * 22;
      const x = cx + Math.cos(angle) * vitesse * tau;
      const y = cy + Math.sin(angle) * vitesse * tau + 260 * tau * tau;
      r.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((i * 47 + tau * 540) % 360).toFixed(0)})`);
      r.setAttribute('opacity', borne(1.6 - tau * 1.4).toFixed(2));
    });
  }
  const confettis7 = creerConfettis(a('confettis-7'));
  const confettis8 = creerConfettis(a('confettis-8'));
  const chiffres = [0, 1, 2, 3, 4].map((i) => a<SVGTextElement>(`chiffre-${i}`));
  const KM = '54726';

  // ── Scènes ────────────────────────────────────────────────────────────
  const scenes: Scene[] = [
    {
      titre: 'L’examen du permis B',
      sousTitre: 'L’épreuve pratique dure 32 minutes en tout.',
      duree: 4.5,
      dessiner: (p) => {
        const k = douce(entre(p, 0.08, 0.62));
        a('chrono').setAttribute('stroke-dashoffset', (490.1 * (1 - k)).toFixed(1));
        a('minutes').textContent = String(Math.round(32 * k));
        // Petit « boum » quand le chrono est plein.
        const boum = entre(p, 0.62, 0.85);
        echelle(a('cadran'), 1 + 0.09 * Math.sin(Math.PI * boum), 240, 200);
      },
    },
    {
      titre: 'Accueil et installation',
      sousTitre: 'L’inspecteur vérifie ton identité et te demande si tu portes des lunettes ou des lentilles, puis tu t’installes.',
      duree: 5,
      dessiner: (p) => {
        [1, 2, 3].forEach((i) => {
          const debut = 0.04 + (i - 1) * 0.18;
          arrivee(a(`icone-${i}`), entre(p, debut, debut + 0.2), 0, -40);
          pop(a(`coche-${i}`), entre(p, debut + 0.16, debut + 0.32), [132, 282, 432][i - 1], 122);
        });
      },
    },
    {
      titre: 'Au moins 25 min de conduite',
      sousTitre: 'L’inspecteur est à côté de toi, ton moniteur à l’arrière.',
      duree: 6,
      dessiner: (p, s) => {
        const k = douce(entre(p, 0.04, 0.9));
        tracer(a<SVGPathElement>('route-1'), k);
        placerSurChemin(a('voiture-1'), a<SVGPathElement>('route-1'), k);
        if (k < 1) defiler(a('tirets-3'), s);
        const minutes = Math.round(25 * k);
        a('compteur-25').textContent = `${minutes} min`;
        echelle(a('compteur-25'), 1 + 0.12 * entre(p, 0.88, 0.93) * (1 - entre(p, 0.93, 1)), 420, 92);
      },
    },
    {
      titre: 'Environ 5 min en autonomie',
      sousTitre: 'Pendant la conduite autonome, tu suis seul l’itinéraire indiqué par l’inspecteur.',
      duree: 5.5,
      dessiner: (p, s) => {
        pop(a('panneau'), entre(p, 0.04, 0.24), 124, 160);
        const k = douce(entre(p, 0.16, 0.92));
        tracer(a<SVGPathElement>('route-2'), k);
        placerSurChemin(a('voiture-2'), a<SVGPathElement>('route-2'), k);
        if (k < 1) defiler(a('tirets-4'), s);
      },
    },
    {
      titre: 'Deux manœuvres',
      sousTitre: 'Un freinage pour t’arrêter avec précision, puis une marche arrière : créneau, épi, bataille…',
      duree: 8,
      dessiner: (p) => {
        const voiture = a('voiture-3');
        const premiere = p < 0.48;
        opacite(a('arret'), premiere ? 1 : 1 - entre(p, 0.48, 0.54));
        arrivee(a('places'), entre(p, 0.5, 0.62), 0, -30);
        if (premiere) {
          // Freinage : la voiture arrive vite, ralentit et s'arrête pile devant la ligne (léger tangage).
          const x = 40 + (334 - 40) * sortie(entre(p, 0.02, 0.32));
          const tangage = Math.sin(entre(p, 0.32, 0.4) * Math.PI) * 3;
          voiture.setAttribute('transform', `translate(${x.toFixed(1)} 251) rotate(${tangage.toFixed(1)}) scale(1.3)`);
          pop(a('coche-arret'), entre(p, 0.33, 0.43), 388, 200);
        } else if (p < 0.6) {
          // On dépasse la place en marche avant…
          const x = 334 + (430 - 334) * douce(entre(p, 0.48, 0.6));
          voiture.setAttribute('transform', `translate(${x.toFixed(1)} 251) scale(1.3)`);
        } else {
          // … puis marche arrière en bataille dans la place du milieu : l'avant finit tourné vers la route.
          const r = douce(entre(p, 0.62, 0.92));
          const x = bezier(r, 430, 365, 365);
          const y = bezier(r, 251, 251, 132);
          voiture.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(90 * r).toFixed(1)}) scale(1.3)`);
        }
      },
    },
    {
      titre: 'Les vérifications',
      sousTitre: 'À l’arrêt : une vérification, une question de sécurité routière et une de premiers secours. 1 point chacune.',
      duree: 7,
      dessiner: (p, s) => {
        arrivee(a('compteur-km'), entre(p, 0, 0.1), 0, -24);
        // Le compteur défile puis s'arrête chiffre par chiffre sur 54 726.
        chiffres.forEach((c, i) => {
          const arret = 0.1 + i * 0.05;
          c.textContent = p >= arret ? KM[i] : String(Math.floor(s * 22 + i * 3) % 10);
        });
        pop(a('fiche-26'), entre(p, 0.36, 0.46), 240, 168);
        [1, 2, 3].forEach((i) => arrivee(a(`carte-${i}`), entre(p, 0.46 + (i - 1) * 0.1, 0.6 + (i - 1) * 0.1), 0, 60));
      },
    },
    {
      titre: 'Pour être reçu',
      sousTitre: 'Au moins 20 points sur 31, et aucune erreur éliminatoire.',
      duree: 6,
      dessiner: (p) => {
        const points = 24 * sortie(entre(p, 0.04, 0.55));
        a('barre').setAttribute('width', ((400 * points) / 31).toFixed(1));
        a('score').textContent = `${Math.round(points)} / 31`;
        // Le seuil de 20 est franchi : confettis et petit saut du score.
        const franchi = entre(p, 0.3, 0.42);
        echelle(a('score'), 1 + 0.14 * Math.sin(Math.PI * franchi), 240, 220);
        gerbe(confettis7, 298, 150, (p - 0.3) * 6);
        arrivee(a('zero-elim'), entre(p, 0.6, 0.75), -40, 0);
      },
    },
    {
      titre: 'Le résultat',
      sousTitre: 'Pas de résultat sur place : il arrive en ligne dès le lendemain.',
      duree: 5.5,
      dessiner: (p) => {
        arrivee(a('telephone'), entre(p, 0, 0.18), -60, 0);
        pop(a('favorable'), entre(p, 0.16, 0.32), 105, 188);
        gerbe(confettis8, 105, 188, (p - 0.2) * 5.5);
        arrivee(a('en-ligne'), entre(p, 0.3, 0.45), 60, 0);
        arrivee(a('cepc'), entre(p, 0.5, 0.65), 60, 0);
      },
    },
  ];
  const debuts = scenes.reduce<number[]>((acc, _s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + scenes[i - 1].duree], []);
  const total = debuts[debuts.length - 1] + scenes[scenes.length - 1].duree;
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  temps.textContent = mmss(total);

  // ── Rendu d'un instant ───────────────────────────────────────────────
  const ENTREE = 0.4;
  const SORTIE = 0.3;
  let sceneAffichee = -1;
  function rendre(t: number): void {
    let i = debuts.findIndex((d, n) => t >= d && t < d + scenes[n].duree);
    if (i === -1) i = scenes.length - 1;
    const scene = scenes[i];
    const local = t - debuts[i];
    const p = reduit ? 1 : borne(local / scene.duree);
    // Transition : la scène arrive en glissant de la droite, repart vers la gauche.
    const e = reduit ? 1 : borne(local / ENTREE);
    const x = reduit || i === scenes.length - 1 ? 0 : entre(local, scene.duree - SORTIE, scene.duree);
    const decalage = 50 * (1 - sortie(e)) - 50 * x * x;
    const visible = e * (1 - x);
    groupes.forEach((g, n) => {
      g.style.display = n === i ? '' : 'none';
      if (n !== i) return;
      g.setAttribute('opacity', visible.toFixed(3));
      g.setAttribute('transform', `translate(${decalage.toFixed(1)} 0)`);
    });
    // Le titre descend légèrement en apparaissant.
    titre.setAttribute('opacity', visible.toFixed(3));
    titre.setAttribute('transform', `translate(0 ${(-12 * (1 - sortie(e))).toFixed(1)})`);
    scene.dessiner(p, reduit ? scene.duree : local);
    if (i !== sceneAffichee) {
      sceneAffichee = i;
      titre.textContent = scene.titre;
      sousTitre.textContent = scene.sousTitre;
    }
    avancement.style.width = `${(100 * Math.min(t, total)) / total}%`;
    temps.textContent = `${mmss(Math.min(t, total))} / ${mmss(total)}`;
  }

  // ── Lecture ──────────────────────────────────────────────────────────
  let t = 0;
  let enLecture = false;
  let precedent = 0;
  let image = 0;

  function boucle(maintenant: number): void {
    t += Math.min(0.1, (maintenant - precedent) / 1000); // pas de saut après un ralentissement
    precedent = maintenant;
    if (t >= total) {
      t = total;
      rendre(t);
      arreter();
      return;
    }
    rendre(t);
    image = requestAnimationFrame(boucle);
  }
  function lire(): void {
    if (t >= total) t = 0;
    enLecture = true;
    precedent = performance.now();
    image = requestAnimationFrame(boucle);
    majBoutons();
  }
  function arreter(): void {
    enLecture = false;
    cancelAnimationFrame(image);
    majBoutons();
  }
  function majBoutons(): void {
    pause.setAttribute('aria-label', enLecture ? 'Mettre en pause' : t >= total ? 'Revoir' : 'Reprendre');
    pause.querySelector('[data-icone-pause]')!.toggleAttribute('hidden', !enLecture);
    pause.querySelector('[data-icone-lecture]')!.toggleAttribute('hidden', enLecture);
  }

  lancer.addEventListener('click', () => {
    lancer.hidden = true;
    pause.hidden = false;
    recommencer.hidden = false;
    t = 0;
    lire();
    pause.focus({ preventScroll: true });
  });
  pause.addEventListener('click', () => (enLecture ? arreter() : lire()));
  recommencer.addEventListener('click', () => {
    t = 0;
    rendre(t);
    if (!enLecture) lire();
  });
  // Onglet caché : on met en pause pour ne pas consommer la batterie.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && enLecture) arreter();
  });

  // Image d'attente : la première scène, chrono plein, sous le bouton « Voir ».
  rendre(4.1);

  // Pour l'export vidéo (enregistrement image par image) : ?rendu=1
  if (new URLSearchParams(location.search).has('rendu')) {
    lancer.hidden = true;
    (window as unknown as { animationExamen: unknown }).animationExamen = { total, rendre };
  }
}
