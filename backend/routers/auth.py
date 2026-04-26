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

############################
## Registration and login ##
############################

router = APIRouter()

@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
        )

    db.add(new_user)
    await db.commit()
    return {"message": "User created successfully for you"}

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):

    result = await db.execute(
        select(User).where(User.email == user.email)
        )
    db_user = result.scalar_one_or_none()

    if not db_user:
        return {"error": "Invalid email or password"}

    if not verify_password(user.password, db_user.password_hash):
        return {"error": "Invalid email or password"}

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

