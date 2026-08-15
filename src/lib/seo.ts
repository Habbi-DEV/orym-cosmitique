/**
 * SEO léger — sans dépendance (pas de react-helmet).
 * Met à jour <title>, meta description, canonical, Open Graph/Twitter
 * et injecte un bloc JSON-LD (schema.org) par page.
 *
 * Limite connue : ceci s'exécute côté client (après hydratation React).
 * Google (qui exécute le JS) en profite pour l'indexation, mais les
 * "crawlers" qui ne lisent que le HTML brut (aperçu de lien WhatsApp,
 * Facebook au premier partage, etc.) verront les balises par défaut
 * définies dans index.html. Pour un OG dynamique par produit (image du
 * produit dans l'aperçu WhatsApp), il faudra un rendu côté serveur ou
 * une pré-génération statique — améliorable dans un second temps.
 */

import { useEffect } from 'react';

const SITE_NAME = 'ORYAM Cosmetics';
const DEFAULT_IMAGE = '/img/hero.png';

export const siteUrl = (): string => {
  if (typeof window === 'undefined') return 'https://oryam-cosmetics.vercel.app';
  return window.location.origin;
};

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (url: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
};

const JSON_LD_ID = 'oryam-jsonld';

const setJsonLd = (data: object | null) => {
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = JSON_LD_ID;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

export interface SeoInput {
  title: string;
  description: string;
  path?: string; // ex. '/produit/serum-eclat' — défaut : URL courante
  image?: string; // chemin absolu ou relatif à la racine du site
  type?: 'website' | 'product' | 'article';
  jsonLd?: object | null;
}

/** Hook pratique : applique le SEO au montage / à chaque changement de deps. */
export function useSEO(input: SeoInput, deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    applySEO(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function applySEO({ title, description, path, image, type = 'website', jsonLd }: SeoInput) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  document.title = fullTitle;

  setMeta('name', 'description', description);

  const url = `${siteUrl()}${path ?? window.location.pathname}`;
  setCanonical(url);

  const img = image ? (image.startsWith('http') ? image : `${siteUrl()}${image}`) : `${siteUrl()}${DEFAULT_IMAGE}`;

  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', img);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', img);

  setJsonLd(jsonLd ?? null);
}
