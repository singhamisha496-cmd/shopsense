
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.inventory import StockAdjustment
from bson import ObjectId
from pymongo import ReturnDocument

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/")
def get_inventory():
    products = list(db.products.find())
    inventory = []

    for product in products:
        stock = product.get("stock_quantity", 0)

        inventory.append({
            "product_id": str(product["_id"]),
            "product_name": product.get("name", "Unknown Product"),
            "category": product.get("category", "Uncategorized"),
            "stock_quantity": stock,
            "stock_status": (
                "Out of Stock" if stock == 0
                else "Low Stock" if stock <= 5
                else "In Stock"
            )
        })

    return inventory


@router.patch("/{product_id}/adjust")
def adjust_stock(product_id: str, adjustment: StockAdjustment):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID format."
        )

    product_object_id = ObjectId(product_id)
    quantity = adjustment.quantity

    if adjustment.action == "restock":
        updated_product = db.products.find_one_and_update(
            {"_id": product_object_id},
            {"$inc": {"stock_quantity": quantity}},
            return_document=ReturnDocument.AFTER
        )

        if updated_product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found."
            )

    else:
        updated_product = db.products.find_one_and_update(
            {
                "_id": product_object_id,
                "stock_quantity": {"$gte": quantity}
            },
            {"$inc": {"stock_quantity": -quantity}},
            return_document=ReturnDocument.AFTER
        )

        if updated_product is None:
            product = db.products.find_one({"_id": product_object_id})

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail="Product not found."
                )

            raise HTTPException(
                status_code=400,
                detail="Insufficient stock for this sale."
            )

    new_stock = updated_product["stock_quantity"]

    return {
        "message": "Inventory updated successfully",
        "product_id": product_id,
        "quantity_changed": quantity,
        "action": adjustment.action,
        "new_stock": new_stock,
        "stock_status": (
            "Out of Stock" if new_stock == 0
            else "Low Stock" if new_stock <= 5
            else "In Stock"
        )
    }
