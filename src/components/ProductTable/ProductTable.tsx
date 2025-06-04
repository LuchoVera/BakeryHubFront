import React from "react";
import { ProductDto } from "../../types";
import styles from "./ProductTable.module.css";

export interface ProductTableProps {
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
  const formatLeadTime = (leadTime: string | null | undefined): string => {
    if (leadTime === "N/A") {
      return "N/A";
    }

    if (
      leadTime === null ||
      typeof leadTime === "undefined" ||
      leadTime === ""
    ) {
      return "-";
    }
    const leadTimeString = String(leadTime).trim();
    const num = parseInt(leadTimeString, 10);

    if (!isNaN(num) && String(num) === leadTimeString) {
      if (num === 1) {
        return `${num} día`;
      } else if (num > 1) {
        return `${num} días`;
      } else {
        return String(num);
      }
    } else {
      return leadTimeString;
    }
  };

  return (
    <div className={styles.tableContainer}>
      <h3>{title}</h3>
      {products.length === 0 ? (
        <p>No se encontraron productos en esta categoría.</p>
      ) : (
        <table className={styles.productTable}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.tableHeaderCell}>Nombre</th>
              <th className={styles.tableHeaderCell}>Categoría</th>
              <th className={styles.tableHeaderCell}>Precio</th>
              <th className={styles.tableHeaderCell}>Antelación</th>
              <th className={styles.tableHeaderCell}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const isDeletingCurrent = deletingProductId === prod.id;
              const isCurrentRowLoading = isLoading || isDeletingCurrent;
              return (
                <tr
                  key={prod.id}
                  className={`${styles.tableRow} ${
                    isCurrentRowLoading ? styles.tableRowLoading : ""
                  }`}
                >
                  <td className={styles.tableCell} data-label="Nombre:">
                    {prod.name}
                  </td>
                  <td className={styles.tableCell} data-label="Categoría:">
                    <span className={styles.productInfoValue}>
                      {prod.categoryName}
                    </span>
                  </td>
                  <td className={styles.tableCell} data-label="Precio:">
                    <span className={styles.productInfoValue}>
                      Bs. {prod.price.toFixed(2)}
                    </span>
                  </td>
                  <td className={styles.tableCell} data-label="Antelación:">
                    <span className={styles.productInfoValue}>
                      {formatLeadTime(prod.leadTimeDisplay)}
                    </span>
                  </td>
                  <td className={styles.actionsCell} data-label="Acciones:">
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => onEdit(prod.id)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        disabled={isCurrentRowLoading}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          onToggleAvailability(prod.id, prod.isAvailable)
                        }
                        className={`${styles.actionButton} ${
                          styles.toggleButton
                        } ${
                          prod.isAvailable
                            ? styles.toggleButtonDeactivate
                            : styles.toggleButtonActivate
                        }`}
                        disabled={isCurrentRowLoading}
                      >
                        {actionButtonLabel(prod.isAvailable)}
                      </button>
                      {isUnavailableList && onDelete && (
                        <button
                          onClick={() => onDelete(prod.id)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          disabled={isCurrentRowLoading}
                        >
                          {isDeletingCurrent ? "Borrando..." : "Borrar"}
                        </button>
                      )}
                    </div>
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

export default ProductTable;
