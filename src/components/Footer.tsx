import { Link } from 'react-router-dom';
import { Instagram, MapPin, Banknote, PackageSearch, LayoutGrid, Gift } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink pb-32 pt-14 text-white md:pb-36">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-3xl font-bold">
              ORYAM<span className="text-blush">.</span>
            </p>
            <p className="mt-1 text-[9px] font-semibold tracking-[0.42em] text-white/40">
              COSMETICS
            </p>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/50">
              La beauté algérienne, sublimée par des soins naturels d’exception.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-[13px] text-white/70">
            <span className="flex items-center gap-2.5">
              <Banknote size={15} className="shrink-0 text-blush" />
              Paiement à la livraison, partout en Algérie
            </span>
            <span className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0 text-blush" />
              Livraison vers les 58 wilayas en 24h – 72h
            </span>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 transition hover:text-blush"
            >
              <Instagram size={15} className="shrink-0 text-blush" />
              Suivez-nous sur Instagram
            </a>
            <Link to="/suivi" className="flex items-center gap-2.5 transition hover:text-blush">
              <PackageSearch size={15} className="shrink-0 text-blush" />
              Suivre ma commande
            </Link>
            <Link to="/categories" className="flex items-center gap-2.5 transition hover:text-blush">
              <LayoutGrid size={15} className="shrink-0 text-blush" />
              Toutes les catégories
            </Link>
            <Link to="/parrainage" className="flex items-center gap-2.5 transition hover:text-blush">
              <Gift size={15} className="shrink-0 text-blush" />
              Programme de parrainage
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-[11.5px] text-white/35 sm:flex-row sm:items-center">
          <span>© 2025 Oryam Cosmetics — Tous droits réservés</span>
          <span>Conçu avec passion à Alger</span>
        </div>
      </div>
    </footer>
  );
}
