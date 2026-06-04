from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from models.user import User
from models.person import Person
from models.household_member import HouseholdMember

from schemas.person import (
    PersonCreate,
    PersonResponse
)

from routers.auth import get_current_user

router = APIRouter()


@router.post(
    "/persons",
    response_model=PersonResponse
)
async def create_person(
    payload: PersonCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    membership_result = await db.execute(

        select(HouseholdMember)

        .where(
            HouseholdMember.user_id
            == current_user.id
        )
    )

    membership = (
        membership_result.scalar_one_or_none()
    )

    if not membership:

        raise HTTPException(
            status_code=404,
            detail="User is not linked to a household"
        )

    person = Person(

        household_id=membership.household_id,

        name=payload.name.strip()
    )

    db.add(person)

    await db.commit()

    await db.refresh(person)

    return person


@router.get(
    "/persons",
    response_model=list[PersonResponse]
)
async def get_persons(

    current_user: User = Depends(
        get_current_user
    ),

    db: AsyncSession = Depends(
        get_db
    )
):

    membership_result = await db.execute(

        select(HouseholdMember)

        .where(
            HouseholdMember.user_id
            == current_user.id
        )
    )

    membership = (
        membership_result.scalar_one_or_none()
    )

    if not membership:

        raise HTTPException(
            status_code=404,
            detail="User is not linked to a household"
        )

    result = await db.execute(

        select(Person)

        .where(
            Person.household_id
            == membership.household_id
        )

        .where(
            Person.is_active == True
        )

        .order_by(Person.name)
    )

    return result.scalars().all()


@router.get(
    "/persons/{person_id}",
    response_model=PersonResponse
)
async def get_person(

    person_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: AsyncSession = Depends(
        get_db
    )
):

    membership_result = await db.execute(

        select(HouseholdMember)

        .where(
            HouseholdMember.user_id
            == current_user.id
        )
    )

    membership = (
        membership_result.scalar_one_or_none()
    )

    if not membership:

        raise HTTPException(
            status_code=404,
            detail="User is not linked to a household"
        )

    result = await db.execute(

        select(Person)

        .where(
            Person.id == person_id
        )

        .where(
            Person.household_id
            == membership.household_id
        )

        .where(
            Person.is_active == True
        )
    )

    person = (
        result.scalar_one_or_none()
    )

    if not person:

        raise HTTPException(
            status_code=404,
            detail="Person not found"
        )

    return person


@router.delete(
    "/persons/{person_id}"
)
async def delete_person(

    person_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: AsyncSession = Depends(
        get_db
    )
):

    membership_result = await db.execute(

        select(HouseholdMember)

        .where(
            HouseholdMember.user_id
            == current_user.id
        )
    )

    membership = (
        membership_result.scalar_one_or_none()
    )

    if not membership:

        raise HTTPException(
            status_code=404,
            detail="User is not linked to a household"
        )

    result = await db.execute(

        select(Person)

        .where(
            Person.id == person_id
        )

        .where(
            Person.household_id
            == membership.household_id
        )
    )

    person = (
        result.scalar_one_or_none()
    )

    if not person:

        raise HTTPException(
            status_code=404,
            detail="Person not found"
        )

    person.is_active = False

    await db.commit()

    return {
        "message": "Person deleted"
    }