from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db

from models.rule import TransactionRule
from models.transaction import BankTransaction
from models.user import User

from routers.auth import get_current_user

from schemas.rule import RuleCreate, RuleUpdate


router = APIRouter()


VALID_MATCH_TYPES = ["contains", "exact"]

VALID_TRANSACTION_TYPES = [
    "income",
    "expense",
    "transfer",
    "investment"
]


@router.post("/rules")
async def create_rule(
    rule: RuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    if rule.match_type not in VALID_MATCH_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid match_type"
        )

    if rule.transaction_type not in VALID_TRANSACTION_TYPES and rule.transaction_type is not None:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction_type"
        )

    normalized_pattern = " ".join(
    rule.pattern.strip().lower().split()
    )

    existing_rule = await db.execute(
    select(TransactionRule).where(
        func.lower(
            TransactionRule.pattern
        ) == normalized_pattern
    )
)

    if existing_rule.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Rule already exists"
        ) 


    new_rule = TransactionRule(
        pattern=normalized_pattern,
        match_type=rule.match_type,
        merchant=rule.merchant,
        transaction_type=rule.transaction_type,
        category=rule.category,
        priority=rule.priority
    )

    db.add(new_rule)

    await db.commit()

    await db.refresh(new_rule)

    return new_rule


@router.get("/rules")
async def get_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(TransactionRule)
        .order_by(TransactionRule.priority.desc())
    )

    rules = result.scalars().all()

    return {
        "count": len(rules),
        "rules": rules
    }


@router.patch("/rules/{rule_id}")
async def update_rule(
    rule_id: int,
    rule_update: RuleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(TransactionRule)
        .where(TransactionRule.id == rule_id)
    )

    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Rule not found"
        )

    update_data = rule_update.dict(exclude_unset=True)

    if "match_type" in update_data:
        if update_data["match_type"] not in VALID_MATCH_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid match_type"
            )

    if "transaction_type" in update_data:
        if update_data["transaction_type"] not in VALID_TRANSACTION_TYPES and update_data["transaction_type"] is not None:
            raise HTTPException(
                status_code=400,
                detail="Invalid transaction_type"
            )

    for key, value in update_data.items():
        setattr(rule, key, value)

    await db.commit()

    await db.refresh(rule)

    return rule

@router.post("/rules/reclassify")
async def reclassify_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    user_id = current_user.id

    # Get all active rules

    rules_result = await db.execute(

        select(TransactionRule)

        .where(
            TransactionRule.is_active == True
        )

        .order_by(
            TransactionRule.priority.desc()
        )
    )

    rules = rules_result.scalars().all()

    # Get all user transactions

    tx_result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id == user_id
        )
    )

    transactions = tx_result.scalars().all()

    updated_count = 0

    for tx in transactions:

        description = (
            tx.description.lower()
        )

        # Default type from amount polarity

        if tx.amount > 0:

            tx.transaction_type = "income"

        else:

            tx.transaction_type = "expense"

        # Reset metadata

        tx.category = None

        tx.merchant = None

        tx.classification_source = (
            "unclassified"
        )

        tx.matched_rule_id = None

        # Apply rules

        for rule in rules:

            pattern = (
                rule.pattern.lower()
            )

            matched = False

            if (
                rule.match_type
                == "contains"
            ):

                matched = (
                    pattern in description
                )

            elif (
                rule.match_type
                == "exact"
            ):

                matched = (
                    pattern == description
                )

            if matched:

                tx.category = (
                    rule.category
                )

                tx.merchant = (
                    rule.merchant
                )

                # Optional override only

                if (
                    rule.transaction_type
                ):

                    tx.transaction_type = (
                        rule.transaction_type
                    )

                tx.classification_source = (
                    "rule"
                )

                tx.matched_rule_id = (
                    rule.id
                )

                updated_count += 1

                break

    await db.commit()

    return {

        "message":
            "Reclassification complete",

        "updated":
            updated_count
    }