from locust import HttpUser, task, between
import json
import time

CONTEXT = """
用户调研文档
1. 项目背景
随着自动驾驶技术的发展，驾驶员在车辆行驶过程中的角色逐渐从操作者转变为监督者。为了确保行车安全，需要开发一种驾驶员提醒系统，以确保驾驶员在必要时能够及时接管车辆控制。

2. 调研目的
本调研旨在了解潜在用户对自动驾驶车辆驾驶员提醒系统的需求和期望，以便设计和开发符合用户需求的产品。

3. 目标用户
3.1 用户群体
经常使用自动驾驶功能的用户
对新技术持开放态度的用户
对行车安全有高要求的用户
3.2 用户特征
年龄：25-55岁
职业：不限，但倾向于技术行业工作者或经常需要长途驾驶的商务人士
驾驶经验：至少5年驾驶经验
4. 调研方法
4.1 调研工具
在线问卷
面对面访谈
焦点小组讨论
4.2 数据收集
用户行为观察
用户反馈收集
竞品分析
5. 调研问题
5.1 用户需求
用户在使用自动驾驶功能时最担心的问题是什么？
用户希望在何种情况下接收提醒？
用户偏好的提醒方式是什么（声音、视觉、触觉）？
5.2 用户期望
用户对提醒系统的响应时间有何期望？
用户希望提醒系统具备哪些智能特性（如疲劳监测、注意力监测）？
5.3 用户体验
用户在使用类似系统时遇到过哪些问题？
用户对现有自动驾驶车辆提醒系统的满意度如何？
6. 调研结果
6.1 用户需求总结
用户普遍担心在紧急情况下无法及时接管车辆。
用户期望在车辆即将超出自动驾驶范围、系统检测到驾驶员疲劳或注意力不集中时接收提醒。
用户偏好多种提醒方式，包括声音警报、视觉提示和座椅震动。
"""

QUERY = """
我对音乐疗法很感兴趣，准备想如何把音乐疗法用于治疗抑郁症等心理疾病，目的是通过音乐疗法来帮助患者缓解心理压力，提高生活质量。我们需要考虑用户体验，然后最好结合当下流行的AIGC等AI技术，来提高音乐疗法的效果
"""

class WebsiteUser(HttpUser):
    wait_time = between(1, 2)

    def login(self):
        email = "CHI2025"
        password = "Inlab2024!"
        payload = {
            "email": email,
            "password": password
        }
        with self.client.post("/api/login", 
                              data=json.dumps(payload), 
                              headers={"Content-Type": "application/json"}, 
                              catch_response=True) as response:
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response text: {response.text}")
            if "application/json" in response.headers.get("Content-Type", ""):
                if response.status_code == 200:
                    try:
                        result = response.json()
                        self.token = result.get("token")
                        print(f"Login successful, token acquired, {self.token}")
                    except json.JSONDecodeError:
                        response.failure("Failed to parse JSON response")
                else:
                    response.failure(f"Login failed: {response.status_code}, {response.text}")
            elif "text/html" in response.headers.get("Content-Type", ""):
                response.failure(f"Unexpected HTML response: {response.status_code}, {response.text}")
            else:
                response.failure(f"Unexpected response type: {response.headers.get('Content-Type')}, {response.text}")

    def visit_gallery(self, page):
        with self.client.get(f"/api/gallery?page={page}", 
                             headers={"Content-Type": "application/json"}, 
                             catch_response=True) as response:
            if response.status_code == 200:
                print(f"Visited /api/gallery?page={page} successfully")
            else:
                response.failure(f"Failed to visit /api/gallery?page={page}: {response.status_code}")

    def query_analysis(self):
        token = self.token
        payload = {
            "query": QUERY,
            "design_doc": CONTEXT
        }
        with self.client.post("/api/query", 
                              data=json.dumps(payload), 
                              headers={
                                  "Content-Type": "application/json",
                                  "Authorization": f"Bearer {token}"
                              }, 
                              catch_response=True) as response:
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response text: {response.text}")
            if response.status_code == 200:
                query_analysis_result = response.json()
                print("Query analysis successful")
                self.complete(query_analysis_result)
            else:
                if response.status_code == 401:
                    print("Unauthorized, triggering logout")
                response.failure(f"Query analysis failed: {response.status_code}, {response.text}")
    
    def complete(self, query_analysis_result):
        token = self.token
        with self.client.post("/api/complete",
                              data=json.dumps(query_analysis_result),
                              headers={
                                  "Content-Type": "application/json",
                                  "Authorization": f"Bearer {token}"
                              },
                              catch_response=True) as response:
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response text: {response.text}")
            if response.status_code == 200:
                print("Complete request successful")
            else:
                if response.status_code == 401:
                    print("Unauthorized, triggering logout")
                response.failure(f"Complete request failed: {response.status_code}, {response.text}")
    
    def query_paper(self, id: str):
        with self.client.get(f"/api/query_paper?id={id}", 
                             headers={"Content-Type": "application/json"}, 
                             catch_response=True) as response:
            # print(f"Response status code: {response.status_code}")
            # print(f"Response headers: {response.headers}")
            # print(f"Response text: {response.text}")
            if response.status_code == 200:
                print(f"Visited /api/query_paper successfully")
            else:
                response.failure(f"Failed to visit /api/query_paper: {response.status_code}")
        return

    def query_solution(self, id: str):
        with self.client.get(f"/api/query_solution?id={id}", 
                             headers={"Content-Type": "application/json"}, 
                             catch_response=True) as response:
            # print(f"Response status code: {response.status_code}")
            # print(f"Response headers: {response.headers}")
            # print(f"Response text: {response.text}")
            if response.status_code == 200:
                print(f"Visited /api/query_solution successfully")
            else:
                response.failure(f"Failed to visit /api/query_solution: {response.status_code}")
        return
                 
    @task
    def perform_tasks(self):
        """组合任务：先登录，再访问 gallery 并模拟滚动"""
        # self.login()
        # self.query_analysis()
        # for page in range(1, 5):
        #     self.visit_gallery(page)
        
        # for i in range(10):
        #     id = int('66def6e5ed1932cc793879e6', 16) + i
        #     hex_id = hex(id)[2:].zfill(len('66def6e5ed1932cc793879e6'))
        #     self.query_paper(hex_id)

        for i in range(10):
            id = int('6704f7c4015fee53d0935188', 16) + i
            hex_id = hex(id)[2:].zfill(len('6704f7c4015fee53d0935188'))
            self.query_solution(hex_id)
        self.stop()

    def on_start(self):
        self.perform_tasks()

# locust -f locustfile.py --headless -u 10 -r 1 -H http://120.55.193.195:5000
# locust -f locustfile.py --headless -u 50 -r 5 -H http://120.55.193.195:5000
# locust -f locustfile.py --headless -u 100 -r 5 -H http://120.55.193.195:5000