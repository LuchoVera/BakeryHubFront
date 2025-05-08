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
  phoneNumber?: string | null;
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

export interface UpdateCategoryDto {
  name: string;
}

export interface CartItem {
  product: ProductDto;
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addItemToCart: (product: ProductDto) => void;
  removeItemFromCart: (productId: string) => void;
  decrementItemQuantity: (productId: string) => void;
  getCartTotalQuantity: () => number;
  updateItemQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
}

export type NotificationType = "info" | "success" | "error" | "loginPrompt";

export interface NotificationState {
  message: string | null;
  type: NotificationType;
  duration?: number;
}

export interface NotificationContextType {
  showNotification: (
    message: string,
    type: NotificationType,
    duration?: number
  ) => void;
  hideNotification: () => void;
  notification: NotificationState | null;
}

export interface CartPageProps {
  subdomain: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Cancelled"
  | "Ready"
  | "Received";

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;

  productName?: string;
}

export interface CreateOrderDto {
  deliveryDate: Date | string;
  items: OrderItemDto[];
  totalAmount: number;
}

export interface OrderDto {
  id: string;
  tenantId: string;
  applicationUserId?: string | null;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  status: OrderStatus | string;
  items: OrderItemDto[];
  customerName?: string | null;
  orderNumber?: string | null;
  customerPhoneNumber?: string | null;
}

export interface StatusConfirmModalData {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  newStatus: string;
}
