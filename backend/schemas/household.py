from pydantic import BaseModel

class HouseholdCreate(BaseModel):
    name: str

class HouseholdResponse(BaseModel):
    id: int
    name: str
    base_currency: str

    class Config:
        from_attributes = True