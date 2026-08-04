from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Tuple
import yfinance as yf
import time

from core.database import get_db
from models.investment import Investment as InvestmentModel
from schemas.investment import Investment, InvestmentCreate
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/investments", tags=["Investments"])

# Simple in-memory price cache: {ticker: (price, timestamp)}
_price_cache: Dict[str, Tuple[float, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached_price(ticker_symbol: str, fallback_price: float) -> float:
    """Fetch live price from yfinance with a 5-minute in-memory cache to avoid N+1 API calls."""
    now = time.time()
    cached = _price_cache.get(ticker_symbol)
    if cached and (now - cached[1]) < CACHE_TTL_SECONDS:
        return cached[0]
    try:
        ticker = yf.Ticker(ticker_symbol)
        price = ticker.fast_info['lastPrice']
        _price_cache[ticker_symbol] = (price, now)
        return price
    except Exception:
        return fallback_price


@router.post("/", response_model=Investment)
def create_investment(investment: InvestmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_inv = InvestmentModel(**investment.model_dump(), user_id=current_user.id)
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    
    current_price = get_cached_price(db_inv.ticker_symbol, db_inv.avg_purchase_price)
    return process_investment_data(db_inv, current_price)


@router.get("/", response_model=List[Investment])
def read_investments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investments = db.query(InvestmentModel).filter(InvestmentModel.user_id == current_user.id).offset(skip).limit(limit).all()
    
    result = []
    for inv in investments:
        current_price = get_cached_price(inv.ticker_symbol, inv.avg_purchase_price)
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
