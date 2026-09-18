import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

os.environ.setdefault("NODE_ENV", "test")
os.environ.setdefault("FLASK_ENV", "testing")

from app import create_app

SAMPLE_PATH = Path(__file__).resolve().parents[2] / "data" / "sample_listings.json"
NOW = datetime(2026, 9, 17, tzinfo=timezone.utc)


def listing(**overrides):
    row = {
        "id": "X1",
        "source": "MLS_A",
        "address": "1 Test St",
        "city": "Springfield",
        "state": "VA",
        "zip": "22150",
        "price": 450000,
        "bedrooms": 2,
        "bathrooms": 1,
        "sqft": 1000,
        "latitude": 38.7,
        "longitude": -77.1,
        "listedDate": "2026-09-01",
        "status": "active",
        "description": "A quiet home near transit. Pets allowed.",
    }
    row.update(overrides)
    return row


def temp_listings_file(contents=None):
    directory = tempfile.mkdtemp(prefix="listings-")
    file_path = Path(directory) / "sample_listings.json"
    if contents is not None:
        file_path.write_text(f"{json.dumps(contents, indent=2)}\n", encoding="utf-8")
    else:
        shutil.copyfile(SAMPLE_PATH, file_path)
    return file_path


def create_test_client(listings_file_path):
    app = create_app(listings_file_path)
    app.testing = True
    return app.test_client()
