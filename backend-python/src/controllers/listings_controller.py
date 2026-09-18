from flask import jsonify
from services.search_service import search_listings, to_public_listing, unique_cities


class ListingsController:
    def __init__(self, repository):
        self.repository = repository

    def search(self, query):
        listings = self.repository.get_all()
        result = search_listings(listings, query)
        return jsonify(
            {
                "results": [to_public_listing(row) for row in result["results"]],
                "page": result["page"],
                "pageSize": result["pageSize"],
                "total": result["total"],
                "totalPages": result["totalPages"],
            }
        ), 200

    def cities(self):
        listings = self.repository.get_all()
        return jsonify({"cities": unique_cities(listings)}), 200
