-- =============================================================
-- FEATURE 2 — Avis clients réels (avec badge "Achat vérifié")
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
-- Idempotent : peut être exécuté plusieurs fois sans erreur.
-- =============================================================

-- -------------------------------------------------------------
-- 0. Correctif nécessaire : les commandes créées depuis le site
--    n'enregistraient PAS product_id dans order_items (seulement
--    name/price/qty). Sans ça, impossible de savoir quel produit
--    un client a réellement acheté → la vérification "Achat vérifié"
--    ne peut pas fonctionner. On ajoute la colonne si absente
--    (elle existe déjà dans le schéma d'origine mais n'était
--    jamais renseignée côté application — corrigé dans
--    DataContext.tsx, fourni séparément).
-- -------------------------------------------------------------
alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

-- -------------------------------------------------------------
-- 1. TABLE DES AVIS
-- -------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  phone       text,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null,
  verified    boolean not null default false,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_created on public.reviews(created_at desc);

alter table public.reviews enable row level security;

-- Lecture publique : uniquement les avis visibles (modération admin)
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (is_visible = true);

-- Modération (masquer/supprimer) réservée au staff — pas d'écriture directe
-- du public : tout avis passe obligatoirement par submit_review() ci-dessous.
drop policy if exists "reviews_staff_manage" on public.reviews;
create policy "reviews_staff_manage" on public.reviews for all
  using (public.has_role(array['super_admin','marketer']))
  with check (public.has_role(array['super_admin','marketer']));

drop policy if exists "reviews_staff_read_all" on public.reviews;
create policy "reviews_staff_read_all" on public.reviews for select
  using (public.has_role(array['super_admin','marketer']));

-- -------------------------------------------------------------
-- 2. RECALCUL AUTOMATIQUE DE LA NOTE PRODUIT (products.rating/reviews)
-- -------------------------------------------------------------
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating  = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where product_id = v_product_id and is_visible), 5.0),
    reviews = coalesce((select count(*) from public.reviews where product_id = v_product_id and is_visible), 0)
  where p.id = v_product_id;
  return null;
end;
$$;

drop trigger if exists t_reviews_refresh on public.reviews;
create trigger t_reviews_refresh
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- -------------------------------------------------------------
-- 3. SOUMISSION D'UN AVIS — vérifie automatiquement "Achat vérifié"
--    en cherchant une commande (confirmée / expédiée / livrée) du
--    même téléphone contenant ce produit. Aucun compte requis.
-- -------------------------------------------------------------
create or replace function public.submit_review(
  p_product_id  uuid,
  p_author_name text,
  p_phone       text,
  p_rating      integer,
  p_comment     text
) returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verified boolean := false;
  v_row public.reviews;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La note doit être comprise entre 1 et 5.';
  end if;
  if p_author_name is null or length(trim(p_author_name)) < 2 then
    raise exception 'Merci d’indiquer votre nom.';
  end if;
  if p_comment is null or length(trim(p_comment)) < 3 then
    raise exception 'Votre commentaire est trop court.';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produit introuvable.';
  end if;

  if p_phone is not null and length(trim(p_phone)) > 0 then
    select exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where oi.product_id = p_product_id
        and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
        and o.status in ('confirmee', 'expediee', 'livree')
    ) into v_verified;
  end if;

  insert into public.reviews (product_id, author_name, phone, rating, comment, verified)
  values (p_product_id, trim(p_author_name), nullif(trim(p_phone), ''), p_rating, trim(p_comment), v_verified)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.submit_review(uuid, text, text, integer, text) to anon, authenticated;
