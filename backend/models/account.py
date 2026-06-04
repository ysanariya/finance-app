from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime
)

from datetime import datetime, timezone
from database import Base

class Account(Base):

    __tablename__ = "accounts"

    id = Column(
        Integer,
        primary_key=True
    )

    household_id = Column(
        Integer,
        ForeignKey("households.id"),
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    institution = Column(
        String,
        nullable=True
    )

    account_role = Column(
        String,
        nullable=False
    )

    account_type = Column(
        String,
        nullable=False
    )

    currency = Column(
        String,
        nullable=False,
        default="INR"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc)
    )

    account_number_last4 = Column(
        String(4),
        nullable=True
    )

    notes = Column(
        String,
        nullable=True
    )