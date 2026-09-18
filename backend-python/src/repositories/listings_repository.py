import json
import os
import time
from pathlib import Path

DEFAULT_FILE_PATH = (
    Path(__file__).resolve().parents[3] / "data" / "sample_listings.json"
)


def listing_key(listing):
    return f"{listing.get('source')}::{listing.get('id')}"


class ListingsRepository:
    def __init__(self, file_path=None):
        self.file_path = Path(file_path) if file_path else DEFAULT_FILE_PATH

    def get_all(self):
        raw = self.file_path.read_text(encoding="utf-8")
        listings = json.loads(raw)
        if not isinstance(listings, list):
            raise ValueError("Listings file must contain a JSON array")
        return listings

    def save_all(self, listings):
        if not isinstance(listings, list):
            raise ValueError("saveAll expects an array of listings")
        directory = self.file_path.parent
        temp_path = directory / (
            f".{self.file_path.name}.{os.getpid()}.{time.time_ns()}.tmp"
        )
        payload = f"{json.dumps(listings, indent=2)}\n"
        temp_path.write_text(payload, encoding="utf-8")
        try:
            os.replace(temp_path, self.file_path)
        except OSError:
            if temp_path.exists():
                temp_path.unlink()
            raise
