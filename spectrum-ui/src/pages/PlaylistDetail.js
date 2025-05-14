import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/PlaylistDetail.css';
import { playlistService, trackService } from '../services/api';
import { FiPlus, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import { AudioPlayerContext } from '../contexts/AudioPlayerContext';

// Track item component with add to playlist functionality
const TrackItem = ({ track, index, playlistId, allTracks }) => {
  const [duration, setDuration] = useState('0:00');
  const [showDropdown, setShowDropdown] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get audio player context for playback functionality
  const { 
    currentTrack, 
    isPlaying, 
    playTrackWithQueue,
    formatTime
  } = useContext(AudioPlayerContext);

  useEffect(() => {
    // Format duration from seconds to mm:ss
    if (track.durationSeconds) {
      setDuration(formatTime(track.durationSeconds));
    }
  }, [track, formatTime]);

  const handleAddToPlaylist = () => {
    setIsLoading(true);
    // Fetch all playlists for the dropdown
    playlistService.getAllPlaylists()
      .then(response => {
        setPlaylists(response.data);
        setShowDropdown(true);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching playlists:', error);
        setIsLoading(false);
      });
  };

  const handleRemoveFromPlaylist = () => {
    if (window.confirm('Are you sure you want to remove this track from the playlist?')) {
      playlistService.removeTrackFromPlaylist(playlistId, track.id)
        .then(() => {
          // Refresh the page to show updated playlist
          window.location.reload();
        })
        .catch(error => {
          console.error('Error removing track from playlist:', error);
        });
    }
  };

  const addTrackToPlaylist = (selectedPlaylistId) => {
    playlistService.addTrackToPlaylist(selectedPlaylistId, track.id)
      .then(() => {
        setShowDropdown(false);
        alert(`Track added to playlist successfully!`);
      })
      .catch(error => {
        console.error('Error adding track to playlist:', error);
        alert('Failed to add track to playlist');
      });
  };

  // Handle playing this track
  const handlePlayTrack = () => {
    // Create a copy of the track to avoid modifying the original object
    const trackToPlay = { ...track };
    
    // Ensure track has streamUrl - use lidarrTrackId if available
    if (!trackToPlay.streamUrl) {
      if (trackToPlay.lidarrTrackId) {
        trackToPlay.streamUrl = `http://localhost:8080/api/stream/track/${trackToPlay.lidarrTrackId}`;
      } else if (trackToPlay.id) {
        trackToPlay.streamUrl = `http://localhost:8080/api/stream/track/${trackToPlay.id}`;
      }
    }
    
    // Ensure track has all required metadata
    if (trackToPlay.album) {
      trackToPlay.albumName = trackToPlay.album.title;
      trackToPlay.albumImageUrl = trackToPlay.album.coverImageUrl;
    }
    if (trackToPlay.artist) {
      trackToPlay.artistName = trackToPlay.artist.name;
    }
    
    // If track has audioUrl but no streamUrl, use audioUrl
    if (trackToPlay.audioUrl && !trackToPlay.streamUrl) {
      trackToPlay.streamUrl = trackToPlay.audioUrl;
    }
    
    console.log('Playing track:', trackToPlay.title, 'Stream URL:', trackToPlay.streamUrl);
    playTrackWithQueue(trackToPlay, allTracks.map(t => {
      // Ensure all tracks in queue have proper streamUrl
      const queueTrack = { ...t };
      if (!queueTrack.streamUrl) {
        if (queueTrack.lidarrTrackId) {
          queueTrack.streamUrl = `http://localhost:8080/api/stream/track/${queueTrack.lidarrTrackId}`;
        } else if (queueTrack.id) {
          queueTrack.streamUrl = `http://localhost:8080/api/stream/track/${queueTrack.id}`;
        } else if (queueTrack.audioUrl) {
          queueTrack.streamUrl = queueTrack.audioUrl;
        }
      }
      return queueTrack;
    }), index);
  };

  // Check if this track is currently playing
  const isCurrentTrack = currentTrack && currentTrack.id === track.id;
  
  return (
    <div className={`track-item ${isCurrentTrack ? 'playing' : ''}`}>
      <div className="track-number">
        <span className="track-index">{!isCurrentTrack && (index + 1)}</span>
        <button 
          className="track-play-button" 
          onClick={handlePlayTrack}
        >
          {isCurrentTrack && isPlaying ? <BsPauseFill size={24} /> : <BsPlayFill size={24} />}
        </button>
      </div>
      <div className="track-title">
        <div className="track-name">{track.title}</div>
        <div className="track-artist">{track.artist ? track.artist.name : ''}</div>
      </div>
      <div className="track-actions">
        <button className="track-add-to-playlist" onClick={handleAddToPlaylist} disabled={isLoading} title="Add to playlist">
          <FiPlus />
        </button>
        {playlistId && (
          <button className="remove-from-playlist" onClick={handleRemoveFromPlaylist} title="Remove from playlist">
            <FiTrash2 />
          </button>
        )}
        {showDropdown && (
          <div className="playlist-dropdown">
            <div className="dropdown-header">
              <span>Add to playlist</span>
              <button onClick={() => setShowDropdown(false)}>×</button>
            </div>
            <ul>
              {playlists.length === 0 ? (
                <li className="no-playlists">No playlists found</li>
              ) : (
                playlists.map(playlist => (
                  <li key={playlist.id} onClick={() => addTrackToPlaylist(playlist.id)}>
                    {playlist.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="track-duration">{duration}</div>
    </div>
  );
};

function PlaylistDetail() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrackWithQueue } = useContext(AudioPlayerContext);

  useEffect(() => {
    // Fetch playlist data from API
    playlistService.getPlaylistById(id)
      .then(response => {
        setPlaylist(response.data);
        setIsLoading(false);
        console.log('Playlist fetched:', response.data);
        
        // Add playlist to recently played
        return playlistService.addToRecentlyPlayed(id);
      })
      .then(() => {
        console.log('Added playlist to recently played:', id);
      })
      .catch(error => {
        console.error('Error fetching playlist or adding to recently played:', error);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="loading">Loading playlist...</div>;
  }

  // Handle playing the entire playlist
  const handlePlayPlaylist = () => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      // Create a queue with proper stream URLs for all tracks
      const tracksQueue = playlist.tracks.map(track => {
        const trackCopy = { ...track };
        
        // Ensure track has streamUrl - use lidarrTrackId if available
        if (!trackCopy.streamUrl) {
          if (trackCopy.lidarrTrackId) {
            trackCopy.streamUrl = `http://localhost:8080/api/stream/track/${trackCopy.lidarrTrackId}`;
          } else if (trackCopy.id) {
            trackCopy.streamUrl = `http://localhost:8080/api/stream/track/${trackCopy.id}`;
          } else if (trackCopy.audioUrl) {
            trackCopy.streamUrl = trackCopy.audioUrl;
          }
        }
        
        // Add any missing metadata
        if (trackCopy.album) {
          trackCopy.albumName = trackCopy.album.title;
          trackCopy.albumImageUrl = trackCopy.album.coverImageUrl;
        }
        if (trackCopy.artist) {
          trackCopy.artistName = trackCopy.artist.name;
        }
        
        return trackCopy;
      });
      
      // Play the first track with the prepared queue
      console.log('Playing playlist:', playlist.name, 'First track:', tracksQueue[0].title);
      playTrackWithQueue(tracksQueue[0], tracksQueue, 0);
    }
  };

  return (
    <div className="playlist-detail">
      <div className="playlist-header">
        <div className="playlist-cover">
          <img src={playlist.coverImageUrl || 'https://placehold.co/300x300/gray/white?text=No+Image'} alt={playlist.name} />
        </div>
        <div className="playlist-info">
          <span className="playlist-type">PLAYLIST</span>
          <h1>{playlist.name}</h1>
          <p className="playlist-description">{playlist.description || 'No description'}</p>
          <div className="playlist-meta">
            <span className="playlist-owner">By {playlist.ownerUsername}</span>
            <span className="playlist-stats">
              • {playlist.tracks ? playlist.tracks.length : 0} {playlist.tracks && playlist.tracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>
        </div>
      </div>

      <div className="playlist-actions">
        <button className="play-button" onClick={handlePlayPlaylist} disabled={!playlist.tracks || playlist.tracks.length === 0}>
          <BsPlayFill /> Play
        </button>
        <button className="more-button"><FiMoreHorizontal /></button>
      </div>

      <div className="track-list">
        <div className="track-list-header">
          <div className="track-number">#</div>
          <div className="track-title">TITLE</div>
          <div className="track-duration">⏱️</div>
        </div>
        
        <div className="track-list-body">
          {playlist.tracks && playlist.tracks.length > 0 ? (
            playlist.tracks.map((track, index) => (
              <TrackItem 
                key={track.id} 
                track={track} 
                index={index} 
                playlistId={playlist.id}
                allTracks={playlist.tracks}
              />
            ))
          ) : (
            <div className="no-tracks">No tracks in this playlist</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaylistDetail;
