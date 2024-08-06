class AlbumModel:
    def __init__(self, db):
        self.db = db
        self.collection = db.albums

    def insert_albums(self, albums):
        self.collection.insert_many(albums)

    def find_albums_by_genre(self, genres):
        return self.collection.find({"genre": {"$in": genres}})

    def count_albums_by_genre(self, genres):
        return self.collection.count_documents({"genre": {"$in": genres}})

    def get_all_albums(self):
        return self.collection.find({})

    def count_all_albums(self):
        return self.collection.count_documents({})
