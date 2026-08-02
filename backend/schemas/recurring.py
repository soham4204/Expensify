from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class RecurringTransactionBase(BaseModel):
    amount: float
    merchant_or_source: str
    frequency: str = "monthly"
    type: str # 'expense' or 'income'
    next_run_date: date
    account_id: int
    category_id: Optional[int] = None

class RecurringTransactionCreate(RecurringTransactionBase):
    pass

class RecurringTransaction(RecurringTransactionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
