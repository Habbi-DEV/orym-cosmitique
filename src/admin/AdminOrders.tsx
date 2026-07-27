import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Phone,
  Printer,
  Truck,
  ChevronDown,
  Check,
  Table2,
  LayoutGrid,
  MapPin,
  Home,
  Store,
  TicketPercent,
  Loader2,
  Ban,
  Plus,
  Download,
} from 'lucide-react';
import ManualOrderModal from './ManualOrderModal';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { ORDER_FLOW, ORDER_STATUS_LABELS, type Order, type OrderStatus } from '../lib/types';
import { formatDA } from '../lib/format';
import { downloadCsv } from '../lib/exportCsv';

export const STATUS_COLORS: Record<OrderStatus, string> = {
  en_attente: 'bg-amber-100 text-amber-700',
  confirmee: 'bg-blue-100 text-blue-700',
  expediee: 'bg-violetp-soft text-violetp-dark',
  livree: 'bg-stock-soft text-stockgreen',
  annulee: 'bg-red-100 text-navred',
};

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
  ' · ' +
  new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function printLabel(o: Order) {
  const w = window.open('', '_blank', 'width=430,height=660');
  if (!w) return;
  const itemsHtml = o.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.name}</td><td style="text-align:right;border-bottom:1px solid #eee">x${i.qty}</td></tr>`)
    .join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Étiquette ${o.ref}</title></head>
  <body style="font-family:Arial,sans-serif;margin:24px;color:#0C0C0E">
    <div style="border:2px solid #0C0C0E;border-radius:16px;padding:22px;max-width:360px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:Georgia,serif;font-size:24px;font-weight:bold">ORYAM<span style="color:#D68D9C">.</span></div>
        <div style="font-size:11px;font-weight:bold;background:#0C0C0E;color:#fff;padding:4px 10px;border-radius:20px">${o.delivery === 'domicile' ? 'DOMICILE' : 'STOP DESK'}</div>
      </div>
      <div style="margin-top:14px;font-size:12px;color:#666">Référence colis</div>
      <div style="font-size:22px;font-weight:bold;letter-spacing:1px">${o.ref}</div>
      <div style="font-family:monospace;font-size:30px;letter-spacing:6px;margin-top:4px">||||| |||| |||||</div>
      <hr style="border:none;border-top:1px dashed #bbb;margin:16px 0">
      <div style="font-size:13px;line-height:1.7">
        <strong>${o.name}</strong><br>
        Tél : <strong>${o.phone}</strong><br>
        ${o.commune}, ${o.wilayaName} (${String(o.wilayaCode).padStart(2, '0')})<br>
        ${o.address ?? 'Point relais à définir avec le client'}
      </div>
      <hr style="border:none;border-top:1px dashed #bbb;margin:16px 0">
      <table style="width:100%;font-size:12px">${itemsHtml}</table>
      <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:13px">
        <span>Livraison</span><strong>${o.shipping} DA</strong>
      </div>
      <div style="margin-top:10px;background:#0C0C0E;color:#fff;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px">À ENCAISSER (COD)</span>
        <span style="font-size:20px;font-weight:bold">${o.total} DA</span>
      </div>
      <p style="font-size:10px;color:#999;margin-top:14px;text-align:center">Colis fragile · Produits cosmétiques · Merci d'appeler le client avant livraison</p>
    </div>
    <script>window.onload = () => window.print();</script>
  </body></html>`);
  w.document.close();
}

