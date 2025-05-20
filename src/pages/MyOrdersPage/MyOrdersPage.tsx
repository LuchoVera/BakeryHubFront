import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { useAuth } from "../../AuthContext";
import { OrderDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import styles from "./MyOrdersPage.module.css";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuShoppingBag,
  LuPackageSearch,
} from "react-icons/lu";

const apiUrl = "/api";

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "Fecha Inválida";
  }
};

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

interface MyOrdersPageProps {
  subdomain: string;
}

const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ subdomain }) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCardClick = (orderId: string) => {
    navigate(`/my-orders/${orderId}`);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/my-orders` } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!subdomain || !isAuthenticated) {
      setIsLoadingTenant(false);
      if (!isAuthenticated && !authLoading)
        setError("Debes iniciar sesión para ver esta página.");
      return;
    }

    const fetchTenantInfo = async () => {
      setIsLoadingTenant(true);
      setError(null);
      try {
        const response = await axios.get<TenantPublicInfoDto>(
          `${apiUrl}/public/tenants/${subdomain}`
        );
        setTenantInfo(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 404) {
          setError(`La tienda "${subdomain}" no fue encontrada.`);
        } else {
          setError("Error al cargar la información de la tienda.");
        }
        setTenantInfo(null);
      } finally {
        setIsLoadingTenant(false);
      }
    };

    if (isAuthenticated) {
      fetchTenantInfo();
    }
  }, [subdomain, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!tenantInfo || !isAuthenticated || !user || authLoading) {
      setIsLoadingOrders(false);
      if (tenantInfo && !isAuthenticated && !authLoading)
        setError("Debes iniciar sesión para ver tus pedidos.");
      return;
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      setError(null);
      try {
        const ordersResponse = await axios.get<OrderDto[]>(
          `${apiUrl}/public/tenants/${subdomain}/orders`,
          { withCredentials: true }
        );
        setOrders(ordersResponse.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 401) {
          setError(
            "Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo."
          );
          navigate("/login", { state: { from: `/my-orders` } });
        } else if (axiosError.response?.status === 404) {
          setError(`No se encontraron pedidos para la tienda "${subdomain}".`);
        } else {
          setError(
            axiosError.response?.data?.detail ||
              axiosError.message ||
              "Error al cargar tus pedidos."
          );
        }
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [tenantInfo, subdomain, isAuthenticated, user, authLoading, navigate]);

  const pageIsLoading = authLoading || isLoadingTenant || isLoadingOrders;

  if (pageIsLoading) {
    return (
      <div className={styles.loadingOrError}>
        <LuShoppingBag /> Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
      {!tenantInfo && error && !isLoadingTenant && (
        <div className={styles.errorLoadingHeader}>{error}</div>
      )}

      <main className={styles.ordersContent}>
        <div className={styles.backLinkContainer}>
          <Link to="/" className={styles.backLink}>
            <LuArrowLeft /> Volver a la Tienda
          </Link>
        </div>
        <h1>Mis Pedidos en {tenantInfo?.name || subdomain}</h1>

        {error && !pageIsLoading && (
          <div className={`${styles.loadingOrError} ${styles.error}`}>
            <LuCircleAlert size={48} />
            <p>{error}</p>
          </div>
        )}

        {!error && !pageIsLoading && orders.length === 0 && (
          <div className={`${styles.loadingOrError} ${styles.noOrders}`}>
            <LuPackageSearch size={48} />
            <p>Aún no tienes pedidos en esta tienda.</p>
            <p>¡Explora nuestros productos y haz tu primer pedido!</p>
          </div>
        )}

        {!error && !pageIsLoading && orders.length > 0 && (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div
                key={order.id}
                className={styles.orderCard}
                onClick={() => handleCardClick(order.id)}
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
                    {formatDate(order.orderDate)}
                  </p>
                  <p>
                    <strong>Fecha de Entrega:</strong>{" "}
                    {formatDate(order.deliveryDate)}
                  </p>
                  <p>
                    <strong>Total:</strong> {formatCurrency(order.totalAmount)}
                  </p>
                  <p>
                    <strong>Items:</strong> {order.items.length}
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
                      <li>{order.items.length - 3} más...</li>
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
