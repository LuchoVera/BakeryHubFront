import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { OrderDto, ApiErrorResponse } from "../../../types";
import styles from "./AdminOrderDetailPage.module.css";
import { FaWhatsapp } from "react-icons/fa";
import { LuArrowLeft, LuUser, LuHash, LuClipboardList } from "react-icons/lu";

const apiUrl = "/api";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("es-BO", options);
  } catch (e) {
    return "Fecha Inválida";
  }
};

const formatCurrency = (amount: number): string => {
  return `Bs. ${amount.toFixed(2)}`;
};

const STATUS_LABELS_DETAIL: Record<string, string> = {
  Pending: "Pendiente",
  Confirmed: "Confirmado",
  Preparing: "En Preparación",
  Ready: "Listo para Entrega",
  Received: "Entregado",
  Cancelled: "Cancelado",
  Unknown: "Desconocido",
};

const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [orderData, setOrderData] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setError("No se proporcionó ID de pedido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<OrderDto>(
        `${apiUrl}/admin/orders/${orderId}`
      );
      setOrderData(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        `Error fetching order ${orderId}:`,
        axiosError.response?.data || axiosError.message
      );
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
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleWhatsAppClick = (
    phoneNumber: string | null | undefined,
    customerName: string | null | undefined,
    orderNumber: string | null | undefined
  ) => {
    if (!phoneNumber) {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }
    let phone = phoneNumber.replace(/\D/g, "");
    if (
      phone.length === 8 &&
      (phone.startsWith("6") || phone.startsWith("7"))
    ) {
      phone = `591${phone}`;
    } else if (phone.startsWith("+")) {
      phone = phone.substring(1);
    }
    if (!phone) {
      alert("Número de teléfono inválido.");
      return;
    }
    const name = customerName || "Cliente";
    const num = orderNumber || "este pedido";
    const message = `Hola ${name}, sobre tu pedido #${num}...`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
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
        <Link to="/admin/orders" className={styles.backButton}>
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

  const currentStatusLabel =
    STATUS_LABELS_DETAIL[orderData.status] ?? orderData.status;

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
            <div>
              <strong>Estado Actual:</strong>
              <span
                className={`${styles.statusBadge} ${
                  styles[orderData.status.toLowerCase()]
                }`}
              >
                {currentStatusLabel}
              </span>
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
                    onClick={() =>
                      handleWhatsAppClick(
                        orderData.customerPhoneNumber,
                        orderData.customerName,
                        orderData.orderNumber
                      )
                    }
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
    </div>
  );
};

export default AdminOrderDetailPage;
