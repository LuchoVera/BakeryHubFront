import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { ProductDto, ApiErrorResponse } from "../../types";
import { useAuth } from "../../AuthContext";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = "/api";

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching products...");

      const response = await axios.get<ProductDto[]>(`${apiUrl}/products`);
      setProducts(response.data);
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
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleAvailability = async (
    productId: string,
    currentAvailability: boolean
  ) => {
    try {
      console.log(
        `Setting availability for ${productId} to ${!currentAvailability}`
      );
      await axios.patch(
        `${apiUrl}/products/${productId}/availability`,
        !currentAvailability,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      fetchProducts();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error("Error toggling availability:", axiosError.response?.data);
      alert(
        "Failed to update product availability. " +
          (axiosError.response?.data?.title || axiosError.message)
      );
    }
  };

  return (
    <div>
      <h2>Manage Products</h2>
      <p>
        For tenant:{" "}
        {user?.administeredTenantSubdomain ??
          user?.administeredTenantId ??
          "N/A"}
      </p>

      <Link to="/admin/products/new">
        <button style={{ marginBottom: "15px" }}>Add New Product</button>
      </Link>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading &&
        !error &&
        (products.length === 0 ? (
          <p>No products found for your tenant.</p>
        ) : (
          <table
            border={1}
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Lead Time</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id}>
                  <td>{prod.name}</td>
                  <td>{prod.categoryName}</td>
                  <td>${prod.price.toFixed(2)}</td>
                  <td>{prod.leadTimeDisplay || "-"}</td>
                  <td>{prod.isAvailable ? "Yes" : "No"}</td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/admin/products/edit/${prod.id}`)
                      }
                      style={{ marginRight: "5px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleToggleAvailability(prod.id, prod.isAvailable)
                      }
                    >
                      {prod.isAvailable ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
};

export default ProductListPage;
