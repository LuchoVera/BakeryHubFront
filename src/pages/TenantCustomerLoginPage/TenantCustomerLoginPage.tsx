import React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import LoginForm from "../../components/LoginForm/LoginForm";
import { useAuth } from "../../AuthContext";
import { useTenant } from "../../hooks/useTenant";
import styles from "./TenantCustomerLoginPage.module.css";

const TenantCustomerLoginPage: React.FC = () => {
  const { subdomain } = useTenant();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || "/";
    return <Navigate to={from === "/login" ? "/" : from} replace />;
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/" className={styles.backLink}>
        {"< Volver a la Tienda"}
      </Link>
      <h1 className={styles.pageTitle}>Iniciar Sesión</h1>
      <LoginForm subdomainContext={subdomain} />
      <p className={styles.signUpLink}>
        ¿No tienes cuenta? <Link to="/signup">Regístrate</Link>
      </p>
    </div>
  );
};

export default TenantCustomerLoginPage;
