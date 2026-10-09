// Service worker — généré au build par scripts/integrations/service-worker.mjs.
// Site : pré-caché en entier à l'installation (cache « site-<version> »).
// Photos : uniquement celles de la voiture choisie. La page crée le cache
// « photos-<voiture> » au moment du choix ; ici on le remplit et on le sert.
const VERSION = '__VERSION__';
const BASE = '__BASE__';
const PRECACHE = __PRECACHE__;
const CACHE_SITE = 'site-' + VERSION;
const PREFIXE_PHOTOS = BASE + 'photos/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SITE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c.startsWith('site-') && c !== CACHE_SITE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (url.pathname.startsWith(BASE + 'editeur/')) return; // outil interne : toujours le réseau
  if (url.pathname.startsWith(PREFIXE_PHOTOS)) {
    event.respondWith(servirPhoto(requete, url));
    return;
  }
  event.respondWith(servirSite(requete, url));
});

async function servirSite(requete, url) {
  const cache = await caches.open(CACHE_SITE);
  // ignoreVary : les scripts modules et les polices partent avec un en-tête Origin
  // que la requête de pré-cache n'avait pas ; sans cela, « Vary » empêche la correspondance.
  const trouve = await cache.match(requete, { ignoreSearch: true, ignoreVary: true });
  if (trouve) return trouve;
  // « /fiche/26 » (sans barre finale) → « /fiche/26/ »
  if (requete.mode === 'navigate' && !url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    const avecBarre = await cache.match(url.pathname + '/', { ignoreVary: true });
    if (avecBarre) return avecBarre;
  }
  try {
    return await fetch(requete);
  } catch (erreur) {
    if (requete.mode === 'navigate') {
      const page404 = await cache.match(BASE + '404.html', { ignoreVary: true });
      if (page404) return page404;
    }
    throw erreur;
  }
}

async function servirPhoto(requete, url) {
  const voiture = url.pathname.slice(PREFIXE_PHOTOS.length).split('/')[0];
  const nomCache = 'photos-' + voiture;
  const actif = await caches.has(nomCache);
  const cache = actif ? await caches.open(nomCache) : null;
  if (cache) {
    const trouve = await cache.match(requete, { ignoreVary: true });
    if (trouve) return trouve;
  }
  try {
    const reponse = await fetch(requete);
    if (cache && reponse.ok) cache.put(requete, reponse.clone());
    return reponse;
  } catch (erreur) {
    // Hors ligne : n'importe quelle largeur ou format déjà en cache de la même photo.
    if (cache) {
      const racine = url.pathname.replace(/-\d+\.(webp|avif|jpe?g|png)$/i, '-');
      for (const cle of await cache.keys()) {
        if (new URL(cle.url).pathname.startsWith(racine)) return cache.match(cle, { ignoreVary: true });
      }
    }
    throw erreur;
  }
}
