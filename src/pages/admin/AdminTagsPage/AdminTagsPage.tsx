import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { TagDto, CreateTagDto, ApiErrorResponse } from "../../../types";
import styles from "./AdminTagsPage.module.css";
import TagTable from "../../../components/TagTable/TagTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { LuTriangleAlert, LuCircleX, LuCircleCheck } from "react-icons/lu";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
} from "../../../utils/validationUtils";
import {
  createAdminTag,
  fetchAdminTags,
  updateAdminTag,
  deleteAdminTag,
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

interface AddTagFormProps {
  onTagAdded: () => void;
}
const AddTagForm: React.FC<AddTagFormProps> = ({ onTagAdded }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    let validationError =
      validateRequired(trimmedName) ||
      validateMinLength(trimmedName, 2) ||
      validateMaxLength(trimmedName, 50);
    if (validationError) {
      if (validationError.includes("required")) {
        validationError = "El nombre de la etiqueta es requerido.";
      } else if (validationError.includes("at least 2")) {
        validationError =
          "El nombre la etiqueta debe tener al menos 2 caracteres.";
      } else if (validationError.includes("no more than 50")) {
        validationError =
          "El nombre de la etiqueta no debe exceder los 50 caracteres.";
      }
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await createAdminTag({ name: trimmedName } as CreateTagDto);
      setName("");
      onTagAdded();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      let errorMessage = "Ocurrió un error inesperado al añadir la etiqueta.";
      if (response?.status === 400) {
        errorMessage = "Una etiqueta con este nombre ya existe.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      <div className={styles.formGroup}>
        <label htmlFor="new-tag-name" className={styles.inputLabel}>
          Nombre de la Nueva Etiqueta:
        </label>
        <input
          id="new-tag-name"
          type="text"
          placeholder="Ej: Vegano, Popular, Sin Gluten..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className={styles.textInput}
          aria-describedby={error ? "add-tag-error" : undefined}
        />
        {error && (
          <p id="add-tag-error" className={styles.errorText}>
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={loading} className={styles.submitButton}>
        {loading ? "Añadiendo..." : "Añadir Etiqueta"}
      </button>
    </form>
  );
};

const AdminTagsPage: React.FC = () => {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);

  const fetchTags = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminTags();
      setTags(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.detail || "Fallo al cargar las etiquetas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTags();
  }, [fetchTags]);

  const handleEditClick = (tag: TagDto) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingName("");
    setEditError(null);
  };

  const handleEditingNameChange = (newName: string) => {
    setEditingName(newName);
    if (editError) setEditError(null);
  };

  const handleSaveEdit = async (tagId: string) => {
    let validationError =
      validateRequired(editingName.trim()) ||
      validateMinLength(editingName.trim(), 2) ||
      validateMaxLength(editingName.trim(), 50);
    if (validationError) {
      if (validationError.includes("required")) {
        validationError = "El nombre es requerido.";
      } else if (validationError.includes("at least 2")) {
        validationError = "El nombre debe tener al menos 2 caracteres.";
      } else if (validationError.includes("no more than 50")) {
        validationError = "El nombre no debe exceder los 50 caracteres.";
      }
      setEditError(validationError);
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await updateAdminTag(tagId, { name: editingName.trim() });
      setEditingTagId(null);
      setEditingName("");
      await fetchTags();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setEditError(
        axiosError.response?.data?.detail || "El nombre del tag ya existe."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (tag: TagDto) => {
    setModalInfo({
      type: "delete",
      title: "Confirmar Eliminación",
      message: (
        <>
          ¿Estás seguro de querer borrar la etiqueta{" "}
          <strong>"{tag.name}"</strong>?
        </>
      ),
      warningMessage:
        "Esta acción no se puede deshacer. La etiqueta se eliminará de todos los productos que la usan.",
      onConfirm: () => handleConfirmDelete(tag),
      confirmButtonVariant: "danger",
      icon: <LuTriangleAlert />,
      iconType: "danger",
    });
  };

  const handleConfirmDelete = async (tagToDelete: {
    id: string;
    name: string;
  }) => {
    setDeletingId(tagToDelete.id);
    setModalInfo(null);
    try {
      await deleteAdminTag(tagToDelete.id);
      setModalInfo({
        type: "success",
        title: "Éxito",
        message: `Etiqueta "${tagToDelete.name}" eliminada correctamente.`,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleCheck />,
        iconType: "success",
      });
      await fetchTags();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setModalInfo({
        type: "error",
        title: "Error al Eliminar",
        message:
          axiosError.response?.data?.detail ||
          `No se pudo borrar la etiqueta "${tagToDelete.name}". Es posible que esté en uso.`,
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
      <h2>Gestion de Etiquetas</h2>
      <AddTagForm onTagAdded={fetchTags} />

      {loading && <p className={styles.loadingText}>Cargando etiquetas...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <TagTable
          tags={tags}
          editingTagId={editingTagId}
          editingName={editingName}
          editError={editError}
          editLoading={editLoading}
          deletingId={deletingId}
          onEditClick={handleEditClick}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDeleteClick={(tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (tag) handleDeleteClick(tag);
          }}
          onEditingNameChange={handleEditingNameChange}
        />
      )}
      {!loading && !error && tags.length === 0 && (
        <p className={styles.loadingText}>
          No hay etiquetas creadas. ¡Añade una!
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

export default AdminTagsPage;
