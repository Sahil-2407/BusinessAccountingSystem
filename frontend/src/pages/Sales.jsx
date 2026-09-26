import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import Layout from "../components/Layout";
import api from "../services/api";


function Sales() {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    // Business Settings
    const [businessSettings, setBusinessSettings] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    const [selectedSale, setSelectedSale] =
        useState(null);

    const [editingSale, setEditingSale] =
        useState(null);

    const [formData, setFormData] = useState({
        invoice_number: "",
        sale_date: new Date()
            .toISOString()
            .split("T")[0],
        customer: "",
        payment_status: "Pending",
    });

    const [items, setItems] = useState([
        {
            product: "",
            quantity: 1,
            selling_price: "",
            subtotal: 0,
        },
    ]);


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                salesResponse,
                customersResponse,
                productsResponse,
                businessResponse,
            ] = await Promise.all([
                api.get("sales/"),
                api.get("customers/"),
                api.get("products/"),
                api.get("business-settings/"),
            ]);

            setSales(salesResponse.data);
            setCustomers(customersResponse.data);
            setProducts(productsResponse.data);

            // Business Settings
            if (
                businessResponse.data &&
                businessResponse.data.length > 0
            ) {
                setBusinessSettings(
                    businessResponse.data[0]
                );
            } else {
                setBusinessSettings(null);
            }

        } catch (err) {
            console.error(
                "Failed to load sales data:",
                err
            );

            setError(
                err.response?.data?.detail ||
                    "Failed to load sales data."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    // =========================================================
    // HELPERS
    // =========================================================

    const getCustomerName = (customerId) => {
        if (!customerId) {
            return "Walk-in Customer";
        }

        const customer = customers.find(
            (item) =>
                Number(item.id) ===
                Number(customerId)
        );

        return (
            customer?.name ||
            `Customer #${customerId}`
        );
    };


    const getCustomerDetails = (customerId) => {
        if (!customerId) {
            return null;
        }

        return customers.find(
            (item) =>
                Number(item.id) ===
                Number(customerId)
        );
    };


    const getProductName = (productId) => {
        const product = products.find(
            (item) =>
                Number(item.id) ===
                Number(productId)
        );

        return (
            product?.name ||
            `Product #${productId}`
        );
    };


    // =========================================================
    // ADD SALE
    // =========================================================

    const openAddModal = () => {
        setEditingSale(null);

        setFormData({
            invoice_number: `INV-${Date.now()}`,
            sale_date: new Date()
                .toISOString()
                .split("T")[0],
            customer: "",
            payment_status: "Pending",
        });

        setItems([
            {
                product: "",
                quantity: 1,
                selling_price: "",
                subtotal: 0,
            },
        ]);

        setError("");
        setShowModal(true);
    };


    // =========================================================
    // EDIT SALE
    // =========================================================

    const openEditModal = (sale) => {
        setEditingSale(sale);

        setFormData({
            invoice_number:
                sale.invoice_number || "",

            sale_date:
                sale.sale_date || "",

            customer:
                sale.customer || "",

            payment_status:
                sale.payment_status ||
                "Pending",
        });

        const saleItems =
            sale.sale_items ||
            sale.items ||
            [];

        setItems(
            saleItems.length > 0
                ? saleItems.map((item) => ({
                      product:
                          item.product || "",

                      quantity:
                          item.quantity || 1,

                      selling_price:
                          item.selling_price ||
                          "",

                      subtotal:
                          item.subtotal ||
                          Number(
                              item.quantity || 0
                          ) *
                              Number(
                                  item.selling_price ||
                                      0
                              ),
                  }))
                : [
                      {
                          product: "",
                          quantity: 1,
                          selling_price: "",
                          subtotal: 0,
                      },
                  ]
        );

        setError("");
        setShowModal(true);
    };


    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingSale(null);
        setError("");
    };


    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =========================================================
    // ITEM HANDLING
    // =========================================================

    const handleProductChange = (
        index,
        productId
    ) => {
        const selectedProduct =
            products.find(
                (product) =>
                    Number(product.id) ===
                    Number(productId)
            );

        setItems((previous) => {
            const updated = [...previous];

            updated[index] = {
                ...updated[index],

                product: productId,

                selling_price:
                    selectedProduct?.selling_price ||
                    "",
            };

            updated[index].subtotal =
                Number(
                    updated[index].quantity || 0
                ) *
                Number(
                    updated[index]
                        .selling_price || 0
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

            if (
                field === "quantity" ||
                field === "selling_price"
            ) {
                updated[index].subtotal =
                    Number(
                        updated[index]
                            .quantity || 0
                    ) *
                    Number(
                        updated[index]
                            .selling_price || 0
                    );
            }

            return updated;
        });
    };


    const addItem = () => {
        setItems((previous) => [
            ...previous,
            {
                product: "",
                quantity: 1,
                selling_price: "",
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


    // =========================================================
    // GRAND TOTAL
    // =========================================================

    const grandTotal = useMemo(() => {
        return items.reduce(
            (total, item) =>
                total +
                Number(
                    item.subtotal || 0
                ),
            0
        );
    }, [items]);


    // =========================================================
    // VALIDATION
    // =========================================================

    const validateSale = () => {
        if (
            !formData.invoice_number.trim()
        ) {
            return "Please enter an invoice number.";
        }

        if (!formData.sale_date) {
            return "Please select a sale date.";
        }

        if (!formData.customer) {
            return "Please select a customer.";
        }

        if (!formData.payment_status) {
            return "Please select payment status.";
        }

        if (items.length === 0) {
            return "Please add at least one sale item.";
        }

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const item = items[i];

            if (!item.product) {
                return `Please select a product for item ${
                    i + 1
                }.`;
            }

            if (
                Number(item.quantity) <= 0
            ) {
                return `Quantity must be greater than 0 for item ${
                    i + 1
                }.`;
            }

            if (
                Number(item.selling_price) < 0
            ) {
                return `Selling price cannot be negative for item ${
                    i + 1
                }.`;
            }
        }

        return "";
    };


    // =========================================================
    // SAVE SALE
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError =
            validateSale();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                invoice_number:
                    formData.invoice_number.trim(),

                sale_date:
                    formData.sale_date,

                customer:
                    Number(formData.customer),

                payment_status:
                    formData.payment_status,

                items: items.map((item) => ({
                    product:
                        Number(item.product),

                    quantity:
                        Number(item.quantity),

                    selling_price:
                        Number(
                            item.selling_price
                        ),
                })),
            };

            if (editingSale) {
                await api.put(
                    `sales/${editingSale.id}/`,
                    payload
                );
            } else {
                await api.post(
                    "sales/",
                    payload
                );
            }

            await loadData();

            setShowModal(false);
            setEditingSale(null);
            setError("");

        } catch (err) {
            console.error(
                "Failed to save sale:",
                err
            );

            const responseData =
                err.response?.data;

            if (
                typeof responseData ===
                "object"
            ) {
                const messages =
                    Object.entries(
                        responseData
                    )
                        .map(
                            ([
                                field,
                                message,
                            ]) => {
                                if (
                                    Array.isArray(
                                        message
                                    )
                                ) {
                                    return `${field}: ${message.join(
                                        ", "
                                    )}`;
                                }

                                return `${field}: ${message}`;
                            }
                        )
                        .join("\n");

                setError(
                    messages ||
                        "Failed to save sale."
                );
            } else {
                setError(
                    "Failed to save sale. Please try again."
                );
            }

        } finally {
            setSaving(false);
        }
    };


    // =========================================================
    // DELETE SALE
    // =========================================================

    const handleDelete = async (sale) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete invoice ${sale.invoice_number}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `sales/${sale.id}/`
            );

            await loadData();

        } catch (err) {
            console.error(
                "Failed to delete sale:",
                err
            );

            setError(
                err.response?.data?.detail ||
                    "Failed to delete sale."
            );
        }
    };


    // =========================================================
    // VIEW INVOICE
    // =========================================================

    const openInvoice = (sale) => {
        setSelectedSale(sale);
        setShowInvoice(true);
    };


    const closeInvoice = () => {
        setSelectedSale(null);
        setShowInvoice(false);
    };


    // =========================================================
    // PRINT INVOICE
    // =========================================================

    const handlePrintInvoice = () => {
        window.print();
    };


    // =========================================================
    // SEARCH
    // =========================================================

    const filteredSales = sales.filter(
        (sale) => {
            const searchText =
                search.toLowerCase();

            const invoiceNumber =
                sale.invoice_number?.toLowerCase() ||
                "";

            const customerName =
                sale.customer_name?.toLowerCase() ||
                getCustomerName(
                    sale.customer
                ).toLowerCase();

            const paymentStatus =
                sale.payment_status?.toLowerCase() ||
                "";

            return (
                invoiceNumber.includes(
                    searchText
                ) ||
                customerName.includes(
                    searchText
                ) ||
                paymentStatus.includes(
                    searchText
                )
            );
        }
    );


    // =========================================================
    // STATISTICS
    // =========================================================

    const totalSales = sales.reduce(
        (total, sale) =>
            total +
            Number(
                sale.total_amount || 0
            ),
        0
    );


    const paidSales = sales
        .filter(
            (sale) =>
                sale.payment_status ===
                "Paid"
        )
        .reduce(
            (total, sale) =>
                total +
                Number(
                    sale.total_amount || 0
                ),
            0
        );


    const pendingSales = sales
        .filter(
            (sale) =>
                sale.payment_status ===
                "Pending"
        )
        .reduce(
            (total, sale) =>
                total +
                Number(
                    sale.total_amount || 0
                ),
            0
        );


    const partialSales = sales
        .filter(
            (sale) =>
                sale.payment_status ===
                "Partial"
        )
        .reduce(
            (total, sale) =>
                total +
                Number(
                    sale.total_amount || 0
                ),
            0
        );


    // =========================================================
    // SELECTED CUSTOMER FOR INVOICE
    // =========================================================

    const invoiceCustomer =
        selectedSale
            ? getCustomerDetails(
                  selectedSale.customer
              )
            : null;


    const invoiceItems =
        selectedSale
            ? selectedSale.sale_items ||
              selectedSale.items ||
              []
            : [];


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <Layout>
            <div style={styles.page}>

                {/* =================================================
                    HEADER
                ================================================== */}

                <div style={styles.header}>

                    <div>
                        <h1
                            style={
                                styles.title
                            }
                        >
                            Sales
                        </h1>

                        <p
                            style={
                                styles.subtitle
                            }
                        >
                            Manage your sales and
                            invoices
                        </p>
                    </div>

                    <button
                        onClick={
                            openAddModal
                        }
                        style={
                            styles.primaryButton
                        }
                    >
                        + New Sale
                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div
                        style={
                            styles.errorBox
                        }
                    >
                        <strong>
                            Unable to save:
                        </strong>

                        <div
                            style={{
                                whiteSpace:
                                    "pre-line",
                                marginTop: 5,
                            }}
                        >
                            {error}
                        </div>
                    </div>
                )}


                {/* =================================================
                    STATISTICS
                ================================================== */}

                <div
                    style={
                        styles.statsGrid
                    }
                >

                    <div
                        style={
                            styles.statCard
                        }
                    >
                        <div
                            style={
                                styles.statLabel
                            }
                        >
                            Total Sales
                        </div>

                        <div
                            style={
                                styles.statValue
                            }
                        >
                            ₹
                            {totalSales.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                        </div>
                    </div>


                    <div
                        style={
                            styles.statCard
                        }
                    >
                        <div
                            style={
                                styles.statLabel
                            }
                        >
                            Paid
                        </div>

                        <div
                            style={{
                                ...styles.statValue,
                                color: "#16a34a",
                            }}
                        >
                            ₹
                            {paidSales.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                        </div>
                    </div>


                    <div
                        style={
                            styles.statCard
                        }
                    >
                        <div
                            style={
                                styles.statLabel
                            }
                        >
                            Pending
                        </div>

                        <div
                            style={{
                                ...styles.statValue,
                                color: "#dc2626",
                            }}
                        >
                            ₹
                            {pendingSales.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                        </div>
                    </div>


                    <div
                        style={
                            styles.statCard
                        }
                    >
                        <div
                            style={
                                styles.statLabel
                            }
                        >
                            Partial
                        </div>

                        <div
                            style={{
                                ...styles.statValue,
                                color: "#d97706",
                            }}
                        >
                            ₹
                            {partialSales.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                        </div>
                    </div>

                </div>


                {/* =================================================
                    SEARCH
                ================================================== */}

                <div
                    style={
                        styles.toolbar
                    }
                >
                    <input
                        type="text"
                        placeholder="Search invoice, customer or payment status..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        style={
                            styles.searchInput
                        }
                    />
                </div>


                {/* =================================================
                    SALES TABLE
                ================================================== */}

                <div
                    style={styles.card}
                >

                    <div
                        style={
                            styles.cardHeader
                        }
                    >
                        <h2
                            style={
                                styles.cardTitle
                            }
                        >
                            Sales Invoices
                        </h2>

                        <span
                            style={
                                styles.countBadge
                            }
                        >
                            {
                                filteredSales.length
                            }{" "}
                            sales
                        </span>
                    </div>


                    {loading ? (
                        <div
                            style={
                                styles.emptyState
                            }
                        >
                            Loading sales...
                        </div>

                    ) : filteredSales.length ===
                      0 ? (

                        <div
                            style={
                                styles.emptyState
                            }
                        >
                            <div
                                style={{
                                    fontSize: 40,
                                    marginBottom: 10,
                                }}
                            >
                                🧾
                            </div>

                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                }}
                            >
                                No sales found
                            </div>

                            <p
                                style={{
                                    color:
                                        "#64748b",
                                }}
                            >
                                Create your first
                                sale to see it
                                here.
                            </p>
                        </div>

                    ) : (

                        <div
                            style={{
                                overflowX:
                                    "auto",
                            }}
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
                                            Date
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Customer
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Total
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Payment
                                        </th>

                                        <th
                                            style={
                                                styles.th
                                            }
                                        >
                                            Actions
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredSales.map(
                                        (sale) => (
                                            <tr
                                                key={
                                                    sale.id
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
                                                            sale.invoice_number
                                                        }
                                                    </strong>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        sale.sale_date
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        sale.customer_name ||
                                                        getCustomerName(
                                                            sale.customer
                                                        )
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            sale.total_amount ||
                                                                0
                                                        ).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </strong>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,

                                                            ...(sale.payment_status ===
                                                            "Paid"
                                                                ? styles.paid
                                                                : sale.payment_status ===
                                                                  "Partial"
                                                                ? styles.partial
                                                                : styles.pending),
                                                        }}
                                                    >
                                                        {
                                                            sale.payment_status
                                                        }
                                                    </span>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <button
                                                        onClick={() =>
                                                            openInvoice(
                                                                sale
                                                            )
                                                        }
                                                        style={
                                                            styles.viewButton
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                sale
                                                            )
                                                        }
                                                        style={
                                                            styles.editButton
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                sale
                                                            )
                                                        }
                                                        style={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>
                            </table>
                        </div>
                    )}

                </div>


                {/* =================================================
                    ADD / EDIT SALE MODAL
                ================================================== */}

                {showModal && (
                    <div
                        style={
                            styles.modalOverlay
                        }
                    >

                        <div
                            style={
                                styles.formModal
                            }
                        >

                            <div
                                style={
                                    styles.modalHeader
                                }
                            >

                                <div>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        {editingSale
                                            ? "Edit Sale"
                                            : "Create New Sale"}
                                    </h2>

                                    <p
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        Enter invoice and
                                        sale details
                                    </p>

                                </div>

                                <button
                                    onClick={
                                        closeModal
                                    }
                                    style={
                                        styles.closeButton
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleSubmit
                                }
                            >

                                {/* INVOICE DETAILS */}

                                <div
                                    style={
                                        styles.section
                                    }
                                >

                                    <h3
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Invoice Details
                                    </h3>

                                    <div
                                        style={
                                            styles.formGrid
                                        }
                                    >

                                        <div>

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
                                                    formData.invoice_number
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                style={
                                                    styles.input
                                                }
                                                required
                                            />

                                        </div>


                                        <div>

                                            <label
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Sale Date *
                                            </label>

                                            <input
                                                type="date"
                                                name="sale_date"
                                                value={
                                                    formData.sale_date
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                style={
                                                    styles.input
                                                }
                                                required
                                            />

                                        </div>


                                        <div>

                                            <label
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Customer *
                                            </label>

                                            <select
                                                name="customer"
                                                value={
                                                    formData.customer
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                style={
                                                    styles.input
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select Customer
                                                </option>

                                                {customers.map(
                                                    (
                                                        customer
                                                    ) => (
                                                        <option
                                                            key={
                                                                customer.id
                                                            }
                                                            value={
                                                                customer.id
                                                            }
                                                        >
                                                            {
                                                                customer.name
                                                            }
                                                        </option>
                                                    )
                                                )}

                                            </select>

                                        </div>


                                        <div>

                                            <label
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Payment Status *
                                            </label>

                                            <select
                                                name="payment_status"
                                                value={
                                                    formData.payment_status
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                style={
                                                    styles.input
                                                }
                                            >

                                                <option value="Pending">
                                                    Pending
                                                </option>

                                                <option value="Paid">
                                                    Paid
                                                </option>

                                                <option value="Partial">
                                                    Partial
                                                </option>

                                            </select>

                                        </div>

                                    </div>

                                </div>


                                {/* SALE ITEMS */}

                                <div
                                    style={
                                        styles.section
                                    }
                                >

                                    <div
                                        style={
                                            styles.itemsHeader
                                        }
                                    >

                                        <h3
                                            style={
                                                styles.sectionTitle
                                            }
                                        >
                                            Sale Items
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={
                                                addItem
                                            }
                                            style={
                                                styles.addItemButton
                                            }
                                        >
                                            + Add Item
                                        </button>

                                    </div>


                                    <div
                                        style={
                                            styles.itemList
                                        }
                                    >

                                        {items.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        index
                                                    }
                                                    style={
                                                        styles.itemRow
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.itemNumber
                                                        }
                                                    >
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </div>


                                                    <div
                                                        style={{
                                                            flex: 2,
                                                        }}
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
                                                        >

                                                            <option value="">
                                                                Select product
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
                                                                        }{" "}
                                                                        — Stock:{" "}
                                                                        {
                                                                            product.stock_quantity
                                                                        }
                                                                    </option>
                                                                )
                                                            )}

                                                        </select>

                                                    </div>


                                                    <div
                                                        style={{
                                                            flex: 1,
                                                        }}
                                                    >

                                                        <label
                                                            style={
                                                                styles.smallLabel
                                                            }
                                                        >
                                                            Qty
                                                        </label>

                                                        <input
                                                            type="number"
                                                            min="1"
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
                                                        />

                                                    </div>


                                                    <div
                                                        style={{
                                                            flex: 1,
                                                        }}
                                                    >

                                                        <label
                                                            style={
                                                                styles.smallLabel
                                                            }
                                                        >
                                                            Selling Price
                                                        </label>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                item.selling_price
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "selling_price",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            style={
                                                                styles.input
                                                            }
                                                        />

                                                    </div>


                                                    <div
                                                        style={
                                                            styles.subtotalBox
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
                                                            ₹
                                                            {Number(
                                                                item.subtotal ||
                                                                    0
                                                            ).toFixed(
                                                                2
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
                                                        style={
                                                            styles.removeItemButton
                                                        }
                                                        disabled={
                                                            items.length ===
                                                            1
                                                        }
                                                    >
                                                        ×
                                                    </button>

                                                </div>

                                            )
                                        )}

                                    </div>


                                    <div
                                        style={
                                            styles.totalBox
                                        }
                                    >

                                        <span>
                                            Grand Total
                                        </span>

                                        <strong>
                                            ₹
                                            {grandTotal.toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                }
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* ACTIONS */}

                                <div
                                    style={
                                        styles.modalActions
                                    }
                                >

                                    <button
                                        type="button"
                                        onClick={
                                            closeModal
                                        }
                                        style={
                                            styles.cancelButton
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        style={
                                            styles.saveButton
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingSale
                                            ? "Update Sale"
                                            : "Save Sale"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}


                {/* =================================================
                    VIEW INVOICE
                ================================================== */}

                {showInvoice &&
                    selectedSale && (

                        <div
                            className="invoice-overlay"
                            style={
                                styles.modalOverlay
                            }
                        >

                            <div
                                className="print-invoice"
                                style={
                                    styles.invoiceModal
                                }
                            >

                                {/* INVOICE HEADER */}

                                <div
                                    style={
                                        styles.invoiceTop
                                    }
                                >

                                    <div
                                        style={
                                            styles.businessHeader
                                        }
                                    >

                                        {/* BUSINESS LOGO */}

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

                                            {/* BUSINESS NAME */}

                                            <div
                                                style={
                                                    styles.invoiceBrand
                                                }
                                            >
                                                {businessSettings?.business_name ||
                                                    "BUSINESS ACCOUNTING"}
                                            </div>


                                            {/* ADDRESS */}

                                            {businessSettings?.address && (
                                                <div
                                                    style={
                                                        styles.businessDetail
                                                    }
                                                >
                                                    {
                                                        businessSettings.address
                                                    }
                                                </div>
                                            )}


                                            {/* PHONE */}

                                            {businessSettings?.phone && (
                                                <div
                                                    style={
                                                        styles.businessDetail
                                                    }
                                                >
                                                    Phone:{" "}
                                                    {
                                                        businessSettings.phone
                                                    }
                                                </div>
                                            )}


                                            {/* EMAIL */}

                                            {businessSettings?.email && (
                                                <div
                                                    style={
                                                        styles.businessDetail
                                                    }
                                                >
                                                    Email:{" "}
                                                    {
                                                        businessSettings.email
                                                    }
                                                </div>
                                            )}


                                            {/* GST */}

                                            {businessSettings?.gst_number && (
                                                <div
                                                    style={
                                                        styles.businessDetail
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


                                    <button
                                        onClick={
                                            closeInvoice
                                        }
                                        className="no-print"
                                        style={
                                            styles.closeButton
                                        }
                                    >
                                        ×
                                    </button>

                                </div>


                                {/* INVOICE TITLE */}

                                <h2
                                    style={
                                        styles.invoiceTitle
                                    }
                                >
                                    SALES INVOICE
                                </h2>


                                {/* INVOICE META */}

                                <div
                                    style={
                                        styles.invoiceMeta
                                    }
                                >

                                    <div>

                                        <span
                                            style={
                                                styles.metaLabel
                                            }
                                        >
                                            Invoice Number
                                        </span>

                                        <strong>
                                            {
                                                selectedSale.invoice_number
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span
                                            style={
                                                styles.metaLabel
                                            }
                                        >
                                            Sale Date
                                        </span>

                                        <strong>
                                            {
                                                selectedSale.sale_date
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span
                                            style={
                                                styles.metaLabel
                                            }
                                        >
                                            Payment Status
                                        </span>

                                        <span
                                            style={{
                                                ...styles.statusBadge,

                                                ...(selectedSale.payment_status ===
                                                "Paid"
                                                    ? styles.paid
                                                    : selectedSale.payment_status ===
                                                      "Partial"
                                                    ? styles.partial
                                                    : styles.pending),
                                            }}
                                        >
                                            {
                                                selectedSale.payment_status
                                            }
                                        </span>

                                    </div>

                                </div>


                                {/* CUSTOMER */}

                                <div
                                    style={
                                        styles.customerBox
                                    }
                                >

                                    <span
                                        style={
                                            styles.metaLabel
                                        }
                                    >
                                        Bill To
                                    </span>


                                    <strong
                                        style={{
                                            fontSize:
                                                "18px",
                                        }}
                                    >
                                        {selectedSale.customer_name ||
                                            getCustomerName(
                                                selectedSale.customer
                                            )}
                                    </strong>


                                    {invoiceCustomer?.email && (
                                        <div
                                            style={
                                                styles.customerDetail
                                            }
                                        >
                                            {
                                                invoiceCustomer.email
                                            }
                                        </div>
                                    )}


                                    {invoiceCustomer?.phone && (
                                        <div
                                            style={
                                                styles.customerDetail
                                            }
                                        >
                                            {
                                                invoiceCustomer.phone
                                            }
                                        </div>
                                    )}


                                    {invoiceCustomer?.address && (
                                        <div
                                            style={
                                                styles.customerDetail
                                            }
                                        >
                                            {
                                                invoiceCustomer.address
                                            }
                                        </div>
                                    )}

                                </div>


                                {/* ITEMS */}

                                <div
                                    style={
                                        styles.invoiceTableWrapper
                                    }
                                >

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
                                                    style={{
                                                        ...styles.invoiceTh,
                                                        textAlign:
                                                            "left",
                                                    }}
                                                >
                                                    Product
                                                </th>

                                                <th
                                                    style={
                                                        styles.invoiceTh
                                                    }
                                                >
                                                    Qty
                                                </th>

                                                <th
                                                    style={
                                                        styles.invoiceTh
                                                    }
                                                >
                                                    Price
                                                </th>

                                                <th
                                                    style={
                                                        styles.invoiceTh
                                                    }
                                                >
                                                    Subtotal
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {invoiceItems.length >
                                            0 ? (

                                                invoiceItems.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => {

                                                        const subtotal =
                                                            Number(
                                                                item.subtotal ||
                                                                    Number(
                                                                        item.quantity ||
                                                                            0
                                                                    ) *
                                                                        Number(
                                                                            item.selling_price ||
                                                                                0
                                                                        )
                                                            );

                                                        return (
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
                                                                    {
                                                                        index +
                                                                        1
                                                                    }
                                                                </td>


                                                                <td
                                                                    style={{
                                                                        ...styles.invoiceTd,
                                                                        textAlign:
                                                                            "left",
                                                                    }}
                                                                >
                                                                    {item.product_name ||
                                                                        getProductName(
                                                                            item.product
                                                                        )}
                                                                </td>


                                                                <td
                                                                    style={
                                                                        styles.invoiceTd
                                                                    }
                                                                >
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </td>


                                                                <td
                                                                    style={
                                                                        styles.invoiceTd
                                                                    }
                                                                >
                                                                    ₹
                                                                    {Number(
                                                                        item.selling_price ||
                                                                            0
                                                                    ).toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </td>


                                                                <td
                                                                    style={
                                                                        styles.invoiceTd
                                                                    }
                                                                >
                                                                    ₹
                                                                    {subtotal.toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </td>

                                                            </tr>
                                                        );
                                                    }
                                                )

                                            ) : (

                                                <tr>

                                                    <td
                                                        colSpan="5"
                                                        style={{
                                                            ...styles.invoiceTd,
                                                            padding:
                                                                "25px",
                                                        }}
                                                    >
                                                        No sale
                                                        items
                                                        found.
                                                    </td>

                                                </tr>

                                            )}

                                        </tbody>

                                    </table>

                                </div>


                                {/* TOTAL */}

                                <div
                                    style={
                                        styles.invoiceBottom
                                    }
                                >

                                    <span>
                                        Grand Total
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            selectedSale.total_amount ||
                                                0
                                        ).toLocaleString(
                                            "en-IN",
                                            {
                                                minimumFractionDigits: 2,
                                            }
                                        )}
                                    </strong>

                                </div>


                                {/* FOOTER */}

                                <div
                                    style={
                                        styles.invoiceFooter
                                    }
                                >
                                    Thank you for
                                    your business!
                                </div>


                                {/* INVOICE ACTIONS */}

                                <div
                                    className="no-print"
                                    style={
                                        styles.invoiceActions
                                    }
                                >

                                    <button
                                        onClick={
                                            handlePrintInvoice
                                        }
                                        style={
                                            styles.printButton
                                        }
                                    >
                                        🖨️ Print
                                        Invoice
                                    </button>

                                    <button
                                        onClick={
                                            closeInvoice
                                        }
                                        style={
                                            styles.cancelButton
                                        }
                                    >
                                        Close
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}


                {/* =================================================
                    PRINT CSS
                ================================================== */}

                <style>
                    {`
                        @media print {

                            @page {
                                size: A4;
                                margin: 12mm;
                            }

                            html,
                            body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                            }

                            body * {
                                visibility: hidden !important;
                            }

                            .invoice-overlay {
                                position: static !important;
                                display: block !important;
                                background: white !important;
                                padding: 0 !important;
                                margin: 0 !important;
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
                                max-width: none !important;
                                max-height: none !important;
                                overflow: visible !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                border-radius: 0 !important;
                                box-shadow: none !important;
                                background: white !important;
                            }

                            .no-print {
                                display: none !important;
                            }
                        }
                    `}
                </style>

            </div>
        </Layout>
    );
}


// =============================================================
// STYLES
// =============================================================

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
    },


    title: {
        margin: 0,
        fontSize: "30px",
        fontWeight: 700,
        color: "#0f172a",
    },


    subtitle: {
        margin: "6px 0 0",
        color: "#64748b",
        fontSize: "14px",
    },


    primaryButton: {
        border: "none",
        borderRadius: "8px",
        padding: "12px 18px",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "14px",
    },


    errorBox: {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "14px 16px",
        marginBottom: "20px",
        fontSize: "14px",
    },


    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "18px",
        marginBottom: "22px",
    },


    statCard: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "20px",
        boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.04)",
    },


    statLabel: {
        fontSize: "13px",
        color: "#64748b",
        marginBottom: "8px",
    },


    statValue: {
        fontSize: "24px",
        fontWeight: 700,
        color: "#0f172a",
    },


    toolbar: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
    },


    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "11px 14px",
        fontSize: "14px",
        outline: "none",
    },


    card: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow:
            "0 2px 8px rgba(15, 23, 42, 0.04)",
    },


    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 20px",
        borderBottom:
            "1px solid #e2e8f0",
    },


    cardTitle: {
        margin: 0,
        fontSize: "18px",
        color: "#0f172a",
    },


    countBadge: {
        background: "#eff6ff",
        color: "#2563eb",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
    },


    table: {
        width: "100%",
        borderCollapse: "collapse",
    },


    th: {
        padding: "13px 16px",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "12px",
        textAlign: "left",
        fontWeight: 700,
        borderBottom:
            "1px solid #e2e8f0",
        whiteSpace: "nowrap",
    },


    td: {
        padding: "15px 16px",
        borderBottom:
            "1px solid #f1f5f9",
        color: "#334155",
        fontSize: "14px",
    },


    tr: {
        transition:
            "background 0.2s",
    },


    statusBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
    },


    paid: {
        background: "#dcfce7",
        color: "#15803d",
    },


    pending: {
        background: "#fee2e2",
        color: "#b91c1c",
    },


    partial: {
        background: "#fef3c7",
        color: "#b45309",
    },


    viewButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "7px 11px",
        borderRadius: "6px",
        cursor: "pointer",
        marginRight: "5px",
        fontSize: "12px",
        fontWeight: 600,
    },


    editButton: {
        border: "none",
        background: "#f59e0b",
        color: "#fff",
        padding: "7px 11px",
        borderRadius: "6px",
        cursor: "pointer",
        marginRight: "5px",
        fontSize: "12px",
        fontWeight: 600,
    },


    deleteButton: {
        border: "none",
        background: "#dc2626",
        color: "#fff",
        padding: "7px 11px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
    },


    emptyState: {
        textAlign: "center",
        padding: "70px 20px",
        color: "#64748b",
    },


    modalOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        boxSizing: "border-box",
    },


    formModal: {
        width: "100%",
        maxWidth: "1050px",
        maxHeight: "92vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "14px",
        boxShadow:
            "0 25px 70px rgba(0,0,0,0.25)",
    },


    invoiceModal: {
        width: "100%",
        maxWidth: "850px",
        maxHeight: "92vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "14px",
        padding: "32px",
        boxSizing: "border-box",
        boxShadow:
            "0 25px 70px rgba(0,0,0,0.25)",
    },


    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "24px 28px",
        borderBottom:
            "1px solid #e2e8f0",
    },


    modalTitle: {
        margin: 0,
        fontSize: "22px",
        color: "#0f172a",
    },


    modalSubtitle: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "13px",
    },


    closeButton: {
        border: "none",
        background: "transparent",
        color: "#64748b",
        fontSize: "30px",
        lineHeight: 1,
        cursor: "pointer",
    },


    section: {
        padding: "24px 28px",
        borderBottom:
            "1px solid #e2e8f0",
    },


    sectionTitle: {
        margin: "0 0 18px",
        fontSize: "16px",
        color: "#0f172a",
    },


    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "18px",
    },


    label: {
        display: "block",
        marginBottom: "7px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#334155",
    },


    smallLabel: {
        display: "block",
        marginBottom: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color: "#64748b",
    },


    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "7px",
        fontSize: "13px",
        outline: "none",
        background: "#fff",
    },


    itemsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },


    addItemButton: {
        border: "none",
        background: "#eff6ff",
        color: "#2563eb",
        padding: "8px 12px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "12px",
    },


    itemList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },


    itemRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
        padding: "14px",
        background: "#f8fafc",
        borderRadius: "9px",
        border:
            "1px solid #e2e8f0",
    },


    itemNumber: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#2563eb",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700,
        flexShrink: 0,
    },


    subtotalBox: {
        flex: 1,
    },


    subtotal: {
        height: "39px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        background: "#fff",
        border:
            "1px solid #cbd5e1",
        borderRadius: "7px",
        fontSize: "13px",
        fontWeight: 600,
    },


    removeItemButton: {
        width: "32px",
        height: "38px",
        border: "none",
        borderRadius: "7px",
        background: "#fee2e2",
        color: "#dc2626",
        fontSize: "20px",
        cursor: "pointer",
        flexShrink: 0,
    },


    totalBox: {
        marginTop: "20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "50px",
        padding: "18px",
        background: "#f8fafc",
        borderRadius: "8px",
        fontSize: "18px",
        color: "#0f172a",
    },


    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "20px 28px",
    },


    cancelButton: {
        border:
            "1px solid #cbd5e1",
        background: "#fff",
        color: "#334155",
        padding: "10px 18px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
    },


    saveButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
    },


    // =========================================================
    // INVOICE
    // =========================================================

    invoiceTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingBottom: "22px",
        borderBottom:
            "2px solid #0f172a",
    },


    // NEW: Business header
    businessHeader: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        flex: 1,
    },


    // NEW: Business logo
    businessLogo: {
        width: "70px",
        height: "70px",
        objectFit: "contain",
        borderRadius: "8px",
        border:
            "1px solid #e2e8f0",
        padding: "5px",
        background: "#ffffff",
        flexShrink: 0,
    },


    invoiceBrand: {
        fontSize: "13px",
        fontWeight: 800,
        letterSpacing: "1px",
        color: "#2563eb",
        marginBottom: "6px",
        textTransform: "uppercase",
    },


    // NEW: Business details
    businessDetail: {
        fontSize: "10px",
        color: "#64748b",
        marginTop: "3px",
        lineHeight: "1.4",
        maxWidth: "500px",
        wordBreak: "break-word",
    },


    invoiceTitle: {
        margin: "18px 0 0",
        fontSize: "25px",
        color: "#0f172a",
    },


    invoiceMeta: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, 1fr)",
        gap: "20px",
        padding: "22px 0",
        borderBottom:
            "1px solid #e2e8f0",
    },


    metaLabel: {
        display: "block",
        color: "#64748b",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing:
            "0.5px",
        marginBottom: "6px",
    },


    customerBox: {
        padding: "20px 0",
        borderBottom:
            "1px solid #e2e8f0",
    },


    customerDetail: {
        color: "#64748b",
        fontSize: "13px",
        marginTop: "4px",
    },


    invoiceTableWrapper: {
        overflowX: "auto",
        marginTop: "20px",
    },


    invoiceTable: {
        width: "100%",
        borderCollapse: "collapse",
    },


    invoiceTh: {
        padding: "12px",
        background: "#f8fafc",
        borderTop:
            "1px solid #e2e8f0",
        borderBottom:
            "1px solid #e2e8f0",
        fontSize: "12px",
        color: "#475569",
        textAlign: "center",
    },


    invoiceTd: {
        padding: "13px 12px",
        borderBottom:
            "1px solid #f1f5f9",
        fontSize: "13px",
        color: "#334155",
        textAlign: "center",
    },


    invoiceBottom: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "60px",
        marginTop: "24px",
        paddingTop: "18px",
        borderTop:
            "2px solid #0f172a",
        fontSize: "20px",
        color: "#0f172a",
    },


    invoiceFooter: {
        textAlign: "center",
        marginTop: "35px",
        paddingTop: "15px",
        borderTop:
            "1px solid #e2e8f0",
        color: "#64748b",
        fontSize: "12px",
    },


    invoiceActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "25px",
    },


    printButton: {
        border: "none",
        background: "#2563eb",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
    },
};


export default Sales;