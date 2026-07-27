-- =============================================================
-- ORYAM COSMETICS — SCHÉMA SUPABASE / POSTGRESQL — VERSION UNIFIÉE
-- Fusion de : schema.sql (source manuscrite) + dump réel de production
-- Copier-coller dans : Supabase Dashboard → SQL Editor → Run
-- Idempotent : peut être exécuté plusieurs fois sans erreur.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 0. RÔLES & PROFILS ADMIN (RBAC)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'orders'
              check (role in ('super_admin','warehouse','orders','marketer')),
  created_at  timestamptz not null default now()
);

-- Fonctions utilitaires RLS
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid()); $$;

create or replace function public.has_role(roles text[])
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = any(roles)); $$;

-- -------------------------------------------------------------
-- 1. CATALOGUE
-- -------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  type        text not null default 'produit' check (type in ('produit','pack')),
  short_desc  text,
  description text,
  ingredients text,
  usage       text,
  price       integer not null check (price >= 0),          -- en DA
  old_price   integer,
  cost_price  integer not null default 0,                   -- prix d'achat
  stock       integer not null default 0,
  images      text[] not null default '{}',
  is_active   boolean not null default true,
  promo       boolean not null default false,
  rating      numeric(2,1) not null default 5.0,
  reviews     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,                                -- ex : « 100 ml »
  price_delta integer not null default 0,
  stock       integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Composition des packs (pack_id = produit de type 'pack')
create table if not exists public.pack_items (
  pack_id     uuid not null references public.products(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  qty         integer not null default 1 check (qty > 0),
  primary key (pack_id, product_id)
);

-- Cross-selling manuel (« Souvent achetés ensemble »)
create table if not exists public.linked_products (
  product_id        uuid not null references public.products(id) on delete cascade,
  linked_product_id uuid not null references public.products(id) on delete cascade,
  position          integer not null default 0,
  primary key (product_id, linked_product_id)
);

-- -------------------------------------------------------------
-- 2. PROMOTIONS & CODES
-- -------------------------------------------------------------
create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  kind         text not null check (kind in ('percent','fixed')),
  value        integer not null check (value > 0),          -- % ou DA
  min_subtotal integer not null default 0,
  active       boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  usage_count  integer not null default 0,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 3. COMMANDES
-- -------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  ref               text unique not null,
  status            text not null default 'en_attente'
                    check (status in ('en_attente','confirmee','expediee','livree','annulee')),
  customer_gender   text check (customer_gender in ('madame','monsieur')),
  customer_name     text not null,
  phone             text not null,
  wilaya_code       integer not null,
  wilaya_name       text not null,
  commune           text not null,
  delivery_type     text not null check (delivery_type in ('domicile','stopdesk')),
  address           text,
  subtotal          integer not null,
  shipping_cost     integer not null default 0,
  discount          integer not null default 0,
  total             integer not null,
  promo_code        text,
  yalidine_tracking text,                                   -- rempli à l'expédition
  -- Jeton de confirmation (lien e-mail/WhatsApp) — généré automatiquement,
  -- puis nettoyé en base64 url-safe par le trigger t_orders_token ci-dessous.
  confirm_token     text default encode(gen_random_bytes(9), 'base64'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  price       integer not null,
  qty         integer not null check (qty > 0)
);

create index if not exists idx_orders_status  on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_items_order    on public.order_items(order_id);

-- -------------------------------------------------------------
-- 4. PANIER & FAVORIS (session anonyme via auth.users)
--    ⚠️ Activer « Allow anonymous sign-ins » dans le Dashboard
--    (Authentication → Sign In / Providers)
-- -------------------------------------------------------------
create table if not exists public.cart_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  product_slug text not null references public.products(slug) on delete cascade,
  qty          integer not null check (qty > 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, product_slug)
);

create table if not exists public.wishlist_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  product_slug text not null references public.products(slug) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, product_slug)
);

create index if not exists idx_cart_user      on public.cart_items(user_id);
create index if not exists idx_cart_updated   on public.cart_items(updated_at desc);
create index if not exists idx_wishlist_user  on public.wishlist_items(user_id);

-- Compte les favoris par produit SANS exposer les user_id individuels
-- (contourne la RLS "wishlist_owner" pour un usage staff agrégé uniquement).
-- Utilisée par DataContext.tsx via supabase.rpc('wishlist_counts').
create or replace function public.wishlist_counts()
returns table(product_slug text, count bigint)
language sql security definer set search_path = public as
$$
  select product_slug, count(*) as count
  from public.wishlist_items
  group by product_slug
  order by count desc;
$$;

-- Autorise explicitement les visiteurs connectés (session anonyme incluse)
-- à appeler cette fonction agrégée (elle ne renvoie que product_slug/count,
-- jamais les user_id individuels).
grant execute on function public.wishlist_counts() to authenticated;

