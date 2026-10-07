# Inventory Management System

A full-stack **Inventory / Product Management System** web application that enables users to add, search, update, and delete product records. Built with **Flask** (Python), **SQLite**, and **vanilla JavaScript** — demonstrating complete CRUD operations, REST API design, and dynamic frontend updates.

---

## Features

- **Add Products** — Create new products with ID, name, category, quantity, and price
- **View/List Products** — Display all products in a sortable, responsive table
- **Search Products** — Real-time search by product ID, name, or category (no page reload)
- **Update Products** — Edit product details via inline form
- **Update Stock** — Increment/decrement stock via modal dialog with validation
- **Update Price** — Change product pricing via modal dialog
- **Delete Products** — Remove products with confirmation dialog
- **Low Stock Alerts** — Visual alerts for products below configurable threshold (default: 10)
- **Dashboard** — Live statistics: total products, total stock, low-stock count, inventory value
- **Category Filtering** — Filter products by category
- **Input Validation** — Client-side and server-side validation
- **Edge Case Handling** — Duplicate IDs, negative values, nonexistent products, stock-below-zero prevention
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## Technology Stack

| Layer      | Technology         |
|------------|--------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript, Fetch API |
| Backend    | Python, Flask      |
| Database   | SQLite             |
| ORM        | Flask-SQLAlchemy   |
| Testing    | pytest             |

---

## Architecture

```
Client (Browser)  <--->  Flask REST API  <--->  SQLAlchemy ORM  <--->  SQLite DB
     HTML/CSS/JS           Routes/Services          Models              inventory.db
```

The application follows a layered architecture:

1. **Routes** — Handle HTTP requests and responses
2. **Services** — Business logic and validation
3. **Models** — Database schema and ORM mappings
4. **Database** — SQLite with SQLAlchemy

---

## Project Structure

```
inventory-management-system/
│
├── app.py                    # Flask application factory & entry point
├── config.py                 # App configuration (Config, TestConfig)
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── models/
│   ├── __init__.py
│   └── product.py            # Product SQLAlchemy model
│
├── routes/
│   ├── __init__.py
│   └── product_routes.py     # REST API endpoints
│
├── services/
│   ├── __init__.py
│   └── product_service.py    # Business logic layer
│
├── database/
│   ├── __init__.py
│   └── database.py           # SQLAlchemy initialization
│
├── templates/
│   └── index.html            # Main frontend template
│
├── static/
│   ├── css/
│   │   └── style.css         # Stylesheet
│   └── js/
│       └── app.js            # Frontend JavaScript
│
└── tests/
    └── test_products.py      # Automated test suite
```

---

## Database Schema

### Products Table

| Column      | Type         | Constraints                |
|-------------|--------------|----------------------------|
| id          | INTEGER      | Primary Key, Auto-increment |
| product_id  | VARCHAR(50)  | Unique, Not Null, Indexed  |
| name        | VARCHAR(200) | Not Null                   |
| category    | VARCHAR(100) | Not Null                   |
| quantity    | INTEGER      | Not Null, Default: 0       |
| price       | FLOAT        | Not Null, Default: 0.0     |
| created_at  | DATETIME     | Auto-set on creation       |
| updated_at  | DATETIME     | Auto-set on creation/update|

---

## API Documentation

### Base URL: `http://127.0.0.1:5000`

| Method  | Endpoint                         | Description                      |
|---------|----------------------------------|----------------------------------|
| POST    | `/api/products`                  | Create a new product             |
| GET     | `/api/products`                  | Get all products                 |
| GET     | `/api/products/<product_id>`     | Get a single product             |
| GET     | `/api/products/search?q=<query>` | Search products                  |
| PUT     | `/api/products/<product_id>`     | Update product details           |
| PATCH   | `/api/products/<product_id>/stock` | Update stock quantity          |
| PATCH   | `/api/products/<product_id>/price` | Update product price           |
| DELETE  | `/api/products/<product_id>`     | Delete a product                 |
| GET     | `/api/products/low-stock`        | Get low-stock products           |
| GET     | `/api/products/stats`            | Get dashboard statistics         |

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Quantity cannot be negative"
}
```

### HTTP Status Codes

| Code | Meaning            |
|------|--------------------|
| 200  | Success            |
| 201  | Created            |
| 400  | Validation Error   |
| 404  | Not Found          |
| 409  | Duplicate (Conflict)|
| 500  | Server Error       |

---

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Steps

1. **Clone or navigate to the project directory:**
   ```bash
   cd inventory-management-system
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**

   **Windows:**
   ```bash
   venv\Scripts\activate
   ```

   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

## How to Run

1. **Start the Flask server:**
   ```bash
   python app.py
   ```

2. **Open your browser and navigate to:**
   ```
   http://127.0.0.1:5000
   ```

3. The application will be ready to use. The SQLite database will be created automatically on first run.

---

## Screenshots

> _Screenshots can be added here after running the application._

| View             | Description                              |
|------------------|------------------------------------------|
| Dashboard        | Main dashboard with stats and product list |
| Add Product      | Product creation form with validation    |
| Search           | Real-time search results                 |
| Low Stock Alert  | Alert banner for low-stock items         |
| Stock Update     | Modal for updating stock quantity        |
| Price Update     | Modal for updating product price         |
| Mobile View      | Responsive design on mobile devices     |

---

## Testing

Run the automated test suite:

```bash
pytest tests/ -v
```

The test suite covers:

- ✅ Add product (success, duplicate ID, negative quantity, negative price, missing fields)
- ✅ Get products (all, single, nonexistent)
- ✅ Search products (by name, category, product ID, no results, empty query)
- ✅ Update product (success, nonexistent, negative quantity)
- ✅ Update stock (increase, decrease, below zero, nonexistent, missing field)
- ✅ Update price (success, negative, nonexistent, zero price)
- ✅ Delete product (success, nonexistent)
- ✅ Low stock detection
- ✅ Dashboard statistics

---

## Future Improvements

- User authentication and role-based access control
- Pagination for large product lists
- Export data to CSV/Excel
- Product image uploads
- Barcode/QR code scanning
- Purchase order tracking
- Supplier management
- Audit log for all changes
- Data visualization with charts
- Docker containerization

---

## Author

**Swapnil Talloo**

Built as an academic mini-project demonstrating full-stack development with Flask and SQLite.
