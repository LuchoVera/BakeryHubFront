import React, { useState } from "react";
import styles from "./AdminDashboardPage.module.css";
import { DashboardQueryParametersDto } from "../../../types";
import { useAuth } from "../../../AuthContext";
import { GlobalFilters } from "./components/GlobalFilters/GlobalFilters";
import { DashboardKpiCards } from "./components/DashboardKpiCards/DashboardKpiCards";
import { MainTrendChart } from "./components/Charts/MainTrendChart/MainTrendChart";
import { DetailedAnalysis } from "./components/Charts/DetailedAnalysis/DetailedAnalysis";

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [globalFilters, setGlobalFilters] = useState<
    Omit<
      DashboardQueryParametersDto,
      "metric" | "granularity" | "breakdownDimension"
    > & {
      filterValueLabel?: string | null;
    }
  >({
    timePeriod: "last7days",
    customStartDate: null,
    customEndDate: null,
    filterDimension: null,
    filterValue: null,
    filterValueLabel: null,
  });

  const [isAnyWidgetLoading, setIsAnyWidgetLoading] = useState(true);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Dashboard de Rendimiento</h1>
        <p>Bienvenido, {user?.name}. Aquí tienes un resumen de tu negocio.</p>
      </header>

      <GlobalFilters
        filters={globalFilters}
        setFilters={setGlobalFilters}
        disabled={isAnyWidgetLoading}
      />

      <div className={styles.dashboardGrid}>
        <div className={`${styles.widget} ${styles.kpiContainer}`}>
          <DashboardKpiCards
            globalFilters={globalFilters}
            setIsLoading={setIsAnyWidgetLoading}
          />
        </div>

        <div className={`${styles.widget} ${styles.mainChartContainer}`}>
          <MainTrendChart
            globalFilters={globalFilters}
            setGlobalFilters={setGlobalFilters}
            setIsLoading={setIsAnyWidgetLoading}
          />
        </div>

        <div className={`${styles.widget} ${styles.detailedAnalysisContainer}`}>
          <DetailedAnalysis
            globalFilters={globalFilters}
            setGlobalFilters={setGlobalFilters}
            setIsLoading={setIsAnyWidgetLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
