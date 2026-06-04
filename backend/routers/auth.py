from fastapi import APIRouter
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, get_db
from models.user import User
from datetime import datetime, time, timezone, timedelta
from schemas.user import UserCreate, UserLogin
from services.auth_service import hash_password, verify_password, create_access_token, verify_token
from sqlalchemy import select, func, and_
from sqlalchemy.orm import aliased
from models.household import Household
from models.household_member import HouseholdMember

############################
## Registration and login ##
############################

router = APIRouter()

@router.post("/register")
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):

    existing = await db.execute(
        select(User).where(
            User.email == user.email
        )
    )

    if existing.scalar_one_or_none():

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(

        email=user.email,

        password_hash=hash_password(
            user.password
        )
    )

    db.add(new_user)

    await db.flush()

    household_name = (
        user.email.split("@")[0]
        .replace(".", " ")
        .title()
        + " Household"
    )

    household = Household(

        name=household_name,

        base_currency="INR"
    )

    db.add(household)

    await db.flush()

    membership = HouseholdMember(

        household_id=household.id,

        user_id=new_user.id,

        role="OWNER"
    )

    db.add(membership)

    await db.commit()

    return {

        "message":
            "User created successfully",

        "household_id":
            household.id
    }

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):

    result = await db.execute(
        select(User).where(User.email == user.email)
        )
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.email}
        )
    return {
        "access_token": access_token,
        "token_type": "bearer"
        }


security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("sub")

    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(
        select(User).where(User.email == email)
        )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
        }

