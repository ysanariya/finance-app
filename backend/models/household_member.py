from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)

from database import Base

class HouseholdMember(Base):

    __tablename__ = "household_members"

    id = Column(
        Integer,
        primary_key=True
    )

    household_id = Column(
        Integer,
        ForeignKey("households.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="OWNER"
    )