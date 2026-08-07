import type { CatalogProduct } from './types';

/** Vue localisée d'un produit — repli sur le champ français si la
 * traduction arabe est absente (contenu ajouté progressivement par
 * l'admin, voir AdminProducts.tsx). */
export interface LocalizedProduct {
  name: string;
  category: string;
  shortDesc: string;
  description: string;
  ingredients: string;
  usage: string;
}

export function localizeProduct(p: CatalogProduct, lang: 'fr' | 'ar'): LocalizedProduct {
  if (lang === 'fr') {
    return {
      name: p.name,
      category: p.category,
      shortDesc: p.shortDesc,
      description: p.description,
      ingredients: p.ingredients,
      usage: p.usage,
    };
  }
  return {
    name: p.nameAr || p.name,
    category: p.categoryAr || p.category,
    shortDesc: p.shortDescAr || p.shortDesc,
    description: p.descriptionAr || p.description,
    ingredients: p.ingredientsAr || p.ingredients,
    usage: p.usageAr || p.usage,
  };
}
