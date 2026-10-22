
from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError

from app.database.connection import db
from app.security import hash_password, verify_password

users_collection = db["users"]

# Ensure that two accounts cannot use the same email.
users_collection.create_index("email", unique=True)


def create_user(name: str, email: str, password: str, role: str):
    normalized_email = email.strip().lower()

    user = {
        "name": name.strip(),
        "email": normalized_email,
        "password_hash": hash_password(password),
        "role": role,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)
    except DuplicateKeyError:
        return None

    return {
        "id": str(result.inserted_id),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }


def authenticate_user(email: str, password: str):
    normalized_email = email.strip().lower()

    user = users_collection.find_one({"email": normalized_email})

    if not user or not verify_password(password, user["password_hash"]):
        return None

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }
