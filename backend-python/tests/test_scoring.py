import unittest

from helpers import NOW, listing
from services.scoring import budget_fit, score_listings, sort_by_score


class BudgetFitTest(unittest.TestCase):
    def test_is_1_when_price_equals_target_budget(self):
        self.assertEqual(budget_fit(450000, 450000), 1)

    def test_is_0_when_price_is_100_percent_or_more_away(self):
        self.assertEqual(budget_fit(900000, 450000), 0)
        self.assertEqual(budget_fit(0, 450000), 0)

    def test_is_0_5_when_price_is_50_percent_away(self):
        self.assertEqual(budget_fit(675000, 450000), 0.5)


class ScoreListingsTest(unittest.TestCase):
    def test_newer_listing_scores_higher_when_prices_match(self):
        listings = [
            listing(id="OLD", listedDate="2026-09-07", price=450000),
            listing(id="NEW", listedDate="2026-09-17", price=450000),
        ]
        scored = score_listings(listings, 450000, NOW)
        newer = next(row for row in scored if row["id"] == "NEW")
        older = next(row for row in scored if row["id"] == "OLD")
        self.assertEqual(newer["score"], 1)
        self.assertEqual(older["score"], 0.7)

    def test_closer_to_budget_has_higher_budget_component(self):
        listings = [
            listing(id="NEAR", price=450000, listedDate="2026-09-17"),
            listing(id="FAR", price=900000, listedDate="2026-09-17"),
        ]
        scored = score_listings(listings, 450000, NOW)
        near = next(row for row in scored if row["id"] == "NEAR")
        far = next(row for row in scored if row["id"] == "FAR")
        self.assertEqual(near["score"], 1)
        self.assertEqual(far["score"], 0.3)

    def test_same_score_when_price_and_listed_date_match(self):
        listings = [
            listing(id="A1", source="MLS_A", price=400000, listedDate="2026-09-10"),
            listing(id="B1", source="MLS_B", price=400000, listedDate="2026-09-10"),
        ]
        scored = score_listings(listings, 400000, NOW)
        self.assertEqual(scored[0]["score"], scored[1]["score"])


class SortByScoreTest(unittest.TestCase):
    def test_breaks_tied_scores_by_newer_listed_date_then_source_id(self):
        tied = sort_by_score(
            [
                listing(id="B1", source="MLS_B", score=0.5, listedDate="2026-09-10"),
                listing(id="A1", source="MLS_A", score=0.5, listedDate="2026-09-10"),
            ]
        )
        self.assertEqual(f"{tied[0]['source']}+{tied[0]['id']}", "MLS_A+A1")
        self.assertEqual(f"{tied[1]['source']}+{tied[1]['id']}", "MLS_B+B1")

        by_date = sort_by_score(
            [
                listing(id="OLD", score=0.5, listedDate="2026-08-01"),
                listing(id="NEW", score=0.5, listedDate="2026-09-01"),
            ]
        )
        self.assertEqual(by_date[0]["id"], "NEW")

    def test_orders_higher_scores_first(self):
        ranked = sort_by_score(
            [
                listing(id="LOW", score=0.2),
                listing(id="HIGH", score=0.9),
            ]
        )
        self.assertEqual(ranked[0]["id"], "HIGH")


if __name__ == "__main__":
    unittest.main()
