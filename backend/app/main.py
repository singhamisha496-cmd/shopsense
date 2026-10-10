from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.database.connection import check_database_connection
from app.routes.vendors import router as vendors_router
from app.routes.products import router as products_router
from app.routes.inventory import router as inventory_router
from app.routes.transactions import router as transactions_router
from app.routes.analytics import router as analytics_router
app = FastAPI(
    title="ShopSense API",
    description="Multi-Vendor E-Commerce Analytics Platform",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    check_database_connection()


@app.get("/")
def home():
    return {
        "message": "Welcome to ShopSense API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health_check():
    is_connected = check_database_connection()

    return {
        "database": "MongoDB",
        "connected": is_connected
    }


app.include_router(vendors_router)
app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(transactions_router)
app.include_router(analytics_router)
