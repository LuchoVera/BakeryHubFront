import React from "react";
import styles from "./OrdersTable.module.css";
import { OrderDto, OrderStatus } from "../../types";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { LuChevronRight } from "react-icons/lu";
import { formatDate } from "../../utils/dateUtils";

interface OrdersTableProps {
  orders: OrderDto[];
  onStatusChange: (orderId: string, newStatus: OrderStatus | string) => void;
  onWhatsAppClick: (order: OrderDto) => void;
}

const statusOrder: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Received",
];

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

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pendiente",
  Confirmed: "Confirmado",
  Preparing: "En Preparación",
  Ready: "Listo",
  Received: "Entregado",
  Cancelled: "Cancelado",
};

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onStatusChange,
  onWhatsAppClick,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const stopPropagation = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th># Pedido</th>
            <th>Fecha Pedido</th>
            <th>Fecha Entrega</th>
            <th>Cliente</th>
            <th>Items</th>
            <th>Total (Bs.)</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const currentStatusIndex = statusOrder.indexOf(
              order.status as OrderStatus
            );
            const nextStatus =
              currentStatusIndex !== -1 &&
              currentStatusIndex < statusOrder.length - 1
                ? statusOrder[currentStatusIndex + 1]
                : null;
            const isFinalState =
              order.status === "Received" || order.status === "Cancelled";

            return (
              <tr
                key={order.id}
                onClick={() => handleRowClick(order.id)}
                className={styles.clickableRow}
              >
                <td data-label="# Pedido:">
                  <span>{order.orderNumber ?? order.id.substring(0, 8)}</span>
                </td>
                <td data-label="Fecha Pedido:">
                  <span>{formatDate(order.orderDate)}</span>
                </td>
                <td data-label="Fecha Entrega:">
                  <span>{formatDate(order.deliveryDate)}</span>
                </td>
                <td data-label="Cliente:" title={order.customerName ?? "N/A"}>
                  <span>{order.customerName ?? "N/A"}</span>
                </td>
                <td data-label="Items:">
                  <span>{order.items?.length ?? 0}</span>
                </td>
                <td data-label="Total (Bs.):">
                  <span>{order.totalAmount.toFixed(2)}</span>
                </td>
                <td data-label="Estado:">
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td data-label="Acciones:" onClick={stopPropagation}>
                  <div className={styles.actionButtons}>
                    {!isFinalState && nextStatus && (
                      <button
                        onClick={() => onStatusChange(order.id, nextStatus)}
                        className={`${styles.actionButton} ${styles.advanceButton}`}
                        title={`Avanzar a: ${STATUS_LABELS[nextStatus]}`}
                      >
                        <span className={styles.advanceButtonText}>
                          Avanzar
                        </span>
                        <LuChevronRight />
                      </button>
                    )}
                    <button
                      onClick={() => onWhatsAppClick(order)}
                      className={`${styles.actionButton} ${styles.whatsappButton}`}
                      title="Contactar por WhatsApp"
                      disabled={!order.customerPhoneNumber}
                      aria-label="Contactar por WhatsApp"
                    >
                      <FaWhatsapp />
                      <span className={styles.whatsappText}>Contactar</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
