import React from "react";
import { Link } from "react-router-dom";
import AdminCreateManualOrderForm from "../../../components/AdminCreateManualOrderForm/AdminCreateManualOrderForm";

const AdminCreateManualOrderPage: React.FC = () => {
  return (
    <div>
      <Link to="/admin/orders">&larr; Volver a la lista de Pedidos</Link>
      <AdminCreateManualOrderForm />
    </div>
  );
};

export default AdminCreateManualOrderPage;
