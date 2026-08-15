/**
 * Service worker minimal — rend le site installable (PWA) et offre une
 * résilience de base hors-ligne, SANS risquer de servir une version périmée
 * du site après un déploiement Vercel (stratégie "network-first").
 *
 * - Navigation (pages) : toujours le réseau en priorité ; le cache ne sert
 *   que si le réseau est indisponible (mode hors-ligne).
 * - Images produits (/img/) : cache-first (elles changent rarement et ça
 *   accélère les visites répétées).
 * - Tout le reste (JS/CSS générés par Vite, hashés par build) : réseau en
 *   priorité, avec repli cache en cas d'échec.
 *
 * Le nom du cache est versionné : à chaque changement de ce fichier,
 * incrémenter CACHE_VERSION pour forcer le nettoyage des anciens caches.
 */
const CACHE_VERSION = 'oryam-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ne pas intercepter Supabase, Meta Pixel, etc.

  const isImage = url.pathname.startsWith('/img/');

  if (isImage) {
    // Cache-first pour les images produits.
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Network-first pour tout le reste (pages, JS/CSS de build).
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
  );
});
