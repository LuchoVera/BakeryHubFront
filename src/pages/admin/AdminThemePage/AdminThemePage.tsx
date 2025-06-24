import React from "react";
import ThemeEditorForm from "../../../components/ThemeEditorForm/ThemeEditorForm";
import styles from "./AdminThemePage.module.css";

const AdminThemePage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Personalización de Apariencia</h1>
      <p className={styles.pageSubtitle}>
        Cambia los colores de tu tienda y de tu panel de administración para que
        coincidan con tu marca.
      </p>

      <ThemeEditorForm />
    </div>
  );
};

export default AdminThemePage;
