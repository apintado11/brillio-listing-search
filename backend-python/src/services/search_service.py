import math
from functools import cmp_to_key

from services.scoring import score_listings, sort_by_score


def matches_filters(listing, query):
    min_price = query.get("minPrice")
    max_price = query.get("maxPrice")
    min_bedrooms = query.get("minBedrooms")
    if min_price is not None and listing.get("price") < min_price:
        return False
    if max_price is not None and listing.get("price") > max_price:
        return False
    if min_bedrooms is not None and listing.get("bedrooms") < min_bedrooms:
        return False
    city = str(listing.get("city") or "")
    query_city = query.get("city")
    if query_city and city.lower() != query_city.lower():
        return False
    description = str(listing.get("description") or "")
    keyword = query.get("keyword")
    if keyword and keyword.lower() not in description.lower():
        return False
    return True


def filter_listings(listings, query):
    return [row for row in listings if matches_filters(row, query)]


def paginate(items, page, page_size):
    total = len(items)
    total_pages = 0 if total == 0 else math.ceil(total / page_size)
    start = (page - 1) * page_size
    results = [] if start >= total else items[start : start + page_size]
    return {
        "results": results,
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
    }


def _listing_identity(row):
    return f"{row.get('source')}+{row.get('id')}"


def sort_listings(listings, sort="match"):
    if sort == "match":
        return sort_by_score(listings)

    def compare(a, b):
        cmp = 0
        if sort == "priceAsc":
            cmp = (a.get("price") or 0) - (b.get("price") or 0)
        elif sort == "priceDesc":
            cmp = (b.get("price") or 0) - (a.get("price") or 0)
        elif sort == "newest":
            left = str(b.get("listedDate") or "")
            right = str(a.get("listedDate") or "")
            if left < right:
                cmp = -1
            elif left > right:
                cmp = 1
        elif sort == "bedsDesc":
            cmp = (b.get("bedrooms") or 0) - (a.get("bedrooms") or 0)
        if cmp != 0:
            return 1 if cmp > 0 else -1
        ident_a = _listing_identity(a)
        ident_b = _listing_identity(b)
        if ident_a < ident_b:
            return -1
        if ident_a > ident_b:
            return 1
        return 0

    return sorted(listings, key=cmp_to_key(compare))


def search_listings(listings, query, now=None):
    filtered = filter_listings(listings, query)
    scored = score_listings(filtered, query["targetBudget"], now)
    ranked = sort_listings(scored, query.get("sort") or "match")
    return paginate(ranked, query["page"], query["pageSize"])


def unique_cities(listings):
    seen = {}
    for listing in listings:
        city = str(listing.get("city") or "").strip()
        if not city:
            continue
        key = city.lower()
        if key not in seen:
            seen[key] = city
    return sorted(seen.values(), key=str.casefold)


def to_public_listing(listing):
    return {
        "id": listing.get("id"),
        "source": listing.get("source"),
        "address": listing.get("address"),
        "city": listing.get("city"),
        "state": listing.get("state"),
        "zip": listing.get("zip"),
        "price": listing.get("price"),
        "bedrooms": listing.get("bedrooms"),
        "bathrooms": listing.get("bathrooms"),
        "sqft": listing.get("sqft"),
        "latitude": listing.get("latitude"),
        "longitude": listing.get("longitude"),
        "status": listing.get("status"),
        "listedDate": listing.get("listedDate"),
        "description": listing.get("description"),
        "score": listing.get("score"),
    }
