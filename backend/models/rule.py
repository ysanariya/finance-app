from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from database_rules import RulesBase


class TransactionRule(RulesBase):
    __tablename__ = "transaction_rules"

    id = Column(Integer, primary_key=True, index=True)

    pattern = Column(String, nullable=False)
    match_type = Column(String, nullable=False, default="contains")
    # contains | exact

    merchant = Column(String, nullable=True)

    transaction_type = Column(String, nullable=True)
    # income | expense | transfer | investment

    category = Column(String, nullable=True)

    priority = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.utcnow()
    )