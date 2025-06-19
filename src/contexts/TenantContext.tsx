import React, { useState, useEffect, ReactNode, useMemo } from "react";
import { TenantPublicInfoDto, ApiErrorResponse } from "../types";
import { fetchPublicTenantInfo } from "../services/apiService";
import { AxiosError } from "axios";
import { TenantContext } from "./TenantContext.definition";

interface TenantProviderProps {
  children: ReactNode;
  subdomain: string;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  subdomain,
}) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain) {
      setError("No se ha proporcionado un subdominio.");
      setIsLoading(false);
      return;
    }

    const fetchTenantData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.data?.detail ||
            `No se pudo cargar la información de la tienda "${subdomain}".`
        );
        setTenantInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [subdomain]);

  const value = useMemo(
    () => ({
      tenantInfo,
      isLoading,
      error,
      subdomain,
    }),
    [tenantInfo, isLoading, error, subdomain]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
};
