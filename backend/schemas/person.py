from pydantic import BaseModel

class PersonCreate(BaseModel):
    name: str

class PersonResponse(BaseModel):
    id: int
    household_id: int
    name: str

    class Config:
        from_attributes = True