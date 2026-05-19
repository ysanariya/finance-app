from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, func

from database import get_db

from routers.auth import get_current_user

from routers.assets import get_assets
from routers.liabilities import get_liability

from models.user import User

from models.asset import Asset
from models.liability import Liability
from models.transaction import BankTransaction

from datetime import datetime


router = APIRouter()


#################################
######## DASHBOARD SUMMARY ######
#################################

@router.get("/dashboard/summary")
async def dashboard_summary(

    date: str | None = Query(None),

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    assets = await get_assets(
        date=date,
        current_user=current_user,
        db=db
    )

    liabilities = await get_liability(
        date=date,
        current_user=current_user,
        db=db
    )

    total_assets = sum(
        a.value for a in assets
    )

    total_liabilities = sum(
        l.value for l in liabilities
    )

    return {

        "net_worth":
            total_assets - total_liabilities,

        "total_assets":
            total_assets,

        "total_liabilities":
            total_liabilities
    }


#################################
######## ASSET BREAKDOWN ########
#################################

@router.get("/assets/breakdown")
async def asset_breakdown(

    date: str | None = Query(None),

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    assets = await get_assets(
        date=date,
        current_user=current_user,
        db=db
    )

    category_map = {}

    for asset in assets:

        cat = asset.category

        if cat not in category_map:
            category_map[cat] = 0

        category_map[cat] += asset.value

    return [

        {
            "category": k,
            "total": v
        }

        for k, v in category_map.items()
    ]


#################################
######## NET WORTH TREND ########
#################################

@router.get("/dashboard/trend")
async def net_worth_trend(

    start: str | None = Query(None),

    end: str | None = Query(None),

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    asset_dates_result = await db.execute(

        select(Asset.recorded_at)

        .where(
            Asset.user_id == current_user.id,
            Asset.is_deleted == False
        )
    )

    liability_dates_result = await db.execute(

        select(Liability.recorded_at)

        .where(
            Liability.user_id == current_user.id,
            Liability.is_deleted == False
        )
    )

    asset_dates = [
        row[0]
        for row in asset_dates_result.all()
    ]

    liability_dates = [
        row[0]
        for row in liability_dates_result.all()
    ]

    all_dates = sorted(
        set(asset_dates + liability_dates)
    )

    if not all_dates:
        return []

    if start:

        start_dt = datetime.strptime(
            start,
            "%Y-%m-%d"
        )

        all_dates = [
            d for d in all_dates
            if d >= start_dt
        ]

    if end:

        end_dt = datetime.strptime(
            end,
            "%Y-%m-%d"
        )

        all_dates = [
            d for d in all_dates
            if d <= end_dt
        ]

    trend = []

    for dt in all_dates:

        date_str = dt.strftime(
            "%Y-%m-%d"
        )

        assets = await get_assets(
            date=date_str,
            current_user=current_user,
            db=db
        )

        liabilities = await get_liability(
            date=date_str,
            current_user=current_user,
            db=db
        )

        total_assets = sum(
            a.value for a in assets
        )

        total_liabilities = sum(
            l.value for l in liabilities
        )

        trend.append({

            "date": date_str,

            "net_worth":
                total_assets
                - total_liabilities
        })

    return trend


#################################
###### CATEGORY BREAKDOWN #######
#################################

@router.get("/dashboard/category-breakdown")
async def category_breakdown(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.amount < 0
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    category_map = {}

    for tx in transactions:

        category = (
            tx.category
            or "Uncategorized"
        )

        if category not in category_map:
            category_map[category] = 0

        category_map[category] += abs(
            tx.amount or 0
        )

    return {

        "categories": [

            {
                "category": k,

                "amount":
                    round(v, 2)
            }

            for k, v
            in sorted(

                category_map.items(),

                key=lambda x: x[1],

                reverse=True
            )
        ]
    }


#################################
######## MONTHLY CASHFLOW #######
#################################

@router.get("/dashboard/monthly-cashflow")
async def monthly_cashflow(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    if not transactions:

        return {

            "income": 0,

            "expenses": 0,

            "surplus": 0,
        }

    monthly = {}

    for tx in transactions:

        month = tx.recorded_at.strftime(
            "%Y-%m"
        )

        if month not in monthly:

            monthly[month] = {

                "income": 0,

                "expenses": 0,
            }

        amount = tx.amount or 0

        if amount > 0:

            monthly[month]["income"] += amount

        elif amount < 0:

            monthly[month]["expenses"] += abs(
                amount
            )

    month_count = max(
        len(monthly),
        1
    )

    total_income = sum(
        m["income"]
        for m in monthly.values()
    )

    total_expenses = sum(
        m["expenses"]
        for m in monthly.values()
    )

    avg_income = (
        total_income / month_count
    )

    avg_expenses = (
        total_expenses / month_count
    )

    avg_surplus = (
        avg_income - avg_expenses
    )

    return {

        "income":
            round(avg_income, 2),

        "expenses":
            round(avg_expenses, 2),

        "surplus":
            round(avg_surplus, 2),
    }


#################################
######## MONTHLY EXPENSES #######
#################################

@router.get("/dashboard/monthly-expense-trend")
async def monthly_expense_trend(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.amount < 0
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    monthly = {}

    for tx in transactions:

        month = tx.recorded_at.strftime(
            "%Y-%m"
        )

        if month not in monthly:
            monthly[month] = 0

        monthly[month] += abs(
            tx.amount or 0
        )

    trend = []

    for month in sorted(
        monthly.keys()
    ):

        trend.append({

            "month": month,

            "amount":
                round(
                    monthly[month],
                    2
                )
        })

    return {
        "trend": trend
    }


#################################
######## TOP MERCHANTS ##########
#################################

@router.get("/dashboard/top-merchants")
async def top_merchants(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id == current_user.id
        )

        .where(
            BankTransaction.transaction_type == "expense"
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    merchant_map = {}

    for tx in transactions:
        if (
            not tx.merchant
            or tx.merchant.strip() == ""
            or tx.merchant == "-"
        ):
            continue
        merchant = tx.merchant

        if merchant not in merchant_map:
            merchant_map[merchant] = 0

        merchant_map[merchant] += abs(
            tx.amount or 0
        )

    top = sorted(

        merchant_map.items(),

        key=lambda x: x[1],

        reverse=True
    )[:5]

    return {

        "merchants": [

            {
                "merchant": k,

                "amount":
                    round(v, 2)
            }

            for k, v in top
        ]
    }


#################################
######## SPENDING HEALTH ########
#################################

@router.get("/dashboard/spending-health")
async def spending_health(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    total_income = 0
    total_expenses = 0

    for tx in transactions:

        amount = tx.amount or 0

        if amount > 0:

            total_income += amount

        elif amount < 0:

            total_expenses += abs(
                amount
            )

    savings = (
        total_income
        - total_expenses
    )

    savings_ratio = 0

    if total_income > 0:

        savings_ratio = (
            savings / total_income
        ) * 100

    return {

        "income":
            round(total_income, 2),

        "expenses":
            round(total_expenses, 2),

        "savings":
            round(savings, 2),

        "savings_ratio":
            round(savings_ratio, 1),

        "benchmark": {

            "needs": 50,

            "wants": 30,

            "savings": 20,
        }
    }