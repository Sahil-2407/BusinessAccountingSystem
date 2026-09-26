import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        try {
            setLoading(true);

            await api.post("auth/register/", {
                username: form.username,
                email: form.email,
                password: form.password,
            });

            setSuccess(
                "Registration successful. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/");
            }, 1200);

        } catch (error) {
            console.error("REGISTER ERROR:", error);

            const data = error.response?.data;

            if (data) {
                if (typeof data === "string") {
                    setError(data);
                } else {
                    const messages = Object.entries(data)
                        .map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return `${key}: ${value.join(", ")}`;
                            }

                            return `${key}: ${value}`;
                        })
                        .join(" | ");

                    setError(
                        messages || "Registration failed."
                    );
                }
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <div style={styles.logo}>
                    💼
                </div>

                <h1 style={styles.title}>
                    Create Account
                </h1>

                <p style={styles.subtitle}>
                    Create your business accounting account
                </p>

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={styles.success}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister}>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Username
                        </label>

                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            style={styles.input}
                            required
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
                            placeholder="Enter your email"
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            style={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                </form>

                <div style={styles.loginSection}>
                    <span>
                        Already have an account?
                    </span>

                    <Link
                        to="/"
                        style={styles.loginLink}
                    >
                        Sign In
                    </Link>
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
        padding: "20px",
        boxSizing: "border-box",
    },

    card: {
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "38px",
        boxSizing: "border-box",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    },

    logo: {
        width: "58px",
        height: "58px",
        borderRadius: "14px",
        background: "#eff6ff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "28px",
        margin: "0 auto 18px",
    },

    title: {
        margin: 0,
        textAlign: "center",
        color: "#172033",
        fontSize: "25px",
        fontWeight: 700,
    },

    subtitle: {
        margin: "8px 0 28px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
    },

    error: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: "8px",
        padding: "11px 13px",
        marginBottom: "18px",
        fontSize: "13px",
    },

    success: {
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#047857",
        borderRadius: "8px",
        padding: "11px 13px",
        marginBottom: "18px",
        fontSize: "13px",
    },

    field: {
        marginBottom: "17px",
    },

    label: {
        display: "block",
        marginBottom: "7px",
        color: "#374151",
        fontSize: "13px",
        fontWeight: 600,
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 13px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#111827",
        outline: "none",
    },

    button: {
        width: "100%",
        border: "none",
        borderRadius: "8px",
        padding: "13px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        marginTop: "5px",
    },

    loginSection: {
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "13px",
    },

    loginLink: {
        marginLeft: "6px",
        color: "#2563eb",
        textDecoration: "none",
        fontWeight: 600,
    },
};

export default Register;