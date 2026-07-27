import { motion } from 'framer-motion';
import { BadgePercent, Gift, ArrowRight } from 'lucide-react';
import { scrollToId } from '../lib/format';

const cards = [
  {
    id: 'promos',
    icon: BadgePercent,
    title: 'Promotions',
    desc: 'Jusqu’à -30% sur vos favoris',
    classes: 'from-[#D68D9C] to-[#B0647A]',
    shadow: 'shadow-blush/30',
  },
  {
    id: 'packs',
    icon: Gift,
    title: 'Packs & Rituels',
    desc: 'Des routines complètes à prix doux',
    classes: 'from-[#9D64FF] to-[#7B3FF2]',
    shadow: 'shadow-violetp/30',
  },
];

export default function CategoryCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            onClick={() => scrollToId(card.id)}
            className={`group relative flex items-center justify-between gap-4 overflow-hidden rounded-[25px] bg-gradient-to-br ${card.classes} p-6 text-left text-white shadow-xl ${card.shadow} transition active:scale-[0.99]`}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <card.icon size={22} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-serif text-[21px] font-semibold leading-tight">
                  {card.title}
                </h3>
                <p className="mt-0.5 text-[12.5px] leading-snug text-white/80">{card.desc}</p>
              </div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-ink">
              <ArrowRight size={16} />
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
