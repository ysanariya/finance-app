from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from database import get_db
from models.fixed_expense import FixedExpense
from models.user import User
from schemas.fixed_expense import FixedExpenseCreate
from routers.auth import get_current_user

router = APIRouter()

@router.post("/fixed-expense")
async def create_fixed_expense(
    expense: FixedExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_expense = FixedExpense(
        user_id=current_user.id,
        name=expense.name,
        category=expense.category,
        amount=expense.amount,
        start_date=expense.start_date,
        end_date=expense.end_date
    )

    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    return new_expense


@router.get("/fixed-expense")
async def get_fixed_expense(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FixedExpense).where(
            FixedExpense.user_id == current_user.id,
            FixedExpense.is_deleted == False
        )
    )

    return result.scalars().all()
