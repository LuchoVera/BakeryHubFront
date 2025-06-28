import React, {
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { ProductDto, CartItem } from "../types";
import { useAuth } from "../AuthContext";
import { usePrevious } from "../hooks/usePrevious";
import { CartContext } from "./CartContext.definition";
import { TenantContext } from "./TenantContext.definition";
import { useNotification } from "../hooks/useNotification";
import { fetchPublicTenantProducts } from "../services/apiService";

const CART_STORAGE_KEY = "bakeryHubCart";

const clearCartData = (
  setter: React.Dispatch<React.SetStateAction<CartItem[]>>
) => {
  setter([]);
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error("Error removing cart from localStorage", error);
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const prevIsAuthenticated = usePrevious(isAuthenticated);

  const tenantContext = useContext(TenantContext);
  const { tenantInfo, subdomain } = tenantContext || {};

  const { showNotification } = useNotification();

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
      return [];
    }
  });

  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage", error);
    }
  }, [cartItems]);

  useEffect(() => {
    if (prevIsAuthenticated === true && isAuthenticated === false) {
      clearCartData(setCartItems);
    }
  }, [isAuthenticated, prevIsAuthenticated]);

  const validateCartItems = useCallback(async () => {
    if (!subdomain || cartItems.length === 0 || isValidating) return;

    setIsValidating(true);
    try {
      const allAvailableProducts = await fetchPublicTenantProducts(subdomain);
      const availableProductIds = new Set(
        allAvailableProducts.map((p) => p.id)
      );

      const validCartItems: CartItem[] = [];
      const removedProductNames: string[] = [];

      for (const item of cartItems) {
        if (availableProductIds.has(item.product.id)) {
          validCartItems.push(item);
        } else {
          removedProductNames.push(item.product.name);
        }
      }

      if (removedProductNames.length > 0) {
        setCartItems(validCartItems);
        showNotification(
          `Algunos productos ya no están disponibles y se eliminaron de tu carrito: ${removedProductNames.join(
            ", "
          )}.`,
          "info",
          5000
        );
      }
    } catch (error) {
      console.error("Error al validar los items del carrito:", error);
    } finally {
      setIsValidating(false);
    }
  }, [subdomain, cartItems, showNotification, isValidating]);

  useEffect(() => {
    if (!tenantInfo) return;

    validateCartItems();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        validateCartItems();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tenantInfo, validateCartItems]);

  const addItemToCart = useCallback((product: ProductDto) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  }, []);

  const decrementItemQuantity = useCallback((productId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === productId
      );
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return prevItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          return prevItems.filter((item) => item.product.id !== productId);
        }
      }
      return prevItems;
    });
  }, []);

  const removeItemFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  }, []);

  const updateItemQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      const quantity = Math.max(0, Math.floor(newQuantity));
      setCartItems((prevItems) => {
        if (quantity === 0) {
          return prevItems.filter((item) => item.product.id !== productId);
        } else {
          return prevItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: quantity }
              : item
          );
        }
      });
    },
    []
  );

  const getCartTotalQuantity = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    clearCartData(setCartItems);
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      addItemToCart,
      removeItemFromCart,
      decrementItemQuantity,
      getCartTotalQuantity,
      updateItemQuantity,
      clearCart,
    }),
    [
      cartItems,
      addItemToCart,
      removeItemFromCart,
      decrementItemQuantity,
      getCartTotalQuantity,
      updateItemQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
