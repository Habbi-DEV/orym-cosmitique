import { useState } from 'react';
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Facebook,
  Copy,
  Download,
  Database,
  Truck,
  Search,
  ChevronDown,
  Plus,
  FlaskConical,
  ShieldCheck,
  Music2,
  Archive,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { testEvent } from '../lib/meta';
import { formatDA } from '../lib/format';
import schemaSql from '../../supabase/schema.sql?raw';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

function Card({
  icon: Icon,
  chip,
  title,
  desc,
  children,
}: {
  icon: React.ElementType;
  chip: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
      <div className="flex items-start gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
          <Icon size={19} />
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold leading-tight">{title}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">{desc}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function Feedback({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p
      className={`rounded-xl px-4 py-2.5 text-[12.5px] font-semibold ${
        result.ok ? 'bg-stock-soft text-stockgreen' : 'bg-red-50 text-navred'
      }`}
    >
      {result.message}
    </p>
  );
}

export default function AdminSettings() {
  const {
    session,
    changeEmail,
    changePassword,
    metaConfig,
    setMetaConfig,
    shipping,
    updateWilayaRate,
    updateCommuneRate,
    addCommune,
  } = useData();
  const { showToast } = useStore();

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [emailResult, setEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Password form
  const [curPwd, setCurPwd] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showPwds, setShowPwds] = useState(false);
  const [pwdResult, setPwdResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Meta form
  const [pixelId, setPixelId] = useState(metaConfig.pixelId);
  const [capiToken, setCapiToken] = useState(metaConfig.capiToken);
  const [tiktokId, setTiktokId] = useState(metaConfig.tiktokPixelId ?? '');
  const [metaEnabled, setMetaEnabled] = useState(metaConfig.enabled);

  // Shipping
  const [shipQuery, setShipQuery] = useState('');
  const [openWilaya, setOpenWilaya] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [newCommune, setNewCommune] = useState<Record<number, string>>({});

  const markSaved = () => {
    setSavedAt(
      new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
  };

  const filteredShipping = shipping.filter(
    (w) =>
      w.name.toLowerCase().includes(shipQuery.trim().toLowerCase()) ||
      String(w.code).includes(shipQuery.trim()),
  );

  const copySql = () => {
    void navigator.clipboard.writeText(schemaSql).then(() =>
      showToast('Schéma SQL copié dans le presse-papier'),
    );
  };

  const downloadSql = () => {
    const blob = new Blob([schemaSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oryam-schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
          Configuration
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Paramètres
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-neutral-500">
          <ShieldCheck size={14} className="text-stockgreen" />
          Zone sécurisée — réservée au Super Admin.
        </p>
      </div>

      {/* Compte */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          icon={Mail}
          chip="bg-blue-100 text-blue-700"
          title="Changer d’adresse e-mail"
          desc={`Connecté en tant que ${session?.email ?? ''}. La réauthentification est requise.`}
        >
          <div className="space-y-3.5">
            <Field label="Nouvelle adresse e-mail">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvel.email@oryam.com"
                className={inputCls}
              />
            </Field>
            <Field label="Mot de passe actuel (confirmation)">
              <input
                type="password"
                value={emailPwd}
                onChange={(e) => setEmailPwd(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </Field>
            <Feedback result={emailResult} />
            <button
              onClick={async () => {
                const res = await changeEmail(newEmail, emailPwd);
                setEmailResult(res);
                if (res.ok) {
                  setNewEmail('');
                  setEmailPwd('');
                }
              }}
              className="w-full rounded-full bg-ink py-3 text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
            >
              Mettre à jour l’e-mail
            </button>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Supabase Auth enverra un e-mail de vérification aux deux adresses avant
              d’appliquer le changement.
            </p>
          </div>
        </Card>

        <Card
          icon={KeyRound}
          chip="bg-violetp-soft text-violetp-dark"
          title="Changer de mot de passe"
          desc="Minimum 8 caractères, incluant lettres et chiffres."
        >
          <div className="space-y-3.5">
            <Field label="Mot de passe actuel">
              <input
                type={showPwds ? 'text' : 'password'}
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
                className={inputCls}
                autoComplete="current-password"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nouveau mot de passe">
                <input
                  type={showPwds ? 'text' : 'password'}
                  value={nextPwd}
                  onChange={(e) => setNextPwd(e.target.value)}
                  className={inputCls}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirmation">
                <input
                  type={showPwds ? 'text' : 'password'}
                  value={confPwd}
                  onChange={(e) => setConfPwd(e.target.value)}
                  className={inputCls}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <button
              onClick={() => setShowPwds((s) => !s)}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-400 hover:text-ink"
            >
              {showPwds ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPwds ? 'Masquer' : 'Afficher'} les mots de passe
            </button>
            {nextPwd && confPwd && nextPwd !== confPwd && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-navred">
                Les deux mots de passe ne correspondent pas.
              </p>
            )}
            <Feedback result={pwdResult} />
            <button
              onClick={async () => {
                if (nextPwd !== confPwd) {
                  setPwdResult({ ok: false, message: 'La confirmation ne correspond pas.' });
                  return;
                }
                const res = await changePassword(curPwd, nextPwd);
                setPwdResult(res);
                if (res.ok) {
                  setCurPwd('');
                  setNextPwd('');
                  setConfPwd('');
                }
              }}
              className="w-full rounded-full bg-ink py-3 text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
            >
              Mettre à jour le mot de passe
            </button>
          </div>
        </Card>
      </div>

      {/* Méta */}
      <div className="mt-5">
        <Card
          icon={Facebook}
          chip="bg-[#1877F2]/10 text-[#1877F2]"
          title="Pixels & Tracking (Meta + TikTok)"
          desc="Pixel Meta, Conversions API et Pixel TikTok pour mesurer les ventes de vos campagnes publicitaires."
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3.5">
              <Field label="Meta Pixel ID">
                <input
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex : 1840257632048293"
                  inputMode="numeric"
                  className={inputCls}
                />
              </Field>
              <Field label="TikTok Pixel ID">
                <div className="relative">
                  <Music2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={tiktokId}
                    onChange={(e) => setTiktokId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="Ex : C4JT0PRC77U00ABCDEFGH"
                    className={`${inputCls} pl-11`}
                  />
                </div>
              </Field>
              <Field label="Token Conversions API">
                <input
                  type="password"
                  value={capiToken}
                  onChange={(e) => setCapiToken(e.target.value)}
                  placeholder="EAAG… (token d’accès serveur)"
                  className={inputCls}
                />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-[13px] font-bold">Suivi activé</p>
                  <p className="text-[11px] text-neutral-400">
                    Injecte le pixel sur la boutique
                  </p>
                </div>
                <button
                  onClick={() => setMetaEnabled((s) => !s)}
                  aria-label="Activer le suivi"
                  className={`relative h-6 w-11 rounded-full transition ${
                    metaEnabled ? 'bg-stockgreen' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      metaEnabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMetaConfig({ pixelId, capiToken, tiktokPixelId: tiktokId, enabled: metaEnabled });
                    showToast('Configuration Méta enregistrée');
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3 text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
                >
                  <Check size={15} />
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setMetaConfig({ pixelId, capiToken, tiktokPixelId: tiktokId, enabled: metaEnabled });
                    showToast(testEvent());
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-4 py-3 text-[12.5px] font-bold text-neutral-600 transition hover:border-ink hover:text-ink"
                >
                  <FlaskConical size={15} />
                  Test
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-cream p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Événements trackés sur la boutique
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].map(
                  (e) => (
                    <span
                      key={e}
                      className="rounded-full bg-white px-3 py-1.5 font-mono text-[10.5px] font-bold text-[#1877F2] shadow-sm"
                    >
                      {e}
                    </span>
                  ),
                )}
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                TikTok — événements standards
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'CompletePayment'].map(
                  (e) => (
                    <span
                      key={e}
                      className="rounded-full bg-white px-3 py-1.5 font-mono text-[10.5px] font-bold text-[#FE2C55] shadow-sm"
                    >
                      {e}
                    </span>
                  ),
                )}
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-neutral-500">
                Le token CAPI n’est jamais exposé au navigateur : en production, les
                événements serveur transitent par une Supabase Edge Function sécurisée
                (voir schéma SQL, table meta_config + RLS).
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tarifs de livraison */}
      <div className="mt-5">
        <Card
          icon={Truck}
          chip="bg-stock-soft text-stockgreen"
          title="Tarifs de livraison"
          desc="Grille des 58 wilayas — toute modification est appliquée instantanément au calculateur du checkout."
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={shipQuery}
                onChange={(e) => setShipQuery(e.target.value)}
                placeholder="Rechercher une wilaya…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[12.5px] outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
              />
            </div>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stockgreen">
                <Check size={13} />
                Grille synchronisée à {savedAt}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/[0.06]">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 border-b border-black/5 bg-cream/70 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:grid-cols-[54px_1fr_110px_110px_36px]">
              <span>Code</span>
              <span>Wilaya</span>
              <span className="text-right">Domicile</span>
              <span className="text-right">Relais</span>
              <span />
            </div>
            <div className="max-h-[460px] overflow-y-auto">
              {filteredShipping.map((w) => {
                const open = openWilaya === w.code;
                return (
                  <div key={w.code} className="border-b border-black/5 last:border-0">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 px-4 py-2.5 sm:grid-cols-[54px_1fr_110px_110px_36px]">
                      <span className="text-[11px] font-bold text-neutral-400">
                        {String(w.code).padStart(2, '0')}
                      </span>
                      <span className="truncate text-[12.5px] font-semibold">
                        {w.name}
                        <span className="ml-1.5 text-[10px] font-medium text-neutral-400">
                          {w.communes.length} communes
                        </span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={w.home}
                        key={`h-${w.code}-${w.home}`}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== w.home) {
                            updateWilayaRate(w.code, v, w.stopdesk);
                            markSaved();
                          }
                        }}
                        className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-right text-[12px] font-bold outline-none focus:border-blush"
                      />
                      <input
                        type="number"
                        min={0}
                        defaultValue={w.stopdesk}
                        key={`s-${w.code}-${w.stopdesk}`}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== w.stopdesk) {
                            updateWilayaRate(w.code, w.home, v);
                            markSaved();
                          }
                        }}
                        className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-right text-[12px] font-bold outline-none focus:border-blush"
                      />
                      <button
                        onClick={() => setOpenWilaya(open ? null : w.code)}
                        aria-label="Communes"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          open ? 'bg-ink text-white' : 'text-neutral-400 hover:bg-cream'
                        }`}
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {open && (
                      <div className="bg-cream/50 px-4 pb-4 pt-1">
                        <table className="w-full">
                          <tbody>
                            {w.communes.map((co) => (
                              <tr key={co.name} className="border-b border-black/5 last:border-0">
                                <td className="py-1.5 text-[12px] font-medium">{co.name}</td>
                                <td className="w-32 py-1.5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-[10px] text-neutral-400">extra</span>
                                    <input
                                      type="number"
                                      min={0}
                                      defaultValue={co.extra}
                                      key={`c-${co.name}-${co.extra}`}
                                      onBlur={(e) => {
                                        const v = Number(e.target.value);
                                        if (v !== co.extra) {
                                          updateCommuneRate(w.code, co.name, v);
                                          markSaved();
                                        }
                                      }}
                                      className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-right text-[11.5px] font-bold outline-none focus:border-blush"
                                    />
                                    <span className="text-[10px] text-neutral-400">DA</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 flex gap-2">
                          <input
                            value={newCommune[w.code] ?? ''}
                            onChange={(e) =>
                              setNewCommune((s) => ({ ...s, [w.code]: e.target.value }))
                            }
                            placeholder="Ajouter une commune…"
                            className="flex-1 rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2 text-[12px] outline-none focus:border-blush"
                          />
                          <button
                            onClick={() => {
                              const name = (newCommune[w.code] ?? '').trim();
                              if (name) {
                                addCommune(w.code, name);
                                setNewCommune((s) => ({ ...s, [w.code]: '' }));
                                markSaved();
                                showToast(`Commune « ${name} » ajoutée à ${w.name}`);
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg bg-ink px-3 text-[11px] font-bold text-white"
                          >
                            <Plus size={12} /> Ajouter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-[11.5px] text-neutral-400">
            Exemple : total livraison = tarif du mode choisi + extra de la commune. Essayez une
            valeur comme {formatDA(600)} puis ouvrez le checkout boutique pour vérifier.
          </p>
        </Card>
      </div>

      {/* SQL Schema */}
      <div className="mt-5">
        <Card
          icon={Database}
          chip="bg-ink text-blush"
          title="Base de données — Schéma SQL Supabase"
          desc="Schéma complet avec tables, index, triggers et politiques RLS strictes, prêt à coller dans le SQL Editor Supabase."
        >
          <div className="mb-3 flex gap-2">
            <button
              onClick={copySql}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-black"
            >
              <Copy size={14} />
              Copier le SQL
            </button>
            <button
              onClick={downloadSql}
              className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-[12px] font-bold text-neutral-600 transition hover:border-ink hover:text-ink"
            >
              <Download size={14} />
              Télécharger .sql
            </button>
            <span className="ml-auto hidden items-center gap-1.5 self-center text-[11px] font-semibold text-stockgreen sm:flex">
              <ShieldCheck size={13} /> RLS activé sur 14 tables
            </span>
          </div>
          <pre className="max-h-[420px] overflow-auto rounded-2xl bg-ink p-5 font-mono text-[11px] leading-relaxed text-white/80">
            {schemaSql}
          </pre>
        </Card>
      </div>

      {/* Export projet */}
      <div className="mt-5">
        <Card
          icon={Archive}
          chip="bg-violetp-soft text-violetp-dark"
          title="Export du projet"
          desc="Téléchargez l'intégralité du code source (boutique + admin + schéma SQL) en un clic."
        >
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/oryam-cosmetics-source.zip"
              download="oryam-cosmetics-source.zip"
              onClick={() => showToast("Téléchargement de l'archive source lancé")}
              className="flex items-center gap-2 rounded-full bg-violetp px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-violetp/30 transition hover:bg-violetp-dark active:scale-[0.98]"
            >
              <Download size={15} />
              Télécharger le projet complet (.zip)
            </a>
            <p className="text-[11.5px] text-neutral-400">
              Archive regénérée à chaque build — inclut src/, supabase/, scripts/ et la
              configuration.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
