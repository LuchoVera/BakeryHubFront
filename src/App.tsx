import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import AdminLayout from './pages/admin/AdminLayout'; 
import AdminDashboardPage from './pages/admin/AdminDashboardPage'; 
import CategoryListPage from './pages/admin/CategoryListPage'; 
import { useAuth } from './AuthContext';
import './App.css';
import ProductListPage from './pages/admin/ProductListPage';
import AddProductPage from './pages/admin/AddProductPage';
import EditProductPage from './pages/admin/EditProductPage';

const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading Session...</div>; 
  }

  const isAdmin = isAuthenticated && (user?.roles?.includes('Admin') ?? false);

  if (!isAdmin) {
    console.warn("[ProtectedAdminRoute] Access denied. Redirecting to login.");
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  return <Outlet />;
};


function App() {
  const { isLoading } = useAuth(); 

  const host = window.location.hostname;
  const parts = host.split('.');
  const subdomain = (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') ? parts[0] : null;

  if (isLoading) {
    return <div>Loading Session...</div>;
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
          </>
        )}

        {subdomain && (
          <>
            <Route path="/" element={<div><h1>Welcome to {subdomain}'s Bakery! (Tenant View)</h1></div>} />
           
             <Route path="*" element={<div>404 - Tenant Page Not Found</div>} />
          </>
        )}

      </Routes>
    </Router>
  );
}

const RedirectingPage: React.FC = () => { return <div>Redirecting...</div>; }

export default App;