import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import styles from "./TenantViewPage.module.css";
import { ApiErrorResponse, ProductDto, TenantPublicInfoDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategorySidebar from "../../components/CategorySidebar/CategorySidebar";

interface TenantViewPageProps {
  subdomain: string;
}

interface CategoryLinkData {
  id: string;
  name: string;
}

type GroupedProductsRender = Record<string, ProductDto[]>;

const apiUrl = "/api";

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryLinks, setCategoryLinks] = useState<CategoryLinkData[]>([]);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    setTenantInfo(null);
    setProducts([]);
    setCategoryLinks([]);
    const fetchTenantInfo = async () => {
      try {
        const response = await axios.get<TenantPublicInfoDto>(
          `${apiUrl}/public/tenants/${subdomain}`
        );
        setTenantInfo(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError(`La tienda "${subdomain}" no fue encontrada.`);
        } else {
          setError("Ocurrió un error cargando la información de la tienda.");
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

          const grouped = response.data.reduce((acc, product) => {
            const categoryKey = product.categoryName || "Otros";
            const categoryId = categoryKey
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            if (!acc[categoryKey]) {
              acc[categoryKey] = { id: categoryId || "otros", items: [] };
            }
            acc[categoryKey].items.push(product);
            return acc;
          }, {} as Record<string, { id: string; items: ProductDto[] }>);

          const sortedNames = Object.keys(grouped).sort((a, b) =>
            a.localeCompare(b)
          );
          const links = sortedNames.map((name) => ({
            name,
            id: grouped[name].id,
          }));
          setCategoryLinks(links);
        } catch (err) {
          setError(
            (prevError) => prevError || "No se pudieron cargar los productos."
          );
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setIsLoadingProducts(false);
      setProducts([]);
      setCategoryLinks([]);
    }
  }, [tenantInfo, error]);

  const groupedProductsRender = products.reduce((acc, product) => {
    const categoryKey = product.categoryName || "Otros";
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(product);
    return acc;
  }, {} as GroupedProductsRender);

  if (isLoadingTenant) {
    return (
      <div className={styles.loadingOrError}>
        Cargando Información de la Tienda...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingOrError}>
        <h1>Error</h1>
        <p>{error}</p>
        <a href={`/`}>Volver a la página principal</a>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className={styles.loadingOrError}>
        No se pudo cargar la información de la tienda.
      </div>
    );
  }

  return (
    <div className={styles.tenantView}>
      <TenantHeader tenantName={tenantInfo.name} />
      <div className={styles.pageLayout}>
        <CategorySidebar categories={categoryLinks} />
        <main className={styles.productsArea}>
          <div className={styles.productsAreaContent}>
            {isLoadingProducts ? (
              <p className={styles.loadingOrError}>Cargando productos...</p>
            ) : categoryLinks.length === 0 && products.length > 0 ? (
              <section
                key="otros"
                id="otros"
                className={styles.categorySection}
              >
                <h2 className={styles.categoryTitle}>Otros</h2>
                <div className={styles.productGrid}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ) : categoryLinks.length === 0 ? (
              <p className={styles.noProducts}>
                No hay productos disponibles por el momento.
              </p>
            ) : (
              categoryLinks.map(({ name: categoryName, id: categoryId }) => (
                <section
                  key={categoryId}
                  id={categoryId}
                  className={styles.categorySection}
                >
                  <h2 className={styles.categoryTitle}>{categoryName}</h2>
                  <div className={styles.productGrid}>
                    {(groupedProductsRender[categoryName] || []).map(
                      (product) => (
                        <ProductCard key={product.id} product={product} />
                      )
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantViewPage;
