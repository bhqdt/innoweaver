import re
import time
import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from meilisearch import Client
from utils.tasks.config import *
from utils.tasks.query_load import *
import base64

################################################################################

def get_formatted_time():
    # china_tz = timezone(timedelta(hours=8))
    # current_time = datetime.now(china_tz)
    current_time = datetime.datetime.utcnow()
    formatted_time = current_time.strftime('%Y-%m-%dT%H:%M:%SZ')
    return formatted_time

def update_paper_to_meilisearch(paper):
    if paper:
        paper = convert_objectid_to_str(paper)
        meili_client = Client('http://127.0.0.1:7700')
        index = meili_client.index('paper_id')
        index.add_documents([paper])        

def update_solution_to_meilisearch(solution):
    if solution:
        solution = convert_objectid_to_str(solution)
        meili_client = Client('http://127.0.0.1:7700')
        index = meili_client.index('solution_id')
        task = index.add_documents([solution])        
        
def update_user_to_meilisearch(user):
    if user:
        user = convert_objectid_to_str(user)
        meili_client = Client('http://127.0.0.1:7700')
        index = meili_client.index('user_id')
        index.add_documents([user])        
        
## Insert & Delete #############################################################

def insert_solution(current_user, query, final_solution):
    results = []
    user_id = current_user.get('_id')
    solutions = final_solution['solutions']
    for solution in solutions:
        data = {
            "user_id": ObjectId(user_id),
            "query": query,
            "solution": solution,
            "timestamp": int(time.time())
        }
        result = solutions_collection.insert_one(data)
        results.append(result.inserted_id)
        
        temp = solutions_collection.find_one({'_id': result.inserted_id})
        update_solution_to_meilisearch(temp)
        
    print(f"新文档已插入，ID: {results}")
    return results

def delete_solution(solution):
    solution_id = solution.get('_id')
    if solution_id:
        result = solutions_collection.delete_one({'_id': ObjectId(solution_id)})
        if result.deleted_count > 0:
            print(f"解决方案已删除，ID: {solution_id}")
            
            cited_result = papers_cited_collection.delete_many({'solution_id': ObjectId(solution_id)})
            print(f"引用记录已删除 {cited_result.deleted_count} 条，Solution ID: {solution_id}")
            
            meili_client = Client('http://127.0.0.1:7700')
            index = meili_client.index('solution_id')
            meili_delete_result = index.delete_document(str(solution_id))  # 将 ObjectId 转为字符串
            
            print(f"MeiliSearch 同步删除 Solution，ID: {solution_id}")
            return True
        else:
            print(f"未找到要删除的解决方案，ID: {solution_id}")
            return False
    else:
        print("无效的解决方案 ID")
        return False

## Task ########################################################################

def paper_cited(papers, solution_ids):
    formatted_time = get_formatted_time()
    
    for paper in papers:
        paper_id = paper.get('_id')
        if paper_id:
            updated_paper = papers_collection.find_one_and_update(
                {'_id': ObjectId(paper_id)},
                {'$inc': {'Cited': 1}},
                return_document=True
            )      
            # 数据同步到 meilisearch      
            update_paper_to_meilisearch(updated_paper)
            
            for solution_id in solution_ids:
                # solution_id = solution.get('_id')
                relation = papers_cited_collection.insert_one({
                    'paper_id': ObjectId(paper_id),
                    'solution_id': ObjectId(solution_id),
                    'time': formatted_time
                })
            
def like_paper(paper, user):
    paper_id = paper.get('_id')
    user_id = user.get('_id')
    if paper_id & user_id:
        updated_paper = papers_collection.find_one_and_update(
            {'_id': ObjectId(paper_id)},
            {'$inc': {'Liked': 1}},
            return_document=True
        )
        # 数据同步到 meilisearch      
        update_paper_to_meilisearch(updated_paper)
        
        relation = papers_liked_collection.insert_one({
            'user_id': ObjectId(user_id),
            'paper_id': ObjectId(paper_id),
            'time': get_formatted_time()
        })

def like_solution(user_id: str, solution_id: str):
    if (solution_id is None) or (user_id is None):
        return {
            'message': '失败',
            'user_id': str(user_id),
            'solution_id': str(solution_id),
        }, 400
        
    is_exist = query_liked_solution(user_id, solution_id)
    if(is_exist):
        updated_solution = solutions_collection.find_one_and_update(
            {'_id': ObjectId(solution_id)},
            {'$inc': {'Liked': -1}},
            return_document=True
        )
        solutions_liked_collection.delete_one({
            'user_id': ObjectId(user_id),
            'solution_id': ObjectId(solution_id)
        })
        return {
            'message': '取消点赞',
            'user_id': str(user_id),
            'solution_id': str(solution_id),
        }, 200
    
    #-----------------------------------------------------------#
    
    updated_solution = solutions_collection.find_one_and_update(
        {'_id': ObjectId(solution_id)},
        {'$inc': {'Liked': 1}},
        return_document=True
    )
    relation = solutions_liked_collection.insert_one({
        'user_id': ObjectId(user_id),
        'solution_id': ObjectId(solution_id),
        'time': get_formatted_time()
    })    
    return {
        'message': '点赞成功',
        'user_id': str(user_id),
        'solution_id': str(solution_id),
    }, 200

## API-Key ########################################################################

def validate_apikey(api_key):
    # OpenAI API key 的格式通常为以 'sk-' 开头，并跟随 48 个字符 (字母和数字)
    pattern = r'^sk-[A-Za-z0-9]{47,48}$'
    if re.match(pattern, api_key):
        return True
    return False

def set_apikey(current_user, api_key):
    if not validate_apikey(api_key):
        return {'error': '无效的 OpenAI API key'}, 400
    
    result = users_collection.update_one(
        {'email': current_user['email']},
        {'$set': {'api_key': api_key}}
    )
    
    if result.modified_count == 1:
        return {'message': 'API key 设置成功'}, 200
    else:
        return {'error': 'API key 设置失败，用户不存在'}, 404
    return result, 200
