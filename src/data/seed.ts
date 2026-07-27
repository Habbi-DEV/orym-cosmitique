import { products } from './products';
import { wilayas } from './wilayas';
import type {
  AdminUser,
  CatalogProduct,
  LedgerEntry,
  Order,
  Promo,
  ShippingRate,
} from '../lib/types';

// ---------------- COMPTES ADMIN (démo — en prod : Supabase Auth) ----------------
export const ADMIN_ACCOUNTS: (AdminUser & { password: string })[] = [
  { email: 'admin@oryam.com', password: 'admin123', name: 'Yasmine Ould Amara', role: 'super_admin' },
  { email: 'stock@oryam.com', password: 'stock123', name: 'Karim Bensaïd', role: 'warehouse' },
  { email: 'commandes@oryam.com', password: 'order123', name: 'Lina Cherif', role: 'orders' },
  { email: 'marketing@oryam.com', password: 'market123', name: 'Rayan Haddad', role: 'marketer' },
];

// ---------------- CATALOGUE ÉTENDU (stock, coûts, variantes) ----------------
const EXTRA: Record<string, { stock: number; costPrice: number; variants?: CatalogProduct['variants'] }> = {
  'serum-eclat': { stock: 24, costPrice: 1600 },
  'creme-ceramides': {
    stock: 18,
    costPrice: 1300,
    variants: [
      { id: 'v-creme-50', name: '50 ml', price: 0, stock: 12 },
      { id: 'v-creme-100', name: '100 ml', price: 1400, stock: 6 },
    ],
  },
  'huile-argan': { stock: 7, costPrice: 1900 },
  'masque-argile': { stock: 14, costPrice: 950 },
  'eau-micellaire': { stock: 30, costPrice: 800 },
  'baume-levres': { stock: 5, costPrice: 420 },
  'pack-eclat': { stock: 9, costPrice: 3400 },
  'pack-hydra': { stock: 3, costPrice: 2600 },
};

export const seedCatalog: CatalogProduct[] = products.map((p) => ({
  ...p,
  stock: EXTRA[p.id]?.stock ?? 10,
  costPrice: EXTRA[p.id]?.costPrice ?? Math.round(p.price * 0.55),
  isActive: true,
  variants: EXTRA[p.id]?.variants ?? [],
}));

export const seedLinks: Record<string, string[]> = Object.fromEntries(
  products.map((p) => [p.id, p.related]),
);

// ---------------- LIVRAISON ----------------
export const seedShipping: ShippingRate[] = wilayas.map((w) => ({
  code: w.code,
  name: w.name,
  home: w.home,
  stopdesk: w.stopdesk,
  communes: w.communes.map((co) => ({ name: co.name, extra: co.extra })),
}));

// ---------------- PROMOTIONS ----------------
export const seedPromos: Promo[] = [
  { id: 'pr-1', code: 'ORYAM10', kind: 'percent', value: 10, minSubtotal: 0, active: true, usages: 148 },
  { id: 'pr-2', code: 'BIENVENUE', kind: 'fixed', value: 300, minSubtotal: 2000, active: true, usages: 62 },
  { id: 'pr-3', code: 'EID2025', kind: 'percent', value: 15, minSubtotal: 4000, active: false, usages: 0 },
];

// ---------------- COMMANDES ----------------
const day = 86_400_000;
const now = Date.now();

const img = (id: string) => seedCatalog.find((p) => p.id === id)?.images[0] ?? '';
const nm = (id: string) => seedCatalog.find((p) => p.id === id)?.name ?? id;
const pr = (id: string) => seedCatalog.find((p) => p.id === id)?.price ?? 0;
const item = (id: string, qty: number) => ({
  productId: id,
  qty,
  name: nm(id),
  price: pr(id),
  image: img(id),
});