-- -------------------------------------------------------------
-- 5. INVENTAIRE — GRAND LIVRE D'ENTREPÔT
--    depot = Entrée · retrait = Sortie · reintegration = Retour
-- -------------------------------------------------------------
create table if not exists public.inventory_ledger (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  kind        text not null check (kind in ('depot','retrait','reintegration')),
  qty         integer not null check (qty > 0),
  reason      text,
  author      uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_ledger_product on public.inventory_ledger(product_id);
create index if not exists idx_ledger_created on public.inventory_ledger(created_at desc);

-- Décrément automatique du stock à chaque commande
create or replace function public.apply_order_stock()
returns trigger language plpgsql security definer set search_path = public as
$$
begin
  update public.products p set stock = greatest(0, p.stock - n.qty)
  from new_table n where p.id = n.product_id;

  insert into public.inventory_ledger (product_id, kind, qty, reason)
  select n.product_id, 'retrait', n.qty, 'Commande ' || (select ref from public.orders where id = n.order_id)
  from new_table n;
  return null;
end $$;

-- ⚠️ CORRECTIF — cette fonction existait déjà dans les deux versions
-- précédentes du schéma mais N'ÉTAIT JAMAIS RATTACHÉE à un trigger : le
-- stock n'était donc JAMAIS décrémenté côté base (seulement en optimiste
-- côté client dans DataContext.tsx). On la rattache ici à order_items.
drop trigger if exists t_order_items_stock on public.order_items;
create trigger t_order_items_stock
  after insert on public.order_items
  referencing new table as new_table
  for each statement execute function public.apply_order_stock();

-- Alertes stock faible (vue temps réel)
create or replace view public.low_stock_products as
  select id, name, stock, 8 as threshold
  from public.products
  where is_active and stock <= 8
  order by stock asc;

-- -------------------------------------------------------------
-- 6. TARIFS DE LIVRAISON
-- -------------------------------------------------------------
create table if not exists public.shipping_rates (
  wilaya_code    integer primary key,
  wilaya_name    text not null,
  home_price     integer not null default 0,
  stopdesk_price integer not null default 0
);

create table if not exists public.commune_rates (
  id           uuid primary key default gen_random_uuid(),
  wilaya_code  integer not null references public.shipping_rates(wilaya_code) on delete cascade,
  commune_name text not null,
  extra        integer not null default 0,
  unique (wilaya_code, commune_name)
);

-- -------------------------------------------------------------
-- 7. MÉTA CONFIG (singleton) — Pixels Meta + TikTok
-- -------------------------------------------------------------
create table if not exists public.meta_config (
  id               integer primary key check (id = 1),
  pixel_id         text,
  capi_token       text,                                    -- servir via Edge Function uniquement
  -- Ajouté ici : le type MetaConfig (src/lib/types.ts) inclut tiktokPixelId
  -- mais la colonne manquait dans les deux versions précédentes du schéma.
  tiktok_pixel_id  text,
  enabled          boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- Triggers updated_at génériques
create or replace function public.touch_updated_at()
returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists t_products_touch on public.products;
create trigger t_products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists t_orders_touch on public.orders;
create trigger t_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Nettoyage du confirm_token généré (base64 → url-safe : + / = retirés)
create or replace function public.url_safe_token()
returns trigger language plpgsql as
$$
begin
  new.confirm_token := replace(replace(replace(new.confirm_token, '+', '-'), '/', '_'), '=', '');
  return new;
end;
$$;

drop trigger if exists t_orders_token on public.orders;
create trigger t_orders_token before insert on public.orders
  for each row execute function public.url_safe_token();

-- =============================================================
-- ROW LEVEL SECURITY — ACTIVATION & POLITIQUES STRICTES
-- =============================================================
alter table public.profiles          enable row level security;
alter table public.products          enable row level security;
alter table public.variants          enable row level security;
alter table public.pack_items        enable row level security;
alter table public.linked_products   enable row level security;
alter table public.promotions        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.cart_items        enable row level security;
alter table public.wishlist_items    enable row level security;
alter table public.inventory_ledger  enable row level security;
alter table public.shipping_rates    enable row level security;
alter table public.commune_rates     enable row level security;
alter table public.meta_config       enable row level security;

-- ---- Catalogue : LECTURE PUBLIQUE, ÉCRITURE ADMIN ONLY ----
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"  on public.products for select using (true);
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"  on public.products for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

drop policy if exists "variants_public_read" on public.variants;
create policy "variants_public_read" on public.variants for select using (true);
drop policy if exists "variants_admin_write" on public.variants;
create policy "variants_admin_write" on public.variants for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

drop policy if exists "pack_items_public_read" on public.pack_items;
create policy "pack_items_public_read" on public.pack_items for select using (true);
drop policy if exists "pack_items_admin_write" on public.pack_items;
create policy "pack_items_admin_write" on public.pack_items for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

drop policy if exists "linked_public_read" on public.linked_products;
create policy "linked_public_read" on public.linked_products for select using (true);
drop policy if exists "linked_admin_write" on public.linked_products;
create policy "linked_admin_write" on public.linked_products for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

-- ---- Livraison : LECTURE PUBLIQUE ----
drop policy if exists "shipping_public_read" on public.shipping_rates;
create policy "shipping_public_read" on public.shipping_rates for select using (true);
drop policy if exists "shipping_admin_write" on public.shipping_rates;
create policy "shipping_admin_write" on public.shipping_rates for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));
drop policy if exists "communes_public_read" on public.commune_rates;
create policy "communes_public_read" on public.commune_rates for select using (true);
drop policy if exists "communes_admin_write" on public.commune_rates;
create policy "communes_admin_write" on public.commune_rates for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

