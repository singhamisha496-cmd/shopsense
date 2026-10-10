
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.product import ProductCreate
from bson import ObjectId

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/")
def create_product(product: ProductCreate):
    product_data = product.model_dump()

    # Check whether the vendor exists
    if not ObjectId.is_valid(product_data["vendor_id"]):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format."
        )

    vendor = db.vendors.find_one({
        "_id": ObjectId(product_data["vendor_id"])
    })

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found. Register the vendor first."
        )

    product_data["status"] = "active"

    result = db.products.insert_one(product_data)

    return {
        "message": "Product created successfully",
        "product_id": str(result.inserted_id),
        "status": "active"
    }


@router.get("/")
def get_products():
    products = list(db.products.find())

    for product in products:
        product["_id"] = str(product["_id"])

    return products
