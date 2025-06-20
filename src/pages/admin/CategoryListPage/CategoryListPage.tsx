import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { CategoryDto, ApiErrorResponse } from "../../../types";
import styles from "./CategoryListPage.module.css";
import CategoryTable from "../../../components/CategoryTable/CategoryTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { LuTriangleAlert, LuCircleX, LuCircleCheck } from "react-icons/lu";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
} from "../../../utils/validationUtils";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../../services/apiService";
import { AxiosError } from "axios";

interface ModalInfo {
  type: "delete" | "success" | "error";
  title: string;
  message: ReactNode;
  onConfirm: () => void;
  confirmButtonVariant?: "primary" | "danger";
  icon: ReactNode;
  iconType: "info" | "warning" | "danger" | "success";
  warningMessage?: ReactNode;
}

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
      await createAdminCategory({ name: trimmedName });
      setName("");
      onCategoryAdded();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      let errorMessage = "Ocurrió un error inesperado al añadir la categoría.";
      if (response?.data) {
        errorMessage =
          response.data.errors?.Name?.[0] ||
          response.data.title ||
          response.data.detail ||
          "La categoría ya existe.";
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
      <button
        type="submit"
        disabled={loading}
        className="button button-primary"
      >
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
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);

  const fetchCategories = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.detail || "Fallo al cargar categorías."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
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
      await updateAdminCategory(categoryId, { name: editingName.trim() });
      setEditingCategoryId(null);
      setEditingName("");
      await fetchCategories();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setEditError(
        axiosError.response?.data?.detail ||
          "El nombre de la categoría ya existe."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (category: CategoryDto) => {
    setModalInfo({
      type: "delete",
      title: "Confirmar Eliminación",
      message: (
        <>
          ¿Estás seguro de querer borrar la categoría{" "}
          <strong>"{category.name}"</strong>?
        </>
      ),
      warningMessage:
        "Esta acción no se puede deshacer. Si la categoría tiene productos asociados, la eliminación podría fallar.",
      onConfirm: () => handleConfirmDelete(category),
      confirmButtonVariant: "danger",
      icon: <LuTriangleAlert />,
      iconType: "danger",
    });
  };

  const handleConfirmDelete = async (categoryToDelete: {
    id: string;
    name: string;
  }) => {
    setDeletingId(categoryToDelete.id);
    setModalInfo(null);
    try {
      await deleteAdminCategory(categoryToDelete.id);
      setModalInfo({
        type: "success",
        title: "Éxito",
        message: `Categoría "${categoryToDelete.name}" eliminada correctamente.`,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleCheck />,
        iconType: "success",
      });
      await fetchCategories();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setModalInfo({
        type: "error",
        title: "Error al Eliminar",
        message:
          axiosError.response?.data?.detail ||
          `No se pudo borrar la categoría "${categoryToDelete.name}". Es probable que tenga productos asociados.`,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleX />,
        iconType: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestion de Categorías</h2>
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
          onDeleteClick={(catId) => {
            const cat = categories.find((c) => c.id === catId);
            if (cat) handleDeleteClick(cat);
          }}
          onEditingNameChange={handleEditingNameChange}
        />
      )}
      {!loading && !error && categories.length === 0 && (
        <p className={styles.loadingText}>
          No hay categorías creadas. ¡Añade una!
        </p>
      )}

      {modalInfo && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setModalInfo(null)}
          onConfirm={modalInfo.onConfirm}
          title={modalInfo.title}
          message={modalInfo.message}
          warningMessage={modalInfo.warningMessage}
          confirmText={modalInfo.type === "delete" ? "Sí, Borrar" : "OK"}
          cancelText="Cancelar"
          isConfirming={!!deletingId}
          showCancelButton={modalInfo.type === "delete"}
          icon={modalInfo.icon}
          iconType={modalInfo.iconType}
          confirmButtonVariant={modalInfo.confirmButtonVariant || "primary"}
        />
      )}
    </div>
  );
};

export default CategoryListPage;
