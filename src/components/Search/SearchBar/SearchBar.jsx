import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiaSearchSolid } from "react-icons/lia";
import './SearchBar.css';

const SearchBar = ({ placeholder = "Search anime..." }) => {
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const trimmedValue = searchValue.trim();
            
            if (trimmedValue) {
                // Navegar a la home con query parameter
                navigate(`/?q=${encodeURIComponent(trimmedValue)}`);
            } else {
                // Si está vacío, ir a home sin parámetros (trending)
                navigate('/');
            }
        }
    };

    const handleInputChange = (event) => {
        setSearchValue(event.target.value);
    };

    return (
        <div className="search-input-wrapper glass">
            <LiaSearchSolid className="search-icon" />
            <input 
                type="text" 
                placeholder={placeholder}
                className="search-input"
                value={searchValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

export default SearchBar;
