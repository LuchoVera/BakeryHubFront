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
            <span>No Image</span>
          </div>
        )}
        <div className={styles.contentHeader}>
          <h3 className={styles.name}>{product.name}</h3>
        </div>
      </Link>
      <div className={styles.content}>
        <p className={styles.category}>
          Category: {product.categoryName || "N/A"}
        </p>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        {product.leadTimeDisplay && Number(product.leadTimeDisplay) > 0 && (
          <p className={styles.leadTimeDisplay}>
            Preparation: {product.leadTimeDisplay} day
            {Number(product.leadTimeDisplay) > 1 ? "s" : ""}
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

const ProductCard = React.memo(ProductCardComponent);

export default ProductCard;
