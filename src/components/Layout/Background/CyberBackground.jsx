import React from 'react';
import { useBackground } from '../../../context/BackgroundContext';
import './CyberBackground.css';

const CyberBackground = () => {
                const { wallpaper } = useBackground();

                // Encode the wallpaper path to ensure it works in CSS url()
                const wallpaperUrl = wallpaper ? encodeURI(wallpaper).replace(/#/g, '%23') : '';

                return (
                                <div className="cyber-bg-container">
                                                <div
                                                                className="cyber-bg-wallpaper"
                                                                style={{
                                                                                backgroundImage: wallpaperUrl ? `url("${wallpaperUrl}")` : 'none'
                                                                }}
                                                />
                                                <div className="cyber-bg-overlay"></div>
                                                <div className="cyber-grid"></div>
                                                <div className="particles-container">
                                                                {[...Array(20)].map((_, i) => (
                                                                                <div key={i} className="particle"></div>
                                                                ))}
                                                </div>
                                </div>
                );
};

export default CyberBackground;
