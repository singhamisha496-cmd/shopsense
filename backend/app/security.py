
import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

# Keep the JWT secret outside the source code.
JWT_SECRET_KEY = os.getenv("SHOPSense_JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Return a secure hash of the password."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its stored hash."""
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a signed JWT access token."""
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "SHOPSense_JWT_SECRET environment variable is not set."
        )

    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire})

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Verify a JWT token and return its payload."""
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "SHOPSense_JWT_SECRET environment variable is not set."
        )

    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
    )
