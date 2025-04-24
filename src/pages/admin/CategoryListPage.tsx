import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { CategoryDto, UpdateCategoryDto, ApiErrorResponse } from "../../types";
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
        "Error adding category:",
        axiosError.response?.data || axiosError.message
      );
      setError(
        axiosError.response?.data?.title ||
          axiosError.message ||
          "Failed to add category."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: "20px",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      <div>
        <label
          htmlFor="new-category-name"
          style={{ display: "block", marginBottom: "5px" }}
        >
          New Category Name:
        </label>
        <input
          id="new-category-name"
          type="text"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          style={{ padding: "8px", marginRight: "10px" }}
        />
        {error && (
          <p style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}>
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{ padding: "8px 15px", marginTop: "24px" }}
      >
        {loading ? "Adding..." : "Add Category"}
      </button>
    </form>
  );
};

const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingName, setEditingName] = useState<string>("");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
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
        setError("Authentication required. Please login again.");
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
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEditClick = (category: CategoryDto) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingName("");
    setEditError(null);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editingName.trim()) {
      setEditError("Name cannot be empty.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const updateData: UpdateCategoryDto = { name: editingName };
      await axios.put(`${apiUrl}/categories/${categoryId}`, updateData);
      setEditingCategoryId(null);
      setEditingName("");
      await fetchCategories();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        `Error updating category ${categoryId}:`,
        axiosError.response?.data || axiosError.message
      );
      setEditError(
        axiosError.response?.data?.title ||
          axiosError.message ||
          "Failed to update category."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (categoryId: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete this category? This cannot be undone.`
      )
    ) {
      setDeletingId(categoryId);
      setEditError(null);
      try {
        await axios.delete(`${apiUrl}/categories/${categoryId}`);
        await fetchCategories();
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error(
          `Error deleting category ${categoryId}:`,
          axiosError.response?.data || axiosError.message
        );
        alert(`Failed to delete category. It might have associated products.`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
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

      {!loading && !error && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Name</th>

              <th style={{ padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ textAlign: "center", padding: "15px" }}
                >
                  No categories found for your tenant.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: "1px solid #eee" }}>
                  {editingCategoryId === cat.id ? (
                    <>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={editLoading}
                          style={{ padding: "5px", width: "90%" }}
                        />
                        {editError && (
                          <p
                            style={{
                              color: "red",
                              fontSize: "0.9em",
                              margin: "5px 0 0 0",
                            }}
                          >
                            {editError}
                          </p>
                        )}
                      </td>

                      <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={editLoading || deletingId === cat.id}
                          style={{
                            marginRight: "5px",
                            padding: "5px 10px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {editLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={editLoading || deletingId === cat.id}
                          style={{ padding: "5px 10px", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "8px" }}>{cat.name}</td>

                      <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleEditClick(cat)}
                          disabled={
                            !!editingCategoryId || deletingId === cat.id
                          }
                          style={{
                            marginRight: "5px",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(cat.id)}
                          disabled={
                            !!editingCategoryId || deletingId === cat.id
                          }
                          style={{
                            padding: "5px 10px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {deletingId === cat.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CategoryListPage;
