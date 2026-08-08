import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import { useData } from '../context/DataContext';
import { useLang } from '../context/LanguageContext';
import { getCategories, slugifyCategory, sortProducts, type SortKey } from '../lib/catalog';
import type { TranslationKey } from '../lib/translations';

const SORT_KEYS: { key: SortKey; labelKey: TranslationKey }[] = [
  { key: 'pertinence', labelKey: 'filters.populaires' },
  { key: 'prix-asc', labelKey: 'filters.prixCroissant' },
  { key: 'prix-desc', labelKey: 'filters.prixDecroissant' },
];

export default function CategoriesPage() {
  const { slug } = useParams();
  const { activeProducts } = useData();
  const { t, lang } = useLang();
  const categories = useMemo(() => getCategories(activeProducts), [activeProducts]);
  const [sort, setSort] = useState<SortKey>('pertinence');

  const categoryLabel = (name: string) =>
    lang === 'fr' ? name : activeProducts.find((p) => p.category === name)?.categoryAr || name;

  const current = slug ? categories.find((c) => c.slug === slug) : null;
  const products = useMemo(() => {
    if (!current) return [];
    return sortProducts(
      activeProducts.filter((p) => slugifyCategory(p.category) === current.slug),
      sort,
    );
  }, [activeProducts, current, sort]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {!current ? (
          <>
            <div className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
                {t('categoriesPage.explorez')}
              </p>
              <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('categoriesPage.toutesNosCategories')}
              </h1>
            </div>
            {categories.length === 0 ? (
              <p className="text-center text-[13.5px] text-neutral-400">{t('categoriesPage.aucuneCategorie')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {categories.map((c, i) => (
                  <motion.div
                    key={c.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <Link
                      to={`/categories/${c.slug}`}
                      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-cream shadow-sm"
                    >
                      <img
                        src={c.image}
                        alt={categoryLabel(c.name)}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="relative flex items-center justify-between p-4">
                        <div>
                          <p className="font-serif text-lg font-semibold text-white">{categoryLabel(c.name)}</p>
                          <p className="text-[11.5px] text-white/75">
                            {c.count} {t(c.count > 1 ? 'filters.pieces' : 'filters.piece')}
                          </p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-ink">
                          <ArrowRight size={14} className="rtl:rotate-180 text-white group-hover:text-ink" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Link to="/categories" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-blush">
              <ArrowLeft size={15} className="rtl:rotate-180" />
              {t('categoriesPage.toutesNosCategories')}
            </Link>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
                  {t('categoriesPage.categorie')}
                </p>
                <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {categoryLabel(current.name)}
                </h1>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {products.length} {t(products.length > 1 ? 'filters.pieces' : 'filters.piece')}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-neutral-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink outline-none"
                >
                  {SORT_KEYS.map(({ key, labelKey }) => (
                    <option key={key} value={key}>
                      {t(labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {products.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-[13.5px] text-neutral-400">
                {t('filters.aucunProduit')}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
