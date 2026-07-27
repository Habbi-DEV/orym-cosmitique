import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Instagram, ShoppingBag, ArrowLeft, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getWhatsAppUrl } from '../lib/whatsapp';

export default function Header() {
  const { cartCount, openCheckout, wishlist } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isProduct = location.pathname.startsWith('/produit');

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {isProduct && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-ink transition hover:bg-cream"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-serif text-[22px] font-bold tracking-tight">
              ORYAM<span className="text-blush">.</span>
            </span>
            <span className="text-[8.5px] font-semibold tracking-[0.42em] text-neutral-400">
              COSMETICS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-ink transition hover:border-blush hover:text-blush sm:flex"
          >
            <Instagram size={16} />
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-[#25D366] transition hover:border-[#25D366] sm:flex"
          >
            <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.223.6 4.306 1.646 6.096L3 29l8.104-2.593A12.93 12.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm7.53 18.36c-.32.9-1.58 1.65-2.59 1.87-.7.15-1.61.27-4.68-1.01-3.93-1.63-6.46-5.62-6.66-5.88-.19-.26-1.6-2.13-1.6-4.07 0-1.94.99-2.9 1.35-3.29.32-.35.7-.44.93-.44.23 0 .47 0 .67.01.22.01.5-.08.78.6.32.78 1.08 2.7 1.17 2.9.1.19.16.42.03.68-.13.26-.2.42-.4.65-.2.23-.42.51-.6.69-.2.19-.4.4-.18.79.23.4 1.02 1.68 2.18 2.72 1.5 1.34 2.76 1.76 3.16 1.96.4.19.63.16.86-.1.23-.26.98-1.14 1.24-1.54.26-.4.52-.33.87-.2.35.13 2.24 1.06 2.63 1.25.39.19.65.29.74.46.1.16.1.94-.21 1.84Z" />
            </svg>
          </a>
          <Link
            to="/wishlist"
            aria-label="Ma wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-ink transition hover:border-navred hover:text-navred"
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
            className="relative flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-white transition hover:bg-black"
          >
            <ShoppingBag size={15} />
            <span className="hidden text-xs font-semibold sm:block">Panier</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-navred px-1 text-[10px] font-bold text-white shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
