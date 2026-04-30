from fastapi import UploadFile, File, APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from database import get_db
from models.user import User
import models.transaction
from routers.auth import get_current_user
from services.parser import parse_hdfc_txt

router = APIRouter()


@router.post("/transactions/upload")
async def upload_transactions(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id
    content = await file.read()

    result = parse_hdfc_txt(content)
    parsed_transactions = result["transactions"]

    inserted = 0
    duplicates = 0

    # ✅ LOOP MUST BE INSIDE FUNCTION
    for tx in parsed_transactions:
        ref = tx.get("reference_number")

        # 🔹 Case 1: reference number exists → use DB constraint
        if ref:
            try:
                new_tx = models.transaction.BankTransaction(
                    user_id=user_id,
                    description=tx["description"],
                    amount=tx["amount"],
                    category=tx["category"],
                    recorded_at=tx["recorded_at"],
                    reference_number=ref
                )

                db.add(new_tx)
                await db.flush()

                inserted += 1

            except IntegrityError:
                await db.rollback()
                duplicates += 1

        # 🔹 Case 2: fallback dedupe
        else:
            existing = await db.execute(
                select(models.transaction.BankTransaction).where(
                    and_(
                        models.transaction.BankTransaction.user_id == user_id,
                        models.transaction.BankTransaction.recorded_at == tx["recorded_at"],
                        models.transaction.BankTransaction.amount == tx["amount"],
                        models.transaction.BankTransaction.description == tx["description"]
                    )
                )
            )

            if existing.scalar():
                duplicates += 1
                continue

            new_tx = models.transaction.BankTransaction(
                user_id=user_id,
                description=tx["description"],
                amount=tx["amount"],
                category=tx["category"],
                recorded_at=tx["recorded_at"],
                reference_number=None
            )

            db.add(new_tx)
            inserted += 1

    # ✅ COMMIT AFTER LOOP
    await db.commit()

    return {
        "message": "Transactions uploaded successfully",
        "total": result["total"],
        "parsed": result["parsed"],
        "inserted": inserted,
        "duplicates": duplicates,
        "skipped": result["skipped"],
        "sample_errors": result["errors"]
    }


@router.get("/transactions")
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id
    result = await db.execute(
        select(models.transaction.BankTransaction)
        .where(models.transaction.BankTransaction.user_id == user_id)
        .order_by(models.transaction.BankTransaction.recorded_at.desc())
    )

    transactions = result.scalars().all()

    return {
        "count": len(transactions),
        "transactions": transactions
    }