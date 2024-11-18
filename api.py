from fastapi import FastAPI
from pymongo import MongoClient
from bson import ObjectId
import requests
# import utils.db as DB

app = FastAPI()


MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'papersDB'  
COLLECTION_NAME = 'papersCollection'

# MeiliSearch 配置
MEILISEARCH_URL = "http://127.0.0.1:7700"
MEILISEARCH_INDEX = "paper_id"
# MASTER_KEY = "your_master_key"  

# 连接 MongoDB
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

def serialize_object_id(document):
    """ 将 MongoDB 的 ObjectId 转换为字符串 """
    if isinstance(document, dict):
        for key, value in document.items():
            if isinstance(value, ObjectId):
                document[key] = str(value)
            elif isinstance(value, dict):
                serialize_object_id(value)
            elif isinstance(value, list):
                for i in range(len(value)):
                    if isinstance(value[i], ObjectId):
                        value[i] = str(value[i])
                    elif isinstance(value[i], dict):
                        serialize_object_id(value[i])
    return document

@app.get("/import")
async def import_data_to_meilisearch():
    # 从 MongoDB 获取数据
    documents = list(collection.find({}))  # 你可以根据需求过滤数据
    documents = [serialize_object_id(doc) for doc in documents]

    # 将数据发送到 MeiliSearch
    # headers = {"Authorization": f"Bearer {MASTER_KEY}"}
    url = f"{MEILISEARCH_URL}/indexes/{MEILISEARCH_INDEX}/documents"
    response = requests.post(url, json=documents)

    if response.status_code == 202:
        return {"status": "success", "message": "Data is being indexed."}
    else:
        return {"status": "error", "message": response.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
