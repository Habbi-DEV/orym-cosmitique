import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Hero() {
  const { cartCount, openCheckout, wishlist } = useStore();

  return (
    <section id="accueil" className="scroll-mt-20">
      {/* Pleine largeur, sans marge ni conteneur — l’image domine tout le
          hero, écran à écran, comme sur la référence fournie. */}
      <div className="relative w-full overflow-hidden rounded-t-[28px]">
        <img
          src="/img/hero.png"
          alt="Collection Oryam Cosmetics"
          className="aspect-[4/5] w-full object-cover sm:aspect-[16/9] md:aspect-[21/9]"
        />

        {/* Barre logo + icônes flottante directement sur l’image — texte et
            icônes en noir (pas de dégradé sombre, qui nuirait à leur
            lisibilité sur fond clair). */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex flex-col leading-none text-ink">
            <span className="font-serif text-[20px] font-bold tracking-tight">
              ORYAM<span className="text-blush">.</span>
            </span>
            <span className="text-[7.5px] font-semibold tracking-[0.4em] text-ink/70">
              COSMETICS
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link to="/wishlist" aria-label="Ma wishlist" className="relative text-ink">
              <Heart size={22} className={wishlist.length > 0 ? 'fill-navred text-navred' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-navred px-1 text-[9px] font-bold text-white shadow">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button onClick={openCheckout} aria-label="Panier" className="relative text-ink">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-navred px-1 text-[9px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
