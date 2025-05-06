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
} from "react-icons/lu";
import { useCart } from "../../hooks/useCart";
import { ApiErrorResponse, TenantPublicInfoDto, CartItem } from "../../types";

interface CartPageProps {
  subdomain: string;
}

const apiUrl = "/api";

const CartPage: React.FC<CartPageProps> = ({ subdomain }) => {
  const {
    cartItems,
    addItemToCart,
    decrementItemQuantity,
    removeItemFromCart,
    getCartTotalQuantity,
  } = useCart();

  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
                <div className={styles.headerItemSubtotal}>Total Producto</div>
                <div className={styles.headerRemovePlaceholder}></div>
              </div>

              <div className={styles.cartItemsList}>
                {cartItems.map((item) => (
                  <div key={item.product.id} className={styles.cartItem}>
                    <img
                      src={item.product.images?.[0] || "/placeholder.png"}
                      alt={item.product.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemDetails}>
                      <Link
                        to={`/products/${item.product.id}`}
                        className={styles.itemName}
                      >
                        {item.product.name}
                      </Link>
                      <p className={styles.itemPrice}>
                        Bs. {item.product.price.toFixed(2)} c/u{" "}
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
              <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
                <span>Total:</span>
                <span>Bs. {cartTotal.toFixed(2)}</span>
              </div>
              <button className={styles.checkoutButton}>Realizar Orden</button>
              <Link to="/" className={styles.continueShoppingLink}>
                <LuArrowLeft /> Seguir Comprando
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
