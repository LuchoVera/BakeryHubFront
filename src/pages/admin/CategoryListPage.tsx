import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { CategoryDto, ApiErrorResponse } from "../../types";
import { useAuth } from "../../AuthContext";

const apiUrl = "/api";

interface AddCategoryFormProps {
  onCategoryAdded: () => void;
}
const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  onCategoryAdded,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${apiUrl}/categories`, { name });
      setName("");
      onCategoryAdded();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error fetching categories:",
        axiosError.response?.data || axiosError.message
      );

      if (axiosError.response?.status === 401) {
        setError("Authentication required. Redirecting to login...");
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }, 1500);
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.message ||
            "Failed to load categories."
        );
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        margin: "20px 0",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        placeholder="New category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Category"}
      </button>
      {error && (
        <span style={{ color: "red", marginLeft: "10px" }}>{error}</span>
      )}
    </form>
  );
};

const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching categories...");
      const response = await axios.get<CategoryDto[]>(`${apiUrl}/categories`);

      setCategories(response.data);
      console.log("Categories fetched:", response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error fetching categories:",
        axiosError.response?.data || axiosError.message
      );

      if (axiosError.response?.status === 401) {
        setError("Authentication required. Redirecting to login...");
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }, 1500);
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.message ||
            "Failed to load categories."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  return (
    <div>
      <h2>Manage Categories</h2>
      <p>
        For tenant:{" "}
        {user?.administeredTenantSubdomain ??
          user?.administeredTenantId ??
          "N/A"}
      </p>

      <AddCategoryForm onCategoryAdded={fetchCategories} />

      {loading && <p>Loading categories...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading &&
        !error &&
        (categories.length === 0 ? (
          <p>No categories found for your tenant.</p>
        ) : (
          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>
                {cat.name} (ID: {cat.id})
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
};

export default CategoryListPage;
