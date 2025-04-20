import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
} from "react";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  CustomerRegisterDto,
  EmailCheckResultDto,
  ApiErrorResponse,
  LinkCustomerDto,
} from "../../types";

import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validatePattern,
  validateComparison,
} from "../../utils/validationUtils";
import styles from "./TenantCustomerSignUpForm.module.css";

interface TenantCustomerSignUpFormProps {
  subdomain: string;
  tenantName?: string;
  onSuccess: (userId: string) => void;
}

type EmailCheckState = "idle" | "checking" | "checked";

const TenantCustomerSignUpForm: React.FC<TenantCustomerSignUpFormProps> = ({
  subdomain,
  tenantName,
}) => {
  const [email, setEmail] = useState("");
  const [emailCheckState, setEmailCheckState] =
    useState<EmailCheckState>("idle");
  const [emailCheckResult, setEmailCheckResult] =
    useState<EmailCheckResultDto | null>(null);
  const [formData, setFormData] = useState<Omit<CustomerRegisterDto, "email">>({
    name: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const [linkingAccount, setLinkingAccount] = useState<boolean>(false);
  const [registering, setRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setEmailCheckState("idle");
    setEmailCheckResult(null);
    setError(null);
    setSuccessMessage(null);
    setClientErrors({});
  }, [email]);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "name":
        error = validateRequired(value);
        if (!error) error = validateMinLength(value, 2);
        if (!error) error = validateMaxLength(value, 150);
        return error;
      case "password":
        error = validateRequired(value);
        if (!error) error = validateMinLength(value, 8);
        if (!error) error = validateMaxLength(value, 100);
        return error;
      case "confirmPassword":
        error = validateRequired(value);
        if (!error)
          error = validateComparison(
            value,
            formData.password,
            "Las contraseñas no coinciden."
          );
        return error;
      case "phoneNumber":
        error = validateRequired(value);

        if (!error)
          error = validatePattern(
            value,
            /^\d{8}$/,
            "Debe contener exactamente 8 dígitos."
          );
        return error;
      default:
        return "";
    }
  };

  const checkEmailExists = useCallback(async () => {
    const emailValidationError = validateEmail(email || "");
    if (!email || emailValidationError) {
      setClientErrors({
        email:
          emailValidationError ||
          validateRequired(email) ||
          "Por favor, introduce un email válido.",
      });
      setEmailCheckState("idle");
      return;
    }
    setClientErrors((prev) => ({ ...prev, email: "" }));
    setError(null);
    setSuccessMessage(null);
    setCheckingEmail(true);
    setEmailCheckState("checking");

    try {
      const response = await axios.get<EmailCheckResultDto>(
        `/api/accounts/check-email?email=${encodeURIComponent(email)}`
      );
      setEmailCheckResult(response.data);
      if (response.data.exists && response.data.isAdmin) {
        setError(
          "Este email pertenece a un administrador y no puede ser registrado como cliente."
        );
      } else if (response.data.exists && !response.data.isCustomer) {
        setError(
          "Ya existe una cuenta con este email, pero no puede vincularse como cliente."
        );
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setError(
        "No se pudo verificar la dirección de email. Por favor, inténtalo de nuevo."
      );
      setEmailCheckResult(null);
    } finally {
      setCheckingEmail(false);
      setEmailCheckState("checked");
    }
  }, [email]);

  const handleEmailBlur = () => {
    if (isFormDisabled || emailCheckState !== "idle" || !email) {
      return;
    }

    checkEmailExists();
  };

  const handleDetailInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateDetailsForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    const emailValidationError =
      validateRequired(email) || validateEmail(email);
    if (emailValidationError) {
      errors.email = emailValidationError;
      isValid = false;
    }

    if (!emailCheckResult || !emailCheckResult.exists) {
      (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
        const fieldError = validateField(key, formData[key]);
        if (fieldError) {
          errors[key] = fieldError;
          isValid = false;
        }
      });
    }

    setClientErrors(errors);
    return isValid;
  };

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateDetailsForm()) {
      setError("Por favor, corrige los errores en el formulario.");
      return;
    }

    if (emailCheckResult?.exists && emailCheckResult?.isCustomer) {
      setError(
        "Este email ya está registrado. Utiliza la opción de vincular cuenta."
      );
      return;
    }
    if (emailCheckResult?.exists && emailCheckResult?.isAdmin) {
      setError("Este email pertenece a un administrador.");
      return;
    }

    setRegistering(true);
    setLoading(true);
    const registrationData: CustomerRegisterDto = { email, ...formData };

    try {
      const apiUrl = `/api/public/tenants/${subdomain}/register-customer`;
      const response = await axios.post<{
        message: string;
        status: string;
        userId?: string;
      }>(apiUrl, registrationData);

      const status = response.data?.status;
      const message = response.data?.message || "Operación exitosa.";

      if (status === "UserCreated") {
        console.log("Nuevo usuario creado, redirigiendo al login...");
        setSuccessMessage(message + " Redirigiendo al login...");
        setEmail("");
        setFormData({
          name: "",
          password: "",
          confirmPassword: "",
          phoneNumber: "",
        });
        setEmailCheckState("idle");
        setEmailCheckResult(null);
        setClientErrors({});
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(message || "Registro completado con un estado inesperado.");
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const responseData = axiosError.response?.data;
      const statusCode = axiosError.response?.status;
      let errorMessage = "Ocurrió un error desconocido.";

      if (statusCode === 409) {
        if (
          responseData?.errors?.["AlreadyMember"] ||
          responseData?.title?.includes("Already Registered")
        ) {
          errorMessage =
            responseData?.errors?.["AlreadyMember"]?.[0] ||
            "Ya estás registrado en esta panadería.";
          if (!emailCheckResult?.exists) checkEmailExists();
        } else if (
          responseData?.errors?.["AdminConflict"] ||
          responseData?.title?.includes("Forbidden")
        ) {
          errorMessage =
            responseData?.errors?.["AdminConflict"]?.[0] ||
            "Este email pertenece a un administrador.";
        } else {
          errorMessage =
            responseData?.title ||
            responseData?.detail ||
            "Conflicto de registro.";
        }
      } else if (statusCode === 400 && responseData?.errors) {
        errorMessage =
          "Ocurrieron errores de validación desde el servidor. Por favor revisa el formulario.";
      } else if (statusCode === 404) {
        errorMessage =
          responseData?.detail ||
          responseData?.message ||
          `Panadería '${subdomain}' no encontrada.`;
      } else {
        errorMessage =
          responseData?.detail ||
          responseData?.message ||
          "Ocurrió un error desconocido durante el registro.";
      }
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setRegistering(false);
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (
      !email ||
      !emailCheckResult ||
      !emailCheckResult.exists ||
      !emailCheckResult.isCustomer ||
      emailCheckResult.isAdmin ||
      linkingAccount ||
      loading
    ) {
      console.warn("Link account called under invalid conditions.");
      return;
    }

    setLinkingAccount(true);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const linkData: Pick<LinkCustomerDto, "email"> = { email };

    try {
      const apiUrl = `/api/public/tenants/${subdomain}/link-customer`;

      const response = await axios.post<{
        message: string;
        status: string;
        userId?: string;
      }>(apiUrl, linkData);
      const status = response.data?.status;
      const message = response.data?.message || "Operación exitosa.";

      if (status === "Linked") {
        console.log("Cuenta vinculada exitosamente, redirigiendo al login...");
        setSuccessMessage(message + " Redirigiendo al login...");

        setEmail("");
        setFormData({
          name: "",
          password: "",
          confirmPassword: "",
          phoneNumber: "",
        });
        setEmailCheckState("idle");
        setEmailCheckResult(null);
        setClientErrors({});
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(
          message ||
            "No se pudo vincular la cuenta debido a un estado inesperado."
        );
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const responseData = axiosError.response?.data;
      const statusCode = axiosError.response?.status;
      let errorMessage = "Ocurrió un error desconocido durante la vinculación.";

      if (statusCode === 409) {
        const conflictTitle = responseData?.title || "";
        if (conflictTitle.includes("Already Linked")) {
          errorMessage =
            responseData?.errors?.["AlreadyMember"]?.[0] ??
            responseData?.detail ??
            "Ya estás vinculado a esta panadería.";
        } else if (conflictTitle.includes("Linking Forbidden")) {
          errorMessage =
            responseData?.errors?.["AdminConflict"]?.[0] ??
            responseData?.detail ??
            "Los administradores no pueden vincularse como clientes.";
        } else {
          errorMessage =
            responseData?.detail ?? "Conflicto al intentar vincular.";
        }
      } else if (statusCode === 404) {
        errorMessage =
          responseData?.message ?? "Email o panadería no encontrada.";
      } else if (statusCode === 400) {
        errorMessage =
          responseData?.errors?.["UserNotCustomer"]?.[0] ??
          responseData?.errors?.["LinkingFailed"]?.[0] ??
          responseData?.title ??
          responseData?.detail ??
          "No se pudo completar la vinculación.";
      } else {
        errorMessage =
          responseData?.detail ?? "Ocurrió un error inesperado en el servidor.";
      }
      setError(errorMessage);
      console.error("Linking error:", err);
    } finally {
      setLinkingAccount(false);
      setLoading(false);
    }
  };

  const showDetailsForm =
    emailCheckState === "idle" ||
    (emailCheckState === "checked" &&
      (!emailCheckResult || !emailCheckResult.exists));
  const showLinkingSection =
    emailCheckState === "checked" &&
    emailCheckResult?.exists &&
    emailCheckResult.isCustomer &&
    !emailCheckResult.isAdmin;
  const isEmailInputDisabled =
    checkingEmail || linkingAccount || registering || !!successMessage;
  const isFormDisabled = loading || !!successMessage;

  return (
    <form onSubmit={handleRegisterSubmit} className={styles.form} noValidate>
      <h2>Regístrate en {tenantName || subdomain}</h2>

      <div className={styles.formGroup}>
        <label htmlFor="signup-email">Dirección de Email</label>
        <input
          type="email"
          id="signup-email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          required
          disabled={isEmailInputDisabled}
          aria-invalid={
            !!clientErrors.email || (!!error && !showLinkingSection)
          }
          aria-describedby={clientErrors.email ? "email-error" : undefined}
        />
        {checkingEmail && (
          <span className={styles.info}>Verificando email...</span>
        )}

        {clientErrors.email && (
          <span id="email-error" className={styles.validationError}>
            {clientErrors.email}
          </span>
        )}
      </div>

      {showLinkingSection && (
        <div className={styles.linkAccountSection}>
          <p>
            Ya tienes una cuenta registrada en BakeryHub con el email '{email}'.
            Se va a sincronizar tu información.
          </p>
          <button
            type="button"
            onClick={handleLinkAccount}
            disabled={linkingAccount || isFormDisabled}
            className={styles.submitButton}
          >
            {linkingAccount ? "Vinculando..." : `Vincular y Continuar`}
          </button>
        </div>
      )}

      {showDetailsForm && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tu Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleDetailInputChange}
              required
              disabled={isFormDisabled}
              aria-invalid={!!clientErrors.name}
              aria-describedby={clientErrors.name ? "name-error" : undefined}
            />

            {clientErrors.name && (
              <span id="name-error" className={styles.validationError}>
                {clientErrors.name}
              </span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Teléfono (8 dígitos)</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleDetailInputChange}
              required
              maxLength={8}
              pattern="\d{8}"
              disabled={isFormDisabled}
              aria-invalid={!!clientErrors.phoneNumber}
              aria-describedby={
                clientErrors.phoneNumber ? "phone-error" : undefined
              }
            />

            {clientErrors.phoneNumber && (
              <span id="phone-error" className={styles.validationError}>
                {clientErrors.phoneNumber}
              </span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleDetailInputChange}
              required
              minLength={8}
              disabled={isFormDisabled}
              aria-invalid={!!clientErrors.password}
              aria-describedby={
                clientErrors.password ? "password-error" : undefined
              }
            />

            {clientErrors.password && (
              <span id="password-error" className={styles.validationError}>
                {clientErrors.password}
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
              onChange={handleDetailInputChange}
              required
              disabled={isFormDisabled}
              aria-invalid={!!clientErrors.confirmPassword}
              aria-describedby={
                clientErrors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
            />

            {clientErrors.confirmPassword && (
              <span
                id="confirm-password-error"
                className={styles.validationError}
              >
                {clientErrors.confirmPassword}
              </span>
            )}
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={registering || isFormDisabled}
          >
            {registering ? "Registrando..." : "Completar Registro"}
          </button>
        </>
      )}

      {error && !successMessage && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {!successMessage && (
        <p style={{ textAlign: "center", marginTop: "15px" }}>
          ¿Ya tienes una cuenta para esta panadería?{" "}
          <Link to="/login">Iniciar Sesión</Link>
        </p>
      )}
    </form>
  );
};

export default TenantCustomerSignUpForm;
