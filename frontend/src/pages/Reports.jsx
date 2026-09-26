import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

const Reports = () => {
    const [dashboard, setDashboard] = useState(null);
    const [profitLoss, setProfitLoss] = useState(null);
    const [trialBalance, setTrialBalance] = useState(null);
    const [balanceSheet, setBalanceSheet] = useState(null);

    const [monthlyReport, setMonthlyReport] = useState(null);
    const [yearlyReport, setYearlyReport] = useState(null);
    const [dateRangeReport, setDateRangeReport] = useState(null);

    const [month, setMonth] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [trialSearch, setTrialSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [yearlyLoading, setYearlyLoading] = useState(false);
    const [dateRangeLoading, setDateRangeLoading] = useState(false);
    const [trialLoading, setTrialLoading] = useState(false);

    const money = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // =========================================================
    // LOAD MAIN REPORTS
    // =========================================================

    const loadReports = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [
                dashboardRes,
                profitLossRes,
                trialBalanceRes,
                balanceSheetRes,
            ] = await Promise.all([
                api.get("reports/"),
                api.get("reports/profit-loss/"),
                api.get("reports/trial-balance/"),
                api.get("reports/balance-sheet/"),
            ]);

            setDashboard(dashboardRes.data);
            setProfitLoss(profitLossRes.data);
            setTrialBalance(trialBalanceRes.data);
            setBalanceSheet(balanceSheetRes.data);
        } catch (err) {
            console.error("Reports API error:", err);

            if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
            } else {
                setError(
                    err.response?.data?.detail ||
                        "Failed to load reports. Please try again."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    // =========================================================
    // MONTHLY REPORT
    // =========================================================

    const loadMonthlyReport = async () => {
        if (!month) {
            setError("Please select a month.");
            return;
        }

        try {
            setMonthlyLoading(true);
            setError("");

            const response = await api.get(
                `reports/monthly-report/?month=${month}`
            );

            setMonthlyReport(response.data);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                    "Failed to load monthly report."
            );
        } finally {
            setMonthlyLoading(false);
        }
    };

    // =========================================================
    // YEARLY REPORT
    // =========================================================

    const loadYearlyReport = async () => {
        if (!year) {
            setError("Please enter a year.");
            return;
        }

        try {
            setYearlyLoading(true);
            setError("");

            const response = await api.get(
                `reports/yearly-report/?year=${year}`
            );

            setYearlyReport(response.data);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                    "Failed to load yearly report."
            );
        } finally {
            setYearlyLoading(false);
        }
    };

    // =========================================================
    // DATE RANGE REPORT
    // =========================================================

    const loadDateRangeReport = async () => {
        if (!fromDate || !toDate) {
            setError("Please select both dates.");
            return;
        }

        if (fromDate > toDate) {
            setError("From Date cannot be later than To Date.");
            return;
        }

        try {
            setDateRangeLoading(true);
            setError("");

            const response = await api.get(
                `reports/date-range/?from_date=${fromDate}&to_date=${toDate}`
            );

            setDateRangeReport(response.data);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                    "Failed to load date range report."
            );
        } finally {
            setDateRangeLoading(false);
        }
    };

    // =========================================================
    // TRIAL BALANCE SEARCH
    // =========================================================

    const searchTrialBalance = async () => {
        try {
            setTrialLoading(true);
            setError("");

            const response = await api.get(
                `reports/trial-balance/?search=${encodeURIComponent(
                    trialSearch
                )}`
            );

            setTrialBalance(response.data);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                    "Failed to search trial balance."
            );
        } finally {
            setTrialLoading(false);
        }
    };

    const clearTrialSearch = async () => {
        setTrialSearch("");

        try {
            setTrialLoading(true);
            setError("");

            const response = await api.get("reports/trial-balance/");
            setTrialBalance(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to reset trial balance.");
        } finally {
            setTrialLoading(false);
        }
    };

    // =========================================================
    // CHART DATA
    // =========================================================

    const chartData = useMemo(() => {
        if (!dashboard?.months?.length) {
            return [];
        }

        return dashboard.months.map((monthName, index) => ({
            month: monthName,
            sales: Number(dashboard.sales_totals?.[index] || 0),
            purchases: Number(
                dashboard.purchase_totals?.[index] || 0
            ),
            expenses: Number(
                dashboard.expense_totals?.[index] || 0
            ),
        }));
    }, [dashboard]);

    // =========================================================
    // LOADING SCREEN
    // =========================================================

    if (loading) {
        return (
            <Layout>
                <div style={styles.loadingPage}>
                    <div style={styles.spinner}></div>

                    <div style={styles.loadingTitle}>
                        Loading reports...
                    </div>

                    <div style={styles.loadingText}>
                        Preparing your financial reports.
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={styles.page}>
                <div style={styles.container}>
                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.titleIcon}>📊</div>

                            <div>
                                <h1 style={styles.title}>Reports</h1>

                                <p style={styles.subtitle}>
                                    Financial overview and business
                                    performance reports
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadReports(true)}
                            disabled={refreshing}
                            style={{
                                ...styles.refreshButton,
                                ...(refreshing
                                    ? styles.disabledButton
                                    : {}),
                            }}
                        >
                            <span style={styles.refreshIcon}>↻</span>

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>
                    </div>

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <div style={styles.errorBox}>
                            <div style={styles.errorIcon}>!</div>

                            <div style={styles.errorContent}>
                                <div style={styles.errorTitle}>
                                    Report request failed
                                </div>

                                <div style={styles.errorMessage}>
                                    {error}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                }}
                                style={styles.errorClose}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        SUMMARY CARDS
                    ================================================= */}

                    {dashboard && (
                        <div style={styles.summaryGrid}>
                            <SummaryCard
                                icon="💰"
                                label="Total Sales"
                                value={money(
                                    dashboard.total_sales
                                )}
                                description="Total revenue"
                                background="#eff6ff"
                                color="#2563eb"
                            />

                            <SummaryCard
                                icon="🛒"
                                label="Total Purchases"
                                value={money(
                                    dashboard.total_purchases
                                )}
                                description="Total purchases"
                                background="#fff7ed"
                                color="#ea580c"
                            />

                            <SummaryCard
                                icon="💸"
                                label="Total Expenses"
                                value={money(
                                    dashboard.total_expenses
                                )}
                                description="Business expenses"
                                background="#fef2f2"
                                color="#dc2626"
                            />

                            <SummaryCard
                                icon="📈"
                                label="Net Profit"
                                value={money(
                                    dashboard.profit
                                )}
                                description="Sales - purchases - expenses"
                                background="#ecfdf5"
                                color="#059669"
                            />
                        </div>
                    )}

                    {/* =================================================
                        MONTHLY OVERVIEW
                    ================================================= */}

                    {dashboard && (
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Monthly Overview
                                    </h2>

                                    <p style={styles.sectionSubtitle}>
                                        Compare sales, purchases and
                                        expenses throughout the year
                                    </p>
                                </div>

                                <div style={styles.chartLegend}>
                                    <Legend
                                        color="#2563eb"
                                        label="Sales"
                                    />

                                    <Legend
                                        color="#f59e0b"
                                        label="Purchases"
                                    />

                                    <Legend
                                        color="#ef4444"
                                        label="Expenses"
                                    />
                                </div>
                            </div>

                            {chartData.length > 0 ? (
                                <div style={styles.chartArea}>
                                    {chartData.map(
                                        (item, index) => {
                                            const maxValue =
                                                Math.max(
                                                    item.sales,
                                                    item.purchases,
                                                    item.expenses,
                                                    1
                                                );

                                            const salesHeight =
                                                Math.max(
                                                    (item.sales /
                                                        maxValue) *
                                                        175,
                                                    item.sales > 0
                                                        ? 5
                                                        : 0
                                                );

                                            const purchaseHeight =
                                                Math.max(
                                                    (item.purchases /
                                                        maxValue) *
                                                        175,
                                                    item.purchases >
                                                        0
                                                        ? 5
                                                        : 0
                                                );

                                            const expenseHeight =
                                                Math.max(
                                                    (item.expenses /
                                                        maxValue) *
                                                        175,
                                                    item.expenses >
                                                        0
                                                        ? 5
                                                        : 0
                                                );

                                            return (
                                                <div
                                                    key={`${item.month}-${index}`}
                                                    style={
                                                        styles.chartColumn
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.chartBars
                                                        }
                                                    >
                                                        <div
                                                            title={`Sales: ${money(
                                                                item.sales
                                                            )}`}
                                                            style={{
                                                                ...styles.chartBar,
                                                                height: `${salesHeight}px`,
                                                                background:
                                                                    "#2563eb",
                                                            }}
                                                        />

                                                        <div
                                                            title={`Purchases: ${money(
                                                                item.purchases
                                                            )}`}
                                                            style={{
                                                                ...styles.chartBar,
                                                                height: `${purchaseHeight}px`,
                                                                background:
                                                                    "#f59e0b",
                                                            }}
                                                        />

                                                        <div
                                                            title={`Expenses: ${money(
                                                                item.expenses
                                                            )}`}
                                                            style={{
                                                                ...styles.chartBar,
                                                                height: `${expenseHeight}px`,
                                                                background:
                                                                    "#ef4444",
                                                            }}
                                                        />
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.monthLabel
                                                        }
                                                    >
                                                        {item.month}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            ) : (
                                <EmptyReport
                                    icon="📈"
                                    title="No monthly data available"
                                    description="Monthly financial data will appear here when transactions are recorded."
                                />
                            )}
                        </div>
                    )}

                    {/* =================================================
                        PROFIT & LOSS
                    ================================================= */}

                    {profitLoss && (
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Profit & Loss
                                    </h2>

                                    <p style={styles.sectionSubtitle}>
                                        Summary of revenue, purchases
                                        and expenses
                                    </p>
                                </div>

                                <div
                                    style={{
                                        ...styles.statusBadge,
                                        background:
                                            Number(
                                                profitLoss.net_profit ||
                                                    0
                                            ) >= 0
                                                ? "#ecfdf5"
                                                : "#fef2f2",
                                        color:
                                            Number(
                                                profitLoss.net_profit ||
                                                    0
                                            ) >= 0
                                                ? "#047857"
                                                : "#b91c1c",
                                    }}
                                >
                                    {Number(
                                        profitLoss.net_profit || 0
                                    ) >= 0
                                        ? "Profit"
                                        : "Loss"}
                                </div>
                            </div>

                            <div style={styles.profitLossGrid}>
                                <ReportMetric
                                    label="Sales"
                                    value={money(
                                        profitLoss.sales
                                    )}
                                />

                                <ReportMetric
                                    label="Purchases"
                                    value={money(
                                        profitLoss.purchases
                                    )}
                                />

                                <ReportMetric
                                    label="Gross Profit"
                                    value={money(
                                        profitLoss.gross_profit
                                    )}
                                    highlighted
                                />

                                <ReportMetric
                                    label="Expenses"
                                    value={money(
                                        profitLoss.expenses
                                    )}
                                />

                                <div style={styles.netProfitCard}>
                                    <div>
                                        <div
                                            style={
                                                styles.netProfitLabel
                                            }
                                        >
                                            Net Profit
                                        </div>

                                        <div
                                            style={
                                                styles.netProfitDescription
                                            }
                                        >
                                            Final business result
                                        </div>
                                    </div>

                                    <div
                                        style={
                                            styles.netProfitValue
                                        }
                                    >
                                        {money(
                                            profitLoss.net_profit
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =================================================
                        BALANCE SHEET
                    ================================================= */}

                    {balanceSheet && (
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Balance Sheet
                                    </h2>

                                    <p style={styles.sectionSubtitle}>
                                        Overview of business assets,
                                        liabilities and capital
                                    </p>
                                </div>
                            </div>

                            <div style={styles.balanceGrid}>
                                <BalanceCard
                                    icon="💵"
                                    label="Cash"
                                    value={money(
                                        balanceSheet.cash
                                    )}
                                    background="#eff6ff"
                                    color="#2563eb"
                                />

                                <BalanceCard
                                    icon="📦"
                                    label="Inventory"
                                    value={money(
                                        balanceSheet.inventory
                                    )}
                                    background="#f5f3ff"
                                    color="#7c3aed"
                                />

                                <BalanceCard
                                    icon="🏦"
                                    label="Total Assets"
                                    value={money(
                                        balanceSheet.assets
                                    )}
                                    background="#ecfdf5"
                                    color="#059669"
                                />

                                <BalanceCard
                                    icon="📋"
                                    label="Liabilities"
                                    value={money(
                                        balanceSheet.liabilities
                                    )}
                                    background="#fff7ed"
                                    color="#ea580c"
                                />

                                <BalanceCard
                                    icon="💼"
                                    label="Capital"
                                    value={money(
                                        balanceSheet.capital
                                    )}
                                    background="#f0fdf4"
                                    color="#16a34a"
                                />
                            </div>
                        </div>
                    )}

                    {/* =================================================
                        TRIAL BALANCE
                    ================================================= */}

                    {trialBalance && (
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Trial Balance
                                    </h2>

                                    <p style={styles.sectionSubtitle}>
                                        Ledger debit and credit
                                        summary
                                    </p>
                                </div>

                                <div style={styles.trialSearch}>
                                    <div
                                        style={
                                            styles.searchInputWrapper
                                        }
                                    >
                                        <span
                                            style={
                                                styles.searchIcon
                                            }
                                        >
                                            🔍
                                        </span>

                                        <input
                                            type="text"
                                            placeholder="Search particulars..."
                                            value={trialSearch}
                                            onChange={(e) =>
                                                setTrialSearch(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key ===
                                                    "Enter"
                                                ) {
                                                    searchTrialBalance();
                                                }
                                            }}
                                            style={
                                                styles.searchInput
                                            }
                                        />

                                        {trialSearch && (
                                            <button
                                                type="button"
                                                onClick={
                                                    clearTrialSearch
                                                }
                                                style={
                                                    styles.searchClear
                                                }
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        style={{
                                            ...styles.primaryButton,
                                            ...(trialLoading
                                                ? styles.disabledButton
                                                : {}),
                                        }}
                                        onClick={
                                            searchTrialBalance
                                        }
                                        disabled={trialLoading}
                                    >
                                        {trialLoading
                                            ? "Searching..."
                                            : "Search"}
                                    </button>
                                </div>
                            </div>

                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>
                                                Particulars
                                            </th>

                                            <th
                                                style={{
                                                    ...styles.th,
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                Debit
                                            </th>

                                            <th
                                                style={{
                                                    ...styles.th,
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                Credit
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {trialBalance
                                            .ledger_entries
                                            ?.length > 0 ? (
                                            trialBalance.ledger_entries.map(
                                                (
                                                    entry,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                        style={
                                                            styles.tableRow
                                                        }
                                                    >
                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            <span
                                                                style={
                                                                    styles.particularText
                                                                }
                                                            >
                                                                {
                                                                    entry.particulars
                                                                }
                                                            </span>
                                                        </td>

                                                        <td
                                                            style={{
                                                                ...styles.td,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            <span
                                                                style={
                                                                    styles.debitAmount
                                                                }
                                                            >
                                                                {money(
                                                                    entry.total_debit
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td
                                                            style={{
                                                                ...styles.td,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            <span
                                                                style={
                                                                    styles.creditAmount
                                                                }
                                                            >
                                                                {money(
                                                                    entry.total_credit
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    style={
                                                        styles.emptyCell
                                                    }
                                                >
                                                    No ledger
                                                    entries found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                    <tfoot>
                                        <tr
                                            style={
                                                styles.totalRow
                                            }
                                        >
                                            <td
                                                style={
                                                    styles.totalCell
                                                }
                                            >
                                                Total
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.totalCell,
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                {money(
                                                    trialBalance.total_debit
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.totalCell,
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                {money(
                                                    trialBalance.total_credit
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =================================================
                        PERIOD REPORTS
                    ================================================= */}

                    <div style={styles.periodGrid}>
                        {/* MONTHLY */}

                        <div style={styles.periodSection}>
                            <div style={styles.periodHeader}>
                                <div style={styles.periodIcon}>
                                    📅
                                </div>

                                <div>
                                    <h2
                                        style={
                                            styles.periodTitle
                                        }
                                    >
                                        Monthly Report
                                    </h2>

                                    <p
                                        style={
                                            styles.periodSubtitle
                                        }
                                    >
                                        View financial results for
                                        a specific month
                                    </p>
                                </div>
                            </div>

                            <div style={styles.filterGroup}>
                                <label style={styles.label}>
                                    Month
                                </label>

                                <select
                                    value={month}
                                    onChange={(e) =>
                                        setMonth(
                                            e.target.value
                                        )
                                    }
                                    style={styles.input}
                                >
                                    <option value="">
                                        Select Month
                                    </option>

                                    <option value="1">
                                        January
                                    </option>

                                    <option value="2">
                                        February
                                    </option>

                                    <option value="3">
                                        March
                                    </option>

                                    <option value="4">
                                        April
                                    </option>

                                    <option value="5">
                                        May
                                    </option>

                                    <option value="6">
                                        June
                                    </option>

                                    <option value="7">
                                        July
                                    </option>

                                    <option value="8">
                                        August
                                    </option>

                                    <option value="9">
                                        September
                                    </option>

                                    <option value="10">
                                        October
                                    </option>

                                    <option value="11">
                                        November
                                    </option>

                                    <option value="12">
                                        December
                                    </option>
                                </select>

                                <button
                                    type="button"
                                    style={{
                                        ...styles.primaryButton,
                                        ...(monthlyLoading ||
                                        !month
                                            ? styles.disabledButton
                                            : {}),
                                    }}
                                    onClick={
                                        loadMonthlyReport
                                    }
                                    disabled={
                                        monthlyLoading ||
                                        !month
                                    }
                                >
                                    {monthlyLoading
                                        ? "Generating..."
                                        : "Generate Report"}
                                </button>
                            </div>

                            {monthlyReport && (
                                <PeriodResult
                                    data={monthlyReport}
                                />
                            )}
                        </div>

                        {/* YEARLY */}

                        <div style={styles.periodSection}>
                            <div style={styles.periodHeader}>
                                <div style={styles.periodIcon}>
                                    📆
                                </div>

                                <div>
                                    <h2
                                        style={
                                            styles.periodTitle
                                        }
                                    >
                                        Yearly Report
                                    </h2>

                                    <p
                                        style={
                                            styles.periodSubtitle
                                        }
                                    >
                                        View financial results for
                                        a complete year
                                    </p>
                                </div>
                            </div>

                            <div style={styles.filterGroup}>
                                <label style={styles.label}>
                                    Year
                                </label>

                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) =>
                                        setYear(
                                            e.target.value
                                        )
                                    }
                                    style={styles.input}
                                    placeholder="Year"
                                    min="2000"
                                    max="2100"
                                />

                                <button
                                    type="button"
                                    style={{
                                        ...styles.primaryButton,
                                        ...(yearlyLoading
                                            ? styles.disabledButton
                                            : {}),
                                    }}
                                    onClick={
                                        loadYearlyReport
                                    }
                                    disabled={yearlyLoading}
                                >
                                    {yearlyLoading
                                        ? "Generating..."
                                        : "Generate Report"}
                                </button>
                            </div>

                            {yearlyReport && (
                                <PeriodResult
                                    data={yearlyReport}
                                />
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        DATE RANGE
                    ================================================= */}

                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <div style={styles.periodHeader}>
                                <div style={styles.periodIcon}>
                                    🗓️
                                </div>

                                <div>
                                    <h2
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Date Range Report
                                    </h2>

                                    <p
                                        style={
                                            styles.sectionSubtitle
                                        }
                                    >
                                        Analyze business performance
                                        between two dates
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={styles.dateRangeForm}>
                            <div style={styles.dateField}>
                                <label style={styles.label}>
                                    From Date
                                </label>

                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                        setFromDate(
                                            e.target.value
                                        )
                                    }
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.dateField}>
                                <label style={styles.label}>
                                    To Date
                                </label>

                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) =>
                                        setToDate(
                                            e.target.value
                                        )
                                    }
                                    style={styles.input}
                                />
                            </div>

                            <button
                                type="button"
                                style={{
                                    ...styles.primaryButton,
                                    ...(dateRangeLoading
                                        ? styles.disabledButton
                                        : {}),
                                }}
                                onClick={
                                    loadDateRangeReport
                                }
                                disabled={dateRangeLoading}
                            >
                                {dateRangeLoading
                                    ? "Generating..."
                                    : "Generate Report"}
                            </button>
                        </div>

                        {dateRangeReport && (
                            <PeriodResult
                                data={dateRangeReport}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
    icon,
    label,
    value,
    description,
    background,
    color,
}) {
    return (
        <div style={styles.summaryCard}>
            <div
                style={{
                    ...styles.summaryIcon,
                    background,
                    color,
                }}
            >
                {icon}
            </div>

            <div style={styles.summaryContent}>
                <div style={styles.summaryLabel}>
                    {label}
                </div>

                <div style={styles.summaryValue}>
                    {value}
                </div>

                <div style={styles.summaryDescription}>
                    {description}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   LEGEND
========================================================= */

function Legend({ color, label }) {
    return (
        <span style={styles.legendItem}>
            <span
                style={{
                    ...styles.legendDot,
                    background: color,
                }}
            />

            {label}
        </span>
    );
}

/* =========================================================
   REPORT METRIC
========================================================= */

function ReportMetric({
    label,
    value,
    highlighted = false,
}) {
    return (
        <div
            style={{
                ...styles.metricCard,
                ...(highlighted
                    ? styles.highlightMetric
                    : {}),
            }}
        >
            <div style={styles.metricLabel}>{label}</div>

            <div style={styles.metricValue}>{value}</div>
        </div>
    );
}

/* =========================================================
   BALANCE CARD
========================================================= */

function BalanceCard({
    icon,
    label,
    value,
    background,
    color,
}) {
    return (
        <div style={styles.balanceCard}>
            <div
                style={{
                    ...styles.balanceIcon,
                    background,
                    color,
                }}
            >
                {icon}
            </div>

            <div style={styles.balanceLabel}>
                {label}
            </div>

            <div style={styles.balanceValue}>
                {value}
            </div>
        </div>
    );
}

/* =========================================================
   PERIOD RESULT
========================================================= */

function PeriodResult({ data }) {
    return (
        <div style={styles.resultGrid}>
            <ResultMetric
                label="Sales"
                value={data.sales}
                color="#2563eb"
            />

            <ResultMetric
                label="Purchases"
                value={data.purchases}
                color="#ea580c"
            />

            <ResultMetric
                label="Expenses"
                value={data.expenses}
                color="#dc2626"
            />

            <ResultMetric
                label="Profit"
                value={data.profit}
                color="#059669"
            />
        </div>
    );
}

/* =========================================================
   RESULT METRIC
========================================================= */

function ResultMetric({ label, value, color }) {
    return (
        <div style={styles.resultCard}>
            <div
                style={{
                    ...styles.resultAccent,
                    background: color,
                }}
            />

            <div>
                <div style={styles.resultLabel}>
                    {label}
                </div>

                <div style={styles.resultValue}>
                    ₹
                    {Number(value || 0).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   EMPTY REPORT
========================================================= */

function EmptyReport({
    icon,
    title,
    description,
}) {
    return (
        <div style={styles.emptyReport}>
            <div style={styles.emptyReportIcon}>
                {icon}
            </div>

            <div style={styles.emptyReportTitle}>
                {title}
            </div>

            <div style={styles.emptyReportDescription}>
                {description}
            </div>
        </div>
    );
};

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

    loadingPage: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },

    spinner: {
        width: "34px",
        height: "34px",
        border: "3px solid #e5e7eb",
        borderTop: "3px solid #2563eb",
        borderRadius: "50%",
        marginBottom: "15px",
    },

    loadingTitle: {
        fontSize: "15px",
        fontWeight: 700,
        color: "#374151",
    },

    loadingText: {
        marginTop: "5px",
        color: "#9ca3af",
        fontSize: "12px",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "28px",
    },

    headerLeft: {
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
        boxShadow:
            "0 6px 16px rgba(37, 99, 235, 0.20)",
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
        boxShadow:
            "0 2px 6px rgba(15, 23, 42, 0.05)",
    },

    refreshIcon: {
        marginRight: "7px",
        fontSize: "16px",
    },

    disabledButton: {
        opacity: 0.6,
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
    },

    errorIcon: {
        width: "30px",
        height: "30px",
        minWidth: "30px",
        borderRadius: "50%",
        background: "#ffe4e6",
        color: "#be123c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
    },

    errorContent: {
        flex: 1,
    },

    errorTitle: {
        color: "#9f1239",
        fontSize: "14px",
        fontWeight: 700,
    },

    errorMessage: {
        marginTop: "2px",
        color: "#be123c",
        fontSize: "13px",
    },

    errorClose: {
        border: "none",
        background: "transparent",
        color: "#9f1239",
        fontSize: "22px",
        cursor: "pointer",
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
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
        boxShadow:
            "0 3px 10px rgba(15, 23, 42, 0.04)",
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
    },

    section: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "13px",
        padding: "22px",
        marginBottom: "20px",
        boxShadow:
            "0 3px 10px rgba(15, 23, 42, 0.04)",
        boxSizing: "border-box",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "20px",
    },

    sectionTitle: {
        margin: 0,
        color: "#111827",
        fontSize: "18px",
        fontWeight: 750,
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#9ca3af",
        fontSize: "12px",
    },

    chartLegend: {
        display: "flex",
        alignItems: "center",
        gap: "17px",
        flexWrap: "wrap",
        fontSize: "12px",
        color: "#64748b",
    },

    legendItem: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
    },

    legendDot: {
        width: "9px",
        height: "9px",
        borderRadius: "50%",
        display: "inline-block",
    },

    chartArea: {
        display: "flex",
        alignItems: "flex-end",
        gap: "22px",
        minHeight: "245px",
        overflowX: "auto",
        padding: "20px 10px 5px",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
    },

    chartColumn: {
        minWidth: "58px",
        flex: "0 0 auto",
        textAlign: "center",
    },

    chartBars: {
        height: "185px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "4px",
    },

    chartBar: {
        width: "13px",
        minHeight: "0",
        borderRadius: "4px 4px 0 0",
        transition: "height 0.2s ease",
    },

    monthLabel: {
        marginTop: "10px",
        color: "#64748b",
        fontSize: "11px",
        whiteSpace: "nowrap",
    },

    statusBadge: {
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
    },

    profitLossGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
    },

    metricCard: {
        border: "1px solid #e8edf4",
        borderRadius: "10px",
        padding: "16px",
        background: "#fafbfc",
    },

    highlightMetric: {
        background: "#f8fafc",
        borderColor: "#dbe3ef",
    },

    metricLabel: {
        color: "#6b7280",
        fontSize: "12px",
        fontWeight: 600,
    },

    metricValue: {
        marginTop: "7px",
        color: "#111827",
        fontSize: "18px",
        fontWeight: 750,
    },

    netProfitCard: {
        gridColumn: "1 / -1",
        padding: "17px 18px",
        borderRadius: "10px",
        background: "#111827",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
    },

    netProfitLabel: {
        fontSize: "14px",
        fontWeight: 700,
    },

    netProfitDescription: {
        marginTop: "3px",
        color: "#9ca3af",
        fontSize: "11px",
    },

    netProfitValue: {
        fontSize: "22px",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },

    balanceGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
    },

    balanceCard: {
        border: "1px solid #e8edf4",
        borderRadius: "11px",
        padding: "17px",
        background: "#ffffff",
    },

    balanceIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        marginBottom: "12px",
    },

    balanceLabel: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: 600,
    },

    balanceValue: {
        marginTop: "5px",
        color: "#111827",
        fontSize: "18px",
        fontWeight: 750,
    },

    trialSearch: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
    },

    searchInputWrapper: {
        position: "relative",
        width: "260px",
    },

    searchIcon: {
        position: "absolute",
        left: "11px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "13px",
        opacity: 0.65,
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 34px 10px 34px",
        border: "1px solid #dbe3ef",
        borderRadius: "8px",
        outline: "none",
        fontSize: "13px",
        background: "#f9fafb",
        color: "#111827",
    },

    searchClear: {
        position: "absolute",
        right: "7px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "23px",
        height: "23px",
        border: "none",
        borderRadius: "50%",
        background: "#e5e7eb",
        color: "#4b5563",
        cursor: "pointer",
        fontSize: "16px",
        lineHeight: "20px",
    },

    primaryButton: {
        border: "none",
        borderRadius: "8px",
        padding: "10px 15px",
        background: "#2563eb",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 650,
        whiteSpace: "nowrap",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        minWidth: "650px",
        borderCollapse: "collapse",
    },

    th: {
        padding: "13px 15px",
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
        padding: "14px 15px",
        borderBottom: "1px solid #f0f2f5",
        color: "#374151",
        fontSize: "13px",
        verticalAlign: "middle",
    },

    tableRow: {
        transition: "background 0.15s ease",
    },

    particularText: {
        color: "#111827",
        fontWeight: 600,
    },

    debitAmount: {
        color: "#dc2626",
        fontWeight: 650,
    },

    creditAmount: {
        color: "#16a34a",
        fontWeight: 650,
    },

    totalRow: {
        background: "#f8fafc",
        borderTop: "2px solid #e2e8f0",
    },

    totalCell: {
        padding: "14px 15px",
        color: "#111827",
        fontSize: "13px",
        fontWeight: 750,
        whiteSpace: "nowrap",
    },

    emptyCell: {
        padding: "45px 20px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "13px",
    },

    periodGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "20px",
        marginBottom: "20px",
    },

    periodSection: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "13px",
        padding: "22px",
        boxShadow:
            "0 3px 10px rgba(15, 23, 42, 0.04)",
    },

    periodHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    periodIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
    },

    periodTitle: {
        margin: 0,
        color: "#111827",
        fontSize: "17px",
        fontWeight: 750,
    },

    periodSubtitle: {
        margin: "4px 0 0",
        color: "#9ca3af",
        fontSize: "11px",
        lineHeight: 1.5,
    },

    filterGroup: {
        display: "flex",
        alignItems: "flex-end",
        gap: "9px",
        marginTop: "22px",
        flexWrap: "wrap",
    },

    dateRangeForm: {
        display: "flex",
        alignItems: "flex-end",
        gap: "12px",
        flexWrap: "wrap",
    },

    dateField: {
        minWidth: "190px",
    },

    label: {
        display: "block",
        marginBottom: "6px",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: 650,
    },

    input: {
        minHeight: "40px",
        padding: "9px 11px",
        border: "1px solid #dbe3ef",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#111827",
        fontSize: "13px",
        outline: "none",
        boxSizing: "border-box",
    },

    resultGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "10px",
        marginTop: "20px",
    },

    resultCard: {
        position: "relative",
        overflow: "hidden",
        border: "1px solid #e8edf4",
        borderRadius: "9px",
        padding: "14px 14px 14px 17px",
        background: "#fafbfc",
    },

    resultAccent: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "3px",
    },

    resultLabel: {
        color: "#64748b",
        fontSize: "11px",
        fontWeight: 600,
    },

    resultValue: {
        marginTop: "5px",
        color: "#111827",
        fontSize: "16px",
        fontWeight: 750,
    },

    emptyReport: {
        padding: "55px 20px",
        textAlign: "center",
        border: "1px dashed #dbe3ef",
        borderRadius: "10px",
        background: "#fafbfc",
    },

    emptyReportIcon: {
        width: "48px",
        height: "48px",
        margin: "0 auto 12px",
        borderRadius: "50%",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
    },

    emptyReportTitle: {
        color: "#374151",
        fontSize: "14px",
        fontWeight: 700,
    },

    emptyReportDescription: {
        maxWidth: "430px",
        margin: "5px auto 0",
        color: "#9ca3af",
        fontSize: "12px",
        lineHeight: 1.5,
    },
};

export default Reports;