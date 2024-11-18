from celery import Celery, chain
import requests
from io import BytesIO
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv
from flask import request, jsonify, current_app

import main as MAIN
import rag as RAG
from utils.redis import *
from utils.tasks.config import *
import utils.tasks.query_load as QUERY
import utils.tasks.task as TASK

# ----------------------------------------------------------------------------------------

def make_celery():
    celery = Celery(
        __name__,
        backend='redis://localhost:6379/0',
        broker='redis://localhost:6379/1'
    )
    # celery.conf.update(app.config)
    return celery

celery = make_celery()

# ----------------------------------------------------------------------------------------

@celery.task
def initialize_task_task(current_user, data):
    try:
        task_id = start_task(current_user)
        update_task_status(task_id, "Initialized task", 10)
        query_analysis_result = json.loads(data)
        query = query_analysis_result.get("Query")
        update_task_status(task_id, "started", 10, {"query_analysis_result": query_analysis_result})
        update_task_status(task_id, "started", 10, {"query": query})
        return {"status": "started", "task_id": task_id, "progress": 10}
    
    except Exception as e:
        delete_task(task_id)
        return {"status": "error", "message": str(e)}

@celery.task
def rag_step_task(current_user, task_id):
    try:
        task_data = json.loads(redis_client.get(task_id) or "{}")
        query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
        query = task_data.get("result", {}).get("query")

        rag_results = RAG.search_in_meilisearch(query, query_analysis_result.get("Requirement", ""))
        update_task_status(task_id, "RAG step completed", 30, {"rag_results": rag_results})
        
        return {"status": "in_progress", "task_id": task_id, "progress": 30}
    except Exception as e:
        delete_task(task_id)
        return {"status": "error", "message": str(e)}

@celery.task
def domain_step_task(current_user, task_id):
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
        return jsonify({"status": "error", "message": str(e)}), 500

@celery.task
def interdisciplinary_step_task(current_user, task_id):
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
        return jsonify({"status": "error", "message": str(e)}), 500

@celery.task
def evaluation_step_task(current_user, task_id):
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
        return jsonify({"status": "error", "message": str(e)}), 500

@celery.task
def drawing_step_task(current_user, task_id):
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
            timestamp = int(time.time())
            temp_image_path = f"./temp_image_{timestamp}.jpg"
            image_pillow.save(temp_image_path, "JPEG", optimize=True, quality=30)
            
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
        
        # update_task_status(task_id, "Drawing step completed", 100, {"final_solution": final_solution})
        # return jsonify({"status": "completed", "task_id": task_id, "progress": 100})
        update_task_status(task_id, "Drawing step completed", 99, {"final_solution": final_solution})
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 99})
        
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Drawing step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

@celery.task
def final_step_task(current_user, task_id):
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
        
        # delete_task(task_id)
        # return jsonify(final_solution)
        update_task_status(task_id, "Completed", 100, {"final_solution": final_solution})
        return jsonify({"status": "completed", "task_id": task_id, "progress": 100})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Final step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

# ------------------------------------------------------------------------
