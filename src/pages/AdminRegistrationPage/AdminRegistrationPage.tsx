import React from "react";
import AdminRegistrationForm from "../../components/AdminRegistrationForm/AdminRegistrationForm";
import { Link } from "react-router-dom";

const AdminRegistrationPage: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Link to="/">{"< Back to Home"}</Link>
      <AdminRegistrationForm />
    </div>
  );
};

export default AdminRegistrationPage;
