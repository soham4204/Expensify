from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.expense import Expense as ExpenseModel
from schemas.expense import Expense, ExpenseCreate
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("/", response_model=Expense)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_expense = ExpenseModel(**expense.model_dump(), user_id=current_user.id)
    db.add(new_expense)
    
    # Update account balance
    from models.account import Account as AccountModel
    account = db.query(AccountModel).filter(AccountModel.id == expense.account_id, AccountModel.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Account not found")
    
    account.balance -= expense.amount
    
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/", response_model=List[Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Order by date descending
    expenses = db.query(ExpenseModel).filter(ExpenseModel.user_id == current_user.id).order_by(ExpenseModel.date.desc()).offset(skip).limit(limit).all()
    return expenses
