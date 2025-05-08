import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  FocusEvent,
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
  validateExactLength,
} from "../../utils/validationUtils";
import styles from "./TenantCustomerSignUpForm.module.css";
import { LuEye, LuEyeOff } from "react-icons/lu";

interface TenantCustomerSignUpFormProps {
  subdomain: string;
  tenantName?: string;
}

type EmailCheckState = "idle" | "checking" | "checked";

const TenantCustomerSignUpForm: React.FC<TenantCustomerSignUpFormProps> = ({
  subdomain,
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
    if (clientErrors.email) {
      setClientErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "name":
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
          validatePattern(value, /^\d{8}$/, "Debe contener solo 8 dígitos.");
        if (error.includes("required")) return "El teléfono es requerido.";
        if (error.includes("exactly 8 characters"))
          return "Debe contener exactamente 8 dígitos.";
        return error;
      default:
        return "";
    }
  };

  const checkEmailExists = useCallback(async () => {
    let emailValidationError = validateRequired(email) || validateEmail(email);
    if (emailValidationError) {
      if (emailValidationError.includes("required"))
        emailValidationError = "El correo es requerido.";
      if (emailValidationError.includes("Invalid email"))
        emailValidationError = "Formato de correo inválido.";
      setClientErrors({ email: emailValidationError });
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
          "Ya existe una cuenta con este email, pero no está marcada como cliente."
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

  const handleEmailBlur = (_e: FocusEvent<HTMLInputElement>) => {
    if (isFormDisabled || emailCheckState !== "idle" || !email) {
      return;
    }
    checkEmailExists();
  };

  const handleDetailInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "phoneNumber") {
      finalValue = value.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "password" && clientErrors.confirmPassword) {
      setClientErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleDetailBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name !== "email") {
      const fieldError = validateField(name, value);
      setClientErrors((prev) => ({ ...prev, [name]: fieldError }));
    }

    if (name === "password" && formData.confirmPassword) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      setClientErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const validateDetailsForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    let emailValidationError = validateRequired(email) || validateEmail(email);
    if (emailValidationError) {
      if (emailValidationError.includes("required"))
        emailValidationError = "El correo es requerido.";
      if (emailValidationError.includes("Invalid email"))
        emailValidationError = "Formato de correo inválido.";
      errors.email = emailValidationError;
      isValid = false;
    }

    if (!emailCheckResult?.exists) {
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
      return;
    }

    if (emailCheckResult?.exists && emailCheckResult?.isCustomer) {
      setError(
        "Este email ya está registrado como cliente aquí. ¿Quieres iniciar sesión o vincular la cuenta?"
      );
      return;
    }
    if (emailCheckResult?.exists && emailCheckResult?.isAdmin) {
      setError(
        "Este email pertenece a un administrador y no puede registrarse como cliente."
      );
      return;
    }

    setRegistering(true);
    setLoading(true);
    const registrationData: CustomerRegisterDto = {
      email,
      name: formData.name,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phoneNumber: formData.phoneNumber,
    };

    try {
      const apiUrl = `/api/public/tenants/${subdomain}/register-customer`;
      const response = await axios.post<{
        message: string;
        status: string;
        userId?: string;
      }>(apiUrl, registrationData);
      const status = response.data?.status;
      const message = response.data?.message || "Operación exitosa.";

      if (status === "UserCreated" || status === "MembershipCreated") {
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
      let errorMessage = "Ocurrió un error desconocido durante el registro.";

      if (statusCode === 409) {
        const conflictTitle = responseData?.title || "";
        if (
          conflictTitle.includes("Already Member") ||
          conflictTitle.includes("Already Registered")
        ) {
          errorMessage =
            responseData?.errors?.["AlreadyMember"]?.[0] ||
            "Ya estás registrado en esta tienda.";
          if (!emailCheckResult?.exists) checkEmailExists();
        } else if (
          conflictTitle.includes("AdminConflict") ||
          conflictTitle.includes("Forbidden")
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
      } else if (statusCode === 400) {
        if (responseData?.errors) {
          const firstKey = Object.keys(responseData.errors)[0];
          const firstMessage = responseData.errors[firstKey]?.[0];
          errorMessage =
            firstMessage ||
            responseData.title ||
            "Error de validación del servidor. Revisa los datos.";
        } else {
          errorMessage =
            responseData?.title ||
            responseData?.detail ||
            "Error de validación del servidor.";
        }
      } else if (statusCode === 404) {
        errorMessage =
          responseData?.detail ||
          responseData?.message ||
          `Tienda '${subdomain}' no encontrada.`;
      } else {
        errorMessage =
          responseData?.detail ||
          responseData?.message ||
          `Ocurrió un error (${statusCode || "desconocido"}).`;
      }
      setError(errorMessage);
    } finally {
      setRegistering(false);
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (
      !email ||
      !emailCheckResult?.exists ||
      !emailCheckResult.isCustomer ||
      emailCheckResult.isAdmin ||
      linkingAccount ||
      loading
    ) {
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

      if (status === "Linked" || status === "AlreadyMember") {
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
      const response = axiosError.response;
      const responseData = response?.data;
      const statusCode = response?.status;
      console.error("Linking error:", responseData || axiosError.message);

      let errorMessage = "Ocurrió un error desconocido durante la vinculación.";

      if (response) {
        const errors =
          typeof responseData === "object" && responseData !== null
            ? responseData.errors
            : undefined;
        const title =
          typeof responseData === "object" && responseData !== null
            ? responseData.title
            : undefined;
        const detail =
          typeof responseData === "object" && responseData !== null
            ? responseData.detail
            : undefined;
        const message =
          typeof responseData === "object" && responseData !== null
            ? responseData.message
            : undefined;

        const responseText =
          typeof responseData === "string" ? responseData : "";

        const alreadyLinked =
          (typeof title === "string" &&
            title.toLowerCase().includes("already linked")) ||
          (typeof detail === "string" &&
            detail.toLowerCase().includes("already linked")) ||
          (typeof responseText === "string" &&
            responseText.toLowerCase().includes("already linked")) ||
          (typeof message === "string" &&
            message.toLowerCase().includes("already linked")) ||
          errors?.["AlreadyMember"]?.[0];

        if (statusCode === 409 && alreadyLinked) {
          errorMessage = "Ya estás vinculado a esta tienda.";
        } else if (
          statusCode === 409 &&
          ((typeof title === "string" &&
            title.toLowerCase().includes("linking forbidden")) ||
            errors?.["AdminConflict"]?.[0])
        ) {
          errorMessage =
            errors?.["AdminConflict"]?.[0] ??
            "Los administradores no pueden vincularse como clientes.";
        } else if (statusCode === 400) {
          errorMessage =
            errors?.["UserNotCustomer"]?.[0] ??
            errors?.["LinkingFailed"]?.[0] ??
            (typeof title === "string" ? title : undefined) ??
            (typeof detail === "string" ? detail : undefined) ??
            "No se pudo completar la vinculación (Error 400).";
        } else if (statusCode === 404) {
          errorMessage =
            (typeof message === "string" ? message : undefined) ??
            "Email o tienda no encontrada.";
        } else if (typeof detail === "string") {
          errorMessage = detail;
        } else if (typeof message === "string") {
          errorMessage = message;
        } else if (typeof title === "string") {
          errorMessage = title;
        } else if (typeof responseText === "string" && responseText) {
          errorMessage = responseText;
        } else if (statusCode === 409) {
          errorMessage = "Conflicto al intentar vincular.";
        } else if (statusCode) {
          errorMessage = `Ocurrió un error inesperado (${statusCode}).`;
        }
      } else if (axiosError.message) {
        errorMessage = `Error de red: ${axiosError.message}`;
      }

      setError(errorMessage);
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

  const getClientError = (
    fieldName: keyof CustomerRegisterDto | "email"
  ): string | undefined => {
    return clientErrors[fieldName];
  };

  return (
    <form onSubmit={handleRegisterSubmit} className={styles.form} noValidate>
      <h2>Regístrate</h2>

      <div className={styles.formGroup}>
        <label htmlFor="signup-email">Dirección de Correo</label>
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
            !!getClientError("email") ||
            (!!error && !showLinkingSection && !showDetailsForm)
          }
          aria-describedby={getClientError("email") ? "email-error" : undefined}
        />
        {checkingEmail && (
          <span className={styles.info}>Verificando correo...</span>
        )}
        {getClientError("email") && (
          <span id="email-error" className={styles.validationError}>
            {getClientError("email")}
          </span>
        )}
      </div>

      {showLinkingSection && (
        <div className={styles.linkAccountSection}>
          <p>
            Ya tienes una cuenta registrada con el correo '{email}'. Puedes
            vincular tu cuenta existente a esta tienda.
          </p>
          <button
            type="button"
            onClick={handleLinkAccount}
            disabled={linkingAccount || isFormDisabled}
            className={styles.submitButton}
          >
            {linkingAccount ? "Vinculando..." : `Vincular Cuenta`}
          </button>
          <p className={styles.orSeparator}>O</p>
          <button
            type="button"
            onClick={() => {
              setEmailCheckResult(null);
              setEmailCheckState("idle");
              setError(null);
            }}
            className={styles.secondaryButton}
          >
            Registrar un correo diferente
          </button>
        </div>
      )}

      {showDetailsForm && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tu Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleDetailInputChange}
              onBlur={handleDetailBlur}
              required
              disabled={isFormDisabled}
              aria-invalid={!!getClientError("name")}
              aria-describedby={
                getClientError("name") ? "name-error" : undefined
              }
            />
            {getClientError("name") && (
              <span id="name-error" className={styles.validationError}>
                {getClientError("name")}
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
              onChange={handleDetailInputChange}
              onBlur={handleDetailBlur}
              required
              maxLength={8}
              disabled={isFormDisabled}
              aria-invalid={!!getClientError("phoneNumber")}
              aria-describedby={
                getClientError("phoneNumber") ? "phone-error" : undefined
              }
            />
            {getClientError("phoneNumber") && (
              <span id="phone-error" className={styles.validationError}>
                {getClientError("phoneNumber")}
              </span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <div className={styles.passwordInputWrapper}>
              {" "}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleDetailInputChange}
                onBlur={handleDetailBlur}
                required
                disabled={isFormDisabled}
                aria-invalid={!!getClientError("password")}
                aria-describedby={
                  getClientError("password") ? "password-error" : undefined
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
                title={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                disabled={isFormDisabled}
              >
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {getClientError("password") && (
              <span id="password-error" className={styles.validationError}>
                {getClientError("password")}
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
              onBlur={handleDetailBlur}
              required
              disabled={isFormDisabled}
              aria-invalid={!!getClientError("confirmPassword")}
              aria-describedby={
                getClientError("confirmPassword")
                  ? "confirm-password-error"
                  : undefined
              }
            />
            {getClientError("confirmPassword") && (
              <span
                id="confirm-password-error"
                className={styles.validationError}
              >
                {getClientError("confirmPassword")}
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

      {!successMessage && !showLinkingSection && (
        <p style={{ textAlign: "center", marginTop: "15px" }}>
          ¿Ya tienes una cuenta para esta tienda?
          <br />
          <Link to="/login">Iniciar Sesión</Link>
        </p>
      )}
    </form>
  );
};

export default TenantCustomerSignUpForm;
