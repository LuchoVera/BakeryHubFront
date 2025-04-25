import React from "react";
import styles from "./CategorySidebar.module.css";

interface CategoryLinkData {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: CategoryLinkData[];
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories }) => {
  return (
    <aside className={styles.categorySidebar}>
      <nav>
        <h3 className={styles.sidebarTitle}>Categorías</h3>
        <ul className={styles.categoryList}>
          {categories.map((category) => (
            <li key={category.id}>
              <a href={`#${category.id}`} className={styles.categoryLink}>
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default CategorySidebar;
