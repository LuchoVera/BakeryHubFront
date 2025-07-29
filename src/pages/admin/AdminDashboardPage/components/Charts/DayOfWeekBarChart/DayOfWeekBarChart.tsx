import React, { useMemo, useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useDashboardData } from "../../../../../../hooks/useDashboardData";
import { DashboardQueryParametersDto } from "../../../../../../types";
import { useIsMobile } from "../../../../../../hooks/useIsMobile";

interface ChartProps {
  globalFilters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  >;
}

const dayTranslationMap: Record<string, string> = {
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
};

const daySortOrder: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

export const DayOfWeekBarChart: React.FC<ChartProps> = ({ globalFilters }) => {
  const isMobile = useIsMobile();
  const echartRef = useRef<any>(null);
  const [textColor, setTextColor] = useState("#5a5a5a");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rootStyles = getComputedStyle(document.documentElement);
      const color = rootStyles
        .getPropertyValue("--color-text-secondary")
        .trim();
      if (color) {
        setTextColor(color);
      }
    }
  }, []);

  const { data, isLoading, error } = useDashboardData({
    ...globalFilters,
    metric: "revenue",
    granularity: "day",
    breakdownDimension: "dayofweek",
  });

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

  const processedData = useMemo(() => {
    if (!data?.breakdown) return [];

    return [...data.breakdown]
      .sort(
        (a, b) => (daySortOrder[a.label] || 0) - (daySortOrder[b.label] || 0)
      )
      .map((d) => ({
        ...d,
        label: dayTranslationMap[d.label] || d.label,
      }));
  }, [data]);

  const options: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: "{b}: Bs. {c}",
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: processedData.map((d) => d.label),
      axisLabel: {
        interval: isMobile ? "auto" : 0,
        rotate: isMobile ? 30 : 0,
        color: textColor,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: textColor,
      },
    },
    series: [
      {
        name: "Ingresos",
        type: "bar",
        data: processedData.map((d) => d.value),
        itemStyle: { color: "#a9d6e5" },
      },
    ],
  };

  if (isLoading) return <div>Cargando datos por día...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data || data.breakdown.length === 0)
    return <div>No hay datos de ventas para este período.</div>;

  return (
    <ReactECharts ref={echartRef} option={options} style={{ height: 400 }} />
  );
};
