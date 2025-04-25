import React from "react";
import { ProductDto } from "../../types";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./ProductList.module.css";

interface ProductListProps {
  products: ProductDto[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <p className={styles.noProducts}>
        No hay productos disponibles actualmente.
      </p>
    );
  }

  return (
    <div className={styles.list}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
