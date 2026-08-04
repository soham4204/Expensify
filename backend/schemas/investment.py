from pydantic import BaseModel
from typing import Optional

class InvestmentBase(BaseModel):
    asset_name: str
    ticker_symbol: str
    quantity: float
    avg_purchase_price: float

class InvestmentCreate(InvestmentBase):
    pass

class Investment(InvestmentBase):
    id: int
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None

    class Config:
        orm_mode = True
        from_attributes = True
