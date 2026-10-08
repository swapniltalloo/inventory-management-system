/**
 * Inventory Management System — Enterprise Frontend Application (INR / ₹ Currency)
 * Features: Rupee Currency Formatting (en-IN), Dark Theme Default, Professional SVG Iconography,
 *           Animated Stat Counters, Stacked Toast Queue, Modal Dialogs, CSV Export, Column Sorting, Quick Stock +/-
 */

const API_BASE = '/api/products';
const LOW_STOCK_THRESHOLD = 10;

// State
let editingProductId = null;
let searchTimeout = null;
let showingLowStock = false;
let pendingDeleteId = null;
let currentProducts = [];
let sortState = { column: 'product_id', direction: 'asc' };

// Professional SVG Icon templates (clean vector paths)
const ICONS = {
    edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    stock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
    price: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9"/></svg>`,
    trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0 10.29 3.86z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
};

/** Get category SVG icon based on category name */
function getCategoryIcon(catName) {
    const c = (catName || '').toLowerCase();
    if (c.includes('electr') || c.includes('tech') || c.includes('gadget') || c.includes('hardware')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    }
    if (c.includes('furnit') || c.includes('office') || c.includes('desk') || c.includes('chair')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/><path d="M4 17v4M20 17v4"/></svg>`;
    }
    if (c.includes('station') || c.includes('paper') || c.includes('book') || c.includes('pen')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    }
    if (c.includes('cloth') || c.includes('apparel') || c.includes('wear')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`;
    }
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
}

// ============================================================
// Initialization & Theme
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProducts();
    loadDashboardStats();
    updateTimestamp();
});

