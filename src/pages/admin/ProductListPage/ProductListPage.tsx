import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ProductDto, ApiErrorResponse } from "../../../types";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ProductListPage.module.css";
import ProductTable from "../../../components/ProductTable/ProductTable";

const apiUrl = "/api";

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeletingProductId(null);
    try {
      const response = await axios.get<ProductDto[]>(`${apiUrl}/products`);
      setAllProducts(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 401) {
        setError("Autenticación requerida. Redirigiendo al login...");
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`;
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleAvailability = async (
    productId: string,
    currentAvailability: boolean
  ) => {
    setToggleLoading(true);
    try {
      await axios.patch(
        `${apiUrl}/products/${productId}/availability`,
        !currentAvailability,
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchProducts();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        `Fallo al actualizar disponibilidad del producto. ${
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          axiosError.message ||
          ""
        }`
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de querer borrar este producto permanentemente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setDeletingProductId(productId);
    setError(null);
    try {
      await axios.delete(`${apiUrl}/products/${productId}`);
      await fetchProducts();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        `Fallo al borrar producto: ${
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.message ||
          "Ocurrió un error desconocido."
        }`
      );
      setDeletingProductId(null);
    }
  };

  const availableProducts = allProducts.filter((p) => p.isAvailable);
  const unavailableProducts = allProducts.filter((p) => !p.isAvailable);

  const getToggleButtonLabel = (isAvailable: boolean): string => {
    return isAvailable ? "Desactivar" : "Activar";
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestiona tus Productos</h2>

      <Link to="/admin/products/new">
        <button className={styles.addProductButton}>
          Añadir Nuevo Producto
        </button>
      </Link>

      {loading && <p className={styles.loadingText}>Cargando productos...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <>
          <ProductTable
            products={availableProducts}
            title="Productos Disponibles"
            actionButtonLabel={getToggleButtonLabel}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            isLoading={toggleLoading || !!deletingProductId}
            deletingProductId={deletingProductId}
          />

          <ProductTable
            products={unavailableProducts}
            title="Productos No Disponibles"
            actionButtonLabel={getToggleButtonLabel}
            onToggleAvailability={handleToggleAvailability}
            onEdit={handleEdit}
            onDelete={handleDeleteProduct}
            isUnavailableList={true}
            isLoading={toggleLoading || !!deletingProductId}
            deletingProductId={deletingProductId}
          />
        </>
      )}
    </div>
  );
};

export default ProductListPage;
