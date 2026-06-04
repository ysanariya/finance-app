from pydantic import BaseModel


class AccountCreate(BaseModel):

    person_id: int

    name: str

    institution: str | None = None

    account_number_last4: str | None = None

    account_role: str

    account_type: str

    notes: str | None = None


class AccountResponse(BaseModel):

    id: int

    household_id: int

    name: str

    institution: str | None

    account_number_last4: str | None

    account_role: str

    account_type: str

    currency: str

    notes: str | None

    class Config:
        from_attributes = True