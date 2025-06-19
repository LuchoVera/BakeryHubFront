import { createContext } from "react";
import { TenantPublicInfoDto } from "../types";

export interface TenantContextType {
  tenantInfo: TenantPublicInfoDto | null;
  isLoading: boolean;
  error: string | null;
  subdomain: string;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);
