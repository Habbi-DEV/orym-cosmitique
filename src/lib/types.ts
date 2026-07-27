import type { Product } from '../data/products';

// ---------------- RBAC ----------------
export type AdminRole = 'super_admin' | 'warehouse' | 'orders' | 'marketer';

export interface AdminUser {
  email: string;
  name: string;
  role: AdminRole;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  warehouse: 'Gestionnaire Stock',
  orders: 'Traitement Commandes',
  marketer: 'Marketing',
};

// ---------------- Catalogue étendu (DB) ----------------
export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CatalogProduct extends Product {
  stock: number;
  costPrice: number;
  isActive: boolean;
  variants: Variant[];
  packItems?: { productId: string; qty: number }[];
}

// ---------------- Commandes ----------------
export type OrderStatus = 'en_attente' | 'confirmee' | 'expediee' | 'livree' | 'annulee';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

export const ORDER_FLOW: OrderStatus[] = ['en_attente', 'confirmee', 'expediee', 'livree'];

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  ref: string;
  createdAt: number;
  status: OrderStatus;
  gender: 'madame' | 'monsieur';
  name: string;
  phone: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  delivery: 'domicile' | 'stopdesk';
  address?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promoCode?: string;
  tracking?: string;
  confirmToken: string;
}

// ---------------- Avis clients ----------------
export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: number;
}

// ---------------- Promotions ----------------
export interface Promo {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  minSubtotal: number;
  active: boolean;
  usages: number;
  ownerPhone?: string | null;
}

// ---------------- Inventaire ----------------
export type MovementKind = 'depot' | 'retrait' | 'reintegration';

export const MOVEMENT_LABELS: Record<MovementKind, string> = {
  depot: 'Dépôt (Entrée)',
  retrait: 'Retrait (Sortie)',
  reintegration: 'Réintégration',
};

export interface LedgerEntry {
  id: string;
  at: number;
  kind: MovementKind;
  productId: string;
  productName: string;
  qty: number;
  reason: string;
  author: string;
}

// ---------------- Livraison ----------------
export interface CommuneRate {
  name: string;
  extra: number;
}

export interface ShippingRate {
  code: number;
  name: string;
  home: number;
  stopdesk: number;
  communes: CommuneRate[];
}

// ---------------- Tracking (Meta + TikTok) ----------------
export interface MetaConfig {
  pixelId: string;
  capiToken: string;
  tiktokPixelId: string;
  enabled: boolean;
}

// ---------------- Divers ----------------
export const LOW_STOCK_THRESHOLD = 8;

export const marginOf = (price: number, costPrice: number): number =>
  price > 0 ? Math.round(((price - costPrice) / price) * 100) : 0;

export interface CartSyncItem {
  id: string;
  qty: number;
}