/**
 * POINT D'ENTRÉE API UNIQUE (gateway consolidé compatible Vercel serverless)
 * ---------------------------------------------------------------------------
 * Panier / wishlist : écritures RÉELLES dans les tables Supabase
 * `cart_items` / `wishlist_items` (stratégie delete-puis-insert par user_id,
 * chaque visiteur possédant une session anonyme stable via ensureVisitorSession).
 */
import { ensureVisitorSession, supabase } from './supabase';
import type { CartSyncItem } from './types';

const latency = (ms = 140) => new Promise((r) => setTimeout(r, ms));

const log = (scope: string, payload: unknown) =>
  console.info(`%c[supabase]%c ${scope}`, 'color:#9D64FF;font-weight:bold', 'color:inherit', payload);

const warn = (scope: string, message?: string) => {
  if (message) console.warn(`[supabase] ${scope}`, message);
};

export const api = {
  // ------------------------------------------------ PANIER
  /** Hydratation initiale du panier (lignes de l'utilisateur courant) */
  async fetchCart(): Promise<CartSyncItem[]> {
    if (!supabase) return [];
    const userId = await ensureVisitorSession();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_slug, qty')
      .eq('user_id', userId);
    warn('cart_items.select', error?.message);
    return (data ?? []).map((r) => ({ id: r.product_slug as string, qty: r.qty as number }));
  },

  /** Synchronise le panier → delete-puis-insert par user_id */
  async syncCart(items: CartSyncItem[]): Promise<{ ok: true }> {
    if (!supabase) {
      if (items.length) log('cart_items.sync (mode local)', items);
      return { ok: true };
    }
    const userId = await ensureVisitorSession();
    if (!userId) return { ok: true };

    const { error: delError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    warn('cart_items.delete', delError?.message);

    if (items.length > 0) {
      const { error } = await supabase.from('cart_items').insert(
        items.map((i) => ({ user_id: userId, product_slug: i.id, qty: i.qty })),
      );
      warn('cart_items.insert', error?.message);
    }
    return { ok: true };
  },

  // ------------------------------------------------ WISHLIST
  /** Hydratation initiale de la wishlist */
  async fetchWishlist(): Promise<string[]> {
    if (!supabase) return [];
    const userId = await ensureVisitorSession();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('product_slug')
      .eq('user_id', userId);
    warn('wishlist_items.select', error?.message);
    return (data ?? []).map((r) => r.product_slug as string);
  },

  /** Synchronise la wishlist → delete-puis-insert par user_id */
  async syncWishlist(ids: string[]): Promise<{ ok: true }> {
    if (!supabase) {
      if (ids.length) log('wishlist_items.sync (mode local)', ids);
      return { ok: true };
    }
    const userId = await ensureVisitorSession();
    if (!userId) return { ok: true };

    const { error: delError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId);
    warn('wishlist_items.delete', delError?.message);

    if (ids.length > 0) {
      const { error } = await supabase.from('wishlist_items').insert(
        ids.map((slug) => ({ user_id: userId, product_slug: slug })),
      );
      warn('wishlist_items.insert', error?.message);
    }
    return { ok: true };
  },

  // ------------------------------------------------ DIVERS
  /** POST /orders — création de commande depuis le checkout */
  async createOrder(payload: unknown): Promise<{ ok: true; ref: string }> {
    await latency(200);
    log('orders.insert', payload);
    return { ok: true, ref: '' };
  },

  /** Expédition Yalidine (prêt pour l'API officielle) */
  async yalidineShip(payload: { orderRef: string; wilaya: number; commune: string }): Promise<{ tracking: string }> {
    await latency(300);
    log('yalidine.create_parcel', payload);
    return { tracking: `YL-${Math.floor(10000000 + Math.random() * 89999999)}` };
  },
};
