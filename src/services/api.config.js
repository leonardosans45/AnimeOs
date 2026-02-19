import axios from 'axios';

export const API_BASE_URLS = {
                ANILIST: 'https://graphql.anilist.co',
                HIANIME: 'https://hianime-api-zeta.vercel.app/anime', // Using HiAnime API
                TRACE_MOE: 'https://api.trace.moe'
};

// Anilist Client (GraphQL)
export const anilistClient = axios.create({
                baseURL: API_BASE_URLS.ANILIST,
                headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                }
});

// HiAnime Client (Streaming)
export const hianimeClient = axios.create({
                baseURL: API_BASE_URLS.HIANIME,
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
});

// Trace.moe Client (Recognition)
export const traceClient = axios.create({
                baseURL: API_BASE_URLS.TRACE_MOE,
});
