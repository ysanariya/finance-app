from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, get_db
from models.user import User
from datetime import datetime, time, timezone, timedelta
from models.liability import Liability
from schemas.liability import LiabilityCreate
from sqlalchemy import select, func, and_
from sqlalchemy.orm import aliased
from routers.auth import get_current_user

router = APIRouter()

##################################################################
####  These block is for creating and displaying liabilities  ####
##################################################################

@router.post("/liability")
async def create_liability(
    liability: LiabilityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recorded_at = liability.recorded_at

    recorded_at = datetime.combine(
        recorded_at,
        time(23, 59, 59),
        tzinfo=timezone.utc
    )
    
    
    new_liability = Liability(
        user_id=current_user.id,
        name=liability.name.strip().lower(),
        category=liability.category,
        value=liability.value,
        notes=liability.notes,
        recorded_at=recorded_at
    )

    db.add(new_liability)
    await db.commit()

    return {"message": "Liability created"}

@router.get("/liability")
async def get_liability(
    date: str | None = Query(None), 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    LiabilityAlias = aliased(Liability)

    target_date = None

    if date:
        d = datetime.strptime(date, "%Y-%m-%d").date()
        target_date = datetime.combine(
            d,
            time(23, 59, 59),
            tzinfo=timezone.utc
        )


    filters = [
        LiabilityAlias.user_id == current_user.id,
        LiabilityAlias.is_deleted == False
    ]

    if target_date:
        filters.append(LiabilityAlias.recorded_at <= target_date)

    subq = (
        select(
            LiabilityAlias.name,
            func.max(LiabilityAlias.recorded_at).label("max_date")
        )
        .where(*filters)
        .group_by(LiabilityAlias.name)
        .subquery()
    )

    result = await db.execute(
        select(Liability)
        .join(
            subq,
            and_(
                Liability.name == subq.c.name,
                Liability.recorded_at == subq.c.max_date
            )
        )
        .where(
            Liability.user_id == current_user.id,
            Liability.is_deleted == False
        )
        .order_by(Liability.id.desc())
    )

    liabilities = result.scalars().all()

    seen = set()
    unique_liabilities = []

    for liability in liabilities:
        if liability.name not in seen:
            unique_liabilities.append(liability)
            seen.add(liability.name)

    return unique_liabilities
