import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";
import { FaSearch } from "react-icons/fa";

interface TenantHeaderProps {
  tenantName: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ tenantName }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.tenantInfo}>
          <Link to="/" className={styles.tenantLink}>
            <h1 className={styles.tenantName}>{tenantName}</h1>
          </Link>
        </div>

        <div className={styles.searchContainer}>
          <button
            type="button"
            className={styles.searchIconButton}
            onClick={toggleSearchVisibility}
            aria-label="Mostrar/Ocultar búsqueda"
          >
            <FaSearch />
          </button>

          <input
            type="search"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${styles.searchInput} ${
              isSearchVisible ? styles.visible : ""
            }`}
          />
        </div>

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
