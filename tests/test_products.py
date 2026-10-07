"""
Test suite for Inventory Management System.
Tests all CRUD operations, validation, and edge cases.
"""
import pytest
import json
import sys
import os

# Ensure project root is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from config import TestConfig
from database.database import db


@pytest.fixture
def app():
    """Create a test application instance."""
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


def sample_product(override=None):
    """Return a sample product dict, optionally overriding fields."""
    product = {
        'product_id': 'PRD-001',
        'name': 'Wireless Mouse',
        'category': 'Electronics',
        'quantity': 50,
        'price': 29.99
    }
    if override:
        product.update(override)
    return product


# ==============================================================
# Add Product Tests
# ==============================================================

class TestAddProduct:

    def test_add_product_success(self, client):
        """Test adding a valid product."""
        resp = client.post('/api/products',
                           data=json.dumps(sample_product()),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 201
        assert data['success'] is True
        assert data['data']['product_id'] == 'PRD-001'
        assert data['data']['name'] == 'Wireless Mouse'
        assert data['data']['quantity'] == 50
        assert data['data']['price'] == 29.99

    def test_add_product_duplicate_id(self, client):
        """Test adding a product with duplicate product_id."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.post('/api/products',
                           data=json.dumps(sample_product()),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 409
        assert data['success'] is False

    def test_add_product_negative_quantity(self, client):
        """Test adding a product with negative quantity."""
        resp = client.post('/api/products',
                           data=json.dumps(sample_product({'quantity': -5})),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False
        assert 'negative' in data['message'].lower()

    def test_add_product_negative_price(self, client):
        """Test adding a product with negative price."""
        resp = client.post('/api/products',
                           data=json.dumps(sample_product({'price': -10.0})),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False
        assert 'negative' in data['message'].lower()

    def test_add_product_missing_name(self, client):
        """Test adding a product with empty name."""
        resp = client.post('/api/products',
                           data=json.dumps(sample_product({'name': ''})),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False

    def test_add_product_missing_fields(self, client):
        """Test adding a product with missing required fields."""
        resp = client.post('/api/products',
                           data=json.dumps({'product_id': 'PRD-X'}),
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False

    def test_add_product_invalid_json(self, client):
        """Test adding a product with invalid JSON."""
        resp = client.post('/api/products',
                           data='not json',
                           content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False


# ==============================================================
# Get Products Tests
# ==============================================================

class TestGetProducts:

    def test_get_all_products_empty(self, client):
        """Test getting products when none exist."""
        resp = client.get('/api/products')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['success'] is True
        assert data['data'] == []

    def test_get_all_products(self, client):
        """Test getting all products."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        client.post('/api/products',
                     data=json.dumps(sample_product({'product_id': 'PRD-002', 'name': 'Keyboard'})),
                     content_type='application/json')
        resp = client.get('/api/products')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 2

    def test_get_single_product(self, client):
        """Test getting a single product by product_id."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.get('/api/products/PRD-001')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['product_id'] == 'PRD-001'

    def test_get_nonexistent_product(self, client):
        """Test getting a product that doesn't exist."""
        resp = client.get('/api/products/NONEXISTENT')
        data = resp.get_json()
        assert resp.status_code == 404
        assert data['success'] is False


# ==============================================================
# Search Products Tests
# ==============================================================

class TestSearchProducts:

    def _seed(self, client):
        """Add several products for search tests."""
        products = [
            sample_product(),
            sample_product({'product_id': 'PRD-002', 'name': 'Mechanical Keyboard', 'category': 'Electronics'}),
            sample_product({'product_id': 'PRD-003', 'name': 'Office Chair', 'category': 'Furniture'}),
        ]
        for p in products:
            client.post('/api/products',
                         data=json.dumps(p),
                         content_type='application/json')

    def test_search_by_name(self, client):
        """Test searching products by name."""
        self._seed(client)
        resp = client.get('/api/products/search?q=Mouse')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 1
        assert data['data'][0]['name'] == 'Wireless Mouse'

    def test_search_by_category(self, client):
        """Test searching products by category."""
        self._seed(client)
        resp = client.get('/api/products/search?q=Electronics')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 2

    def test_search_by_product_id(self, client):
        """Test searching products by product ID."""
        self._seed(client)
        resp = client.get('/api/products/search?q=PRD-003')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 1
        assert data['data'][0]['name'] == 'Office Chair'

    def test_search_no_results(self, client):
        """Test searching for a product that doesn't exist."""
        self._seed(client)
        resp = client.get('/api/products/search?q=Spaceship')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['success'] is True
        assert len(data['data']) == 0

    def test_search_empty_query(self, client):
        """Test search with empty query returns all products."""
        self._seed(client)
        resp = client.get('/api/products/search?q=')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 3


# ==============================================================
# Update Product Tests
# ==============================================================

