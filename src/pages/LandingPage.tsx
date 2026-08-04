import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, Banknote, MessageCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import ProductReviews from '../components/ProductReviews';
import { promoPercent, formatDA } from '../lib/format';
import { track } from '../lib/meta';
import { getWhatsAppUrl } from '../lib/whatsapp';

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const { getProduct } = useData();
  const { addToCart, openCheckout } = useStore();
  const product = id ? getProduct(id) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) track('ViewContent', { content_ids: [product.id], value: product.price, currency: 'DZD' });
  }, [product]);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="font-serif text-2xl font-semibold">Offre introuvable</p>
        <Link to="/" className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
          Voir la boutique
        </Link>
      </div>
    );
  }

  const percent = promoPercent(product.price, product.oldPrice);

  const order = () => {
    addToCart(product.id, 1);
    track('AddToCart', { content_ids: [product.id], value: product.price, currency: 'DZD' });
    openCheckout();
  };

  return (
    <div className="min-h-screen bg-cream pb-28">
      {/* Barre minimale — pas de nav, pas de distraction */}
      <div className="border-b border-black/5 bg-white/90 py-3.5 text-center backdrop-blur">
        <Link to="/" className="font-serif text-lg font-bold tracking-tight">
          ORYAM<span className="text-blush">.</span>
        </Link>
      </div>

      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(12,12,14,0.08)]">
          <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        {percent && (
          <div className="mt-4 inline-block rounded-full bg-navred px-3.5 py-1.5 text-[12.5px] font-bold text-white">
            -{percent}% aujourd'hui seulement
          </div>
        )}

        <h1 className="mt-3 font-serif text-2xl font-semibold leading-tight sm:text-3xl">{product.name}</h1>

        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />
            ))}
          </div>
          <span className="text-[12.5px] text-neutral-500">({product.reviews} avis vérifiés)</span>
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-neutral-600">{product.shortDesc}</p>

        <div className="mt-5 flex items-baseline gap-2.5">
          <span className="font-serif text-3xl font-bold text-ink">{formatDA(product.price)}</span>
          {product.oldPrice && (
            <span className="text-[15px] text-neutral-400 line-through">{formatDA(product.oldPrice)}</span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white p-3">
            <Truck size={17} className="mx-auto text-blush" />
            <p className="mt-1.5 text-[10.5px] font-semibold leading-tight text-neutral-500">
              Livraison 58 wilayas
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <Banknote size={17} className="mx-auto text-blush" />
            <p className="mt-1.5 text-[10.5px] font-semibold leading-tight text-neutral-500">
              Paiement à la livraison
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <ShieldCheck size={17} className="mx-auto text-blush" />
            <p className="mt-1.5 text-[10.5px] font-semibold leading-tight text-neutral-500">
              Satisfait ou remboursé
            </p>
          </div>
        </div>

        <button
          onClick={order}
          className="mt-6 w-full rounded-full bg-blush py-4 text-[15px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
        >
          Commander maintenant — {formatDA(product.price)}
        </button>
        <a
          href={getWhatsAppUrl(`Bonjour, je suis intéressé(e) par ${product.name} ✨`)}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-3.5 text-[13.5px] font-bold text-ink transition hover:bg-cream"
        >
          <MessageCircle size={15} className="text-[#25D366]" />
          Une question ? Écrivez-nous sur WhatsApp
        </a>

        <div className="mt-10">
          <p className="mb-4 text-center font-serif text-xl font-semibold">
            Ce que nos clientes en disent
          </p>
          {/* ⚠️ Fix : même bug que ProductPage.tsx — product.id est le slug
              applicatif, pas l'uuid réel attendu par reviews.product_id. */}
          <ProductReviews productId={product.dbId ?? product.id} />
        </div>
      </main>

      {/* Barre CTA collante — conversion mobile */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-white/95 p-3 backdrop-blur">
        <button
          onClick={order}
          className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14px] font-bold text-white"
        >
          Commander — {formatDA(product.price)}
        </button>
      </div>
    </div>
  );
}
