from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    merchant_or_source = Column(String, nullable=False)
    frequency = Column(String, nullable=False, default="monthly") # 'monthly', 'weekly', 'yearly'
    type = Column(String, nullable=False) # 'expense', 'income'
    next_run_date = Column(Date, nullable=False)
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    account = relationship("Account")
    category = relationship("Category")
