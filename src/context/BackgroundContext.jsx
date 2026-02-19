import { createContext, useContext, useState } from 'react';

const BackgroundContext = createContext();

export const useBackground = () => {
                const context = useContext(BackgroundContext);
                if (!context) {
                                throw new Error('useBackground must be used within BackgroundProvider');
                }
                return context;
};

export const BackgroundProvider = ({ children }) => {
                const [wallpaper, setWallpaper] = useState('/assets/wallpapers/Alice Margatroid Touhou Project Wallpaper.jpg');
                const [isDynamic, setIsDynamic] = useState(true);
                const defaultWallpaper = '/assets/wallpapers/Alice Margatroid Touhou Project Wallpaper.jpg';

                const updateWallpaper = (newWallpaper) => {
                                setWallpaper(newWallpaper);
                };

                const changeBackground = (imageUrl) => {
                                if (imageUrl && isDynamic) {
                                                setWallpaper(imageUrl);
                                }
                };

                const resetBackground = () => {
                                setWallpaper(defaultWallpaper);
                };

                const toggleDynamic = () => {
                                setIsDynamic(!isDynamic);
                };

                const value = {
                                wallpaper,
                                isDynamic,
                                updateWallpaper,
                                changeBackground,
                                resetBackground,
                                toggleDynamic,
                };

                return (
                                <BackgroundContext.Provider value={value}>
                                                {children}
                                </BackgroundContext.Provider>
                );
};
