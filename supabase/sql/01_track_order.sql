-- =============================================================
-- FEATURE 1 — Suivi de commande public (/suivi)
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
-- Idempotent : peut être exécuté plusieurs fois sans erreur.
-- =============================================================

-- Renvoie les infos publiques d'UNE commande, à partir de sa référence
-- exacte (ex. ORY-482913). Aucune autre commande n'est accessible :
-- il faut connaître la référence exacte (comme un numéro de colis).
-- SECURITY DEFINER : contourne la policy "orders_staff_read" (réservée
-- au staff connecté) uniquement pour cette lecture ciblée et limitée.
create or replace function public.get_order_by_ref(p_ref text)
returns table (
  ref               text,
  status            text,
  created_at        timestamptz,
  wilaya_name       text,
  commune           text,
  delivery_type     text,
  yalidine_tracking text,
  subtotal          integer,
  shipping_cost     integer,
  discount          integer,
  total             integer,
  items             json
)
language sql
security definer
set search_path = public
as $$
  select
    o.ref,
    o.status,
    o.created_at,
    o.wilaya_name,
    o.commune,
    o.delivery_type,
    o.yalidine_tracking,
    o.subtotal,
    o.shipping_cost,
    o.discount,
    o.total,
    coalesce(
      (select json_agg(json_build_object('name', oi.name, 'price', oi.price, 'qty', oi.qty))
       from public.order_items oi where oi.order_id = o.id),
      '[]'::json
    ) as items
  from public.orders o
  where o.ref = upper(trim(p_ref))
  limit 1;
$$;

-- Autorise les visiteurs (anon = non connectés) à appeler cette fonction.
grant execute on function public.get_order_by_ref(text) to anon, authenticated;
