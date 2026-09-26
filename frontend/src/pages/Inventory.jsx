import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Inventory() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState("products");
    const [search, setSearch] = useState("");

    const [showProductModal, setShowProductModal] =
        useState(false);
    const [showCategoryModal, setShowCategoryModal] =
        useState(false);

    const [editingProduct, setEditingProduct] =
        useState(null);
    const [editingCategory, setEditingCategory] =
        useState(null);

    const [error, setError] = useState("");

    const [productForm, setProductForm] = useState({
        category: "",
        name: "",
        sku: "",
        purchase_price: "",
        selling_price: "",
        stock_quantity: "",
        minimum_stock: "",
        description: "",
    });

    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
    });

    // =========================
    // FETCH PRODUCTS & CATEGORIES
    // =========================
    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [productsResponse, categoriesResponse] =
                await Promise.all([
                    api.get("products/"),
                    api.get("categories/"),
                ]);

            setProducts(productsResponse.data);
            setCategories(categoriesResponse.data);
        } catch (err) {
            console.error(
                "Failed to load inventory:",
                err
            );

            setError(
                err.response?.data?.detail ||
                    "Failed to load inventory."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // PRODUCT FORM
    // =========================
    const handleProductChange = (e) => {
        const { name, value } = e.target;

        setProductForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // CATEGORY FORM
    // =========================
    const handleCategoryChange = (e) => {
        const { name, value } = e.target;

        setCategoryForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // OPEN ADD PRODUCT
    // =========================
    const openAddProduct = () => {
        setEditingProduct(null);

        setProductForm({
            category: "",
            name: "",
            sku: "",
            purchase_price: "",
            selling_price: "",
            stock_quantity: "",
            minimum_stock: "",
            description: "",
        });

        setError("");
        setShowProductModal(true);
    };

    // =========================
    // OPEN EDIT PRODUCT
    // =========================
    const openEditProduct = (product) => {
        setEditingProduct(product);

        setProductForm({
            category: product.category || "",
            name: product.name || "",
            sku: product.sku || "",
            purchase_price:
                product.purchase_price ?? "",
            selling_price:
                product.selling_price ?? "",
            stock_quantity:
                product.stock_quantity ?? "",
            minimum_stock:
                product.minimum_stock ?? "",
            description:
                product.description || "",
        });

        setError("");
        setShowProductModal(true);
    };

    // =========================
    // CLOSE PRODUCT MODAL
    // =========================
    const closeProductModal = () => {
        if (saving) return;

        setShowProductModal(false);
        setEditingProduct(null);

        setProductForm({
            category: "",
            name: "",
            sku: "",
            purchase_price: "",
            selling_price: "",
            stock_quantity: "",
            minimum_stock: "",
            description: "",
        });

        setError("");
    };

    // =========================
    // SAVE PRODUCT
    // =========================
    const handleProductSubmit = async (e) => {
        e.preventDefault();

        if (!productForm.name.trim()) {
            setError("Product name is required.");
            return;
        }

        if (!productForm.category) {
            setError("Please select a category.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const data = {
                ...productForm,
                category: Number(productForm.category),
                purchase_price:
                    productForm.purchase_price || 0,
                selling_price:
                    productForm.selling_price || 0,
                stock_quantity:
                    productForm.stock_quantity || 0,
                minimum_stock:
                    productForm.minimum_stock || 0,
            };

            if (editingProduct) {
                await api.put(
                    `products/${editingProduct.id}/`,
                    data
                );
            } else {
                await api.post("products/", data);
            }

            await fetchData();
            closeProductModal();
        } catch (err) {
            console.error(
                "Failed to save product:",
                err
            );

            console.log(
                "Server response:",
                err.response?.data
            );

            const responseData = err.response?.data;

            if (responseData?.sku) {
                setError(
                    Array.isArray(responseData.sku)
                        ? responseData.sku.join(" ")
                        : responseData.sku
                );
            } else if (responseData?.category) {
                setError(
                    Array.isArray(responseData.category)
                        ? responseData.category.join(" ")
                        : responseData.category
                );
            } else if (responseData?.name) {
                setError(
                    Array.isArray(responseData.name)
                        ? responseData.name.join(" ")
                        : responseData.name
                );
            } else if (responseData?.detail) {
                setError(responseData.detail);
            } else {
                setError("Failed to save product.");
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // DELETE PRODUCT
    // =========================
    const handleDeleteProduct = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`products/${id}/`);

            setProducts((prev) =>
                prev.filter(
                    (product) => product.id !== id
                )
            );
        } catch (err) {
            console.error(
                "Failed to delete product:",
                err
            );

            alert(
                err.response?.data?.detail ||
                    "Failed to delete product."
            );
        }
    };

    // =========================
    // OPEN ADD CATEGORY
    // =========================
    const openAddCategory = () => {
        setEditingCategory(null);

        setCategoryForm({
            name: "",
            description: "",
        });

        setError("");
        setShowCategoryModal(true);
    };

    // =========================
    // OPEN EDIT CATEGORY
    // =========================
    const openEditCategory = (category) => {
        setEditingCategory(category);

        setCategoryForm({
            name: category.name || "",
            description:
                category.description || "",
        });

        setError("");
        setShowCategoryModal(true);
    };

    // =========================
    // CLOSE CATEGORY MODAL
    // =========================
    const closeCategoryModal = () => {
        if (saving) return;

        setShowCategoryModal(false);
        setEditingCategory(null);

        setCategoryForm({
            name: "",
            description: "",
        });

        setError("");
    };

    // =========================
    // SAVE CATEGORY
    // =========================
    const handleCategorySubmit = async (e) => {
        e.preventDefault();

        if (!categoryForm.name.trim()) {
            setError("Category name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingCategory) {
                await api.put(
                    `categories/${editingCategory.id}/`,
                    categoryForm
                );
            } else {
                await api.post(
                    "categories/",
                    categoryForm
                );
            }

            await fetchData();
            closeCategoryModal();
        } catch (err) {
            console.error(
                "Failed to save category:",
                err
            );

            console.log(
                "Server response:",
                err.response?.data
            );

            const responseData = err.response?.data;

            if (responseData?.name) {
                setError(
                    Array.isArray(responseData.name)
                        ? responseData.name.join(" ")
                        : responseData.name
                );
            } else if (responseData?.detail) {
                setError(responseData.detail);
            } else {
                setError("Failed to save category.");
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // DELETE CATEGORY
    // =========================
    const handleDeleteCategory = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this category?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`categories/${id}/`);

            setCategories((prev) =>
                prev.filter(
                    (category) => category.id !== id
                )
            );
        } catch (err) {
            console.error(
                "Failed to delete category:",
                err
            );

            alert(
                err.response?.data?.detail ||
                    "Failed to delete category. It may contain products."
            );
        }
    };

    // =========================
    // CATEGORY NAME
    // =========================
    const getCategoryName = (categoryId) => {
        const category = categories.find(
            (item) => item.id === Number(categoryId)
        );

        return category?.name || "—";
    };

    // =========================
    // FILTER PRODUCTS
    // =========================
    const filteredProducts = products.filter(
        (product) => {
            const text = search.toLowerCase();

            return (
                product.name
                    ?.toLowerCase()
                    .includes(text) ||
                product.sku
                    ?.toLowerCase()
                    .includes(text) ||
                getCategoryName(product.category)
                    .toLowerCase()
                    .includes(text)
            );
        }
    );

    // =========================
    // FILTER CATEGORIES
    // =========================
    const filteredCategories = categories.filter(
        (category) => {
            const text = search.toLowerCase();

            return (
                category.name
                    ?.toLowerCase()
                    .includes(text) ||
                category.description
                    ?.toLowerCase()
                    .includes(text)
            );
        }
    );

    const lowStockCount = products.filter(
        (product) =>
            Number(product.stock_quantity) <=
            Number(product.minimum_stock)
    ).length;

    const totalStockUnits = products.reduce(
        (total, product) =>
            total + Number(product.stock_quantity || 0),
        0
    );

    return (
        <Layout>
            <div style={styles.page}>

                {/* ================= HEADER ================= */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            Inventory
                        </h1>

                        <p style={styles.subtitle}>
                            Manage products, categories and
                            stock levels.
                        </p>
                    </div>

                    <div style={styles.headerButtons}>
                        <button
                            style={
                                styles.secondaryButton
                            }
                            onClick={openAddCategory}
                        >
                            + Category
                        </button>

                        <button
                            style={styles.addButton}
                            onClick={openAddProduct}
                        >
                            + Add Product
                        </button>
                    </div>
                </div>

                {/* ================= STATS ================= */}
                <div style={styles.statsGrid}>

                    <div style={styles.statCard}>
                        <div
                            style={styles.statIcon}
                        >
                            📦
                        </div>

                        <div>
                            <div
                                style={
                                    styles.statLabel
                                }
                            >
                                Total Products
                            </div>

                            <div
                                style={
                                    styles.statValue
                                }
                            >
                                {products.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div
                            style={styles.statIcon}
                        >
                            🗂️
                        </div>

                        <div>
                            <div
                                style={
                                    styles.statLabel
                                }
                            >
                                Categories
                            </div>

                            <div
                                style={
                                    styles.statValue
                                }
                            >
                                {categories.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div
                            style={{
                                ...styles.statIcon,
                                background:
                                    lowStockCount > 0
                                        ? "#fff7ed"
                                        : "#f0fdf4",
                            }}
                        >
                            ⚠️
                        </div>

                        <div>
                            <div
                                style={
                                    styles.statLabel
                                }
                            >
                                Low Stock
                            </div>

                            <div
                                style={{
                                    ...styles.statValue,
                                    color:
                                        lowStockCount >
                                        0
                                            ? "#ea580c"
                                            : "#16a34a",
                                }}
                            >
                                {lowStockCount}
                            </div>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div
                            style={styles.statIcon}
                        >
                            📊
                        </div>

                        <div>
                            <div
                                style={
                                    styles.statLabel
                                }
                            >
                                Stock Units
                            </div>

                            <div
                                style={
                                    styles.statValue
                                }
                            >
                                {totalStockUnits}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= CONTENT CARD ================= */}
                <div style={styles.card}>

                    {/* TABS + SEARCH */}
                    <div style={styles.toolbar}>

                        <div style={styles.tabs}>
                            <button
                                style={
                                    activeTab ===
                                    "products"
                                        ? styles.activeTab
                                        : styles.tab
                                }
                                onClick={() => {
                                    setActiveTab(
                                        "products"
                                    );
                                    setSearch("");
                                }}
                            >
                                Products
                            </button>

                            <button
                                style={
                                    activeTab ===
                                    "categories"
                                        ? styles.activeTab
                                        : styles.tab
                                }
                                onClick={() => {
                                    setActiveTab(
                                        "categories"
                                    );
                                    setSearch("");
                                }}
                            >
                                Categories
                            </button>
                        </div>

                        <div
                            style={
                                styles.searchWrapper
                            }
                        >
                            <span
                                style={
                                    styles.searchIcon
                                }
                            >
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder={
                                    activeTab ===
                                    "products"
                                        ? "Search products..."
                                        : "Search categories..."
                                }
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
                    </div>

                    {/* ERROR */}
                    {error &&
                        !showProductModal &&
                        !showCategoryModal && (
                            <div
                                style={
                                    styles.errorBox
                                }
                            >
                                {error}
                            </div>
                        )}

                    {/* LOADING */}
                    {loading ? (
                        <div
                            style={
                                styles.emptyState
                            }
                        >
                            <div
                                style={
                                    styles.loadingIcon
                                }
                            >
                                ⟳
                            </div>

                            <p>
                                Loading inventory...
                            </p>
                        </div>
                    ) : activeTab ===
                      "products" ? (
                        /* ================= PRODUCTS TABLE ================= */
                        filteredProducts.length ===
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
                                    📦
                                </div>

                                <h3
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    No products found
                                </h3>

                                <p
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    {search
                                        ? "Try changing your search."
                                        : "Add your first product to get started."}
                                </p>

                                {!search && (
                                    <button
                                        style={
                                            styles.emptyButton
                                        }
                                        onClick={
                                            openAddProduct
                                        }
                                    >
                                        + Add Product
                                    </button>
                                )}
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
                                                Product
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Category
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                SKU
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Purchase
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Selling
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Stock
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
                                        {filteredProducts.map(
                                            (product) => {
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

                                                const isLow =
                                                    stock <=
                                                    minimum;

                                                return (
                                                    <tr
                                                        key={
                                                            product.id
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
                                                            <div
                                                                style={
                                                                    styles.productCell
                                                                }
                                                            >
                                                                <div
                                                                    style={
                                                                        styles.productIcon
                                                                    }
                                                                >
                                                                    📦
                                                                </div>

                                                                <div>
                                                                    <div
                                                                        style={
                                                                            styles.productName
                                                                        }
                                                                    >
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </div>

                                                                    <div
                                                                        style={
                                                                            styles.productId
                                                                        }
                                                                    >
                                                                        ID:{" "}
                                                                        {
                                                                            product.id
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
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
                                                                {getCategoryName(
                                                                    product.category
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {product.sku ||
                                                                "—"}
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            ₹
                                                            {Number(
                                                                product.purchase_price ||
                                                                    0
                                                            ).toFixed(
                                                                2
                                                            )}
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            ₹
                                                            {Number(
                                                                product.selling_price ||
                                                                    0
                                                            ).toFixed(
                                                                2
                                                            )}
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            <span
                                                                style={
                                                                    isLow
                                                                        ? styles.lowStockBadge
                                                                        : styles.stockBadge
                                                                }
                                                            >
                                                                {
                                                                    stock
                                                                }{" "}
                                                                {isLow
                                                                    ? "Low"
                                                                    : "In Stock"}
                                                            </span>
                                                        </td>

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
                                                                        openEditProduct(
                                                                            product
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
                                                                        handleDeleteProduct(
                                                                            product.id
                                                                        )
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
                        )
                    ) : (
                        /* ================= CATEGORIES TABLE ================= */
                        filteredCategories.length ===
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
                                    🗂️
                                </div>

                                <h3
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    No categories found
                                </h3>

                                <p
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    {search
                                        ? "Try changing your search."
                                        : "Add your first category to get started."}
                                </p>

                                {!search && (
                                    <button
                                        style={
                                            styles.emptyButton
                                        }
                                        onClick={
                                            openAddCategory
                                        }
                                    >
                                        + Add Category
                                    </button>
                                )}
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
                                                Category
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Description
                                            </th>

                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Products
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
                                        {filteredCategories.map(
                                            (category) => {
                                                const productCount =
                                                    products.filter(
                                                        (
                                                            product
                                                        ) =>
                                                            Number(
                                                                product.category
                                                            ) ===
                                                            Number(
                                                                category.id
                                                            )
                                                    ).length;

                                                return (
                                                    <tr
                                                        key={
                                                            category.id
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
                                                            <div
                                                                style={
                                                                    styles.productCell
                                                                }
                                                            >
                                                                <div
                                                                    style={
                                                                        styles.categoryIcon
                                                                    }
                                                                >
                                                                    🗂️
                                                                </div>

                                                                <div>
                                                                    <div
                                                                        style={
                                                                            styles.productName
                                                                        }
                                                                    >
                                                                        {
                                                                            category.name
                                                                        }
                                                                    </div>

                                                                    <div
                                                                        style={
                                                                            styles.productId
                                                                        }
                                                                    >
                                                                        ID:{" "}
                                                                        {
                                                                            category.id
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            {
                                                                category.description ||
                                                                "—"
                                                            }
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
                                                                    productCount
                                                                }{" "}
                                                                products
                                                            </span>
                                                        </td>

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
                                                                        openEditCategory(
                                                                            category
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
                                                                        handleDeleteCategory(
                                                                            category.id
                                                                        )
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
                        )
                    )}
                </div>
            </div>

            {/* ================= PRODUCT MODAL ================= */}
            {showProductModal && (
                <div
                    style={
                        styles.modalOverlay
                    }
                    onClick={closeProductModal}
                >
                    <div
                        style={styles.modal}
                        onClick={(e) =>
                            e.stopPropagation()
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
                                    {editingProduct
                                        ? "Edit Product"
                                        : "Add Product"}
                                </h2>

                                <p
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    {editingProduct
                                        ? "Update product information."
                                        : "Enter the product details below."}
                                </p>
                            </div>

                            <button
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeProductModal
                                }
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div
                                style={
                                    styles.modalError
                                }
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleProductSubmit
                            }
                        >
                            <div
                                style={
                                    styles.formGrid
                                }
                            >
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Product Name
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
                                        name="name"
                                        value={
                                            productForm.name
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="Enter product name"
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Category
                                        <span
                                            style={
                                                styles.required
                                            }
                                        >
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="category"
                                        value={
                                            productForm.category
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        {categories.map(
                                            (
                                                category
                                            ) => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        SKU
                                    </label>

                                    <input
                                        type="text"
                                        name="sku"
                                        value={
                                            productForm.sku
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="Enter SKU"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Purchase Price
                                    </label>

                                    <input
                                        type="number"
                                        name="purchase_price"
                                        value={
                                            productForm.purchase_price
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Selling Price
                                    </label>

                                    <input
                                        type="number"
                                        name="selling_price"
                                        value={
                                            productForm.selling_price
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Stock Quantity
                                    </label>

                                    <input
                                        type="number"
                                        name="stock_quantity"
                                        value={
                                            productForm.stock_quantity
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Minimum Stock
                                    </label>

                                    <input
                                        type="number"
                                        name="minimum_stock"
                                        value={
                                            productForm.minimum_stock
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div
                                    style={{
                                        ...styles.formGroup,
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            productForm.description
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        placeholder="Enter product description"
                                        rows="3"
                                        style={
                                            styles.textarea
                                        }
                                    />
                                </div>
                            </div>

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
                                    onClick={
                                        closeProductModal
                                    }
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
                                        : editingProduct
                                        ? "Update Product"
                                        : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= CATEGORY MODAL ================= */}
            {showCategoryModal && (
                <div
                    style={
                        styles.modalOverlay
                    }
                    onClick={closeCategoryModal}
                >
                    <div
                        style={styles.smallModal}
                        onClick={(e) =>
                            e.stopPropagation()
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
                                    {editingCategory
                                        ? "Edit Category"
                                        : "Add Category"}
                                </h2>

                                <p
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Manage product
                                    categories.
                                </p>
                            </div>

                            <button
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeCategoryModal
                                }
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div
                                style={
                                    styles.modalError
                                }
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleCategorySubmit
                            }
                        >
                            <div
                                style={
                                    styles.categoryForm
                                }
                            >
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Category Name
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
                                        name="name"
                                        value={
                                            categoryForm.name
                                        }
                                        onChange={
                                            handleCategoryChange
                                        }
                                        placeholder="Enter category name"
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            categoryForm.description
                                        }
                                        onChange={
                                            handleCategoryChange
                                        }
                                        placeholder="Enter category description"
                                        rows="4"
                                        style={
                                            styles.textarea
                                        }
                                    />
                                </div>
                            </div>

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
                                    onClick={
                                        closeCategoryModal
                                    }
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
                                        : editingCategory
                                        ? "Update Category"
                                        : "Save Category"}
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

    headerButtons: {
        display: "flex",
        gap: "10px",
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
    },

    secondaryButton: {
        border: "1px solid #dbe4f0",
        borderRadius: "9px",
        padding: "12px 18px",
        background: "#fff",
        color: "#2563eb",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
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
        flexShrink: 0,
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
        padding: "16px 20px",
        borderBottom: "1px solid #edf0f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
    },

    tabs: {
        display: "flex",
        gap: "5px",
    },

    tab: {
        border: "none",
        background: "transparent",
        color: "#64748b",
        padding: "10px 16px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
    },

    activeTab: {
        border: "none",
        background: "#eff6ff",
        color: "#2563eb",
        padding: "10px 16px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "700",
    },

    searchWrapper: {
        width: "100%",
        maxWidth: "350px",
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
        padding: "10px 14px 10px 38px",
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

    productCell: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    productIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "9px",
        background: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
    },

    categoryIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "9px",
        background: "#f5f3ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
    },

    productName: {
        fontWeight: "600",
        color: "#172033",
        marginBottom: "3px",
    },

    productId: {
        fontSize: "11px",
        color: "#94a3b8",
    },

    categoryBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "6px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "11px",
        fontWeight: "600",
    },

    stockBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "6px",
        background: "#f0fdf4",
        color: "#15803d",
        fontSize: "11px",
        fontWeight: "700",
    },

    lowStockBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "6px",
        background: "#fff7ed",
        color: "#c2410c",
        fontSize: "11px",
        fontWeight: "700",
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
        maxWidth: "700px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "14px",
        boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.25)",
        overflow: "hidden",
    },

    smallModal: {
        width: "100%",
        maxWidth: "500px",
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

    categoryForm: {
        display: "flex",
        flexDirection: "column",
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

export default Inventory;