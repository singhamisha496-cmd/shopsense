
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import UserSignup, UserLogin
from app.services.auth_service import create_user, authenticate_user
from app.security import create_access_token
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup):
    user = create_user(
        name=user_data.name,
        email=str(user_data.email).lower(),
        password=user_data.password,
        role=user_data.role,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return {
        "message": "Account created successfully",
        "user": user,
    }


@router.post("/login")
def login(login_data: UserLogin):
    user = authenticate_user(
        email=str(login_data.email),
        password=login_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        {"sub": user["id"], "role": user["role"]}
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me")
def get_my_account(
    current_user: dict = Depends(get_current_user),
):
    return {"user": current_user}
