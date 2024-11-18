import os
import json
from pymongo import MongoClient

# import utils.db as DB

MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'papersDB'
COLLECTION_NAME = 'papersCollection'

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

PAPERS_DIR = './data'

# traverse all files in the “papers” directory
#
for filename in os.listdir(PAPERS_DIR):
    if filename.endswith('.json'):
        file_path = os.path.join(PAPERS_DIR, filename)
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                data = json.load(file)
                result = collection.insert_one(data)
                print(f'Inserted file: {filename}, MongoDB ID: {result.inserted_id}')
            except json.JSONDecodeError as e:
                print(f'Error decoding JSON in file: {filename}, Error: {e}')
            except Exception as e:
                print(f'Error processing file: {filename}, Error: {e}')

client.close()
