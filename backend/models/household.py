from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from database import Base

class Household(Base):

    __tablename__ = "households"

    id = Column(
        Integer,
        primary_key=True
    )

    name = Column(
        String,
        nullable=False
    )

    base_currency = Column(
        String,
        nullable=False,
        default="INR"
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc)
    )