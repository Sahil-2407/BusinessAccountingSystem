import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const [formData, setFormData] = useState({
        company_name: "",
        contact_person: "",
        gst_number: "",
        email: "",
        phone: "",
        address: "",
    });

    const [error, setError] = useState("");

    // =========================
    // FETCH SUPPLIERS
    // =========================
    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("suppliers/");
            setSuppliers(response.data);
        } catch (err) {
            console.error("Failed to load suppliers:", err);

            setError(
                err.response?.data?.detail ||
                    "Failed to load suppliers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    // =========================
    // FORM CHANGE
    // =========================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // ADD SUPPLIER
    // =========================
    const openAddModal = () => {
        setEditingSupplier(null);

        setFormData({
            company_name: "",
            contact_person: "",
            gst_number: "",
            email: "",
            phone: "",
            address: "",
        });

        setError("");
        setShowModal(true);
    };

    // =========================
    // EDIT SUPPLIER
    // =========================
    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);

        setFormData({
            company_name: supplier.company_name || "",
            contact_person: supplier.contact_person || "",
            gst_number: supplier.gst_number || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
        });

        setError("");
        setShowModal(true);
    };

    // =========================
    // CLOSE MODAL
    // =========================
    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingSupplier(null);

        setFormData({
            company_name: "",
            contact_person: "",
            gst_number: "",
            email: "",
            phone: "",
            address: "",
        });

        setError("");
    };

    // =========================
    // SAVE SUPPLIER
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.company_name.trim()) {
            setError("Company name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingSupplier) {
                await api.put(
                    `suppliers/${editingSupplier.id}/`,
                    formData
                );
            } else {
                await api.post("suppliers/", formData);
            }

            await fetchSuppliers();
            closeModal();
        } catch (err) {
            console.error("Failed to save supplier:", err);
            console.log("Server response:", err.response?.data);

            const data = err.response?.data;

            if (data?.gst_number) {
                setError(
                    Array.isArray(data.gst_number)
                        ? data.gst_number.join(" ")
                        : data.gst_number
                );
            } else if (data?.company_name) {
                setError(
                    Array.isArray(data.company_name)
                        ? data.company_name.join(" ")
                        : data.company_name
                );
            } else if (data?.email) {
                setError(
                    Array.isArray(data.email)
                        ? data.email.join(" ")
                        : data.email
                );
            } else if (data?.detail) {
                setError(data.detail);
            } else {
                setError("Failed to save supplier.");
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // DELETE SUPPLIER
    // =========================
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this supplier?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`suppliers/${id}/`);

            setSuppliers((prev) =>
                prev.filter((supplier) => supplier.id !== id)
            );
        } catch (err) {
            console.error("Failed to delete supplier:", err);

            alert(
                err.response?.data?.detail ||
                    "Failed to delete supplier."
            );
        }
    };

    // =========================
    // SEARCH
    // =========================
    const filteredSuppliers = suppliers.filter((supplier) => {
        const searchText = search.toLowerCase();

        return (
            supplier.company_name
                ?.toLowerCase()
                .includes(searchText) ||
            supplier.contact_person
                ?.toLowerCase()
                .includes(searchText) ||
            supplier.gst_number
                ?.toLowerCase()
                .includes(searchText) ||
            supplier.email
                ?.toLowerCase()
                .includes(searchText) ||
            supplier.phone
                ?.toLowerCase()
                .includes(searchText) ||
            supplier.address
                ?.toLowerCase()
                .includes(searchText)
        );
    });

    return (
        <Layout>
            <div style={styles.page}>

                {/* ================= HEADER ================= */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            Suppliers
                        </h1>

                        <p style={styles.subtitle}>
                            Manage your suppliers and business
                            contact information.
                        </p>
                    </div>

                    <button
                        style={styles.addButton}
                        onClick={openAddModal}
                    >
                        <span style={styles.plus}>+</span>
                        Add Supplier
                    </button>
                </div>

                {/* ================= STATS ================= */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            🏢
                        </div>

                        <div>
                            <div style={styles.statLabel}>
                                Total Suppliers
                            </div>

                            <div style={styles.statValue}>
                                {suppliers.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            🔍
                        </div>

                        <div>
                            <div style={styles.statLabel}>
                                Search Results
                            </div>

                            <div style={styles.statValue}>
                                {filteredSuppliers.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE CARD ================= */}
                <div style={styles.card}>

                    {/* SEARCH */}
                    <div style={styles.toolbar}>
                        <div style={styles.searchWrapper}>
                            <span style={styles.searchIcon}>
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                style={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* ERROR */}
                    {error && !showModal && (
                        <div style={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    {/* LOADING */}
                    {loading ? (
                        <div style={styles.emptyState}>
                            <div style={styles.loadingIcon}>
                                ⟳
                            </div>

                            <p>
                                Loading suppliers...
                            </p>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>
                                🏢
                            </div>

                            <h3 style={styles.emptyTitle}>
                                No suppliers found
                            </h3>

                            <p style={styles.emptyText}>
                                {search
                                    ? "Try changing your search."
                                    : "Add your first supplier to get started."}
                            </p>

                            {!search && (
                                <button
                                    style={styles.emptyButton}
                                    onClick={openAddModal}
                                >
                                    + Add Supplier
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>
                                            Company
                                        </th>

                                        <th style={styles.th}>
                                            Contact Person
                                        </th>

                                        <th style={styles.th}>
                                            GST Number
                                        </th>

                                        <th style={styles.th}>
                                            Email
                                        </th>

                                        <th style={styles.th}>
                                            Phone
                                        </th>

                                        <th
                                            style={{
                                                ...styles.th,
                                                textAlign:
                                                    "center",
                                            }}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredSuppliers.map(
                                        (supplier) => (
                                            <tr
                                                key={
                                                    supplier.id
                                                }
                                                style={styles.tr}
                                            >
                                                {/* COMPANY */}
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.companyCell
                                                        }
                                                    >
                                                        <div
                                                            style={
                                                                styles.avatar
                                                            }
                                                        >
                                                            {supplier.company_name
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase() ||
                                                                "S"}
                                                        </div>

                                                        <div>
                                                            <div
                                                                style={
                                                                    styles.companyName
                                                                }
                                                            >
                                                                {
                                                                    supplier.company_name
                                                                }
                                                            </div>

                                                            <div
                                                                style={
                                                                    styles.supplierId
                                                                }
                                                            >
                                                                ID:{" "}
                                                                {
                                                                    supplier.id
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CONTACT */}
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {supplier.contact_person ||
                                                        "—"}
                                                </td>

                                                {/* GST */}
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {supplier.gst_number ? (
                                                        <span
                                                            style={
                                                                styles.gstBadge
                                                            }
                                                        >
                                                            {
                                                                supplier.gst_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>

                                                {/* EMAIL */}
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {supplier.email ||
                                                        "—"}
                                                </td>

                                                {/* PHONE */}
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {supplier.phone ||
                                                        "—"}
                                                </td>

                                                {/* ACTIONS */}
                                                <td
                                                    style={{
                                                        ...styles.td,
                                                        textAlign:
                                                            "center",
                                                    }}
                                                >
                                                    <div
                                                        style={
                                                            styles.actionGroup
                                                        }
                                                    >
                                                        <button
                                                            style={
                                                                styles.editButton
                                                            }
                                                            onClick={() =>
                                                                openEditModal(
                                                                    supplier
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            style={
                                                                styles.deleteButton
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    supplier.id
                                                                )
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

            {/* ================= MODAL ================= */}
            {showModal && (
                <div
                    style={styles.modalOverlay}
                    onClick={closeModal}
                >
                    <div
                        style={styles.modal}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}
                        <div style={styles.modalHeader}>
                            <div>
                                <h2 style={styles.modalTitle}>
                                    {editingSupplier
                                        ? "Edit Supplier"
                                        : "Add Supplier"}
                                </h2>

                                <p
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    {editingSupplier
                                        ? "Update supplier information."
                                        : "Enter supplier details below."}
                                </p>
                            </div>

                            <button
                                style={styles.closeButton}
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        {/* MODAL ERROR */}
                        {error && (
                            <div
                                style={
                                    styles.modalError
                                }
                            >
                                {error}
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGrid}>

                                {/* COMPANY NAME */}
                                <div
                                    style={{
                                        ...styles.formGroup,
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        Company Name
                                        <span
                                            style={
                                                styles.required
                                            }
                                        >
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="company_name"
                                        value={
                                            formData.company_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter company name"
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                {/* CONTACT PERSON */}
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        Contact Person
                                    </label>

                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={
                                            formData.contact_person
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter contact person"
                                        style={styles.input}
                                    />
                                </div>

                                {/* GST */}
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        GST Number
                                    </label>

                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={
                                            formData.gst_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter GST number"
                                        style={styles.input}
                                    />
                                </div>

                                {/* EMAIL */}
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="supplier@example.com"
                                        style={styles.input}
                                    />
                                </div>

                                {/* PHONE */}
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        Phone
                                    </label>

                                    <input
                                        type="text"
                                        name="phone"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter phone number"
                                        style={styles.input}
                                    />
                                </div>

                                {/* ADDRESS */}
                                <div
                                    style={{
                                        ...styles.formGroup,
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <label
                                        style={styles.label}
                                    >
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={
                                            formData.address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter supplier address"
                                        rows="4"
                                        style={
                                            styles.textarea
                                        }
                                    />
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div
                                style={
                                    styles.modalFooter
                                }
                            >
                                <button
                                    type="button"
                                    style={
                                        styles.cancelButton
                                    }
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={
                                        styles.saveButton
                                    }
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingSupplier
                                        ? "Update Supplier"
                                        : "Save Supplier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

const styles = {
    page: {
        padding: "32px",
        minHeight: "100vh",
        boxSizing: "border-box",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "20px",
    },

    title: {
        margin: 0,
        fontSize: "30px",
        fontWeight: "700",
        color: "#172033",
    },

    subtitle: {
        margin: "7px 0 0",
        color: "#697386",
        fontSize: "14px",
    },

    addButton: {
        border: "none",
        borderRadius: "9px",
        padding: "12px 18px",
        background: "#2563eb",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow:
            "0 4px 10px rgba(37, 99, 235, 0.18)",
    },

    plus: {
        fontSize: "20px",
        lineHeight: 1,
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "22px",
    },

    statCard: {
        background: "#fff",
        border: "1px solid #e8ecf3",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.03)",
    },

    statIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "10px",
        background: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "21px",
    },

    statLabel: {
        fontSize: "13px",
        color: "#758096",
        marginBottom: "4px",
    },

    statValue: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#172033",
    },

    card: {
        background: "#fff",
        border: "1px solid #e8ecf3",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.03)",
    },

    toolbar: {
        padding: "18px 20px",
        borderBottom: "1px solid #edf0f5",
        display: "flex",
        justifyContent: "space-between",
    },

    searchWrapper: {
        width: "100%",
        maxWidth: "420px",
        position: "relative",
    },

    searchIcon: {
        position: "absolute",
        left: "13px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#8791a5",
        fontSize: "20px",
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #dfe4ec",
        borderRadius: "8px",
        padding: "11px 14px 11px 38px",
        outline: "none",
        fontSize: "14px",
        color: "#273247",
    },

    errorBox: {
        margin: "18px 20px 0",
        padding: "12px 14px",
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        fontSize: "13px",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "1100px",
    },

    th: {
        textAlign: "left",
        padding: "14px 20px",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        borderBottom: "1px solid #e5eaf1",
    },

    tr: {
        borderBottom: "1px solid #edf0f5",
    },

    td: {
        padding: "16px 20px",
        color: "#3b4658",
        fontSize: "14px",
        verticalAlign: "middle",
    },

    companyCell: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    avatar: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "14px",
        flexShrink: 0,
    },

    companyName: {
        fontWeight: "600",
        color: "#172033",
        marginBottom: "3px",
    },

    supplierId: {
        fontSize: "11px",
        color: "#94a3b8",
    },

    gstBadge: {
        display: "inline-block",
        padding: "5px 8px",
        borderRadius: "6px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "11px",
        fontWeight: "600",
    },

    actionGroup: {
        display: "flex",
        justifyContent: "center",
        gap: "8px",
    },

    editButton: {
        border: "1px solid #dbe4f0",
        background: "#fff",
        color: "#2563eb",
        borderRadius: "7px",
        padding: "7px 11px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
    },

    deleteButton: {
        border: "1px solid #fecaca",
        background: "#fff",
        color: "#dc2626",
        borderRadius: "7px",
        padding: "7px 11px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
    },

    emptyState: {
        padding: "70px 20px",
        textAlign: "center",
        color: "#64748b",
    },

    emptyIcon: {
        fontSize: "42px",
        marginBottom: "12px",
    },

    emptyTitle: {
        margin: "0 0 7px",
        color: "#172033",
        fontSize: "18px",
    },

    emptyText: {
        margin: "0 0 18px",
        fontSize: "14px",
    },

    emptyButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        borderRadius: "8px",
        padding: "10px 15px",
        fontWeight: "600",
        cursor: "pointer",
    },

    loadingIcon: {
        fontSize: "32px",
        marginBottom: "10px",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
    },

    modal: {
        width: "100%",
        maxWidth: "650px",
        background: "#fff",
        borderRadius: "14px",
        boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.25)",
        overflow: "hidden",
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "24px 26px",
        borderBottom: "1px solid #edf0f5",
    },

    modalTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "21px",
        fontWeight: "700",
    },

    modalSubtitle: {
        margin: "5px 0 0",
        color: "#7a8497",
        fontSize: "13px",
    },

    closeButton: {
        border: "none",
        background: "transparent",
        color: "#64748b",
        fontSize: "28px",
        lineHeight: 1,
        cursor: "pointer",
    },

    modalError: {
        margin: "18px 26px 0",
        padding: "11px 13px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: "8px",
        fontSize: "13px",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px",
        padding: "24px 26px",
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },

    label: {
        color: "#374151",
        fontSize: "13px",
        fontWeight: "600",
    },

    required: {
        color: "#dc2626",
        marginLeft: "3px",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #d9e0e9",
        borderRadius: "8px",
        padding: "11px 12px",
        fontSize: "14px",
        outline: "none",
        color: "#1f2937",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #d9e0e9",
        borderRadius: "8px",
        padding: "11px 12px",
        fontSize: "14px",
        outline: "none",
        color: "#1f2937",
        resize: "vertical",
        fontFamily: "inherit",
    },

    modalFooter: {
        padding: "18px 26px",
        borderTop: "1px solid #edf0f5",
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
    },

    cancelButton: {
        border: "1px solid #d9e0e9",
        background: "#fff",
        color: "#475569",
        borderRadius: "8px",
        padding: "10px 16px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },

    saveButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        borderRadius: "8px",
        padding: "10px 17px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },
};

export default Suppliers;