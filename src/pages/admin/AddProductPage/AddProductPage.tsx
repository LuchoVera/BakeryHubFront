import React from "react";
import ProductForm from "../../../components/ProductForm/ProductForm";
import { useNavigate, Link } from "react-router-dom";
import styles from "../../../components/ProductForm/ProductForm.module.css";

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/admin/products");
  };

  return (
    <div className={styles.formContainer}>
      <Link to="/admin/products">&larr; Volver a la lista de Productos</Link>
      <ProductForm onSuccess={handleSuccess} />
    </div>
  );
};

export default AddProductPage;
