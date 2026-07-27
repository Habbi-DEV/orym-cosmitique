import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Leaf,
  Droplets,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { formatDA, promoPercent } from '../lib/format';
import { track } from '../lib/meta';

function Accordion({
  icon: Icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-black/[0.07]">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-4 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blush-soft text-blush">
            <Icon size={16} />
          </span>
          <span className="font-serif text-[16.5px] font-semibold">{title}</span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-12 pr-2 text-[13.5px] leading-relaxed text-neutral-500">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { getProduct, links } = useData();
  const product = id ? getProduct(id) : undefined;
  const { addToCart, openCheckout, toggleWishlist, isWished, showToast } = useStore();

  const [imgIndex, setImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState<string | null>('ingredients');

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgIndex(0);
    setQty(1);
  }, [id]);

  const related = useMemo(
    () =>
      product
        ? (links[product.id] ?? product.related)
            .map((r) => getProduct(r))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
        : [],
    [product, links, getProduct],
  );

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-serif text-3xl font-semibold">Produit introuvable</p>
          <p className="mt-2 text-sm text-neutral-500">
            Ce soin n’existe plus ou a été déplacé.
          </p>
          <Link
            to="/"
            className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
          >
            Retour à la boutique
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const wished = isWished(product.id);
  const percent = promoPercent(product.price, product.oldPrice);
  const hasMultiple = product.images.length > 1;

  const order = () => {
    addToCart(product.id, qty);
    track('AddToCart', { content_ids: [product.id], value: product.price * qty, currency: 'DZD' });
    openCheckout();
  };

  const toggleAcc = (key: string) => setOpenAcc((cur) => (cur === key ? null : key));

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-[25px] bg-cream shadow-[0_10px_40px_rgba(12,12,14,0.08)]">
              <motion.img
                key={imgIndex}
                initial={{ opacity: 0.3, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={product.images[imgIndex]}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide text-white shadow ${
                  product.type === 'pack' ? 'bg-violetp' : 'bg-tagblue'
                }`}
              >
                {product.type === 'pack' ? 'Pack' : 'Produit'}
              </span>
              {/* Wishlist (sole top-right action) */}
              <button
                aria-label="Ajouter aux favoris"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl shadow-[0_2px_12px_rgba(12,12,14,0.18)] backdrop-blur transition active:scale-90 ${
                  wished ? 'bg-navred text-white' : 'bg-white/95 text-ink hover:text-navred'
                }`}
              >
                <Heart size={18} className={wished ? 'fill-current' : ''} />
              </button>
              {hasMultiple && (
                <>
                  <button
                    aria-label="Image précédente"
                    onClick={() =>
                      setImgIndex((i) => (i - 1 + product.images.length) % product.images.length)
                    }
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white active:scale-90"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    aria-label="Image suivante"
                    onClick={() => setImgIndex((i) => (i + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white active:scale-90"
                  >
                    <ChevronRight size={17} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIndex(i)}
                  className={`overflow-hidden rounded-2xl border-2 bg-cream transition ${
                    imgIndex === i ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} — vue ${i + 1}`}
                    className="h-20 w-20 object-cover sm:h-24 sm:w-24"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
              Oryam Cosmetics
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-[44px] sm:leading-[1.15]">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    className={
                      s <= Math.round(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300'
                    }
                  />
                ))}
              </div>
              <span className="text-[12.5px] font-semibold">{product.rating.toFixed(1)}</span>
              <a
                href="#avis"
                className="text-[12.5px] text-neutral-400 underline decoration-dotted underline-offset-2 transition hover:text-blush"
              >
                ({product.reviews} avis vérifiés)
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-extrabold tracking-tight">
                {formatDA(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-base font-medium text-neutral-400 line-through">
                  {formatDA(product.oldPrice)}
                </span>
              )}
              {percent && (
                <span className="rounded-full bg-navred px-2.5 py-1 text-[11px] font-bold text-white">
                  -{percent}%
                </span>
              )}
            </div>

            <div className="mt-3">
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stock-soft px-3 py-1.5 text-[11.5px] font-semibold text-stockgreen">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stockgreen opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-stockgreen" />
                  </span>
                  En stock — expédié sous 24h
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-[11.5px] font-semibold text-navred">
                  <span className="h-1.5 w-1.5 rounded-full bg-navred" />
                  Rupture de stock
                </span>
              )}
            </div>

            <p className="mt-5 text-[14.5px] leading-relaxed text-neutral-600">
              {product.description}
            </p>

            {/* Quantity + CTA */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex items-center gap-4 rounded-full border border-neutral-200 bg-white px-4 py-3">
                <button
                  aria-label="Diminuer la quantité"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-neutral-500 transition hover:text-ink active:scale-90"
                >
                  <Minus size={16} />
                </button>
                <span className="w-5 text-center text-[15px] font-extrabold">{qty}</span>
                <button
                  aria-label="Augmenter la quantité"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="text-neutral-500 transition hover:text-ink active:scale-90"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={order}
                disabled={!product.inStock}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blush px-4 py-4 text-[14px] font-bold text-white shadow-xl shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none disabled:hover:bg-neutral-300 sm:text-[14.5px]"
              >
                <ShoppingBag size={17} className="shrink-0" />
                <span className="truncate">
                  {product.inStock ? `Commander · ${formatDA(product.price * qty)}` : 'Indisponible'}
                </span>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[12px] text-neutral-500">
              <ShieldCheck size={14} className="shrink-0 text-stockgreen" />
              Paiement à la livraison · Retour sous 7 jours si produit non ouvert
            </div>

            {/* Accordions */}
            <div className="mt-8 border-t border-black/[0.07]">
              <Accordion
                icon={Leaf}
                title="Ingrédients"
                open={openAcc === 'ingredients'}
                onToggle={() => toggleAcc('ingredients')}
              >
                {product.ingredients}
              </Accordion>
              <Accordion
                icon={Droplets}
                title="Conseils d’utilisation"
                open={openAcc === 'usage'}
                onToggle={() => toggleAcc('usage')}
              >
                {product.usage}
              </Accordion>
              <Accordion
                icon={Truck}
                title="Livraison & Retours"
                open={openAcc === 'delivery'}
                onToggle={() => toggleAcc('delivery')}
              >
                Livraison vers les 58 wilayas en 24h à 72h, à domicile ou au point relais.
                Paiement en espèces à la réception. Retour accepté sous 7 jours pour tout produit
                non ouvert — notre équipe vous accompagne dans la procédure.
              </Accordion>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {/* Cross-sell */}
        <section className="mt-16 md:mt-24">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
                Complétez votre rituel
              </p>
              <h2 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Vous aimerez <span className="italic text-blush">aussi</span>
              </h2>
            </div>
            <Link
              to="/"
              onClick={() => showToast('Retour à la boutique')}
              className="text-[13px] font-bold text-ink underline decoration-blush decoration-2 underline-offset-4 transition hover:text-blush"
            >
              Voir toute la collection
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>

        {/* Bundle hint */}
        {product.type === 'produit' && (
          <section className="mt-14">
            <div className="flex flex-col items-start justify-between gap-5 rounded-[25px] bg-ink p-7 text-white sm:flex-row sm:items-center">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-violetp">
                  Souvent achetés ensemble
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold">
                  Économisez avec nos packs rituels
                </h3>
                <p className="mt-1.5 max-w-md text-[13px] text-white/60">
                  Ce produit fait partie de nos coffrets signature — jusqu’à 25% moins cher que
                  les produits achetés séparément.
                </p>
              </div>
              <Link
                to="/"
                state={{ scrollTo: 'packs' }}
                className="shrink-0 rounded-full bg-violetp px-6 py-3 text-[13px] font-bold text-white shadow-lg shadow-violetp/30 transition hover:bg-violetp-dark"
              >
                Découvrir les packs
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-neutral-400">{product.name}</p>
            <p className="text-[16px] font-extrabold leading-tight">
              {formatDA(product.price * qty)}
            </p>
          </div>
          <button
            onClick={order}
            disabled={!product.inStock}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[13.5px] font-bold text-white transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300"
          >
            <ShoppingBag size={16} />
            {product.inStock ? 'Commander' : 'Indisponible'}
          </button>
        </div>
      </div>
    </div>
  );
}
