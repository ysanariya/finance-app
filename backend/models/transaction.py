from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, UniqueConstraint
from datetime import datetime
from database import Base

class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=True)

    # 🔥 Strong dedupe key
    reference_number = Column(String, nullable=True)

    recorded_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())

    is_deleted = Column(Boolean, default=False)

    # 🔥 DB-level safety (even if app fails)
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "reference_number",
            name="unique_bank_tx_ref"
        ),
    )