/**
 * SUPABASE EDGE FUNCTION — notify-order
 * -------------------------------------
 * Déployer :  supabase functions deploy notify-order --no-verify-jwt
 * Secrets  :  supabase secrets set RESEND_API_KEY=re_xxx
 *             supabase secrets set ADMIN_NOTIFY_EMAIL=store.shopy22@gmail.com
 *
 * ⚠️ CHANGEMENT (feature 12) : cette fonction n'est plus appelée depuis le
 * navigateur (fetch direct côté front) — elle est déclenchée par un vrai
 * Database Webhook Supabase (serveur → serveur), sur INSERT dans `orders`.
 * Avantages : fiable même si la cliente ferme l'onglet juste après avoir
 * commandé, aucune URL à exposer publiquement au front, plus de souci CORS.
 *
 * Configuration (Supabase Dashboard → Database → Webhooks → Create webhook) :
 *   - Table cible   : orders
 *   - Événements    : INSERT uniquement
 *   - Type           : HTTP Request → POST
 *   - URL            : https://<PROJECT_REF>.functions.supabase.co/notify-order
 *   - En-têtes       : Content-Type: application/json
 *
 * Le payload d'un Database Webhook ne contient QUE les colonnes de la ligne
 * `orders` — pas les articles (table séparée order_items). Cette fonction
 * va donc chercher les articles elle-même avec la clé service_role.
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));

  // Database Webhook : { type: 'INSERT', table: 'orders', record: {...} }
  // (on garde une compatibilité avec un éventuel appel direct { order: {...} })
  if (body.type && body.type !== 'INSERT') {
    return new Response(JSON.stringify({ ok: true, skipped: 'not-insert' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const record = body.record ?? body.order ?? body;

  // Les articles ne sont jamais dans `record` (table séparée) — sauf si un
  // appel direct legacy les avait déjà mis dans le payload.
  let items: string[] = Array.isArray(record.items) ? record.items : [];
  if (items.length === 0 && record.id) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('name, qty')
      .eq('order_id', record.id);
    items = (orderItems ?? []).map((i) => `${i.qty} × ${i.name}`);
  }

  const confirmLink =
    record.ref && record.confirm_token
      ? `${SUPABASE_URL}/functions/v1/confirm-order?ref=${encodeURIComponent(record.ref)}&token=${encodeURIComponent(record.confirm_token)}`
      : null;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:16px;padding:24px">
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0">ORYAM<span style="color:#D68D9C">.</span></h1>
      <p style="color:#777;font-size:13px;margin-top:4px">Nouvelle commande reçue</p>
      <h2 style="font-size:28px;margin:12px 0">${record.ref}</h2>
      <table style="font-size:14px;line-height:1.8;width:100%">
        <tr><td style="color:#888">Cliente</td><td><strong>${record.customer_name ?? record.name}</strong></td></tr>
        <tr><td style="color:#888">Téléphone</td><td><strong>${record.phone}</strong></td></tr>
        <tr><td style="color:#888">Livraison</td><td>${record.commune}, ${record.wilaya_name ?? record.wilaya} (${record.delivery_type ?? record.delivery})</td></tr>
        <tr><td style="color:#888">Articles</td><td>${items.join('<br>') || '—'}</td></tr>
      </table>
      <div style="background:#0C0C0E;color:#fff;border-radius:12px;padding:14px;margin-top:16px;display:flex;justify-content:space-between">
        <span>Total COD</span><strong style="font-size:18px">${record.total} DA</strong>
      </div>
      ${confirmLink ? `<p style="margin-top:16px;font-size:12px;color:#888">Lien de confirmation client : <a href="${confirmLink}">${confirmLink}</a></p>` : ''}
    </div>`;

  // "onboarding@resend.dev" fonctionne sans domaine vérifié — pratique pour
  // démarrer tout de suite. Passez à une adresse @votredomaine.com une fois
  // ce domaine vérifié dans Resend (Dashboard → Domains) pour la production.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Boutique Oryam <onboarding@resend.dev>',
      to: [Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? 'store.shopy22@gmail.com'],
      subject: `Nouvelle commande ${record.ref} — ${record.total} DA`,
      html,
    }),
  });

  const resendBody = await res.json().catch(() => null);
  if (!res.ok) console.error('[resend]', res.status, resendBody);

  return new Response(JSON.stringify({ ok: res.ok, resend: resendBody }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: res.ok ? 200 : 502,
  });
});
