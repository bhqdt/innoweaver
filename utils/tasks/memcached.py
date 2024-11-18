import memcache
import os
import time

mem_cache = memcache.Client([os.getenv("MEMCACHED_HOST", "127.0.0.1:11211")], debug=0)

# ----------------------------------------------------------------------------------------

def start_task(current_user):
    task_id = str(int(time.time() * 1000))
    task_data = {"status": "started", "progress": 0, "result": {}}
    mem_cache.set(task_id, task_data)
    return task_id

def update_task_status(task_id, status, progress, result=None):
    task_data = mem_cache.get(task_id)
    if task_data:
        task_data.update({"status": status, "progress": progress})
        if result:
            task_data["result"].update(result)
        mem_cache.set(task_id, task_data)

def delete_task(task_id):
    mem_cache.delete(task_id)

# ----------------------------------------------------------------------------------------
