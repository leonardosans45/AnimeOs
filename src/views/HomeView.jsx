import { useNavigate, useSearchParams } from 'react-router-dom';
import useAnimeSearch from '../hooks/useAnimeSearch';
import './HomeView.css';

const HomeView = () => {
                const navigate = useNavigate();
                const [searchParams] = useSearchParams();
                const query = searchParams.get('q');
                
                // Usar el hook personalizado para manejar la búsqueda
                const { animeList, loading, error } = useAnimeSearch(query);

                const handleShowDetails = (animeId) => {
                                navigate(`/anime/${animeId}`);
                };

                return (
                                <div className="home-view">
                                                <div className="catalog-scroll-container">
                                                                <div className="catalog-container">
                                                                                {loading ? (
                                                                                                <div className="loading-state">
                                                                                                                {query ? `Searching for "${query}"...` : 'Loading catalog...'}
                                                                                                </div>
                                                                                ) : error ? (
                                                                                                <div className="error-state">
                                                                                                                <p>Error: {error}</p>
                                                                                                                <button onClick={() => window.location.reload()}>Retry</button>
                                                                                                </div>
                                                                                ) : animeList.length === 0 ? (
                                                                                                <div className="no-results-state">
                                                                                                                <p>{query ? `No results found for "${query}"` : 'No anime available'}</p>
                                                                                                </div>
                                                                                ) : (
                                                                                                <div className="catalog-grid">
                                                                                                                {animeList.map((anime) => (
                                                                                                                                <div key={anime.id} className="anime-card glass">
                                                                                                                                                <div className="anime-image">
                                                                                                                                                                <img src={anime.coverImage.large} alt={anime.title.romaji} />
                                                                                                                                                </div>
                                                                                                                                                <div className="anime-info">
                                                                                                                                                                <h2 title={anime.title.romaji}>{anime.title.romaji}</h2>
                                                                                                                                                                <p>Rating: {anime.averageScore ? `${anime.averageScore}%` : 'N/A'}</p>
                                                                                                                                                                <p>Genre: {anime.genres ? anime.genres.slice(0, 2).join(', ') : 'N/A'}</p>
                                                                                                <p>Episodes: {anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : '?')}</p>

                                                                                                                                                                <button 
                                                                                                                                                                                className="details-btn"
                                                                                                                                                                                onClick={() => handleShowDetails(anime.id)}
                                                                                                                                                                >
                                                                                                                                                                                show details ↪
                                                                                                                                                                </button>
                                                                                                                                                </div>
                                                                                                                                </div>
                                                                                                ))}
                                                                                                </div>
                                                                                )}
                                                                </div>
                                                </div>
                                </div>
                );
};

export default HomeView;
