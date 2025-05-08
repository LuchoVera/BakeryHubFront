import React, { useState, ChangeEvent, FormEvent, FocusEvent } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import {
  LoginDto,
  AuthResponseDto,
  ApiErrorResponse,
  AuthUser,
} from "../../types";
import { validateRequired, validateEmail } from "../../utils/validationUtils";
import styles from "./LoginForm.module.css";
import { LuEye, LuEyeOff } from "react-icons/lu";

interface LoginFormProps {
  subdomainContext?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ subdomainContext = null }) => {
  const [formData, setFormData] = useState<LoginDto>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "email":
        error = validateRequired(value) || validateEmail(value);
        if (error.includes("required")) return "Este campo es requerido.";
        if (error.includes("Invalid email"))
          return "Formato de correo inválido.";
        return error;
      case "password":
        error = validateRequired(value);
        if (error.includes("required")) return "Este campo es requerido.";
        return error;
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    const emailError = validateField("email", formData.email);
    if (emailError) {
      errors.email = emailError;
      isValid = false;
    }
    const passwordError = validateField("password", formData.password);
    if (passwordError) {
      errors.password = passwordError;
      isValid = false;
    }
    if (!isValid && (!emailError || !passwordError)) {
      errors.form = "Correo electrónico y contraseña son requeridos.";
    }
    setClientErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (clientErrors.form) {
      setClientErrors((prev) => ({ ...prev, form: "" }));
    }
    setServerError(null);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email" || name === "password") {
      const error = validateField(name, value);
      setClientErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    if (!validateForm()) return;
    setLoading(true);
    const loginPayload: LoginDto = {
      ...formData,
      subdomainContext,
    };
    try {
      const response = await axios.post<AuthResponseDto>(
        "/api/accounts/login",
        loginPayload
      );
      const data = response.data;
      const user: AuthUser = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        roles: data.roles,
        administeredTenantId: data.administeredTenantId,
        administeredTenantSubdomain: data.administeredTenantSubdomain,
      };
      login(user);
      setClientErrors({});
      const destination =
        (location.state as { from?: Location | string })?.from || null;
      let redirectTo = "/";
      if (typeof destination === "string") {
        redirectTo = destination;
      } else if (
        destination?.pathname &&
        destination.pathname.toLowerCase() !== "/login"
      ) {
        redirectTo = destination.pathname + (destination.search || "");
      }
      if (data.roles.includes("Admin")) {
        redirectTo = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
      } else if (data.roles.includes("Customer")) {
        redirectTo = "/";
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorDetail =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        axiosError.response?.data?.message ||
        "Fallo de inicio de sesión. Verifica credenciales.";
      setServerError(errorDetail);
      setLoading(false);
    }
  };

  const getFieldError = (
    fieldName: keyof LoginDto | "form"
  ): string | undefined => {
    return clientErrors[fieldName];
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.formGroup}>
        <label htmlFor="email">Correo Electrónico</label>
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

      <div className={`${styles.formGroup} ${styles.rememberMeGroup}`}>
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          className={styles.rememberMeCheckbox}
        />
        <label htmlFor="rememberMe" className={styles.rememberMeLabel}>
          Recordarme
        </label>
      </div>

      {(getFieldError("form") || serverError) && (
        <p className={styles.error}>{getFieldError("form") || serverError}</p>
      )}

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </button>
    </form>
  );
};

export default LoginForm;
