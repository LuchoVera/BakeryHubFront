import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./TenantViewPage.module.css";
import {
  ApiErrorResponse,
  ProductDto,
  TenantPublicInfoDto,
  CategoryDto,
  TagDto,
} from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategorySidebar from "../../components/CategorySidebar/CategorySidebar";
import { useAuth } from "../../AuthContext";
import { LuFilter, LuX } from "react-icons/lu";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import {
  fetchPublicTenantInfo,
  fetchPublicTenantCategoriesPreferred,
  fetchPublicTenantProducts,
  fetchPublicTenantRecommendations,
  fetchPublicTenantTags,
} from "../../services/apiService";
import { AxiosError } from "axios";

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
  const [isLoadingPageData, setIsLoadingPageData] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
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

  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [allTenantTags, setAllTenantTags] = useState<TagDto[]>([]);
  const [selectedTagsInPanel, setSelectedTagsInPanel] = useState<TagDto[]>([]);

  useEffect(() => {
    setIsLoadingPageData(true);
    setError(null);
    setTenantInfo(null);
    setProducts([]);
    setAllCategories([]);
    setAllTenantTags([]);
    setAllRecommendations([]);
    const fetchInitialPageData = async () => {
      try {
        const tenantData = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(tenantData);
        const [categoriesData, tagsData] = await Promise.all([
          (async () => {
            let cats: CategoryDto[] = [];
            let fallbackNeeded = !isAuthenticated;
            if (isAuthenticated) {
              try {
                const preferredCats =
                  await fetchPublicTenantCategoriesPreferred(subdomain);
                if (preferredCats && preferredCats.length > 0)
                  cats = preferredCats;
                else fallbackNeeded = true;
              } catch {
                fallbackNeeded = true;
              }
            }
            if (fallbackNeeded) {
              try {
                const prodsForCats = await fetchPublicTenantProducts(subdomain);
                const categoriesMap = new Map<string, string>();
                (prodsForCats || []).forEach((p) => {
                  if (
                    p.categoryId &&
                    p.categoryName &&
                    !categoriesMap.has(p.categoryId)
                  ) {
                    categoriesMap.set(p.categoryId, p.categoryName);
                  }
                });
                cats = Array.from(categoriesMap.entries()).map(
                  ([id, name]) => ({ id, name })
                );
                cats.sort((a, b) => a.name.localeCompare(b.name));
              } catch {}
            }
            return cats;
          })(),
          fetchPublicTenantTags(subdomain),
        ]);
        setAllCategories(categoriesData);
        setAllTenantTags(tagsData || []);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError(`La tienda "${subdomain}" no fue encontrada.`);
        } else {
          setError(
            axiosError.response?.data?.detail ||
              axiosError.message ||
              "Ocurrió un error cargando datos de la tienda."
          );
        }
        setTenantInfo(null);
        setAllCategories([]);
        setAllTenantTags([]);
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchInitialPageData();
  }, [subdomain, isAuthenticated]);

  const performProductFetch = useCallback(async () => {
    if (!tenantInfo || error) {
      setIsLoadingProducts(false);
      setProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.append("categoryId", selectedCategoryId);
      if (appliedMinPrice) params.append("minPrice", appliedMinPrice);
      if (appliedMaxPrice) params.append("maxPrice", appliedMaxPrice);
      appliedTags.forEach((tag) => params.append("tags", tag));
      const productData = await fetchPublicTenantProducts(
        tenantInfo.subdomain,
        params
      );
      setProducts(productData || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status !== 404) {
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
  }, [
    tenantInfo,
    selectedCategoryId,
    appliedMinPrice,
    appliedMaxPrice,
    appliedTags,
    error,
  ]);

  useEffect(() => {
    if (!isLoadingPageData) {
      performProductFetch();
    }
  }, [performProductFetch, isLoadingPageData]);

  useEffect(() => {
    if (isAuthenticated && subdomain && tenantInfo && !isLoadingPageData) {
      setLoadingRecommendations(true);
      setAllRecommendations([]);
      setDisplayedRecommendations([]);
      const fetchRecs = async () => {
        try {
          const recData = await fetchPublicTenantRecommendations(subdomain);
          setAllRecommendations(recData || []);
        } catch (err) {
          setAllRecommendations([]);
        } finally {
          setLoadingRecommendations(false);
        }
      };
      fetchRecs();
    } else {
      setAllRecommendations([]);
      setDisplayedRecommendations([]);
      setLoadingRecommendations(false);
    }
  }, [isAuthenticated, subdomain, tenantInfo, isLoadingPageData]);

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
      const rehydratedTags = appliedTags.map((tagName) => {
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
      setSelectedTagsInPanel(rehydratedTags);
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

    const newAppliedTags = selectedTagsInPanel.map((tag) => tag.name.trim());
    setAppliedMinPrice(tempMinPrice || null);
    setAppliedMaxPrice(tempMaxPrice || null);
    setAppliedTags(newAppliedTags);
    setIsFilterPanelOpen(false);
  };

  const handleClearPanelFilters = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setSelectedTagsInPanel([]);
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setAppliedTags([]);
  };

  const areAnyPriceOrTagFiltersApplied = useMemo(() => {
    return (
      appliedMinPrice !== null ||
      appliedMaxPrice !== null ||
      appliedTags.length > 0
    );
  }, [appliedMinPrice, appliedMaxPrice, appliedTags]);

  const areFiltersActive = useMemo(() => {
    return selectedCategoryId !== null || areAnyPriceOrTagFiltersApplied;
  }, [selectedCategoryId, areAnyPriceOrTagFiltersApplied]);

  if (isLoadingPageData) {
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
  if (!tenantInfo && !isLoadingPageData) {
    return (
      <div className={styles.loadingOrError}>
        No se pudo cargar la información de la tienda.
      </div>
    );
  }

  return (
    <div className={styles.tenantView}>
      <TenantHeader tenantName={tenantInfo?.name ?? "Cargando..."} />
      <div className={styles.pageLayout}>
        {!isLoadingPageData && categoryLinksForSidebar.length > 0 && (
          <CategorySidebar
            categories={categoryLinksForSidebar}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}
        {isLoadingPageData && tenantInfo && (
          <div
            className={styles.productsArea}
            style={{ textAlign: "center", paddingTop: "50px" }}
          >
            Cargando categorías y filtros...
          </div>
        )}
        <main className={styles.productsArea} id="product-area-start">
          <div className={styles.productsAreaContent}>
            {error &&
              products.length === 0 &&
              !isLoadingProducts &&
              tenantInfo && <p className={styles.loadingOrError}>{error}</p>}
            <div className={styles.filterControlsContainer}>
              <div className={styles.filterButtonContainer}>
                <button
                  onClick={toggleFilterPanel}
                  className={`${styles.filterToggleButton} ${
                    areAnyPriceOrTagFiltersApplied && !selectedCategoryId
                      ? styles.filterButtonActive
                      : ""
                  }`}
                  disabled={isLoadingProducts || isLoadingPageData}
                >
                  <LuFilter /> Filtros
                  {isFilterPanelOpen ? <LuX /> : null}
                </button>
              </div>
              {isFilterPanelOpen && (
                <div className={styles.filterPanelHorizontal}>
                  <div className={styles.filterPriceGroup}>
                    <label htmlFor="minPrice" className={styles.filterLabel}>
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
                  <div className={styles.filterPriceGroup}>
                    <label htmlFor="tagsFilter" className={styles.filterLabel}>
                      Etiquetas:
                    </label>
                    <Autocomplete
                      multiple
                      freeSolo
                      loading={isLoadingPageData && allTenantTags.length === 0}
                      id="tags-filter-autocomplete"
                      value={selectedTagsInPanel}
                      onChange={(_, newValue) => {
                        setSelectedTagsInPanel(
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
                            key={tag.id || tag.name + index}
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
                            selectedTagsInPanel.length > 0
                              ? "Añadir más..."
                              : "Etiquetas..."
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
            {isLoadingProducts && !error && (
              <p className={styles.loadingOrError}>Cargando productos...</p>
            )}
            {!isLoadingProducts && products.length === 0 && !error && (
              <p className={styles.noProducts}>
                No se encontraron productos que coincidan con los filtros
                seleccionados.
              </p>
            )}
            {!isLoadingProducts &&
              !error &&
              products.length > 0 &&
              (selectedCategoryId
                ? allCategories.filter((c) => c.id === selectedCategoryId)
                : allCategories
              ).map(({ name: categoryName, id: categoryId }) => {
                const productsInCategory =
                  groupedProductsRender[categoryName] || [];

                if (productsInCategory.length > 0) {
                  return (
                    <section
                      key={categoryId}
                      id={categoryId}
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
                } else if (
                  selectedCategoryId === categoryId &&
                  productsInCategory.length === 0
                ) {
                  return (
                    <section
                      key={categoryId}
                      className={styles.categorySection}
                      id={categoryId}
                    >
                      <h2 className={styles.categoryTitle}>{categoryName}</h2>
                      <p className={styles.noProducts}>
                        No hay productos en esta categoría con los filtros
                        aplicados.
                      </p>
                    </section>
                  );
                }
                return null;
              })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantViewPage;
