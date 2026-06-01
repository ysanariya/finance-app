from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from database import get_db
from routers.auth import get_current_user
from models.user import User
from models.budget_template import BudgetTemplate
from pydantic import BaseModel

router = APIRouter()

class TemplateCreate(BaseModel):
    category: str
    default_amount: float

class TemplateUpdate(BaseModel):
    id: int
    default_amount: float

@router.get("/budget/templates")
async def get_templates(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BudgetTemplate).where(BudgetTemplate.user_id == current_user.id))
    templates = res.scalars().all()
    return [{"id": t.id, "category": t.category, "default_amount": t.default_amount} for t in templates]

@router.post("/budget/templates")
async def create_template(payload: TemplateCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Ensure unique per category
    existing = await db.execute(select(BudgetTemplate).where(BudgetTemplate.user_id == current_user.id, BudgetTemplate.category == payload.category))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Template for this category already exists")
    tmpl = BudgetTemplate(user_id=current_user.id, category=payload.category, default_amount=payload.default_amount)
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return {"id": tmpl.id, "category": tmpl.category, "default_amount": tmpl.default_amount}

@router.put("/budget/templates/{template_id}")
async def update_template(template_id: int, payload: TemplateUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BudgetTemplate).where(BudgetTemplate.id == template_id, BudgetTemplate.user_id == current_user.id))
    tmpl = res.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    tmpl.default_amount = payload.default_amount
    await db.commit()
    return {"success": True}

@router.delete("/budget/templates/{template_id}")
async def delete_template(template_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BudgetTemplate).where(BudgetTemplate.id == template_id, BudgetTemplate.user_id == current_user.id))
    tmpl = res.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.execute(delete(BudgetTemplate).where(BudgetTemplate.id == template_id))
    await db.commit()
    return {"success": True}
