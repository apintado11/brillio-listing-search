import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
from app import create_app

app = create_app()

if __name__ == "__main__":
    print(f"Listing search API listening on http://localhost:{config.port}")
    app.run(host="127.0.0.1", port=config.port, debug=False)
