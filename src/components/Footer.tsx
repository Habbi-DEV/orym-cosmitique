import { Link } from 'react-router-dom';
import { Instagram, MapPin, Banknote, PackageSearch, LayoutGrid, Gift } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLang();
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
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-[13px] text-white/70">
            <span className="flex items-center gap-2.5">
              <Banknote size={15} className="shrink-0 text-blush" />
              {t('footer.paiement')}
            </span>
            <span className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0 text-blush" />
              {t('footer.livraison')}
            </span>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 transition hover:text-blush"
            >
              <Instagram size={15} className="shrink-0 text-blush" />
              {t('footer.instagram')}
            </a>
            <Link to="/suivi" className="flex items-center gap-2.5 transition hover:text-blush">
              <PackageSearch size={15} className="shrink-0 text-blush" />
              {t('footer.suivreCommande')}
            </Link>
            <Link to="/categories" className="flex items-center gap-2.5 transition hover:text-blush">
              <LayoutGrid size={15} className="shrink-0 text-blush" />
              {t('footer.toutesCategories')}
            </Link>
            <Link to="/parrainage" className="flex items-center gap-2.5 transition hover:text-blush">
              <Gift size={15} className="shrink-0 text-blush" />
              {t('footer.parrainage')}
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-[11.5px] text-white/40">
          <Link to="/confidentialite" className="transition hover:text-blush">
            {t('footer.confidentialite')}
          </Link>
          <Link to="/conditions-generales" className="transition hover:text-blush">
            {t('footer.conditions')}
          </Link>
          <Link to="/politique-retour" className="transition hover:text-blush">
            {t('footer.politiqueRetour')}
          </Link>
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-[11.5px] text-white/35 sm:flex-row sm:items-center">
          <span>© 2025 Oryam Cosmetics — {t('footer.rights')}</span>
          <span>{t('footer.concu')}</span>
        </div>
      </div>
    </footer>
  );
}
