import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import AsyncSessionLocal
from models.rule import TransactionRule


RULES = [

    {
        "pattern": "IBM INDIA PRIVATE LIMITED",
        "match_type": "contains",
        "merchant": "IBM",
        "transaction_type": "income",
        "category": "salary",
        "priority": 100
    },

    {
        "pattern": "ZOMATO",
        "match_type": "contains",
        "merchant": "ZOMATO",
        "transaction_type": "expense",
        "category": "food",
        "priority": 90
    },

    {
        "pattern": "INTEREST PAID",
        "match_type": "contains",
        "merchant": "HDFC",
        "transaction_type": "income",
        "category": "interest",
        "priority": 80
    },

    {
        "pattern": "ACH C-",
        "match_type": "contains",
        "merchant": "DIVIDEND",
        "transaction_type": "income",
        "category": "dividend",
        "priority": 70
    }

]


async def seed_rules():

    async with AsyncSessionLocal() as db:

        for rule_data in RULES:

            existing = await db.execute(
                select(TransactionRule).where(
                    TransactionRule.pattern == rule_data["pattern"]
                )
            )

            if existing.scalar():
                print(f"Rule already exists: {rule_data['pattern']}")
                continue

            rule = TransactionRule(**rule_data)

            db.add(rule)

        await db.commit()

        print("Rules seeded successfully")


asyncio.run(seed_rules())