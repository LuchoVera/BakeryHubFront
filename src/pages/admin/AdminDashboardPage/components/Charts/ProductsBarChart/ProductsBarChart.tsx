import React, { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useDashboardData } from "../../../../../../hooks/useDashboardData";
import { DashboardQueryParametersDto } from "../../../../../../types";
import styles from "./ProductsBarChart.module.css";
import { LuTrendingUp, LuPackage } from "react-icons/lu";
import { useIsMobile } from "../../../../../../hooks/useIsMobile";

type RankingType = "top" | "bottom" | "none";
type RankingMetric = "revenue" | "ordercount";

const formatAxisLabelMultiline = (
  value: string,
  maxChars: number = 20
): string => {
  const chunks = value.match(new RegExp(`.{1,${maxChars}}`, "g"));
  return chunks ? chunks.join("\n") : value;
};

export const ProductsBarChart: React.FC<{
  globalFilters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  >;
}> = ({ globalFilters }) => {
  const isMobile = useIsMobile();
  const [rankingType, setRankingType] = useState<RankingType>("top");
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("revenue");

  const { data, isLoading, error } = useDashboardData({
    ...globalFilters,
    metric: rankingMetric,
    granularity: "day",
    breakdownDimension: "product",
    includeProductsWithNoSales: true,
  });

  const processedData = useMemo(() => {
    if (!data?.breakdown) return { chart: [], list: [] };

    if (rankingType === "none") {
      const noSales = data.breakdown.filter(
        (p) => p.value === 0 && p.count === 0
      );
      return { chart: [], list: noSales };
    }

    const productsWithSales = data.breakdown.filter((p) => p.value > 0);
    const sorted = [...productsWithSales].sort((a, b) => {
      return rankingType === "top" ? b.value - a.value : a.value - b.value;
    });

    return { chart: sorted.slice(0, 10), list: [] };
  }, [data, rankingType]);

  const chartData = processedData.chart;

  const options: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const point = params[0];
        if (!point) return "";
        const label = point.name;
        const value = point.value;
        return `${label}<br/><strong>${
          rankingMetric === "revenue"
            ? `Bs. ${value.toFixed(2)}`
            : `${value} unidades`
        }</strong>`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "5%",
      containLabel: true,
    },
    xAxis: isMobile
      ? {
          type: "category",
          data: chartData.map((d) => d.label),
          axisLabel: {
            rotate: 45,
            interval: 0,
            formatter: (value: string): string =>
              formatAxisLabelMultiline(value),
          },
        }
      : {
          type: "value",
          boundaryGap: [0, 0.01],
        },
    yAxis: isMobile
      ? {
          type: "value",
        }
      : {
          type: "category",
          data: [...chartData].reverse().map((d) => d.label),
          axisLabel: {
            overflow: "truncate",
            width: 250,
            formatter: (value: string): string =>
              formatAxisLabelMultiline(value),
          },
        },
    series: [
      {
        name: rankingMetric === "revenue" ? "Ingresos" : "Cantidad",
        type: "bar",
        data: isMobile
          ? chartData.map((d) => d.value)
          : [...chartData].reverse().map((d) => d.value),
        itemStyle: { color: rankingType === "top" ? "#83c5be" : "#ffb4a2" },
      },
    ],
  };

  const renderContent = () => {
    if (isLoading)
      return (
        <div className={styles.centeredMessage}>
          Cargando ranking de productos...
        </div>
      );
    if (error)
      return (
        <div className={styles.centeredMessage} style={{ color: "red" }}>
          Error: {error}
        </div>
      );

    if (rankingType !== "none") {
      return chartData.length === 0 ? (
        <div className={styles.centeredMessage}>
          No hay productos con ventas en este período.
        </div>
      ) : (
        <div className={styles.chartScrollContainer}>
          <ReactECharts
            option={options}
            style={{
              height: isMobile ? 400 + chartData.length * 10 : 400,
              width: "100%",
            }}
            notMerge={true}
          />
        </div>
      );
    }

    if (rankingType === "none") {
      return processedData.list.length === 0 ? (
        <div className={styles.centeredMessage}>
          ¡Felicidades! Todos los productos tuvieron ventas en este período.
        </div>
      ) : (
        <div className={styles.listContainer}>
          <p>Mostrando {processedData.list.length} productos sin ventas:</p>
          <ul className={styles.noSalesList}>
            {processedData.list.map((product) => (
              <li key={product.id}>{product.label}</li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className={styles.allControlsContainer}>
        <div className={styles.controlGroup}>
          <button
            onClick={() => setRankingType("top")}
            className={`${styles.controlButton} ${
              rankingType === "top" ? styles.active : ""
            }`}
          >
            Más Vendidos
          </button>
          <button
            onClick={() => setRankingType("bottom")}
            className={`${styles.controlButton} ${
              rankingType === "bottom" ? styles.active : ""
            }`}
          >
            Menos Vendidos
          </button>
          <button
            onClick={() => setRankingType("none")}
            className={`${styles.controlButton} ${
              rankingType === "none" ? styles.active : ""
            }`}
          >
            No Vendidos
          </button>
        </div>

        {rankingType !== "none" && (
          <div
            className={`${styles.controlGroup} ${styles.metricControlGroup}`}
          >
            <button
              onClick={() => setRankingMetric("revenue")}
              className={`${styles.controlButton} ${
                rankingMetric === "revenue" ? styles.active : ""
              }`}
            >
              <LuTrendingUp /> Por Ingresos
            </button>
            <button
              onClick={() => setRankingMetric("ordercount")}
              className={`${styles.controlButton} ${
                rankingMetric === "ordercount" ? styles.active : ""
              }`}
            >
              <LuPackage /> Por Cantidad
            </button>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  );
};
