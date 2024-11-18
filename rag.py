from meilisearch import Client

meili_client = Client('http://127.0.0.1:7700')
index = meili_client.index('paper_id')

def search_in_meilisearch(query, requirements):

    important_requirements = requirements[:4]
    search_query = ' '.join(important_requirements)
    search_results = index.search(search_query)
    
    return search_results

def test():
    query = "Find documents related to the given requirements."
    requirements = [
        "reminder system",
        "autonomous vehicles",
        "alerts",
        "driver attentiveness",
        "response time"
    ]
    
    results = search_in_meilisearch(query, requirements)
    print("hits length:", len(results['hits']))
    print("Search Results:")
    print(results)

if __name__ == "__main__":
    test()
