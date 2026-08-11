import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Warehouse,
  AlertTriangle,
  Plus,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Search,
  Package,
  Banknote,
  Activity,
  Download,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { type MovementKind } from '../lib/types';
import { formatDA } from '../lib/format';
import { downloadCsv } from '../lib/exportCsv';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

const KIND_META: Record<MovementKind, { icon: React.ElementType; chip: string; sign: string }> = {
  depot: { icon: ArrowDownToLine, chip: 'bg-stock-soft text-stockgreen', sign: '+' },
  retrait: { icon: ArrowUpFromLine, chip: 'bg-red-100 text-navred', sign: '-' },
  reintegration: { icon: RotateCcw, chip: 'bg-blue-100 text-blue-700', sign: '+' },
};

function MovementModal({
  presetProduct,
  presetKind,
  onClose,
}: {
  presetProduct?: string;
  presetKind?: MovementKind;
  onClose: () => void;
}) {
  const { catalog, addMovement } = useData();
  const { showToast } = useStore();
  const { t } = useLang();
  const [kind, setKind] = useState<MovementKind>(presetKind ?? 'depot');
  const [productId, setProductId] = useState(presetProduct ?? catalog[0]?.id ?? '');
  const [qty, setQty] = useState(10);
  const [reason, setReason] = useState('');

  const submit = () => {
    if (!productId || qty <= 0) return;
    addMovement(kind, productId, qty, reason.trim());
    const meta = KIND_META[kind];
    showToast(`${t(`movementKind.${kind}` as const)} ${t('adminInventory.mouvementEnregistre')} — ${meta.sign}${qty} ${t('adminInventory.unitesLabel')}`);
    onClose();
  };

  const motifPlaceholder =
    kind === 'depot'
      ? t('adminInventory.motifDepot')
      : kind === 'retrait'
        ? t('adminInventory.motifRetrait')
        : t('adminInventory.motifReintegration');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[25px] bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-[25px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold">{t('adminInventory.nouveauMouvement')}</h2>
          <button
            onClick={onClose}
            aria-label={t('common.fermer')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-neutral-500 hover:bg-neutral-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {t('adminInventory.typeMouvement')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(KIND_META) as MovementKind[]).map((k) => {
                const Meta = KIND_META[k];
                return (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                      kind === k ? 'border-ink bg-cream ring-1 ring-ink' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${Meta.chip}`}>
                      <Meta.icon size={15} />
                    </span>
                    <span className="text-[10px] font-bold leading-tight">
                      {t(`movementKind.${k}` as const)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {t('adminInventory.produit')}
            </p>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
              {catalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {t('adminInventory.stockActuel')} : {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {t('adminInventory.quantite')}
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="font-bold text-neutral-400 hover:text-ink"
                  aria-label="-"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border-none text-center text-[15px] font-extrabold outline-none"
                />
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="font-bold text-neutral-400 hover:text-ink"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {t('adminInventory.motif')}
              </p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={motifPlaceholder}
                className={inputCls}
              />
            </div>
          </div>

          <button
            onClick={submit}
            className="w-full rounded-full bg-ink py-3.5 text-[13.5px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
          >
            {t('adminInventory.enregistrerGrandLivre')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminInventory() {
  const { catalog, lowStock, ledger } = useData();
  const { showToast } = useStore();
  const { t } = useLang();
  const [tab, setTab] = useState<'stock' | 'ledger'>('stock');
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<MovementKind | 'tous'>('tous');
  const [modal, setModal] = useState<{ product?: string; kind?: MovementKind } | null>(null);

  const stockValue = catalog.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const exportStockCsv = () => {
    if (catalog.length === 0) return;
    downloadCsv(
      `stock-oryam-${new Date().toISOString().slice(0, 10)}.csv`,
      catalog.map((p) => ({
        Référence: p.id,
        Nom: p.name,
        Catégorie: p.category,
        Stock: p.stock,
        'Coût unitaire': p.costPrice,
        'Valeur stock': p.stock * p.costPrice,
        Prix_vente: p.price,
        Actif: p.isActive ? 'Oui' : 'Non',
      })),
    );
    showToast(`${catalog.length} ${t('adminInventory.colProduit').toLowerCase()}(s)`);
  };
  const exportLedgerCsv = () => {
    if (filteredLedger.length === 0) {
      showToast(t('adminInventory.aucunMouvement'));
      return;
    }
    downloadCsv(
      `mouvements-oryam-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredLedger.map((m) => ({
        Date: new Date(m.at).toLocaleString('fr-FR'),
        Produit: m.productName,
        Type: t(`movementKind.${m.kind}` as const),
        Quantité: m.qty,
        Motif: m.reason,
      })),
    );
    showToast(`${filteredLedger.length} ${t('adminInventory.colMouvement').toLowerCase()}(s)`);
  };
  const filtered = useMemo(
    () => catalog.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [catalog, query],
  );
  const filteredLedger = useMemo(
    () =>
      ledger.filter((m) => {
        const q = query.trim().toLowerCase();
        const matchQ = !q || m.productName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q);
        const matchK = kindFilter === 'tous' || m.kind === kindFilter;
        return matchQ && matchK;
      }),
    [ledger, query, kindFilter],
  );

  const kpis = [
    { icon: Package, label: t('adminInventory.kpiReferences'), value: String(catalog.length), chip: 'bg-blue-100 text-blue-700' },
    { icon: Banknote, label: t('adminInventory.kpiValeurStock'), value: formatDA(stockValue), chip: 'bg-blush-soft text-[#8E4254]' },
    { icon: AlertTriangle, label: t('adminInventory.kpiAlertes'), value: String(lowStock.length), chip: 'bg-red-100 text-navred' },
    { icon: Activity, label: t('adminInventory.kpiMouvements'), value: String(ledger.length), chip: 'bg-violetp-soft text-violetp-dark' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">{t('adminInventory.entrepot')}</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('adminInventory.titre')}
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">{t('adminInventory.sub')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportStockCsv}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-[13px] font-bold text-ink transition hover:bg-cream"
          >
            <Download size={15} />
            {t('adminInventory.exporterCsv')}
          </button>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
          >
            <Plus size={16} />
            {t('adminInventory.nouveauMouvement')}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, chip }) => (
          <div
            key={label}
            className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_2px_18px_rgba(12,12,14,0.05)]"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${chip}`}>
              <Icon size={18} />
            </span>
            <p className="mt-3.5 truncate text-xl font-extrabold tracking-tight">{value}</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-neutral-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-amber-800">
            <AlertTriangle size={16} />
            {lowStock.length} {t('adminInventory.alerteSeuilPre')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-semibold shadow-sm"
              >
                {p.name}
                <span className="font-extrabold text-navred">{p.stock}</span>
                <button
                  onClick={() => setModal({ product: p.id, kind: 'depot' })}
                  className="rounded-full bg-stockgreen px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  {t('adminInventory.reappro')}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="mb-5 mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-neutral-200 bg-white p-1">
          {(
            [
              { v: 'stock', label: t('adminInventory.tabStock') },
              { v: 'ledger', label: t('adminInventory.tabLedger') },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${
                tab === v ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('adminInventory.rechercherPlaceholder')}
            className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[12.5px] outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
          />
        </div>
        {tab === 'ledger' && (
          <button
            onClick={exportLedgerCsv}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-cream"
          >
            <Download size={13} />
            {t('adminInventory.csv')}
          </button>
        )}
      </div>

      {/* STOCK TABLE */}
      {tab === 'stock' && (
        <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-black/5 bg-cream/60 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3.5">{t('adminInventory.colProduit')}</th>
                  <th className="px-4 py-3.5">{t('adminInventory.colStock')}</th>
                  <th className="px-4 py-3.5">{t('adminInventory.colVariantes')}</th>
                  <th className="px-4 py-3.5">{t('adminInventory.colValeur')}</th>
                  <th className="px-4 py-3.5 text-right">{t('adminInventory.colMouvement')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((p) => {
                  const low = p.stock <= 8;
                  return (
                    <tr key={p.id} className="transition hover:bg-cream/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} alt="" className="h-10 w-10 rounded-xl bg-cream object-cover" />
                          <p className="max-w-[240px] truncate text-[13px] font-bold">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                            low ? 'bg-red-100 text-navred' : 'bg-stock-soft text-stockgreen'
                          }`}
                        >
                          {low && <AlertTriangle size={11} />}
                          {p.stock} {t('adminInventory.unites')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-neutral-500">
                        {p.variants.length
                          ? p.variants.map((v) => `${v.name} (${v.stock})`).join(' · ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-bold">
                        {formatDA(p.stock * p.costPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setModal({ product: p.id, kind: 'depot' })}
                            title={t('adminInventory.depot')}
                            className="flex h-8 items-center gap-1 rounded-lg bg-stock-soft px-2.5 text-[11px] font-bold text-stockgreen transition hover:brightness-95"
                          >
                            <ArrowDownToLine size={12} /> {t('adminInventory.depot')}
                          </button>
                          <button
                            onClick={() => setModal({ product: p.id, kind: 'retrait' })}
                            title={t('adminInventory.retrait')}
                            className="flex h-8 items-center gap-1 rounded-lg bg-red-50 px-2.5 text-[11px] font-bold text-navred transition hover:bg-red-100"
                          >
                            <ArrowUpFromLine size={12} /> {t('adminInventory.retrait')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEDGER */}
      {tab === 'ledger' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['tous', 'depot', 'retrait', 'reintegration'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition ${
                  kindFilter === k
                    ? 'bg-ink text-white'
                    : 'border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                }`}
              >
                {k === 'tous' ? t('adminOrders.toutes') : t(`movementKind.${k}` as const)}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-black/5 bg-cream/60 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3.5">{t('adminInventory.colDate')}</th>
                    <th className="px-4 py-3.5">{t('adminInventory.colType')}</th>
                    <th className="px-4 py-3.5">{t('adminInventory.colProduit')}</th>
                    <th className="px-4 py-3.5">{t('adminInventory.colQte')}</th>
                    <th className="px-4 py-3.5">{t('adminInventory.colMotif')}</th>
                    <th className="px-4 py-3.5">{t('adminInventory.colAuteur')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredLedger.map((m) => {
                    const Meta = KIND_META[m.kind];
                    return (
                      <tr key={m.id} className="transition hover:bg-cream/40">
                        <td className="whitespace-nowrap px-5 py-3 text-[11.5px] text-neutral-500">
                          {new Date(m.at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          {' · '}
                          {new Date(m.at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${Meta.chip}`}
                          >
                            <Meta.icon size={11} />
                            {t(`movementKind.${m.kind}` as const)}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-[12.5px] font-semibold">
                          {m.productName}
                        </td>
                        <td
                          className={`px-4 py-3 text-[13px] font-extrabold ${
                            m.kind === 'retrait' ? 'text-navred' : 'text-stockgreen'
                          }`}
                        >
                          {Meta.sign}
                          {m.qty}
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-[12px] text-neutral-500">
                          {m.reason}
                        </td>
                        <td className="px-4 py-3 text-[11.5px] text-neutral-400">{m.author}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLedger.length === 0 && (
              <p className="py-10 text-center text-[13px] text-neutral-400">
                {t('adminInventory.aucunMouvement')}
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-neutral-400">
        <Warehouse size={13} />
        {t('adminInventory.noteAuto')}
      </div>

      <AnimatePresence>
        {modal && (
          <MovementModal
            presetProduct={modal.product}
            presetKind={modal.kind}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
