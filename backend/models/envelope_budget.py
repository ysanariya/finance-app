from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, DateTime
from datetime import datetime, timezone
from database import Base

class BudgetGroup(Base):
    __tablename__ = "budget_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)

class CategoryGroupMapping(Base):
    __tablename__ = "category_group_mappings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("budget_groups.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "category", name="uq_user_category_group"),
    )

class BudgetEnvelope(Base):
    __tablename__ = "budget_envelopes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    budgeted_amount = Column(Float, nullable=False, default=0.0)

    __table_args__ = (
        UniqueConstraint("user_id", "category", "year", "month", name="uq_user_category_period"),
    )