function initTheme() {
    const savedTheme = localStorage.getItem('inventory_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(false);
    } else {
        document.body.classList.remove('light-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('inventory_theme', isLight ? 'light' : 'dark');
    updateThemeIcon(!isLight);
    showToast(`Switched to ${isLight ? 'Light' : 'Dark'} mode`, 'success');
}

function updateThemeIcon(isDark) {
    const container = document.getElementById('themeIconContainer');
    if (container) {
        // Render clean single SVG icon inside the container span
        container.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    }
}

function updateTimestamp() {
    const el = document.getElementById('lastUpdated');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// ============================================================
// Dashboard Stats (Rupee en-IN Formatting)
// ============================================================

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const result = await response.json();
        if (result.success) {
            updateDashboard(result.data);
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

function updateDashboard(stats) {
    animateValue('totalProducts', stats.total_products);
    animateValue('totalStock', stats.total_stock);
    animateValue('lowStockCount', stats.low_stock_count);
    animateValue('inventoryValue', stats.inventory_value, '₹', true);

    const categoryFilter = document.getElementById('categoryFilter');
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    stats.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
    categoryFilter.value = currentValue;

    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    stats.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        categoryList.appendChild(option);
    });

    const alertBanner = document.getElementById('lowStockAlert');
    const alertMsg = document.getElementById('lowStockMessage');
    if (stats.low_stock_count > 0) {
        alertMsg.textContent = `${stats.low_stock_count} product(s) running low on stock (below ${LOW_STOCK_THRESHOLD} units)`;
        alertBanner.classList.remove('hidden');
    } else {
        alertBanner.classList.add('hidden');
    }
}

function animateValue(elementId, target, prefix = '', isDecimal = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const currentText = el.textContent.replace(/[^0-9.-]/g, '');
    const start = parseFloat(currentText) || 0;
    const duration = 500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;

        if (isDecimal) {
            el.textContent = prefix + current.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            el.textContent = prefix + Math.round(current).toLocaleString('en-IN');
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================================
// Product Loading & Sorting
// ============================================================

async function loadProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_BASE);
        const result = await response.json();
        if (result.success) {
            currentProducts = result.data;
            applySortAndRender();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('Failed to connect to server', 'error');
    } finally {
        showLoading(false);
    }
}

function sortTable(column) {
    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }

    ['product_id', 'name', 'category', 'quantity', 'price'].forEach(col => {
        const iconEl = document.getElementById(`sort-${col}`);
        if (iconEl) {
            if (col === sortState.column) {
                iconEl.textContent = sortState.direction === 'asc' ? '↑' : '↓';
            } else {
                iconEl.textContent = '↕';
            }
        }
    });

    applySortAndRender();
}

function applySortAndRender() {
    const sorted = [...currentProducts].sort((a, b) => {
        let valA = a[sortState.column];
        let valB = b[sortState.column];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderProducts(sorted);
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const productCount = document.getElementById('productCount');

    productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    tbody.innerHTML = products.map(product => {
        const isLowStock = product.quantity < LOW_STOCK_THRESHOLD;
        const isOutOfStock = product.quantity === 0;
        let statusBadge;

        if (isOutOfStock) {
            statusBadge = '<span class="badge badge-danger"><span class="badge-dot"></span>Out of Stock</span>';
        } else if (isLowStock) {
            statusBadge = '<span class="badge badge-warning"><span class="badge-dot"></span>Low Stock</span>';
        } else {
            statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span>In Stock</span>';
        }

        const pid = escapeHtml(product.product_id);
        const pname = escapeHtml(product.name);
        const pcat = escapeHtml(product.category);
        const catIcon = getCategoryIcon(product.category);
        const formattedPrice = product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return `
            <tr class="${isLowStock ? 'low-stock-row' : ''}">
                <td><span class="product-id-cell">${pid}</span></td>
                <td><span class="product-name-cell">${pname}</span></td>
                <td><span class="category-badge">${catIcon} ${pcat}</span></td>
                <td>
                    <div class="qty-wrapper">
                        <button class="quick-stock-btn" onclick="adjustStockInline('${pid}', -1)" title="Reduce stock by 1">&minus;</button>
                        <span class="quantity-cell">${product.quantity.toLocaleString('en-IN')}</span>
                        <button class="quick-stock-btn" onclick="adjustStockInline('${pid}', 1)" title="Increase stock by 1">&plus;</button>
                    </div>
                </td>
                <td><span class="price-cell">₹${formattedPrice}</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editProduct('${pid}')" title="Edit Product">${ICONS.edit}</button>
                        <button class="action-btn stock" onclick="openStockModal('${pid}', '${pname}', ${product.quantity})" title="Update Stock">${ICONS.stock}</button>
                        <button class="action-btn price" onclick="openPriceModal('${pid}', '${pname}', ${product.price})" title="Update Price">${ICONS.price}</button>
                        <button class="action-btn delete" onclick="deleteProduct('${pid}', '${pname}')" title="Delete Product">${ICONS.trash}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (show) {
        loading.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// ============================================================
// Quick Inline Stock Adjuster
// ============================================================

async function adjustStockInline(productId, delta) {
    try {
        const response = await fetch(`${API_BASE}/${productId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: delta })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`${productId} stock updated`, 'success');
            await refreshData();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Inline stock adjustment error:', error);
        showToast('Failed to adjust stock', 'error');
    }
}

// ============================================================
// Export to CSV (Rupee Notation)
// ============================================================

function exportCSV() {
    if (!currentProducts || currentProducts.length === 0) {
        showToast('No products available to export', 'warning');
        return;
    }

    const headers = ['Product ID', 'Name', 'Category', 'Quantity', 'Price (INR ₹)', 'Total Value (INR ₹)', 'Created At'];
    const rows = currentProducts.map(p => [
        `"${p.product_id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.quantity,
        p.price.toFixed(2),
        (p.quantity * p.price).toFixed(2),
        `"${p.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${currentProducts.length} items to ${filename}`, 'success');
}

// ============================================================
// Seed Sample Demo Data (INR ₹ Values)
// ============================================================

async function seedSampleData() {
    const samples = [
        { product_id: 'PRD-101', name: 'Logitech MX Master 3S Wireless Mouse', category: 'Electronics', quantity: 45, price: 8499.00 },
        { product_id: 'PRD-102', name: 'Keychron K2 Mechanical Keyboard', category: 'Electronics', quantity: 8, price: 7299.00 },
        { product_id: 'PRD-103', name: 'Ergonomic Mesh High-Back Office Chair', category: 'Furniture', quantity: 5, price: 14999.00 },
        { product_id: 'PRD-104', name: 'Dell UltraSharp 27" 4K Monitor', category: 'Electronics', quantity: 22, price: 38999.00 },
        { product_id: 'PRD-105', name: 'Motorized Adjustable Standing Desk', category: 'Furniture', quantity: 2, price: 29999.00 }
    ];

    let createdCount = 0;
    for (const sample of samples) {
        try {
            const resp = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sample)
            });
            const res = await resp.json();
            if (res.success) createdCount++;
        } catch (e) {
            console.error('Seed error:', e);
        }
    }

    if (createdCount > 0) {
        showToast(`Seeded ${createdCount} sample products!`, 'success');
        await refreshData();
    } else {
        showToast('Sample products already exist or couldn\'t be added.', 'warning');
    }
}

// ============================================================
// Add / Edit Product
// ============================================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const data = {
        product_id: document.getElementById('productId').value.trim(),
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        quantity: parseInt(document.getElementById('productQuantity').value),
        price: parseFloat(document.getElementById('productPrice').value)
    };

    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('submitSpinner');

    submitBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        let response;
        if (editingProductId) {
            response = await fetch(`${API_BASE}/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            resetForm();
            await refreshData();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showToast('Failed to connect to server', 'error');
    } finally {
        submitBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

function validateForm() {
    let isValid = true;

    const productId = document.getElementById('productId').value.trim();
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const quantity = document.getElementById('productQuantity').value;
    const price = document.getElementById('productPrice').value;

    clearFieldError('productId');
    clearFieldError('productName');
    clearFieldError('productCategory');
    clearFieldError('productQuantity');
    clearFieldError('productPrice');

    if (!productId) { setFieldError('productId', 'Product ID is required'); isValid = false; }
    if (!name) { setFieldError('productName', 'Product Name is required'); isValid = false; }
    if (!category) { setFieldError('productCategory', 'Category is required'); isValid = false; }

    if (quantity === '' || isNaN(quantity)) {
        setFieldError('productQuantity', 'Valid quantity is required'); isValid = false;
    } else if (parseInt(quantity) < 0) {
        setFieldError('productQuantity', 'Quantity cannot be negative'); isValid = false;
    }

    if (price === '' || isNaN(price)) {
        setFieldError('productPrice', 'Valid price is required'); isValid = false;
    } else if (parseFloat(price) < 0) {
        setFieldError('productPrice', 'Price cannot be negative'); isValid = false;
    }

    return isValid;
}

function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    input.classList.add('invalid');
    if (error) error.textContent = message;
}

function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    input.classList.remove('invalid');
    if (error) error.textContent = '';
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/${productId}`);
        const result = await response.json();

        if (result.success) {
            const product = result.data;
            document.getElementById('productId').value = product.product_id;
            document.getElementById('productId').disabled = true;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productQuantity').value = product.quantity;
            document.getElementById('productPrice').value = product.price;

            editingProductId = product.product_id;
            document.getElementById('formTitle').textContent = 'Edit Product Record';
            document.getElementById('submitBtnText').textContent = 'Update Product';
            document.getElementById('submitIcon').innerHTML = '<polyline points="20 6 9 17 4 12"/>';
            document.getElementById('cancelEdit').classList.remove('hidden');

            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Edit product error:', error);
        showToast('Failed to load product details', 'error');
    }
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').disabled = false;
    editingProductId = null;
    document.getElementById('formTitle').textContent = 'Add New Product Record';
    document.getElementById('submitBtnText').textContent = 'Add Product';
    document.getElementById('submitIcon').innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    document.getElementById('cancelEdit').classList.add('hidden');

    ['productId', 'productName', 'productCategory', 'productQuantity', 'productPrice'].forEach(clearFieldError);
}

