import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function BusinessSettings() {
    const [form, setForm] = useState({
        business_name: "",
        address: "",
        phone: "",
        email: "",
        gst_number: "",
    });

    const [logo, setLogo] = useState(null);
    const [existingLogo, setExistingLogo] = useState("");
    const [previewLogo, setPreviewLogo] = useState("");
    const [settingsId, setSettingsId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadSettings();

        return () => {
            if (previewLogo?.startsWith("blob:")) {
                URL.revokeObjectURL(previewLogo);
            }
        };
    }, []);

    const getLogoUrl = (logoPath) => {
        if (!logoPath) return "";

        if (
            logoPath.startsWith("http://") ||
            logoPath.startsWith("https://")
        ) {
            return logoPath;
        }

        return `http://127.0.0.1:8000${logoPath}`;
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("business-settings/");
            const data = Array.isArray(response.data)
                ? response.data[0]
                : response.data;

            if (data) {
                setSettingsId(data.id);

                setForm({
                    business_name: data.business_name || "",
                    address: data.address || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    gst_number: data.gst_number || "",
                });

                setExistingLogo(data.logo || "");
            }
        } catch (err) {
            console.error("Failed to load business settings:", err);
            setError(
                err.response?.data?.detail ||
                    "Failed to load business settings."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Logo image must be 5 MB or smaller.");
            e.target.value = "";
            return;
        }

        setError("");
        setMessage("");
        setLogo(file);

        if (previewLogo?.startsWith("blob:")) {
            URL.revokeObjectURL(previewLogo);
        }

        setPreviewLogo(URL.createObjectURL(file));
    };

    const validateForm = () => {
        if (!form.business_name.trim()) {
            setError("Please enter your business name.");
            return false;
        }

        if (
            form.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ) {
            setError("Please enter a valid business email address.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!validateForm()) return;

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append("business_name", form.business_name.trim());
            formData.append("address", form.address.trim());
            formData.append("phone", form.phone.trim());
            formData.append("email", form.email.trim());
            formData.append("gst_number", form.gst_number.trim());

            if (logo) {
                formData.append("logo", logo);
            }

            let response;

            if (settingsId) {
                response = await api.put(
                    `business-settings/${settingsId}/`,
                    formData
                );
            } else {
                response = await api.post(
                    "business-settings/",
                    formData
                );
            }

            setSettingsId(response.data.id);
            setExistingLogo(response.data.logo || "");
            setLogo(null);

            if (previewLogo?.startsWith("blob:")) {
                URL.revokeObjectURL(previewLogo);
            }

            setPreviewLogo("");
            setMessage("Business settings saved successfully.");
        } catch (err) {
            console.error("Failed to save business settings:", err);

            const data = err.response?.data;

            if (data && typeof data === "object") {
                const messages = Object.entries(data)
                    .map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return `${key}: ${value.join(", ")}`;
                        }

                        return `${key}: ${value}`;
                    })
                    .join(" | ");

                setError(messages || "Failed to save business settings.");
            } else {
                setError("Failed to save business settings.");
            }
        } finally {
            setSaving(false);
        }
    };

    const displayedLogo = previewLogo || getLogoUrl(existingLogo);

    if (loading) {
        return (
            <Layout>
                <div style={styles.loadingPage}>
                    <div style={styles.loadingCard}>
                        <div style={styles.loadingSpinner}>⟳</div>
                        <h2 style={styles.loadingTitle}>
                            Loading Business Settings
                        </h2>
                        <p style={styles.loadingText}>
                            Please wait while your business information is loaded.
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <div>
                            <div style={styles.eyebrow}>
                                BUSINESS PROFILE
                            </div>

                            <h1 style={styles.title}>
                                Business Settings
                            </h1>

                            <p style={styles.subtitle}>
                                Manage the business information used throughout
                                your accounting system, invoices and PDF documents.
                            </p>
                        </div>

                        <div style={styles.headerBadge}>
                            ⚙️ Settings
                        </div>
                    </div>

                    {message && (
                        <div style={styles.success}>
                            <span style={styles.messageIcon}>✓</span>
                            <div>
                                <strong>Saved successfully</strong>
                                <div style={styles.messageText}>
                                    {message}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={styles.error}>
                            <span style={styles.messageIcon}>!</span>
                            <div>
                                <strong>Something went wrong</strong>
                                <div style={styles.messageText}>
                                    {error}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.mainGrid}>
                            <div>
                                <div style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.cardIcon}>🏢</div>
                                        <div>
                                            <h2 style={styles.cardTitle}>
                                                Business Information
                                            </h2>
                                            <p style={styles.cardSubtitle}>
                                                Enter the details that should appear
                                                on your business documents.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={styles.grid}>
                                        <div style={styles.field}>
                                            <label style={styles.label}>
                                                Business Name <span style={styles.required}>*</span>
                                            </label>

                                            <input
                                                type="text"
                                                name="business_name"
                                                value={form.business_name}
                                                onChange={handleChange}
                                                placeholder="e.g. ABC Electronics"
                                                required
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.field}>
                                            <label style={styles.label}>
                                                Phone
                                            </label>

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.field}>
                                            <label style={styles.label}>
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="business@example.com"
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.field}>
                                            <label style={styles.label}>
                                                GST Number
                                            </label>

                                            <input
                                                type="text"
                                                name="gst_number"
                                                value={form.gst_number}
                                                onChange={handleChange}
                                                placeholder="Enter GST number"
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.fieldFull}>
                                            <label style={styles.label}>
                                                Business Address
                                            </label>

                                            <textarea
                                                name="address"
                                                value={form.address}
                                                onChange={handleChange}
                                                placeholder="Enter complete business address"
                                                rows="5"
                                                style={styles.textarea}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.cardIcon}>🖼️</div>
                                        <div>
                                            <h2 style={styles.cardTitle}>
                                                Business Logo
                                            </h2>
                                            <p style={styles.cardSubtitle}>
                                                Upload a logo to display on invoices
                                                and PDF documents.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={styles.logoSection}>
                                        <div style={styles.logoPreviewContainer}>
                                            {displayedLogo ? (
                                                <img
                                                    src={displayedLogo}
                                                    alt="Business Logo"
                                                    style={styles.logoPreview}
                                                />
                                            ) : (
                                                <div style={styles.logoPlaceholder}>
                                                    <div style={styles.logoPlaceholderIcon}>
                                                        🏢
                                                    </div>
                                                    <div style={styles.logoPlaceholderText}>
                                                        No logo uploaded
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={styles.logoControls}>
                                            <label style={styles.fileLabel}>
                                                Choose Logo
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                                    onChange={handleLogoChange}
                                                    style={styles.hiddenFileInput}
                                                />
                                            </label>

                                            <div style={styles.fileHint}>
                                                PNG, JPG or WEBP · Maximum 5 MB
                                            </div>

                                            {logo && (
                                                <div style={styles.selectedFile}>
                                                    ✓ {logo.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={styles.previewCard}>
                                    <div style={styles.previewHeader}>
                                        <div>
                                            <div style={styles.previewEyebrow}>
                                                INVOICE PREVIEW
                                            </div>
                                            <h2 style={styles.previewTitle}>
                                                Business Header
                                            </h2>
                                        </div>
                                        <span style={styles.liveBadge}>
                                            LIVE
                                        </span>
                                    </div>

                                    <div style={styles.previewDivider} />

                                    <div style={styles.invoicePreview}>
                                        {displayedLogo && (
                                            <img
                                                src={displayedLogo}
                                                alt=""
                                                style={styles.previewLogo}
                                            />
                                        )}

                                        <div style={styles.previewBusinessName}>
                                            {form.business_name ||
                                                "Your Business Name"}
                                        </div>

                                        <div style={styles.previewAddress}>
                                            {form.address ||
                                                "Business address will appear here"}
                                        </div>

                                        {form.phone && (
                                            <div style={styles.previewContact}>
                                                📞 {form.phone}
                                            </div>
                                        )}

                                        {form.email && (
                                            <div style={styles.previewContact}>
                                                ✉️ {form.email}
                                            </div>
                                        )}

                                        {form.gst_number && (
                                            <div style={styles.previewGST}>
                                                GSTIN: {form.gst_number}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.infoCard}>
                                    <div style={styles.infoIcon}>💡</div>
                                    <div>
                                        <h3 style={styles.infoTitle}>
                                            Where this information is used
                                        </h3>
                                        <p style={styles.infoText}>
                                            Your business details can be used in
                                            Sales and Purchase invoices and their
                                            PDF documents.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={styles.actions}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...styles.saveButton,
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? "Saving Changes..." : "Save Business Settings"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px 40px",
        boxSizing: "border-box",
    },

    container: {
        maxWidth: "1250px",
        margin: "0 auto",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "26px",
    },

    eyebrow: {
        color: "#2563eb",
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "1.2px",
        marginBottom: "7px",
    },

    title: {
        margin: 0,
        color: "#172033",
        fontSize: "32px",
        fontWeight: 750,
    },

    subtitle: {
        margin: "8px 0 0",
        color: "#6b7280",
        fontSize: "14px",
        lineHeight: 1.6,
        maxWidth: "720px",
    },

    headerBadge: {
        padding: "9px 13px",
        borderRadius: "9px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
    },

    success: {
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#047857",
        padding: "13px 16px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontSize: "13px",
    },

    error: {
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        padding: "13px 16px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontSize: "13px",
    },

    messageIcon: {
        width: "22px",
        height: "22px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.65)",
        fontWeight: 800,
        flexShrink: 0,
    },

    messageText: {
        marginTop: "3px",
        fontWeight: 400,
    },

    mainGrid: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.8fr)",
        gap: "22px",
        alignItems: "start",
    },

    card: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "25px",
        marginBottom: "22px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    },

    cardHeader: {
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        marginBottom: "24px",
    },

    cardIcon: {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        background: "#eff6ff",
        fontSize: "19px",
        flexShrink: 0,
    },

    cardTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
        fontWeight: 700,
    },

    cardSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "12px",
        lineHeight: 1.5,
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "18px",
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },

    fieldFull: {
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },

    label: {
        color: "#374151",
        fontSize: "12px",
        fontWeight: 700,
    },

    required: {
        color: "#dc2626",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#fff",
        color: "#111827",
        fontSize: "14px",
        outline: "none",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#fff",
        color: "#111827",
        fontSize: "14px",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
    },

    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
    },

    logoPreviewContainer: {
        width: "170px",
        height: "125px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed #cbd5e1",
        borderRadius: "10px",
        background: "#f8fafc",
        overflow: "hidden",
        flexShrink: 0,
    },

    logoPreview: {
        maxWidth: "150px",
        maxHeight: "105px",
        objectFit: "contain",
    },

    logoPlaceholder: {
        textAlign: "center",
        color: "#9ca3af",
    },

    logoPlaceholderIcon: {
        fontSize: "30px",
        marginBottom: "5px",
    },

    logoPlaceholderText: {
        fontSize: "11px",
    },

    logoControls: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
    },

    fileLabel: {
        display: "inline-block",
        padding: "10px 15px",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
    },

    hiddenFileInput: {
        display: "none",
    },

    fileHint: {
        color: "#9ca3af",
        fontSize: "11px",
    },

    selectedFile: {
        color: "#047857",
        fontSize: "12px",
        fontWeight: 600,
        maxWidth: "280px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    previewCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px",
        marginBottom: "22px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    },

    previewHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
    },

    previewEyebrow: {
        color: "#6b7280",
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "1px",
    },

    previewTitle: {
        margin: "4px 0 0",
        color: "#172033",
        fontSize: "17px",
    },

    liveBadge: {
        padding: "4px 7px",
        borderRadius: "5px",
        background: "#ecfdf5",
        color: "#047857",
        fontSize: "9px",
        fontWeight: 800,
    },

    previewDivider: {
        height: "1px",
        background: "#e5e7eb",
        margin: "17px 0",
    },

    invoicePreview: {
        minHeight: "235px",
        padding: "22px 15px",
        border: "1px solid #e5e7eb",
        borderRadius: "9px",
        background: "#fcfcfd",
        textAlign: "center",
    },

    previewLogo: {
        maxWidth: "100px",
        maxHeight: "65px",
        objectFit: "contain",
        marginBottom: "10px",
    },

    previewBusinessName: {
        color: "#111827",
        fontSize: "19px",
        fontWeight: 800,
        wordBreak: "break-word",
    },

    previewAddress: {
        color: "#6b7280",
        fontSize: "11px",
        lineHeight: 1.5,
        margin: "7px auto 0",
        maxWidth: "260px",
        whiteSpace: "pre-line",
        wordBreak: "break-word",
    },

    previewContact: {
        color: "#4b5563",
        fontSize: "11px",
        marginTop: "5px",
        wordBreak: "break-word",
    },

    previewGST: {
        display: "inline-block",
        marginTop: "12px",
        padding: "5px 8px",
        borderRadius: "5px",
        background: "#f3f4f6",
        color: "#374151",
        fontSize: "10px",
        fontWeight: 700,
    },

    infoCard: {
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        padding: "17px",
        border: "1px solid #dbeafe",
        borderRadius: "12px",
        background: "#eff6ff",
    },

    infoIcon: {
        fontSize: "20px",
    },

    infoTitle: {
        margin: 0,
        color: "#1e40af",
        fontSize: "13px",
    },

    infoText: {
        margin: "5px 0 0",
        color: "#4b5563",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    actions: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "2px",
        paddingBottom: "25px",
    },

    saveButton: {
        border: "none",
        borderRadius: "9px",
        padding: "12px 22px",
        background: "#2563eb",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 3px 8px rgba(37,99,235,0.2)",
    },

    loadingPage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "30px",
        boxSizing: "border-box",
    },

    loadingCard: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "35px",
        textAlign: "center",
        boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    },

    loadingSpinner: {
        fontSize: "28px",
        color: "#2563eb",
        marginBottom: "10px",
    },

    loadingTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
    },

    loadingText: {
        margin: "7px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },
};

export default BusinessSettings;
