from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_, delete
from database import get_db
from routers.auth import get_current_user
from models.user import User
from models.dashboard_config import DashboardConfig, WidgetConfig
from models.transaction import BankTransaction
from pydantic import BaseModel
import json
from datetime import datetime
from services.date_utils import resolve_date_range

router = APIRouter()

# Schemas
class WidgetSchema(BaseModel):
    id: int | None = None
    title: str
    type: str
    data_source: str
    query_config: str
    layout_x: int = 0
    layout_y: int = 0
    layout_w: int = 6
    layout_h: int = 4

class DashboardCreateRequest(BaseModel):
    name: str
    is_default: bool = False
    widgets: list[WidgetSchema] = []

class ReportQueryRequest(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    transaction_type: str | None = None  # "expense" | "income" | "all"
    categories: list[str] | None = None
    split_by: str | None = None          # "category" | "merchant" | "month" | "type"
    sort_by: str | None = "amount"        # "amount" | "date"
    sort_order: str | None = "desc"      # "asc" | "desc"

# Endpoints
@router.get("/custom-dashboards")
async def get_dashboards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DashboardConfig)
        .where(DashboardConfig.user_id == current_user.id)
        .order_by(DashboardConfig.is_default.desc(), DashboardConfig.created_at.desc())
    )
    dashboards = result.scalars().all()
    
    response = []
    for d in dashboards:
        widgets_res = await db.execute(
            select(WidgetConfig).where(WidgetConfig.dashboard_id == d.id)
        )
        widgets = widgets_res.scalars().all()
        response.append({
            "id": d.id,
            "name": d.name,
            "is_default": d.is_default,
            "widgets": [
                {
                    "id": w.id,
                    "title": w.title,
                    "type": w.type,
                    "data_source": w.data_source,
                    "query_config": w.query_config,
                    "layout_x": w.layout_x,
                    "layout_y": w.layout_y,
                    "layout_w": w.layout_w,
                    "layout_h": w.layout_h
                }
                for w in widgets
            ]
        })
    return response

@router.get("/custom-dashboards/{dashboard_id}")
async def get_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DashboardConfig)
        .where(DashboardConfig.id == dashboard_id, DashboardConfig.user_id == current_user.id)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    widgets_res = await db.execute(
        select(WidgetConfig).where(WidgetConfig.dashboard_id == d.id)
    )
    widgets = widgets_res.scalars().all()
    return {
        "id": d.id,
        "name": d.name,
        "is_default": d.is_default,
        "widgets": [
            {
                "id": w.id,
                "title": w.title,
                "type": w.type,
                "data_source": w.data_source,
                "query_config": w.query_config,
                "layout_x": w.layout_x,
                "layout_y": w.layout_y,
                "layout_w": w.layout_w,
                "layout_h": w.layout_h
            }
            for w in widgets
        ]
    }

