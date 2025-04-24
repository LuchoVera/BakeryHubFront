import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ProductDto, ApiErrorResponse } from "../../types";
import { useAuth } from "../../AuthContext";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = "/api";

interface ProductTableProps {
  products: ProductDto[];
  title: string;
  actionButtonLabel: (isAvailable: boolean) => string;
  onToggleAvailability: (
    productId: string,
    currentAvailability: boolean
  ) => void;
  onEdit: (productId: string) => void;
  onDelete?: (productId: string) => void;
  isLoading?: boolean;
  isUnavailableList?: boolean;
  deletingProductId?: string | null;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  title,
  actionButtonLabel,
  onToggleAvailability,
  onEdit,
  onDelete,
  isLoading = false,
  isUnavailableList = false,
  deletingProductId = null,
}) => {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h3>{title}</h3>
      {products.length === 0 ? (
        <p>No products found in this category.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Name</th>
              <th style={{ padding: "8px" }}>Category</th>
              <th style={{ padding: "8px" }}>Price</th>
              <th style={{ padding: "8px" }}>Lead Time</th>
              <th style={{ padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const isDeletingCurrent = deletingProductId === prod.id;
              return (
                <tr
                  key={prod.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    opacity: isLoading || isDeletingCurrent ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: "8px" }}>{prod.name}</td>
                  <td style={{ padding: "8px" }}>{prod.categoryName}</td>
                  <td style={{ padding: "8px" }}>${prod.price.toFixed(2)}</td>
                  <td style={{ padding: "8px" }}>
                    {prod.leadTimeDisplay || "-"}
                  </td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => onEdit(prod.id)}
                      style={{
                        marginRight: "5px",
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                      disabled={isLoading || isDeletingCurrent}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        onToggleAvailability(prod.id, prod.isAvailable)
                      }
                      style={{
                        marginRight: "5px",
                        padding: "5px 10px",
                        backgroundColor: prod.isAvailable
                          ? "#ff9800"
                          : "#4CAF50",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                      disabled={isLoading || isDeletingCurrent}
                    >
                      {actionButtonLabel(prod.isAvailable)}
                    </button>

                    {isUnavailableList && onDelete && (
                      <button
                        onClick={() => onDelete(prod.id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                        }}
                        disabled={isLoading || isDeletingCurrent}
                      >
                        {isDeletingCurrent ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeletingProductId(null);
    try {
      console.log("Fetching products...");
      const response = await axios.get<ProductDto[]>(`${apiUrl}/products`);
      setAllProducts(response.data);
      console.log("Products fetched:", response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error fetching products:",
        axiosError.response?.data || axiosError.message
      );
      if (axiosError.response?.status === 401) {
        setError("Authentication required. Redirecting to login...");
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`;
        }, 1500);
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.message ||
            "Failed to load products."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleAvailability = async (
    productId: string,
    currentAvailability: boolean
  ) => {
    setToggleLoading(true);
    try {
      await axios.patch(
        `${apiUrl}/products/${productId}/availability`,
        !currentAvailability,
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchProducts();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error("Error toggling availability:", axiosError.response?.data);
      alert(
        `Failed to update product availability. ${
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          axiosError.message
        }`
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this product? This cannot be undone."
      )
    ) {
      return;
    }
    setDeletingProductId(productId);
    setError(null);
    try {
      console.log(`Attempting to delete product ID: ${productId}`);
      await axios.delete(`${apiUrl}/products/${productId}`);
      console.log(`Product ${productId} deleted successfully.`);

      await fetchProducts();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        `Error deleting product ${productId}:`,
        axiosError.response?.data || axiosError.message
      );

      alert(
        `Failed to delete product: ${
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.message ||
          "An unknown error occurred."
        }`
      );
      setDeletingProductId(null);
    }
  };

  const availableProducts = allProducts.filter((p) => p.isAvailable);
  const unavailableProducts = allProducts.filter((p) => !p.isAvailable);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Products</h2>
      <p>
        For tenant:{" "}
        {user?.administeredTenantSubdomain ??
          user?.administeredTenantId ??
          "N/A"}
      </p>

      <Link to="/admin/products/new">
        <button style={{ marginBottom: "25px", padding: "10px 15px" }}>
          Add New Product
        </button>
      </Link>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <ProductTable
            products={availableProducts}
            title="Available Products"
            actionButtonLabel={() => "Deactivate"}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            isLoading={toggleLoading || !!deletingProductId}
            deletingProductId={deletingProductId}
          />

          <ProductTable
            products={unavailableProducts}
            title="Unavailable Products"
            actionButtonLabel={() => "Activate"}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            onDelete={handleDeleteProduct}
            isUnavailableList={true}
            isLoading={toggleLoading || !!deletingProductId}
            deletingProductId={deletingProductId}
          />
        </>
      )}
    </div>
  );
};

export default ProductListPage;
