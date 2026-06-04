from datetime import date

from pydantic import BaseModel
from decimal import Decimal


class ImportedTransactionCreate(BaseModel):

    account_id: int

    transaction_date: date

    description: str

    amount: Decimal

    merchant: str | None = None

    category: str | None = None

    external_reference: str | None = None


class ImportedTransactionResponse(BaseModel):

    id: int

    household_id: int

    account_id: int

    account_name: str

    transaction_date: date

    description: str

    amount: Decimal

    merchant: str | None

    category: str | None

    classification_source: str | None

    matched_rule_pattern: str | None

    external_reference: str | None

    class Config:
        from_attributes = True