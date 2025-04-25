import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";

import styles from "./TenantViewPage.module.css";
import { ApiErrorResponse, ProductDto, TenantPublicInfoDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";

interface TenantViewPageProps {
  subdomain: string;
}

type GroupedProducts = Record<string, ProductDto[]>;

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    setTenantInfo(null);
    setProducts([]);
    const fetchTenantInfo = async () => {
      try {
        const response = await axios.get<TenantPublicInfoDto>(
          `/api/public/tenants/${subdomain}`
        );
        setTenantInfo(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error(
          "Error fetching tenant info:",
          axiosError.response?.data || axiosError.message
        );
        if (axiosError.response?.status === 404) {
          setError(`The bakery "${subdomain}" was not found.`);
        } else {
          setError("An error occurred loading bakery information.");
        }
      } finally {
        setIsLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (tenantInfo && !error) {
      setIsLoadingProducts(true);
      const fetchProducts = async () => {
        try {
          const response = await axios.get<ProductDto[]>(
            `/api/public/tenants/${tenantInfo.subdomain}/products`
          );
          setProducts(response.data);
        } catch (err) {
          console.error("Error fetching products:", err);
          setError((prevError) => prevError || "Could not load products.");
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setIsLoadingProducts(false);
      setProducts([]);
    }
  }, [tenantInfo, error]);

  const groupedProducts = products.reduce((acc, product) => {
    const categoryKey = product.categoryName || "Otros";
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(product);
    return acc;
  }, {} as GroupedProducts);

  const sortedCategories = Object.keys(groupedProducts).sort((a, b) =>
    a.localeCompare(b)
  );

  if (isLoadingTenant) {
    return (
      <div className={styles.loadingOrError}>Loading Bakery Information...</div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingOrError}>
        <h1>Error</h1>
        <p>{error}</p>
        <a href={`http://localhost:${window.location.port}/`}>
          Go back to main page
        </a>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className={styles.loadingOrError}>
        Could not load bakery information.
      </div>
    );
  }

  return (
    <div className={styles.tenantView}>
      <TenantHeader
        tenantName={tenantInfo.name}
        subdomain={tenantInfo.subdomain}
      />

      <main className={styles.catalogContainer}>
        {isLoadingProducts ? (
          <p>Loading products...</p>
        ) : sortedCategories.length === 0 ? (
          <p className={styles.noProducts}>
            No products available at the moment.
          </p>
        ) : (
          sortedCategories.map((categoryName) => (
            <section key={categoryName} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{categoryName}</h2>

              <div className={styles.productGrid}>
                {groupedProducts[categoryName].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default TenantViewPage;
