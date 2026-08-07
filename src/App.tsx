import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { StoreProvider } from './context/StoreContext';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import WishlistPage from './pages/WishlistPage';
import ConfirmationPage from './pages/ConfirmationPage';
import TrackOrderPage from './pages/TrackOrderPage';
import CategoriesPage from './pages/CategoriesPage';
import LoyaltyPage from './pages/LoyaltyPage';
import LandingPage from './pages/LandingPage';
import CheckoutModal from './components/CheckoutModal';
import Toast from './components/Toast';
import FloatingContact from './components/FloatingContact';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminPromos from './admin/AdminPromos';
import AdminReviews from './admin/AdminReviews';
import AdminCustomers from './admin/AdminCustomers';
import AdminAuditLog from './admin/AdminAuditLog';
import AdminInventory from './admin/AdminInventory';
import AdminAbandonedCarts from './admin/AdminAbandonedCarts';
import AdminSettings from './admin/AdminSettings';
import { track } from './lib/meta';

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        document.getElementById(state.scrollTo!)?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
    track('PageView', { path: location.pathname });
  }, [location]);
  return null;
}

function FloatingContactGate() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null; // rien côté administration
  // Sur les landing pages (/lp/*), on garde uniquement l'assistant, pas WhatsApp
  const showWhatsApp = !location.pathname.startsWith('/lp/');
  return <FloatingContact showWhatsApp={showWhatsApp} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <StoreProvider>
          <BrowserRouter>
            <ScrollManager />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/produit/:id" element={<ProductPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              <Route path="/suivi" element={<TrackOrderPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:slug" element={<CategoriesPage />} />
              <Route path="/parrainage" element={<LoyaltyPage />} />
              <Route path="/lp/:id" element={<LandingPage />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="commandes" element={<AdminOrders />} />
                <Route path="clients" element={<AdminCustomers />} />
                <Route path="produits" element={<AdminProducts />} />
                <Route path="promotions" element={<AdminPromos />} />
                <Route path="avis" element={<AdminReviews />} />
                <Route path="journal" element={<AdminAuditLog />} />
                <Route path="inventaire" element={<AdminInventory />} />
                <Route path="paniers-abandonnes" element={<AdminAbandonedCarts />} />
                <Route path="parametres" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<HomePage />} />
            </Routes>
            <CheckoutModal />
            <Toast />
            <FloatingContactGate />
          </BrowserRouter>
        </StoreProvider>
      </DataProvider>
    </LanguageProvider>
  );
}
