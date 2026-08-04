from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from datetime import date

from core.database import get_db
from models.expense import Expense as ExpenseModel
from models.income import Income as IncomeModel
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/export", tags=["Exports"])

@router.get("/csv")
def export_transactions_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expenses = db.query(ExpenseModel).filter(ExpenseModel.user_id == current_user.id).all()
    incomes = db.query(IncomeModel).filter(IncomeModel.user_id == current_user.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Type", "Date", "Amount", "Merchant/Source", "Notes"])
    
    for exp in expenses:
        writer.writerow(["Expense", exp.date, exp.amount, exp.merchant, exp.notes])
    for inc in incomes:
        writer.writerow(["Income", inc.date, inc.amount, inc.source, inc.notes])
        
    output.seek(0)
    
    today_str = date.today().isoformat()
    headers = {
        "Content-Disposition": f"attachment; filename=transactions_{today_str}.csv"
    }
    
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
