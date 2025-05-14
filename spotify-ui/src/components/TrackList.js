import React, { useState, useContext, useEffect } from 'react';
import '../styles/TrackList.css';
import PlayButton from './PlayButton';
import { AudioPlayerContext } from '../contexts/AudioPlayerContext';
import { trackService, albumService, playlistService } from '../services/api';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import { FiPlus } from 'react-icons/fi';

const TrackList = ({ tracks, albumImage, albumName, artistName }) => {
  // Track request state
  const [requestingTracks, setRequestingTracks] = useState({});
  const [requestMessages, setRequestMessages] = useState({});
  // Playlist dropdown state
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  // Get audio player context
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    playTrackWithQueue,
    formatTime 
  } = useContext(AudioPlayerContext);
  
  // Format milliseconds to minutes:seconds
  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Prepare tracks with streaming URLs
  useEffect(() => {
    if (!tracks || tracks.length === 0) return;
    
    console.log('Tracks data:', tracks);
    
    // Add streaming URLs to tracks if they have IDs
    const tracksWithStreamUrls = tracks.map(track => {
      // Always consider tracks as having files unless explicitly set to false
      // This ensures all tracks have play buttons by default
      const hasFile = track.hasFile === true || track.hasFile === undefined;
      
      // If track already has an audioUrl or streamUrl, use that directly
      if (track.audioUrl || track.streamUrl) {
        return {
          ...track,
          streamUrl: track.streamUrl || track.audioUrl,
          albumImageUrl: albumImage,
          albumName: albumName,
          artistName: track.artistName || artistName,
          hasFile: true // If it has audioUrl/streamUrl, it definitely has a file
        };
      }
      // If track has an ID in our database, generate a streaming URL
      else if (track.id) {
        return {
          ...track,
          streamUrl: `http://localhost:8080/api/stream/track/${track.id}`,
          albumImageUrl: albumImage,
          albumName: albumName,
          artistName: track.artistName || artistName,
          hasFile: true // Force all tracks to have files for demo purposes
        };
      }
      // Track doesn't have an ID but we'll still mark it as playable for demo
      return {
        ...track,
        albumImageUrl: albumImage,
        albumName: albumName,
        artistName: track.artistName || artistName,
        hasFile: true, // Force all tracks to have files for demo purposes
        streamUrl: track.streamUrl || `http://localhost:8080/api/stream/track/${track.id || 1}` // Fallback URL
      };
    });
    
    // Update tracks with stream URLs
    for (let i = 0; i < tracks.length; i++) {
      tracks[i] = { ...tracks[i], ...tracksWithStreamUrls[i] };
    }
    
    console.log('Updated tracks:', tracks);
  }, [tracks, albumImage, albumName, artistName]);
  
  // Handle play button click
  const handlePlayClick = (track, index) => {
    // Check if track can be played (has a file)
    if (!track.hasFile) {
      console.log('This track is not available for streaming');
      return;
    }
    
    // Add streaming URL and metadata if not already present
    if (!track.streamUrl) {
      // If track has audioUrl, use that directly
      if (track.audioUrl) {
        track.streamUrl = track.audioUrl;
      } else if (track.id) {
        // Use the lidarrTrackId for streaming if available, otherwise use the regular id
        const trackIdForStream = track.lidarrTrackId || track.id;
        track.streamUrl = `http://localhost:8080/api/stream/track/${trackIdForStream}`;
      } else {
        console.log('No streaming URL available for this track');
        return;
      }
    }
    
    // Ensure the track has all required metadata
    track.albumName = albumName;
    track.artistName = track.artistName || artistName;
    track.albumImageUrl = albumImage;
    
    console.log('Playing track:', track.title, 'URL:', track.streamUrl);
    
    // Play this track and set the queue to all tracks in the album
    playTrackWithQueue(track, tracks, index);
  };
  
  // Handle adding track to playlist
  const handleAddToPlaylist = (trackId) => {
    setLoadingPlaylists(true);
    
    // Fetch all playlists
    playlistService.getAllPlaylists()
      .then(response => {
        setPlaylists(response.data);
        // Show dropdown for this track
        setShowPlaylistDropdown(prev => ({
          ...prev,
          [trackId]: true
        }));
      })
      .catch(error => {
        console.error('Error fetching playlists:', error);
        alert('Failed to load playlists. Please try again.');
      })
      .finally(() => {
        setLoadingPlaylists(false);
      });
  };
  
  // Add track to selected playlist
  const addTrackToPlaylist = (trackId, playlistId) => {
    if (!trackId || !playlistId) {
      console.error('Missing track ID or playlist ID');
      return;
    }
    
    playlistService.addTrackToPlaylist(playlistId, trackId)
      .then(() => {
        // Hide dropdown
        setShowPlaylistDropdown({});
        alert('Track added to playlist successfully!');
      })
      .catch(error => {
        console.error('Error adding track to playlist:', error);
        alert('Failed to add track to playlist. Please try again.');
      });
  };
  
  // Handle request track download
  const handleRequestTrack = (track) => {
    if (!track.lidarrTrackId && !track.foreignTrackId) {
      console.log('Cannot request this track - missing track ID');
      return;
    }
    
    // Set requesting state for this track
    setRequestingTracks(prev => ({
      ...prev,
      [track.id || track.lidarrTrackId || track.foreignTrackId]: true
    }));
    
    // Clear any previous message
    setRequestMessages(prev => ({
      ...prev,
      [track.id || track.lidarrTrackId || track.foreignTrackId]: null
    }));
    
    // Use the album service to request the track download
    // We'll use the album download endpoint since there's no specific track download endpoint
    const artistId = track.artistId || track.artist?.id;
    const albumId = track.albumId || track.album?.id;
    
    if (!artistId || !albumId) {
      setRequestMessages(prev => ({
        ...prev,
        [track.id || track.lidarrTrackId || track.foreignTrackId]: {
          type: 'error',
          text: 'Missing artist or album information'
        }
      }));
      setRequestingTracks(prev => ({
        ...prev,
        [track.id || track.lidarrTrackId || track.foreignTrackId]: false
      }));
      return;
    }
    
    albumService.requestAlbumDownload(parseInt(artistId), parseInt(albumId))
      .then(response => {
        console.log('Download request response:', response);
        setRequestMessages(prev => ({
          ...prev,
          [track.id || track.lidarrTrackId || track.foreignTrackId]: {
            type: 'success',
            text: 'Track download requested!'
          }
        }));
      })
      .catch(error => {
        console.error('Error requesting track download:', error);
        setRequestMessages(prev => ({
          ...prev,
          [track.id || track.lidarrTrackId || track.foreignTrackId]: {
            type: 'error',
            text: 'Request failed. Try again.'
          }
        }));
      })
      .finally(() => {
        setRequestingTracks(prev => ({
          ...prev,
          [track.id || track.lidarrTrackId || track.foreignTrackId]: false
        }));
      });
  };

  return (
    <div className="track-list">
      <div className="track-list-header">
        <div className="track-number">#</div>
        <div className="track-title">Title</div>
        <div className="track-duration">
          <i className="far fa-clock"></i>
        </div>
      </div>
      
      <div className="track-list-body">
        {tracks.map((track, index) => {
          const trackId = track.id || track.foreignTrackId || index;
          const isCurrentlyPlaying = currentTrack && isPlaying && currentTrack.id === trackId;
          const hasFile = track.hasFile;
          const isRequesting = requestingTracks[trackId];
          const requestMessage = requestMessages[trackId];
          
          // Track has file status logged only in debug mode
          // console.log(`Track ${trackId} hasFile:`, hasFile);
          return (
            <div key={trackId} className={`track-item ${isCurrentlyPlaying ? 'playing' : ''}`}>
              <div className="track-number">
                <span className="track-index">{!isCurrentlyPlaying && (index + 1)}</span>
                <button 
                  className="track-play-button" 
                  onClick={() => handlePlayClick(track, index)}
                >
                  {isCurrentlyPlaying ? <BsPauseFill size={32} /> : <BsPlayFill size={32} />}
                </button>
              </div>
              
              <div className="track-title">
                <div className={`track-name ${!hasFile ? 'locked' : ''}`}>{track.title || track.trackName}</div>
                <div className="track-artist">{track.artistName || artistName}</div>
              </div>
              
              <div className="track-actions">
                {!hasFile && (
                  <button 
                    className={`track-request-button ${isRequesting ? 'loading' : ''} ${requestMessage ? requestMessage.type : ''}`}
                    onClick={() => handleRequestTrack(track)}
                    disabled={isRequesting}
                  >
                    {isRequesting ? (
                      <span className="spinner"></span>
                    ) : requestMessage ? (
                      requestMessage.text
                    ) : (
                      <>
                        <i className="fas fa-download"></i>
                        <span>Request</span>
                      </>
                    )}
                  </button>
                )}
                <button className="track-like">
                  <i className="far fa-heart"></i>
                </button>
                <div className="track-duration">{formatDuration(track.duration)}</div>
                <div className="track-playlist-actions">
                  <button 
                    className="track-add-to-playlist" 
                    onClick={() => handleAddToPlaylist(trackId)}
                    title="Add to playlist"
                  >
                    <FiPlus />
                  </button>
                  {showPlaylistDropdown[trackId] && (
                    <div className="playlist-dropdown">
                      <div className="dropdown-header">
                        <span>Add to playlist</span>
                        <button onClick={() => setShowPlaylistDropdown(prev => ({ ...prev, [trackId]: false }))}>×</button>
                      </div>
                      {loadingPlaylists ? (
                        <div className="loading-playlists">Loading...</div>
                      ) : (
                        <ul>
                          {playlists.length === 0 ? (
                            <li className="no-playlists">No playlists found</li>
                          ) : (
                            playlists.map(playlist => (
                              <li 
                                key={playlist.id} 
                                onClick={() => addTrackToPlaylist(track.id, playlist.id)}
                              >
                                {playlist.name}
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <button className="track-more">
                  <i className="fas fa-ellipsis-h"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackList;
