import { supabase } from './supabase';
import type { Review } from './types';

interface ReviewRow {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  verified: boolean;
  is_visible: boolean;
  created_at: string;
  products?: { name: string } | null;
}

const rowToReview = (row: ReviewRow): Review => ({
  id: row.id,
  productId: row.product_id,
  authorName: row.author_name,
  rating: row.rating,
  comment: row.comment,
  verified: row.verified,
  createdAt: new Date(row.created_at).getTime(),
});

/** Avis visibles d'un produit, du plus récent au plus ancien */
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] reviews.select', error.message);
    return [];
  }
  return (data ?? []).map(rowToReview);
}

/** Soumet un avis — la vérification "Achat vérifié" est faite côté base (submit_review) */
export async function submitReview(input: {
  productId: string;
  authorName: string;
  phone: string;
  rating: number;
  comment: string;
}): Promise<{ ok: true; review: Review } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Le service des avis n’est pas disponible pour le moment.' };
  }
  const { data, error } = await supabase.rpc('submit_review', {
    p_product_id: input.productId,
    p_author_name: input.authorName,
    p_phone: input.phone || null,
    p_rating: input.rating,
    p_comment: input.comment,
  });
  if (error) {
    console.warn('[supabase] submit_review', error.message);
    return { ok: false, message: error.message || 'Impossible d’enregistrer votre avis.' };
  }
  return { ok: true, review: rowToReview(data as ReviewRow) };
}

/** Tous les avis (visibles + masqués), avec le nom du produit — pour l'admin */
export async function fetchAllReviews(): Promise<(Review & { productName: string; isVisible: boolean })[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products ( name )')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] reviews.select (admin)', error.message);
    return [];
  }
  return (data ?? []).map((row: ReviewRow) => ({
    ...rowToReview(row),
    productName: row.products?.name ?? '—',
    isVisible: row.is_visible,
  }));
}

export async function setReviewVisibility(id: string, visible: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('reviews').update({ is_visible: visible }).eq('id', id);
  if (error) console.warn('[supabase] reviews.update', error.message);
  return !error;
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) console.warn('[supabase] reviews.delete', error.message);
  return !error;
}
