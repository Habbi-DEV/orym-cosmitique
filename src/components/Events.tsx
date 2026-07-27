import { motion } from 'framer-motion';
import { CalendarCheck, ScanFace, Truck, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { scrollToId } from '../lib/format';

export default function Events() {
  const { showToast } = useStore();

  const events = [
    {
      icon: CalendarCheck,
      chip: 'bg-blush-soft text-[#8E4254]',
      date: 'Samedi 22 Juin · 15h00',
      title: 'Masterclass « Le Rituel Éclat »',
      desc: 'Une session en présentiel à Alger Hydra avec notre facialiste : diagnostic de peau, gestes d’application et routine personnalisée offerte.',
      cta: 'Réserver ma place',
      action: () => showToast('Votre place a été réservée — à très vite'),
    },
    {
      icon: ScanFace,
      chip: 'bg-violetp-soft text-violetp-dark',
      date: 'Tous les vendredis · En ligne',
      title: 'Diagnostic de Peau Gratuit',
      desc: 'Répondez à 8 questions et recevez votre routine Oryam sur-mesure, établie par nos expertes en 24h.',
      cta: 'Faire mon diagnostic',
      action: () => showToast('Lien du diagnostic envoyé — vérifiez vos messages'),
    },
    {
      icon: Truck,
      chip: 'bg-stock-soft text-stockgreen',
      date: 'Ce week-end uniquement',
      title: 'Livraison Gratuite 58 Wilayas',
      desc: 'Pour tout achat ce week-end, la livraison à domicile vous est offerte, sans minimum de commande.',
      cta: 'J’en profite',
      action: () => scrollToId('promos'),
    },
  ];

  return (
    <section id="evenements" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Agenda Oryam</p>
        <h2 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Nos <span className="italic text-blush">Événements</span>
        </h2>
        <p className="mt-2 max-w-md text-[13.5px] text-neutral-500">
          Ateliers, diagnostics et offres exceptionnelles — restez proche de la maison Oryam.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {events.map((ev, i) => (
          <motion.div
            key={ev.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex flex-col rounded-[25px] border border-black/[0.06] bg-white p-6 shadow-[0_2px_18px_rgba(12,12,14,0.05)] transition-shadow hover:shadow-[0_10px_36px_rgba(12,12,14,0.10)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${ev.chip}`}>
                <ev.icon size={19} />
              </span>
              <span className="rounded-full bg-cream px-3 py-1.5 text-[10px] font-bold tracking-wide text-neutral-500">
                {ev.date}
              </span>
            </div>
            <h3 className="mt-4 font-serif text-[20px] font-semibold leading-snug">{ev.title}</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-500">{ev.desc}</p>
            <button
              onClick={ev.action}
              className="group mt-5 inline-flex w-fit items-center gap-1.5 text-[13px] font-bold text-ink transition hover:text-blush"
            >
              {ev.cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
