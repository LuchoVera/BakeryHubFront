import React from "react";
import styles from "./OrdersTable.module.css";
import { OrderDto, OrderStatus } from "../../types";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

interface OrdersTableProps {
  orders: OrderDto[];
  onStatusChange: (orderId: string, newStatus: OrderStatus | string) => void;
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
      return new Date(dateString).toLocaleDateString("es-ES", {
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

  const handleWhatsAppClick = (order: OrderDto) => {
    if (!order.customerPhoneNumber) {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }

    let phoneNumber = order.customerPhoneNumber.replace(/\D/g, "");
    if (
      phoneNumber.length === 8 &&
      (phoneNumber.startsWith("6") || phoneNumber.startsWith("7"))
    ) {
      phoneNumber = `591${phoneNumber}`;
    } else if (phoneNumber.startsWith("+")) {
      phoneNumber = phoneNumber.substring(1);
    }

    if (!phoneNumber) {
      alert("Número de teléfono inválido después de formatear.");
      return;
    }

    let message = "";
    const orderNum =
      order.orderNumber ?? order.id.substring(0, 8).toUpperCase();
    const deliveryDate = formatDate(order.deliveryDate);

    switch (order.status?.toLowerCase()) {
      case "pending":
        message = `Hola ${order.customerName}, tu pedido #${orderNum} está pendiente. Por favor, confirma el pago para que podamos procesarlo. ¡Gracias!`;
        break;
      case "confirmed":
        message = `Hola ${order.customerName}, ¡tu pedido #${orderNum} ha sido confirmado! Estará listo para el ${deliveryDate}. ¡Gracias!`;
        break;
      case "preparing":
        message = `Hola ${order.customerName}, ¡tu pedido #${orderNum} ya está en preparación! Te avisaremos cuando esté listo.`;
        break;
      case "ready":
        message = `Hola ${order.customerName}, ¡buenas noticias! Tu pedido #${orderNum} está listo para ser recogido/entregado hoy (${deliveryDate}).`;
        break;
      case "cancelled":
        message = `Hola ${order.customerName}, lamentamos informarte que tu pedido #${orderNum} ha sido cancelado. Contáctanos si tienes dudas.`;
        break;
      case "received":
        message = `Hola ${order.customerName}, esperamos que hayas disfrutado tu pedido #${orderNum}. ¡Gracias por tu preferencia!`;
        break;
      default:
        message = `Hola ${order.customerName}, sobre tu pedido #${orderNum}...`;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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
                {order.orderNumber ?? order.id.substring(0, 8)}
              </td>
              <td data-label="Fecha Pedido:">{formatDate(order.orderDate)}</td>
              <td data-label="Fecha Entrega:">
                {formatDate(order.deliveryDate)}
              </td>
              <td data-label="Cliente:">{order.customerName ?? "N/A"}</td>
              <td data-label="Tipos Productos:">{order.items?.length ?? 0}</td>
              <td data-label="Total (Bs.):">{order.totalAmount.toFixed(2)}</td>
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
                      handleWhatsAppClick(order);
                    }}
                    className={`${styles.actionButton} ${styles.whatsappButton}`}
                    title="Enviar WhatsApp al Cliente"
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
