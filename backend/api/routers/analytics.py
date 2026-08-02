from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Dict, Any

from core.database import get_db
from models.expense import Expense as ExpenseModel
from models.income import Income as IncomeModel
from models.category import Category as CategoryModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/spending-by-category")
def get_spending_by_category(db: Session = Depends(get_db)):
    # Spend by category for current month
    today = date.today()
    start_date = today.replace(day=1)
    
    results = db.query(
        CategoryModel.name,
        func.sum(ExpenseModel.amount).label("total")
    ).join(ExpenseModel, CategoryModel.id == ExpenseModel.category_id)\
     .filter(ExpenseModel.date >= start_date)\
     .group_by(CategoryModel.name)\
     .all()

    return [{"name": row.name, "value": float(row.total)} for row in results]

@router.get("/cashflow")
def get_monthly_cashflow(db: Session = Depends(get_db)):
    # Last 6 months cashflow
    today = date.today()
    data = []
    
    for i in range(5, -1, -1):
        target_month = today.replace(day=1) - timedelta(days=28 * i)
        start_of_month = target_month.replace(day=1)
        # next month first day - 1 day
        next_month = start_of_month + timedelta(days=32)
        end_of_month = next_month.replace(day=1) - timedelta(days=1)
        
        income = db.query(func.sum(IncomeModel.amount)).filter(
            IncomeModel.date >= start_of_month,
            IncomeModel.date <= end_of_month
        ).scalar() or 0.0
        
        expense = db.query(func.sum(ExpenseModel.amount)).filter(
            ExpenseModel.date >= start_of_month,
            ExpenseModel.date <= end_of_month
        ).scalar() or 0.0

        month_name = start_of_month.strftime("%b %Y")
        data.append({"month": month_name, "income": float(income), "expense": float(expense)})
        
    return data
