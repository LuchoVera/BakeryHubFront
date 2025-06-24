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
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchPublicTenantCategoriesPreferred,
  fetchPublicTenantProducts,
  fetchPublicTenantRecommendations,
  fetchPublicTenantTags,
  fetchPublicTenantCategories,
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
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [allTenantProducts, setAllTenantProducts] = useState<ProductDto[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [allTenantTags, setAllTenantTags] = useState<TagDto[]>([]);
  const [isInitialDataLoading, setIsInitialDataLoading] =
    useState<boolean>(true);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
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
    const params = new URLSearchParams(location.search);
    const categoryIdFromUrl = params.get("category");
    setAppliedFilters((prevFilters) => ({
      ...prevFilters,
      categoryId: categoryIdFromUrl,
    }));
  }, [location.search]);

  useEffect(() => {
    if (!tenantInfo) return;

    const fetchPageData = async () => {
      setIsInitialDataLoading(true);
      setErrorSecondaryData(null);
      try {
        const categoriesPromise = isAuthenticated
          ? fetchPublicTenantCategoriesPreferred(subdomain)
          : fetchPublicTenantCategories(subdomain);

        const [categoriesData, tagsData, allProductsData] = await Promise.all([
          categoriesPromise,
          fetchPublicTenantTags(subdomain),
          fetchPublicTenantProducts(subdomain),
        ]);
        setAllCategories(categoriesData || []);
        setAllTenantTags(tagsData || []);
        setAllTenantProducts(allProductsData || []);
      } catch (err) {
        setErrorSecondaryData("No se pudieron cargar los datos de la tienda.");
      } finally {
        setIsInitialDataLoading(false);
      }
    };
    fetchPageData();
  }, [tenantInfo, subdomain, isAuthenticated]);

  const performProductFetch = useCallback(async () => {
    if (!tenantInfo) return;
    const noFilters =
      !appliedFilters.categoryId &&
      !appliedFilters.minPrice &&
      !appliedFilters.maxPrice &&
      appliedFilters.tags.length === 0;

    if (noFilters) {
      setProducts(allTenantProducts);
      return;
    }

    setIsFiltering(true);
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
      setIsFiltering(false);
    }
  }, [tenantInfo, subdomain, appliedFilters, allTenantProducts]);

  useEffect(() => {
    if (isInitialDataLoading) return;
    performProductFetch();
  }, [appliedFilters, isInitialDataLoading, performProductFetch]);

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

  const categoriesWithProducts = useMemo(() => {
    if (allTenantProducts.length === 0) {
      return allCategories;
    }
    const activeCategoryIds = new Set(
      allTenantProducts.map((p) => p.categoryId)
    );
    return allCategories.filter((cat) => activeCategoryIds.has(cat.id));
  }, [allTenantProducts, allCategories]);

  const handleApplyFilters = (newFilters: AppliedFilters) => {
    setAppliedFilters((prev) => ({
      ...prev,
      categoryId: prev.categoryId,
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
    const params = new URLSearchParams(location.search);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    navigate({ search: params.toString() }, { replace: true });
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
    const isLoading = isLoadingTenant || isInitialDataLoading || isFiltering;
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
        message = "Esta tienda aún no tiene productos disponibles.";
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
            categories={categoriesWithProducts.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
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
                  isLoading={isInitialDataLoading}
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
