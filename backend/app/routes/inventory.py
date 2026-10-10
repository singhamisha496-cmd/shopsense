
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.inventory import StockAdjustment
from bson import ObjectId

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/")
def get_inventory():
    products = list(db.products.find())

    inventory = []

    for product in products:
        inventory.append({
            "product_id": str(product["_id"]),
            "product_name": product["name"],
            "category": product["category"],
            "stock_quantity": product["stock_quantity"],
            "stock_status": (
                "Out of Stock" if product["stock_quantity"] == 0
                else "Low Stock" if product["stock_quantity"] <= 5
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

    product = db.products.find_one({"_id": ObjectId(product_id)})

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    current_stock = product["stock_quantity"]
    quantity = adjustment.quantity

    if adjustment.action == "sale":
        if current_stock < quantity:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock for this sale."
            )
        new_stock = current_stock - quantity
    else:
        new_stock = current_stock + quantity

    db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"stock_quantity": new_stock}}
    )

    return {
        "message": "Inventory updated successfully",
        "product_id": product_id,
        "previous_stock": current_stock,
        "quantity_changed": quantity,
        "action": adjustment.action,
        "new_stock": new_stock
    }
