from fastapi import APIRouter, Depends, Query, Response

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, func

from database import get_db

from routers.auth import get_current_user

import csv
import io

from routers.transaction import BankTransaction

router = APIRouter()

@router.get("/transactions/export/actual")
async def export_actual_csv(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(BankTransaction)
        .where(
            BankTransaction.user_id == current_user.id,
            BankTransaction.is_deleted == False,
        )
        .order_by(BankTransaction.recorded_at.asc())
    )

    transactions = result.scalars().all()

    

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "Date",
            "Payee",
            "Notes",
            "Category",
            "Payment",
            "Deposit",
        ]
    )

    for txn in transactions:

        payment = ""
        deposit = ""

        amount = abs(txn.amount)

        if txn.amount > 0 and txn.transaction_type not in ["transfer", "investment"]:
            deposit = amount
        elif txn.amount < 0 and txn.transaction_type not in ["transfer", "investment"]:
            payment = amount

        writer.writerow(
            [
                txn.recorded_at.strftime("%Y-%m-%d"),
                txn.merchant or "",
                txn.description or "",
                txn.category or "",
                payment,
                deposit,
            ]
        )

    csv_content = output.getvalue()

    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=actual_budget_export.csv"
        },
    )