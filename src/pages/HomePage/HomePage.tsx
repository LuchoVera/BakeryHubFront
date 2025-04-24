import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const HomePage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.roles?.includes("Admin")) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to BakeryHub!</h1>
      <p>Manage your bakery online or sign up to get started.</p>
      <div style={{ marginBottom: "20px", display: "flex", gap: "15px" }}>
        <Link to="/login">
          <button>Login</button>
        </Link>
        <Link to="/register-admin">
          <button>Register Your Business</button>
        </Link>
      </div>
      <p>
        Discover how BakeryHub can help you manage orders, products, and
        customers.
      </p>
    </div>
  );
};

export default HomePage;
