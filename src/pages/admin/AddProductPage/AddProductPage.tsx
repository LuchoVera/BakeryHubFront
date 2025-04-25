import React from "react";
import ProductForm from "../../../components/ProductForm/ProductForm";
import { useNavigate, Link } from "react-router-dom";

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log("Product created successfully, navigating back to list.");
    navigate("/admin/products");
  };

  return (
    <div>
      <Link to="/admin/products">{"< Back to Product List"}</Link>
      <ProductForm onSuccess={handleSuccess} />
    </div>
  );
};

export default AddProductPage;
