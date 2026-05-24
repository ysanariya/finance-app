from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from datetime import date, datetime, time, timezone
from calendar import monthrange
from models.transaction import BankTransaction
from services.date_utils import resolve_date_range

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

##################################################
############### GET /budget/deviation ############
##################################################

@router.get("/budget/deviation")
async def get_budget_deviation(

    start_date: str | None = Query(None),

    end_date: str | None = Query(None),

    budget_type: str | None = Query(
        None,
        description="monthly or annual"
    ),

    category: str | None = Query(None),

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    ##################################################
    ######## RESOLVE DATE RANGE ######################
    ##################################################

    start, end = resolve_date_range(
        start_date,
        end_date
    )

    ##################################################
    ######## DETERMINE VIEW TYPE #####################
    ##################################################

    resolved_budget_type = budget_type

    if not resolved_budget_type:

        if (
            start.year == end.year
            and
            start.month == end.month
        ):

            resolved_budget_type = "monthly"

        else:

            resolved_budget_type = "annual"

    ##################################################
    ######## FETCH ACTIVE BUDGETS ####################
    ##################################################

    budget_query = (

        select(Budget)

        .where(
            Budget.user_id
            == current_user.id
        )

        .where(
            Budget.is_deleted
            == False
        )
    )

    
    if category:

        budget_query = budget_query.where(
            Budget.category == category
        )

    ##################################################
    ######## RANGE OVERLAP FILTERING #################
    ##################################################

    budget_query = (

        budget_query
            .where(
                Budget.start_date <= end.date()
            )
            .where(
                Budget.end_date >= start.date()
            )
    )

    budget_result = await db.execute(
        budget_query
    )

    budgets = budget_result.scalars().all()

    budgets = sorted(

        budgets,

        key=lambda b: b.category.lower()
    )

    ##################################################
    ######## NO BUDGETS ##############################
    ##################################################

    if not budgets:

        return {

            "budget_type":
                resolved_budget_type,

            "summary": {

                "total_budget": 0,

                "total_actual": 0,

                "total_deviation": 0,

                "over_budget_count": 0,

                "category_count": 0
            },

            "categories": []
        }

    ##################################################
    ######## FETCH TRANSACTIONS ######################
    ##################################################

    tx_query = (

        select(BankTransaction)

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.is_deleted
            == False
        )

        .where(
            BankTransaction.amount < 0
        )

        .where(
            BankTransaction.transaction_type.in_([
                "expense",
                "loan repayment",
                "infer"
            ])
        )

        .where(
            BankTransaction.recorded_at >= start
        )

        .where(
            BankTransaction.recorded_at <= end
        )
    )

    if category:

        tx_query = tx_query.where(
            BankTransaction.category
            == category
        )

    tx_result = await db.execute(
        tx_query
    )

    transactions = tx_result.scalars().all()

    ##################################################
    ######## CATEGORY SPEND MAP ######################
    ##################################################

    spend_map = {}

    for tx in transactions:

        tx_category = tx.category

        if not tx_category:
            continue

        if tx_category not in spend_map:

            spend_map[tx_category] = 0

        spend_map[tx_category] += abs(
            tx.amount or 0
        )

##################################################
######## YTD MONTH MULTIPLIER ####################
##################################################

    elapsed_months = 1

    if resolved_budget_type == "annual":

        current_date = datetime.utcnow().date()

        elapsed_months = current_date.month




    ##################################################
    ######## BUILD RESPONSE ##########################
    ##################################################

    rows = []

    total_budget = 0
    total_actual = 0
    over_budget_count = 0

    for budget in budgets:

        print({

            "category": budget.category,

            "budget_type": budget.budget_type,

            "raw_amount": budget.amount,

            "resolved_budget_type": resolved_budget_type,

            "elapsed_months": elapsed_months,
        })

        actual_spent = round(

            spend_map.get(
                budget.category,
                0
            ),

            2
        )


        
        ##################################################
        ######## NORMALIZE BUDGET ########################
        ##################################################

        normalized_budget = budget.amount

        ##################################################
        ######## MONTHLY VIEW ############################
        ##################################################

        if resolved_budget_type == "monthly":

            ##################################################
            ######## ANNUAL → MONTHLY ########################
            ##################################################

            if budget.budget_type == "annual":

                normalized_budget = (

                    budget.amount / 12
                )

        ##################################################
        ######## ANNUAL / YTD VIEW #######################
        ##################################################

        elif resolved_budget_type == "annual":

            ##################################################
            ######## MONTHLY → YTD ###########################
            ##################################################

            if budget.budget_type == "monthly":

                normalized_budget = (

                    budget.amount
                    * elapsed_months
                )

            ##################################################
            ######## ANNUAL → YTD ############################
            ##################################################

            elif budget.budget_type == "annual":

                normalized_budget = (

                    budget.amount

                    * (
                        elapsed_months / 12
                    )
                )

        budget_amount = round(
            normalized_budget,
            2
        )


                
        print({
            "category": budget.category,

            "normalized_budget": budget_amount,
        })


        deviation_amount = round(
            actual_spent - budget_amount,
            2
        )

        deviation_pct = 0

        if budget_amount > 0:

            deviation_pct = round(

                (
                    deviation_amount
                    / budget_amount
                ) * 100,

                1
            )

        ##################################################
        ######## STATUS ##################################
        ##################################################

        if deviation_amount > 0:

            status = "over"

            over_budget_count += 1

        elif deviation_amount == 0:

            status = "on_track"

        else:

            status = "under"

        ##################################################
        ######## MONTH PROJECTION ########################
        ##################################################

        projected_month_end = actual_spent

        if resolved_budget_type == "monthly":

            total_days = monthrange(
                start.year,
                start.month
            )[1]

            elapsed_days = max(
                (
                    datetime.utcnow().date()
                    - start.date()
                ).days + 1,
                1
            )

            elapsed_days = min(
                elapsed_days,
                total_days
            )

            projected_month_end = round(

                (
                    actual_spent
                    / elapsed_days
                ) * total_days,

                2
            )

        ##################################################
        ######## RESPONSE ROW ############################
        ##################################################

        rows.append({

            "category":
                budget.category,

            "budget_amount":
                budget_amount,

            "actual_spent":
                actual_spent,

            "deviation_amount":
                deviation_amount,

            "deviation_pct":
                deviation_pct,

            "projected_month_end":
                projected_month_end,

            "status":
                status,

            "budget_type":
                budget.budget_type,

            "start_date":
                budget.start_date,

            "end_date":
                budget.end_date
        })

        total_budget += budget_amount

        total_actual += actual_spent

    ##################################################
    ######## SORT ####################################
    ##################################################

    rows = sorted(

        rows,

        key=lambda x: x["deviation_pct"],

        reverse=True
    )

    ##################################################
    ######## SUMMARY #################################
    ##################################################

    total_deviation = round(
        total_actual - total_budget,
        2
    )

    return {

        "budget_type":
            resolved_budget_type,

        "summary": {

            "total_budget":
                round(total_budget, 2),

            "total_actual":
                round(total_actual, 2),

            "total_deviation":
                total_deviation,

            "over_budget_count":
                over_budget_count,

            "category_count":
                len(rows)
        },

        "categories":
            rows
    }