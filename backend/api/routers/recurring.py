from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta

from core.database import get_db
from models.recurring import RecurringTransaction as RecurringModel
from models.expense import Expense as ExpenseModel
from models.income import Income as IncomeModel
from models.account import Account as AccountModel
from schemas.recurring import RecurringTransaction, RecurringTransactionCreate
from core.config import settings
from models.user import User
from api.deps import get_current_user

# If using Upstash Redis for locking/state:
from upstash_redis import Redis

try:
    if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
        redis = Redis(url=settings.UPSTASH_REDIS_REST_URL, token=settings.UPSTASH_REDIS_REST_TOKEN)
    else:
        redis = None
except Exception:
    redis = None

router = APIRouter(prefix="/recurring", tags=["Recurring Transactions"])

@router.post("/", response_model=RecurringTransaction)
def create_recurring(recurring: RecurringTransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_rec = RecurringModel(**recurring.model_dump(), user_id=current_user.id)
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

@router.get("/", response_model=List[RecurringTransaction])
def read_recurring(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RecurringModel).filter(RecurringModel.user_id == current_user.id).offset(skip).limit(limit).all()

def process_due_recurring_transactions(db: Session):
    today = date.today()
    # Find all due transactions
    due_transactions = db.query(RecurringModel).filter(RecurringModel.next_run_date <= today).all()

    for tx in due_transactions:
        # Create actual record
        if tx.type == "expense":
            new_record = ExpenseModel(
                amount=tx.amount,
                merchant=tx.merchant_or_source,
                date=today,
                payment_method="Recurring",
                account_id=tx.account_id,
                category_id=tx.category_id,
                notes="Auto-generated recurring expense",
                user_id=tx.user_id
            )
            # Update account balance
            account = db.query(AccountModel).filter(AccountModel.id == tx.account_id).first()
            if account:
                account.balance -= tx.amount
        else: # income
            new_record = IncomeModel(
                amount=tx.amount,
                source=tx.merchant_or_source,
                date=today,
                account_id=tx.account_id,
                notes="Auto-generated recurring income",
                user_id=tx.user_id
            )
            account = db.query(AccountModel).filter(AccountModel.id == tx.account_id).first()
            if account:
                account.balance += tx.amount
        
        db.add(new_record)

        # Update next_run_date
        if tx.frequency == "monthly":
            tx.next_run_date = tx.next_run_date + relativedelta(months=1)
        elif tx.frequency == "weekly":
            tx.next_run_date = tx.next_run_date + relativedelta(weeks=1)
        elif tx.frequency == "yearly":
            tx.next_run_date = tx.next_run_date + relativedelta(years=1)
        
    db.commit()

@router.post("/process-due")
def trigger_processing(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers processing of all due recurring transactions for the authenticated user.
    In production, an external cron service would call this endpoint with a service token.
    Using Upstash Redis to ensure we only run this once a day if desired.
    """
    if redis:
        # Check if already ran today
        today_str = date.today().isoformat()
        lock_key = f"recurring_processed_{today_str}"
        already_ran = redis.get(lock_key)
        if already_ran:
            return {"message": "Already processed for today."}
        # Set lock for 24h
        redis.setex(lock_key, 86400, "1")

    # Run processing in background
    background_tasks.add_task(process_due_recurring_transactions, db)
    return {"message": "Processing triggered"}
