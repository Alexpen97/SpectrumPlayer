import React, { useState, useEffect, useContext } from 'react';
import { libraryService } from '../services/api';
import { AudioPlayerContext } from '../contexts/AudioPlayerContext';
import LikeButton from './LikeButton';
import '../styles/LikedSongs.css';

/**
 * Component to display and manage liked songs
 */
function LikedSongs() {
  const [likedTracks, setLikedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get audio player context for playback
  const { playTrack, playTrackWithQueue, currentTrack } = useContext(AudioPlayerContext);
  
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
  
  // Handle playing a track
  const handlePlayTrack = (track, index) => {
    if (!track) return;
    
    // Prepare track for playback
    const trackForPlayback = {
      ...track,
      streamUrl: `/api/tracks/${track.id}/stream`,
      albumName: track.album ? track.album.title : 'Unknown Album',
      artistName: track.artist ? track.artist.name : 'Unknown Artist',
      albumImageUrl: track.album && track.album.imageUrl ? track.album.imageUrl : 'https://via.placeholder.com/300'
    };
    
    // Create a queue of all liked tracks
    const tracksQueue = likedTracks.map(t => ({
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
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="liked-songs-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your liked songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liked-songs-container error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="liked-songs-container">
      <div className="liked-songs-header">
        <h2>Liked Songs</h2>
        <p>{likedTracks.length} songs</p>
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
            <div className="track-title">Title</div>
            <div className="track-album">Album</div>
            <div className="track-duration">Duration</div>
            <div className="track-actions"></div>
          </div>
          
          <div className="track-list-body">
            {likedTracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`track-item ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`}
                onDoubleClick={() => handlePlayTrack(track, index)}
              >
                <div className="track-number">{index + 1}</div>
                <div className="track-title">
                  <div className="track-title-inner">
                    {track.album && track.album.imageUrl && (
                      <img 
                        src={track.album.imageUrl} 
                        alt={track.album.title} 
                        className="track-image" 
                      />
                    )}
                    <div className="track-info">
                      <div className="track-name">{track.title}</div>
                      <div className="track-artist">{track.artist ? track.artist.name : 'Unknown Artist'}</div>
                    </div>
                  </div>
                </div>
                <div className="track-album">
                  {track.album ? track.album.title : 'Unknown Album'}
                </div>
                <div className="track-duration">
                  {formatDuration(track.duration)}
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

export default LikedSongs;
