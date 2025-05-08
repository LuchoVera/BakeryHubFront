import React, { useState, ChangeEvent, FormEvent, FocusEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { AdminRegisterDto, ApiErrorResponse } from "../../types";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validatePattern,
  validateComparison,
  validateExactLength,
} from "../../utils/validationUtils";
import styles from "./AdminRegistrationForm.module.css";
import { LuCircleHelp, LuEye, LuEyeOff } from "react-icons/lu";

const apiUrl = "/api";

const AdminRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AdminRegisterDto>({
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    businessName: "",
    subdomain: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validateField = (name: string, value: string): string => {
    let error = "";
    const cleanedValue =
      name === "subdomain"
        ? value.toLowerCase().replace(/[^a-z0-9-]/g, "")
        : value;
    switch (name) {
      case "adminName":
        error =
          validateRequired(value) ||
          validateMinLength(value, 2) ||
          validateMaxLength(value, 150);
        if (error.includes("required")) return "Tu nombre es requerido.";
        if (error.includes("at least 2"))
          return "Tu nombre debe tener al menos 2 caracteres.";
        if (error.includes("no more than 150"))
          return "Tu nombre no debe exceder los 150 caracteres.";
        return error;
      case "email":
        error = validateRequired(value) || validateEmail(value);
        if (error.includes("required")) return "Tu email es requerido.";
        if (error.includes("Invalid email"))
          return "Formato de email inválido.";
        return error;
      case "password":
        const errors: string[] = [];
        if (validateRequired(value)) return "La contraseña es requerida.";
        if (validateMinLength(value, 8))
          errors.push("Debe tener al menos 8 caracteres.");
        if (validateMaxLength(value, 100))
          errors.push("No debe exceder los 100 caracteres.");
        if (validatePattern(value, /[a-z]/, "x"))
          errors.push("Debe contener al menos una minúscula.");
        if (validatePattern(value, /[A-Z]/, "x"))
          errors.push("Debe contener al menos una mayúscula.");
        if (validatePattern(value, /\d/, "x"))
          errors.push("Debe contener al menos un dígito.");
        return errors.join("\n");
      case "confirmPassword":
        error =
          validateRequired(value) ||
          validateComparison(
            value,
            formData.password,
            "Las contraseñas no coinciden."
          );
        if (error.includes("required"))
          return "Confirmar contraseña es requerido.";
        return error;
      case "phoneNumber":
        error =
          validateRequired(value) ||
          validateExactLength(value, 8) ||
          validatePattern(
            value,
            /^\d{8}$/,
            "Debe contener exactamente 8 dígitos."
          );
        if (error.includes("required")) return "El teléfono es requerido.";
        if (error.includes("exactly 8 characters"))
          return "Debe contener exactamente 8 dígitos.";
        return error;
      case "businessName":
        error =
          validateRequired(value) ||
          validateMinLength(value, 3) ||
          validateMaxLength(value, 40);
        if (error.includes("required"))
          return "El nombre del negocio es requerido.";
        if (error.includes("at least 3"))
          return "El nombre del negocio debe tener al menos 3 caracteres.";
        if (error.includes("no more than 40"))
          return "El nombre del negocio no debe exceder los 40 caracteres.";
        return error;
      case "subdomain":
        const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        error =
          validateRequired(cleanedValue) ||
          validateMinLength(cleanedValue, 3) ||
          validateMaxLength(cleanedValue, 10) ||
          validatePattern(
            cleanedValue,
            subdomainRegex,
            "Solo letras minúsculas, números y guiones."
          );
        if (error.includes("required")) return "La dirección es requerida.";
        if (error.includes("at least 3"))
          return "La dirección debe tener al menos 3 caracteres.";
        if (error.includes("no more than 10"))
          return "La dirección no debe exceder los 10 caracteres.";
        return error;
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof AdminRegisterDto>).forEach((key) => {
      const error = validateField(key, formData[key] ?? "");
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    setClientErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "phoneNumber") {
      finalValue = value.replace(/[^0-9]/g, "");
    } else if (name === "subdomain") {
      finalValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
    const backendFieldName = name.charAt(0).toUpperCase() + name.slice(1);
    if (validationErrors[name] || validationErrors[backendFieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors[backendFieldName];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setClientErrors((prev) => ({ ...prev, [name]: error }));
    if (name === "password" && formData.confirmPassword) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      setClientErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setValidationErrors({});
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const registrationData: AdminRegisterDto = { ...formData };

    try {
      await axios.post(`${apiUrl}/accounts/register-admin`, registrationData);
      setSuccessMessage(
        "¡Registro Exitoso! Redirigiendo al panel de administración..."
      );
      setFormData({
        adminName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        businessName: "",
        subdomain: "",
      });
      setClientErrors({});
      setValidationErrors({});

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 1500);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const response = axiosError.response;
      const responseData = response?.data;
      console.error("Fallo de Registro:", responseData || axiosError.message);

      let errorMessage = "Ocurrió un error desconocido durante el registro.";

      if (response) {
        if (response.status === 400) {
          errorMessage = "Error: El subdominio elegido ya está en uso.";

          if (typeof responseData === "object" && responseData?.errors) {
            const backendErrors: Record<string, string[]> = responseData.errors;
            const frontendValidationErrors: Record<string, string[]> = {};
            let specificSubdomainMsgFound = false;
            for (const key in backendErrors) {
              const frontendKey = key.charAt(0).toLowerCase() + key.slice(1);
              frontendValidationErrors[frontendKey] = backendErrors[key];

              if (frontendKey === "subdomain" && backendErrors[key]?.[0]) {
                errorMessage = backendErrors[key][0];
                specificSubdomainMsgFound = true;
              }
            }
            setValidationErrors(frontendValidationErrors);

            if (!specificSubdomainMsgFound) {
              errorMessage =
                "Error: El subdominio elegido ya está en uso o es inválido.";
            }
          }
        }
      } else if (axiosError.message) {
        errorMessage = `Error de red: ${axiosError.message}`;
      }
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (
    fieldName: keyof AdminRegisterDto
  ): string | undefined => {
    if (clientErrors[fieldName]) {
      return clientErrors[fieldName];
    }
    const backendErrorList = validationErrors[fieldName];
    if (backendErrorList && backendErrorList.length > 0) {
      return backendErrorList.join(" ");
    }
    const pascalCaseName =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const backendPascalErrorList = validationErrors[pascalCaseName];
    if (backendPascalErrorList && backendPascalErrorList.length > 0) {
      return backendPascalErrorList.join(" ");
    }
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h2>Registra tu Negocio</h2>
      <div className={styles.formGroup}>
        <label htmlFor="adminName">Tu Nombre</label>
        <input
          type="text"
          id="adminName"
          name="adminName"
          value={formData.adminName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("adminName")}
          aria-describedby={
            getFieldError("adminName") ? "adminName-error" : undefined
          }
        />
        {getFieldError("adminName") && (
          <span id="adminName-error" className={styles.validationError}>
            {getFieldError("adminName")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Tu Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("email")}
          aria-describedby={getFieldError("email") ? "email-error" : undefined}
        />
        {getFieldError("email") && (
          <span id="email-error" className={styles.validationError}>
            {getFieldError("email")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Contraseña</label>
        <div className={styles.passwordInputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            aria-invalid={!!getFieldError("password")}
            aria-describedby={
              getFieldError("password") ? "password-error" : undefined
            }
            className={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.passwordToggleBtn}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <LuEyeOff /> : <LuEye />}
          </button>
        </div>
        {getFieldError("password") && (
          <span id="password-error" className={styles.validationError}>
            {getFieldError("password")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("confirmPassword")}
          aria-describedby={
            getFieldError("confirmPassword")
              ? "confirmPassword-error"
              : undefined
          }
        />
        {getFieldError("confirmPassword") && (
          <span id="confirmPassword-error" className={styles.validationError}>
            {getFieldError("confirmPassword")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">Teléfono (8 dígitos)</label>
        <input
          type="text"
          inputMode="numeric"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          maxLength={8}
          title="Debe contener exactamente 8 dígitos"
          aria-invalid={!!getFieldError("phoneNumber")}
          aria-describedby={
            getFieldError("phoneNumber") ? "phoneNumber-error" : undefined
          }
        />
        {getFieldError("phoneNumber") && (
          <span id="phoneNumber-error" className={styles.validationError}>
            {getFieldError("phoneNumber")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="businessName" className={styles.labelWithTooltip}>
          <span>Nombre del Negocio</span>
          <LuCircleHelp
            className={styles.tooltipTrigger}
            title="Este es el nombre público que verán tus clientes en tu tienda."
            aria-label="Información sobre nombre del negocio"
          />
        </label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          value={formData.businessName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          minLength={3}
          maxLength={40}
          aria-invalid={!!getFieldError("businessName")}
          aria-describedby={
            getFieldError("businessName") ? "businessName-error" : undefined
          }
        />
        {getFieldError("businessName") && (
          <span id="businessName-error" className={styles.validationError}>
            {getFieldError("businessName")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subdomain" className={styles.labelWithTooltip}>
          <span>Elige la Dirección de tu Sitio (.localhost)</span>
          <LuCircleHelp
            className={styles.tooltipTrigger}
            title="Será la dirección web única de tu tienda (ej: mi-pasteleria.localhost). Solo minúsculas, números y guiones."
            aria-label="Información sobre dirección del sitio"
          />
        </label>
        <input
          type="text"
          id="subdomain"
          name="subdomain"
          placeholder="ej: mi-pasteleria"
          value={formData.subdomain}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          minLength={3}
          maxLength={10}
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          title="Solo minúsculas, números y guiones."
          aria-invalid={!!getFieldError("subdomain")}
          aria-describedby={
            getFieldError("subdomain") ? "subdomain-error" : undefined
          }
        />
        <span className={styles.previewText}>
          Vista previa: http://{formData.subdomain || "tu-eleccion"}.localhost
        </span>
        {getFieldError("subdomain") && (
          <span id="subdomain-error" className={styles.validationError}>
            {getFieldError("subdomain")}
          </span>
        )}
      </div>
      {serverError && !successMessage && (
        <p className={styles.error}>{serverError}</p>
      )}
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Registrando..." : "Registrar Negocio"}
      </button>
    </form>
  );
};

export default AdminRegistrationForm;
