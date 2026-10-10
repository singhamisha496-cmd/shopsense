
from fastapi import APIRouter
from app.database.connection import db

router = APIRouter(
    prefix="/analytics",
    tags=["Sales Analytics"]
)


@router.get("/sales-summary")
def sales_summary():
    transactions = list(
        db.transactions.find({"payment_status": "completed"})
    )

    total_revenue = sum(
        transaction.get("total_amount", 0)
        for transaction in transactions
    )

    total_transactions = len(transactions)

    total_units_sold = sum(
        transaction.get("quantity", 0)
        for transaction in transactions
    )

    return {
        "total_revenue": round(total_revenue, 2),
        "currency": "INR",
        "total_transactions": total_transactions,
        "total_units_sold": total_units_sold
    }


@router.get("/top-products")
def top_products():
    results = list(
        db.transactions.aggregate([
            {"$match": {"payment_status": "completed"}},
            {
                "$group": {
                    "_id": "$product_id",
                    "units_sold": {"$sum": "$quantity"},
                    "total_revenue": {"$sum": "$total_amount"}
                }
            },
            {"$sort": {"units_sold": -1}},
            {"$limit": 5}
        ])
    )

    for item in results:
        product = db.products.find_one(
            {"_id": __import__("bson").ObjectId(item["_id"])}
        )

        item["product_id"] = item.pop("_id")
        item["product_name"] = (
            product["name"] if product else "Unknown Product"
        )
        item["total_revenue"] = round(item["total_revenue"], 2)

    return results
