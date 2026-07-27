import { type ReactNode, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useData } from '../context/DataContext';
import ProductCard from './ProductCard';
import { getCategories, sortProducts, SORT_LABELS, type SortKey } from '../lib/catalog';

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
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
              category === null ? 'bg-ink text-white' : 'bg-cream text-neutral-500 hover:bg-black/5'
            }`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.name)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                category === c.name ? 'bg-ink text-white' : 'bg-cream text-neutral-500 hover:bg-black/5'
              }`}
            >
              {c.name} ({c.count})
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-neutral-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink outline-none"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-[13.5px] text-neutral-400">
          Aucun produit dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
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
