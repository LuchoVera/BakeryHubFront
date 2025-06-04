import React, { useState, useEffect } from "react";
import styles from "./CategorySidebar.module.css";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

interface CategoryLinkData {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: CategoryLinkData[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const MOBILE_BREAKPOINT = 768;
const INITIAL_VISIBLE_CATEGORIES_MOBILE = 4;

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const handleCategoryClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    categoryId: string | null
  ) => {
    event.preventDefault();
    onSelectCategory(categoryId);
  };

  const toggleMobileExpand = () => {
    setIsMobileExpanded(!isMobileExpanded);
  };

  const categoriesToShow =
    isMobileView && !isMobileExpanded
      ? categories.slice(0, INITIAL_VISIBLE_CATEGORIES_MOBILE)
      : categories;

  const showToggleButton =
    isMobileView && categories.length > INITIAL_VISIBLE_CATEGORIES_MOBILE;

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
              Todas
            </a>
          </li>

          {categoriesToShow.map((category) => (
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
        {showToggleButton && (
          <button
            onClick={toggleMobileExpand}
            className={styles.showMoreButton}
            aria-expanded={isMobileExpanded}
          >
            {isMobileExpanded ? (
              <>
                Ver Menos <LuChevronUp />
              </>
            ) : (
              <>
                Ver Más ({categories.length - INITIAL_VISIBLE_CATEGORIES_MOBILE}{" "}
                más) <LuChevronDown />
              </>
            )}
          </button>
        )}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
