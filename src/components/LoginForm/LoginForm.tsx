import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';

import { LoginDto, AuthResponseDto, ApiErrorResponse, AuthUser } from '../../types';
import { useAuth } from '../../AuthContext';
import styles from './LoginForm.module.css'; 
import { useLocation, useNavigate } from 'react-router-dom';

const apiUrl = '/api'; 

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<LoginDto>({ email: '', password: '', rememberMe: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post<AuthResponseDto>(`${apiUrl}/accounts/login`, formData);
            const apiResponseData = response.data;
            console.log("REACT: Login successful:", apiResponseData);

            const userContextData: AuthUser = {
                userId: apiResponseData.userId,
                email: apiResponseData.email,
                name: apiResponseData.name,
                roles: apiResponseData.roles,
                administeredTenantId: apiResponseData.administeredTenantId,
                administeredTenantSubdomain: apiResponseData.administeredTenantSubdomain 
           };            login(userContextData);

            const intendedDestination = (location.state as { from?: string })?.from || null;

            if (apiResponseData.roles.includes('Admin')) {
                 const redirectTo = intendedDestination?.startsWith('/admin') ? intendedDestination : '/admin';
                 console.log(`REACT: Navigating Admin to ${redirectTo}`);
                 navigate(redirectTo, { replace: true });
            } else if (apiResponseData.roles.includes('Customer')) {
                const redirectTo = intendedDestination || '/';
                console.log(`REACT: Navigating Customer to ${redirectTo}`);
                navigate(redirectTo, { replace: true });
            } else {
                 console.warn("REACT: Logged in user is not Admin or Customer, navigating to /");
                 navigate('/', { replace: true });
            }

        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            console.error("REACT: Login failed:", axiosError.response?.data || axiosError.message);
             setError(axiosError.response?.data?.detail || axiosError.response?.data?.message || "Login failed. Check credentials or account status.");
            setLoading(false); 
        }
    };

    return (
         <form onSubmit={handleSubmit} className={styles.form}>
             <h2>Login</h2>
             <div className={styles.formGroup}>
                 <label htmlFor="email">Email</label>
                 <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
             </div>
              <div className={styles.formGroup}>
                 <label htmlFor="password">Password</label>
                 <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
             </div>
              <div className={styles.formGroup} style={{flexDirection: 'row', alignItems: 'center'}}>
                 <input type="checkbox" id="rememberMe" name="rememberMe" checked={formData.rememberMe} onChange={handleInputChange} />
                  <label htmlFor="rememberMe" style={{fontWeight: 'normal', marginLeft:'5px'}}>Remember Me</label>
             </div>

             {error && <p className={styles.error}>{error}</p>}

             <button type="submit" className={styles.submitButton} disabled={loading}>
                 {loading ? 'Logging in...' : 'Login'}
             </button>
         </form>
    );
};

export default LoginForm;