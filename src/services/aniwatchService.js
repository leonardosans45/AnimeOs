// Utilidad para esperar ms milisegundos
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch con reintentos y backoff exponencial
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 2000) {
  try {
    const res = await fetch(url, options);
    if ([500, 502, 429].includes(res.status)) {
      if (retries > 0) {
        await wait(backoff);
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      } else {
        throw new Error(`Request failed after retries: ${res.status}`);
      }
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

  // src/services/aniwatchService.js
  // Servicio dedicado para la API de aniwatch (local o remota)
  // Cambia ANIWATCH_API_BASE_URL si usas local: 'http://localhost:3000/anime/aniwatch'

  import axios from 'axios';

const ANIWATCH_API_BASE_URL = 'http://localhost:4000/api/v2/hianime'; // Cambia el puerto si usas otro

export const aniwatchService = {
  // Buscar anime por nombre
  searchAnime: async (query, page = 1) => {
    const { data } = await axios.get(`${ANIWATCH_API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`);
    // La API devuelve { status, data: { animes: [...] } }
    return data.data?.animes || [];
  },

  // Obtener servidores disponibles para un episodio
  getEpisodeServers: async (animeEpisodeId) => {
    // NO limpiar el id, pásalo tal cual para que el backend reciba bleach-806?ep=13793
    console.log('[aniwatchService] getEpisodeServers called with:', animeEpisodeId);
    const params = new URLSearchParams({
      animeEpisodeId: animeEpisodeId
    });
    const { data } = await axios.get(`${ANIWATCH_API_BASE_URL}/episode/servers?${params.toString()}`);
    // Si la respuesta tiene data.sub, usar solo esos servidores
    if (data && data.data && Array.isArray(data.data.sub)) {
      return data.data.sub;
    }
    // Fallback: si la respuesta es el formato viejo
    if (data.servers) {
      return data.servers;
    }
    return [];
  },

  // Obtener detalles de anime por ID (no se usa en flujo actual)
  getAnimeInfo: async (animeId) => {
    const { data } = await axios.get(`${ANIWATCH_API_BASE_URL}/info?id=${encodeURIComponent(animeId)}`);
    return data;
  },

  // Obtener episodios de anime (nuevo endpoint)
  getAnimeEpisodes: async (animeId) => {
    // /anime/:animeId/episodes
    const { data } = await axios.get(`http://localhost:4000/api/v2/hianime/anime/${encodeURIComponent(animeId)}/episodes`);
    // Log de la estructura de la respuesta para depuración
    if (data && data.data && Array.isArray(data.data.episodes)) {
      console.log('[aniwatchService] Usando data.data.episodes, length:', data.data.episodes.length);
      return data.data.episodes;
    }
    if (data && Array.isArray(data.episodes)) {
      console.log('[aniwatchService] Usando data.episodes, length:', data.episodes.length);
      return data.episodes;
    }
    console.warn('[aniwatchService] No se encontró un array de episodios en la respuesta:', data);
    return [];
  },

  // Obtener fuentes de streaming de un episodio (nuevo endpoint)
  getEpisodeSources: async (animeEpisodeId, server, category = 'sub') => {
    // Validación estricta según la documentación oficial
    if (!animeEpisodeId || typeof animeEpisodeId !== 'string') {
      throw new Error('[aniwatchService] animeEpisodeId es requerido y debe ser string');
    }
    if (!server || typeof server !== 'string') {
      throw new Error('[aniwatchService] server es requerido y debe ser string');
    }
    // NO limpiar el id, pásalo tal cual para que el backend reciba bleach-806?ep=13793
    console.log('[aniwatchService] getEpisodeSources called with:', animeEpisodeId, server, category);
    const params = new URLSearchParams({
      animeEpisodeId: animeEpisodeId,
      server: server,
      category: category
    });
    const url = `${ANIWATCH_API_BASE_URL}/episode/sources?${params.toString()}`;
    console.log('[aniwatchService] GET', url);
    try {
      const res = await fetchWithRetry(url, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Failed to fetch episode sources: ${res.status}`);
      }
      const data = await res.json();
      console.log('[aniwatchService] Respuesta cruda de sources:', data);
      // Normaliza la estructura para que siempre devuelva { sources, referer }
      let sources, referer;
      if (data && typeof data === 'object') {
        // Si viene { status: 200, data: { ... } }
        if ('data' in data && typeof data.data === 'object') {
          sources = data.data.sources;
          referer = data.data.headers && (data.data.headers.Referer || data.data.headers.referer);
        } else {
          // Si viene { sources, headers }
          sources = data.sources;
          referer = data.headers && (data.headers.Referer || data.headers.referer);
        }
      }
      console.log('[aniwatchService] Normalizado:', { sources, referer });
      return { sources, referer };
    } catch (err) {
      console.error('[aniwatchService] Error en getEpisodeSources:', err);
      return { sources: undefined, referer: null };
    }
  },
};
