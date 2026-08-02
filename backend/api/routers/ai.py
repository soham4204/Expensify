from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional

from core.database import get_db
from core.config import settings
from models.expense import Expense as ExpenseModel
from models.account import Account as AccountModel
from models.category import Category as CategoryModel
from schemas.expense import Expense

from google import genai
from google.genai import types
import json
import datetime

router = APIRouter(prefix="/ai", tags=["AI"])

client = None
if settings.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")

class ParseTransactionRequest(BaseModel):
    text: str

class ParsedData(BaseModel):
    amount: float
    merchant: str
    category_name: str
    account_name: str = "Cash"
    iso_date: str
    notes: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/parse-transaction", response_model=Expense)
def parse_transaction(req: ParseTransactionRequest, db: Session = Depends(get_db)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    today_str = date.today().isoformat()
    prompt = f"""
    You are an AI financial assistant. 
    The user wants to record an expense. Parse their natural language input into structured data.
    Today's date is: {today_str}. If they say 'yesterday', calculate the correct ISO date (YYYY-MM-DD).
    If they don't mention an account (like credit card, bank, etc.), default to "Cash".
    
    User Input: "{req.text}"
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ParsedData,
            ),
        )
        
        parsed = json.loads(response.text)
        
        # Resolve Account
        account = db.query(AccountModel).filter(AccountModel.name.ilike(f"%{parsed['account_name']}%")).first()
        if not account:
            # Default fallback account or create it
            account = db.query(AccountModel).first()
            if not account:
                account = AccountModel(name="Cash", balance=0.0, type="Cash")
                db.add(account)
                db.commit()
                db.refresh(account)
                
        # Resolve Category
        category = db.query(CategoryModel).filter(CategoryModel.name.ilike(f"%{parsed['category_name']}%")).first()
        if not category:
            category = CategoryModel(name=parsed['category_name'], description="AI Generated")
            db.add(category)
            db.commit()
            db.refresh(category)
            
        # Parse date
        try:
            tx_date = date.fromisoformat(parsed['iso_date'])
        except:
            tx_date = date.today()

        # Create expense
        new_expense = ExpenseModel(
            amount=parsed['amount'],
            merchant=parsed['merchant'],
            date=tx_date,
            account_id=account.id,
            category_id=category.id,
            notes=parsed.get('notes', "AI generated")
        )
        
        account.balance -= parsed['amount']
        
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        
        return new_expense

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest, db: Session = Depends(get_db)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    # Get current financial context
    total_balance = db.query(func.sum(AccountModel.balance)).scalar() or 0.0
    
    first_day_of_month = date.today().replace(day=1)
    month_spending = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.date >= first_day_of_month).scalar() or 0.0
    
    # Recent transactions
    recent_txs = db.query(ExpenseModel).order_by(ExpenseModel.date.desc()).limit(5).all()
    tx_list_str = "\n".join([f"- {t.date}: ₹{t.amount} at {t.merchant}" for t in recent_txs])

    system_instruction = f"""
    You are Expensify's AI Financial Assistant. You give concise, helpful answers.
    You have access to the user's current financial context:
    - Total Balance: ₹{total_balance}
    - Total Spent This Month: ₹{month_spending}
    - Recent Expenses:
    {tx_list_str}
    
    Use this information to answer the user's queries intelligently. If they ask about something you don't know, tell them you don't have that data yet.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=[system_instruction, f"User: {req.message}"]
        )
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
