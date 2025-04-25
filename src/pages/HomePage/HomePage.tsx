import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.roles?.includes("Admin")) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  if (isLoading || (isAuthenticated && user?.roles?.includes("Admin"))) {
    return <div>Cargando...</div>;
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>¡Bienvenido a BakeryHub!</h1>
          <p className={styles.heroSubtitle}>
            La plataforma ideal para gestionar tu pastelería o repostería
            online. Administra productos, pedidos y clientes fácilmente.
          </p>
          <div className={styles.heroActions}>
            <Link to="/login">
              <button className={`${styles.button} ${styles.buttonPrimary}`}>
                Iniciar Sesión
              </button>
            </Link>
            <Link to="/register-admin">
              <button className={`${styles.button} ${styles.buttonSecondary}`}>
                Registra tu Negocio
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <h2>Características Principales</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3>Gestión de Productos</h3>
            <p>Añade, edita y organiza tus pasteles y postres fácilmente.</p>
          </div>

          <div className={styles.featureCard}>
            <h3>Administración de Pedidos</h3>
            <p>
              Recibe y gestiona los pedidos de tus clientes en un solo lugar.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h3>Tu Propia Tienda Online</h3>
            <p>
              Ofrece tus productos en una página web personalizada para tu
              negocio.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
