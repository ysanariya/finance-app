from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from database import Base

class FixedExpense(Base):
    __tablename__ = "fixed_expense"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)
    category = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    frequency = Column(String, default="monthly")

    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    is_deleted = Column(Boolean, default=False)
