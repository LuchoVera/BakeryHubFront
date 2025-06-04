import React from "react";
import styles from "./OrdersTable.module.css";
import { OrderDto, OrderStatus } from "../../types";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

interface OrdersTableProps {
  orders: OrderDto[];
  onStatusChange: (orderId: string, newStatus: OrderStatus | string) => void;
  onWhatsAppClick: (order: OrderDto) => void;
}

const statusOptions: { value: OrderStatus | string; label: string }[] = [
  { value: "Pending", label: "Pendiente" },
  { value: "Confirmed", label: "Confirmado" },
  { value: "Preparing", label: "En Preparación" },
  { value: "Ready", label: "Listo" },
  { value: "Received", label: "Entregado" },
  { value: "Cancelled", label: "Cancelado" },
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

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onStatusChange,
  onWhatsAppClick,
}) => {
  const navigate = useNavigate();

  const handleLocalStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    orderId: string
  ) => {
    const newStatus = event.target.value as OrderStatus | string;
    onStatusChange(orderId, newStatus);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const dateParts = dateString.split("T")[0].split("-");
      const date = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2])
      );
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return "Fecha Inválida";
    }
  };

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
            <th>Tipos Productos</th>
            <th>Total (Bs.)</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
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
              <td data-label="Cliente:">
                <span>{order.customerName ?? "N/A"}</span>
              </td>
              <td data-label="Tipos Productos:">
                <span>{order.items?.length ?? 0}</span>
              </td>
              <td data-label="Total (Bs.):">
                <span>{order.totalAmount.toFixed(2)}</span>
              </td>
              <td data-label="Estado:" onClick={stopPropagation}>
                <select
                  value={order.status}
                  onChange={(e) => handleLocalStatusChange(e, order.id)}
                  className={`${styles.statusSelect} ${getStatusClass(
                    order.status
                  )}`}
                  disabled={
                    order.status === "Received" || order.status === "Cancelled"
                  }
                >
                  {statusOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={
                        (order.status === "Received" ||
                          order.status === "Cancelled") &&
                        order.status !== opt.value
                      }
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td data-label="Acciones:" onClick={stopPropagation}>
                <div className={styles.actionButtons}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWhatsAppClick(order);
                    }}
                    className={`${styles.actionButton} ${styles.whatsappButton}`}
                    title="Contactar cliente por WhatsApp"
                    disabled={!order.customerPhoneNumber}
                    aria-label="Contactar cliente por WhatsApp"
                  >
                    <FaWhatsapp />
                    <span className={styles.whatsappText}>Contactar</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