-- ---- Codes promo : lecture publique limitée aux actifs ----
drop policy if exists "promos_public_read" on public.promotions;
create policy "promos_public_read" on public.promotions for select using (active = true);
drop policy if exists "promos_marketer_write" on public.promotions;
create policy "promos_marketer_write" on public.promotions for all
  using (public.has_role(array['super_admin','marketer'])) with check (public.has_role(array['super_admin','marketer']));

-- ---- Commandes : INSERT public (checkout), gestion staff ----
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"  on public.orders for insert with check (true);
drop policy if exists "orders_staff_read" on public.orders;
create policy "orders_staff_read"     on public.orders for select
  using (public.has_role(array['super_admin','orders']));
drop policy if exists "orders_staff_update" on public.orders;
create policy "orders_staff_update"   on public.orders for update
  using (public.has_role(array['super_admin','orders'])) with check (public.has_role(array['super_admin','orders']));

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items for insert with check (true);
drop policy if exists "order_items_read" on public.order_items;
create policy "order_items_read"   on public.order_items for select
  using (public.has_role(array['super_admin','orders']));

-- ---- Inventaire : Gestionnaire + Super Admin ----
drop policy if exists "ledger_stock_read" on public.inventory_ledger;
create policy "ledger_stock_read"  on public.inventory_ledger for select
  using (public.has_role(array['super_admin','warehouse']));
drop policy if exists "ledger_stock_write" on public.inventory_ledger;
create policy "ledger_stock_write" on public.inventory_ledger for insert
  with check (public.has_role(array['super_admin','warehouse']));

-- ---- Panier & favoris : propriétaire (auth.uid()) uniquement, + lecture staff ----
drop policy if exists "cart_owner" on public.cart_items;
create policy "cart_owner" on public.cart_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "cart_staff_read" on public.cart_items;
create policy "cart_staff_read" on public.cart_items for select
  using (public.has_role(array['super_admin','marketer']));

drop policy if exists "wishlist_owner" on public.wishlist_items;
create policy "wishlist_owner" on public.wishlist_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- Méta config : lecture staff, écriture super admin ----
drop policy if exists "meta_staff_read" on public.meta_config;
create policy "meta_staff_read"  on public.meta_config for select using (public.is_admin());
drop policy if exists "meta_admin_write" on public.meta_config;
create policy "meta_admin_write" on public.meta_config for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

-- ---- Profils : soi-même + super admin ----
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"   on public.profiles for select using (id = auth.uid() or public.has_role(array['super_admin']));
drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles for all
  using (public.has_role(array['super_admin'])) with check (public.has_role(array['super_admin']));

-- =============================================================
-- SEED — TARIFS DE LIVRAISON (extrait ; les 58 wilayas sont
-- exportées depuis src/data/wilayas.ts via le script de seed)
-- =============================================================
insert into public.shipping_rates (wilaya_code, wilaya_name, home_price, stopdesk_price) values
  (16,'Alger',400,300), (9,'Blida',450,320), (31,'Oran',550,400), (25,'Constantine',600,430),
  (19,'Sétif',600,430), (23,'Annaba',650,450), (6,'Béjaïa',600,430), (15,'Tizi Ouzou',550,400),
  (13,'Tlemcen',600,430), (3,'Laghouat',800,600), (30,'Ouargla',900,700), (11,'Tamanrasset',1400,1100)
on conflict (wilaya_code) do nothing;

insert into public.meta_config (id, pixel_id, capi_token, tiktok_pixel_id, enabled) values (1, null, null, null, false)
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 8. SUPABASE STORAGE — Bucket images produits (public)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

do $$ begin
  create policy "product_images_public_read" on storage.objects for select
    using (bucket_id = 'product-images');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "product_images_admin_insert" on storage.objects for insert
    with check (bucket_id = 'product-images' and public.has_role(array['super_admin']));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "product_images_admin_delete" on storage.objects for delete
    using (bucket_id = 'product-images' and public.has_role(array['super_admin']));
exception when duplicate_object then null; end $$;
