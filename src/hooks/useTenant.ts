import { useContext } from "react";
import {
  TenantContext,
  TenantContextType,
} from "../contexts/TenantContext.definition";

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
