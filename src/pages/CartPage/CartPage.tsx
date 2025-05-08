import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
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
  OrderDto,
} from "../../types";

interface CartPageProps {
  subdomain: string;
}

const apiUrl = "/api";

const getMinDeliveryDateISO = (cartItems: CartItem[]): string => {
  let maxLeadTime = 0;
  cartItems.forEach((item) => {
    const leadTime = parseInt(item.product.leadTimeDisplay, 10);
    if (!isNaN(leadTime) && leadTime > maxLeadTime) {
      maxLeadTime = leadTime;
    }
  });
  const today = new Date();
  const minDate = new Date(
    today.setDate(today.getDate() + (maxLeadTime > 0 ? maxLeadTime + 1 : 1))
  );
  const year = minDate.getFullYear();
  const month = String(minDate.getMonth() + 1).padStart(2, "0");
  const day = String(minDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

  useEffect(() => {
    setIsLoadingTenant(true);
    setError(null);
    const fetchTenantInfo = async () => {
      try {
        const response = await axios.get<TenantPublicInfoDto>(
          `${apiUrl}/public/tenants/${subdomain}`
        );
        setTenantInfo(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.status === 404
            ? `La tienda "${subdomain}" no fue encontrada.`
            : "Ocurrió un error cargando la información de la tienda."
        );
        setTenantInfo(null);
      } finally {
        setIsLoadingTenant(false);
      }
    };
    fetchTenantInfo();
  }, [subdomain]);

  useEffect(() => {
    if (cartItems.length > 0) {
      const minDate = getMinDeliveryDateISO(cartItems);
      setMinDeliveryDateISO(minDate);
      if (!finalSelectedDate && !tempSelectedDate) {
        setTempSelectedDate(minDate);
      } else if (finalSelectedDate && !tempSelectedDate) {
        setTempSelectedDate(finalSelectedDate);
      } else if (!tempSelectedDate) {
        setTempSelectedDate(minDate);
      }
    }
  }, [cartItems, finalSelectedDate, tempSelectedDate]);

  const distinctProductCount = cartItems.length;
  const totalItemQuantity = getCartTotalQuantity ? getCartTotalQuantity() : 0;
  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cartItems]);

  const handleRemoveItem = (productId: string, productName: string) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres quitar "${productName}" del carrito?`
      )
    ) {
      removeItemFromCart(productId);
    }
  };

  const handleDecrementItem = (item: CartItem) => {
    if (item.quantity === 1) {
      if (
        window.confirm(
          `¿Estás seguro de que quieres quitar "${item.product.name}" del carrito? (Reduciendo de 1)`
        )
      ) {
        decrementItemQuantity(item.product.id);
      }
    } else {
      decrementItemQuantity(item.product.id);
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
    if (new Date(tempSelectedDate) < new Date(minDeliveryDateISO)) {
      showNotification(
        `La fecha seleccionada no puede ser anterior al ${new Date(
          minDeliveryDateISO
        ).toLocaleDateString("es-ES")}.`,
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

  const handleChangeDateFromConfirmation = () => {
    setIsConfirmOrderModalOpen(false);
    setTempSelectedDate(finalSelectedDate || minDeliveryDateISO);
    setIsDatePickerModalOpen(true);
  };

  const handleFinalOrderConfirm = async () => {
    if (!finalSelectedDate || cartItems.length === 0 || !tenantInfo || !user) {
      showNotification(
        "Faltan datos para confirmar el pedido o no estás logueado.",
        "error",
        0
      );
      return;
    }
    setIsPlacingOrder(true);

    const orderItemsDto: OrderItemDto[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }));

    const createOrderPayload: CreateOrderDto = {
      deliveryDate: new Date(finalSelectedDate + "T00:00:00Z"),
      items: orderItemsDto,
      totalAmount: cartTotal,
    };

    try {
      const orderUrl = `${apiUrl}/public/tenants/${tenantInfo.subdomain}/orders`;
      const response = await axios.post<OrderDto>(orderUrl, createOrderPayload);
      const createdOrder = response.data;

      showNotification(
        `¡Pedido #${
          createdOrder?.orderNumber || createdOrder.id.substring(0, 6)
        } confirmado para el ${new Date(
          finalSelectedDate + "T00:00:00Z"
        ).toLocaleDateString("es-ES")}!`,
        "success",
        8000
      );

      if (clearCart) {
        clearCart();
      }
      setFinalSelectedDate(null);

      const adminPhoneNumber = tenantInfo.phoneNumber || "59100000000";
      const customerName = user.name || "Cliente";
      const deliveryDateFormatted = new Date(
        finalSelectedDate + "T00:00:00Z"
      ).toLocaleDateString("es-ES", {
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

      const fullMessage = `Hola ${tenantInfo.name},
¡Tienes un nuevo pedido!
-----------------------------
Pedido #: ${
        createdOrder?.orderNumber ||
        createdOrder.id.substring(0, 8).toUpperCase()
      }
Cliente: ${customerName}
Fecha de Entrega: ${deliveryDateFormatted}
-----------------------------
Detalle:
${messageItems}
-----------------------------
Total: Bs. ${cartTotal.toFixed(2)}
-----------------------------
¡Gracias!`;

      const whatsappUrl = `https://wa.me/${adminPhoneNumber.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(fullMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "Error al crear el pedido:",
        axiosError.response?.data || axiosError.message
      );
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
      setIsConfirmOrderModalOpen(false);
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
                  <div key={item.product.id} className={styles.cartItem}>
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
                        handleRemoveItem(item.product.id, item.product.name)
                      }
                      className={styles.removeItemButton}
                      aria-label={`Quitar ${item.product.name} del carrito`}
                      title="Quitar del carrito"
                    >
                      <LuTrash2 />
                    </button>
                  </div>
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
                <span>Cantidad total de productos:</span>
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
                  cartItems.length === 0 || isLoadingTenant || isPlacingOrder
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
                onClick={() => setIsDatePickerModalOpen(false)}
                className={styles.modalButtonCancel}
              >
                <LuCircleX /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmOrderModalOpen && finalSelectedDate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Pedido</h3>
            <p>
              Has seleccionado la fecha de entrega para el{" "}
              <strong>
                {new Date(finalSelectedDate + "T00:00:00").toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </strong>
              .
            </p>
            <button
              onClick={handleChangeDateFromConfirmation}
              className={styles.changeDateButton}
              disabled={isPlacingOrder}
            >
              <LuPencil /> Cambiar Fecha
            </button>
            <p className={styles.warningText}>
              Una vez confirmado, no podrás cambiar este pedido. <br />
              Si deseas añadir más productos o cambiar la fecha, deberás volver
              al carrito y realizar los cambios.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={handleFinalOrderConfirm}
                className={styles.modalButtonConfirm}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  "Confirmando..."
                ) : (
                  <>
                    <LuCircleCheck /> Confirmar Pedido Definitivamente
                  </>
                )}
              </button>
              <button
                onClick={() => setIsConfirmOrderModalOpen(false)}
                className={styles.modalButtonCancel}
                disabled={isPlacingOrder}
              >
                <LuCircleX /> Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
