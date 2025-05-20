import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";
import styles from "./TenantViewPage.module.css";
import {
  ApiErrorResponse,
  ProductDto,
  TenantPublicInfoDto,
  CategoryDto,
} from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategorySidebar from "../../components/CategorySidebar/CategorySidebar";
import { useAuth } from "../../AuthContext";
import { LuFilter, LuX } from "react-icons/lu";

const apiUrl = "/api";

type GroupedProductsRender = Record<string, ProductDto[]>;

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

interface TenantViewPageProps {
  subdomain: string;
}

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [allRecommendations, setAllRecommendations] = useState<ProductDto[]>(
    []
  );
  const [displayedRecommendations, setDisplayedRecommendations] = useState<
    ProductDto[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [appliedMinPrice, setAppliedMinPrice] = useState<string | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string | null>(null);
  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    setTenantInfo(null);
    setProducts([]);
    setAllCategories([]);
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
        setTenantInfo(null);
      } finally {
        setIsLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (tenantInfo && !error) {
      setIsLoadingCategories(true);
      const fetchCategoriesForView = async () => {
        let categoriesData: CategoryDto[] = [];
        let fallbackNeeded = !isAuthenticated;

        if (isAuthenticated) {
          try {
            const response = await axios.get<CategoryDto[]>(
              `${apiUrl}/public/tenants/${subdomain}/categories/preferred`,
              { withCredentials: true }
            );
            if (response.data && response.data.length > 0) {
              categoriesData = response.data;
            } else {
              fallbackNeeded = true;
            }
          } catch (preferredErr) {
            fallbackNeeded = true;
          }
        }

        if (fallbackNeeded) {
          try {
            const productsResponse = await axios.get<ProductDto[]>(
              `${apiUrl}/public/tenants/${tenantInfo.subdomain}/products`
            );
            const fetchedProducts = productsResponse.data || [];
            const categoriesMap = new Map<string, string>();
            fetchedProducts.forEach((p) => {
              if (
                p.categoryId &&
                p.categoryName &&
                !categoriesMap.has(p.categoryId)
              ) {
                categoriesMap.set(p.categoryId, p.categoryName);
              }
            });
            categoriesData = Array.from(categoriesMap.entries()).map(
              ([id, name]) => ({ id, name })
            );
            categoriesData.sort((a, b) => a.name.localeCompare(b.name));
          } catch (fallbackErr) {
            console.error("Fallback for categories failed:", fallbackErr);
          }
        }
        setAllCategories(categoriesData);
        setIsLoadingCategories(false);
      };
      fetchCategoriesForView();
    } else if (!tenantInfo && !isLoadingTenant) {
      setIsLoadingCategories(false);
      setAllCategories([]);
    }
  }, [tenantInfo, error, isAuthenticated, subdomain]);

  const fetchProducts = useCallback(async () => {
    if (!tenantInfo || error) {
      setIsLoadingProducts(false);
      return;
    }
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append("categoryId", selectedCategoryId);
      }
      if (appliedMinPrice) {
        params.append("minPrice", appliedMinPrice);
      }
      if (appliedMaxPrice) {
        params.append("maxPrice", appliedMaxPrice);
      }

      const queryString = params.toString();
      const productUrl = `${apiUrl}/public/tenants/${
        tenantInfo.subdomain
      }/products${queryString ? `?${queryString}` : ""}`;

      const response = await axios.get<ProductDto[]>(productUrl);
      setProducts(response.data || []);
      if (error && response.data) setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (!error) {
        setError(
          axiosError.response?.data?.detail ||
            axiosError.message ||
            "No se pudieron cargar los productos."
        );
      }
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [tenantInfo, error, selectedCategoryId, appliedMinPrice, appliedMaxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (isAuthenticated && subdomain && tenantInfo) {
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
  }, [isAuthenticated, subdomain, tenantInfo]);

  useEffect(() => {
    if (allRecommendations.length > 0) {
      const shuffled = shuffleArray(allRecommendations);
      setDisplayedRecommendations(shuffled.slice(0, 6));
    } else {
      setDisplayedRecommendations([]);
    }
  }, [allRecommendations]);

  const groupedProductsRender = useMemo(() => {
    const initialGroup: GroupedProductsRender = {};
    allCategories.forEach((cat) => {
      initialGroup[cat.name] = [];
    });

    return products.reduce((acc, product) => {
      const categoryKey = product.categoryName || "Otros";
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(product);
      return acc;
    }, initialGroup);
  }, [products, allCategories]);

  const categoryLinksForSidebar = useMemo(() => {
    return allCategories.map((cat) => ({ id: cat.id, name: cat.name }));
  }, [allCategories]);

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const toggleFilterPanel = () => {
    if (!isFilterPanelOpen) {
      setTempMinPrice(appliedMinPrice || "");
      setTempMaxPrice(appliedMaxPrice || "");
    }
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const handleApplyFilters = () => {
    const min = parseFloat(tempMinPrice);
    const max = parseFloat(tempMaxPrice);

    if (tempMinPrice && (isNaN(min) || min < 0)) {
      alert("Precio mínimo inválido.");
      return;
    }
    if (tempMaxPrice && (isNaN(max) || max < 0)) {
      alert("Precio máximo inválido.");
      return;
    }
    if (!isNaN(min) && !isNaN(max) && min > max) {
      alert("El precio mínimo no puede ser mayor al máximo.");
      return;
    }

    setAppliedMinPrice(tempMinPrice || null);
    setAppliedMaxPrice(tempMaxPrice || null);
    setIsFilterPanelOpen(false);
  };

  const handleClearPanelFilters = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
  };

  const areFiltersActive = useMemo(() => {
    return (
      selectedCategoryId !== null ||
      appliedMinPrice !== null ||
      appliedMaxPrice !== null
    );
  }, [selectedCategoryId, appliedMinPrice, appliedMaxPrice]);

  if (isLoadingTenant) {
    return (
      <div className={styles.loadingOrError}>
        Cargando Información de la Tienda...
      </div>
    );
  }
  if (error && !tenantInfo) {
    const { protocol, port } = window.location;
    const baseHost = window.location.hostname.endsWith(".localhost")
      ? "localhost"
      : window.location.hostname;
    const baseUrl = `${protocol}//${baseHost}${port ? ":" + port : ""}/`;
    return (
      <div className={styles.loadingOrError}>
        <h1>Error</h1>
        <p>{error}</p>
        <a href={baseUrl}>Volver a la página principal</a>
      </div>
    );
  }
  if (!tenantInfo && !isLoadingTenant) {
    return (
      <div className={styles.loadingOrError}>
        No se pudo cargar la información de la tienda.
      </div>
    );
  }

  return (
    <div className={styles.tenantView}>
      {" "}
      <TenantHeader tenantName={tenantInfo?.name ?? "Cargando..."} />{" "}
      <div className={styles.pageLayout}>
        {" "}
        {!isLoadingCategories && categoryLinksForSidebar.length > 0 && (
          <CategorySidebar
            categories={categoryLinksForSidebar}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}
        {isLoadingCategories && !error && tenantInfo && (
          <div
            className={styles.productsArea}
            style={{ textAlign: "center", paddingTop: "50px" }}
          >
            Cargando categorías...
          </div>
        )}
        <main className={styles.productsArea} id="product-area-start">
          {" "}
          <div className={styles.productsAreaContent}>
            {" "}
            {error &&
              products.length === 0 &&
              !isLoadingProducts &&
              tenantInfo && <p className={styles.loadingOrError}>{error}</p>}
            <div className={styles.filterControlsContainer}>
              {" "}
              <div className={styles.filterButtonContainer}>
                {" "}
                <button
                  onClick={toggleFilterPanel}
                  className={`${styles.filterToggleButton} ${
                    (appliedMinPrice || appliedMaxPrice) && !selectedCategoryId
                      ? styles.filterButtonActive
                      : ""
                  }`}
                  disabled={isLoadingProducts}
                >
                  <LuFilter /> Filtros de Precio
                  {isFilterPanelOpen ? <LuX /> : null}
                </button>
              </div>
              {isFilterPanelOpen && (
                <div className={styles.filterPanelHorizontal}>
                  {" "}
                  <div className={styles.filterPriceGroup}>
                    {" "}
                    <label htmlFor="minPrice" className={styles.filterLabel}>
                      {" "}
                      Mín (Bs.):
                    </label>
                    <input
                      type="number"
                      id="minPrice"
                      min="0"
                      step="1"
                      placeholder="Ej: 10"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterPriceGroup}>
                    <label htmlFor="maxPrice" className={styles.filterLabel}>
                      Máx (Bs.):
                    </label>
                    <input
                      type="number"
                      id="maxPrice"
                      min="0"
                      step="1"
                      placeholder="Ej: 100"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterActionButtonsHorizontal}>
                    {" "}
                    <button
                      onClick={handleApplyFilters}
                      className={styles.applyButtonSmall}
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={handleClearPanelFilters}
                      className={styles.clearButtonSmall}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isAuthenticated &&
              !loadingRecommendations &&
              displayedRecommendations.length > 0 &&
              !areFiltersActive && (
                <section
                  className={styles.recommendationSection}
                  id="recommendations"
                >
                  <h2 className={styles.categoryTitle}>Recomendado para ti</h2>{" "}
                  <div className={styles.productGrid}>
                    {" "}
                    {displayedRecommendations.map((product) => (
                      <ProductCard
                        key={`rec-${product.id}`}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              )}
            {isAuthenticated && loadingRecommendations && !areFiltersActive && (
              <p className={styles.loadingText}>Cargando recomendaciones...</p>
            )}
            {isLoadingProducts && !error && (
              <p className={styles.loadingOrError}>Cargando productos...</p>
            )}
            {!isLoadingProducts && products.length === 0 && !error && (
              <p className={styles.noProducts}>
                {" "}
                No se encontraron productos que coincidan con los filtros
                seleccionados.
              </p>
            )}
            {!isLoadingProducts &&
              !error &&
              products.length > 0 &&
              allCategories.map(({ name: categoryName, id: categoryId }) => {
                const productsInCategory =
                  groupedProductsRender[categoryName] || [];

                if (selectedCategoryId && selectedCategoryId !== categoryId) {
                  return null;
                }
                if (productsInCategory.length === 0) {
                  if (selectedCategoryId === categoryId) {
                    return (
                      <section
                        key={categoryId}
                        className={styles.categorySection}
                        id={categoryId}
                      >
                        {" "}
                        <h2 className={styles.categoryTitle}>
                          {categoryName}
                        </h2>{" "}
                        <p className={styles.noProducts}>
                          No hay productos en esta categoría con los filtros de
                          precio aplicados.
                        </p>{" "}
                      </section>
                    );
                  }
                  return null;
                }

                return (
                  <section
                    key={categoryId}
                    id={categoryId}
                    className={styles.categorySection}
                  >
                    <h2 className={styles.categoryTitle}>{categoryName}</h2>{" "}
                    <div className={styles.productGrid}>
                      {" "}
                      {productsInCategory.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantViewPage;
