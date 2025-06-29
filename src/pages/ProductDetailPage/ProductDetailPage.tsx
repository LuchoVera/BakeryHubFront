import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductDto } from "../../types";
import styles from "./ProductDetailPage.module.css";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import { useAuth } from "../../AuthContext";
import { useCart } from "../../hooks/useCart";
import { useNotification } from "../../hooks/useNotification";
import { useTenant } from "../../hooks/useTenant";
import { useIsMobile } from "../../hooks/useIsMobile";
import { LuTag } from "react-icons/lu";
import { fetchPublicProductDetail } from "../../services/apiService";
import { AxiosError } from "axios";

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const {
    subdomain,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useTenant();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(true);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { user } = useAuth();
  const { addItemToCart } = useCart();
  const { showNotification } = useNotification();
  const isMobile = useIsMobile();
  const MAX_TAG_LENGTH_MOBILE = 25;

  useEffect(() => {
    if (!productId || !subdomain) {
      setErrorProduct("Falta información para cargar el producto.");
      return;
    }

    const fetchProductData = async () => {
      setIsLoadingProduct(true);
      setErrorProduct(null);
      try {
        const productData = await fetchPublicProductDetail(
          subdomain,
          productId
        );
        setProduct(productData);
        if (productData.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0]);
        }
      } catch (err) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          setErrorProduct("Producto no encontrado.");
        } else {
          setErrorProduct("Ocurrió un error cargando el producto.");
        }
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProductData();
  }, [productId, subdomain]);

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

  if (isLoadingTenant || isLoadingProduct) {
    return <div className={styles.message}>Cargando...</div>;
  }

  const error = tenantError || errorProduct;
  if (error) {
    return (
      <div className={styles.pageContainerWithError}>
        <TenantHeader />
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          <p className={styles.errorText}>{error}</p>
          <Link to="/" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const leadTimeNumber = Number(product.leadTimeDisplay);
  const leadTimeText =
    product.leadTimeDisplay && leadTimeNumber > 0
      ? `${leadTimeNumber} día${leadTimeNumber > 1 ? "s" : ""}`
      : null;

  return (
    <div>
      <TenantHeader />
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
                {product.tagNames.map((tagName) => {
                  const truncatedTagName =
                    isMobile && tagName.length > MAX_TAG_LENGTH_MOBILE
                      ? `${tagName.substring(0, MAX_TAG_LENGTH_MOBILE)}...`
                      : tagName;
                  return (
                    <span
                      key={tagName}
                      className={styles.tagBadge}
                      title={tagName}
                    >
                      <LuTag className={styles.tagIcon} /> {truncatedTagName}
                    </span>
                  );
                })}
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
