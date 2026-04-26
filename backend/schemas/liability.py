from pydantic import BaseModel, Field, field_validator
from datetime import date

ALLOWED_LIABILITY_CATEGORIES = [
    "home_loan",
    "personal_loan",
    "car_loan",
    "education_loan",
    "credit_card",
    "payables",
    "other"
]



class LiabilityCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str
    value: float = Field(gt=0)
    notes: str | None = None
    recorded_at: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        v = v.strip().lower()
        if v not in ALLOWED_LIABILITY_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v
