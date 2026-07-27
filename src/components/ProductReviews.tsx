import { useEffect, useState, type FormEvent } from 'react';
import { Star, ShieldCheck, MessageSquareText, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { fetchProductReviews, submitReview } from '../lib/reviews';
import type { Review } from '../lib/types';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="p-0.5 transition active:scale-90"
        >
          <Star size={24} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />
        </button>
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="border-b border-black/[0.07] py-5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush-soft font-serif text-[13px] font-bold text-blush">
            {review.authorName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[13.5px] font-bold text-ink">{review.authorName}</p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
                />
              ))}
            </div>
          </div>
        </div>
        {review.verified && (
          <span className="flex items-center gap-1 rounded-full bg-stock-soft px-2.5 py-1 text-[10.5px] font-bold text-stockgreen">
            <ShieldCheck size={12} />
            Achat vérifié
          </span>
        )}
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600">{review.comment}</p>
      <p className="mt-2 text-[11px] text-neutral-400">
        {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { showToast } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductReviews(productId).then((data) => {
      if (!cancelled) {
        setReviews(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (authorName.trim().length < 2) return setFormError('Merci d’indiquer votre nom.');
    if (rating < 1) return setFormError('Merci de choisir une note.');
    if (comment.trim().length < 3) return setFormError('Votre commentaire est trop court.');

    setSubmitting(true);
    const res = await submitReview({ productId, authorName, phone, rating, comment });
    setSubmitting(false);

    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setReviews((prev) => [res.review, ...prev]);
    setAuthorName('');
    setPhone('');
    setRating(0);
    setComment('');
    setShowForm(false);
    showToast(
      res.review.verified ? 'Merci pour votre avis vérifié !' : 'Merci pour votre avis !',
    );
  };

  return (
    <section id="avis" className="mt-16 md:mt-24">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
            Vos retours comptent
          </p>
          <h2 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Avis <span className="italic text-blush">clients</span>
          </h2>
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    className={s <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
                  />
                ))}
              </div>
              <span className="text-[12.5px] font-semibold">{average.toFixed(1)}</span>
              <span className="text-[12.5px] text-neutral-400">
                ({reviews.length} avis)
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-bold text-white transition hover:bg-black"
        >
          <MessageSquareText size={15} />
          {showForm ? 'Annuler' : 'Laisser un avis'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-8 rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
          <p className="mb-4 text-[12.5px] font-semibold text-neutral-500">Votre note</p>
          <StarPicker value={rating} onChange={setRating} />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Votre nom"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone (optionnel — pour le badge « Achat vérifié »)"
              type="tel"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20"
            />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu’avez-vous pensé de ce produit ?"
            rows={3}
            className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20"
          />

          {formError && <p className="mt-3 text-[12.5px] font-medium text-navred">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-[13px] font-bold text-white transition hover:bg-blush-dark disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Publier mon avis
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-[13px] text-neutral-400">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-[13.5px] text-neutral-400">
          Aucun avis pour ce produit — soyez le premier à partager votre expérience !
        </p>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white px-5 sm:px-6">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
