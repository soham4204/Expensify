from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import datetime

from core.database import get_db
from models.account import Account as AccountModel
from models.expense import Expense as ExpenseModel
from models.income import Income as IncomeModel

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Total Balance
    total_balance = db.query(func.sum(AccountModel.balance)).scalar() or 0.0
    
    # Today's Spending
    today = date.today()
    today_spending = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.date == today).scalar() or 0.0
    
    # This Month's Spending
    first_day_of_month = today.replace(day=1)
    month_spending = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.date >= first_day_of_month).scalar() or 0.0
    
    # This Month's Income
    month_income = db.query(func.sum(IncomeModel.amount)).filter(IncomeModel.date >= first_day_of_month).scalar() or 0.0

    return {
        "current_balance": total_balance,
        "today_spending": today_spending,
        "month_spending": month_spending,
        "month_income": month_income,
    }
