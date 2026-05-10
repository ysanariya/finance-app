from pydantic import BaseModel
from typing import Optional


class RuleCreate(BaseModel):
    pattern: str
    match_type: str
    merchant: Optional[str] = None
    transaction_type: str
    category: Optional[str] = None
    priority: int = 0


class RuleUpdate(BaseModel):
    pattern: Optional[str] = None
    match_type: Optional[str] = None
    merchant: Optional[str] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None