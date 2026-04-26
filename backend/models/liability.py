from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from datetime import datetime, timezone
from database import Base

class Liability(Base):
    __tablename__ = "liability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    currency = Column(String, default="INR")
    notes = Column(String)

    recorded_at = Column(DateTime(timezone=True), nullable=False)
    is_deleted = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
)
    
