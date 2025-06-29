import React, { useState, useEffect, FocusEvent } from "react";
import { CategoryDto, TagDto } from "../../types";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import styles from "./FilterPanel.module.css";

export interface AppliedFilters {
  categoryId: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  tags: string[];
}

interface FilterPanelProps {
  allCategories: CategoryDto[];
  allTags: TagDto[];
  initialFilters: AppliedFilters;
  onApplyFilters: (filters: AppliedFilters) => void;
  onClearFilters: () => void;
  showCategoryFilter?: boolean;
  isLoading?: boolean;
}

const MAX_PRICE_ALLOWED = 9999999.99;

const FilterPanel: React.FC<FilterPanelProps> = ({
  allCategories,
  allTags,
  initialFilters,
  onApplyFilters,
  onClearFilters,
  showCategoryFilter = true,
  isLoading = false,
}) => {
  const [tempCategoryId, setTempCategoryId] = useState<string>("");
  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<TagDto[]>([]);

  useEffect(() => {
    setTempCategoryId(initialFilters.categoryId || "");
    setTempMinPrice(initialFilters.minPrice || "");
    setTempMaxPrice(initialFilters.maxPrice || "");
    const rehydratedTags = initialFilters.tags.map((tagName) => {
      return (
        allTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase()) || {
          id: `applied_${tagName}_${Date.now()}`,
          name: tagName,
        }
      );
    });
    setSelectedTags(rehydratedTags);
  }, [initialFilters, allTags]);

  const sanitizePrice = (value: string): string => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return "";
    if (parsed > MAX_PRICE_ALLOWED) {
      return MAX_PRICE_ALLOWED.toFixed(2);
    }
    return parsed.toFixed(2);
  };

  const handleApply = () => {
    let minSanitized = sanitizePrice(tempMinPrice);
    let maxSanitized = sanitizePrice(tempMaxPrice);

    const min = parseFloat(minSanitized);
    const max = parseFloat(maxSanitized);

    if (!isNaN(min) && !isNaN(max) && min > max) {
      minSanitized = maxSanitized;
    }

    setTempMinPrice(minSanitized);
    setTempMaxPrice(maxSanitized);

    onApplyFilters({
      categoryId: tempCategoryId || null,
      minPrice: minSanitized || null,
      maxPrice: maxSanitized || null,
      tags: selectedTags.map((tag) => tag.name.trim()),
    });
  };

  const handleMinPriceBlur = (e: FocusEvent<HTMLInputElement>) => {
    const minValue = parseFloat(e.target.value);
    const maxValue = parseFloat(tempMaxPrice);
    if (!isNaN(minValue) && !isNaN(maxValue) && minValue > maxValue) {
      setTempMaxPrice(e.target.value);
    }
  };

  const handleMaxPriceBlur = (e: FocusEvent<HTMLInputElement>) => {
    const maxValue = parseFloat(e.target.value);
    const minValue = parseFloat(tempMinPrice);
    if (!isNaN(maxValue) && !isNaN(minValue) && maxValue < minValue) {
      setTempMaxPrice(tempMinPrice);
    }
  };

  return (
    <div className={styles.filterPanel}>
      {showCategoryFilter && (
        <div className={styles.filterGroupItem}>
          <label htmlFor="filterCategory" className={styles.filterLabel}>
            Categoría:
          </label>
          <select
            id="filterCategory"
            value={tempCategoryId}
            onChange={(e) => setTempCategoryId(e.target.value)}
            disabled={isLoading}
            className={styles.filterSelect}
          >
            <option value="">Todas</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.filterGroupItem}>
        <label htmlFor="filterMinPrice" className={styles.filterLabel}>
          Mín (Bs.):
        </label>
        <input
          type="number"
          inputMode="decimal"
          id="filterMinPrice"
          placeholder="Ej: 10"
          min="0"
          step="1"
          value={tempMinPrice}
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              setTempMinPrice(e.target.value);
            }
          }}
          onBlur={handleMinPriceBlur}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e") {
              e.preventDefault();
            }
          }}
          className={styles.filterInput}
          disabled={isLoading}
          maxLength={10}
        />
      </div>

      <div className={styles.filterGroupItem}>
        <label htmlFor="filterMaxPrice" className={styles.filterLabel}>
          Máx (Bs.):
        </label>
        <input
          type="number"
          inputMode="decimal"
          id="filterMaxPrice"
          placeholder="Ej: 100"
          min="0"
          step="1"
          value={tempMaxPrice}
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              setTempMaxPrice(e.target.value);
            }
          }}
          onBlur={handleMaxPriceBlur}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e") {
              e.preventDefault();
            }
          }}
          className={styles.filterInput}
          disabled={isLoading}
          maxLength={10}
        />
      </div>

      <div className={styles.filterGroupItem}>
        <label
          htmlFor="tags-filter-autocomplete"
          className={styles.filterLabel}
        >
          Etiquetas:
        </label>
        <Autocomplete
          multiple
          freeSolo
          loading={isLoading && allTags.length === 0}
          id="tags-filter-autocomplete"
          value={selectedTags}
          onChange={(_, newValue) => {
            setSelectedTags(
              newValue.map((option) =>
                typeof option === "string"
                  ? allTags.find(
                      (t) => t.name.toLowerCase() === option.toLowerCase()
                    ) || { id: `new_${option}`, name: option }
                  : option
              )
            );
          }}
          options={allTags}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.name
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderTags={(value, getTagProps) =>
            value.map((tag, index) => (
              <Chip
                label={tag.name}
                {...getTagProps({ index })}
                key={tag.id || tag.name + index}
                sx={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary-dark)",
                  height: "25px",
                  fontSize: "0.8rem",
                  "& .MuiChip-deleteIcon": {
                    color: "var(--color-primary-dark)",
                    fontSize: "0.9rem",
                    "&:hover": { color: "var(--color-error)" },
                  },
                }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder={
                selectedTags.length > 0
                  ? "Añadir más etiquetas..."
                  : "Añadir etiquetas..."
              }
              disabled={isLoading}
              sx={{
                width: "300px",
                "&:hover:not(.Mui-focused) .MuiOutlinedInput-root:not(.Mui-disabled)":
                  {
                    borderColor: "var(--color-primary) !important",
                    backgroundColor: "#fafafa !important",
                  },
                "& .MuiOutlinedInput-root": {
                  padding: "calc(var(--space-xs) + 2px) var(--space-sm)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  maxHeight: "116px",
                  overflowY: "auto",
                  backgroundColor: "var(--color-surface)",

                  borderRadius: "var(--border-radius-sm)",
                  border: "2px solid var(--color-border)",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                  "&.Mui-focused": {
                    borderColor: "var(--color-primary-dark) !important",
                    boxShadow: "0 0 0 3px var(--color-accent) !important",
                    backgroundColor: "var(--color-surface) !important",
                  },
                },
                "& .MuiAutocomplete-input": {
                  minHeight: "28px",
                  padding: "1.5px 4px !important",
                  minWidth: "100px",
                  flexGrow: 1,
                  fontSize: "0.9em",
                  color: "var(--color-text-primary)",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none !important",
                },
                "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                  border: "none !important",
                },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    border: "none !important",
                  },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    border: "none !important",
                  },
                "& fieldset": {
                  border: "none !important",
                },
              }}
            />
          )}
          className={styles.autocomplete}
        />
      </div>

      <div className={styles.filterActionButtons}>
        <button onClick={handleApply} className={styles.applyButton}>
          Aplicar
        </button>
        <button onClick={onClearFilters} className={styles.clearButton}>
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
