import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import styles from "./StoreSettingsPage.module.css";
import { LuSave, LuLock, LuUser } from "react-icons/lu";
import {
  UpdateAdminProfileDto,
  TenantDto,
  ApiErrorResponse,
} from "../../../types";
import {
  updateAdminProfile,
  fetchAdminTenantDetails,
} from "../../../services/apiService";
import { useNotification } from "../../../hooks/useNotification";
import { AxiosError } from "axios";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateExactLength,
  validatePattern,
} from "../../../utils/validationUtils";

const StoreSettingsPage: React.FC = () => {
  const { user, login: updateUserAuthContext } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    adminName: "",
    phoneNumber: "",
    businessName: "",
  });
  const [initialData, setInitialData] = useState({
    adminName: "",
    phoneNumber: "",
    businessName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const tenantDetails: TenantDto = await fetchAdminTenantDetails();
          const initial = {
            adminName: user.name,
            phoneNumber: user.phoneNumber || "",
            businessName: tenantDetails.name,
          };
          setFormData(initial);
          setInitialData(initial);
        }
      } catch (error) {
        showNotification("Error al cargar los datos de la tienda.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, showNotification]);

  const validateField = (
    name: keyof typeof formData,
    value: string
  ): string => {
    let error = "";
    switch (name) {
      case "adminName":
        error =
          validateRequired(value) ||
          validateMinLength(value, 2) ||
          validateMaxLength(value, 150);
        if (error.includes("required")) return "Tu nombre es requerido.";
        if (error.includes("at least 2"))
          return "Tu nombre debe tener al menos 2 caracteres.";
        return "";
      case "phoneNumber":
        error =
          validateRequired(value) ||
          validateExactLength(value, 8) ||
          validatePattern(value, /^\d{8}$/, "Debe contener solo 8 dígitos.");
        if (error.includes("required")) return "El teléfono es requerido.";
        if (error.includes("exactly 8"))
          return "Debe contener exactamente 8 dígitos.";
        return "";
      case "businessName":
        error =
          validateRequired(value) ||
          validateMinLength(value, 3) ||
          validateMaxLength(value, 200);
        if (error.includes("required"))
          return "El nombre del negocio es requerido.";
        if (error.includes("at least 3"))
          return "El nombre debe tener al menos 3 caracteres.";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    setClientErrors(errors);
    return isValid;
  };

  const hasChanges =
    formData.adminName !== initialData.adminName ||
    formData.phoneNumber !== initialData.phoneNumber ||
    formData.businessName !== initialData.businessName;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !hasChanges) return;

    setIsSaving(true);
    const payload: UpdateAdminProfileDto = {
      adminName: formData.adminName,
      phoneNumber: formData.phoneNumber,
      businessName: formData.businessName,
    };

    try {
      const updatedUser = await updateAdminProfile(payload);
      updateUserAuthContext(updatedUser);
      showNotification("Perfil actualizado con éxito.", "success");
      setInitialData(formData);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        "Ocurrió un error al actualizar el perfil.";
      showNotification(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className={styles.loadingMessage}>Cargando configuración...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <form onSubmit={handleSubmit} noValidate className={styles.settingsCard}>
        <h1 className={styles.formTitle}>Ajustes de la Tienda</h1>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            <LuUser /> Datos Personales y del Negocio
          </h2>
          <div className={styles.formGroup}>
            <label htmlFor="adminName">Nombre</label>
            <input
              type="text"
              id="adminName"
              name="adminName"
              value={formData.adminName}
              onChange={handleInputChange}
              className={styles.inputField}
              disabled={isSaving}
            />
            {clientErrors.adminName && (
              <p className={styles.validationError}>{clientErrors.adminName}</p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Celular</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={styles.inputField}
              disabled={isSaving}
              maxLength={8}
            />
            {clientErrors.phoneNumber && (
              <p className={styles.validationError}>
                {clientErrors.phoneNumber}
              </p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="businessName">Nombre del Negocio</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className={styles.inputField}
              disabled={isSaving}
            />
            {clientErrors.businessName && (
              <p className={styles.validationError}>
                {clientErrors.businessName}
              </p>
            )}
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Seguridad</h2>
          <div className={styles.actionItem}>
            <Link to="/admin/change-password" className={styles.actionLink}>
              <LuLock />
              Cambiar mi contraseña
            </Link>
          </div>
        </section>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={`${styles.button} ${styles.saveButton}`}
            disabled={isSaving || !hasChanges}
          >
            <LuSave /> {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsPage;
