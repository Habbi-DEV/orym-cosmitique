import { useMemo, useState } from 'react';
import { Search, Users, Phone, MapPin, ShoppingBag, Banknote, ChevronDown, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { useLang } from '../context/LanguageContext';
import { formatDA } from '../lib/format';
import { downloadCsv } from '../lib/exportCsv';
import type { Order } from '../lib/types';

interface Customer {
  phone: string;
  name: string;
  wilayaName: string;
  orders: Order[];
  totalSpent: number;
  lastOrderAt: number;
}

function buildCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  orders.forEach((o) => {
    const key = o.phone.trim() || o.name;
    const existing = map.get(key);
    const spent = o.status === 'annulee' ? 0 : o.total;
    if (existing) {
      existing.orders.push(o);
      existing.totalSpent += spent;
      if (o.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = o.createdAt;
        existing.name = o.name;
        existing.wilayaName = o.wilayaName;
      }
    } else {
      map.set(key, {
        phone: o.phone,
        name: o.name,
        wilayaName: o.wilayaName,
        orders: [o],
        totalSpent: spent,
        lastOrderAt: o.createdAt,
      });
    }
  });
  return [...map.values()].sort((a, b) => b.orders.length - a.orders.length);
}

export default function AdminCustomers() {
  const { orders } = useData();
  const { showToast } = useStore();
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.wilayaName.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const kpis = [
    { icon: Users, label: t('adminCustomers.kpiClients'), value: String(customers.length) },
    {
      icon: ShoppingBag,
      label: t('adminCustomers.kpiFideles'),
      value: String(customers.filter((c) => c.orders.length > 1).length),
    },
    {
      icon: Banknote,
      label: t('adminCustomers.kpiPanierMoyen'),
      value: formatDA(
        customers.length
          ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length)
          : 0,
      ),
    },
  ];

  const exportCsv = () => {
    if (filtered.length === 0) return;
    downloadCsv(
      `clients-oryam-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((c) => ({
        Nom: c.name,
        Téléphone: c.phone,
        Wilaya: c.wilayaName,
        'Nb commandes': c.orders.length,
        'Total dépensé': c.totalSpent,
        'Dernière commande': new Date(c.lastOrderAt).toLocaleDateString('fr-FR'),
      })),
    );
    showToast(`${filtered.length} ${t('adminCustomers.exportee')}`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">{t('adminCustomers.relationClient')}</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{t('adminCustomers.titre')}</h1>
          <p className="mt-1 text-[13px] text-neutral-500">{t('adminCustomers.sub')}</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-[13px] font-bold text-ink transition hover:bg-cream"
        >
          <Download size={15} />
          {t('adminCustomers.exporterCsv')}
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-black/8 bg-white p-4">
            <k.icon size={16} className="text-blush" />
            <p className="mt-2 text-[20px] font-bold text-ink">{k.value}</p>
            <p className="text-[11.5px] text-neutral-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('adminCustomers.rechercherPlaceholder')}
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-blush"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <Users size={28} className="text-neutral-300" />
          <p className="text-[13.5px] text-neutral-400">{t('adminCustomers.aucunClient')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const isOpen = expanded === c.phone;
            return (
              <div key={c.phone} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : c.phone)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-soft font-serif text-[14px] font-bold text-blush">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-bold text-ink">{c.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {c.wilayaName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-[13.5px] font-bold text-ink">{formatDA(c.totalSpent)}</p>
                      <p className="text-[11px] text-neutral-500">
                        {c.orders.length} {t(c.orders.length > 1 ? 'adminCustomers.commandes' : 'adminCustomers.commande')}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-black/8 bg-cream/40 px-4 py-3">
                    <table className="w-full text-left text-[12.5px]">
                      <thead>
                        <tr className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">
                          <th className="pb-2 font-bold">{t('adminCustomers.colReference')}</th>
                          <th className="pb-2 font-bold">{t('adminCustomers.colDate')}</th>
                          <th className="pb-2 font-bold">{t('adminCustomers.colStatut')}</th>
                          <th className="pb-2 text-right font-bold">{t('adminCustomers.colTotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.orders
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((o) => (
                            <tr key={o.id} className="border-t border-black/5">
                              <td className="py-2 font-semibold text-ink">{o.ref}</td>
                              <td className="py-2 text-neutral-500">
                                {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-2 text-neutral-500">{t(`orderStatus.${o.status}` as const)}</td>
                              <td className="py-2 text-right font-semibold text-ink">{formatDA(o.total)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
