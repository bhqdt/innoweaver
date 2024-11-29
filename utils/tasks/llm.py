import os
import re
from openai import OpenAI
from dotenv import load_dotenv
import main as MAIN
import rag as RAG
from utils.tasks.config import *
import utils.tasks.task as TASK
import utils.tasks.query_load as QUERY
import json
import time
import requests
from io import BytesIO
from PIL import Image
from typing import Dict, Any

def knowledge(current_user: Dict[str, Any], paper: str) -> Any:
    print(f"用户 {current_user['email']} 正在调用 /api/knowledge")
    
    load_dotenv()
    API_KEY = current_user['api_key']
    print(API_KEY)
    BASE_URL = os.getenv("BASE_URL")

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    result = MAIN.knowledge_extraction(paper, client)
    return result

def query(current_user: Dict[str, Any], query: str, design_doc: str) -> Any:
    print(f"用户 {current_user['email']} 正在调用 /api/query")
    
    load_dotenv()
    API_KEY = current_user['api_key']
    print(API_KEY)
    BASE_URL = os.getenv("BASE_URL")

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    result = MAIN.query_analysis(query, design_doc, client)
    return result

# -------------------------------------------------------------------- #
            
def complete(current_user: Dict[str, Any], query_alaysis_result: Dict[str, Any], query: str) -> Any:
    print(f"用户 {current_user['email']} 正在调用 /api/complete")
    
    load_dotenv()
    # API_KEY = os.getenv("API_KEY")
    API_KEY = current_user['api_key']
    print(API_KEY)
    BASE_URL = os.getenv("BASE_URL")
    SM_MS_API_KEY = os.getenv("SM_MS_API_KEY")

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    # rag
    rag_results = RAG.search_in_meilisearch(query, query_alaysis_result['Requirement'])
    print("rag_results done")
    
    #domain
    domain_knowledge = rag_results.get('hits', [])
    init_solution = MAIN.domain_expert_system(query, domain_knowledge, client)
    # print(init_solution)
    print("domain done")
    
    #interdisciplinary
    iterated_solution = MAIN.interdisciplinary_expert_system(query, domain_knowledge, init_solution, client)
    # print(iterated_solution)
    print("interdisciplinary done")
    
    # Evaluation Expert
    final_solution = MAIN.evaulation_expert_system(query, domain_knowledge, init_solution, iterated_solution, client)
    print("evaluation done")
    final_solution = eval(final_solution) 
    # print("final solution", final_solution)

    target_user =  query_alaysis_result['Target User'] if 'Target User' in query_alaysis_result else 'null'
    print("==============Drawing================")
    for i in range(len(final_solution['solutions'])):
        image = MAIN.drawing_expert_system(target_user, final_solution['solutions'][i]["Use Case"], client)
        
        timestamp = int(time.time())
        response = requests.get(image.url)
        response.raise_for_status()
        image_pillow = Image.open(BytesIO(response.content))

        # 保存图片为临时文件
        temp_image_path = f"./temp_image_{timestamp}.png"
        image_pillow.save(temp_image_path)
        with open(temp_image_path, "rb") as image_file:
            sm_ms_response = requests.post(
                "https://sm.ms/api/v2/upload",
                headers={"Authorization": SM_MS_API_KEY},
                files={"smfile": image_file}
            )
        os.remove(temp_image_path)
        
        if sm_ms_response.status_code == 200 and sm_ms_response.json().get("success"):
            image_url = sm_ms_response.json()["data"]["url"]
            final_solution['solutions'][i]["image_url"] = image_url
            final_solution['solutions'][i]["image_name"] = timestamp
            print(f"Image {i} uploaded: {image_url}")
        else:
            print(f"Failed to upload image {i}: {sm_ms_response.text}")
            
    print("done")

    solution_ids = TASK.insert_solution(current_user, query, final_solution)
    print("insert done")
    TASK.paper_cited(domain_knowledge, solution_ids)
    solutions = []
    for solution_id in solution_ids:
        solution = QUERY.query_solution(solution_id)
        solution = convert_objectid_to_str(solution)
        solutions.append(solution)
    final_solution['solutions'] = solutions
    return final_solution
