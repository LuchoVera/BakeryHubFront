import React from "react";
import LoginForm from "../../components/LoginForm/LoginForm";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const LoginPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const isAdmin = user?.roles?.includes("Admin");
    const from =
      (location.state as { from?: Location })?.from?.pathname ||
      (isAdmin ? "/admin" : "/");
    const redirectTo = isAdmin
      ? from.startsWith("/admin")
        ? from
        : "/admin"
      : "/";

    console.log(
      "User already authenticated, redirecting from main login page to:",
      redirectTo
    );
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h1>Login to BakeryHub</h1>
      <p>Use this page to manage your registered business.</p>
      <LoginForm />
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Want to list your business?{" "}
        <Link to="/register-admin">Register Here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
