import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            path: "/dashboard",
            icon: "⌂",
            label: "Dashboard",
        },
        {
            path: "/customers",
            icon: "👥",
            label: "Customers",
        },
        {
            path: "/suppliers",
            icon: "🚚",
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
            icon: "💸",
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

    const closeSidebar = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* MOBILE HEADER */}
            <header className="mobile-header">
                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div className="mobile-brand">
                    <div className="mobile-brand-icon">💼</div>

                    <div>
                        <div className="mobile-brand-title">
                            Business Accounting
                        </div>
                    </div>
                </div>
            </header>

            {/* MOBILE OVERLAY */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`app-sidebar ${isOpen ? "sidebar-open" : ""}`}
            >
                {/* LOGO / BRAND */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        💼
                    </div>

                    <div>
                        <div className="sidebar-logo-title">
                            Business
                        </div>

                        <div className="sidebar-logo-subtitle">
                            Accounting
                        </div>
                    </div>

                    {/* MOBILE CLOSE BUTTON */}
                    <button
                        type="button"
                        className="mobile-close-button"
                        onClick={closeSidebar}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                {/* NAVIGATION */}
                <nav className="sidebar-nav">
                    <div className="sidebar-menu-label">
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
                                onClick={closeSidebar}
                                className={`sidebar-link ${
                                    active ? "sidebar-link-active" : ""
                                }`}
                            >
                                <span className="sidebar-icon">
                                    {item.icon}
                                </span>

                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* LOGOUT */}
                <div className="sidebar-bottom">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="sidebar-logout"
                    >
                        <span className="sidebar-icon">
                            🚪
                        </span>

                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;