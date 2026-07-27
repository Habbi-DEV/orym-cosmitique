/**
 * SUPABASE STORAGE — Upload des images produits
 * ---------------------------------------------
 * Bucket attendu : `product-images` (PUBLIC)
 * Création : Supabase Dashboard → Storage → New bucket → Public.
 * Politique lecture publique incluse dans supabase/schema.sql (section storage).
 */
import { supabase } from './supabase';
import { compressImage } from './imageProcessing';

const BUCKET = 'product-images';

const sanitize = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Upload un fichier image et retourne son URL publique.
 * Retourne null si Supabase n'est pas configuré (fallback dataURL côté appelant).
 */
export const uploadProductImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;

  const optimized = await compressImage(file);
  const path = `products/${Date.now()}-${sanitize(optimized.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, optimized, {
    cacheControl: '31536000',
    contentType: optimized.type,
    upsert: false,
  });

  if (error) {
    console.error('[storage] upload échoué', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  console.info('%c[storage]%c Image publiée', 'color:#3ECF8E;font-weight:bold', 'color:inherit', data.publicUrl);
  return data.publicUrl;
};

/** Upload multiple en parallèle — retourne uniquement les URL réussies */
export const uploadProductImages = async (files: File[]): Promise<string[]> => {
  const results = await Promise.all(files.map((f) => uploadProductImage(f)));
  return results.filter((u): u is string => Boolean(u));
};
