import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { ProductDto, CategoryDto, TagDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import FilterPanel, {
  AppliedFilters,
} from "../../components/FilterPanel/FilterPanel";
import styles from "./SearchResultsPage.module.css";
import { LuFilter, LuX } from "react-icons/lu";
import {
  fetchPublicTenantTags,
  searchPublicTenantProducts,
  fetchPublicTenantCategoriesPreferred,
} from "../../services/apiService";
import { useTenant } from "../../hooks/useTenant";

const SearchResultsPage: React.FC = () => {
  const {
    tenantInfo,
    subdomain,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useTenant();
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const location = useLocation();

  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [allTenantTags, setAllTenantTags] = useState<TagDto[]>([]);
  const [isLoadingSecondaryData, setIsLoadingSecondaryData] =
    useState<boolean>(true);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    tags: [],
  });

  const searchTerm = useMemo(() => {
    return new URLSearchParams(location.search).get("q") || "";
  }, [location.search]);

  useEffect(() => {
    if (!tenantInfo) return;

    const fetchSecondaryData = async () => {
      setIsLoadingSecondaryData(true);
      setSearchError(null);
      try {
        const [tagsData, categoriesData] = await Promise.all([
          fetchPublicTenantTags(subdomain),
          fetchPublicTenantCategoriesPreferred(subdomain),
        ]);
        setAllTenantTags(tagsData || []);
        setAllCategories(categoriesData || []);
      } catch (err) {
        setSearchError("No se pudieron cargar los filtros.");
      } finally {
        setIsLoadingSecondaryData(false);
      }
    };
    fetchSecondaryData();
  }, [tenantInfo, subdomain]);

  const performSearch = useCallback(async () => {
    if (
      !tenantInfo ||
      (!searchTerm &&
        appliedFilters.tags.length === 0 &&
        !appliedFilters.categoryId &&
        !appliedFilters.minPrice &&
        !appliedFilters.maxPrice)
    ) {
      setSearchResults([]);
      return;
    }

    setIsLoadingSearch(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (appliedFilters.categoryId)
        params.append("categoryId", appliedFilters.categoryId);
      if (appliedFilters.minPrice)
        params.append("minPrice", appliedFilters.minPrice);
      if (appliedFilters.maxPrice)
        params.append("maxPrice", appliedFilters.maxPrice);
      appliedFilters.tags.forEach((tag) => params.append("tags", tag));

      const results = await searchPublicTenantProducts(subdomain, params);
      setSearchResults(results || []);
    } catch (err) {
      setSearchError("No se pudieron cargar los resultados de búsqueda.");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [searchTerm, tenantInfo, subdomain, appliedFilters]);

  useEffect(() => {
    if (tenantInfo && !isLoadingSecondaryData) {
      performSearch();
    }
  }, [performSearch, tenantInfo, isLoadingSecondaryData]);

  const handleApplyFilters = (filters: AppliedFilters) => {
    setAppliedFilters(filters);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setAppliedFilters({
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      tags: [],
    });
    setIsFilterPanelOpen(false);
  };

  const areAnyFiltersApplied = useMemo(() => {
    return (
      appliedFilters.categoryId !== null ||
      appliedFilters.minPrice !== null ||
      appliedFilters.maxPrice !== null ||
      appliedFilters.tags.length > 0
    );
  }, [appliedFilters]);

  if (isLoadingTenant) {
    return <p className={styles.message}>Cargando...</p>;
  }

  const error = tenantError || searchError;

  return (
    <div className={styles.pageContainer}>
      <TenantHeader />
      <main className={styles.resultsContent}>
        {error && (
          <div className={styles.message}>
            <p className={styles.errorText}>{error}</p>
            <Link to="/" className={styles.backLink}>
              Volver al Catálogo
            </Link>
          </div>
        )}
        {!error && tenantInfo && (
          <>
            <div className={styles.titleAndFilter}>
              <h1 className={styles.resultsTitle}>
                {searchTerm
                  ? `Resultados para: "${searchTerm}"`
                  : "Búsqueda Avanzada"}
                {!isLoadingSearch && searchResults.length >= 0
                  ? ` (${searchResults.length})`
                  : ""}
              </h1>
              <button
                onClick={() => setIsFilterPanelOpen((p) => !p)}
                className={`${styles.filterToggleButton} ${
                  areAnyFiltersApplied ? styles.filterButtonActive : ""
                }`}
                disabled={isLoadingSecondaryData}
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
                isLoading={isLoadingSecondaryData}
              />
            )}
            {isLoadingSearch ? (
              <p className={styles.message}>Buscando...</p>
            ) : searchResults.length > 0 ? (
              <div className={styles.productGrid}>
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className={styles.message}>No se encontraron productos.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchResultsPage;
