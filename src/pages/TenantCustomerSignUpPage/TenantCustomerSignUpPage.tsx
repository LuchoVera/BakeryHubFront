import React from "react";
import { useAuth } from "../../AuthContext";
import { Link, Navigate } from "react-router-dom";
import TenantCustomerSignUpForm from "../../components/TenantCustomerSignUpForm/TenantCustomerSignUpForm";
import styles from "./TenantCustomerSignUpPage.module.css";

const TenantCustomerSignUpPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/" className={styles.backLink}>
        {"< Volver a la Tienda"}
      </Link>
      <TenantCustomerSignUpForm />
    </div>
  );
};

export default TenantCustomerSignUpPage;
