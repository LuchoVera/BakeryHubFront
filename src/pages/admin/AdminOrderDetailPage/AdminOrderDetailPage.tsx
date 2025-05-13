import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import {
  OrderDto,
  ApiErrorResponse,
  OrderStatus,
  StatusConfirmModalData,
} from "../../../types";
import styles from "./AdminOrderDetailPage.module.css";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { FaWhatsapp } from "react-icons/fa";
import {
  LuArrowLeft,
  LuUser,
  LuHash,
  LuClipboardList,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  generateWhatsAppMessageForOrder,
  getWhatsAppLink,
} from "../../../utils/whatsappUtils";
import { useAuth } from "../../../AuthContext";

const apiUrl = "/api";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const dateParts = dateString.split("T")[0].split("-");
    const date = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2])
    );
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return date.toLocaleString("es-BO", options);
  } catch (e) {
    return "Fecha Inválida";
  }
};

const formatCurrency = (amount: number): string => {
  return `Bs. ${amount.toFixed(2)}`;
};

const statusOptions: { value: OrderStatus | string; label: string }[] = [
  { value: "Pending", label: "Pendiente" },
  { value: "Confirmed", label: "Confirmado" },
  { value: "Preparing", label: "En Preparación" },
  { value: "Ready", label: "Listo" },
  { value: "Received", label: "Entregado" },
  { value: "Cancelled", label: "Cancelado" },
];

const STATUS_LABELS_DETAIL: Record<string, string> = {
  Pending: "Pendiente",
  Confirmed: "Confirmado",
  Preparing: "En Preparación",
  Ready: "Listo para Entrega",
  Received: "Entregado",
  Cancelled: "Cancelado",
  Unknown: "Desconocido",
};

