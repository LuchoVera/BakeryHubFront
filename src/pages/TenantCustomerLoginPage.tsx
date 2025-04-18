import React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import LoginForm from "../components/LoginForm/LoginForm";
import { useAuth } from "../AuthContext";

interface TenantCustomerLoginPageProps {
  subdomain: string;
}

const TenantCustomerLoginPage: React.FC<TenantCustomerLoginPageProps> = ({
  subdomain,
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || "/";
    console.log(
      "User already authenticated, redirecting from tenant login page to:",
      from
    );
    return <Navigate to={from === "/login" ? "/" : from} replace />;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <Link to="/">{"< Back to Bakery"}</Link>
      <h1>Login</h1>
      <p>
        Log in to your account for <strong>{subdomain}</strong>.
      </p>
      <LoginForm subdomainContext={subdomain} />
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default TenantCustomerLoginPage;
