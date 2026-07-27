import { describe, it, expect } from 'vitest';
import { slugifyCategory, sortProducts, getCategories } from '../catalog';
import type { CatalogProduct } from '../types';

describe('slugifyCategory', () => {
  it('convertit les accents et espaces', () => {
    expect(slugifyCategory('Soins lèvres')).toBe('soins-levres');
  });

  it('gère déjà un slug simple', () => {
    expect(slugifyCategory('Sérums')).toBe('serums');
  });

  it('retire les tirets en trop', () => {
    expect(slugifyCategory('  Crèmes !!  ')).toBe('cremes');
  });
});

describe('sortProducts', () => {
  const items = [
    { id: 'a', price: 300, rating: 4.2 },
    { id: 'b', price: 100, rating: 4.9 },
    { id: 'c', price: 200, rating: 3.5 },
  ];

  it('trie par prix croissant', () => {
    expect(sortProducts(items, 'prix-asc').map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('trie par prix décroissant', () => {
    expect(sortProducts(items, 'prix-desc').map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });

  it('trie par note', () => {
    expect(sortProducts(items, 'note').map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('ne modifie pas le tableau original', () => {
    const copy = [...items];
    sortProducts(items, 'prix-asc');
    expect(items).toEqual(copy);
  });
});

describe('getCategories', () => {
  const makeProduct = (overrides: Partial<CatalogProduct>): CatalogProduct =>
    ({
      id: 'p',
      name: 'Produit',
      type: 'produit',
      category: 'Sérums',
      price: 1000,
      images: ['/img.jpg'],
      shortDesc: '',
      description: '',
      ingredients: '',
      usage: '',
      inStock: true,
      rating: 5,
      reviews: 0,
      promo: false,
      related: [],
      stock: 10,
      costPrice: 500,
      isActive: true,
      variants: [],
      ...overrides,
    }) as CatalogProduct;

  it('regroupe les produits par catégorie et compte les occurrences', () => {
    const catalog = [
      makeProduct({ id: '1', category: 'Sérums' }),
      makeProduct({ id: '2', category: 'Sérums' }),
      makeProduct({ id: '3', category: 'Crèmes' }),
    ];
    const cats = getCategories(catalog);
    expect(cats.find((c) => c.name === 'Sérums')?.count).toBe(2);
    expect(cats.find((c) => c.name === 'Crèmes')?.count).toBe(1);
  });

  it('ignore les produits inactifs', () => {
    const catalog = [makeProduct({ id: '1', isActive: false })];
    expect(getCategories(catalog)).toHaveLength(0);
  });
});
