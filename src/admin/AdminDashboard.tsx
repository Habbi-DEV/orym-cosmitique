import { Link } from 'react-router-dom';
import {
  Banknote,
  ClipboardList,
  Hourglass,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Heart,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLang } from '../context/LanguageContext';
import { formatDA } from '../lib/format';

const STATUS_COLORS: Record<string, string> = {
  en_attente: 'bg-amber-100 text-amber-700',
  confirmee: 'bg-blue-100 text-blue-700',
  expediee: 'bg-violetp-soft text-violetp-dark',
  livree: 'bg-stock-soft text-stockgreen',
  annulee: 'bg-red-100 text-navred',
};

export default function AdminDashboard() {
  const { orders, lowStock, catalog, session, ledger, wishlistStats } = useData();
  const { t } = useLang();

  // Produits les plus désirés (wishlist)
  const wishlistTop = Object.entries(wishlistStats)
    .map(([id, count]) => ({ name: catalog.find((p) => p.id === id)?.name ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const maxWish = Math.max(...wishlistTop.map((w) => w.count), 1);

  const valid = orders.filter((o) => o.status !== 'annulee');
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === 'en_attente').length;
  const avgBasket = valid.length ? Math.round(revenue / valid.length) : 0;

  // 7 derniers jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const next = d.getTime() + 86_400_000;
    const dayOrders = valid.filter((o) => o.createdAt >= d.getTime() && o.createdAt < next);
    return {
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      amount: dayOrders.reduce((s, o) => s + o.total, 0),
      count: dayOrders.length,
    };
  });
  const maxAmount = Math.max(...days.map((d) => d.amount), 1);

  // Top produits vendus
  const soldMap = new Map<string, { name: string; qty: number }>();
  valid.forEach((o) =>
    o.items.forEach((i) => {
      const cur = soldMap.get(i.productId) ?? { name: i.name, qty: 0 };
      soldMap.set(i.productId, { name: cur.name, qty: cur.qty + i.qty });
    }),
  );
  const topProducts = [...soldMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 4);
  const maxSold = Math.max(...topProducts.map((t) => t.qty), 1);

  const kpis = [
    { icon: Banknote, label: t('adminDashboard.chiffreAffaires'), value: formatDA(revenue), chip: 'bg-blush-soft text-[#8E4254]' },
    { icon: Hourglass, label: t('adminDashboard.commandesEnAttente'), value: String(pending), chip: 'bg-amber-100 text-amber-700' },
    { icon: TrendingUp, label: t('adminDashboard.panierMoyen'), value: formatDA(avgBasket), chip: 'bg-violetp-soft text-violetp-dark' },
    { icon: AlertTriangle, label: t('adminDashboard.alertesStock'), value: String(lowStock.length), chip: 'bg-red-100 text-navred' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
          {t('adminDashboard.console')}
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('adminDashboard.bonjour')}, {session?.name.split(' ')[0]}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-neutral-500">{t('adminDashboard.activite')}</p>
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
            <p className="mt-3.5 truncate text-xl font-extrabold tracking-tight sm:text-[22px]">
              {value}
            </p>
            <p className="mt-0.5 text-[11.5px] font-medium text-neutral-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Chart */}
        <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold">{t('adminDashboard.ventes7j')}</h2>
              <p className="mt-0.5 text-[12px] text-neutral-400">{t('adminDashboard.montantParJour')}</p>
            </div>
            <span className="rounded-full bg-stock-soft px-3 py-1 text-[11px] font-bold text-stockgreen">
              +{formatDA(days.reduce((s, d) => s + d.amount, 0))}
            </span>
          </div>
          <div className="mt-7 flex h-44 items-end justify-between gap-2 sm:gap-3">
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400">{d.count > 0 ? d.count : ''}</span>
                <div className="flex h-32 w-full items-end rounded-xl bg-cream/70 px-1 pb-0">
                  <div
                    title={formatDA(d.amount)}
                    className="w-full rounded-lg bg-gradient-to-t from-blush to-[#E8B2BE] transition-all"
                    style={{ height: `${Math.max(4, Math.round((d.amount / maxAmount) * 100))}%` }}
                  />
                </div>
                <span className="text-[10.5px] font-semibold capitalize text-neutral-400">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products + stock alerts */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <h2 className="font-serif text-xl font-semibold">{t('adminDashboard.produitsPlusVendus')}</h2>
            <div className="mt-4 space-y-3.5">
              {topProducts.map((tp) => (
                <div key={tp.name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate font-semibold">{tp.name}</span>
                    <span className="ml-2 shrink-0 font-bold text-blush">{tp.qty}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-violetp"
                      style={{ width: `${Math.round((tp.qty / maxSold) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-[12.5px] text-neutral-400">{t('adminDashboard.aucuneVente')}</p>
              )}
            </div>
          </div>

          {/* Wishlist insights */}
          <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
                <Heart size={17} className="text-blush" />
                {t('adminDashboard.plusDesires')}
              </h2>
              <span className="rounded-full bg-blush-soft px-2.5 py-1 text-[10px] font-bold text-[#8E4254]">
                WISHLIST
              </span>
            </div>
            <div className="mt-4 space-y-3.5">
              {wishlistTop.map((w) => (
                <div key={w.name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate font-semibold">{w.name}</span>
                    <span className="ml-2 flex shrink-0 items-center gap-1 font-bold text-navred">
                      <Heart size={11} className="fill-current" />
                      {w.count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blush to-[#E8B2BE]"
                      style={{ width: `${Math.round((w.count / maxWish) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {wishlistTop.length === 0 && (
                <p className="text-[12.5px] text-neutral-400">{t('adminDashboard.aucunFavori')}</p>
              )}
            </div>
          </div>

          <div className="flex-1 rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">{t('adminDashboard.stockFaible')}</h2>
              <Link
                to="/admin/inventaire"
                className="flex items-center gap-1 text-[11.5px] font-bold text-blush hover:underline"
              >
                {t('adminDashboard.gerer')} <ArrowRight size={12} className="rtl:rotate-180" />
              </Link>
            </div>
            <div className="mt-3.5 space-y-2.5">
              {lowStock.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg bg-cream object-cover" />
                  <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{p.name}</p>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-navred">
                    {p.stock} {t('adminDashboard.restants')}
                  </span>
                </div>
              ))}
              {lowStock.length === 0 && (
                <p className="text-[12.5px] text-neutral-400">{t('adminDashboard.stocksSains')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders + ledger preview */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">{t('adminDashboard.dernieresCommandes')}</h2>
            <Link
              to="/admin/commandes"
              className="flex items-center gap-1 text-[11.5px] font-bold text-blush hover:underline"
            >
              {t('adminDashboard.toutVoir')} <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-black/5">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-neutral-500">
                  <ClipboardList size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">
                    {o.ref} <span className="font-medium text-neutral-400">· {o.name}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {o.wilayaName} · {o.items.reduce((s, i) => s + i.qty, 0)} {t('adminDashboard.articles')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12.5px] font-extrabold">{formatDA(o.total)}</p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold ${STATUS_COLORS[o.status]}`}
                  >
                    {t(`orderStatus.${o.status}` as const)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">{t('adminDashboard.mouvementsRecents')}</h2>
            <Link
              to="/admin/inventaire"
              className="flex items-center gap-1 text-[11.5px] font-bold text-blush hover:underline"
            >
              {t('adminDashboard.grandLivre')} <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-black/5">
            {ledger.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-neutral-500">
                  <Package size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{m.productName}</p>
                  <p className="truncate text-[11px] text-neutral-400">{m.reason}</p>
                </div>
                <span
                  className={`shrink-0 text-[13px] font-extrabold ${
                    m.kind === 'retrait' ? 'text-navred' : 'text-stockgreen'
                  }`}
                >
                  {m.kind === 'retrait' ? `-${m.qty}` : `+${m.qty}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
