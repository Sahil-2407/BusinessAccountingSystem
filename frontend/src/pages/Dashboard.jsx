import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // =========================
    // LOAD DASHBOARD DATA
    // =========================
    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setErrorMessage("");

                const [
                    userResponse,
                    salesResponse,
                    purchasesResponse,
                    expensesResponse,
                    productsResponse,
                    customersResponse,
                    suppliersResponse,
                ] = await Promise.all([
                    api.get("auth/me/"),
                    api.get("sales/"),
                    api.get("purchases/"),
                    api.get("expenses/"),
                    api.get("products/"),
                    api.get("customers/"),
                    api.get("suppliers/"),
                ]);

                setUser(userResponse.data);

                setSales(
                    salesResponse.data.results ||
                    salesResponse.data
                );

                setPurchases(
                    purchasesResponse.data.results ||
                    purchasesResponse.data
                );

                setExpenses(
                    expensesResponse.data.results ||
                    expensesResponse.data
                );

                setProducts(
                    productsResponse.data.results ||
                    productsResponse.data
                );

                setCustomers(
                    customersResponse.data.results ||
                    customersResponse.data
                );

                setSuppliers(
                    suppliersResponse.data.results ||
                    suppliersResponse.data
                );

            } catch (error) {
                console.error(
                    "DASHBOARD ERROR:",
                    error
                );

                setErrorMessage(
                    error.response?.data?.detail ||
                    "Unable to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // =========================
    // CALCULATIONS
    // =========================

    const totalSales = sales.reduce(
        (total, sale) =>
            total + Number(sale.total_amount || 0),
        0
    );

    const totalPurchases = purchases.reduce(
        (total, purchase) =>
            total + Number(purchase.total_amount || 0),
        0
    );

    const totalExpenses = expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount || 0),
        0
    );

    const profit =
        totalSales -
        totalPurchases -
        totalExpenses;

    const lowStockProducts = products.filter(
        (product) =>
            Number(product.stock_quantity || 0) <=
            Number(product.minimum_stock || 0)
    );

    // =========================
    // RECENT SALES
    // =========================

    const recentSales = [...sales]
        .sort(
            (a, b) =>
                new Date(b.sale_date) -
                new Date(a.sale_date)
        )
        .slice(0, 5);

    // =========================
    // RECENT PURCHASES
    // =========================

    const recentPurchases = [...purchases]
        .sort(
            (a, b) =>
                new Date(b.purchase_date) -
                new Date(a.purchase_date)
        )
        .slice(0, 5);

    // =========================
    // FORMAT CURRENCY
    // =========================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <Layout>
                <div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}>
                        ⟳
                    </div>

                    <h2>Loading Dashboard...</h2>

                    <p>
                        Please wait while we load your
                        business information.
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>

            <div style={styles.container}>

                {/* ================= HEADER ================= */}

                <header style={styles.header}>

                    <div>
                        <h1 style={styles.pageTitle}>
                            Dashboard
                        </h1>

                        <p style={styles.pageSubtitle}>
                            Welcome back,{" "}
                            <strong>
                                {user?.username || "User"}
                            </strong>
                            . Here's your business overview.
                        </p>
                    </div>

                    {user && (
                        <div style={styles.userCard}>

                            <div style={styles.userAvatar}>
                                {user.username
                                    ?.charAt(0)
                                    ?.toUpperCase() || "U"}
                            </div>

                            <div>
                                <div style={styles.userName}>
                                    {user.username}
                                </div>

                                <div style={styles.userEmail}>
                                    {user.email || ""}
                                </div>
                            </div>

                        </div>
                    )}

                </header>

                {/* ================= ERROR ================= */}

                {errorMessage && (
                    <div style={styles.errorMessage}>
                        ⚠ {errorMessage}
                    </div>
                )}

                {/* ================= SUMMARY CARDS ================= */}

                <div style={styles.summaryGrid}>

                    {/* SALES */}
                    <div style={styles.summaryCard}>

                        <div style={styles.cardTop}>
                            <div
                                style={{
                                    ...styles.cardIcon,
                                    background:
                                        "#ecfdf5",
                                }}
                            >
                                💰
                            </div>

                            <span style={styles.cardLabel}>
                                Total Sales
                            </span>
                        </div>

                        <div style={styles.cardValue}>
                            {formatCurrency(totalSales)}
                        </div>

                        <div style={styles.cardFooter}>
                            {sales.length} transaction
                            {sales.length !== 1
                                ? "s"
                                : ""}
                        </div>

                    </div>

                    {/* PURCHASES */}
                    <div style={styles.summaryCard}>

                        <div style={styles.cardTop}>
                            <div
                                style={{
                                    ...styles.cardIcon,
                                    background:
                                        "#eff6ff",
                                }}
                            >
                                🛒
                            </div>

                            <span style={styles.cardLabel}>
                                Total Purchases
                            </span>
                        </div>

                        <div style={styles.cardValue}>
                            {formatCurrency(
                                totalPurchases
                            )}
                        </div>

                        <div style={styles.cardFooter}>
                            {purchases.length} transaction
                            {purchases.length !== 1
                                ? "s"
                                : ""}
                        </div>

                    </div>

                    {/* EXPENSES */}
                    <div style={styles.summaryCard}>

                        <div style={styles.cardTop}>
                            <div
                                style={{
                                    ...styles.cardIcon,
                                    background:
                                        "#fff7ed",
                                }}
                            >
                                💳
                            </div>

                            <span style={styles.cardLabel}>
                                Total Expenses
                            </span>
                        </div>

                        <div style={styles.cardValue}>
                            {formatCurrency(
                                totalExpenses
                            )}
                        </div>

                        <div style={styles.cardFooter}>
                            {expenses.length} expense
                            {expenses.length !== 1
                                ? "s"
                                : ""}
                        </div>

                    </div>

                    {/* PROFIT */}
                    <div style={styles.summaryCard}>

                        <div style={styles.cardTop}>
                            <div
                                style={{
                                    ...styles.cardIcon,
                                    background:
                                        profit >= 0
                                            ? "#f0fdf4"
                                            : "#fef2f2",
                                }}
                            >
                                {profit >= 0
                                    ? "📈"
                                    : "📉"}
                            </div>

                            <span style={styles.cardLabel}>
                                Net Profit
                            </span>
                        </div>

                        <div
                            style={{
                                ...styles.cardValue,
                                color:
                                    profit >= 0
                                        ? "#15803d"
                                        : "#dc2626",
                            }}
                        >
                            {formatCurrency(profit)}
                        </div>

                        <div style={styles.cardFooter}>
                            Sales − Purchases − Expenses
                        </div>

                    </div>

                </div>

                {/* ================= SECONDARY STATS ================= */}

                <div style={styles.secondaryGrid}>

                    <div style={styles.secondaryCard}>
                        <div style={styles.secondaryIcon}>
                            📦
                        </div>

                        <div>
                            <div style={styles.secondaryLabel}>
                                Total Products
                            </div>

                            <div style={styles.secondaryValue}>
                                {products.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.secondaryCard}>
                        <div style={styles.secondaryIcon}>
                            ⚠️
                        </div>

                        <div>
                            <div style={styles.secondaryLabel}>
                                Low Stock
                            </div>

                            <div
                                style={{
                                    ...styles.secondaryValue,
                                    color:
                                        lowStockProducts.length >
                                        0
                                            ? "#dc2626"
                                            : "#15803d",
                                }}
                            >
                                {lowStockProducts.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.secondaryCard}>
                        <div style={styles.secondaryIcon}>
                            👥
                        </div>

                        <div>
                            <div style={styles.secondaryLabel}>
                                Customers
                            </div>

                            <div style={styles.secondaryValue}>
                                {customers.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.secondaryCard}>
                        <div style={styles.secondaryIcon}>
                            🏢
                        </div>

                        <div>
                            <div style={styles.secondaryLabel}>
                                Suppliers
                            </div>

                            <div style={styles.secondaryValue}>
                                {suppliers.length}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ================= QUICK ACTIONS ================= */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>
                                Quick Actions
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Quickly access common tasks
                            </p>
                        </div>
                    </div>

                    <div style={styles.quickActions}>

                        <a
                            href="/sales"
                            style={styles.quickAction}
                        >
                            <span style={styles.quickIcon}>
                                💰
                            </span>

                            <div>
                                <strong>
                                    New Sale
                                </strong>

                                <small>
                                    Create a sales invoice
                                </small>
                            </div>
                        </a>

                        <a
                            href="/purchases"
                            style={styles.quickAction}
                        >
                            <span style={styles.quickIcon}>
                                🛒
                            </span>

                            <div>
                                <strong>
                                    New Purchase
                                </strong>

                                <small>
                                    Record a purchase
                                </small>
                            </div>
                        </a>

                        <a
                            href="/expenses"
                            style={styles.quickAction}
                        >
                            <span style={styles.quickIcon}>
                                💳
                            </span>

                            <div>
                                <strong>
                                    Add Expense
                                </strong>

                                <small>
                                    Record business expense
                                </small>
                            </div>
                        </a>

                        <a
                            href="/inventory"
                            style={styles.quickAction}
                        >
                            <span style={styles.quickIcon}>
                                📦
                            </span>

                            <div>
                                <strong>
                                    Inventory
                                </strong>

                                <small>
                                    Manage your products
                                </small>
                            </div>
                        </a>

                    </div>

                </section>

                {/* ================= TWO COLUMN AREA ================= */}

                <div style={styles.twoColumnGrid}>

                    {/* ================= RECENT SALES ================= */}

                    <section style={styles.sectionCard}>

                        <div style={styles.sectionCardHeader}>

                            <div>
                                <h2 style={styles.sectionTitle}>
                                    Recent Sales
                                </h2>

                                <p style={styles.sectionSubtitle}>
                                    Latest sales transactions
                                </p>
                            </div>

                            <a
                                href="/sales"
                                style={styles.viewAll}
                            >
                                View All →
                            </a>

                        </div>

                        {recentSales.length === 0 ? (
                            <div style={styles.emptySmall}>
                                <span>💰</span>
                                <p>
                                    No sales transactions yet.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.miniTableWrapper}>

                                <table style={styles.miniTable}>

                                    <thead>
                                        <tr>
                                            <th style={styles.miniTh}>
                                                Invoice
                                            </th>

                                            <th style={styles.miniTh}>
                                                Date
                                            </th>

                                            <th style={styles.miniTh}>
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentSales.map(
                                            (sale) => (
                                                <tr
                                                    key={sale.id}
                                                >

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {sale.invoice_number ||
                                                            `#${sale.id}`}
                                                    </td>

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {formatDate(
                                                            sale.sale_date
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            ...styles.miniTd,
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            sale.total_amount
                                                        )}
                                                    </td>

                                                </tr>
                                            )
                                        )}
                                    </tbody>

                                </table>

                            </div>
                        )}

                    </section>

                    {/* ================= RECENT PURCHASES ================= */}

                    <section style={styles.sectionCard}>

                        <div style={styles.sectionCardHeader}>

                            <div>
                                <h2 style={styles.sectionTitle}>
                                    Recent Purchases
                                </h2>

                                <p style={styles.sectionSubtitle}>
                                    Latest purchase transactions
                                </p>
                            </div>

                            <a
                                href="/purchases"
                                style={styles.viewAll}
                            >
                                View All →
                            </a>

                        </div>

                        {recentPurchases.length === 0 ? (
                            <div style={styles.emptySmall}>
                                <span>🛒</span>
                                <p>
                                    No purchase transactions yet.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.miniTableWrapper}>

                                <table style={styles.miniTable}>

                                    <thead>
                                        <tr>
                                            <th style={styles.miniTh}>
                                                Invoice
                                            </th>

                                            <th style={styles.miniTh}>
                                                Date
                                            </th>

                                            <th style={styles.miniTh}>
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentPurchases.map(
                                            (purchase) => (
                                                <tr
                                                    key={
                                                        purchase.id
                                                    }
                                                >

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {purchase.invoice_number ||
                                                            `#${purchase.id}`}
                                                    </td>

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {formatDate(
                                                            purchase.purchase_date
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            ...styles.miniTd,
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            purchase.total_amount
                                                        )}
                                                    </td>

                                                </tr>
                                            )
                                        )}
                                    </tbody>

                                </table>

                            </div>
                        )}

                    </section>

                </div>

                {/* ================= LOW STOCK ================= */}

                <section style={styles.sectionCard}>

                    <div style={styles.sectionCardHeader}>

                        <div>
                            <h2 style={styles.sectionTitle}>
                                Low Stock Products
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Products that need attention
                            </p>
                        </div>

                        <a
                            href="/inventory"
                            style={styles.viewAll}
                        >
                            View Inventory →
                        </a>

                    </div>

                    {lowStockProducts.length === 0 ? (
                        <div style={styles.stockSuccess}>
                            <span style={styles.stockSuccessIcon}>
                                ✓
                            </span>

                            <div>
                                <strong>
                                    Inventory looks good
                                </strong>

                                <p>
                                    No products are currently
                                    below their minimum stock
                                    level.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.miniTableWrapper}>

                            <table style={styles.miniTable}>

                                <thead>
                                    <tr>
                                        <th style={styles.miniTh}>
                                            Product
                                        </th>

                                        <th style={styles.miniTh}>
                                            Current Stock
                                        </th>

                                        <th style={styles.miniTh}>
                                            Minimum Stock
                                        </th>

                                        <th style={styles.miniTh}>
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lowStockProducts
                                        .slice(0, 8)
                                        .map((product) => {

                                            const stock =
                                                Number(
                                                    product.stock_quantity ||
                                                        0
                                                );

                                            const minimum =
                                                Number(
                                                    product.minimum_stock ||
                                                        0
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        product.id
                                                    }
                                                >

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                product.name
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {stock}
                                                    </td>

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        {minimum}
                                                    </td>

                                                    <td
                                                        style={
                                                            styles.miniTd
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.lowStockBadge
                                                            }
                                                        >
                                                            Low Stock
                                                        </span>
                                                    </td>

                                                </tr>
                                            );
                                        })}
                                </tbody>

                            </table>

                        </div>
                    )}

                </section>

                {/* ================= FOOTER ================= */}

                <footer style={styles.footer}>
                    <p>
                        Business Accounting System
                    </p>

                    <span>
                        Manage your business with confidence.
                    </span>
                </footer>

            </div>

        </Layout>
    );
}

