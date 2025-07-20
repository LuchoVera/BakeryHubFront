import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  ReactNode,
  FocusEvent,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import styles from "./ChangePasswordPage.module.css";
import {
  LuChevronLeft,
  LuSave,
  LuEye,
  LuEyeOff,
  LuCircleCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { ApiErrorResponse, ChangePasswordDto } from "../../types";
import {
  validateRequired,
  validateMinLength,
  validatePattern,
  validateComparison,
  validateMaxLength,
} from "../../utils/validationUtils";
import { changePassword as apiChangePassword } from "../../services/apiService";
import { AxiosError } from "axios";
import { useTenant } from "../../hooks/useTenant";

interface FeedbackModalData {
  title: string;
  message: ReactNode;
  iconType: "success" | "danger";
  icon: ReactNode;
  onClose?: () => void;
}

const ChangePasswordPage: React.FC = () => {
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith("/admin");

  const tenantContext = !isAdminContext ? useTenant() : null;
  const tenantInfo = tenantContext?.tenantInfo;
  const isLoadingTenant = tenantContext?.isLoading ?? false;
  const errorTenant = tenantContext?.error;

  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [clientErrors, setClientErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
    useState<boolean>(false);
  const [feedbackModalData, setFeedbackModalData] =
    useState<FeedbackModalData | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${location.pathname}`);
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  const validateField = (
    name: keyof typeof formData,
    value: string
  ): string | string[] => {
    let errorMsg: string | string[] = "";
    switch (name) {
      case "currentPassword":
        errorMsg = validateRequired(value);
        if (errorMsg) return "La contraseña actual es requerida.";
        break;
      case "newPassword":
        const passwordErrors: string[] = [];
        if (validateRequired(value)) return "La nueva contraseña es requerida.";
        if (validateMinLength(value, 8))
          passwordErrors.push("Debe tener al menos 8 caracteres.");
        if (validateMaxLength(value, 100))
          passwordErrors.push("No debe exceder los 100 caracteres.");
        if (validatePattern(value, /[a-z]/, "x"))
          passwordErrors.push("Debe contener al menos una minúscula.");
        if (validatePattern(value, /[A-Z]/, "x"))
          passwordErrors.push("Debe contener al menos una mayúscula.");
        if (validatePattern(value, /\d/, "x"))
          passwordErrors.push("Debe contener al menos un dígito.");
        if (passwordErrors.length > 0) return passwordErrors;
        break;
      case "confirmNewPassword":
        errorMsg = validateRequired(value);
        if (errorMsg) return "Confirmar la nueva contraseña es requerido.";
        errorMsg = validateComparison(
          value,
          formData.newPassword,
          "Las nuevas contraseñas no coinciden."
        );
        if (errorMsg) return errorMsg;
        break;
      default:
        return "";
    }
    return "";
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (isFeedbackModalOpen && feedbackModalData?.iconType === "danger") {
      setIsFeedbackModalOpen(false);
      setFeedbackModalData(null);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    const error = validateField(name, value);
    setClientErrors((prev) => ({ ...prev, [name]: error }));

    if (name === "newPassword" && formData.confirmNewPassword) {
      const confirmError = validateField(
        "confirmNewPassword",
        formData.confirmNewPassword
      );
      setClientErrors((prev) => ({
        ...prev,
        confirmNewPassword: confirmError,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string | string[]> = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error && (Array.isArray(error) ? error.length > 0 : error !== "")) {
        errors[key] = error;
        isValid = false;
      }
    });
    setClientErrors(errors);
    return isValid;
  };

  const showAppFeedbackModal = (
    title: string,
    message: ReactNode,
    type: FeedbackModalData["iconType"],
    onCloseAction?: () => void
  ) => {
    let iconComponent;
    switch (type) {
      case "success":
        iconComponent = <LuCircleCheck />;
        break;
      case "danger":
      default:
        iconComponent = <LuTriangleAlert />;
        break;
    }
    setFeedbackModalData({
      title,
      message,
      iconType: type,
      icon: iconComponent,
      onClose: onCloseAction,
    });
    setIsFeedbackModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFeedbackModalOpen && feedbackModalData?.iconType === "danger") {
      setIsFeedbackModalOpen(false);
      setFeedbackModalData(null);
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload: ChangePasswordDto = { ...formData };

    try {
      await apiChangePassword(payload);
      showAppFeedbackModal(
        "Contraseña Cambiada",
        "Tu contraseña ha sido actualizada exitosamente. Serás redirigido a la página de login para mayor seguridad.",
        "success",
        async () => {
          await logout();
          navigate("/login");
        }
      );
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setClientErrors({});
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      let errorTitle = "Error al Cambiar Contraseña";
      let errorMessage: ReactNode =
        "Ocurrió un error al procesar tu solicitud.";

      if (axiosError.response) {
        const status = axiosError.response.status;
        const responseData = axiosError.response.data;

        if (
          status === 400 &&
          typeof responseData === "object" &&
          responseData !== null
        ) {
          if ("SameAsOldPassword" in responseData) {
            errorMessage =
              "La nueva contraseña no puede ser igual a la actual.";
          } else if ("PasswordMismatch" in responseData) {
            errorMessage = "La contraseña actual es incorrecta.";
          } else {
            const errorMessages = Object.values(responseData).flat();
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ));
            }
          }
        } else if (status === 401) {
          errorTitle = "Error de Autenticación";
          errorMessage = "No autorizado. Por favor, inicia sesión de nuevo.";

          return showAppFeedbackModal(errorTitle, errorMessage, "danger", () =>
            navigate("/login")
          );
        } else if (axiosError.message && !responseData) {
          errorTitle = "Error de Red";
          errorMessage =
            "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
        } else {
          errorMessage =
            responseData?.detail ||
            responseData?.title ||
            "Ocurrió un error al procesar tu solicitud.";
        }
      } else if (axiosError.request) {
        errorTitle = "Error de Red";
        errorMessage =
          "No se recibió respuesta del servidor. Revisa tu conexión e intenta de nuevo.";
      }

      showAppFeedbackModal(errorTitle, errorMessage, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backLinkUrl = isAdminContext ? "/admin/settings" : "/user-profile";
  const backLinkText = isAdminContext ? "Volver a Ajustes" : "Volver al Perfil";

  if (authLoading || isLoadingTenant) {
    return <div className={styles.loadingMessage}>Cargando...</div>;
  }
  if (errorTenant && !tenantInfo && !isAdminContext) {
    return <div className={styles.errorMessage}>{errorTenant}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {!isAdminContext && tenantInfo && <TenantHeader />}
      <main className={styles.mainContent}>
        <Link to={backLinkUrl} className={styles.backLink}>
          <LuChevronLeft /> {backLinkText}
        </Link>

        <form
          onSubmit={handleSubmit}
          className={styles.passwordFormCard}
          noValidate
        >
          <h1 className={styles.formTitle}>Cambiar Contraseña</h1>

          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">Contraseña Actual</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={styles.inputField}
                disabled={isSubmitting}
                aria-invalid={!!clientErrors.currentPassword}
                aria-describedby={
                  clientErrors.currentPassword
                    ? "currentPassword-error"
                    : undefined
                }
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={styles.passwordToggleBtn}
                aria-label="Mostrar/ocultar contraseña actual"
                disabled={isSubmitting}
              >
                {showCurrentPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {clientErrors.currentPassword &&
              typeof clientErrors.currentPassword === "string" && (
                <p
                  id="currentPassword-error"
                  className={styles.errorMessageTextItem}
                >
                  {clientErrors.currentPassword}
                </p>
              )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={styles.inputField}
                disabled={isSubmitting}
                aria-invalid={!!clientErrors.newPassword}
                aria-describedby={
                  clientErrors.newPassword
                    ? "newPassword-error-container"
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={styles.passwordToggleBtn}
                aria-label="Mostrar/ocultar nueva contraseña"
                disabled={isSubmitting}
              >
                {showNewPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {clientErrors.newPassword && (
              <div
                id="newPassword-error-container"
                className={styles.errorMessagesList}
              >
                {Array.isArray(clientErrors.newPassword) ? (
                  clientErrors.newPassword.map((err, index) => (
                    <p key={index} className={styles.errorMessageTextItem}>
                      {err}
                    </p>
                  ))
                ) : (
                  <p className={styles.errorMessageTextItem}>
                    {clientErrors.newPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmNewPassword">
              Confirmar Nueva Contraseña
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showConfirmNewPassword ? "text" : "password"}
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={styles.inputField}
                disabled={isSubmitting}
                aria-invalid={!!clientErrors.confirmNewPassword}
                aria-describedby={
                  clientErrors.confirmNewPassword
                    ? "confirmNewPassword-error"
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmNewPassword(!showConfirmNewPassword)
                }
                className={styles.passwordToggleBtn}
                aria-label="Mostrar/ocultar confirmación de nueva contraseña"
                disabled={isSubmitting}
              >
                {showConfirmNewPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {clientErrors.confirmNewPassword &&
              typeof clientErrors.confirmNewPassword === "string" && (
                <p
                  id="confirmNewPassword-error"
                  className={styles.errorMessageTextItem}
                >
                  {clientErrors.confirmNewPassword}
                </p>
              )}
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={`${styles.button} ${styles.saveButton}`}
              disabled={isSubmitting}
            >
              <LuSave /> {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
            <Link
              to={backLinkUrl}
              className={`${styles.button} ${styles.cancelButtonLink}`}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>

      {feedbackModalData && (
        <ConfirmationModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            if (feedbackModalData.onClose) feedbackModalData.onClose();
          }}
          onConfirm={() => {
            setIsFeedbackModalOpen(false);
            if (feedbackModalData.onClose) feedbackModalData.onClose();
          }}
          title={feedbackModalData.title}
          message={feedbackModalData.message}
          confirmText="OK"
          showCancelButton={false}
          icon={feedbackModalData.icon}
          iconType={feedbackModalData.iconType}
          confirmButtonVariant="primary"
        />
      )}
    </div>
  );
};

export default ChangePasswordPage;
