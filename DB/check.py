from pymongo import MongoClient

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

users = users_collection.find()
print("")
print("")
print("userDB 中的用户列表：")
for user in users:
    print(user)  # 输出每个用户的文档

# # solutions_collection.delete_many({})
# solutions = solutions_collection.find()
# print("")
# print("")
# print("userDB 中的 solution 列表：")
# for solution in solutions:
#     # print(solution)
#     print(solution['_id'])
#     # print(solution['solution']['Function'])
    

# likes = solutions_liked_collection.find()
# print("")
# print("")
# print("solution点赞关系")
# for pair in likes:
#     print(pair)
    
# papers = papers_collection.find().limit(20)
# for paper in papers:
#     print(paper)

# papers_with_cited = papers_collection.find({"Cited": {"$exists": True}}, {"_id": 1, "Cited": 1})
# for paper in papers_with_cited:
#     print(f"_id: {paper['_id']}, Cited: {paper['Cited']}")
    # print(paper)