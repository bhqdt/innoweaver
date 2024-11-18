from flask import Blueprint, request, jsonify
import json
import utils.tasks as USER
from utils.auth_utils import token_required

load_bp = Blueprint('load', __name__)

@load_bp.route('/api/user/load_solutions', methods=['GET'])
@token_required
def load_user_solutions(current_user):
    try:
        page = request.args.get('page', default=1, type=int)
        user_solutions = USER.load_solutions(current_user['_id'], page)
        return jsonify(user_solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading user solutions", "details": str(e)}), 500

@load_bp.route('/api/user/load_liked_solutions', methods=['GET'])
@token_required
def load_user_liked_solutions(current_user):
    try:
        page = request.args.get('page', default=1, type=int)
        user_solutions = USER.load_liked_solutions(current_user['_id'], page)
        return jsonify(user_solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading liked solutions", "details": str(e)}), 500

@load_bp.route('/api/gallery', methods=['GET'])
def gallery():
    try:
        page = request.args.get('page', default=1, type=int)
        solutions = USER.gallery(page)
        return jsonify(solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading the gallery", "details": str(e)}), 500
