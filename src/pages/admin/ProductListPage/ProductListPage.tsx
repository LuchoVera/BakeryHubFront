import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import axios, { AxiosError } from "axios";
import { ProductDto, ApiErrorResponse } from "../../../types";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ProductListPage.module.css";
import ProductTable from "../../../components/ProductTable/ProductTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import {
  LuTriangleAlert,
  LuCircleCheck,
  LuCircleX,
} from "react-icons/lu";

const apiUrl = "/api";

interface ProductActionModalData {
  action: "delete" | "deactivate";
  product: ProductDto;
}

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [productActionData, setProductActionData] =
    useState<ProductActionModalData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(
    null
  );
  const [successModalTitle, setSuccessModalTitle] = useState<string>("Éxito");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null
  );
  const [errorModalTitle, setErrorModalTitle] = useState<string>("Error");
  const navigate = useNavigate();
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>("");

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const response = await axios.get<ProductDto[]>(`${apiUrl}/products`);
      const fetchedProducts = response.data || [];
      fetchedProducts.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );
      setAllProducts(fetchedProducts);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 401) {
        setError("Autenticación requerida. Redirigiendo al login...");
        setTimeout(() => {
          navigate(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          );
        }, 1500);
      } else {
        setError(
          axiosError.response?.data?.title ||
            axiosError.message ||
            "Fallo al cargar productos."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!adminSearchTerm.trim()) {
      return allProducts;
    }
    const lowercasedSearchTerm = adminSearchTerm.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercasedSearchTerm) ||
        (product.categoryName &&
          product.categoryName.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [allProducts, adminSearchTerm]);

  const filteredAvailableProducts = useMemo(() => {
    return filteredProducts.filter((p) => p.isAvailable);
  }, [filteredProducts]);

  const filteredUnavailableProducts = useMemo(() => {
    return filteredProducts.filter((p) => !p.isAvailable);
  }, [filteredProducts]);

  const executeToggleAvailability = async (
    productId: string,
    newAvailability: boolean,
    productName?: string
  ) => {
    setIsProcessingAction(true);
    try {
      await axios.patch(
        `${apiUrl}/products/${productId}/availability`,
        newAvailability,
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchProducts();
      if (newAvailability && productName) {
        setSuccessModalTitle("Producto Activado");
        setSuccessModalMessage(
          `Producto "${productName}" activado y ahora visible para clientes.`
        );
        setIsSuccessModalOpen(true);
      }
      if (!newAvailability && productName) {
        setSuccessModalTitle("Producto Desactivado");
        setSuccessModalMessage(
          `Producto "${productName}" desactivado y ya no será visible.`
        );
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setErrorModalTitle("Error al Actualizar");
      setErrorModalMessage(
        `Fallo al actualizar disponibilidad. ${
          axiosError.response?.data?.detail ||
          axiosError.message ||
          "Error desconocido"
        }`
      );
      setIsErrorModalOpen(true);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const executeDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    setIsProcessingAction(true);
    try {
      await axios.delete(`${apiUrl}/products/${productId}`);
      await fetchProducts();
      setSuccessModalTitle("Producto Eliminado");
      setSuccessModalMessage(
        `Producto "${productName}" eliminado correctamente.`
      );
      setIsSuccessModalOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      let userErrorMessage = `No se pudo borrar el producto "${productName}".`;
      if (
        axiosError.response?.status === 500 ||
        axiosError.response?.status === 400 ||
        axiosError.response?.status === 409
      ) {
        userErrorMessage +=
          " Es probable que esté asociado a pedidos registrados.";
      } else {
        userErrorMessage += " Ocurrió un error inesperado.";
      }
      setErrorModalTitle("Error al Eliminar");
      setErrorModalMessage(userErrorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleToggleAvailability = (
    productId: string,
    currentAvailability: boolean
  ) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    const isDeactivating = currentAvailability === true;
    if (isDeactivating) {
      setProductActionData({ action: "deactivate", product });
      setIsConfirmModalOpen(true);
    } else {
      executeToggleAvailability(productId, true, product.name);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      setProductActionData({ action: "delete", product });
      setIsConfirmModalOpen(true);
    }
  };

  const handleModalConfirm = () => {
    if (!productActionData) return;
    const { action, product } = productActionData;
    setIsConfirmModalOpen(false);
    if (action === "deactivate") {
      executeToggleAvailability(product.id, false, product.name);
    } else if (action === "delete") {
      executeDeleteProduct(product.id, product.name);
    }
    setProductActionData(null);
  };

  const handleModalCancel = () => {
    setIsConfirmModalOpen(false);
    setProductActionData(null);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    setSuccessModalMessage(null);
    setSuccessModalTitle("Éxito");
  };

  const handleErrorModalClose = () => {
    setIsErrorModalOpen(false);
    setErrorModalMessage(null);
    setErrorModalTitle("Error");
  };

  const handleEdit = (productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const getModalInfo = (): {
    title: string;
    message: ReactNode;
    warning: ReactNode | undefined;
    confirmText: string;
    variant: "primary" | "danger";
    iconType: "warning" | "danger";
  } => {
    if (!productActionData)
      return {
        title: "",
        message: "",
        warning: undefined,
        confirmText: "",
        variant: "primary",
        iconType: "warning",
      };
    const { action, product } = productActionData;
    if (action === "deactivate") {
      return {
        title: "Confirmar Desactivación",
        message: (
          <>
            ¿Estás seguro de querer desactivar el producto{" "}
            <strong>"{product.name}"</strong>?
          </>
        ),
        warning:
          "El producto ya no será visible ni se podrá comprar por los clientes.",
        confirmText: "Sí, Desactivar",
        variant: "primary",
        iconType: "warning",
      };
    } else {
      return {
        title: "Confirmar Eliminación",
        message: (
          <>
            ¿Estás seguro de querer borrar permanentemente el producto{" "}
            <strong>"{product.name}"</strong>?
          </>
        ),
        warning: "Esta acción no se puede deshacer.",
        confirmText: "Sí, Borrar",
        variant: "danger",
        iconType: "danger",
      };
    }
  };

  const modalInfo = getModalInfo();
  const getToggleButtonLabel = (isAvailable: boolean): string => {
    return isAvailable ? "Desactivar" : "Activar";
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestion de Productos</h2>
      <Link to="/admin/products/new">
        <button className={styles.addProductButton}>
          Añadir Nuevo Producto
        </button>
      </Link>

      <div className={styles.searchContainerAdmin}>
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={adminSearchTerm}
          onChange={(e) => setAdminSearchTerm(e.target.value)}
          className={styles.searchInputAdmin}
        />
      </div>

      {loading && <p className={styles.loadingText}>Cargando productos...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <>
          <ProductTable
            products={filteredAvailableProducts}
            title="Productos Disponibles"
            actionButtonLabel={getToggleButtonLabel}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            onDelete={handleDeleteProduct}
            isLoading={
              isProcessingAction &&
              productActionData?.action === "deactivate" &&
              productActionData?.product.isAvailable
            }
            deletingProductId={
              isProcessingAction &&
              productActionData?.action === "delete" &&
              productActionData?.product.isAvailable
                ? productActionData.product.id
                : null
            }
            isUnavailableList={false}
          />
          <ProductTable
            products={filteredUnavailableProducts}
            title="Productos No Disponibles"
            actionButtonLabel={getToggleButtonLabel}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            onDelete={handleDeleteProduct}
            isUnavailableList={true}
            isLoading={
              isProcessingAction &&
              productActionData?.action === "delete" &&
              !productActionData?.product.isAvailable
            }
            deletingProductId={
              isProcessingAction &&
              productActionData?.action === "delete" &&
              !productActionData?.product.isAvailable
                ? productActionData.product.id
                : null
            }
          />
          {filteredProducts.length === 0 && adminSearchTerm && (
            <p className={styles.noProductsMessage}>
              No se encontraron productos que coincidan con "{adminSearchTerm}".
            </p>
          )}
          {allProducts.length > 0 &&
            filteredProducts.length === 0 &&
            !adminSearchTerm && (
              <p className={styles.noProductsMessage}>
                No hay productos para mostrar. Intenta añadir algunos.
              </p>
            )}
          {allProducts.length === 0 && !adminSearchTerm && (
            <p className={styles.noProductsMessage}>
              Aún no has añadido ningún producto. ¡Empieza creando uno!
            </p>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        title={modalInfo.title}
        message={modalInfo.message}
        warningMessage={modalInfo.warning}
        confirmText={modalInfo.confirmText}
        cancelText="Cancelar"
        isConfirming={isProcessingAction}
        icon={<LuTriangleAlert />}
        iconType={modalInfo.iconType}
        confirmButtonVariant={modalInfo.variant}
      />
      <ConfirmationModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        onConfirm={handleSuccessModalClose}
        title={successModalTitle}
        message={successModalMessage || "Operación exitosa."}
        confirmText="OK"
        showCancelButton={false}
        icon={<LuCircleCheck />}
        iconType="success"
        confirmButtonVariant="primary"
      />
      <ConfirmationModal
        isOpen={isErrorModalOpen}
        onClose={handleErrorModalClose}
        onConfirm={handleErrorModalClose}
        title={errorModalTitle}
        message={errorModalMessage || "Ocurrió un error."}
        confirmText="OK"
        showCancelButton={false}
        icon={<LuCircleX />}
        iconType="danger"
        confirmButtonVariant="primary"
      />
    </div>
  );
};

export default ProductListPage;
