/**
 * PROVISIONNEMENT AUTOMATIQUE DU BACKEND SUPABASE
 * ===============================================
 * Exécute, dans l'ordre :
 *   1. Le schéma SQL complet (tables + RLS) via connexion Postgres directe
 *   2. La création du compte admin  store.shopy22@gmail.com / Admin1234!
 *   3. L'insertion dans `profiles` avec role = 'super_admin'
 *   4. La création du bucket Storage public `product-images`
 *
 * USAGE :
 *   1. Copiez .env.example vers .env et renseignez :
 *      - VITE_SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY   (Project Settings → API → service_role)
 *      - SUPABASE_DB_URL             (Project Settings → Database → Connection string)
 *   2. npm run provision
 */
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'store.shopy22@gmail.com';
const ADMIN_PASSWORD = 'Admin1234!';
const ADMIN_NAME = 'Administrateur Oryam';

// ---------- mini-parseur .env (aucune dépendance) ----------
const loadEnv = () => {
  const out = {};
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return { ...out, ...process.env };
};

const env = loadEnv();
const ok = (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`);
const info = (msg) => console.log(`\x1b[36m→\x1b[0m ${msg}`);
const fail = (msg) => console.error(`\x1b[31m✖ ${msg}\x1b[0m`);

// ---------- Étape 1 : schéma SQL ----------
if (env.SUPABASE_DB_URL) {
  info('Exécution de supabase/schema.sql…');
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const sql = readFileSync('supabase/schema.sql', 'utf8');
  await client.query(sql);
  await client.end();
  ok('Schéma SQL appliqué (tables, index, triggers, RLS).');
} else {
  fail('SUPABASE_DB_URL absente — appliquez le schéma manuellement dans le SQL Editor.');
}

// ---------- Étapes 2 & 3 : compte admin + profil super_admin ----------
if (env.VITE_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  info(`Création du compte ${ADMIN_EMAIL}…`);
  let userId;
  const { data: created, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (error && /already|exist|registered/i.test(error.message)) {
    info('Compte existant — récupération de son identifiant…');
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users?.find((u) => u.email === ADMIN_EMAIL)?.id;
    // Mot de passe remis à la valeur attendue pour garantir l'accès
    if (userId) {
      await admin.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD });
      ok('Mot de passe administrateur synchronisé.');
    }
  } else if (error) {
    throw error;
  } else {
    userId = created.user?.id;
    ok(`Compte créé (id: ${userId}).`);
  }

  if (!userId) throw new Error('Impossible de déterminer l’utilisateur admin.');

  const { error: pErr } = await admin.from('profiles').upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: ADMIN_NAME,
    role: 'super_admin',
  });
  if (pErr) throw pErr;
  ok(`Profil inséré dans profiles avec role = 'super_admin'.`);

  // ---------- Étape 4 : bucket Storage ----------
  const { error: bErr } = await admin.storage.createBucket('product-images', { public: true });
  if (!bErr) ok('Bucket Storage « product-images » créé (public).');
  else info(`Bucket : ${bErr.message.includes('already exists') ? 'déjà présent.' : bErr.message}`);
} else {
  fail('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents — étape auth ignorée.');
}

console.log('\n\x1b[1mProvisioning terminé.\x1b[0m Connectez-vous sur /admin avec :');
console.log(`   e-mail    : ${ADMIN_EMAIL}`);
console.log(`   password  : ${ADMIN_PASSWORD}\n`);
