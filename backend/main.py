from fastapi import FastAPI
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from routers import assets, auth, liabilities, dashboard, income, fixed_expense
from dotenv import load_dotenv


load_dotenv()
app = FastAPI()


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
app.include_router(assets.router)
app.include_router(liabilities.router)
app.include_router(income.router)
app.include_router(fixed_expense.router)
app.include_router(dashboard.router)

