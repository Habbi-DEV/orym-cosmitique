import { type ReactNode, useMemo, useState } from 'react';
import { Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import ProductCard from './ProductCard';
import { getCategories, sortProducts, type SortKey } from '../lib/catalog';

function SectionHead({
  eyebrow,
  title,
  sub,
  chip,
}: {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  chip?: { text: string; classes: string };
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">{eyebrow}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          {chip && (
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${chip.classes}`}>
              {chip.text}
            </span>
          )}
        </div>
        <p className="mt-2 max-w-md text-[13.5px] text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}

// Tri rapide — icône + texte minimal (pas de fond plein), dans le même
// esprit éditorial que les catégories ci-dessous.
const QUICK_SORTS: { key: SortKey; label: string; icon: typeof Flame }[] = [
  { key: 'pertinence', label: 'Populaires', icon: Flame },
  { key: 'prix-asc', label: 'Prix croissant', icon: ArrowUp },
  { key: 'prix-desc', label: 'Prix décroissant', icon: ArrowDown },
];

// Cache la barre de défilement native (Tailwind n'a pas d'utilitaire
// "scrollbar-none" intégré — la classe utilisée précédemment n'existait
// pas, laissant la scrollbar système visible en travers du texte).
const noScrollbarStyle = { scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const };

export function ProductsSection() {
  const { activeProducts } = useData();
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('pertinence');
  const categories = useMemo(() => getCategories(activeProducts), [activeProducts]);

  const filtered = useMemo(() => {
    const base = category ? activeProducts.filter((p) => p.category === category) : activeProducts;
    return sortProducts(base, sort);
  }, [activeProducts, category, sort]);

  return (
    <section id="produits" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
      <SectionHead
        eyebrow="Notre Collection"
        title={
          <>
            Nos <span className="italic text-blush">Produits</span>
          </>
        }
        sub="Des formules concentrées en actifs naturels, pour chaque besoin de votre peau."
      />

      {categories.length > 1 && (
        <>
          {/* Catégories : texte simple, la sélection se distingue par un
              soulignement blush — style éditorial plutôt que boutons pleins. */}
          <div
            style={noScrollbarStyle}
            className="flex items-center gap-6 overflow-x-auto border-b border-black/[0.07] pb-2.5 [&::-webkit-scrollbar]:hidden"
          >
            <button
              onClick={() => setCategory(null)}
              className={`relative shrink-0 whitespace-nowrap pb-2.5 text-[13px] transition ${
                category === null ? 'font-semibold text-ink' : 'text-neutral-400 hover:text-ink'
              }`}
            >
              Toutes
              {category === null && (
                <span className="absolute inset-x-0 -bottom-[11px] h-[1.5px] bg-blush" />
              )}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(category === c.name ? null : c.name)}
                className={`relative shrink-0 whitespace-nowrap pb-2.5 text-[13px] transition ${
                  category === c.name ? 'font-semibold text-ink' : 'text-neutral-400 hover:text-ink'
                }`}
              >
                {c.name}
                {category === c.name && (
                  <span className="absolute inset-x-0 -bottom-[11px] h-[1.5px] bg-blush" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-4">
            <p className="shrink-0 whitespace-nowrap font-serif text-[13px] italic text-neutral-500">
              {filtered.length} pièce{filtered.length > 1 ? 's' : ''}
            </p>
            <div
              style={noScrollbarStyle}
              className="flex min-w-0 items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            >
              {QUICK_SORTS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] transition ${
                    sort === key ? 'font-semibold text-ink' : 'text-neutral-400 hover:text-ink'
                  }`}
                >
                  <Icon size={13} className={sort === key ? 'text-blush' : ''} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 p-8 text-center text-[13.5px] text-neutral-400">
          Aucun produit dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

export function PromosSection() {
  const { promoProducts } = useData();
  if (promoProducts.length === 0) return null;
  return (
    <section id="promos" className="scroll-mt-20 bg-blush-soft/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHead
          eyebrow="Offres Limitées"
          title={<span className="text-[#8E4254]">Promotions</span>}
          sub="Profitez de remises exceptionnelles sur une sélection de nos soins iconiques."
          chip={{ text: 'JUSQU’À -30%', classes: 'bg-navred text-white' }}
        />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {promoProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PacksSection() {
  const { packProducts } = useData();
  if (packProducts.length === 0) return null;
  return (
    <section id="packs" className="scroll-mt-20 bg-violetp-soft/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHead
          eyebrow="Rituels Complets"
          title={<span className="text-violetp-dark">Packs & Coffrets</span>}
          sub="Nos routines signature réunies dans des coffrets élégants, jusqu’à 25% moins chers que les produits séparés."
          chip={{ text: 'IDÉE CADEAU', classes: 'bg-violetp text-white' }}
        />
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:max-w-3xl">
          {packProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
