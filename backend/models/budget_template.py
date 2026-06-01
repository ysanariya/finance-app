from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from database import Base

class BudgetTemplate(Base):
    __tablename__ = "budget_templates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    default_amount = Column(Float, nullable=False, default=0.0)

    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_user_category_template"),)
