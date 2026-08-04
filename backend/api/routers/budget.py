from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, timedelta
import calendar

from core.database import get_db
from models.budget import Budget as BudgetModel
from models.expense import Expense as ExpenseModel
from schemas.budget import Budget, BudgetCreate, BudgetUsage
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/", response_model=Budget)
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_budget = BudgetModel(**budget.model_dump(), user_id=current_user.id)
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.get("/", response_model=List[Budget])
def read_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budgets = db.query(BudgetModel).filter(BudgetModel.user_id == current_user.id).offset(skip).limit(limit).all()
    return budgets

@router.get("/usage", response_model=List[BudgetUsage])
def get_budgets_usage(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budgets = db.query(BudgetModel).filter(BudgetModel.user_id == current_user.id).all()
    usage_data = []
    today = date.today()

    for budget in budgets:
        # Determine the period to filter expenses
        if budget.period == "monthly":
            start_date = today.replace(day=1)
            # End of month
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = today.replace(day=last_day)
        else: # weekly
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        
        query = db.query(func.sum(ExpenseModel.amount)).filter(
            ExpenseModel.date >= start_date,
            ExpenseModel.date <= end_date,
            ExpenseModel.user_id == current_user.id
        )

        if budget.category_id:
            query = query.filter(ExpenseModel.category_id == budget.category_id)
        
        spent = query.scalar() or 0.0
        remaining = budget.amount - spent
        percentage_used = (spent / budget.amount) * 100 if budget.amount > 0 else 0

        usage_data.append({
            "budget": budget,
            "spent": spent,
            "remaining": remaining,
            "percentage_used": round(percentage_used, 2)
        })
    
    return usage_data
