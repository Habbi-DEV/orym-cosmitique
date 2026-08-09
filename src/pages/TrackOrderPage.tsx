import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PackageSearch, CheckCircle2, Circle, XCircle, Truck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLang } from '../context/LanguageContext';
import { ORDER_FLOW, type OrderStatus } from '../lib/types';
import { formatDA } from '../lib/format';

interface TrackedItem {
  name: string;
  price: number;
  qty: number;
}

interface TrackedOrder {
  ref: string;
  status: OrderStatus;
  created_at: string;
  wilaya_name: string;
  commune: string;
  delivery_type: 'domicile' | 'stopdesk';
  yalidine_tracking: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  items: TrackedItem[];
}

const normalizeRef = (raw: string) => {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return '';
  return trimmed.startsWith('ORY-') ? trimmed : `ORY-${trimmed.replace(/^ORY-?/, '')}`;
};

export default function TrackOrderPage() {
  const [params] = useSearchParams();
  const { t } = useLang();
  const [refInput, setRefInput] = useState(params.get('ref') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (ref: string) => {
    const cleanRef = normalizeRef(ref);
    if (!cleanRef) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);

    if (!supabase || !isSupabaseConfigured) {
      setError(t('trackOrder.indisponible'));
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('get_order_by_ref', { p_ref: cleanRef });

    if (rpcError) {
      console.warn('[supabase] get_order_by_ref', rpcError.message);
      setError(t('trackOrder.erreurGenerique'));
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setError(`${t('trackOrder.aucuneCommandePre')} ${cleanRef} ${t('trackOrder.aucuneCommandePost')}`);
      } else {
        setOrder(row as TrackedOrder);
      }
    }
    setLoading(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runSearch(refInput);
  };

  const isCancelled = order?.status === 'annulee';
  const currentStep = order ? ORDER_FLOW.indexOf(order.status) : -1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
            {t('trackOrder.eyebrow')}
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('trackOrder.titlePre')} <span className="italic text-blush">{t('trackOrder.titlePost')}</span> ?
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">{t('trackOrder.sub')}</p>
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <PackageSearch size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="ORY-482913"
              className="w-full rounded-full border border-black/10 bg-white py-3 pl-10 pr-4 text-sm font-medium tracking-wide text-ink outline-none transition focus:border-blush"
              autoCapitalize="characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !refInput.trim()}
            className="flex h-[46px] items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-40"
          >
            <Search size={15} />
            <span className="hidden sm:inline">{t('trackOrder.suivre')}</span>
          </button>
        </form>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 text-center text-sm text-neutral-400"
            >
              {t('trackOrder.recherche')}
            </motion.div>
          )}

          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-start gap-3 rounded-2xl border border-navred/20 bg-navred/5 p-4 text-[13px] leading-relaxed text-navred"
            >
              <XCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {!loading && order && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/8 bg-cream/60 px-5 py-4">
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">{order.ref}</p>
                  <p className="text-[12px] text-neutral-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${
                    isCancelled
                      ? 'bg-navred/10 text-navred'
                      : 'bg-stock-soft text-stockgreen'
                  }`}
                >
                  {t(`orderStatus.${order.status}` as const)}
                </span>
              </div>

              <div className="px-5 py-6">
                {isCancelled ? (
                  <div className="flex items-center gap-2.5 text-sm text-navred">
                    <XCircle size={18} />
                    {t('trackOrder.annulee')}
                  </div>
                ) : (
                  <ol className="flex items-center justify-between">
                    {ORDER_FLOW.map((step, i) => {
                      const done = i <= currentStep;
                      const isLast = i === ORDER_FLOW.length - 1;
                      return (
                        <li key={step} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center gap-1.5">
                            {done ? (
                              <CheckCircle2 size={20} className="text-stockgreen" />
                            ) : (
                              <Circle size={20} className="text-neutral-300" />
                            )}
                            <span
                              className={`text-center text-[10.5px] font-semibold leading-tight ${
                                done ? 'text-ink' : 'text-neutral-400'
                              }`}
                            >
                              {t(`orderStatus.${step}` as const)}
                            </span>
                          </div>
                          {!isLast && (
                            <div
                              className={`mx-1.5 mb-4 h-[2px] flex-1 rounded ${
                                i < currentStep ? 'bg-stockgreen' : 'bg-neutral-200'
                              }`}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}

                {order.yalidine_tracking && (
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-tagblue/10 px-4 py-3 text-[13px] font-medium text-tagblue">
                    <Truck size={16} />
                    {t('trackOrder.numeroSuivi')} {order.yalidine_tracking}
                  </div>
                )}

                <div className="mt-6 space-y-2 border-t border-black/8 pt-5">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[13px] text-neutral-600">
                      <span>
                        {it.qty} × {it.name}
                      </span>
                      <span className="font-medium text-ink">{formatDA(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-black/8 pt-4 text-[13px]">
                  <div className="flex justify-between text-neutral-500">
                    <span>{t('trackOrder.livraisonLabel')}</span>
                    <span>
                      {order.delivery_type === 'domicile' ? t('checkout.domicile') : t('trackOrder.stopDesk')} —{' '}
                      {order.commune}, {order.wilaya_name}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-stockgreen">
                      <span>{t('trackOrder.remise')}</span>
                      <span>-{formatDA(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-[15px] font-bold text-ink">
                    <span>{t('trackOrder.totalAPayer')}</span>
                    <span>{formatDA(order.total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!loading && !error && !order && searched === false && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 text-center text-[12.5px] text-neutral-400"
            >
              {t('trackOrder.hint')}
            </motion.p>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
