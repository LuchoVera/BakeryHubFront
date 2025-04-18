import React from "react";
import { Link } from "react-router-dom";
import styles from "./TenantHeader.module.css";
import { useAuth } from "../../AuthContext";

interface TenantHeaderProps {
  tenantName: string;
  subdomain: string;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ tenantName }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.tenantInfo}>
        <h1 className={styles.tenantName}>{tenantName}</h1>
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
  );
};

export default TenantHeader;
