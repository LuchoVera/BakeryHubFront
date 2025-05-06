import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationPopup.module.css";
import {
  LuX,
  LuInfo,
  LuCircleCheck,
  LuCircleAlert,
  LuUserPlus,
  LuLogIn,
} from "react-icons/lu";
import { useNotification } from "../../hooks/useNotification";

const NotificationPopup: React.FC = () => {
  const { notification, hideNotification } = useNotification();
  const navigate = useNavigate();

  if (!notification || !notification.message) {
    return null;
  }

  let IconComponent;
  let popupClass = styles.popup;

  switch (notification.type) {
    case "success":
      IconComponent = LuCircleCheck;
      popupClass += ` ${styles.success}`;
      break;
    case "error":
      IconComponent = LuCircleAlert;
      popupClass += ` ${styles.error}`;
      break;
    case "loginPrompt":
      IconComponent = LuUserPlus;
      popupClass += ` ${styles.loginPrompt}`;
      break;
    case "info":
    default:
      IconComponent = LuInfo;
      popupClass += ` ${styles.info}`;
      break;
  }

  const handleLoginClick = () => {
    hideNotification();
    navigate("/login");
  };

  const handleSignupClick = () => {
    hideNotification();
    navigate("/signup");
  };

  return (
    <div className={popupClass} role="alert" aria-live="assertive">
      <div className={styles.content}>
        <IconComponent className={styles.icon} />
        <span className={styles.message}>{notification.message}</span>
        {notification.type === "loginPrompt" && (
          <div className={styles.actions}>
            <button onClick={handleLoginClick} className={styles.actionButton}>
              <LuLogIn /> Iniciar Sesión
            </button>
            <button onClick={handleSignupClick} className={styles.actionButton}>
              <LuUserPlus /> Registrarse
            </button>
          </div>
        )}
      </div>
      <button
        onClick={hideNotification}
        className={styles.closeButton}
        aria-label="Cerrar notificación"
      >
        <LuX />
      </button>
    </div>
  );
};

export default NotificationPopup;
