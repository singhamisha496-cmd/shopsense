
from pydantic import BaseModel, Field
from typing import Optional


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category: str = Field(..., min_length=2, max_length=100)
    vendor_id: str
    stock_quantity: int = Field(default=0, ge=0)


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category: str
    vendor_id: str
    stock_quantity: int
    status: str = "active"
