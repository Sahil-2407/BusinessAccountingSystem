import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("auth/login/", {
                username,
                password,
            });

            localStorage.setItem("access", response.data.access);
            localStorage.setItem("refresh", response.data.refresh);

            navigate("/dashboard");
        } catch (error) {
            console.error("LOGIN ERROR:", error);

            if (error.response) {
                console.log("STATUS:", error.response.status);
                console.log("DATA:", error.response.data);
            } else {
                console.log("NO RESPONSE:", error.message);
            }

            setError(
                error.response?.data?.detail ||
                "Invalid username or password."
            );
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
                    Business Accounting
                </h1>

                <p style={styles.subtitle}>
                    Sign in to manage your business
                </p>

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter your username"
                            style={styles.input}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            style={styles.input}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.loginButton,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <div style={styles.registerSection}>
                    <span>
                        Don't have an account?
                    </span>

                    <Link
                        to="/register"
                        style={styles.registerLink}
                    >
                        Create Account
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

    field: {
        marginBottom: "18px",
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

    loginButton: {
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

    registerSection: {
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "13px",
    },

    registerLink: {
        marginLeft: "6px",
        color: "#2563eb",
        textDecoration: "none",
        fontWeight: 600,
    },
};

export default Login;