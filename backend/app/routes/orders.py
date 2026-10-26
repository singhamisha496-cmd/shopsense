
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from bson import ObjectId
from datetime import datetime, timezone

from app.database.connection import db
from app.dependencies.auth import require_roles

router = APIRouter(prefix="/orders", tags=["Orders"])


class OrderItem(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItem] = Field(..., min_length=1)


@router.post("/")
def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(require_roles("customer"))
):
    order_items = []
    total_amount = 0.0

    # Validate all products and stock before changing inventory.
    for item in order_data.items:
        if not ObjectId.is_valid(item.product_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid product ID: {item.product_id}"
            )

        product = db.products.find_one({
            "_id": ObjectId(item.product_id),
            "status": "active"
        })

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product not found or inactive: {item.product_id}"
            )

        if product.get("stock_quantity", 0) < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product['name']}"
            )

        price = float(product["price"])
        order_items.append({
            "product_id": str(product["_id"]),
            "name": product["name"],
            "quantity": item.quantity,
            "price": price,
            "subtotal": round(price * item.quantity, 2)
        })
        total_amount += price * item.quantity

    # Reserve stock using conditional updates to prevent overselling.
    updated_products = []

    for item in order_items:
        result = db.products.update_one(
            {
                "_id": ObjectId(item["product_id"]),
                "status": "active",
                "stock_quantity": {"$gte": item["quantity"]}
            },
            {"$inc": {"stock_quantity": -item["quantity"]}}
        )

        if result.modified_count != 1:
            # Restore stock already reserved for this order attempt.
            for reserved in updated_products:
                db.products.update_one(
                    {"_id": ObjectId(reserved["product_id"])},
                    {"$inc": {"stock_quantity": reserved["quantity"]}}
                )

            raise HTTPException(
                status_code=409,
                detail="Stock changed during checkout. Please try again."
            )

        updated_products.append(item)

    order_document = {
        "user_id": current_user["id"],
        "items": order_items,
        "total_amount": round(total_amount, 2),
        "status": "placed",
        "created_at": datetime.now(timezone.utc)
    }

    try:
        result = db.orders.insert_one(order_document)
    except Exception:
        # Restore reserved stock if saving the order fails.
        for reserved in updated_products:
            db.products.update_one(
                {"_id": ObjectId(reserved["product_id"])},
                {"$inc": {"stock_quantity": reserved["quantity"]}}
            )
        raise HTTPException(
            status_code=500,
            detail="Could not save order. Please try again."
        )

    return {
        "message": "Order placed successfully",
        "order_id": str(result.inserted_id),
        "total_amount": round(total_amount, 2),
        "status": "placed"
    }


@router.get("/")
def get_my_orders(
    current_user: dict = Depends(require_roles("customer"))
):
    orders = list(
        db.orders.find({"user_id": current_user["id"]})
        .sort("created_at", -1)
    )

    for order in orders:
        order["_id"] = str(order["_id"])
        order["created_at"] = order["created_at"].isoformat()

    return orders
