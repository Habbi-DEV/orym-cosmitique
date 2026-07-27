-- =============================================================
-- FEATURES 3 & 4 — Filtrage/tri du catalogue + page "Catégories"
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
-- Idempotent.
-- =============================================================

alter table public.products
  add column if not exists category text not null default 'Autres';

-- Remplissage des produits existants (correspond aux slugs du catalogue Oryam).
-- Si un slug n'existe pas chez vous, la ligne est simplement ignorée.
update public.products set category = 'Sérums'       where slug = 'serum-eclat';
update public.products set category = 'Crèmes'       where slug = 'creme-ceramides';
update public.products set category = 'Huiles'       where slug = 'huile-argan';
update public.products set category = 'Masques'      where slug = 'masque-argile';
update public.products set category = 'Nettoyants'   where slug = 'eau-micellaire';
update public.products set category = 'Soins lèvres' where slug = 'baume-levres';
update public.products set category = 'Packs'        where type = 'pack';
