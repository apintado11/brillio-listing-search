import unittest

from validators.search_query import validate_search_query


class ValidateSearchQueryTest(unittest.TestCase):
    def test_applies_defaults_for_page_and_page_size(self):
        result = validate_search_query({"targetBudget": "450000"})
        self.assertTrue(result["ok"])
        self.assertEqual(
            result["value"],
            {
                "minPrice": None,
                "maxPrice": None,
                "minBedrooms": None,
                "city": None,
                "keyword": None,
                "targetBudget": 450000,
                "page": 1,
                "pageSize": 5,
                "sort": "match",
            },
        )

    def test_rejects_missing_target_budget(self):
        result = validate_search_query({})
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "Invalid search query")
        self.assertIn("targetBudget is required", result["details"])

    def test_rejects_non_numeric_price(self):
        result = validate_search_query(
            {"targetBudget": "450000", "minPrice": "cheap"}
        )
        self.assertFalse(result["ok"])
        self.assertIn("minPrice must be a number", result["details"])

    def test_rejects_min_price_greater_than_max_price(self):
        result = validate_search_query(
            {
                "targetBudget": "450000",
                "minPrice": "500000",
                "maxPrice": "400000",
            }
        )
        self.assertFalse(result["ok"])
        self.assertIn(
            "minPrice must not be greater than maxPrice", result["details"]
        )

    def test_rejects_page_size_of_zero_or_less(self):
        zero = validate_search_query({"targetBudget": "1", "pageSize": "0"})
        self.assertFalse(zero["ok"])
        self.assertIn("pageSize must be greater than 0", zero["details"])

        negative = validate_search_query({"targetBudget": "1", "pageSize": "-2"})
        self.assertFalse(negative["ok"])
        self.assertIn("pageSize must be greater than 0", negative["details"])

    def test_rejects_page_less_than_1(self):
        result = validate_search_query({"targetBudget": "1", "page": "0"})
        self.assertFalse(result["ok"])
        self.assertIn("page must be at least 1", result["details"])

    def test_trims_optional_city_and_keyword(self):
        result = validate_search_query(
            {
                "targetBudget": "100",
                "city": "  Fairfax  ",
                "keyword": "  pets  ",
            }
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["value"]["city"], "Fairfax")
        self.assertEqual(result["value"]["keyword"], "pets")

    def test_rejects_negative_prices_bedrooms_and_budget(self):
        price = validate_search_query(
            {"targetBudget": "450000", "minPrice": "-1"}
        )
        self.assertFalse(price["ok"])
        self.assertIn("minPrice must be at least 0", price["details"])

        bedrooms = validate_search_query(
            {"targetBudget": "450000", "minBedrooms": "-1"}
        )
        self.assertFalse(bedrooms["ok"])
        self.assertIn("minBedrooms must be at least 0", bedrooms["details"])

        budget = validate_search_query({"targetBudget": "0"})
        self.assertFalse(budget["ok"])
        self.assertIn("targetBudget must be greater than 0", budget["details"])

    def test_rejects_page_size_above_the_cap(self):
        result = validate_search_query(
            {"targetBudget": "450000", "pageSize": "51"}
        )
        self.assertFalse(result["ok"])
        self.assertIn("pageSize must be at most 50", result["details"])

    def test_rejects_oversized_city_string(self):
        result = validate_search_query(
            {"targetBudget": "450000", "city": "x" * 81}
        )
        self.assertFalse(result["ok"])
        self.assertIn("city must be at most 80 characters", result["details"])

    def test_defaults_sort_to_match_and_accepts_allowed_values(self):
        defaults = validate_search_query({"targetBudget": "450000"})
        self.assertTrue(defaults["ok"])
        self.assertEqual(defaults["value"]["sort"], "match")

        newest = validate_search_query(
            {"targetBudget": "450000", "sort": "newest"}
        )
        self.assertTrue(newest["ok"])
        self.assertEqual(newest["value"]["sort"], "newest")

    def test_rejects_unknown_sort(self):
        result = validate_search_query(
            {"targetBudget": "450000", "sort": "popularity"}
        )
        self.assertFalse(result["ok"])
        self.assertIn(
            "sort must be one of match, priceAsc, priceDesc, newest, bedsDesc",
            result["details"],
        )


if __name__ == "__main__":
    unittest.main()
