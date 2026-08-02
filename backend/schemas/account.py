from pydantic import BaseModel, ConfigDict
from typing import Optional

class AccountBase(BaseModel):
    name: str
    balance: float = 0.0
    type: str

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
