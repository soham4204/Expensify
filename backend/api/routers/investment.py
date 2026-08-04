from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf

from core.database import get_db
from models.investment import Investment as InvestmentModel
from schemas.investment import Investment, InvestmentCreate
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/investments", tags=["Investments"])

@router.post("/", response_model=Investment)
def create_investment(investment: InvestmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_inv = InvestmentModel(**investment.model_dump(), user_id=current_user.id)
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    
    # Try fetching initial price
    try:
        ticker = yf.Ticker(db_inv.ticker_symbol)
        current_price = ticker.fast_info['lastPrice']
    except Exception:
        current_price = db_inv.avg_purchase_price
        
    return process_investment_data(db_inv, current_price)

@router.get("/", response_model=List[Investment])
def read_investments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investments = db.query(InvestmentModel).filter(InvestmentModel.user_id == current_user.id).offset(skip).limit(limit).all()
    
    result = []
    # Bulk fetch or loop depending on size. We'll just loop for simplicity.
    for inv in investments:
        try:
            ticker = yf.Ticker(inv.ticker_symbol)
            current_price = ticker.fast_info['lastPrice']
        except Exception:
            current_price = inv.avg_purchase_price
        
        result.append(process_investment_data(inv, current_price))
        
    return result

@router.delete("/{inv_id}")
def delete_investment(inv_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(InvestmentModel).filter(InvestmentModel.id == inv_id, InvestmentModel.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    db.delete(inv)
    db.commit()
    return {"message": "Investment deleted"}

def process_investment_data(inv: InvestmentModel, current_price: float):
    current_value = inv.quantity * current_price
    invested_value = inv.quantity * inv.avg_purchase_price
    profit_loss = current_value - invested_value
    profit_loss_pct = (profit_loss / invested_value * 100) if invested_value > 0 else 0.0
    
    # Create the schema object manually to include calculated fields
    return Investment(
        id=inv.id,
        asset_name=inv.asset_name,
        ticker_symbol=inv.ticker_symbol,
        quantity=inv.quantity,
        avg_purchase_price=inv.avg_purchase_price,
        current_price=current_price,
        current_value=current_value,
        profit_loss=profit_loss,
        profit_loss_pct=profit_loss_pct
    )
