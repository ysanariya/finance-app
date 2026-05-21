from calendar import monthrange


def calculate_projected_spend(
    actual_spend: float,
    elapsed_days: int,
    total_days: int
):

    if elapsed_days <= 0:
        return 0

    daily_rate = actual_spend / elapsed_days

    return round(
        daily_rate * total_days,
        2
    )


def get_month_progress(
    year: int,
    month: int,
    current_day: int
):

    total_days = monthrange(
        year,
        month
    )[1]

    elapsed_days = min(
        current_day,
        total_days
    )

    progress_pct = (
        elapsed_days / total_days
    ) * 100

    return {
        "elapsed_days": elapsed_days,
        "total_days": total_days,
        "progress_pct": round(
            progress_pct,
            1
        )
    }