import json

# save the rag results to a temp log file

def save_rag_results_to_log(rag_results):
    # clean
    with open('./test/rag_results.log', 'w') as file:
        file.write('')

    # format 
    hits = rag_results.get('hits', [])
    for hit in hits:
        
        target_definition = hit.get('Target Definition', {})
        contributions = hit.get('Contributions', [])
        results = hit.get('Results', {})

        formatted_result = {
            'Target Definition': target_definition,
            'Contributions': contributions,
            'Results': results
        }

        with open('./test/rag_results.log', 'a', encoding='utf-8') as file:
            file.write(json.dumps(formatted_result, ensure_ascii=False, indent=4))
            file.write('\n')  # 添加换行符，确保每个结果独立一行