from flask import Flask
from flask_pymongo import PyMongo
from config import Config

mongo = PyMongo()

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(Config)

    mongo.init_app(app)

    with app.app_context():
        # Register Blueprints
        from app.routes.main_routes import main_bp
        from app.routes.graphql_routes import graphql_bp
        app.register_blueprint(main_bp)
        app.register_blueprint(graphql_bp)

    return app
