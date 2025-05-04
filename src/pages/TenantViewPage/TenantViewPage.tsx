import React, { useState, useEffect, useMemo } from "react";
import axios, { AxiosError } from "axios";
import styles from "./TenantViewPage.module.css";
import { ApiErrorResponse, ProductDto, TenantPublicInfoDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategorySidebar from "../../components/CategorySidebar/CategorySidebar";
import { useAuth } from "../../AuthContext";

interface TenantViewPageProps {
  subdomain: string;
}

interface CategoryLinkData {
  id: string;
  name: string;
}

type GroupedProductsRender = Record<string, ProductDto[]>;

const apiUrl = "/api";

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryLinks, setCategoryLinks] = useState<CategoryLinkData[]>([]);

  const { isAuthenticated } = useAuth();
  const [allRecommendations, setAllRecommendations] = useState<ProductDto[]>(
    []
  );
  const [displayedRecommendations, setDisplayedRecommendations] = useState<
    ProductDto[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState<boolean>(false);

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
          const fetchedProducts = response.data || [];
          setProducts(fetchedProducts);

          const grouped = fetchedProducts.reduce((acc, product) => {
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

  useEffect(() => {
    if (isAuthenticated && subdomain) {
      setLoadingRecommendations(true);

      setAllRecommendations([]);
      setDisplayedRecommendations([]);

      const fetchRecommendations = async () => {
        try {
          const response = await axios.get<ProductDto[]>(
            `${apiUrl}/public/tenants/${subdomain}/recommendations`,
            { withCredentials: true }
          );
          setAllRecommendations(response.data || []);
        } catch (err) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          if (
            axiosError.response?.status !== 401 &&
            axiosError.response?.status !== 404
          ) {
            console.error(
              "Failed to fetch recommendations:",
              axiosError.response?.data || axiosError.message
            );
          }
          setAllRecommendations([]);
        } finally {
          setLoadingRecommendations(false);
        }
      };
      fetchRecommendations();
    } else {
      setAllRecommendations([]);
      setDisplayedRecommendations([]);
      setLoadingRecommendations(false);
    }
  }, [isAuthenticated, subdomain]);

  useEffect(() => {
    if (allRecommendations.length > 0) {
      const shuffled = shuffleArray(allRecommendations);

      setDisplayedRecommendations(shuffled.slice(0, 6));
    } else {
      setDisplayedRecommendations([]);
    }
  }, [allRecommendations]);

  const groupedProductsRender = useMemo(
    () =>
      products.reduce((acc, product) => {
        const categoryKey = product.categoryName || "Otros";
        if (!acc[categoryKey]) acc[categoryKey] = [];
        acc[categoryKey].push(product);
        return acc;
      }, {} as GroupedProductsRender),
    [products]
  );

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
        <h1>Error</h1> <p>{error}</p>{" "}
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
            {isAuthenticated &&
              !loadingRecommendations &&
              displayedRecommendations.length > 0 && (
                <section
                  className={styles.recommendationSection}
                  id="recommendations"
                >
                  <h2 className={styles.categoryTitle}>Recomendado para ti</h2>
                  <div className={styles.productGrid}>
                    {displayedRecommendations.map((product) => (
                      <ProductCard
                        key={`rec-${product.id}`}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              )}
            {isAuthenticated && loadingRecommendations && (
              <p className={styles.loadingText}>Cargando recomendaciones...</p>
            )}

            {isLoadingProducts ? (
              <p className={styles.loadingOrError}>Cargando productos...</p>
            ) : categoryLinks.length === 0 && products.length > 0 ? (
              <section
                key="todos"
                id="todos"
                className={styles.categorySection}
              >
                <h2 className={styles.categoryTitle}>Productos</h2>
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
