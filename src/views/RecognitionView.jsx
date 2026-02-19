import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiFolderSimplePlusThin } from "react-icons/pi";
import { ImSearch } from "react-icons/im";
import { traceService } from '../services/trace';
import './RecognitionView.css';

const RecognitionView = () => {
    const navigate = useNavigate();
    const [dragActive, setDragActive] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    // Handle file selection via input
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // Process file upload
    const handleFileUpload = async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResults([]);
            
            const searchResults = await traceService.searchByFile(file);
            setResults(searchResults.result || []);
        } catch (err) {
            setError(err.message || 'Failed to search by image');
        } finally {
            setLoading(false);
        }
    };

    // Handle URL search
    const handleUrlSearch = async () => {
        if (!imageUrl.trim()) {
            setError('Please enter a valid image URL');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResults([]);
            
            const searchResults = await traceService.searchByUrl(imageUrl);
            setResults(searchResults.result || []);
        } catch (err) {
            setError(err.message || 'Failed to search by URL');
        } finally {
            setLoading(false);
        }
    };

    // Navigate to anime details
    const handleAnimeClick = (result) => {
        if (result.anilist) {
            navigate(`/anime/${result.anilist}`);
        }
    };

    // Format time from seconds to MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="recognition-view">
            <div className="recognition-container">
                <div className="recognition-header">
                    <h1 className="recognition-title">
                        <span className="neon-text-white">ANIME</span>
                        <span className="neon-text-red"> RECOGNITION</span>
                    </h1>
                    <p className="recognition-subtitle">
                        Upload an image or paste a URL to identify anime scenes
                    </p>
                </div>

                <div className="recognition-inputs">
                    {/* File Dropzone */}
                    <div 
                        className={`dropzone glass ${dragActive ? 'drag-active' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input-hidden"
                        />
                        <div className="dropzone-content">
                            <div className="upload-icon">
                                <PiFolderSimplePlusThin />
                            </div>
                            <h3>DROP IMAGE HERE</h3>
                            <p>or click to select file</p>
                            <span className="file-info">Supports JPG, PNG, GIF • Max 10MB</span>
                        </div>
                        <div className="scanlines"></div>
                    </div>

                    {/* URL Input */}
                    <div className="url-input-section glass">
                        <h3>OR SCAN FROM URL</h3>
                        <div className="url-input-group">
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="url-input"
                                onKeyDown={(e) => e.key === 'Enter' && handleUrlSearch()}
                            />
                            <button 
                                onClick={handleUrlSearch}
                                className="scan-button"
                                disabled={loading}
                            >
                                SCAN URL
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="scanning-state glass">
                        <div className="scanning-spinner"></div>
                        <h3>SYSTEM SCANNING...</h3>
                        <p>Analyzing image for anime matches</p>
                        <div className="progress-bar">
                            <div className="progress-fill"></div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="error-state glass">
                        <h3>SCAN ERROR</h3>
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="retry-button">
                            RETRY SCAN
                        </button>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="results-section">
                        <h3 className="results-title">SCAN RESULTS</h3>
                        <div className="results-grid">
                            {results.slice(0, 6).map((result, index) => (
                                <div 
                                    key={index}
                                    className="result-card glass"
                                    onClick={() => handleAnimeClick(result)}
                                >
                                    <div className="result-image">
                                        <img src={result.image} alt="Scene preview" />
                                        <div className="similarity-badge">
                                            {(result.similarity * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="result-info">
                                        <h4 className="anime-title">
                                            {result.filename || 'Unknown Anime'}
                                        </h4>
                                        {result.episode && (
                                            <p className="episode-info">
                                                Episode {result.episode}
                                            </p>
                                        )}
                                        {result.from && (
                                            <p className="time-info">
                                                {formatTime(result.from)} - {formatTime(result.to)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {results.length === 0 && !loading && !error && (
                    <div className="idle-state glass">
                        <div className="idle-icon">
                            <ImSearch />
                        </div>
                        <h3>READY TO SCAN</h3>
                        <p>Upload an anime screenshot to find its source</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecognitionView;
