import os

class Config:
    MONGO_URI = os.environ.get('MONGO_URI') or 'your_mongo_uri'
    DEBUG = os.environ.get('DEBUG') or True
    SPOTIPY_CLIENT_ID = os.environ.get('SPOTIPY_CLIENT_ID') or 'your_client_id'
    SPOTIPY_CLIENT_SECRET = os.environ.get('SPOTIPY_CLIENT_SECRET') or 'your_client_secret'

class ProductionConfig(Config):
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
