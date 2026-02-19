import { useState, useEffect } from 'react';
import { anilistService } from '../services/anilist';

const useAnimeSearch = (searchQuery) => {
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnimeData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let data;
                
                // Si hay query de búsqueda, buscar anime específico
                if (searchQuery && searchQuery.trim()) {
                    console.log(`Searching for: "${searchQuery}"`);
                    data = await anilistService.searchAnime(searchQuery.trim());
                } else {
                    // Si no hay query, mostrar trending
                    console.log('Fetching trending anime');
                    data = await anilistService.getTrending();
                }

                if (data && data.media) {
                    setAnimeList(data.media);
                    console.log(`Loaded ${data.media.length} anime(s)`);
                } else {
                    setAnimeList([]);
                    console.log('No anime data found');
                }
            } catch (err) {
                console.error('Error fetching anime data:', err);
                setError(err.message || 'Failed to fetch anime data');
                setAnimeList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimeData();
    }, [searchQuery]);

    return {
        animeList,
        loading,
        error
    };
};

export default useAnimeSearch;
