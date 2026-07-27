/**
 * SUPABASE EDGE FUNCTION — chat-assistant
 * ----------------------------------------
 * Sert de proxy SÉCURISÉ entre le front (navigateur) et l'API Gemini :
 * la clé Gemini reste 100% côté serveur (secret Supabase), jamais dans
 * le bundle JS envoyé au visiteur.
 *
 * Déployer :  supabase functions deploy chat-assistant --no-verify-jwt
 * Secret :    supabase secrets set GEMINI_API_KEY=xxxxx
 *
 * ⚠️ Comme notify-order, le front appelle cette fonction directement
 * depuis le navigateur (fetch cross-origin) → elle DOIT répondre aux
 * requêtes CORS preflight (OPTIONS).
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Modèle Gemini utilisé — changez ici si Google en déprécie un.
const GEMINI_MODEL = 'gemini-flash-latest';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Récupère un aperçu du catalogue actif pour donner du contexte à Gemini. */
async function fetchCatalogContext(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return '';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=name,price,short_desc,stock&order=created_at.desc&limit=40`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    if (!res.ok) return '';
    const rows = await res.json();
    return (rows as Array<{ name: string; price: number; short_desc?: string; stock: number }>)
      .map((p) => `- ${p.name} — ${p.price} DA${p.stock <= 0 ? ' (rupture de stock)' : ''}${p.short_desc ? ` : ${p.short_desc}` : ''}`)
      .join('\n');
  } catch {
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY manquant côté serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const message = (body.message ?? '').toString().trim();
  const history = Array.isArray(body.history) ? (body.history as ChatMessage[]) : [];

  if (!message) {
    return new Response(JSON.stringify({ error: 'message vide' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const catalog = await fetchCatalogContext();

  const systemInstruction = `Tu es l'assistante virtuelle de la boutique en ligne ORYAM (cosmétiques, Algérie).
Réponds TOUJOURS dans la langue utilisée par le client (arabe algérien/darija, arabe standard ou français).
Sois chaleureuse, brève (3-5 phrases max) et concrète.
Tu peux : conseiller des produits, expliquer l'utilisation, informer sur la livraison (paiement à la livraison, Yalidine), aider à choisir entre deux produits.
Tu NE PEUX PAS : donner un diagnostic médical, promettre une date de livraison exacte, modifier ou annuler une commande toi-même — dans ce cas invite le client à contacter le service client par téléphone/WhatsApp affiché sur le site.
Réponds en texte brut uniquement (pas de markdown, pas d'astérisques **, pas de titres).
N'inclus JAMAIS d'instructions, de notes entre parenthèses sur le ton/style, ni de méta-commentaires — écris directement la réponse au client, rien d'autre.
Si tu ne connais pas la réponse, dis-le simplement au lieu d'inventer.
${catalog ? `\nProduits actuellement en catalogue :\n${catalog}` : ''}`;

  // Formate l'historique + le nouveau message pour l'API Gemini
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      console.error('[gemini]', res.status, data);
      return new Response(JSON.stringify({ error: 'Erreur Gemini', detail: data }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
      "Désolée, je n'ai pas pu répondre. Réessaie dans un instant.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[chat-assistant]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
