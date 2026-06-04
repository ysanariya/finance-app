from fastapi import FastAPI
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, transaction, rules, persons, accounts
from dotenv import load_dotenv

from models.user import User
from models.household import Household
from models.household_member import HouseholdMember
from models.person import Person
from models.account import Account
from models.account_owner import AccountOwner
from models.imported_transaction import ImportedTransaction


load_dotenv()
app = FastAPI()


print("RUNNING MAIN FROM:", __file__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


#Routers for all functions

app.include_router(auth.router)
app.include_router(persons.router)
app.include_router(accounts.router)
app.include_router(transaction.router)
app.include_router(rules.router)


