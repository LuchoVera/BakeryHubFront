import React from "react";
import { useAuth } from "../AuthContext";
import { Link, Navigate, useNavigate } from "react-router-dom";
import TenantCustomerSignUpForm from "../components/TenantCustomerSignUpForm/TenantCustomerSignUpForm";

interface TenantCustomerSignUpPageProps {
  subdomain: string;
}

const TenantCustomerSignUpPage: React.FC<TenantCustomerSignUpPageProps> = ({
  subdomain,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    console.log("User already authenticated, redirecting from sign up page.");
    return <Navigate to="/" replace />;
  }

  const handleSuccess = (userId: string) => {
    console.log(`Sign up successful for user ${userId}, navigating to login.`);
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <Link to="/">{"< Back to Bakery"}</Link>
      <TenantCustomerSignUpForm
        subdomain={subdomain}
        onSuccess={handleSuccess}
      />
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default TenantCustomerSignUpPage;
