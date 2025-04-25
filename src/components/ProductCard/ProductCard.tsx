import React from "react";
import { ProductDto } from "../../types";
import styles from "./ProductCard.module.css";
import { Link } from "react-router-dom";

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
        {leadTimeText && (
          <p className={styles.leadTimeDisplay}> Antelación: {leadTimeText}</p>
        )}
        <div className={styles.footer}>
          <span className={styles.price} title={fullPriceString}>
            {fullPriceString}
          </span>
          <button className={styles.addButton} disabled={!product.isAvailable}>
            {product.isAvailable ? "Añadir al Carrito" : "No Disponible"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = React.memo(ProductCardComponent);

export default ProductCard;
