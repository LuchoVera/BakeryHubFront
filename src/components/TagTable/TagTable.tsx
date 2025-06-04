import React from "react";
import { TagDto } from "../../types";
import styles from "./TagTable.module.css";

export interface TagTableProps {
  tags: TagDto[];
  editingTagId: string | null;
  editingName: string;
  editError: string | null;
  editLoading: boolean;
  deletingId: string | null;
  onEditClick: (tag: TagDto) => void;
  onCancelEdit: () => void;
  onSaveEdit: (tagId: string) => void;
  onDeleteClick: (tagId: string) => void;
  onEditingNameChange: (newName: string) => void;
}

const TagTable: React.FC<TagTableProps> = ({
  tags,
  editingTagId,
  editingName,
  editError,
  editLoading,
  deletingId,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onDeleteClick,
  onEditingNameChange,
}) => {
  return (
    <table className={styles.tagTable}>
      <thead>
        <tr className={styles.tableHeaderRow}>
          <th className={styles.tableHeaderCell}>Nombre</th>
          <th className={styles.tableHeaderCell}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {tags.length === 0 ? (
          <tr>
            <td
              colSpan={2}
              className={styles.tableCell}
              style={{ textAlign: "center" }}
            >
              No se encontraron Etiquetas.
            </td>
          </tr>
        ) : (
          tags.map((tag) => (
            <tr key={tag.id} className={styles.tableRow}>
              {editingTagId === tag.id ? (
                <>
                  <td className={styles.tableCell} data-label="Editando:">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => onEditingNameChange(e.target.value)}
                      disabled={editLoading}
                      className={styles.editInput}
                      aria-label="Editar nombre de la etiqueta"
                    />
                    {editError && (
                      <p className={styles.errorText}>{editError}</p>
                    )}
                  </td>
                  <td className={styles.actionsCell} data-label="Acciones:">
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => onSaveEdit(tag.id)}
                        disabled={editLoading || deletingId === tag.id}
                        className={`${styles.actionButton} ${styles.saveButton}`}
                      >
                        {editLoading ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={onCancelEdit}
                        disabled={editLoading || deletingId === tag.id}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className={styles.tableCell} data-label="Nombre:">
                    {tag.name}
                  </td>
                  <td className={styles.actionsCell} data-label="Acciones:">
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => onEditClick(tag)}
                        disabled={!!editingTagId || deletingId === tag.id}
                        className={`${styles.actionButton} ${styles.editButton}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteClick(tag.id)}
                        disabled={!!editingTagId || deletingId === tag.id}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                      >
                        {deletingId === tag.id ? "Borrando..." : "Borrar"}
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default TagTable;
