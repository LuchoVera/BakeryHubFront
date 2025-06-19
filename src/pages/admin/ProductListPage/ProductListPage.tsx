import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ProductDto, ApiErrorResponse } from "../../../types";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ProductListPage.module.css";
import ProductTable from "../../../components/ProductTable/ProductTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { LuTriangleAlert, LuCircleCheck, LuCircleX } from "react-icons/lu";
import {
  fetchAdminProducts,
  updateAdminProductAvailability,
  deleteAdminProduct,
} from "../../../services/apiService";
import { AxiosError } from "axios";

interface ModalInfo {
  type: "delete" | "deactivate" | "success" | "error";
  title: string;
  message: ReactNode;
  onConfirm: () => void;
  confirmButtonVariant?: "primary" | "danger";
  icon: ReactNode;
  iconType: "info" | "warning" | "danger" | "success";
  warningMessage?: ReactNode;
  itemData?: ProductDto;
}

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);
  const navigate = useNavigate();
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>("");

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const fetchedProducts = await fetchAdminProducts();
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
            axiosError.response?.data?.detail ||
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
    product: ProductDto,
    newAvailability: boolean
  ) => {
    setIsProcessingAction(true);
    setModalInfo(null);
    try {
      await updateAdminProductAvailability(product.id, newAvailability);
      await fetchProducts();
      setModalInfo({
        type: "success",
        title: newAvailability ? "Producto Activado" : "Producto Desactivado",
        message: `El producto "${product.name}" ha sido ${
          newAvailability ? "activado" : "desactivado"
        }.`,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleCheck />,
        iconType: "success",
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setModalInfo({
        type: "error",
        title: "Error al Actualizar",
        message:
          `Fallo al actualizar disponibilidad. ${
            axiosError.response?.data?.detail ||
            axiosError.response?.data?.title
          }` || "Error desconocido",
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleX />,
        iconType: "danger",
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const executeDeleteProduct = async (product: ProductDto) => {
    setIsProcessingAction(true);
    setModalInfo(null);
    try {
      await deleteAdminProduct(product.id);
      await fetchProducts();
      setModalInfo({
        type: "success",
        title: "Producto Eliminado",
        message: `Producto "${product.name}" eliminado correctamente.`,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleCheck />,
        iconType: "success",
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      let userErrorMessage = `No se pudo borrar el producto "${product.name}".`;
      if (
        axiosError.response?.status === 400 ||
        axiosError.response?.status === 409
      ) {
        userErrorMessage +=
          " Es probable que esté asociado a pedidos registrados.";
      }
      setModalInfo({
        type: "error",
        title: "Error al Eliminar",
        message: userErrorMessage,
        onConfirm: () => setModalInfo(null),
        icon: <LuCircleX />,
        iconType: "danger",
      });
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
    if (currentAvailability) {
      setModalInfo({
        type: "deactivate",
        title: "Confirmar Desactivación",
        message: (
          <>
            ¿Estás seguro de querer desactivar el producto{" "}
            <strong>"{product.name}"</strong>?
          </>
        ),
        warningMessage:
          "El producto ya no será visible ni se podrá comprar por los clientes.",
        onConfirm: () => executeToggleAvailability(product, false),
        icon: <LuTriangleAlert />,
        iconType: "warning",
        itemData: product,
      });
    } else {
      executeToggleAvailability(product, true);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      setModalInfo({
        type: "delete",
        title: "Confirmar Eliminación",
        message: (
          <>
            ¿Estás seguro de querer borrar permanentemente el producto{" "}
            <strong>"{product.name}"</strong>?
          </>
        ),
        warningMessage: "Esta acción no se puede deshacer.",
        onConfirm: () => executeDeleteProduct(product),
        confirmButtonVariant: "danger",
        icon: <LuTriangleAlert />,
        iconType: "danger",
        itemData: product,
      });
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const getToggleButtonLabel = (isAvailable: boolean): string => {
    return isAvailable ? "Desactivar" : "Activar";
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestion de Productos</h2>
      <Link to="/admin/products/new" className={styles.addProductButton}>
        Añadir Nuevo Producto
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
            isLoading={isProcessingAction}
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
            isLoading={isProcessingAction}
            deletingProductId={
              isProcessingAction && modalInfo?.type === "delete"
                ? modalInfo.itemData?.id
                : null
            }
          />
          {filteredProducts.length === 0 && adminSearchTerm && (
            <p className={styles.noProductsMessage}>
              No se encontraron productos que coincidan con "{adminSearchTerm}".
            </p>
          )}
        </>
      )}

      {modalInfo && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setModalInfo(null)}
          onConfirm={modalInfo.onConfirm}
          title={modalInfo.title}
          message={modalInfo.message}
          warningMessage={modalInfo.warningMessage}
          isConfirming={isProcessingAction}
          showCancelButton={
            modalInfo.type === "delete" || modalInfo.type === "deactivate"
          }
          icon={modalInfo.icon}
          iconType={modalInfo.iconType}
          confirmButtonVariant={modalInfo.confirmButtonVariant || "primary"}
          confirmText={
            modalInfo.type === "delete"
              ? "Sí, Borrar"
              : modalInfo.type === "deactivate"
              ? "Sí, Desactivar"
              : "OK"
          }
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default ProductListPage;
