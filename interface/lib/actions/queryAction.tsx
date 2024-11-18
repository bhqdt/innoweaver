import { customFetch } from '@/lib/actions/customFetch';

export async function fetchQuerySolution(solution_id: string) {
    return customFetch(`/api/query_solution?id=${solution_id}`, { method: "GET" });
}

export async function fetchQueryPaper(paper_id: string) {
    return customFetch(`/api/query_paper?id=${paper_id}`, { method: "GET" });
}

export async function fetchQueryLikedSolutions(solution_ids: string[]) {
    return customFetch(`/api/user/query_liked_solutions`, {
        method: "POST",
        body: JSON.stringify({ solution_ids }),
    });
}
