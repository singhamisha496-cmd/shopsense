
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.product import ProductCreate
from bson import ObjectId

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/")
def create_product(product: ProductCreate):
    product_data = product.model_dump()

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


@router.patch("/{product_id}")
def update_product(product_id: str, product: ProductCreate):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID format."
        )

    product_object_id = ObjectId(product_id)
    existing_product = db.products.find_one({"_id": product_object_id})

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    product_data = product.model_dump()

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
            detail="Vendor not found."
        )

    # Preserve the product's existing status
    product_data["status"] = existing_product.get("status", "active")

    db.products.update_one(
        {"_id": product_object_id},
        {"$set": product_data}
    )

    return {
        "message": "Product updated successfully",
        "product_id": product_id
    }


@router.delete("/{product_id}")
def delete_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID format."
        )

    result = db.products.delete_one({
        "_id": ObjectId(product_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }
