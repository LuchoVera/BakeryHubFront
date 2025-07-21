import React from "react";
import ProductForm from "../../../components/ProductForm/ProductForm";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import styles from "./EditProductPage.module.css";

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const handleSuccess = () => {
    const params = new URLSearchParams(location.search);
    const sourceTab = params.get("sourceTab") || "available";
    navigate(`/admin/products?tab=${sourceTab}`, { replace: true });
  };

  if (!id) {
    return (
      <div>
        Error: ID de producto no encontrado en la URL.{" "}
        <Link to="/admin/products">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Volver a la lista de Productos
      </button>
      <ProductForm productId={id} onSuccess={handleSuccess} />
    </div>
  );
};

export default EditProductPage;
