import asyncio

from sqlalchemy import select

from database import AsyncSessionLocal as SessionLocal

from models.rule import TransactionRule


RULES = [

    {
        "pattern": "IBM INDIA PRIVATE LIMITED",
        "merchant": "IBM",
        "category": "Salary",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "ZOMATO",
        "merchant": "ZOMATO",
        "category": "Food",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "BLINKIT",
        "merchant": "BLINKIT",
        "category": "Groceries",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "Netflix",
        "merchant": "NETFLIX",
        "category": "Subscription",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "INTEREST PAID",
        "merchant": "HDFC",
        "category": "Interest",
        "transaction_type": None,
        "priority": 80,
    },

    {
        "pattern": "ACH C-",
        "merchant": "DIVIDEND",
        "category": "Dividend",
        "transaction_type": None,
        "priority": 70,
    },

    {
        "pattern": "indigo",
        "merchant": "INDIGO",
        "category": "Travel",
        "transaction_type": None,
        "priority": 50,
    },

    {
        "pattern": "vodafone idea",
        "merchant": "Vodafone",
        "category": "Bills",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "niva bupa",
        "merchant": "Niva Bupa Health Insurance",
        "category": "Insurance",
        "transaction_type": None,
        "priority": 110,
    },

    {
        "pattern": "518159xxxxxx9947",
        "merchant": "HDFC",
        "category": "Credit Card",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "icici bank credit ca",
        "merchant": "ICICI",
        "category": "Credit Card",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "hcg medisurge hospit",
        "merchant": "HCG Aastha Cancer Center",
        "category": "Hospital",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "sai abhay petroleum",
        "merchant": "Sai Abhay Petroleum",
        "category": "Fuel",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "skanda cafe",
        "merchant": "Skanda Cafe",
        "category": "Food",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "mumbai 99 variety",
        "merchant": "Mumbai 99 Variety Dosa",
        "category": "Food",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "zepto",
        "merchant": "Zepto",
        "category": "Groceries",
        "transaction_type": None,
        "priority": 100,
    },

    {
        "pattern": "mcdonalds hardcastle",
        "merchant": "McDonalds",
        "category": "Food",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "midland supermart",
        "merchant": "Midland",
        "category": "Groceries",
        "transaction_type": None,
        "priority": 90,
    },

    {
        "pattern": "upi-xxxxxxxxxxx5078",
        "merchant": "Bala Natarajan",
        "category": "Rent",
        "transaction_type": None,
        "priority": 80,
    },

    {
        "pattern": "hospital",
        "merchant": "Hospital",
        "category": "Hospital",
        "transaction_type": None,
        "priority": 50,
    },

    {
        "pattern": "divya ben n merja",
        "merchant": "DIVYA",
        "category": "Self",
        "transaction_type": "transfer",
        "priority": 100,
    },

    {
        "pattern": "yashkumar maheshbhai sanariya",
        "merchant": "Yashkumar",
        "category": "Self",
        "transaction_type": "transfer",
        "priority": 100,
    },

    {
        "pattern": "maheshkumarkaramshib",
        "merchant": "M K Sanariya",
        "category": "Self",
        "transaction_type": "transfer",
        "priority": 90,
    },
]


async def main():

    async with SessionLocal() as db:

        for rule_data in RULES:

            existing = await db.execute(

                select(TransactionRule).where(

                    TransactionRule.pattern
                    == rule_data["pattern"]
                )
            )

            if existing.scalar():

                continue

            rule = TransactionRule(

                pattern=rule_data["pattern"],

                merchant=rule_data["merchant"],

                category=rule_data["category"],

                transaction_type=rule_data["transaction_type"],

                match_type="contains",

                priority=rule_data["priority"],

                is_active=True,
            )

            db.add(rule)

        await db.commit()

        print("Seeded rules successfully")


asyncio.run(main())