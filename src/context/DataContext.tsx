import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ADMIN_ACCOUNTS,
  seedCatalog,
  seedLedger,
  seedLinks,
  seedOrders,
  seedPromos,
  seedShipping,
} from '../data/seed';
import { api } from '../lib/api';
import { playOrderChime } from '../lib/chime';
import { setMetaConfig as pushMetaConfig } from '../lib/meta';
import { supabase } from '../lib/supabase';
import {
  LOW_STOCK_THRESHOLD,
  type AdminUser,
  type CatalogProduct,
  type LedgerEntry,
  type MetaConfig,
  type MovementKind,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Promo,
  type ShippingRate,
} from '../lib/types';

export interface OrderInput {
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
}

interface DataContextValue {
  catalog: CatalogProduct[];
  activeProducts: CatalogProduct[];
  promoProducts: CatalogProduct[];
  packProducts: CatalogProduct[];
  getProduct: (id: string) => CatalogProduct | undefined;
  links: Record<string, string[]>;
  orders: Order[];
  promos: Promo[];
  ledger: LedgerEntry[];
  shipping: ShippingRate[];
  metaConfig: MetaConfig;
  session: AdminUser | null;
  sessionLoading: boolean;
  lowStock: CatalogProduct[];
  wishlistStats: Record<string, number>;
  trackWishlist: (productId: string, added: boolean) => void;
  // Alerte "nouvelle commande" en direct (Supabase Realtime) — null si aucune
  // à afficher. Voir dismissOrderAlert.
  orderAlert: Order | null;
  dismissOrderAlert: () => void;

  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message: string; role?: AdminUser['role'] }>;
  logout: () => void;
  changeEmail: (newEmail: string, password: string) => Promise<{ ok: boolean; message: string }>;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; message: string }>;

  createOrder: (input: OrderInput) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  shipOrder: (order: Order) => Promise<void>;

  upsertProduct: (p: CatalogProduct, linkIds: string[]) => void;
  deleteProduct: (id: string) => void;
  setProductActive: (id: string, active: boolean) => void;

  addPromo: (p: Omit<Promo, 'id' | 'usages'>) => void;
  togglePromo: (id: string) => void;
  deletePromo: (id: string) => void;
  validatePromo: (code: string, subtotal: number) =>
    | { ok: true; promo: Promo; discount: number }
    | { ok: false; message: string };

  addPack: (input: { name: string; productIds: string[]; price: number; image?: string }) => void;

  addMovement: (kind: MovementKind, productId: string, qty: number, reason: string) => void;

  updateWilayaRate: (code: number, home: number, stopdesk: number) => void;
  updateCommuneRate: (code: number, name: string, extra: number) => void;
  addCommune: (code: number, name: string) => void;

  setMetaConfig: (cfg: MetaConfig) => void;
  incrementPromoUsage: (code: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// ---------------- Mappers Supabase (ligne DB -> modèle app) ----------------
const rowToProduct = (r: Record<string, unknown>): CatalogProduct => ({
  id: (r.slug as string) ?? String(r.id),
  // UUID réel products.id — distinct du `id` applicatif ci-dessus (le slug).
  // Requis pour toute écriture référençant products.id côté base
  // (order_items.product_id, reviews.product_id) — voir createOrder et
  // ProductPage.tsx. Undefined uniquement en mode démo local sans Supabase.
  dbId: r.id != null ? String(r.id) : undefined,
  name: (r.name as string) ?? 'Produit',
  type: (r.type as 'produit' | 'pack') ?? 'produit',
  category: (r.category as string) || 'Autres',
  price: Number(r.price) || 0,
  oldPrice: r.old_price != null ? Number(r.old_price) : undefined,
  images: Array.isArray(r.images) && (r.images as string[]).length > 0 ? (r.images as string[]) : ['/img/serum-1.png'],
  shortDesc: (r.short_desc as string) ?? '',
  description: (r.description as string) ?? '',
  ingredients: (r.ingredients as string) ?? '',
  usage: (r.usage as string) ?? '',
  inStock: Number(r.stock) > 0,
  rating: Number(r.rating) || 5,
  reviews: Number(r.reviews) || 0,
  promo: Boolean(r.promo),
  related: [],
  stock: Number(r.stock) || 0,
  costPrice: Number(r.cost_price) || 0,
  isActive: r.is_active !== false,
  variants: [],
});

const rowToOrder = (r: Record<string, unknown>): Order => ({
  id: String(r.id),
  ref: String(r.ref),
  createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
  status: (r.status as Order['status']) ?? 'en_attente',
  gender: (r.customer_gender as 'madame' | 'monsieur') ?? 'madame',
  name: String(r.customer_name ?? ''),
  phone: String(r.phone ?? ''),
  wilayaCode: Number(r.wilaya_code) || 0,
  wilayaName: String(r.wilaya_name ?? ''),
  commune: String(r.commune ?? ''),
  delivery: (r.delivery_type as 'domicile' | 'stopdesk') ?? 'domicile',
  address: (r.address as string) ?? undefined,
  items: Array.isArray(r.order_items)
    ? (r.order_items as Record<string, unknown>[]).map((oi) => ({
        productId: (oi.product_id as string) ?? '',
        name: String(oi.name ?? ''),
        price: Number(oi.price) || 0,
        qty: Number(oi.qty) || 0,
        image: '',
      }))
    : [],
  subtotal: Number(r.subtotal) || 0,
  shipping: Number(r.shipping_cost) || 0,
  discount: Number(r.discount) || 0,
  total: Number(r.total) || 0,
  promoCode: (r.promo_code as string) ?? undefined,
  tracking: (r.yalidine_tracking as string) ?? undefined,
  confirmToken: String(r.confirm_token ?? ''),
});

const rowToPromo = (r: Record<string, unknown>): Promo => ({
  id: String(r.id),
  code: String(r.code),
  kind: (r.kind as 'percent' | 'fixed') ?? 'percent',
  value: Number(r.value) || 0,
  minSubtotal: Number(r.min_subtotal) || 0,
  active: Boolean(r.active),
  usages: Number(r.usage_count) || 0,
  ownerPhone: (r.owner_phone as string) ?? null,
});

/** Union par code — le distant gagne, les codes locaux absents de la DB sont conservés */
const mergePromos = (remote: Promo[], local: Promo[]): Promo[] => {
  const map = new Map<string, Promo>(local.map((p) => [p.code, p]));
  remote.forEach((rp) => {
    const existing = map.get(rp.code);
    map.set(
      rp.code,
      existing ? { ...existing, ...rp, usages: Math.max(existing.usages, rp.usages) } : rp,
    );
  });
  return [...map.values()];
};

// ---------------- Écritures distantes (fire-and-forget sécurisé) ----------------
const remoteUpsertProduct = (p: CatalogProduct) => {
  if (!supabase) return;
  void supabase
    .from('products')
    .upsert(
      {
        slug: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        price: p.price,
        old_price: p.oldPrice ?? null,
        cost_price: p.costPrice,
        stock: p.stock,
        images: p.images.filter((i) => !i.startsWith('data:')),
        short_desc: p.shortDesc,
        description: p.description,
        ingredients: p.ingredients,
        usage: p.usage,
        is_active: p.isActive,
        promo: p.promo,
      },
      { onConflict: 'slug' },
    )
    .then(({ error }) => error && console.warn('[supabase] products.upsert', error.message));
};

const remoteDeleteProduct = (id: string) => {
  if (!supabase) return;
  void supabase
    .from('products')
    .delete()
    .eq('slug', id)
    .then(({ error }) => error && console.warn('[supabase] products.delete', error.message));
};

const remoteOrderPatch = (ref: string, patch: Record<string, unknown>) => {
  if (!supabase) return;
  void supabase
    .from('orders')
    .update(patch)
    .eq('ref', ref)
    .then(({ error }) => error && console.warn('[supabase] orders.update', error.message));
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [catalog, setCatalog] = useState<CatalogProduct[]>(seedCatalog);
  const [links, setLinks] = useState<Record<string, string[]>>(seedLinks);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [orderAlert, setOrderAlert] = useState<Order | null>(null);
  const [promos, setPromos] = useState<Promo[]>(seedPromos);
  const [ledger, setLedger] = useState<LedgerEntry[]>(seedLedger);
  const [shipping, setShipping] = useState<ShippingRate[]>(seedShipping);
  const [metaConfig, setMetaConfigState] = useState<MetaConfig>({
    pixelId: '',
    capiToken: '',
    tiktokPixelId: '',
    enabled: false,
  });
  const [session, setSession] = useState<AdminUser | null>(null);
  // true tant que la restauration async de session n'est pas terminée (évite
  // de rediriger un admin déjà connecté vers /admin/login pendant un F5)
  const [sessionLoading, setSessionLoading] = useState(true);
  // Ces chiffres ne sont qu'un FALLBACK pour le mode démo (sans Supabase) —
  // dès que l'admin est connecté, ils sont entièrement remplacés par un
  // vrai comptage de la table wishlist_items (voir effet staff ci-dessous).
  const [wishlistStats, setWishlistStats] = useState<Record<string, number>>({
    'serum-eclat': 342,
    'baume-levres': 287,
    'creme-ceramides': 214,
    'pack-eclat': 168,
    'huile-argan': 141,
    'masque-argile': 96,
    'eau-micellaire': 78,
    'pack-hydra': 64,
  });

  useEffect(() => {
    pushMetaConfig(metaConfig);
  }, [metaConfig]);

  // Bump optimiste local (feedback instantané) — écrasé par le vrai comptage
  // Supabase au prochain rafraîchissement staff ci-dessous.
  const trackWishlist = (productId: string, added: boolean) =>
    setWishlistStats((s) => ({
      ...s,
      [productId]: Math.max(0, (s[productId] ?? 0) + (added ? 1 : -1)),
    }));

  // ---------------- Hydratation DONNÉES PUBLIQUES — une seule fois au montage ----------------
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data: prods } = await supabase.from('products').select('*').order('created_at');
        if (mounted && prods && prods.length > 0) setCatalog(prods.map(rowToProduct));
        // Promotions actives (visibles publiquement par la RLS)
        const { data: promos } = await supabase.from('promotions').select('*').eq('active', true);
        if (mounted && promos && promos.length > 0) {
          setPromos((prev) => mergePromos(promos.map(rowToPromo), prev));
        }
      } catch (e) {
        console.warn('[supabase] hydratation publique impossible — mode local conservé', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------------- Hydratation DONNÉES STAFF — relancée à CHAQUE session ----------------
  // orders exige has_role(['super_admin','orders']) : la lecture était faite une
  // fois au montage, souvent AVANT la fin de la connexion admin, renvoyait 0 ligne
  // et n'était jamais relancée. Désormais, tout changement de session relance le fetch.
  useEffect(() => {
    if (!supabase || !session) return;
    let mounted = true;
    (async () => {
      try {
        const [{ data: ords }, { data: promos }, { data: wl }, { data: meta }] = await Promise.all([
          supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('promotions').select('*'),
          // wishlist_items est protégée par RLS user_id = auth.uid() (chaque
          // visiteur ne voit QUE ses propres lignes) — impossible de compter
          // "tous les visiteurs" avec un SELECT direct, même en admin. On
          // passe donc par une fonction SQL security definer dédiée qui ne
          // renvoie qu'un agrégat (product_slug, count), sans exposer les
          // user_id individuels. Voir supabase/schema-patch-wishlist-stats.sql.
          supabase.rpc('wishlist_counts'),
          // meta_config est un singleton (id = 1) protégé par la policy
          // meta_staff_read (is_admin()) — lu uniquement une fois connecté.
          supabase.from('meta_config').select('*').eq('id', 1).maybeSingle(),
        ]);
        if (mounted && ords) setOrders(ords.map(rowToOrder));
        if (mounted && promos && promos.length > 0) {
          setPromos((prev) => mergePromos(promos.map(rowToPromo), prev));
        }
        if (mounted && wl) {
          const counts: Record<string, number> = {};
          (wl as { product_slug: string; count: number }[]).forEach((r) => {
            counts[r.product_slug] = Number(r.count);
          });
          setWishlistStats(counts);
        }
        if (mounted && meta) {
          setMetaConfigState({
            pixelId: (meta.pixel_id as string) ?? '',
            capiToken: (meta.capi_token as string) ?? '',
            tiktokPixelId: (meta.tiktok_pixel_id as string) ?? '',
            enabled: Boolean(meta.enabled),
          });
        }
      } catch (e) {
        console.warn('[supabase] hydratation staff impossible', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session]);

  // ---------------- Realtime — nouvelle commande en direct ----------------
  // Écoute les INSERT sur `orders` pendant qu'un membre du staff est
  // connecté : la commande apparaît dans le tableau de bord sans refresh,
  // avec une alerte visuelle + sonore. La policy RLS "orders_staff_read"
  // s'applique aussi au flux Realtime : seuls super_admin/orders reçoivent
  // l'événement (un marketer ou warehouse ne le verra pas).
  useEffect(() => {
    if (!supabase || !session) return;
    // Alias local : TypeScript ne conserve pas le narrowing du `if` ci-dessus
    // à l'intérieur des callbacks imbriqués (.on(...), .then(...), cleanup)
    // car `supabase` est un import de module (SupabaseClient | null). `client`
    // est une const locale à cet effet, donc son type non-null reste garanti
    // partout ci-dessous, y compris dans les fermetures.
    const client = supabase;
    const channel = client
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const incoming = rowToOrder(payload.new as Record<string, unknown>);
          let isGenuinelyNew = true;
          setOrders((prev) => {
            // Dédoublonnage par `ref` (unique en base) et non par `id` : la
            // commande créée en optimiste localement (createOrder) a un id
            // client `uid('o')`, différent de l'UUID réellement inséré en
            // base (dbOrderId) — comparer les id laisserait passer un doublon
            // pour la session qui vient de créer la commande elle-même.
            const idx = prev.findIndex((o) => o.ref === incoming.ref);
            if (idx !== -1) {
              isGenuinelyNew = false; // déjà connue localement (créée par CETTE session)
              // Remplace la version optimiste par la version canonique (id
              // réel de la base) tout en gardant les articles déjà connus.
              const next = [...prev];
              next[idx] = { ...incoming, items: incoming.items.length ? incoming.items : prev[idx].items };
              return next;
            }
            return [incoming, ...prev];
          });
          if (!isGenuinelyNew) return;
          setOrderAlert(incoming);
          playOrderChime();
          // Le payload Realtime ne contient que la ligne `orders` (pas la
          // jointure order_items) : on complète les articles séparément.
          void client
            .from('order_items')
            .select('*')
            .eq('order_id', incoming.id)
            .then(({ data }) => {
              if (!data || data.length === 0) return;
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === incoming.id
                    ? {
                        ...o,
                        items: data.map((oi) => ({
                          productId: (oi.product_id as string) ?? '',
                          name: String(oi.name ?? ''),
                          price: Number(oi.price) || 0,
                          qty: Number(oi.qty) || 0,
                          image: '',
                        })),
                      }
                    : o,
                ),
              );
            });
        },
      )
      .subscribe((status, err) => {
        // Journalise l'état de la connexion Realtime dans la console — utile
        // pour diagnostiquer si la bannière/son de nouvelle commande ne se
        // déclenche pas : SUBSCRIBED = OK ; CHANNEL_ERROR/TIMED_OUT signifie
        // le plus souvent que la réplication n'est pas activée pour la table
        // `orders` dans Supabase Dashboard → Database → Replication.
        if (status === 'SUBSCRIBED') {
          console.info('%c[realtime]%c Abonné aux nouvelles commandes', 'color:#3ECF8E;font-weight:bold', 'color:inherit');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(
            '[realtime] Échec de l’abonnement aux commandes — vérifiez Database → Replication → orders dans Supabase.',
            status,
            err,
          );
        }
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [session]);

  // ---------------- Auth Supabase RÉELLE (+ fallback démo local) ----------------
  // Retourne le rôle si un profil admin existe, sinon undefined
  // (un visiteur anonyme ne devient JAMAIS une session admin)
  const hydrateProfile = async (
    userId: string,
    email: string,
  ): Promise<AdminUser['role'] | undefined> => {
    if (!supabase) return undefined;
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .maybeSingle();
    if (!p) return undefined;
    const role = p.role as AdminUser['role'];
    setSession({
      email,
      name: (p.full_name as string) ?? email.split('@')[0],
      role,
    });
    return role;
  };

  // Restauration de session au rechargement + écoute des changements d'auth
  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      const anonymous = (u as { is_anonymous?: boolean } | undefined)?.is_anonymous === true;
      if (mounted && u?.email && !anonymous) await hydrateProfile(u.id, u.email);
      if (mounted) setSessionLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        return;
      }
      const u = sess?.user;
      const anonymous = (u as { is_anonymous?: boolean } | undefined)?.is_anonymous === true;
      if (u?.email && !anonymous) void hydrateProfile(u.id, u.email);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const clean = email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: clean,
        password,
      });
      if (error)
        return {
          ok: false,
          message: error.message.includes('Invalid login')
            ? 'E-mail ou mot de passe incorrect.'
            : `Erreur Supabase : ${error.message}`,
        };
      if (data.user?.email) {
        const role = await hydrateProfile(data.user.id, data.user.email);
        if (!role) {
          await supabase.auth.signOut();
          return {
            ok: false,
            message: 'Compte authentifié mais aucun profil admin associé (table profiles).',
          };
        }
        return { ok: true, message: 'Connexion réussie — bienvenue.', role };
      }
      return { ok: false, message: 'Connexion impossible pour le moment.' };
    }
    // Fallback démo (aucune .env) : comptes mock locaux
    const acc = ADMIN_ACCOUNTS.find((a) => a.email.toLowerCase() === clean);
    if (!acc) return { ok: false, message: 'Aucun compte associé à cet e-mail.' };
    if (acc.password !== password) return { ok: false, message: 'Mot de passe incorrect.' };
    setSession({ email: acc.email, name: acc.name, role: acc.role });
    return { ok: true, message: `Bienvenue, ${acc.name.split(' ')[0]}.`, role: acc.role };
  };

  const logout = () => {
    if (supabase) void supabase.auth.signOut();
    setSession(null);
  };

  const changeEmail = async (newEmail: string, password: string) => {
    if (!session) return { ok: false, message: 'Session expirée.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail))
      return { ok: false, message: 'Adresse e-mail invalide.' };
    if (supabase) {
      // Réauthentification requise par Supabase Auth
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email: session.email,
        password,
      });
      if (reauth)
        return { ok: false, message: 'Mot de passe actuel incorrect — réauthentification refusée.' };
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
      if (error) return { ok: false, message: `Erreur Supabase : ${error.message}` };
      return {
        ok: true,
        message: 'Lien de vérification envoyé aux deux adresses — validez-le pour finaliser.',
      };
    }
    const acc = ADMIN_ACCOUNTS.find((a) => a.email === session.email);
    if (!acc || acc.password !== password)
      return { ok: false, message: 'Mot de passe actuel incorrect — réauthentification refusée.' };
    acc.email = newEmail.trim().toLowerCase();
    setSession({ ...session, email: acc.email });
    return { ok: true, message: 'Adresse e-mail mise à jour. Un lien de vérification a été envoyé.' };
  };

  const changePassword = async (current: string, next: string) => {
    if (!session) return { ok: false, message: 'Session expirée.' };
    if (next.length < 8 || !/\d/.test(next) || !/[a-zA-Z]/.test(next))
      return { ok: false, message: 'Minimum 8 caractères avec lettres et chiffres.' };
    if (supabase) {
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: current,
      });
      if (reauth) return { ok: false, message: 'Le mot de passe actuel est incorrect.' };
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return { ok: false, message: `Erreur Supabase : ${error.message}` };
      return { ok: true, message: 'Mot de passe modifié avec succès.' };
    }
    const acc = ADMIN_ACCOUNTS.find((a) => a.email === session.email);
    if (!acc || acc.password !== current)
      return { ok: false, message: 'Le mot de passe actuel est incorrect.' };
    acc.password = next;
    return { ok: true, message: 'Mot de passe modifié avec succès.' };
  };

  // ---------------- Commandes ----------------
  const createOrder = (input: OrderInput): Order => {
    const order: Order = {
      id: uid('o'),
      ref: `ORY-${Math.floor(100000 + Math.random() * 899999)}`,
      createdAt: Date.now(),
      status: 'en_attente',
      // Généré côté client, comme dbOrderId plus bas : le lien de
      // confirmation (e-mail aujourd'hui, WhatsApp ensuite) en a besoin
      // immédiatement, sans dépendre d'une relecture post-insert (RLS).
      confirmToken: crypto.randomUUID().replace(/-/g, ''),
      ...input,
    };
    setOrders((prev) => [order, ...prev]);
    // Décrément stock + écriture du grand livre (miroir du trigger SQL)
    setCatalog((prev) =>
      prev.map((p) => {
        const it = input.items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
      }),
    );
    setLedger((prev) => [
      ...input.items.map((i) => ({
        id: uid('l'),
        at: Date.now(),
        kind: 'retrait' as const,
        productId: i.productId,
        productName: i.name,
        qty: i.qty,
        reason: `Commande ${order.ref}`,
        author: 'Boutique en ligne',
      })),
      ...prev,
    ]);
    void api.createOrder(order);
    // Notification e-mail admin : gérée par un vrai Database Webhook Supabase
    // (Database → Webhooks, table `orders`, INSERT) → Edge Function notify-order.
    // Fiable même si la cliente quitte la page juste après avoir commandé —
    // voir supabase/functions/notify-order/index.ts.
    if (supabase) {
      // uuid généré côté client — sert de clé pour order_items SANS jamais
      // relire la ligne après écriture (voir explication ci-dessous).
      const dbOrderId = crypto.randomUUID();
      void (async () => {
        const { error } = await supabase.from('orders').insert({
          id: dbOrderId,
          ref: order.ref,
          confirm_token: order.confirmToken,
          customer_gender: order.gender,
          customer_name: order.name,
          phone: order.phone,
          wilaya_code: order.wilayaCode,
          wilaya_name: order.wilayaName,
          commune: order.commune,
          delivery_type: order.delivery,
          address: order.address ?? null,
          subtotal: order.subtotal,
          shipping_cost: order.shipping,
          discount: order.discount,
          total: order.total,
          promo_code: order.promoCode ?? null,
          status: 'en_attente',
        });
        // ⚠️ Bug trouvé et corrigé ici : l'ancien code chaînait
        // `.select('id').single()` après l'insert pour récupérer l'id généré
        // par la base. Or PostgREST doit alors relire la ligne (RETURNING),
        // ce qui déclenche la policy SELECT `orders_staff_read` — que réussit
        // seulement le staff connecté. Résultat : pour un visiteur normal
        // (non connecté), PostgREST rejetait l'INSERT ENTIER avec "new row
        // violates row-level security policy for table orders", alors que la
        // policy d'écriture `orders_public_insert` (with check (true)) était
        // elle-même correcte — la commande n'était donc écrite QUE quand un
        // admin avait une session ouverte au même moment sur le même client.
        // En générant l'uuid côté client et en n'appelant plus jamais
        // `.select()` après l'insert, on n'a plus besoin d'aucune permission
        // de lecture pour finaliser une commande.
        if (error) {
          console.warn('[supabase] orders.insert', error.message);
          return;
        }
        if (input.items.length > 0) {
          // ⚠️ Bug trouvé et corrigé ici : `i.productId` est le SLUG
          // applicatif (ex. "serum-eclat"), pas l'UUID réel de la table
          // `products`. order_items.product_id est une colonne `uuid`
          // (FK products.id) : y insérer un slug provoquait une erreur
          // Postgres silencieuse (avalée par le `console.warn` ci-dessous),
          // laissant systématiquement product_id à NULL. Conséquence directe
          // en cascade : le trigger de décrément de stock (qui joint sur
          // order_items.product_id = products.id) ne trouvait jamais de
          // ligne à mettre à jour, et la vérification "Achat vérifié" des
          // avis clients ne pouvait jamais rattacher une commande à un
          // produit. On résout le vrai uuid via le catalogue local (déjà
          // hydraté avec `dbId` — voir rowToProduct) avant l'insertion.
          const { error: itemsErr } = await supabase.from('order_items').insert(
            input.items.map((i) => ({
              order_id: dbOrderId,
              product_id: catalog.find((p) => p.id === i.productId)?.dbId ?? null,
              name: i.name,
              price: i.price,
              qty: i.qty,
            })),
          );
          if (itemsErr) console.warn('[supabase] order_items.insert', itemsErr.message);
        }
      })();
    }
    return order;
  };

  const setOrderStatus = (id: string, status: OrderStatus) =>
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        remoteOrderPatch(o.ref, { status });
        return { ...o, status };
      }),
    );

  const shipOrder = async (order: Order) => {
    const { tracking } = await api.yalidineShip({
      orderRef: order.ref,
      wilaya: order.wilayaCode,
      commune: order.commune,
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'expediee', tracking } : o)),
    );
    remoteOrderPatch(order.ref, { status: 'expediee', yalidine_tracking: tracking });
  };

  // ---------------- Produits & cross-sell ----------------
  const upsertProduct = (p: CatalogProduct, linkIds: string[]) => {
    setCatalog((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
    });
    setLinks((prev) => ({ ...prev, [p.id]: linkIds }));
    remoteUpsertProduct(p); // Supabase : products.upsert (optimiste)
  };

  const deleteProduct = (id: string) => {
    setCatalog((prev) => prev.filter((p) => p.id !== id));
    remoteDeleteProduct(id);
    setLinks((prev) => {
      const next = { ...prev };
      delete next[id];
      Object.keys(next).forEach((k) => {
        next[k] = next[k].filter((x) => x !== id);
      });
      return next;
    });
  };

  const setProductActive = (id: string, active: boolean) => {
    setCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: active } : p)));
    if (supabase) {
      void supabase
        .from('products')
        .update({ is_active: active })
        .eq('slug', id)
        .then(({ error }) => error && console.warn('[supabase] products.update', error.message));
    }
  };

  const addPack = ({
    name,
    productIds,
    price,
    image,
  }: {
    name: string;
    productIds: string[];
    price: number;
    image?: string;
  }) => {
    const items = productIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is CatalogProduct => Boolean(p));
    const sum = items.reduce((s, p) => s + p.price, 0);
    const id = `pack-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now()}`;
    const pack: CatalogProduct = {
      id,
      name,
      type: 'pack',
      category: 'Packs',
      price,
      oldPrice: sum > price ? sum : undefined,
      images: image ? [image] : items.slice(0, 2).map((p) => p.images[0]),
      shortDesc: `Coffret de ${items.length} produits : ${items.map((p) => p.name.split(' — ')[0]).join(', ')}.`,
      description: `Le pack « ${name} » réunit ${items.length} soins Oryam dans un coffret signature, à prix préférentiel.`,
      ingredients: items.map((p) => `• ${p.name}`).join('\n'),
      usage: 'Suivez les conseils d’utilisation de chaque produit du coffret, dans l’ordre indiqué sur leurs fiches.',
      inStock: true,
      rating: 5.0,
      reviews: 0,
      promo: sum > price,
      related: productIds,
      stock: 10,
      costPrice: items.reduce((s, p) => s + p.costPrice, 0),
      isActive: true,
      variants: [],
      packItems: productIds.map((pid) => ({ productId: pid, qty: 1 })),
    };
    setCatalog((prev) => [pack, ...prev]);
    setLinks((prev) => ({ ...prev, [id]: productIds }));
    remoteUpsertProduct(pack);
  };

  // ---------------- Promotions (locales + écritures Supabase) ----------------
  const addPromo = (p: Omit<Promo, 'id' | 'usages'>) => {
    setPromos((prev) => [{ ...p, id: uid('pr'), usages: 0 }, ...prev]);
    if (supabase) {
      void supabase
        .from('promotions')
        .insert({
          code: p.code,
          kind: p.kind,
          value: p.value,
          min_subtotal: p.minSubtotal,
          active: p.active,
        })
        .then(({ error }) => error && console.warn('[supabase] promotions.insert', error.message));
    }
  };

  const togglePromo = (id: string) => {
    const promo = promos.find((p) => p.id === id);
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
    if (supabase && promo) {
      void supabase
        .from('promotions')
        .update({ active: !promo.active })
        .eq('code', promo.code)
        .then(({ error }) => error && console.warn('[supabase] promotions.update', error.message));
    }
  };

  const deletePromo = (id: string) => {
    const promo = promos.find((p) => p.id === id);
    setPromos((prev) => prev.filter((p) => p.id !== id));
    if (supabase && promo) {
      void supabase
        .from('promotions')
        .delete()
        .eq('code', promo.code)
        .then(({ error }) => error && console.warn('[supabase] promotions.delete', error.message));
    }
  };

  const validatePromo = (code: string, subtotal: number) => {
    const promo = promos.find(
      (p) => p.active && p.code.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!promo) return { ok: false as const, message: 'Code promo invalide ou expiré.' };
    if (subtotal < promo.minSubtotal)
      return {
        ok: false as const,
        message: `Minimum ${promo.minSubtotal.toLocaleString('fr-FR')} DA d’achat pour ce code.`,
      };
    const discount =
      promo.kind === 'percent'
        ? Math.min(subtotal, Math.round((subtotal * promo.value) / 100))
        : Math.min(subtotal, promo.value);
    return { ok: true as const, promo, discount };
  };

  const incrementPromoUsage = (code: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.code === code ? { ...p, usages: p.usages + 1 } : p)),
    );
    if (supabase) {
      void (async () => {
        const { data } = await supabase
          .from('promotions')
          .select('usage_count')
          .eq('code', code)
          .maybeSingle();
        await supabase
          .from('promotions')
          .update({ usage_count: (Number(data?.usage_count) || 0) + 1 })
          .eq('code', code);
      })();
    }
  };

  // ---------------- Inventaire ----------------
  const addMovement = (kind: MovementKind, productId: string, qty: number, reason: string) => {
    if (qty <= 0) return;
    const product = catalog.find((p) => p.id === productId);
    if (!product) return;
    setCatalog((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const stock =
          kind === 'retrait' ? Math.max(0, p.stock - qty) : p.stock + qty;
        return { ...p, stock };
      }),
    );
    setLedger((prev) => [
      {
        id: uid('l'),
        at: Date.now(),
        kind,
        productId,
        productName: product.name,
        qty,
        reason: reason || 'Mouvement manuel',
        author: session ? `${session.name.split(' ')[0]} (${session.role})` : 'Admin',
      },
      ...prev,
    ]);
  };

  // ---------------- Livraison ----------------
  const updateWilayaRate = (code: number, home: number, stopdesk: number) =>
    setShipping((prev) =>
      prev.map((w) => (w.code === code ? { ...w, home, stopdesk } : w)),
    );

  const updateCommuneRate = (code: number, name: string, extra: number) =>
    setShipping((prev) =>
      prev.map((w) =>
        w.code === code
          ? {
              ...w,
              communes: w.communes.map((co) => (co.name === name ? { ...co, extra } : co)),
            }
          : w,
      ),
    );

  const addCommune = (code: number, name: string) =>
    setShipping((prev) =>
      prev.map((w) =>
        w.code === code && !w.communes.some((co) => co.name === name)
          ? { ...w, communes: [...w.communes, { name, extra: 0 }] }
          : w,
      ),
    );

  // ---------------- Méta ----------------
  // Avant : ne mettait à jour que le state local (jamais persisté en base,
  // donc réinitialisé à vide à chaque nouvelle session/appareil admin).
  const setMetaConfig = (cfg: MetaConfig) => {
    setMetaConfigState(cfg);
    if (supabase) {
      void supabase
        .from('meta_config')
        .upsert(
          {
            id: 1,
            pixel_id: cfg.pixelId || null,
            capi_token: cfg.capiToken || null,
            tiktok_pixel_id: cfg.tiktokPixelId || null,
            enabled: cfg.enabled,
          },
          { onConflict: 'id' },
        )
        .then(({ error }) => error && console.warn('[supabase] meta_config.upsert', error.message));
    }
  };

  // ---------------- Dérivés ----------------
  const activeProducts = useMemo(() => catalog.filter((p) => p.isActive), [catalog]);
  const promoProducts = useMemo(
    () => activeProducts.filter((p) => p.promo),
    [activeProducts],
  );
  const packProducts = useMemo(
    () => activeProducts.filter((p) => p.type === 'pack'),
    [activeProducts],
  );
  const lowStock = useMemo(
    () => activeProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD),
    [activeProducts],
  );
  const getProduct = (id: string) => catalog.find((p) => p.id === id);

  const value: DataContextValue = {
    catalog,
    activeProducts,
    promoProducts,
    packProducts,
    getProduct,
    links,
    orders,
    promos,
    ledger,
    shipping,
    metaConfig,
    session,
    sessionLoading,
    lowStock,
    wishlistStats,
    trackWishlist,
    orderAlert,
    dismissOrderAlert: () => setOrderAlert(null),
    login,
    logout,
    changeEmail,
    changePassword,
    createOrder,
    setOrderStatus,
    shipOrder,
    upsertProduct,
    deleteProduct,
    setProductActive,
    addPromo,
    togglePromo,
    deletePromo,
    validatePromo,
    addPack,
    addMovement,
    updateWilayaRate,
    updateCommuneRate,
    addCommune,
    setMetaConfig,
    incrementPromoUsage,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
