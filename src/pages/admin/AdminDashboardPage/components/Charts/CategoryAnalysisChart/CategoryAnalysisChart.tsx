import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useDashboardData } from "../../../../../../hooks/useDashboardData";
import { DashboardQueryParametersDto } from "../../../../../../types";
import styles from "./CategoryAnalysisChart.module.css";

interface ChartProps {
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
}

export const CategoryAnalysisChart: React.FC<ChartProps> = ({
  globalFilters,
  setGlobalFilters,
}) => {
  const { data, isLoading, error } = useDashboardData({
    ...globalFilters,
    metric: "revenue",
    granularity: "day",
    breakdownDimension: "category",
  });

  const handleDrillDown = (params: any) => {
    if (params.data && params.data.id) {
      setGlobalFilters((prev) => ({
        ...prev,
        filterDimension: "category",
        filterValue: params.data.id,
        filterValueLabel: params.data.name || params.name,
      }));
    }
  };

  const getChartData = () => {
    const chartData = data?.breakdown || [];
    return [...chartData].sort((a, b) => b.value - a.value);
  };

  const sortedData = getChartData();

  const getBarChartOptions = (): EChartsOption => ({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: "{b}:<br/><strong>Bs. {c}</strong>",
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: sortedData.map((item) => item.label).reverse(),
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        name: "Ingresos",
        type: "bar",
        data: sortedData
          .map((item) => ({
            value: item.value,
            name: item.label,
            id: item.id,
          }))
          .reverse(),
        itemStyle: { color: "#f7a6b7" },
      },
    ],
  });

  const getDonutChartOptions = (): EChartsOption => ({
    tooltip: {
      trigger: "item",
      formatter: "{b}:<br/><strong>Bs. {c}</strong> ({d}%)",
    },
    legend: {
      orient: "vertical",
      top: "middle",
      left: "left",
      type: "scroll",
      itemGap: 15,
    },
    series: [
      {
        name: "Ingresos",
        type: "pie",
        center: ["60%", "50%"],
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
            formatter: "{b}\n{d}%",
          },
        },
        data: sortedData.map((item) => ({
          name: item.label,
          value: item.value,
          id: item.id,
        })),
      },
    ],
  });

  if (isLoading) return <div>Cargando datos por categoría...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data || data.breakdown.length === 0)
    return <div>No hay datos de categorías para este período.</div>;

  return (
    <>
      <div className={styles.desktopChart}>
        <ReactECharts
          option={getDonutChartOptions()}
          style={{ height: 400 }}
          onEvents={{ click: handleDrillDown }}
          notMerge={true}
        />
      </div>
      <div className={styles.mobileChart}>
        <ReactECharts
          option={getBarChartOptions()}
          style={{ height: 400 }}
          onEvents={{ click: handleDrillDown }}
          notMerge={true}
        />
      </div>
    </>
  );
};