function OrderActions({ order, compact = false }: { order: Order; compact?: boolean }) {
  const { setOrderStatus, shipOrder } = useData();
  const { showToast } = useStore();
  const [shipping, setShipping] = useState(false);
  const flowIndex = ORDER_FLOW.indexOf(order.status);
  const next = flowIndex >= 0 && flowIndex < ORDER_FLOW.length - 1 ? ORDER_FLOW[flowIndex + 1] : null;

  const ship = async () => {
    setShipping(true);
    await shipOrder(order);
    setShipping(false);
    showToast('Colis synchronisé avec Yalidine — expédié');
  };

  const btn = 'flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:border-ink hover:text-ink active:scale-90';

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'justify-end'}`}>
      <a href={`tel:${order.phone}`} title="Appeler la cliente" className={btn}>
        <Phone size={14} />
      </a>
      <button onClick={() => printLabel(order)} title="Imprimer l’étiquette" className={btn}>
        <Printer size={14} />
      </button>
      {(order.status === 'confirmee' || order.status === 'en_attente') && (
        <button
          onClick={ship}
          disabled={shipping}
          title="Expédier via Yalidine"
          className="flex h-8 items-center gap-1.5 rounded-lg bg-violetp px-2.5 text-[11px] font-bold text-white transition hover:bg-violetp-dark active:scale-95 disabled:opacity-60"
        >
          {shipping ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
          {!compact && 'Yalidine'}
        </button>
      )}
      {next && (
        <button
          onClick={() => {
            setOrderStatus(order.id, next);
            showToast(`Commande ${order.ref} → ${ORDER_STATUS_LABELS[next]}`);
          }}
          title={`Passer à « ${ORDER_STATUS_LABELS[next]} »`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white transition hover:bg-black active:scale-90"
        >
          <Check size={14} />
        </button>
      )}
      {order.status !== 'livree' && order.status !== 'annulee' && (
        <button
          onClick={() => {
            setOrderStatus(order.id, 'annulee');
            showToast(`Commande ${order.ref} annulée`);
          }}
          title="Annuler"
          className={`${btn} hover:!border-navred hover:!text-navred`}
        >
          <Ban size={14} />
        </button>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const { orders, setOrderStatus, getProduct } = useData();
  const { showToast } = useStore();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'tous'>('tous');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          o.ref.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.commune.toLowerCase().includes(q);
        const matchS = statusFilter === 'tous' || o.status === statusFilter;
        return matchQ && matchS;
      }),
    [orders, query, statusFilter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { tous: orders.length };
    (['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'] as OrderStatus[]).forEach((s) => {
      map[s] = orders.filter((o) => o.status === s).length;
    });
    return map;
  }, [orders]);

  const onDropTo = (status: OrderStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setOrderStatus(id, status);
      showToast(`Statut mis à jour → ${ORDER_STATUS_LABELS[status]}`);
    }
  };

  const filters: (OrderStatus | 'tous')[] = ['tous', 'en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];

  const exportCsv = () => {
    if (filtered.length === 0) {
      showToast('Aucune commande à exporter');
      return;
    }
    downloadCsv(
      `commandes-oryam-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((o) => ({
        Référence: o.ref,
        Date: new Date(o.createdAt).toLocaleString('fr-FR'),
        Statut: ORDER_STATUS_LABELS[o.status],
        Client: o.name,
        Téléphone: o.phone,
        Wilaya: o.wilayaName,
        Commune: o.commune,
        Livraison: o.delivery === 'domicile' ? 'À domicile' : 'Stop desk',
        Articles: o.items.map((i) => `${i.qty}x ${i.name}`).join(' | '),
        'Sous-total': o.subtotal,
        Livraison_DA: o.shipping,
        Remise: o.discount,
        Total: o.total,
        'Code promo': o.promoCode ?? '',
        Suivi: o.tracking ?? '',
      })),
    );
    showToast(`${filtered.length} commande(s) exportée(s)`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
            Centre de traitement
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Commandes
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            {counts.en_attente} en attente · {counts.expediee} en cours de livraison
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-[13px] font-bold text-ink transition hover:bg-cream"
          >
            <Download size={15} />
            Exporter CSV
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-blush px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
          >
            <Plus size={15} />
            Créer une commande
          </button>
          <div className="flex rounded-full border border-neutral-200 bg-white p-1">
            {(
              [
                { v: 'table', icon: Table2, label: 'Table' },
                { v: 'kanban', icon: LayoutGrid, label: 'Kanban' },
            ] as const
          ).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition ${
                view === v ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : réf, cliente, téléphone, commune…"
            className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition ${
                statusFilter === f
                  ? 'bg-ink text-white'
                  : 'border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
              }`}
            >
              {f === 'tous' ? 'Toutes' : ORDER_STATUS_LABELS[f]} · {counts[f]}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="space-y-3">
          {filtered.map((o) => {
            const open = expanded === o.id;
            return (
              <div
                key={o.id}
                className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_2px_18px_rgba(12,12,14,0.05)]"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <button
                    onClick={() => setExpanded(open ? null : o.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-neutral-500 transition hover:bg-neutral-100"
                    aria-label="Détails"
                  >
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className="min-w-[120px]">
                    <p className="text-[13px] font-extrabold">{o.ref}</p>
                    <p className="text-[10.5px] text-neutral-400">{fmtDate(o.createdAt)}</p>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <p className="truncate text-[13px] font-semibold">{o.name}</p>
                    <p className="text-[10.5px] text-neutral-400">{o.phone}</p>
                  </div>
                  <div className="hidden min-w-[150px] md:block">
                    <p className="flex items-center gap-1 text-[12px] font-medium text-neutral-600">
                      <MapPin size={12} className="text-blush" />
                      {o.commune}, {o.wilayaName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-neutral-400">
                      {o.delivery === 'domicile' ? <Home size={11} /> : <Store size={11} />}
                      {o.delivery === 'domicile' ? 'À domicile' : 'Point relais'}
                    </p>
                  </div>
                  <div className="min-w-[110px]">
                    <p className="text-[13.5px] font-extrabold">{formatDA(o.total)}</p>
                    <p className="text-[10.5px] text-neutral-400">
                      dont {formatDA(o.shipping)} livraison
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${STATUS_COLORS[o.status]}`}
                  >
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                  <OrderActions order={o} />
                </div>

                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-black/5 bg-cream/50 px-5 py-4"
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Articles commandés
                        </p>
                        <div className="mt-2 space-y-2">
                          {o.items.map((i) => (
                            <div key={i.productId} className="flex items-center gap-3">
                              <img
                                src={i.image || getProduct(i.productId)?.images[0] || '/img/serum-1.png'}
                                alt=""
                                className="h-10 w-10 rounded-lg bg-white object-cover"
                              />
                              <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                                {i.name}
                              </p>
                              <p className="text-[12px] text-neutral-500">
                                {i.qty} × {formatDA(i.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1 border-t border-black/8 pt-3 text-[12px] text-neutral-500">
                          <p className="flex justify-between">
                            Sous-total <span>{formatDA(o.subtotal)}</span>
                          </p>
                          {o.discount > 0 && (
                            <p className="flex justify-between text-stockgreen">
                              Réduction{o.promoCode ? ` (${o.promoCode})` : ''}
                              <span>-{formatDA(o.discount)}</span>
                            </p>
                          )}
                          <p className="flex justify-between">
                            Livraison <span>{formatDA(o.shipping)}</span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Livraison
                        </p>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
                          {o.address ? `${o.address}, ` : ''}
                          {o.commune}, {o.wilayaName} — wilaya {String(o.wilayaCode).padStart(2, '0')}
                        </p>
                        {o.promoCode && (
                          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-stockgreen">
                            <TicketPercent size={13} /> Code {o.promoCode} utilisé
                          </p>
                        )}
                        {o.tracking && (
                          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-violetp-dark">
                            <Truck size={13} /> Tracking Yalidine : {o.tracking}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-neutral-200 bg-white p-10 text-center text-[13px] text-neutral-400">
              Aucune commande ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(['en_attente', 'confirmee', 'expediee', 'livree'] as OrderStatus[]).map((status) => {
            const cols = filtered.filter((o) => o.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropTo(status)}
                className="w-[270px] shrink-0 rounded-[20px] border border-black/[0.06] bg-white/60 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1.5">
                  <span
                    className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${STATUS_COLORS[status]}`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400">{cols.length}</span>
                </div>
                <div className="space-y-2.5">
                  {cols.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', o.id)}
                      className="cursor-grab rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[12.5px] font-extrabold">{o.ref}</p>
                        <p className="text-[10px] text-neutral-400">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-[12px] font-semibold">{o.name}</p>
                      <p className="text-[10.5px] text-neutral-400">
                        {o.commune}, {o.wilayaName}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[13px] font-extrabold text-blush">{formatDA(o.total)}</p>
                        <OrderActions order={o} compact />
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-6 text-center text-[11px] font-medium text-neutral-300">
                      Glisser une commande ici
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {createOpen && <ManualOrderModal onClose={() => setCreateOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
