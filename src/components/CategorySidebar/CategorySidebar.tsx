import React from "react";
import styles from "./CategorySidebar.module.css";

interface CategoryLinkData {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: CategoryLinkData[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const handleCategoryClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    categoryId: string | null
  ) => {
    event.preventDefault();
    onSelectCategory(categoryId);
  };

  return (
    <aside
      className={`${styles.categorySidebar} ${styles.mobileCategoryContainer}`}
    >
      <nav>
        <h3 className={styles.sidebarTitle}>Categorías</h3>
        <ul className={styles.categoryList}>
          <li>
            <a
              href="#"
              onClick={(e) => handleCategoryClick(e, null)}
              className={`${styles.categoryLink} ${
                selectedCategoryId === null ? styles.categoryLinkActive : ""
              }`}
            >
              Todas las Categorías
            </a>
          </li>

          {categories.map((category) => (
            <li key={category.id}>
              <a
                href={`#${category.id}`}
                onClick={(e) => handleCategoryClick(e, category.id)}
                className={`${styles.categoryLink} ${
                  selectedCategoryId === category.id
                    ? styles.categoryLinkActive
                    : ""
                }`}
                aria-current={
                  selectedCategoryId === category.id ? "page" : undefined
                }
              >
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
