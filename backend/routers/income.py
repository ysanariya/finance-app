from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, time, timezone

from database import get_db
from models.income import Income
from models.user import User
from schemas.income import IncomeCreate
from routers.auth import get_current_user

router = APIRouter()

@router.post("/income")
async def create_income(
    income: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_income = Income(
        user_id=current_user.id,
        source=income.source,
        amount=income.amount,
        recorded_at=income.recorded_at
    )

    db.add(new_income)
    await db.commit()
    await db.refresh(new_income)

    return new_income


@router.get("/income")
async def get_income(
    date: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_date = None

    if date:
        d = datetime.strptime(date, "%Y-%m-%d").date()
        target_date = datetime.combine(d, time(23,59,59), tzinfo=timezone.utc)

    query = select(Income).where(
        Income.user_id == current_user.id,
        Income.is_deleted == False
    )

    if target_date:
        query = query.where(Income.recorded_at <= target_date)

    result = await db.execute(query)

    return result.scalars().all()
