import os

DEFAULT_PORT = 3002
DEFAULT_FILE = None  # repository supplies the sample path

node_env = os.environ.get("FLASK_ENV") or os.environ.get("NODE_ENV") or "development"
port = int(os.environ.get("PORT") or DEFAULT_PORT)
listings_file = os.environ.get("LISTINGS_FILE")
json_body_limit = 32 * 1024
