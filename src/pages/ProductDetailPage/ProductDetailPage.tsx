import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { ProductDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import styles from "./ProductDetailPage.module.css";
import TenantHeader from "../../components/TenantHeader/TenantHeader";

const apiUrl = "/api";

interface ProductDetailPageProps {
  subdomain: string;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ subdomain }) => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain) {
      setError("No se puede cargar información: falta subdominio.");
      setLoadingTenant(false);
      return;
    }
    setLoadingTenant(true);
    const fetchTenantInfo = async () => {
      const requestUrl = `${apiUrl}/public/tenants/${subdomain}`;
      try {
        const response = await axios.get<TenantPublicInfoDto>(requestUrl);
        setTenantName(response.data.name);
      } catch (err) {
        setError(
          (prev) => prev || "No se pudo cargar la información de la tienda."
        );
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
    setLoadingProduct(true);
    const fetchProductDetails = async () => {
      const requestUrl = `${apiUrl}/Products/${subdomain}/products/${productId}`;
      try {
        const response = await axios.get<ProductDto>(requestUrl);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0]);
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
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProductDetails();
  }, [productId, subdomain]);

  const isLoading = loadingProduct || loadingTenant;

  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  if (isLoading) {
    return <div className={styles.message}>Cargando...</div>;
  }

  if (error) {
    return (
      <div className={styles.pageContainerWithError}>
        {tenantName && <TenantHeader tenantName={tenantName} />}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          <p className={styles.errorText}>{error}</p>
          <Link to="/" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !tenantName) {
    return (
      <div className={styles.pageContainerWithError}>
        {tenantName && <TenantHeader tenantName={tenantName} />}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          {!tenantName
            ? "No se pudo cargar la información de la tienda."
            : "No se pudieron cargar los datos del producto."}
          <br />
          <Link to="/" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const leadTimeNumber = Number(product.leadTimeDisplay);
  const leadTimeText =
    product.leadTimeDisplay && leadTimeNumber > 0
      ? `${leadTimeNumber} día${leadTimeNumber > 1 ? "s" : ""}`
      : null;

  return (
    <div>
      <TenantHeader tenantName={tenantName} />
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
              disabled={!product.isAvailable}
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
