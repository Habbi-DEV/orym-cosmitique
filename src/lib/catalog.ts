import type { CatalogProduct } from './types';

/** Transforme un nom de catégorie en slug d'URL (ex. "Soins lèvres" -> "soins-levres") */
export const slugifyCategory = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');

export interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
  image: string;
}

/** Liste des catégories distinctes présentes dans le catalogue actif, triées par nombre de produits */
export const getCategories = (catalog: CatalogProduct[]): CategoryInfo[] => {
  const map = new Map<string, CategoryInfo>();
  catalog
    .filter((p) => p.isActive && p.category)
    .forEach((p) => {
      const slug = slugifyCategory(p.category);
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { name: p.category, slug, count: 1, image: p.images[0] });
      }
    });
  return [...map.values()].sort((a, b) => b.count - a.count);
};

export type SortKey = 'pertinence' | 'prix-asc' | 'prix-desc' | 'note';

export const SORT_LABELS: Record<SortKey, string> = {
  pertinence: 'Pertinence',
  'prix-asc': 'Prix croissant',
  'prix-desc': 'Prix décroissant',
  note: 'Mieux notés',
};

export const sortProducts = <T extends { price: number; rating: number }>(
  list: T[],
  key: SortKey,
): T[] => {
  const arr = [...list];
  switch (key) {
    case 'prix-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'prix-desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'note':
      return arr.sort((a, b) => b.rating - a.rating);
    default:
      return arr;
  }
};
