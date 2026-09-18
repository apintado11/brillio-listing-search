import math
import tempfile
import unittest
from pathlib import Path

from helpers import SAMPLE_PATH, create_test_client, temp_listings_file


def listings_query(**params):
    return {key: str(value) for key, value in params.items()}


class ListingsHttpApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_sample = SAMPLE_PATH.read_bytes()
        cls.listings_file_path = temp_listings_file()
        cls.client = create_test_client(cls.listings_file_path)

    @classmethod
    def tearDownClass(cls):
        after = SAMPLE_PATH.read_bytes()
        if after != cls.original_sample:
            raise AssertionError("sample listings file was modified")

    def test_get_cities_returns_unique_sorted_city_names(self):
        res = self.client.get("/api/cities")
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertIsInstance(body["cities"], list)
        self.assertIn("Springfield", body["cities"])
        self.assertIn("Fairfax", body["cities"])
        self.assertEqual(body["cities"], sorted(body["cities"], key=str.casefold))
        self.assertEqual(len(body["cities"]), len(set(body["cities"])))

    def test_get_listings_returns_ranked_paginated_results_with_scores(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, page=1, pageSize=5),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body["page"], 1)
        self.assertEqual(body["pageSize"], 5)
        self.assertGreaterEqual(body["total"], 12)
        self.assertEqual(body["totalPages"], math.ceil(body["total"] / body["pageSize"]))
        self.assertEqual(len(body["results"]), 5)
        for row in body["results"]:
            self.assertTrue(row["id"])
            self.assertTrue(row["source"])
            self.assertTrue(row["address"])
            self.assertIsInstance(row["price"], (int, float))
            self.assertIsInstance(row["bedrooms"], (int, float))
            self.assertIsInstance(row["bathrooms"], (int, float))
            self.assertIsInstance(row["sqft"], (int, float))
            self.assertIsInstance(row["score"], (int, float))
            self.assertTrue(row["city"])
            self.assertTrue(row["state"])
            self.assertTrue(row["zip"])
            self.assertTrue(row["status"])
            self.assertTrue(row["listedDate"])
            self.assertIsInstance(row["description"], str)
        scores = [row["score"] for row in body["results"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_returns_400_when_min_price_greater_than_max_price(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(
                targetBudget=450000, minPrice=500000, maxPrice=400000
            ),
        )
        self.assertEqual(res.status_code, 400)
        body = res.get_json()
        self.assertEqual(body["error"], "Invalid search query")
        self.assertIn(
            "minPrice must not be greater than maxPrice", body["details"]
        )

    def test_returns_400_when_page_size_is_zero(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, pageSize=0),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn(
            "pageSize must be greater than 0", res.get_json()["details"]
        )

    def test_returns_400_when_page_is_less_than_1(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, page=0),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("page must be at least 1", res.get_json()["details"])

    def test_returns_400_when_target_budget_is_missing(self):
        res = self.client.get("/api/listings")
        self.assertEqual(res.status_code, 400)
        self.assertIn("targetBudget is required", res.get_json()["details"])

    def test_returns_400_when_a_price_filter_is_not_a_number(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, minPrice="abc"),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("minPrice must be a number", res.get_json()["details"])

    def test_returns_200_with_empty_page_when_city_has_no_matches(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, city="Atlantis"),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body["results"], [])
        self.assertEqual(body["total"], 0)
        self.assertEqual(body["totalPages"], 0)

    def test_keeps_total_when_requesting_a_page_past_the_last_page(self):
        first = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, page=1, pageSize=5),
        )
        first_body = first.get_json()
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, page=99, pageSize=5),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body["results"], [])
        self.assertEqual(body["total"], first_body["total"])
        self.assertEqual(body["page"], 99)
        self.assertEqual(body["totalPages"], first_body["totalPages"])

    def test_filters_by_city_keyword_and_min_bedrooms_together(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(
                targetBudget=450000,
                city="springfield",
                keyword="pet",
                minBedrooms=2,
                pageSize=20,
            ),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertGreaterEqual(body["total"], 1)
        ids = sorted(row["id"] for row in body["results"])
        self.assertEqual(ids, ["A1", "B7"])
        for row in body["results"]:
            self.assertEqual(row["city"].lower(), "springfield")
            self.assertGreaterEqual(row["bedrooms"], 2)

    def test_applies_default_page_and_page_size(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body["page"], 1)
        self.assertEqual(body["pageSize"], 5)
        self.assertEqual(len(body["results"]), 5)

    def test_filters_by_min_price_over_http(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(
                targetBudget=450000, minPrice=600000, pageSize=20
            ),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertGreaterEqual(body["total"], 1)
        for row in body["results"]:
            self.assertGreaterEqual(row["price"], 600000)

    def test_filters_by_max_price_over_http(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(
                targetBudget=450000, maxPrice=400000, pageSize=20
            ),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertGreaterEqual(body["total"], 1)
        for row in body["results"]:
            self.assertLessEqual(row["price"], 400000)

    def test_does_not_send_x_powered_by(self):
        res = self.client.get("/health")
        self.assertIsNone(res.headers.get("X-Powered-By"))

    def test_answers_cors_preflight_with_204(self):
        res = self.client.open("/api/listings", method="OPTIONS")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), "*")

    def test_rejects_post_with_405(self):
        res = self.client.post("/api/listings")
        self.assertEqual(res.status_code, 405)
        self.assertIn("GET", res.headers.get("Allow") or "")
        self.assertEqual(res.get_json()["error"], "Method not allowed")

    def test_returns_400_when_page_size_exceeds_the_cap(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, pageSize=51),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("pageSize must be at most 50", res.get_json()["details"])

    def test_returns_400_when_min_price_is_negative(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, minPrice=-1),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("minPrice must be at least 0", res.get_json()["details"])

    def test_sorts_results_by_price_when_sort_is_price_asc(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(
                targetBudget=450000, pageSize=20, sort="priceAsc"
            ),
        )
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        prices = [row["price"] for row in body["results"]]
        self.assertEqual(prices, sorted(prices))
        for row in body["results"]:
            self.assertIsInstance(row["score"], (int, float))

    def test_returns_400_for_unknown_sort(self):
        res = self.client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000, sort="popularity"),
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn(
            "sort must be one of match, priceAsc, priceDesc, newest, bedsDesc",
            res.get_json()["details"],
        )

    def test_health_returns_503_when_listings_file_is_missing(self):
        missing_path = (
            Path(tempfile.gettempdir())
            / f"missing-listings-{id(self)}.json"
        )
        client = create_test_client(missing_path)
        health = client.get("/health")
        self.assertEqual(health.status_code, 503)
        self.assertEqual(health.get_json(), {"status": "unavailable"})

        listings = client.get(
            "/api/listings",
            query_string=listings_query(targetBudget=450000),
        )
        self.assertEqual(listings.status_code, 500)
        self.assertEqual(listings.get_json(), {"error": "Internal server error"})


if __name__ == "__main__":
    unittest.main()
