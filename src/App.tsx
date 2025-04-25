import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
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
import { useAuth } from "./AuthContext";
import "./App.css";
import TenantCustomerLoginPage from "./pages/TenantCustomerLoginPage/TenantCustomerLoginPage";
import TenantCustomerSignUpPage from "./pages/TenantCustomerSignUpPage/TenantCustomerSignUpPage";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage";

const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando la Sesión...</div>;
  }

  const isAdmin = isAuthenticated && (user?.roles?.includes("Admin") ?? false);

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        state={{ from: window.location.pathname + window.location.search }}
        replace
      />
    );
  }

  return <Outlet />;
};

function App() {
  const { isLoading } = useAuth();

  const host = window.location.hostname;
  const parts = host.split(".");
  const isLikelySubdomain =
    parts.length > 2 || (parts.length === 2 && parts[0] !== "www");
  const subdomain = isLikelySubdomain ? parts[0] : null;

  if (isLoading) {
    return <div>Cargando Aplicación...</div>;
  }

  return (
    <Router>
      <Routes>
        {!subdomain && (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-admin" element={<AdminRegistrationPage />} />
            <Route path="/redirecting" element={<RedirectingPage />} />
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="categories" element={<CategoryListPage />} />
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/new" element={<AddProductPage />} />
                <Route path="products/edit/:id" element={<EditProductPage />} />
              </Route>
            </Route>
            <Route path="*" element={<div>404 - No Encontrado</div>} />
          </>
        )}

        {subdomain && (
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
              path="*"
              element={<div>404 - Página no Encontrada en {subdomain}</div>}
            />
          </>
        )}
      </Routes>
    </Router>
  );
}

const RedirectingPage: React.FC = () => {
  return <div>Redirigiendo...</div>;
};

export default App;
