from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from models.user import User
from models.person import Person
from models.account import Account
from models.account_owner import AccountOwner
from models.household_member import HouseholdMember

from schemas.account import (
    AccountCreate,
    AccountResponse
)

from routers.auth import get_current_user

router = APIRouter()

############# DETAILED ACCOUNT VIEW WITH OWNER INFO #############

@router.get("/accounts/detailed")
async def get_accounts_detailed(

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

        select(
            Account,
            Person,
            AccountOwner
        )

        .join(
            AccountOwner,
            AccountOwner.account_id == Account.id
        )

        .join(
            Person,
            Person.id == AccountOwner.person_id
        )

        .where(
            Account.household_id
            == membership.household_id
        )

        .where(
            Account.is_active == True
        )

        .where(
            Person.is_active == True
        )

        .order_by(
            Person.name,
            Account.name
        )
    )

    rows = result.all()

    return [

        {
            "id":
                account.id,

            "name":
                account.name,

            "institution":
                account.institution,

            "account_number_last4":
                account.account_number_last4,

            "account_role":
                account.account_role,

            "account_type":
                account.account_type,

            "currency":
                account.currency,

            "owner":
                person.name,

            "ownership_pct":
                owner.ownership_pct,

            "notes":
                account.notes
        }

        for (
            account,
            person,
            owner
        ) in rows
    ]

#### END DETAILED ACCOUNT VIEW WITH OWNER INFO #############


#### CREATE, GET, DELETE ACCOUNT ENDPOINTS #############


@router.post(
    "/accounts",
    response_model=AccountResponse
)
async def create_account(

    payload: AccountCreate,

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

    person_result = await db.execute(

        select(Person)

        .where(
            Person.id == payload.person_id
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
        person_result.scalar_one_or_none()
    )

    if not person:

        raise HTTPException(
            status_code=404,
            detail="Person not found"
        )

    account = Account(

        household_id=membership.household_id,

        name=payload.name.strip(),

        institution=payload.institution,

        account_number_last4=payload.account_number_last4,

        account_role=payload.account_role.upper(),

        account_type=payload.account_type.upper(),

        notes=payload.notes
    )

    db.add(account)

    await db.flush()

    owner = AccountOwner(

        account_id=account.id,

        person_id=person.id,

        ownership_pct=100.0
    )

    db.add(owner)

    await db.commit()

    await db.refresh(account)

    return account


@router.get(
    "/accounts",
    response_model=list[AccountResponse]
)
async def get_accounts(

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

        select(Account)

        .where(
            Account.household_id
            == membership.household_id
        )

        .where(
            Account.is_active == True
        )

        .order_by(Account.name)
    )

    return result.scalars().all()


@router.get(
    "/accounts/{account_id}",
    response_model=AccountResponse
)
async def get_account(

    account_id: int,

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

        select(Account)

        .where(
            Account.id == account_id
        )

        .where(
            Account.household_id
            == membership.household_id
        )

        .where(
            Account.is_active == True
        )
    )

    account = (
        result.scalar_one_or_none()
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    return account


@router.delete(
    "/accounts/{account_id}"
)
async def delete_account(

    account_id: int,

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

        select(Account)

        .where(
            Account.id == account_id
        )

        .where(
            Account.household_id
            == membership.household_id
        )
    )

    account = (
        result.scalar_one_or_none()
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    account.is_active = False

    await db.commit()

    return {
        "message": "Account deleted"
    }

#### CREATE, GET, DELETE ACCOUNT ENDPOINTS END HERE. #############

