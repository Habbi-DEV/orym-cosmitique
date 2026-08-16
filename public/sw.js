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

// Ouvert UNE SEULE fois (au lieu de caches.open() à chaque requête image),
// et réutilisé pour toutes les requêtes suivantes — évite l'overhead IPC
// répété qui ralentissait le chargement des images.
let cachePromise = caches.open(CACHE_VERSION);

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
    // Cache-first pour les images produits, cache ouvert une seule fois.
    event.respondWith(
      cachePromise.then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached; // hit → réponse immédiate, aucun accès réseau
        const res = await fetch(request);
        // écriture en cache en arrière-plan, ne bloque pas la réponse
        if (res.ok) event.waitUntil(cache.put(request, res.clone()));
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
          cachePromise.then((cache) => cache.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
  );
});
