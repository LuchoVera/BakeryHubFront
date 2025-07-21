import React from "react";
import { useNavigate } from "react-router-dom";
import AdminCreateManualOrderForm from "../../../components/AdminCreateManualOrderForm/AdminCreateManualOrderForm";
import styles from "./AdminCreateManualOrderPage.module.css";

const AdminCreateManualOrderPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Volver a la lista de Pedidos
      </button>
      <AdminCreateManualOrderForm />
    </div>
  );
};

export default AdminCreateManualOrderPage;
