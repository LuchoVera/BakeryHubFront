import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { ProductDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import styles from "./SearchResultsPage.module.css";

interface SearchResultsPageProps {
  subdomain: string;
}

const apiUrl = "/api";

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

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
    if (!searchTerm || !tenantInfo) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      if (!searchTerm && tenantInfo)
        setError("Por favor, ingresa un término de búsqueda.");
      return;
    }

    setIsLoadingSearch(true);
    setError(null);
    const fetchSearchResults = async () => {
      try {
        const searchUrl = `${apiUrl}/public/tenants/${
          tenantInfo.subdomain
        }/search?q=${encodeURIComponent(searchTerm)}`;
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
    };

    fetchSearchResults();
  }, [searchTerm, tenantInfo]);

  const isLoading = isLoadingTenant || isLoadingSearch;

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}

      <main className={styles.resultsContent}>
        {isLoading ? (
          <p className={styles.message}>Cargando resultados...</p>
        ) : error ? (
          <div className={styles.message}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : !searchTerm ? (
          <p className={styles.message}>
            Ingresa un término en la barra superior para buscar productos.
          </p>
        ) : searchResults.length > 0 ? (
          <>
            <h1 className={styles.resultsTitle}>
              Resultados para: "{searchTerm}" ({searchResults.length})
            </h1>
            <div className={styles.productGrid}>
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <p className={styles.message}>
            No se encontraron productos que coincidan con "{searchTerm}".
          </p>
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
      </main>
    </div>
  );
};

export default SearchResultsPage;
