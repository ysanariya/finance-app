from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.rule import TransactionRule


def normalize_text(text: str):
    return " ".join(text.lower().strip().split())


async def classify_transaction(
    narration: str,
    db: AsyncSession
):
    normalized = normalize_text(narration)

    result = await db.execute(
        select(TransactionRule)
        .where(TransactionRule.is_active == True)
        .order_by(TransactionRule.priority.desc())
    )

    rules = result.scalars().all()

    for rule in rules:

        pattern = normalize_text(rule.pattern)

        matched = False

        if rule.match_type == "exact":
            matched = normalized == pattern

        elif rule.match_type == "contains":
            matched = pattern in normalized

        if matched:
            return {
                "merchant": rule.merchant,
                "transaction_type": rule.transaction_type,
                "category": rule.category,
                "classification_source": "rule",
                "matched_rule_id": rule.id
            }

    return {
        "merchant": None,
        "transaction_type": None,
        "category": None,
        "classification_source": None,
        "matched_rule_id": None
    }