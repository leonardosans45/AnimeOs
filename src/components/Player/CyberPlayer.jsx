import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Minimize, Subtitles, Globe } from 'lucide-react';
import './CyberPlayer.css';

const getProxiedUrl = (url, referer) => {
    if (!url) return '';
    if (url.includes('localhost:5051')) return url;
    const encodedVideo = encodeURIComponent(url);
    const encodedReferer = referer ? encodeURIComponent(referer) : '';
    return `http://localhost:5051/proxy?url=${encodedVideo}&referer=${encodedReferer}`;
};

const CyberPlayer = ({ videoUrl, title, referer, tracks = [] }) => {
    // --- PROCESAMIENTO DE TRACKS ---
    const [externalTracks, setExternalTracks] = useState([]);
    const [activeSubtitle, setActiveSubtitle] = useState(-1); // -1 = off
    const [subtitleCues, setSubtitleCues] = useState([]);
    const [currentCue, setCurrentCue] = useState('');

    useEffect(() => {
        if (tracks && Array.isArray(tracks)) {
            const cleanTracks = tracks
                .filter(t => t.kind !== 'thumbnails')
                .map(t => ({
                    file: t.url,
                    label: t.lang || t.label || `Track ${Math.floor(Math.random() * 100)}`,
                    kind: t.kind
                }));
            setExternalTracks(cleanTracks);
        }
    }, [tracks]);

    const lastRatioRef = useRef(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(100);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const [subtitles, setSubtitles] = useState([]);
    const [audioTracks, setAudioTracks] = useState([]);
    const [currentSubtitle, setCurrentSubtitle] = useState(-1);
    const [currentAudio, setCurrentAudio] = useState(-1);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    const playerContainerRef = useRef(null);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const isDraggingRef = useRef(false);

    const getYouTubeId = (url) => {
        if (!url) return false;
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };
    const videoId = getYouTubeId(videoUrl);

    // --- BUCLE DE ANIMACIÓN (GAME LOOP) ---
    const updateLoop = () => {
        if (videoRef.current && !isDraggingRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration || 1;
            const percent = Math.round((current / dur) * 10000) / 100;
            setProgressPercent(percent);
            setCurrentTimeDisplay(current);
        }
        animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    useEffect(() => {
        if (isPlaying) {
            cancelAnimationFrame(animationFrameRef.current);
            updateLoop();
        } else {
            cancelAnimationFrame(animationFrameRef.current);
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying]);

    const getPosFromEvent = (clientX) => {
        if (!playerContainerRef.current) return 0;
        const progressBar = playerContainerRef.current.querySelector('.progress-container');
        if (!progressBar) return 0;
        const rect = progressBar.getBoundingClientRect();
        const x = clientX - rect.left;
        return Math.max(0, Math.min(x / rect.width, 1));
    };

    const handleMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingRef.current = true;
        const ratio = getPosFromEvent(e.clientX);
        lastRatioRef.current = ratio;
        setProgressPercent(Math.round(ratio * 10000) / 100);
        setCurrentTimeDisplay(ratio * (videoRef.current?.duration || 0));
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingRef.current) {
                e.preventDefault();
                const ratio = getPosFromEvent(e.clientX);
                lastRatioRef.current = ratio;
                setProgressPercent(Math.round(ratio * 10000) / 100);
                setCurrentTimeDisplay(ratio * (videoRef.current?.duration || 0));
            }
        };

        const handleMouseUp = (e) => {
            if (isDraggingRef.current) {
                e.preventDefault();
                const newTime = lastRatioRef.current * (videoRef.current?.duration || 0);
                if (videoRef.current && isFinite(newTime)) {
                    videoRef.current.currentTime = newTime;
                }
                isDraggingRef.current = false;
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPlaying]);

    const handleBarClick = (e) => {
        e.stopPropagation();
        if (!isDraggingRef.current && videoRef.current) {
            const ratio = getPosFromEvent(e.clientX);
            const newTime = ratio * (videoRef.current.duration || 0);
            videoRef.current.currentTime = newTime;
            setProgressPercent(Math.round(ratio * 10000) / 100);
        }
    };

    // --- HLS & SETUP ---
    useEffect(() => {
        if (!videoId && videoUrl && videoRef.current) {
            const proxiedUrl = getProxiedUrl(videoUrl, referer);
            const isM3U8 = videoUrl.includes('.m3u8') || proxiedUrl.includes('.m3u8');

            if (isM3U8 && Hls.isSupported()) {
                if (hlsRef.current) hlsRef.current.destroy();
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    xhrSetup: function(xhr, url) { xhr.withCredentials = false; }
                });
                hlsRef.current = hls;
                hls.loadSource(proxiedUrl);
                hls.attachMedia(videoRef.current);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                    setSubtitles(hls.subtitleTracks);
                    setAudioTracks(hls.audioTracks);
                    setCurrentSubtitle(hls.subtitleTrack);
                    setCurrentAudio(hls.audioTrack);
                });
                return () => { if (hlsRef.current) hlsRef.current.destroy(); };
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = proxiedUrl;
            } else {
                videoRef.current.src = proxiedUrl;
            }
        }
    }, [videoUrl, videoId, referer]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
            else { videoRef.current.pause(); setIsPlaying(false); }
        }
    };

    const handleVideoPlay = () => { setIsPlaying(true); updateLoop(); };
    const handleVideoPause = () => { setIsPlaying(false); cancelAnimationFrame(animationFrameRef.current); };

    const toggleMute = () => { if(videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } };
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if(videoRef.current) { videoRef.current.volume = val/100; setIsMuted(val===0); }
    };
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (playerContainerRef.current.requestFullscreen) playerContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);
    const handleLoadedMetadata = () => { 
        if(videoRef.current) {
            setDuration(videoRef.current.duration);
        } 
    };
    const handleVideoEnded = () => { setIsPlaying(false); setShowControls(true); };
    const changeSubtitle = (index) => { if (hlsRef.current) { hlsRef.current.subtitleTrack = index; setCurrentSubtitle(index); setShowSettingsMenu(false); } };
    const changeAudio = (index) => { if (hlsRef.current) { hlsRef.current.audioTrack = index; setCurrentAudio(index); setShowSettingsMenu(false); } };

    useEffect(() => {
        let timeout;
        if (showControls && isPlaying && !isDraggingRef.current) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls, isPlaying]);

    // --- Subtítulos externos: helpers y hooks deben ir aquí ---
    // Parser robusto para VTT con timestamps cortos y etiquetas HTML
    function parseVTT(text) {
        const cues = [];
        const blocks = text.replace(/\r\n/g, '\n').split(/\n\n+/);

        blocks.forEach(block => {
            const lines = block.split('\n');
            let timeLine = null;
            let textLines = [];

            // Buscar la línea de tiempo (acepta HH:MM:SS o MM:SS)
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('-->')) {
                    timeLine = lines[i];
                    textLines = lines.slice(i + 1);
                    break;
                }
            }

            if (timeLine && textLines.length > 0) {
                // Regex flexible para timestamps con o sin hora
                const match = timeLine.match(/((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s-->\s((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/);
                
                if (match) {
                    // Limpiar etiquetas HTML como <i>, <b>, <c.color>
                    const cleanText = textLines.join('\n')
                        .replace(/<[^>]*>/g, '') 
                        .trim();

                    if (cleanText) {
                        cues.push({
                            start: parseTime(match[1]),
                            end: parseTime(match[2]),
                            text: cleanText
                        });
                    }
                }
            }
        });
        
        console.log(`✅ Subtítulos procesados: ${cues.length}`);
        return cues;
    }

    function parseTime(timeString) {
        const parts = timeString.split(':');
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
        }
        return 0;
    }

    useEffect(() => {
        if (activeSubtitle > -1 && externalTracks[activeSubtitle]?.file) {
            const originalUrl = externalTracks[activeSubtitle].file;
            const proxiedUrl = getProxiedUrl(originalUrl, referer);

            fetch(proxiedUrl)
                .then(r => {
                    if (!r.ok) throw new Error('Error loading subs');
                    return r.text();
                })
                .then(text => setSubtitleCues(parseVTT(text)))
                .catch(err => {
                    console.error("Error fetching subtitles:", err);
                    setSubtitleCues([]);
                });
        } else {
            setSubtitleCues([]);
            setCurrentCue('');
        }
    }, [activeSubtitle, externalTracks, referer]);

    useEffect(() => {
        if (!videoRef.current || subtitleCues.length === 0) return;

        let rafId;
        const updateSubtitleLoop = () => {
            const time = videoRef.current.currentTime;
            const activeCue = subtitleCues.find(c => time >= c.start && time <= c.end);
            setCurrentCue(activeCue ? activeCue.text : '');
            rafId = requestAnimationFrame(updateSubtitleLoop);
        };

        rafId = requestAnimationFrame(updateSubtitleLoop);
        return () => cancelAnimationFrame(rafId);
    }, [subtitleCues]);

    return (
        <div ref={playerContainerRef} className={`cyber-player ${isFullscreen ? 'fullscreen' : ''}`}
             onMouseEnter={() => setShowControls(true)}
             onMouseLeave={() => setShowControls(isPlaying ? false : true)}
             onMouseMove={() => setShowControls(true)}>
            
            <div className="video-wrapper">
                {videoId ? (
                    <iframe className="youtube-iframe" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`} allowFullScreen />
                ) : videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            className="native-video"
                            onClick={togglePlay}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={handleVideoEnded}
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                        />
                        {/* RENDERIZADO DE SUBTÍTULOS */}
                        {currentCue && (
                            <div className="subtitle-overlay">
                                {currentCue}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="video-placeholder"><h3>No Signal</h3></div>
                )}
            </div>

            {!videoId && videoUrl && (
                <div className={`player-overlay ${showControls ? 'visible' : ''}`}>
                <div className="center-control" onClick={togglePlay}>
                    {isPlaying ? <Pause size={80} className="center-icon" /> : <Play size={80} className="center-icon" />}
                </div>

                    <div className="bottom-controls glass">
                        <div 
                            className="progress-container" 
                            onMouseDown={handleMouseDown}
                            onClick={handleBarClick}
                        >
                            <div
                                className="progress-bg"
                                style={{
                                    background: `linear-gradient(to right, #ff003c ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`
                                }}
                            />
                            <div
                                className="progress-handle"
                                style={{ left: `${progressPercent}%` }}
                                onMouseDown={handleMouseDown}
                            ></div>
                        </div>

                        <div className="controls-row">
                            <div className="controls-left">
                                <button className="control-btn" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <div className="volume-control">
                                    <button className="control-btn" onClick={toggleMute}>
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="volume-slider" />
                                </div>
                                <div className="time-display">
                                    {Math.floor(currentTimeDisplay / 60)}:{Math.floor(currentTimeDisplay % 60).toString().padStart(2, '0')} / 
                                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                            <div className="controls-right">
                                <button className="control-btn" onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
                                    <Settings size={20} />
                                </button>
                                <button className="control-btn" onClick={toggleFullscreen}>
                                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                </button>
                            </div>
                        </div>
                        {showSettingsMenu && (
                            <div className="settings-menu glass-panel">
                                {audioTracks.length > 0 && <div className="settings-section"><div className="settings-title"><Globe size={14}/> Audio</div>{audioTracks.map((track, i) => (<button key={i} className={`settings-item ${currentAudio === i ? 'active' : ''}`} onClick={() => changeAudio(i)}>{track.name || `Audio ${i + 1}`}</button>))}</div>}
                                <div className="settings-section">
                                    <div className="settings-title"><Subtitles size={14}/> Subs</div>
                                    <button className={`settings-item ${activeSubtitle === -1 ? 'active' : ''}`} onClick={() => setActiveSubtitle(-1)}>Off</button>
                                    {externalTracks && externalTracks.length > 0 ? (
                                        externalTracks.map((track, i) => (
                                            <button
                                                key={track.label || track.lang || `sub${i}`}
                                                className={`settings-item ${activeSubtitle === i ? 'active' : ''}`}
                                                onClick={() => setActiveSubtitle(i)}
                                            >
                                                {(track.label && typeof track.label === 'string' && track.label.trim()) ||
                                                 (track.lang && typeof track.lang === 'string' && track.lang.trim()) ||
                                                 `Sub ${i + 1}`}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="no-subs-message">
                                            No subtitles available
                                        </div>
                                    )}
                                </div>
                                {subtitles.length > 0 && <div className="settings-section"><div className="settings-title"><Subtitles size={14}/> Subs (HLS)</div><button className={`settings-item ${currentSubtitle === -1 ? 'active' : ''}`} onClick={() => changeSubtitle(-1)}>Off</button>{subtitles.map((track, i) => (<button key={i} className={`settings-item ${currentSubtitle === i ? 'active' : ''}`} onClick={() => changeSubtitle(i)}>{track.name || track.lang || `Sub ${i + 1}`}</button>))}</div>}
                            </div>
                        )}
                    </div>
                    <div className="video-title-overlay"><h4>{title}</h4></div>
                </div>
            )}
            <div className="cyber-scanlines" />
        </div>
    );
};

export default CyberPlayer;
