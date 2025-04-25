import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";

import { ProductDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import styles from "./ProductDetailPage.module.css";

import TenantHeader from "../../components/TenantHeader/TenantHeader";

const productApiBaseUrl = "http://localhost:5176/api/Products";
const tenantApiBaseUrl = "http://localhost:5176/api/public/tenants";

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
      setError("Cannot load bakery information: subdomain missing.");
      setLoadingTenant(false);
      return;
    }
    setLoadingTenant(true);
    const fetchTenantInfo = async () => {
      const requestUrl = `${tenantApiBaseUrl}/${subdomain}`;
      try {
        const response = await axios.get<TenantPublicInfoDto>(requestUrl);
        setTenantName(response.data.name);
      } catch (err) {
        setError((prev) => prev || "Could not load bakery information.");
      } finally {
        setLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (!productId || !subdomain) {
      setError("Product ID or Subdomain is missing in the request.");
      setLoadingProduct(false);
      return;
    }

    setLoadingProduct(true);

    const fetchProductDetails = async () => {
      const requestUrl = `${productApiBaseUrl}/${subdomain}/products/${productId}`;

      try {
        const response = await axios.get<ProductDto>(requestUrl);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0]);
        }
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError("Product not found or it's not available.");
        } else {
          setError(
            (prev) => prev || "An error occurred loading product details."
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
    return <div className={styles.message}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.pageContainerWithError}>
        {" "}
        {tenantName && (
          <TenantHeader tenantName={tenantName} subdomain={subdomain} />
        )}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          {" "}
          <p className={styles.errorText}>{error}</p>
          <Link to="/" className={styles.backLink}>
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !tenantName) {
    return (
      <div className={styles.pageContainerWithError}>
        {tenantName && (
          <TenantHeader tenantName={tenantName} subdomain={subdomain} />
        )}
        <div className={styles.message} style={{ paddingTop: "20px" }}>
          {!tenantName
            ? "Could not load bakery information."
            : "Product data could not be loaded."}
          <br />
          <Link to="/" className={styles.backLink}>
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TenantHeader tenantName={tenantName} subdomain={subdomain} />

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
                  No Image Available
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
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
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
              Category:{" "}
              <Link to={`/?category=${product.categoryId}`}>
                {product.categoryName}
              </Link>
            </p>

            <p className={styles.productPrice}>${product.price.toFixed(2)}</p>

            {product.leadTimeDisplay && Number(product.leadTimeDisplay) > 0 && (
              <p className={styles.productLeadTime}>
                Preparation: {product.leadTimeDisplay} day
                {Number(product.leadTimeDisplay) > 1 ? "s" : ""}
              </p>
            )}

            {product.description && (
              <div className={styles.productDescription}>
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            <button
              className={styles.addToCartButton}
              disabled={!product.isAvailable}
            >
              {product.isAvailable ? "Add to Cart" : "Currently Unavailable"}
            </button>
          </div>
        </div>

        <div className={styles.backButtonContainer}>
          <Link to="/" className={styles.backLink}>
            <button className={styles.backButton}>
              &larr; Back to Catalog
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
