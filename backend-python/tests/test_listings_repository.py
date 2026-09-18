import unittest

from helpers import SAMPLE_PATH, listing, temp_listings_file
from repositories.listings_repository import ListingsRepository, listing_key


class ListingsRepositoryTest(unittest.TestCase):
    def test_reads_listings_from_a_json_file(self):
        file_path = temp_listings_file()
        repo = ListingsRepository(file_path)
        listings = repo.get_all()
        self.assertIsInstance(listings, list)
        self.assertGreaterEqual(len(listings), 12)
        self.assertEqual(listings[0]["id"], "A1")

    def test_identifies_a_listing_by_source_and_id(self):
        self.assertEqual(listing_key({"source": "MLS_A", "id": "A1"}), "MLS_A::A1")
        self.assertNotEqual(
            listing_key({"source": "MLS_A", "id": "A1"}),
            listing_key({"source": "MLS_B", "id": "A1"}),
        )

    def test_writes_updates_to_a_temp_copy_not_the_sample_file(self):
        original = SAMPLE_PATH.read_bytes()
        seed = [listing(id="T1", source="MLS_A", price=100)]
        file_path = temp_listings_file(seed)
        repo = ListingsRepository(file_path)

        extra = listing(id="T2", source="MLS_B", price=200)
        repo.save_all([*seed, extra])

        stored = repo.get_all()
        self.assertEqual(len(stored), 2)
        self.assertEqual(stored[1]["id"], "T2")
        self.assertEqual(SAMPLE_PATH.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