export const seedOrders: Order[] = [
  {
    id: 'o-1', ref: 'ORY-582341', createdAt: now - day * 0.2, status: 'en_attente',
    gender: 'madame', name: 'Amina Kaci', phone: '0550123456',
    wilayaCode: 16, wilayaName: 'Alger', commune: 'Hydra', delivery: 'domicile',
    address: '12 Rue des Pins, Hydra', items: [item('serum-eclat', 1), item('baume-levres', 2)],
    subtotal: 4750, shipping: 400, discount: 0, total: 5150,
    confirmToken: 'seed-token-1',
  },
  {
    id: 'o-2', ref: 'ORY-582207', createdAt: now - day * 0.6, status: 'en_attente',
    gender: 'madame', name: 'Sara Benali', phone: '0661452890',
    wilayaCode: 31, wilayaName: 'Oran', commune: 'Bir El Djir', delivery: 'stopdesk',
    items: [item('pack-eclat', 1)],
    subtotal: 5900, shipping: 400, discount: 590, total: 5710, promoCode: 'ORYAM10',
    confirmToken: 'seed-token-2',
  },
  {
    id: 'o-3', ref: 'ORY-581988', createdAt: now - day * 1.1, status: 'confirmee',
    gender: 'madame', name: 'Yasmine Haddad', phone: '0770345612',
    wilayaCode: 25, wilayaName: 'Constantine', commune: 'El Khroub', delivery: 'domicile',
    address: 'Cite 120 logements, Bt 4', items: [item('creme-ceramides', 1), item('eau-micellaire', 1)],
    subtotal: 4100, shipping: 430, discount: 0, total: 4530,
    confirmToken: 'seed-token-3',
  },
  {
    id: 'o-4', ref: 'ORY-581754', createdAt: now - day * 1.8, status: 'confirmee',
    gender: 'madame', name: 'Nour Benaissa', phone: '0550987123',
    wilayaCode: 19, wilayaName: 'Sétif', commune: 'El Eulma', delivery: 'stopdesk',
    items: [item('masque-argile', 2)],
    subtotal: 3780, shipping: 430, discount: 300, total: 3910, promoCode: 'BIENVENUE',
    confirmToken: 'seed-token-4',
  },
  {
    id: 'o-5', ref: 'ORY-581402', createdAt: now - day * 2.5, status: 'expediee',
    gender: 'madame', name: 'Lina Cherif', phone: '0655112233',
    wilayaCode: 9, wilayaName: 'Blida', commune: 'Boufarik', delivery: 'domicile',
    address: 'Rue Emir Abdelkader', items: [item('huile-argan', 1)],
    subtotal: 3200, shipping: 450, discount: 0, total: 3650,
    tracking: 'YL-48291365',
    confirmToken: 'seed-token-5',
  },
  {
    id: 'o-6', ref: 'ORY-580977', createdAt: now - day * 3.4, status: 'livree',
    gender: 'madame', name: 'Meriem Ziani', phone: '0771223344',
    wilayaCode: 13, wilayaName: 'Tlemcen', commune: 'Mansourah', delivery: 'domicile',
    address: 'Rue de l’Indépendance', items: [item('pack-hydra', 1)],
    subtotal: 4700, shipping: 430, discount: 0, total: 5130,
    tracking: 'YL-47008512',
    confirmToken: 'seed-token-6',
  },
  {
    id: 'o-7', ref: 'ORY-580663', createdAt: now - day * 4.2, status: 'livree',
    gender: 'monsieur', name: 'Imane Saadi', phone: '0662334455',
    wilayaCode: 23, wilayaName: 'Annaba', commune: 'El Bouni', delivery: 'stopdesk',
    items: [item('serum-eclat', 2)],
    subtotal: 5700, shipping: 450, discount: 570, total: 5580, promoCode: 'ORYAM10',
    tracking: 'YL-46127790',
    confirmToken: 'seed-token-7',
  },
  {
    id: 'o-8', ref: 'ORY-580201', createdAt: now - day * 5.1, status: 'annulee',
    gender: 'madame', name: 'Rania Belkacem', phone: '0555667788',
    wilayaCode: 15, wilayaName: 'Tizi Ouzou', commune: 'Azazga', delivery: 'domicile',
    address: 'Village Tadert', items: [item('baume-levres', 1)],
    subtotal: 950, shipping: 400, discount: 0, total: 1350,
    confirmToken: 'seed-token-8',
  },
];

// ---------------- GRAND LIVRE (inventaire) ----------------
export const seedLedger: LedgerEntry[] = [
  { id: 'l-1', at: now - day * 4.5, kind: 'depot', productId: 'serum-eclat', productName: nm('serum-eclat'), qty: 30, reason: 'Réception fournisseur — lot SC-0425', author: 'Karim B. (Dépôt Central)' },
  { id: 'l-2', at: now - day * 3.9, kind: 'depot', productId: 'eau-micellaire', productName: nm('eau-micellaire'), qty: 40, reason: 'Réassort mensuel', author: 'Karim B. (Dépôt Central)' },
  { id: 'l-3', at: now - day * 3.4, kind: 'retrait', productId: 'pack-hydra', productName: nm('pack-hydra'), qty: 1, reason: 'Commande ORY-580977', author: 'Boutique en ligne' },
  { id: 'l-4', at: now - day * 3.0, kind: 'reintegration', productId: 'masque-argile', productName: nm('masque-argile'), qty: 1, reason: 'Retour client ORY-580112 — produit intact', author: 'Lina C. (SAV)' },
  { id: 'l-5', at: now - day * 2.5, kind: 'retrait', productId: 'huile-argan', productName: nm('huile-argan'), qty: 1, reason: 'Commande ORY-581402', author: 'Boutique en ligne' },
  { id: 'l-6', at: now - day * 1.6, kind: 'retrait', productId: 'serum-eclat', productName: nm('serum-eclat'), qty: 2, reason: 'Commande ORY-580663', author: 'Boutique en ligne' },
  { id: 'l-7', at: now - day * 1.0, kind: 'depot', productId: 'baume-levres', productName: nm('baume-levres'), qty: 12, reason: 'Production atelier — série BV-118', author: 'Karim B. (Dépôt Central)' },
];