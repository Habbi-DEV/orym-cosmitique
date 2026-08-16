import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';
import type { CatalogProduct } from '../lib/types';
import { LOW_STOCK_THRESHOLD } from '../lib/types';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { localizeProduct } from '../lib/i18n-product';
import { formatDA, promoPercent } from '../lib/format';
import { track } from '../lib/meta';

export default function ProductCard({ product, index = 0 }: { product: CatalogProduct; index?: number }) {
  const navigate = useNavigate();
  const { addToCart, openCheckout, toggleWishlist, isWished } = useStore();
  const { lang, t } = useLang();
  const [imgIndex, setImgIndex] = useState(0);
  const wished = isWished(product.id);
  const percent = promoPercent(product.price, product.oldPrice);
  const hasMultiple = product.images.length > 1;
  const view = localizeProduct(product, lang);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + product.images.length) % product.images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % product.images.length);
  };

  const order = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id, 1);
    track('AddToCart', { content_ids: [product.id], value: product.price, currency: 'DZD' });
    openCheckout();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
      className="group flex flex-col overflow-hidden rounded-[15px] border border-black/[0.06] bg-white shadow-[0_2px_18px_rgba(12,12,14,0.05)] transition-shadow hover:shadow-[0_10px_36px_rgba(12,12,14,0.10)]"
    >
      {/* Image + carousel */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden bg-cream"
        onClick={() => navigate(`/produit/${product.id}`)}
      >
        <motion.img
          key={imgIndex}
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          src={product.images[imgIndex]}
          alt={view.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Type tag — coin "début" de ligne : à gauche en FR, à droite en AR */}
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow rtl:left-auto rtl:right-2.5 ${
            product.type === 'pack' ? 'bg-violetp' : 'bg-tagblue'
          }`}
        >
          {product.type === 'pack' ? t('product.pack') : t('product.produit')}
        </span>

        {percent && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-navred px-2 py-0.5 text-[10px] font-bold text-white shadow rtl:left-auto rtl:right-2.5">
            -{percent}%
          </span>
        )}

        {/* Wishlist (seule action en coin "fin" de ligne) */}
        <button
          aria-label={t('nav.wishlist')}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-lg shadow-[0_2px_10px_rgba(12,12,14,0.18)] backdrop-blur transition active:scale-90 rtl:right-auto rtl:left-2.5 ${
            wished ? 'bg-navred text-white' : 'bg-white/95 text-ink hover:text-navred'
          }`}
        >
          <Heart size={15} className={wished ? 'fill-current' : ''} />
        </button>

        {/* Carousel arrows — position physique volontairement conservée
            (navigation d'images, indépendante du sens de lecture) */}
        {hasMultiple && (
          <>
            <button
              aria-label="Image précédente"
              onClick={prev}
              className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white active:scale-90"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              aria-label="Image suivante"
              onClick={next}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white active:scale-90"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3
          onClick={() => navigate(`/produit/${product.id}`)}
          className="cursor-pointer truncate font-serif text-[15.5px] font-semibold leading-snug tracking-tight transition-colors hover:text-blush"
          title={view.name}
        >
          {view.name}
        </h3>
        <p className="mt-1 min-h-[30px] text-[11.5px] leading-relaxed text-neutral-500 line-clamp-2">
          {view.shortDesc}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-extrabold tracking-tight">{formatDA(product.price)}</span>
          {product.oldPrice && (
            <span className="text-[11px] font-medium text-neutral-400 line-through">
              {formatDA(product.oldPrice)}
            </span>
          )}
        </div>

        <div className="mt-2">
          {product.inStock ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stock-soft px-2.5 py-1 text-[10px] font-semibold text-stockgreen">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stockgreen opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-stockgreen" />
              </span>
              {t('product.enStock')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-navred">
              <span className="h-1.5 w-1.5 rounded-full bg-navred" />
              {t('product.rupture')}
            </span>
          )}
          {product.inStock && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && (
            <span className="ms-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              {lang === 'fr' ? `Plus que ${product.stock}` : `تبقّى ${product.stock} فقط`}
            </span>
          )}
        </div>

        <button
          onClick={order}
          disabled={!product.inStock}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300"
        >
          <ShoppingBag size={14} />
          {product.inStock ? t('product.commander') : t('product.indisponible')}
        </button>
      </div>
    </motion.article>
  );
}
