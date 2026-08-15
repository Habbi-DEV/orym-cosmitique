import Hero from '../components/Hero';
import { ProductsSection, PromosSection, PacksSection } from '../components/HomeSections';
import Events from '../components/Events';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { useSEO, siteUrl } from '../lib/seo';

export default function HomePage() {
  useSEO(
    {
      title: 'ORYAM Cosmetics — Soins & Beauté en Algérie',
      description:
        'Sérums, crèmes, huiles et soins naturels. Livraison vers les 58 wilayas en 24-72h, paiement à la réception.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ORYAM Cosmetics',
        url: siteUrl(),
        sameAs: ['https://www.instagram.com'],
      },
    },
    [],
  );

  return (
    <div className="min-h-screen">
      <main>
        {/* Header sticky classique retiré ici : le logo + les icônes
            wishlist/panier sont maintenant superposés sur le hero
            lui-même (voir Hero.tsx). Les autres pages conservent le
            Header habituel. */}
        <Hero />
        <ProductsSection />
        <PromosSection />
        <PacksSection />
        <Events />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
