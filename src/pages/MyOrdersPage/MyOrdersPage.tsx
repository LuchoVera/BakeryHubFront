import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { OrderDto } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import styles from "./MyOrdersPage.module.css";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuShoppingBag,
  LuPackageSearch,
} from "react-icons/lu";
import { fetchTenantOrders } from "../../services/apiService";
import { AxiosError } from "axios";
import { useTenant } from "../../hooks/useTenant";
import { formatDate } from "../../utils/dateUtils";

const formatCurrency = (amount: number): string => {
  return `Bs. ${amount.toFixed(2)}`;
};

const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return styles.statusPending;
    case "confirmed":
      return styles.statusConfirmed;
    case "preparing":
      return styles.statusPreparing;
    case "ready":
      return styles.statusReady;
    case "received":
      return styles.statusReceived;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pendiente",
  Confirmed: "Confirmado",
  Preparing: "En Preparación",
  Ready: "Listo para Entrega",
  Received: "Entregado",
  Cancelled: "Cancelado",
  Unknown: "Desconocido",
};

const MyOrdersPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    tenantInfo,
    subdomain,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useTenant();

  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const handleCardClick = (orderId: string) => {
    navigate(`/my-orders/${orderId}`);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  useEffect(() => {
    if (!tenantInfo) return;

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      setOrdersError(null);
      try {
        const ordersData = await fetchTenantOrders(subdomain);
        ordersData.sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        setOrders(ordersData);
      } catch (err) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          setOrders([]);
        } else {
          setOrdersError("Error al cargar tus pedidos.");
        }
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [subdomain, tenantInfo]);

  const isLoading = authLoading || isLoadingTenant || isLoadingOrders;
  const error = tenantError || ordersError;

  if (isLoading) {
    return (
      <div className={styles.loadingOrError}>
        <LuShoppingBag /> Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <TenantHeader />
      <main className={styles.ordersContent}>
        <div className={styles.backLinkContainer}>
          <Link to="/" className={styles.backLink}>
            <LuArrowLeft /> Volver a la Tienda
          </Link>
        </div>
        <h1>Mis Pedidos en {tenantInfo?.name || subdomain}</h1>

        {error && (
          <div className={`${styles.loadingOrError} ${styles.error}`}>
            <LuCircleAlert size={48} />
            <p>{error}</p>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className={`${styles.loadingOrError} ${styles.noOrders}`}>
            <LuPackageSearch size={48} />
            <p>Aún no tienes pedidos en esta tienda.</p>
            <p>¡Explora nuestros productos y haz tu primer pedido!</p>
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div
                key={order.id}
                className={styles.orderCard}
                onClick={() => handleCardClick(order.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleCardClick(order.id);
                }}
              >
                <div className={styles.orderHeader}>
                  <h3>
                    Pedido #{order.orderNumber || order.id.substring(0, 8)}
                  </h3>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className={styles.orderDetails}>
                  <p>
                    <strong>Fecha del Pedido:</strong>{" "}
                    <span>{formatDate(order.orderDate)}</span>
                  </p>
                  <p>
                    <strong>Fecha de Entrega:</strong>{" "}
                    <span>{formatDate(order.deliveryDate)}</span>
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </p>
                  <p>
                    <strong>Items:</strong> <span>{order.items.length}</span>
                  </p>
                </div>
                <div className={styles.orderItemsPreview}>
                  <h4>Productos:</h4>
                  <ul>
                    {order.items.slice(0, 3).map((item, index) => (
                      <li key={`${item.productId}-${index}`}>
                        {item.quantity} x{" "}
                        {item.productName ||
                          `Producto ID: ${item.productId.substring(0, 6)}...`}
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li>y {order.items.length - 3} más...</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;
