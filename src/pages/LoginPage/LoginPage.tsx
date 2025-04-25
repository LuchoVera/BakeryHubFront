import React from "react";
import LoginForm from "../../components/LoginForm/LoginForm";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import styles from "./LoginPage.module.css";

const LoginPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const isAdmin = user?.roles?.includes("Admin");
    const from =
      (location.state as { from?: Location })?.from?.pathname ||
      (isAdmin ? "/admin" : "/");
    const redirectTo = isAdmin
      ? from.startsWith("/admin")
        ? from
        : "/admin"
      : "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/">{"< Regresar"}</Link>

      <h1 className={styles.pageTitle}>Inicia Sesión en BakeryHub</h1>
      <LoginForm />
      <p className={styles.registerLink}>
        ¿Quieres registrar tu negocio?{" "}
        <Link to="/register-admin">Regístrate Aquí</Link>
      </p>
    </div>
  );
};

export default LoginPage;
