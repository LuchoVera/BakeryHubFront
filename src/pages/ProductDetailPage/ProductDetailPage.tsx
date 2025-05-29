import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { ProductDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import styles from "./ProductDetailPage.module.css";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import { useAuth } from "../../AuthContext";
import { useCart } from "../../hooks/useCart";
import { useNotification } from "../../hooks/useNotification";
import { LuTag } from "react-icons/lu";

interface ProductDetailPageProps {
  subdomain: string;
}

const apiUrl = "/api";

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ subdomain }) => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { user } = useAuth();
  const { addItemToCart } = useCart();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!subdomain) {
      setError("No se puede cargar información: falta subdominio.");
      setLoadingTenant(false);
      return;
    }
    setLoadingTenant(true);
    setError(null);
    setTenantInfo(null);
    const fetchTenantInfo = async () => {
      const requestUrl = `${apiUrl}/public/tenants/${subdomain}`;
      try {
        const response = await axios.get<TenantPublicInfoDto>(requestUrl);
        setTenantInfo(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError(`La tienda "${subdomain}" no fue encontrada.`);
        } else {
          setError("Ocurrió un error cargando la información de la tienda.");
        }
        setTenantInfo(null);
      } finally {
        setLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (!productId || !subdomain) {
      setError("Falta ID de Producto o Subdominio en la solicitud.");
      setLoadingProduct(false);
      return;
    }
    if (error && !product) {
      setLoadingProduct(false);
      return;
    }

    setLoadingProduct(true);
    setError(null);
    setProduct(null);
    const fetchProductDetails = async () => {
      const requestUrl = `${apiUrl}/Products/${subdomain}/products/${productId}`;
      try {
        const response = await axios.get<ProductDto>(requestUrl);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0]);
        } else {
          setSelectedImage(null);
        }
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError("Producto no encontrado o no disponible.");
        } else {
          setError(
            (prev) =>
              prev || "Ocurrió un error cargando los detalles del producto."
          );
        }
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };
    if (tenantInfo || !error) {
      fetchProductDetails();
    } else {
      setLoadingProduct(false);
    }
  }, [productId, subdomain, tenantInfo, error]);

  const isAdmin = user?.roles?.includes("Admin") ?? false;
  const isButtonDisabled = !product || !product.isAvailable || isAdmin;

  const handleAddToCart = () => {
    if (!product) return;
    if (isAdmin) {
      showNotification(
        "Los administradores no pueden añadir productos al carrito.",
        "info",
        4000
      );
    } else if (product.isAvailable) {
      addItemToCart(product);
      showNotification(
        `'${product.name}' añadido al carrito!`,
        "success",
        3000
      );
    }
  };

  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const isLoading = loadingProduct || loadingTenant;

  if (isLoading) {
    return <div className={styles.message}>Cargando...</div>;
  }
  if (error && !product) {
    return (
      <div className={styles.pageContainerWithError}>
        {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          <p className={styles.errorText}>{error}</p>
          <Link to="/" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }
  if (!product && !isLoading) {
    return (
      <div className={styles.pageContainerWithError}>
        {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          <p>No se pudo cargar la información del producto.</p>
          <Link to="/" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }
  if (!product) return null;

  const leadTimeNumber = Number(product.leadTimeDisplay);
  const leadTimeText =
    product.leadTimeDisplay && leadTimeNumber > 0
      ? `${leadTimeNumber} día${leadTimeNumber > 1 ? "s" : ""}`
      : null;
  return (
    <div>
      <TenantHeader tenantName={tenantInfo?.name ?? ""} />
      <div className={styles.pageContainer}>
        <div className={styles.productDetailLayout}>
          <div className={styles.imageSection}>
            <div className={styles.mainImageContainer}>
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className={styles.mainImage}
                />
              ) : (
                <div className={styles.noImagePlaceholder}>
                  Sin Imagen Disponible
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbnailGallery}>
                {product.images.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(imgUrl)}
                    className={`${styles.thumbnailButton} ${
                      selectedImage === imgUrl ? styles.thumbnailSelected : ""
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${index + 1}`}
                      className={styles.thumbnailImage}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailsSection}>
            <h1 className={styles.productName}>{product.name}</h1>
            <p className={styles.productCategory}>
              Categoría:{" "}
              <Link to={`/?category=${product.categoryId}`}>
                {product.categoryName}
              </Link>
            </p>
            {product.tagNames && product.tagNames.length > 0 && (
              <div className={styles.productTagsContainer}>
                {product.tagNames.map((tagName) => (
                  <span key={tagName} className={styles.tagBadge}>
                    <LuTag className={styles.tagIcon} /> {tagName}
                  </span>
                ))}
              </div>
            )}
            <p className={styles.productPrice}>
              Bs. {product.price.toFixed(2)}
            </p>
            {leadTimeText && (
              <p className={styles.productLeadTime}>
                Pedido con antelación de: {leadTimeText}
              </p>
            )}
            {product.description && (
              <div className={styles.productDescription}>
                <h3>Descripción</h3>
                <p>{product.description}</p>
              </div>
            )}

            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={isButtonDisabled}
              title={
                !product?.isAvailable
                  ? "Producto no disponible"
                  : isAdmin
                  ? "Los administradores no pueden comprar"
                  : "Añadir al carrito"
              }
            >
              {product.isAvailable ? "Añadir al Carrito" : "No Disponible"}
            </button>
          </div>
        </div>
        <div className={styles.backButtonContainer}>
          <Link to="/" className={styles.backLink}>
            <button className={styles.backButton}>
              &larr; Volver al Catálogo
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
