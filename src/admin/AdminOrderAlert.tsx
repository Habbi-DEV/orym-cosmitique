import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const AUTO_DISMISS_MS = 8000;

// Bannière live (Supabase Realtime) affichée dans toute la zone admin quand
// une nouvelle commande arrive — voir l'effet "Realtime" dans DataContext.tsx.
export default function AdminOrderAlert() {
  const { orderAlert, dismissOrderAlert } = useData();

  useEffect(() => {
    if (!orderAlert) return;
    const t = setTimeout(dismissOrderAlert, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [orderAlert, dismissOrderAlert]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-4 lg:left-64 lg:right-0 lg:top-5">
      <AnimatePresence>
        {orderAlert && (
          <motion.div
            key={orderAlert.id}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-white shadow-2xl ring-1 ring-white/10"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush/20 text-blush">
              <PartyPopper size={18} />
            </span>
            <Link
              to="/admin/commandes"
              onClick={dismissOrderAlert}
              className="min-w-0 flex-1"
            >
              <p className="text-[12.5px] font-bold">Nouvelle commande !</p>
              <p className="truncate text-[12px] text-white/60">
                {orderAlert.name} — {orderAlert.total.toLocaleString('fr-DZ')} DA · {orderAlert.wilayaName}
              </p>
            </Link>
            <button
              onClick={dismissOrderAlert}
              aria-label="Fermer"
              className="shrink-0 text-white/40 transition hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