// ============================================================
// Search & Filter
// ============================================================

function debounceSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('searchInput').value;
    const clearBtn = document.getElementById('clearSearch');

    clearBtn.classList.toggle('hidden', !query);
    showingLowStock = false;

    searchTimeout = setTimeout(() => {
        if (query.trim()) {
            searchProducts(query.trim());
        } else {
            loadProducts();
        }
    }, 300);
}

async function searchProducts(query) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        if (result.success) {
            currentProducts = result.data;
            applySortAndRender();
            if (result.data.length === 0) {
                showToast(`No products found for "${query}"`, 'warning');
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed', 'error');
    } finally {
        showLoading(false);
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    document.getElementById('categoryFilter').value = '';
    showingLowStock = false;
    loadProducts();
}

async function filterByCategory() {
    const category = document.getElementById('categoryFilter').value;
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    showingLowStock = false;

    if (!category) { loadProducts(); return; }
    searchProducts(category);
}

async function showLowStockProducts() {
    showLoading(true);
    showingLowStock = true;
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    document.getElementById('categoryFilter').value = '';

    try {
        const response = await fetch(`${API_BASE}/low-stock`);
        const result = await response.json();
        if (result.success) {
            currentProducts = result.data;
            applySortAndRender();
            if (result.data.length === 0) {
                showToast('No low-stock products found', 'success');
            } else {
                showToast(`Found ${result.data.length} low-stock products`, 'warning');
            }
        }
    } catch (error) {
        console.error('Low stock fetch error:', error);
        showToast('Failed to load low-stock products', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================================
// Stock Update Modal
// ============================================================

let currentStockProductId = null;

function openStockModal(productId, name, currentQty) {
    currentStockProductId = productId;
    document.getElementById('stockProductName').textContent = name;
    document.getElementById('stockCurrentQty').textContent = currentQty;
    document.getElementById('stockChange').value = '';
    document.getElementById('stockChangeError').textContent = '';
    document.getElementById('stockModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('stockChange').focus(), 100);
}

async function submitStockUpdate() {
    const changeValue = document.getElementById('stockChange').value;
    const errorEl = document.getElementById('stockChangeError');

    if (changeValue === '' || isNaN(changeValue)) {
        errorEl.textContent = 'Please enter a valid number';
        return;
    }

    const change = parseInt(changeValue);
    if (change === 0) {
        errorEl.textContent = 'Stock change cannot be zero';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${currentStockProductId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: change })
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModal('stockModal');
            await refreshData();
        } else {
            errorEl.textContent = result.message;
        }
    } catch (error) {
        console.error('Stock update error:', error);
        showToast('Failed to update stock', 'error');
    }
}

// ============================================================
// Price Update Modal (₹ Rupee Notation)
// ============================================================

let currentPriceProductId = null;

function openPriceModal(productId, name, currentPrice) {
    currentPriceProductId = productId;
    document.getElementById('priceProductName').textContent = name;
    document.getElementById('priceCurrentVal').textContent = currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('newPrice').value = '';
    document.getElementById('newPriceError').textContent = '';
    document.getElementById('priceModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('newPrice').focus(), 100);
}

async function submitPriceUpdate() {
    const priceValue = document.getElementById('newPrice').value;
    const errorEl = document.getElementById('newPriceError');

    if (priceValue === '' || isNaN(priceValue)) {
        errorEl.textContent = 'Please enter a valid price';
        return;
    }

    const newPrice = parseFloat(priceValue);
    if (newPrice < 0) {
        errorEl.textContent = 'Price cannot be negative';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${currentPriceProductId}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: newPrice })
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModal('priceModal');
            await refreshData();
        } else {
            errorEl.textContent = result.message;
        }
    } catch (error) {
        console.error('Price update error:', error);
        showToast('Failed to update price', 'error');
    }
}

// ============================================================
// Delete Product (Custom Modal)
// ============================================================

function deleteProduct(productId, productName) {
    pendingDeleteId = productId;
    document.getElementById('deleteProductName').textContent = productName;
    document.getElementById('deleteProductId').textContent = productId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

async function confirmDelete() {
    if (!pendingDeleteId) return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/${pendingDeleteId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModal('deleteModal');
            await refreshData();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete product', 'error');
    } finally {
        btn.disabled = false;
        pendingDeleteId = null;
    }
}

// ============================================================
// Utilities & Toasts
// ============================================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

async function refreshData() {
    updateTimestamp();
    await loadDashboardStats();
    if (showingLowStock) {
        await showLowStockProducts();
    } else {
        const searchQuery = document.getElementById('searchInput').value.trim();
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (searchQuery) {
            await searchProducts(searchQuery);
        } else if (categoryFilter) {
            await searchProducts(categoryFilter);
        } else {
            await loadProducts();
        }
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = ICONS.check;
    if (type === 'error') icon = ICONS.error;
    if (type === 'warning') icon = ICONS.warning;

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    toast.addEventListener('click', () => dismissToast(toast));
    setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// Key listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    if (event.key === 'Enter') {
        const stockModal = document.getElementById('stockModal');
        const priceModal = document.getElementById('priceModal');
        if (!stockModal.classList.contains('hidden') && document.activeElement.id === 'stockChange') {
            event.preventDefault();
            submitStockUpdate();
        }
        if (!priceModal.classList.contains('hidden') && document.activeElement.id === 'newPrice') {
            event.preventDefault();
            submitPriceUpdate();
        }
    }
});
