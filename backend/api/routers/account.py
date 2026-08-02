from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.account import Account as AccountModel
from schemas.account import Account, AccountCreate

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.post("/", response_model=Account)
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    db_account = db.query(AccountModel).filter(AccountModel.name == account.name).first()
    if db_account:
        raise HTTPException(status_code=400, detail="Account already registered")
    
    new_account = AccountModel(**account.model_dump())
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.get("/", response_model=List[Account])
def read_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    accounts = db.query(AccountModel).offset(skip).limit(limit).all()
    return accounts
