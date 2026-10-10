
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class VendorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    business_name: str = Field(..., min_length=2, max_length=150)
    address: Optional[str] = None


class VendorResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    business_name: str
    address: Optional[str] = None
    status: str = "active"
