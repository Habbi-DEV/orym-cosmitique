# ORYAM COSMETICS — Projet mis à jour (13 fonctionnalités)

Ce zip contient le **projet complet**, avec les 13 fonctionnalités déjà appliquées
dans le code. Il vous reste seulement les étapes ci-dessous (base de données +
configuration) — rien à recoder.

---

## 1. Remplacer votre projet

- Supprimez le contenu de votre dépôt GitHub (gardez `.git`) et remplacez-le par
  le contenu de ce zip — **ou** utilisez ce zip pour écraser les fichiers un par
  un si vous préférez comparer avant de remplacer.
- Vérifiez que rien de personnel (clés API, `.env`) n'a été écrasé — ce zip ne
  contient pas de fichier `.env`.

## 2. Base de données Supabase — à exécuter DANS L'ORDRE

Allez sur **Supabase Dashboard → SQL Editor → New query**, et exécutez CHAQUE
fichier ci-dessous l'un après l'autre (copier-coller le contenu, Run) :

1. `supabase/sql/01_track_order.sql` — suivi de commande `/suivi`
2. `supabase/sql/02_reviews.sql` — avis clients + "Achat vérifié"
3. `supabase/sql/03_categories.sql` — catégories produits
4. `supabase/sql/04_audit_log.sql` — journal d'audit
5. `supabase/sql/05_loyalty_referral.sql` — parrainage & points de fidélité

Tous ces scripts sont **idempotents** (ré-exécutables sans risque).

⚠️ Si vous avez déjà exécuté certains de ces scripts lors d'un essai précédent,
ré-exécutez-les quand même — cela ne casse rien et garantit que tout est à jour.

## 3. Categoriser vos produits existants

Le script `03_categories.sql` catégorise automatiquement les 8 produits
d'origine (par leur `slug`). Si vous avez ajouté d'autres produits depuis,
allez dans **Admin → Produits** et remplissez le champ **Catégorie** de chacun
(nouveau champ ajouté dans le formulaire).

## 4. Numéro WhatsApp — À CHANGER

Fichier `src/lib/whatsapp.ts` :
```ts
export const WHATSAPP_NUMBER = '213555000000'; // ⚠️ numéro factice — remplacez-le
```
Format international, sans `+`, sans espaces (ex. `213555XXXXXX`).

## 5. Database Webhook — notification e-mail (feature 12)

L'e-mail admin à chaque nouvelle commande n'est plus envoyé depuis le
navigateur (peu fiable), mais par un vrai Database Webhook Supabase :

1. **Supabase Dashboard → Database → Webhooks → Create a new hook**
   - Table : `orders`
   - Events : **INSERT uniquement**
   - Type : HTTP Request → **POST**
   - URL : `https://<PROJECT_REF>.functions.supabase.co/notify-order`
     (remplacez `<PROJECT_REF>` par la référence de votre projet Supabase)
   - Header : `Content-Type: application/json`
2. Déployez la fonction mise à jour :
   ```
   supabase functions deploy notify-order --no-verify-jwt
   ```
3. Vérifiez que les secrets existent toujours (sinon) :
   ```
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set ADMIN_NOTIFY_EMAIL=votre@email.com
   ```

## 6. Installer les dépendances et tester

```bash
npm install
npm run build   # doit passer sans erreur (comme sur Vercel)
npm test        # lance les 13 tests unitaires (Vitest)
```

## 7. Déployer

Poussez sur GitHub — Vercel se charge du reste (le `vercel.json` inclus gère
déjà le routing React Router, donc `/admin`, `/suivi`, `/categories`, etc.
fonctionneront directement, même en accès direct ou en refresh).

---

## Récapitulatif des 13 fonctionnalités

| # | Fonctionnalité | Où la voir |
|---|---|---|
| 1 | Suivi de commande | `/suivi` |
| 2 | Avis clients réels + "Achat vérifié" | page produit + `/admin/avis` |
| 3 | Filtrage/tri du catalogue | page d'accueil, section Produits |
| 4 | Page Catégories | `/categories` |
| 5 | Export Excel/CSV | `/admin/commandes`, `/admin/inventaire`, `/admin/clients` |
| 6 | Page Clients (mini-CRM) | `/admin/clients` |
| 7 | Journal d'audit | `/admin/journal` |
| 8 | Lien WhatsApp direct | header + bouton flottant |
| 9 | Page Landing publicitaire | `/lp/:id` (id = référence produit) |
| 10 | Parrainage & fidélité | `/parrainage` |
| 11 | Compression d'image automatique | à l'upload dans `/admin/produits` |
| 12 | Vrai webhook (au lieu du fetch direct) | voir étape 5 ci-dessus |
| 13 | Tests unitaires | `npm test` |

Si un `npm run build` échoue après tout ça, envoyez-moi le message d'erreur
complet — c'est probablement une étape SQL manquante ou un fichier qui n'a pas
bien été remplacé.
