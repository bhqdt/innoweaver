from pymongo import MongoClient

# 连接 MongoDB
client = MongoClient('mongodb://localhost:27017/')

db = client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 列出所有数据库
db_list = client.list_database_names()
print("现有的 MongoDB 数据库：")
for db_name in db_list:
    print(f"- {db_name}")

# papers_with_cited = papers_collection.find({"Cited": {"$exists": True}}, {"_id": 1, "Cited": 1})
# for paper in papers_with_cited:
#     print(f"_id: {paper['_id']}, Cited: {paper['Cited']}")

# relation_list = papers_cited_collection.find()
# for relation in relation_list:
    # print(relation)
    
def print_out(collection):
    list = collection.find()
    for element in list:
        print(element)
        
# print_out(solutions_collection)

# ------------------------------------------------------------------------------------------------------------- #

papers_collection.update_many(
    {},  # 匹配所有文档
    {
        "$unset": {"cited": "", "liked": ""},  # 删除 'cited' 和 'liked' 字段
        "$set": {"Cited": 0, "Liked": 0}  # 设置 'Cited' 和 'Liked' 为 0
    }
)
print("所有文档的 'Cited' 和 'Liked' 字段已更新为 0。")

# 清空 papers_cited_collection 集合中的所有文档
papers_cited_collection.delete_many({})

# 清空 solution 和 user
users_collection.delete_many({})
solutions_collection.delete_many({})
solutions_liked_collection.delete_many({})

print_out(papers_cited_collection)
print_out(solutions_collection)
print_out(solutions_liked_collection)