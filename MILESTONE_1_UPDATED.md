# ShopSense — Milestone 1 Documentation

## 1. Project Overview
ShopSense is a multi-vendor e-commerce analytics platform. Milestone 1 establishes the core backend APIs, MongoDB integration, and a basic frontend dashboard for managing marketplace information.

## 2. Technology Stack
- **Frontend:** Next.js
- **Backend:** Python with FastAPI
- **Database:** MongoDB
- **API testing/documentation:** FastAPI Swagger UI

Python is used to implement the backend API logic with FastAPI, including vendor, product, inventory, transaction, and analytics endpoints.

## 3. Features Implemented

### Vendor Management
- Create and retrieve vendor records.
- Store vendor information in MongoDB.

### Product Management
- Create and retrieve product records.
- Store product details such as name, price, category, vendor, and stock quantity.

### Inventory Management
- View product stock information.
- Adjust stock quantities.
- Identify products with low stock.

### Transaction Management
- Create and retrieve transactions.
- Validate product/vendor status and payment status.
- Check stock availability and update inventory when a transaction is recorded.

### Analytics
- View a sales summary, including total revenue, transaction count, and units sold.
- View top-selling products based on recorded sales.

### Frontend Dashboard
The Next.js dashboard provides sections for:
- Dashboard
- Vendors
- Products
- Inventory
- Transactions
- Analytics

## 4. Running the Project Locally

### Start the Python backend
Open a terminal and run:

```powershell
cd "C:\Users\KIIT\OneDrive\Desktop\shop sense\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Backend API: http://127.0.0.1:8000  
Interactive API documentation: http://127.0.0.1:8000/docs

### Start the frontend
Open a second terminal and run:

```powershell
cd "C:\Users\KIIT\OneDrive\Desktop\shop sense\frontend"
npm run dev
```

Frontend: http://localhost:3000

Make sure MongoDB is running before testing the backend.

## 5. Milestone 1 Verification
The vendor, product, inventory, transaction, and analytics endpoints were tested locally. The frontend dashboard was also opened and checked.

## 6. Future Improvements
- Add authentication and role-based access for vendors and administrators.
- Add automated tests.
- Improve analytics visualizations and reconcile reported totals against transaction records.
- Improve error handling and ensure stock updates and transaction creation are fully atomic.
