import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./TenantViewPage.module.css";
import { ProductDto, CategoryDto, TagDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategorySidebar from "../../components/CategorySidebar/CategorySidebar";
import FilterPanel, {
  AppliedFilters,
} from "../../components/FilterPanel/FilterPanel";
import { useAuth } from "../../AuthContext";
import { useTenant } from "../../hooks/useTenant";
import { LuFilter, LuX } from "react-icons/lu";
import {
  fetchPublicTenantCategoriesPreferred,
  fetchPublicTenantProducts,
  fetchPublicTenantRecommendations,
  fetchPublicTenantTags,
} from "../../services/apiService";

type GroupedProductsRender = Record<string, ProductDto[]>;

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const TenantViewPage: React.FC = () => {
  const {
    tenantInfo,
    subdomain,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useTenant();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [allTenantTags, setAllTenantTags] = useState<TagDto[]>([]);
  const [isLoadingSecondaryData, setIsLoadingSecondaryData] =
    useState<boolean>(true);
  const [errorSecondaryData, setErrorSecondaryData] = useState<string | null>(
    null
  );

  const [displayedRecommendations, setDisplayedRecommendations] = useState<
    ProductDto[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState<boolean>(false);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    tags: [],
  });

  useEffect(() => {
    if (!tenantInfo) return;

    const fetchPageData = async () => {
      setIsLoadingSecondaryData(true);
      setErrorSecondaryData(null);
      try {
        const [categoriesData, tagsData] = await Promise.all([
          fetchPublicTenantCategoriesPreferred(subdomain),
          fetchPublicTenantTags(subdomain),
        ]);
        setAllCategories(categoriesData || []);
        setAllTenantTags(tagsData || []);
      } catch (err) {
        setErrorSecondaryData(
          "No se pudieron cargar las categorías o etiquetas."
        );
      } finally {
        setIsLoadingSecondaryData(false);
      }
    };
    fetchPageData();
  }, [tenantInfo, subdomain]);

  const performProductFetch = useCallback(async () => {
    if (!tenantInfo) return;

    setIsLoadingSecondaryData(true);
    setErrorSecondaryData(null);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.categoryId)
        params.append("categoryId", appliedFilters.categoryId);
      if (appliedFilters.minPrice)
        params.append("minPrice", appliedFilters.minPrice);
      if (appliedFilters.maxPrice)
        params.append("maxPrice", appliedFilters.maxPrice);
      appliedFilters.tags.forEach((tag) => params.append("tags", tag));

      const productData = await fetchPublicTenantProducts(subdomain, params);
      setProducts(productData || []);
    } catch (err) {
      setErrorSecondaryData("No se pudieron cargar los productos.");
    } finally {
      setIsLoadingSecondaryData(false);
    }
  }, [tenantInfo, subdomain, appliedFilters]);

  useEffect(() => {
    if (!isLoadingTenant && tenantInfo) {
      performProductFetch();
    }
  }, [performProductFetch, isLoadingTenant, tenantInfo]);

  useEffect(() => {
    if (isAuthenticated && tenantInfo) {
      setLoadingRecommendations(true);
      fetchPublicTenantRecommendations(subdomain)
        .then((data) => {
          const shuffled = shuffleArray(data || []);
          setDisplayedRecommendations(shuffled.slice(0, 6));
        })
        .catch(() => setDisplayedRecommendations([]))
        .finally(() => setLoadingRecommendations(false));
    }
  }, [isAuthenticated, tenantInfo, subdomain]);

  const handleApplyFilters = (newFilters: AppliedFilters) => {
    setAppliedFilters((prev) => ({
      ...prev,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      tags: newFilters.tags,
    }));
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      minPrice: null,
      maxPrice: null,
      tags: [],
    }));
    setIsFilterPanelOpen(false);
  };

  const handleSelectCategory = (categoryId: string | null) => {
    setAppliedFilters((prev) => ({ ...prev, categoryId: categoryId }));
    setIsFilterPanelOpen(false);
  };

  const arePriceOrTagFiltersApplied = useMemo(() => {
    return (
      appliedFilters.minPrice !== null ||
      appliedFilters.maxPrice !== null ||
      appliedFilters.tags.length > 0
    );
  }, [appliedFilters]);

  const areFiltersActive = useMemo(() => {
    return appliedFilters.categoryId !== null || arePriceOrTagFiltersApplied;
  }, [appliedFilters.categoryId, arePriceOrTagFiltersApplied]);

  const groupedProductsRender = useMemo(() => {
    if (appliedFilters.categoryId) {
      const category = allCategories.find(
        (c) => c.id === appliedFilters.categoryId
      );
      return category ? { [category.name]: products } : {};
    }

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
  }, [products, allCategories, appliedFilters.categoryId]);

  const renderContent = () => {
    const isLoading = isLoadingTenant || isLoadingSecondaryData;
    if (isLoading) {
      return (
        <div className={styles.contentWrapper}>
          <p className={styles.loadingOrError}>Cargando productos...</p>
        </div>
      );
    }
    if (errorSecondaryData) {
      return (
        <div className={styles.contentWrapper}>
          <p className={styles.loadingOrError}>{errorSecondaryData}</p>
        </div>
      );
    }
    if (products.length === 0) {
      let message = "";
      if (arePriceOrTagFiltersApplied) {
        message = "No se encontraron productos con los filtros actuales.";
      } else if (appliedFilters.categoryId) {
        message = "No hay productos disponibles en esta categoría.";
      } else {
        message = "No se encontraron productos.";
      }
      return (
        <div className={styles.contentWrapper}>
          <p className={styles.noProducts}>{message}</p>
        </div>
      );
    }

    if (areFiltersActive) {
      return (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      );
    }

    return Object.entries(groupedProductsRender).map(
      ([categoryName, productsInCategory]) => {
        if (productsInCategory.length === 0) return null;
        const category = allCategories.find((c) => c.name === categoryName);
        return (
          <section
            key={category?.id || categoryName}
            id={category?.id}
            className={styles.categorySection}
          >
            <h2 className={styles.categoryTitle}>{categoryName}</h2>
            <div className={styles.productGrid}>
              {productsInCategory.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      }
    );
  };

  if (isLoadingTenant && !tenantInfo) {
    return <div className={styles.loadingOrError}>Cargando Tienda...</div>;
  }

  if (tenantError) {
    return (
      <div className={styles.loadingOrError}>
        <h1>Error</h1>
        <p>{tenantError}</p>
      </div>
    );
  }

  return (
    <div className={styles.tenantView}>
      <TenantHeader />
      <div className={styles.pageLayout}>
        {allCategories.length > 0 && (
          <CategorySidebar
            categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
            selectedCategoryId={appliedFilters.categoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}
        <main className={styles.productsArea}>
          <div className={styles.productsAreaContent}>
            <div className={styles.filterControlsContainer}>
              <div className={styles.filterButtonContainer}>
                <button
                  onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                  className={`${styles.filterToggleButton} ${
                    arePriceOrTagFiltersApplied ? styles.filterButtonActive : ""
                  }`}
                >
                  <LuFilter /> Filtros {isFilterPanelOpen ? <LuX /> : null}
                </button>
              </div>
              {isFilterPanelOpen && (
                <FilterPanel
                  allCategories={allCategories}
                  allTags={allTenantTags}
                  initialFilters={appliedFilters}
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                  showCategoryFilter={false}
                  isLoading={isLoadingSecondaryData}
                />
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
            {isAuthenticated && loadingRecommendations && !areFiltersActive && (
              <p className={styles.loadingText}>Cargando recomendaciones...</p>
            )}

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantViewPage;
