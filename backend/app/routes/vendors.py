
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.database.connection import db
from app.schemas.vendor import VendorCreate
from app.dependencies.auth import require_roles

router = APIRouter(prefix="/vendors", tags=["Vendors"])


def serialize_vendor(vendor):
    """Convert MongoDB ObjectId values into strings."""
    if not vendor:
        return None

    vendor["_id"] = str(vendor["_id"])

    if vendor.get("user_id") is not None:
        vendor["user_id"] = str(vendor["user_id"])

    return vendor


@router.post("/")
def create_vendor(
    vendor: VendorCreate,
    current_user: dict = Depends(require_roles("admin")),
):
    vendor_data = vendor.model_dump()
    vendor_data["status"] = "active"

    # Link the vendor profile to an existing user, if supplied.
    user_id = vendor_data.get("user_id")

    if user_id:
        if not ObjectId.is_valid(str(user_id)):
            raise HTTPException(
                status_code=400,
                detail="Invalid user_id format.",
            )

        user = db.users.find_one({"_id": ObjectId(str(user_id))})

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if user.get("role") != "vendor":
            raise HTTPException(
                status_code=400,
                detail="The linked user must have the vendor role.",
            )

        vendor_data["user_id"] = str(user["_id"])

        existing_link = db.vendors.find_one({
            "user_id": str(user["_id"])
        })

        if existing_link:
            raise HTTPException(
                status_code=409,
                detail="This user already has a vendor profile.",
            )

    existing_vendor = db.vendors.find_one({
        "email": vendor_data["email"]
    })

    if existing_vendor:
        raise HTTPException(
            status_code=409,
            detail="A vendor with this email already exists.",
        )

    result = db.vendors.insert_one(vendor_data)

    return {
        "message": "Vendor profile created successfully",
        "vendor_id": str(result.inserted_id),
        "user_id": vendor_data.get("user_id"),
        "status": "active",
    }


@router.get("/")
def get_vendors(
    current_user: dict = Depends(require_roles("admin")),
):
    vendors = list(db.vendors.find())

    return [serialize_vendor(vendor) for vendor in vendors]


@router.get("/me")
def get_my_vendor_profile(
    current_user: dict = Depends(require_roles("vendor")),
):
    # Support common user ID formats used by authentication code.
    user_id = (
        current_user.get("id")
        or current_user.get("_id")
        or current_user.get("user_id")
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID is missing from the authenticated account.",
        )

    vendor = db.vendors.find_one({
        "user_id": str(user_id)
    })

    # Support profiles created with a MongoDB ObjectId user_id.
    if not vendor and ObjectId.is_valid(str(user_id)):
        vendor = db.vendors.find_one({
            "user_id": ObjectId(str(user_id))
        })

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="No vendor profile is linked to this account.",
        )

    return serialize_vendor(vendor)


@router.patch("/{vendor_id}")
def update_vendor(
    vendor_id: str,
    vendor: VendorCreate,
    current_user: dict = Depends(require_roles("admin")),
):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format.",
        )

    vendor_data = vendor.model_dump()
    vendor_data.pop("status", None)

    existing_vendor = db.vendors.find_one({
        "_id": ObjectId(vendor_id)
    })

    if not existing_vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found.",
        )

    duplicate_email = db.vendors.find_one({
        "email": vendor_data["email"],
        "_id": {"$ne": ObjectId(vendor_id)},
    })

    if duplicate_email:
        raise HTTPException(
            status_code=409,
            detail="Another vendor already uses this email.",
        )

    # Do not silently change the linked account via a profile edit.
    vendor_data.pop("user_id", None)

    db.vendors.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": vendor_data},
    )

    return {
        "message": "Vendor updated successfully",
        "vendor_id": vendor_id,
    }


@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: str,
    current_user: dict = Depends(require_roles("admin")),
):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format.",
        )

    result = db.vendors.delete_one({
        "_id": ObjectId(vendor_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found.",
        )

    return {
        "message": "Vendor deleted successfully",
        "vendor_id": vendor_id,
    }