class TestUpdateProduct:

    def test_update_product_success(self, client):
        """Test updating product details."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.put('/api/products/PRD-001',
                          data=json.dumps({'name': 'Gaming Mouse', 'price': 49.99}),
                          content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['name'] == 'Gaming Mouse'
        assert data['data']['price'] == 49.99

    def test_update_nonexistent_product(self, client):
        """Test updating a product that doesn't exist."""
        resp = client.put('/api/products/FAKE',
                          data=json.dumps({'name': 'Test'}),
                          content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 404
        assert data['success'] is False

    def test_update_negative_quantity(self, client):
        """Test updating product with negative quantity."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.put('/api/products/PRD-001',
                          data=json.dumps({'quantity': -10}),
                          content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False


# ==============================================================
# Update Stock Tests
# ==============================================================

class TestUpdateStock:

    def test_update_stock_increase(self, client):
        """Test increasing stock quantity."""
        client.post('/api/products',
                     data=json.dumps(sample_product({'quantity': 20})),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/stock',
                            data=json.dumps({'quantity': 10}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['quantity'] == 30

    def test_update_stock_decrease(self, client):
        """Test decreasing stock quantity."""
        client.post('/api/products',
                     data=json.dumps(sample_product({'quantity': 20})),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/stock',
                            data=json.dumps({'quantity': -5}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['quantity'] == 15

    def test_update_stock_below_zero(self, client):
        """Test reducing stock below zero — should fail."""
        client.post('/api/products',
                     data=json.dumps(sample_product({'quantity': 5})),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/stock',
                            data=json.dumps({'quantity': -10}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False
        assert 'below zero' in data['message'].lower()

    def test_update_stock_nonexistent(self, client):
        """Test updating stock for nonexistent product."""
        resp = client.patch('/api/products/FAKE/stock',
                            data=json.dumps({'quantity': 5}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 404

    def test_update_stock_missing_quantity(self, client):
        """Test updating stock without providing quantity."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/stock',
                            data=json.dumps({}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400


# ==============================================================
# Update Price Tests
# ==============================================================

class TestUpdatePrice:

    def test_update_price_success(self, client):
        """Test updating product price."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/price',
                            data=json.dumps({'price': 39.99}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['price'] == 39.99

    def test_update_price_negative(self, client):
        """Test updating product with negative price."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/price',
                            data=json.dumps({'price': -5.0}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 400
        assert data['success'] is False

    def test_update_price_nonexistent(self, client):
        """Test updating price for nonexistent product."""
        resp = client.patch('/api/products/FAKE/price',
                            data=json.dumps({'price': 10.0}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 404

    def test_update_price_zero(self, client):
        """Test setting price to zero (free product)."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.patch('/api/products/PRD-001/price',
                            data=json.dumps({'price': 0}),
                            content_type='application/json')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['price'] == 0.0


# ==============================================================
# Delete Product Tests
# ==============================================================

class TestDeleteProduct:

    def test_delete_product_success(self, client):
        """Test deleting an existing product."""
        client.post('/api/products',
                     data=json.dumps(sample_product()),
                     content_type='application/json')
        resp = client.delete('/api/products/PRD-001')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['success'] is True

        # Verify it's gone
        resp2 = client.get('/api/products/PRD-001')
        assert resp2.status_code == 404

    def test_delete_nonexistent_product(self, client):
        """Test deleting a product that doesn't exist."""
        resp = client.delete('/api/products/FAKE')
        data = resp.get_json()
        assert resp.status_code == 404
        assert data['success'] is False


# ==============================================================
# Low Stock Tests
# ==============================================================

class TestLowStock:

    def test_low_stock_detection(self, client):
        """Test that low-stock products are detected correctly."""
        products = [
            sample_product({'product_id': 'PRD-001', 'quantity': 5}),     # Low
            sample_product({'product_id': 'PRD-002', 'name': 'B', 'quantity': 3}),     # Low
            sample_product({'product_id': 'PRD-003', 'name': 'C', 'quantity': 100}),   # OK
            sample_product({'product_id': 'PRD-004', 'name': 'D', 'quantity': 0}),     # Low
        ]
        for p in products:
            client.post('/api/products',
                         data=json.dumps(p),
                         content_type='application/json')

        resp = client.get('/api/products/low-stock')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 3

    def test_no_low_stock(self, client):
        """Test when no products are low on stock."""
        client.post('/api/products',
                     data=json.dumps(sample_product({'quantity': 100})),
                     content_type='application/json')
        resp = client.get('/api/products/low-stock')
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data['data']) == 0


# ==============================================================
# Dashboard Stats Tests
# ==============================================================

class TestDashboardStats:

    def test_dashboard_stats(self, client):
        """Test dashboard statistics calculation."""
        products = [
            sample_product({'product_id': 'PRD-001', 'quantity': 10, 'price': 100.0}),
            sample_product({'product_id': 'PRD-002', 'name': 'B', 'quantity': 5, 'price': 50.0}),
        ]
        for p in products:
            client.post('/api/products',
                         data=json.dumps(p),
                         content_type='application/json')

        resp = client.get('/api/products/stats')
        data = resp.get_json()
        assert resp.status_code == 200
        assert data['data']['total_products'] == 2
        assert data['data']['total_stock'] == 15
        assert data['data']['low_stock_count'] == 1  # quantity 5 < 10
        assert data['data']['inventory_value'] == 1250.0  # (10*100)+(5*50)
