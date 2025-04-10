import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const AdminLayout: React.FC = () => {
    const { logout } = useAuth();
    return (
        <div style={{ display: 'flex' }}>
            <nav style={{ width: '200px', borderRight: '1px solid #ccc', padding: '10px' }}>
                <h2>Admin Menu</h2>
                <ul>
                    <li><Link to="/admin">Dashboard</Link></li>
                    <li><Link to="/admin/categories">Categories</Link></li>
                    <li><Link to="/admin/products">Products</Link></li>
                </ul>
                <button onClick={logout} style={{marginTop: '20px'}}>Logout</button>
            </nav>
            <main style={{ flexGrow: 1, padding: '20px' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;