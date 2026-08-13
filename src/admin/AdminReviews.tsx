import { useEffect, useMemo, useState } from 'react';
import { Star, ShieldCheck, Eye, EyeOff, Trash2, Search, MessagesSquare } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { fetchAllReviews, setReviewVisibility, deleteReview } from '../lib/reviews';
import { supabase } from '../lib/supabase';
import type { Review } from '../lib/types';

type AdminReview = Review & { productName: string; isVisible: boolean };

export default function AdminReviews() {
  const { showToast } = useStore();
  const { t } = useLang();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAllReviews().then((data) => {
      setReviews(data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  // Temps réel : un nouvel avis client (ou une modération faite depuis un
  // autre poste admin) recharge la liste automatiquement — pas de bouton
  // "actualiser" à cliquer. La table `reviews` n'expose pas le nom du
  // produit dans son payload Realtime (pas de jointure), donc on refait un
  // fetch complet plutôt que de fusionner partiellement.
  useEffect(() => {
    if (!supabase) return;
    // Alias local : TypeScript ne conserve pas le narrowing du `if`
    // ci-dessus à l'intérieur de la fonction de cleanup retournée par
    // useEffect, car `supabase` est un import de module (SupabaseClient |
    // null). `client` est une const locale à cet effet, donc son type
    // non-null reste garanti dans la closure de cleanup.
    const client = supabase;
    const channel = client
      .channel('admin-reviews-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, load)
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q),
    );
  }, [reviews, query]);

  const toggleVisible = async (r: AdminReview) => {
    setBusyId(r.id);
    const ok = await setReviewVisibility(r.id, !r.isVisible);
    if (ok) {
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, isVisible: !r.isVisible } : x)));
      showToast(r.isVisible ? t('adminReviewsPage.avisMasque') : t('adminReviewsPage.avisRepublie'));
    } else {
      showToast(t('adminReviewsPage.erreurGenerique'));
    }
    setBusyId(null);
  };

  const remove = async (r: AdminReview) => {
    if (!window.confirm(`${t('adminReviewsPage.confirmSuppr')} ${r.authorName} ?`)) return;
    setBusyId(r.id);
    const ok = await deleteReview(r.id);
    if (ok) {
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      showToast(t('adminReviewsPage.avisSupprime'));
    } else {
      showToast(t('adminReviewsPage.erreurGenerique'));
    }
    setBusyId(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
          {t('adminReviewsPage.confianceClient')}
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('adminReviewsPage.titre')}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">{t('adminReviewsPage.sub')}</p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('adminReviewsPage.rechercherPlaceholder')}
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-blush"
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-400">{t('adminReviewsPage.chargement')}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <MessagesSquare size={28} className="text-neutral-300" />
          <p className="text-[13.5px] text-neutral-400">{t('adminReviewsPage.aucunAvis')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border bg-white p-4 sm:p-5 ${
                r.isVisible ? 'border-black/8' : 'border-navred/20 bg-navred/[0.03]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-bold uppercase tracking-wide text-blush">
                    {r.productName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[13.5px] font-bold text-ink">{r.authorName}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
                        />
                      ))}
                    </div>
                    {r.verified && (
                      <span className="flex items-center gap-1 rounded-full bg-stock-soft px-2 py-0.5 text-[10px] font-bold text-stockgreen">
                        <ShieldCheck size={11} />
                        {t('adminReviewsPage.verifie')}
                      </span>
                    )}
                    {!r.isVisible && (
                      <span className="rounded-full bg-navred/10 px-2 py-0.5 text-[10px] font-bold text-navred">
                        {t('adminReviewsPage.masque')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{r.comment}</p>
                  <p className="mt-1.5 text-[11px] text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => toggleVisible(r)}
                    title={r.isVisible ? t('adminReviewsPage.masquer') : t('adminReviewsPage.republier')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 text-ink transition hover:bg-cream disabled:opacity-40"
                  >
                    {r.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => remove(r)}
                    title={t('adminReviewsPage.supprimer')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 text-navred transition hover:bg-navred/10 disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
