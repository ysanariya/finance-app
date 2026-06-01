from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete, or_
from database import get_db
from routers.auth import get_current_user
from models.user import User
from models.envelope_budget import BudgetGroup, CategoryGroupMapping, BudgetEnvelope
from models.budget_template import BudgetTemplate
from models.transaction import BankTransaction
from pydantic import BaseModel
from datetime import datetime, date
from calendar import monthrange

router = APIRouter()

# Schemas
class AssignBudgetRequest(BaseModel):
    category: str
    year: int
    month: int
    amount: float

class CreateGroupRequest(BaseModel):
    name: str

class MapCategoryRequest(BaseModel):
    category: str
    group_id: int

# Helpers
def get_next_month(year: int, month: int):
    if month == 12:
        return year + 1, 1
    return year, month + 1

def get_prev_month(year: int, month: int):
    if month == 1:
        return year - 1, 12
    return year, month - 1

async def get_all_categories_in_system(user_id: int, db: AsyncSession) -> list[str]:
    # Distinct categories from transactions
    tx_res = await db.execute(
        select(BankTransaction.category)
        .where(BankTransaction.user_id == user_id, BankTransaction.category != None)
        .distinct()
    )
    categories = [row[0] for row in tx_res.all()]
    
    # Distinct categories from budgets
    b_res = await db.execute(
        select(BudgetEnvelope.category)
        .where(BudgetEnvelope.user_id == user_id)
        .distinct()
    )
    for row in b_res.all():
        if row[0] not in categories:
            categories.append(row[0])
            
    # Include Unclassified by default
    if "Unclassified" not in categories:
        categories.append("Unclassified")
        
    return sorted(categories)

# Sheet rollover engine
async def calculate_envelope_sheet(user_id: int, target_year: int, target_month: int, db: AsyncSession):
    categories = await get_all_categories_in_system(user_id, db)
    
    # Fetch all transaction details
    tx_res = await db.execute(
        select(
            BankTransaction.category,
            BankTransaction.transaction_type,
            BankTransaction.amount,
            BankTransaction.recorded_at
        )
        .where(BankTransaction.user_id == user_id, BankTransaction.is_deleted == False)
    )
    all_txs = tx_res.all()
    
    # Fetch all envelope budgets
    b_res = await db.execute(
        select(BudgetEnvelope)
        .where(BudgetEnvelope.user_id == user_id)
    )
    all_budgets = b_res.scalars().all()
    # Fetch budget templates (default per category)
    t_res = await db.execute(
        select(BudgetTemplate).where(BudgetTemplate.user_id == user_id)
    )
    templates = {t.category: t.default_amount for t in t_res.scalars().all()}
    
    # Find start date in history
    min_year, min_month = target_year, target_month
    for _, _, _, recorded_at in all_txs:
        if recorded_at:
            if recorded_at.year < min_year or (recorded_at.year == min_year and recorded_at.month < min_month):
                min_year = recorded_at.year
                min_month = recorded_at.month
                
    for budget in all_budgets:
        if budget.year < min_year or (budget.year == min_year and budget.month < min_month):
            min_year = budget.year
            min_month = budget.month

    # Step through months chronologically to calculate balances & rollover deductions
    category_balances = {cat: 0.0 for cat in categories}
    overspent_deductions_by_month = {} # key: (year, month), val: amount
    
    # Track monthly income and budgeting for To Be Budgeted calculation
    cumulative_income = 0.0
    cumulative_budgeted = 0.0
    cumulative_overspent_deductions = 0.0

    curr_year, curr_month = min_year, min_month
    target_date = (target_year, target_month)
    
    # Store sheets per month so we can return target month
    sheet_data = {}
    
    while (curr_year, curr_month) <= target_date:
        # Get start/end range of month
        # Filter transactions
        month_income = 0.0
        month_activity = {cat: 0.0 for cat in categories}
        
        for cat, tx_type, amount, recorded_at in all_txs:
            if recorded_at and recorded_at.year == curr_year and recorded_at.month == curr_month:
                # Income
                if amount > 0 and tx_type == "income":
                    month_income += amount
                # Expenses
                elif amount < 0 and tx_type in ["expense", "loan repayment", "infer"]:
                    category_name = cat or "Unclassified"
                    if category_name not in month_activity:
                        month_activity[category_name] = 0.0
                    month_activity[category_name] += abs(amount)
                    
        # Filter budgets
        month_budgeted = {cat: 0.0 for cat in categories}
        # Apply month‑specific budgets
        for budget in all_budgets:
            if budget.year == curr_year and budget.month == curr_month:
                month_budgeted[budget.category] = budget.budgeted_amount
        # Fill missing months with template defaults
        for cat in categories:
            if month_budgeted[cat] == 0.0 and cat in templates:
                month_budgeted[cat] = templates[cat]
                
        # Sum monthly values for TBB
        cumulative_income += month_income
        cumulative_budgeted += sum(month_budgeted.values())
        
        # Deduct overspending carried from previous month
        deductions_this_month = overspent_deductions_by_month.get((curr_year, curr_month), 0.0)
        cumulative_overspent_deductions += deductions_this_month
        
        month_sheet = {}
        
        # Calculate new balances
        for cat in categories:
            prev_bal = category_balances[cat]
            budgeted = month_budgeted.get(cat, 0.0)
            activity = month_activity.get(cat, 0.0)
            
            ending_bal = prev_bal + budgeted - activity
            
            month_sheet[cat] = {
                "category": cat,
                "prev_balance": round(prev_bal, 2),
                "budgeted": round(budgeted, 2),
                "activity": round(activity, 2),
                "balance": round(ending_bal, 2)
            }
            
            # Prepare rollover balance for NEXT month (YNAB Style)
            next_y, next_m = get_next_month(curr_year, curr_month)
            if ending_bal < 0:
                # Reset to zero and carry penalty to next month's To Be Budgeted pool
                category_balances[cat] = 0.0
                overspent_deductions_by_month[(next_y, next_m)] = overspent_deductions_by_month.get((next_y, next_m), 0.0) + abs(ending_bal)
            else:
                category_balances[cat] = ending_bal
                
        sheet_data[(curr_year, curr_month)] = {
            "categories": month_sheet,
            "to_be_budgeted": round(cumulative_income - cumulative_budgeted - cumulative_overspent_deductions, 2)
        }
        
        if (curr_year, curr_month) == target_date:
            break
            
        curr_year, curr_month = get_next_month(curr_year, curr_month)
        
    return sheet_data.get((target_year, target_month), {
        "categories": {},
        "to_be_budgeted": 0.0
    })

