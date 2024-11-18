from functools import wraps
from flask import request, jsonify
import utils.tasks as USER

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'error': '请登录'}), 401
        current_user = USER.decode_token(token)
        if not current_user:
            return jsonify({'error': '令牌无效或已过期'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def validate_input(fields):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.json
            for field in fields:
                if field not in data or not data[field]:
                    return jsonify({"error": f"Missing or empty field: {field}"}), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator