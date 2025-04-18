import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { TenantPublicInfoDto, ApiErrorResponse } from '../types';

interface TenantViewPageProps {
    subdomain: string;
}

const TenantViewPage: React.FC<TenantViewPageProps> = ({ subdomain }) => {
    const [tenantInfo, setTenantInfo] = useState<TenantPublicInfoDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenantInfo = async () => {
            setIsLoading(true);
            setError(null);
            setTenantInfo(null);

            try {
                const response = await axios.get<TenantPublicInfoDto>(`/api/public/tenants/${subdomain}`);
                setTenantInfo(response.data);
            } catch (err) {
                const axiosError = err as AxiosError<ApiErrorResponse>;
                if (axiosError.response?.status === 404) {
                    setError(`The bakery "${subdomain}" was not found.`);
                } else {
                    setError(axiosError.response?.data?.detail || axiosError.message || "An error occurred while loading the bakery information.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTenantInfo();
    }, [subdomain]);

    if (isLoading) {
        return <div>Loading Bakery Information...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', border: '2px solid red', textAlign: 'center' }}>
                <h1>Error</h1>
                <p>{error}</p>
                <Link to="/">Go back to main page</Link>
            </div>
        );
    }

    if (tenantInfo) {
        return (
            <div style={{ padding: '20px', border: '2px solid green' }}>
                <h1>Welcome to {tenantInfo.name}!</h1>
                <p>(Viewing subdomain: {tenantInfo.subdomain})</p>
                <p>Products will be listed here soon...</p>
            </div>
        );
    }

    return <div>Something went wrong.</div>;
};

export default TenantViewPage;
