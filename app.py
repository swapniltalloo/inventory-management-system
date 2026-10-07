import os
from flask import Flask, render_template
from config import Config
from database.database import init_db
from routes.product_routes import product_bp


def create_app(config_class=Config):
    """Application factory for creating the Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure database directory exists
    db_dir = os.path.join(config_class.BASE_DIR, 'database')
    os.makedirs(db_dir, exist_ok=True)

    # Initialize database
    init_db(app)

    # Register blueprints
    app.register_blueprint(product_bp)

    # Serve the frontend
    @app.route('/')
    def index():
        return render_template('index.html')

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': 'Internal server error'}, 500

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {'success': False, 'message': 'Method not allowed'}, 405

    return app


if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*50)
    print("  Inventory Management System")
    print("  Running at: http://127.0.0.1:5000")
    print("="*50 + "\n")
    app.run(debug=True, host='127.0.0.1', port=5000)
