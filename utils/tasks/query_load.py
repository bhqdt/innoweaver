from bson.objectid import ObjectId
from pymongo import MongoClient
from utils.tasks.config import *
from meilisearch import Client
from typing import Dict, Any, Optional, List

## Query #######################################################################

def query_solution(solution_id: str) -> Optional[Dict[str, Any]]:
    solution = solutions_collection.find_one({'_id': ObjectId(solution_id)}) 
    if(solution):
        solution['id'] = solution_id
        solution['user_id'] = str(solution['user_id'])
        del solution['_id']
        cited_paper_id = load_paper_cited_by_solution(solution_id)
        solution['cited_papers'] = cited_paper_id
        return solution
    else:
        return None

def query_liked_solution(user_id: str, solution_id: str) -> bool:
    relations = solutions_liked_collection.find({'user_id': ObjectId(user_id)}) 
    for relation in relations:
        id = str(relation['solution_id'])
        if(id == solution_id):
            return True
    return False

def query_paper(paper_id: str) -> Optional[Dict[str, Any]]:
    paper = papers_collection.find_one({'_id': ObjectId(paper_id)})
    if(paper):
        paper['id'] = str(paper['_id'])
        del paper['_id']
        return paper
    else:
        return None

## Load ########################################################################

def gallery(page: int = 1) -> List[Dict[str, Any]]:
    # solutions = solutions_collection.find()
    items_per_page = 10
    skip = (page - 1) * items_per_page
    solutions = solutions_collection.find().skip(skip).limit(items_per_page)
    
    result = [{
        "id": str(solution['_id']),
        "user_id": str(solution['user_id']),
        'query': solution['query'], 
        'solution': solution['solution'], 
        'timestamp': solution['timestamp']
    } for solution in solutions]
    return result
    
def load_solutions(user_id: str, page: int = 1) -> List[Dict[str, Any]]:
    # solutions = solutions_collection.find({'user_email': current_user['email']}) 
    items_per_page = 10
    skip = (page - 1) * items_per_page
    solutions = solutions_collection.find({'user_id': ObjectId(user_id)}).skip(skip).limit(items_per_page)
    
    result = [{
        "id": str(solution['_id']),
        "user_id": str(solution['user_id']),
        'query': solution['query'], 
        'solution': solution['solution'], 
        'timestamp': solution['timestamp']
    } for solution in solutions]
    return result

def load_liked_solutions(user_id: str, page: int = 1) -> List[Dict[str, Any]]:
    # relations = solutions_liked_collection.find({'user_id': ObjectId(user_id)}) 
    items_per_page = 10
    skip = (page - 1) * items_per_page
    relations = solutions_liked_collection.find({'user_id': ObjectId(user_id)}).skip(skip).limit(items_per_page)
    
    result = []
    for relation in relations:
        id = str(relation['solution_id'])
        solution = query_solution(id)
        result.append(solution)
    return result

def load_paper_cited_by_solution(solution_id: str) -> List[str]:
    relations = papers_cited_collection.find({'solution_id': ObjectId(solution_id)})
    
    result = []
    for relation in relations:
        id = str(relation['paper_id'])
        result.append(id)
    return result
