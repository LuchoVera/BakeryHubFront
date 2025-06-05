import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import styles from "./CartPage.module.css";
import {
  LuCirclePlus,
  LuCircleMinus,
  LuTrash2,
  LuArrowLeft,
  LuCalendarDays,
  LuCircleCheck,
  LuCircleX,
  LuPencil,
  LuTriangleAlert,
} from "react-icons/lu";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../AuthContext";
import { useNotification } from "../../hooks/useNotification";
import {
  ApiErrorResponse,
  TenantPublicInfoDto,
  CartItem,
  CreateOrderDto,
  OrderItemDto,
} from "../../types";
import {
  fetchPublicTenantInfo,
  createTenantOrder,
} from "../../services/apiService";
import { AxiosError } from "axios";

const getMinDeliveryDateISO = (cartItems: CartItem[]): string => {
  let maxItemSpecificDays = 0;

  if (cartItems.length === 0) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  cartItems.forEach((item) => {
    let currentItemDays = 0;
    const leadTimeDisplay = item.product.leadTimeDisplay;

    if (typeof leadTimeDisplay === "string") {
      const leadTimeStr = leadTimeDisplay.trim().toLowerCase();
      if (leadTimeStr === "n/a" || leadTimeStr === "" || leadTimeStr === "0") {
        currentItemDays = 0;
      } else {
        const parsedLeadTime = parseInt(leadTimeStr, 10);
        if (!isNaN(parsedLeadTime) && parsedLeadTime > 0) {
          currentItemDays = parsedLeadTime + 1;
        } else {
          currentItemDays = 1;
        }
      }
    } else if (
      leadTimeDisplay === null ||
      typeof leadTimeDisplay === "undefined"
    ) {
      currentItemDays = 0;
    } else if (typeof leadTimeDisplay === "number") {
      if (leadTimeDisplay === 0) {
        currentItemDays = 0;
      } else if (leadTimeDisplay > 0) {
        currentItemDays = leadTimeDisplay + 1;
      } else {
        currentItemDays = 1;
      }
    } else {
      currentItemDays = 1;
    }

    if (currentItemDays > maxItemSpecificDays) {
      maxItemSpecificDays = currentItemDays;
    }
  });

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + maxItemSpecificDays);

  const year = minDate.getFullYear();
  const month = String(minDate.getMonth() + 1).padStart(2, "0");
  const day = String(minDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface CartPageProps {
  subdomain: string;
}

const CartPage: React.FC<CartPageProps> = ({ subdomain }) => {
  const {
    cartItems,
    addItemToCart,
    decrementItemQuantity,
    removeItemFromCart,
    getCartTotalQuantity,
    clearCart,
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] =
    useState<boolean>(false);
  const [minDeliveryDateISO, setMinDeliveryDateISO] = useState<string>("");
  const [tempSelectedDate, setTempSelectedDate] = useState<string>("");
  const [finalSelectedDate, setFinalSelectedDate] = useState<string | null>(
    null
  );
  const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] =
    useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [confirmingRemoveProductId, setConfirmingRemoveProductId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    const fetchTenantData = async () => {
      try {
        const data = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.status === 404
            ? `La tienda "${subdomain}" no fue encontrada.`
            : axiosError.response?.data?.detail ||
                axiosError.message ||
                "Ocurrió un error cargando la información de la tienda."
        );
        setTenantInfo(null);
      } finally {
        setIsLoadingTenant(false);
      }
    };
    fetchTenantData();
  }, [subdomain]);

  useEffect(() => {
    if (cartItems.length > 0) {
      const minDate = getMinDeliveryDateISO(cartItems);
      setMinDeliveryDateISO(minDate);
      if (
        !finalSelectedDate ||
        new Date(finalSelectedDate) < new Date(minDate)
      ) {
        setTempSelectedDate(minDate);
        if (
          finalSelectedDate &&
          new Date(finalSelectedDate) < new Date(minDate)
        ) {
          setFinalSelectedDate(null);
          showNotification(
            "La fecha de entrega anterior ya no es válida debido a cambios en el carrito. Por favor, selecciona una nueva.",
            "info",
            5000
          );
        }
      } else {
        setTempSelectedDate(finalSelectedDate || minDate);
      }
    } else {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const defaultEmptyCartMinDate = tomorrow.toISOString().split("T")[0];
      setMinDeliveryDateISO(defaultEmptyCartMinDate);
      setTempSelectedDate(defaultEmptyCartMinDate);
      setFinalSelectedDate(null);
    }
  }, [cartItems, finalSelectedDate, showNotification]);

  const distinctProductCount = cartItems.length;
  const totalItemQuantity = getCartTotalQuantity ? getCartTotalQuantity() : 0;
  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cartItems]);

  const requestRemoveConfirmation = (productId: string) => {
    setConfirmingRemoveProductId(productId);
  };

  const executeActualRemove = (productId: string) => {
    removeItemFromCart(productId);
    setConfirmingRemoveProductId(null);
  };

  const cancelRemoveConfirmation = () => {
    setConfirmingRemoveProductId(null);
  };

  const handleDecrementItem = (item: CartItem) => {
    if (item.quantity === 1) {
      requestRemoveConfirmation(item.product.id);
    } else {
      decrementItemQuantity(item.product.id);
      setConfirmingRemoveProductId(null);
    }
  };

  const handleProceedToOrder = () => {
    if (!isAuthenticated) {
      showNotification(
        "Debes iniciar sesión o registrarte para realizar un pedido.",
        "loginPrompt",
        0
      );
      return;
    }
    if (user && user.roles.includes("Admin")) {
      showNotification(
        "Los administradores no pueden realizar pedidos.",
        "info",
        5000
      );
      return;
    }
    if (cartItems.length === 0) {
      showNotification(
        "Tu carrito está vacío. Añade productos primero.",
        "info",
        4000
      );
      return;
    }
    setTempSelectedDate(finalSelectedDate || minDeliveryDateISO);
    setIsDatePickerModalOpen(true);
    setIsConfirmOrderModalOpen(false);
  };

  const handleDateSelectConfirm = () => {
    if (!tempSelectedDate) {
      showNotification(
        "Por favor, selecciona una fecha para tu pedido.",
        "error",
        0
      );
      return;
    }

    const tempD = new Date(tempSelectedDate + "T00:00:00");
    const minD = new Date(minDeliveryDateISO + "T00:00:00");

    if (tempD < minD) {
      showNotification(
        `La fecha seleccionada no puede ser anterior al ${minD.toLocaleDateString(
          "es-ES",
          { day: "2-digit", month: "2-digit", year: "numeric" }
        )}.`,
        "error",
        0
      );
      setTempSelectedDate(minDeliveryDateISO);
      return;
    }
    setFinalSelectedDate(tempSelectedDate);
    setIsDatePickerModalOpen(false);
    setIsConfirmOrderModalOpen(true);
  };

  const handleDateSelectCancel = () => {
    setIsDatePickerModalOpen(false);
  };

  const handleChangeDateFromConfirmation = () => {
    setIsConfirmOrderModalOpen(false);
    setTempSelectedDate(finalSelectedDate || minDeliveryDateISO);
    setIsDatePickerModalOpen(true);
  };

  const handleConfirmModalClose = () => {
    setIsConfirmOrderModalOpen(false);
  };

  const getFinalConfirmModalMessage = (): ReactNode => {
    if (!finalSelectedDate) return null;

    const dateParts = finalSelectedDate.split("-");
    const localDisplayDate = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2])
    );

    return (
      <p>
        Has seleccionado la fecha de entrega para el{" "}
        <strong>
          {localDisplayDate.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </strong>
        .
        <br />
        <button
          onClick={handleChangeDateFromConfirmation}
          className={styles.changeDateButton}
          disabled={isPlacingOrder}
        >
          <LuPencil /> Cambiar Fecha
        </button>
      </p>
    );
  };

  const finalConfirmWarning: ReactNode = (
    <>
      Una vez confirmado, no podrás cambiar este pedido.
      <br />
      Si deseas añadir más productos o cambiar la fecha, regresa al carrito.
    </>
  );

  const handleFinalOrderConfirm = async () => {
    if (!finalSelectedDate || cartItems.length === 0 || !tenantInfo || !user) {
      showNotification(
        "Faltan datos para confirmar el pedido o no estás logueado.",
        "error",
        0
      );
      setIsConfirmOrderModalOpen(false);
      return;
    }
    setIsPlacingOrder(true);

    const orderItemsDto: OrderItemDto[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      productName: item.product.name,
    }));

    const createOrderPayload: CreateOrderDto = {
      deliveryDate: new Date(finalSelectedDate + "T00:00:00Z"),
      items: orderItemsDto,
      totalAmount: cartTotal,
    };

    try {
      const createdOrder = await createTenantOrder(
        tenantInfo.subdomain,
        createOrderPayload
      );

      const localNotificationDateParts = finalSelectedDate.split("-");
      const localNotificationDate = new Date(
        Number(localNotificationDateParts[0]),
        Number(localNotificationDateParts[1]) - 1,
        Number(localNotificationDateParts[2])
      );

      showNotification(
        `¡Pedido #${
          createdOrder?.orderNumber || createdOrder.id.substring(0, 6)
        } confirmado para el ${localNotificationDate.toLocaleDateString(
          "es-ES"
        )}!`,
        "success",
        8000
      );
      if (clearCart) {
        clearCart();
      }
      setFinalSelectedDate(null);
      setIsConfirmOrderModalOpen(false);

      const adminPhoneNumber = tenantInfo.phoneNumber || "59100000000";
      const customerName = user.name || "Cliente";

      const datePartsForWhatsApp = finalSelectedDate.split("-");
      const yearW = parseInt(datePartsForWhatsApp[0]);
      const monthW = parseInt(datePartsForWhatsApp[1]) - 1;
      const dayW = parseInt(datePartsForWhatsApp[2]);
      const localDeliveryDateForWhatsApp = new Date(yearW, monthW, dayW);

      const deliveryDateFormattedForWhatsApp =
        localDeliveryDateForWhatsApp.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

      const messageItems = cartItems
        .map(
          (item) =>
            `- ${item.quantity}x ${
              item.product.name
            } (Bs. ${item.product.price.toFixed(2)})`
        )
        .join("\n");
      const fullMessage = `Hola ${tenantInfo.name},\n
      ¡Tienes un nuevo pedido!\n
      -----------------------------\n
      Pedido #: ${
        createdOrder?.orderNumber ||
        createdOrder.id.substring(0, 8).toUpperCase()
      }\n
      Cliente: ${customerName}\n
      Fecha de Entrega: ${deliveryDateFormattedForWhatsApp}\n
      -----------------------------\n
      Detalle:\n${messageItems}\n
      -----------------------------\n
      Total: Bs. ${cartTotal.toFixed(2)}\n
      -----------------------------\n
      ¡Gracias!`;
      const whatsappUrl = `https://wa.me/${adminPhoneNumber.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(fullMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      navigate("/");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      showNotification(
        `Error al confirmar el pedido: ${
          axiosError.response?.data?.errors
            ? JSON.stringify(axiosError.response.data.errors)
            : axiosError.response?.data?.detail ||
              axiosError.response?.data?.title ||
              axiosError.message ||
              "Error desconocido."
        }`,
        "error",
        0
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoadingTenant) {
    return <div>Cargando...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
      {!tenantInfo && error && (
        <div className={styles.errorLoadingHeader}>{error}</div>
      )}

      <main className={styles.cartContent}>
        <h1>Tu Carrito de Compras</h1>
        {cartItems.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Tu carrito está vacío.</p>
            <Link to="/" className={styles.continueShoppingLink}>
              <LuArrowLeft /> Seguir Comprando
            </Link>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItemsContainer}>
              <div className={`${styles.cartItem} ${styles.cartHeaderRow}`}>
                <div className={styles.headerImagePlaceholder}></div>
                <div className={styles.headerItemDetails}>Producto</div>
                <div className={styles.headerItemQuantity}>Cantidad</div>
                <div className={styles.headerItemSubtotal}>Subtotal</div>
                <div className={styles.headerRemovePlaceholder}></div>
              </div>
              <div className={styles.cartItemsList}>
                {cartItems.map((item) => (
                  <React.Fragment key={item.product.id}>
                    <div className={styles.cartItem}>
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className={styles.itemImage}
                        />
                      ) : (
                        <div
                          className={`${styles.itemImage} ${styles.itemImagePlaceholder}`}
                        >
                          <span>Sin Imagen</span>
                        </div>
                      )}
                      <div className={styles.itemDetails}>
                        <Link
                          to={`/products/${item.product.id}`}
                          className={styles.itemName}
                        >
                          {item.product.name}
                        </Link>
                        <p className={styles.itemPrice}>
                          Bs. {item.product.price.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className={styles.itemQuantity} data-label="Cant:">
                        <button
                          onClick={() => handleDecrementItem(item)}
                          className={styles.quantityButton}
                          aria-label={`Reducir cantidad de ${item.product.name}`}
                          title="Reducir cantidad"
                          disabled={
                            confirmingRemoveProductId === item.product.id &&
                            item.quantity === 1
                          }
                        >
                          <LuCircleMinus />
                        </button>
                        <span
                          className={styles.quantityDisplay}
                          aria-label="Cantidad actual"
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addItemToCart(item.product)}
                          className={styles.quantityButton}
                          aria-label={`Aumentar cantidad de ${item.product.name}`}
                          title="Aumentar cantidad"
                        >
                          <LuCirclePlus />
                        </button>
                      </div>
                      <p className={styles.itemSubtotal} data-label="Total:">
                        Bs. {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() =>
                          requestRemoveConfirmation(item.product.id)
                        }
                        className={styles.removeItemButton}
                        aria-label={`Quitar ${item.product.name} del carrito`}
                        title="Quitar del carrito"
                        disabled={confirmingRemoveProductId === item.product.id}
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                    {confirmingRemoveProductId === item.product.id && (
                      <div className={styles.confirmRemoveRow}>
                        <span className={styles.confirmRemoveMessage}>
                          <LuTriangleAlert /> ¿Eliminar "{item.product.name}"?
                        </span>
                        <div className={styles.confirmRemoveActions}>
                          <button
                            onClick={() => executeActualRemove(item.product.id)}
                            className={`${styles.confirmRemoveButton} ${styles.confirmRemoveButtonYes}`}
                          >
                            Sí
                          </button>
                          <button
                            onClick={cancelRemoveConfirmation}
                            className={`${styles.confirmRemoveButton} ${styles.confirmRemoveButtonNo}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={styles.cartSummary}>
              <h2>Resumen</h2>
              <div className={styles.summaryLine}>
                <span>Tipos de Productos:</span>
                <span>{distinctProductCount}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Cantidad total:</span>
                <span>{totalItemQuantity}</span>
              </div>
              {finalSelectedDate && (
                <div
                  className={`${styles.summaryLine} ${styles.selectedDateInfo}`}
                >
                  <span>Fecha de Entrega:</span>
                  <span>
                    {new Date(
                      finalSelectedDate + "T00:00:00"
                    ).toLocaleDateString("es-ES", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
                <span>Total:</span>
                <span>Bs. {cartTotal.toFixed(2)}</span>
              </div>
              <button
                className={styles.checkoutButton}
                onClick={handleProceedToOrder}
                disabled={
                  cartItems.length === 0 ||
                  isLoadingTenant ||
                  isPlacingOrder ||
                  !!confirmingRemoveProductId
                }
              >
                {isPlacingOrder
                  ? "Procesando..."
                  : finalSelectedDate
                  ? "Confirmar Pedido"
                  : "Elegir Fecha y Proceder"}
              </button>
              <Link to="/" className={styles.continueShoppingLink}>
                <LuArrowLeft /> Seguir Comprando
              </Link>
            </div>
          </div>
        )}
      </main>

      {isDatePickerModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>
              <LuCalendarDays /> Selecciona la Fecha de Entrega
            </h3>
            <p>
              Debido al tiempo de preparación, tu pedido puede estar listo a
              partir del día indicado.
            </p>
            <div className={styles.datePickerGroup}>
              <label htmlFor="deliveryDate">Fecha para el pedido:</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={tempSelectedDate}
                min={minDeliveryDateISO}
                onChange={(e) => setTempSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDateSelectConfirm}
                className={styles.modalButtonConfirm}
                disabled={!tempSelectedDate}
              >
                <LuCircleCheck /> Confirmar Fecha
              </button>
              <button
                onClick={handleDateSelectCancel}
                className={styles.modalButtonCancel}
              >
                <LuCircleX /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOrderModalOpen}
        onClose={handleConfirmModalClose}
        onConfirm={handleFinalOrderConfirm}
        title="Confirmar Pedido"
        message={getFinalConfirmModalMessage()}
        warningMessage={finalConfirmWarning}
        confirmText="Confirmar Pedido Definitivamente"
        cancelText="Volver al Carrito"
        isConfirming={isPlacingOrder}
        icon={<LuCircleCheck />}
        iconType="success"
      />
    </div>
  );
};

export default CartPage;
