from flask import Blueprint, request, jsonify
import rag as RAG
import json
import os
import requests
from io import BytesIO
from PIL import Image
import time
from openai import OpenAI
from dotenv import load_dotenv

# -----------------------------------

import main as MAIN
import utils.tasks as USER
from utils.auth_utils import token_required
# import utils.tasks.llm as MAIN
import utils.tasks.query_load as QUERY
from utils.tasks.config import *
import utils.tasks.task as TASK

from utils.redis import *
from utils.celery import *

# -----------------------------------

task_bp = Blueprint('query', __name__)

@task_bp.route('/api/knowledge_extraction', methods=['POST'])
@token_required
def knowledge(current_user):
    data = request.json
    paper = data['paper']
    
    print(paper)
    result = USER.knowledge(current_user, paper)
    return jsonify(result)

@task_bp.route('/api/query', methods=['POST'])
@token_required
def query(current_user):
    data = request.json
    query = data.get('query', '')
    design_doc = data.get('design_doc', '')
    
    result = USER.query(current_user, query, design_doc)
    return jsonify(result)

@task_bp.route('/api/complete', methods=['POST'])
@token_required
def complete(current_user):
    try:
        data = request.json
        current_user = convert_objectid_to_str(current_user)
        
        task_id = start_task(current_user)
        update_task_status(task_id, "Initialized task", 10)
        query_analysis_result = data
        query = query_analysis_result.get("Query")
        
        update_task_status(task_id, "started", 10, {"query_analysis_result": query_analysis_result})
        update_task_status(task_id, "started", 10, {"query": query})
        
        task_chain = chain(
            rag_step_task.s(current_user, task_id),
            domain_step_task.s(current_user, task_id),
            interdisciplinary_step_task.s(current_user, task_id),
            evaluation_step_task.s(current_user, task_id),
            drawing_step_task.s(current_user, task_id),
            final_step_task.s(current_user, task_id)
        )
        print(task_id)
        
        result = task_chain.apply_async()
        print(task_id)
        return jsonify({"task_id": task_id}), 202
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to initialize task chain"}), 500
    
# 点赞/取消点赞
@task_bp.route('/api/user/like_solution', methods=['POST'])
@token_required
def like_solution(current_user):
    try:
        data = request.json
        solution_id = data['_id']
        response, status_code = USER.like_solution(current_user['_id'], solution_id)
        return jsonify(response), status_code
    except KeyError:
            return jsonify({"error": "Missing solution ID in request data"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while liking/unliking the solution", "details": str(e)}), 500
    
@task_bp.route('/api/user/api_key', methods=['POST'])
@token_required
def set_apikey(current_user):
    try:
        data = request.json
        api_key = data['api_key']
        response, status_code = USER.set_apikey(current_user, api_key)
        return jsonify(response), status_code
    except KeyError:
            return jsonify({"error": "Missing api_key in request data"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while set api_key", "details": str(e)}), 500
    
# ------------------------------------------------------------------------

@task_bp.route('/api/complete/initialize', methods=['POST'])
@token_required
def initialize_task(current_user):
    data = request.json.get("data", {})
    try:
        task_id = start_task(current_user)
        update_task_status(task_id, "Initialized task", 10)
        
        query_analysis_result = json.loads(data)
        query = query_analysis_result.get("Query")
        update_task_status(task_id, "started", 10, {"query_analysis_result": query_analysis_result})
        update_task_status(task_id, "started", 10, {"query": query})
        
        return jsonify({"status": "started", "task_id": task_id, "progress": 10})
    except Exception as e:
        delete_task(task_id)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/rag', methods=['POST'])
@token_required
def rag_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        
        rag_results = RAG.search_in_meilisearch(query, query_analysis_result.get("Requirement", ""))
        update_task_status(task_id, "RAG step completed", 30, {"rag_results": rag_results})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 30})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "RAG step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/paper', methods=['POST'])
@token_required
def paper_step(current_user):
    data = request.json.get("data", {})
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        
        # List of Papers ID
        paper_ids = json.loads(data)
        papers = [QUERY.query_paper(paper_id) for paper_id in paper_ids]
        rag_results = {
            "hits": [{"paper_id": paper_id, "content": paper} for paper_id, paper in zip(paper_ids, papers)]
        }
        update_task_status(task_id, "RAG step completed", 30, {"rag_results": rag_results})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 30})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "RAG step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/example', methods=['POST'])
@token_required
def example_step(current_user):
    data = request.json.get("data", {})
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        
        # List of Solutions ID
        solution_ids = json.loads(data)
        solutions = [QUERY.query_solution(solution_id) for solution_id in solution_ids]
        rag_results = {
            "hits": [{"solution_id": solution_id, "content": solution} for solution_id, solution in zip(solution_ids, solutions)]
        }
        update_task_status(task_id, "example step completed", 30, {"rag_results": rag_results})
        client = OpenAI(api_key=current_user['api_key'], base_url=os.getenv("BASE_URL"))
        
        init_solution = MAIN.solution_example_system(query, solutions, client)
        print(init_solution)
        
        update_task_status(task_id, "example step completed", 50, {"init_solution": init_solution})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 50})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "example step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/domain', methods=['POST'])
