import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";

interface TenantHeaderProps {
  tenantName: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ tenantName }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Búsqueda enviada:", searchTerm);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.tenantInfo}>
          <Link to="/" className={styles.tenantLink}>
            <h1 className={styles.tenantName}>{tenantName}</h1>
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </form>

        <nav className={styles.actions}>
          {isAuthenticated ? (
            <>
              <span className={styles.userName} title={`¡Hola, ${user?.name}!`}>
                ¡Hola, {user?.name}!
              </span>
              <button onClick={logout} className={styles.actionButton}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.actionLink}>
                Iniciar Sesión
              </Link>
              <Link to="/signup" className={styles.actionLink}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default TenantHeader;
