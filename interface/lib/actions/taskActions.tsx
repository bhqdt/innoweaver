import { customFetch } from '@/lib/actions/customFetch';
import useAuthStore from '@/lib/hooks/auth-store';

let knowledgeExtractionController = new AbortController();
let queryAnalysisController = new AbortController();
let completeController = new AbortController();

function getApiKey() {
    const apiKey = localStorage.getItem('api_key');
    console.log(apiKey);
    return apiKey;
}

// 通用 AbortController 处理
function handleAbort(controller) {
    if (controller) {
        controller.abort();
    }
    return new AbortController();
}

// 知识提取
export async function fetchKnowledgeExtraction(paper) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("请设置 API-KEY。");
        return null;
    }

    knowledgeExtractionController = handleAbort(knowledgeExtractionController);

    try {
        return await customFetch(`/api/knowledge_extraction`, {
            method: "POST",
            body: JSON.stringify({ paper }),
            signal: knowledgeExtractionController.signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Knowledge extraction request was aborted.");
        } else {
            throw error;
        }
    }
}

// 查询分析
export async function fetchQueryAnalysis(query, designDoc) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("请设置 API-KEY。");
        return null;
    }

    queryAnalysisController = handleAbort(queryAnalysisController);

    try {
        return await customFetch(`/api/query`, {
            method: "POST",
            body: JSON.stringify({ query, design_doc: designDoc }),
            signal: queryAnalysisController.signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Query analysis request was aborted.");
        } else {
            throw error;
        }
    }
}

// 完成任务
export async function fetchComplete(queryAnalysisResult) {
    console.log(queryAnalysisResult);
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("请设置 API-KEY。");
        return null;
    }

    completeController = handleAbort(completeController);

    try {
        return await customFetch(`/api/complete`, {
            method: "POST",
            body: JSON.stringify(queryAnalysisResult),
            signal: completeController.signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Complete request was aborted.");
        } else {
            throw error;
        }
    }
}

// 点赞/取消点赞
export async function fetchLikeSolution(solution_id: string) {
    try {
        return await customFetch(`/api/user/like_solution`, {
            method: "POST",
            body: JSON.stringify({ _id: solution_id }),
        });
    } catch (error) {
        throw new Error(`Failed to fetch like solution: ${error.message}`);
    }
}

// 设置 API-KEY
export async function fetchSetAPIKey(api_key: string) {
    try {
        return await customFetch(`/api/user/api_key`, {
            method: "POST",
            body: JSON.stringify({ api_key }),
        });
    } catch (error) {
        throw new Error(`Failed to fetch API-Key set: ${error.message}`);
    }
}

// --------------------------------------------------------------------
