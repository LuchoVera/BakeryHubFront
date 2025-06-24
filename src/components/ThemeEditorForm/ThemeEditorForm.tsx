import React, { useState, useEffect, useCallback } from "react";
import { TenantThemeDto, ThemeSettingsDto } from "../../types";
import { useNotification } from "../../hooks/useNotification";
import {
  getAdminTheme,
  updateAdminTheme,
  resetPublicTheme,
  resetAdminTheme,
} from "../../services/apiService";
import styles from "./ThemeEditorForm.module.css";
import { LuSaveAll } from "react-icons/lu";

const themeFieldKeys: (keyof ThemeSettingsDto)[] = [
  "colorPrimary",
  "colorPrimaryDark",
  "colorPrimaryLight",
  "colorSecondary",
  "colorBackground",
  "colorSurface",
  "colorTextPrimary",
  "colorTextSecondary",
  "colorTextOnPrimary",
  "colorBorder",
  "colorBorderLight",
  "colorDisabledBg",
];

const ThemeEditorForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"public" | "admin">("public");
  const [theme, setTheme] = useState<TenantThemeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState<"public" | "admin" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const fetchTheme = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminTheme();
      setTheme(data);
    } catch (err) {
      setError("No se pudo cargar la configuración del tema.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleThemeChange = (
    themeType: "publicTheme" | "adminTheme",
    field: keyof ThemeSettingsDto,
    value: string
  ) => {
    const formattedValue = value.startsWith("#") ? value : `#${value}`;

    setTheme((prev) =>
      prev
        ? {
            ...prev,
            [themeType]: { ...prev[themeType], [field]: formattedValue },
          }
        : null
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme) return;
    setIsSaving(true);
    try {
      await updateAdminTheme(theme);
      showNotification("Tema guardado con éxito.", "success");
      if (activeTab === "admin") {
        window.location.reload();
      }
    } catch (err) {
      showNotification("Error al guardar el tema.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (themeType: "public" | "admin") => {
    setIsResetting(themeType);
    try {
      if (themeType === "public") {
        await resetPublicTheme();
      } else {
        await resetAdminTheme();
      }
      await fetchTheme();
      showNotification(
        `El tema ${
          themeType === "public" ? "de la tienda" : "de administración"
        } ha sido restaurado.`,
        "info"
      );
      if (themeType === "admin") {
        window.location.reload();
      }
    } catch (err) {
      showNotification("Error al restaurar el tema.", "error");
    } finally {
      setIsResetting(null);
    }
  };

  const getColorLabel = (key: keyof ThemeSettingsDto): string => {
    const colorLabels: Record<keyof ThemeSettingsDto, string> = {
      colorPrimary: "Color Principal",
      colorPrimaryDark: "Color Principal Oscuro",
      colorPrimaryLight: "Color Principal Claro",
      colorSecondary: "Color Secundario",
      colorBackground: "Color de Fondo",
      colorSurface: "Color de Superficie",
      colorTextPrimary: "Color de Texto Principal",
      colorTextSecondary: "Color de Texto Secundario",
      colorTextOnPrimary: "Color de Texto sobre Principal",
      colorBorder: "Color de Bordes",
      colorBorderLight: "Color de Bordes Claros",
      colorDisabledBg: "Color de Fondo Deshabilitado",
    };
    return colorLabels[key];
  };

  const renderThemeSection = (
    themeType: "publicTheme" | "adminTheme",
    title: string
  ) => {
    return (
      <div className={styles.themeSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <button
            type="button"
            onClick={() =>
              handleReset(themeType === "publicTheme" ? "public" : "admin")
            }
            disabled={isSaving || !!isResetting}
            className={styles.resetButton}
          >
            {isResetting === (themeType === "publicTheme" ? "public" : "admin")
              ? "Restaurando..."
              : "Restaurar por Defecto"}
          </button>
        </div>
        <div className={styles.colorGrid}>
          {themeFieldKeys.map((key) => (
            <div key={`${themeType}-${key}`} className={styles.colorInputGroup}>
              <label htmlFor={`${themeType}-${key}`}>
                {getColorLabel(key)}
              </label>
              <div className={styles.colorInputWrapper}>
                <input
                  type="color"
                  id={`${themeType}-${key}`}
                  value={theme?.[themeType]?.[key] || "#000000"}
                  onChange={(e) =>
                    handleThemeChange(themeType, key, e.target.value)
                  }
                  className={styles.colorPicker}
                  disabled={isSaving || !!isResetting}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  #
                </span>
                <input
                  type="text"
                  aria-label={`Valor hexadecimal para ${getColorLabel(key)}`}
                  value={(theme?.[themeType]?.[key] || "").substring(1)}
                  onChange={(e) =>
                    handleThemeChange(themeType, key, e.target.value)
                  }
                  className={styles.hexInput}
                  disabled={isSaving || !!isResetting}
                  maxLength={6}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading)
    return <p className={styles.loadingOrError}>Cargando tema...</p>;
  if (error) return <p className={styles.loadingOrError}>{error}</p>;

  return (
    <form onSubmit={handleSave} className={styles.form}>
      <div className={styles.tabContainer}>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "public" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("public")}
        >
          Apariencia de la Tienda
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "admin" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("admin")}
        >
          Apariencia del Panel
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "public" &&
          renderThemeSection("publicTheme", "Colores de la Tienda Pública")}
        {activeTab === "admin" &&
          renderThemeSection(
            "adminTheme",
            "Colores del Panel de Administración"
          )}
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`${styles.button} ${styles.saveButton}`}
          disabled={isSaving || !!isResetting}
        >
          <LuSaveAll />
          {isSaving ? "Guardando..." : "Guardar Todos los Cambios"}
        </button>
      </div>
    </form>
  );
};

export default ThemeEditorForm;
