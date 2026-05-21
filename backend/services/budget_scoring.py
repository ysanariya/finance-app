def calculate_utilization(
    actual: float,
    budget: float
):

    if budget <= 0:
        return 0

    return round(
        (actual / budget) * 100,
        1
    )


def calculate_variance(
    actual: float,
    budget: float
):

    return round(
        budget - actual,
        2
    )


def calculate_pace_delta(
    actual: float,
    budget: float,
    elapsed_ratio: float
):

    expected = budget * elapsed_ratio

    if expected <= 0:
        return 0

    delta = (
        (actual - expected)
        / expected
    ) * 100

    return round(delta, 1)


def determine_status(
    utilization_pct: float
):

    if utilization_pct >= 100:
        return "danger"

    if utilization_pct >= 80:
        return "warning"

    return "on_track"