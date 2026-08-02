from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class ExpenseBase(BaseModel):
    amount: float
    merchant: str
    date: date
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    category_id: Optional[int] = None
    account_id: int

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
