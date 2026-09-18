from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

import config
from controllers.health_controller import HealthController
from controllers.listings_controller import ListingsController
from repositories.listings_repository import ListingsRepository
from validators.search_query import validate_search_query


def create_app(listings_file_path=None):
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    repository = ListingsRepository(listings_file_path or config.listings_file)
    health_controller = HealthController(repository)
    listings_controller = ListingsController(repository)

    @app.before_request
    def handle_cors_preflight():
        if request.method == "OPTIONS":
            return ("", 204)

    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers.pop("X-Powered-By", None)
        return response

    @app.get("/health")
    def health():
        return health_controller.check()

    @app.get("/api/cities")
    def cities():
        return listings_controller.cities()

    @app.get("/api/listings")
    def listings():
        parsed = validate_search_query(request.args)
        if not parsed["ok"]:
            return jsonify(
                {"error": parsed["error"], "details": parsed["details"]}
            ), 400
        return listings_controller.search(parsed["value"])

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_err):
        response = jsonify({"error": "Method not allowed"})
        response.status_code = 405
        response.headers["Allow"] = "GET, OPTIONS"
        return response

    @app.errorhandler(Exception)
    def internal_error(err):
        if isinstance(err, HTTPException):
            return err
        if not app.testing:
            print(err)
        return jsonify({"error": "Internal server error"}), 500

    return app
