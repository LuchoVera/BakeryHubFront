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
  console.log("Clearing cart data...");
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
    console.log("CartContext: Initializing cart state...");
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      console.log("CartContext: Found in localStorage on init:", storedCart);
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];
      console.log("CartContext: Parsed initial cart:", parsedCart);
      return parsedCart;
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log(
      "CartContext: cartItems changed, saving to localStorage:",
      cartItems
    );
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage", error);
    }
  }, [cartItems]);

  useEffect(() => {
    console.log(
      `CartContext: Auth check effect. PrevAuth: ${prevIsAuthenticated}, CurrentAuth: ${isAuthenticated}`
    );
    if (prevIsAuthenticated === true && isAuthenticated === false) {
      console.warn(
        "CartContext: Clearing cart due to logout (isAuthenticated changed true -> false)"
      );
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

  const getCartTotalQuantity = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const toggleCartOpen = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      addItemToCart,
      removeItemFromCart,
      decrementItemQuantity,
      getCartTotalQuantity,
      isCartOpen,
      toggleCartOpen,
    }),
    [
      cartItems,
      addItemToCart,
      removeItemFromCart,
      decrementItemQuantity,
      getCartTotalQuantity,
      isCartOpen,
      toggleCartOpen,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
