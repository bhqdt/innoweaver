import json
import os

# 输入的 txt 文件路径
input_file = './raw_data/data1.txt'

# 输出的目录路径
output_dir = './data/'
os.makedirs(output_dir, exist_ok=True)

# 变量初始化
json_objects = []
current_object = ""
bracket_count = 0

# 逐行读取文件
with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        # 计算当前行中大括号的数量变化
        bracket_count += line.count('{') - line.count('}')
        
        # 将当前行添加到当前 JSON 对象中
        current_object += line
        
        # 当括号平衡时，表示一个完整的 JSON 对象结束
        if bracket_count == 0 and current_object.strip():
            json_objects.append(current_object.strip())
            current_object = ""

# 将每个 JSON 对象保存为单独的文件
for i, obj_str in enumerate(json_objects):
    try:
        # 尝试将字符串转换为 JSON 对象
        json_obj = json.loads(obj_str)
        
        # 输出文件路径
        output_file = os.path.join(output_dir, f'{i + 1}.json')
        
        # 保存 JSON 对象到文件
        with open(output_file, 'w', encoding='utf-8') as outfile:
            json.dump(json_obj, outfile, indent=4, ensure_ascii=False)
        
        print(f'Written: {output_file}')
    except json.JSONDecodeError as e:
        print(f'Error decoding JSON object {i + 1}: {str(e)}')

