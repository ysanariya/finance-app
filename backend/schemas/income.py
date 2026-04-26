from pydantic import BaseModel
from datetime import datetime

class IncomeCreate(BaseModel):
    source: str
    amount: float
    recorded_at: datetime
