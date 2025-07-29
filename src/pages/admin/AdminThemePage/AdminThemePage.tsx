import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeEditorForm from "../../../components/ThemeEditorForm/ThemeEditorForm";
import BasicThemeSelector from "../../../components/BasicThemeSelector/BasicThemeSelector";
import styles from "./AdminThemePage.module.css";
import { TenantThemeDto } from "../../../types";
import { getAdminTheme, updateAdminTheme } from "../../../services/apiService";
import { useNotification } from "../../../hooks/useNotification";

type ViewMode = "basic" | "advanced";

const AdminThemePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [theme, setTheme] = useState<TenantThemeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getTabFromUrl = useCallback((): "public" | "admin" => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    return tab === "public" ? "public" : "admin";
  }, [location.search]);

  const getViewModeFromUrl = useCallback((): ViewMode => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    return view === "advanced" ? "advanced" : "basic";
  }, [location.search]);

  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [viewMode, setViewMode] = useState<ViewMode>(getViewModeFromUrl());

  useEffect(() => {
    setActiveTab(getTabFromUrl());
    setViewMode(getViewModeFromUrl());
  }, [location.search, getTabFromUrl, getViewModeFromUrl]);

  const fetchTheme = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminTheme();
      setTheme(data);
    } catch (err) {
      showNotification("No se pudo cargar la configuración del tema.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleApplyTheme = async (newTheme: TenantThemeDto) => {
    setIsSaving(true);
    try {
      await updateAdminTheme(newTheme);
      setTheme(newTheme);
      showNotification("¡Paleta de colores aplicada con éxito!", "success");
      if (activeTab === "admin") {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      showNotification("Error al aplicar la paleta de colores.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateUrlParams = (tab: string, view: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("view", view);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleTabChange = (tab: "public" | "admin") => {
    updateUrlParams(tab, viewMode);
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    updateUrlParams(activeTab, newMode);
  };

  if (isLoading) {
    return <p className={styles.pageSubtitle}>Cargando tema...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Personalización de Apariencia</h1>

      <div className={styles.tabContainer}>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "admin" ? styles.activeTab : ""
          }`}
          onClick={() => handleTabChange("admin")}
        >
          Apariencia del Panel
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === "public" ? styles.activeTab : ""
          }`}
          onClick={() => handleTabChange("public")}
        >
          Apariencia de la Tienda
        </button>
      </div>

      {viewMode === "basic" ? (
        <BasicThemeSelector
          onApplyTheme={handleApplyTheme}
          onSwitchToAdvanced={() => handleViewModeChange("advanced")}
          currentTheme={theme}
          activeTab={activeTab}
          isSaving={isSaving}
        />
      ) : (
        <ThemeEditorForm
          onSwitchToBasic={() => handleViewModeChange("basic")}
        />
      )}
    </div>
  );
};

export default AdminThemePage;
