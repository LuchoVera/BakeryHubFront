import React, { useState, useEffect } from "react";
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
  LuMenu,
  LuX,
} from "react-icons/lu";

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;
  };

  const tenantSubdomain = user?.administeredTenantSubdomain;
  const tenantUrl = tenantSubdomain
    ? `${window.location.protocol}//${tenantSubdomain}.localhost:5173/`
    : null;

  const layoutContainerClass = `${styles.layoutContainer} ${
    isSidebarCollapsed ? styles.layoutContainerCollapsed : ""
  }`;

  return (
    <div className={layoutContainerClass}>
      <div className={styles.mobileTopBar}>
        <button
          onClick={toggleMobileMenu}
          className={styles.mobileMenuButton}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMobileMenuOpen ? <LuX /> : <LuMenu />}
        </button>
        <h1 className={styles.mobileTopBarTitle}>Menú</h1>
      </div>

      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={toggleMobileMenu} />
      )}

      <nav
        id="admin-sidebar"
        className={`${styles.sidebar} ${
          isMobileMenuOpen ? styles.sidebarMobileOpen : ""
        }`}
      >
        <div className={styles.sidebarHeaderContainer}>
          <h2 className={styles.sidebarHeader}>Menú Admin</h2>
          <button
            onClick={toggleSidebarCollapse}
            className={`${styles.toggleButton} ${styles.desktopToggleButton}`}
            title={isSidebarCollapsed ? "Expandir Menú" : "Colapsar Menú"}
          >
            {isSidebarCollapsed ? <LuPanelRightClose /> : <LuPanelLeftClose />}
          </button>
        </div>

        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <NavLink to="/admin" end className={getNavLinkClass} title="Panel">
              <LuLayoutDashboard className={styles.navIcon} />
              <span className={styles.navText}>Dashboard</span>
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/orders"
              className={getNavLinkClass}
              title="Pedidos"
            >
              <LuPackage className={styles.navIcon} />
              <span className={styles.navText}>Pedidos</span>
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/categories"
              className={getNavLinkClass}
              title="Categorías"
            >
              <LuTag className={styles.navIcon} />
              <span className={styles.navText}>Categorías</span>
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/admin/tags" className={getNavLinkClass} title="Tags">
              <LuTags className={styles.navIcon} />
              <span className={styles.navText}>Etiquetas</span>
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/products"
              className={getNavLinkClass}
              title="Productos"
            >
              <LuBoxes className={styles.navIcon} />
              <span className={styles.navText}>Productos</span>
            </NavLink>
          </li>
        </ul>

        <hr className={styles.separator} />

        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <NavLink
              to="/admin/settings"
              className={getNavLinkClass}
              title="Ajustes de Tienda"
            >
              <LuSettings className={styles.navIcon} />
              <span className={styles.navText}>Ajustes de Tienda</span>
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
                <span className={styles.navText}>Ir a mi Negocio</span>
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
              <span className={styles.navText}>Cerrar Sesión</span>
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
