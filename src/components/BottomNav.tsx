import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BadgePercent, Gift, Truck } from 'lucide-react';
import { scrollToId } from '../lib/format';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';
import { useLang } from '../context/LanguageContext';
import type { TranslationKey } from '../lib/translations';

const items = [
  { id: 'accueil', labelKey: 'nav.accueil' as TranslationKey, icon: Home, kind: 'scroll' as const },
  { id: 'promos', labelKey: 'nav.promos' as TranslationKey, icon: BadgePercent, kind: 'scroll' as const },
  { id: 'packs', labelKey: 'nav.packs' as TranslationKey, icon: Gift, kind: 'scroll' as const },
  { id: 'suivi', labelKey: 'nav.suivi' as TranslationKey, icon: Truck, kind: 'route' as const, to: '/suivi' },
];

export default function BottomNav() {
  const [active, setActive] = useState('accueil');
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === '/';
  const keyboardOpen = useKeyboardOpen();
  const { t } = useLang();

  useEffect(() => {
    if (!onHome) {
      setActive(location.pathname.startsWith('/suivi') ? 'suivi' : '');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    items
      .filter((i) => i.kind === 'scroll')
      .forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    return () => observer.disconnect();
  }, [onHome, location.pathname]);

  // Un item "route" navigue directement (ex. /suivi) ; un item "scroll"
  // défile jusqu'à la section sur l'accueil, ou navigue vers "/" avec l'id à
  // atteindre si on est sur une autre page (ScrollManager gère ce state).
  const go = (item: (typeof items)[number]) => {
    if (item.kind === 'route') {
      setActive(item.id);
      navigate(item.to);
      return;
    }
    if (onHome) {
      setActive(item.id);
      scrollToId(item.id);
    } else {
      navigate('/', { state: { scrollTo: item.id } });
    }
  };

  // Masquée quand le clavier est ouvert : en position fixed, elle ne se
  // repositionne pas de façon fiable par rapport au viewport visuel une
  // fois le clavier affiché et se retrouve à flotter au milieu du contenu
  // (formulaire de livraison, chat…) au lieu de rester en bas de l'écran.
  if (keyboardOpen) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-ink pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(12,12,14,0.25)] md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[440px] md:-translate-x-1/2 md:rounded-full md:border md:border-white/10 md:pb-0">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => go(item)}
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
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
