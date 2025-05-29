import React from "react";
import { ProductDto } from "../../types";
import styles from "./ProductCard.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useCart } from "../../hooks/useCart";
import { useNotification } from "../../hooks/useNotification";
import { LuTag } from "react-icons/lu";

interface ProductCardProps {
  product: ProductDto;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl =
    product.images && product.images.length > 0 ? product.images[0] : null;
  const fullPriceString = `Bs. ${product.price.toFixed(2)}`;
  const leadTimeNumber = Number(product.leadTimeDisplay);
  const leadTimeText =
    product.leadTimeDisplay && leadTimeNumber > 0
      ? `${leadTimeNumber} día${leadTimeNumber > 1 ? "s" : ""}`
      : null;

  const { addItemToCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const isAdmin = user?.roles?.includes("Admin") ?? false;
  const isButtonDisabled = !product.isAvailable || isAdmin;

  const handleAddToCart = () => {
    if (isAdmin) {
      showNotification(
        "Los administradores no pueden añadir productos al carrito.",
        "info",
        4000
      );
    } else if (product.isAvailable) {
      addItemToCart(product);
      showNotification(
        `'${product.name}' añadido al carrito!`,
        "success",
        3000
      );
    }
  };

  return (
    <div className={styles.card}>
      <Link to={`/products/${product.id}`} className={styles.linkWrapper}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={`${styles.image} ${styles.imagePlaceholder}`}>
            <span>Sin Imagen</span>
          </div>
        )}
        <div className={styles.contentHeader}>
          <h3 className={styles.name}>{product.name}</h3>
        </div>
      </Link>
      <div className={styles.content}>
        <p className={styles.category}>
          Categoría: {product.categoryName || "N/D"}
        </p>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}

        {product.tagNames && product.tagNames.length > 0 && (
          <div className={styles.tagsContainer}>
            {product.tagNames.map((tagName) => (
              <span key={tagName} className={styles.tagBadge}>
                <LuTag className={styles.tagIcon} /> {tagName}
              </span>
            ))}
          </div>
        )}

        <p className={styles.leadTimeDisplay}>
          {leadTimeText ? `Antelación: ${leadTimeText}` : "\u00A0"}{" "}
        </p>
        <div className={styles.footer}>
          <span className={styles.price} title={fullPriceString}>
            {fullPriceString}
          </span>
          <button
            className={styles.addButton}
            onClick={handleAddToCart}
            disabled={isButtonDisabled}
            title={
              !product.isAvailable
                ? "Producto no disponible"
                : isAdmin
                ? "Los administradores no pueden comprar"
                : "Añadir al carrito"
            }
          >
            {product.isAvailable ? "Añadir al Carrito" : "No Disponible"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = React.memo(ProductCardComponent);
export default ProductCard;
