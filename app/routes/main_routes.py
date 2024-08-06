from flask import Blueprint, render_template, jsonify, request
from app import mongo

main_bp = Blueprint('main_bp', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/albums/search', methods=['GET'])
def search_albums():
    query = request.args.get('query')
    albums = mongo.db.albums.find({
        "$or": [
            {"album": {"$regex": query, "$options": "i"}},
            {"artist": {"$regex": query, "$options": "i"}},
            {"name": {"$regex": query, "$options": "i"}},
            {"title": {"$regex": query, "$options": "i"}}
        ]
    })
    result = [
        {
            "album": album["album"],
            "artist": album["artist"],
            "album_cover_url": album.get("album_cover_url", ""),
            "spotify_link": album.get("spotify_link", ""),
            "name": album["name"],
            "title": album["title"],
            "genre": album["genre"]
        }
        for album in albums
    ]
    return jsonify(result), 200
