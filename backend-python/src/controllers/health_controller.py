from flask import jsonify


class HealthController:
    def __init__(self, repository):
        self.repository = repository

    def check(self):
        try:
            self.repository.get_all()
            return jsonify({"status": "ok"}), 200
        except Exception:
            return jsonify({"status": "unavailable"}), 503
