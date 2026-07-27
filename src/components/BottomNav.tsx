import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, BadgePercent, Gift, CalendarHeart } from 'lucide-react';
import { scrollToId } from '../lib/format';

const items = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'promos', label: 'Promos', icon: BadgePercent },
  { id: 'packs', label: 'Packs', icon: Gift },
  { id: 'evenements', label: 'Événements', icon: CalendarHeart },
];

export default function BottomNav() {
  const [active, setActive] = useState('accueil');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-ink pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(12,12,14,0.25)] md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[440px] md:-translate-x-1/2 md:rounded-full md:border md:border-white/10 md:pb-0">
      <div className="grid grid-cols-4">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActive(id);
                scrollToId(id);
              }}
              className="relative flex flex-col items-center gap-1 py-3"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-top-bar"
                  className="absolute top-0 h-[3px] w-10 rounded-full bg-navred"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                size={19}
                className={`transition-colors ${isActive ? 'text-navred' : 'text-white/40'}`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
