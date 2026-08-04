from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import boto3
import uuid
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
from models.user import User
from api.deps import get_current_user

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

s3_client = None
if settings.R2_ENDPOINT_URL:
    try:
        s3_client = boto3.client(
            service_name="s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto", 
        )
    except Exception as e:
        print(f"Failed to initialize S3 client: {e}")

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

class ParsedStatementTransaction(BaseModel):
    amount: float
    merchant: str
    category_name: str
    iso_date: str
    type: str = Field(description="'expense' or 'income'")

class StatementData(BaseModel):
    transactions: List[ParsedStatementTransaction]

@router.post("/parse-transaction", response_model=Expense)
def parse_transaction(req: ParseTransactionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    today_str = date.today().isoformat()
    prompt = f"""
    You are an AI financial assistant. 
    The user wants to record an expense. Parse their natural language input or raw SMS bank alert into structured data.
    If it's an SMS (e.g. "Debited", "Spent", "Avail Bal"), extract the merchant, amount, and date.
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
        account = db.query(AccountModel).filter(AccountModel.name.ilike(f"%{parsed['account_name']}%"), AccountModel.user_id == current_user.id).first()
        if not account:
            # Default fallback account or create it
            account = db.query(AccountModel).filter(AccountModel.user_id == current_user.id).first()
            if not account:
                account = AccountModel(name="Cash", balance=0.0, type="Cash", user_id=current_user.id)
                db.add(account)
                db.commit()
                db.refresh(account)
                
        # Resolve Category
        category = db.query(CategoryModel).filter(CategoryModel.name.ilike(f"%{parsed['category_name']}%"), CategoryModel.user_id == current_user.id).first()
        if not category:
            category = CategoryModel(name=parsed['category_name'], description="AI Generated", user_id=current_user.id)
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
            notes=parsed.get('notes', "AI generated"),
            user_id=current_user.id
        )
        
        account.balance -= parsed['amount']
        
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        
        return new_expense

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    # Get current financial context
    total_balance = db.query(func.sum(AccountModel.balance)).filter(AccountModel.user_id == current_user.id).scalar() or 0.0
    
    first_day_of_month = date.today().replace(day=1)
    month_spending = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.date >= first_day_of_month, ExpenseModel.user_id == current_user.id).scalar() or 0.0
    
    # Recent transactions
    recent_txs = db.query(ExpenseModel).filter(ExpenseModel.user_id == current_user.id).order_by(ExpenseModel.date.desc()).limit(5).all()
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

@router.post("/scan-receipt", response_model=Expense)
async def scan_receipt(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    contents = await file.read()
    
    file_url = None
    if s3_client and settings.R2_BUCKET_NAME:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{ext}"
        try:
            s3_client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=filename,
                Body=contents,
                ContentType=file.content_type
            )
            file_url = f"{settings.R2_ENDPOINT_URL}/{settings.R2_BUCKET_NAME}/{filename}"
        except Exception as e:
            print("Failed to upload to R2:", e)

    prompt = "Extract the transaction details from this receipt image. Calculate the correct ISO date if present. Account name should default to 'Cash'. Notes should say 'Receipt Scan'."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=[
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ParsedData,
            ),
        )
        
        parsed = json.loads(response.text)
        account = db.query(AccountModel).filter(AccountModel.name.ilike(f"%{parsed['account_name']}%"), AccountModel.user_id == current_user.id).first()
        if not account:
            account = db.query(AccountModel).filter(AccountModel.user_id == current_user.id).first()
            if not account:
                account = AccountModel(name="Cash", balance=0.0, type="Cash", user_id=current_user.id)
                db.add(account)
                db.commit()
                db.refresh(account)
                
        category = db.query(CategoryModel).filter(CategoryModel.name.ilike(f"%{parsed['category_name']}%"), CategoryModel.user_id == current_user.id).first()
        if not category:
            category = CategoryModel(name=parsed['category_name'], description="AI Generated", user_id=current_user.id)
            db.add(category)
            db.commit()
            db.refresh(category)
            
        try:
            tx_date = date.fromisoformat(parsed['iso_date'])
        except:
            tx_date = date.today()

        new_expense = ExpenseModel(
            amount=parsed['amount'],
            merchant=parsed['merchant'],
            date=tx_date,
            account_id=account.id,
            category_id=category.id,
            notes=parsed.get('notes', "AI receipt scan"),
            receipt_url=file_url,
            user_id=current_user.id
        )
        
        account.balance -= parsed['amount']
        
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        
        return new_expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class HealthScore(BaseModel):
    score: int
    summary: str

class HealthResponseSchema(BaseModel):
    score: int
    summary: str

@router.get("/health", response_model=HealthScore)
def get_health_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    total_balance = db.query(func.sum(AccountModel.balance)).filter(AccountModel.user_id == current_user.id).scalar() or 0.0
    recent_expenses = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.user_id == current_user.id).scalar() or 0.0
    
    prompt = f"Given a total balance of {total_balance} and recent expenses of {recent_expenses}, output a financial health score (0-100) and a brief 1-sentence summary as JSON."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HealthResponseSchema,
            )
        )
        data = json.loads(response.text)
        return HealthScore(score=data['score'], summary=data['summary'])
    except:
        return HealthScore(score=50, summary="Unable to calculate at this time.")

class Prediction(BaseModel):
    predicted_spend: float

@router.get("/predictions", response_model=Prediction)
def get_predictions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    first_day = date.today().replace(day=1)
    spent = db.query(func.sum(ExpenseModel.amount)).filter(ExpenseModel.date >= first_day, ExpenseModel.user_id == current_user.id).scalar() or 0.0
    days_passed = max(date.today().day, 1)  # day is always 1-31 but guard against edge cases
    daily_rate = spent / days_passed
    return Prediction(predicted_spend=daily_rate * 30)

class ReportResponse(BaseModel):
    markdown: str

@router.get("/generate-report", response_model=ReportResponse)
def generate_weekly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    last_week = date.today() - datetime.timedelta(days=7)
    recent = db.query(ExpenseModel).filter(ExpenseModel.date >= last_week, ExpenseModel.user_id == current_user.id).all()
    tx_str = "\n".join([f"- {t.date}: ₹{t.amount} at {t.merchant} (Category {t.category_id})" for t in recent])
    
    prompt = f"Generate a weekly financial report in Markdown format based on these expenses:\n{tx_str}\nInclude sections: Summary, Top Expenses, Warnings, Achievements. Make it sound encouraging."
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt
    )
    return ReportResponse(markdown=response.text)

@router.post("/import-statement", response_model=List[Expense])
async def import_statement(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    contents = await file.read()
    
    prompt = """
    Extract all transactions from this bank statement (CSV or PDF). 
    For each transaction, determine the amount, merchant, a suitable category, date (in ISO YYYY-MM-DD format), and whether it is an 'expense' or 'income'.
    Ignore header rows, balance summaries, and non-transaction text.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=[
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StatementData,
            ),
        )
        
        parsed = json.loads(response.text)
        transactions = parsed.get('transactions', [])
        
        saved_transactions = []
        
        # We assume statements go to a default bank account, or create one
        account = db.query(AccountModel).filter(AccountModel.type == "Bank", AccountModel.user_id == current_user.id).first()
        if not account:
            account = AccountModel(name="Main Bank", balance=0.0, type="Bank", user_id=current_user.id)
            db.add(account)
            db.commit()
            db.refresh(account)
            
        for tx in transactions:
            category = db.query(CategoryModel).filter(CategoryModel.name.ilike(f"%{tx['category_name']}%"), CategoryModel.user_id == current_user.id).first()
            if not category:
                category = CategoryModel(name=tx['category_name'], description="AI Generated", user_id=current_user.id)
                db.add(category)
                db.commit()
                db.refresh(category)
                
            try:
                tx_date = date.fromisoformat(tx['iso_date'])
            except Exception:
                tx_date = date.today()

            if tx.get('type') == 'income':
                from models.income import Income as IncomeModel
                new_income = IncomeModel(
                    amount=tx['amount'],
                    source=tx['merchant'],
                    date=tx_date,
                    account_id=account.id,
                    notes="Statement Import",
                    user_id=current_user.id
                )
                account.balance += tx['amount']
                db.add(new_income)
            else:
                new_expense = ExpenseModel(
                    amount=tx['amount'],
                    merchant=tx['merchant'],
                    date=tx_date,
                    account_id=account.id,
                    category_id=category.id,
                    notes="Statement Import",
                    user_id=current_user.id
                )
                account.balance -= tx['amount']
                db.add(new_expense)
                saved_transactions.append(new_expense)
            
        db.commit()
        for e in saved_transactions:
            db.refresh(e)
            
        return saved_transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
