import React from "react";
import ProductForm from "../../../components/ProductForm/ProductForm";
import { useNavigate } from "react-router-dom";
import styles from "./AddProductPage.module.css";

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/admin/products?tab=available", { replace: true });
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Volver a la lista de Productos
      </button>
      <ProductForm onSuccess={handleSuccess} />
    </div>
  );
};

export default AddProductPage;
