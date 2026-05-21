from fastapi import UploadFile, File, APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_, func, or_, case

from datetime import datetime
from models.transaction import BankTransaction
from database import get_db
from models.user import User
import models.transaction
from routers.auth import get_current_user
from services.parser import parse_hdfc_txt
from services.classifier import classify_transaction
from pydantic import BaseModel

router = APIRouter()

class TransactionUpdateRequest(BaseModel):
    category: str | None = None
    merchant: str | None = None
    transaction_type: str | None = None




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
    amount_type: str | None = None,
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

    if amount_type == "positive":

        filters.append(
            models.transaction.BankTransaction.amount > 0
        )

    elif amount_type == "negative":

        filters.append(
            models.transaction.BankTransaction.amount < 0
        )

    elif amount_type == "zero":

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


@router.get("/transactions/review")
async def get_review_transactions(

    page: int = 1,
    limit: int = 50,

    start_date: str | None = None,
    end_date: str | None = None,

    search: str | None = None,
    merchant: str | None = None,

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    query = (

        select(models.transaction.BankTransaction)

        .where(
            models.transaction.BankTransaction.user_id == current_user.id
        )

        .where(
            models.transaction.BankTransaction.is_deleted == False
        )

        .where(

            or_(

                models.transaction.BankTransaction.category == "Unclassified",

                models.transaction.BankTransaction.merchant == "-",

                models.transaction.BankTransaction.merchant == None,

                models.transaction.BankTransaction.classification_source == "infer"
            )
        )
    )

    # DATE FILTERS

    if start_date:

        try:

            start = datetime.strptime(
                start_date,
                "%Y-%m-%d"
            )

            query = query.where(
                models.transaction.BankTransaction.recorded_at >= start
            )

        except Exception:
            pass

    if end_date:

        try:

            end = datetime.strptime(
                end_date,
                "%Y-%m-%d"
            )

            query = query.where(
                BankTransaction.recorded_at <= end
            )

        except Exception:
            pass

    # SEARCH

    if search:

        query = query.where(

            or_(

                BankTransaction.description.ilike(
                    f"%{search}%"
                ),

                BankTransaction.merchant.ilike(
                    f"%{search}%"
                ),

                BankTransaction.category.ilike(
                    f"%{search}%"
                )
            )
        )

    # MERCHANT FILTER

    if merchant:

        query = query.where(
            BankTransaction.merchant.ilike(
                f"%{merchant}%"
            )
        )

    # TOTAL COUNT

    count_query = (

        select(func.count())

        .select_from(query.subquery())
    )

    total_result = await db.execute(
        count_query
    )

    total = total_result.scalar() or 0

    # PAGINATION

    offset = (page - 1) * limit

    query = (

        query

        .order_by(
            BankTransaction.amount.asc()
        )

        .offset(offset)

        .limit(limit)
    )

    result = await db.execute(query)

    transactions = result.scalars().all()

    kpi_query = (

    select(BankTransaction)

    .where(
        BankTransaction.user_id == current_user.id
    )

    .where(
        BankTransaction.is_deleted == False
    )

    .where(

        or_(

            BankTransaction.category == "Unclassified",

            BankTransaction.merchant == "-",

            BankTransaction.merchant == None,

            BankTransaction.classification_source == "infer"
        )
    )
)
    if start_date:

        try:

            start = datetime.strptime(
                start_date,
                "%Y-%m-%d"
            )

            kpi_query = kpi_query.where(
                BankTransaction.recorded_at >= start
            )

        except Exception:
            pass

    if end_date:

        try:

            end = datetime.strptime(
                end_date,
                "%Y-%m-%d"
            )

            kpi_query = kpi_query.where(
                BankTransaction.recorded_at <= end
            )

        except Exception:
            pass

    kpi_result = await db.execute(kpi_query)
    kpi_transactions = (kpi_result.scalars().all())

    needs_review_count = len(
        kpi_transactions
    )

    uncategorized_spend = sum(

        abs(tx.amount or 0)

        for tx in kpi_transactions

        if tx.amount < 0
    )

    new_since_upload = 0

    return {

        "transactions": [

            {
                "id":
                    tx.id,

                "date":
                    tx.recorded_at.strftime("%d/%m/%Y")
                    if tx.recorded_at
                    else None,

                "description":
                    tx.description,

                "merchant":
                    tx.merchant,

                "category":
                    tx.category,

                "amount":
                    tx.amount,

                "transaction_type":
                    tx.transaction_type,

                "classification_source":
                    tx.classification_source,
            }

            for tx in transactions
        ],

        "page":
            page,

        "limit":
            limit,

        "total":
            total,

        "pages":
            (total + limit - 1) // limit,

        "kpis": {

            "needs_review_count":
                needs_review_count,

            "uncategorized_spend":
                round(
                    uncategorized_spend,
                    2
                ),

            "new_since_upload":
                new_since_upload
        },
    }

@router.patch("/transactions/{transaction_id}")
async def update_transaction(

    transaction_id: int,

    payload: TransactionUpdateRequest,

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.id == transaction_id
        )

        .where(
            BankTransaction.user_id == current_user.id
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    tx = result.scalar_one_or_none()

    if not tx:

        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    # ONLY PATCH INTERPRETATION FIELDS

    if payload.category is not None:
        tx.category = payload.category

    if payload.merchant is not None:
        tx.merchant = payload.merchant

    if payload.transaction_type is not None:
        tx.transaction_type = payload.transaction_type

    # MANUAL OVERRIDE SOURCE

    tx.classification_source = "manual"

    await db.commit()

    await db.refresh(tx)

    return {

        "success": True,

        "transaction": {

            "id": tx.id,

            "category": tx.category,

            "merchant": tx.merchant,

            "transaction_type": tx.transaction_type,

            "classification_source":
                tx.classification_source
        }
    }

############################
### Transaction Summary#####
############################
@router.get("/transactions/summary")
async def get_transaction_summary(

    current_user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(BankTransaction)

        .where(
            BankTransaction.user_id == current_user.id
        )

        .where(
            BankTransaction.is_deleted == False
        )
    )

    transactions = result.scalars().all()

    total_transactions = len(
        transactions
    )

    income_transactions = [

        tx for tx in transactions

        if (
            tx.amount > 0
            and tx.transaction_type in [
                "income",
                "infer"
            ]
        )
    ]

    expense_transactions = [

        tx for tx in transactions

        if (
            tx.amount < 0
            and tx.transaction_type in [
                "expense",
                "loan repayment",
                "infer"
            ]
        )
    ]

    classified_transactions = [

        tx for tx in transactions

        if (
            tx.category
            and tx.category != "Unclassified"
        )
    ]

    review_transactions = [

        tx for tx in transactions

        if (
            tx.category == "Unclassified"
            or tx.classification_source == "infer"
            or tx.merchant in [None, "-"]
        )
    ]

    income_total = sum(
        abs(tx.amount or 0)
        for tx in income_transactions
    )

    expense_total = sum(
        abs(tx.amount or 0)
        for tx in expense_transactions
    )

    classified_total = sum(
        abs(tx.amount or 0)
        for tx in classified_transactions
    )

    review_total = sum(
        abs(tx.amount or 0)
        for tx in review_transactions
    )

    classified_count = len(
        classified_transactions
    )

    review_count = len(
        review_transactions
    )

    classified_pct = (

        round(
            (
                classified_count
                / total_transactions
            ) * 100,
            1
        )

        if total_transactions > 0
        else 0
    )

    review_pct = (

        round(
            (
                review_count
                / total_transactions
            ) * 100,
            1
        )

        if total_transactions > 0
        else 0
    )

    net_flow = (

        income_total
        - expense_total
    )

    return {

        "total_transactions":
            total_transactions,

        "net_flow":
            round(net_flow, 2),

        "income_total":
            round(income_total, 2),

        "income_count":
            len(income_transactions),

        "expense_total":
            round(expense_total, 2),

        "expense_count":
            len(expense_transactions),

        "classified_total":
            round(classified_total, 2),

        "classified_count":
            classified_count,

        "classified_pct":
            classified_pct,

        "review_total":
            round(review_total, 2),

        "review_count":
            review_count,

        "review_pct":
            review_pct
    }

@router.get("/transactions/categories")
async def get_transaction_categories(

    current_user: User = Depends(
        get_current_user
    ),

    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(

        select(
            BankTransaction.category
        )

        .where(
            BankTransaction.user_id
            == current_user.id
        )

        .where(
            BankTransaction.category
            != None
        )

        .distinct()

        .order_by(
            BankTransaction.category.asc()
        )
    )

    categories = result.scalars().all()

    return categories