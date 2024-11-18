import os
from openai import OpenAI
from dotenv import load_dotenv
import prompting
import rag as RAG
# import utils.read_documents as READ_DOC
import utils.log as LOG

def knowledge_extraction(paper, client):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompting.KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": paper},
        ]
    )
    
    return response.choices[0].message.content

def query_analysis(query, documents, client):
    user_content = f'''
        query: {query if query else "No query provided"}
        context: {documents if documents else "No additional context provided"}
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.QUERY_EXPLAIN_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content

def solution_example_system(query, solutions, client):
    user_content = f'''
        query: { query }
        examples: { solutions }
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content

def domain_expert_system(query, domain_knowledge, client):
    user_content = f'''
        query: { query }
        domain_knowledge: { domain_knowledge }
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.DOMAIN_EXPERT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content

def interdisciplinary_expert_system(query, domain_knowledge, init_solution, client):
    user_content = f'''
        Query: { query }
        Context: { domain_knowledge }
        Initial_Solutions: { init_solution }
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content

def evaluation_expert_system(query, domain_knowledge, init_solution, iterated_solution, client):
    user_content = f'''
        solutions: { iterated_solution }
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content


def drawing_expert_system(target_user, use_case, client):
    user_content = f'''
        target_user: { target_user }
        solution: { use_case }
    '''

    response = client.images.generate(
            model="dall-e-3",
            prompt=user_content,
            size="1024x1024",
            quality="standard",
            n=1,
        )

    return response.data[0]

def html_generator(useage_scenario, solutions, client):
    user_content = f'''
        useage_scenario: { useage_scenario },
        solutions: { solutions }
    '''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompting.HTML_GENERATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
    )

    return response.choices[0].message.content

def main(client):

    query = READ_DOC.read_from_txt('./test/query.txt')
    design_doc = READ_DOC.read_from_txt('./test/context.txt')

    query_alaysis_result = query_analysis(query, design_doc, client)

    print("==============Query Analysis================")
    print(query_alaysis_result)
    print("===========================================")

    query_alaysis_result = eval(query_alaysis_result)
    
    query = query_alaysis_result['Query'] if 'Query' in query_alaysis_result else query                                                   
    

    # rag
    rag_results = RAG.search_in_meilisearch(query, query_alaysis_result['Requirement'])

    print("==============RAG================")
    print("have found the following documents:")
    print(len(rag_results['hits']))
    print("===========================================")

    # save the rag results to a temp log file
    LOG.save_rag_results_to_log(rag_results)
    
    # DE
    # domain expert system
    domain_knowledge = rag_results.get('hits', [])
    init_solution = domain_expert_system(query, domain_knowledge, client)
    print("==============Domain Expert================")
    print(init_solution)
    print("===========================================")

    # Interdisciplinary Expert
    iterated_solution = interdisciplinary_expert_system(query, domain_knowledge, init_solution, client)
    print("==============Interdisciplinary-disciplinary Expert================")
    print(iterated_solution)
    print("===========================================")

    # Evaluation Expert
    final_solution = evaluation_expert_system(query, domain_knowledge, init_solution, iterated_solution, client)
    print("==============Evaluation Expert================")
    print(final_solution)
    print("===========================================")
    final_solution = eval(final_solution) 

    # Drawing Expert

    target_user =  query_alaysis_result['Target User'] if 'Target User' in query_alaysis_result else 'null'
    print("==============Drawing================")
    for i in range(len(final_solution)):
        image = drawing_expert_system(target_user, final_solution[i]["Use Case"], client)
        final_solution[i]["image_url"] = image.url
        print("draw image {}: {}". format(i, image.url))
    print("==============HTML Generation================")
    html_generator_result = html_generator(query_alaysis_result['Usage Scenario'], final_solution, client)
    print("HTML Generation Done")
    print("===========================================")

    # save the html to a file
    # if do not have the output folder, create it
    if not os.path.exists('./output'):
        os.makedirs('./output') 

    # random file name
    random_file_name = query_alaysis_result['Usage Scenario'].replace(" ", "_")[0:10]

    with open('./output/index_{}.html'.format(random_file_name), 'w', encoding='utf-8') as file:
        file.write(html_generator_result)
    
    print("The HTML file has been saved to the output folder")

    
if __name__ == "__main__":
    load_dotenv()
    API_KEY = os.getenv("API_KEY")
    BASE_URL = os.getenv("BASE_URL")

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    main(client)




