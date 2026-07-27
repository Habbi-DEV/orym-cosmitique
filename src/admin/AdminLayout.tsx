import { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  BadgePercent,
  Warehouse,
  ShoppingCart,
  Settings,
  Globe,
  LogOut,
  Loader2,
  Menu,
  X,
  Lock,
  MessageSquareText,
  Users,
  History,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ROLE_LABELS, type AdminRole } from '../lib/types';
import AdminOrderAlert from './AdminOrderAlert';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: AdminRole[];
  end?: boolean;
}

export const NAV: NavItem[] = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['super_admin', 'marketer'], end: true },
  { to: '/admin/commandes', label: 'Commandes', icon: ClipboardList, roles: ['super_admin', 'orders'] },
  { to: '/admin/clients', label: 'Clients', icon: Users, roles: ['super_admin', 'orders', 'marketer'] },
  { to: '/admin/produits', label: 'Produits', icon: Package, roles: ['super_admin'] },
  { to: '/admin/promotions', label: 'Promos & Packs', icon: BadgePercent, roles: ['super_admin', 'marketer'] },
  { to: '/admin/avis', label: 'Avis clients', icon: MessageSquareText, roles: ['super_admin', 'marketer'] },
  { to: '/admin/journal', label: "Journal d'audit", icon: History, roles: ['super_admin'] },
  { to: '/admin/inventaire', label: 'Inventaire', icon: Warehouse, roles: ['super_admin', 'warehouse'] },
  {
    to: '/admin/paniers-abandonnes',
    label: 'Paniers abandonnés',
    icon: ShoppingCart,
    roles: ['super_admin', 'marketer'],
  },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings, roles: ['super_admin'] },
];

export const homeForRole = (role: AdminRole): string =>
  NAV.find((n) => n.roles.includes(role))?.to ?? '/admin/commandes';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session, logout, orders, lowStock } = useData();
  if (!session) return null;
  const items = NAV.filter((n) => n.roles.includes(session.role));
  const pendingOrders = orders.filter((o) => o.status === 'en_attente').length;

  const badgeFor = (to: string) => {
    if (to === '/admin/commandes' && pendingOrders > 0) return pendingOrders;
    if (to === '/admin/inventaire' && lowStock.length > 0) return lowStock.length;
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-6 pb-6 pt-7">
        <p className="font-serif text-[24px] font-bold text-white">
          ORYAM<span className="text-blush">.</span>
        </p>
        <p className="mt-0.5 text-[8.5px] font-semibold tracking-[0.4em] text-white/35">
          ADMINISTRATION
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => {
          const badge = badgeFor(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="admin-nav-bar"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-blush"
                    />
                  )}
                  <Icon size={17} className={isActive ? 'text-blush' : ''} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navred px-1.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Return to storefront */}
      <div className="px-3 pb-3">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl bg-blush px-4 py-3 text-[12.5px] font-bold text-white shadow-lg shadow-blush/25 transition hover:bg-blush-dark"
        >
          <Globe size={15} />
          Retour à la boutique
        </Link>
      </div>

      {/* Session */}
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violetp/25 font-serif text-[15px] font-bold text-violetp">
          {session.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-white">{session.name}</p>
          <p className="truncate text-[10px] font-medium text-white/40">{ROLE_LABELS[session.role]}</p>
        </div>
        <button
          onClick={logout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="text-white/40 transition hover:text-navred"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function AccessDenied() {
  const { session } = useData();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush-soft text-blush">
        <Lock size={26} />
      </span>
      <h1 className="mt-5 font-serif text-3xl font-semibold">Accès restreint</h1>
      <p className="mt-2 max-w-sm text-[13.5px] text-neutral-500">
        Votre rôle actuel ({session ? ROLE_LABELS[session.role] : '—'}) ne donne pas accès à
        ce module. Contactez le Super Admin pour élargir vos permissions.
      </p>
      {session && (
        <Link
          to={homeForRole(session.role)}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-[13px] font-bold text-white transition hover:bg-black"
        >
          Revenir à mon espace
        </Link>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { session, sessionLoading } = useData();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tant que la restauration async de session n'est pas terminée (F5),
  // on affiche un écran de chargement au lieu de rediriger vers /admin/login
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink text-white">
        <p className="font-serif text-3xl font-bold">
          ORYAM<span className="text-blush">.</span>
        </p>
        <Loader2 size={26} className="mt-5 animate-spin text-blush" />
        <p className="mt-3 text-[12px] text-white/40">
          Restauration de la session sécurisée…
        </p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const current = NAV.find((n) =>
    n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to),
  );
  const allowed = current ? current.roles.includes(session.role) : true;

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminOrderAlert />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-ink lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-black/8 bg-ink px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
        >
          <Menu size={19} />
        </button>
        <p className="font-serif text-lg font-bold text-white">
          ORYAM<span className="text-blush">.</span>{' '}
          <span className="ml-1 text-[9px] font-semibold tracking-[0.3em] text-white/40">ADMIN</span>
        </p>
        <Link
          to="/"
          aria-label="Retour à la boutique"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blush text-white"
        >
          <Globe size={16} />
        </Link>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-72 bg-ink"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-10">
        {allowed ? <Outlet /> : <AccessDenied />}
      </main>
    </div>
  );
}
