from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    ForeignKey,
    Date,
    DateTime,
    Numeric
)

from datetime import datetime, timezone

from database import Base


class ImportedTransaction(Base):

    __tablename__ = "imported_transactions"

    id = Column(
        Integer,
        primary_key=True
    )

    household_id = Column(
        Integer,
        ForeignKey("households.id"),
        nullable=False
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.id"),
        nullable=False
    )

    transaction_date = Column(
        Date,
        nullable=False
    )

    description = Column(
        String,
        nullable=False
    )

    amount = Column(
        Numeric(18, 2),
        nullable=False
    )

    merchant = Column(
        String,
        nullable=True
    )

    category = Column(
        String,
        nullable=True
    )

    classification_source = Column(
        String,
        nullable=True
    )

    matched_rule_pattern = Column(
        String,
        nullable=True
    )

    external_reference = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc)
    )

    is_reviewed = Column(
        Boolean,
        default=False,
        nullable=False,
        server_default="0"
    )

    is_posted = Column(
        Boolean,
        default=False,
        nullable=False,
        server_default="0"
    )