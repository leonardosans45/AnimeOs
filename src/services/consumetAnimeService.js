// src/services/consumetAnimeService.js
// Servicio para consumir la API pública de Consumet (Gogoanime)
// No requiere backend local

import axios from 'axios';


const CONSUMET_API_BASE_URL = 'http://localhost:3001/anime/animekai';

const consumetClient = axios.create({
  baseURL: CONSUMET_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const consumetAnimeService = {
  // Paso 1: Buscar anime por nombre
  searchAnime: async (query) => {
    // http://localhost:3000/anime/animekai/bleach
    const { data } = await consumetClient.get(`/${encodeURIComponent(query)}`);
    return data || [];
  },

  // Paso 2: Obtener detalles de anime y episodios completos por ID (paginado)
  getAnimeInfo: async (animeId) => {
    // Consumet devuelve episodios paginados, hay que traerlos todos
    let allEpisodes = [];
    let page = 1;
    let hasNextPage = true;
    let info = null;

    while (hasNextPage) {
      const { data } = await consumetClient.get(`/info`, { params: { id: animeId, page } });
      if (!info) info = { ...data, episodes: undefined }; // Solo copiar info la primera vez
      if (Array.isArray(data.episodes)) {
        allEpisodes = allEpisodes.concat(data.episodes);
      }
      hasNextPage = data.hasNextPage;
      page++;
    }
    return { ...info, episodes: allEpisodes };
  },

  // Paso 3: Obtener stream y subtítulos de un episodio
  getEpisodeSources: async (episodeId) => {
    // Consumet espera el id completo del episodio, ejemplo: bleach-re3j$ep=1$token=xxx
    const url = `/watch/${episodeId}`;
    const response = await consumetClient.get(url);
    return {
      sources: response.data.sources,
      subtitles: response.data.subtitles || [],
      referer: response.data.headers?.Referer || null,
      download: response.data.download || null
    };
  },
};
