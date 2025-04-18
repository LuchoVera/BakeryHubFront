import React, { useState, ChangeEvent, FormEvent, FocusEvent } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { CustomerRegisterDto, ApiErrorResponse } from "../../types";
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

interface TenantCustomerSignUpFormProps {
  subdomain: string;
  onSuccess?: (userId: string) => void;
}

const TenantCustomerSignUpForm: React.FC<TenantCustomerSignUpFormProps> = ({
  subdomain,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CustomerRegisterDto>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLoginOption, setShowLoginOption] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        return (
          validateRequired(value) ||
          validateMinLength(value, 2) ||
          validateMaxLength(value, 150)
        );
      case "email":
        return validateRequired(value) || validateEmail(value);
      case "password":
        return (
          validateRequired(value) ||
          validateMinLength(value, 8) ||
          validateMaxLength(value, 100)
        );
      case "confirmPassword":
        return (
          validateRequired(value) ||
          validateComparison(
            value,
            formData.password,
            "Passwords do not match."
          )
        );
      case "phoneNumber":
        return (
          validateRequired(value) ||
          validateExactLength(value, 8) ||
          validatePattern(value, /^\d{8}$/, "Must contain exactly 8 digits.")
        );
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof CustomerRegisterDto>).forEach(
      (key) => {
        if (key === "confirmPassword") return;
        const error = validateField(key, formData[key]);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    );
    const confirmPasswordError = validateField(
      "confirmPassword",
      formData.confirmPassword
    );
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
      isValid = false;
    }
    setClientErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (name === "email") {
      setShowLoginOption(false);
      setServerError(null);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setClientErrors((prev) => ({ ...prev, [name]: error }));
    if (name === "password") {
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
    setShowLoginOption(false);

    if (!validateForm()) {
      console.log("Frontend validation failed for customer sign up.");
      return;
    }

    setLoading(true);
    const registrationData: CustomerRegisterDto = { ...formData };

    try {
      const apiUrl = `/api/public/tenants/${subdomain}/register-customer`;
      console.log(
        `REACT: Sending customer registration to: ${apiUrl}`,
        registrationData
      );
      const response = await axios.post<{ message: string; userId: string }>(
        apiUrl,
        registrationData
      );

      console.log("REACT: Customer registration successful:", response.data);
      setSuccessMessage(
        response.data?.message || "Registration successful! You can now log in."
      );
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
      });
      setClientErrors({});
      setValidationErrors({});
      if (onSuccess) {
        onSuccess(response.data.userId);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "REACT: Customer registration failed:",
        axiosError.response?.data || axiosError.message
      );

      const errors = axiosError.response?.data?.errors;
      const statusCode = axiosError.response?.status;
      const errorDetail = axiosError.response?.data?.detail;
      const errorTitle = axiosError.response?.data?.title;
      const errorMessage = axiosError.response?.data?.message;

      let isEmailTakenError = false;
      if (statusCode === 400 && errors) {
        const emailErrorMessages =
          errors["Email"]?.join(" ") || errors[""]?.join(" ") || "";
        if (
          errors["DuplicateEmail"] ||
          emailErrorMessages.includes("is already taken")
        ) {
          isEmailTakenError = true;
        }
      }

      if (isEmailTakenError) {
        setServerError("This email address is already registered.");
        setShowLoginOption(true);
        setValidationErrors({});
      } else if (statusCode === 404) {
        setServerError(`Bakery '${subdomain}' not found. Cannot register.`);
      } else if (statusCode === 400 && errors) {
        setValidationErrors(errors);
        setServerError("Please correct the errors below.");
      } else {
        setServerError(
          errorDetail ||
            errorMessage ||
            errorTitle ||
            "An unknown error occurred during registration."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const getFieldError = (
    fieldName: keyof CustomerRegisterDto
  ): string | undefined => {
    if (clientErrors[fieldName]) {
      return clientErrors[fieldName];
    }
    const pascalCaseName =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return (
      validationErrors[fieldName]?.[0] || validationErrors[pascalCaseName]?.[0]
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h2>Sign Up for {subdomain}</h2>
      <div className={styles.formGroup}>
        <label htmlFor="name">Your Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          maxLength={150}
          aria-invalid={!!getFieldError("name")}
        />
        {getFieldError("name") && (
          <span className={styles.validationError}>
            {getFieldError("name")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("email") || showLoginOption}
        />
        {getFieldError("email") && (
          <span className={styles.validationError}>
            {getFieldError("email")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Password (min 8 chars)</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          minLength={8}
          maxLength={100}
          aria-invalid={!!getFieldError("password")}
        />
        {getFieldError("password") && (
          <span className={styles.validationError}>
            {getFieldError("password")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("confirmPassword")}
        />
        {getFieldError("confirmPassword") && (
          <span className={styles.validationError}>
            {getFieldError("confirmPassword")}
          </span>
        )}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">Phone Number (8 digits)</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          maxLength={8}
          pattern="\d{8}"
          title="Must be exactly 8 digits"
          aria-invalid={!!getFieldError("phoneNumber")}
        />
        {getFieldError("phoneNumber") && (
          <span className={styles.validationError}>
            {getFieldError("phoneNumber")}
          </span>
        )}
      </div>
      {serverError && !successMessage && (
        <div className={styles.error}>
          <span>{serverError}</span>
          {showLoginOption && (
            <button
              type="button"
              onClick={handleGoToLogin}
              className={styles.inlineButton}
            >
              Log In Instead
            </button>
          )}
        </div>
      )}
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {!showLoginOption && (
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      )}
    </form>
  );
};

export default TenantCustomerSignUpForm;
