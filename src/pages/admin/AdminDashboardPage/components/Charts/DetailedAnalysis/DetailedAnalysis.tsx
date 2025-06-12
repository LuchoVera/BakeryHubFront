import React, { useState, useEffect } from "react";
import styles from "./DetailedAnalysis.module.css";
import { DashboardQueryParametersDto } from "../../../../../../types";
import { ProductsBarChart } from "../ProductsBarChart/ProductsBarChart";
import { DayOfWeekBarChart } from "../DayOfWeekBarChart/DayOfWeekBarChart";
import { CategoryAnalysisChart } from "../CategoryAnalysisChart/CategoryAnalysisChart";

interface DetailedAnalysisProps {
  globalFilters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  > & { filterValueLabel?: string | null };
  setGlobalFilters: React.Dispatch<
    React.SetStateAction<
      Omit<
        DashboardQueryParametersDto,
        "metric" | "granularity" | "breakdownDimension"
      > & { filterValueLabel?: string | null }
    >
  >;
  setIsLoading: (isLoading: boolean) => void;
}

type ActiveTab = "category" | "product" | "dayofweek";

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("category");
  const isCategoryFiltered = props.globalFilters.filterDimension === "category";

  useEffect(() => {
    if (isCategoryFiltered) {
      setActiveTab("category");
    }
  }, [isCategoryFiltered]);

  const renderActiveTabContent = () => {
    if (activeTab === "category" && isCategoryFiltered) {
      return <ProductsBarChart {...props} />;
    }

    switch (activeTab) {
      case "category":
        return <CategoryAnalysisChart {...props} />;
      case "product":
        return <ProductsBarChart {...props} />;
      case "dayofweek":
        return <DayOfWeekBarChart {...props} />;
      default:
        return null;
    }
  };

  const categoryTabLabel = isCategoryFiltered
    ? `Productos en "${props.globalFilters.filterValueLabel}"`
    : "Por Categoría";

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab("category")}
          className={`${styles.tabButton} ${
            activeTab === "category" ? styles.active : ""
          }`}
          title={categoryTabLabel}
        >
          {categoryTabLabel}
        </button>

        {!isCategoryFiltered && (
          <button
            onClick={() => setActiveTab("product")}
            className={`${styles.tabButton} ${
              activeTab === "product" ? styles.active : ""
            }`}
          >
            Ranking de Productos
          </button>
        )}
        <button
          onClick={() => setActiveTab("dayofweek")}
          className={`${styles.tabButton} ${
            activeTab === "dayofweek" ? styles.active : ""
          }`}
        >
          Por Día de la Semana
        </button>
      </div>
      <div className={styles.tabContent}>{renderActiveTabContent()}</div>
    </div>
  );
};
