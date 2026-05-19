from fastapi import UploadFile, File, APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_, func


from database import get_db
from models.user import User
import models.transaction
from routers.auth import get_current_user
from services.parser import parse_hdfc_txt
from services.classifier import classify_transaction

router = APIRouter()


#######################################
####### UPLOAD ENDPOINT ###############
#######################################

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
    failed = []
    duplicate_transactions = []

    for tx in parsed_transactions:
        try:
            ref = tx.get("reference_number")

            # fallback duplicate check
            existing = await db.execute(

                select(models.transaction.BankTransaction).where(

                    and_(

                        models.transaction.BankTransaction.user_id == user_id,

                        models.transaction.BankTransaction.recorded_at
                        == tx["recorded_at"],

                        models.transaction.BankTransaction.amount
                        == tx["amount"],

                        models.transaction.BankTransaction.description
                        == tx["description"],
                    )
                )
            )

            if existing.scalar():

                duplicates += 1
                duplicate_transactions.append({
                    "description": tx["description"],
                    "amount": tx["amount"],
                    "recorded_at": str(tx["recorded_at"])
                })
                continue

            classification = await classify_transaction(
                tx["description"],
                tx["amount"],
                db
            )

            new_tx = models.transaction.BankTransaction(

                user_id=user_id,

                description=tx["description"],

                amount=tx["amount"],

                recorded_at=tx["recorded_at"],

                reference_number=ref,

                merchant=classification["merchant"],

                transaction_type=classification["transaction_type"],

                category=classification["category"],

                classification_source=classification["classification_source"],

                matched_rule_id=classification["matched_rule_id"]
            )

            db.add(new_tx)

            await db.commit()

            inserted += 1

        except IntegrityError:

            await db.rollback()

            duplicates += 1

        except Exception as e:

            await db.rollback()

            failed.append({

                "description":
                    tx.get("description"),

                "amount":
                    tx.get("amount"),

                "recorded_at":
                    str(tx.get("recorded_at")),

                "error":
                    str(e)
            })

            print("FAILED TX:", tx)

            print("ERROR:", str(e))

    return {
        "message": "Transactions uploaded successfully",
        "total": result["total"],
        "parsed": result["parsed"],
        "inserted": inserted,
        "duplicates": duplicates,
        "skipped": result["skipped"],
        "sample_errors": result["errors"],
        "failed_inserts": failed[:10],
        "failed_insert_count": len(failed),
        "sample_duplicates": duplicate_transactions[:10]
    }


###############################################
####### GET TRANSACTIONS WITH FILTERS #########
###############################################

@router.get("/transactions")
async def get_transactions(
    page: int = 1,
    limit: int = 50,
    month: str | None = None,
    category: str | None = None,
    merchant: str | None = None,
    transaction_type: str | None = None,
    direction: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    user_id = current_user.id

    filters = [models.transaction.BankTransaction.user_id == user_id]

    if month:
        filters.append(
            func.strftime(
                "%Y-%m", models.transaction.BankTransaction.recorded_at
            ) == month
        )

    if category:
        filters.append(
            models.transaction.BankTransaction.category == category
        )

    if merchant:
        filters.append(
            models.transaction.BankTransaction.merchant == merchant
        )
    
    if transaction_type:
        filters.append(
            models.transaction.BankTransaction.transaction_type == transaction_type
        )

    if direction == "credit":

        filters.append(
            models.transaction.BankTransaction.amount > 0
        )

    elif direction == "debit":

        filters.append(
            models.transaction.BankTransaction.amount < 0
        )

    elif direction == "zero":

        filters.append(
            models.transaction.BankTransaction.amount == 0
        )

    if search:

        filters.append(

            models.transaction.BankTransaction.description.ilike(
                f"%{search}%"
            )
        )



    offset = (page - 1) * limit

    count_result = await db.execute(
        select(func.count())
        .select_from(
            models.transaction.BankTransaction
        )
        .where(and_(*filters))
    )

    total_count = count_result.scalar()

    result = await db.execute(

        select(
            models.transaction.BankTransaction
        )

        .where(and_(*filters))

        .order_by(
            models.transaction.BankTransaction.recorded_at.desc()
        )

        .offset(offset)

        .limit(limit)
    )

    transactions = result.scalars().all()

    return {

        "count": len(transactions),

        "page": page,

        "limit": limit,

        "total": total_count,

        "transactions": [

            {
                "id": tx.id,

                "description":
                    tx.description,

                "amount":
                    tx.amount,

                "recorded_at":
                    tx.recorded_at,

                "merchant":
                    tx.merchant,

                "category":
                    tx.category,

                "transaction_type":
                    tx.transaction_type,
            }

            for tx in transactions
        ]
    }


@router.get("/transactions/unclassified")
async def get_unclassified_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):

    user_id = current_user.id

    result = await db.execute(
        select(models.transaction.BankTransaction)
        .where(
            and_(
                models.transaction.BankTransaction.user_id == user_id,
                models.transaction.BankTransaction.category == None
            )
        )
        .order_by(
            models.transaction.BankTransaction.recorded_at.desc()
        )
    )

    transactions = result.scalars().all()

    return {
        "count": len(transactions),
        "transactions": transactions
    }