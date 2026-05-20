from datetime import date, datetime, time, timezone

def get_current_fy() -> tuple[date, date]:
    today = date.today()
    if today.month >= 4:
        return date(today.year, 4, 1), date(today.year + 1, 3, 31)
    return date(today.year - 1, 4, 1), date(today.year, 3, 31)

def resolve_date_range(
    start_date: str | None,
    end_date: str | None
) -> tuple[datetime, datetime]:
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(
            hour=0, minute=0, second=0, tzinfo=timezone.utc
        )
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
        return start, end
    
    fy_start, fy_end = get_current_fy()
    return (
        datetime.combine(fy_start, time.min).replace(tzinfo=timezone.utc),
        datetime.combine(fy_end, time.max).replace(tzinfo=timezone.utc)
    )