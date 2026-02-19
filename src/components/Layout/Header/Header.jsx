import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from '../../Search/SearchBar/SearchBar';

const Header = () => {
                const location = useLocation();
                
                return (
                                <header className="header glass-panel">
                                                <div className="header-container">
                                                                {/* Logo Section */}
                                                                <div className="header-logo">
                                                                                <Link to="/" className="logo-link">
                                                                                                <h1 className="logo-text">
                                                                                                                <span className="neon-text-white">Anime</span>
                                                                                                                <span className="neon-text-red">OS</span>
                                                                                                </h1>
                                                                                </Link>
                                                                </div>

                                                                {/* Search Bar (Center) */}
                                                                <div className="header-search">
                                                                                <SearchBar placeholder="Search anime..." />
                                                                </div>

                                                                {/* Actions & Nav (Right) */}
                                                                <div className="header-actions">
                                                                                <nav className="header-nav-links">
                                                                                                <Link 
                                                                                                                to="/" 
                                                                                                                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                                                                                                >
                                                                                                                Home
                                                                                                </Link>
                                                                                                <Link 
                                                                                                                to="/recognize" 
                                                                                                                className={`nav-link ${location.pathname === '/recognize' ? 'active' : ''}`}
                                                                                                >
                                                                                                                Recognize
                                                                                                </Link>
                                                                                </nav>
                                                                </div>
                                                </div>
                                </header>
                );
};

export default Header;
