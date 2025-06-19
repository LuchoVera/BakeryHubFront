import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useTenant } from "../../hooks/useTenant";
import { OrderDto, ApiErrorResponse } from "../../types";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import styles from "./CustomerOrderDetailPage.module.css";
import {
  LuArrowLeft,
  LuShoppingBag,
  LuListChecks,
  LuHash,
  LuCircleAlert,
} from "react-icons/lu";
import { fetchTenantOrderById } from "../../services/apiService";
import { AxiosError } from "axios";
import { formatDate } from "../../utils/dateUtils";

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

const CustomerOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    tenantInfo,
    subdomain,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  const fetchOrderData = useCallback(async () => {
    if (!isAuthenticated || !orderId || !subdomain) {
      setIsLoadingOrder(false);
      return;
    }
    setIsLoadingOrder(true);
    setOrderError(null);

    try {
      const orderData = await fetchTenantOrderById(subdomain, orderId);
      setOrder(orderData);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 401) {
        navigate("/login", { state: { from: location.pathname } });
      } else if (axiosError.response?.status === 404) {
        setOrderError(`Pedido no encontrado.`);
      } else {
        setOrderError(
          axiosError.response?.data?.detail ||
            axiosError.message ||
            "Error al cargar el detalle del pedido."
        );
      }
      setOrder(null);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [subdomain, orderId, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    if (!isLoadingTenant && tenantInfo) {
      fetchOrderData();
    }
  }, [fetchOrderData, isLoadingTenant, tenantInfo]);

  if (authLoading || isLoadingTenant) {
    return (
      <div className={styles.messageCenter}>
        <LuShoppingBag /> Cargando información de la tienda...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader />}
      {!tenantInfo && tenantError && (
        <div className={styles.errorLoadingHeader}>{tenantError}</div>
      )}

      <main className={styles.detailContent}>
        <div className={styles.backLinkContainer}>
          <Link to="/my-orders" className={styles.backLink}>
            <LuArrowLeft /> Volver a Mis Pedidos
          </Link>
        </div>

        {isLoadingOrder && (
          <div className={styles.messageCenter}>
            <LuShoppingBag /> Cargando detalle del pedido...
          </div>
        )}

        {orderError && (
          <div className={`${styles.messageCenter} ${styles.error}`}>
            <LuCircleAlert size={48} />
            <p>{orderError}</p>
          </div>
        )}

        {!isLoadingOrder && !orderError && order && (
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
      </main>
    </div>
  );
};

export default CustomerOrderDetailPage;
