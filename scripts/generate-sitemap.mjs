/**
 * GÉNÉRATEUR DE SITEMAP DYNAMIQUE (build-time, équivalent Next.js sitemap.ts)
 * Lit les identifiants produits depuis src/data/products.ts et écrit
 * public/sitemap.xml — chaque produit du catalogue entre dans l'index Google.
 */
import { readFileSync, writeFileSync } from 'fs';

const BASE = process.env.SITE_URL ?? 'https://oryam-cosmetics.vercel.app';

const src = readFileSync('src/data/products.ts', 'utf8');
const ids = [...src.matchAll(/id:\s*'([a-z0-9-]+)'/g)]
  .map((m) => m[1])
  .filter((v, i, a) => a.indexOf(v) === i && !v.startsWith('v-'));

const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: BASE, priority: '1.0', freq: 'daily' },
  { loc: `${BASE}/wishlist`, priority: '0.5', freq: 'weekly' },
  ...ids.map((id) => ({ loc: `${BASE}/produit/${id}`, priority: '0.8', freq: 'weekly' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap.xml généré : ${urls.length} URLs (${ids.length} produits)`);
