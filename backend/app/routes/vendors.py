
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.database.connection import db
from app.schemas.vendor import VendorCreate
from app.dependencies.auth import require_roles

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/")
def create_vendor(
    vendor: VendorCreate,
    current_user: dict = Depends(require_roles("admin")),
):
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
def get_vendors(
    current_user: dict = Depends(require_roles("admin")),
):
    vendors = list(db.vendors.find())

    for vendor in vendors:
        vendor["_id"] = str(vendor["_id"])

    return vendors


@router.patch("/{vendor_id}")
def update_vendor(
    vendor_id: str,
    vendor: VendorCreate,
    current_user: dict = Depends(require_roles("admin")),
):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format."
        )

    vendor_data = vendor.model_dump()
    vendor_data.pop("status", None)

    existing_vendor = db.vendors.find_one({
        "_id": ObjectId(vendor_id)
    })

    if not existing_vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    duplicate_email = db.vendors.find_one({
        "email": vendor_data["email"],
        "_id": {"$ne": ObjectId(vendor_id)}
    })

    if duplicate_email:
        raise HTTPException(
            status_code=409,
            detail="Another vendor already uses this email."
        )

    db.vendors.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": vendor_data}
    )

    return {
        "message": "Vendor updated successfully",
        "vendor_id": vendor_id
    }


@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: str,
    current_user: dict = Depends(require_roles("admin")),
):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format."
        )

    result = db.vendors.delete_one({
        "_id": ObjectId(vendor_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    return {
        "message": "Vendor deleted successfully",
        "vendor_id": vendor_id
    }
