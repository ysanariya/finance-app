from pydantic import BaseModel, Field, field_validator
from datetime import date

ALLOWED_CATEGORIES = [
    "cash",  #Liquid Assets/Cash Equivalents
    "equities", #Equities and Mutual Funds
    "fd", #Fixed Income instruments
    "gold", #Tangible & Intangible Gold
    "real_estate", #Real Estate
    "retirement", #Retirement Assets
    "receivables", #Receivables
    "otherassets" #Other Assets
]

class AssetCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str
    value: float = Field(gt=0)
    notes: str | None = None
    recorded_at: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        v = v.strip().lower()
        if v not in ALLOWED_CATEGORIES:
            raise ValueError(f"Invalid category. Allowed: {ALLOWED_CATEGORIES}")
        return v
