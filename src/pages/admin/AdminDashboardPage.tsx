import React from 'react';
import { useAuth } from '../../AuthContext';

const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();
    return (
        <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome, {user?.name}!</p>
            <p>This is the main admin area for tenant: {user?.administeredTenantSubdomain ?? user?.administeredTenantId ?? 'N/A'}</p>
        </div>
    );
};

export default AdminDashboardPage;