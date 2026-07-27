/**
 * CLIENT SUPABASE UNIQUE (gateway)
 * --------------------------------
 * Le client est créé uniquement si les variables .env sont présentes.
 * Sans configuration, l'app continue de fonctionner sur la couche locale
 * (mode démo) — chaque opération distante devient un no-op silencieux.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('votre-projet'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

if (isSupabaseConfigured) {
  console.info('%c[supabase]%c Client connecté', 'color:#3ECF8E;font-weight:bold', 'color:inherit');
}

/**
 * SESSION VISITEUR ANONYME
 * ────────────────────────
 * ⚠️  PRÉ-REQUIS DASHBOARD : Supabase → Authentication → Sign In / Providers
 *     → activer « Allow anonymous sign-ins »
 *     (sans cette option, signInAnonymously() renvoie une erreur 422).
 *
 * Donne à chaque visiteur un auth.uid() STABLE et persistant (JWT stocké et
 * rafraîchi automatiquement) — requis par les policies RLS
 * `user_id = auth.uid()` des tables cart_items / wishlist_items.
 */
let sessionPromise: Promise<string | null> | null = null;

export const ensureVisitorSession = (): Promise<string | null> => {
  if (!supabase) return Promise.resolve(null);

  sessionPromise ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user.id;

    const { data: anon, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn(
        '[supabase] signInAnonymously refusé — activez « Allow anonymous sign-ins » dans le Dashboard',
        error.message,
      );
      sessionPromise = null; // autorise une nouvelle tentative plus tard
      return null;
    }
    return anon.user?.id ?? null;
  })();

  return sessionPromise;
};
