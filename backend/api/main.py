from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db, engine, Base
from models import category as category_model
from schemas import category as category_schema

from api.routers import account, income, expense, dashboard, budget, recurring, analytics, export, ai, investment, auth

app = FastAPI(title="AI Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(account.router)
app.include_router(income.router)
app.include_router(expense.router)
app.include_router(dashboard.router)
app.include_router(budget.router)
app.include_router(recurring.router)
app.include_router(analytics.router)
app.include_router(export.router)
app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(investment.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Expense Tracker API"}

@app.post("/categories/", response_model=category_schema.Category)
def create_category(category: category_schema.CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(category_model.Category).filter(category_model.Category.name == category.name).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Category already registered")
    
    new_category = category_model.Category(name=category.name, description=category.description)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@app.get("/categories/", response_model=List[category_schema.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(category_model.Category).offset(skip).limit(limit).all()
    return categories
