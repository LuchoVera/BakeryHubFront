import { OrderDto } from "../types";

const formatDateForMessage = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Fecha no especificada";
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

export const generateWhatsAppMessageForOrder = (
  order: OrderDto,
  tenantName: string
): string => {
  const customerName = order.customerName || "Cliente";
  const orderNum = order.orderNumber ?? order.id.substring(0, 8).toUpperCase();
  const deliveryDate = formatDateForMessage(order.deliveryDate);
  let messageBody = "";

  switch (order.status?.toLowerCase()) {
    case "pending":
      messageBody = `tu pedido #${orderNum} en ${tenantName} está pendiente. Por favor, confirma el pago para que podamos procesarlo. ¡Gracias!`;
      break;
    case "confirmed":
      messageBody = `¡tu pedido #${orderNum} en ${tenantName} ha sido confirmado! Estará listo para el ${deliveryDate}. ¡Gracias!`;
      break;
    case "preparing":
      messageBody = `¡tu pedido #${orderNum} en ${tenantName} ya está en preparación! Te avisaremos cuando esté listo.`;
      break;
    case "ready":
      messageBody = `¡buenas noticias! Tu pedido #${orderNum} en ${tenantName} está listo para ser recogido/entregado el ${deliveryDate}.`;
      break;
    case "cancelled":
      messageBody = `lamentamos informarte que tu pedido #${orderNum} en ${tenantName} ha sido cancelado. Contáctanos si tienes dudas.`;
      break;
    case "received":
      messageBody = `esperamos que hayas disfrutado tu pedido #${orderNum} de ${tenantName}. ¡Gracias por tu preferencia!`;
      break;
    default:
      messageBody = `sobre tu pedido #${orderNum} en ${tenantName}...`;
  }
  return `Hola ${customerName}, ${messageBody}`;
};

export const getWhatsAppLink = (
  phoneNumber: string,
  message: string
): string => {
  let phone = phoneNumber;

  if (phone.length === 8 && (phone.startsWith("6") || phone.startsWith("7"))) {
    phone = `591${phone}`;
  } else if (phone.startsWith("+")) {
    phone = phone.substring(1);
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
