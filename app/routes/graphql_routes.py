from flask import Blueprint, jsonify, request, send_from_directory
from ariadne import graphql_sync, make_executable_schema, gql
from app.schemas.schema import type_defs, query
from app import mongo

graphql_bp = Blueprint('graphql_bp', __name__)
schema = make_executable_schema(type_defs, query)

@graphql_bp.route('/graphql', methods=['GET'])
def graphql_playground():
    return send_from_directory('static', 'playground.html')

@graphql_bp.route('/graphql', methods=['POST'])
def graphql_server():
    data = request.get_json()
    success, result = graphql_sync(schema, data, context_value={"db": mongo.db})
    status_code = 200 if success else 400
    return jsonify(result), status_code
