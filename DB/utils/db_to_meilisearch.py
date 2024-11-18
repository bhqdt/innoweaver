from meilisearch import Client
from pymongo import MongoClient
from bson import ObjectId


MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'papersDB'  
COLLECTION_NAME = 'papersCollection'

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]


def fetch_from_mongodb():
    documents = collection.find()
    data = []
    for doc in documents:
        # 将 ObjectId 转换为字符串
        doc['_id'] = str(doc['_id'])
        data.append(doc)
    
    client.close()
    return data


def insert_to_meilisearch(data):
    meili_client = Client('http://127.0.0.1:7700')
    index = meili_client.index('paper_id')
    
    index.add_documents(data)


mongo_data = fetch_from_mongodb()
insert_to_meilisearch(mongo_data)
