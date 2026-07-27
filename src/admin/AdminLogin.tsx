import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Globe, ShieldCheck, LogIn, CloudOff } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ADMIN_ACCOUNTS } from '../data/seed';
import { ROLE_LABELS } from '../lib/types';
import { isSupabaseConfigured } from '../lib/supabase';
import { homeForRole } from './AdminLayout';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 pl-11 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

export default function AdminLogin() {
  const { login } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    const res = await login(email, password);
    if (res.ok) {
      // Rôle renvoyé par Supabase (profiles.role) — fallback comptes démo
      const acc = ADMIN_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
      );
      const role = res.role ?? acc?.role ?? 'super_admin';
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/admin/login' ? from : homeForRole(role), {
        replace: true,
      });
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blush/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violetp/15 blur-[110px]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <p className="font-serif text-3xl font-bold">
              ORYAM<span className="text-blush">.</span>
            </p>
            <p className="mt-1 text-[9px] font-semibold tracking-[0.42em] text-white/40">
              ADMINISTRATION
            </p>
          </div>
          <div>
            <p className="font-serif text-4xl font-semibold leading-snug">
              Pilotez votre maison de beauté,{' '}
              <span className="italic text-blush">en toute sérénité.</span>
            </p>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-white/50">
              Commandes, catalogue, inventaire et promotions — une console unique, sécurisée par
              rôles et connectée à Supabase.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[12px] text-white/50">
              <ShieldCheck size={15} className="text-stockgreen" />
              Accès protégé par Supabase Auth + RLS
            </div>
          </div>
          <p className="text-[11px] text-white/30">
            © 2025 Oryam Cosmetics — Espace réservé à l’équipe
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-cream px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-[25px] border border-black/[0.06] bg-white p-7 shadow-[0_10px_40px_rgba(12,12,14,0.08)] sm:p-9">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-blush">
              <Lock size={20} />
            </span>
            <h1 className="mt-5 font-serif text-3xl font-semibold">Connexion Admin</h1>
            <p className="mt-1.5 text-[13px] text-neutral-500">
              Authentifiez-vous pour accéder à la console Oryam.
            </p>

            {/* État de connexion Supabase */}
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11.5px] font-semibold ${
                isSupabaseConfigured ? 'bg-stock-soft text-stockgreen' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isSupabaseConfigured ? (
                <>
                  <ShieldCheck size={14} />
                  Connecté à Supabase Auth — utilisez votre compte équipe
                </>
              ) : (
                <>
                  <CloudOff size={14} />
                  Mode démo local — renseignez .env pour activer Supabase Auth
                </>
              )}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse e-mail"
                  className={inputCls}
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className={`${inputCls} pr-11`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label="Afficher le mot de passe"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-navred"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold transition active:scale-[0.98] ${
                  loading || !email || !password
                    ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                    : 'bg-blush text-white shadow-lg shadow-blush/30 hover:bg-blush-dark'
                }`}
              >
                <LogIn size={16} />
                {loading ? 'Vérification Supabase…' : 'Se connecter'}
              </button>
            </form>

            {/* Comptes démo (visibles uniquement sans Supabase) */}
            {!isSupabaseConfigured && (
              <div className="mt-7 rounded-2xl bg-cream p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                  Comptes de démonstration — cliquer pour remplir
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {ADMIN_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => {
                        setEmail(a.email);
                        setPassword(a.password);
                        setError('');
                      }}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left transition hover:border-blush"
                    >
                      <p className="text-[11px] font-bold leading-tight">{ROLE_LABELS[a.role]}</p>
                      <p className="mt-0.5 truncate text-[10px] text-neutral-400">{a.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/"
            className="mt-5 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-neutral-400 transition hover:text-blush"
          >
            <Globe size={14} />
            Retour à la boutique
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
