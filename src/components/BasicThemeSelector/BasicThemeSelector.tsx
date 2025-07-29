import React from "react";
import styles from "./BasicThemeSelector.module.css";
import { predefinedPalettes } from "../../utils/themePalettes";
import { TenantThemeDto, ThemeSettingsDto } from "../../types";
import { LuPaintbrush } from "react-icons/lu";

interface BasicThemeSelectorProps {
  onApplyTheme: (theme: TenantThemeDto) => void;
  onSwitchToAdvanced: () => void;
  currentTheme: TenantThemeDto | null;
  activeTab: "public" | "admin";
  isSaving: boolean;
}

const BasicThemeSelector: React.FC<BasicThemeSelectorProps> = ({
  onApplyTheme,
  onSwitchToAdvanced,
  currentTheme,
  activeTab,
  isSaving,
}) => {
  const handlePaletteSelect = (paletteTheme: ThemeSettingsDto) => {
    if (!currentTheme) return;

    const updatedTheme: TenantThemeDto = {
      ...currentTheme,
      [activeTab === "public" ? "publicTheme" : "adminTheme"]: paletteTheme,
    };

    onApplyTheme(updatedTheme);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Elige una Apariencia</h2>
      <p className={styles.subtitle}>
        Selecciona una paleta predefinidas para un cambio rápido, o personaliza
        cada detalle en el modo avanzado.
      </p>

      <div className={styles.paletteGrid}>
        {predefinedPalettes.map((palette) => (
          <div
            key={palette.name}
            className={styles.paletteCard}
            onClick={() => handlePaletteSelect(palette.theme)}
            role="button"
            tabIndex={0}
            aria-label={`Seleccionar paleta ${palette.name}`}
          >
            <div className={styles.palettePreview}>
              <div
                className={styles.colorBlock}
                style={{ backgroundColor: palette.theme.colorPrimary }}
              />
              <div
                className={styles.colorBlock}
                style={{ backgroundColor: palette.theme.colorSecondary }}
              />
              <div
                className={styles.colorBlock}
                style={{ backgroundColor: palette.theme.colorSurface }}
              />
              <div
                className={styles.colorBlock}
                style={{ backgroundColor: palette.theme.colorTextPrimary }}
              />
            </div>
            <h3 className={styles.paletteName}>{palette.name}</h3>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          onClick={onSwitchToAdvanced}
          className={styles.advancedButton}
          disabled={isSaving}
        >
          <LuPaintbrush />
          Personalización Avanzada
        </button>
      </div>
    </div>
  );
};

export default BasicThemeSelector;
