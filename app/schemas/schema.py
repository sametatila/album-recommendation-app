from ariadne import QueryType, gql
from app.models.album_model import AlbumModel

type_defs = gql("""
    type Album {
        album: String!
        artist: String!
        album_cover_url: String
        spotify_link: String
        name: String
        title: String
        genre: [String]!
    }

    type AlbumPage {
        albums: [Album]!
        totalCount: Int!
    }

    type Query {
        albumsByGenre(genres: [String!]!, page: Int!, perPage: Int!): AlbumPage!
        allAlbums(page: Int!, perPage: Int!): AlbumPage!
    }
""")

query = QueryType()

@query.field("albumsByGenre")
def resolve_albums_by_genre(_, info, genres, page, perPage):
    db = info.context["db"]
    album_model = AlbumModel(db)
    skip = (page - 1) * perPage
    cursor = album_model.find_albums_by_genre(genres).skip(skip).limit(perPage)
    total_count = album_model.count_albums_by_genre(genres)
    albums = list(cursor)
    return {
        "albums": [
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
        ],
        "totalCount": total_count
    }

@query.field("allAlbums")
def resolve_all_albums(_, info, page, perPage):
    db = info.context["db"]
    album_model = AlbumModel(db)
    skip = (page - 1) * perPage
    cursor = album_model.get_all_albums().skip(skip).limit(perPage)
    total_count = album_model.count_all_albums()
    albums = list(cursor)
    return {
        "albums": [
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
        ],
        "totalCount": total_count
    }
