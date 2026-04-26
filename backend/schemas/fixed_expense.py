from pydantic import BaseModel
from datetime import datetime

class FixedExpenseCreate(BaseModel):
    name: str
    category: str
    amount: float
    start_date: datetime
    end_date: datetime | None = None
