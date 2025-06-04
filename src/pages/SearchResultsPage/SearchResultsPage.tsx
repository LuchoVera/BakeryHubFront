import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ProductDto,
  TenantPublicInfoDto,
  ApiErrorResponse,
  CategoryDto,
  TagDto,
  SearchResultsPageProps,
} from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import styles from "./SearchResultsPage.module.css";
import { LuFilter, LuX } from "react-icons/lu";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import {
  fetchPublicTenantInfo,
  fetchPublicTenantTags,
  fetchPublicTenantProducts,
  searchPublicTenantProducts,
} from "../../services/apiService";
import { AxiosError } from "axios";

interface AppliedFilters {
  categoryId: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  tags: string[];
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState<boolean>(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [tempFilterCategoryId, setTempFilterCategoryId] = useState<string>("");
  const [tempFilterMinPrice, setTempFilterMinPrice] = useState<string>("");
  const [tempFilterMaxPrice, setTempFilterMaxPrice] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<TagDto[]>([]);
  const [allTenantTags, setAllTenantTags] = useState<TagDto[]>([]);

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
    setIsLoadingPageData(true);
    setError(null);

    const fetchInitialData = async () => {
      try {
        const tenantData = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(tenantData);

        const [tagsData, productsForCategories] = await Promise.all([
          fetchPublicTenantTags(subdomain),
          fetchPublicTenantProducts(subdomain),
        ]);
        setAllTenantTags(tagsData || []);

        const categoriesMap = new Map<string, string>();
        (productsForCategories || []).forEach((p) => {
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
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError(`La tienda "${subdomain}" no fue encontrada.`);
        } else {
          setError(
            axiosError.response?.data?.detail ||
              axiosError.message ||
              "Ocurrió un error cargando datos iniciales."
          );
        }
        setTenantInfo(null);
        setAllTenantTags([]);
        setAllCategories([]);
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchInitialData();
  }, [subdomain]);

  const performSearch = useCallback(async () => {
    if (!tenantInfo) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      return;
    }

    if (!searchTerm && appliedFilters.tags.length === 0) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      if (tenantInfo && !error) {
        setError(
          "Por favor, ingresa un término de búsqueda o selecciona etiquetas para filtrar."
        );
      }
      return;
    }

    setIsLoadingSearch(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (appliedFilters.categoryId) {
        params.append("categoryId", appliedFilters.categoryId);
      }
      if (appliedFilters.minPrice) {
        params.append("minPrice", appliedFilters.minPrice);
      }
      if (appliedFilters.maxPrice) {
        params.append("maxPrice", appliedFilters.maxPrice);
      }
      appliedFilters.tags.forEach((tag) => params.append("tags", tag));

      const results = await searchPublicTenantProducts(
        tenantInfo.subdomain,
        params
      );
      setSearchResults(results || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.status !== 404) {
        setError(
          axiosError.response?.data?.detail ||
            axiosError.message ||
            "No se pudieron cargar los resultados de búsqueda."
        );
      }
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [searchTerm, tenantInfo, appliedFilters, error]);

  useEffect(() => {
    if (tenantInfo && !isLoadingPageData) {
      performSearch();
    }
  }, [performSearch, tenantInfo, isLoadingPageData]);

  const handleApplyFilters = () => {
    const min = parseFloat(tempFilterMinPrice);
    const max = parseFloat(tempFilterMaxPrice);
    if (tempFilterMinPrice && (isNaN(min) || min < 0))
      return alert("Precio mínimo inválido.");
    if (tempFilterMaxPrice && (isNaN(max) || max < 0))
      return alert("Precio máximo inválido.");
    if (!isNaN(min) && !isNaN(max) && min > max)
      return alert("El precio mínimo no puede ser mayor al máximo.");

    const newAppliedTags = selectedTags.map((tag) => tag.name.trim());

    setAppliedFilters({
      categoryId: tempFilterCategoryId || null,
      minPrice: tempFilterMinPrice || null,
      maxPrice: tempFilterMaxPrice || null,
      tags: newAppliedTags,
    });
    setIsFilterPanelOpen(false);
  };

  const handleClearPanelFilters = () => {
    setTempFilterCategoryId("");
    setTempFilterMinPrice("");
    setTempFilterMaxPrice("");
    setSelectedTags([]);
    setAppliedFilters({
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      tags: [],
    });
    setIsFilterPanelOpen(false);
  };

  const handleToggleFilterPanel = () => {
    if (!isFilterPanelOpen) {
      setTempFilterCategoryId(appliedFilters.categoryId || "");
      setTempFilterMinPrice(appliedFilters.minPrice || "");
      setTempFilterMaxPrice(appliedFilters.maxPrice || "");

      const rehydratedTags = appliedFilters.tags.map((tagName) => {
        const existingTag = allTenantTags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        );
        return (
          existingTag || {
            id: `applied_${tagName}_${Date.now()}`,
            name: tagName,
          }
        );
      });
      setSelectedTags(rehydratedTags);
    }
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const areAnyFiltersApplied = useMemo(() => {
    return (
      appliedFilters.categoryId !== null ||
      appliedFilters.minPrice !== null ||
      appliedFilters.maxPrice !== null ||
      appliedFilters.tags.length > 0
    );
  }, [appliedFilters]);

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}

      <main className={styles.resultsContent}>
        {isLoadingPageData && !error && (
          <p className={styles.message}>Cargando...</p>
        )}

        {error && (
          <div className={styles.message}>
            <p className={styles.errorText}>{error}</p>

            {(searchTerm ||
              appliedFilters.tags.length > 0 ||
              areAnyFiltersApplied) && (
              <Link to="/" className={styles.backLink}>
                Volver al Catálogo
              </Link>
            )}
          </div>
        )}

        {!isLoadingPageData && !error && tenantInfo && (
          <>
            <div className={styles.titleAndFilter}>
              <h1 className={styles.resultsTitle}>
                {searchTerm
                  ? `Resultados para: "${searchTerm}"`
                  : appliedFilters.tags.length > 0
                  ? `Resultados para etiquetas: "${appliedFilters.tags.join(
                      '", "'
                    )}"`
                  : "Búsqueda de Productos"}
                {!isLoadingSearch && searchResults.length >= 0
                  ? ` (${searchResults.length})`
                  : ""}
              </h1>
              {(searchTerm ||
                appliedFilters.tags.length > 0 ||
                isFilterPanelOpen) && (
                <button
                  onClick={handleToggleFilterPanel}
                  className={`${styles.filterToggleButton} ${
                    areAnyFiltersApplied ? styles.filterButtonActive : ""
                  }`}
                  disabled={
                    isLoadingPageData ||
                    (allCategories.length === 0 && allTenantTags.length === 0)
                  }
                >
                  <LuFilter /> Filtros {isFilterPanelOpen ? <LuX /> : null}
                </button>
              )}
            </div>

            {isFilterPanelOpen && (
              <div className={styles.filterPanelHorizontal}>
                <div className={styles.filterGroupItem}>
                  <label
                    htmlFor="filterCategory"
                    className={styles.filterLabel}
                  >
                    Categoría:
                  </label>
                  <select
                    id="filterCategory"
                    value={tempFilterCategoryId}
                    onChange={(e) => setTempFilterCategoryId(e.target.value)}
                    disabled={isLoadingPageData}
                    className={styles.filterSelect}
                  >
                    <option value="">Todas</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingPageData && allCategories.length === 0 && (
                    <small className={styles.loadingSmall}>
                      Cargando categorías...
                    </small>
                  )}
                </div>
                <div className={styles.filterGroupItem}>
                  <label
                    htmlFor="filterMinPrice"
                    className={styles.filterLabel}
                  >
                    Mín (Bs.):
                  </label>
                  <input
                    type="number"
                    id="filterMinPrice"
                    placeholder="Ej: 10"
                    min="0"
                    step="1"
                    value={tempFilterMinPrice}
                    onChange={(e) => setTempFilterMinPrice(e.target.value)}
                    className={styles.filterInput}
                  />
                </div>
                <div className={styles.filterGroupItem}>
                  <label
                    htmlFor="filterMaxPrice"
                    className={styles.filterLabel}
                  >
                    Máx (Bs.):
                  </label>
                  <input
                    type="number"
                    id="filterMaxPrice"
                    placeholder="Ej: 100"
                    min="0"
                    step="1"
                    value={tempFilterMaxPrice}
                    onChange={(e) => setTempFilterMaxPrice(e.target.value)}
                    className={styles.filterInput}
                  />
                </div>
                <div className={styles.filterGroupItem}>
                  <label
                    htmlFor="tags-filter-autocomplete"
                    className={styles.filterLabel}
                  >
                    Etiquetas:
                  </label>
                  <Autocomplete
                    multiple
                    freeSolo
                    loading={isLoadingPageData && allTenantTags.length === 0}
                    id="tags-filter-autocomplete"
                    value={selectedTags}
                    onChange={(_, newValue) => {
                      setSelectedTags(
                        newValue.map((option) => {
                          if (typeof option === "string") {
                            const existing = allTenantTags.find(
                              (t) =>
                                t.name.toLowerCase() === option.toLowerCase()
                            );
                            return (
                              existing || {
                                id: `new_${option}_${Date.now()}`,
                                name: option,
                              }
                            );
                          }
                          return option;
                        })
                      );
                    }}
                    options={allTenantTags}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.name
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id ||
                      option.name.toLowerCase() === value.name.toLowerCase()
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((tag, index) => (
                        <Chip
                          label={tag.name}
                          {...getTagProps({ index })}
                          key={tag.id || `${tag.name}_${index}`}
                          sx={{
                            backgroundColor: "var(--color-secondary)",
                            color: "var(--color-primary-dark)",
                            height: "25px",
                            fontSize: "0.8rem",
                            "& .MuiChip-deleteIcon": {
                              color: "var(--color-primary-dark)",
                              fontSize: "0.9rem",
                              "&:hover": { color: "var(--color-error)" },
                            },
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={
                          selectedTags.length > 0
                            ? "Añadir más etiquetas..."
                            : "Añadir etiquetas..."
                        }
                        disabled={
                          isLoadingPageData && allTenantTags.length === 0
                        }
                        sx={{
                          width: "300px",
                          fontSize: "0.8em",
                          "& .MuiInputLabel-root": {
                            fontSize: "0.8rem",
                            marginBottom: "var(--space-xs)",
                            color: "var(--color-text-secondary)",
                          },
                          "& .MuiOutlinedInput-root": {
                            padding:
                              "calc(var(--space-xs) + 2px) var(--space-sm)",
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            maxHeight: "116px",
                            overflowY: "auto",
                            backgroundColor: "var(--color-surface)",
                            borderRadius: "var(--border-radius-sm)",
                            fontFamily: "var(--font-primary)",
                            border: "1px solid var(--color-border)",
                            "&:hover": {
                              borderColor: "var(--color-text-secondary)",
                            },
                            "&.Mui-focused": {
                              borderColor: "var(--color-primary)",
                              boxShadow: "0 0 0 2px rgba(251, 111, 146, 0.2)",
                            },
                            "&.Mui-disabled": {
                              backgroundColor: "#f0f0f0",
                              borderColor: "var(--color-border-light)",
                            },
                          },
                          "& .MuiAutocomplete-input": {
                            minHeight: "28px",
                            paddingTop: "1.5px !important",
                            paddingBottom: "1.5px !important",
                            paddingLeft: "4px !important",
                            paddingRight: "6px !important",
                            minWidth: "100px",
                            flexGrow: 1,
                            fontSize: "0.9em",
                            lineHeight: "1.4em",
                            color: "var(--color-text-primary)",
                            fontFamily: "var(--font-primary)",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none",
                          },
                        }}
                      />
                    )}
                  />
                </div>
                <div className={styles.filterActionButtonsHorizontal}>
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

            {(searchTerm || appliedFilters.tags.length > 0) &&
              isLoadingSearch && <p className={styles.message}>Buscando...</p>}

            {(searchTerm || appliedFilters.tags.length > 0) &&
              !isLoadingSearch &&
              searchResults.length === 0 && (
                <p className={styles.message}>
                  No se encontraron productos que coincidan con "
                  {searchTerm || appliedFilters.tags.join('", "')}"
                  {areAnyFiltersApplied ? " y los filtros aplicados" : ""}.
                </p>
              )}

            {(searchTerm || appliedFilters.tags.length > 0) &&
              !isLoadingSearch &&
              searchResults.length > 0 && (
                <div className={styles.productGrid}>
                  {searchResults.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

            {!isLoadingPageData &&
              (searchTerm ||
                appliedFilters.tags.length > 0 ||
                areAnyFiltersApplied) && (
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
