import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { useData } from '../context/DataContext';
import { useLang } from '../context/LanguageContext';
import { track } from '../lib/meta';

export default function WishlistPage() {
  const { wishlist, addToCart, openCheckout, showToast } = useStore();
  const { getProduct, activeProducts } = useData();
  const { t } = useLang();

  const wished = wishlist
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p && p.isActive));

  const addAll = () => {
    wished.forEach((p) => addToCart(p.id, 1));
    track('AddToCart', { content_ids: wished.map((p) => p.id), value: wished.reduce((s, p) => s + p.price, 0), currency: 'DZD' });
    showToast(wished.length > 1 ? `${wished.length} ${t('wishlistPage.toastPlusieurs')}` : t('wishlistPage.toastUn'));
    openCheckout();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
              {t('wishlistPage.eyebrow')}
            </p>
            <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('wishlistPage.title')}
            </h1>
            <p className="mt-2 max-w-md text-[13.5px] text-neutral-500">
              {wished.length > 0 ? `${wished.length} ${t('wishlistPage.subWithItems')}` : t('wishlistPage.subEmpty')}
            </p>
          </div>
          {wished.length > 0 && (
            <button
              onClick={addAll}
              className="flex items-center gap-2 rounded-full bg-blush px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
            >
              <ShoppingBag size={15} />
              {t('wishlistPage.toutAjouter')}
            </button>
          )}
        </div>

        {wished.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 pb-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {wished.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-[25px] border border-black/[0.06] bg-white px-6 py-16 text-center shadow-[0_2px_18px_rgba(12,12,14,0.05)]"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blush-soft text-blush">
              <Heart size={34} />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold">{t('wishlistPage.videTitle')}</h2>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-neutral-500">
              {t('wishlistPage.videSub')}
            </p>
            <Link
              to="/"
              state={{ scrollTo: 'produits' }}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              {t('wishlistPage.decouvrirCollection')}
              <ArrowRight size={16} className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </motion.div>
        )}

        {/* Suggestions when wishlist is low */}
        {wished.length > 0 && wished.length < 4 && (
          <section className="mt-4 pb-10">
            <p className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.22em] text-neutral-400">
              <Sparkles size={14} className="text-blush" />
              {t('wishlistPage.suggestions')}
            </p>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-5">
              {activeProducts
                .filter((p) => !wishlist.includes(p.id))
                .slice(0, 4)
                .map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
