import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./ResetPasswordPage.module.css";
import { resetPassword } from "../../services/apiService";
import { useNotification } from "../../hooks/useNotification";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "../../types";

const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const email = new URLSearchParams(location.search).get("email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await resetPassword({
        email,
        token,
        newPassword,
        confirmNewPassword,
      });
      showNotification(
        "Tu contraseña ha sido restablecida con éxito.",
        "success"
      );
      navigate("/login");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.errors?.["InvalidToken"]?.[0] ||
          axiosError.response?.data?.detail ||
          "El código es inválido o ha expirado."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Link to="/login" className={styles.backLink}>
        &larr; Volver a Iniciar Sesión
      </Link>
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <h2>Restablecer Contraseña</h2>
        <p>
          Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>{" "}
          y tu nueva contraseña.
        </p>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formGroup}>
          <label htmlFor="token">Código de Verificación</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            required
            maxLength={6}
            disabled={isLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="newPassword">Nueva Contraseña</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
