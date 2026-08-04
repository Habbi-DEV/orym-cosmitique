import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Hero() {
  const { cartCount, openCheckout, wishlist } = useStore();

  return (
    <section id="accueil" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-cream shadow-[0_10px_40px_rgba(12,12,14,0.1)]">
          <img
            src="/img/hero.png"
            alt="Collection Oryam Cosmetics"
            className="aspect-[4/5] w-full object-cover sm:aspect-[16/9] md:aspect-[21/9]"
          />

          {/* Barre logo + icônes flottante directement sur l’image — remplace
              le Header sticky classique sur la page d’accueil uniquement. */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/35 via-black/5 to-transparent px-4 py-4 sm:px-6">
            <Link to="/" className="flex flex-col leading-none text-white">
              <span className="font-serif text-[20px] font-bold tracking-tight">
                ORYAM<span className="text-blush">.</span>
              </span>
              <span className="text-[7.5px] font-semibold tracking-[0.4em] text-white/80">
                COSMETICS
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/wishlist"
                aria-label="Ma wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition hover:bg-white"
              >
                <Heart size={16} className={wishlist.length > 0 ? 'fill-navred text-navred' : ''} />
                {wishlist.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-navred px-1 text-[10px] font-bold text-white shadow">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button
                onClick={openCheckout}
                aria-label="Panier"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink/90 text-white backdrop-blur transition hover:bg-black"
              >
                <ShoppingBag size={16} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-navred px-1 text-[10px] font-bold text-white shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
