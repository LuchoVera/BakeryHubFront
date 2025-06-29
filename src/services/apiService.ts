import axios, { AxiosError, AxiosInstance } from "axios";
import {
  AdminRegisterDto,
  ApiErrorResponse,
  AuthResponseDto,
  AuthUser,
  CategoryDto,
  ChangePasswordDto,
  CreateManualOrderDto,
  CreateOrderDto,
  CreateProductDto,
  CreateTagDto,
  CustomerRegisterDto,
  DashboardQueryParametersDto,
  DashboardResponseDto,
  EmailCheckResultDto,
  LinkCustomerDto,
  LoginDto,
  OrderDto,
  ProductDto,
  TagDto,
  TenantPublicInfoDto,
  TenantThemeDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateTagDto,
  UpdateUserProfileDto,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    console.error(
      "API Error:",
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export const login = async (loginData: LoginDto): Promise<AuthResponseDto> => {
  const response = await apiClient.post<AuthResponseDto>(
    "/accounts/login",
    loginData
  );
  return response.data;
};

export const getCurrentUser = async (
  subdomain?: string | null
): Promise<AuthUser> => {
  const url = subdomain
    ? `/accounts/me?subdomain=${subdomain}`
    : "/accounts/me";
  const response = await apiClient.get<AuthUser>(url);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/accounts/logout");
};

export const registerAdmin = async (
  registrationData: AdminRegisterDto
): Promise<void> => {
  await apiClient.post("/accounts/register-admin", registrationData);
};

export const checkEmail = async (
  email: string
): Promise<EmailCheckResultDto> => {
  const response = await apiClient.get<EmailCheckResultDto>(
    `/accounts/check-email?email=${encodeURIComponent(email)}`
  );
  return response.data;
};

export const changePassword = async (
  passwordData: ChangePasswordDto
): Promise<void> => {
  await apiClient.post("/accounts/change-password", passwordData);
};

export const updateUserProfile = async (
  profileData: UpdateUserProfileDto,
  subdomain: string | null
): Promise<AuthUser> => {
  const url = subdomain
    ? `/accounts/me/update-profile?subdomain=${subdomain}`
    : "/accounts/me/update-profile";

  const response = await apiClient.put<AuthUser>(url, profileData);
  return response.data;
};

export const fetchAdminCategories = async (): Promise<CategoryDto[]> => {
  const response = await apiClient.get<CategoryDto[]>("/categories");
  return response.data;
};

export const createAdminCategory = async (categoryData: {
  name: string;
}): Promise<CategoryDto> => {
  const response = await apiClient.post<CategoryDto>(
    "/categories",
    categoryData
  );
  return response.data;
};

export const updateAdminCategory = async (
  id: string,
  categoryData: UpdateCategoryDto
): Promise<CategoryDto> => {
  const response = await apiClient.put<CategoryDto>(
    `/categories/${id}`,
    categoryData
  );
  return response.data;
};

export const deleteAdminCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

export const fetchAdminTags = async (): Promise<TagDto[]> => {
  const response = await apiClient.get<TagDto[]>("/tags");
  return response.data;
};

export const createAdminTag = async (
  tagData: CreateTagDto
): Promise<TagDto> => {
  const response = await apiClient.post<TagDto>("/tags", tagData);
  return response.data;
};

export const updateAdminTag = async (
  id: string,
  tagData: UpdateTagDto
): Promise<TagDto> => {
  const response = await apiClient.put<TagDto>(`/tags/${id}`, tagData);
  return response.data;
};

export const deleteAdminTag = async (id: string): Promise<void> => {
  await apiClient.delete(`/tags/${id}`);
};

export const fetchAdminProducts = async (): Promise<ProductDto[]> => {
  const response = await apiClient.get<ProductDto[]>("/products");
  return response.data;
};

export const fetchAdminProductById = async (
  productId: string
): Promise<ProductDto> => {
  const response = await apiClient.get<ProductDto>(`/products/${productId}`);
  return response.data;
};

export const createAdminProduct = async (
  productData: CreateProductDto
): Promise<ProductDto> => {
  const response = await apiClient.post<ProductDto>("/products", productData);
  return response.data;
};

export const updateAdminProduct = async (
  productId: string,
  productData: UpdateProductDto
): Promise<ProductDto> => {
  const response = await apiClient.put<ProductDto>(
    `/products/${productId}`,
    productData
  );
  return response.data;
};

export const deleteAdminProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

export const updateAdminProductAvailability = async (
  productId: string,
  isAvailable: boolean
): Promise<void> => {
  await apiClient.patch(`/products/${productId}/availability`, isAvailable, {
    headers: { "Content-Type": "application/json" },
  });
};

export const fetchAdminOrders = async (): Promise<OrderDto[]> => {
  const response = await apiClient.get<OrderDto[]>("/admin/orders/my");
  return response.data;
};

export const fetchAdminOrderById = async (
  orderId: string
): Promise<OrderDto> => {
  const response = await apiClient.get<OrderDto>(`/admin/orders/${orderId}`);
  return response.data;
};

export const updateAdminOrderStatus = async (
  orderId: string,
  newStatus: string
): Promise<void> => {
  await apiClient.put(`/admin/orders/${orderId}/status`, {
    NewStatus: newStatus,
  });
};

export const fetchPublicTenantInfo = async (
  subdomain: string
): Promise<TenantPublicInfoDto> => {
  const response = await apiClient.get<TenantPublicInfoDto>(
    `/public/tenants/${subdomain}`
  );
  return response.data;
};

export const fetchPublicTenantProducts = async (
  subdomain: string,
  params?: URLSearchParams
): Promise<ProductDto[]> => {
  const queryString = params ? `?${params.toString()}` : "";
  const response = await apiClient.get<ProductDto[]>(
    `/public/tenants/${subdomain}/products${queryString}`
  );
  return response.data;
};

export const fetchPublicProductDetail = async (
  subdomain: string,
  productId: string
): Promise<ProductDto> => {
  const response = await apiClient.get<ProductDto>(
    `/Products/${subdomain}/products/${productId}`
  );
  return response.data;
};

export const fetchPublicTenantCategoriesPreferred = async (
  subdomain: string
): Promise<CategoryDto[]> => {
  const response = await apiClient.get<CategoryDto[]>(
    `/public/tenants/${subdomain}/categories/preferred`
  );
  return response.data;
};

export const fetchPublicTenantTags = async (
  subdomain: string
): Promise<TagDto[]> => {
  const response = await apiClient.get<TagDto[]>(
    `/public/tenants/${subdomain}/tags`
  );
  return response.data;
};

export const fetchPublicTenantRecommendations = async (
  subdomain: string
): Promise<ProductDto[]> => {
  const response = await apiClient.get<ProductDto[]>(
    `/public/tenants/${subdomain}/recommendations`
  );
  return response.data;
};

export const searchPublicTenantProducts = async (
  subdomain: string,
  params: URLSearchParams
): Promise<ProductDto[]> => {
  const response = await apiClient.get<ProductDto[]>(
    `/public/tenants/${subdomain}/search?${params.toString()}`
  );
  return response.data;
};

export const registerTenantCustomer = async (
  subdomain: string,
  registrationData: CustomerRegisterDto
): Promise<{ message: string; status: string; userId?: string }> => {
  const response = await apiClient.post<{
    message: string;
    status: string;
    userId?: string;
  }>(`/public/tenants/${subdomain}/register-customer`, registrationData);
  return response.data;
};

export const linkTenantCustomer = async (
  subdomain: string,
  linkData: LinkCustomerDto
): Promise<{ message: string; status: string; userId?: string }> => {
  const response = await apiClient.post<{
    message: string;
    status: string;
    userId?: string;
  }>(`/public/tenants/${subdomain}/link-customer`, linkData);
  return response.data;
};

export const createTenantOrder = async (
  subdomain: string,
  orderData: CreateOrderDto
): Promise<OrderDto> => {
  const response = await apiClient.post<OrderDto>(
    `/public/tenants/${subdomain}/orders`,
    orderData
  );
  return response.data;
};

export const fetchTenantOrders = async (
  subdomain: string
): Promise<OrderDto[]> => {
  const response = await apiClient.get<OrderDto[]>(
    `/public/tenants/${subdomain}/orders`
  );
  return response.data;
};

export const fetchTenantOrderById = async (
  subdomain: string,
  orderId: string
): Promise<OrderDto> => {
  const response = await apiClient.get<OrderDto>(
    `/public/tenants/${subdomain}/orders/${orderId}`
  );
  return response.data;
};

export const uploadImageToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<string | null> => {
  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary cloudName o uploadPreset no están configurados.");
    throw new Error("Falta configuración para subir imágenes a Cloudinary.");
  }
  const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await axios.post<{ secure_url: string }>(
      cloudinaryUploadUrl,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.secure_url;
  } catch (err) {
    const axiosError = err as AxiosError;
    const errorData = axiosError.response?.data as {
      error?: { message?: string };
    };
    console.error(
      `Fallo al subir ${file.name} a Cloudinary: ${
        errorData?.error?.message || axiosError.message
      }`
    );
    throw err;
  }
};

export const fetchAdminDashboardStatistics = async (
  params: DashboardQueryParametersDto
): Promise<DashboardResponseDto> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== "")
  );

  const response = await apiClient.get<DashboardResponseDto>(
    "/admin/dashboard/order-statistics",
    { params: cleanParams }
  );
  return response.data;
};

export const createManualAdminOrder = async (
  orderData: CreateManualOrderDto
): Promise<OrderDto> => {
  const response = await apiClient.post<OrderDto>(
    "/admin/orders/manual",
    orderData
  );
  return response.data;
};

export const fetchPublicTenantCategories = async (
  subdomain: string
): Promise<CategoryDto[]> => {
  const response = await apiClient.get<CategoryDto[]>(
    `/public/tenants/${subdomain}/categories`
  );
  return response.data;
};

export const getAdminTheme = async (): Promise<TenantThemeDto> => {
  const response = await apiClient.get<TenantThemeDto>("/admin/theme");
  return response.data;
};

export const updateAdminTheme = async (
  themeData: TenantThemeDto
): Promise<void> => {
  await apiClient.put("/admin/theme", themeData);
};

export const resetPublicTheme = async (): Promise<void> => {
  await apiClient.post("/admin/theme/reset-public");
};

export const resetAdminTheme = async (): Promise<void> => {
  await apiClient.post("/admin/theme/reset-admin");
};
