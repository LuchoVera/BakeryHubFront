import React, { useEffect, useState, ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import TenantHeader from "../../components/TenantHeader/TenantHeader";
import styles from "./UserProfilePage.module.css";
import {
  LuChevronLeft,
  LuPencil,
  LuLock,
  LuLogOut,
  LuSave,
  LuCircleX,
  LuCircleCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import { PiReceiptLight, PiUserCircle } from "react-icons/pi";
import {
  TenantPublicInfoDto,
  UpdateUserProfileDto,
  ApiErrorResponse,
} from "../../types";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import {
  fetchPublicTenantInfo,
  updateUserProfile as apiUpdateUserProfile,
} from "../../services/apiService";
import { AxiosError } from "axios";

interface UserProfilePageProps {
  subdomain: string;
}

type EditableField = "name" | "phone" | null;

interface FeedbackModalData {
  title: string;
  message: ReactNode;
  iconType: "success" | "danger" | "info" | "warning";
  icon: ReactNode;
  onClose?: () => void;
}

const capitalizeName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const UserProfilePage: React.FC<UserProfilePageProps> = ({ subdomain }) => {
  const {
    user,
    logout,
    isAuthenticated,
    isLoading: authLoading,
    login: updateUserAuthContext,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(
    null
  );
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [errorTenant, setErrorTenant] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
    useState<boolean>(false);
  const [feedbackModalData, setFeedbackModalData] =
    useState<FeedbackModalData | null>(null);
  useEffect(() => {
    if (editingField === "name" && user) {
      setTempValue(user.name);
    } else if (editingField === "phone" && user) {
      const currentPhone = (user as any).phoneNumber;
      setTempValue(
        currentPhone && currentPhone !== "No disponible" ? currentPhone : ""
      );
    }
  }, [editingField, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${location.pathname}`);
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  useEffect(() => {
    const fetchTenantData = async () => {
      setIsLoadingPage(true);
      try {
        const data = await fetchPublicTenantInfo(subdomain);
        setTenantInfo(data);
        setErrorTenant(null);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setErrorTenant(
          axiosError.response?.data?.detail ||
            `No se pudo cargar la información de la tienda "${subdomain}".`
        );
        setTenantInfo(null);
      } finally {
        setIsLoadingPage(false);
      }
    };
    if (isAuthenticated) {
      fetchTenantData();
    } else if (!authLoading) {
      setIsLoadingPage(false);
    }
  }, [subdomain, isAuthenticated, authLoading]);

  const handleLogout = async () => {
    await logout();
  };

  const handleEditClick = (field: EditableField) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue("");
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

  const handleSaveEdit = async () => {
    if (!user || editingField === null) return;

    let fieldDisplay = "";
    let payloadValue = tempValue.trim();
    let validationErrorMsg: string | null = null;

    if (editingField === "name") {
      fieldDisplay = "Nombre";
      if (payloadValue === "") {
        validationErrorMsg = "El nombre no puede estar vacío.";
      } else if (payloadValue.length < 2 || payloadValue.length > 150) {
        validationErrorMsg = "El nombre debe tener entre 2 y 150 caracteres.";
      }
    } else if (editingField === "phone") {
      fieldDisplay = "Teléfono";
      if (payloadValue !== "" && !/^\d{8}$/.test(payloadValue)) {
        validationErrorMsg =
          "El número de teléfono debe contener exactamente 8 dígitos.";
      }
      if (payloadValue === "") {
        validationErrorMsg = "El teléfono no puede estar vacío.";
      }
    }

    if (validationErrorMsg) {
      showAppFeedbackModal("Error de Validación", validationErrorMsg, "danger");
      return;
    }

    setIsSavingProfile(true);

    const currentPhoneNumberInContext =
      (user as any).phoneNumber && (user as any).phoneNumber !== "No disponible"
        ? (user as any).phoneNumber
        : "";

    const profileDataForBackend: UpdateUserProfileDto = {
      name: editingField === "name" ? payloadValue : user.name,
      phoneNumber:
        editingField === "phone"
          ? payloadValue || null
          : currentPhoneNumberInContext || null,
    };

    try {
      const updatedUser = await apiUpdateUserProfile(profileDataForBackend);
      updateUserAuthContext(updatedUser);

      showAppFeedbackModal(
        "Actualización Exitosa",
        <>
          El campo <strong>{fieldDisplay}</strong> ha sido actualizado
          correctamente.
        </>,
        "success"
      );
      setEditingField(null);
      setTempValue("");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      let errorMessage: ReactNode = "Ocurrió un error al actualizar tu perfil.";
      if (axiosError.response?.data?.errors) {
        errorMessage = Object.values(axiosError.response.data.errors)
          .flat()
          .map((e, i) => <div key={i}>{e}</div>);
      } else if (axiosError.response?.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (axiosError.message) {
        errorMessage =
          "No se pudo conectar con el servidor. Intenta de nuevo más tarde.";
      }
      showAppFeedbackModal("Error de Actualización", errorMessage, "danger");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading || isLoadingPage) {
    return <div className={styles.loadingMessage}>Cargando perfil...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.loadingMessage}>Redirigiendo al login...</div>
    );
  }

  if (errorTenant && !tenantInfo) {
    return <div className={styles.errorMessage}>{errorTenant}</div>;
  }

  const currentPhoneNumber = (user as any).phoneNumber || "No disponible";
  const displayName = user ? capitalizeName(user.name) : "";
  const nameInContactSection = user ? capitalizeName(user.name) : "";

  return (
    <div className={styles.pageContainer}>
      {tenantInfo && <TenantHeader tenantName={tenantInfo.name} />}
      <main className={styles.mainContent}>
        <Link to="/" className={styles.backLink}>
          <LuChevronLeft /> Volver a la Tienda
        </Link>

        <div className={styles.profileCard}>
          <div className={styles.profileIconContainer}>
            <PiUserCircle size={80} className={styles.profileIcon} />
          </div>
          <h1 className={styles.userNameDisplay}>{displayName}</h1>

          <section className={styles.infoSection}>
            <h2 className={styles.sectionTitleCentered}>
              Información de Contacto
            </h2>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre:</span>
              {editingField === "name" ? (
                <div className={styles.editInputContainer}>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className={styles.inlineInput}
                    disabled={isSavingProfile}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className={`${styles.editActionButton} ${styles.saveButton}`}
                    title="Guardar nombre"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "..." : <LuSave />}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`${styles.editActionButton} ${styles.cancelButton}`}
                    title="Cancelar edición"
                    disabled={isSavingProfile}
                  >
                    <LuCircleX />
                  </button>
                </div>
              ) : (
                <>
                  <span className={styles.infoValue}>
                    {nameInContactSection}
                  </span>
                  <button
                    onClick={() => handleEditClick("name")}
                    className={styles.editButton}
                    aria-label="Editar nombre"
                    title="Editar nombre"
                  >
                    <LuPencil />
                  </button>
                </>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={`${styles.infoValue} ${styles.infoValueFull}`}>
                {user.email}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teléfono:</span>
              {editingField === "phone" ? (
                <div className={styles.editInputContainer}>
                  <input
                    type="tel"
                    value={tempValue}
                    onChange={(e) =>
                      setTempValue(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className={styles.inlineInput}
                    placeholder="8 dígitos requeridos"
                    maxLength={8}
                    disabled={isSavingProfile}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className={`${styles.editActionButton} ${styles.saveButton}`}
                    title="Guardar teléfono"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "..." : <LuSave />}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`${styles.editActionButton} ${styles.cancelButton}`}
                    title="Cancelar edición"
                    disabled={isSavingProfile}
                  >
                    <LuCircleX />
                  </button>
                </div>
              ) : (
                <>
                  <span className={styles.infoValue}>{currentPhoneNumber}</span>
                  <button
                    onClick={() => handleEditClick("phone")}
                    className={styles.editButton}
                    aria-label="Editar teléfono"
                    title="Editar teléfono"
                  >
                    <LuPencil />
                  </button>
                </>
              )}
            </div>
          </section>

          <section
            className={`${styles.infoSection} ${styles.securitySectionNoTitle}`}
          >
            <div
              className={`${styles.securityAction} ${styles.actionItemCentered}`}
            >
              <LuLock className={styles.actionIcon} />
              <Link to="/change-password" className={styles.actionLink}>
                Cambiar Contraseña
              </Link>
            </div>
          </section>

          <div className={styles.actionButtonsRow}>
            <button
              className={`${styles.button} ${styles.buttonMyOrders}`}
              onClick={() => navigate("/my-orders")}
            >
              <PiReceiptLight className={styles.buttonIcon} /> Mis Pedidos
            </button>
            <button
              className={`${styles.button} ${styles.buttonLogoutError}`}
              onClick={handleLogout}
            >
              <LuLogOut className={styles.buttonIcon} /> Cerrar Sesión
            </button>
          </div>
        </div>
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

export default UserProfilePage;
