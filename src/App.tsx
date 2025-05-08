import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationPopup from "./components/NotificationPopup/NotificationPopup";
import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import AdminRegistrationPage from "./pages/admin/AdminRegistrationPage/AdminRegistrationPage";
import AdminLayout from "./pages/admin/AdminLayout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage/AdminDashboardPage";
import CategoryListPage from "./pages/admin/CategoryListPage/CategoryListPage";
import ProductListPage from "./pages/admin/ProductListPage/ProductListPage";
import AddProductPage from "./pages/admin/AddProductPage/AddProductPage";
import EditProductPage from "./pages/admin/EditProductPage/EditProductPage";
import TenantViewPage from "./pages/TenantViewPage/TenantViewPage";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage";
import TenantCustomerLoginPage from "./pages/TenantCustomerLoginPage/TenantCustomerLoginPage";
import TenantCustomerSignUpPage from "./pages/TenantCustomerSignUpPage/TenantCustomerSignUpPage";
import "./App.css";
import CartPage from "./pages/CartPage/CartPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage/AdminOrdersPage";
import StoreSettingsPage from "./pages/admin/StoreSettingsPage/StoreSettingsPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage/AdminOrderDetailPage";

const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Cargando la Sesión...</div>;
  }
  const isAdmin = isAuthenticated && (user?.roles?.includes("Admin") ?? false);
  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

function App() {
  const host = window.location.hostname;
  let subdomain: string | null = null;

  if (host !== "localhost") {
    const parts = host.split(".");
    if (parts.length > 0) {
      subdomain = parts[0];
    }
  }

  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {subdomain ? (
                <>
                  <Route
                    path="/"
                    element={<TenantViewPage subdomain={subdomain} />}
                  />
                  <Route
                    path="/products/:productId"
                    element={<ProductDetailPage subdomain={subdomain} />}
                  />
                  <Route
                    path="/login"
                    element={<TenantCustomerLoginPage subdomain={subdomain} />}
                  />
                  <Route
                    path="/signup"
                    element={<TenantCustomerSignUpPage subdomain={subdomain} />}
                  />
                  <Route
                    path="/search"
                    element={<SearchResultsPage subdomain={subdomain} />}
                  />
                  <Route
                    path="/cart"
                    element={<CartPage subdomain={subdomain} />}
                  />
                  <Route
                    path="*"
                    element={
                      <div>404 - Página no Encontrada en {subdomain}</div>
                    }
                  />
                </>
              ) : (
                <>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/register-admin"
                    element={<AdminRegistrationPage />}
                  />
                  <Route path="/admin" element={<ProtectedAdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="categories" element={<CategoryListPage />} />
                      <Route path="products" element={<ProductListPage />} />
                      <Route path="products/new" element={<AddProductPage />} />
                      <Route
                        path="products/edit/:id"
                        element={<EditProductPage />}
                      />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route
                        path="orders/:orderId"
                        element={<AdminOrderDetailPage />}
                      />

                      <Route path="settings" element={<StoreSettingsPage />} />
                    </Route>
                  </Route>
                  <Route
                    path="*"
                    element={<div>404 - Página No Encontrada</div>}
                  />
                </>
              )}
            </Routes>
            <NotificationPopup />
          </Router>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
