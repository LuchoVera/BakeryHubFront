import React, { useState, ChangeEvent, FormEvent, FocusEvent } from "react";
import axios, { AxiosError } from "axios";
import { AdminRegisterDto, ApiErrorResponse } from "../../types";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validatePattern,
  validateComparison,
  validateExactLength,
} from "../../utils/validationUtils";
import styles from "./AdminRegistrationForm.module.css";

const apiUrl = "/api";

const AdminRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<AdminRegisterDto>({
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    businessName: "",
    subdomain: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "adminName":
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
      case "businessName":
        return (
          validateRequired(value) ||
          validateMinLength(value, 3) ||
          validateMaxLength(value, 200)
        );
      case "subdomain":
        const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        const cleanedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        return (
          validateRequired(cleanedValue) ||
          validateMinLength(cleanedValue, 3) ||
          validateMaxLength(cleanedValue, 100) ||
          validatePattern(
            cleanedValue,
            subdomainRegex,
            "Lowercase letters, numbers, and hyphens only."
          )
        );
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof AdminRegisterDto>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    if (!errors.confirmPassword) {
      const confirmPasswordError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      if (confirmPasswordError) {
        errors.confirmPassword = confirmPasswordError;
        isValid = false;
      }
    }

    setClientErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "subdomain") {
      finalValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

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
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const valueToValidate =
      name === "subdomain"
        ? value.toLowerCase().replace(/[^a-z0-9-]/g, "")
        : value;

    const error = validateField(name, valueToValidate);
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

    if (!validateForm()) {
      console.log("Frontend validation failed.");
      return;
    }

    setLoading(true);

    const registrationData: AdminRegisterDto = { ...formData };

    try {
      console.log("REACT: Sending registration data:", registrationData);
      const response = await axios.post(
        `${apiUrl}/accounts/register-admin`,
        registrationData
      );
      console.log("REACT: Registration successful:", response.data);
      setSuccessMessage(response.data?.message || "Registration successful!");
      setFormData({
        adminName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        businessName: "",
        subdomain: "",
      });
      setClientErrors({});
      setValidationErrors({});

      const registeredSubdomain = registrationData.subdomain;
      if (registeredSubdomain) {
        setTimeout(() => {
          const rootTenantUrl = `http://${registeredSubdomain}.localhost:5173/`;
          console.log(`REACT: Redirecting to ${rootTenantUrl}`);
          window.location.href = rootTenantUrl;
        }, 1500);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(
        "REACT: Registration failed:",
        axiosError.response?.data || axiosError.message
      );

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        setValidationErrors(axiosError.response.data.errors);
        setServerError("Please correct the errors below.");
      } else {
        setServerError(
          axiosError.response?.data?.detail ||
            axiosError.response?.data?.title ||
            axiosError.response?.data?.message ||
            axiosError.message ||
            "An unknown error occurred during registration."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (
    fieldName: keyof AdminRegisterDto
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
      <h2>Register Your Business</h2>

      <div className={styles.formGroup}>
        <label htmlFor="adminName">Your Name</label>
        <input
          type="text"
          id="adminName"
          name="adminName"
          value={formData.adminName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("adminName")}
        />
        {getFieldError("adminName") && (
          <span className={styles.validationError}>
            {getFieldError("adminName")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email">Your Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("email")}
        />
        {getFieldError("email") && (
          <span className={styles.validationError}>
            {getFieldError("email")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
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

      <div className={styles.formGroup}>
        <label htmlFor="businessName">Business Name</label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          value={formData.businessName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          minLength={3}
          maxLength={200}
          aria-invalid={!!getFieldError("businessName")}
        />
        {getFieldError("businessName") && (
          <span className={styles.validationError}>
            {getFieldError("businessName")}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subdomain">
          Choose Your Site Address (.localhost:5173)
        </label>
        <input
          type="text"
          id="subdomain"
          name="subdomain"
          placeholder="e.g., mybakery"
          value={formData.subdomain}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          minLength={3}
          maxLength={100}
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          title="Lowercase letters, numbers, and hyphens only."
          aria-invalid={!!getFieldError("subdomain")}
        />
        <span>
          Preview: http://{formData.subdomain || "your-choice"}.localhost:5173
        </span>
        {getFieldError("subdomain") && (
          <span className={styles.validationError}>
            {getFieldError("subdomain")}
          </span>
        )}
      </div>

      {serverError && !successMessage && (
        <p className={styles.error}>{serverError}</p>
      )}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Registering..." : "Register Business"}
      </button>
    </form>
  );
};

export default AdminRegistrationForm;
