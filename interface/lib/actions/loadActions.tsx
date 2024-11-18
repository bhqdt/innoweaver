import { customFetch } from '@/lib/actions/customFetch';

export async function fetchLoadSolutions(page = 1) {
    return customFetch(`/api/user/load_solutions?page=${page}`, { method: "GET" });
}

export async function fetchLoadLikedSolutions(page = 1) {
    return customFetch(`/api/user/load_liked_solutions?page=${page}`, { method: "GET" });
}

export async function fetchGallery(page = 1) {
    return customFetch(`/api/gallery?page=${page}`, { method: "GET" });
}
