import { useContext } from "react";
import { CartContextType } from "../types";
import { CartContext } from "../contexts/CartContext.definition";

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
