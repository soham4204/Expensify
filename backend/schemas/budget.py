from pydantic import BaseModel, ConfigDict
from typing import Optional

class BudgetBase(BaseModel):
    amount: float
    period: str = "monthly"
    category_id: Optional[int] = None

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BudgetUsage(BaseModel):
    budget: Budget
    spent: float
    remaining: float
    percentage_used: float
