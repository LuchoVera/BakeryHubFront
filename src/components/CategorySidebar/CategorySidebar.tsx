import React, { useState } from "react";
import styles from "./CategorySidebar.module.css";

interface CategoryLinkData {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: CategoryLinkData[];
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories }) => {
  const [showAll, setShowAll] = useState(false);
  const initialLimit = 6;

  const categoriesToShow = showAll
    ? categories
    : categories.slice(0, initialLimit);
  const canShowMore = categories.length > initialLimit;

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <aside
      className={`${styles.categorySidebar} ${styles.mobileCategoryContainer}`}
    >
      <nav>
        <h3 className={styles.sidebarTitle}>Categorías</h3>
        <ul className={styles.categoryList}>
          {categoriesToShow.map((category) => (
            <li key={category.id}>
              <a href={`#${category.id}`} className={styles.categoryLink}>
                {category.name}
              </a>
            </li>
          ))}
        </ul>

        {canShowMore && (
          <button onClick={toggleShowAll} className={styles.showMoreButton}>
            {showAll ? "Mostrar menos" : "Mostrar más"}
          </button>
        )}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
