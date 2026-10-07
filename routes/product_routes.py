from flask import Blueprint, request, jsonify, current_app
from services.product_service import ProductService
from sqlalchemy.exc import IntegrityError

product_bp = Blueprint('products', __name__)


def success_response(data=None, message='Success', status_code=200):
    """Create a standardized success response."""
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def error_response(message='An error occurred', status_code=400):
    """Create a standardized error response."""
    return jsonify({'success': False, 'message': message}), status_code


@product_bp.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('Request body must be valid JSON', 400)

        product = ProductService.create_product(data)
        return success_response(
            data=product.to_dict(),
            message='Product created successfully',
            status_code=201
        )
    except IntegrityError:
        from database.database import db
        db.session.rollback()
        product_id = data.get('product_id', 'unknown')
        return error_response(f"Product with ID '{product_id}' already exists", 409)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        from database.database import db
        db.session.rollback()
        return error_response('Internal server error', 500)


@product_bp.route('/api/products', methods=['GET'])
def get_all_products():
    """Get all products."""
    try:
        products = ProductService.get_all_products()
        return success_response(
            data=[p.to_dict() for p in products],
            message=f'Retrieved {len(products)} products'
        )
    except Exception as e:
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/search', methods=['GET'])
def search_products():
    """Search products by name, ID, or category."""
    try:
        query = request.args.get('q', '')
        products = ProductService.search_products(query)
        return success_response(
            data=[p.to_dict() for p in products],
            message=f'Found {len(products)} products matching "{query}"'
        )
    except Exception as e:
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/low-stock', methods=['GET'])
def get_low_stock_products():
    """Get products with low stock."""
    try:
        threshold = current_app.config.get('LOW_STOCK_THRESHOLD', 10)
        products = ProductService.get_low_stock_products(threshold)
        return success_response(
            data=[p.to_dict() for p in products],
            message=f'Found {len(products)} low-stock products (threshold: {threshold})'
        )
    except Exception as e:
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        threshold = current_app.config.get('LOW_STOCK_THRESHOLD', 10)
        stats = ProductService.get_dashboard_stats(threshold)
        return success_response(data=stats, message='Dashboard stats retrieved')
    except Exception as e:
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by product_id."""
    try:
        product = ProductService.get_product_by_id(product_id)
        if not product:
            return error_response(f"Product with ID '{product_id}' not found", 404)
        return success_response(data=product.to_dict())
    except Exception as e:
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    """Update a product."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('Request body must be valid JSON', 400)

        product = ProductService.update_product(product_id, data)
        if not product:
            return error_response(f"Product with ID '{product_id}' not found", 404)

        return success_response(
            data=product.to_dict(),
            message='Product updated successfully'
        )
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        from database.database import db
        db.session.rollback()
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/<product_id>/stock', methods=['PATCH'])
def update_stock(product_id):
    """Update product stock quantity."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('Request body must be valid JSON', 400)

        if 'quantity' not in data:
            return error_response("'quantity' field is required", 400)

        product = ProductService.update_stock(product_id, data['quantity'])
        if not product:
            return error_response(f"Product with ID '{product_id}' not found", 404)

        return success_response(
            data=product.to_dict(),
            message='Stock updated successfully'
        )
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        from database.database import db
        db.session.rollback()
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/<product_id>/price', methods=['PATCH'])
def update_price(product_id):
    """Update product price."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('Request body must be valid JSON', 400)

        if 'price' not in data:
            return error_response("'price' field is required", 400)

        product = ProductService.update_price(product_id, data['price'])
        if not product:
            return error_response(f"Product with ID '{product_id}' not found", 404)

        return success_response(
            data=product.to_dict(),
            message='Price updated successfully'
        )
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        from database.database import db
        db.session.rollback()
        return error_response('Internal server error', 500)


@product_bp.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product."""
    try:
        deleted = ProductService.delete_product(product_id)
        if not deleted:
            return error_response(f"Product with ID '{product_id}' not found", 404)
        return success_response(message='Product deleted successfully')
    except Exception as e:
        from database.database import db
        db.session.rollback()
        return error_response('Internal server error', 500)
