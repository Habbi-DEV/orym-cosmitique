import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Toast() {
  const { toast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 md:bottom-28">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[13px] font-medium text-white shadow-2xl"
          >
            <CheckCircle2 size={16} className="text-stockgreen" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
