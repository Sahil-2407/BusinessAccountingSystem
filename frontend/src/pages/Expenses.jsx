import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

const CATEGORIES = [
    "Rent",
    "Electricity",
    "Internet",
    "Salary",
    "Transport",
    "Office",
    "Other",
];

function Expenses() {
    const today = new Date().toISOString().split("T")[0];

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [form, setForm] = useState({
        title: "",
        category: "",
        amount: "",
        expense_date: today,
        remarks: "",
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("expenses/");

            setExpenses(
                response.data.results || response.data || []
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                "Failed to load expenses."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            category: "",
            amount: "",
            expense_date: today,
            remarks: "",
        });

        setEditingId(null);
        setShowForm(false);
    };

    const openAddForm = () => {
        setError("");
        setSuccess("");

        setForm({
            title: "",
            category: "",
            amount: "",
            expense_date: today,
            remarks: "",
        });

        setEditingId(null);
        setShowForm(true);
    };

    const openEditForm = (expense) => {
        setError("");
        setSuccess("");

        setForm({
            title: expense.title || "",
            category: expense.category || "",
            amount: expense.amount || "",
            expense_date: expense.expense_date || today,
            remarks: expense.remarks || "",
        });

        setEditingId(expense.id);
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const validateForm = () => {
        if (!form.title.trim()) {
            setError("Please enter an expense title.");
            return false;
        }

        if (!form.category) {
            setError("Please select an expense category.");
            return false;
        }

        if (
            form.amount === "" ||
            Number(form.amount) <= 0
        ) {
            setError("Please enter a valid expense amount.");
            return false;
        }

        if (!form.expense_date) {
            setError("Please select an expense date.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        const payload = {
            title: form.title.trim(),
            category: form.category,
            amount: Number(form.amount),
            expense_date: form.expense_date,
            remarks: form.remarks.trim(),
        };

        try {
            setSaving(true);

            if (editingId) {
                await api.put(
                    `expenses/${editingId}/`,
                    payload
                );

                setSuccess(
                    "Expense updated successfully."
                );
            } else {
                await api.post(
                    "expenses/",
                    payload
                );

                setSuccess(
                    "Expense added successfully."
                );
            }

            resetForm();
            await loadExpenses();
        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            if (data) {
                if (typeof data === "string") {
                    setError(data);
                } else {
                    const messages = Object.entries(data)
                        .map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return `${key}: ${value.join(", ")}`;
                            }

                            if (
                                typeof value === "object" &&
                                value !== null
                            ) {
                                return `${key}: ${JSON.stringify(value)}`;
                            }

                            return `${key}: ${value}`;
                        })
                        .join(" | ");

                    setError(
                        messages ||
                        "Failed to save expense."
                    );
                }
            } else {
                setError("Failed to save expense.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (expense) => {
        const confirmed = window.confirm(
            `Delete expense "${expense.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `expenses/${expense.id}/`
            );

            setSuccess(
                "Expense deleted successfully."
            );

            await loadExpenses();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                "Failed to delete expense."
            );
        }
    };

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parts = date.split("-");

        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        return date;
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce(
            (total, expense) =>
                total + Number(expense.amount || 0),
            0
        );
    }, [expenses]);

    const categoryTotals = useMemo(() => {
        const totals = {};

        CATEGORIES.forEach((category) => {
            totals[category] = 0;
        });

        expenses.forEach((expense) => {
            if (!totals[expense.category]) {
                totals[expense.category] = 0;
            }

            totals[expense.category] += Number(
                expense.amount || 0
            );
        });

        return totals;
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        const query = search.trim().toLowerCase();

        return expenses.filter((expense) => {
            const matchesSearch =
                !query ||
                expense.title?.toLowerCase().includes(query) ||
                expense.category?.toLowerCase().includes(query) ||
                expense.remarks?.toLowerCase().includes(query);

            const matchesCategory =
                !categoryFilter || expense.category === categoryFilter;

            const matchesDate =
                !dateFilter || expense.expense_date === dateFilter;

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [expenses, search, categoryFilter, dateFilter]);

    const clearFilters = () => {
        setSearch("");
        setCategoryFilter("");
        setDateFilter("");
    };

    return (
        <Layout>
            <div style={styles.page}>
                <div style={styles.container}>

                {/* HEADER */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            Expenses
                        </h1>

                        <p style={styles.subtitle}>
                            Track and manage your business expenses
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddForm}
                        style={styles.primaryButton}
                    >
                        + Add Expense
                    </button>
                </div>

                {/* FILTERS */}
                <div style={styles.filterCard}>
                    <div style={styles.filterHeader}>
                        <div>
                            <h2 style={styles.filterTitle}>Expense Filters</h2>
                            <p style={styles.filterSubtitle}>
                                Search and filter your expense history
                            </p>
                        </div>

                        {(search || categoryFilter || dateFilter) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                style={styles.clearFilterButton}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div style={styles.filterGrid}>
                        <div style={styles.field}>
                            <label style={styles.label}>Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title, category or remarks..."
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={styles.input}
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Date</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.filterResult}>
                            <span style={styles.filterResultLabel}>Showing</span>
                            <strong style={styles.filterResultValue}>
                                {filteredExpenses.length}
                            </strong>
                            <span style={styles.filterResultLabel}>
                                / {expenses.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MESSAGES */}
                {error && (
                    <div style={styles.errorBox}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {success && (
                    <div style={styles.successBox}>
                        {success}
                    </div>
                )}

                {/* STAT CARDS */}
                <div style={styles.statsGrid}>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Total Expenses
                        </div>

                        <div style={styles.statValue}>
                            {formatCurrency(totalExpenses)}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Number of Expenses
                        </div>

                        <div style={styles.statValue}>
                            {expenses.length}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Average Expense
                        </div>

                        <div style={styles.statValue}>
                            {formatCurrency(
                                expenses.length
                                    ? totalExpenses /
                                      expenses.length
                                    : 0
                            )}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Highest Category
                        </div>

                        <div style={styles.statValueSmall}>
                            {expenses.length
                                ? Object.entries(
                                      categoryTotals
                                  ).sort(
                                      (a, b) =>
                                          b[1] - a[1]
                                  )[0]?.[0] || "-"
                                : "-"}
                        </div>
                    </div>

                </div>

                {/* ADD / EDIT FORM */}
                {showForm && (
                    <div style={styles.formCard}>

                        <div style={styles.formHeader}>
                            <div>
                                <h2 style={styles.formTitle}>
                                    {editingId
                                        ? "Edit Expense"
                                        : "Add Expense"}
                                </h2>

                                <p style={styles.formSubtitle}>
                                    Enter the expense details below
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                style={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div style={styles.formGrid}>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Expense Title *
                                    </label>

                                    <input
                                        type="text"
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Office Rent"
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Category *
                                    </label>

                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">
                                            Select Category
                                        </option>

                                        {CATEGORIES.map(
                                            (category) => (
                                                <option
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Amount *
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <div style={styles.field}>
                                    <label style={styles.label}>
                                        Expense Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="expense_date"
                                        value={form.expense_date}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <div
                                    style={{
                                        ...styles.field,
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <label style={styles.label}>
                                        Remarks
                                    </label>

                                    <textarea
                                        name="remarks"
                                        value={form.remarks}
                                        onChange={handleChange}
                                        placeholder="Optional notes about this expense..."
                                        rows="4"
                                        style={{
                                            ...styles.input,
                                            resize: "vertical",
                                        }}
                                    />
                                </div>

                            </div>

                            {/* FORM ACTIONS */}
                            <div style={styles.formActions}>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={styles.cancelButton}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={styles.primaryButton}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Expense"
                                            : "Save Expense"}
                                </button>

                            </div>

                        </form>
                    </div>
                )}

                {/* CATEGORY SUMMARY */}
                {expenses.length > 0 && (
                    <div style={styles.categoryCard}>

                        <div style={styles.sectionHeader}>
                            <div>
                                <h2 style={styles.sectionTitle}>
                                    Expense Categories
                                </h2>

                                <p style={styles.sectionSubtitle}>
                                    Breakdown of your expenses
                                </p>
                            </div>
                        </div>

                        <div style={styles.categoryGrid}>

                            {CATEGORIES.map((category) => (
                                <div
                                    key={category}
                                    style={styles.categoryItem}
                                >
                                    <div>
                                        <div
                                            style={
                                                styles.categoryName
                                            }
                                        >
                                            {category}
                                        </div>

                                        <div
                                            style={
                                                styles.categoryCount
                                            }
                                        >
                                            {
                                                expenses.filter(
                                                    (expense) =>
                                                        expense.category ===
                                                        category
                                                ).length
                                            }{" "}
                                            expense(s)
                                        </div>
                                    </div>

                                    <div
                                        style={
                                            styles.categoryAmount
                                        }
                                    >
                                        {formatCurrency(
                                            categoryTotals[
                                                category
                                            ]
                                        )}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                )}

                {/* EXPENSE TABLE */}
                <div style={styles.tableCard}>

                    <div style={styles.tableHeader}>

                        <div>
                            <h2 style={styles.tableTitle}>
                                Expense History
                            </h2>

                            <p style={styles.tableSubtitle}>
                                {filteredExpenses.length} expense{filteredExpenses.length === 1 ? "" : "s"} displayed
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadExpenses}
                            style={styles.refreshButton}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    {loading ? (
                        <div style={styles.emptyState}>
                            Loading expenses...
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div style={styles.emptyState}>

                            <div style={styles.emptyIcon}>
                                💰
                            </div>

                            <h3 style={styles.emptyTitle}>
                                No expenses yet
                            </h3>

                            <p style={styles.emptyText}>
                                Add your first business expense
                                to start tracking your spending.
                            </p>

                            <button
                                type="button"
                                onClick={openAddForm}
                                style={styles.primaryButton}
                            >
                                + Add First Expense
                            </button>

                        </div>
                    ) : (
                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>
                                    <tr>

                                        <th style={styles.th}>
                                            Title
                                        </th>

                                        <th style={styles.th}>
                                            Category
                                        </th>

                                        <th style={styles.th}>
                                            Date
                                        </th>

                                        <th style={styles.th}>
                                            Remarks
                                        </th>

                                        <th style={styles.th}>
                                            Amount
                                        </th>

                                        <th
                                            style={{
                                                ...styles.th,
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Actions
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredExpenses.map(
                                        (expense) => (
                                            <tr
                                                key={
                                                    expense.id
                                                }
                                                style={
                                                    styles.tr
                                                }
                                            >

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <strong>
                                                        {
                                                            expense.title
                                                        }
                                                    </strong>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.categoryBadge
                                                        }
                                                    >
                                                        {
                                                            expense.category
                                                        }
                                                    </span>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {formatDate(
                                                        expense.expense_date
                                                    )}
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.remarks
                                                        }
                                                    >
                                                        {expense.remarks ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                <td
                                                    style={{
                                                        ...styles.td,
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        expense.amount
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        ...styles.td,
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >

                                                    <div
                                                        style={
                                                            styles.actionGroup
                                                        }
                                                    >

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    expense
                                                                )
                                                            }
                                                            style={
                                                                styles.editButton
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    expense
                                                                )
                                                            }
                                                            style={
                                                                styles.deleteButton
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                </div>
            </div>
        </Layout>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        boxSizing: "border-box",
    },

    container: {
        maxWidth: "1400px",
        margin: "0 auto",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
    },

    title: {
        margin: 0,
        fontSize: "32px",
        fontWeight: 700,
        color: "#172033",
    },

    subtitle: {
        margin: "7px 0 0",
        color: "#6b7280",
        fontSize: "15px",
    },

    primaryButton: {
        border: "none",
        borderRadius: "9px",
        padding: "12px 20px",
        background: "#2563eb",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    },

    refreshButton: {
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "8px 14px",
        background: "#fff",
        color: "#374151",
        fontSize: "13px",
        cursor: "pointer",
    },

    errorBox: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: "9px",
        padding: "13px 16px",
        marginBottom: "18px",
        fontSize: "14px",
    },

    successBox: {
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#047857",
        borderRadius: "9px",
        padding: "13px 16px",
        marginBottom: "18px",
        fontSize: "14px",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
    },
    filterCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "24px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    },

    filterHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "16px",
    },

    filterTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "16px",
    },

    filterSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "12px",
    },

    filterGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "14px",
        alignItems: "end",
    },

    filterResult: {
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "0 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "#f8fafc",
        boxSizing: "border-box",
    },

    filterResultLabel: {
        color: "#6b7280",
        fontSize: "12px",
    },

    filterResultValue: {
        color: "#2563eb",
        fontSize: "15px",
    },

    clearFilterButton: {
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "8px 13px",
        background: "#fff",
        color: "#374151",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
    },


    statCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.03)",
    },

    statLabel: {
        color: "#6b7280",
        fontSize: "13px",
        marginBottom: "8px",
    },

    statValue: {
        color: "#111827",
        fontSize: "24px",
        fontWeight: 700,
    },

    statValueSmall: {
        color: "#111827",
        fontSize: "20px",
        fontWeight: 700,
    },

    formCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "25px",
        marginBottom: "24px",
        boxShadow:
            "0 3px 12px rgba(0,0,0,0.04)",
    },

    formHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "25px",
    },

    formTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "21px",
    },

    formSubtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },

    closeButton: {
        width: "35px",
        height: "35px",
        border: "none",
        borderRadius: "7px",
        background: "#f3f4f6",
        color: "#4b5563",
        fontSize: "24px",
        cursor: "pointer",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },

    label: {
        color: "#374151",
        fontSize: "13px",
        fontWeight: 600,
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "10px 11px",
        background: "#fff",
        color: "#111827",
        fontSize: "14px",
        outline: "none",
    },

    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "22px",
    },

    cancelButton: {
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "11px 18px",
        background: "#fff",
        color: "#374151",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    },

    categoryCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow:
            "0 3px 12px rgba(0,0,0,0.04)",
    },

    sectionHeader: {
        marginBottom: "18px",
    },

    sectionTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "19px",
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "12px",
    },

    categoryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "10px",
    },

    categoryItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "14px",
        border: "1px solid #e5e7eb",
        borderRadius: "9px",
        background: "#fafafa",
    },

    categoryName: {
        color: "#172033",
        fontWeight: 600,
        fontSize: "14px",
    },

    categoryCount: {
        color: "#9ca3af",
        fontSize: "11px",
        marginTop: "4px",
    },

    categoryAmount: {
        color: "#111827",
        fontWeight: 700,
        fontSize: "13px",
    },

    tableCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow:
            "0 3px 12px rgba(0,0,0,0.04)",
    },

    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "22px 24px",
        borderBottom: "1px solid #e5e7eb",
    },

    tableTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "19px",
    },

    tableSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "12px",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "950px",
    },

    th: {
        padding: "14px 18px",
        background: "#f8fafc",
        color: "#6b7280",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        textAlign: "left",
        borderBottom: "1px solid #e5e7eb",
    },

    tr: {
        borderBottom: "1px solid #f0f1f3",
    },

    td: {
        padding: "16px 18px",
        color: "#374151",
        fontSize: "14px",
        verticalAlign: "middle",
    },

    categoryBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "11px",
        fontWeight: 600,
    },

    remarks: {
        display: "inline-block",
        maxWidth: "230px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "#6b7280",
    },

    actionGroup: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "7px",
    },

    editButton: {
        border: "1px solid #bfdbfe",
        borderRadius: "7px",
        padding: "7px 11px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
    },

    deleteButton: {
        border: "1px solid #fecaca",
        borderRadius: "7px",
        padding: "7px 11px",
        background: "#fef2f2",
        color: "#dc2626",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
    },

    emptyState: {
        padding: "70px 20px",
        textAlign: "center",
        color: "#6b7280",
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "12px",
    },

    emptyTitle: {
        margin: "0 0 7px",
        color: "#172033",
        fontSize: "18px",
    },

    emptyText: {
        maxWidth: "430px",
        margin: "0 auto 20px",
        fontSize: "13px",
        lineHeight: 1.6,
    },
};

export default Expenses;