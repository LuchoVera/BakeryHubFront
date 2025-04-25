import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import {
  CategoryDto,
  UpdateCategoryDto,
  ApiErrorResponse,
} from "../../../types";
import styles from "./CategoryListPage.module.css";
import CategoryTable from "../../../components/CategoryTable/CategoryTable";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
} from "../../../utils/validationUtils";

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
    setError(null);

    const trimmedName = name.trim();
    let validationError =
      validateRequired(trimmedName) ||
      validateMinLength(trimmedName, 3) ||
      validateMaxLength(trimmedName, 30);

    if (validationError) {
      if (validationError.includes("required")) {
        validationError = "El nombre es requerido.";
      } else if (validationError.includes("at least 3")) {
        validationError = "El nombre debe tener al menos 3 caracteres.";
      } else if (validationError.includes("no more than 30")) {
        validationError = "El nombre no debe exceder los 30 caracteres.";
      }
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${apiUrl}/categories`, { name: trimmedName });
      setName("");
      onCategoryAdded();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      console.error(
        "Error adding category:",
        response?.data || axiosError.message
      );

      let errorMessage = "Ocurrió un error inesperado al añadir la categoría.";

      if (response) {
        if (response.status === 400) {
          errorMessage =
            "Error: La categoría ya existe o los datos son inválidos.";
        } else if (response.status === 409) {
          errorMessage =
            "Conflicto: El recurso ya podría existir o hubo un problema.";
        } else {
          const responseData = response.data;
          const detail =
            typeof responseData === "object" && responseData !== null
              ? responseData.detail
              : undefined;
          const message =
            typeof responseData === "object" && responseData !== null
              ? responseData.message
              : undefined;
          errorMessage =
            (typeof detail === "string" ? detail : undefined) ||
            (typeof message === "string" ? message : undefined) ||
            `Error del servidor (${response.status})`;
        }
      } else if (axiosError.message) {
        errorMessage = `Error de red: ${axiosError.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      <div className={styles.formGroup}>
        <label htmlFor="new-category-name" className={styles.inputLabel}>
          Nombre de Nueva Categoría:
        </label>
        <input
          id="new-category-name"
          type="text"
          placeholder="Ej: Tortas, Galletas..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className={styles.textInput}
          aria-describedby={error ? "add-cat-error" : undefined}
        />
        {error && (
          <p id="add-cat-error" className={styles.errorText}>
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={loading} className={styles.submitButton}>
        {loading ? "Añadiendo..." : "Añadir Categoría"}
      </button>
    </form>
  );
};

const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      const response = await axios.get<CategoryDto[]>(`${apiUrl}/categories`);
      setCategories(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error fetching categories:",
        axiosError.response?.data || axiosError.message
      );
      if (axiosError.response?.status === 401) {
        setError("Autenticación requerida. Por favor, inicia sesión de nuevo.");
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.message ||
            "Fallo al cargar categorías."
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

  const handleEditingNameChange = (newName: string) => {
    setEditingName(newName);
    if (editError) setEditError(null);
  };

  const handleSaveEdit = async (categoryId: string) => {
    let validationError =
      validateRequired(editingName.trim()) ||
      validateMinLength(editingName.trim(), 3) ||
      validateMaxLength(editingName.trim(), 30);
    if (validationError) {
      if (validationError.includes("required")) {
        validationError = "El nombre es requerido.";
      } else if (validationError.includes("at least 3")) {
        validationError = "El nombre debe tener al menos 3 caracteres.";
      } else if (validationError.includes("no more than 30")) {
        validationError = "El nombre no debe exceder los 30 caracteres.";
      }
      setEditError(validationError);
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const updateData: UpdateCategoryDto = { name: editingName.trim() };
      await axios.put(`${apiUrl}/categories/${categoryId}`, updateData);
      setEditingCategoryId(null);
      setEditingName("");
      await fetchCategories();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      const responseData = response?.data;
      console.error(
        `Error updating category ${categoryId}:`,
        responseData || axiosError.message
      );

      let errorMessage = "Ocurrió un error al guardar los cambios.";
      if (response) {
        if (response.status === 400) {
          errorMessage =
            "Error: La categoría ya existe o los datos son inválidos.";
        } else if (response.status === 409) {
          errorMessage =
            "Conflicto: El recurso ya podría existir o hubo un problema.";
        } else {
          const detail =
            typeof responseData === "object" && responseData !== null
              ? responseData.detail
              : undefined;
          const message =
            typeof responseData === "object" && responseData !== null
              ? responseData.message
              : undefined;
          errorMessage =
            (typeof detail === "string" ? detail : undefined) ||
            (typeof message === "string" ? message : undefined) ||
            `Error del servidor (${response.status})`;
        }
      } else if (axiosError.message) {
        errorMessage = `Error de red: ${axiosError.message}`;
      }
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (categoryId: string) => {
    if (
      window.confirm(
        `¿Estás seguro de querer borrar esta categoría? Esta acción no se puede deshacer.`
      )
    ) {
      setDeletingId(categoryId);
      setEditError(null);
      try {
        await axios.delete(`${apiUrl}/categories/${categoryId}`);
        await fetchCategories();
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const responseData = axiosError.response?.data;
        console.error(
          `Error deleting category ${categoryId}:`,
          responseData || axiosError.message
        );
        alert(
          `No se pudo borrar la categoría. Puede que tenga productos asociados.`
        );
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestionar Categorías</h2>
      <AddCategoryForm onCategoryAdded={fetchCategories} />

      {loading && <p className={styles.loadingText}>Cargando categorías...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <CategoryTable
          categories={categories}
          editingCategoryId={editingCategoryId}
          editingName={editingName}
          editError={editError}
          editLoading={editLoading}
          deletingId={deletingId}
          onEditClick={handleEditClick}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDeleteClick={handleDeleteClick}
          onEditingNameChange={handleEditingNameChange}
        />
      )}
    </div>
  );
};

export default CategoryListPage;
