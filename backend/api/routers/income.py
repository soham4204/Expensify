from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.income import Income as IncomeModel
from schemas.income import Income, IncomeCreate
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/incomes", tags=["Incomes"])

@router.post("/", response_model=Income)
def create_income(income: IncomeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_income = IncomeModel(**income.model_dump(), user_id=current_user.id)
    db.add(new_income)
    
    # Update account balance
    from models.account import Account as AccountModel
    account = db.query(AccountModel).filter(AccountModel.id == income.account_id, AccountModel.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Account not found")
    
    account.balance += income.amount
    
    db.commit()
    db.refresh(new_income)
    return new_income

@router.get("/", response_model=List[Income])
def read_incomes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incomes = db.query(IncomeModel).filter(IncomeModel.user_id == current_user.id).offset(skip).limit(limit).all()
    return incomes
