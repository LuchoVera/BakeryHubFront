import React from "react";
import { Link } from "react-router-dom";
import AdminRegistrationForm from "../../../components/AdminRegistrationForm/AdminRegistrationForm";

const AdminRegistrationPage: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Link to="/">{"< Regresar"}</Link>
      <AdminRegistrationForm />
    </div>
  );
};

export default AdminRegistrationPage;
