import React, { useState, useEffect, useContext } from 'react';
import { libraryService } from '../services/api';
import { AudioPlayerContext } from '../contexts/AudioPlayerContext';
import LikeButton from '../components/LikeButton';
import '../styles/LikedSongsPage.css';

function LikedSongsPage() {
  const [likedTracks, setLikedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'title', 'artist', 'album'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Get audio player context for playback
  const { playTrack, playTrackWithQueue, currentTrack, isPlaying, togglePlay } = useContext(AudioPlayerContext);
  
  // Load liked tracks when component mounts
  useEffect(() => {
    setIsLoading(true);
    
    libraryService.getLikedTracks()
      .then(response => {
        if (response.data) {
          setLikedTracks(response.data);
          console.log('Liked tracks loaded:', response.data);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading liked tracks:', error);
        setError('Failed to load liked tracks. Please try again later.');
        setIsLoading(false);
      });
  }, []);
  
  // Sort tracks based on current sort settings
  const sortedTracks = [...likedTracks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        const artistA = a.artist ? a.artist.name : 'Unknown';
        const artistB = b.artist ? b.artist.name : 'Unknown';
        comparison = artistA.localeCompare(artistB);
        break;
      case 'album':
        const albumA = a.album ? a.album.title : 'Unknown';
        const albumB = b.album ? b.album.title : 'Unknown';
        comparison = albumA.localeCompare(albumB);
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
      case 'dateAdded':
      default:
        // Assuming newer items are at the beginning of the array
        comparison = 0; // Default to original order
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Handle playing a track
  const handlePlayTrack = (track, index) => {
    if (!track) return;
    
    // If the track is already playing, toggle play/pause
    if (currentTrack && currentTrack.id === track.id) {
      togglePlay();
      return;
    }
    
    // Prepare track for playback
    const trackForPlayback = {
      ...track,
      streamUrl: `/api/tracks/${track.id}/stream`,
      albumName: track.album ? track.album.title : 'Unknown Album',
      artistName: track.artist ? track.artist.name : 'Unknown Artist',
      albumImageUrl: track.album && track.album.imageUrl ? track.album.imageUrl : 'https://via.placeholder.com/300'
    };
    
    // Create a queue of all liked tracks
    const tracksQueue = sortedTracks.map(t => ({
      ...t,
      streamUrl: `/api/tracks/${t.id}/stream`,
      albumName: t.album ? t.album.title : 'Unknown Album',
      artistName: t.artist ? t.artist.name : 'Unknown Artist',
      albumImageUrl: t.album && t.album.imageUrl ? t.album.imageUrl : 'https://via.placeholder.com/300'
    }));
    
    // Play the selected track with the queue
    playTrackWithQueue(trackForPlayback, tracksQueue, index);
  };
  
  // Handle track like/unlike
  const handleLikeChange = (trackId, isLiked) => {
    if (!isLiked) {
      // If track was unliked, remove it from the list
      setLikedTracks(likedTracks.filter(track => track.lidarrTrackId !== trackId));
    } else {
      // Refresh the list to get the updated data
      libraryService.getLikedTracks()
        .then(response => {
          if (response.data) {
            setLikedTracks(response.data);
          }
        })
        .catch(error => {
          console.error('Error refreshing liked tracks:', error);
        });
    }
  };
  
  // Handle changing sort
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Play all tracks
  const handlePlayAll = () => {
    if (sortedTracks.length === 0) return;
    
    const firstTrack = sortedTracks[0];
    handlePlayTrack(firstTrack, 0);
  };

  if (isLoading) {
    return (
      <div className="liked-songs-page loading">
        <div className="loading-spinner"></div>
        <p>Loading your liked songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liked-songs-page error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="liked-songs-page">
      <div className="liked-songs-hero">
        <div className="liked-songs-cover">
          <div className="liked-songs-icon">♥</div>
        </div>
        <div className="liked-songs-info">
          <h1>Liked Songs</h1>
          <p className="liked-songs-count">{likedTracks.length} songs</p>
        </div>
      </div>
      
      <div className="liked-songs-controls">
        <button 
          className="play-all-button" 
          onClick={handlePlayAll}
          disabled={likedTracks.length === 0}
        >
          {isPlaying && currentTrack && likedTracks.some(t => t.id === currentTrack.id) ? 'Pause' : 'Play All'}
        </button>
      </div>
      
      {likedTracks.length === 0 ? (
        <div className="no-liked-songs">
          <p>You haven't liked any songs yet.</p>
          <p>Start liking songs to build your collection!</p>
        </div>
      ) : (
        <div className="liked-songs-list">
          <div className="track-list-header">
            <div className="track-number">#</div>
            <div 
              className={`track-title sortable ${sortBy === 'title' ? 'sorted-' + sortOrder : ''}`}
              onClick={() => handleSortChange('title')}
            >
              Title
              {sortBy === 'title' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div 
              className={`track-album sortable ${sortBy === 'album' ? 'sorted-' + sortOrder : ''}`}
              onClick={() => handleSortChange('album')}
            >
              Album
              {sortBy === 'album' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div 
              className={`track-duration sortable ${sortBy === 'duration' ? 'sorted-' + sortOrder : ''}`}
              onClick={() => handleSortChange('duration')}
            >
              Duration
              {sortBy === 'duration' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
            <div className="track-actions"></div>
          </div>
          
          <div className="track-list-body">
            {sortedTracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`track-item ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`}
                onDoubleClick={() => handlePlayTrack(track, index)}
              >
                <div className="track-number">
                  {currentTrack && currentTrack.id === track.id && isPlaying ? (
                    <div className="now-playing-indicator">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="track-title">
                  <div className="track-title-inner">
                    {track.album && track.album.coverImageUrl ? (
                      <img 
                        src={track.album.coverImageUrl} 
                        alt={track.album.title} 
                        className="track-image" 
                      />
                    ) : (
                      <div className="track-image-placeholder"></div>
                    )}
                    <div className="track-info">
                      <div className="track-name">{track.title}</div>
                      <div className="track-artist">{track.album.artist ? track.album.artist.name : 'Unknown Artist'}</div>
                    </div>
                  </div>
                </div>
                <div className="track-album">
                  {track.album ? track.album.title : 'Unknown Album'}
                </div>
                <div className="track-duration">
                  {formatDuration(track.durationInSeconds)}
                </div>
                <div className="track-actions">
                  <LikeButton 
                    type="track" 
                    id={track.lidarrTrackId} 
                    onLikeChange={(isLiked) => handleLikeChange(track.lidarrTrackId, isLiked)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LikedSongsPage;
