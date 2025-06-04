import React, { useState, useEffect, useCallback, ReactNode } from "react";
import {
  TagDto,
  CreateTagDto,
  UpdateTagDto,
  ApiErrorResponse,
} from "../../../types";
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

interface TagDeleteModalData {
  id: string;
  name: string;
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
        if (
          response.data?.errors?.Name?.includes(
            "A tag with this name already exists for your business."
          )
        ) {
          errorMessage = "Error: Una etiqueta con este nombre ya existe.";
        } else if (
          response.data?.detail?.includes(
            "A tag with this name already exists for your business."
          )
        ) {
          errorMessage = "Error: Una etiqueta con este nombre ya existe.";
        } else if (
          response.data?.title?.includes(
            "A tag with this name already exists for your business."
          )
        ) {
          errorMessage = "Error: Una etiqueta con este nombre ya existe.";
        } else if (response?.data?.errors?.Name) {
          errorMessage = response.data.errors.Name[0];
        } else if (response?.data?.title) {
          errorMessage = response.data.title;
        } else if (response?.data?.detail) {
          errorMessage = response.data.detail;
        } else {
          errorMessage =
            "Error: La etiqueta ya existe o el nombre es inválido.";
        }
      } else if (response?.status) {
        if (response.data?.errors?.Name) {
          errorMessage = response.data.errors.Name[0];
        } else if (response.data?.title) {
          errorMessage = response.data.title;
        } else if (response.data?.detail) {
          errorMessage = response.data.detail;
        }
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<TagDeleteModalData | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(
    null
  );

  const fetchTags = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminTags();
      setTags(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 401) {
        setError("Autenticación requerida. Por favor, inicia sesión de nuevo.");
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.response?.data?.detail ||
            axiosError.message ||
            "Fallo al cargar las etiquetas."
        );
      }
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
      const updateData: UpdateTagDto = { name: editingName.trim() };
      await updateAdminTag(tagId, updateData);
      setEditingTagId(null);
      setEditingName("");
      await fetchTags();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      let errorMessage = "Ocurrió un error al guardar los cambios.";
      if (response?.data?.errors?.Name) {
        errorMessage = response.data.errors.Name[0];
      } else if (response?.data?.title) {
        errorMessage = response.data.title;
      } else if (response?.data?.detail) {
        errorMessage = response.data.detail;
      } else if (response?.status === 400) {
        errorMessage = "Error: El nombre del tag ya existe o es inválido.";
      }
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setTagToDelete({ id: tag.id, name: tag.name });
      setIsDeleteModalOpen(true);
      setErrorModalMessage(null);
      setIsErrorModalOpen(false);
    }
  };
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTagToDelete(null);
  };
  const handleErrorModalClose = () => {
    setIsErrorModalOpen(false);
    setErrorModalMessage(null);
  };
  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    setSuccessModalMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setDeletingId(tagToDelete.id);
    setIsDeleteModalOpen(false);
    try {
      await deleteAdminTag(tagToDelete.id);
      setSuccessModalMessage(
        `Etiqueta "${tagToDelete.name}" eliminada correctamente.`
      );
      setIsSuccessModalOpen(true);
      setTagToDelete(null);
      await fetchTags();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      let userErrorMessage = `No se pudo borrar la etiqueta "${tagToDelete.name}".`;
      if (response?.status === 400) {
        userErrorMessage =
          response.data?.detail ||
          response.data?.title ||
          "La etiqueta está en uso y no puede ser eliminada.";
      } else {
        userErrorMessage =
          "Ocurrió un error inesperado al eliminar la etiqueta.";
      }
      setErrorModalMessage(userErrorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteModalMessage: ReactNode = tagToDelete ? (
    <>
      ¿Estás seguro de querer borrar la etiqueta{" "}
      <strong>"{tagToDelete.name}"</strong>?
    </>
  ) : (
    ""
  );

  const deleteModalWarning: ReactNode = (
    <>
      Esta acción no se puede deshacer. La etiqueta se eliminará permanentemente
      y se quitará de todos los productos que la estén utilizando. ¿Estás seguro
      de querer proceder?
    </>
  );

  return (
    <div className={styles.pageContainer}>
      <h2>Gestion de Etiquetas</h2>
      <AddTagForm onTagAdded={fetchTags} />

      {loading && <p className={styles.loadingText}>Cargando etiquetas...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && tags.length >= 0 && (
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
          onDeleteClick={handleDeleteClick}
          onEditingNameChange={handleEditingNameChange}
        />
      )}
      {!loading && !error && tags.length === 0 && (
        <p className={styles.loadingText}>
          No hay etiquetas creadas. ¡Añade una!
        </p>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={deleteModalMessage}
        warningMessage={deleteModalWarning}
        confirmText="Sí, Borrar"
        cancelText="Cancelar"
        isConfirming={!!deletingId}
        icon={<LuTriangleAlert />}
        iconType="danger"
        confirmButtonVariant="danger"
      />

      <ConfirmationModal
        isOpen={isErrorModalOpen}
        onClose={handleErrorModalClose}
        onConfirm={handleErrorModalClose}
        title="Error al Eliminar"
        message={errorModalMessage || "Ocurrió un error."}
        confirmText="OK"
        showCancelButton={false}
        icon={<LuCircleX />}
        iconType="danger"
        confirmButtonVariant="primary"
      />
      <ConfirmationModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        onConfirm={handleSuccessModalClose}
        title="Éxito"
        message={successModalMessage || "Operación completada."}
        confirmText="OK"
        showCancelButton={false}
        icon={<LuCircleCheck />}
        iconType="success"
        confirmButtonVariant="primary"
      />
    </div>
  );
};

export default AdminTagsPage;
