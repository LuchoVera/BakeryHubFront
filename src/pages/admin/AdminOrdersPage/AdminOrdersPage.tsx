import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import styles from "./AdminOrdersPage.module.css";
import {
  OrderDto,
  ApiErrorResponse,
  OrderStatus,
  StatusConfirmModalData,
  TenantPublicInfoDto,
} from "../../../types";
import OrdersTable from "../../../components/OrdersTable/OrdersTable";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { LuTriangleAlert } from "react-icons/lu";
import {
  generateWhatsAppMessageForOrder,
  getWhatsAppLink,
} from "../../../utils/whatsappUtils";
import { useAuth } from "../../../AuthContext";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchPublicTenantInfo,
} from "../../../services/apiService";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

const STATUS_ORDER: OrderStatus[] = [
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
  const location = useLocation();
  const navigate = useNavigate();

  const getFilterFromUrl = useCallback((): OrderStatus => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status") as OrderStatus;
    return STATUS_ORDER.includes(status) ? status : "Pending";
  }, [location.search]);

  const [activeFilter, setActiveFilter] = useState<OrderStatus>(
    getFilterFromUrl()
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalData, setConfirmModalData] =
    useState<StatusConfirmModalData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const { user } = useAuth();
  const [tenantBusinessInfo, setTenantBusinessInfo] =
    useState<TenantPublicInfoDto | null>(null);

  useEffect(() => {
    setActiveFilter(getFilterFromUrl());
  }, [location.search, getFilterFromUrl]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders();
      setAllOrders(data || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.title ||
          axiosError.response?.data?.detail ||
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

  useEffect(() => {
    if (user?.administeredTenantSubdomain) {
      const fetchTenantInfo = async () => {
        try {
          const info = await fetchPublicTenantInfo(
            user.administeredTenantSubdomain!
          );
          setTenantBusinessInfo(info);
        } catch (error) {
          console.error(
            "Failed to fetch tenant business name for WhatsApp:",
            error
          );
        }
      };
      fetchTenantInfo();
    }
  }, [user?.administeredTenantSubdomain]);

  const handleFilterChange = (status: OrderStatus) => {
    setActiveFilter(status);
    navigate(`/admin/orders?status=${status}`);
  };

  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderDto[]> = {};
    allOrders.forEach((order) => {
      const statusKey = order.status || "Unknown";
      if (!groups[statusKey]) groups[statusKey] = [];
      groups[statusKey].push(order);
    });
    for (const key in groups) {
      groups[key].sort(
        (a, b) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
    }
    return groups;
  }, [allOrders]);

  const executeUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (updateError) {
      const axiosErr = updateError as AxiosError<ApiErrorResponse>;
      alert(
        `Error al actualizar estado del pedido ${orderId}: ${
          axiosErr.response?.data?.detail || axiosErr.message
        }`
      );
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

  const handleWhatsAppClick = (order: OrderDto) => {
    if (!order.customerPhoneNumber) {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }
    const tenantDisplayName =
      tenantBusinessInfo?.name ||
      user?.administeredTenantSubdomain ||
      user?.name ||
      "tu tienda";

    const message = generateWhatsAppMessageForOrder(order, tenantDisplayName);
    const whatsappUrl = getWhatsAppLink(order.customerPhoneNumber, message);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const statusesToRender = useMemo(() => {
    return groupedOrders[activeFilter]?.length > 0 ? [activeFilter] : [];
  }, [activeFilter, groupedOrders]);

  return (
    <div className={styles.pageContainer}>
      <h2>Gestión de Pedidos</h2>
      <div className={styles.createOrderContainer}>
        <Link to="/admin/orders/new-manual" className="button button-primary">
          Crear Pedido Manual
        </Link>
      </div>
      <div className={styles.filterTabs}>
        {STATUS_ORDER.map((status) => {
          const count = groupedOrders[status]?.length ?? 0;
          return (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
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
          {statusesToRender.length === 0 && (
            <p className={styles.noOrdersText}>
              No hay pedidos con el estado "
              {STATUS_LABELS[activeFilter] ?? activeFilter}".
            </p>
          )}
          {statusesToRender.map((statusKey) => (
            <section key={statusKey} className={styles.orderGroup}>
              <OrdersTable
                orders={groupedOrders[statusKey] || []}
                onStatusChange={requestStatusChange}
                onWhatsAppClick={handleWhatsAppClick}
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
