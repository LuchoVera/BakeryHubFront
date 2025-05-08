import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import axios, { AxiosError } from "axios";
import styles from "./AdminOrdersPage.module.css";
import {
  OrderDto,
  ApiErrorResponse,
  OrderStatus,
  StatusConfirmModalData,
} from "../../../types";
import OrdersTable from "../../../components/OrdersTable/OrdersTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { LuTriangleAlert } from "react-icons/lu";

const apiUrl = "/api";

const STATUS_ORDER: (OrderStatus | string)[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Received",
  "Cancelled",
];

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pendientes",
  Confirmed: "Confirmados",
  Preparing: "En Preparación",
  Ready: "Listos para Entrega",
  Received: "Entregados",
  Cancelled: "Cancelados",
  Unknown: "Estado Desconocido",
};

const AdminOrdersPage: React.FC = () => {
  const [allOrders, setAllOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalData, setConfirmModalData] =
    useState<StatusConfirmModalData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<OrderDto[]>(`${apiUrl}/admin/orders/my`);
      setAllOrders(response.data || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error fetching orders:",
        axiosError.response?.data || axiosError.message
      );
      setError(
        axiosError.response?.data?.title ||
          axiosError.message ||
          "Error al cargar los pedidos."
      );
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderDto[]> = {};
    allOrders.forEach((order) => {
      const statusKey = order.status || "Unknown";
      if (!groups[statusKey]) groups[statusKey] = [];
      groups[statusKey].push(order);
    });
    return groups;
  }, [allOrders]);

  const executeUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await axios.put(`${apiUrl}/admin/orders/${orderId}/status`, {
        NewStatus: newStatus,
      });
      await fetchOrders();
    } catch (updateError) {
      console.error("Error updating order status:", updateError);
      alert(`Error al actualizar estado del pedido ${orderId}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const requestStatusChange = (orderId: string, newStatus: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    const currentStatus = order.status;
    const orderNumber = order.orderNumber ?? order.id.substring(0, 8);

    if (newStatus === "Received" || newStatus === "Cancelled") {
      setConfirmModalData({ orderId, orderNumber, currentStatus, newStatus });
      setIsConfirmModalOpen(true);
    } else {
      executeUpdateStatus(orderId, newStatus);
    }
  };

  const handleModalConfirm = () => {
    if (confirmModalData) {
      executeUpdateStatus(confirmModalData.orderId, confirmModalData.newStatus);
    }
    setIsConfirmModalOpen(false);
    setConfirmModalData(null);
  };

  const handleModalCancel = () => {
    if (confirmModalData) {
      setAllOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === confirmModalData.orderId
            ? { ...o, status: confirmModalData.currentStatus }
            : o
        )
      );
    }
    setIsConfirmModalOpen(false);
    setConfirmModalData(null);
  };

  const statusesToRender = useMemo(() => {
    if (activeFilter === null) {
      return STATUS_ORDER.filter((status) => groupedOrders[status]?.length > 0);
    }
    return groupedOrders[activeFilter] ? [activeFilter] : [];
  }, [activeFilter, groupedOrders]);

  const getModalMessage = (): ReactNode => {
    if (!confirmModalData) return "";
    return (
      <>
        Vas a marcar el pedido <strong>#{confirmModalData.orderNumber}</strong>{" "}
        como{" "}
        <strong>
          "
          {STATUS_LABELS[confirmModalData.newStatus] ??
            confirmModalData.newStatus}
          "
        </strong>
        .
      </>
    );
  };

  const getModalWarning = (): ReactNode | undefined => {
    if (
      !confirmModalData ||
      (confirmModalData.newStatus !== "Received" &&
        confirmModalData.newStatus !== "Cancelled")
    ) {
      return undefined;
    }
    const message =
      confirmModalData.newStatus === "Cancelled"
        ? "Esta acción no se puede deshacer."
        : "Una vez marcado como entregado, no podrás cambiar el estado.";

    return (
      <>
        {message}
        <br />
        ¿Estás seguro de continuar?
      </>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <h2>Gestión de Pedidos</h2>

      <div className={styles.filterTabs}>
        <button
          onClick={() => setActiveFilter(null)}
          className={`${styles.filterTab} ${
            activeFilter === null ? styles.activeFilterTab : ""
          }`}
        >
          Todos ({allOrders.length})
        </button>
        {STATUS_ORDER.map((status) => {
          const count = groupedOrders[status]?.length ?? 0;
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`${styles.filterTab} ${
                activeFilter === status ? styles.activeFilterTab : ""
              }`}
            >
              {STATUS_LABELS[status] ?? status} ({count})
            </button>
          );
        })}
      </div>

      {isLoading && <p className={styles.loadingText}>Cargando pedidos...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!isLoading && !error && allOrders.length === 0 && (
        <p className={styles.noOrdersText}>No hay pedidos para mostrar.</p>
      )}

      {!isLoading && !error && allOrders.length > 0 && (
        <div className={styles.orderGroupsContainer}>
          {statusesToRender.length === 0 && activeFilter !== null && (
            <p className={styles.noOrdersText}>
              No hay pedidos con el estado "
              {STATUS_LABELS[activeFilter] ?? activeFilter}".
            </p>
          )}

          {statusesToRender.map((status) => (
            <section key={status} className={styles.orderGroup}>
              <h3 className={styles.groupTitle}>
                {STATUS_LABELS[status] ?? status}
              </h3>
              <OrdersTable
                orders={groupedOrders[status] || []}
                onStatusChange={requestStatusChange}
              />
            </section>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        title="Confirmar Cambio de Estado"
        message={getModalMessage()}
        warningMessage={getModalWarning()}
        confirmText="Sí, Confirmar"
        cancelText="Cancelar"
        isConfirming={isUpdatingStatus}
        icon={<LuTriangleAlert />}
        iconType="warning"
        confirmButtonVariant={
          confirmModalData?.newStatus === "Cancelled" ? "danger" : "primary"
        }
      />
    </div>
  );
};

export default AdminOrdersPage;
