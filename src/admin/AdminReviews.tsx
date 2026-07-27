import { useEffect, useMemo, useState } from 'react';
import { Star, ShieldCheck, Eye, EyeOff, Trash2, Search, MessagesSquare } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { fetchAllReviews, setReviewVisibility, deleteReview } from '../lib/reviews';
import type { Review } from '../lib/types';

type AdminReview = Review & { productName: string; isVisible: boolean };

export default function AdminReviews() {
  const { showToast } = useStore();
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
      showToast(r.isVisible ? 'Avis masqué du site' : 'Avis republié sur le site');
    } else {
      showToast('Une erreur est survenue');
    }
    setBusyId(null);
  };

  const remove = async (r: AdminReview) => {
    if (!window.confirm(`Supprimer définitivement l’avis de ${r.authorName} ?`)) return;
    setBusyId(r.id);
    const ok = await deleteReview(r.id);
    if (ok) {
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      showToast('Avis supprimé');
    } else {
      showToast('Une erreur est survenue');
    }
    setBusyId(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Confiance client</p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Avis clients</h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Modérez les avis publiés sur la boutique — masquez ou supprimez tout contenu inapproprié.
        </p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit, un client, un mot…"
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-blush"
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-400">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <MessagesSquare size={28} className="text-neutral-300" />
          <p className="text-[13.5px] text-neutral-400">Aucun avis pour le moment.</p>
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
                        Vérifié
                      </span>
                    )}
                    {!r.isVisible && (
                      <span className="rounded-full bg-navred/10 px-2 py-0.5 text-[10px] font-bold text-navred">
                        Masqué
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
                    title={r.isVisible ? 'Masquer' : 'Republier'}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 text-ink transition hover:bg-cream disabled:opacity-40"
                  >
                    {r.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => remove(r)}
                    title="Supprimer"
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
