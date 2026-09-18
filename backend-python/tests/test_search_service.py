import unittest

from helpers import NOW, listing
from services.search_service import (
    filter_listings,
    paginate,
    search_listings,
    unique_cities,
)

LISTINGS = [
    listing(
        id="A1",
        city="Springfield",
        price=450000,
        bedrooms=2,
        listedDate="2026-09-17",
        description="Bright condo near transit. Pet friendly.",
    ),
    listing(
        id="A2",
        city="Fairfax",
        price=399000,
        bedrooms=2,
        listedDate="2026-09-01",
        description="Cozy starter home, no pets.",
    ),
    listing(
        id="A3",
        city="Reston",
        price=610000,
        bedrooms=4,
        listedDate="2026-09-03",
        description="Spacious family home. Pets welcome.",
    ),
    listing(
        id="A4",
        city="springfield",
        price=525000,
        bedrooms=3,
        listedDate="2026-09-02",
        description="Updated kitchen, fenced yard.",
    ),
]

BASE_QUERY = {
    "targetBudget": 450000,
    "page": 1,
    "pageSize": 2,
}


class FilterListingsTest(unittest.TestCase):
    def test_filters_by_min_and_max_price(self):
        result = filter_listings(
            LISTINGS, {**BASE_QUERY, "minPrice": 400000, "maxPrice": 500000}
        )
        self.assertEqual([row["id"] for row in result], ["A1"])

    def test_filters_by_min_bedrooms(self):
        result = filter_listings(LISTINGS, {**BASE_QUERY, "minBedrooms": 3})
        self.assertEqual(sorted(row["id"] for row in result), ["A3", "A4"])

    def test_matches_city_case_insensitively(self):
        result = filter_listings(LISTINGS, {**BASE_QUERY, "city": "Springfield"})
        self.assertEqual(sorted(row["id"] for row in result), ["A1", "A4"])

    def test_matches_keyword_against_description_case_insensitively(self):
        result = filter_listings(LISTINGS, {**BASE_QUERY, "keyword": "PET"})
        self.assertEqual(sorted(row["id"] for row in result), ["A1", "A2", "A3"])

    def test_returns_no_matches_when_city_is_unknown(self):
        result = filter_listings(LISTINGS, {**BASE_QUERY, "city": "Atlantis"})
        self.assertEqual(result, [])

    def test_treats_missing_description_as_empty_text(self):
        rows = [listing(id="NO_DESC", city="Fairfax")]
        del rows[0]["description"]
        result = filter_listings(rows, {**BASE_QUERY, "keyword": "pets"})
        self.assertEqual(result, [])


class PaginateTest(unittest.TestCase):
    items = [1, 2, 3, 4, 5, 6, 7]

    def test_returns_the_first_page(self):
        self.assertEqual(
            paginate(self.items, 1, 3),
            {
                "results": [1, 2, 3],
                "page": 1,
                "pageSize": 3,
                "total": 7,
                "totalPages": 3,
            },
        )

    def test_returns_the_last_partial_page(self):
        self.assertEqual(
            paginate(self.items, 3, 3),
            {
                "results": [7],
                "page": 3,
                "pageSize": 3,
                "total": 7,
                "totalPages": 3,
            },
        )

    def test_returns_empty_page_past_the_end_and_keeps_total(self):
        self.assertEqual(
            paginate(self.items, 9, 3),
            {
                "results": [],
                "page": 9,
                "pageSize": 3,
                "total": 7,
                "totalPages": 3,
            },
        )

    def test_returns_all_items_when_page_size_is_larger_than_total(self):
        self.assertEqual(
            paginate(self.items, 1, 50),
            {
                "results": self.items,
                "page": 1,
                "pageSize": 50,
                "total": 7,
                "totalPages": 1,
            },
        )


class SearchListingsTest(unittest.TestCase):
    def test_filters_scores_sorts_then_paginates(self):
        result = search_listings(LISTINGS, BASE_QUERY, NOW)
        self.assertEqual(result["total"], 4)
        self.assertEqual(result["totalPages"], 2)
        self.assertEqual(len(result["results"]), 2)
        self.assertEqual(result["results"][0]["id"], "A1")
        self.assertGreaterEqual(
            result["results"][0]["score"], result["results"][1]["score"]
        )

    def test_returns_empty_result_set_when_nothing_matches(self):
        result = search_listings(
            LISTINGS, {**BASE_QUERY, "city": "Atlantis"}, NOW
        )
        self.assertEqual(result["results"], [])
        self.assertEqual(result["total"], 0)
        self.assertEqual(result["totalPages"], 0)

    def test_sorts_by_price_listed_date_or_bedrooms_when_requested(self):
        by_price = search_listings(
            LISTINGS, {**BASE_QUERY, "sort": "priceAsc", "pageSize": 4}, NOW
        )
        self.assertEqual([row["id"] for row in by_price["results"]], ["A2", "A1", "A4", "A3"])

        by_newest = search_listings(
            LISTINGS, {**BASE_QUERY, "sort": "newest", "pageSize": 4}, NOW
        )
        self.assertEqual(
            [row["id"] for row in by_newest["results"]], ["A1", "A3", "A4", "A2"]
        )

        by_beds = search_listings(
            LISTINGS, {**BASE_QUERY, "sort": "bedsDesc", "pageSize": 4}, NOW
        )
        self.assertEqual(
            [row["id"] for row in by_beds["results"]], ["A3", "A4", "A1", "A2"]
        )
        self.assertIsInstance(by_beds["results"][0]["score"], (int, float))


class UniqueCitiesTest(unittest.TestCase):
    def test_returns_sorted_unique_city_names_ignoring_case(self):
        self.assertEqual(
            unique_cities(LISTINGS),
            ["Fairfax", "Reston", "Springfield"],
        )


if __name__ == "__main__":
    unittest.main()
