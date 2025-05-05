import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import {
  ProductDto,
  TenantPublicInfoDto,
  ApiErrorResponse,
  CategoryDto,
} from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import styles from "./SearchResultsPage.module.css";
import { LuFilter, LuX } from "react-icons/lu";

interface SearchResultsPageProps {
  subdomain: string;
}

const apiUrl = "/api";

interface AppliedFilters {
  categoryId: string | null;
  minPrice: string | null;
  maxPrice: string | null;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [tempFilterCategoryId, setTempFilterCategoryId] = useState<string>("");
  const [tempFilterMinPrice, setTempFilterMinPrice] = useState<string>("");
  const [tempFilterMaxPrice, setTempFilterMaxPrice] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    categoryId: null,
    minPrice: null,
    maxPrice: null,
  });

  const searchTerm = useMemo(() => {
    return new URLSearchParams(location.search).get("q") || "";
  }, [location.search]);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
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
      const fetchCats = async () => {
        try {
          const response = await axios.get<ProductDto[]>(
            `/api/public/tenants/${tenantInfo.subdomain}/products`
          );
          const fetchedProducts = response.data || [];
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
          const derivedCategories = Array.from(categoriesMap.entries()).map(
            ([id, name]) => ({ id, name })
          );
          derivedCategories.sort((a, b) => a.name.localeCompare(b.name));
          setAllCategories(derivedCategories);
        } catch (catErr) {
          console.error("Could not load categories for filters", catErr);
          setAllCategories([]);
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCats();
    } else {
      setIsLoadingCategories(false);
      setAllCategories([]);
    }
  }, [tenantInfo, error]);

  const fetchSearchResults = useCallback(async () => {
    if (!searchTerm || !tenantInfo) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      if (!searchTerm && tenantInfo && !error)
        setError("Por favor, ingresa un término de búsqueda.");
      return;
    }

    setIsLoadingSearch(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("q", searchTerm);
      if (appliedFilters.categoryId) {
        params.append("categoryId", appliedFilters.categoryId);
      }
      if (appliedFilters.minPrice) {
        params.append("minPrice", appliedFilters.minPrice);
      }
      if (appliedFilters.maxPrice) {
        params.append("maxPrice", appliedFilters.maxPrice);
      }

      const searchUrl = `${apiUrl}/public/tenants/${
        tenantInfo.subdomain
      }/search?${params.toString()}`;
      const response = await axios.get<ProductDto[]>(searchUrl);
      setSearchResults(response.data || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error searching products:",
        axiosError.response?.data || axiosError.message
      );
      setError("Ocurrió un error al realizar la búsqueda.");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [searchTerm, tenantInfo, appliedFilters]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  const handleApplyFilters = () => {
    const min = parseFloat(tempFilterMinPrice);
    const max = parseFloat(tempFilterMaxPrice);
    if (tempFilterMinPrice && (isNaN(min) || min < 0)) {
      alert("Precio mínimo inválido.");
      return;
    }
    if (tempFilterMaxPrice && (isNaN(max) || max < 0)) {
      alert("Precio máximo inválido.");
      return;
    }
    if (!isNaN(min) && !isNaN(max) && min > max) {
      alert("El precio mínimo no puede ser mayor al máximo.");
      return;
    }

    setAppliedFilters({
      categoryId: tempFilterCategoryId || null,
      minPrice: tempFilterMinPrice || null,
      maxPrice: tempFilterMaxPrice || null,
    });
    setIsFilterPanelOpen(false);
  };

  const handleClearPanelFilters = () => {
    setTempFilterCategoryId("");
    setTempFilterMinPrice("");
    setTempFilterMaxPrice("");
    setAppliedFilters({ categoryId: null, minPrice: null, maxPrice: null });
    setIsFilterPanelOpen(false);
  };

  const handleToggleFilterPanel = () => {
    if (!isFilterPanelOpen) {
      setTempFilterCategoryId(appliedFilters.categoryId || "");
      setTempFilterMinPrice(appliedFilters.minPrice || "");
      setTempFilterMaxPrice(appliedFilters.maxPrice || "");
    }
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const areFiltersActive = useMemo(() => {
    return (
      appliedFilters.categoryId !== null ||
      appliedFilters.minPrice !== null ||
      appliedFilters.maxPrice !== null
    );
  }, [appliedFilters]);

  const isLoading = isLoadingTenant || isLoadingSearch || isLoadingCategories;

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}

      <main className={styles.resultsContent}>
        {isLoading && !error && <p className={styles.message}>Cargando...</p>}

        {error && (
          <div className={styles.message}>
            <p className={styles.errorText}>{error}</p>
            {searchTerm && (
              <Link to="/" className={styles.backLink}>
                Volver al Catálogo
              </Link>
            )}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className={styles.titleAndFilter}>
              <h1 className={styles.resultsTitle}>
                {searchTerm
                  ? `Resultados para: "${searchTerm}"`
                  : "Búsqueda de Productos"}
                {searchTerm && !isLoadingSearch && searchResults.length >= 0
                  ? ` (${searchResults.length})`
                  : ""}
              </h1>

              {searchTerm && (
                <button
                  onClick={handleToggleFilterPanel}
                  className={`${styles.filterToggleButton} ${
                    areFiltersActive ? styles.filterButtonActive : ""
                  }`}
                  disabled={isLoadingCategories}
                >
                  <LuFilter /> Filtros {isFilterPanelOpen ? <LuX /> : null}
                </button>
              )}
            </div>

            {isFilterPanelOpen && searchTerm && (
              <div className={styles.filterPanel}>
                <h3>Aplicar Filtros</h3>
                <div className={styles.filterGroup}>
                  <label htmlFor="filterCategory">Categoría:</label>
                  <select
                    id="filterCategory"
                    value={tempFilterCategoryId}
                    onChange={(e) => setTempFilterCategoryId(e.target.value)}
                    disabled={isLoadingCategories}
                  >
                    <option value="">Todas</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingCategories && <small>Cargando categorías...</small>}
                </div>
                <div className={styles.filterGroup}>
                  <label htmlFor="filterMinPrice">Precio Mínimo:</label>
                  <input
                    type="number"
                    id="filterMinPrice"
                    placeholder="Ej: 10"
                    min="0"
                    step="0.01"
                    value={tempFilterMinPrice}
                    onChange={(e) => setTempFilterMinPrice(e.target.value)}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label htmlFor="filterMaxPrice">Precio Máximo:</label>
                  <input
                    type="number"
                    id="filterMaxPrice"
                    placeholder="Ej: 100"
                    min="0"
                    step="0.01"
                    value={tempFilterMaxPrice}
                    onChange={(e) => setTempFilterMaxPrice(e.target.value)}
                  />
                </div>
                <div className={styles.filterActions}>
                  <button
                    onClick={handleApplyFilters}
                    className={styles.applyButton}
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleClearPanelFilters}
                    className={styles.clearButton}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {!searchTerm && !isLoading && (
              <p className={styles.message}>
                Ingresa un término en la barra superior para buscar productos.
              </p>
            )}

            {searchTerm && isLoadingSearch && (
              <p className={styles.message}>Buscando...</p>
            )}

            {searchTerm && !isLoadingSearch && searchResults.length === 0 && (
              <p className={styles.message}>
                No se encontraron productos que coincidan con "{searchTerm}"{" "}
                {areFiltersActive ? " y los filtros aplicados" : ""}.
              </p>
            )}

            {searchTerm && !isLoadingSearch && searchResults.length > 0 && (
              <div className={styles.productGrid}>
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!isLoading && searchTerm && (
              <div className={styles.backButtonContainer}>
                <Link to="/" className={styles.backLink}>
                  <button className={styles.backButton}>
                    &larr; Volver al Catálogo Principal
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchResultsPage;
