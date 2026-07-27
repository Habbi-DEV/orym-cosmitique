/**
 * CLIENT CHATBOT — appelle l'Edge Function Supabase `chat-assistant`
 * (elle-même proxy vers Gemini). Aucune clé API n'est jamais présente
 * côté navigateur.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isChatConfigured = Boolean(url && anonKey && !url.includes('votre-projet'));

export async function askAssistant(
  message: string,
  history: ChatMessage[],
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  if (!isChatConfigured || !url || !anonKey) {
    return { ok: false, error: 'Assistant non configuré (VITE_SUPABASE_URL manquant).' };
  }
  try {
    const res = await fetch(`${url}/functions/v1/chat-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.reply) {
      return { ok: false, error: data?.error ?? 'Erreur inconnue' };
    }
    return { ok: true, reply: data.reply as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' };
  }
}
