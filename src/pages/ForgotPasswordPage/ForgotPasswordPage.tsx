import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ForgotPasswordPage.module.css";
import { forgotPassword } from "../../services/apiService";
import { useNotification } from "../../hooks/useNotification";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword({ email });
      showNotification(
        "Recibirás un código de reseteo en tu email.",
        "success"
      );
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      showNotification(
        "Ocurrió un error al intentar enviar el código.",
        "error"
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
        <h2>Recuperar Contraseña</h2>
        <p>
          Ingresa tu correo electrónico y te enviaremos un código de 6 dígitos
          para restablecer tu contraseña.
        </p>
        <div className={styles.formGroup}>
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Enviando..." : "Enviar Código"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