// ======================================================
// STYLES
// ======================================================

const styles = {

    container: {
        padding: "32px 38px",
        maxWidth: "1600px",
        margin: "0 auto",
        boxSizing: "border-box",
    },

    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "28px",
    },

    pageTitle: {
        margin: 0,
        fontSize: "30px",
        fontWeight: "700",
        color: "#111827",
    },

    pageSubtitle: {
        margin: "7px 0 0",
        fontSize: "14px",
        color: "#6b7280",
    },

    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 13px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
    },

    userAvatar: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#111827",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
    },

    userName: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#111827",
    },

    userEmail: {
        fontSize: "11px",
        color: "#9ca3af",
        marginTop: "2px",
    },

    errorMessage: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        padding: "12px 16px",
        borderRadius: "9px",
        marginBottom: "20px",
        fontSize: "14px",
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "18px",
        marginBottom: "18px",
    },

    summaryCard: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        minWidth: 0,
    },

    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "15px",
    },

    cardIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
    },

    cardLabel: {
        fontSize: "13px",
        color: "#6b7280",
        fontWeight: "500",
    },

    cardValue: {
        fontSize: "25px",
        fontWeight: "700",
        color: "#111827",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    cardFooter: {
        marginTop: "7px",
        fontSize: "11px",
        color: "#9ca3af",
    },

    secondaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "18px",
        marginBottom: "28px",
    },

    secondaryCard: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    secondaryIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "9px",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
    },

    secondaryLabel: {
        fontSize: "12px",
        color: "#6b7280",
        marginBottom: "3px",
    },

    secondaryValue: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
    },

    section: {
        marginBottom: "28px",
    },

    sectionHeader: {
        marginBottom: "15px",
    },

    sectionTitle: {
        margin: 0,
        fontSize: "17px",
        fontWeight: "700",
        color: "#111827",
    },

    sectionSubtitle: {
        margin: "4px 0 0",
        fontSize: "12px",
        color: "#9ca3af",
    },

    quickActions: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "14px",
    },

    quickAction: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "15px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        textDecoration: "none",
        color: "#111827",
    },

    quickIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "9px",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        flexShrink: 0,
    },

    quickActionStrong: {
        display: "block",
    },

    twoColumnGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "18px",
        marginBottom: "18px",
    },

    sectionCard: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        overflow: "hidden",
        marginBottom: "18px",
    },

    sectionCardHeader: {
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        borderBottom: "1px solid #e5e7eb",
    },

    viewAll: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#374151",
        textDecoration: "none",
        whiteSpace: "nowrap",
    },

    miniTableWrapper: {
        overflowX: "auto",
    },

    miniTable: {
        width: "100%",
        borderCollapse: "collapse",
    },

    miniTh: {
        textAlign: "left",
        padding: "11px 18px",
        background: "#f9fafb",
        color: "#6b7280",
        fontSize: "10px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid #e5e7eb",
    },

    miniTd: {
        padding: "13px 18px",
        fontSize: "12px",
        color: "#374151",
        borderBottom: "1px solid #f0f1f3",
    },

    emptySmall: {
        padding: "38px 20px",
        textAlign: "center",
        color: "#9ca3af",
    },

    stockSuccess: {
        margin: "18px",
        padding: "16px",
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: "#166534",
    },

    stockSuccessIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "#dcfce7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
    },

    lowStockBadge: {
        display: "inline-block",
        padding: "5px 8px",
        borderRadius: "6px",
        background: "#fef2f2",
        color: "#dc2626",
        fontSize: "10px",
        fontWeight: "700",
    },

    loadingContainer: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        textAlign: "center",
    },

    loadingSpinner: {
        fontSize: "35px",
        marginBottom: "10px",
    },

    footer: {
        padding: "25px 0 10px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "11px",
    },
};

export default Dashboard;