from fastapi import APIRouter, Depends, Query
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, get_db
from models.user import User
from datetime import datetime, time, timezone, timedelta
from models.asset import Asset
from models.liability import Liability
from schemas.liability import LiabilityCreate
from schemas.asset import AssetCreate
from schemas.user import UserCreate, UserLogin
from sqlalchemy import select, func, and_
from sqlalchemy.orm import aliased
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import get_current_user
from routers.assets import get_assets
from routers.liabilities import get_liability
from models.income import Income
from models.fixed_expense import FixedExpense



def get_month_range(year: int, month: int):
    start = datetime(year, month, 1, tzinfo=timezone.utc)

    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    return start, end


def next_month(year: int, month: int):
    if month == 12:
        return year + 1, 1
    return year, month + 1





router = APIRouter()


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
    total_assets = sum(a.value for a in assets)

    liabilities = await get_liability(
        date=date,
        current_user=current_user,
        db=db
    )
    total_liabilities = sum(l.value for l in liabilities)

    return {
        "net_worth": total_assets - total_liabilities,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities
    }


#################################
#######  ASSET BREAKDOWN ########
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

    result = [
        {"category": k, "total": v}
        for k, v in category_map.items()
    ]

    return result

######################################
#########   NET WORTH TREND  #########
######################################

@router.get("/dashboard/trend")
async def net_worth_trend(
    start: str | None = Query(None),
    end: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    
    asset_dates_result = await db.execute(
        select(Asset.recorded_at).where(
            Asset.user_id == current_user.id,
            Asset.is_deleted == False
        )
    )

    liability_dates_result = await db.execute(
        select(Liability.recorded_at).where(
            Liability.user_id == current_user.id,
            Liability.is_deleted == False
        )
    )

    asset_dates = [row[0] for row in asset_dates_result.all()]
    liability_dates = [row[0] for row in liability_dates_result.all()]

    all_dates = sorted(set(asset_dates + liability_dates))

    if not all_dates:
        return []

    if start:
        start_dt = datetime.strptime(start, "%Y-%m-%d")
        all_dates = [d for d in all_dates if d >= start_dt]

    if end:
        end_dt = datetime.strptime(end, "%Y-%m-%d")
        all_dates = [d for d in all_dates if d <= end_dt]

    trend = []

    for dt in all_dates:
        date_str = dt.strftime("%Y-%m-%d")

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

        total_assets = sum(a.value for a in assets)
        total_liabilities = sum(l.value for l in liabilities)

        trend.append({
            "date": date_str,
            "net_worth": total_assets - total_liabilities
        })

    return trend


#########################
##### CASHFLOW   ########
#########################



@router.get("/dashboard/cashflow")
async def get_cashflow(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    start, end = get_month_range(year, month)

    income_result = await db.execute(
        select(func.sum(Income.amount)).where(
            Income.user_id == current_user.id,
            Income.is_deleted == False,
            Income.recorded_at >= start,
            Income.recorded_at < end
        )
    )
    total_income = income_result.scalar() or 0

    expense_result = await db.execute(
        select(FixedExpense).where(
            FixedExpense.user_id == current_user.id,
            FixedExpense.is_deleted == False,
            FixedExpense.start_date <= end,
            (FixedExpense.end_date == None) | (FixedExpense.end_date >= start)
        )
    )

    fixed_expenses = expense_result.scalars().all()

    total_fixed = sum(e.amount for e in fixed_expenses)

    surplus = total_income - total_fixed

    savings_rate = (surplus / total_income * 100) if total_income > 0 else 0

    return {
        "month": f"{year}-{str(month).zfill(2)}",
        "income": total_income,
        "fixed_expenses": total_fixed,
        "surplus": surplus,
        "savings_rate": round(savings_rate, 2)
    }

##############################
#####  CASHFLOW TREND   ######
##############################

@router.get("/dashboard/cashflow-trend")
async def cashflow_trend(
    start_year: int = Query(...),
    start_month: int = Query(...),
    end_year: int = Query(...),
    end_month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    results = []

    year, month = start_year, start_month

    while (year < end_year) or (year == end_year and month <= end_month):
        start, end = get_month_range(year, month)


        income_result = await db.execute(
            select(func.sum(Income.amount)).where(
                Income.user_id == current_user.id,
                Income.is_deleted == False,
                Income.recorded_at >= start,
                Income.recorded_at < end
            )
        )
        total_income = income_result.scalar() or 0


        expense_result = await db.execute(
            select(FixedExpense).where(
                FixedExpense.user_id == current_user.id,
                FixedExpense.is_deleted == False,
                FixedExpense.start_date <= end,
                (FixedExpense.end_date == None) | (FixedExpense.end_date >= start)
            )
        )
        fixed_expenses = expense_result.scalars().all()
        total_fixed = sum(e.amount for e in fixed_expenses)

        
        surplus = total_income - total_fixed

        results.append({
            "month": f"{year}-{str(month).zfill(2)}",
            "income": total_income,
            "fixed_expenses": total_fixed,
            "surplus": surplus
        })

        year, month = next_month(year, month)

    return results

