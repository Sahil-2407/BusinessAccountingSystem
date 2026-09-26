import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        {
            path: "/dashboard",
            icon: "▣",
            label: "Dashboard",
        },
        {
            path: "/customers",
            icon: "👥",
            label: "Customers",
        },
        {
            path: "/suppliers",
            icon: "🏢",
            label: "Suppliers",
        },
        {
            path: "/inventory",
            icon: "📦",
            label: "Inventory",
        },
        {
            path: "/sales",
            icon: "💰",
            label: "Sales",
        },
        {
            path: "/purchases",
            icon: "🛒",
            label: "Purchases",
        },
        {
            path: "/expenses",
            icon: "💳",
            label: "Expenses",
        },
        {
            path: "/accounting",
            icon: "📒",
            label: "Accounting",
        },
        {
            path: "/reports",
            icon: "📊",
            label: "Reports",
        },
        {
            path: "/business-settings",
            icon: "⚙️",
            label: "Business Settings",
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/");
    };

    return (
        <aside style={styles.sidebar}>

            {/* LOGO / BRAND */}
            <div style={styles.logo}>
                <div style={styles.logoIcon}>
                    💼
                </div>

                <div>
                    <div style={styles.logoTitle}>
                        Business
                    </div>

                    <div style={styles.logoSubtitle}>
                        Accounting
                    </div>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav style={styles.nav}>

                <div style={styles.menuLabel}>
                    MAIN MENU
                </div>

                {menuItems.map((item) => {
                    const active =
                        location.pathname === item.path ||
                        (
                            item.path !== "/dashboard" &&
                            location.pathname.startsWith(
                                item.path + "/"
                            )
                        );

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...styles.link,
                                ...(active
                                    ? styles.activeLink
                                    : {}),
                            }}
                        >
                            <span
                                style={{
                                    ...styles.icon,
                                    ...(active
                                        ? styles.activeIcon
                                        : {}),
                                }}
                            >
                                {item.icon}
                            </span>

                            <span>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

            </nav>

            {/* LOGOUT */}
            <div style={styles.bottomSection}>

                <button
                    type="button"
                    onClick={handleLogout}
                    style={styles.logoutButton}
                >
                    <span style={styles.icon}>
                        🚪
                    </span>

                    <span>
                        Logout
                    </span>
                </button>

            </div>

        </aside>
    );
}

const styles = {
    sidebar: {
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "240px",
        background: "#111827",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        zIndex: 1000,
    },

    logo: {
        minHeight: "76px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderBottom: "1px solid #374151",
        boxSizing: "border-box",
    },

    logoIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
    },

    logoTitle: {
        fontSize: "15px",
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1.2,
    },

    logoSubtitle: {
        fontSize: "12px",
        color: "#9ca3af",
        marginTop: "2px",
    },

    nav: {
        flex: 1,
        padding: "18px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        overflowY: "auto",
        boxSizing: "border-box",
    },

    menuLabel: {
        padding: "4px 12px 10px",
        color: "#6b7280",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
    },

    link: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "11px 13px",
        borderRadius: "8px",
        color: "#d1d5db",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 500,
        boxSizing: "border-box",
        transition: "background 0.15s ease",
    },

    activeLink: {
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: 600,
    },

    icon: {
        width: "22px",
        minWidth: "22px",
        textAlign: "center",
        fontSize: "16px",
    },

    activeIcon: {
        color: "#ffffff",
    },

    bottomSection: {
        padding: "14px 12px",
        borderTop: "1px solid #374151",
    },

    logoutButton: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 13px",
        border: "none",
        borderRadius: "8px",
        background: "#1f2937",
        color: "#fca5a5",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
    },
};

export default Sidebar;