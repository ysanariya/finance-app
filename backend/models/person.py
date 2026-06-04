from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey
)

from database import Base

class Person(Base):

    __tablename__ = "persons"

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

    is_active = Column(
        Boolean,
        default=True
    )