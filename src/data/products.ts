export type ProductType = 'produit' | 'pack';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: string;
  price: number;
  oldPrice?: number;
  images: string[];
  shortDesc: string;
  description: string;
  ingredients: string;
  usage: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  promo: boolean;
  related: string[];
}

export const products: Product[] = [
  {
    id: 'serum-eclat',
    category: 'Sérums',
    name: 'Sérum Éclat — Vitamine C',
    type: 'produit',
    price: 2850,
    oldPrice: 3500,
    images: ['/img/serum-1.png', '/img/serum-2.png'],
    shortDesc: 'Concentré illuminateur à la vitamine C pure pour un teint lumineux et uniforme.',
    description:
      'Notre sérum best-seller concentre 12% de vitamine C pure stabilisée pour révéler l’éclat naturel de la peau. Jour après jour, les taches pigmentaires s’estompent, le grain de peau s’affine et le teint retrouve toute sa luminosité. Texture légère, absorption immédiate.',
    ingredients:
      'Aqua, Acide Ascorbique 12% (Vitamine C pure), Acide Hyaluronique, Extrait de Rose de Damas, Vitamine E, Glycérine végétale. Formulé sans parabènes, sans silicones, sans parfum synthétique.',
    usage:
      'Appliquer 3 à 4 gouttes matin et soir sur peau propre et sèche, en évitant le contour des yeux. Faire pénétrer par légers tapotements, puis appliquer votre crème hydratante. Utiliser une protection solaire le matin.',
    inStock: true,
    rating: 4.9,
    reviews: 312,
    promo: true,
    related: ['creme-ceramides', 'huile-argan', 'masque-argile', 'pack-eclat'],
  },
  {
    id: 'creme-ceramides',
    category: 'Crèmes',
    name: 'Crème Hydratante — Céramides',
    type: 'produit',
    price: 2450,
    images: ['/img/creme-1.png', '/img/creme-2.png'],
    shortDesc: 'Hydratation 48h aux céramides, répare et fortifie la barrière cutanée.',
    description:
      'Une crème fondante enrichie en 5 céramides biomimétiques qui restaurent la barrière cutanée et retiennent l’hydratation pendant 48 heures. La peau est repulpée, apaisée et visiblement plus souple dès la première application. Idéale pour les peaux normales à très sèches.',
    ingredients:
      'Aqua, Complexe de 5 Céramides (NP, AP, EOP, NS, AS), Beurre de Karité, Squalane végétal, Acide Hyaluronique, Niacinamide 2%, Panthénol. Sans parfum, non comédogène.',
    usage:
      'Appliquer matin et soir sur le visage et le cou, en dernier geste de votre routine. Masser délicatement par mouvements circulaires ascendants jusqu’à absorption complète.',
    inStock: true,
    rating: 4.8,
    reviews: 208,
    promo: false,
    related: ['serum-eclat', 'eau-micellaire', 'baume-levres', 'pack-hydra'],
  },
  {
    id: 'huile-argan',
    category: 'Huiles',
    name: 'Huile Précieuse d’Argan',
    type: 'produit',
    price: 3200,
    images: ['/img/huile-1.png', '/img/huile-2.png'],
    shortDesc: 'Huile sèche multi-usages visage, corps & cheveux, pressée à froid.',
    description:
      'Pressée à froid dans la région de Souss, notre huile d’argan bio est un élixir multi-usages d’exception. Non grasse et rapidement absorbée, elle nourrit intensément le visage, le corps et les cheveux tout en laissant un fini satiné lumineux.',
    ingredients:
      '100% Huile d’Argania Spinosa (Argan) biologique, pressée à froid, enrichie en Vitamine E naturelle. Aucun additif, aucun conservateur.',
    usage:
      'Visage : 2 à 3 gouttes le soir en dernier geste. Corps : appliquer sur peau légèrement humide après la douche. Cheveux : quelques gouttes sur les longueurs en masque 20 min avant le shampoing.',
    inStock: true,
    rating: 4.9,
    reviews: 154,
    promo: false,
    related: ['serum-eclat', 'masque-argile', 'pack-eclat', 'creme-ceramides'],
  },
  {
    id: 'masque-argile',
    category: 'Masques',
    name: 'Masque Argile Rose',
    type: 'produit',
    price: 1890,
    oldPrice: 2400,
    images: ['/img/masque-1.png', '/img/masque-2.png'],
    shortDesc: 'Purifie en douceur, resserre les pores et réveille l’éclat en 10 minutes.',
    description:
      'L’union parfaite de l’argile rose française et de la poudre de rose de Damas pour un teint frais et purifié sans jamais dessécher. Les pores sont resserrés, le teint est lumineux et la peau reste douce et confortable.',
    ingredients:
      'Argile Rose (Kaolin + Illite), Poudre de Rose de Damas, Eau de Bleuet bio, Glycérine, Extrait de Concombre, Allantoïne apaisante.',
    usage:
      'Appliquer en couche uniforme sur le visage propre 1 à 2 fois par semaine, en évitant le contour des yeux. Laisser poser 10 minutes sans laisser sécher totalement, puis rincer à l’eau tiède.',
    inStock: true,
    rating: 4.7,
    reviews: 186,
    promo: true,
    related: ['serum-eclat', 'eau-micellaire', 'pack-eclat', 'huile-argan'],
  },
  {
    id: 'eau-micellaire',
    category: 'Nettoyants',
    name: 'Eau Micellaire Apaisante',
    type: 'produit',
    price: 1650,
    images: ['/img/micellaire-1.png', '/img/micellaire-2.png'],
    shortDesc: 'Démaquille et apaise en un seul geste, sans rinçage, peaux sensibles.',
    description:
      'Une eau micellaire ultra-douce qui capture maquillage, pollution et impuretés comme un aimant, tout en apaisant les peaux les plus sensibles grâce à l’eau de bleuet bio. Sans rinçage, sans film gras, sans picotements.',
    ingredients:
      'Aqua, Micelles douces d’origine végétale, Eau de Bleuet bio, Glycérine hydratante, Panthénol (Provitamine B5). pH physiologique, testée sous contrôle dermatologique et ophtalmologique.',
    usage:
      'Matin et soir, imbiber un coton réutilisable et passer délicatement sur le visage, les yeux et les lèvres. Renouveler jusqu’à ce que le coton soit parfaitement propre. Sans rinçage.',
    inStock: true,
    rating: 4.8,
    reviews: 240,
    promo: false,
    related: ['creme-ceramides', 'masque-argile', 'pack-hydra', 'serum-eclat'],
  },
  {
    id: 'baume-levres',
    category: 'Soins lèvres',
    name: 'Baume Lèvres Rose Velours',
    type: 'produit',
    price: 950,
    images: ['/img/baume-1.png', '/img/baume-2.png'],
    shortDesc: 'Répare, repulpe et dépose un voile rosé au fini velours.',
    description:
      'Un baume fondant qui répare instantanément les lèvres sèches et gercées grâce au beurre de karité brut et à la cire de rose. Sa teinte rosée naturelle s’adapte à toutes les carnations pour un effet bouche mordue, délicatement velouté.',
    ingredients:
      'Beurre de Karité brut, Cire de Rose, Huile de Ricin, Pigments minéraux roses naturels, Vitamine E, Extrait de Vanille. 98% d’origine naturelle.',
    usage:
      'Appliquer généreusement sur les lèvres aussi souvent que nécessaire. En couche épaisse le soir, il agit comme un masque de nuit réparateur pour des lèvres douces au réveil.',
    inStock: true,
    rating: 4.9,
    reviews: 321,
    promo: false,
    related: ['creme-ceramides', 'eau-micellaire', 'pack-hydra', 'masque-argile'],
  },
  {
    id: 'pack-eclat',
    category: 'Packs',
    name: 'Pack Éclat Complet',
    type: 'pack',
    price: 5900,
    oldPrice: 7300,
    images: ['/img/pack-eclat-1.png', '/img/pack-eclat-2.png'],
    shortDesc: 'Le rituel éclat en 3 étapes : sérum vitamine C, masque argile rose et huile précieuse.',
    description:
      'Le rituel signature Oryam pour une peau éclatante en 3 étapes : purifiez avec le Masque Argile Rose (2 fois par semaine), illuminez chaque jour avec le Sérum Vitamine C, puis scellez avec l’Huile Précieuse d’Argan le soir. Le tout dans un coffret cadeau violet signature, prêt à offrir.',
    ingredients:
      'Contient : Sérum Éclat Vitamine C (30 ml) + Masque Argile Rose (75 ml) + Huile Précieuse d’Argan (50 ml). Retrouvez la composition complète de chaque produit sur sa fiche dédiée.',
    usage:
      'Étape 1 — Purifier : le masque, 2 fois par semaine. Étape 2 — Illuminer : 3 gouttes de sérum matin et soir. Étape 3 — Nourrir : 2 gouttes d’huile le soir. Résultats visibles en 21 jours.',
    inStock: true,
    rating: 5.0,
    reviews: 98,
    promo: true,
    related: ['serum-eclat', 'masque-argile', 'huile-argan', 'pack-hydra'],
  },
  {
    id: 'pack-hydra',
    category: 'Packs',
    name: 'Pack Rituel Hydratation',
    type: 'pack',
    price: 4700,
    oldPrice: 5500,
    images: ['/img/pack-hydra-1.png', '/img/pack-hydra-2.png'],
    shortDesc: 'Le trio hydratation 48h : eau micellaire, crème céramides et baume lèvres.',
    description:
      'Trois essentiels réunis dans un coffret rose poudré pour une hydratation complète — du visage aux lèvres : l’Eau Micellaire Apaisante pour un nettoyage doux, la Crème Céramides pour 48h d’hydratation continue, et le Baume Rose Velours pour des lèvres parfaites. Le cadeau idéal pour découvrir Oryam.',
    ingredients:
      'Contient : Eau Micellaire Apaisante (250 ml) + Crème Hydratante Céramides (50 ml) + Baume Lèvres Rose Velours (10 g). Retrouvez la composition complète de chaque produit sur sa fiche dédiée.',
    usage:
      'Matin : nettoyez avec l’eau micellaire puis appliquez la crème. Soir : même rituel, en terminant par une couche généreuse de baume en masque de nuit.',
    inStock: true,
    rating: 4.9,
    reviews: 76,
    promo: true,
    related: ['creme-ceramides', 'eau-micellaire', 'baume-levres', 'pack-eclat'],
  },
];

export const getProduct = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const promoProducts: Product[] = products.filter((p) => p.promo);
export const packProducts: Product[] = products.filter((p) => p.type === 'pack');
