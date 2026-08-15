import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { localizeProduct } from '../lib/i18n-product';
import { formatDA } from '../lib/format';

/** Normalise pour une recherche insensible aux accents/majuscules
 * (utile en FR : "creme" doit trouver "Crème"). */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();
  const { activeProducts } = useData();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      // Laisse l'animation d'ouverture démarrer avant de focaliser (évite le
      // saut de clavier mobile pendant la transition).
      setTimeout(() => inputRef.current?.focus(), 150);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSearch]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return activeProducts
      .filter((p) => {
        const view = localizeProduct(p, lang);
        const haystack = normalize(`${view.name} ${view.category} ${view.shortDesc}`);
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [query, activeProducts, lang]);

  const goTo = (id: string) => {
    closeSearch();
    navigate(`/produit/${id}`);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm"
          onClick={closeSearch}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-0 max-h-[85vh] w-full max-w-2xl overflow-hidden bg-white shadow-2xl sm:mt-20 sm:rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-black/8 px-4 py-3 sm:px-5">
              <Search size={18} className="shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
              />
              <button
                onClick={closeSearch}
                aria-label={t('common.fermer')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-cream hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {query.trim().length >= 2 && results.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-neutral-400">
                  {t('search.aucunResultat')}
                </p>
              )}

              {query.trim().length < 2 && (
                <p className="px-5 py-10 text-center text-sm text-neutral-400">
                  {t('search.hint')}
                </p>
              )}

              {results.map((p) => {
                const view = localizeProduct(p, lang);
                return (
                  <button
                    key={p.id}
                    onClick={() => goTo(p.id)}
                    className="flex w-full items-center gap-3 border-b border-black/[0.04] px-4 py-3 text-left transition hover:bg-cream sm:px-5"
                  >
                    <img
                      src={p.images[0]}
                      alt={view.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">{view.name}</p>
                      <p className="truncate text-[12px] text-neutral-400">{view.category}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-ink">
                      {formatDA(p.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
