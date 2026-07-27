import Header from '../components/Header';
import Hero from '../components/Hero';
import CategoryCards from '../components/CategoryCards';
import { ProductsSection, PromosSection, PacksSection } from '../components/HomeSections';
import Events from '../components/Events';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <CategoryCards />
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
