import React from "react";
import { useAuth } from "../../../AuthContext";

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Bienvenido, {user?.name}!</p>
    </div>
  );
};

export default AdminDashboardPage;
