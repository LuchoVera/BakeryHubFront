import React, { useState, ChangeEvent, FormEvent, FocusEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { LoginDto, AuthResponseDto, ApiErrorResponse, AuthUser } from '../../types';
import { useAuth } from '../../AuthContext';
import styles from './LoginForm.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateRequired, validateEmail } from '../../utils/validationUtils';

const apiUrl = '/api';

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<LoginDto>({ email: '', password: '', rememberMe: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'email':
                return validateRequired(value) || validateEmail(value);
            case 'password':
                return validateRequired(value);
            default:
                return '';
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        let isValid = true;

        if (!formData.email || !formData.password) {
            errors.form = 'Both email and password are required.';
            isValid = false;
        }

        const emailError = validateField('email', formData.email);
        if (emailError) {
            errors.email = emailError;
            isValid = false;
        }

        const passwordError = validateField('password', formData.password);
        if (passwordError) {
            errors.password = passwordError;
            isValid = false;
        }

        setClientErrors(errors);
        return isValid;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (clientErrors[name]) {
            setClientErrors((prev) => ({ ...prev, [name]: '' }));
        }

        if (clientErrors.form) {
            setClientErrors((prev) => ({ ...prev, form: '' }));
        }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'email' || name === 'password') {
            const error = validateField(name, value);
            setClientErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post<AuthResponseDto>(`${apiUrl}/accounts/login`, formData);
            const apiResponseData = response.data;

            const userContextData: AuthUser = {
                userId: apiResponseData.userId,
                email: apiResponseData.email,
                name: apiResponseData.name,
                roles: apiResponseData.roles,
                administeredTenantId: apiResponseData.administeredTenantId,
                administeredTenantSubdomain: apiResponseData.administeredTenantSubdomain,
            };

            login(userContextData);
            setClientErrors({});

            const intendedDestination = (location.state as { from?: Location | string })?.from || null;
            let redirectTo = '/';

            if (typeof intendedDestination === 'string') {
                redirectTo = intendedDestination;
            } else if (intendedDestination?.pathname) {
                redirectTo = intendedDestination.pathname + (intendedDestination.search || '');
            }

            if (apiResponseData.roles.includes('Admin')) {
                redirectTo = redirectTo.startsWith('/admin') ? redirectTo : '/admin';
            } else if (apiResponseData.roles.includes('Customer')) {
                redirectTo = redirectTo || '/';
            } else {
                redirectTo = '/';
            }

            navigate(redirectTo, { replace: true });
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setServerError(
                axiosError.response?.data?.detail ||
                    axiosError.response?.data?.title ||
                    axiosError.response?.data?.message ||
                    'Login failed. Check credentials or account status.'
            );
            setLoading(false);
        }
    };

    const getFieldError = (fieldName: keyof LoginDto | 'form'): string | undefined => {
        return clientErrors[fieldName];
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <h2>Login</h2>
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
                    aria-invalid={!!getFieldError('email')}
                />
                {getFieldError('email') && <span className={styles.validationError}>{getFieldError('email')}</span>}
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
                    aria-invalid={!!getFieldError('password')}
                />
                {getFieldError('password') && <span className={styles.validationError}>{getFieldError('password')}</span>}
            </div>
            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                />
                <label htmlFor="rememberMe" style={{ fontWeight: 'normal', marginLeft: '5px', marginBottom: 0 }}>
                    Remember Me
                </label>
            </div>
            {(getFieldError('form') || serverError) && <p className={styles.error}>{getFieldError('form') || serverError}</p>}
            <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

export default LoginForm;
