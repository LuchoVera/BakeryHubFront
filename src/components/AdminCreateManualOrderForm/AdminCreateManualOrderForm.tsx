import React, {
  useState,
  useEffect,
  useMemo,
  ChangeEvent,
  FocusEvent,
} from "react";
import {
  ProductDto,
  OrderItemDto,
  ApiErrorResponse,
  CreateManualOrderDto,
} from "../../types";
import {
  fetchAdminProducts,
  createManualAdminOrder,
} from "../../services/apiService";
import styles from "./AdminCreateManualOrderForm.module.css";
import { useNotification } from "../../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import { LuX, LuCirclePlus, LuCircleMinus } from "react-icons/lu";
import { AxiosError } from "axios";

const AdminCreateManualOrderForm: React.FC = () => {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientErrors, setClientErrors] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    );
    setDeliveryDate(localDate.toISOString().split("T")[0]);
    const loadProducts = async () => {
      try {
        const productsData = await fetchAdminProducts();
        setAllProducts(
          productsData
            .filter((p) => p.isAvailable)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        setError("No se pudieron cargar los productos.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, searchTerm]);

  const handleAddProduct = (product: ProductDto) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.productId === product.id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const quantity = Math.floor(newQuantity);
    if (quantity <= 0) {
      setOrderItems((prev) =>
        prev.filter((item) => item.productId !== productId)
      );
    } else {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: quantity } : item
        )
      );
    }
  };

  const totalAmount = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [orderItems]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "customerName":
        if (!value.trim()) return "El nombre del cliente es requerido.";
        if (value.trim().length < 3)
          return "El nombre debe tener al menos 3 caracteres.";
        return "";
      case "customerPhone":
        if (!value.trim()) return "El teléfono del cliente es requerido.";
        if (!/^\d{8}$/.test(value.trim()))
          return "El teléfono debe contener exactamente 8 dígitos.";
        return "";
      case "deliveryDate":
        if (!value) return "La fecha de entrega es requerida.";

        const selectedDate = new Date(value);
        const adjustedDate = new Date(
          selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000
        );

        if (isNaN(adjustedDate.getTime())) {
          return "El formato de la fecha es inválido.";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (adjustedDate < today) {
          return "La fecha de entrega no puede ser en el pasado.";
        }

        const maxYear = new Date().getFullYear() + 10;
        if (adjustedDate.getFullYear() > maxYear) {
          return `La fecha no puede ser posterior al año ${maxYear}.`;
        }

        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    const nameError = validateField("customerName", customerName);
    if (nameError) errors.customerName = nameError;

    const phoneError = validateField("customerPhone", customerPhone);
    if (phoneError) errors.customerPhone = phoneError;

    const dateError = validateField("deliveryDate", deliveryDate);
    if (dateError) errors.deliveryDate = dateError;

    if (orderItems.length === 0) {
      errors.form = "Añade al menos un producto al pedido.";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "customerName") setCustomerName(value);
    if (name === "customerPhone") setCustomerPhone(value.replace(/\D/g, ""));
    if (name === "deliveryDate") setDeliveryDate(value);

    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setClientErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const payload: CreateManualOrderDto = {
      customerName: customerName.trim(),
      customerPhoneNumber: customerPhone.trim(),
      deliveryDate: new Date(deliveryDate),
      items: orderItems,
      totalAmount,
    };

    try {
      await createManualAdminOrder(payload);
      showNotification("Pedido creado exitosamente", "success", 5000);
      navigate("/admin/orders");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      showNotification(
        axiosError.response?.data?.detail || "Error al crear el pedido.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return <p className={styles.loadingMessage}>Cargando productos...</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.layout}>
        <div className={styles.orderColumn}>
          <h2 className={styles.columnTitle}>Nuevo Pedido</h2>
          <fieldset className={styles.fieldset}>
            <legend>Datos del Cliente</legend>
            <div className={styles.formGroup}>
              <label htmlFor="customerName">Nombre del Cliente</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                value={customerName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!clientErrors.customerName}
              />
              {clientErrors.customerName && (
                <span className={styles.validationError}>
                  {clientErrors.customerName}
                </span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="customerPhone">Teléfono (8 dígitos)</label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                maxLength={8}
                aria-invalid={!!clientErrors.customerPhone}
              />
              {clientErrors.customerPhone && (
                <span className={styles.validationError}>
                  {clientErrors.customerPhone}
                </span>
              )}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Ítems del Pedido</legend>
            <div className={styles.orderItemsList}>
              {orderItems.length === 0 ? (
                <p className={styles.emptyItemsText}>
                  Añade productos desde el catálogo.
                </p>
              ) : (
                orderItems.map((item) => (
                  <div key={item.productId} className={styles.orderItem}>
                    <span
                      className={styles.orderItemName}
                      title={item.productName}
                    >
                      {item.productName}
                    </span>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                        aria-label="Reducir cantidad"
                      >
                        <LuCircleMinus />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(
                            item.productId,
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="1"
                        aria-label="Cantidad"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                        aria-label="Aumentar cantidad"
                      >
                        <LuCirclePlus />
                      </button>
                    </div>
                    <span className={styles.orderItemSubtotal}>
                      Bs. {(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, 0)}
                      className={styles.removeItemBtn}
                      aria-label="Quitar item"
                    >
                      <LuX />
                    </button>
                  </div>
                ))
              )}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Entrega y Total</legend>
            <div className={styles.formGroup}>
              <label htmlFor="deliveryDate">Fecha de Entrega</label>
              <input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                min={(() => {
                  const today = new Date();
                  const localDate = new Date(
                    today.getTime() - today.getTimezoneOffset() * 60000
                  );
                  return localDate.toISOString().split("T")[0];
                })()}
                aria-invalid={!!clientErrors.deliveryDate}
              />
              {clientErrors.deliveryDate && (
                <span className={styles.validationError}>
                  {clientErrors.deliveryDate}
                </span>
              )}
            </div>
            <div className={styles.totalAmount}>
              <strong>Total del Pedido:</strong>{" "}
              <strong>Bs. {totalAmount.toFixed(2)}</strong>
            </div>
          </fieldset>

          {clientErrors.form && (
            <p className={styles.validationErrorForm}>{clientErrors.form}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "Creando Pedido..." : "Crear Pedido"}
          </button>
        </div>

        <div className={styles.productsColumn}>
          <h2 className={styles.columnTitle}>Catálogo de Productos</h2>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.productList}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className={styles.productItem}>
                  <div className={styles.productInfo}>
                    <span className={styles.productName} title={product.name}>
                      {product.name}
                    </span>
                    <span className={styles.productPrice}>
                      Bs. {product.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddProduct(product)}
                  >
                    Añadir
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.emptyItemsText}>
                No se encontraron productos.
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdminCreateManualOrderForm;
