import React, { useEffect } from "react";
import styles from "./DashboardKpiCards.module.css";
import { useDashboardData } from "../../../../../hooks/useDashboardData";
import { DashboardQueryParametersDto } from "../../../../../types";
import {
  LuTrendingUp,
  LuPackage,
  LuMousePointerClick,
  LuUsers,
} from "react-icons/lu";

interface KpiCardsProps {
  globalFilters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  >;
  setIsLoading: (isLoading: boolean) => void;
}

const KpiCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
}> = ({ title, value, icon, isLoading }) => (
  <div className={styles.kpiCard}>
    <div className={styles.iconWrapper}>{icon}</div>
    <div className={styles.textWrapper}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {isLoading ? (
        <div className={styles.loadingSpinner}></div>
      ) : (
        <p className={styles.cardValue}>{value}</p>
      )}
    </div>
  </div>
);

export const DashboardKpiCards: React.FC<KpiCardsProps> = ({
  globalFilters,
  setIsLoading,
}) => {
  const { data, isLoading, error } = useDashboardData({
    ...globalFilters,
    metric: "revenue",
    granularity: "daily",
  });

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  const formatCurrency = (amount: number) => `Bs. ${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString("es-ES");

  if (error && !isLoading) {
    return <div className={styles.errorState}>Error al cargar: {error}</div>;
  }

  const summary = data?.summary;

  return (
    <div className={styles.kpiContainer}>
      <KpiCard
        title="Ingresos Totales"
        value={summary ? formatCurrency(summary.totalRevenue) : "0.00"}
        icon={<LuTrendingUp />}
        isLoading={isLoading}
      />
      <KpiCard
        title="Pedidos Totales"
        value={summary ? formatNumber(summary.totalOrders) : "0"}
        icon={<LuPackage />}
        isLoading={isLoading}
      />
      <KpiCard
        title="Valor Promedio/Pedido"
        value={summary ? formatCurrency(summary.averageOrderValue) : "0.00"}
        icon={<LuMousePointerClick />}
        isLoading={isLoading}
      />
      <KpiCard
        title="Clientes Únicos"
        value={summary ? formatNumber(summary.totalCustomers) : "0"}
        icon={<LuUsers />}
        isLoading={isLoading}
      />
    </div>
  );
};
