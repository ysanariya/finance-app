import re
from datetime import datetime


def parse_date(date_str: str):

    date_str = date_str.strip()

    formats = [
        "%d/%m/%y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y-%m-%d"
    ]

    for fmt in formats:

        try:
            return datetime.strptime(
                date_str,
                fmt
            )

        except ValueError:
            continue

    raise ValueError(
        f"Unknown date format: {date_str}"
    )


def safe_float(value: str):

    value = (
        value
        .replace(",", "")
        .strip()
    )

    if not value:
        return 0.0

    return float(value)


def parse_hdfc_txt(file_content: bytes):

    text_data = file_content.decode(
        "utf-8",
        errors="ignore"
    )

    lines = [
        line.strip()
        for line in text_data.splitlines()
        if line.strip()
    ]

    transactions = []

    skipped_rows = []

    total_rows = 0

    for line in lines:

        try:

            # Skip header rows
            if (
                "Date" in line
                and "Narration" in line
            ):
                continue

            # Valid transaction rows start with date
            if not re.match(
                r"^\d{2}/\d{2}/\d{2}",
                line
            ):
                continue

            total_rows += 1

            # Extract date
            first_comma = line.find(",")

            if first_comma == -1:

                skipped_rows.append({
                    "line": line,
                    "error": "Missing comma"
                })

                continue

            date_str = (
                line[:first_comma]
                .strip()
            )

            remaining = (
                line[first_comma + 1:]
                .strip()
            )

            # Find value date
            date_matches = re.findall(
                r"\d{2}/\d{2}/\d{2}",
                remaining
            )

            if not date_matches:

                skipped_rows.append({
                    "line": line,
                    "error": "Value date not found"
                })

                continue

            value_date = date_matches[0]

            value_date_index = (
                remaining.find(value_date)
            )

            narration = (
                remaining[:value_date_index]
                .strip(" ,")
            )

            after_value_date = (
                remaining[
                    value_date_index +
                    len(value_date):
                ]
                .strip(" ,")
            )

            # Remaining financial columns
            financial_parts = [
                p.strip()
                for p in after_value_date.split(",")
            ]

            if len(financial_parts) < 4:

                skipped_rows.append({
                    "line": line,
                    "error":
                        "Missing financial columns"
                })

                continue

            withdrawal = safe_float(
                financial_parts[0]
            )

            deposit = safe_float(
                financial_parts[1]
            )

            reference_number = (
                financial_parts[2]
            )

            balance = safe_float(
                financial_parts[3]
            )

            amount = (
                deposit - withdrawal
            )

            tx = {

                "description":
                    narration,

                "amount":
                    amount,

                "recorded_at":
                    parse_date(date_str),

                "category":
                    None,

                "reference_number":
                    reference_number
            }

            transactions.append(tx)

            print(
                "PARSED:",
                date_str,
                "|",
                amount,
                "|",
                narration[:80]
            )

        except Exception as e:

            skipped_rows.append({

                "line":
                    line,

                "error":
                    str(e)
            })

            print("\n========== PARSE ERROR ==========")

            print(line)

            print(str(e))

            print("=================================\n")

    return {

        "transactions":
            transactions,

        "total":
            total_rows,

        "parsed":
            len(transactions),

        "skipped":
            len(skipped_rows),

        "errors":
            skipped_rows[:10]
    }