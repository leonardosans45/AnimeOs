import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { anilistService } from '../services/anilist';
import { consumetAnimeService } from '../services/consumetAnimeService';
import { useBackground } from '../context/BackgroundContext';
import './DetailView.css';

const DetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { changeBackground, resetBackground } = useBackground();
    const [animeDetails, setAnimeDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [episodesLoading, setEpisodesLoading] = useState(false);

    // Función para calcular el número total de episodios disponibles
    const calculateTotalEpisodes = (animeDetails) => {
        let episodeCount = 0;
        if (animeDetails.episodes && typeof animeDetails.episodes === 'number') {
            episodeCount = animeDetails.episodes;
        } else if (animeDetails.nextAiringEpisode && typeof animeDetails.nextAiringEpisode.episode === 'number') {
            episodeCount = animeDetails.nextAiringEpisode.episode - 1;
        }
        console.log(`Episode count for "${animeDetails.title.romaji}": ${episodeCount} (episodes: ${animeDetails.episodes}, nextAiring: ${animeDetails.nextAiringEpisode?.episode})`);
        return episodeCount;
    };

    // Función para generar episodios fallback
    const generateFallbackEpisodes = (animeDetails) => {
        const totalEpisodes = calculateTotalEpisodes(animeDetails);
        
        if (totalEpisodes > 0) {
            console.log(`Generating ${totalEpisodes} episodes for "${animeDetails.title.romaji}"`);
            const fallbackEpisodes = Array.from({ length: totalEpisodes }, (_, index) => ({
                id: `generated-${animeDetails.id}-ep-${index + 1}`,
                number: index + 1,
                title: `Episode ${index + 1}`,
                url: null,
                generated: true // Marcar como generado
            }));
            setEpisodes(fallbackEpisodes);
            return true;
        }
        return false;
    };

    // Consumet search result cache for navigation
    const [consumetSearchResult, setConsumetSearchResult] = useState(null);
    useEffect(() => {
        const fetchAnimeDetails = async () => {
            try {
                setLoading(true);
                const details = await anilistService.getAnimeDetails(id);
                setAnimeDetails(details);

                // Buscar episodios usando método mejorado
                if (details?.title) {
                    setEpisodesLoading(true);
                    try {
                        let episodesFound = false;
                        let foundConsumetId = null;
                        let foundConsumetEpisodes = null;
                        const searchTitles = [
                            details.title.romaji,
                            details.title.english,
                            details.title.native
                        ].filter(Boolean);
                        // Usar la nueva función para obtener el número de episodios
                        const anilistEpisodes = calculateTotalEpisodes(details);
                        console.log('[DEBUG] AniList episodes:', anilistEpisodes);
                        // Usar Consumet: buscar anime y obtener episodios
                        for (const title of searchTitles) {
                            const results = await consumetAnimeService.searchAnime(title);
                            console.log('[DEBUG] Resultados de búsqueda Consumet:', results);
                            if (results && Array.isArray(results.results) && results.results.length > 0) {
                                // Consumet v2: results.results es el array
                                console.log('[DEBUG] Consumet results.results:', results.results);
                                // Mejorar el match: filtrar por temporada/año si hay varios resultados
                                // Buscar el primer resultado cuyo nombre y número de episodios coincidan con AniList
                                const anilistEpisodes = calculateTotalEpisodes(details);
                                const normalize = str => (str || "")
                                    .normalize("NFD")
                                    .replace(/[-]/g, "")
                                    .replace(/[^a-zA-Z0-9]/g, "")
                                    .toLowerCase();
                                let found = null;
                                const anilistRomanji = normalize(details.title.romaji);
                                const anilistEnglish = normalize(details.title.english);
                                for (const candidate of results.results) {
                                    if (!candidate.id) continue;
                                    const candidateTitle = normalize(candidate.title);
                                    if (
                                        candidateTitle.includes(anilistRomanji) ||
                                        anilistRomanji.includes(candidateTitle) ||
                                        (anilistEnglish && (candidateTitle.includes(anilistEnglish) || anilistEnglish.includes(candidateTitle)))
                                    ) {
                                        const info = await consumetAnimeService.getAnimeInfo(candidate.id);
                                        if (info && Array.isArray(info.episodes) && info.episodes.length === anilistEpisodes) {
                                            found = { id: candidate.id, episodes: info.episodes };
                                            break;
                                        }
                                    }
                                }
                                if (found) {
                                    setEpisodes(found.episodes);
                                    localStorage.setItem('consumetAnimeId', found.id);
                                    localStorage.setItem('consumetEpisodes', JSON.stringify(found.episodes));
                                    foundConsumetId = found.id;
                                    foundConsumetEpisodes = found.episodes;
                                    setConsumetSearchResult({ id: found.id, episodes: found.episodes });
                                    episodesFound = true;
                                    break;
                                }
                            } else if (Array.isArray(results) && results.length > 0) {
                                // Consumet v1: results es el array
                                console.log('[DEBUG] Consumet results (array):', results);
                                const match = results[0];
                                if (match && match.id) {
                                    const info = await consumetAnimeService.getAnimeInfo(match.id);
                                    console.log('[DEBUG] Info Consumet:', info);
                                    if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
                                        console.log('[DEBUG] Episodios Consumet:', info.episodes.slice(0,3));
                                        setEpisodes(info.episodes);
                                        localStorage.setItem('consumetAnimeId', match.id);
                                        localStorage.setItem('consumetEpisodes', JSON.stringify(info.episodes));
                                        foundConsumetId = match.id;
                                        foundConsumetEpisodes = info.episodes;
                                        setConsumetSearchResult({ id: match.id, episodes: info.episodes });
                                        episodesFound = true;
                                        break;
                                    } else {
                                        localStorage.removeItem('consumetAnimeId');
                                        localStorage.removeItem('consumetEpisodes');
                                        setConsumetSearchResult(null);
                                        console.warn('[DetailView] No se encontraron episodios de Consumet. LocalStorage limpiado.');
                                    }
                                }
                            } else {
                                console.warn('[DetailView] Consumet search result no tiene resultados válidos:', results);
                            }
                        }
                        if (!episodesFound) {
                            generateFallbackEpisodes(details);
                            setConsumetSearchResult(null);
                        }
                    } catch (episodeError) {
                        generateFallbackEpisodes(details);
                        setConsumetSearchResult(null);
                    } finally {
                        setEpisodesLoading(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching anime details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAnimeDetails();
        }
    }, [id]);

    // useEffect para manejar el fondo dinámico
    useEffect(() => {
        if (animeDetails) {
            const banner = animeDetails.bannerImage || animeDetails.coverImage?.extraLarge;
            changeBackground(banner);
        }
        // Cleanup function: Volver al default al desmontar el componente
        return () => resetBackground();
    }, [animeDetails, changeBackground, resetBackground]);

    const formatDate = (dateObj) => {
        if (!dateObj || !dateObj.year) return 'TBA';
        const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01';
        const day = dateObj.day ? String(dateObj.day).padStart(2, '0') : '01';
        return `${dateObj.year}-${month}-${day}`;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'FINISHED': return 'status-finished';
            case 'RELEASING': return 'status-releasing';
            case 'NOT_YET_RELEASED': return 'status-not-yet-released';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-default';
        }
    };

    const handleEpisodeClick = (episode) => {
        // Navegar a la vista del reproductor, pasando el providerId y episodios por state
        const providerId = consumetSearchResult?.id || localStorage.getItem('consumetAnimeId');
        const consumetEpisodes = consumetSearchResult?.episodes || (localStorage.getItem('consumetEpisodes') ? JSON.parse(localStorage.getItem('consumetEpisodes')) : undefined);
        navigate(`/watch/${id}/${episode.number}`, {
            state: {
                providerId,
                backupEpisodeData: consumetEpisodes
            }
        });
    };

    const handleBackClick = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="detail-view">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading anime details...</p>
                </div>
            </div>
        );
    }

    if (!animeDetails) {
        return (
            <div className="detail-view">
                <div className="error-container">
                    <h2>Anime not found</h2>
                    <button onClick={handleBackClick} className="back-btn">
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-view">
            {/* Banner Background */}
            <div className="detail-banner">
                <div className="banner-overlay"></div>
            </div>

            {/* Content Container */}
            <div className="detail-content">
                {/* Back Button */}
                <button onClick={handleBackClick} className="back-button glass">
                    ← Back
                </button>

                {/* Main Info Section */}
                <div className="main-info-section">
                    {/* Cover Image */}
                    <div className="cover-container">
                        <img 
                            src={animeDetails.coverImage?.extraLarge || animeDetails.coverImage?.large}
                            alt={animeDetails.title?.romaji}
                            className="cover-image glass"
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="basic-info">
                        <h1 className="anime-title">{animeDetails.title?.romaji}</h1>
                        {animeDetails.title?.english && animeDetails.title.english !== animeDetails.title.romaji && (
                            <h2 className="anime-title-english">{animeDetails.title.english}</h2>
                        )}

                        {/* Stats Grid */}
                        <div className="stats-grid glass">
                            <div className="stat-item">
                                <span className="stat-label">Score</span>
                                <span className="stat-value">{animeDetails.averageScore || 'N/A'}%</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Episodes</span>
                                <span className="stat-value">{animeDetails.episodes || (animeDetails.nextAiringEpisode ? animeDetails.nextAiringEpisode.episode - 1 : '?')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Status</span>
                                <span 
                                    className={`stat-value status ${getStatusClass(animeDetails.status)}`}
                                >
                                    {animeDetails.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Duration</span>
                                <span className="stat-value">{animeDetails.duration || 'N/A'} min</span>
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="genres-container">
                            <h3>Genres</h3>
                            <div className="genres-list">
                                {animeDetails.genres?.map((genre) => (
                                    <span key={genre} className="genre-tag glass">{genre}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="description-section glass">
                    <h3>Synopsis</h3>
                    <div 
                        className="description-text"
                        dangerouslySetInnerHTML={{ 
                            __html: animeDetails.description?.replace(/<br>/g, '<br/>') || 'No description available.'
                        }}
                    />
                </div>

                {/* Additional Info */}
                <div className="additional-info">
                    <div className="info-card glass">
                        <h3>Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Start Date:</span>
                                <span className="info-value">{formatDate(animeDetails.startDate)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">End Date:</span>
                                <span className="info-value">{formatDate(animeDetails.endDate)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Season:</span>
                                <span className="info-value">
                                    {animeDetails.season} {animeDetails.seasonYear}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Studio:</span>
                                <span className="info-value">
                                    {animeDetails.studios?.nodes?.[0]?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Source:</span>
                                <span className="info-value">{animeDetails.source || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Format:</span>
                                <span className="info-value">{animeDetails.format || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Episodes Section */}
                    <div className="episodes-card glass">
                        <h3>Episodes ({episodes.length})</h3>
                        {episodesLoading ? (
                            <div className="episodes-loading">
                                <div className="loading-spinner small"></div>
                                <span>Loading episodes...</span>
                            </div>
                        ) : episodes.length > 0 ? (
                            <div className="episodes-grid">
                                {episodes.map((episode, index) => (
                                    <button
                                        key={episode.id || index}
                                        className="episode-button glass"
                                        onClick={() => handleEpisodeClick(episode)}
                                        title={episode.generated ? 'Episode number generated from AniList' : episode.title}
                                    >
                                        <span className="episode-number">
                                            {episode.number || index + 1}
                                        </span>
                                        <span className="episode-title">
                                            {episode.title ? episode.title : `Episode ${episode.number || index + 1}`}
                                        </span>
                                        {episode.generated && (
                                            <span className="episode-badge">Generated</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="no-episodes">
                                <p>No episodes available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailView;
