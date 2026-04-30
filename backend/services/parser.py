import io
import csv
from datetime import datetime

def parse_date(date_str: str):
    date_str = date_str.strip()

    # DEBUG
    print("Parsing date:", repr(date_str))

    formats = [
        "%d/%m/%y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y-%m-%d"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    raise ValueError(f"Unknown date format: {date_str}")

def parse_hdfc_txt(file_content: bytes):
    text_data = file_content.decode("utf-8")

    lines = [line for line in text_data.splitlines() if line.strip()]
    temp_file = io.StringIO("\n".join(lines))

    reader = csv.DictReader(temp_file)
    reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]

    required_cols = ["date", "narration", "debit amount", "credit amount"]
    for col in required_cols:
        if col not in reader.fieldnames:
            raise ValueError(f"Missing required column: {col}")

    transactions = []
    skipped_rows = []
    total_rows = 0

    for row in reader:
        total_rows += 1

        try:
            debit = float(row["debit amount"].strip()) if row["debit amount"].strip() else 0.0
            credit = float(row["credit amount"].strip()) if row["credit amount"].strip() else 0.0

            amount = credit - debit

            tx = {
                "description": row["narration"].strip(),
                "amount": amount,
                "recorded_at": parse_date(row["date"]),
                "category": None,
                "reference_number": row.get("chq/ref number", "").strip()
            }

            transactions.append(tx)

        except Exception as e:
            skipped_rows.append({
                "row": row,
                "error": str(e)
            })

    return {
        "transactions": transactions,
        "total": total_rows,
        "parsed": len(transactions),
        "skipped": len(skipped_rows),
        "errors": skipped_rows[:5]  # sample only
    }