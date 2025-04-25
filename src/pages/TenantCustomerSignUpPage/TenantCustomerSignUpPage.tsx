import React from "react";
import { useAuth } from "../../AuthContext";
import { Link, Navigate } from "react-router-dom";
import TenantCustomerSignUpForm from "../../components/TenantCustomerSignUpForm/TenantCustomerSignUpForm";
import styles from "./TenantCustomerSignUpPage.module.css";

interface TenantCustomerSignUpPageProps {
  subdomain: string;

  tenantName?: string;
}

const TenantCustomerSignUpPage: React.FC<TenantCustomerSignUpPageProps> = ({
  subdomain,
  tenantName,
}) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/" className={styles.backLink}>
        {"< Volver a la Tienda"}
      </Link>
      <TenantCustomerSignUpForm subdomain={subdomain} tenantName={tenantName} />
    </div>
  );
};

export default TenantCustomerSignUpPage;
