/**
 * Inventory Management System — Frontend Application
 * Handles all CRUD operations via Fetch API with async/await.
 */

const API_BASE = '/api/products';
const LOW_STOCK_THRESHOLD = 10;

// State
let editingProductId = null;
let searchTimeout = null;
let showingLowStock = false;

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadDashboardStats();
});

// ============================================================
// Dashboard
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
    document.getElementById('totalProducts').textContent = stats.total_products;
    document.getElementById('totalStock').textContent = stats.total_stock.toLocaleString();
    document.getElementById('lowStockCount').textContent = stats.low_stock_count;
    document.getElementById('inventoryValue').textContent = '$' + stats.inventory_value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Update category filter
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

    // Update category datalist
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    stats.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        categoryList.appendChild(option);
    });

    // Low stock alert
    const alertBanner = document.getElementById('lowStockAlert');
    const alertMsg = document.getElementById('lowStockMessage');
    if (stats.low_stock_count > 0) {
        alertMsg.textContent = `${stats.low_stock_count} product(s) are running low on stock (below ${LOW_STOCK_THRESHOLD} units)!`;
        alertBanner.classList.remove('hidden');
    } else {
        alertBanner.classList.add('hidden');
    }
}

// ============================================================
// Product Loading & Display
// ============================================================

async function loadProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_BASE);
        const result = await response.json();
        if (result.success) {
            renderProducts(result.data);
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
            statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (isLowStock) {
            statusBadge = '<span class="badge badge-warning">Low Stock</span>';
        } else {
            statusBadge = '<span class="badge badge-success">In Stock</span>';
        }

        return `
            <tr class="${isLowStock ? 'low-stock-row' : ''}">
                <td><strong>${escapeHtml(product.product_id)}</strong></td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.category)}</td>
                <td>${product.quantity}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${escapeHtml(product.product_id)}')" title="Edit">✏️</button>
                        <button class="btn btn-sm btn-success" onclick="openStockModal('${escapeHtml(product.product_id)}', '${escapeHtml(product.name)}', ${product.quantity})" title="Update Stock">📦</button>
                        <button class="btn btn-sm btn-warning" onclick="openPriceModal('${escapeHtml(product.product_id)}', '${escapeHtml(product.name)}', ${product.price})" title="Update Price">💰</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${escapeHtml(product.product_id)}', '${escapeHtml(product.name)}')" title="Delete">🗑️</button>
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
    const btnText = document.getElementById('submitBtnText');
    const spinner = document.getElementById('submitSpinner');

    submitBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        let response;
        if (editingProductId) {
            // Update existing product
            response = await fetch(`${API_BASE}/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new product
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

    // Clear previous errors
    clearFieldError('productId');
    clearFieldError('productName');
    clearFieldError('productCategory');
    clearFieldError('productQuantity');
    clearFieldError('productPrice');

    if (!productId) {
        setFieldError('productId', 'Product ID is required');
        isValid = false;
    }
    if (!name) {
        setFieldError('productName', 'Product Name is required');
        isValid = false;
    }
    if (!category) {
        setFieldError('productCategory', 'Category is required');
        isValid = false;
    }
    if (quantity === '' || isNaN(quantity)) {
        setFieldError('productQuantity', 'Valid quantity is required');
        isValid = false;
    } else if (parseInt(quantity) < 0) {
        setFieldError('productQuantity', 'Quantity cannot be negative');
        isValid = false;
    }
    if (price === '' || isNaN(price)) {
        setFieldError('productPrice', 'Valid price is required');
        isValid = false;
    } else if (parseFloat(price) < 0) {
        setFieldError('productPrice', 'Price cannot be negative');
        isValid = false;
    }

    return isValid;
}

function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    input.classList.add('invalid');
    error.textContent = message;
}

function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    input.classList.remove('invalid');
    error.textContent = '';
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
            document.getElementById('formTitle').textContent = '✏️ Edit Product';
            document.getElementById('submitBtnText').textContent = 'Update Product';
            document.getElementById('cancelEdit').classList.remove('hidden');

            // Scroll to form
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
    document.getElementById('formTitle').textContent = '➕ Add New Product';
    document.getElementById('submitBtnText').textContent = 'Add Product';
    document.getElementById('cancelEdit').classList.add('hidden');

    // Clear all errors
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
            renderProducts(result.data);
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

    if (!category) {
        loadProducts();
        return;
    }
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
            renderProducts(result.data);
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
// Price Update Modal
// ============================================================

let currentPriceProductId = null;

function openPriceModal(productId, name, currentPrice) {
    currentPriceProductId = productId;
    document.getElementById('priceProductName').textContent = name;
    document.getElementById('priceCurrentVal').textContent = currentPrice.toFixed(2);
    document.getElementById('newPrice').value = '';
    document.getElementById('newPriceError').textContent = '';
    document.getElementById('priceModal').classList.remove('hidden');
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
// Delete Product
// ============================================================

async function deleteProduct(productId, productName) {
    const confirmed = confirm(`Are you sure you want to delete "${productName}" (${productId})?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/${productId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            await refreshData();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete product', 'error');
    }
}

// ============================================================
// Utilities
// ============================================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

async function refreshData() {
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
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// Close modals on backdrop click
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
});

// Close modals on Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});
