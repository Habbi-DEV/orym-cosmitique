import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import { useData } from './DataContext';

export interface CartItem {
  id: string;
  qty: number;
}

interface ToastState {
  msg: string;
  key: number;
}

interface StoreContextValue {
  cart: CartItem[];
  addToCart: (id: string, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  toast: ToastState | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// Lecture localStorage SYNCHRONE avant le premier rendu (lazy initialization)
const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** Fusion local + distant : union par produit, la plus grande quantité gagne */
const mergeCart = (local: CartItem[], remote: CartItem[]): CartItem[] => {
  const map = new Map<string, number>();
  local.forEach((i) => map.set(i.id, i.qty));
  remote.forEach((i) => map.set(i.id, Math.max(map.get(i.id) ?? 0, i.qty)));
  return [...map.entries()].map(([id, qty]) => ({ id, qty }));
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // 1. Lazy initialization — localStorage lu AVANT le premier rendu
  const [cart, setCart] = useState<CartItem[]>(() => load('oryam-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => load('oryam-wishlist', []));
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydratation distante terminée ? (évite d'écraser Supabase avec un état vide)
  const hydrated = useRef(false);

  const { getProduct, trackWishlist } = useData();

  // 2. Hydratation initiale depuis Supabase + fusion local/distant
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [remoteCart, remoteWishlist] = await Promise.all([
          api.fetchCart(),
          api.fetchWishlist(),
        ]);
        if (cancelled) return;
        if (remoteCart.length > 0) setCart((prev) => mergeCart(prev, remoteCart));
        if (remoteWishlist.length > 0) {
          setWishlist((prev) => [...new Set([...prev, ...remoteWishlist])]);
        }
      } finally {
        if (!cancelled) hydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Persistance locale à chaque changement + sync Supabase débouncée (400 ms)
  //    — uniquement APRÈS la fin de l'hydratation initiale
  useEffect(() => {
    localStorage.setItem('oryam-cart', JSON.stringify(cart));
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      void api.syncCart(cart);
    }, 400);
    return () => clearTimeout(t);
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('oryam-wishlist', JSON.stringify(wishlist));
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      void api.syncWishlist(wishlist);
    }, 400);
    return () => clearTimeout(t);
  }, [wishlist]);

  const showToast = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { id, qty }];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (id: string) => {
      setWishlist((prev) => {
        const active = prev.includes(id);
        showToast(active ? 'Retiré de vos favoris' : 'Ajouté à vos favoris');
        trackWishlist(id, !active); // insight admin « produits désirés »
        return active ? prev.filter((w) => w !== id) : [...prev, id];
      });
    },
    [showToast, trackWishlist],
  );

  const isWished = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + (getProduct(i.id)?.price ?? 0) * i.qty, 0),
    [cart, getProduct],
  );

  const value: StoreContextValue = {
    cart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    wishlist,
    toggleWishlist,
    isWished,
    checkoutOpen,
    openCheckout: () => setCheckoutOpen(true),
    closeCheckout: () => setCheckoutOpen(false),
    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextValue => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
