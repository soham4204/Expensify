from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    payment_method = Column(String, nullable=True) # UPI, Cash, Card
    notes = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)

    category = relationship("Category")
    account = relationship("Account")
