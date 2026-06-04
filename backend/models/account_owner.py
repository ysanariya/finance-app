from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Float
)

from database import Base

class AccountOwner(Base):

    __tablename__ = "account_owners"

    id = Column(
        Integer,
        primary_key=True
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.id"),
        nullable=False
    )

    person_id = Column(
        Integer,
        ForeignKey("persons.id"),
        nullable=False
    )

    ownership_pct = Column(
        Float,
        nullable=False,
        default=100.0
    )