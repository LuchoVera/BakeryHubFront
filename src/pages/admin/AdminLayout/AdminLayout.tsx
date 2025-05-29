import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import styles from "./AdminLayout.module.css";
import {
  LuPanelLeftClose,
  LuPanelRightClose,
  LuLayoutDashboard,
  LuTags,
  LuBoxes,
  LuLogOut,
  LuExternalLink,
  LuSettings,
  LuPackage,
  LuTag,
} from "react-icons/lu";

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;
  };

  const tenantSubdomain = user?.administeredTenantSubdomain;
  const tenantUrl = tenantSubdomain
    ? `${window.location.protocol}//${tenantSubdomain}.localhost:5173/`
    : null;

  return (
    <div
      className={`${styles.layoutContainer} ${
        !isSidebarOpen ? styles.layoutContainerCollapsed : ""
      }`}
    >
      <nav
        className={`${styles.sidebar} ${
          !isSidebarOpen ? styles.sidebarCollapsed : ""
        }`}
      >
        <div className={styles.sidebarHeaderContainer}>
          {isSidebarOpen && (
            <h2 className={styles.sidebarHeader}>Menú Admin</h2>
          )}
          <button
            onClick={toggleSidebar}
            className={styles.toggleButton}
            title={isSidebarOpen ? "Colapsar Menú" : "Expandir Menú"}
          >
            {isSidebarOpen ? <LuPanelLeftClose /> : <LuPanelRightClose />}
          </button>
        </div>

        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <NavLink to="/admin" end className={getNavLinkClass} title="Panel">
              <LuLayoutDashboard className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Dashboard</span>
              )}
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/orders"
              className={getNavLinkClass}
              title="Pedidos"
            >
              <LuPackage className={styles.navIcon} />
              {isSidebarOpen && <span className={styles.navText}>Pedidos</span>}
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/categories"
              className={getNavLinkClass}
              title="Categorías"
            >
              <LuTag className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Categorías</span>
              )}
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/admin/tags" className={getNavLinkClass} title="Tags">
              <LuTags className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Etiquetas</span>
              )}
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/products"
              className={getNavLinkClass}
              title="Productos"
            >
              <LuBoxes className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Productos</span>
              )}
            </NavLink>
          </li>
        </ul>

        {isSidebarOpen && <hr className={styles.separator} />}

        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/settings"
              className={getNavLinkClass}
              title="Ajustes de Tienda"
            >
              <LuSettings className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Ajustes de Tienda</span>
              )}
            </NavLink>
          </li>

          {tenantUrl && (
            <li className={styles.navItem}>
              <a
                href={tenantUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navLink}
                title="Ir a mi Negocio (Vista Cliente)"
              >
                <LuExternalLink className={styles.navIcon} />
                {isSidebarOpen && (
                  <span className={styles.navText}>Ir a mi Negocio</span>
                )}
              </a>
            </li>
          )}

          <li className={`${styles.navItem} ${styles.logoutNavItem}`}>
            <button
              onClick={logout}
              className={styles.logoutButton}
              title="Cerrar Sesión"
            >
              <LuLogOut className={styles.navIcon} />
              {isSidebarOpen && (
                <span className={styles.navText}>Cerrar Sesión</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
