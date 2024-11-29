import jwt
import datetime
import bcrypt
from pymongo import MongoClient
from utils.tasks.config import *
import json
from utils.tasks.task import update_user_to_meilisearch
from typing import Dict, Tuple, Optional

def register_user(email: str, name: str, password: str, user_type: str) -> Tuple[Dict[str, str], int]:
    if not email or not name or not password or not user_type:
        return {'error': '邮箱、用户名、密码和账号类型是必需的'}, 400
    if user_type not in ALLOWED_USER_TYPES:
        return {'error': '无效的账号类型'}, 400
    if users_collection.find_one({'email': email}):
        return {'error': '该邮箱已被注册'}, 400
    
    # print(email, name, password, user_type)
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = {
        'email': email,
        'name': name,
        'password': hashed_password,
        'user_type': user_type
    }
    print(user)
    insert = users_collection.insert_one(user)
    result = users_collection.find_one({'_id': insert.inserted_id})
    update_user_to_meilisearch(result)
    return {'message': '注册成功'}, 201

def login_user(email: str, password: str) -> Tuple[Dict[str, str], int]:
    if not email or not password:
        return {'error': '邮箱和密码是必需的'}, 400
    # 查找用户
    user = users_collection.find_one({'email': email})
    if not user:
        return {'error': '用户不存在'}, 404
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return {'error': '密码错误'}, 401
    token = jwt.encode({
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # 令牌有效期 24 小时
    }, SECRET_KEY, algorithm='HS256')
    
    user_data = {key: str(value) if key == '_id' else value for key, value in user.items() if key != 'password'}
    return {
        'message': '登录成功',
        'token': token,
        'user': user_data
    }, 200

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        # 解析 JWT 令牌
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        current_user = users_collection.find_one({'email': data['email']})
        return current_user
    except jwt.ExpiredSignatureError:
        return None  # 令牌已过期
    except jwt.InvalidTokenError:
        return None  # 令牌无效