@token_required
def domain_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        rag_results = task_data.get("result", {}).get("rag_results", {})
        domain_knowledge = rag_results.get('hits', [])
        client = OpenAI(api_key=current_user['api_key'], base_url=os.getenv("BASE_URL"))
        
        init_solution = MAIN.domain_expert_system(query, domain_knowledge, client)
        update_task_status(task_id, "Domain expert system completed", 50, {"init_solution": init_solution})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 50})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Domain step failed", 50)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/interdisciplinary', methods=['POST'])
@token_required
def interdisciplinary_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        domain_knowledge = task_data.get("result", {}).get("rag_results", {}).get("hits", [])
        init_solution = task_data.get("result", {}).get("init_solution")
        client = OpenAI(api_key=current_user['api_key'], base_url=os.getenv("BASE_URL"))
        
        iterated_solution = MAIN.interdisciplinary_expert_system(query, domain_knowledge, init_solution, client)
        update_task_status(task_id, "Interdisciplinary expert system completed", 70, {"iterated_solution": iterated_solution})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 70})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Interdisciplinary step failed", 70)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/evaluation', methods=['POST'])
@token_required
def evaluation_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        domain_knowledge = task_data.get("result", {}).get("rag_results", {}).get("hits", [])
        init_solution = task_data.get("result", {}).get("init_solution")
        iterated_solution = task_data.get("result", {}).get("iterated_solution")
        client = OpenAI(api_key=current_user['api_key'], base_url=os.getenv("BASE_URL"))
        
        final_solution = MAIN.evaluation_expert_system(query, domain_knowledge, init_solution, iterated_solution, client)
        update_task_status(task_id, "Evaluation step completed", 90, {"final_solution": final_solution})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 90})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Evaluation step failed", 90)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

# ------------------------------------------------------------------------

@task_bp.route('/api/complete/drawing', methods=['POST'])
@token_required
def drawing_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        final_solution = task_data.get("result", {}).get("final_solution")
        final_solution = solution_eval(final_solution)

        if not final_solution or "solutions" not in final_solution:
            raise ValueError("final_solution 解析失败或不包含 'solutions' 字段")

        target_user = query_analysis_result.get('Target User', 'null')
        client = OpenAI(api_key=current_user['api_key'], base_url=os.getenv("BASE_URL"))
        SM_MS_API_KEY = os.getenv("SM_MS_API_KEY")
        
        for i, solution in enumerate(final_solution["solutions"]):
            image = MAIN.drawing_expert_system(target_user, solution.get("Use Case"), client)
            response = requests.get(image.url)
            response.raise_for_status()
            image_pillow = Image.open(BytesIO(response.content))
            
            # Save and upload image
            image_format = "JPEG" if image.url.lower().endswith(".jpg") else "PNG"
            timestamp = int(time.time())
            temp_image_path = f"./temp_image_{timestamp}.{image_format.lower()}"

            # Save and optimize image
            if image_format == "JPEG":
                save_options = {"optimize": True, "quality": 30}
            else:
                save_options = {"optimize": True, "compress_level": 6} 
            image_pillow.save(temp_image_path, image_format, **save_options)
            
            with open(temp_image_path, "rb") as image_file:
                sm_ms_response = requests.post(
                    "https://sm.ms/api/v2/upload",
                    headers={"Authorization": SM_MS_API_KEY},
                    files={"smfile": image_file}
                )
            os.remove(temp_image_path)
            
            if sm_ms_response.status_code == 200 and sm_ms_response.json().get("success"):
                image_url = sm_ms_response.json()["data"]["url"]
                final_solution["solutions"][i]["image_url"] = image_url
                final_solution["solutions"][i]["image_name"] = timestamp
        
        update_task_status(task_id, "Drawing step completed", 100, {"final_solution": final_solution})
        return jsonify({"status": "completed", "task_id": task_id, "progress": 100})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Drawing step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/final', methods=['POST'])
@token_required
def final_step(current_user):
    task_id = request.json.get("task_id")
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")
        domain_knowledge = task_data.get("result", {}).get("rag_results", {}).get("hits", [])
        final_solution = task_data.get("result", {}).get("final_solution")
        final_solution = solution_eval(final_solution)

        if not final_solution:
            raise ValueError("final_solution 解析失败或无效")

        solution_ids = TASK.insert_solution(current_user, query, final_solution)
        print("insert done")
        TASK.paper_cited(domain_knowledge, solution_ids)
        solutions = []
        for solution_id in solution_ids:
            solution = QUERY.query_solution(solution_id)
            solution = convert_objectid_to_str(solution)
            solutions.append(solution)
        final_solution['solutions'] = solutions
        
        delete_task(task_id)
        return jsonify(final_solution)
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Final step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
        
# ------------------------------------------------------------------------

@task_bp.route('/api/complete/status/<task_id>', methods=['GET'])
def task_status(task_id):
    task_data = redis_client.get(task_id)
    if task_data:
        return jsonify(json.loads(task_data))
    else:
        return jsonify({"status": "unknown", "progress": 0})
    
# @task_bp.route('/api/complete/get/<task_id>', methods=['GET'])
# def get_task(task_id):
#     task_data = redis_client.get(task_id)
#     if task_data:
#         return jsonify(json.loads(task_data))
#     else:
#         return jsonify({"status": "unknown", "progress": 0})