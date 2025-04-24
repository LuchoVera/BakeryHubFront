import React from "react";
import { useAuth } from "../../AuthContext";

interface TenantAdminPageProps {
  tenantSubdomain: string;
}

const TenantAdminPage: React.FC<TenantAdminPageProps> = ({
  tenantSubdomain,
}) => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "20px", border: "2px solid green" }}>
      <h1>Admin Dashboard</h1>
      <h2>Tenant: {tenantSubdomain}</h2>
      {user && (
        <p>
          Welcome, {user.name} ({user.email})!
        </p>
      )}
      <p>This is your admin area. Add content later!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default TenantAdminPage;
