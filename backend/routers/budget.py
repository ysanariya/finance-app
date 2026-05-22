from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from routers.auth import get_current_user

from models.user import User
from models.budget import Budget
from models.budget_target import BudgetTarget

from schemas.budget import (
    BudgetBatchCreate,
    BudgetTargetCreate
)

router = APIRouter()

##################################################
################ POST /budget ####################
##################################################

@router.post("/budget")
async def create_budget(

    payload: BudgetBatchCreate,

    current_user: User = Depends(
        get_current_user
    ),

    db: AsyncSession = Depends(get_db)
):

    created = 0

    confirmation_required = []

    ##################################################
    ######## VALIDATE EXISTING ACTIVE BUDGETS ########
    ##################################################

    for item in payload.budgets:

        existing = await db.execute(

            select(Budget)

            .where(
                Budget.user_id
                == current_user.id
            )

            .where(
                Budget.category
                == item.category
            )

            .where(
                Budget.start_date
                == item.start_date
            )

            .where(
                Budget.end_date
                == item.end_date
            )

            .where(
                Budget.is_deleted
                == False
            )
        )

        existing = (
            existing.scalars().first()
        )

        ##################################################
        ######## REQUIRE CONFIRMATION ####################
        ##################################################

        if existing:

            confirmation_required.append({

                "category":
                    item.category,

                ##################################
                # EXISTING BUDGET
                ##################################

                "existing_amount":
                    existing.amount,

                "existing_budget_type":
                    existing.budget_type,

                ##################################
                # NEW BUDGET
                ##################################

                "new_amount":
                    item.amount,

                "new_budget_type":
                    item.budget_type,

                ##################################

                "start_date":
                    item.start_date,

                "end_date":
                    item.end_date
            })

    ##################################################
    ######## RETURN CONFIRMATION #####################
    ##################################################

    if (

        confirmation_required

        and

        not payload.force_update
    ):

        return {

            "requires_confirmation":
                True,

            "conflicts":
                confirmation_required
        }

    ##################################################
    ######## CREATE NEW VERSIONS #####################
    ##################################################

    for item in payload.budgets:

        existing = await db.execute(

            select(Budget)

            .where(
                Budget.user_id
                == current_user.id
            )

            .where(
                Budget.category
                == item.category
            )

            .where(
                Budget.start_date
                == item.start_date
            )

            .where(
                Budget.end_date
                == item.end_date
            )

            .where(
                Budget.is_deleted
                == False
            )
        )

        existing = (
            existing.scalars().first()
        )

        ##################################################
        ######## SOFT DELETE OLD VERSION #################
        ##################################################

        if existing:

            existing.is_deleted = True

        ##################################################
        ######## CREATE NEW VERSION ######################
        ##################################################

        new_budget = Budget(

            user_id=current_user.id,

            category=item.category,

            budget_type=item.budget_type,

            amount=item.amount,

            start_date=item.start_date,

            end_date=item.end_date,

            is_deleted=False
        )

        db.add(new_budget)

        created += 1

    await db.commit()

    return {

        "success": True,

        "created":
            created
    }

##################################################
################# GET /budget ####################
##################################################

@router.get("/budget")
async def get_budgets(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(Budget)

        .where(
            Budget.user_id == current_user.id
        )

        .where(
            Budget.is_deleted == False
        )

        .order_by(
            Budget.start_date.desc()
        )
    )

    budgets = result.scalars().all()

    return [

        {

            "id":
                budget.id,

            "category":
                budget.category,

            "budget_type":
                budget.budget_type,

            "amount":
                budget.amount,

            "start_date":
                budget.start_date,

            "end_date":
                budget.end_date
        }

        for budget in budgets
    ]

##################################################
############# POST /budget/target ################
##################################################

@router.post("/budget/target")
async def create_budget_target(

    payload: BudgetTargetCreate,

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    existing = await db.execute(

        select(BudgetTarget)

        .where(
            BudgetTarget.user_id == current_user.id
        )
    )

    existing = (
        existing.scalar_one_or_none()
    )

    ########################################
    ######## UPDATE ########################
    ########################################

    if existing:

        existing.monthly_income_target = (
            payload.monthly_income_target
        )

        existing.savings_rate_target = (
            payload.savings_rate_target
        )

        await db.commit()

        return {

            "success": True,

            "message":
                "Budget target updated"
        }

    ########################################
    ######## CREATE ########################
    ########################################

    new_target = BudgetTarget(

        user_id=current_user.id,

        monthly_income_target=
            payload.monthly_income_target,

        savings_rate_target=
            payload.savings_rate_target
    )

    db.add(new_target)

    await db.commit()

    await db.refresh(new_target)

    return {

        "success": True,

        "target_id":
            new_target.id
    }


##################################################
############## GET /budget/target ################
##################################################

@router.get("/budget/target")
async def get_budget_target(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BudgetTarget)

        .where(
            BudgetTarget.user_id == current_user.id
        )
    )

    target = (
        result.scalar_one_or_none()
    )

    if not target:

        return None

    return {

        "monthly_income_target":
            target.monthly_income_target,

        "savings_rate_target":
            target.savings_rate_target
    }