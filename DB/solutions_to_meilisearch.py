from meilisearch import Client
from pymongo import MongoClient
from bson.objectid import ObjectId

# 连接 MongoDB
client = MongoClient('mongodb://localhost:27017/')

# 选择或创建 user_management_db 数据库
db = client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

# 便于查询
# user_id, item_id, time
solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 列出所有数据库
db_list = client.list_database_names()
print("现有的 MongoDB 数据库：")
for db_name in db_list:
    print(f"- {db_name}")

# ---------------------------------------------------------------------------

def convert_objectid_to_str(data):
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(element) for element in data]
    elif not isinstance(data, str):
        return str(data)
    else:
        return data
    
    
solutions = solutions_collection.find()
data = []
for item in solutions:
    item = convert_objectid_to_str(item)
    # if item.get('solution') and item['solution'].get('image_url'):
    #     # item['poster'] = item['solution']['image_url']
    #     item['poster'] = 'https://image.tmdb.org/t/p/w500/ojDg0PGvs6R9xYFodRct2kdI6wC.jpg'
    data.append(item)
    
meili_client = Client('http://127.0.0.1:7700')
index = meili_client.index('solution_id')
print(index.get_stats())

task = index.add_documents(data)
print(task)

# test_doc = {
#     "_id": "test123",
#     "title": "Test Document",
#     "description": "This is a test"
# }

# task = index.add_documents([test_doc])
# print(task)
