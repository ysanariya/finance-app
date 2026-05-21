from pydantic import (
    BaseModel,
    Field
)

from typing import Literal
from datetime import date


##################################################
################ BUDGET ITEM #####################
##################################################

class BudgetItem(BaseModel):

    category: str

    budget_type: Literal[
        "monthly",
        "annual"
    ]

    amount: float = Field(
        gt=0
    )

    ########################################
    ######## VALIDITY WINDOW ###############
    ########################################

    start_date: date

    end_date: date


class BudgetBatchCreate(BaseModel):

    budgets: list[
        BudgetItem
    ]

    force_update: bool = False


##################################################
################ TARGET CREATE ###################
##################################################

class BudgetTargetCreate(BaseModel):

    monthly_income_target: float = Field(
        gt=0
    )

    savings_rate_target: float = Field(
        ge=0,
        le=100
    )