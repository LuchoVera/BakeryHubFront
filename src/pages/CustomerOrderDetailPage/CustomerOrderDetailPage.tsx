import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { OrderDto, TenantPublicInfoDto, ApiErrorResponse } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import styles from "./CustomerOrderDetailPage.module.css";
import {
  LuArrowLeft,
  LuShoppingBag,
  LuListChecks,
  LuHash,
  LuCircleAlert,
} from "react-icons/lu";
import {
  fetchPublicTenantInfo,
  fetchTenantOrderById,
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

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pendiente",
  Confirmed: "Confirmado",
  Preparing: "En Preparación",
  Ready: "Listo para Entrega",
  Received: "Entregado",
  Cancelled: "Cancelado",
  Unknown: "Desconocido",
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

interface CustomerOrderDetailPageProps {
  subdomain: string;
}

const CustomerOrderDetailPage: React.FC<CustomerOrderDetailPageProps> = ({
  subdomain,
}) => {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);
  const fetchPageData = useCallback(async () => {
    if (!isAuthenticated || !orderId || authLoading) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (!tenantInfo) {
        const fetchedTenantInfo = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(fetchedTenantInfo);
      }
      const orderData = await fetchTenantOrderById(subdomain, orderId);
      setOrder(orderData);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 401) {
        navigate("/login", { state: { from: location.pathname } });
      } else if (axiosError.response?.status === 404) {
        setError(`Pedido no encontrado o la tienda '${subdomain}' no existe.`);
      } else {
        setError(
          axiosError.response?.data?.detail ||
            axiosError.message ||
            "Error al cargar el detalle del pedido."
        );
      }
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    subdomain,
    orderId,
    isAuthenticated,
    authLoading,
    navigate,
    location.pathname,
    tenantInfo,
  ]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  if (authLoading || isLoading) {
    return (
      <div className={styles.messageCenter}>
        <LuShoppingBag /> Cargando detalle del pedido...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
      {!tenantInfo && error && !isLoading && (
        <div className={styles.errorLoadingHeader}>
          {error.includes("tienda")
            ? error
            : "Error al cargar información de la tienda."}
        </div>
      )}

      <main className={styles.detailContent}>
        <div className={styles.backLinkContainer}>
          <Link to="/my-orders" className={styles.backLink}>
            <LuArrowLeft /> Volver a Mis Pedidos
          </Link>
        </div>

        {error && !order && (
          <div className={`${styles.messageCenter} ${styles.error}`}>
            <LuCircleAlert size={48} />
            <p>{error}</p>
          </div>
        )}

        {!error && order && (
          <>
            <h1 className={styles.pageTitle}>
              Detalle del Pedido{" "}
              <span className={styles.orderNumber}>
                #{order.orderNumber || order.id.substring(0, 8)}
              </span>
            </h1>

            <div className={styles.detailGrid}>
              <section className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>
                  <LuHash /> Información General
                </h2>
                <div className={styles.infoList}>
                  <div>
                    <strong># Pedido:</strong>{" "}
                    <span>{order.orderNumber || order.id.substring(0, 8)}</span>
                  </div>
                  <div>
                    <strong>Fecha Pedido:</strong>{" "}
                    <span>{formatDate(order.orderDate)}</span>
                  </div>
                  <div>
                    <strong>Fecha Entrega:</strong>{" "}
                    <span>{formatDate(order.deliveryDate)}</span>
                  </div>
                  <div>
                    <strong>Estado:</strong>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <section
              className={`${styles.detailSection} ${styles.itemsSection}`}
            >
              <h2 className={styles.sectionTitle}>
                <LuListChecks /> Productos en tu Pedido (
                {order.items?.length || 0})
              </h2>
              {order.items && order.items.length > 0 ? (
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className={styles.colQuantity}>Cantidad</th>
                      <th className={styles.colPrice}>Precio Unit.</th>
                      <th className={styles.colSubtotal}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`}>
                        <td data-label="Producto:">
                          {item.productName ||
                            `ID: ${item.productId.substring(0, 8)}`}
                        </td>
                        <td
                          data-label="Cantidad:"
                          className={styles.colQuantity}
                        >
                          {item.quantity}
                        </td>
                        <td
                          data-label="Precio Unit.:"
                          className={styles.colPrice}
                        >
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td
                          data-label="Subtotal:"
                          className={styles.colSubtotal}
                        >
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className={styles.totalLabel}>
                        Monto Total:
                      </td>
                      <td
                        className={`${styles.totalAmount} ${styles.colSubtotal}`}
                      >
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p>No hay productos en este pedido.</p>
              )}
            </section>
          </>
        )}
        {!error && !order && !isLoading && (
          <div className={styles.messageCenter}>
            <p>No se encontró el pedido.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerOrderDetailPage;
