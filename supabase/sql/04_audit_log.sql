-- =============================================================
-- FEATURE 7 — Journal d'audit (qui a changé quoi, et quand)
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
-- Idempotent.
-- =============================================================

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id),
  actor_email  text,
  action       text not null,       -- 'create' | 'update' | 'delete'
  entity_type  text not null,       -- 'commande' | 'produit' | 'promotion'
  entity_id    text not null,
  entity_label text,
  changes      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- Sécurité d'ordre d'exécution : ce trigger référence owner_phone (ajouté
-- par la feature 10 "parrainage") — on s'assure qu'elle existe déjà, même
-- si ce script est exécuté avant celui de la feature 10.
alter table public.promotions add column if not exists owner_phone text;

alter table public.audit_log enable row level security;

drop policy if exists "audit_staff_read" on public.audit_log;
create policy "audit_staff_read" on public.audit_log for select
  using (public.has_role(array['super_admin']));

-- -------------------------------------------------------------
-- 1. Commandes — on ne journalise que les changements de statut
-- -------------------------------------------------------------
create or replace function public.audit_order_status()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_email text;
begin
  if TG_OP = 'UPDATE' and old.status is distinct from new.status then
    select email into v_email from public.profiles where id = auth.uid();
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (
      auth.uid(), v_email, 'update', 'commande', new.id::text, new.ref,
      jsonb_build_object('statut_avant', old.status, 'statut_apres', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists t_audit_order_status on public.orders;
create trigger t_audit_order_status
  after update on public.orders
  for each row execute function public.audit_order_status();

-- -------------------------------------------------------------
-- 2. Produits — création / modification (prix, stock, actif, nom) / suppression
-- -------------------------------------------------------------
create or replace function public.audit_product_change()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_email text;
  v_changes jsonb := '{}'::jsonb;
begin
  select email into v_email from public.profiles where id = auth.uid();

  if TG_OP = 'INSERT' then
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (auth.uid(), v_email, 'create', 'produit', new.id::text, new.name,
      jsonb_build_object('prix', new.price, 'stock', new.stock));
    return new;

  elsif TG_OP = 'UPDATE' then
    if old.price is distinct from new.price then
      v_changes := v_changes || jsonb_build_object('prix_avant', old.price, 'prix_apres', new.price);
    end if;
    if old.stock is distinct from new.stock then
      v_changes := v_changes || jsonb_build_object('stock_avant', old.stock, 'stock_apres', new.stock);
    end if;
    if old.is_active is distinct from new.is_active then
      v_changes := v_changes || jsonb_build_object('actif_avant', old.is_active, 'actif_apres', new.is_active);
    end if;
    if old.name is distinct from new.name then
      v_changes := v_changes || jsonb_build_object('nom_avant', old.name, 'nom_apres', new.name);
    end if;
    if v_changes <> '{}'::jsonb then
      insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
      values (auth.uid(), v_email, 'update', 'produit', new.id::text, new.name, v_changes);
    end if;
    return new;

  elsif TG_OP = 'DELETE' then
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (auth.uid(), v_email, 'delete', 'produit', old.id::text, old.name,
      jsonb_build_object('prix', old.price));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists t_audit_product on public.products;
create trigger t_audit_product
  after insert or update or delete on public.products
  for each row execute function public.audit_product_change();

-- -------------------------------------------------------------
-- 3. Promotions — création / désactivation / suppression
--    (les codes de parrainage automatiques, owner_phone non nul,
--    ne sont pas journalisés pour ne pas polluer le journal)
-- -------------------------------------------------------------
create or replace function public.audit_promo_change()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_email text;
begin
  select email into v_email from public.profiles where id = auth.uid();

  if TG_OP = 'INSERT' and new.owner_phone is null then
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (auth.uid(), v_email, 'create', 'promotion', new.id::text, new.code,
      jsonb_build_object('type', new.kind, 'valeur', new.value));
    return new;

  elsif TG_OP = 'UPDATE' and new.owner_phone is null and old.active is distinct from new.active then
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (auth.uid(), v_email, 'update', 'promotion', new.id::text, new.code,
      jsonb_build_object('actif_avant', old.active, 'actif_apres', new.active));
    return new;

  elsif TG_OP = 'DELETE' and old.owner_phone is null then
    insert into public.audit_log (actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
    values (auth.uid(), v_email, 'delete', 'promotion', old.id::text, old.code, '{}'::jsonb);
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists t_audit_promo on public.promotions;
create trigger t_audit_promo
  after insert or update or delete on public.promotions
  for each row execute function public.audit_promo_change();
