import { anilistClient } from './api.config';

// Query para obtener animes en tendencia
const TRENDING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (sort: TRENDING_DESC, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description
      genres
      averageScore
      popularity
      status
      episodes
      nextAiringEpisode {
        episode
      }
      startDate {
        year
        month
        day
      }
    }
  }
}
`;

// Query para buscar anime
const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (search: $search, sort: POPULARITY_DESC, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description
      genres
      averageScore
      status
      episodes
      nextAiringEpisode {
        episode
      }
    }
  }
}
`;

// Query para obtener detalles específicos de un anime
const ANIME_DETAILS_QUERY = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    description
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    genres
    averageScore
    meanScore
    popularity
    favourites
    status
    episodes
    duration
    season
    seasonYear
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    studios {
      nodes {
        name
        isAnimationStudio
      }
    }
    source
    format
    countryOfOrigin
    isAdult
    nextAiringEpisode {
      airingAt
      timeUntilAiring
      episode
    }
    relations {
      edges {
        node {
          id
          title {
            romaji
          }
          coverImage {
            medium
          }
        }
        relationType
      }
    }
    characters {
      edges {
        node {
          id
          name {
            full
          }
          image {
            medium
          }
        }
        role
        voiceActors(language: JAPANESE) {
          id
          name {
            full
          }
          image {
            medium
          }
        }
      }
    }
  }
}
`;

export const anilistService = {
                getTrending: async (page = 1, perPage = 30) => {
                                try {
                                                const response = await anilistClient.post('', {
                                                                query: TRENDING_QUERY,
                                                                variables: { page, perPage }
                                                });
                                                return response.data.data.Page;
                                } catch (error) {
                                                console.error('Error fetching trending anime:', error);
                                                throw error;
                                }
                },

                searchAnime: async (query, page = 1, perPage = 30) => {
                                try {
                                                const response = await anilistClient.post('', {
                                                                query: SEARCH_QUERY,
                                                                variables: { search: query, page, perPage }
                                                });
                                                return response.data.data.Page;
                                } catch (error) {
                                                console.error('Error searching anime:', error);
                                                throw error;
                                }
                },

                getAnimeDetails: async (id) => {
                                try {
                                                const response = await anilistClient.post('', {
                                                                query: ANIME_DETAILS_QUERY,
                                                                variables: { id: parseInt(id) }
                                                });
                                                return response.data.data.Media;
                                } catch (error) {
                                                console.error('Error fetching anime details:', error);
                                                throw error;
                                }
                }
};
