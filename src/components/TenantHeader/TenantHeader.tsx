import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";
import { FaSearch } from "react-icons/fa";
import { LuShoppingCart } from "react-icons/lu";
import { PiUserCircle, PiReceiptLight } from "react-icons/pi";
import { useCart } from "../../hooks/useCart";

interface TenantHeaderProps {
  tenantName: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ tenantName }) => {
  const { isAuthenticated, user } = useAuth();
  const { getCartTotalQuantity } = useCart();
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

  const handleCartClick = () => {
    navigate("/cart");
  };

  const handleUserIconClick = () => {
    navigate("/user-profile");
  };

  const handleMyOrdersClick = () => {
    navigate("/my-orders");
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
              <button
                onClick={handleUserIconClick}
                className={`${styles.actionButton} ${styles.iconButton} ${styles.userProfileButton}`}
                title={user?.name ? `Ver perfil de ${user.name}` : "Ver perfil"}
                aria-label="Ver perfil de usuario"
              >
                <PiUserCircle />
              </button>

              <button
                onClick={handleMyOrdersClick}
                className={`${styles.actionButton} ${styles.myOrdersButton}`}
                title="Mis pedidos"
                aria-label="Ver mis pedidos"
              >
                <PiReceiptLight className={styles.buttonIcon} />{" "}
                <span>Mis Pedidos</span>
              </button>

              {shouldShowCart && (
                <button
                  onClick={handleCartClick}
                  className={`${styles.actionButton} ${styles.iconButton} ${styles.cartButton}`}
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
            </>
          ) : (
            <>
              {shouldShowCart && (
                <button
                  onClick={handleCartClick}
                  className={`${styles.actionButton} ${styles.iconButton} ${styles.cartButton}`}
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
