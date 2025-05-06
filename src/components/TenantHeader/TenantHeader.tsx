import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";
import { FaSearch } from "react-icons/fa";
import { LuShoppingCart } from "react-icons/lu";
import { useCart } from "../../hooks/useCart";

interface TenantHeaderProps {
  tenantName: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ tenantName }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartTotalQuantity, toggleCartOpen } = useCart();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const navigate = useNavigate();

  const shouldShowCart = !user?.roles?.includes("Admin");

  const handleLocalSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocalSearchTerm(event.target.value);
  };

  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setLocalSearchTerm("");
    }
  };

  const handleSearchSubmit = (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedTerm = localSearchTerm.trim();
    if (trimmedTerm) {
      navigate(`/search?q=${encodeURIComponent(trimmedTerm)}`);
    }
  };

  const totalCartQuantity = getCartTotalQuantity();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.tenantInfo}>
          <Link to="/" className={styles.tenantLink}>
            <h1 className={styles.tenantName}>{tenantName}</h1>
          </Link>
        </div>

        <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
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
            value={localSearchTerm}
            onChange={handleLocalSearchChange}
            className={`${styles.searchInput} ${
              isSearchVisible ? styles.visible : ""
            }`}
            aria-label="Buscar productos"
          />
        </form>

        <nav className={styles.actions}>
          {isAuthenticated ? (
            <>
              <span className={styles.userName} title={`¡Hola, ${user?.name}!`}>
                ¡Hola, {user?.name}!
              </span>

              {shouldShowCart && (
                <button
                  onClick={toggleCartOpen}
                  className={`${styles.actionButton} ${styles.cartButton}`}
                  aria-label={`Carrito de compras con ${totalCartQuantity} items`}
                  title="Ver carrito"
                >
                  <LuShoppingCart />
                  {totalCartQuantity > 0 && (
                    <span className={styles.cartBadge}>
                      {totalCartQuantity}
                    </span>
                  )}
                </button>
              )}

              <button onClick={logout} className={styles.actionButton}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              {shouldShowCart && (
                <button
                  onClick={toggleCartOpen}
                  className={`${styles.actionButton} ${styles.cartButton}`}
                  aria-label={`Carrito de compras con ${totalCartQuantity} items`}
                  title="Ver carrito"
                >
                  <LuShoppingCart />
                  {totalCartQuantity > 0 && (
                    <span className={styles.cartBadge}>
                      {totalCartQuantity}
                    </span>
                  )}
                </button>
              )}
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
