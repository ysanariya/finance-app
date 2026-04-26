from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from database import Base

class Income(Base):
    __tablename__ = "income"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)

    source = Column(String, nullable=False)
    amount = Column(Float, nullable=False)

    currency = Column(String, default="INR")

    recorded_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    is_deleted = Column(Boolean, default=False)