# Endpoints
@router.get("/budget/envelope/sheet")
async def get_envelope_sheet(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sheet = await calculate_envelope_sheet(current_user.id, year, month, db)
    
    # Retrieve category groups and mappings
    groups_res = await db.execute(
        select(BudgetGroup).where(BudgetGroup.user_id == current_user.id)
    )
    groups = groups_res.scalars().all()
    
    mappings_res = await db.execute(
        select(CategoryGroupMapping).where(CategoryGroupMapping.user_id == current_user.id)
    )
    mappings = {m.category: m.group_id for m in mappings_res.scalars().all()}
    
    # Structure response
    group_list = [
        {"id": g.id, "name": g.name, "categories": []}
        for g in groups
    ]
    # Add an unassigned group for category mapping fallbacks
    unassigned_group = {"id": 0, "name": "Unassigned Categories", "categories": []}
    
    category_sheets = sheet["categories"]
    for cat_name, cat_data in category_sheets.items():
        group_id = mappings.get(cat_name, 0)
        
        found = False
        if group_id != 0:
            for g in group_list:
                if g["id"] == group_id:
                    g["categories"].append(cat_data)
                    found = True
                    break
        if not found:
            unassigned_group["categories"].append(cat_data)
            
    if len(unassigned_group["categories"]) > 0:
        group_list.append(unassigned_group)
        
    return {
        "year": year,
        "month": month,
        "to_be_budgeted": sheet["to_be_budgeted"],
        "groups": group_list
    }

@router.post("/budget/envelope/assign")
async def assign_envelope_budget(
    payload: AssignBudgetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find if existing assignment exists
    res = await db.execute(
        select(BudgetEnvelope)
        .where(
            BudgetEnvelope.user_id == current_user.id,
            BudgetEnvelope.category == payload.category,
            BudgetEnvelope.year == payload.year,
            BudgetEnvelope.month == payload.month
        )
    )
    envelope = res.scalar_one_or_none()
    
    if envelope:
        envelope.budgeted_amount = payload.amount
    else:
        envelope = BudgetEnvelope(
            user_id=current_user.id,
            category=payload.category,
            year=payload.year,
            month=payload.month,
            budgeted_amount=payload.amount
        )
        db.add(envelope)
        
    await db.commit()
    return {"success": True}

@router.post("/budget/envelope/groups")
async def create_budget_group(
    payload: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    group = BudgetGroup(user_id=current_user.id, name=payload.name)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return {"success": True, "group_id": group.id}

@router.post("/budget/envelope/groups/mapping")
async def map_category_to_group(
    payload: MapCategoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if mapping already exists
    res = await db.execute(
        select(CategoryGroupMapping)
        .where(
            CategoryGroupMapping.user_id == current_user.id,
            CategoryGroupMapping.category == payload.category
        )
    )
    mapping = res.scalar_one_or_none()
    
    if mapping:
        mapping.group_id = payload.group_id
    else:
        mapping = CategoryGroupMapping(
            user_id=current_user.id,
            category=payload.category,
            group_id=payload.group_id
        )
        db.add(mapping)
        
    await db.commit()
    return {"success": True}
