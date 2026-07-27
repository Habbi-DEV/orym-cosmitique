import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Home,
  Store,
  User,
  ClipboardList,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { formatDA } from '../lib/format';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

interface Line {
  productId: string;
  qty: number;
}

export default function ManualOrderModal({ onClose }: { onClose: () => void }) {
  const { catalog, shipping: rates, createOrder, session } = useData();
  const { showToast } = useStore();

  const [attempted, setAttempted] = useState(false);
  const [form, setForm] = useState({
    gender: 'madame' as 'madame' | 'monsieur',
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    delivery: 'domicile' as 'domicile' | 'stopdesk',
    address: '',
    note: '',
  });
  const [lines, setLines] = useState<Line[]>([{ productId: catalog[0]?.id ?? '', qty: 1 }]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const wilaya = useMemo(
    () => rates.find((w) => String(w.code) === form.wilaya),
    [rates, form.wilaya],
  );
  const commune = useMemo(
    () => wilaya?.communes.find((co) => co.name === form.commune),
    [wilaya, form.commune],
  );

  const shipping = useMemo(() => {
    if (!wilaya || !commune) return null;
    return (form.delivery === 'domicile' ? wilaya.home : wilaya.stopdesk) + commune.extra;
  }, [wilaya, commune, form.delivery]);

  const subtotal = lines.reduce((s, l) => {
    const p = catalog.find((x) => x.id === l.productId);
    return s + (p?.price ?? 0) * l.qty;
  }, 0);
  const total = subtotal + (shipping ?? 0);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = 'Nom requis';
    const digits = form.phone.replace(/[\s.-]/g, '');
    if (!/^(?:\+213|0)(5|6|7)\d{8}$/.test(digits)) e.phone = 'Téléphone invalide';
    if (!wilaya) e.wilaya = 'Wilaya requise';
    else if (!commune) e.commune = 'Commune requise';
    if (lines.length === 0 || lines.some((l) => !l.productId || l.qty < 1))
      e.lines = 'Ajoutez au moins un produit valide';
    return e;
  }, [form, wilaya, commune, lines]);

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;

    const items = lines
      .map((l) => {
        const p = catalog.find((x) => x.id === l.productId);
        if (!p) return null;
        return { productId: p.id, name: p.name, price: p.price, qty: l.qty, image: p.images[0] };
      })
      .filter((i): i is NonNullable<typeof i> => Boolean(i));

    const created = createOrder({
      gender: form.gender,
      name: form.name.trim(),
      phone: form.phone,
      wilayaCode: wilaya?.code ?? 0,
      wilayaName: wilaya?.name ?? '',
      commune: form.commune,
      delivery: form.delivery,
      address: form.address.trim() || undefined,
      items,
      subtotal,
      shipping: shipping ?? 0,
      discount: 0,
      total,
    });

    showToast(
      `Commande ${created.ref} créée manuellement${session ? ` par ${session.name.split(' ')[0]}` : ''}`,
    );
    onClose();
  };

  const label = (t: string) => (
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
      {t}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[25px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[25px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violetp-soft text-violetp-dark">
              <ClipboardList size={19} />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold leading-tight">
                Créer une commande
              </h2>
              <p className="text-[11.5px] text-neutral-400">
                Saisie manuelle — appel téléphonique, réseaux sociaux, boutique physique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-neutral-500 hover:bg-neutral-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Gender + name + phone */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              {label('Civilité')}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { v: 'madame', t: 'Madame' },
                    { v: 'monsieur', t: 'Monsieur' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.v}
                    onClick={() => set('gender', g.v)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-semibold transition ${
                      form.gender === g.v
                        ? 'border-ink bg-ink text-white'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <User size={13} />
                    {g.t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {label('Nom complet *')}
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ex : Amina Kaci"
                className={inputCls}
              />
              {attempted && errors.name && (
                <p className="mt-1 text-[11px] font-medium text-navred">{errors.name}</p>
              )}
            </div>
          </div>

          <div>
            {label('Téléphone *')}
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Ex : 05 50 12 34 56"
              inputMode="tel"
              className={inputCls}
            />
            {attempted && errors.phone && (
              <p className="mt-1 text-[11px] font-medium text-navred">{errors.phone}</p>
            )}
          </div>

          {/* Wilaya / Commune */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              {label('Wilaya *')}
              <div className="relative">
                <select
                  value={form.wilaya}
                  onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value, commune: '' }))}
                  className={`${inputCls} appearance-none pr-9 ${form.wilaya === '' ? 'text-neutral-400' : ''}`}
                >
                  <option value="">Choisir…</option>
                  {rates.map((w) => (
                    <option key={w.code} value={String(w.code)}>
                      {String(w.code).padStart(2, '0')} — {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
              {attempted && errors.wilaya && (
                <p className="mt-1 text-[11px] font-medium text-navred">{errors.wilaya}</p>
              )}
            </div>
            <div>
              {label('Commune *')}
              <div className="relative">
                <select
                  value={form.commune}
                  disabled={!wilaya}
                  onChange={(e) => set('commune', e.target.value)}
                  className={`${inputCls} appearance-none pr-9 disabled:bg-neutral-50 ${
                    form.commune === '' ? 'text-neutral-400' : ''
                  }`}
                >
                  <option value="">{wilaya ? 'Choisir…' : 'Wilaya d’abord'}</option>
                  {wilaya?.communes.map((co) => (
                    <option key={co.name} value={co.name}>
                      {co.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
              {attempted && errors.commune && (
                <p className="mt-1 text-[11px] font-medium text-navred">{errors.commune}</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div>
            {label('Mode de livraison')}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: 'domicile', icon: Home, t: 'À domicile', price: wilaya?.home },
                  { v: 'stopdesk', icon: Store, t: 'Point relais', price: wilaya?.stopdesk },
                ] as const
              ).map((d) => (
                <button
                  key={d.v}
                  onClick={() => set('delivery', d.v)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                    form.delivery === d.v
                      ? 'border-ink bg-cream ring-1 ring-ink'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[12px] font-bold">
                    <d.icon size={13} /> {d.t}
                  </span>
                  <span className={`text-[11.5px] font-semibold ${d.price != null ? 'text-blush' : 'text-neutral-400'}`}>
                    {d.price != null ? formatDA(d.price) : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {form.delivery === 'domicile' && (
            <div>
              {label('Adresse (optionnel)')}
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Rue, immeuble, point de repère…"
                className={inputCls}
              />
            </div>
          )}

          {/* Products */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Articles *
              </span>
              <button
                onClick={() =>
                  setLines((prev) => [...prev, { productId: catalog[0]?.id ?? '', qty: 1 }])
                }
                className="flex items-center gap-1 text-[11.5px] font-bold text-blush hover:underline"
              >
                <Plus size={13} /> Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const p = catalog.find((x) => x.id === l.productId);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={l.productId}
                        onChange={(e) => updateLine(i, { productId: e.target.value })}
                        className={`${inputCls} appearance-none pr-9`}
                      >
                        {catalog.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {formatDA(c.price)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-2.5 py-2.5">
                      <button
                        onClick={() => updateLine(i, { qty: Math.max(1, l.qty - 1) })}
                        className="text-neutral-400 hover:text-ink"
                        aria-label="Moins"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-4 text-center text-[13px] font-bold">{l.qty}</span>
                      <button
                        onClick={() => updateLine(i, { qty: Math.min(50, l.qty + 1) })}
                        className="text-neutral-400 hover:text-ink"
                        aria-label="Plus"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="w-20 text-right text-[12px] font-bold text-blush">
                      {p ? formatDA(p.price * l.qty) : '—'}
                    </span>
                    {lines.length > 1 && (
                      <button
                        onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Retirer la ligne"
                        className="text-neutral-300 hover:text-navred"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {attempted && errors.lines && (
              <p className="mt-1 text-[11px] font-medium text-navred">{errors.lines}</p>
            )}
          </div>

          {/* Recap */}
          <div className="rounded-2xl bg-cream p-4 text-[13px]">
            <p className="flex justify-between text-neutral-500">
              Sous-total <span className="font-semibold text-ink">{formatDA(subtotal)}</span>
            </p>
            <p className="mt-1.5 flex justify-between text-neutral-500">
              Livraison{wilaya ? ` · ${wilaya.name}` : ''}
              <span className="font-semibold text-ink">
                {shipping !== null ? formatDA(shipping) : '—'}
              </span>
            </p>
            <p className="mt-3 flex justify-between border-t border-black/10 pt-3">
              <span className="font-bold">Total</span>
              <span className="text-[16px] font-extrabold">{formatDA(total)}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-6 py-4">
          <button
            onClick={submit}
            className="w-full rounded-full bg-blush py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
          >
            Enregistrer la commande · {formatDA(total)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
