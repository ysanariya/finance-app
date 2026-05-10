from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import rule
from models.rule import TransactionRule


def normalize_text(text: str):
    return " ".join(text.lower().strip().split())


async def classify_transaction(
    narration: str,
    amount: float,
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
            # infer from amount first

            if amount > 0:
                inferred_type = "income"
            else:
                inferred_type = "expense"

            # optional override from rule

            final_type = (
                rule.transaction_type
                if rule.transaction_type
                else inferred_type
            )

            return {

                "merchant":
                    rule.merchant,

                "category":
                    rule.category,

                "transaction_type":
                    final_type,

                "classification_source":
                    "rule",

                "matched_rule_id":
                    rule.id,
            }

        if amount > 0:
            inferred_type = "income"
        else:
            inferred_type = "expense"

        return {

            "merchant":
                None,

            "category":
                None,

            "transaction_type":
                inferred_type,

            "classification_source":
                "unclassified",

            "matched_rule_id":
                None,
        }