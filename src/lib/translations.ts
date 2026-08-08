/**
 * Dictionnaire de traduction FR/AR.
 * Ajout progressif au fil des pages traduites (voir INSTRUCTIONS.md pour
 * le suivi). Utiliser useLang().t('section.cle') pour accéder à une valeur.
 */
export const translations = {
  fr: {
    common: {
      commander: 'Commander',
      ajouterAuPanier: 'Ajouter au panier',
      rechercher: 'Rechercher',
      fermer: 'Fermer',
      enregistrer: 'Enregistrer',
      annuler: 'Annuler',
      voirTout: 'Voir tout',
    },
    nav: {
      accueil: 'Accueil',
      promos: 'Promos',
      packs: 'Packs',
      suivi: 'Suivi',
      categories: 'Catégories',
      wishlist: 'Ma liste',
      panier: 'Panier',
    },
    hero: {
      collection: 'Notre Collection',
      title: 'Nos Produits',
      sub: 'Des formules concentrées en actifs naturels, pour chaque besoin de votre peau.',
    },
    filters: {
      toutes: 'Toutes',
      populaires: 'Populaires',
      prixCroissant: 'Prix croissant',
      prixDecroissant: 'Prix décroissant',
      piece: 'pièce',
      pieces: 'pièces',
      aucunProduit: 'Aucun produit dans cette catégorie pour le moment.',
    },
    product: {
      produit: 'Produit',
      pack: 'Pack',
      enStock: 'En stock',
      rupture: 'Rupture de stock',
      commander: 'Commander',
      indisponible: 'Indisponible',
      avisVerifies: 'avis vérifiés',
    },
    footer: {
      rights: 'Tous droits réservés.',
    },
    promosSection: {
      eyebrow: 'Offres Limitées',
      title: 'Promotions',
      sub: 'Profitez de remises exceptionnelles sur une sélection de nos soins iconiques.',
      chip: 'JUSQU’À -30%',
    },
    packsSection: {
      eyebrow: 'Rituels Complets',
      title: 'Packs & Coffrets',
      sub: 'Nos routines signature réunies dans des coffrets élégants, jusqu’à 25% moins chers que les produits séparés.',
      chip: 'IDÉE CADEAU',
    },
    admin: {
      dashboard: 'Tableau de bord',
      commandes: 'Commandes',
      clients: 'Clients',
      produits: 'Produits',
      promotions: 'Promotions',
      avis: 'Avis',
      journal: "Journal d'audit",
      inventaire: 'Inventaire',
      paniers: 'Paniers abandonnés',
      parametres: 'Paramètres',
      deconnexion: 'Déconnexion',
    },
  },
  ar: {
    common: {
      commander: 'اطلبي الآن',
      ajouterAuPanier: 'أضيفي إلى السلة',
      rechercher: 'بحث',
      fermer: 'إغلاق',
      enregistrer: 'حفظ',
      annuler: 'إلغاء',
      voirTout: 'عرض الكل',
    },
    nav: {
      accueil: 'الرئيسية',
      promos: 'العروض',
      packs: 'الباقات',
      suivi: 'تتبع الطلب',
      categories: 'الفئات',
      wishlist: 'المفضلة',
      panier: 'السلة',
    },
    hero: {
      collection: 'مجموعتنا',
      title: 'منتجاتنا',
      sub: 'تركيبات مركّزة بمكونات طبيعية، لكل احتياجات بشرتك.',
    },
    filters: {
      toutes: 'الكل',
      populaires: 'الأكثر رواجاً',
      prixCroissant: 'السعر تصاعدياً',
      prixDecroissant: 'السعر تنازلياً',
      piece: 'منتج',
      pieces: 'منتجات',
      aucunProduit: 'لا يوجد أي منتج في هذه الفئة حالياً.',
    },
    product: {
      produit: 'منتج',
      pack: 'باقة',
      enStock: 'متوفر',
      rupture: 'غير متوفر حالياً',
      commander: 'اطلبي الآن',
      indisponible: 'غير متوفر',
      avisVerifies: 'تقييم موثّق',
    },
    footer: {
      rights: 'جميع الحقوق محفوظة.',
    },
    promosSection: {
      eyebrow: 'عروض محدودة',
      title: 'العروض الترويجية',
      sub: 'استفيدي من تخفيضات استثنائية على مجموعة مختارة من منتجاتنا المميزة.',
      chip: 'حتى -30%',
    },
    packsSection: {
      eyebrow: 'روتين متكامل',
      title: 'الباقات والمجموعات',
      sub: 'روتيناتنا المميزة مجمّعة في باقات أنيقة، بسعر أقل حتى 25% من شراء المنتجات منفصلة.',
      chip: 'فكرة هدية',
    },
    admin: {
      dashboard: 'لوحة القيادة',
      commandes: 'الطلبيات',
      clients: 'العملاء',
      produits: 'المنتجات',
      promotions: 'العروض الترويجية',
      avis: 'التقييمات',
      journal: 'سجل التعديلات',
      inventaire: 'المخزون',
      paniers: 'سلات متروكة',
      parametres: 'الإعدادات',
      deconnexion: 'تسجيل الخروج',
    },
  },
} as const;

type Leaves<T, P extends string = ''> = T extends string
  ? P
  : { [K in keyof T]: Leaves<T[K], `${P}${P extends '' ? '' : '.'}${K & string}`> }[keyof T];

export type TranslationKey = Leaves<(typeof translations)['fr']>;
export type Lang = keyof typeof translations;
