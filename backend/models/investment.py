from sqlalchemy import Column, Integer, String, Float
from core.database import Base

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String, index=True, nullable=False)
    ticker_symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    avg_purchase_price = Column(Float, nullable=False, default=0.0)
