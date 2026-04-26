from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, get_db
from models.user import User
from datetime import datetime, time, timezone, timedelta
from models.asset import Asset
from schemas.asset import AssetCreate
from sqlalchemy import select, func, and_
from sqlalchemy.orm import aliased
from routers.auth import get_current_user

router = APIRouter()



@router.post("/assets")
async def create_asset(
    asset: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    recorded_at = asset.recorded_at
    
    recorded_at = datetime.combine(
        recorded_at,
        time(23, 59, 59),
        tzinfo=timezone.utc
    )
    
    new_asset = Asset(
        user_id=current_user.id,
        name=asset.name.strip().lower(),
        category=asset.category,
        value=asset.value,
        notes=asset.notes,
        recorded_at=recorded_at
    )

    db.add(new_asset)
    await db.commit()

    return {"message": "Asset created"}

@router.get("/assets")
async def get_assets(
    date: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    AssetAlias = aliased(Asset)

    target_date = None

    if date:
        d = datetime.strptime(date, "%Y-%m-%d").date()
        target_date = datetime.combine(
            d,
            time(23, 59, 59),
            tzinfo=timezone.utc
        )

    filters = [
        AssetAlias.user_id == current_user.id,
        AssetAlias.is_deleted == False
    ]

    if target_date:
        filters.append(AssetAlias.recorded_at <= target_date)

    subq = (
        select(
            AssetAlias.name,
            func.max(AssetAlias.recorded_at).label("max_date")
        )
        .where(*filters)
        .group_by(AssetAlias.name)
        .subquery()
    )

    result = await db.execute(
        select(Asset)
        .join(
            subq,
            and_(
                Asset.name == subq.c.name,
                Asset.recorded_at == subq.c.max_date
            )
        )
        .where(
            Asset.user_id == current_user.id,
            Asset.is_deleted == False
        )
        .order_by(Asset.id.desc())
    )

    assets = result.scalars().all()

    seen = set()
    unique_assets = []

    for asset in assets:
        if asset.name not in seen:
            unique_assets.append(asset)
            seen.add(asset.name)

    return unique_assets
