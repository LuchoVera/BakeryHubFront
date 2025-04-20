export interface ProductDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  images: string[];
  leadTimeDisplay: string;
  categoryId: string;
  categoryName: string;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: number;
  images?: string[] | null;
  leadTimeInput?: string | null;
  categoryId: string;
}

export interface UpdateProductDto {
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  images?: string[] | null;
  leadTimeInput?: string | null;
  categoryId: string;
}

export interface AdminRegisterDto {
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  businessName: string;
  subdomain: string;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
  subdomainContext?: string | null;
}

export interface AuthResponseDto {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  administeredTenantId?: string | null;
  administeredTenantSubdomain?: string | null;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  administeredTenantId?: string | null;
  administeredTenantSubdomain?: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ApiErrorResponse {
  title?: string;
  errors?: ValidationErrors;
  detail?: string;
  message?: string;
}

export interface TenantPublicInfoDto {
  name: string;
  subdomain: string;
}

export interface CustomerRegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export interface EmailCheckResultDto {
  exists: boolean;
  isAdmin?: boolean;
  isCustomer?: boolean;
  name?: string | null;
}

export enum RegistrationOutcome {
  Failed = "Failed",
  UserCreated = "UserCreated",
  MembershipCreated = "MembershipCreated",
  AlreadyMember = "AlreadyMember",
  AdminConflict = "AdminConflict",
  TenantNotFound = "TenantNotFound",
  RoleAssignmentFailed = "RoleAssignmentFailed",
  UnknownError = "UnknownError",
}

export interface LinkCustomerDto {
  email: string;
}
