from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class IncomeBase(BaseModel):
    amount: float
    source: str
    date: date
    account_id: int
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class Income(IncomeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
