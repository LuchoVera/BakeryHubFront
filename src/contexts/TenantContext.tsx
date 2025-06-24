import React, {
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useContext,
} from "react";
import { TenantPublicInfoDto, ApiErrorResponse } from "../types";
import { fetchPublicTenantInfo } from "../services/apiService";
import { AxiosError } from "axios";
import { TenantContext, TenantContextType } from "./TenantContext.definition";
import { hexToRgb } from "../utils/colorUtils";

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

  useEffect(() => {
    const root = document.documentElement;
    const theme = tenantInfo?.theme;

    if (theme) {
      const propertiesToSet: { [key: string]: string | null } = {
        "--color-primary": theme.colorPrimary,
        "--color-primary-dark": theme.colorPrimaryDark,
        "--color-primary-light": theme.colorPrimaryLight,
        "--color-secondary": theme.colorSecondary,
        "--color-background": theme.colorBackground,
        "--color-surface": theme.colorSurface,
        "--color-text-primary": theme.colorTextPrimary,
        "--color-text-secondary": theme.colorTextSecondary,
        "--color-text-on-primary": theme.colorTextOnPrimary,
        "--color-border": theme.colorBorder,
        "--color-border-light": theme.colorBorderLight,
        "--color-disabled-bg": theme.colorDisabledBg,
      };

      const primaryRgb = hexToRgb(theme.colorPrimary);
      if (primaryRgb) {
        propertiesToSet["--color-primary-rgb"] = primaryRgb;
      }

      Object.entries(propertiesToSet).forEach(([property, value]) => {
        if (value) {
          root.style.setProperty(property, value);
        }
      });

      return () => {
        Object.keys(propertiesToSet).forEach((property) => {
          root.style.removeProperty(property);
        });
      };
    }
  }, [tenantInfo]);

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

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
