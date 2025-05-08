import React, {
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { ProductDto, CartItem } from "../types";
import { useAuth } from "../AuthContext";
import { usePrevious } from "../hooks/usePrevious";
import { CartContext } from "./CartContext.definition";

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

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
      return [];
    }
  });

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