const getStatusClass = (status: OrderStatus | string): string => {
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

const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [orderData, setOrderData] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalData, setConfirmModalData] =
    useState<StatusConfirmModalData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setError("No se proporcionó ID de pedido.");
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      const response = await axios.get<OrderDto>(
        `${apiUrl}/admin/orders/${orderId}`
      );
      setOrderData(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 404) {
        setError("Pedido no encontrado.");
      } else {
        setError("Error al cargar los detalles del pedido.");
      }
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const executeUpdateStatus = async (
    orderIdToUpdate: string,
    newStatus: string
  ) => {
    setIsUpdatingStatus(true);
    try {
      await axios.put(`${apiUrl}/admin/orders/${orderIdToUpdate}/status`, {
        NewStatus: newStatus,
      });
      await fetchOrderDetails();
    } catch (updateError) {
      alert(`Error al actualizar estado del pedido ${orderIdToUpdate}`);
      await fetchOrderDetails();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const requestStatusChange = (newStatus: string) => {
    if (!orderData) return;
    const currentStatus = orderData.status;
    if (newStatus === currentStatus) return;
    const orderNumber = orderData.orderNumber ?? orderData.id.substring(0, 8);
    if (newStatus === "Received" || newStatus === "Cancelled") {
      setConfirmModalData({
        orderId: orderData.id,
        orderNumber,
        currentStatus,
        newStatus,
      });
      setIsConfirmModalOpen(true);
      setOrderData((prev) =>
        prev ? { ...prev, status: currentStatus } : null
      );
    } else {
      executeUpdateStatus(orderData.id, newStatus);
    }
  };

  const handleModalConfirm = () => {
    if (confirmModalData) {
      setOrderData((prev) =>
        prev ? { ...prev, status: confirmModalData.newStatus } : null
      );
      executeUpdateStatus(confirmModalData.orderId, confirmModalData.newStatus);
    }
    setIsConfirmModalOpen(false);
    setConfirmModalData(null);
  };

  const handleModalCancel = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalData(null);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    const currentStatus = orderData?.status;
    if (currentStatus && newStatus !== currentStatus) {
      setOrderData((prev) => (prev ? { ...prev, status: newStatus } : null));
      requestStatusChange(newStatus);
    }
  };

  const handleWhatsAppClick = () => {
    if (!orderData || !orderData.customerPhoneNumber) {
      alert(
        orderData
          ? "Este cliente no tiene un número de teléfono registrado."
          : "Datos de la orden no cargados."
      );
      return;
    }
    const tenantDisplayName =
      user?.administeredTenantSubdomain || user?.name || "tu tienda";
    const message = generateWhatsAppMessageForOrder(
      orderData,
      tenantDisplayName
    );
    const whatsappUrl = getWhatsAppLink(orderData.customerPhoneNumber, message);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className={styles.message}>Cargando detalles del pedido...</div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.message} ${styles.error}`}>
        <p>{error}</p>
        <Link to="/admin/orders" className={styles.backLink}>
          <LuArrowLeft /> Volver a la Lista
        </Link>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className={styles.message}>No se encontraron datos del pedido.</div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/admin/orders" className={styles.backLink}>
        <LuArrowLeft /> Volver a la Lista de Pedidos
      </Link>

      <h1 className={styles.pageTitle}>
        Detalle del Pedido #
        {orderData.orderNumber ?? orderData.id.substring(0, 8)}
      </h1>

      <div className={styles.detailGrid}>
        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>
            <LuHash /> Información General
          </h2>
          <div className={styles.infoList}>
            <div>
              <strong># Pedido:</strong>{" "}
              <span>
                {orderData.orderNumber ?? orderData.id.substring(0, 8)}
              </span>
            </div>
            <div>
              <strong>Fecha Pedido:</strong>{" "}
              <span>{formatDate(orderData.orderDate)}</span>
            </div>
            <div>
              <strong>Fecha Entrega:</strong>{" "}
              <span>{formatDate(orderData.deliveryDate)}</span>
            </div>
            <div className={styles.statusSelectContainer}>
              <strong>Estado Actual:</strong>
              <select
                value={orderData.status}
                onChange={handleSelectChange}
                className={`${styles.statusSelect} ${getStatusClass(
                  orderData.status
                )}`}
                disabled={
                  isUpdatingStatus ||
                  orderData.status === "Received" ||
                  orderData.status === "Cancelled"
                }
              >
                {statusOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={
                      (orderData.status === "Received" ||
                        orderData.status === "Cancelled") &&
                      orderData.status !== opt.value
                    }
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              {isUpdatingStatus && (
                <span className={styles.statusSpinner}> (Guardando...)</span>
              )}
            </div>
          </div>
        </section>

        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>
            <LuUser /> Cliente
          </h2>
          <div className={styles.infoList}>
            <div>
              <strong>Nombre:</strong>{" "}
              <span>{orderData.customerName ?? "No disponible"}</span>
            </div>
            <div>
              <strong>Teléfono:</strong>
              <span>
                {orderData.customerPhoneNumber ?? "No disponible"}
                {orderData.customerPhoneNumber && (
                  <button
                    onClick={handleWhatsAppClick}
                    className={styles.whatsappButton}
                    title="Contactar por WhatsApp"
                  >
                    <FaWhatsapp />
                  </button>
                )}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className={`${styles.detailSection} ${styles.itemsSection}`}>
        <h2 className={styles.sectionTitle}>
          <LuClipboardList /> Items del Pedido ({orderData.items?.length ?? 0})
        </h2>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items?.map((item, index) => (
              <tr key={item.productId + index}>
                <td data-label="Producto:">
                  {item.productName ?? `ID: ${item.productId.substring(0, 8)}`}
                </td>
                <td data-label="Cantidad:">{item.quantity}</td>
                <td data-label="Precio Unit.:">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td data-label="Subtotal:">
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
              <td className={styles.totalAmount}>
                {formatCurrency(orderData.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        title="Confirmar Cambio de Estado"
        message={
          confirmModalData ? (
            <>
              Vas a marcar el pedido{" "}
              <strong>#{confirmModalData.orderNumber}</strong> como{" "}
              <strong>
                "
                {STATUS_LABELS_DETAIL[confirmModalData.newStatus] ??
                  confirmModalData.newStatus}
                "
              </strong>
              .
            </>
          ) : (
            ""
          )
        }
        warningMessage={
          confirmModalData ? (
            <>
              {confirmModalData.newStatus === "Cancelled"
                ? "Esta acción generalmente no se puede deshacer."
                : "Una vez marcado como entregado, no deberías cambiar el estado."}
              <br />
              ¿Estás seguro de continuar?
            </>
          ) : undefined
        }
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

export default AdminOrderDetailPage;
