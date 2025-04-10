import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { AdminRegisterDto, ApiErrorResponse } from '../../types';
import styles from './AdminRegistrationForm.module.css';


const apiUrl = '/api';

const AdminRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<AdminRegisterDto>({
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    businessName: '',
    subdomain: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'subdomain'
        ? value.toLowerCase().replace(/[^a-z0-9-]/g, '')
        : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: [] }));
    }
     const backendFieldName = name.charAt(0).toUpperCase() + name.slice(1);
     if (validationErrors[backendFieldName]) {
          setValidationErrors(prev => ({ ...prev, [backendFieldName]: [] }));
     }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const registrationData: AdminRegisterDto = {
        adminName: formData.adminName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        subdomain: formData.subdomain
    };


    try {
      console.log("REACT: Sending registration data:", registrationData);
      const response = await axios.post(`${apiUrl}/accounts/register-admin`, registrationData);

      console.log("REACT: Registration successful:", response.data);
      setSuccessMessage(response.data?.message || "Registration successful! Check your email if confirmation is required.");
      setFormData({
        adminName: '', email: '', password: '', confirmPassword: '',
        phoneNumber: '', businessName: '', subdomain: ''
      });

      const registeredSubdomain = registrationData.subdomain;
      if (registeredSubdomain) {
          setTimeout(() => {
              const tenantUrl = `http://${registeredSubdomain}.localhost:5173/login`;   
              const rootTenantUrl = `http://${registeredSubdomain}.localhost:5173/`;
              console.log(`REACT: Redirecting to ${rootTenantUrl}`);
              window.location.href = rootTenantUrl;
          }, 1500);
      }

    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error("REACT: Registration failed:", axiosError.response?.data || axiosError.message);

      if (axiosError.response?.status === 400 && axiosError.response.data?.errors) {
        setValidationErrors(axiosError.response.data.errors);
        setError("Please correct the validation errors below.");
      } else {
        setError(axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.message || "An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

   const getFieldError = (fieldName: string): string | undefined => {
       const pascalCaseName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
       return validationErrors[fieldName]?.[0] || validationErrors[pascalCaseName]?.[0];
   };


  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Register Your Business</h2>

      <div className={styles.formGroup}>
        <label htmlFor="adminName">Your Name</label>
        <input type="text" id="adminName" name="adminName" value={formData.adminName} onChange={handleInputChange} required />
         {getFieldError('adminName') && <span className={styles.validationError}>{getFieldError('adminName')}</span>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Your Email</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
        {getFieldError('email') && <span className={styles.validationError}>{getFieldError('email')}</span>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={8} />
         {getFieldError('password') && <span className={styles.validationError}>{getFieldError('password')}</span>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
        {getFieldError('confirmPassword') && <span className={styles.validationError}>{getFieldError('confirmPassword')}</span>}
      </div>
       <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">Phone Number (8 digits)</label>
        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required pattern="\d{8}" title="Must be exactly 8 digits" />
         {getFieldError('phoneNumber') && <span className={styles.validationError}>{getFieldError('phoneNumber')}</span>}
      </div>


      <div className={styles.formGroup}>
        <label htmlFor="businessName">Business Name</label>
        <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} required />
        {getFieldError('businessName') && <span className={styles.validationError}>{getFieldError('businessName')}</span>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subdomain">Choose Your Site Address (.localhost:5173)</label>
        <input type="text" id="subdomain" name="subdomain" placeholder="e.g., mybakery" value={formData.subdomain} onChange={handleInputChange} required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title="Lowercase letters, numbers, and hyphens only."/>
        <span>Preview: http://{formData.subdomain || 'your-choice'}.localhost:5173</span>
        {getFieldError('subdomain') && <span className={styles.validationError}>{getFieldError('subdomain')}</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Registering...' : 'Register Business'}
      </button>
    </form>
  );
};

export default AdminRegistrationForm;