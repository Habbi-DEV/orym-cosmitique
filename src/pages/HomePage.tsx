import Hero from '../components/Hero';
import { ProductsSection, PromosSection, PacksSection } from '../components/HomeSections';
import Events from '../components/Events';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
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
