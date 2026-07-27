import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Banknote, Heart } from 'lucide-react';
import { scrollToId } from '../lib/format';

const stats = [
  { icon: Truck, label: 'Livraison 58 wilayas' },
  { icon: Banknote, label: 'Paiement à la livraison' },
  { icon: Heart, label: '2 400+ clientes conquises' },
];

export default function Hero() {
  return (
    <section id="accueil" className="relative scroll-mt-20 overflow-hidden bg-ink text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blush/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-violetp/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium tracking-wide text-blush backdrop-blur">
            <Sparkles size={13} />
            Nouvelle Collection — Éclat 2025
          </span>

          <h1 className="mt-6 font-serif text-[40px] font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
            Révélez l’<span className="italic text-blush">éclat</span> naturel
            <br className="hidden sm:block" /> de votre peau
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            Des soins d’exception formulés à partir d’actifs naturels, pensés pour la beauté des
            femmes algériennes. Livrés jusqu’à votre porte, partout en Algérie.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => scrollToId('produits')}
              className="group inline-flex items-center gap-2 rounded-full bg-blush px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
            >
              Découvrir nos produits
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollToId('promos')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
            >
              <Sparkles size={15} className="text-blush" />
              Voir les promos
            </button>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-7">
            {stats.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-blush">
                  <Icon size={14} />
                </span>
                <span className="text-[12px] font-medium text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="relative hidden lg:block"
        >
          <div className="overflow-hidden rounded-[25px] border border-white/10 shadow-2xl shadow-black/60">
            <img
              src="/img/hero.png"
              alt="Collection Oryam Cosmetics"
              className="aspect-[3/4] max-h-[480px] w-full object-cover"
            />
          </div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-5 -left-6 rounded-2xl border border-white/10 bg-[#151517]/95 px-5 py-4 shadow-xl backdrop-blur"
          >
            <p className="font-serif text-lg italic text-blush">
              « Ma peau n’a jamais été aussi lumineuse »
            </p>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-white/50">
              AMINA K. — ALGER
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
