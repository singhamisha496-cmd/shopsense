
from fastapi import APIRouter, HTTPException
from app.database.connection import db
from app.schemas.vendor import VendorCreate
from bson import ObjectId

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/")
def create_vendor(vendor: VendorCreate):
    vendor_data = vendor.model_dump()

    vendor_data["status"] = "active"

    existing_vendor = db.vendors.find_one({
        "email": vendor_data["email"]
    })

    if existing_vendor:
        raise HTTPException(
            status_code=409,
            detail="A vendor with this email already exists."
        )

    result = db.vendors.insert_one(vendor_data)

    return {
        "message": "Vendor registered successfully",
        "vendor_id": str(result.inserted_id),
        "status": "active"
    }


@router.get("/")
def get_vendors():
    vendors = list(db.vendors.find())

    for vendor in vendors:
        vendor["_id"] = str(vendor["_id"])

    return vendors
