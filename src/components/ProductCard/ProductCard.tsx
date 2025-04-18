import React from "react";
import { ProductDto } from "../../types";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: ProductDto;
}

const placeholderImage =
  "https://via.placeholder.com/300x200.png?text=No+Image";

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : placeholderImage;

  return (
    <div className={styles.card}>
      <img
        src={imageUrl}
        alt={product.name}
        className={styles.image}
        onError={(e) => (e.currentTarget.src = placeholderImage)}
      />
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        <p className={styles.category}>
          Category: {product.categoryName || "N/A"}
        </p>
        {product.leadTimeDisplay && (
          <p className={styles.leadTime}>
            Preparation: {product.leadTimeDisplay}
          </p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          <button className={styles.addButton} disabled={!product.isAvailable}>
            {product.isAvailable ? "Add to Cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
