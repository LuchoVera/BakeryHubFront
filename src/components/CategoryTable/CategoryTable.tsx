import React from "react";
import { CategoryDto } from "../../types";
import styles from "./CategoryTable.module.css";

export interface CategoryTableProps {
  categories: CategoryDto[];
  editingCategoryId: string | null;
  editingName: string;
  editError: string | null;
  editLoading: boolean;
  deletingId: string | null;
  onEditClick: (category: CategoryDto) => void;
  onCancelEdit: () => void;
  onSaveEdit: (categoryId: string) => void;
  onDeleteClick: (categoryId: string) => void;
  onEditingNameChange: (newName: string) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  editingCategoryId,
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
    <table className={styles.categoryTable}>
      <thead>
        <tr className={styles.tableHeaderRow}>
          <th className={styles.tableHeaderCell}>Nombre</th>
          <th className={styles.tableHeaderCell}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {categories.length === 0 ? (
          <tr>
            <td
              colSpan={2}
              className={styles.tableCell}
              style={{ textAlign: "center" }}
            >
              No se encontraron categorías.
            </td>
          </tr>
        ) : (
          categories.map((cat) => (
            <tr key={cat.id} className={styles.tableRow}>
              {editingCategoryId === cat.id ? (
                <>
                  <td className={styles.tableCell}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => onEditingNameChange(e.target.value)}
                      disabled={editLoading}
                      className={styles.editInput}
                    />
                    {editError && (
                      <p className={styles.errorText}>{editError}</p>
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => onSaveEdit(cat.id)}
                        disabled={editLoading || deletingId === cat.id}
                        className={`${styles.actionButton} ${styles.saveButton}`}
                      >
                        {editLoading ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={onCancelEdit}
                        disabled={editLoading || deletingId === cat.id}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className={styles.tableCell}>{cat.name}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => onEditClick(cat)}
                        disabled={!!editingCategoryId || deletingId === cat.id}
                        className={`${styles.actionButton} ${styles.editButton}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteClick(cat.id)}
                        disabled={!!editingCategoryId || deletingId === cat.id}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                      >
                        {deletingId === cat.id ? "Borrando..." : "Borrar"}
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

export default CategoryTable;
