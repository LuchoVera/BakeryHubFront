import React from "react";
import ProductForm from "../../../components/ProductForm/ProductForm";
import { useNavigate, useParams, Link } from "react-router-dom";

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleSuccess = () => {
    navigate("/admin/products");
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
      <Link to="/admin/products">{"< Volver a la Lista de Productos"}</Link>
      <ProductForm productId={id} onSuccess={handleSuccess} />
    </div>
  );
};

export default EditProductPage;
