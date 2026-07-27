-- =============================================================
-- FEATURE 10 — Code de parrainage & points de fidélité
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
-- Idempotent. Réutilise le système de codes promo existant :
-- un code de parrainage EST une ligne dans `promotions`, marquée
-- par owner_phone — donc il fonctionne immédiatement au checkout
-- sans toucher au code du panier.
-- =============================================================

alter table public.promotions add column if not exists owner_phone text;
create unique index if not exists idx_promotions_owner_phone
  on public.promotions (owner_phone) where owner_phone is not null;

-- -------------------------------------------------------------
-- Historique des points gagnés (parrainages livrés)
-- -------------------------------------------------------------
create table if not exists public.loyalty_points (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  points     integer not null,
  reason     text not null,
  order_id   uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.loyalty_points enable row level security;

drop policy if exists "loyalty_staff_read" on public.loyalty_points;
create policy "loyalty_staff_read" on public.loyalty_points for select
  using (public.has_role(array['super_admin','marketer']));

-- -------------------------------------------------------------
-- Récupère (ou crée) le code personnel d'un client — remise fixe
-- de 500 DA offerte à la personne parrainée.
-- -------------------------------------------------------------
create or replace function public.get_or_create_referral_code(p_phone text)
returns text
language plpgsql security definer set search_path = public as
$$
declare
  v_clean text := regexp_replace(p_phone, '\D', '', 'g');
  v_code  text;
begin
  if v_clean = '' then
    raise exception 'Numéro de téléphone invalide.';
  end if;

  select code into v_code from public.promotions where owner_phone = v_clean limit 1;
  if v_code is not null then
    return v_code;
  end if;

  v_code := 'AMI-' || upper(substr(md5(p_phone || random()::text || clock_timestamp()::text), 1, 6));
  insert into public.promotions (code, kind, value, min_subtotal, active, owner_phone)
  values (v_code, 'fixed', 500, 0, true, v_clean);

  return v_code;
end;
$$;

grant execute on function public.get_or_create_referral_code(text) to anon, authenticated;

-- -------------------------------------------------------------
-- Résumé fidélité d'un client : son code + total de points gagnés
-- -------------------------------------------------------------
create or replace function public.get_loyalty_summary(p_phone text)
returns table (code text, points integer)
language sql security definer set search_path = public as
$$
  select
    (select code from public.promotions where owner_phone = regexp_replace(p_phone, '\D', '', 'g') limit 1),
    coalesce(
      (select sum(points)::integer from public.loyalty_points
       where phone = regexp_replace(p_phone, '\D', '', 'g')),
      0
    );
$$;

grant execute on function public.get_loyalty_summary(text) to anon, authenticated;

-- -------------------------------------------------------------
-- À la livraison d'une commande ayant utilisé un code de
-- parrainage : 200 points crédités au parrain (pas d'auto-parrainage).
-- -------------------------------------------------------------
create or replace function public.award_referral_points()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_owner text;
begin
  if TG_OP = 'UPDATE'
     and new.status = 'livree'
     and old.status is distinct from 'livree'
     and new.promo_code is not null then

    select owner_phone into v_owner from public.promotions where code = new.promo_code;

    if v_owner is not null and v_owner <> regexp_replace(new.phone, '\D', '', 'g') then
      insert into public.loyalty_points (phone, points, reason, order_id)
      values (v_owner, 200, 'parrainage', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists t_award_referral on public.orders;
create trigger t_award_referral
  after update on public.orders
  for each row execute function public.award_referral_points();
