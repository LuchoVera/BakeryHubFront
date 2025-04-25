import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";

interface TenantHeaderProps {
  tenantName: string;
  subdomain: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({
  tenantName 
}) => {
  const { isAuthenticated, user, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Search submitted:", searchTerm);
  };

  return (
    <form onSubmit={handleSearchSubmit} className={styles.headerForm}>
      <header className={styles.header}>
        <div className={styles.tenantInfo}>
          <Link to="/" className={styles.tenantLink}>
            <h1 className={styles.tenantName}>{tenantName}</h1>
          </Link>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>

        <nav className={styles.actions}>
          {isAuthenticated ? (
            <>
              <span className={styles.userName}>Hi, {user?.name}!</span>
              <button onClick={logout} className={styles.button}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.button}>
                Login
              </Link>
              <Link to="/signup" className={styles.button}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>
    </form>
  );
};

export default TenantHeader;
