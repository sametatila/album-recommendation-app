import unittest
import warnings
from flask import json
from flask_testing import TestCase
from app import create_app, mongo
from config import TestingConfig
import mongomock

class AlbumRecommendationTest(TestCase):

    def create_app(self):
        app = create_app()
        app.config.from_object(TestingConfig)
        return app

    def setUp(self):
        self.mock_db = mongomock.MongoClient().db
        self.mock_albums = [
            {
                "album": "LoveSexy",
                "artist": "Prince",
                "album_cover_url": "https://i.scdn.co/image/ab67616d0000b27331ba1f6fd8a1a9941ed878b9",
                "spotify_link": "https://open.spotify.com/album/5y5qXt3zBajSYAPWyF1Q8a",
                "name": "Àlex Loscos",
                "title": "Chief Revenue Officer",
                "genre": ["funk", "funk rock", "minneapolis sound", "rock", "synth funk"]
            },
            {
                "album": "Just As I Am",
                "artist": "Bill Withers",
                "album_cover_url": "https://i.scdn.co/image/ab67616d0000b273e1e350d06ffebd2e19e047ce",
                "spotify_link": "https://open.spotify.com/album/6N8uPmDqbgXD3ztkCCfxoo",
                "name": "Jorge Riveros Muñoz",
                "title": "Customer Experience Manager",
                "genre": ["classic soul", "funk", "quiet storm", "soul"]
            }
        ]
        self.mock_db.albums.insert_many(self.mock_albums)
        self.app = self.create_app().test_client()
        mongo.db = self.mock_db
        warnings.filterwarnings("ignore", category=DeprecationWarning)

    def tearDown(self):
        self.mock_db.albums.drop()

    def test_all_albums(self):
        response = self.app.post('/graphql', data=json.dumps({
            'query': '''
            {
                allAlbums(page: 1, perPage: 10) {
                    albums {
                        album
                        artist
                        album_cover_url
                        spotify_link
                        name
                        title
                        genre
                    }
                    totalCount
                }
            }
            '''
        }), content_type='application/json')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['allAlbums']['albums']), 2)
        self.assertEqual(data['data']['allAlbums']['totalCount'], 2)

    def test_albums_by_genre(self):
        response = self.app.post('/graphql', data=json.dumps({
            'query': '''
            {
                albumsByGenre(genres: ["funk"], page: 1, perPage: 10) {
                    albums {
                        album
                        artist
                        album_cover_url
                        spotify_link
                        name
                        title
                        genre
                    }
                    totalCount
                }
            }
            '''
        }), content_type='application/json')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['data']['albumsByGenre']['albums']), 2)
        self.assertEqual(data['data']['albumsByGenre']['totalCount'], 2)

    def test_search_albums(self):
        response = self.app.get('/api/albums/search?query=LoveSexy')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['album'], 'LoveSexy')
        self.assertEqual(data[0]['artist'], 'Prince')

    def test_no_search_results(self):
        response = self.app.get('/api/albums/search?query=NonExistingAlbum')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 0)

    def test_empty_search_query(self):
        response = self.app.get('/api/albums/search?query=')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 0)

if __name__ == '__main__':
    unittest.main()
