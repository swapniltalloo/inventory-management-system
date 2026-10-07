from datetime import datetime, timezone
from database.database import db
from models.product import Product
from sqlalchemy.exc import IntegrityError


class ProductService:
    """Service layer for product operations."""

    @staticmethod
    def create_product(data):
        """Create a new product."""
        # Validate required fields
        required_fields = ['product_id', 'name', 'category', 'quantity', 'price']
        for field in required_fields:
            if field not in data or data[field] is None:
                raise ValueError(f"'{field}' is required")

        product_id = str(data['product_id']).strip()
        name = str(data['name']).strip()
        category = str(data['category']).strip()

        if not product_id:
            raise ValueError("'product_id' cannot be empty")
        if not name:
            raise ValueError("'name' cannot be empty")
        if not category:
            raise ValueError("'category' cannot be empty")

        # Validate numeric fields
        try:
            quantity = int(data['quantity'])
        except (ValueError, TypeError):
            raise ValueError("'quantity' must be a valid integer")

        try:
            price = float(data['price'])
        except (ValueError, TypeError):
            raise ValueError("'price' must be a valid number")

        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if price < 0:
            raise ValueError("Price cannot be negative")

        # Check for duplicate product_id
        existing = Product.query.filter_by(product_id=product_id).first()
        if existing:
            raise IntegrityError("Duplicate product_id", params=None, orig=Exception(f"Product with ID '{product_id}' already exists"))

        product = Product(
            product_id=product_id,
            name=name,
            category=category,
            quantity=quantity,
            price=price
        )
        db.session.add(product)
        db.session.commit()
        return product

    @staticmethod
    def get_all_products():
        """Get all products ordered by creation date."""
        return Product.query.order_by(Product.created_at.desc()).all()

    @staticmethod
    def get_product_by_id(product_id):
        """Get a product by its product_id."""
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return None
        return product

    @staticmethod
    def search_products(query):
        """Search products by product_id, name, or category."""
        if not query or not query.strip():
            return Product.query.order_by(Product.created_at.desc()).all()

        search_term = f"%{query.strip()}%"
        results = Product.query.filter(
            db.or_(
                Product.product_id.ilike(search_term),
                Product.name.ilike(search_term),
                Product.category.ilike(search_term)
            )
        ).order_by(Product.created_at.desc()).all()
        return results

    @staticmethod
    def update_product(product_id, data):
        """Update a product's details."""
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return None

        if 'name' in data:
            name = str(data['name']).strip()
            if not name:
                raise ValueError("'name' cannot be empty")
            product.name = name

        if 'category' in data:
            category = str(data['category']).strip()
            if not category:
                raise ValueError("'category' cannot be empty")
            product.category = category

        if 'quantity' in data:
            try:
                quantity = int(data['quantity'])
            except (ValueError, TypeError):
                raise ValueError("'quantity' must be a valid integer")
            if quantity < 0:
                raise ValueError("Quantity cannot be negative")
            product.quantity = quantity

        if 'price' in data:
            try:
                price = float(data['price'])
            except (ValueError, TypeError):
                raise ValueError("'price' must be a valid number")
            if price < 0:
                raise ValueError("Price cannot be negative")
            product.price = price

        product.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return product

    @staticmethod
    def update_stock(product_id, quantity_change):
        """Update a product's stock quantity."""
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return None

        try:
            quantity_change = int(quantity_change)
        except (ValueError, TypeError):
            raise ValueError("'quantity' must be a valid integer")

        new_quantity = product.quantity + quantity_change
        if new_quantity < 0:
            raise ValueError(f"Cannot reduce stock below zero. Current stock: {product.quantity}, attempted change: {quantity_change}")

        product.quantity = new_quantity
        product.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return product

    @staticmethod
    def update_price(product_id, new_price):
        """Update a product's price."""
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return None

        try:
            new_price = float(new_price)
        except (ValueError, TypeError):
            raise ValueError("'price' must be a valid number")

        if new_price < 0:
            raise ValueError("Price cannot be negative")

        product.price = new_price
        product.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return product

    @staticmethod
    def delete_product(product_id):
        """Delete a product by its product_id."""
        product = Product.query.filter_by(product_id=product_id).first()
        if not product:
            return False
        db.session.delete(product)
        db.session.commit()
        return True

    @staticmethod
    def get_low_stock_products(threshold=10):
        """Get products with stock below the threshold."""
        return Product.query.filter(
            Product.quantity < threshold
        ).order_by(Product.quantity.asc()).all()

    @staticmethod
    def get_dashboard_stats(threshold=10):
        """Get dashboard statistics."""
        products = Product.query.all()
        total_products = len(products)
        total_stock = sum(p.quantity for p in products)
        low_stock_count = sum(1 for p in products if p.quantity < threshold)
        inventory_value = sum(p.quantity * p.price for p in products)
        categories = list(set(p.category for p in products))

        return {
            'total_products': total_products,
            'total_stock': total_stock,
            'low_stock_count': low_stock_count,
            'inventory_value': round(inventory_value, 2),
            'categories': sorted(categories)
        }
