import React from "react";
import ProductForm from "../../components/ProductForm/ProductForm";
import { useNavigate, useParams, Link } from "react-router-dom";

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const handleSuccess = () => {
    console.log("Product updated successfully, navigating back to list.");
    navigate("/admin/products");
  };

  if (!id) {
    return (
      <div>
        Error: Product ID not found in URL.{" "}
        <Link to="/admin/products">Go back</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/products">{"< Back to Product List"}</Link>
      <ProductForm productId={id} onSuccess={handleSuccess} />
    </div>
  );
};

export default EditProductPage;
