import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Purchases() {
    const today = new Date().toISOString().split("T")[0];

    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessSettings, setBusinessSettings] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);

    const [form, setForm] = useState({
        supplier: "",
        invoice_number: "",
        purchase_date: today,
    });

    const [items, setItems] = useState([
        {
            product: "",
            quantity: 1,
            purchase_price: "",
            subtotal: 0,
        },
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                purchasesRes,
                suppliersRes,
                productsRes,
                businessSettingsRes,
            ] = await Promise.all([
                api.get("purchases/"),
                api.get("suppliers/"),
                api.get("products/"),
                api.get("business-settings/"),
            ]);

            setPurchases(
                purchasesRes.data.results ||
                    purchasesRes.data ||
                    []
            );

            setSuppliers(
                suppliersRes.data.results ||
                    suppliersRes.data ||
                    []
            );

            setProducts(
                productsRes.data.results ||
                    productsRes.data ||
                    []
            );

            const businessData =
                businessSettingsRes.data.results ||
                businessSettingsRes.data ||
                [];

            setBusinessSettings(
                Array.isArray(businessData)
                    ? businessData[0] || null
                    : businessData
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                    "Failed to load purchases data."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            supplier: "",
            invoice_number: "",
            purchase_date: today,
        });

        setItems([
            {
                product: "",
                quantity: 1,
                purchase_price: "",
                subtotal: 0,
            },
        ]);

        setEditingId(null);
        setShowForm(false);
    };

    const openAddForm = () => {
        setSuccess("");
        setError("");

        setForm({
            supplier: "",
            invoice_number: "",
            purchase_date: today,
        });

        setItems([
            {
                product: "",
                quantity: 1,
                purchase_price: "",
                subtotal: 0,
            },
        ]);

        setEditingId(null);
        setShowForm(true);
    };

    const openEditForm = (purchase) => {
        setSuccess("");
        setError("");

        const purchaseItems =
            purchase.purchase_items ||
            purchase.items ||
            [];

        setForm({
            supplier: purchase.supplier || "",
            invoice_number:
                purchase.invoice_number || "",
            purchase_date:
                purchase.purchase_date || today,
        });

        if (purchaseItems.length > 0) {
            setItems(
                purchaseItems.map((item) => ({
                    product: item.product,
                    quantity: item.quantity,
                    purchase_price:
                        item.purchase_price,
                    subtotal:
                        Number(item.quantity) *
                        Number(item.purchase_price),
                }))
            );
        } else {
            setItems([
                {
                    product: "",
                    quantity: 1,
                    purchase_price: "",
                    subtotal: 0,
                },
            ]);
        }

        setEditingId(purchase.id);
        setShowForm(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleProductChange = (
        index,
        productId
    ) => {
        setItems((previous) => {
            const updated = [...previous];

            const selectedProduct = products.find(
                (product) =>
                    String(product.id) ===
                    String(productId)
            );

            updated[index] = {
                ...updated[index],
                product: productId,
                purchase_price:
                    selectedProduct?.purchase_price ?? "",
            };

            updated[index].subtotal =
                Number(updated[index].quantity || 0) *
                Number(
                    updated[index].purchase_price || 0
                );

            return updated;
        });
    };

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        setItems((previous) => {
            const updated = [...previous];

            updated[index] = {
                ...updated[index],
                [field]: value,
            };

            const quantity = Number(
                field === "quantity"
                    ? value
                    : updated[index].quantity || 0
            );

            const price = Number(
                field === "purchase_price"
                    ? value
                    : updated[index].purchase_price || 0
            );

            updated[index].subtotal =
                quantity * price;

            return updated;
        });
    };

    const addItem = () => {
        setItems((previous) => [
            ...previous,
            {
                product: "",
                quantity: 1,
                purchase_price: "",
                subtotal: 0,
            },
        ]);
    };

    const removeItem = (index) => {
        if (items.length === 1) {
            return;
        }

        setItems((previous) =>
            previous.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const totalAmount = useMemo(() => {
        return items.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0) *
                    Number(
                        item.purchase_price || 0
                    ),
            0
        );
    }, [items]);

    const validateForm = () => {
        if (!form.supplier) {
            setError("Please select a supplier.");
            return false;
        }

        if (!form.invoice_number.trim()) {
            setError(
                "Please enter an invoice number."
            );
            return false;
        }

        if (!form.purchase_date) {
            setError(
                "Please select a purchase date."
            );
            return false;
        }

        if (items.length === 0) {
            setError(
                "Please add at least one product."
            );
            return false;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (!item.product) {
                setError(
                    `Please select a product for item ${
                        i + 1
                    }.`
                );
                return false;
            }

            if (
                !item.quantity ||
                Number(item.quantity) <= 0 ||
                !Number.isInteger(
                    Number(item.quantity)
                )
            ) {
                setError(
                    `Quantity for item ${
                        i + 1
                    } must be a positive integer.`
                );
                return false;
            }

            if (
                item.purchase_price === "" ||
                Number(item.purchase_price) < 0
            ) {
                setError(
                    `Please enter a valid purchase price for item ${
                        i + 1
                    }.`
                );
                return false;
            }
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
            supplier: Number(form.supplier),
            invoice_number:
                form.invoice_number.trim(),
            purchase_date: form.purchase_date,
            items: items.map((item) => ({
                product: Number(item.product),
                quantity: Number(item.quantity),
                purchase_price: Number(
                    item.purchase_price
                ),
            })),
        };

        try {
            setSaving(true);

            if (editingId) {
                await api.put(
                    `purchases/${editingId}/`,
                    payload
                );

                setSuccess(
                    "Purchase updated successfully."
                );
            } else {
                await api.post(
                    "purchases/",
                    payload
                );

                setSuccess(
                    "Purchase added successfully."
                );
            }

            resetForm();
            await loadData();
        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            if (data) {
                if (typeof data === "string") {
                    setError(data);
                } else {
                    const messages =
                        Object.entries(data)
                            .map(([key, value]) => {
                                if (
                                    Array.isArray(value)
                                ) {
                                    return `${key}: ${value.join(
                                        ", "
                                    )}`;
                                }

                                if (
                                    typeof value ===
                                    "object"
                                ) {
                                    return `${key}: ${JSON.stringify(
                                        value
                                    )}`;
                                }

                                return `${key}: ${value}`;
                            })
                            .join(" | ");

                    setError(
                        messages ||
                            "Failed to save purchase."
                    );
                }
            } else {
                setError(
                    "Failed to save purchase."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (purchase) => {
        const confirmed = window.confirm(
            `Delete purchase "${purchase.invoice_number}"?\n\n` +
                "This will also restore the purchased stock."
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `purchases/${purchase.id}/`
            );

            setSuccess(
                "Purchase deleted successfully."
            );

            await loadData();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                    "Failed to delete purchase."
            );
        }
    };

    const getSupplierName = (supplierId) => {
        const supplier = suppliers.find(
            (item) =>
                String(item.id) ===
                String(supplierId)
        );

        return (
            supplier?.company_name ||
            supplier?.name ||
            `Supplier #${supplierId}`
        );
    };

    const getSupplier = (supplierId) => {
        return suppliers.find(
            (item) =>
                String(item.id) ===
                String(supplierId)
        );
    };

    const getProductName = (productId) => {
        const product = products.find(
            (item) =>
                String(item.id) ===
                String(productId)
        );

        return (
            product?.name ||
            `Product #${productId}`
        );
    };

    const formatCurrency = (value) => {
        return `₹${Number(
            value || 0
        ).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
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

    const openInvoice = (purchase) => {
        setSelectedPurchase(purchase);
        setShowInvoice(true);
    };

    const closeInvoice = () => {
        setSelectedPurchase(null);
        setShowInvoice(false);
    };

    const printInvoice = () => {
        window.print();
    };

    return (
        <Layout>
            <div style={styles.page}>
            <div style={styles.container}>

                {/* HEADER */}

                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            Purchases
                        </h1>

                        <p style={styles.subtitle}>
                            Manage purchases, suppliers
                            and stock
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddForm}
                        style={styles.primaryButton}
                    >
                        + Add Purchase
                    </button>
                </div>


                {/* MESSAGES */}

                {error && (
                    <div style={styles.errorBox}>
                        <strong>Error:</strong>{" "}
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        style={styles.successBox}
                    >
                        {success}
                    </div>
                )}


                {/* STATS */}

                <div style={styles.statsGrid}>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Total Purchases
                        </div>

                        <div style={styles.statValue}>
                            {purchases.length}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Total Purchase Amount
                        </div>

                        <div style={styles.statValue}>
                            {formatCurrency(
                                purchases.reduce(
                                    (
                                        sum,
                                        purchase
                                    ) =>
                                        sum +
                                        Number(
                                            purchase.total_amount ||
                                                0
                                        ),
                                    0
                                )
                            )}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Suppliers
                        </div>

                        <div style={styles.statValue}>
                            {suppliers.length}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Products
                        </div>

                        <div style={styles.statValue}>
                            {products.length}
                        </div>
                    </div>

                </div>


                {/* FORM */}

                {showForm && (
                    <div style={styles.formCard}>

                        <div
                            style={
                                styles.formHeader
                            }
                        >
                            <div>
                                <h2
                                    style={
                                        styles.formTitle
                                    }
                                >
                                    {editingId
                                        ? "Edit Purchase"
                                        : "Add Purchase"}
                                </h2>

                                <p
                                    style={
                                        styles.formSubtitle
                                    }
                                >
                                    Enter purchase
                                    information and
                                    products
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                style={
                                    styles.closeButton
                                }
                            >
                                ×
                            </button>
                        </div>


                        <form
                            onSubmit={handleSubmit}
                        >

                            {/* BASIC DETAILS */}

                            <div
                                style={
                                    styles.formGrid
                                }
                            >

                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Supplier *
                                    </label>

                                    <select
                                        name="supplier"
                                        value={
                                            form.supplier
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Supplier
                                        </option>

                                        {suppliers.map(
                                            (
                                                supplier
                                            ) => (
                                                <option
                                                    key={
                                                        supplier.id
                                                    }
                                                    value={
                                                        supplier.id
                                                    }
                                                >
                                                    {supplier.company_name ||
                                                        supplier.name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>


                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Invoice Number *
                                    </label>

                                    <input
                                        type="text"
                                        name="invoice_number"
                                        value={
                                            form.invoice_number
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. PUR-001"
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>


                                <div
                                    style={
                                        styles.field
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Purchase Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="purchase_date"
                                        value={
                                            form.purchase_date
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>

                            </div>


                            {/* ITEMS */}

                            <div
                                style={
                                    styles.itemsHeader
                                }
                            >
                                <div>
                                    <h3
                                        style={
                                            styles.itemsTitle
                                        }
                                    >
                                        Purchase Items
                                    </h3>

                                    <p
                                        style={
                                            styles.itemsSubtitle
                                        }
                                    >
                                        Add products
                                        purchased from
                                        the supplier
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    style={
                                        styles.secondaryButton
                                    }
                                >
                                    + Add Product
                                </button>
                            </div>


                            <div
                                style={
                                    styles.itemsContainer
                                }
                            >

                                {items.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <div
                                            key={index}
                                            style={
                                                styles.itemRow
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.itemNumber
                                                }
                                            >
                                                {index +
                                                    1}
                                            </div>


                                            <div
                                                style={
                                                    styles.productField
                                                }
                                            >
                                                <label
                                                    style={
                                                        styles.smallLabel
                                                    }
                                                >
                                                    Product
                                                </label>

                                                <select
                                                    value={
                                                        item.product
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleProductChange(
                                                            index,
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.input
                                                    }
                                                    required
                                                >
                                                    <option value="">
                                                        Select Product
                                                    </option>

                                                    {products.map(
                                                        (
                                                            product
                                                        ) => (
                                                            <option
                                                                key={
                                                                    product.id
                                                                }
                                                                value={
                                                                    product.id
                                                                }
                                                            >
                                                                {
                                                                    product.name
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>


                                            <div
                                                style={
                                                    styles.quantityField
                                                }
                                            >
                                                <label
                                                    style={
                                                        styles.smallLabel
                                                    }
                                                >
                                                    Quantity
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={
                                                        item.quantity
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "quantity",
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    style={
                                                        styles.input
                                                    }
                                                    required
                                                />
                                            </div>


                                            <div
                                                style={
                                                    styles.priceField
                                                }
                                            >
                                                <label
                                                    style={
                                                        styles.smallLabel
                                                    }
                                                >
                                                    Purchase Price
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.purchase_price
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "purchase_price",
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    style={
                                                        styles.input
                                                    }
                                                    required
                                                />
                                            </div>


                                            <div
                                                style={
                                                    styles.subtotalField
                                                }
                                            >
                                                <label
                                                    style={
                                                        styles.smallLabel
                                                    }
                                                >
                                                    Subtotal
                                                </label>

                                                <div
                                                    style={
                                                        styles.subtotal
                                                    }
                                                >
                                                    {formatCurrency(
                                                        item.subtotal
                                                    )}
                                                </div>
                                            </div>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    items.length ===
                                                    1
                                                }
                                                style={{
                                                    ...styles.deleteItemButton,
                                                    opacity:
                                                        items.length ===
                                                        1
                                                            ? 0.4
                                                            : 1,
                                                    cursor:
                                                        items.length ===
                                                        1
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                🗑
                                            </button>

                                        </div>
                                    )
                                )}

                            </div>


                            {/* TOTAL */}

                            <div
                                style={
                                    styles.totalSection
                                }
                            >
                                <div>
                                    <span
                                        style={
                                            styles.totalLabel
                                        }
                                    >
                                        Total Purchase
                                        Amount
                                    </span>

                                    <span
                                        style={
                                            styles.totalHint
                                        }
                                    >
                                        Stock will
                                        increase
                                        automatically
                                    </span>
                                </div>

                                <div
                                    style={
                                        styles.totalAmount
                                    }
                                >
                                    {formatCurrency(
                                        totalAmount
                                    )}
                                </div>
                            </div>


                            {/* BUTTONS */}

                            <div
                                style={
                                    styles.formActions
                                }
                            >
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={
                                        styles.cancelButton
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={
                                        styles.primaryButton
                                    }
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Purchase"
                                        : "Save Purchase"}
                                </button>
                            </div>

                        </form>

                    </div>
                )}


                {/* PURCHASE TABLE */}

                <div style={styles.tableCard}>

                    <div
                        style={
                            styles.tableHeader
                        }
                    >
                        <div>
                            <h2
                                style={
                                    styles.tableTitle
                                }
                            >
                                Purchase History
                            </h2>

                            <p
                                style={
                                    styles.tableSubtitle
                                }
                            >
                                All purchases for
                                your account
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadData}
                            style={
                                styles.refreshButton
                            }
                        >
                            ↻ Refresh
                        </button>
                    </div>


                    {loading ? (
                        <div
                            style={
                                styles.emptyState
                            }
                        >
                            Loading purchases...
                        </div>
                    ) : purchases.length ===
                      0 ? (
                        <div
                            style={
                                styles.emptyState
                            }
                        >
                            <div
                                style={
                                    styles.emptyIcon
                                }
                            >
                                🛒
                            </div>

                            <h3
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No purchases yet
                            </h3>

                            <p
                                style={
                                    styles.emptyText
                                }
                            >
                                Add your first
                                purchase to start
                                tracking stock and
                                purchase expenses.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    openAddForm
                                }
                                style={
                                    styles.primaryButton
                                }
                            >
                                + Add First Purchase
                            </button>
                        </div>
                    ) : (
                        <div
                            style={
                                styles.tableWrapper
                            }
                        >
                            <table
                                style={
                                    styles.table
                                }
                            >
                                <thead>
                                    <tr>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Invoice
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Supplier
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Date
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Items
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Total
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

                                    {purchases.map(
                                        (
                                            purchase
                                        ) => {

                                            const purchaseItems =
                                                purchase.purchase_items ||
                                                purchase.items ||
                                                [];

                                            return (
                                                <tr
                                                    key={
                                                        purchase.id
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
                                                                purchase.invoice_number
                                                            }
                                                        </strong>
                                                    </td>


                                                    <td
                                                        style={
                                                            styles.td
                                                        }
                                                    >
                                                        {getSupplierName(
                                                            purchase.supplier
                                                        )}
                                                    </td>


                                                    <td
                                                        style={
                                                            styles.td
                                                        }
                                                    >
                                                        {formatDate(
                                                            purchase.purchase_date
                                                        )}
                                                    </td>


                                                    <td
                                                        style={
                                                            styles.td
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.itemBadge
                                                            }
                                                        >
                                                            {
                                                                purchaseItems.length
                                                            }
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
                                                            purchase.total_amount
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
                                                                    openInvoice(
                                                                        purchase
                                                                    )
                                                                }
                                                                style={
                                                                    styles.viewButton
                                                                }
                                                            >
                                                                View Invoice
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditForm(
                                                                        purchase
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
                                                                        purchase
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
                                            );
                                        }
                                    )}

                                </tbody>
                            </table>
                        </div>
                    )}

                </div>


                {/* PURCHASE INVOICE */}

                {showInvoice &&
                    selectedPurchase && (
                        <div
                            style={
                                styles.invoiceOverlay
                            }
                        >

                            <div
                                style={
                                    styles.invoiceModal
                                }
                            >

                                {/* MODAL HEADER */}

                                <div
                                    className="no-print"
                                    style={
                                        styles.invoiceModalHeader
                                    }
                                >

                                    <div>
                                        <h2
                                            style={
                                                styles.invoiceModalTitle
                                            }
                                        >
                                            Purchase Invoice
                                        </h2>

                                        <p
                                            style={
                                                styles.invoiceModalSubtitle
                                            }
                                        >
                                            Invoice preview
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            closeInvoice
                                        }
                                        style={
                                            styles.closeButton
                                        }
                                    >
                                        ×
                                    </button>

                                </div>


                                {/* PRINTABLE INVOICE */}

                                <div
                                    className="print-invoice"
                                    style={
                                        styles.invoice
                                    }
                                >

                                    {/* BUSINESS HEADER */}

                                    <div
                                        style={
                                            styles.invoiceBusinessHeader
                                        }
                                    >

                                        <div
                                            style={
                                                styles.businessLeft
                                            }
                                        >

                                            {businessSettings?.logo && (
                                                <img
                                                    src={
                                                        businessSettings.logo.startsWith(
                                                            "http"
                                                        )
                                                            ? businessSettings.logo
                                                            : `http://127.0.0.1:8000${businessSettings.logo}`
                                                    }
                                                    alt="Business Logo"
                                                    style={
                                                        styles.businessLogo
                                                    }
                                                />
                                            )}

                                            <div>

                                                <h1
                                                    style={
                                                        styles.businessName
                                                    }
                                                >
                                                    {businessSettings?.business_name ||
                                                        "My Business"}
                                                </h1>

                                                {businessSettings?.address && (
                                                    <div
                                                        style={
                                                            styles.businessInfo
                                                        }
                                                    >
                                                        {
                                                            businessSettings.address
                                                        }
                                                    </div>
                                                )}

                                                {businessSettings?.phone && (
                                                    <div
                                                        style={
                                                            styles.businessInfo
                                                        }
                                                    >
                                                        Phone:{" "}
                                                        {
                                                            businessSettings.phone
                                                        }
                                                    </div>
                                                )}

                                                {businessSettings?.email && (
                                                    <div
                                                        style={
                                                            styles.businessInfo
                                                        }
                                                    >
                                                        Email:{" "}
                                                        {
                                                            businessSettings.email
                                                        }
                                                    </div>
                                                )}

                                                {businessSettings?.gst_number && (
                                                    <div
                                                        style={
                                                            styles.businessInfo
                                                        }
                                                    >
                                                        GSTIN:{" "}
                                                        {
                                                            businessSettings.gst_number
                                                        }
                                                    </div>
                                                )}

                                            </div>

                                        </div>


                                        <div
                                            style={
                                                styles.invoiceTitleBox
                                            }
                                        >

                                            <h2
                                                style={
                                                    styles.invoiceTitle
                                                }
                                            >
                                                PURCHASE
                                                INVOICE
                                            </h2>

                                            <div
                                                style={
                                                    styles.invoiceNumber
                                                }
                                            >
                                                #
                                                {
                                                    selectedPurchase.invoice_number
                                                }
                                            </div>

                                        </div>

                                    </div>


                                    {/* DIVIDER */}

                                    <div
                                        style={
                                            styles.invoiceDivider
                                        }
                                    />


                                    {/* SUPPLIER DETAILS */}

                                    <div
                                        style={
                                            styles.invoiceDetailsGrid
                                        }
                                    >

                                        <div>

                                            <div
                                                style={
                                                    styles.detailHeading
                                                }
                                            >
                                                SUPPLIER
                                            </div>

                                            <div
                                                style={
                                                    styles.supplierName
                                                }
                                            >
                                                {getSupplierName(
                                                    selectedPurchase.supplier
                                                )}
                                            </div>

                                            {(() => {
                                                const supplier =
                                                    getSupplier(
                                                        selectedPurchase.supplier
                                                    );

                                                if (
                                                    !supplier
                                                ) {
                                                    return null;
                                                }

                                                return (
                                                    <div
                                                        style={
                                                            styles.supplierDetails
                                                        }
                                                    >

                                                        {supplier.contact_person && (
                                                            <div>
                                                                Contact:{" "}
                                                                {
                                                                    supplier.contact_person
                                                                }
                                                            </div>
                                                        )}

                                                        {supplier.phone && (
                                                            <div>
                                                                Phone:{" "}
                                                                {
                                                                    supplier.phone
                                                                }
                                                            </div>
                                                        )}

                                                        {supplier.email && (
                                                            <div>
                                                                Email:{" "}
                                                                {
                                                                    supplier.email
                                                                }
                                                            </div>
                                                        )}

                                                        {supplier.address && (
                                                            <div>
                                                                {
                                                                    supplier.address
                                                                }
                                                            </div>
                                                        )}

                                                        {supplier.gst_number && (
                                                            <div>
                                                                GSTIN:{" "}
                                                                {
                                                                    supplier.gst_number
                                                                }
                                                            </div>
                                                        )}

                                                    </div>
                                                );
                                            })()}

                                        </div>


                                        <div
                                            style={
                                                styles.invoiceMeta
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.metaRow
                                                }
                                            >
                                                <span>
                                                    Invoice
                                                    Number
                                                </span>

                                                <strong>
                                                    {
                                                        selectedPurchase.invoice_number
                                                    }
                                                </strong>
                                            </div>

                                            <div
                                                style={
                                                    styles.metaRow
                                                }
                                            >
                                                <span>
                                                    Purchase
                                                    Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedPurchase.purchase_date
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>


                                    {/* ITEMS TABLE */}

                                    <table
                                        style={
                                            styles.invoiceTable
                                        }
                                    >

                                        <thead>

                                            <tr>

                                                <th
                                                    style={
                                                        styles.invoiceTh
                                                    }
                                                >
                                                    #
                                                </th>

                                                <th
                                                    style={
                                                        styles.invoiceTh
                                                    }
                                                >
                                                    Product
                                                </th>

                                                <th
                                                    style={{
                                                        ...styles.invoiceTh,
                                                        textAlign:
                                                            "center",
                                                    }}
                                                >
                                                    Quantity
                                                </th>

                                                <th
                                                    style={{
                                                        ...styles.invoiceTh,
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >
                                                    Purchase
                                                    Price
                                                </th>

                                                <th
                                                    style={{
                                                        ...styles.invoiceTh,
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >
                                                    Subtotal
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {(
                                                selectedPurchase.purchase_items ||
                                                selectedPurchase.items ||
                                                []
                                            ).map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            item.id ||
                                                            index
                                                        }
                                                    >

                                                        <td
                                                            style={
                                                                styles.invoiceTd
                                                            }
                                                        >
                                                            {index +
                                                                1}
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.invoiceTd
                                                            }
                                                        >
                                                            {item.product_name ||
                                                                getProductName(
                                                                    item.product
                                                                )}
                                                        </td>

                                                        <td
                                                            style={{
                                                                ...styles.invoiceTd,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            {
                                                                item.quantity
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                ...styles.invoiceTd,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            {formatCurrency(
                                                                item.purchase_price
                                                            )}
                                                        </td>

                                                        <td
                                                            style={{
                                                                ...styles.invoiceTd,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight:
                                                                    600,
                                                            }}
                                                        >
                                                            {formatCurrency(
                                                                item.subtotal ??
                                                                    Number(
                                                                        item.quantity ||
                                                                            0
                                                                    ) *
                                                                        Number(
                                                                            item.purchase_price ||
                                                                                0
                                                                        )
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>


                                    {/* TOTAL */}

                                    <div
                                        style={
                                            styles.invoiceTotalSection
                                        }
                                    >

                                        <div>

                                            <div
                                                style={
                                                    styles.thankYou
                                                }
                                            >
                                                Thank you for
                                                your business.
                                            </div>

                                            <div
                                                style={
                                                    styles.stockNote
                                                }
                                            >
                                                Purchased stock
                                                has been added
                                                to inventory.
                                            </div>

                                        </div>


                                        <div
                                            style={
                                                styles.grandTotalBox
                                            }
                                        >

                                            <span
                                                style={
                                                    styles.grandTotalLabel
                                                }
                                            >
                                                GRAND TOTAL
                                            </span>

                                            <strong
                                                style={
                                                    styles.grandTotal
                                                }
                                            >
                                                {formatCurrency(
                                                    selectedPurchase.total_amount
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* FOOTER */}

                                    <div
                                        style={
                                            styles.invoiceFooter
                                        }
                                    >

                                        <div>
                                            This is a
                                            computer-generated
                                            purchase invoice.
                                        </div>

                                        <div>
                                            {businessSettings?.business_name ||
                                                "My Business"}
                                        </div>

                                    </div>

                                </div>


                                {/* INVOICE BUTTONS */}

                                <div
                                    className="no-print"
                                    style={
                                        styles.invoiceActions
                                    }
                                >

                                    <button
                                        type="button"
                                        onClick={
                                            closeInvoice
                                        }
                                        style={
                                            styles.cancelButton
                                        }
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            printInvoice
                                        }
                                        style={
                                            styles.primaryButton
                                        }
                                    >
                                        🖨 Print Invoice
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

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

    secondaryButton: {
        border: "1px solid #2563eb",
        borderRadius: "8px",
        padding: "9px 15px",
        background: "#fff",
        color: "#2563eb",
        fontSize: "13px",
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
        fontSize: "25px",
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
        lineHeight: "30px",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "30px",
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

    smallLabel: {
        display: "block",
        color: "#6b7280",
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "6px",
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

    itemsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "15px",
    },

    itemsTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "17px",
    },

    itemsSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "12px",
    },

    itemsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    itemRow: {
        display: "grid",
        gridTemplateColumns:
            "35px minmax(180px, 2fr) minmax(100px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr) 40px",
        gap: "12px",
        alignItems: "end",
        padding: "14px",
        border: "1px solid #e5e7eb",
        borderRadius: "9px",
        background: "#fafafa",
    },

    itemNumber: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#e5e7eb",
        color: "#374151",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "12px",
        fontWeight: 700,
        marginBottom: "3px",
    },

    productField: {
        minWidth: 0,
    },

    quantityField: {
        minWidth: 0,
    },

    priceField: {
        minWidth: 0,
    },

    subtotalField: {
        minWidth: 0,
    },

    subtotal: {
        minHeight: "40px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        padding: "10px 11px",
        background: "#f3f4f6",
        borderRadius: "8px",
        color: "#111827",
        fontWeight: 700,
        fontSize: "14px",
    },

    deleteItemButton: {
        height: "40px",
        width: "40px",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        background: "#fef2f2",
        color: "#dc2626",
        fontSize: "15px",
    },

    totalSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginTop: "22px",
        padding: "18px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
    },

    totalLabel: {
        display: "block",
        color: "#172033",
        fontSize: "15px",
        fontWeight: 700,
    },

    totalHint: {
        display: "block",
        marginTop: "4px",
        color: "#6b7280",
        fontSize: "12px",
    },

    totalAmount: {
        fontSize: "25px",
        fontWeight: 800,
        color: "#111827",
    },

    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "20px",
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
        borderBottom:
            "1px solid #e5e7eb",
    },

    tr: {
        borderBottom:
            "1px solid #f0f1f3",
    },

    td: {
        padding: "16px 18px",
        color: "#374151",
        fontSize: "14px",
        verticalAlign: "middle",
    },

    itemBadge: {
        display: "inline-flex",
        minWidth: "26px",
        height: "26px",
        padding: "0 7px",
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "12px",
        fontWeight: 700,
    },

    actionGroup: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "7px",
        flexWrap: "wrap",
    },

    viewButton: {
        border: "1px solid #c7d2fe",
        borderRadius: "7px",
        padding: "7px 11px",
        background: "#eef2ff",
        color: "#4338ca",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
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


    /* =========================
       INVOICE STYLES
       ========================= */

    invoiceOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "25px",
        zIndex: 9999,
        overflowY: "auto",
    },

    invoiceModal: {
        width: "100%",
        maxWidth: "950px",
        maxHeight: "95vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "14px",
        boxShadow:
            "0 20px 60px rgba(0,0,0,0.25)",
    },

    invoiceModalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 25px",
        borderBottom:
            "1px solid #e5e7eb",
    },

    invoiceModalTitle: {
        margin: 0,
        fontSize: "20px",
        color: "#172033",
    },

    invoiceModalSubtitle: {
        margin: "5px 0 0",
        fontSize: "12px",
        color: "#6b7280",
    },

    invoice: {
        background: "#fff",
        padding: "45px",
        color: "#111827",
        fontFamily:
            "Arial, Helvetica, sans-serif",
    },

    invoiceBusinessHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "30px",
    },

    businessLeft: {
        display: "flex",
        alignItems: "flex-start",
        gap: "15px",
    },

    businessLogo: {
        width: "75px",
        height: "75px",
        objectFit: "contain",
        borderRadius: "8px",
    },

    businessName: {
        margin: 0,
        fontSize: "25px",
        fontWeight: 800,
        color: "#111827",
    },

    businessInfo: {
        marginTop: "4px",
        fontSize: "12px",
        color: "#4b5563",
        lineHeight: 1.5,
    },

    invoiceTitleBox: {
        textAlign: "right",
    },

    invoiceTitle: {
        margin: 0,
        fontSize: "24px",
        fontWeight: 800,
        color: "#2563eb",
        letterSpacing: "0.5px",
    },

    invoiceNumber: {
        marginTop: "7px",
        fontSize: "13px",
        color: "#4b5563",
    },

    invoiceDivider: {
        height: "2px",
        background: "#111827",
        margin: "25px 0",
    },

    invoiceDetailsGrid: {
        display: "grid",
        gridTemplateColumns:
            "1fr 1fr",
        gap: "40px",
        marginBottom: "30px",
    },

    detailHeading: {
        fontSize: "10px",
        fontWeight: 700,
        color: "#6b7280",
        letterSpacing: "0.8px",
        marginBottom: "7px",
    },

    supplierName: {
        fontSize: "16px",
        fontWeight: 700,
        color: "#111827",
    },

    supplierDetails: {
        marginTop: "7px",
        fontSize: "12px",
        lineHeight: 1.6,
        color: "#4b5563",
    },

    invoiceMeta: {
        marginLeft: "auto",
        minWidth: "240px",
    },

    metaRow: {
        display: "flex",
        justifyContent:
            "space-between",
        gap: "20px",
        padding: "7px 0",
        borderBottom:
            "1px solid #e5e7eb",
        fontSize: "12px",
        color: "#6b7280",
    },

    invoiceTable: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
    },

    invoiceTh: {
        padding: "12px 10px",
        background: "#f3f4f6",
        borderBottom:
            "1px solid #d1d5db",
        color: "#374151",
        fontSize: "11px",
        textAlign: "left",
        textTransform: "uppercase",
    },

    invoiceTd: {
        padding: "13px 10px",
        borderBottom:
            "1px solid #e5e7eb",
        fontSize: "12px",
        color: "#374151",
    },

    invoiceTotalSection: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "flex-end",
        gap: "30px",
        marginTop: "30px",
        paddingTop: "20px",
        borderTop:
            "2px solid #111827",
    },

    thankYou: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#374151",
    },

    stockNote: {
        marginTop: "6px",
        fontSize: "11px",
        color: "#6b7280",
    },

    grandTotalBox: {
        textAlign: "right",
    },

    grandTotalLabel: {
        display: "block",
        fontSize: "10px",
        color: "#6b7280",
        fontWeight: 700,
        letterSpacing: "0.5px",
    },

    grandTotal: {
        display: "block",
        marginTop: "5px",
        fontSize: "24px",
        color: "#111827",
    },

    invoiceFooter: {
        display: "flex",
        justifyContent:
            "space-between",
        gap: "20px",
        marginTop: "45px",
        paddingTop: "15px",
        borderTop:
            "1px solid #e5e7eb",
        fontSize: "10px",
        color: "#9ca3af",
    },

    invoiceActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "18px 25px",
        borderTop:
            "1px solid #e5e7eb",
    },
};


/* =========================
   PRINT STYLES
   ========================= */

if (typeof document !== "undefined") {
    const styleId =
        "purchase-invoice-print-style";

    if (!document.getElementById(styleId)) {
        const style =
            document.createElement("style");

        style.id = styleId;

        style.innerHTML = `
            @media print {

                body * {
                    visibility: hidden !important;
                }

                .print-invoice,
                .print-invoice * {
                    visibility: visible !important;
                }

                .print-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 25px !important;
                    box-sizing: border-box !important;
                }

                .no-print {
                    display: none !important;
                }

                @page {
                    size: A4;
                    margin: 10mm;
                }
            }
        `;

        document.head.appendChild(style);
    }
}


export default Purchases;