import React, { useState, useEffect } from "react";
import styles from "./GlobalFilters.module.css";
import { DashboardQueryParametersDto } from "../../../../../types";
import { LuX } from "react-icons/lu";

interface GlobalFiltersProps {
  filters: Omit<
    DashboardQueryParametersDto,
    "metric" | "granularity" | "breakdownDimension"
  > & { filterValueLabel?: string | null };
  setFilters: React.Dispatch<
    React.SetStateAction<
      Omit<
        DashboardQueryParametersDto,
        "metric" | "granularity" | "breakdownDimension"
      > & { filterValueLabel?: string | null }
    >
  >;
  disabled: boolean;
}

const timePeriodOptions = [
  { value: "last7days", label: "Últimos 7 días" },
  { value: "last30days", label: "Últimos 30 días" },
  { value: "currentmonth", label: "Este Mes" },
  { value: "lastmonth", label: "Mes Pasado" },
  { value: "yeartodate", label: "Este Año (hasta la fecha)" },
  { value: "customrange", label: "Rango Personalizado..." },
];

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  setFilters,
  disabled,
}) => {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const todayISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setCustomStart(filters.customStartDate || "");
    setCustomEnd(filters.customEndDate || "");
  }, [filters.customStartDate, filters.customEndDate]);

  const handleApplyCustomRange = () => {
    setFilters((prev) => ({
      ...prev,
      timePeriod: "customrange",
      customStartDate: customStart || null,
      customEndDate: customEnd || null,
    }));
  };

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimePeriod = e.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      timePeriod: newTimePeriod,
      customStartDate:
        newTimePeriod !== "customrange" ? null : prevFilters.customStartDate,
      customEndDate:
        newTimePeriod !== "customrange" ? null : prevFilters.customEndDate,
    }));
  };

  const handleClearFilter = () => {
    setFilters((prev) => ({
      ...prev,
      filterDimension: null,
      filterValue: null,
      filterValueLabel: null,
    }));
  };

  const filterDimensionLabels: Record<string, string> = {
    category: "Categoría",
    product: "Producto",
    day: "Día",
    month: "Mes",
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label htmlFor="timePeriodSelect" className={styles.filterLabel}>
          Ver período:
        </label>
        <select
          id="timePeriodSelect"
          value={filters.timePeriod}
          onChange={handleTimePeriodChange}
          className={styles.filterSelect}
          disabled={disabled}
        >
          {timePeriodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filters.filterDimension && filters.filterValueLabel && (
        <div className={styles.activeFilterDisplay}>
          <span>Mostrando:</span>
          <span className={styles.filterChip}>
            {filterDimensionLabels[filters.filterDimension] ||
              filters.filterDimension}
            :<strong> {filters.filterValueLabel}</strong>
            <button
              onClick={handleClearFilter}
              className={styles.clearFilterButton}
              title="Quitar filtro"
            >
              <LuX />
            </button>
          </span>
        </div>
      )}

      {filters.timePeriod === "customrange" && (
        <div className={styles.customDateContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="startDate" className={styles.filterLabel}>
              Desde:
            </label>
            <input
              type="date"
              id="startDate"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={styles.dateInput}
              disabled={disabled}
              max={customEnd || todayISO}
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="endDate" className={styles.filterLabel}>
              Hasta:
            </label>
            <input
              type="date"
              id="endDate"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={styles.dateInput}
              disabled={disabled}
              min={customStart || undefined}
              max={todayISO}
            />
          </div>
          <button
            onClick={handleApplyCustomRange}
            className={styles.applyButton}
            disabled={disabled || !customStart || !customEnd}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
};