@router.post("/custom-dashboards")
async def create_or_update_dashboard(
    payload: DashboardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find if default dashboard is being created
    if payload.is_default:
        # unset previous default
        await db.execute(
            select(DashboardConfig)
            .where(DashboardConfig.user_id == current_user.id, DashboardConfig.is_default == True)
        )
        # We will update them later
    
    # We will search for a dashboard with the same name, if exists update, else create
    result = await db.execute(
        select(DashboardConfig)
        .where(DashboardConfig.user_id == current_user.id, DashboardConfig.name == payload.name)
    )
    d = result.scalar_one_or_none()
    
    if payload.is_default:
        # Update other dashboards to non-default
        existing_defaults = await db.execute(
            select(DashboardConfig)
            .where(DashboardConfig.user_id == current_user.id, DashboardConfig.is_default == True)
        )
        for old_d in existing_defaults.scalars().all():
            old_d.is_default = False
            
    if not d:
        d = DashboardConfig(
            user_id=current_user.id,
            name=payload.name,
            is_default=payload.is_default
        )
        db.add(d)
        await db.commit()
        await db.refresh(d)
    else:
        d.is_default = payload.is_default
        d.updated_at = datetime.utcnow()
        await db.commit()

    # Sync widgets (delete existing ones for this dashboard and recreate)
    await db.execute(
        delete(WidgetConfig).where(WidgetConfig.dashboard_id == d.id)
    )
    
    for w in payload.widgets:
        new_w = WidgetConfig(
            dashboard_id=d.id,
            title=w.title,
            type=w.type,
            data_source=w.data_source,
            query_config=w.query_config,
            layout_x=w.layout_x,
            layout_y=w.layout_y,
            layout_w=w.layout_w,
            layout_h=w.layout_h
        )
        db.add(new_w)
        
    await db.commit()
    
    return {"success": True, "dashboard_id": d.id}

@router.delete("/custom-dashboards/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DashboardConfig)
        .where(DashboardConfig.id == dashboard_id, DashboardConfig.user_id == current_user.id)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    await db.delete(d)
    await db.commit()
    return {"success": True}

@router.post("/reports/query")
async def execute_report_query(
    payload: ReportQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    start, end = resolve_date_range(payload.start_date, payload.end_date)
    
    filters = [
        BankTransaction.user_id == current_user.id,
        BankTransaction.is_deleted == False,
        BankTransaction.recorded_at >= start,
        BankTransaction.recorded_at <= end
    ]
    
    # Filter by transaction type
    if payload.transaction_type == "expense":
        filters.append(
            and_(
                BankTransaction.amount < 0,
                BankTransaction.transaction_type.in_(["expense", "loan repayment", "infer"])
            )
        )
    elif payload.transaction_type == "income":
        filters.append(
            and_(
                BankTransaction.amount > 0,
                BankTransaction.transaction_type.in_(["income", "infer"])
            )
        )
        
    # Category filter
    if payload.categories and len(payload.categories) > 0:
        filters.append(BankTransaction.category.in_(payload.categories))
        
    # Determine the select and group statement based on split_by
    if payload.split_by == "category":
        select_field = BankTransaction.category
        group_field = BankTransaction.category
    elif payload.split_by == "merchant":
        select_field = BankTransaction.merchant
        group_field = BankTransaction.merchant
    elif payload.split_by == "month":
        select_field = func.strftime("%Y-%m", BankTransaction.recorded_at)
        group_field = func.strftime("%Y-%m", BankTransaction.recorded_at)
    elif payload.split_by == "type":
        select_field = BankTransaction.transaction_type
        group_field = BankTransaction.transaction_type
    else:
        # Default: list raw transactions
        query = (
            select(BankTransaction)
            .where(and_(*filters))
            .order_by(BankTransaction.recorded_at.desc())
        )
        res = await db.execute(query)
        txs = res.scalars().all()
        return {
            "type": "raw_transactions",
            "data": [
                {
                    "id": tx.id,
                    "date": tx.recorded_at.strftime("%Y-%m-%d"),
                    "description": tx.description,
                    "amount": tx.amount,
                    "merchant": tx.merchant,
                    "category": tx.category,
                    "transaction_type": tx.transaction_type
                }
                for tx in txs
            ]
        }
        
    # Aggregate Query
    query = (
        select(select_field, func.sum(func.abs(BankTransaction.amount)))
        .where(and_(*filters))
        .group_by(group_field)
    )
    
    # Executing the aggregate
    res = await db.execute(query)
    rows = res.all()
    
    # Process rows
    data = []
    for label, val in rows:
        if not label or label == "-":
            label = "Unspecified"
        data.append({
            "label": label,
            "value": round(val, 2)
        })
        
    # Sorting
    if payload.split_by == "month":
        data.sort(key=lambda x: x["label"], reverse=(payload.sort_order == "desc"))
    else:
        # Label/date sorting
        data.sort(key=lambda x: x["value"], reverse=(payload.sort_order == "desc"))
        
    return {
        "type": "aggregated",
        "split_by": payload.split_by,
        "data": data
    }
