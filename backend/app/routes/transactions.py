
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.transaction import TransactionCreate
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.post("/")
def create_transaction(transaction: TransactionCreate):
    # Validate product ID
    if not ObjectId.is_valid(transaction.product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID."
        )

    product = db.products.find_one({
        "_id": ObjectId(transaction.product_id)
    })

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # Validate vendor ID
    if not ObjectId.is_valid(transaction.vendor_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID."
        )

    vendor = db.vendors.find_one({
        "_id": ObjectId(transaction.vendor_id)
    })

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    if transaction.vendor_id != product["vendor_id"]:
        raise HTTPException(
            status_code=400,
            detail="This product does not belong to the specified vendor."
        )

    if transaction.payment_status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Only completed payments can be recorded as sales."
        )

    quantity = transaction.quantity

    # Prevent stock from going below zero
    result = db.products.update_one(
        {
            "_id": ObjectId(transaction.product_id),
            "stock_quantity": {"$gte": quantity}
        },
        {
            "$inc": {"stock_quantity": -quantity}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock available."
        )

    total_amount = round(
        quantity * transaction.unit_price, 2
    )

    transaction_data = transaction.model_dump()
    transaction_data["total_amount"] = total_amount
    transaction_data["created_at"] = datetime.now(timezone.utc)

    try:
        saved = db.transactions.insert_one(transaction_data)
    except Exception:
        # Restore stock if transaction storage fails
        db.products.update_one(
            {"_id": ObjectId(transaction.product_id)},
            {"$inc": {"stock_quantity": quantity}}
        )
        raise HTTPException(
            status_code=500,
            detail="Could not save transaction; stock was restored."
        )

    return {
        "message": "Transaction recorded successfully",
        "transaction_id": str(saved.inserted_id),
        "product_name": product["name"],
        "quantity": quantity,
        "total_amount": total_amount,
        "currency": "INR",
        "remaining_stock": product["stock_quantity"] - quantity
    }


@router.get("/")
def get_transactions():
    transactions = list(
        db.transactions.find().sort("created_at", -1)
    )

    for transaction in transactions:
        transaction["_id"] = str(transaction["_id"])
        transaction["created_at"] = (
            transaction["created_at"].isoformat()
        )

    return transactions
