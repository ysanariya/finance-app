from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Date,
    UniqueConstraint
)

from datetime import (
    datetime,
    timezone
)

from database import Base


class Budget(Base):

    __tablename__ = "budgets"

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

    category = Column(
        String,
        nullable=False,
        index=True
    )

    budget_type = Column(
        String,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    #######################################
    ######## VALIDITY WINDOW ##############
    #######################################

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    #######################################

    is_deleted = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda:
            datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda:
            datetime.now(timezone.utc),

        onupdate=lambda:
            datetime.now(timezone.utc)
    )