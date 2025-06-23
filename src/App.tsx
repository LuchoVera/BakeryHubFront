import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
import CartPage from "./pages/CartPage/CartPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage/AdminOrdersPage";
import StoreSettingsPage from "./pages/admin/StoreSettingsPage/StoreSettingsPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage/AdminOrderDetailPage";
import MyOrdersPage from "./pages/MyOrdersPage/MyOrdersPage";
import CustomerOrderDetailPage from "./pages/CustomerOrderDetailPage/CustomerOrderDetailPage";
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import AdminTagsPage from "./pages/admin/AdminTagsPage/AdminTagsPage";
import AdminCreateManualOrderPage from "./pages/admin/AdminCreateManualOrderPage/AdminCreateManualOrderPage";
import { useAuth } from "./AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { usePrevious } from "./hooks/usePrevious";

const AuthRedirectHandler = () => {
  const { isAuthenticated } = useAuth();
  const prevIsAuthenticated = usePrevious(isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (prevIsAuthenticated && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, prevIsAuthenticated, navigate]);

  return null;
};

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

const TenantRoutes = () => {
  const host = window.location.hostname;
  let subdomain: string | null = null;
  const parts = host.split(".");
  if (parts.length > 1 && parts[0] !== "www") {
    subdomain = parts[0];
  }

  if (!subdomain) {
    return <Navigate to="/" replace />;
  }

  return (
    <TenantProvider subdomain={subdomain}>
      <Routes>
        <Route path="/" element={<TenantViewPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/login" element={<TenantCustomerLoginPage />} />
        <Route path="/signup" element={<TenantCustomerSignUpPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route
          path="/my-orders/:orderId"
          element={<CustomerOrderDetailPage />}
        />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="*"
          element={<div>404 - Página no Encontrada en esta tienda</div>}
        />
      </Routes>
    </TenantProvider>
  );
};

function App() {
  const host = window.location.hostname;
  const isSubdomain =
    host.split(".").length > 1 &&
    host.split(".")[0] !== "www" &&
    host.split(".")[0] !== "localhost";

  const isDevSubdomain =
    host.endsWith(".localhost") && host.split(".").length > 1;

  if (isSubdomain || isDevSubdomain) {
    return (
      <CartProvider>
        <NotificationProvider>
          <Router>
            <AuthRedirectHandler />
            <TenantRoutes />
            <NotificationPopup />
          </Router>
        </NotificationProvider>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <NotificationProvider>
        <Router>
          <AuthRedirectHandler />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-admin" element={<AdminRegistrationPage />} />
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="categories" element={<CategoryListPage />} />
                <Route path="tags" element={<AdminTagsPage />} />
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/new" element={<AddProductPage />} />
                <Route path="products/edit/:id" element={<EditProductPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route
                  path="orders/:orderId"
                  element={<AdminOrderDetailPage />}
                />
                <Route
                  path="orders/new-manual"
                  element={<AdminCreateManualOrderPage />}
                />
                <Route path="settings" element={<StoreSettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<div>404 - Página No Encontrada</div>} />
          </Routes>
          <NotificationPopup />
        </Router>
      </NotificationProvider>
    </CartProvider>
  );
}

export default App;
