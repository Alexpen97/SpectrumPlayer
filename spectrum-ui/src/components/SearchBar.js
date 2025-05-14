import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/api';
import { FiSearch, FiX } from 'react-icons/fi';
import { BsMusicNoteBeamed } from 'react-icons/bs';
import '../styles/SearchBar.css';

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);
  const searchCache = useRef({});
  const previousQuery = useRef('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Memoized search function to prevent unnecessary API calls
  const fetchSearchResults = useCallback((query) => {
    // Use cached results if available and query length > 2
    const normalizedQuery = query.trim().toLowerCase();
    const currentTime = new Date().getTime();
    
    // Check if we have a valid cached result for this query
    if (searchCache.current[normalizedQuery] && 
        currentTime - searchCache.current[normalizedQuery].timestamp < 5 * 60 * 1000) { // 5 minutes cache
      const cachedData = searchCache.current[normalizedQuery].data;
      setSearchResults(cachedData);
      setShowDropdown(true);
      setIsLoading(false);
      return;
    }
    
    // If query is the same as previous, don't make a new API call
    if (normalizedQuery === previousQuery.current.trim().toLowerCase() && searchResults) {
      setShowDropdown(true);
      setIsLoading(false);
      return;
    }
    
    // Otherwise, make the API call
    setIsLoading(true);
    
    searchService.search(query)
      .then(response => {
        // Store in cache
        searchCache.current[normalizedQuery] = {
          data: response.data,
          timestamp: currentTime
        };
        setSearchResults(response.data);
        setShowDropdown(true);
        previousQuery.current = query;
      })
      .catch(error => {
        console.error('Error searching:', error);
        setSearchResults(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchResults]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (query.trim() === '') {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }
    
    // Use variable debounce timing based on query length for more responsive UX
    const debounceTime = query.length < 3 ? 300 : 200;
    
    // Don't search until at least 2 characters are entered
    if (query.trim().length < 2) {
      setIsLoading(false);
      return;
    }
    
    searchTimeout.current = setTimeout(() => {
      fetchSearchResults(query);
    }, debounceTime);
  };
  
  const handleResultClick = (type, name, foreignId, metadata, lidarrId) => {
    setShowDropdown(false);
    // Navigate to the appropriate page based on result type, name, foreignId, metadata, and lidarrId
    if (type === 'artist') {
      navigate(`/${type}/${encodeURIComponent(name)}/${foreignId}`);
    } else if (type === 'album' && metadata) {
      // For albums, use artist/artistId/album/albumId format if we have artist ID
      // metadata contains the artist ID for albums, lidarrId contains the numeric album ID
      navigate(`/artist/${metadata}/album/${lidarrId}`);
    } else if (type === 'track' && metadata) {
      // For tracks, metadata format is albumId|artistId
      const [albumId, artistId] = metadata.split('|');
      // For tracks, navigate to their album page
      // metadata format is albumId|artistId

      if (artistId && albumId) {
        navigate(`/artist/${artistId}/album/${albumId}`);
      } else if (albumId) {
        navigate(`/album/${albumId}`);
      } else {
        // Fallback to track page if no album info
        navigate(`/${type}/${foreignId}`);
      }
    } else {
      // Default navigation for playlists and other types
      navigate(`/${type}/${foreignId}`);
    }
  };

  const handleSearchRedirect = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-input">
        <span className="search-icon"><FiSearch /></span>
        <input 
          type="text" 
          placeholder="What do you want to listen to?" 
          value={searchQuery}
          onChange={handleSearch}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchRedirect()}
        />
        {searchQuery && (
          <button 
            className="clear-btn" 
            onClick={() => { 
              setSearchQuery(''); 
              setSearchResults(null);
              setShowDropdown(false);
            }}
          >
            <FiX />
          </button>
        )}
        
        {/* Search Results Dropdown */}
        {showDropdown && searchResults && (
          <div className="search-results-dropdown" ref={dropdownRef}>
            {isLoading ? (
              <div className="loading">Searching...</div>
            ) : (
              <>
                {searchResults.artists && searchResults.artists.length > 0 && (
                  <div className="dropdown-section">
                    <h3>Artists</h3>
                    <ul>
                      {searchResults.artists.map(artist => (
                        <li 
                          key={artist.id || artist.foreignId} 
                          onClick={() => handleResultClick('artist', artist.name, artist.foreignId, artist.metadata, artist.lidarrId)}
                        >
                          {artist.imageUrl && (
                            <img 
                              src={artist.imageUrl} 
                              alt={artist.name} 
                              className="result-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40';
                              }}
                            />
                          )}
                          <div className="result-info">
                            <div className="result-name">{artist.name}</div>
                            <div className="result-type">Artist</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {searchResults.albums && searchResults.albums.length > 0 && (
                  <div className="dropdown-section">
                    <h3>Albums</h3>
                    <ul>
                      {searchResults.albums.map(album => (
                        <li 
                          key={album.id || album.foreignId} 
                          onClick={() => handleResultClick('album', album.name, album.foreignId, album.metadata, album.lidarrId)}
                        >
                          {album.imageUrl && (
                            <img 
                              src={album.imageUrl} 
                              alt={album.name} 
                              className="result-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40';
                              }}
                            />
                          )}
                          <div className="result-info">
                            <div className="result-name">{album.name}</div>
                            <div className="result-type">Album</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {searchResults.tracks && searchResults.tracks.length > 0 && (
                  <div className="dropdown-section">
                    <h3>Tracks</h3>
                    <ul>
                      {searchResults.tracks.map(track => (
                        <li 
                          key={track.id || track.foreignId} 
                          onClick={() => handleResultClick('track', track.name, track.foreignId, track.metadata, track.lidarrId)}
                        >
                          {track.imageUrl && (
                            <img 
                              src={track.imageUrl} 
                              alt={track.name} 
                              className="result-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40';
                              }}
                            />
                          )}
                          <div className="result-info">
                            <div className="result-name">{track.name}</div>
                            <div className="result-type">Track</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {searchResults.playlists && searchResults.playlists.length > 0 && (
                  <div className="dropdown-section">
                    <h3>Playlists</h3>
                    <ul>
                      {searchResults.playlists.map(playlist => (
                        <li 
                          key={playlist.id || playlist.foreignId} 
                          onClick={() => handleResultClick('playlist', playlist.name, playlist.foreignId, playlist.metadata, playlist.lidarrId)}
                        >
                          {playlist.imageUrl && (
                            <img 
                              src={playlist.imageUrl} 
                              alt={playlist.name} 
                              className="result-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40';
                              }}
                            />
                          )}
                          <div className="result-info">
                            <div className="result-name">{playlist.name}</div>
                            <div className="result-type">Playlist</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* View all results link */}
                <div className="view-all">
                  <button onClick={handleSearchRedirect}>View all results</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
