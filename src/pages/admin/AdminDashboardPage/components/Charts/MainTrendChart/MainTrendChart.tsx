import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "./MainTrendChart.module.css";
import { useDashboardData } from "../../../../../../hooks/useDashboardData";
import {
  DashboardQueryParametersDto,
  TimeSeriesDataPointDto,
} from "../../../../../../types";
import {
  LuCalendarDays,
  LuCalendarRange,
  LuChartBar,
  LuChartLine,
} from "react-icons/lu";
import { useIsMobile } from "../../../../../../hooks/useIsMobile";

interface MainTrendChartProps {
  globalFilters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  >;
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

type Metric = "revenue" | "ordercount";
type Granularity = "daily" | "monthly";

const getChartOptions = (
  data: TimeSeriesDataPointDto[],
  metric: Metric,
  isMobile: boolean,
  themeColors: {
    primary: string;
    primaryDark: string;
    text: string;
  }
): EChartsOption => {
  const metricConfig = {
    revenue: {
      name: "Ingresos",
      color: themeColors.primaryDark,
      formatter: (value: number) => `Bs. ${value.toFixed(2)}`,
    },
    ordercount: {
      name: "Pedidos",
      color: themeColors.primary,
      formatter: (value: number) => `${value} pedidos`,
    },
  };

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const point = params[0];
        if (point.dataIndex >= data.length || point.dataIndex < 0) return "";

        const dataPoint = data[point.dataIndex];
        if (!dataPoint) return "";

        return `
          <strong>${point.axisValueLabel}</strong><br/>
          ${metricConfig[metric].name}: <strong>${metricConfig[
          metric
        ].formatter(point.value)}</strong><br/>
          <span style="font-size: 0.9em; color: #6c757d;">
            ${
              metric === "revenue" && dataPoint.count > 0
                ? `(${dataPoint.count} pedidos)`
                : ""
            }
          </span>
        `;
      },
    },
    grid: {
      left: isMobile ? "15%" : "8%",
      right: isMobile ? "5%" : "4%",
      bottom: isMobile ? "15%" : "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        rotate: isMobile ? 30 : 0,
        interval: "auto",
        color: themeColors.text,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: themeColors.text,
        formatter: (value: number) => {
          if (metric === "revenue") {
            if (value >= 1000) return `Bs. ${value / 1000}k`;
            return `Bs. ${value}`;
          }
          return value.toString();
        },
      },
    },
    series: [
      {
        name: metricConfig[metric].name,
        type: "bar",
        barWidth: "60%",
        data: data.map((item) => ({
          value: item.value,
          id: item.label,
        })),
        itemStyle: {
          color: metricConfig[metric].color,
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
    ],
    toolbox: {
      show: false,
      feature: {
        saveAsImage: { title: "Guardar" },
      },
    },
  };
};

export const MainTrendChart: React.FC<MainTrendChartProps> = ({
  globalFilters,
  setGlobalFilters,
  setIsLoading,
}) => {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const chartRef = useRef<HTMLDivElement>(null);
  const echartRef = useRef<any>(null);
  const [themeColors, setThemeColors] = useState({
    primary: "#ff8fab",
    primaryDark: "#fb6f92",
    text: "#5a5a5a",
    title: "#333333",
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAndSetThemeColors = () => {
      if (chartRef.current) {
        const styles = getComputedStyle(document.documentElement);
        const primaryColor = styles.getPropertyValue("--color-primary").trim();
        if (primaryColor) {
          setThemeColors({
            primary: primaryColor,
            primaryDark:
              styles.getPropertyValue("--color-primary-dark").trim() ||
              primaryColor,
            text:
              styles.getPropertyValue("--color-text-secondary").trim() ||
              "#5a5a5a",
            title:
              styles.getPropertyValue("--color-text-primary").trim() ||
              "#333333",
          });
        }
      }
    };

    fetchAndSetThemeColors();

    const observer = new MutationObserver(fetchAndSetThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (echartRef.current) {
        setTimeout(() => {
          echartRef.current.getEchartsInstance().resize();
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { data, isLoading, error } = useDashboardData({
    ...globalFilters,
    metric,
    granularity: granularity === "daily" ? "day" : "month",
    breakdownDimension: granularity === "daily" ? "day" : "month",
  });

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  const handleDrillDown = (params: any) => {
    const clickedLabel = params.data.id;
    if (!clickedLabel) return;

    if (granularity === "daily") {
      const date = new Date(clickedLabel + "T00:00:00");
      setGlobalFilters((prev) => ({
        ...prev,
        timePeriod: "customrange",
        customStartDate: date.toISOString().split("T")[0],
        customEndDate: date.toISOString().split("T")[0],
        filterDimension: "day",
        filterValueLabel: date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }));
    } else if (granularity === "monthly") {
      const [year, month] = clickedLabel.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      setGlobalFilters((prev) => ({
        ...prev,
        timePeriod: "customrange",
        customStartDate: startDate.toISOString().split("T")[0],
        customEndDate: endDate.toISOString().split("T")[0],
        filterDimension: "month",
        filterValueLabel: new Date(year, month - 1).toLocaleString("es-ES", {
          month: "long",
          year: "numeric",
        }),
      }));
    }
  };

  const chartOptions = getChartOptions(
    data?.breakdown || [],
    metric,
    isMobile,
    themeColors
  );

  const dynamicChartTitle =
    metric === "revenue" ? "Evolución de Ingresos" : "Evolución de Pedidos";

  return (
    <div className={styles.chartWidget} ref={chartRef}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle} style={{ color: themeColors.title }}>
          {dynamicChartTitle}
        </h3>
        <div className={styles.chartControls}>
          <div className={styles.controlGroup}>
            <button
              onClick={() => setMetric("revenue")}
              className={`${styles.controlButton} ${
                metric === "revenue" ? styles.active : ""
              }`}
            >
              <LuChartLine /> Ingresos
            </button>
            <button
              onClick={() => setMetric("ordercount")}
              className={`${styles.controlButton} ${
                metric === "ordercount" ? styles.active : ""
              }`}
            >
              <LuChartBar /> Pedidos
            </button>
          </div>
          <div className={styles.controlGroup}>
            <button
              onClick={() => setGranularity("daily")}
              className={`${styles.controlButton} ${
                granularity === "daily" ? styles.active : ""
              }`}
            >
              <LuCalendarDays /> Diario
            </button>
            <button
              onClick={() => setGranularity("monthly")}
              className={`${styles.controlButton} ${
                granularity === "monthly" ? styles.active : ""
              }`}
            >
              <LuCalendarRange /> Mensual
            </button>
          </div>
        </div>
      </div>
      <div className={styles.chartContainer}>
        {isLoading && (
          <div className={styles.loadingOverlay}>Cargando gráfico...</div>
        )}
        {error && <div className={styles.errorOverlay}>Error: {error}</div>}
        {!isLoading &&
          !error &&
          data?.breakdown &&
          data.breakdown.length > 0 && (
            <ReactECharts
              ref={echartRef}
              option={chartOptions}
              style={{ height: "400px", width: "100%" }}
              onEvents={{ click: handleDrillDown }}
              notMerge={true}
              lazyUpdate={true}
            />
          )}
        {!isLoading &&
          !error &&
          (!data?.breakdown || data.breakdown.length === 0) && (
            <div className={styles.loadingOverlay}>
              No hay datos para mostrar en este período.
            </div>
          )}
      </div>
    </div>
  );
};
