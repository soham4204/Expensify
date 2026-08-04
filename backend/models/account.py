from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    balance = Column(Float, default=0.0)
    type = Column(String, nullable=False) # e.g., Cash, Bank, Credit Card
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user = relationship("User")
