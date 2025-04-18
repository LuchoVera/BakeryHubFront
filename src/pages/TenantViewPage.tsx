import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { TenantPublicInfoDto, ProductDto, ApiErrorResponse } from "../types";
import TenantHeader from "../components/TenantHeader/TenantHeader";
import ProductList from "../components/ProductList/ProductList";

interface TenantViewPageProps {
  subdomain: string;
}

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    setTenantInfo(null);
    setProducts([]);

    const fetchTenantInfo = async () => {
      console.log(
        `TenantViewPage (Reverted): Fetching info for subdomain: ${subdomain}`
      );
      try {
        const response = await axios.get<TenantPublicInfoDto>(
          `/api/public/tenants/${subdomain}`
        );
        setTenantInfo(response.data);
        console.log(
          "TenantViewPage (Reverted): Tenant info found:",
          response.data
        );
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error(
          "TenantViewPage (Reverted): Error fetching tenant info:",
          axiosError.response?.data || axiosError.message
        );
        if (axiosError.response?.status === 404) {
          setError(`The bakery "${subdomain}" was not found.`);
        } else {
          setError("An error occurred while loading the bakery information.");
        }
      } finally {
        setIsLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (tenantInfo && !error) {
      setIsLoadingProducts(true);
      const fetchProducts = async () => {
        console.log(
          `TenantViewPage (Reverted): Fetching products for ${tenantInfo.subdomain}`
        );
        try {
          const response = await axios.get<ProductDto[]>(
            `/api/public/tenants/${tenantInfo.subdomain}/products`
          );
          setProducts(response.data);
          console.log(
            "TenantViewPage (Reverted): Products found:",
            response.data
          );
        } catch (err) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          console.error(
            "TenantViewPage (Reverted): Error fetching products:",
            axiosError.response?.data || axiosError.message
          );
          setError(
            (prevError) =>
              prevError || "Could not load products for this bakery."
          );
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setIsLoadingProducts(false);
      setProducts([]);
    }
  }, [tenantInfo, error]);

  if (isLoadingTenant) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading Bakery Information...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          border: "2px solid red",
          textAlign: "center",
          margin: "20px",
        }}
      >
        <h1>Error</h1>
        <p>{error}</p>
        <a href="http://localhost:5173/">Go back to main page</a>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Something went wrong loading tenant information.
      </div>
    );
  }

  return (
    <div className="tenant-view">
      <TenantHeader
        tenantName={tenantInfo.name}
        subdomain={tenantInfo.subdomain}
      />
      <main style={{ padding: "20px" }}>
        <h2>Our Products</h2>
        {isLoadingProducts ? (
          <p>Loading products...</p>
        ) : (
          <ProductList products={products} />
        )}
      </main>
    </div>
  );
};

export default TenantViewPage;
