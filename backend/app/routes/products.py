
from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import db
from app.schemas.product import ProductCreate
from app.dependencies.auth import require_roles
from bson import ObjectId

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/")
def create_product(
    product: ProductCreate,
    current_user: dict = Depends(require_roles("admin", "vendor"))
):
    product_data = product.model_dump()

    if not ObjectId.is_valid(product_data["vendor_id"]):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format."
        )

    vendor_id = ObjectId(product_data["vendor_id"])
    vendor = db.vendors.find_one({"_id": vendor_id})

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found. Register the vendor first."
        )

    # Vendors can add products only to their own vendor account.
    if current_user["role"] == "vendor":
        if str(vendor.get("user_id")) != str(current_user["id"]):
            raise HTTPException(
                status_code=403,
                detail="You can only create products for your own vendor account."
            )

    product_data["status"] = "active"
    result = db.products.insert_one(product_data)

    return {
        "message": "Product created successfully",
        "product_id": str(result.inserted_id),
        "status": "active"
    }


@router.get("/")
def get_products(
    current_user: dict = Depends(
        require_roles("admin", "vendor", "customer")
    )
):
    products = list(db.products.find())

    for product in products:
        product["_id"] = str(product["_id"])

    return products


@router.patch("/{product_id}")
def update_product(
    product_id: str,
    product: ProductCreate,
    current_user: dict = Depends(require_roles("admin", "vendor"))
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID format."
        )

    product_object_id = ObjectId(product_id)
    existing_product = db.products.find_one(
        {"_id": product_object_id}
    )

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # Vendors can update only their own products.
    if current_user["role"] == "vendor":
        existing_vendor_id = existing_product.get("vendor_id")

        if existing_vendor_id is None:
            raise HTTPException(
                status_code=403,
                detail="This product is not linked to a vendor account."
            )

        if isinstance(existing_vendor_id, str):
            if not ObjectId.is_valid(existing_vendor_id):
                raise HTTPException(
                    status_code=403,
                    detail="Invalid vendor association for this product."
                )
            existing_vendor_id = ObjectId(existing_vendor_id)

        vendor = db.vendors.find_one({"_id": existing_vendor_id})

        if (
            not vendor
            or str(vendor.get("user_id")) != str(current_user["id"])
        ):
            raise HTTPException(
                status_code=403,
                detail="You can only update your own products."
            )

    product_data = product.model_dump()

    if not ObjectId.is_valid(product_data["vendor_id"]):
        raise HTTPException(
            status_code=400,
            detail="Invalid vendor ID format."
        )

    new_vendor_id = ObjectId(product_data["vendor_id"])
    vendor = db.vendors.find_one({"_id": new_vendor_id})

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    if current_user["role"] == "vendor":
        if str(vendor.get("user_id")) != str(current_user["id"]):
            raise HTTPException(
                status_code=403,
                detail="You can only assign products to your own vendor account."
            )

    # Preserve the existing product status.
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
def delete_product(
    product_id: str,
    current_user: dict = Depends(
        require_roles("admin", "vendor")
    )
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID format."
        )

    product_object_id = ObjectId(product_id)

    # First, verify that the product exists.
    existing_product = db.products.find_one(
        {"_id": product_object_id}
    )

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # Admins can delete any product.
    # Vendors can delete only products linked to their own profile.
    if current_user["role"] == "vendor":
        existing_vendor_id = existing_product.get("vendor_id")

        if existing_vendor_id is None:
            raise HTTPException(
                status_code=403,
                detail="This product is not linked to a vendor account."
            )

        if isinstance(existing_vendor_id, str):
            if not ObjectId.is_valid(existing_vendor_id):
                raise HTTPException(
                    status_code=403,
                    detail="Invalid vendor association for this product."
                )
            existing_vendor_id = ObjectId(existing_vendor_id)

        vendor = db.vendors.find_one(
            {"_id": existing_vendor_id}
        )

        if (
            not vendor
            or str(vendor.get("user_id")) != str(current_user["id"])
        ):
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own products."
            )

    result = db.products.delete_one(
        {"_id": product_object_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }
