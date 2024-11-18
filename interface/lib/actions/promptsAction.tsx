import { customFetch } from '@/lib/actions/customFetch';

export async function fetchViewPrompts() {
    return customFetch(`/api/prompts`, { method: "GET" });
}

export async function fetchModifyPrompt(promptName: string, newContent: string) {
    return customFetch(`/api/prompts`, {
        method: "PUT",
        body: JSON.stringify({
            prompt_name: promptName,
            new_content: newContent,
        }),
    });
}
