
from pydantic import BaseModel, Field


class StockUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0)


class StockAdjustment(BaseModel):
    quantity: int = Field(..., gt=0)
    action: str = Field(..., pattern="^(restock|sale)$")
