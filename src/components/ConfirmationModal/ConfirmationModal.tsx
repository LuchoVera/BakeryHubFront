import React, { ReactNode } from "react";
import styles from "./ConfirmationModal.module.css";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  warningMessage?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  confirmButtonVariant?: "primary" | "danger";
  icon?: ReactNode;
  iconType?: "info" | "warning" | "danger" | "success";
  showCancelButton?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningMessage,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isConfirming = false,
  confirmButtonVariant = "primary",
  icon,
  iconType,
  showCancelButton = true,
}) => {
  if (!isOpen) {
    return null;
  }

  let iconSpanClass = "";
  if (icon && iconType) {
    switch (iconType) {
      case "warning":
        iconSpanClass = styles.iconWarning;
        break;
      case "danger":
        iconSpanClass = styles.iconDanger;
        break;
      case "success":
        iconSpanClass = styles.iconSuccess;
        break;
      case "info":
        iconSpanClass = styles.iconInfo;
        break;
    }
  }

  const singleButton = !showCancelButton;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {icon && <span className={iconSpanClass}>{icon}</span>}
          {title}
        </h3>
        <div className={styles.modalMessage}>{message}</div>
        {warningMessage && (
          <div className={styles.warningText}>{warningMessage}</div>
        )}

        <div
          className={`${styles.modalActions} ${
            singleButton ? styles.singleButtonAction : ""
          }`}
        >
          <button
            onClick={onConfirm}
            className={`${styles.modalButtonConfirm} ${
              confirmButtonVariant === "danger" ? styles.danger : ""
            }`}
            disabled={isConfirming}
          >
            {isConfirming ? (
              "Procesando..."
            ) : (
              <>
                <LuCircleCheck /> {confirmText}
              </>
            )}
          </button>

          {showCancelButton && (
            <button
              onClick={onClose}
              className={styles.modalButtonCancel}
              disabled={isConfirming}
            >
              <LuCircleX /> {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
