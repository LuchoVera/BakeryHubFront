import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import {
  fetchPublicTenantInfo,
  fetchTenantOrders,
} from "../../services/apiService";
import { AxiosError } from "axios";

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
  const location = useLocation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!subdomain || !isAuthenticated || authLoading) {
      setIsLoadingPage(false);
      if (!isAuthenticated && !authLoading) {
        setError("Debes iniciar sesión para ver esta página.");
      }
      return;
    }

    const fetchPageData = async () => {
      setIsLoadingPage(true);
      setError(null);
      try {
        const [tenantData, ordersData] = await Promise.all([
          fetchPublicTenantInfo(subdomain),
          fetchTenantOrders(subdomain),
        ]);
        setTenantInfo(tenantData);

        ordersData.sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        setOrders(ordersData);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.status === 401) {
          setError(
            "Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo."
          );
          navigate("/login", { state: { from: location.pathname } });
        } else if (axiosError.response?.status === 404) {
          if (
            axiosError.config?.url?.includes(
              `/public/tenants/${subdomain}/orders`
            )
          ) {
            setOrders([]);

            if (!tenantInfo) {
              const tenantInfoError = await fetchPublicTenantInfo(
                subdomain
              ).catch(() => null);
              if (tenantInfoError) setTenantInfo(tenantInfoError);
              else
                setError(
                  `La tienda "${subdomain}" no fue encontrada o no tienes pedidos.`
                );
            }
          } else {
            setError(`La tienda "${subdomain}" no fue encontrada.`);
          }
        } else {
          setError(
            axiosError.response?.data?.detail ||
              axiosError.message ||
              "Error al cargar tus pedidos o la información de la tienda."
          );
        }
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchPageData();
  }, [
    subdomain,
    isAuthenticated,
    user,
    authLoading,
    navigate,
    location.pathname,
  ]);

  if (isLoadingPage) {
    return (
      <div className={styles.loadingOrError}>
        <LuShoppingBag /> Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
      {!tenantInfo && error && !isLoadingPage && (
        <div className={styles.errorLoadingHeader}>
          {error.includes("tienda")
            ? error
            : "Error al cargar la información de la tienda."}
        </div>
      )}

      <main className={styles.ordersContent}>
        <div className={styles.backLinkContainer}>
          <Link to="/" className={styles.backLink}>
            <LuArrowLeft /> Volver a la Tienda
          </Link>
        </div>
        <h1>Mis Pedidos en {tenantInfo?.name || subdomain}</h1>

        {error && !isLoadingPage && (
          <div className={`${styles.loadingOrError} ${styles.error}`}>
            <LuCircleAlert size={48} />
            <p>{error}</p>
          </div>
        )}

        {!error && !isLoadingPage && orders.length === 0 && (
          <div className={`${styles.loadingOrError} ${styles.noOrders}`}>
            <LuPackageSearch size={48} />
            <p>Aún no tienes pedidos en esta tienda.</p>
            <p>¡Explora nuestros productos y haz tu primer pedido!</p>
          </div>
        )}

        {!error && !isLoadingPage && orders.length > 0 && (
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
