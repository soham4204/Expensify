from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    period = Column(String, nullable=False, default="monthly") # 'monthly', 'weekly'
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True) # If null, it's an overall budget
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    category = relationship("Category")
    user = relationship("User")
