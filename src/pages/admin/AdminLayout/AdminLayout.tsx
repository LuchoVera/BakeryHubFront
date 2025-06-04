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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const layoutContainerClass = `${styles.layoutContainer} ${
    !isSidebarOpen && !isMobileView ? styles.layoutContainerCollapsed : ""
  } ${isMobileView && isSidebarOpen ? styles.mobileSidebarActuallyOpen : ""}`;

  return (
    <div className={layoutContainerClass}>
      {isMobileView && (
        <div className={styles.mobileTopBar}>
          <button
            onClick={toggleSidebar}
            className={styles.mobileMenuButton}
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
          >
            {isSidebarOpen ? <LuX /> : <LuMenu />}
          </button>
        </div>
      )}

      {isMobileView && isSidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={toggleSidebar}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSidebar();
          }}
          aria-label="Cerrar menú"
        />
      )}

      <nav
        id="admin-sidebar"
        className={`${styles.sidebar} ${
          !isSidebarOpen && !isMobileView ? styles.sidebarCollapsed : ""
        } ${
          isMobileView
            ? isSidebarOpen
              ? styles.sidebarMobileOverlayOpen
              : styles.sidebarMobileHidden
            : ""
        }`}
        aria-hidden={isMobileView && !isSidebarOpen}
      >
        <div className={styles.sidebarHeaderContainer}>
          <h2 className={styles.sidebarHeader}>Menú Admin</h2>
          <button
            onClick={toggleSidebar}
            className={`${styles.toggleButton} ${styles.desktopToggleButton}`}
            title={isSidebarOpen ? "Colapsar Menú" : "Expandir Menú"}
          >
            {isSidebarOpen ? <LuPanelLeftClose /> : <LuPanelRightClose />}
          </button>
        </div>

        <>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <NavLink
                to="/admin"
                end
                className={getNavLinkClass}
                title="Panel"
              >
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
              <NavLink
                to="/admin/tags"
                className={getNavLinkClass}
                title="Tags"
              >
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
        </>
      </nav>
      <main
        className={`${styles.mainContent} ${
          isMobileView ? styles.mainContentMobile : ""
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
