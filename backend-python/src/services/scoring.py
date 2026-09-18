import math
from datetime import datetime, timezone
from functools import cmp_to_key

BUDGET_WEIGHT = 0.7
RECENCY_WEIGHT = 0.3
MS_PER_DAY = 24 * 60 * 60 * 1000


def round4(value):
    return math.floor(value * 10000 + 0.5) / 10000


def days_since_listed(listed_date, now):
    try:
        listed = datetime.fromisoformat(f"{listed_date}T00:00:00+00:00")
    except (TypeError, ValueError):
        return 0
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    diff_ms = (now - listed).total_seconds() * 1000
    return max(0, diff_ms / MS_PER_DAY)


def budget_fit(price, target_budget):
    if target_budget == 0:
        return 1 if price == 0 else 0
    return 1 - min(abs(price - target_budget) / target_budget, 1)


def recency_fits(listings, now):
    ages = [days_since_listed(row.get("listedDate"), now) for row in listings]
    max_days = max(ages) if ages else 0
    if max_days == 0:
        return [1 for _ in ages]
    return [1 - age / max_days for age in ages]


def score_listings(listings, target_budget, now=None):
    if now is None:
        now = datetime.now(timezone.utc)
    recency = recency_fits(listings, now)
    scored = []
    for index, listing in enumerate(listings):
        fit = budget_fit(listing.get("price"), target_budget)
        score = round4(BUDGET_WEIGHT * fit + RECENCY_WEIGHT * recency[index])
        scored.append({**listing, "score": score})
    return scored


def _compare_listings(a, b):
    score_a = a.get("score") if a.get("score") is not None else 0
    score_b = b.get("score") if b.get("score") is not None else 0
    if score_b != score_a:
        return 1 if score_b > score_a else -1
    date_a = a.get("listedDate") or ""
    date_b = b.get("listedDate") or ""
    if date_a != date_b:
        return 1 if date_b > date_a else -1
    key_a = f"{a.get('source')}+{a.get('id')}"
    key_b = f"{b.get('source')}+{b.get('id')}"
    if key_a < key_b:
        return -1
    if key_a > key_b:
        return 1
    return 0


def sort_by_score(listings):
    return sorted(listings, key=cmp_to_key(_compare_listings))
