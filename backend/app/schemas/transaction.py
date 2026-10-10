
from pydantic import BaseModel, Field
from typing import Optional


class TransactionCreate(BaseModel):
    product_id: str
    vendor_id: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    customer_id: Optional[str] = None
    payment_status: str = "completed"
