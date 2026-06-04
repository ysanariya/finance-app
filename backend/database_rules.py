# database_rules.py

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import declarative_base

RULES_DATABASE_URL = "sqlite+aiosqlite:///./rules.db"

rules_engine = create_async_engine(
    RULES_DATABASE_URL,
    echo=False
)

RulesSessionLocal = async_sessionmaker(
    bind=rules_engine,
    expire_on_commit=False
)

RulesBase = declarative_base()

print("RULES DB =", RULES_DATABASE_URL)

async def get_rules_db():
    async with RulesSessionLocal() as session:
        yield session