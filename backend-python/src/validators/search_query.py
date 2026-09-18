MAX_PAGE_SIZE = 50
MAX_TEXT_LENGTH = 80
SORTS = ("match", "priceAsc", "priceDesc", "newest", "bedsDesc")


def is_present(value):
    return value is not None and str(value).strip() != ""


def _finite_number(raw):
    try:
        number = float(raw)
    except (TypeError, ValueError):
        return None
    if number != number or number in (float("inf"), float("-inf")):
        return None
    if number.is_integer():
        return int(number)
    return number


def parse_number(raw, name, details):
    if not is_present(raw):
        return None
    number = _finite_number(raw)
    if number is None:
        details.append(f"{name} must be a number")
        return None
    return number


def parse_integer(raw, name, details):
    number = parse_number(raw, name, details)
    if number is None:
        return None
    if not isinstance(number, int):
        details.append(f"{name} must be a whole number")
        return None
    return number


def optional_string(raw, name, details):
    if not is_present(raw):
        return None
    value = str(raw).strip()
    if len(value) > MAX_TEXT_LENGTH:
        details.append(f"{name} must be at most {MAX_TEXT_LENGTH} characters")
        return None
    return value


def _get(query, name):
    if hasattr(query, "get"):
        return query.get(name)
    return None


def validate_search_query(query=None):
    query = query or {}
    details = []

    min_price = parse_number(_get(query, "minPrice"), "minPrice", details)
    max_price = parse_number(_get(query, "maxPrice"), "maxPrice", details)
    min_bedrooms = parse_integer(_get(query, "minBedrooms"), "minBedrooms", details)
    city = optional_string(_get(query, "city"), "city", details)
    keyword = optional_string(_get(query, "keyword"), "keyword", details)

    if not is_present(_get(query, "targetBudget")):
        details.append("targetBudget is required")
    target_budget = parse_number(_get(query, "targetBudget"), "targetBudget", details)

    page = (
        parse_integer(_get(query, "page"), "page", details)
        if is_present(_get(query, "page"))
        else 1
    )
    page_size = (
        parse_integer(_get(query, "pageSize"), "pageSize", details)
        if is_present(_get(query, "pageSize"))
        else 5
    )

    sort = "match"
    if is_present(_get(query, "sort")):
        sort = str(_get(query, "sort")).strip()
        if sort not in SORTS:
            details.append("sort must be one of " + ", ".join(SORTS))

    if min_price is not None and min_price < 0:
        details.append("minPrice must be at least 0")
    if max_price is not None and max_price < 0:
        details.append("maxPrice must be at least 0")
    if min_bedrooms is not None and min_bedrooms < 0:
        details.append("minBedrooms must be at least 0")
    if target_budget is not None and target_budget <= 0:
        details.append("targetBudget must be greater than 0")
    if min_price is not None and max_price is not None and min_price > max_price:
        details.append("minPrice must not be greater than maxPrice")
    if page is not None and page < 1:
        details.append("page must be at least 1")
    if page_size is not None and page_size <= 0:
        details.append("pageSize must be greater than 0")
    if page_size is not None and page_size > MAX_PAGE_SIZE:
        details.append(f"pageSize must be at most {MAX_PAGE_SIZE}")

    if details:
        return {
            "ok": False,
            "error": "Invalid search query",
            "details": details,
        }

    return {
        "ok": True,
        "value": {
            "minPrice": min_price,
            "maxPrice": max_price,
            "minBedrooms": min_bedrooms,
            "city": city,
            "keyword": keyword,
            "targetBudget": target_budget,
            "page": page,
            "pageSize": page_size,
            "sort": sort,
        },
    }
