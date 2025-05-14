import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/api';
import '../styles/Search.css';

function Search() {
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

  const categories = [
    { name: 'Podcasts', color: '#E13300', image: 'https://via.placeholder.com/150' },
    { name: 'Live Events', color: '#7358FF', image: 'https://via.placeholder.com/150' },
    { name: 'Made For You', color: '#1E3264', image: 'https://via.placeholder.com/150' },
    { name: 'New Releases', color: '#E8115B', image: 'https://via.placeholder.com/150' },
    { name: 'Pop', color: '#148A08', image: 'https://via.placeholder.com/150' },
    { name: 'Hip-Hop', color: '#BC5900', image: 'https://via.placeholder.com/150' },
    { name: 'Rock', color: '#E91429', image: 'https://via.placeholder.com/150' },
    { name: 'Latin', color: '#E1118C', image: 'https://via.placeholder.com/150' },
    { name: 'Workout', color: '#509BF5', image: 'https://via.placeholder.com/150' },
    { name: 'Electronic', color: '#0D73EC', image: 'https://via.placeholder.com/150' }
  ];

  // Memoized search function to prevent unnecessary API calls
  const fetchSearchResults = useCallback((query) => {
    // Use cached results if available
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
  
  const handleResultClick = (type, id, metadata, lidarrId) => {
    setShowDropdown(false);
    
    // Navigate to the appropriate page based on result type, id, metadata, and lidarrId
    if (type === 'artist') {
      navigate(`/${type}/${id}`);
    } else if (type === 'album' && metadata) {
      // For albums, use artist/artistId/album/albumId format if we have artist ID
      // metadata contains artist ID, lidarrId contains the numeric album ID
      navigate(`/artist/${metadata}/album/${lidarrId}`);
    } else if (type === 'track' && metadata) {
      // For tracks, navigate to their album page
      // metadata format is albumId|artistId
      const [albumId, artistId] = metadata.split('|');
      if (artistId && albumId) {
        navigate(`/artist/${artistId}/album/${albumId}`);
      } else if (albumId) {
        navigate(`/album/${albumId}`);
      } else {
        // Fallback to track page if no album info
        navigate(`/${type}/${id}`);
      }
    } else {
      // Default navigation for playlists and other types
      navigate(`/${type}/${id}`);
    }
  };

  return (
    <div className="search">
      <div className="search-bar">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="What do you want to listen to?" 
            value={searchQuery}
            onChange={handleSearch}
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
              ✕
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
                            onClick={() => handleResultClick('artist', artist.foreignId, artist.metadata, artist.lidarrId)}
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
                            onClick={() => handleResultClick('album', album.foreignId, album.metadata, album.lidarrId)}
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
                            onClick={() => handleResultClick('track', track.foreignId, track.metadata, track.lidarrId)}
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
                            onClick={() => handleResultClick('playlist', playlist.foreignId, playlist.metadata, playlist.lidarrId)}
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!showDropdown && !searchResults ? (
        <>
          <h2>Browse all</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div 
                key={index} 
                className="category-card" 
                style={{ backgroundColor: category.color }}
              >
                <span>{category.name}</span>
                <img src={category.image} alt={category.name} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="search-results">
          {searchResults.tracks.length > 0 && (
            <div className="result-section">
              <h2>Songs</h2>
              <div className="tracks-list">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Album</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.tracks.map((track, index) => (
                      <tr key={track.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="track-info">
                            <span className="track-title">{track.title}</span>
                            <span className="track-artist">{track.artist}</span>
                          </div>
                        </td>
                        <td>{track.album}</td>
                        <td>{track.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {searchResults.artists.length > 0 && (
            <div className="result-section">
              <h2>Artists</h2>
              <div className="artists-grid">
                {searchResults.artists.map(artist => (
                  <div key={artist.id} className="artist-card">
                    <div className="artist-img">
                      <img src={artist.image} alt={artist.name} />
                    </div>
                    <h3>{artist.name}</h3>
                    <p>Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.albums.length > 0 && (
            <div className="result-section">
              <h2>Albums</h2>
              <div className="albums-grid">
                {searchResults.albums.map(album => (
                  <div key={album.id} className="album-card">
                    <div className="album-img">
                      <img src={album.image} alt={album.title} />
                    </div>
                    <h3>{album.title}</h3>
                    <p>{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
