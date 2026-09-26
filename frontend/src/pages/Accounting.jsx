import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function Accounting() {
    const [ledger, setLedger] = useState([]);
    const [journal, setJournal] = useState([]);
    const [cashbook, setCashbook] = useState([]);

    const [activeTab, setActiveTab] = useState("ledger");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadAccountingData();
    }, []);

    const loadAccountingData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [ledgerRes, journalRes, cashbookRes] =
                await Promise.all([
                    api.get("ledger/"),
                    api.get("journal/"),
                    api.get("cashbook/"),
                ]);

            setLedger(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
            setJournal(Array.isArray(journalRes.data) ? journalRes.data : []);
            setCashbook(
                Array.isArray(cashbookRes.data) ? cashbookRes.data : []
            );
        } catch (err) {
            console.error("Accounting API error:", err);
            setError(
                err.response?.data?.detail ||
                    "Failed to load accounting data. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // =========================
    // TOTALS
    // =========================

    const totalDebit = ledger.reduce(
        (sum, item) => sum + Number(item.debit || 0),
        0
    );

    const totalCredit = ledger.reduce(
        (sum, item) => sum + Number(item.credit || 0),
        0
    );

    const ledgerBalance = ledger.reduce(
        (sum, item) => sum + Number(item.balance || 0),
        0
    );

    const journalTotal = journal.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const totalReceipts = cashbook.reduce(
        (sum, item) => sum + Number(item.receipt || 0),
        0
    );

    const totalPayments = cashbook.reduce(
        (sum, item) => sum + Number(item.payment || 0),
        0
    );

    const cashBalance = cashbook.reduce(
        (sum, item) => sum + Number(item.balance || 0),
        0
    );

    // =========================
    // FILTER DATA
    // =========================

    const filteredLedger = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return ledger;

        return ledger.filter((item) =>
            [
                item.date,
                item.particulars,
                item.reference,
                item.debit,
                item.credit,
                item.balance,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [ledger, search]);

    const filteredJournal = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return journal;

        return journal.filter((item) =>
            [
                item.date,
                item.description,
                item.debit_account,
                item.credit_account,
                item.reference,
                item.amount,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [journal, search]);

    const filteredCashbook = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return cashbook;

        return cashbook.filter((item) =>
            [
                item.date,
                item.receipt,
                item.payment,
                item.balance,
                item.remarks,
                item.reference,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [cashbook, search]);

    const activeData =
        activeTab === "ledger"
            ? filteredLedger
            : activeTab === "journal"
            ? filteredJournal
            : filteredCashbook;

    const activeTotal =
        activeTab === "ledger"
            ? ledger.length
            : activeTab === "journal"
            ? journal.length
            : cashbook.length;

    const getSearchPlaceholder = () => {
        if (activeTab === "ledger") {
            return "Search particulars, reference, date...";
        }

        if (activeTab === "journal") {
            return "Search description, account, reference...";
        }

        return "Search remarks, reference, date...";
    };

    const clearSearch = () => {
        setSearch("");
    };

    return (
        <Layout>
            <div style={styles.page}>
                <div style={styles.container}>
                    {/* ================= HEADER ================= */}

                    <div style={styles.header}>
                        <div>
                            <div style={styles.titleRow}>
                                <div style={styles.titleIcon}>📒</div>

                                <div>
                                    <h1 style={styles.title}>Accounting</h1>

                                    <p style={styles.subtitle}>
                                        Monitor your ledger, journal and cash
                                        book transactions
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAccountingData(true)}
                            disabled={refreshing}
                            style={{
                                ...styles.refreshButton,
                                ...(refreshing
                                    ? styles.disabledButton
                                    : {}),
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    marginRight: "7px",
                                    transform: refreshing
                                        ? "rotate(360deg)"
                                        : "none",
                                    transition: "transform 0.6s linear",
                                }}
                            >
                                ↻
                            </span>

                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {/* ================= ERROR ================= */}

                    {error && (
                        <div style={styles.errorBox}>
                            <div style={styles.errorIcon}>!</div>

                            <div style={{ flex: 1 }}>
                                <div style={styles.errorTitle}>
                                    Unable to load accounting data
                                </div>

                                <div style={styles.errorText}>{error}</div>
                            </div>

                            <button
                                type="button"
                                onClick={() => loadAccountingData(false)}
                                style={styles.retryButton}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ================= SUMMARY CARDS ================= */}

                    <div style={styles.summaryGrid}>
                        <SummaryCard
                            icon="↗"
                            label="Total Debit"
                            value={`₹${formatMoney(totalDebit)}`}
                            description={`${ledger.length} ledger records`}
                            iconBackground="#eff6ff"
                            iconColor="#2563eb"
                        />

                        <SummaryCard
                            icon="↙"
                            label="Total Credit"
                            value={`₹${formatMoney(totalCredit)}`}
                            description="Ledger credit entries"
                            iconBackground="#f0fdf4"
                            iconColor="#16a34a"
                        />

                        <SummaryCard
                            icon="💰"
                            label="Cash Receipts"
                            value={`₹${formatMoney(totalReceipts)}`}
                            description="Money received"
                            iconBackground="#ecfdf5"
                            iconColor="#059669"
                        />

                        <SummaryCard
                            icon="💸"
                            label="Cash Payments"
                            value={`₹${formatMoney(totalPayments)}`}
                            description="Money paid"
                            iconBackground="#fff7ed"
                            iconColor="#ea580c"
                        />

                        <SummaryCard
                            icon="🧾"
                            label="Journal Amount"
                            value={`₹${formatMoney(journalTotal)}`}
                            description={`${journal.length} journal entries`}
                            iconBackground="#f5f3ff"
                            iconColor="#7c3aed"
                        />
                    </div>

                    {/* ================= TABS ================= */}

                    <div style={styles.tabsCard}>
                        <div style={styles.tabs}>
                            <TabButton
                                active={activeTab === "ledger"}
                                onClick={() => {
                                    setActiveTab("ledger");
                                    setSearch("");
                                }}
                                icon="📘"
                                label="Ledger"
                                count={ledger.length}
                            />

                            <TabButton
                                active={activeTab === "journal"}
                                onClick={() => {
                                    setActiveTab("journal");
                                    setSearch("");
                                }}
                                icon="📝"
                                label="Journal"
                                count={journal.length}
                            />

                            <TabButton
                                active={activeTab === "cashbook"}
                                onClick={() => {
                                    setActiveTab("cashbook");
                                    setSearch("");
                                }}
                                icon="💵"
                                label="Cash Book"
                                count={cashbook.length}
                            />
                        </div>
                    </div>

                    {/* ================= MAIN CONTENT ================= */}

                    <div style={styles.contentCard}>
                        {loading ? (
                            <LoadingState />
                        ) : (
                            <>
                                {/* ================= TOOLBAR ================= */}

                                <div style={styles.toolbar}>
                                    <div>
                                        <div style={styles.sectionTitle}>
                                            {activeTab === "ledger" &&
                                                "Ledger Transactions"}

                                            {activeTab === "journal" &&
                                                "Journal Entries"}

                                            {activeTab === "cashbook" &&
                                                "Cash Book Transactions"}
                                        </div>

                                        <div style={styles.sectionSubtitle}>
                                            Showing{" "}
                                            <strong>
                                                {activeData.length}
                                            </strong>{" "}
                                            of {activeTotal} records
                                        </div>
                                    </div>

                                    <div style={styles.searchWrapper}>
                                        <span style={styles.searchIcon}>
                                            🔍
                                        </span>

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder={getSearchPlaceholder()}
                                            style={styles.searchInput}
                                        />

                                        {search && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                style={styles.clearButton}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ================= LEDGER ================= */}

                                {activeTab === "ledger" && (
                                    <LedgerTable
                                        data={filteredLedger}
                                        totalDebit={totalDebit}
                                        totalCredit={totalCredit}
                                        ledgerBalance={ledgerBalance}
                                        formatMoney={formatMoney}
                                        formatDate={formatDate}
                                    />
                                )}

                                {/* ================= JOURNAL ================= */}

                                {activeTab === "journal" && (
                                    <JournalTable
                                        data={filteredJournal}
                                        journalTotal={journalTotal}
                                        formatMoney={formatMoney}
                                        formatDate={formatDate}
                                    />
                                )}

                                {/* ================= CASH BOOK ================= */}

                                {activeTab === "cashbook" && (
                                    <CashBookTable
                                        data={filteredCashbook}
                                        totalReceipts={totalReceipts}
                                        totalPayments={totalPayments}
                                        cashBalance={cashBalance}
                                        formatMoney={formatMoney}
                                        formatDate={formatDate}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
    icon,
    label,
    value,
    description,
    iconBackground,
    iconColor,
}) {
    return (
        <div style={styles.summaryCard}>
            <div
                style={{
                    ...styles.summaryIcon,
                    background: iconBackground,
                    color: iconColor,
                }}
            >
                {icon}
            </div>

            <div style={styles.summaryContent}>
                <div style={styles.summaryLabel}>{label}</div>

                <div style={styles.summaryValue}>{value}</div>

                <div style={styles.summaryDescription}>
                    {description}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   TAB BUTTON
========================================================= */

function TabButton({ active, onClick, icon, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                ...styles.tabButton,
                ...(active ? styles.activeTabButton : {}),
            }}
        >
            <span style={styles.tabIcon}>{icon}</span>

            <span>{label}</span>

            <span
                style={{
                    ...styles.tabCount,
                    ...(active ? styles.activeTabCount : {}),
                }}
            >
                {count}
            </span>
        </button>
    );
}

/* =========================================================
   LEDGER TABLE
========================================================= */

function LedgerTable({
    data,
    totalDebit,
    totalCredit,
    ledgerBalance,
    formatMoney,
    formatDate,
}) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon="📘"
                title="No ledger records found"
                description="Ledger transactions will appear here when accounting entries are created."
            />
        );
    }

    return (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Particulars</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>
                            Debit
                        </th>
                        <th style={{ ...styles.th, textAlign: "right" }}>
                            Credit
                        </th>
                        <th style={{ ...styles.th, textAlign: "right" }}>
                            Balance
                        </th>
                        <th style={styles.th}>Reference</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((item) => (
                        <tr key={item.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.dateText}>
                                    {formatDate(item.date)}
                                </div>
                            </td>

                            <td style={styles.td}>
                                <div style={styles.primaryText}>
                                    {item.particulars || "-"}
                                </div>
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                {Number(item.debit || 0) > 0 ? (
                                    <span style={styles.debitAmount}>
                                        ₹{formatMoney(item.debit)}
                                    </span>
                                ) : (
                                    <span style={styles.mutedAmount}>—</span>
                                )}
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                {Number(item.credit || 0) > 0 ? (
                                    <span style={styles.creditAmount}>
                                        ₹{formatMoney(item.credit)}
                                    </span>
                                ) : (
                                    <span style={styles.mutedAmount}>—</span>
                                )}
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                <span style={styles.balanceAmount}>
                                    ₹{formatMoney(item.balance)}
                                </span>
                            </td>

                            <td style={styles.td}>
                                <ReferenceBadge
                                    value={item.reference}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr style={styles.totalRow}>
                        <td
                            colSpan="2"
                            style={{
                                ...styles.totalCell,
                                textAlign: "left",
                            }}
                        >
                            Total
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(totalDebit)}
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(totalCredit)}
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(ledgerBalance)}
                        </td>

                        <td style={styles.totalCell}>—</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

/* =========================================================
   JOURNAL TABLE
========================================================= */

function JournalTable({
    data,
    journalTotal,
    formatMoney,
    formatDate,
}) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon="📝"
                title="No journal entries found"
                description="Journal entries will appear here when transactions are recorded."
            />
        );
    }

    return (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Debit Account</th>
                        <th style={styles.th}>Credit Account</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>
                            Amount
                        </th>
                        <th style={styles.th}>Reference</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((item) => (
                        <tr key={item.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.dateText}>
                                    {formatDate(item.date)}
                                </div>
                            </td>

                            <td style={styles.td}>
                                <div style={styles.primaryText}>
                                    {item.description || "-"}
                                </div>
                            </td>

                            <td style={styles.td}>
                                <AccountBadge
                                    value={item.debit_account}
                                    type="debit"
                                />
                            </td>

                            <td style={styles.td}>
                                <AccountBadge
                                    value={item.credit_account}
                                    type="credit"
                                />
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                <span style={styles.amountStrong}>
                                    ₹{formatMoney(item.amount)}
                                </span>
                            </td>

                            <td style={styles.td}>
                                <ReferenceBadge
                                    value={item.reference}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr style={styles.totalRow}>
                        <td
                            colSpan="4"
                            style={{
                                ...styles.totalCell,
                                textAlign: "left",
                            }}
                        >
                            Total Journal Amount
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(journalTotal)}
                        </td>

                        <td style={styles.totalCell}>—</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

/* =========================================================
   CASH BOOK TABLE
========================================================= */

function CashBookTable({
    data,
    totalReceipts,
    totalPayments,
    cashBalance,
    formatMoney,
    formatDate,
}) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon="💵"
                title="No cash book records found"
                description="Cash receipts and payments will appear here when transactions are created."
            />
        );
    }

    return (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Date</th>
                        <th
                            style={{
                                ...styles.th,
                                textAlign: "right",
                            }}
                        >
                            Receipt
                        </th>
                        <th
                            style={{
                                ...styles.th,
                                textAlign: "right",
                            }}
                        >
                            Payment
                        </th>
                        <th
                            style={{
                                ...styles.th,
                                textAlign: "right",
                            }}
                        >
                            Balance
                        </th>
                        <th style={styles.th}>Remarks</th>
                        <th style={styles.th}>Reference</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((item) => (
                        <tr key={item.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.dateText}>
                                    {formatDate(item.date)}
                                </div>
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                {Number(item.receipt || 0) > 0 ? (
                                    <span style={styles.creditAmount}>
                                        ₹{formatMoney(item.receipt)}
                                    </span>
                                ) : (
                                    <span style={styles.mutedAmount}>—</span>
                                )}
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                {Number(item.payment || 0) > 0 ? (
                                    <span style={styles.debitAmount}>
                                        ₹{formatMoney(item.payment)}
                                    </span>
                                ) : (
                                    <span style={styles.mutedAmount}>—</span>
                                )}
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    textAlign: "right",
                                }}
                            >
                                <span style={styles.balanceAmount}>
                                    ₹{formatMoney(item.balance)}
                                </span>
                            </td>

                            <td style={styles.td}>
                                <div style={styles.secondaryText}>
                                    {item.remarks || "-"}
                                </div>
                            </td>

                            <td style={styles.td}>
                                <ReferenceBadge
                                    value={item.reference}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr style={styles.totalRow}>
                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "left",
                            }}
                        >
                            Total
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(totalReceipts)}
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(totalPayments)}
                        </td>

                        <td
                            style={{
                                ...styles.totalCell,
                                textAlign: "right",
                            }}
                        >
                            ₹{formatMoney(cashBalance)}
                        </td>

                        <td style={styles.totalCell}>—</td>

                        <td style={styles.totalCell}>—</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

/* =========================================================
   BADGES
========================================================= */

function ReferenceBadge({ value }) {
    if (!value) {
        return <span style={styles.mutedAmount}>—</span>;
    }

    return <span style={styles.referenceBadge}>{value}</span>;
}

function AccountBadge({ value, type }) {
    if (!value) {
        return <span style={styles.mutedAmount}>—</span>;
    }

    return (
        <span
            style={{
                ...styles.accountBadge,
                ...(type === "debit"
                    ? styles.debitBadge
                    : styles.creditBadge),
            }}
        >
            {value}
        </span>
    );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ icon, title, description }) {
    return (
        <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>{icon}</div>

            <div style={styles.emptyTitle}>{title}</div>

            <div style={styles.emptyDescription}>
                {description}
            </div>
        </div>
    );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
    return (
        <div style={styles.loadingState}>
            <div style={styles.spinner}></div>

            <div style={styles.loadingTitle}>
                Loading accounting data...
            </div>

            <div style={styles.loadingText}>
                Please wait while we fetch your accounting records.
            </div>
        </div>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        boxSizing: "border-box",
    },

    container: {
        width: "100%",
        maxWidth: "1500px",
        margin: "0 auto",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "28px",
    },

    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },

    titleIcon: {
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: "#2563eb",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        boxShadow: "0 6px 16px rgba(37, 99, 235, 0.20)",
    },

    title: {
        margin: 0,
        fontSize: "30px",
        lineHeight: 1.2,
        fontWeight: 750,
        color: "#111827",
        letterSpacing: "-0.5px",
    },

    subtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "14px",
    },

    refreshButton: {
        border: "1px solid #dbe3ef",
        background: "#ffffff",
        color: "#374151",
        borderRadius: "9px",
        padding: "11px 17px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.05)",
    },

    disabledButton: {
        opacity: 0.65,
        cursor: "not-allowed",
    },

    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "14px 16px",
        marginBottom: "22px",
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "10px",
        color: "#9f1239",
    },

    errorIcon: {
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        background: "#ffe4e6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
    },

    errorTitle: {
        fontSize: "14px",
        fontWeight: 700,
        marginBottom: "2px",
    },

    errorText: {
        fontSize: "13px",
        color: "#be123c",
    },

    retryButton: {
        border: "1px solid #fda4af",
        background: "#ffffff",
        color: "#be123c",
        borderRadius: "7px",
        padding: "8px 13px",
        cursor: "pointer",
        fontWeight: 600,
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "16px",
        marginBottom: "22px",
    },

    summaryCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "13px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
        minHeight: "105px",
        boxSizing: "border-box",
    },

    summaryIcon: {
        width: "45px",
        height: "45px",
        minWidth: "45px",
        borderRadius: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "19px",
        fontWeight: 700,
    },

    summaryContent: {
        minWidth: 0,
    },

    summaryLabel: {
        fontSize: "12px",
        color: "#6b7280",
        fontWeight: 600,
        marginBottom: "4px",
    },

    summaryValue: {
        color: "#111827",
        fontSize: "20px",
        fontWeight: 750,
        whiteSpace: "nowrap",
    },

    summaryDescription: {
        marginTop: "4px",
        fontSize: "11px",
        color: "#9ca3af",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    tabsCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "12px",
        padding: "6px",
        marginBottom: "18px",
        boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
    },

    tabs: {
        display: "flex",
        gap: "5px",
        flexWrap: "wrap",
    },

    tabButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "11px 17px",
        border: "none",
        borderRadius: "8px",
        background: "transparent",
        color: "#6b7280",
        fontSize: "13px",
        fontWeight: 650,
        cursor: "pointer",
        transition: "all 0.15s ease",
    },

    activeTabButton: {
        background: "#111827",
        color: "#ffffff",
        boxShadow: "0 3px 8px rgba(17, 24, 39, 0.16)",
    },

    tabIcon: {
        fontSize: "15px",
    },

    tabCount: {
        minWidth: "23px",
        height: "21px",
        padding: "0 6px",
        borderRadius: "20px",
        background: "#f1f5f9",
        color: "#64748b",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
    },

    activeTabCount: {
        background: "#374151",
        color: "#ffffff",
    },

    contentCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "13px",
        boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
    },

    toolbar: {
        padding: "20px 22px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "18px",
        flexWrap: "wrap",
        borderBottom: "1px solid #edf0f4",
    },

    sectionTitle: {
        fontSize: "17px",
        fontWeight: 750,
        color: "#111827",
    },

    sectionSubtitle: {
        marginTop: "5px",
        fontSize: "12px",
        color: "#9ca3af",
    },

    searchWrapper: {
        position: "relative",
        width: "min(380px, 100%)",
    },

    searchIcon: {
        position: "absolute",
        left: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "14px",
        opacity: 0.65,
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 38px 10px 36px",
        border: "1px solid #dbe3ef",
        borderRadius: "8px",
        outline: "none",
        fontSize: "13px",
        color: "#111827",
        background: "#f9fafb",
    },

    clearButton: {
        position: "absolute",
        right: "8px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "24px",
        height: "24px",
        border: "none",
        borderRadius: "50%",
        background: "#e5e7eb",
        color: "#4b5563",
        cursor: "pointer",
        fontSize: "17px",
        lineHeight: "20px",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        minWidth: "900px",
        borderCollapse: "collapse",
    },

    th: {
        padding: "13px 16px",
        background: "#f8fafc",
        borderBottom: "1px solid #e5e7eb",
        color: "#64748b",
        fontSize: "11px",
        fontWeight: 750,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        textAlign: "left",
        whiteSpace: "nowrap",
    },

    td: {
        padding: "14px 16px",
        borderBottom: "1px solid #f0f2f5",
        color: "#374151",
        fontSize: "13px",
        verticalAlign: "middle",
    },

    tr: {
        transition: "background 0.15s ease",
    },

    dateText: {
        color: "#4b5563",
        fontSize: "12px",
        whiteSpace: "nowrap",
    },

    primaryText: {
        color: "#111827",
        fontWeight: 600,
        maxWidth: "280px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    secondaryText: {
        color: "#6b7280",
        maxWidth: "260px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    debitAmount: {
        color: "#dc2626",
        fontWeight: 650,
        whiteSpace: "nowrap",
    },

    creditAmount: {
        color: "#16a34a",
        fontWeight: 650,
        whiteSpace: "nowrap",
    },

    amountStrong: {
        color: "#111827",
        fontWeight: 700,
        whiteSpace: "nowrap",
    },

    balanceAmount: {
        color: "#2563eb",
        fontWeight: 700,
        whiteSpace: "nowrap",
    },

    mutedAmount: {
        color: "#cbd5e1",
    },

    referenceBadge: {
        display: "inline-block",
        maxWidth: "170px",
        padding: "4px 8px",
        borderRadius: "5px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "11px",
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
    },

    accountBadge: {
        display: "inline-block",
        padding: "5px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 650,
        maxWidth: "160px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    debitBadge: {
        background: "#fef2f2",
        color: "#b91c1c",
    },

    creditBadge: {
        background: "#f0fdf4",
        color: "#15803d",
    },

    totalRow: {
        background: "#f8fafc",
        borderTop: "2px solid #e2e8f0",
    },

    totalCell: {
        padding: "14px 16px",
        color: "#111827",
        fontSize: "13px",
        fontWeight: 750,
        whiteSpace: "nowrap",
    },

    emptyState: {
        padding: "75px 25px",
        textAlign: "center",
    },

    emptyIcon: {
        width: "58px",
        height: "58px",
        margin: "0 auto 15px",
        borderRadius: "50%",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
    },

    emptyTitle: {
        color: "#374151",
        fontSize: "16px",
        fontWeight: 700,
    },

    emptyDescription: {
        maxWidth: "460px",
        margin: "7px auto 0",
        color: "#9ca3af",
        fontSize: "13px",
        lineHeight: 1.6,
    },

    loadingState: {
        padding: "85px 20px",
        textAlign: "center",
    },

    spinner: {
        width: "32px",
        height: "32px",
        margin: "0 auto 15px",
        border: "3px solid #e5e7eb",
        borderTop: "3px solid #2563eb",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },

    loadingTitle: {
        fontSize: "14px",
        fontWeight: 650,
        color: "#374151",
    },

    loadingText: {
        marginTop: "5px",
        color: "#9ca3af",
        fontSize: "12px",
    },
};

export default Accounting;