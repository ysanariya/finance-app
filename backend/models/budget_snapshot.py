from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint
)

from datetime import datetime, timezone

from database import Base


class BudgetSnapshot(Base):

    __tablename__ = "budget_snapshots"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    month = Column(
        Integer,
        nullable=False
    )

    year = Column(
        Integer,
        nullable=False,
        index=True
    )

    category = Column(
        String,
        nullable=False
    )

    budget_amount = Column(
        Float,
        nullable=False
    )

    actual_amount = Column(
        Float,
        nullable=False
    )

    utilization_pct = Column(
        Float,
        nullable=False
    )

    variance_amount = Column(
        Float,
        nullable=False
    )

    pace_delta_pct = Column(
        Float,
        nullable=True
    )

    projected_month_end = Column(
        Float,
        nullable=True
    )

    status = Column(
        String,
        nullable=False
    )

    generated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (

        UniqueConstraint(
            "user_id",
            "month",
            "year",
            "category",
            name="uq_budget_snapshot_period"
        ),
    )