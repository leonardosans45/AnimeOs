import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useBackground } from '../context/BackgroundContext';
import { anilistService } from '../services/anilist';
import { consumetAnimeService } from '../services/consumetAnimeService';
import CyberPlayer from '../components/Player/CyberPlayer';
import DownloadTerminal from '../components/Player/DownloadTerminal';
import './PlayerView.css';

const PlayerView = () => {
    const { id, episode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { changeBackground, resetBackground } = useBackground();
    const [animeDetails, setAnimeDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(parseInt(episode) || 1);
    const [loading, setLoading] = useState(true);
    const [videoSource, setVideoSource] = useState(null);
    const [downloadLinks, setDownloadLinks] = useState([]);
    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState(null);
    // Log de montaje
    console.log('[PlayerView] Montando PlayerView con id:', id, 'episode:', episode);
    const [streamingLoading, setStreamingLoading] = useState(false);
    // Consumet ID (providerId) puede venir de state, localStorage o fallback
    const [providerId, setProviderId] = useState(location.state?.providerId || null);

    // Buscar anime en Consumet usando variantes del título y fallback
    const normalize = (str) => str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .toLowerCase();

    // Busca en Consumet y obtiene episodios
    const searchInConsumet = async (animeDetails) => {
        try {
            const titles = [
                animeDetails.title?.romaji,
                animeDetails.title?.english,
                animeDetails.title?.native
            ].filter(Boolean);
            for (const title of titles) {
                let results = await consumetAnimeService.searchAnime(title);
                if (results && results.length > 0) {
                    const match = results[0];
                    if (match && match.id) {
                        const info = await consumetAnimeService.getAnimeInfo(match.id);
                        if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
                            return { ...match, episodes: info.episodes };
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error searching in Consumet:', error);
            return null;
        }
    };

    // Generar episodios basados en datos de AniList
    const generateEpisodes = (animeDetails) => {
        const totalEpisodes = animeDetails.episodes || 
            (animeDetails.nextAiringEpisode ? animeDetails.nextAiringEpisode.episode - 1 : 24);
        
        return Array.from({ length: totalEpisodes }, (_, index) => ({
            number: index + 1,
            title: `Episode ${index + 1}`,
            available: true
        }));
    };

    useEffect(() => {
        // 1. Intentar obtener providerId y episodios desde location.state (navegación directa)
        let navProviderId = location.state?.providerId;
        let backupEpisodes = location.state?.backupEpisodeData;
        if (navProviderId && backupEpisodes && backupEpisodes.length > 0) {
            setProviderId(navProviderId);
            setEpisodes(backupEpisodes);
            setLoading(false);
            console.log('[PlayerView] Usando providerId y episodios desde location.state:', navProviderId, backupEpisodes.length);
        } else {
            // 2. Fallback: leer de localStorage
            let consumetAnimeId = localStorage.getItem('consumetAnimeId');
            let consumetEpisodes = [];
            try {
                consumetEpisodes = JSON.parse(localStorage.getItem('consumetEpisodes') || '[]');
            } catch (e) {
                consumetEpisodes = [];
            }
            if (consumetAnimeId && consumetEpisodes.length > 0) {
                setProviderId(consumetAnimeId);
                setEpisodes(consumetEpisodes);
                setLoading(false);
                console.log('[PlayerView] Fallback: Usando episodios de Consumet (localStorage):', consumetEpisodes.slice(0,3), '...');
            } else {
                setProviderId(null);
                setEpisodes([]);
                setLoading(false);
                console.warn('[PlayerView] No hay episodios de Consumet en location.state ni localStorage. No se puede reproducir.');
            }
        }
        // Además, obtener detalles de AniList solo para mostrar info
        const fetchAniList = async () => {
            try {
                const details = await anilistService.getAnimeDetails(id);
                setAnimeDetails(details);
            } catch (error) {
                console.error("Error fetching anime data:", error);
            }
        };
        if (id) {
            fetchAniList();
        }
    }, [id, location.state]);

    // Refuerzo: Si episodes o providerId están vacíos tras el primer render, intenta recuperarlos de localStorage o buscar por título
    useEffect(() => {
        if ((!episodes || episodes.length === 0) || !providerId) {
            // 1. Intentar localStorage
            let consumetAnimeId = localStorage.getItem('consumetAnimeId');
            let consumetEpisodes = [];
            try {
                consumetEpisodes = JSON.parse(localStorage.getItem('consumetEpisodes') || '[]');
            } catch (e) {
                consumetEpisodes = [];
            }
            if (consumetAnimeId && consumetEpisodes.length > 0) {
                setProviderId(consumetAnimeId);
                setEpisodes(consumetEpisodes);
                console.log('[PlayerView] Refuerzo: Episodios y animeId recuperados de Consumet localStorage.');
            } else if (animeDetails && animeDetails.title) {
                // 2. Si tenemos detalles de AniList, buscar en Consumet por título
                (async () => {
                    const titles = [
                        animeDetails.title?.romaji,
                        animeDetails.title?.english,
                        animeDetails.title?.native
                    ].filter(Boolean);
                    for (const title of titles) {
                        let results = await consumetAnimeService.searchAnime(title);
                        if (results && results.length > 0) {
                            const match = results[0];
                            if (match && match.id) {
                                const info = await consumetAnimeService.getAnimeInfo(match.id);
                                if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
                                    setProviderId(match.id);
                                    setEpisodes(info.episodes);
                                    localStorage.setItem('consumetAnimeId', match.id);
                                    localStorage.setItem('consumetEpisodes', JSON.stringify(info.episodes));
                                    console.log('[PlayerView] Refuerzo: Episodios y animeId recuperados de búsqueda Consumet.');
                                    break;
                                }
                            }
                        }
                    }
                })();
            }
        }
    }, [episodes, providerId, animeDetails]);

    // Obtener streaming y descarga usando Consumet, con emparejamiento flexible
    const fetchEpisodeData = async (episodeNumber, serverOverride = null) => {
        console.log('[PlayerView][FETCH] Episodio:', episodeNumber, 'serverOverride:', serverOverride);
        setStreamingLoading(true);
        try {
            if (!animeDetails || !providerId) {
                setVideoSource(null);
                setDownloadLinks([]);
                setServers([]);
                return;
            }
            // Buscar episodio por número exacto o fallback
            const episode = episodes.find(ep => ep.number == episodeNumber);
            let episodeId = episode?.id;
            if (!episode || !episodeId) {
                setVideoSource(null);
                setDownloadLinks([]);
                setServers([]);
                console.warn('[PlayerView][FETCH] No episodeId válido para el episodio:', episodeNumber);
                return;
            }
            // Consumet: obtener stream y subtítulos usando el id completo del episodio
            let response = null;
            try {
                response = await consumetAnimeService.getEpisodeSources(episodeId);
                console.log('[PlayerView][SOURCES][CONSUMET] Respuesta:', response, 'download:', response?.download);
            } catch (err) {
                setVideoSource(null);
                setDownloadLinks([]);
                console.error('[PlayerView][SOURCES][CONSUMET] Error al obtener sources:', err);
                return;
            }
            // --- NUEVO PARSEO DE SOURCES ---
            let url = null;
            let tracks = [];
            let headers = {};
            let intro = null;
            let outro = null;
            let referer = null;
            let sourcesArr = [];
            if (response && Array.isArray(response.sources)) {
                sourcesArr = response.sources;
            }
            // Mapear subtítulos externos de response.subtitles
            if (Array.isArray(response?.subtitles)) {
                tracks = response.subtitles.map(sub => ({
                    url: sub.url,
                    lang: sub.lang || sub.label || 'Subtitle',
                    kind: sub.kind || 'captions'
                }));
            }
            if (sourcesArr.length > 0) {
                const englishSources = sourcesArr.filter(s => !s.language || s.language === 'english' || s.language === 'en');
                const sourcesToUse = englishSources.length > 0 ? englishSources : sourcesArr;
                const found = sourcesToUse.find(s => (s.url || s.file) && ((s.url || s.file).endsWith('.m3u8') || (s.url || s.file).endsWith('.mp4')));
                url = found?.url || found?.file || sourcesToUse[0]?.url || sourcesToUse[0]?.file || null;
                headers = found?.headers || {};
                intro = found?.intro || null;
                outro = found?.outro || null;
                referer = response?.referer || headers?.Referer || null;
            }
            if (url) {
                // PASAR SOLO LA URL CRUDA Y EL REFERER, el proxy se aplica en CyberPlayer
                console.log('[PlayerView][SET] setVideoSource:', { url, headers, tracks, intro, outro, referer });
                setVideoSource({ url, headers, tracks, intro, outro, referer, download: response?.download });
                setDownloadLinks([
                    {
                        id: 1,
                        quality: 'Direct',
                        size: 'N/A',
                        format: url.endsWith('.m3u8') ? 'HLS' : 'MP4',
                        provider: 'CONSUMET',
                        url,
                        speed: 'FAST',
                        status: 'ACTIVE'
                    }
                ]);
            } else {
                setVideoSource(null);
                setDownloadLinks([]);
                console.warn('[PlayerView][SOURCES] No se encontraron fuentes de streaming para este episodio/servidor.');
            }
        } catch (error) {
            setVideoSource(null);
            setDownloadLinks([]);
            console.error('[PlayerView][FETCH] Error inesperado:', error);
        } finally {
            setStreamingLoading(false);
        }
    };

    // useEffect para cargar streaming cuando cambia el episodio
    useEffect(() => {
        console.log('[PlayerView] useEffect streaming: animeDetails:', !!animeDetails, 'providerId:', providerId, 'currentEpisode:', currentEpisode, 'episodes:', episodes && episodes.length);
        if (!animeDetails || !providerId || currentEpisode < 1 || !episodes || episodes.length === 0) {
            console.warn('[PlayerView] No se cumplen condiciones para fetchEpisodeData');
            return;
        }
        // Log de episodios antes de buscar
        console.log('[PlayerView] Episodios disponibles:', episodes.slice(0,3), '...');
        fetchEpisodeData(currentEpisode);
    }, [currentEpisode, animeDetails, providerId, episodes]);

    // Cuando cambia el server seleccionado, recarga sources
    useEffect(() => {
        if (selectedServer && currentEpisode && episodes.length > 0) {
            fetchEpisodeData(currentEpisode, selectedServer);
        }
        // eslint-disable-next-line
    }, [selectedServer]);

    // useEffect separado para el manejo del fondo - Evita loops infinitos
    useEffect(() => {
        // 1. Guard Clause: Si no hay anime o todavía está cargando, NO HACER NADA.
        if (!animeDetails || loading) return;

        // 2. Obtener URL segura
        const bannerUrl = animeDetails.bannerImage || animeDetails.coverImage?.extraLarge;

        // 3. Solo llamar al contexto si tenemos una URL válida
        if (bannerUrl) {
            changeBackground(bannerUrl);
        }

        // 4. Cleanup: Resetear SOLO al desmontar el componente
        return () => {
            resetBackground();
        };

        // CRÍTICO: La dependencia debe ser 'animeDetails?.id' (primitivo), NUNCA el objeto 'animeDetails' completo.
    }, [animeDetails?.id, changeBackground, resetBackground]);

    const handleNavigateEpisode = (direction) => {
        let newEpisode;
        if (direction === 'prev' && currentEpisode > 1) {
            newEpisode = currentEpisode - 1;
        } else if (direction === 'next' && currentEpisode < episodes.length) {
            newEpisode = currentEpisode + 1;
        } else {
            return; // No hay cambio
        }
        
        setCurrentEpisode(newEpisode);
        navigate(`/watch/${id}/${newEpisode}`);
    };

    const handleEpisodeSelect = (episodeNumber) => {
        setCurrentEpisode(episodeNumber);
        navigate(`/watch/${id}/${episodeNumber}`);
    };

    const handleBackToCatalog = () => {
        navigate(`/anime/${id}`);
    };

    if (loading) {
        return (
            <div className="player-view">
                <div className="loading-container glass">
                    <div className="loading-spinner"></div>
                    <p>Loading player...</p>
                </div>
            </div>
        );
    }
    if (!providerId || !episodes || episodes.length === 0) {
        return (
            <div className="player-view">
                <div className="loading-container glass">
                    <div className="loading-spinner"></div>
                    <p>No streaming data available.<br/>Regresa a la ficha del anime y selecciona un episodio desde ahí.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="player-view">
            <div className="player-grid">
                {/* Columna Izquierda - Contenido Principal */}
                <div className="main-content">
                    {/* Selector de servidor */}
                    {servers.length > 0 && (
                        <div className="server-selector glass">
                            <label htmlFor="server-select" className="server-select-label">Server:</label>
                            <select
                                id="server-select"
                                value={selectedServer || ''}
                                onChange={e => setSelectedServer(e.target.value)}
                                disabled={streamingLoading}
                            >
                                {servers.map((srv, idx) => (
                                    <option key={srv.id || srv.serverId || srv.name || idx} value={srv.id || srv.serverId || srv.name || srv}>
                                        {srv.name || srv.id || srv.serverId || `Server ${idx+1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Reproductor */}
                    <div className="video-container glass">
                        {streamingLoading ? (
                            <div className="video-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading episode...</p>
                            </div>
                        ) : videoSource && videoSource.url ? (
                            <>
                                {console.log('[PlayerView][RENDER] videoSource:', videoSource)}
                                <CyberPlayer 
                                    videoUrl={videoSource.url}
                                    title={`${animeDetails?.title?.romaji} - ${episodes.find(e => e.number === currentEpisode)?.title || `Episode ${currentEpisode}`}`}
                                    referer={videoSource.referer}
                                    headers={videoSource.headers}
                                    tracks={videoSource.tracks}
                                    intro={videoSource.intro}
                                    outro={videoSource.outro}
                                />
                            </>
                        ) : (
                            <>
                                {console.log('[PlayerView][RENDER] videoSource unavailable:', videoSource)}
                                <div className="video-unavailable">
                                    <p>Episode not available for streaming</p>
                                    <p>Check download links below</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info del Video - Línea Compacta */}
                    <div className="video-info-compact glass">
                        <div className="info-left">
                            <span className="compact-title">
                                {animeDetails?.title?.romaji || 'Loading...'}
                            </span>
                            <span className="compact-separator">-</span>
                            <span className="compact-episode">
                                Episode {currentEpisode}
                            </span>
                        </div>
                        <div className="info-right">
                            <span className="compact-score">
                                Score: {animeDetails?.averageScore || 'N/A'}%
                            </span>
                        </div>
                    </div>

                    {/* Terminal de Descargas */}
                    <div className="download-section">
                        <DownloadTerminal 
                            animeTitle={animeDetails?.title?.romaji}
                            episode={currentEpisode}
                            downloadLinks={downloadLinks}
                            loading={streamingLoading}
                            downloadUrl={videoSource?.download}
                        />
                    </div>
                </div>

                {/* Columna Derecha - Barra Lateral Unificada */}
                <div className="sidebar-unified glass">
                    {/* Header Fijo - Navegación */}
                    <div className="sidebar-header">
                        <button 
                            className="nav-btn"
                            onClick={() => handleNavigateEpisode('prev')}
                            disabled={currentEpisode <= 1}
                            title="Previous Episode"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <button 
                            className="nav-btn catalog-btn"
                            onClick={handleBackToCatalog}
                            title="Back to Catalog"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        
                        <button 
                            className="nav-btn"
                            onClick={() => handleNavigateEpisode('next')}
                            disabled={currentEpisode >= episodes.length}
                            title="Next Episode"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Lista Scrollable de Episodios */}
                    <div className="episodes-list-unified">
                        {episodes.map((ep) => (
                            <div 
                                key={ep.id || ep.number}
                                className={`episode-item ${ep.number === currentEpisode ? 'active' : ''}`}
                                onClick={() => handleEpisodeSelect(ep.number)}
                                title={ep.title || `Episode ${ep.number}`}
                            >
                                <span className="episode-text">
                                    {ep.title ? `${ep.number}. ${ep.title}` : `Episode ${ep.number}`}
                                </span>
                                {ep.number === currentEpisode && <div className="active-pulse"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerView;
