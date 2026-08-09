import { useMemo, useState } from 'react';
import {
  TicketPercent,
  Gift,
  Plus,
  Trash2,
  Check,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { formatDA } from '../lib/format';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function AdminPromos() {
  const { promos, addPromo, togglePromo, deletePromo, catalog, activeProducts, packProducts, addPack, deleteProduct } =
    useData();
  const marketingPromos = promos.filter((p) => !p.ownerPhone);
  const { showToast } = useStore();
  const { t } = useLang();
  const [tab, setTab] = useState<'codes' | 'packs'>('codes');

  // Promo form
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(0);

  const submitPromo = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) return showToast(t('adminPromos.errCodeLength'));
    if (promos.some((p) => p.code === clean)) return showToast(t('adminPromos.errCodeExiste'));
    if (value <= 0) return showToast(t('adminPromos.errValeur'));
    if (kind === 'percent' && value > 90) return showToast(t('adminPromos.errMax90'));
    addPromo({ code: clean, kind, value, minSubtotal, active: true });
    showToast(`${clean} ${t('adminPromos.codeCree')}`);
    setCode('');
    setValue(10);
    setMinSubtotal(0);
  };

  // Pack builder
  const prodChoices = activeProducts.filter((p) => p.type === 'produit');
  const [packName, setPackName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [packPrice, setPackPrice] = useState(0);
  const sumSelected = useMemo(
    () => selected.reduce((s, id) => s + (catalog.find((p) => p.id === id)?.price ?? 0), 0),
    [selected, catalog],
  );
  const suggested = Math.max(0, Math.round((sumSelected * 0.85) / 50) * 50);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const createPack = () => {
    if (packName.trim().length < 3) return showToast(t('adminPromos.errNomPack'));
    if (selected.length < 2) return showToast(t('adminPromos.errSelection'));
    if (packPrice <= 0) return showToast(t('adminPromos.errPrixPack'));
    addPack({ name: packName.trim(), productIds: selected, price: packPrice });
    showToast(`« ${packName.trim()} » ${t('adminPromos.packPublie')}`);
    setPackName('');
    setSelected([]);
    setPackPrice(0);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">{t('adminPromos.growth')}</p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('adminPromos.titre')}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">{t('adminPromos.sub')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit rounded-full border border-neutral-200 bg-white p-1">
        {(
          [
            { v: 'codes', icon: TicketPercent, label: t('adminPromos.tabCodes') },
            { v: 'packs', icon: Gift, label: t('adminPromos.tabPacks') },
          ] as const
        ).map(({ v, icon: Icon, label }) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition ${
              tab === v ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ---------------- CODES PROMO ---------------- */}
      {tab === 'codes' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          {/* Create form */}
          <div className="h-fit rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush-soft text-blush">
                <Sparkles size={16} />
              </span>
              {t('adminPromos.creerCode')}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {t('adminPromos.code')}
                </p>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex : NOEL25"
                    className={`${inputCls} uppercase`}
                  />
                  <button
                    onClick={() => setCode(genCode())}
                    title={t('adminPromos.genererCode')}
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-blush hover:text-blush"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {t('adminPromos.typeReduction')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: 'percent', t: t('adminPromos.pourcentage'), d: t('adminPromos.pourcentageEx') },
                      { v: 'fixed', t: t('adminPromos.montantFixe'), d: t('adminPromos.montantFixeEx') },
                    ] as const
                  ).map((k) => (
                    <button
                      key={k.v}
                      onClick={() => setKind(k.v)}
                      className={`rounded-xl border p-3 text-left transition ${
                        kind === k.v
                          ? 'border-ink bg-cream ring-1 ring-ink'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="text-[12.5px] font-bold">{k.t}</p>
                      <p className="text-[10.5px] text-neutral-400">{k.d}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t('adminPromos.valeur')} {kind === 'percent' ? '(%)' : '(DA)'}
                  </p>
                  <input
                    type="number"
                    min={1}
                    value={value || ''}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t('adminPromos.minAchat')}
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={minSubtotal || ''}
                    onChange={(e) => setMinSubtotal(Number(e.target.value))}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                onClick={submitPromo}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blush py-3.5 text-[13.5px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
              >
                <Plus size={16} />
                {t('adminPromos.activerCode')}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <h2 className="font-serif text-xl font-semibold">{t('adminPromos.codesExistants')}</h2>
            <div className="mt-4 space-y-3">
              {marketingPromos.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                    p.active ? 'border-stockgreen/30 bg-stock-soft/40' : 'border-neutral-200 bg-neutral-50 opacity-70'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      p.active ? 'bg-stock-soft text-stockgreen' : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <TicketPercent size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold tracking-wide">{p.code}</p>
                    <p className="text-[11px] text-neutral-500">
                      {p.kind === 'percent' ? `-${p.value}%` : `-${formatDA(p.value)}`}
                      {p.minSubtotal > 0 ? ` · ${t('adminPromos.desAchat')} ${formatDA(p.minSubtotal)} ${t('adminPromos.dachat')}` : ''}
                      {' · '}{p.usages} {t('adminPromos.utilisations')}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePermoSafe(p.id)}
                    aria-label="Activer / désactiver"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      p.active ? 'bg-stockgreen' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        p.active ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      deletePromo(p.id);
                      showToast(`${p.code} ${t('adminPromos.codeSupprime')}`);
                    }}
                    aria-label={t('adminProducts.supprimer')}
                    className="text-neutral-300 transition hover:text-navred"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {marketingPromos.length === 0 && (
                <p className="py-6 text-center text-[13px] text-neutral-400">{t('adminPromos.aucunCode')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PACK BUILDER ---------------- */}
      {tab === 'packs' && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <h2 className="font-serif text-xl font-semibold">{t('adminPromos.choisirProduits')}</h2>
            <p className="mt-1 text-[12px] text-neutral-400">{t('adminPromos.selectionnerAuMoins')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {prodChoices.map((p) => {
                const sel = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 text-left transition ${
                      sel ? 'border-violetp ring-1 ring-violetp' : 'border-transparent hover:border-neutral-200'
                    }`}
                  >
                    <img src={p.images[0]} alt="" className="aspect-square w-full bg-cream object-cover" />
                    {sel && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violetp text-white">
                        <Check size={12} />
                      </span>
                    )}
                    <div className="bg-white px-2.5 py-2">
                      <p className="truncate text-[11px] font-semibold">{p.name}</p>
                      <p className="text-[10.5px] font-bold text-blush">{formatDA(p.price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <h2 className="mt-7 font-serif text-xl font-semibold">{t('adminPromos.packsActifs')}</h2>
            <div className="mt-3 space-y-2.5">
              {packProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-cream/50 p-3"
                >
                  <img src={p.images[0]} alt="" className="h-11 w-11 rounded-xl bg-white object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {p.packItems?.length ?? 0} {t('adminPromos.produitsMot')} · {formatDA(p.price)}
                      {p.oldPrice ? ` ${t('adminPromos.auLieuDe')} ${formatDA(p.oldPrice)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      deleteProduct(p.id);
                      showToast(`${p.name} ${t('adminPromos.packRetire')}`);
                    }}
                    aria-label={t('adminPromos.supprimerPack')}
                    className="text-neutral-300 transition hover:text-navred"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)] lg:sticky lg:top-10">
            <h2 className="font-serif text-xl font-semibold">{t('adminPromos.resumePrix')}</h2>
            <div className="mt-4 rounded-2xl bg-cream p-4 text-[13px]">
              <p className="flex justify-between text-neutral-500">
                {t('adminPromos.produitsSelectionnes')}
                <span className="font-bold text-ink">{selected.length}</span>
              </p>
              <p className="mt-2 flex justify-between text-neutral-500">
                {t('adminPromos.valeurTotale')}
                <span className="font-bold text-ink">{formatDA(sumSelected)}</span>
              </p>
              <p className="mt-2 flex justify-between text-neutral-500">
                {t('adminPromos.prixSuggere')}
                <span className="font-bold text-violetp-dark">{formatDA(suggested)}</span>
              </p>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {t('adminPromos.nomPack')}
              </p>
              <input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder={t('adminPromos.nomPackPlaceholder')}
                className={inputCls}
              />
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {t('adminPromos.prixPack')}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={packPrice || ''}
                  onChange={(e) => setPackPrice(Number(e.target.value))}
                  placeholder={suggested ? String(suggested) : '0'}
                  className={inputCls}
                />
                <button
                  onClick={() => setPackPrice(suggested)}
                  className="shrink-0 rounded-xl border border-violetp/40 bg-violetp-soft px-3.5 text-[11px] font-bold text-violetp-dark transition hover:bg-violetp-soft/70"
                >
                  -15%
                </button>
              </div>
            </div>
            {packPrice > 0 && sumSelected > packPrice && (
              <p className="mt-3 rounded-xl bg-stock-soft px-3.5 py-2.5 text-[12px] font-semibold text-stockgreen">
                {t('adminPromos.economieClient')} : {formatDA(sumSelected - packPrice)} (
                {Math.round((1 - packPrice / sumSelected) * 100)}%)
              </p>
            )}
            <button
              onClick={createPack}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-violetp py-3.5 text-[13.5px] font-bold text-white shadow-lg shadow-violetp/30 transition hover:bg-violetp-dark active:scale-[0.98]"
            >
              <Gift size={16} />
              {t('adminPromos.publierPack')}
            </button>
            <p className="mt-3 text-center text-[11px] text-neutral-400">{t('adminPromos.packInfo')}</p>
          </div>
        </div>
      )}
    </div>
  );

  function togglePermoSafe(id: string) {
    togglePromo(id);
    showToast(t('adminPromos.statutMisAJour'));
  }
}
