import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { useLang } from '../context/LanguageContext';
import { useSEO } from '../lib/seo';
import type { TranslationKey } from '../lib/translations';

interface LegalPageProps {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  path: string;
}

/** Rendu générique pour les 3 pages légales — le contenu (bilingue FR/AR)
 * vient de src/lib/translations.ts (section `legal`), un paragraphe par
 * bloc séparé par une ligne vide. */
export default function LegalPage({ titleKey, bodyKey, path }: LegalPageProps) {
  const { t } = useLang();
  const title = t(titleKey);
  const body = t(bodyKey);
  const paragraphs = body.split('\n\n');

  useSEO(
    {
      title,
      description: paragraphs[0]?.slice(0, 155) ?? title,
      path,
    },
    [title, path],
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
          ORYAM Cosmetics
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-[12px] text-neutral-400">
          {t('legal.majLabel')}
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
        </p>

        <div className="mt-8 space-y-4 text-[14.5px] leading-relaxed text-neutral-600">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <Link
          to="/"
          className="mt-10 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          {t('legal.retourAccueil')}
        </Link>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
