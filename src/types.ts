import { ReactNode } from "react";

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
  tagNames?: string[];
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: number;
  images?: string[] | null;
  leadTimeInput?: string | null;
  categoryId: string;
  tags?: string[] | null;
}

export interface UpdateProductDto {
  name: string;
  description?: string | null;
  price: number;
  images?: string[] | null;
  leadTimeInput?: string | null;
  categoryId: string;
  tags?: string[] | null;
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
  phoneNumber?: string | null;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  administeredTenantId?: string | null;
  administeredTenantSubdomain?: string | null;
  phoneNumber?: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: ValidationErrors;
  message?: string;
}

export interface TenantPublicInfoDto {
  name: string;
  subdomain: string;
  phoneNumber?: string;
  theme?: ThemeSettingsDto;
}

export interface ThemeSettingsDto {
  colorPrimary: string;
  colorPrimaryDark: string;
  colorPrimaryLight: string;
  colorSecondary: string;
  colorBackground: string;
  colorSurface: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorTextOnPrimary: string;
  colorBorder: string;
  colorBorderLight: string;
  colorDisabledBg: string;
}

export interface TenantThemeDto {
  publicTheme: ThemeSettingsDto;
  adminTheme: ThemeSettingsDto;
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

export interface LinkCustomerDto {
  email: string;
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
  customerName: string;
  customerPhoneNumber: string | null;
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

export interface SearchResultsPageProps {
  subdomain: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateUserProfileDto {
  name: string;
  phoneNumber?: string | null;
}

export interface FeedbackModalData {
  title: string;
  message: ReactNode;
  iconType: "success" | "danger" | "info" | "warning";
  icon: ReactNode;
  onClose?: () => void;
}

export interface TagDto {
  id: string;
  name: string;
}

export interface CreateTagDto {
  name: string;
}

export interface UpdateTagDto {
  name: string;
}

export interface DashboardQueryParametersDto {
  timePeriod: string;
  customStartDate?: string | null;
  customEndDate?: string | null;
  granularity: string;
  metric: "revenue" | "ordercount";
  filterDimension?: string | null;
  filterValue?: string | null;
  breakdownDimension?: string;
  includeProductsWithNoSales?: boolean;
}

export interface AggregatedDataSummaryDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
}

export interface TimeSeriesDataPointDto {
  id?: string;
  label: string;
  value: number;
  count: number;
}

export interface AvailableDrillOptionDto {
  dimensionName: string;
  displayName: string;
  isBreakdownDimension?: boolean;
  targetGranularity?: string;
}

export interface DashboardResponseDto {
  title: string;
  periodDescription: string;
  summary: AggregatedDataSummaryDto;
  breakdown: TimeSeriesDataPointDto[];
  nextDrillOptions: AvailableDrillOptionDto[];
}

export interface CreateManualOrderDto {
  customerName: string;
  customerPhoneNumber: string;
  deliveryDate: Date;
  items: OrderItemDto[];
  totalAmount: number;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateAdminProfileDto {
  adminName: string;
  phoneNumber: string;
  businessName: string;
}

export interface TenantDto {
  id: string;
  subdomain: string;
  name: string;
}
